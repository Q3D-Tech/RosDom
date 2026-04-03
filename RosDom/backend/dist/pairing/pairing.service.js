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
exports.PairingService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const database_service_1 = require("../database/database.service");
const http_errors_1 = require("../common/http/http-errors");
const id_1 = require("../common/platform/id");
function nowIso() {
    return new Date().toISOString();
}
let PairingService = class PairingService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createPairingSession(user, dto) {
        await this.assertHomeAccess(user.id, dto.homeId);
        const id = (0, id_1.uuidv7)();
        const createdAt = nowIso();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        await this.db.execute(`insert into pairing_sessions (
        id, public_token, home_id, actor_user_id, device_type, discovery_method,
        status, expires_at, completed_at, selected_candidate_id, candidate_list_hash, candidates, created_at
      ) values ($1, $2, $3, $4, $5, $6, 'created', $7, null, null, null, '[]'::jsonb, $8)`, [
            id,
            (0, node_crypto_1.randomBytes)(16).toString('hex'),
            dto.homeId,
            user.id,
            dto.deviceType,
            dto.discoveryMethod,
            expiresAt,
            createdAt,
        ]);
        return this.getPairingSession(user, id);
    }
    async getPairingSession(user, pairingSessionId) {
        const row = await this.getPairingSessionRow(pairingSessionId);
        await this.assertHomeAccess(user.id, row.home_id);
        return this.toPairingSession(row);
    }
    async discover(user, pairingSessionId) {
        const row = await this.getPairingSessionRow(pairingSessionId);
        await this.assertHomeAccess(user.id, row.home_id);
        throw (0, http_errors_1.badRequest)('pairing_adapter_not_configured', 'Обнаружение устройств на этом сервере ещё не подключено. Для pairing нужен реальный Matter/LAN/bridge адаптер.');
    }
    async selectCandidate(user, pairingSessionId, dto) {
        const row = await this.getPairingSessionRow(pairingSessionId);
        await this.assertHomeAccess(user.id, row.home_id);
        const candidates = this.parseCandidates(row.candidates);
        const candidate = candidates.find((item) => item.id === dto.candidateId);
        if (!candidate) {
            throw (0, http_errors_1.notFound)('candidate_not_found', 'Pairing candidate was not found');
        }
        await this.db.execute(`update pairing_sessions
       set status = 'candidate_selected',
           selected_candidate_id = $2
       where id = $1`, [pairingSessionId, candidate.id]);
        const updated = await this.getPairingSessionRow(pairingSessionId);
        return this.toPairingSession(updated);
    }
    async complete(user, pairingSessionId) {
        const row = await this.getPairingSessionRow(pairingSessionId);
        await this.assertHomeAccess(user.id, row.home_id);
        if (!row.selected_candidate_id) {
            throw (0, http_errors_1.conflict)('candidate_missing', 'Select a discovered candidate before completing pairing');
        }
        throw (0, http_errors_1.badRequest)('pairing_completion_requires_adapter', 'Server-side pairing completion requires a configured bridge or provider adapter. Пока можно сохранить сессию и завершить настройку после подключения реального адаптера.');
    }
    async cancel(user, pairingSessionId) {
        const row = await this.getPairingSessionRow(pairingSessionId);
        await this.assertHomeAccess(user.id, row.home_id);
        await this.db.execute(`update pairing_sessions
       set status = 'cancelled'
       where id = $1`, [pairingSessionId]);
        const updated = await this.getPairingSessionRow(pairingSessionId);
        return this.toPairingSession(updated);
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
    async getPairingSessionRow(pairingSessionId) {
        const row = await this.db.one(`select
         id,
         public_token,
         home_id,
         actor_user_id,
         device_type,
         discovery_method,
         status,
         expires_at,
         created_at,
         completed_at,
         selected_candidate_id,
         candidate_list_hash,
         candidates
       from pairing_sessions
       where id = $1`, [pairingSessionId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('pairing_session_not_found', 'Pairing session was not found');
        }
        return row;
    }
    toPairingSession(row) {
        return {
            id: row.id,
            publicToken: row.public_token,
            homeId: row.home_id,
            actorUserId: row.actor_user_id,
            deviceType: row.device_type,
            discoveryMethod: row.discovery_method,
            status: row.status,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            completedAt: row.completed_at,
            selectedCandidateId: row.selected_candidate_id,
            candidateListHash: row.candidate_list_hash,
            candidates: this.parseCandidates(row.candidates),
        };
    }
    parseCandidates(raw) {
        if (Array.isArray(raw)) {
            return raw;
        }
        if (typeof raw === 'string' && raw.trim()) {
            return JSON.parse(raw);
        }
        return [];
    }
};
exports.PairingService = PairingService;
exports.PairingService = PairingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PairingService);
//# sourceMappingURL=pairing.service.js.map