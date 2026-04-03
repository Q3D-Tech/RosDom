import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
type QueryRow = Record<string, unknown>;
export interface DatabaseExecutor {
    query<T extends QueryRow = QueryRow>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
}
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly driver;
    private readonly dataDir;
    private readonly migrationsDir;
    private readonly migrationsTable;
    private readonly db;
    private readonly pool;
    private initPromise;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    ensureReady(): Promise<void>;
    query<T extends QueryRow = QueryRow>(sql: string, params?: unknown[], executor?: DatabaseExecutor): Promise<T[]>;
    one<T extends QueryRow = QueryRow>(sql: string, params?: unknown[], executor?: DatabaseExecutor): Promise<T | null>;
    execute(sql: string, params?: unknown[], executor?: DatabaseExecutor): Promise<void>;
    transaction<T>(callback: (executor: DatabaseExecutor) => Promise<T>): Promise<T>;
    private initialize;
    private resolveDriver;
    private buildPoolOptions;
    private resolveSsl;
    private runQuery;
    private runStatement;
    private getDefaultExecutor;
    private requirePGlite;
}
export {};
