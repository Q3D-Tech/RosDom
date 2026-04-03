"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const homes_module_1 = require("./homes/homes.module");
const rooms_module_1 = require("./rooms/rooms.module");
const layouts_module_1 = require("./layouts/layouts.module");
const devices_module_1 = require("./devices/devices.module");
const pairing_module_1 = require("./pairing/pairing.module");
const scenarios_module_1 = require("./scenarios/scenarios.module");
const automations_module_1 = require("./automations/automations.module");
const events_module_1 = require("./events/events.module");
const notifications_module_1 = require("./notifications/notifications.module");
const integrations_module_1 = require("./integrations/integrations.module");
const audit_module_1 = require("./audit/audit.module");
const realtime_module_1 = require("./realtime/realtime.module");
const health_module_1 = require("./health/health.module");
const auth_guard_1 = require("./common/auth/auth.guard");
const database_module_1 = require("./database/database.module");
const platform_module_1 = require("./platform/platform.module");
const families_module_1 = require("./families/families.module");
const tasks_module_1 = require("./tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            jwt_1.JwtModule.register({
                global: true,
            }),
            database_module_1.DatabaseModule,
            platform_module_1.PlatformModule,
            realtime_module_1.RealtimeModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            homes_module_1.HomesModule,
            rooms_module_1.RoomsModule,
            layouts_module_1.LayoutsModule,
            devices_module_1.DevicesModule,
            families_module_1.FamiliesModule,
            tasks_module_1.TasksModule,
            pairing_module_1.PairingModule,
            scenarios_module_1.ScenariosModule,
            automations_module_1.AutomationsModule,
            events_module_1.EventsModule,
            notifications_module_1.NotificationsModule,
            integrations_module_1.IntegrationsModule,
            audit_module_1.AuditModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map