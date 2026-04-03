"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pglite_1 = require("@electric-sql/pglite");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    logger = new common_1.Logger(DatabaseService_1.name);
    driver = this.resolveDriver();
    dataDir = process.env.ROSDOM_DATA_DIR
        ? (0, node_path_1.join)(process.cwd(), process.env.ROSDOM_DATA_DIR)
        : (0, node_path_1.join)(process.cwd(), '.data', 'pglite');
    migrationsDir = (0, node_path_1.join)(process.cwd(), 'database', 'migrations');
    migrationsTable = 'schema_migrations';
    db;
    pool;
    initPromise = null;
    constructor() {
        if (this.driver === 'postgres') {
            this.pool = new pg_1.Pool(this.buildPoolOptions());
            this.db = null;
        }
        else {
            (0, node_fs_1.mkdirSync)(this.dataDir, { recursive: true });
            this.db = new pglite_1.PGlite(this.dataDir);
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
    async query(sql, params = [], executor) {
        await this.ensureReady();
        const runner = executor ?? this.getDefaultExecutor();
        const result = await runner.query(sql, params);
        return result.rows;
    }
    async one(sql, params = [], executor) {
        const rows = await this.query(sql, params, executor);
        return rows[0] ?? null;
    }
    async execute(sql, params = [], executor) {
        await this.ensureReady();
        const runner = executor ?? this.getDefaultExecutor();
        await runner.query(sql, params);
    }
    async transaction(callback) {
        await this.ensureReady();
        if (this.pool) {
            const client = await this.pool.connect();
            try {
                await client.query('begin');
                const result = await callback(client);
                await client.query('commit');
                return result;
            }
            catch (error) {
                await client.query('rollback');
                throw error;
            }
            finally {
                client.release();
            }
        }
        const db = this.requirePGlite();
        await db.query('begin');
        try {
            const result = await callback(db);
            await db.query('commit');
            return result;
        }
        catch (error) {
            await db.query('rollback');
            throw error;
        }
    }
    async initialize() {
        this.logger.log(`Database driver: ${this.driver}`);
        await this.runStatement(`create table if not exists ${this.migrationsTable} (
        version text primary key,
        applied_at timestamptz not null default now()
      )`);
        const applied = new Set((await this.runQuery(`select version from ${this.migrationsTable} order by version`)).map((row) => row.version));
        const migrationFiles = (0, node_fs_1.readdirSync)(this.migrationsDir)
            .filter((fileName) => fileName.endsWith('.sql'))
            .sort();
        for (const migrationFile of migrationFiles) {
            if (applied.has(migrationFile)) {
                continue;
            }
            const sql = (0, node_fs_1.readFileSync)((0, node_path_1.join)(this.migrationsDir, migrationFile), 'utf8')
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
                    await client.query(`insert into ${this.migrationsTable} (version) values ($1)`, [migrationFile]);
                    await client.query('commit');
                }
                catch (error) {
                    await client.query('rollback');
                    throw error;
                }
                finally {
                    client.release();
                }
            }
            else {
                const db = this.requirePGlite();
                await db.query('begin');
                try {
                    await db.exec(sql);
                    await db.query(`insert into ${this.migrationsTable} (version) values ($1)`, [migrationFile]);
                    await db.query('commit');
                }
                catch (error) {
                    await db.query('rollback');
                    throw error;
                }
            }
        }
    }
    resolveDriver() {
        const explicit = process.env.ROSDOM_DB_DRIVER?.trim().toLowerCase();
        if (explicit === 'postgres' || explicit === 'pglite') {
            return explicit;
        }
        return process.env.DATABASE_URL || process.env.POSTGRES_HOST
            ? 'postgres'
            : 'pglite';
    }
    buildPoolOptions() {
        if (process.env.DATABASE_URL) {
            return {
                connectionString: process.env.DATABASE_URL,
                max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
                idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS ?? 30_000),
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
    resolveSsl() {
        const sslMode = process.env.POSTGRES_SSL_MODE?.trim().toLowerCase();
        if (!sslMode || sslMode === 'disable') {
            return undefined;
        }
        return {
            rejectUnauthorized: sslMode !== 'require_insecure',
        };
    }
    async runQuery(sql, params = []) {
        const runner = this.getDefaultExecutor();
        const result = await runner.query(sql, params);
        return result.rows;
    }
    async runStatement(sql, params = []) {
        const runner = this.getDefaultExecutor();
        await runner.query(sql, params);
    }
    getDefaultExecutor() {
        if (this.pool) {
            return this.pool;
        }
        return this.requirePGlite();
    }
    requirePGlite() {
        if (!this.db) {
            throw new Error('PGlite database is not initialized');
        }
        return this.db;
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DatabaseService);
//# sourceMappingURL=database.service.js.map