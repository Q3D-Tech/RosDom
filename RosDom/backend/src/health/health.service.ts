import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      name: 'РосДом Backend',
      status: 'ok',
      runtimeMode: process.env.ROSDOM_RUNTIME_MODE ?? 'real',
      processRole: process.env.ROSDOM_PROCESS_ROLE ?? 'api',
      dbDriver:
        process.env.ROSDOM_DB_DRIVER ??
        (process.env.DATABASE_URL || process.env.POSTGRES_HOST
          ? 'postgres'
          : 'pglite'),
      serverTime: new Date().toISOString(),
    };
  }
}
