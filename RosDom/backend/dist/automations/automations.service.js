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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const http_errors_1 = require("../common/http/http-errors");
let AutomationsService = class AutomationsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listRuns(user, homeId) {
        await this.assertHomeAccess(user.id, homeId);
        const rows = await this.db.query(`select id, scenario_id, home_id, status, started_at, finished_at
       from automation_runs
       where home_id = $1
       order by started_at desc
       limit 100`, [homeId]);
        return rows.map((row) => ({
            id: row.id,
            scenarioId: row.scenario_id,
            homeId: row.home_id,
            status: row.status,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
        }));
    }
    async assertHomeAccess(userId, homeId) {
        const member = await this.db.one(`select h.id
       from homes h
       left join home_members hm
         on hm.home_id = h.id
        and hm.user_id = $1
        and hm.status = 'active'
       where h.id = $2
         and (h.owner_user_id = $1 or hm.id is not null)`, [userId, homeId]);
        if (!member) {
            throw (0, http_errors_1.forbidden)('home_access_denied', 'You do not have access to this home');
        }
    }
};
exports.AutomationsService = AutomationsService;
exports.AutomationsService = AutomationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AutomationsService);
//# sourceMappingURL=automations.service.js.map