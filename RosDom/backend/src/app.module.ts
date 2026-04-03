import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HomesModule } from './homes/homes.module';
import { RoomsModule } from './rooms/rooms.module';
import { LayoutsModule } from './layouts/layouts.module';
import { DevicesModule } from './devices/devices.module';
import { PairingModule } from './pairing/pairing.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { AutomationsModule } from './automations/automations.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuditModule } from './audit/audit.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';
import { AuthGuard } from './common/auth/auth.guard';
import { DatabaseModule } from './database/database.module';
import { PlatformModule } from './platform/platform.module';
import { FamiliesModule } from './families/families.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.register({
      global: true,
    }),
    DatabaseModule,
    PlatformModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    HomesModule,
    RoomsModule,
    LayoutsModule,
    DevicesModule,
    FamiliesModule,
    TasksModule,
    PairingModule,
    ScenariosModule,
    AutomationsModule,
    EventsModule,
    NotificationsModule,
    IntegrationsModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
