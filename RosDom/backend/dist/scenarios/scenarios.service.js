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
exports.ScenariosService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const http_errors_1 = require("../common/http/http-errors");
const id_1 = require("../common/platform/id");
function nowIso() {
    return new Date().toISOString();
}
let ScenariosService = class ScenariosService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list(user, homeId) {
        await this.assertHomeAccess(user.id, homeId);
        const rows = await this.db.query(`select id, home_id, title, description, icon_key, enabled, execution_mode, updated_at
       from scenarios
       where home_id = $1
       order by updated_at desc, created_at desc`, [homeId]);
        return rows.map((row) => this.toScenario(row));
    }
    async create(user, dto) {
        await this.assertHomeAccess(user.id, dto.homeId);
        const id = (0, id_1.uuidv7)();
        const updatedAt = nowIso();
        await this.db.execute(`insert into scenarios (
        id, home_id, title, description, icon_key, enabled, execution_mode, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, true, $6, $7, $7)`, [
            id,
            dto.homeId,
            dto.title,
            dto.description,
            dto.iconKey,
            dto.executionMode,
            updatedAt,
        ]);
        await this.writeEvent(dto.homeId, user.id, 'automation.run.updated', {
            scenarioId: id,
            state: 'created',
        });
        const created = await this.getScenarioRow(id);
        return this.toScenario(created);
    }
    async update(user, scenarioId, dto) {
        const current = await this.getScenarioRow(scenarioId);
        await this.assertHomeAccess(user.id, current.home_id);
        const updatedAt = nowIso();
        const next = {
            title: dto.title ?? current.title,
            description: dto.description ?? current.description,
            iconKey: dto.iconKey ?? current.icon_key,
            enabled: dto.enabled ?? current.enabled,
            executionMode: dto.executionMode ?? current.execution_mode,
        };
        await this.db.execute(`update scenarios
       set title = $2,
           description = $3,
           icon_key = $4,
           enabled = $5,
           execution_mode = $6,
           updated_at = $7
       where id = $1`, [
            scenarioId,
            next.title,
            next.description,
            next.iconKey,
            next.enabled,
            next.executionMode,
            updatedAt,
        ]);
        await this.writeEvent(current.home_id, user.id, 'automation.run.updated', {
            scenarioId,
            state: 'updated',
        });
        const updated = await this.getScenarioRow(scenarioId);
        return this.toScenario(updated);
    }
    async run(user, scenarioId) {
        const scenario = await this.getScenarioRow(scenarioId);
        await this.assertHomeAccess(user.id, scenario.home_id);
        const runId = (0, id_1.uuidv7)();
        const startedAt = nowIso();
        await this.db.execute(`insert into automation_runs (
        id, scenario_id, home_id, status, started_at, finished_at
      ) values ($1, $2, $3, 'queued', $4, null)`, [runId, scenarioId, scenario.home_id, startedAt]);
        await this.writeEvent(scenario.home_id, user.id, 'automation.run.updated', {
            scenarioId,
            runId,
            status: 'queued',
        });
        return {
            runId,
            scenarioId,
            status: 'queued',
            executedAt: startedAt,
        };
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
    async getScenarioRow(scenarioId) {
        const row = await this.db.one(`select id, home_id, title, description, icon_key, enabled, execution_mode, updated_at
       from scenarios
       where id = $1`, [scenarioId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('scenario_not_found', 'Scenario was not found');
        }
        return row;
    }
    async writeEvent(homeId, userId, topic, payload) {
        await this.db.execute(`insert into events (
        id, home_id, user_id, topic, severity, payload, created_at
      ) values ($1, $2, $3, $4, 'info', $5::jsonb, $6)`, [(0, id_1.uuidv7)(), homeId, userId, topic, JSON.stringify(payload), nowIso()]);
    }
    toScenario(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            title: row.title,
            description: row.description,
            iconKey: row.icon_key,
            enabled: row.enabled,
            executionMode: row.execution_mode,
            updatedAt: row.updated_at,
        };
    }
};
exports.ScenariosService = ScenariosService;
exports.ScenariosService = ScenariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ScenariosService);
//# sourceMappingURL=scenarios.service.js.map