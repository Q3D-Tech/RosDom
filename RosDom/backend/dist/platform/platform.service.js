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
var PlatformService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const argon2_1 = require("@node-rs/argon2");
const database_service_1 = require("../database/database.service");
const realtime_service_1 = require("../realtime/realtime.service");
const http_errors_1 = require("../common/http/http-errors");
const account_mode_1 = require("../common/platform/account-mode");
const id_1 = require("../common/platform/id");
const integration_credentials_service_1 = require("./integration-credentials.service");
const tuya_open_api_client_1 = require("./tuya-open-api.client");
function nowIso() {
    return new Date().toISOString();
}
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
function normalizeIdentifier(identifier, type) {
    const trimmed = identifier.trim();
    return type === 'email'
        ? trimmed.toLowerCase()
        : trimmed.replace(/[\s\-()]/g, '');
}
function generateInviteCode() {
    return (0, node_crypto_1.randomBytes)(4).toString('hex').toUpperCase();
}
function generateLinkUserCode() {
    return (0, node_crypto_1.randomBytes)(3).toString('hex').toUpperCase();
}
function normalizeCountryCode(value) {
    const digits = value?.replace(/\D/g, '') ?? '';
    return digits.length > 0 ? digits : '7';
}
function maskLoginIdentifier(value) {
    const trimmed = value.trim();
    if (trimmed.length <= 4) {
        return '***';
    }
    const atIndex = trimmed.indexOf('@');
    if (atIndex > 1) {
        const local = trimmed.slice(0, atIndex);
        const domain = trimmed.slice(atIndex);
        return `${local.slice(0, 2)}***${domain}`;
    }
    return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}
function parseRecord(value) {
    if (!value) {
        return {};
    }
    if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null
            ? parsed
            : {};
    }
    return value;
}
function parseStringArray(value) {
    if (!value) {
        return [];
    }
    const raw = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(raw)
        ? raw.filter((item) => typeof item === 'string')
        : [];
}
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
function intersects(a, b) {
    return (a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y);
}
let PlatformService = PlatformService_1 = class PlatformService {
    db;
    jwtService;
    configService;
    realtimeService;
    integrationCredentialsService;
    tuyaOpenApiClient;
    logger = new common_1.Logger(PlatformService_1.name);
    constructor(db, jwtService, configService, realtimeService, integrationCredentialsService, tuyaOpenApiClient) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
        this.realtimeService = realtimeService;
        this.integrationCredentialsService = integrationCredentialsService;
        this.tuyaOpenApiClient = tuyaOpenApiClient;
    }
    async register(dto) {
        const identifier = normalizeIdentifier(dto.loginIdentifier, dto.identifierType);
        if (dto.identifierType === 'email' && !identifier.includes('@')) {
            throw (0, http_errors_1.badRequest)('identifier_invalid', 'Email identifier is invalid');
        }
        const existing = await this.db.one('select id from users where login_identifier = $1', [identifier]);
        if (existing) {
            throw (0, http_errors_1.conflict)('identifier_exists', 'Account with this identifier already exists');
        }
        const accountMode = (0, account_mode_1.resolveAccountMode)(dto.birthYear);
        if (accountMode === 'child' && !dto.familyInviteCode) {
            throw (0, http_errors_1.conflict)('family_invite_required', 'Child account must be created with a family invite code');
        }
        const passwordHash = await (0, argon2_1.hash)(dto.password, {
            algorithm: 2,
        });
        const currentTime = nowIso();
        const userId = (0, id_1.uuidv7)();
        const familyInvite = dto.familyInviteCode
            ? await this.getInviteByCode(dto.familyInviteCode)
            : null;
        const sessionPayload = await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into users (
          id, email, login_identifier, identifier_type, display_name, birth_year,
          account_mode, locale, created_at, updated_at
        ) values ($1, $2, $3, $4, $5, $6, $7, 'ru-RU', $8, $8)`, [
                userId,
                dto.identifierType === 'email' ? identifier : null,
                identifier,
                dto.identifierType,
                dto.name,
                dto.birthYear,
                accountMode,
                currentTime,
            ], tx);
            await this.db.execute(`insert into user_credentials (user_id, password_hash, created_at, updated_at)
         values ($1, $2, $3, $3)`, [userId, passwordHash, currentTime], tx);
            if (familyInvite) {
                await this.attachUserToFamily(userId, familyInvite, tx);
            }
            return this.createSession(userId, dto.deviceName, tx);
        });
        return {
            ...sessionPayload,
            user: await this.getUser(userId),
        };
    }
    async login(dto) {
        const identifier = dto.loginIdentifier.includes('@')
            ? normalizeIdentifier(dto.loginIdentifier, 'email')
            : normalizeIdentifier(dto.loginIdentifier, 'phone');
        const user = await this.db.one(`select u.id, uc.password_hash
       from users u
       join user_credentials uc on uc.user_id = u.id
       where u.login_identifier = $1`, [identifier]);
        if (!user) {
            throw (0, http_errors_1.unauthorized)('invalid_credentials', 'Identifier or password is incorrect');
        }
        const matches = await (0, argon2_1.verify)(user.password_hash, dto.password);
        if (!matches) {
            throw (0, http_errors_1.unauthorized)('invalid_credentials', 'Identifier or password is incorrect');
        }
        const sessionPayload = await this.db.transaction((tx) => this.createSession(user.id, dto.deviceName, tx));
        return {
            ...sessionPayload,
            user: await this.getUser(user.id),
        };
    }
    async refresh(dto) {
        const tokenHash = hashToken(dto.refreshToken);
        const existing = await this.db.one(`select rt.session_id, us.user_id, us.expires_at, us.revoked_at
       from refresh_tokens rt
       join user_sessions us on us.id = rt.session_id
       where rt.token_hash = $1 and rt.revoked_at is null
       order by rt.issued_at desc
       limit 1`, [tokenHash]);
        if (!existing || existing.revoked_at) {
            throw (0, http_errors_1.unauthorized)('invalid_refresh_token', 'Refresh token is invalid');
        }
        const rotatedToken = (0, node_crypto_1.randomBytes)(24).toString('hex');
        const rotatedHash = hashToken(rotatedToken);
        const issuedAt = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute('update refresh_tokens set rotated_at = $2, revoked_at = $2 where token_hash = $1', [tokenHash, issuedAt], tx);
            await this.db.execute(`insert into refresh_tokens (
          id, session_id, token_hash, issued_at
        ) values ($1, $2, $3, $4)`, [(0, id_1.uuidv7)(), existing.session_id, rotatedHash, issuedAt], tx);
        });
        return {
            accessToken: this.signAccessToken(existing.user_id, existing.session_id),
            refreshToken: rotatedToken,
            sessionId: existing.session_id,
            expiresAt: existing.expires_at,
            user: await this.getUser(existing.user_id),
        };
    }
    async logout(sessionId) {
        const currentTime = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute('update user_sessions set revoked_at = $2 where id = $1', [sessionId, currentTime], tx);
            await this.db.execute('update refresh_tokens set revoked_at = $2 where session_id = $1 and revoked_at is null', [sessionId, currentTime], tx);
        });
    }
    async authenticateSession(sessionId, userId) {
        const session = await this.db.one('select id, user_id, revoked_at, expires_at from user_sessions where id = $1', [sessionId]);
        if (!session || session.user_id !== userId || session.revoked_at) {
            throw (0, http_errors_1.unauthorized)('session_invalid', 'Session is no longer active');
        }
        if (new Date(session.expires_at).getTime() <= Date.now()) {
            throw (0, http_errors_1.unauthorized)('session_expired', 'Session has expired');
        }
        const user = await this.getUser(userId);
        return {
            id: user.id,
            email: user.email,
            loginIdentifier: user.loginIdentifier,
            identifierType: user.identifierType,
            displayName: user.displayName,
            accountMode: user.accountMode,
            sessionId: session.id,
        };
    }
    async getUser(userId) {
        const row = await this.db.one(`select id, email, login_identifier, identifier_type, display_name, birth_year,
              account_mode, locale, created_at, updated_at
       from users where id = $1`, [userId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('user_not_found', 'User was not found');
        }
        return {
            id: row.id,
            email: row.email,
            loginIdentifier: row.login_identifier,
            identifierType: row.identifier_type,
            displayName: row.display_name,
            birthYear: row.birth_year,
            accountMode: row.account_mode,
            locale: row.locale,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async updateProfile(userId, dto) {
        await this.db.execute(`update users
       set display_name = coalesce($2, display_name),
           locale = coalesce($3, locale),
           updated_at = $4
       where id = $1`, [userId, dto.displayName ?? null, dto.locale ?? null, nowIso()]);
        return this.getUser(userId);
    }
    async getUserPreferences(userId) {
        const existing = await this.db.one(`select user_id, favorite_device_ids, allowed_device_ids, pinned_sections,
              preferred_home_tab, ui_density, theme_mode, motion_mode,
              active_floor_id, created_at, updated_at
       from user_preferences
       where user_id = $1`, [userId]);
        if (existing) {
            return this.mapUserPreferences(existing);
        }
        const currentTime = nowIso();
        await this.db.execute(`insert into user_preferences (
        user_id, favorite_device_ids, allowed_device_ids, pinned_sections,
        preferred_home_tab, ui_density, theme_mode, motion_mode,
        active_floor_id, created_at, updated_at
      ) values (
        $1, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'home', 'comfortable',
        'system', 'standard', null, $2, $2
      )
      on conflict (user_id) do nothing`, [userId, currentTime]);
        const created = await this.db.one(`select user_id, favorite_device_ids, allowed_device_ids, pinned_sections,
              preferred_home_tab, ui_density, theme_mode, motion_mode,
              active_floor_id, created_at, updated_at
       from user_preferences
       where user_id = $1`, [userId]);
        return this.mapUserPreferences(created);
    }
    async updateUserPreferences(userId, dto) {
        const current = await this.getUserPreferences(userId);
        const updatedAt = nowIso();
        await this.db.execute(`update user_preferences
       set favorite_device_ids = $2::jsonb,
           allowed_device_ids = $3::jsonb,
           pinned_sections = $4::jsonb,
           preferred_home_tab = $5,
           ui_density = $6,
           theme_mode = $7,
           motion_mode = $8,
           active_floor_id = $9,
           updated_at = $10
       where user_id = $1`, [
            userId,
            JSON.stringify(dto.favoriteDeviceIds ?? current.favoriteDeviceIds),
            JSON.stringify(dto.allowedDeviceIds ?? current.allowedDeviceIds),
            JSON.stringify(dto.pinnedSections ?? current.pinnedSections),
            dto.preferredHomeTab ?? current.preferredHomeTab,
            dto.uiDensity ?? current.uiDensity,
            dto.themeMode ?? current.themeMode,
            dto.motionMode ?? current.motionMode,
            dto.activeFloorId ?? current.activeFloorId ?? null,
            updatedAt,
        ]);
        return this.getUserPreferences(userId);
    }
    async updateBirthYear(actorUserId, targetUserId, dto) {
        const actor = await this.getUser(actorUserId);
        if (actor.accountMode !== 'adult') {
            throw (0, http_errors_1.forbidden)('birth_year_update_denied', 'Only adult accounts can change birth year');
        }
        const actorFamily = await this.getCurrentFamily(actorUserId);
        const targetFamily = await this.getCurrentFamily(targetUserId);
        if (!actorFamily || !targetFamily || actorFamily.id !== targetFamily.id) {
            throw (0, http_errors_1.forbidden)('birth_year_update_scope_denied', 'Target user must belong to the same family');
        }
        await this.db.execute(`update users
       set birth_year = $2, account_mode = $3, updated_at = $4
       where id = $1`, [
            targetUserId,
            dto.birthYear,
            (0, account_mode_1.resolveAccountMode)(dto.birthYear),
            nowIso(),
        ]);
        return this.getUser(targetUserId);
    }
    async getCurrentFamily(userId) {
        const row = await this.db.one(`select f.id, f.title, f.owner_user_id, f.created_at, f.updated_at
       from families f
       join family_members fm on fm.family_id = f.id
       where fm.user_id = $1 and fm.status = 'active'
       limit 1`, [userId]);
        return row ? this.mapFamily(row) : null;
    }
    async getFamilyMembers(userId) {
        const family = await this.requireFamilyMembership(userId);
        const rows = await this.db.query(`select id, family_id, user_id, guardian_user_id, status, created_at
       from family_members
       where family_id = $1
       order by created_at asc`, [family.id]);
        return rows.map((row) => this.mapFamilyMember(row));
    }
    async createFamily(userId, dto) {
        const user = await this.getUser(userId);
        if (user.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('family_create_denied', 'Child accounts cannot create families');
        }
        const existing = await this.getCurrentFamily(userId);
        if (existing) {
            return existing;
        }
        const familyId = (0, id_1.uuidv7)();
        const currentTime = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into families (id, title, owner_user_id, created_at, updated_at)
         values ($1, $2, $3, $4, $4)`, [familyId, dto.title, userId, currentTime], tx);
            await this.db.execute(`insert into family_members (
          id, family_id, user_id, guardian_user_id, status, created_at
        ) values ($1, $2, $3, $3, 'active', $4)`, [(0, id_1.uuidv7)(), familyId, userId, currentTime], tx);
        });
        return this.requireFamilyMembership(userId);
    }
    async createFamilyInvite(userId, dto) {
        const family = await this.requireOwnedFamily(userId);
        const invite = {
            id: (0, id_1.uuidv7)(),
            familyId: family.id,
            code: generateInviteCode(),
            targetAccountMode: dto.targetAccountMode,
            createdByUserId: userId,
            claimedByUserId: null,
            status: 'active',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * (dto.expiresInHours ?? 72)).toISOString(),
            claimedAt: null,
            createdAt: nowIso(),
        };
        await this.db.execute(`insert into family_invites (
        id, family_id, code, target_account_mode, created_by_user_id,
        claimed_by_user_id, status, expires_at, claimed_at, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
            invite.id,
            invite.familyId,
            invite.code,
            invite.targetAccountMode,
            invite.createdByUserId,
            invite.claimedByUserId,
            invite.status,
            invite.expiresAt,
            invite.claimedAt,
            invite.createdAt,
        ]);
        return invite;
    }
    async joinFamily(userId, dto) {
        const invite = await this.getInviteByCode(dto.code);
        await this.db.transaction((tx) => this.attachUserToFamily(userId, invite, tx));
        return this.requireFamilyMembership(userId);
    }
    async getHomesForUser(userId) {
        const rows = await this.db.query(`select h.id, h.family_id, h.title, h.address_label, h.timezone, h.owner_user_id,
              h.current_mode, h.security_mode, h.updated_at, h.layout_revision
       from homes h
       join home_members hm on hm.home_id = h.id
       where hm.user_id = $1 and hm.status = 'active'
       order by h.updated_at desc`, [userId]);
        return rows.map((row) => this.mapHome(row));
    }
    async createHome(userId, dto) {
        const user = await this.getUser(userId);
        if (user.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('home_create_denied', 'Child accounts cannot create homes');
        }
        const family = await this.getCurrentFamily(userId);
        const home = {
            id: (0, id_1.uuidv7)(),
            familyId: family?.id ?? null,
            title: dto.title,
            addressLabel: dto.addressLabel,
            timezone: dto.timezone,
            ownerUserId: userId,
            currentMode: 'home',
            securityMode: 'disarmed',
            updatedAt: nowIso(),
            layoutRevision: 0,
        };
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into homes (
          id, family_id, owner_user_id, title, address_label, timezone,
          current_mode, security_mode, layout_revision, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`, [
                home.id,
                home.familyId,
                home.ownerUserId,
                home.title,
                home.addressLabel,
                home.timezone,
                home.currentMode,
                home.securityMode,
                home.layoutRevision,
                home.updatedAt,
            ], tx);
            await this.db.execute(`insert into floors (id, home_id, title, sort_order, created_at, updated_at)
         values ($1, $2, $3, 0, $4, $4)`, [(0, id_1.uuidv7)(), home.id, 'Основной этаж', home.updatedAt], tx);
            const familyMembers = family
                ? await this.db.query(`select user_id from family_members where family_id = $1 and status = 'active'`, [family.id], tx)
                : [{ user_id: userId }];
            for (const member of familyMembers) {
                await this.db.execute(`insert into home_members (
            id, home_id, user_id, role, status, created_at
          ) values ($1,$2,$3,$4,'active',$5)
          on conflict (home_id, user_id) do nothing`, [
                    (0, id_1.uuidv7)(),
                    home.id,
                    member.user_id,
                    member.user_id === userId ? 'owner' : 'member',
                    home.updatedAt,
                ], tx);
                await this.db.execute(`insert into reward_balances (user_id, home_id, balance, updated_at)
           values ($1, $2, 0, $3)
           on conflict (user_id, home_id) do nothing`, [member.user_id, home.id, home.updatedAt], tx);
            }
            await this.insertEvent(tx, home.id, 'home.state.updated', 'info', { homeId: home.id, title: home.title }, userId);
        });
        return home;
    }
    async getHome(homeId) {
        const row = await this.db.one(`select id, family_id, title, address_label, timezone, owner_user_id,
              current_mode, security_mode, updated_at, layout_revision
       from homes where id = $1`, [homeId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('home_not_found', 'Home was not found');
        }
        return this.mapHome(row);
    }
    async getFloors(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        await this.ensureDefaultFloor(homeId);
        const rows = await this.db.query(`select id, home_id, title, sort_order, created_at, updated_at
       from floors
       where home_id = $1
       order by sort_order asc, created_at asc`, [homeId]);
        return rows.map((row) => this.mapFloor(row));
    }
    async createFloor(userId, homeId, dto) {
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('floor_create_denied', 'Child accounts cannot create floors');
        }
        await this.ensureHomeAccess(userId, homeId);
        await this.ensureDefaultFloor(homeId);
        const existing = await this.getFloors(homeId, userId);
        const floor = {
            id: (0, id_1.uuidv7)(),
            homeId,
            title: dto.title,
            sortOrder: dto.sortOrder ?? existing.length,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        await this.db.execute(`insert into floors (id, home_id, title, sort_order, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $5)`, [floor.id, floor.homeId, floor.title, floor.sortOrder, floor.updatedAt]);
        return floor;
    }
    async updateFloor(userId, floorId, dto) {
        const row = await this.db.one('select id, home_id from floors where id = $1', [floorId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('floor_not_found', 'Floor was not found');
        }
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('floor_update_denied', 'Child accounts cannot edit floors');
        }
        await this.ensureHomeAccess(userId, row.home_id);
        await this.db.execute(`update floors
       set title = coalesce($2, title),
           sort_order = coalesce($3, sort_order),
           updated_at = $4
       where id = $1`, [floorId, dto.title ?? null, dto.sortOrder ?? null, nowIso()]);
        const updated = await this.db.one(`select id, home_id, title, sort_order, created_at, updated_at
       from floors where id = $1`, [floorId]);
        return this.mapFloor(updated);
    }
    async ensureHomeAccess(userId, homeId) {
        const member = await this.db.one(`select id, home_id, user_id, role, status, created_at
       from home_members
       where home_id = $1 and user_id = $2 and status = 'active'`, [homeId, userId]);
        if (!member) {
            throw (0, http_errors_1.forbidden)('home_access_denied', 'User does not belong to this home');
        }
        return this.mapHomeMember(member);
    }
    async updateHomeState(userId, homeId, dto) {
        const member = await this.ensureHomeAccess(userId, homeId);
        const actor = await this.getUser(userId);
        if (dto.securityMode && actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('security_mode_denied', 'Child accounts cannot change security state');
        }
        if (member.role === 'guest' && dto.securityMode) {
            throw (0, http_errors_1.forbidden)('security_mode_denied', 'Guests cannot change security state');
        }
        const currentTime = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute(`update homes
         set current_mode = coalesce($2, current_mode),
             security_mode = coalesce($3, security_mode),
             updated_at = $4
         where id = $1`, [
                homeId,
                dto.currentMode ?? null,
                dto.securityMode ?? null,
                currentTime,
            ], tx);
            await this.insertEvent(tx, homeId, 'home.state.updated', 'info', { ...dto }, userId);
            if (dto.securityMode) {
                await this.writeAudit(tx, userId, homeId, 'home', homeId, 'security.mode.update', `Changed security mode to ${dto.securityMode}`);
            }
        });
        return this.getHome(homeId);
    }
    async getMembers(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const rows = await this.db.query(`select id, home_id, user_id, role, status, created_at
       from home_members
       where home_id = $1
       order by created_at asc`, [homeId]);
        return rows.map((row) => this.mapHomeMember(row));
    }
    async inviteMember(actorUserId, dto) {
        const actorMembership = await this.ensureHomeAccess(actorUserId, dto.homeId);
        const actor = await this.getUser(actorUserId);
        if (actor.accountMode === 'child' || actorMembership.role === 'guest') {
            throw (0, http_errors_1.forbidden)('member_invite_denied', 'Current account cannot invite members');
        }
        const user = await this.getUser(dto.userId);
        await this.db.execute(`insert into home_members (id, home_id, user_id, role, status, created_at)
       values ($1, $2, $3, $4, 'invited', $5)
       on conflict (home_id, user_id) do update set role = excluded.role, status = 'invited'`, [(0, id_1.uuidv7)(), dto.homeId, user.id, dto.role, nowIso()]);
        return this.ensureHomeAccess(user.id, dto.homeId);
    }
    async updateMember(actorUserId, memberId, dto) {
        const target = await this.db.one('select id, home_id, user_id from home_members where id = $1', [
            memberId,
        ]);
        if (!target) {
            throw (0, http_errors_1.notFound)('member_not_found', 'Member was not found');
        }
        const actorMembership = await this.ensureHomeAccess(actorUserId, target.home_id);
        if (actorMembership.role !== 'owner') {
            throw (0, http_errors_1.forbidden)('member_update_denied', 'Only owners can update members');
        }
        await this.db.execute(`update home_members
       set role = coalesce($2, role),
           status = coalesce($3, status)
       where id = $1`, [memberId, dto.role ?? null, dto.status ?? null]);
        return this.ensureHomeAccess(target.user_id, target.home_id);
    }
    async getRooms(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        await this.ensureDefaultFloor(homeId);
        const rows = await this.db.query(`select id, home_id, floor_id, title, type, sort_order, updated_at
       from rooms where home_id = $1
       order by sort_order asc, created_at asc`, [homeId]);
        return rows.map((row) => this.mapRoom(row));
    }
    async createRoom(userId, homeId, dto) {
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('room_create_denied', 'Child accounts cannot create rooms');
        }
        await this.ensureHomeAccess(userId, homeId);
        const floor = dto.floorId
            ? await this.requireFloorForHome(homeId, dto.floorId)
            : await this.ensureDefaultFloor(homeId);
        const room = {
            id: (0, id_1.uuidv7)(),
            homeId,
            floorId: floor.id,
            title: dto.title,
            type: dto.type,
            sortOrder: dto.sortOrder ?? (await this.getRooms(homeId, userId)).length,
            updatedAt: nowIso(),
        };
        await this.db.execute(`insert into rooms (id, home_id, floor_id, title, type, sort_order, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $7)`, [
            room.id,
            room.homeId,
            room.floorId,
            room.title,
            room.type,
            room.sortOrder,
            room.updatedAt,
        ]);
        return room;
    }
    async updateRoom(userId, roomId, dto) {
        const room = await this.db.one('select id, home_id, floor_id from rooms where id = $1', [roomId]);
        if (!room) {
            throw (0, http_errors_1.notFound)('room_not_found', 'Room was not found');
        }
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('room_update_denied', 'Child accounts cannot edit rooms');
        }
        await this.ensureHomeAccess(userId, room.home_id);
        const floorId = dto.floorId
            ? (await this.requireFloorForHome(room.home_id, dto.floorId)).id
            : room.floor_id;
        await this.db.execute(`update rooms
       set floor_id = $2,
           title = coalesce($3, title),
           type = coalesce($4, type),
           sort_order = coalesce($5, sort_order),
           updated_at = $6
       where id = $1`, [
            roomId,
            floorId,
            dto.title ?? null,
            dto.type ?? null,
            dto.sortOrder ?? null,
            nowIso(),
        ]);
        const updated = await this.db.one('select id, home_id, floor_id, title, type, sort_order, updated_at from rooms where id = $1', [roomId]);
        return this.mapRoom(updated);
    }
    async getLayout(homeId, userId, floorId) {
        await this.ensureHomeAccess(userId, homeId);
        const floors = await this.getFloors(homeId, userId);
        const resolvedFloorId = floorId ?? floors[0]?.id ?? null;
        const home = await this.getHome(homeId);
        const rooms = await this.getRooms(homeId, userId);
        const roomIds = resolvedFloorId == null
            ? rooms.map((room) => room.id)
            : rooms
                .filter((room) => room.floorId == resolvedFloorId)
                .map((room) => room.id);
        const blocks = await this.getLayoutBlocks(homeId);
        const items = await this.getLayoutItems(homeId);
        return {
            homeId,
            revision: home.layoutRevision,
            floorId: resolvedFloorId ?? null,
            blocks: blocks.filter((block) => roomIds.includes(block.roomId)),
            items: items.filter((item) => roomIds.includes(item.roomId)),
        };
    }
    async replaceLayout(userId, homeId, dto) {
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('layout_edit_denied', 'Child accounts cannot edit home layout');
        }
        await this.ensureHomeAccess(userId, homeId);
        const home = await this.getHome(homeId);
        if (dto.revision !== home.layoutRevision) {
            throw (0, http_errors_1.conflict)('layout_revision_mismatch', 'Layout revision is stale');
        }
        await this.ensureDefaultFloor(homeId);
        await this.validateLayout(homeId, dto.blocks, dto.items, userId);
        const updatedAt = nowIso();
        const nextRevision = home.layoutRevision + 1;
        await this.db.transaction(async (tx) => {
            await this.db.execute(`delete from room_layout_blocks
         where room_id in (select id from rooms where home_id = $1)`, [homeId], tx);
            await this.db.execute('delete from layout_items where home_id = $1', [homeId], tx);
            for (const block of dto.blocks) {
                await this.db.execute(`insert into room_layout_blocks (id, room_id, x, y, width, height, z_index, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
                    (0, id_1.uuidv7)(),
                    block.roomId,
                    block.x,
                    block.y,
                    block.width,
                    block.height,
                    block.zIndex,
                    updatedAt,
                ], tx);
            }
            for (const item of dto.items) {
                await this.db.execute(`insert into layout_items (
            id, home_id, room_id, kind, subtype, title, x, y, width, height,
            rotation, metadata, created_at, updated_at
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`, [
                    item.id ?? (0, id_1.uuidv7)(),
                    homeId,
                    item.roomId,
                    item.kind,
                    item.subtype,
                    item.title ?? null,
                    item.x,
                    item.y,
                    item.width,
                    item.height,
                    item.rotation ?? 0,
                    JSON.stringify(item.metadata ?? {}),
                    updatedAt,
                ], tx);
            }
            await this.db.execute('update homes set layout_revision = $2, updated_at = $3 where id = $1', [homeId, nextRevision, updatedAt], tx);
            await this.insertEvent(tx, homeId, 'layout.updated', 'info', { layoutRevision: nextRevision }, userId);
            await this.writeAudit(tx, userId, homeId, 'layout', homeId, 'layout.replace', 'Updated home layout');
        });
        return this.getLayout(homeId, userId);
    }
    async validateLayoutDraft(userId, homeId, dto) {
        await this.ensureHomeAccess(userId, homeId);
        await this.ensureDefaultFloor(homeId);
        await this.validateLayout(homeId, dto.blocks, dto.items, userId);
        return { valid: true };
    }
    async listTasks(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        await this.ensureDefaultFloor(homeId);
        const user = await this.getUser(userId);
        const rows = await this.db.query(`select * from tasks
       where home_id = $1
       ${user.accountMode === 'child' ? 'and assignee_user_id = $2' : ''}
       order by created_at desc`, user.accountMode === 'child' ? [homeId, userId] : [homeId]);
        return rows.map((row) => this.mapTask(row));
    }
    async createTask(userId, dto) {
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('task_create_denied', 'Child accounts cannot create tasks');
        }
        await this.ensureHomeAccess(userId, dto.homeId);
        await this.ensureHomeAccess(dto.assigneeUserId, dto.homeId);
        await this.ensureDefaultFloor(dto.homeId);
        const resolvedFloorId = dto.roomId
            ? await this.getRoomFloorId(dto.homeId, dto.roomId)
            : dto.floorId
                ? (await this.requireFloorForHome(dto.homeId, dto.floorId)).id
                : (await this.ensureDefaultFloor(dto.homeId)).id;
        if (dto.roomId) {
            await this.validateTaskTarget(dto.homeId, dto.roomId, dto.targetX, dto.targetY, userId);
        }
        const family = await this.getCurrentFamily(userId);
        const task = {
            id: (0, id_1.uuidv7)(),
            homeId: dto.homeId,
            familyId: family?.id ?? null,
            floorId: resolvedFloorId,
            roomId: dto.roomId ?? null,
            assigneeUserId: dto.assigneeUserId,
            createdByUserId: userId,
            approvedByUserId: null,
            title: dto.title,
            description: dto.description,
            rewardType: dto.rewardType,
            rewardValue: dto.rewardValue,
            rewardDescription: dto.rewardDescription,
            targetX: dto.targetX ?? null,
            targetY: dto.targetY ?? null,
            status: 'pending',
            deadlineAt: dto.deadlineAt ?? null,
            submittedAt: null,
            approvedAt: null,
            rejectedAt: null,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into tasks (
          id, home_id, family_id, floor_id, room_id, assignee_user_id, created_by_user_id,
          approved_by_user_id, title, description, reward_type, reward_value,
          reward_description, target_x, target_y, status, deadline_at,
          submitted_at, approved_at, rejected_at, created_at, updated_at
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
        )`, [
                task.id,
                task.homeId,
                task.familyId,
                task.floorId,
                task.roomId,
                task.assigneeUserId,
                task.createdByUserId,
                task.approvedByUserId,
                task.title,
                task.description,
                task.rewardType,
                task.rewardValue,
                task.rewardDescription,
                task.targetX,
                task.targetY,
                task.status,
                task.deadlineAt,
                task.submittedAt,
                task.approvedAt,
                task.rejectedAt,
                task.createdAt,
                task.updatedAt,
            ], tx);
            await this.insertEvent(tx, task.homeId, 'task.updated', 'info', { taskId: task.id, status: task.status }, userId);
        });
        return task;
    }
    async updateTask(userId, taskId, dto) {
        const task = await this.requireTask(taskId);
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('task_update_denied', 'Child accounts cannot update tasks');
        }
        await this.ensureHomeAccess(userId, task.homeId);
        const nextFloorId = dto.roomId
            ? await this.getRoomFloorId(task.homeId, dto.roomId)
            : dto.floorId
                ? (await this.requireFloorForHome(task.homeId, dto.floorId)).id
                : (task.floorId ?? (await this.ensureDefaultFloor(task.homeId)).id);
        await this.db.execute(`update tasks
       set title = coalesce($2, title),
           description = coalesce($3, description),
           reward_type = coalesce($4, reward_type),
           reward_value = coalesce($5, reward_value),
           reward_description = coalesce($6, reward_description),
           floor_id = $7,
           room_id = coalesce($8, room_id),
           target_x = coalesce($9, target_x),
           target_y = coalesce($10, target_y),
           status = coalesce($11, status),
           deadline_at = coalesce($12, deadline_at),
           updated_at = $13
       where id = $1`, [
            taskId,
            dto.title ?? null,
            dto.description ?? null,
            dto.rewardType ?? null,
            dto.rewardValue ?? null,
            dto.rewardDescription ?? null,
            nextFloorId,
            dto.roomId ?? null,
            dto.targetX ?? null,
            dto.targetY ?? null,
            dto.status ?? null,
            dto.deadlineAt ?? null,
            nowIso(),
        ]);
        return this.requireTask(taskId);
    }
    async submitTask(userId, taskId, dto) {
        const task = await this.requireTask(taskId);
        if (task.assigneeUserId !== userId) {
            throw (0, http_errors_1.forbidden)('task_submit_denied', 'Only the assigned child can submit this task');
        }
        const submittedAt = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute(`update tasks
         set status = 'submitted', submitted_at = $2, updated_at = $2
         where id = $1`, [taskId, submittedAt], tx);
            await this.db.execute(`insert into task_submissions (
          id, task_id, submitted_by_user_id, note, status, created_at
        ) values ($1, $2, $3, $4, 'submitted', $5)`, [(0, id_1.uuidv7)(), taskId, userId, dto.note ?? null, submittedAt], tx);
            await this.insertEvent(tx, task.homeId, 'task.updated', 'info', { taskId, status: 'submitted' }, userId);
        });
        return this.requireTask(taskId);
    }
    async reviewTask(userId, taskId, dto) {
        const task = await this.requireTask(taskId);
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child') {
            throw (0, http_errors_1.forbidden)('task_review_denied', 'Child accounts cannot review tasks');
        }
        await this.ensureHomeAccess(userId, task.homeId);
        const currentTime = nowIso();
        await this.db.transaction(async (tx) => {
            const nextStatus = dto.approved
                ? 'approved'
                : 'rejected';
            await this.db.execute(`update tasks
         set status = $2,
             approved_by_user_id = $3,
             approved_at = $4,
             rejected_at = $5,
             updated_at = $6
         where id = $1`, [
                taskId,
                nextStatus,
                dto.approved ? userId : null,
                dto.approved ? currentTime : null,
                dto.approved ? null : currentTime,
                currentTime,
            ], tx);
            await this.db.execute(`insert into task_submissions (
          id, task_id, submitted_by_user_id, note, status, created_at
        ) values ($1, $2, $3, $4, $5, $6)`, [(0, id_1.uuidv7)(), taskId, userId, dto.note ?? null, nextStatus, currentTime], tx);
            if (dto.approved) {
                await this.db.execute(`insert into reward_ledger (
            id, user_id, home_id, task_id, delta, entry_type, description, created_at
          ) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [
                    (0, id_1.uuidv7)(),
                    task.assigneeUserId,
                    task.homeId,
                    task.id,
                    task.rewardValue,
                    task.rewardType,
                    task.rewardDescription,
                    currentTime,
                ], tx);
                await this.db.execute(`insert into reward_balances (user_id, home_id, balance, updated_at)
           values ($1, $2, $3, $4)
           on conflict (user_id, home_id)
           do update set balance = reward_balances.balance + excluded.balance, updated_at = excluded.updated_at`, [task.assigneeUserId, task.homeId, task.rewardValue, currentTime], tx);
            }
            await this.insertEvent(tx, task.homeId, 'task.updated', 'info', { taskId, status: nextStatus }, userId);
        });
        return this.requireTask(taskId);
    }
    async getRewardBalance(userId, homeId) {
        await this.ensureHomeAccess(userId, homeId);
        const row = await this.db.one(`select user_id, home_id, balance, updated_at
       from reward_balances
       where user_id = $1 and home_id = $2`, [userId, homeId]);
        return row
            ? this.mapRewardBalance(row)
            : { userId, homeId, balance: 0, updatedAt: nowIso() };
    }
    async getRewardLedger(userId, homeId) {
        await this.ensureHomeAccess(userId, homeId);
        const actor = await this.getUser(userId);
        const rows = await this.db.query(`select id, user_id, home_id, task_id, delta, entry_type, description, created_at
       from reward_ledger
       where home_id = $1 ${actor.accountMode === 'child' ? 'and user_id = $2' : ''}
       order by created_at desc`, actor.accountMode === 'child' ? [homeId, userId] : [homeId]);
        return rows.map((row) => this.mapRewardLedgerEntry(row));
    }
    async getDevices(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const rows = await this.db.query('select * from devices where home_id = $1 order by updated_at desc', [
            homeId,
        ]);
        return rows.map((row) => this.mapDevice(row));
    }
    async getDeviceDetails(userId, deviceId) {
        const deviceRow = await this.db.one('select * from devices where id = $1', [deviceId]);
        if (!deviceRow) {
            throw (0, http_errors_1.notFound)('device_not_found', 'Device was not found');
        }
        await this.ensureHomeAccess(userId, deviceRow.home_id);
        const device = this.mapDevice(deviceRow);
        const capabilities = await this.getCapabilities(deviceId);
        const latestState = await this.getLatestState(deviceId);
        const commands = await this.db.query(`select * from command_logs where device_id = $1 order by requested_at desc`, [deviceId]);
        const firmware = await this.db.query(`select * from firmware_records where device_id = $1 order by recorded_at desc`, [deviceId]);
        const media = await this.db.one(`select * from device_media_assets where vendor = $1 and model = $2`, [
            device.vendor,
            device.model,
        ]);
        return {
            device,
            capabilities,
            latestState,
            commands: commands.map((row) => this.mapCommand(row)),
            firmware: firmware.map((row) => this.mapFirmware(row)),
            mediaAsset: media ? this.mapDeviceMediaAsset(media) : null,
        };
    }
    async updateDevicePlacement(userId, deviceId, dto) {
        const details = await this.getDeviceDetails(userId, deviceId);
        const actor = await this.getUser(userId);
        const member = await this.ensureHomeAccess(userId, details.device.homeId);
        if (actor.accountMode === 'child' || member.role === 'guest') {
            throw (0, http_errors_1.forbidden)('device_placement_denied', 'Current account cannot update device placement');
        }
        const targetFloorId = await this.getRoomFloorId(details.device.homeId, dto.roomId);
        if (dto.floorId && dto.floorId !== targetFloorId) {
            throw (0, http_errors_1.conflict)('device_floor_room_mismatch', 'Selected room does not belong to the provided floor');
        }
        const updatedAt = nowIso();
        await this.db.transaction(async (tx) => {
            await this.db.execute(`update devices
         set room_id = $2, updated_at = $3
         where id = $1`, [deviceId, dto.roomId, updatedAt], tx);
            if (dto.markerX !== undefined && dto.markerY !== undefined) {
                const existingMarker = await this.db.one(`select id
           from layout_items
           where home_id = $1 and kind = 'device'
             and metadata ->> 'deviceId' = $2
           limit 1`, [details.device.homeId, deviceId], tx);
                const markerMetadata = JSON.stringify({ deviceId });
                if (existingMarker) {
                    await this.db.execute(`update layout_items
             set room_id = $2,
                 title = $3,
                 x = $4,
                 y = $5,
                 width = 2,
                 height = 2,
                 metadata = $6::jsonb,
                 updated_at = $7
             where id = $1`, [
                        existingMarker.id,
                        dto.roomId,
                        dto.markerTitle ?? details.device.name,
                        dto.markerX,
                        dto.markerY,
                        markerMetadata,
                        updatedAt,
                    ], tx);
                }
                else {
                    await this.db.execute(`insert into layout_items (
              id, home_id, room_id, kind, subtype, title, x, y, width, height,
              rotation, metadata, created_at, updated_at
            ) values ($1,$2,$3,'device','device_marker',$4,$5,$6,2,2,0,$7::jsonb,$8,$8)`, [
                        (0, id_1.uuidv7)(),
                        details.device.homeId,
                        dto.roomId,
                        dto.markerTitle ?? details.device.name,
                        dto.markerX,
                        dto.markerY,
                        markerMetadata,
                        updatedAt,
                    ], tx);
                }
            }
            await this.insertEvent(tx, details.device.homeId, 'device.placement.updated', 'info', {
                deviceId,
                roomId: dto.roomId,
                floorId: targetFloorId,
                markerX: dto.markerX ?? null,
                markerY: dto.markerY ?? null,
            }, userId);
            await this.writeAudit(tx, userId, details.device.homeId, 'device', deviceId, 'device.placement.update', 'Updated device room placement');
        });
        return this.getDeviceDetails(userId, deviceId);
    }
    async getCapabilities(deviceId) {
        const rows = await this.db.query('select * from device_capabilities where device_id = $1', [deviceId]);
        return rows.map((row) => this.mapCapability(row));
    }
    async getLatestState(deviceId) {
        const row = await this.db.one(`select id, device_id, observed_at, source, values
       from latest_device_state_v where device_id = $1`, [deviceId]);
        return row ? this.mapSnapshot(row) : null;
    }
    async submitCommand(user, deviceId, idempotencyKey, dto) {
        const device = await this.getDeviceDetails(user.id, deviceId);
        const capability = device.capabilities.find((item) => item.key === dto.capabilityKey);
        if (!capability || !capability.writable) {
            throw (0, http_errors_1.forbidden)('capability_not_writable', 'Capability is not writable');
        }
        const existing = await this.db.one(`select * from command_logs where home_id = $1 and idempotency_key = $2`, [device.device.homeId, idempotencyKey]);
        if (existing) {
            return this.mapCommand(existing);
        }
        const command = {
            id: (0, id_1.uuidv7)(),
            homeId: device.device.homeId,
            deviceId,
            capabilityKey: dto.capabilityKey,
            requestedValue: dto.requestedValue,
            requestedAt: nowIso(),
            actorUserId: user.id,
            idempotencyKey,
            deliveryStatus: 'queued',
            failureReason: null,
            externalCommandRef: null,
            acknowledgedAt: null,
            reconciledAt: null,
        };
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into command_logs (
          id, home_id, device_id, capability_key, requested_value, requested_at,
          actor_user_id, idempotency_key, delivery_status, failure_reason,
          external_command_ref, acknowledged_at, reconciled_at, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
                command.id,
                command.homeId,
                command.deviceId,
                command.capabilityKey,
                JSON.stringify(command.requestedValue),
                command.requestedAt,
                command.actorUserId,
                command.idempotencyKey,
                command.deliveryStatus,
                command.failureReason,
                command.externalCommandRef,
                command.acknowledgedAt,
                command.reconciledAt,
                command.requestedAt,
            ], tx);
        });
        if (this.isTuyaVendor(device.device.vendor)) {
            return this.dispatchTuyaCommand(user, device, command);
        }
        await this.db.transaction(async (tx) => {
            await this.db.execute(`update command_logs
         set delivery_status = 'acknowledged',
             acknowledged_at = $2
         where id = $1`, [command.id, command.requestedAt], tx);
            await this.insertEvent(tx, command.homeId, 'device.command.acknowledged', 'info', {
                commandId: command.id,
                deviceId,
                capabilityKey: command.capabilityKey,
            }, user.id);
        });
        command.deliveryStatus = 'acknowledged';
        command.acknowledgedAt = command.requestedAt;
        return command;
    }
    async getCommandStatus(userId, homeId, deviceId, commandId) {
        await this.ensureHomeAccess(userId, homeId);
        const row = await this.db.one(`select * from command_logs where id = $1 and home_id = $2 and device_id = $3`, [commandId, homeId, deviceId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('command_not_found', 'Command was not found');
        }
        return this.mapCommand(row);
    }
    async getEvents(homeId, userId, afterOffset = 0) {
        await this.ensureHomeAccess(userId, homeId);
        const rows = await this.db.query(`select id, home_id, room_id, device_id, user_id, topic, severity, payload, created_at, event_offset
       from events
       where home_id = $1 and event_offset > $2
       order by event_offset asc`, [homeId, afterOffset]);
        return rows.map((row) => this.mapEvent(row));
    }
    async getEvent(homeId, eventId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const row = await this.db.one('select * from events where id = $1 and home_id = $2', [
            eventId,
            homeId,
        ]);
        if (!row) {
            throw (0, http_errors_1.notFound)('event_not_found', 'Event was not found');
        }
        return this.mapEvent(row);
    }
    async getNotifications(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const rows = await this.db.query(`select * from notifications where home_id = $1 and user_id = $2 order by created_at desc`, [homeId, userId]);
        return rows.map((row) => this.mapNotification(row));
    }
    async markNotificationRead(homeId, notificationId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        await this.db.execute('update notifications set read_at = $3 where id = $1 and home_id = $2', [notificationId, homeId, nowIso()]);
        const row = await this.db.one('select * from notifications where id = $1', [notificationId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('notification_not_found', 'Notification was not found');
        }
        return this.mapNotification(row);
    }
    async getIntegrations(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const rows = await this.db.query('select * from integration_accounts where home_id = $1 order by updated_at desc', [homeId]);
        return rows.map((row) => this.mapIntegration(row));
    }
    async createTuyaLinkSession(userId, dto) {
        const member = await this.ensureHomeAccess(userId, dto.homeId);
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child' || member.role === 'guest') {
            throw (0, http_errors_1.forbidden)('integration_connect_denied', 'Current account cannot manage integrations');
        }
        const createdAt = nowIso();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString();
        const sessionId = (0, id_1.uuidv7)();
        const region = this.normalizeTuyaRegion(dto.region);
        const state = (0, node_crypto_1.randomBytes)(16).toString('hex');
        const authorizationUrl = this.tuyaOpenApiClient.createAuthorizationUrl(region, state);
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into integration_link_sessions (
          id, home_id, provider, status, account_label, region,
          user_code, verification_uri, state, authorization_url,
          expires_at, linked_at, integration_account_id, failure_code, failure_message,
          created_by_user_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)`, [
                sessionId,
                dto.homeId,
                'tuya',
                'pending',
                dto.accountLabel,
                region,
                generateLinkUserCode(),
                authorizationUrl,
                state,
                authorizationUrl,
                expiresAt,
                null,
                null,
                null,
                null,
                userId,
                createdAt,
            ], tx);
            await this.insertEvent(tx, dto.homeId, 'integration.link_session.created', 'info', {
                provider: 'tuya',
                linkSessionId: sessionId,
                accountLabel: dto.accountLabel,
                region,
            }, userId);
            await this.writeAudit(tx, userId, dto.homeId, 'integration_link_session', sessionId, 'integration.link_session.create', 'Created Tuya link session');
        });
        const session = await this.getTuyaLinkSession(userId, sessionId);
        if (!session) {
            throw (0, http_errors_1.notFound)('integration_link_session_not_found', 'Tuya link session was not created');
        }
        return session;
    }
    async getTuyaLinkSession(userId, sessionId) {
        const row = await this.db.one(`select id, home_id, provider, status, account_label, region, user_code,
              verification_uri, state, authorization_url, expires_at, linked_at,
              integration_account_id, failure_code, failure_message,
              created_by_user_id, created_at, updated_at
       from integration_link_sessions
       where id = $1`, [sessionId]);
        if (!row) {
            return null;
        }
        await this.ensureHomeAccess(userId, row.home_id);
        if (row.status === 'pending' &&
            new Date(row.expires_at).getTime() <= Date.now()) {
            const updatedAt = nowIso();
            await this.db.execute(`update integration_link_sessions
         set status = $2, updated_at = $3
         where id = $1`, [sessionId, 'expired', updatedAt]);
            row.status = 'expired';
            row.updated_at = updatedAt;
        }
        return this.mapTuyaLinkSession(row);
    }
    async completeTuyaOAuthCallback(query) {
        const state = query.state?.trim();
        if (!state) {
            return this.renderTuyaCallbackPage({
                status: 'failed',
                message: 'Параметр state отсутствует в callback Tuya.',
            });
        }
        const session = await this.db.one(`select id, home_id, provider, status, account_label, region, user_code,
              verification_uri, state, authorization_url, expires_at, linked_at,
              integration_account_id, failure_code, failure_message,
              created_by_user_id, created_at, updated_at
         from integration_link_sessions
        where state = $1`, [state]);
        if (!session) {
            return this.renderTuyaCallbackPage({
                status: 'failed',
                message: 'Сессия привязки Smart Life не найдена.',
            });
        }
        if (new Date(session.expires_at).getTime() <= Date.now()) {
            await this.failTuyaLinkSession(session.id, 'session_expired', 'Сессия авторизации Tuya истекла.', 'expired');
            return this.renderTuyaCallbackPage({
                sessionId: session.id,
                status: 'expired',
                message: 'Сессия авторизации истекла. Вернитесь в РосДом и создайте новую.',
            });
        }
        if (query.error || !query.code) {
            const failureCode = query.errorCode ?? query.error ?? 'oauth_denied';
            const failureMessage = query.errorMessage ??
                (query.code
                    ? 'Не удалось обработать callback Tuya.'
                    : 'Авторизация Smart Life была отклонена или прервана.');
            await this.failTuyaLinkSession(session.id, failureCode, failureMessage, 'failed');
            return this.renderTuyaCallbackPage({
                sessionId: session.id,
                status: 'failed',
                message: failureMessage,
            });
        }
        try {
            const tokenBundle = await this.tuyaOpenApiClient.exchangeAuthorizationCode(query.code, session.region);
            const integration = await this.upsertConnectedTuyaIntegration(session.home_id, session.created_by_user_id, session.account_label, tokenBundle, session.id);
            const currentTime = nowIso();
            await this.db.transaction(async (tx) => {
                await this.db.execute(`update integration_link_sessions
              set status = 'linked',
                  linked_at = $2,
                  integration_account_id = $3,
                  failure_code = null,
                  failure_message = null,
                  updated_at = $2
            where id = $1`, [session.id, currentTime, integration.id], tx);
                await this.insertEvent(tx, session.home_id, 'integration.account.updated', 'info', {
                    provider: 'tuya',
                    status: 'connected',
                    accountLabel: session.account_label,
                    region: session.region,
                }, session.created_by_user_id);
            });
            return this.renderTuyaCallbackPage({
                sessionId: session.id,
                status: 'linked',
                message: 'Smart Life успешно подключён. Возвращаем вас в РосДом.',
            });
        }
        catch (error) {
            const failureMessage = error instanceof Error
                ? error.message
                : 'Не удалось завершить авторизацию Smart Life.';
            await this.failTuyaLinkSession(session.id, 'oauth_exchange_failed', failureMessage, 'failed');
            return this.renderTuyaCallbackPage({
                sessionId: session.id,
                status: 'failed',
                message: failureMessage,
            });
        }
    }
    async connectTuyaIntegration(userId, dto) {
        const member = await this.ensureHomeAccess(userId, dto.homeId);
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child' || member.role === 'guest') {
            throw (0, http_errors_1.forbidden)('integration_connect_denied', 'Current account cannot manage integrations');
        }
        const currentTime = nowIso();
        const linkedSession = await this.db.one(`select id
         from integration_link_sessions
        where home_id = $1 and provider = 'tuya' and created_by_user_id = $2
          and status = 'linked'
        order by linked_at desc nulls last, updated_at desc
        limit 1`, [dto.homeId, userId]);
        const normalizedRegion = this.normalizeTuyaRegion(dto.region);
        const appSchema = this.resolveTuyaAppSchema(dto.appSchema);
        if (dto.accessToken?.trim() && dto.refreshToken?.trim()) {
            const tokenBundle = {
                accessToken: dto.accessToken.trim(),
                refreshToken: dto.refreshToken.trim(),
                uid: 'unknown',
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                region: normalizedRegion,
                schema: appSchema,
            };
            return this.upsertConnectedTuyaIntegration(dto.homeId, userId, dto.accountLabel, tokenBundle, linkedSession?.id ?? null, {
                authMode: 'legacy_token_bundle',
                appSchema,
            });
        }
        if (dto.loginIdentifier?.trim() && dto.password?.trim()) {
            const countryCode = normalizeCountryCode(dto.countryCode);
            try {
                const tokenBundle = await this.tuyaOpenApiClient.loginAssociatedUser({
                    username: dto.loginIdentifier.trim(),
                    password: dto.password.trim(),
                    countryCode,
                    schema: appSchema,
                    region: normalizedRegion,
                });
                return this.upsertConnectedTuyaIntegration(dto.homeId, userId, dto.accountLabel, tokenBundle, linkedSession?.id ?? null, {
                    authMode: 'associated_user_login',
                    appSchema,
                    countryCode,
                    accountLoginMask: maskLoginIdentifier(dto.loginIdentifier),
                });
            }
            catch (error) {
                const failureMessage = error instanceof Error
                    ? error.message
                    : 'Smart Life account login failed';
                this.logger.warn(`Smart Life connect failed for home ${dto.homeId}, user ${userId}, login ${maskLoginIdentifier(dto.loginIdentifier)}: ${failureMessage}`);
                throw (0, http_errors_1.conflict)('integration_connect_failed', `Smart Life login failed. Verify the account password and make sure this app account is linked to the Tuya cloud project in Devices -> Link Tuya App Account. ${failureMessage}`);
            }
        }
        const integration = (await this.getIntegrations(dto.homeId, userId)).find((item) => item.provider === 'tuya');
        if (integration) {
            return integration;
        }
        const metadata = {
            accountLabel: dto.accountLabel,
            region: normalizedRegion,
            appSchema,
            authMode: 'manual_attention_needed',
            stack: ['tuya', 'smart_life'],
            lastSyncAt: null,
            linkSessionId: linkedSession?.id ?? null,
        };
        const integrationAccountId = (0, id_1.uuidv7)();
        await this.db.transaction(async (tx) => {
            await this.db.execute(`insert into integration_accounts (
          id, home_id, provider, status, encrypted_credentials, metadata, created_at, updated_at
        ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $7)`, [
                integrationAccountId,
                dto.homeId,
                'tuya',
                'attention_needed',
                null,
                JSON.stringify(metadata),
                currentTime,
            ], tx);
            await this.insertEvent(tx, dto.homeId, 'integration.account.updated', 'info', {
                provider: 'tuya',
                status: 'attention_needed',
                accountLabel: dto.accountLabel,
                region: dto.region ?? 'eu',
            }, userId);
            await this.writeAudit(tx, userId, dto.homeId, 'integration', integrationAccountId, 'integration.connect.legacy', 'Created legacy Tuya integration account');
        });
        return ((await this.getIntegrations(dto.homeId, userId)).find((item) => item.id === integrationAccountId) ?? {
            id: integrationAccountId,
            homeId: dto.homeId,
            provider: 'tuya',
            status: 'attention_needed',
            metadata,
            createdAt: currentTime,
            updatedAt: currentTime,
        });
    }
    async syncTuyaIntegration(userId, homeId) {
        const member = await this.ensureHomeAccess(userId, homeId);
        const actor = await this.getUser(userId);
        if (actor.accountMode === 'child' || member.role === 'guest') {
            throw (0, http_errors_1.forbidden)('integration_sync_denied', 'Current account cannot sync integrations');
        }
        const integration = await this.db.one('select id, status, encrypted_credentials, metadata from integration_accounts where home_id = $1 and provider = $2 limit 1', [homeId, 'tuya']);
        if (!integration) {
            throw (0, http_errors_1.notFound)('integration_not_found', 'Tuya integration is not connected');
        }
        const credentials = this.integrationCredentialsService.decrypt(integration.encrypted_credentials);
        if (!credentials) {
            throw (0, http_errors_1.conflict)('integration_credentials_missing', 'Smart Life is not logged in for this home yet. Sign in again in Add Device before running sync.');
        }
        const metadata = parseRecord(integration.metadata);
        const validBundle = await this.ensureValidTuyaTokenBundle(integration.id, credentials, metadata);
        let providerDevices;
        try {
            providerDevices =
                await this.tuyaOpenApiClient.getUserDevices(validBundle);
        }
        catch (error) {
            const failureMessage = error instanceof Error
                ? error.message
                : 'Unable to query Smart Life devices';
            this.logger.warn(`Smart Life sync failed for home ${homeId}, integration ${integration.id}: ${failureMessage}`);
            throw (0, http_errors_1.conflict)('integration_sync_failed', `Smart Life sync failed. Make sure this Smart Life account is linked to the Tuya cloud project in Devices -> Link Tuya App Account, then try again. ${failureMessage}`);
        }
        const importedRoom = await this.ensureImportedDevicesRoom(homeId);
        const syncedAt = nowIso();
        metadata.lastSyncAt = syncedAt;
        metadata.tuyaUid = validBundle.uid;
        metadata.region = validBundle.region;
        metadata.appSchema =
            validBundle.schema ??
                this.resolveTuyaAppSchema(metadata.appSchema);
        metadata.lastSyncHint =
            providerDevices.length === 0
                ? 'No devices were returned. If your Smart Life account already has devices, link the app account to the Tuya cloud project and sync again.'
                : null;
        let syncedDevices = 0;
        for (const providerDevice of providerDevices) {
            const specifications = await this.tuyaOpenApiClient.getDeviceSpecifications(providerDevice.id, validBundle);
            const statuses = await this.tuyaOpenApiClient.getDeviceStatus(providerDevice.id, validBundle);
            await this.upsertTuyaDevice(homeId, importedRoom.id, providerDevice, specifications, statuses, syncedAt);
            syncedDevices += 1;
        }
        await this.db.transaction(async (tx) => {
            await this.db.execute(`update integration_accounts
         set metadata = $2::jsonb, updated_at = $3
         where id = $1`, [integration.id, JSON.stringify(metadata), syncedAt], tx);
            await this.insertEvent(tx, homeId, 'integration.sync.completed', 'info', {
                provider: 'tuya',
                syncedAt,
                syncedDevices,
            }, userId);
        });
        return {
            provider: 'tuya',
            homeId,
            status: 'connected',
            syncedDevices,
            syncedAt,
        };
    }
    async getSnapshot(homeId, userId) {
        await this.ensureHomeAccess(userId, homeId);
        const [home, family, members, floors, preferences, rooms, layoutBlocks, layoutItems, devices, tasks, notifications, events, integrations,] = await Promise.all([
            this.getHome(homeId),
            this.getHomeFamily(homeId),
            this.getMembers(homeId, userId),
            this.getFloors(homeId, userId),
            this.getUserPreferences(userId),
            this.getRooms(homeId, userId),
            this.getLayoutBlocks(homeId),
            this.getLayoutItems(homeId),
            this.getDevices(homeId, userId),
            this.listTasks(homeId, userId),
            this.getNotifications(homeId, userId),
            this.getEvents(homeId, userId, 0),
            this.getIntegrations(homeId, userId),
        ]);
        const capabilities = (await Promise.all(devices.map((device) => this.getCapabilities(device.id)))).flat();
        const latestStates = (await Promise.all(devices.map((device) => this.getLatestState(device.id)))).filter((item) => item !== null);
        const favoriteDevices = devices.filter((device) => preferences.favoriteDeviceIds.includes(device.id));
        const roomSummaries = rooms.map((room) => ({
            roomId: room.id,
            floorId: room.floorId ?? null,
            title: room.title,
            type: room.type,
            deviceCount: devices.filter((device) => device.roomId === room.id).length,
            taskCount: tasks.filter((task) => task.roomId === room.id).length,
        }));
        const securitySummary = {
            securityMode: home.securityMode,
            activeAlerts: events.filter((event) => event.severity === 'critical')
                .length,
            openEntries: latestStates.filter((state) => state.values.contact === true || state.values.lock === false).length,
            cameraCount: devices.filter((device) => device.category === 'camera')
                .length,
            lockCount: devices.filter((device) => device.category === 'lock').length,
        };
        const familySummary = await this.getFamilySummary(homeId);
        const alerts = events
            .filter((event) => event.severity !== 'info')
            .slice(0, 8);
        const activityFeed = events.slice(-12).reverse();
        const integrationSummary = {
            connected: integrations.filter((item) => item.status === 'connected')
                .length,
            attentionNeeded: integrations.filter((item) => item.status === 'attention_needed').length,
            providers: integrations.map((item) => item.provider),
        };
        const allowedDevicesForChild = preferences.allowedDeviceIds.length > 0
            ? devices.filter((device) => preferences.allowedDeviceIds.includes(device.id))
            : devices.filter((device) => ['light', 'climate', 'curtain', 'media'].includes(device.category));
        return {
            home,
            family,
            members,
            floors,
            preferences,
            rooms,
            layoutBlocks,
            layoutItems,
            devices,
            capabilities,
            latestStates,
            tasks,
            notifications,
            favoriteDevices: favoriteDevices.length > 0 ? favoriteDevices : devices.slice(0, 6),
            roomSummaries,
            securitySummary,
            familySummary,
            alerts,
            activityFeed,
            integrationSummary,
            allowedDevicesForChild,
            summary: {
                unreadNotifications: notifications.filter((item) => !item.readAt)
                    .length,
                pendingTasks: tasks.filter((item) => item.status !== 'approved').length,
                onlineDevices: devices.filter((item) => item.availabilityStatus === 'online').length,
                lastOffset: events.at(-1)?.offset ?? 0,
            },
            snapshotGeneratedAt: nowIso(),
        };
    }
    async getSync(homeId, userId, query) {
        const events = await this.getEvents(homeId, userId, query.afterOffset);
        return {
            homeId,
            afterOffset: query.afterOffset,
            latestOffset: events.at(-1)?.offset ?? query.afterOffset,
            events,
        };
    }
    async getAuditLogs(homeId, userId) {
        const membership = await this.ensureHomeAccess(userId, homeId);
        if (membership.role === 'guest') {
            throw (0, http_errors_1.forbidden)('audit_access_denied', 'Guests cannot inspect audit logs');
        }
        const rows = await this.db.query('select * from audit_logs where home_id = $1 order by created_at desc', [
            homeId,
        ]);
        return rows.map((row) => this.mapAuditLog(row));
    }
    async createSession(userId, deviceName, tx) {
        const sessionId = (0, id_1.uuidv7)();
        const refreshToken = (0, node_crypto_1.randomBytes)(24).toString('hex');
        const refreshTokenHash = hashToken(refreshToken);
        const createdAt = nowIso();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
        await this.db.execute(`insert into user_sessions (
        id, user_id, device_name, created_at, expires_at, revoked_at
      ) values ($1,$2,$3,$4,$5,null)`, [sessionId, userId, deviceName ?? 'RosDom Android', createdAt, expiresAt], tx);
        await this.db.execute(`insert into refresh_tokens (
        id, session_id, token_hash, issued_at, rotated_at, revoked_at
      ) values ($1,$2,$3,$4,null,null)`, [(0, id_1.uuidv7)(), sessionId, refreshTokenHash, createdAt], tx);
        return {
            accessToken: this.signAccessToken(userId, sessionId),
            refreshToken,
            sessionId,
            expiresAt,
        };
    }
    signAccessToken(userId, sessionId) {
        return this.jwtService.sign({ sub: userId, sessionId }, {
            secret: this.configService.get('JWT_ACCESS_SECRET') ??
                'rosdom-access',
            expiresIn: '1h',
        });
    }
    async getInviteByCode(code) {
        const invite = await this.db.one(`select * from family_invites where code = $1`, [
            code.trim().toUpperCase(),
        ]);
        if (!invite) {
            throw (0, http_errors_1.notFound)('family_invite_not_found', 'Invite code was not found');
        }
        if (invite.status !== 'active' ||
            new Date(invite.expires_at).getTime() < Date.now()) {
            throw (0, http_errors_1.conflict)('family_invite_expired', 'Invite code has expired');
        }
        return this.mapFamilyInvite(invite);
    }
    async attachUserToFamily(userId, invite, tx) {
        const existing = await this.db.one(`select id from family_members where user_id = $1 and status = 'active'`, [userId], tx);
        if (existing) {
            throw (0, http_errors_1.conflict)('family_member_exists', 'User already belongs to a family');
        }
        const family = await this.db.one('select owner_user_id from families where id = $1', [invite.familyId], tx);
        if (!family) {
            throw (0, http_errors_1.notFound)('family_not_found', 'Family was not found');
        }
        await this.db.execute(`insert into family_members (
        id, family_id, user_id, guardian_user_id, status, created_at
      ) values ($1,$2,$3,$4,'active',$5)`, [(0, id_1.uuidv7)(), invite.familyId, userId, family.owner_user_id, nowIso()], tx);
        await this.db.execute(`update family_invites
       set claimed_by_user_id = $2, claimed_at = $3, status = 'claimed'
       where id = $1`, [invite.id, userId, nowIso()], tx);
        const familyHomes = await this.db.query(`select id as home_id from homes where family_id = $1`, [invite.familyId], tx);
        for (const home of familyHomes) {
            await this.db.execute(`insert into home_members (id, home_id, user_id, role, status, created_at)
         values ($1,$2,$3,'member','active',$4)
         on conflict (home_id, user_id) do nothing`, [(0, id_1.uuidv7)(), home.home_id, userId, nowIso()], tx);
            await this.db.execute(`insert into reward_balances (user_id, home_id, balance, updated_at)
         values ($1,$2,0,$3)
         on conflict (user_id, home_id) do nothing`, [userId, home.home_id, nowIso()], tx);
        }
    }
    async requireFamilyMembership(userId) {
        const family = await this.getCurrentFamily(userId);
        if (!family) {
            throw (0, http_errors_1.notFound)('family_not_found', 'User does not belong to a family');
        }
        return family;
    }
    async requireOwnedFamily(userId) {
        const family = await this.requireFamilyMembership(userId);
        if (family.ownerUserId !== userId) {
            throw (0, http_errors_1.forbidden)('family_owner_required', 'Only the family owner can perform this action');
        }
        return family;
    }
    async getHomeFamily(homeId) {
        const row = await this.db.one(`select f.id, f.title, f.owner_user_id, f.created_at, f.updated_at
       from families f
       join homes h on h.family_id = f.id
       where h.id = $1`, [homeId]);
        return row ? this.mapFamily(row) : null;
    }
    async getLayoutBlocks(homeId) {
        const rows = await this.db.query(`select rlb.id, rlb.room_id, rlb.x, rlb.y, rlb.width, rlb.height, rlb.z_index
       from room_layout_blocks rlb
       join rooms r on r.id = rlb.room_id
       where r.home_id = $1
       order by rlb.z_index asc`, [homeId]);
        return rows.map((row) => this.mapLayoutBlock(row));
    }
    async getLayoutItems(homeId) {
        const rows = await this.db.query(`select li.id, li.home_id, li.room_id, r.floor_id, li.kind, li.subtype, li.title,
              li.x, li.y, li.width, li.height, li.rotation, li.metadata,
              li.created_at, li.updated_at
       from layout_items li
       join rooms r on r.id = li.room_id
       where li.home_id = $1
       order by li.created_at asc`, [homeId]);
        return rows.map((row) => this.mapLayoutItem(row));
    }
    async validateLayout(homeId, blocks, items, userId) {
        const rooms = await this.getRooms(homeId, userId);
        const roomIds = new Set(rooms.map((room) => room.id));
        const roomFloorById = new Map(rooms.map((room) => [room.id, room.floorId ?? 'unassigned']));
        for (const block of blocks) {
            if (!roomIds.has(block.roomId)) {
                throw (0, http_errors_1.conflict)('layout_room_scope_invalid', 'Layout block references a room outside the home');
            }
        }
        for (let index = 0; index < blocks.length; index += 1) {
            for (let otherIndex = index + 1; otherIndex < blocks.length; otherIndex += 1) {
                const currentFloor = roomFloorById.get(blocks[index].roomId);
                const otherFloor = roomFloorById.get(blocks[otherIndex].roomId);
                if (currentFloor === otherFloor &&
                    intersects(blocks[index], blocks[otherIndex])) {
                    throw (0, http_errors_1.conflict)('layout_overlap', 'Layout blocks cannot overlap');
                }
            }
        }
        for (const item of items) {
            const roomBlocks = blocks.filter((block) => block.roomId === item.roomId);
            const inside = roomBlocks.some((block) => item.x >= block.x &&
                item.y >= block.y &&
                item.x + item.width <= block.x + block.width &&
                item.y + item.height <= block.y + block.height);
            if (!inside) {
                throw (0, http_errors_1.conflict)('layout_item_outside_room', 'Layout item must stay inside its room');
            }
            if (item.kind === 'door' || item.kind === 'window') {
                const onPerimeter = roomBlocks.some((block) => {
                    const leftAligned = item.x === block.x;
                    const rightAligned = item.x + item.width === block.x + block.width;
                    const topAligned = item.y === block.y;
                    const bottomAligned = item.y + item.height === block.y + block.height;
                    return leftAligned || rightAligned || topAligned || bottomAligned;
                });
                if (!onPerimeter) {
                    throw (0, http_errors_1.conflict)('layout_opening_perimeter_required', 'Doors and windows must be placed on room perimeter');
                }
            }
        }
    }
    async validateTaskTarget(homeId, roomId, targetX, targetY, userId) {
        if (targetX === undefined || targetY === undefined) {
            return;
        }
        const blocks = (await this.getLayoutBlocks(homeId)).filter((block) => block.roomId === roomId);
        const inside = blocks.some((block) => targetX >= block.x &&
            targetX < block.x + block.width &&
            targetY >= block.y &&
            targetY < block.y + block.height);
        if (!inside) {
            throw (0, http_errors_1.conflict)('task_target_outside_room', 'Task marker must be inside the selected room');
        }
        await this.ensureHomeAccess(userId, homeId);
    }
    async requireTask(taskId) {
        const row = await this.db.one('select * from tasks where id = $1', [taskId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('task_not_found', 'Task was not found');
        }
        return this.mapTask(row);
    }
    async ensureDefaultFloor(homeId, executor) {
        const existing = await this.db.one(`select id, home_id, title, sort_order, created_at, updated_at
       from floors
       where home_id = $1
       order by sort_order asc, created_at asc
       limit 1`, [homeId], executor);
        if (existing) {
            const floor = this.mapFloor(existing);
            await this.db.execute('update rooms set floor_id = $2 where home_id = $1 and floor_id is null', [homeId, floor.id], executor);
            await this.db.execute('update tasks set floor_id = $2 where home_id = $1 and floor_id is null', [homeId, floor.id], executor);
            return floor;
        }
        const createdAt = nowIso();
        const floor = {
            id: (0, id_1.uuidv7)(),
            homeId,
            title: 'Основной этаж',
            sortOrder: 0,
            createdAt,
            updatedAt: createdAt,
        };
        await this.db.execute(`insert into floors (id, home_id, title, sort_order, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $5)`, [floor.id, floor.homeId, floor.title, floor.sortOrder, floor.createdAt], executor);
        await this.db.execute('update rooms set floor_id = $2 where home_id = $1 and floor_id is null', [homeId, floor.id], executor);
        await this.db.execute('update tasks set floor_id = $2 where home_id = $1 and floor_id is null', [homeId, floor.id], executor);
        return floor;
    }
    async requireFloorForHome(homeId, floorId) {
        await this.ensureDefaultFloor(homeId);
        const row = await this.db.one(`select id, home_id, title, sort_order, created_at, updated_at
       from floors
       where id = $1 and home_id = $2`, [floorId, homeId]);
        if (!row) {
            throw (0, http_errors_1.conflict)('floor_scope_invalid', 'Floor does not belong to the home');
        }
        return this.mapFloor(row);
    }
    async getRoomFloorId(homeId, roomId) {
        await this.ensureDefaultFloor(homeId);
        const row = await this.db.one('select floor_id from rooms where id = $1 and home_id = $2', [roomId, homeId]);
        if (!row) {
            throw (0, http_errors_1.notFound)('room_not_found', 'Room was not found');
        }
        if (row.floor_id) {
            return row.floor_id;
        }
        const defaultFloor = await this.ensureDefaultFloor(homeId);
        await this.db.execute('update rooms set floor_id = $2 where id = $1', [
            roomId,
            defaultFloor.id,
        ]);
        return defaultFloor.id;
    }
    async getFamilySummary(homeId) {
        const rows = await this.db.query(`select u.account_mode
       from home_members hm
       join users u on u.id = hm.user_id
       where hm.home_id = $1 and hm.status = 'active'`, [homeId]);
        return {
            totalMembers: rows.length,
            adults: rows.filter((row) => row.account_mode === 'adult').length,
            children: rows.filter((row) => row.account_mode === 'child').length,
            elderly: rows.filter((row) => row.account_mode === 'elderly').length,
        };
    }
    async insertEvent(executor, homeId, topic, severity, payload, userId) {
        const eventId = (0, id_1.uuidv7)();
        const createdAt = nowIso();
        await this.db.execute(`insert into events (
        id, home_id, room_id, device_id, user_id, topic, severity, payload, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
            eventId,
            homeId,
            typeof payload.roomId === 'string' ? payload.roomId : null,
            typeof payload.deviceId === 'string' ? payload.deviceId : null,
            userId ?? null,
            topic,
            severity,
            JSON.stringify(payload),
            createdAt,
        ], executor);
        const row = await this.db.one(`select id, home_id, room_id, device_id, user_id, topic, severity, payload, created_at, event_offset
       from events where id = $1`, [eventId], executor);
        if (!row) {
            return null;
        }
        const mapped = this.mapEvent(row);
        this.realtimeService.publish({
            eventId: mapped.id,
            schemaVersion: 1,
            homeId: mapped.homeId,
            topic: mapped.topic,
            offset: mapped.offset,
            occurredAt: mapped.createdAt,
            correlationId: typeof mapped.payload.correlationId === 'string'
                ? mapped.payload.correlationId
                : mapped.id,
            data: mapped.payload,
        });
        return mapped;
    }
    async writeAudit(executor, actorUserId, homeId, targetType, targetId, action, reason) {
        const payloadHash = hashToken(`${actorUserId}:${homeId ?? 'none'}:${targetType}:${targetId}:${action}:${reason}`);
        await this.db.execute(`insert into audit_logs (
        id, actor_user_id, home_id, target_type, target_id, action, reason, payload_hash, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
            (0, id_1.uuidv7)(),
            actorUserId,
            homeId,
            targetType,
            targetId,
            action,
            reason,
            payloadHash,
            nowIso(),
        ], executor);
    }
    normalizeTuyaRegion(value) {
        const normalized = value?.trim().toLowerCase();
        if (normalized === 'eu' ||
            normalized === 'us' ||
            normalized === 'cn' ||
            normalized === 'in') {
            return normalized;
        }
        const fallback = this.configService
            .get('TUYA_DEFAULT_REGION')
            ?.trim()
            .toLowerCase();
        if (fallback === 'eu' ||
            fallback === 'us' ||
            fallback === 'cn' ||
            fallback === 'in') {
            return fallback;
        }
        return 'eu';
    }
    resolveTuyaAppSchema(value) {
        const normalized = value?.trim();
        if (normalized) {
            return normalized;
        }
        const configured = this.configService.get('TUYA_ASSOCIATED_APP_SCHEMA')?.trim() ??
            this.configService.get('TUYA_APP_SCHEMA')?.trim();
        if (configured) {
            return configured;
        }
        return 'tuyaSmart';
    }
    isTuyaVendor(vendor) {
        const normalized = vendor.trim().toLowerCase();
        return (normalized === 'tuya' ||
            normalized === 'smart life' ||
            normalized === 'smartlife');
    }
    renderTuyaCallbackPage({ sessionId, status, message, }) {
        const deepLinkBase = this.configService.get('ROSDOM_APP_DEEP_LINK_URL')?.trim() ??
            'ru.rosdom://integrations/tuya/callback';
        let deepLink = deepLinkBase;
        try {
            const url = new URL(deepLinkBase);
            url.searchParams.set('status', status);
            if (sessionId) {
                url.searchParams.set('sessionId', sessionId);
            }
            url.searchParams.set('message', message);
            deepLink = url.toString();
        }
        catch {
            const separator = deepLinkBase.includes('?') ? '&' : '?';
            deepLink =
                `${deepLinkBase}${separator}` +
                    `status=${encodeURIComponent(status)}` +
                    (sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : '') +
                    `&message=${encodeURIComponent(message)}`;
        }
        const escapedMessage = escapeHtml(message);
        const escapedDeepLink = escapeHtml(deepLink);
        const statusLabel = status === 'linked'
            ? 'Smart Life подключен'
            : status === 'expired'
                ? 'Сессия истекла'
                : 'Подключение не завершено';
        return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(statusLabel)} · РосДом</title>
    <style>
      :root { color-scheme: dark light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Inter, Arial, sans-serif;
        background: #0c1017;
        color: #f8f8fb;
      }
      .card {
        width: min(92vw, 480px);
        border-radius: 28px;
        padding: 28px;
        background:
          linear-gradient(140deg, rgba(137, 63, 255, 0.28), rgba(255, 89, 196, 0.18)),
          rgba(18, 22, 31, 0.92);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }
      h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.15; }
      p { margin: 0 0 18px; line-height: 1.5; color: rgba(248, 248, 251, 0.8); }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 700;
        background: #ffffff;
        color: #11151d;
      }
      .hint {
        margin-top: 16px;
        font-size: 13px;
        color: rgba(248, 248, 251, 0.62);
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${escapeHtml(statusLabel)}</h1>
      <p>${escapedMessage}</p>
      <a href="${escapedDeepLink}">Вернуться в РосДом</a>
      <div class="hint">${escapedDeepLink}</div>
    </div>
    <script>
      const target = ${JSON.stringify(deepLink)};
      window.setTimeout(() => { window.location.href = target; }, 250);
    </script>
  </body>
</html>`;
    }
    async failTuyaLinkSession(sessionId, failureCode, failureMessage, status = 'failed') {
        const updatedAt = nowIso();
        await this.db.execute(`update integration_link_sessions
          set status = $2,
              failure_code = $3,
              failure_message = $4,
              updated_at = $5
        where id = $1`, [sessionId, status, failureCode, failureMessage, updatedAt]);
    }
    async upsertConnectedTuyaIntegration(homeId, actorUserId, accountLabel, tokenBundle, linkSessionId, metadataExtras = {}) {
        const existing = await this.db.one(`select id, metadata, created_at, updated_at
         from integration_accounts
        where home_id = $1 and provider = 'tuya'
        limit 1`, [homeId]);
        const integrationId = existing?.id ?? (0, id_1.uuidv7)();
        const currentTime = nowIso();
        const encrypted = this.integrationCredentialsService.encrypt(tokenBundle);
        const previousMetadata = parseRecord(existing?.metadata);
        const metadata = {
            ...previousMetadata,
            ...metadataExtras,
            accountLabel,
            region: tokenBundle.region,
            tuyaUid: tokenBundle.uid,
            appSchema: tokenBundle.schema ?? metadataExtras.appSchema ?? null,
            linkSessionId,
            stack: ['tuya', 'smart_life'],
            lastLinkedAt: currentTime,
            lastSyncAt: typeof previousMetadata.lastSyncAt === 'string'
                ? previousMetadata.lastSyncAt
                : null,
        };
        await this.db.transaction(async (tx) => {
            if (existing) {
                await this.db.execute(`update integration_accounts
              set status = 'connected',
                  encrypted_credentials = $2,
                  metadata = $3::jsonb,
                  updated_at = $4
            where id = $1`, [integrationId, encrypted, JSON.stringify(metadata), currentTime], tx);
            }
            else {
                await this.db.execute(`insert into integration_accounts (
              id, home_id, provider, status, encrypted_credentials, metadata, created_at, updated_at
            ) values ($1, $2, 'tuya', 'connected', $3, $4::jsonb, $5, $5)`, [
                    integrationId,
                    homeId,
                    encrypted,
                    JSON.stringify(metadata),
                    currentTime,
                ], tx);
            }
            await this.writeAudit(tx, actorUserId, homeId, 'integration', integrationId, 'integration.connect', 'Connected Smart Life / Tuya cloud account');
        });
        return ((await this.getIntegrations(homeId, actorUserId)).find((item) => item.id === integrationId) ?? {
            id: integrationId,
            homeId,
            provider: 'tuya',
            status: 'connected',
            metadata,
            createdAt: existing?.created_at ?? currentTime,
            updatedAt: currentTime,
        });
    }
    async ensureValidTuyaTokenBundle(integrationId, credentials, metadata) {
        const expiresAt = new Date(credentials.expiresAt).getTime();
        const refreshThreshold = Date.now() + 2 * 60 * 1000;
        if (Number.isFinite(expiresAt) && expiresAt > refreshThreshold) {
            return credentials;
        }
        try {
            const refreshed = await this.tuyaOpenApiClient.refreshAccessToken(credentials);
            metadata.lastRefreshAt = nowIso();
            metadata.region = refreshed.region;
            metadata.tuyaUid = refreshed.uid;
            metadata.appSchema =
                refreshed.schema ??
                    this.resolveTuyaAppSchema(metadata.appSchema);
            await this.db.execute(`update integration_accounts
            set status = 'connected',
                encrypted_credentials = $2,
                metadata = $3::jsonb,
                updated_at = $4
          where id = $1`, [
                integrationId,
                this.integrationCredentialsService.encrypt(refreshed),
                JSON.stringify(metadata),
                nowIso(),
            ]);
            return refreshed;
        }
        catch (error) {
            const failureMessage = error instanceof Error
                ? error.message
                : 'Failed to refresh Tuya access token';
            metadata.lastRefreshFailureAt = nowIso();
            metadata.lastRefreshFailure = failureMessage;
            await this.db.execute(`update integration_accounts
            set status = 'attention_needed',
                metadata = $2::jsonb,
                updated_at = $3
          where id = $1`, [integrationId, JSON.stringify(metadata), nowIso()]);
            throw (0, http_errors_1.conflict)('integration_refresh_failed', `Tuya token refresh failed: ${failureMessage}`);
        }
    }
    async ensureImportedDevicesRoom(homeId) {
        const floor = await this.ensureDefaultFloor(homeId);
        const existing = await this.db.one(`select id, home_id, floor_id, title, type, sort_order, updated_at
         from rooms
        where home_id = $1 and type = 'imported'
        order by created_at asc
        limit 1`, [homeId]);
        if (existing) {
            if (!existing.floor_id) {
                await this.db.execute('update rooms set floor_id = $2 where id = $1', [
                    existing.id,
                    floor.id,
                ]);
                existing.floor_id = floor.id;
            }
            return this.mapRoom(existing);
        }
        const currentTime = nowIso();
        const orderRow = await this.db.one('select count(*)::int as count from rooms where home_id = $1', [homeId]);
        const created = {
            id: (0, id_1.uuidv7)(),
            homeId,
            floorId: floor.id,
            title: 'Импортированные устройства',
            type: 'imported',
            sortOrder: Number(orderRow?.count ?? 0),
            updatedAt: currentTime,
        };
        await this.db.execute(`insert into rooms (id, home_id, floor_id, title, type, sort_order, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $7)`, [
            created.id,
            created.homeId,
            created.floorId,
            created.title,
            created.type,
            created.sortOrder,
            currentTime,
        ]);
        return created;
    }
    async upsertTuyaDevice(homeId, fallbackRoomId, providerDevice, specifications, statuses, syncedAt) {
        const existing = await this.db.one(`select id, room_id
         from devices
        where home_id = $1 and external_device_ref = $2 and connection_type = 'cloud'
        limit 1`, [homeId, providerDevice.id]);
        const deviceId = existing?.id ?? (0, id_1.uuidv7)();
        const category = this.mapTuyaCategory(providerDevice.category, specifications);
        const capabilityRecords = this.mapTuyaCapabilities(specifications, statuses);
        const snapshotValues = this.mapTuyaSnapshotValues(providerDevice, statuses);
        const availabilityStatus = providerDevice.online ? 'online' : 'offline';
        const roomId = existing?.room_id ?? fallbackRoomId;
        const model = providerDevice.model?.trim() ||
            providerDevice.productName.trim() ||
            'Smart Device';
        await this.db.transaction(async (tx) => {
            if (existing) {
                await this.db.execute(`update devices
              set name = $2,
                  category = $3,
                  vendor = $4,
                  model = $5,
                  transport_mode = 'cloud',
                  availability_status = $6,
                  last_seen_at = $7,
                  updated_at = $7
            where id = $1`, [
                    deviceId,
                    providerDevice.name,
                    category,
                    'smart life',
                    model,
                    availabilityStatus,
                    syncedAt,
                ], tx);
            }
            else {
                await this.db.execute(`insert into devices (
              id, home_id, room_id, name, category, vendor, model,
              connection_type, transport_mode, external_device_ref,
              availability_status, last_seen_at, created_at, updated_at
            ) values ($1, $2, $3, $4, $5, $6, $7, 'cloud', 'cloud', $8, $9, $10, $10, $10)`, [
                    deviceId,
                    homeId,
                    roomId,
                    providerDevice.name,
                    category,
                    'smart life',
                    model,
                    providerDevice.id,
                    availabilityStatus,
                    syncedAt,
                ], tx);
            }
            await this.db.execute('delete from device_capabilities where device_id = $1 and source = $2', [deviceId, 'tuya'], tx);
            for (const capability of capabilityRecords) {
                await this.db.execute(`insert into device_capabilities (
              id, device_id, key, type, readable, writable, unit,
              range_min, range_max, step, allowed_options, validation_rules,
              source, last_sync_at, freshness, quality, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$14)
            on conflict (device_id, key) do update
                set type = excluded.type,
                    readable = excluded.readable,
                    writable = excluded.writable,
                    unit = excluded.unit,
                    range_min = excluded.range_min,
                    range_max = excluded.range_max,
                    step = excluded.step,
                    allowed_options = excluded.allowed_options,
                    validation_rules = excluded.validation_rules,
                    source = excluded.source,
                    last_sync_at = excluded.last_sync_at,
                    freshness = excluded.freshness,
                    quality = excluded.quality`, [
                    (0, id_1.uuidv7)(),
                    deviceId,
                    capability.key,
                    capability.type,
                    capability.readable,
                    capability.writable,
                    capability.unit,
                    capability.rangeMin,
                    capability.rangeMax,
                    capability.step,
                    JSON.stringify(capability.allowedOptions),
                    JSON.stringify(capability.validationRules),
                    capability.source,
                    syncedAt,
                    capability.freshness,
                    capability.quality,
                ], tx);
            }
            await this.db.execute(`insert into device_state_snapshots (
            id, device_id, observed_at, source, values, created_at
          ) values ($1, $2, $3, 'tuya', $4::jsonb, $3)`, [(0, id_1.uuidv7)(), deviceId, syncedAt, JSON.stringify(snapshotValues)], tx);
        });
    }
    async dispatchTuyaCommand(user, details, command) {
        const integration = await this.db.one(`select id, encrypted_credentials, metadata
         from integration_accounts
        where home_id = $1 and provider = 'tuya'
        limit 1`, [details.device.homeId]);
        if (!integration) {
            throw (0, http_errors_1.notFound)('integration_not_found', 'Tuya integration is not connected for this home');
        }
        const credentials = this.integrationCredentialsService.decrypt(integration.encrypted_credentials);
        if (!credentials) {
            throw (0, http_errors_1.conflict)('integration_credentials_missing', 'Tuya integration does not have stored provider credentials');
        }
        const metadata = parseRecord(integration.metadata);
        const validBundle = await this.ensureValidTuyaTokenBundle(integration.id, credentials, metadata);
        const providerCommands = this.buildTuyaCommands(details, command);
        try {
            const dispatchedAt = nowIso();
            await this.db.execute(`update command_logs
            set delivery_status = 'dispatched',
                external_command_ref = $2
          where id = $1`, [command.id, command.id]);
            await this.tuyaOpenApiClient.sendDeviceCommands(details.device.externalDeviceRef, providerCommands, validBundle);
            const statuses = await this.tuyaOpenApiClient.getDeviceStatus(details.device.externalDeviceRef, validBundle);
            const snapshotValues = this.mapTuyaSnapshotValues({
                online: details.device.availabilityStatus === 'online' ||
                    details.device.availabilityStatus === 'degraded',
            }, statuses);
            await this.db.transaction(async (tx) => {
                await this.db.execute(`insert into device_state_snapshots (
              id, device_id, observed_at, source, values, created_at
            ) values ($1, $2, $3, 'tuya', $4::jsonb, $3)`, [
                    (0, id_1.uuidv7)(),
                    details.device.id,
                    dispatchedAt,
                    JSON.stringify(snapshotValues),
                ], tx);
                await this.db.execute(`update devices
              set availability_status = $2,
                  last_seen_at = $3,
                  updated_at = $3
            where id = $1`, [
                    details.device.id,
                    snapshotValues.onlineState === false ? 'offline' : 'online',
                    dispatchedAt,
                ], tx);
                await this.db.execute(`update command_logs
              set delivery_status = 'acknowledged',
                  acknowledged_at = $2,
                  reconciled_at = $2
            where id = $1`, [command.id, dispatchedAt], tx);
                await this.insertEvent(tx, details.device.homeId, 'device.command.acknowledged', 'info', {
                    commandId: command.id,
                    deviceId: details.device.id,
                    capabilityKey: command.capabilityKey,
                }, user.id);
                await this.insertEvent(tx, details.device.homeId, 'device.state.changed', 'info', {
                    deviceId: details.device.id,
                    roomId: details.device.roomId,
                    values: snapshotValues,
                }, user.id);
            });
            command.deliveryStatus = 'acknowledged';
            command.externalCommandRef = command.id;
            command.acknowledgedAt = dispatchedAt;
            command.reconciledAt = dispatchedAt;
            return command;
        }
        catch (error) {
            const failureReason = error instanceof Error ? error.message : 'Tuya command dispatch failed';
            await this.db.transaction(async (tx) => {
                await this.db.execute(`update command_logs
              set delivery_status = 'rejected',
                  failure_reason = $2
            where id = $1`, [command.id, failureReason], tx);
                await this.insertEvent(tx, details.device.homeId, 'device.command.failed', 'warning', {
                    commandId: command.id,
                    deviceId: details.device.id,
                    capabilityKey: command.capabilityKey,
                    reason: failureReason,
                }, user.id);
            });
            command.deliveryStatus = 'rejected';
            command.failureReason = failureReason;
            return command;
        }
    }
    buildTuyaCommands(details, command) {
        const capability = details.capabilities.find((item) => item.key === command.capabilityKey);
        const sourceCode = capability?.validationRules &&
            typeof capability.validationRules.sourceCode === 'string'
            ? capability.validationRules.sourceCode
            : null;
        const commandCode = sourceCode ??
            this.defaultTuyaCommandCode(command.capabilityKey, details.device.category);
        return [
            {
                code: commandCode,
                value: this.normalizeTuyaCommandValue(command.capabilityKey, command.requestedValue),
            },
        ];
    }
    defaultTuyaCommandCode(capabilityKey, category) {
        switch (capabilityKey) {
            case 'power':
                return category === 'light' ? 'switch_led' : 'switch_1';
            case 'brightness':
                return 'bright_value_v2';
            case 'colorTemperature':
                return 'temp_value_v2';
            case 'rgb':
                return 'colour_data_v2';
            case 'onlineState':
                return 'online';
            default:
                return capabilityKey;
        }
    }
    normalizeTuyaCommandValue(capabilityKey, requestedValue) {
        switch (capabilityKey) {
            case 'power':
            case 'onlineState':
                return Boolean(requestedValue);
            case 'brightness':
            case 'colorTemperature':
                return typeof requestedValue === 'number'
                    ? Math.round(requestedValue)
                    : requestedValue;
            default:
                return requestedValue;
        }
    }
    mapTuyaCategory(rawCategory, specifications) {
        const category = rawCategory.trim().toLowerCase();
        if (category.includes('light') ||
            category === 'dj' ||
            category === 'dd' ||
            specifications.some((item) => [
                'switch_led',
                'bright_value',
                'bright_value_v2',
                'temp_value',
                'temp_value_v2',
                'colour_data',
                'colour_data_v2',
            ].includes(item.code))) {
            return 'light';
        }
        if (category.includes('socket') ||
            category.includes('plug') ||
            category === 'cz' ||
            category === 'kg' ||
            specifications.some((item) => ['switch', 'switch_1', 'switch_2'].includes(item.code))) {
            return 'plug';
        }
        return 'other';
    }
    mapTuyaCapabilities(specifications, statuses) {
        const capabilities = new Map();
        for (const specification of specifications) {
            const mappedKey = this.mapTuyaCapabilityKey(specification.code);
            if (!mappedKey) {
                continue;
            }
            const values = this.parseTuyaValues(specification.values);
            capabilities.set(mappedKey, {
                key: mappedKey,
                type: this.mapTuyaCapabilityType(mappedKey),
                readable: true,
                writable: mappedKey !== 'onlineState',
                unit: mappedKey === 'colorTemperature'
                    ? 'K'
                    : mappedKey === 'brightness'
                        ? '%'
                        : null,
                rangeMin: this.readNumber(values.min),
                rangeMax: this.readNumber(values.max),
                step: this.readNumber(values.step) ?? (mappedKey === 'power' ? 1 : null),
                allowedOptions: Array.isArray(values.range)
                    ? values.range.filter((item) => typeof item === 'string')
                    : null,
                validationRules: {
                    sourceCode: specification.code,
                    values,
                },
                source: 'tuya',
                freshness: 'fresh',
                quality: 'good',
            });
        }
        if (!capabilities.has('onlineState')) {
            capabilities.set('onlineState', {
                key: 'onlineState',
                type: 'boolean',
                readable: true,
                writable: false,
                unit: null,
                rangeMin: null,
                rangeMax: null,
                step: null,
                allowedOptions: null,
                validationRules: {
                    sourceCode: 'online',
                },
                source: 'tuya',
                freshness: 'fresh',
                quality: 'good',
            });
        }
        for (const status of statuses) {
            const mappedKey = this.mapTuyaCapabilityKey(status.code);
            if (!mappedKey || capabilities.has(mappedKey)) {
                continue;
            }
            capabilities.set(mappedKey, {
                key: mappedKey,
                type: this.mapTuyaCapabilityType(mappedKey),
                readable: true,
                writable: mappedKey !== 'onlineState',
                unit: null,
                rangeMin: null,
                rangeMax: null,
                step: null,
                allowedOptions: null,
                validationRules: {
                    sourceCode: status.code,
                },
                source: 'tuya',
                freshness: 'fresh',
                quality: 'uncertain',
            });
        }
        return [...capabilities.values()];
    }
    mapTuyaSnapshotValues(providerDevice, statuses) {
        const values = {
            onlineState: providerDevice.online,
        };
        for (const status of statuses) {
            const key = this.mapTuyaCapabilityKey(status.code);
            if (!key) {
                continue;
            }
            values[key] = this.normalizeTuyaStatusValue(key, status.value);
        }
        return values;
    }
    mapTuyaCapabilityKey(code) {
        switch (code) {
            case 'switch_led':
            case 'switch':
            case 'switch_1':
            case 'switch_2':
                return 'power';
            case 'bright_value':
            case 'bright_value_v2':
                return 'brightness';
            case 'temp_value':
            case 'temp_value_v2':
                return 'colorTemperature';
            case 'colour_data':
            case 'colour_data_v2':
            case 'color_data':
            case 'color_data_v2':
                return 'rgb';
            case 'online':
                return 'onlineState';
            default:
                return null;
        }
    }
    mapTuyaCapabilityType(key) {
        switch (key) {
            case 'power':
            case 'onlineState':
                return 'boolean';
            case 'brightness':
            case 'colorTemperature':
                return 'integer';
            case 'rgb':
                return 'color';
            default:
                return 'string';
        }
    }
    normalizeTuyaStatusValue(key, value) {
        switch (key) {
            case 'power':
            case 'onlineState':
                return typeof value === 'boolean'
                    ? value
                    : typeof value === 'string'
                        ? value.trim().toLowerCase() === 'true'
                        : Boolean(value);
            case 'brightness':
            case 'colorTemperature':
                return typeof value === 'number'
                    ? value
                    : (this.readNumber(value) ?? value);
            case 'rgb':
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    }
                    catch {
                        return value;
                    }
                }
                return value;
            default:
                return value;
        }
    }
    parseTuyaValues(value) {
        if (!value) {
            return {};
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return typeof parsed === 'object' && parsed !== null
                    ? parsed
                    : {};
            }
            catch {
                return {};
            }
        }
        return value;
    }
    readNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
    mapFamily(row) {
        return {
            id: row.id,
            title: row.title,
            ownerUserId: row.owner_user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapFamilyMember(row) {
        return {
            id: row.id,
            familyId: row.family_id,
            userId: row.user_id,
            guardianUserId: row.guardian_user_id,
            status: row.status,
            createdAt: row.created_at,
        };
    }
    mapFamilyInvite(row) {
        return {
            id: row.id,
            familyId: row.family_id,
            code: row.code,
            targetAccountMode: row.target_account_mode,
            createdByUserId: row.created_by_user_id,
            claimedByUserId: row.claimed_by_user_id,
            status: row.status,
            expiresAt: row.expires_at,
            claimedAt: row.claimed_at,
            createdAt: row.created_at,
        };
    }
    mapHome(row) {
        return {
            id: row.id,
            familyId: row.family_id,
            title: row.title,
            addressLabel: row.address_label,
            timezone: row.timezone,
            ownerUserId: row.owner_user_id,
            currentMode: row.current_mode,
            securityMode: row.security_mode,
            updatedAt: row.updated_at,
            layoutRevision: row.layout_revision,
        };
    }
    mapHomeMember(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            userId: row.user_id,
            role: row.role,
            status: row.status,
            createdAt: row.created_at,
        };
    }
    mapRoom(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            floorId: row.floor_id,
            title: row.title,
            type: row.type,
            sortOrder: row.sort_order,
            updatedAt: row.updated_at,
        };
    }
    mapLayoutBlock(row) {
        return {
            id: row.id,
            roomId: row.room_id,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            zIndex: row.z_index,
        };
    }
    mapLayoutItem(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            roomId: row.room_id,
            floorId: row.floor_id,
            kind: row.kind,
            subtype: row.subtype,
            title: row.title,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            rotation: row.rotation,
            metadata: parseRecord(row.metadata),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapTask(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            familyId: row.family_id,
            floorId: row.floor_id,
            roomId: row.room_id,
            assigneeUserId: row.assignee_user_id,
            createdByUserId: row.created_by_user_id,
            approvedByUserId: row.approved_by_user_id,
            title: row.title,
            description: row.description,
            rewardType: row.reward_type,
            rewardValue: row.reward_value,
            rewardDescription: row.reward_description,
            targetX: row.target_x,
            targetY: row.target_y,
            status: row.status,
            deadlineAt: row.deadline_at,
            submittedAt: row.submitted_at,
            approvedAt: row.approved_at,
            rejectedAt: row.rejected_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapFloor(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            title: row.title,
            sortOrder: row.sort_order,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapUserPreferences(row) {
        return {
            userId: row.user_id,
            favoriteDeviceIds: parseStringArray(row.favorite_device_ids),
            allowedDeviceIds: parseStringArray(row.allowed_device_ids),
            pinnedSections: parseStringArray(row.pinned_sections),
            preferredHomeTab: row.preferred_home_tab,
            uiDensity: row.ui_density,
            themeMode: row.theme_mode,
            motionMode: row.motion_mode,
            activeFloorId: row.active_floor_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapRewardBalance(row) {
        return {
            userId: row.user_id,
            homeId: row.home_id,
            balance: row.balance,
            updatedAt: row.updated_at,
        };
    }
    mapRewardLedgerEntry(row) {
        return {
            id: row.id,
            userId: row.user_id,
            homeId: row.home_id,
            taskId: row.task_id,
            delta: row.delta,
            entryType: row.entry_type,
            description: row.description,
            createdAt: row.created_at,
        };
    }
    mapDevice(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            roomId: row.room_id,
            name: row.name,
            category: row.category,
            vendor: row.vendor,
            model: row.model,
            connectionType: row.connection_type,
            transportMode: row.transport_mode,
            externalDeviceRef: row.external_device_ref,
            availabilityStatus: row.availability_status,
            lastSeenAt: row.last_seen_at,
            updatedAt: row.updated_at,
        };
    }
    mapCapability(row) {
        return {
            id: row.id,
            deviceId: row.device_id,
            key: row.key,
            type: row.type,
            readable: row.readable,
            writable: row.writable,
            unit: row.unit,
            rangeMin: row.range_min,
            rangeMax: row.range_max,
            step: row.step,
            allowedOptions: row.allowed_options,
            validationRules: row.validation_rules,
            source: row.source,
            lastSyncAt: row.last_sync_at,
            freshness: row.freshness,
            quality: row.quality,
        };
    }
    mapSnapshot(row) {
        return {
            id: row.id,
            deviceId: row.device_id,
            observedAt: row.observed_at,
            source: row.source,
            values: row.values,
        };
    }
    mapCommand(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            deviceId: row.device_id,
            capabilityKey: row.capability_key,
            requestedValue: typeof row.requested_value === 'string'
                ? JSON.parse(row.requested_value)
                : row.requested_value,
            requestedAt: row.requested_at,
            actorUserId: row.actor_user_id,
            idempotencyKey: row.idempotency_key,
            deliveryStatus: row.delivery_status,
            failureReason: row.failure_reason,
            externalCommandRef: row.external_command_ref,
            acknowledgedAt: row.acknowledged_at,
            reconciledAt: row.reconciled_at,
        };
    }
    mapFirmware(row) {
        return {
            id: row.id,
            deviceId: row.device_id,
            version: row.version,
            channel: row.channel,
            recordedAt: row.recorded_at,
        };
    }
    mapDeviceMediaAsset(row) {
        return {
            id: row.id,
            vendor: row.vendor,
            model: row.model,
            sourceUrl: row.source_url,
            imageUrl: row.image_url,
            licenseNote: row.license_note,
            createdAt: row.created_at,
        };
    }
    mapEvent(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            roomId: row.room_id,
            deviceId: row.device_id,
            userId: row.user_id,
            topic: row.topic,
            severity: row.severity,
            payload: row.payload,
            createdAt: row.created_at,
            offset: row.event_offset,
        };
    }
    mapNotification(row) {
        return {
            id: row.id,
            userId: row.user_id,
            homeId: row.home_id,
            eventId: row.event_id,
            type: row.type,
            title: row.title,
            body: row.body,
            readAt: row.read_at,
            createdAt: row.created_at,
        };
    }
    mapAuditLog(row) {
        return {
            id: row.id,
            actorUserId: row.actor_user_id,
            homeId: row.home_id,
            targetType: row.target_type,
            targetId: row.target_id,
            action: row.action,
            reason: row.reason,
            payloadHash: row.payload_hash,
            createdAt: row.created_at,
        };
    }
    mapIntegration(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            provider: row.provider,
            status: row.status,
            metadata: parseRecord(row.metadata),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapTuyaLinkSession(row) {
        return {
            id: row.id,
            homeId: row.home_id,
            provider: row.provider,
            status: row.status,
            accountLabel: row.account_label,
            region: row.region,
            userCode: row.user_code,
            authorizationUrl: row.authorization_url ?? row.verification_uri,
            verificationUri: row.verification_uri,
            expiresAt: row.expires_at,
            integrationId: row.integration_account_id,
            failureCode: row.failure_code,
            failureMessage: row.failure_message,
            linkedAt: row.linked_at,
            createdByUserId: row.created_by_user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = PlatformService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService,
        config_1.ConfigService,
        realtime_service_1.RealtimeService,
        integration_credentials_service_1.IntegrationCredentialsService,
        tuya_open_api_client_1.TuyaOpenApiClient])
], PlatformService);
//# sourceMappingURL=platform.service.js.map