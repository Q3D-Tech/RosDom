import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import type { PGliteInterface } from '@electric-sql/pglite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

type QueryRow = Record<string, unknown>;

export interface DatabaseExecutor {
  query<T extends QueryRow = QueryRow>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}

type DatabaseDriver = 'postgres' | 'pglite';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly driver: DatabaseDriver = this.resolveDriver();
  private readonly dataDir = process.env.ROSDOM_DATA_DIR
    ? join(process.cwd(), process.env.ROSDOM_DATA_DIR)
    : join(process.cwd(), '.data', 'pglite');
  private readonly migrationsDir = join(
    process.cwd(),
    'database',
    'migrations',
  );
  private readonly migrationsTable = 'schema_migrations';
  private readonly db: PGlite | null;
  private readonly pool: Pool | null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (this.driver === 'postgres') {
      this.pool = new Pool(this.buildPoolOptions());
      this.db = null;
    } else {
      mkdirSync(this.dataDir, { recursive: true });
      this.db = new PGlite(this.dataDir);
      this.pool = null;
    }
  }

  async onModuleInit() {
    await this.ensureReady();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
    if (this.db) {
      await this.db.close();
    }
  }

  async ensureReady() {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
  }

  async query<T extends QueryRow = QueryRow>(
    sql: string,
    params: unknown[] = [],
    executor?: DatabaseExecutor,
  ): Promise<T[]> {
    await this.ensureReady();
    const runner = executor ?? this.getDefaultExecutor();
    const result = await runner.query<T>(sql, params);
    return result.rows;
  }

  async one<T extends QueryRow = QueryRow>(
    sql: string,
    params: unknown[] = [],
    executor?: DatabaseExecutor,
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params, executor);
    return rows[0] ?? null;
  }

  async execute(
    sql: string,
    params: unknown[] = [],
    executor?: DatabaseExecutor,
  ) {
    await this.ensureReady();
    const runner = executor ?? this.getDefaultExecutor();
    await runner.query(sql, params);
  }

  async transaction<T>(callback: (executor: DatabaseExecutor) => Promise<T>) {
    await this.ensureReady();

    if (this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('begin');
        const result = await callback(client);
        await client.query('commit');
        return result;
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    }

    const db = this.requirePGlite();
    await db.query('begin');
    try {
      const result = await callback(db as DatabaseExecutor);
      await db.query('commit');
      return result;
    } catch (error) {
      await db.query('rollback');
      throw error;
    }
  }

  private async initialize() {
    this.logger.log(`Database driver: ${this.driver}`);

    await this.runStatement(
      `create table if not exists ${this.migrationsTable} (
        version text primary key,
        applied_at timestamptz not null default now()
      )`,
    );

    const applied = new Set(
      (
        await this.runQuery<{ version: string }>(
          `select version from ${this.migrationsTable} order by version`,
        )
      ).map((row) => row.version),
    );

    const migrationFiles = readdirSync(this.migrationsDir)
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    for (const migrationFile of migrationFiles) {
      if (applied.has(migrationFile)) {
        continue;
      }

      const sql = readFileSync(join(this.migrationsDir, migrationFile), 'utf8')
        .replace(/create extension if not exists pgcrypto;\s*/gi, '')
        .trim();

      if (!sql) {
        continue;
      }

      this.logger.log(`Applying migration ${migrationFile}`);

      if (this.pool) {
        const client = await this.pool.connect();
        try {
          await client.query('begin');
          await client.query(sql);
          await client.query(
            `insert into ${this.migrationsTable} (version) values ($1)`,
            [migrationFile],
          );
          await client.query('commit');
        } catch (error) {
          await client.query('rollback');
          throw error;
        } finally {
          client.release();
        }
      } else {
        const db = this.requirePGlite();
        await db.query('begin');
        try {
          await db.exec(sql);
          await db.query(
            `insert into ${this.migrationsTable} (version) values ($1)`,
            [migrationFile],
          );
          await db.query('commit');
        } catch (error) {
          await db.query('rollback');
          throw error;
        }
      }
    }
  }

  private resolveDriver(): DatabaseDriver {
    const explicit = process.env.ROSDOM_DB_DRIVER?.trim().toLowerCase();
    if (explicit === 'postgres' || explicit === 'pglite') {
      return explicit;
    }

    return process.env.DATABASE_URL || process.env.POSTGRES_HOST
      ? 'postgres'
      : 'pglite';
  }

  private buildPoolOptions() {
    if (process.env.DATABASE_URL) {
      return {
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
        idleTimeoutMillis: Number(
          process.env.POSTGRES_IDLE_TIMEOUT_MS ?? 30_000,
        ),
        ssl: this.resolveSsl(),
      };
    }

    return {
      host: process.env.POSTGRES_HOST ?? '127.0.0.1',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'rosdom',
      user: process.env.POSTGRES_USER ?? 'rosdom',
      password: process.env.POSTGRES_PASSWORD ?? 'rosdom',
      max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS ?? 30_000),
      ssl: this.resolveSsl(),
    };
  }

  private resolveSsl() {
    const sslMode = process.env.POSTGRES_SSL_MODE?.trim().toLowerCase();
    if (!sslMode || sslMode === 'disable') {
      return undefined;
    }

    return {
      rejectUnauthorized: sslMode !== 'require_insecure',
    };
  }

  private async runQuery<T extends QueryRow = QueryRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const runner = this.getDefaultExecutor();
    const result = await runner.query<T>(sql, params);
    return result.rows;
  }

  private async runStatement(sql: string, params: unknown[] = []) {
    const runner = this.getDefaultExecutor();
    await runner.query(sql, params);
  }

  private getDefaultExecutor(): DatabaseExecutor {
    if (this.pool) {
      return this.pool;
    }
    return this.requirePGlite() as DatabaseExecutor;
  }

  private requirePGlite(): PGliteInterface {
    if (!this.db) {
      throw new Error('PGlite database is not initialized');
    }
    return this.db;
  }
}
