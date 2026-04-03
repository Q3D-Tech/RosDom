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
exports.DemoService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const http_errors_1 = require("../common/http/http-errors");
const id_1 = require("../common/platform/id");
const realtime_service_1 = require("../realtime/realtime.service");
const DEMO_EMAIL = 'alexey@rosdom.local';
const DEMO_PASSWORD = 'rosdom-demo';
function nowIso() {
    return new Date().toISOString();
}
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
function intersects(a, b) {
    return (a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y);
}
let DemoService = class DemoService {
    jwtService;
    configService;
    realtimeService;
    users = new Map();
    sessions = new Map();
    homes = new Map();
    members = new Map();
    rooms = new Map();
    layoutBlocks = new Map();
    deviceAnchors = new Map();
    devices = new Map();
    capabilities = new Map();
    snapshots = new Map();
    firmwareRecords = new Map();
    commands = new Map();
    scenarios = new Map();
    events = new Map();
    notifications = new Map();
    integrations = new Map();
    pairingSessions = new Map();
    auditLogs = new Map();
    eventOffset = 0;
    constructor(jwtService, configService, realtimeService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.realtimeService = realtimeService;
        this.seed();
    }
    authenticateSession(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.userId !== userId || session.revokedAt) {
            throw (0, http_errors_1.unauthorized)('session_invalid', 'Session is no longer active');
        }
        const user = this.getUser(userId);
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
    login(email, password, deviceName) {
        if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
            throw (0, http_errors_1.unauthorized)('invalid_credentials', 'Email or password is incorrect');
        }
        const user = this.findUserByEmail(email);
        const refreshToken = (0, node_crypto_1.randomUUID)();
        const sessionId = (0, id_1.uuidv7)();
        const issuedAt = nowIso();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
        this.sessions.set(sessionId, {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: hashToken(refreshToken),
            deviceName: deviceName ?? 'Android demo device',
            createdAt: issuedAt,
            expiresAt,
            revokedAt: null,
        });
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, sessionId }, {
            secret: this.configService.get('JWT_ACCESS_SECRET') ??
                'rosdom-access',
            expiresIn: '1h',
        });
        return {
            accessToken,
            refreshToken,
            sessionId,
            expiresAt,
            user,
        };
    }
    refresh(refreshToken) {
        const refreshHash = hashToken(refreshToken);
        const session = [...this.sessions.values()].find((candidate) => candidate.refreshTokenHash === refreshHash && !candidate.revokedAt);
        if (!session) {
            throw (0, http_errors_1.unauthorized)('invalid_refresh_token', 'Refresh token is invalid');
        }
        const rotatedToken = (0, node_crypto_1.randomUUID)();
        session.refreshTokenHash = hashToken(rotatedToken);
        const user = this.getUser(session.userId);
        const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, sessionId: session.id }, {
            secret: this.configService.get('JWT_ACCESS_SECRET') ??
                'rosdom-access',
            expiresIn: '1h',
        });
        return {
            accessToken,
            refreshToken: rotatedToken,
            sessionId: session.id,
            expiresAt: session.expiresAt,
            user,
        };
    }
    logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.revokedAt = nowIso();
        }
    }
    getUser(userId) {
        const user = this.users.get(userId);
        if (!user) {
            throw (0, http_errors_1.notFound)('user_not_found', 'User was not found');
        }
        return user;
    }
    findUserByEmail(email) {
        const user = [...this.users.values()].find((candidate) => candidate.email === email);
        if (!user) {
            throw (0, http_errors_1.notFound)('user_not_found', 'User was not found');
        }
        return user;
    }
    getHomesForUser(userId) {
        const membershipHomeIds = [...this.members.values()]
            .filter((member) => member.userId === userId && member.status !== 'revoked')
            .map((member) => member.homeId);
        return membershipHomeIds.map((homeId) => this.getHome(homeId));
    }
    createHome(userId, dto) {
        const home = {
            id: (0, id_1.uuidv7)(),
            title: dto.title,
            addressLabel: dto.addressLabel,
            timezone: dto.timezone,
            ownerUserId: userId,
            currentMode: 'home',
            securityMode: 'disarmed',
            updatedAt: nowIso(),
            layoutRevision: 0,
        };
        this.homes.set(home.id, home);
        const member = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            userId,
            role: 'owner',
            status: 'active',
            createdAt: nowIso(),
        };
        this.members.set(member.id, member);
        this.appendEvent(home.id, 'home.state.updated', 'info', { homeId: home.id }, userId);
        return home;
    }
    getHome(homeId) {
        const home = this.homes.get(homeId);
        if (!home) {
            throw (0, http_errors_1.notFound)('home_not_found', 'Home was not found');
        }
        return home;
    }
    ensureHomeAccess(userId, homeId) {
        const membership = [...this.members.values()].find((member) => member.homeId === homeId &&
            member.userId === userId &&
            member.status !== 'revoked');
        if (!membership) {
            throw (0, http_errors_1.forbidden)('home_access_denied', 'User does not belong to this home');
        }
        return membership;
    }
    updateHomeState(userId, homeId, dto) {
        this.ensureHomeAccess(userId, homeId);
        const home = this.getHome(homeId);
        if (dto.currentMode) {
            home.currentMode = dto.currentMode;
        }
        if (dto.securityMode) {
            home.securityMode = dto.securityMode;
        }
        home.updatedAt = nowIso();
        this.appendEvent(home.id, 'home.state.updated', 'info', dto, userId);
        return home;
    }
    getMembers(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.members.values()].filter((member) => member.homeId === homeId);
    }
    inviteMember(actorUserId, dto) {
        const membership = this.ensureHomeAccess(actorUserId, dto.homeId);
        if (membership.role === 'guest') {
            throw (0, http_errors_1.forbidden)('member_invite_denied', 'Guests cannot invite members');
        }
        const user = this.users.get(dto.userId);
        if (!user) {
            throw (0, http_errors_1.notFound)('invitee_not_found', 'Invitee user is not present in demo directory');
        }
        const existing = [...this.members.values()].find((member) => member.homeId === dto.homeId && member.userId === user.id);
        if (existing) {
            throw (0, http_errors_1.conflict)('member_exists', 'Member already belongs to this home');
        }
        const member = {
            id: (0, id_1.uuidv7)(),
            homeId: dto.homeId,
            userId: user.id,
            role: dto.role,
            status: 'invited',
            createdAt: nowIso(),
        };
        this.members.set(member.id, member);
        this.appendEvent(dto.homeId, 'member.access.changed', 'info', member, actorUserId);
        return member;
    }
    updateMember(actorUserId, memberId, dto) {
        const member = this.members.get(memberId);
        if (!member) {
            throw (0, http_errors_1.notFound)('member_not_found', 'Member was not found');
        }
        const actorMembership = this.ensureHomeAccess(actorUserId, member.homeId);
        if (actorMembership.role !== 'owner') {
            throw (0, http_errors_1.forbidden)('member_update_denied', 'Only owners can update members');
        }
        if (dto.role) {
            member.role = dto.role;
        }
        if (dto.status) {
            member.status = dto.status;
        }
        this.appendEvent(member.homeId, 'member.access.changed', 'info', member, actorUserId);
        return member;
    }
    getRooms(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.rooms.values()]
            .filter((room) => room.homeId === homeId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    createRoom(userId, homeId, dto) {
        this.ensureHomeAccess(userId, homeId);
        const room = {
            id: (0, id_1.uuidv7)(),
            homeId,
            title: dto.title,
            type: dto.type,
            sortOrder: dto.sortOrder ?? this.getRooms(homeId, userId).length,
            updatedAt: nowIso(),
        };
        this.rooms.set(room.id, room);
        this.appendEvent(homeId, 'room.state.updated', 'info', room, userId);
        return room;
    }
    updateRoom(userId, roomId, dto) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw (0, http_errors_1.notFound)('room_not_found', 'Room was not found');
        }
        this.ensureHomeAccess(userId, room.homeId);
        Object.assign(room, {
            ...(dto.title ? { title: dto.title } : {}),
            ...(dto.type ? { type: dto.type } : {}),
            ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
            updatedAt: nowIso(),
        });
        this.appendEvent(room.homeId, 'room.state.updated', 'info', room, userId);
        return room;
    }
    getLayout(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        const home = this.getHome(homeId);
        const items = [...this.deviceAnchors.values()]
            .filter((anchor) => this.devices.get(anchor.deviceId)?.homeId === homeId)
            .map((anchor) => this.mapAnchorToLayoutItem(homeId, anchor));
        return {
            homeId,
            revision: home.layoutRevision,
            blocks: [...this.layoutBlocks.values()].filter((block) => this.rooms.get(block.roomId)?.homeId === homeId),
            items,
        };
    }
    replaceLayout(userId, homeId, dto) {
        this.ensureHomeAccess(userId, homeId);
        const home = this.getHome(homeId);
        if (dto.revision !== home.layoutRevision) {
            throw (0, http_errors_1.conflict)('layout_revision_mismatch', 'Layout revision is stale');
        }
        this.validateLayout(homeId, dto.blocks, dto.items, userId);
        for (const [id, block] of this.layoutBlocks.entries()) {
            if (this.rooms.get(block.roomId)?.homeId === homeId) {
                this.layoutBlocks.delete(id);
            }
        }
        for (const [id, anchor] of this.deviceAnchors.entries()) {
            if (this.devices.get(anchor.deviceId)?.homeId === homeId) {
                this.deviceAnchors.delete(id);
            }
        }
        for (const block of dto.blocks) {
            const storedBlock = { id: (0, id_1.uuidv7)(), ...block };
            this.layoutBlocks.set(storedBlock.id, storedBlock);
        }
        for (const item of dto.items.filter((candidate) => candidate.kind === 'device')) {
            const deviceId = typeof item.metadata?.deviceId === 'string'
                ? item.metadata.deviceId
                : (item.id ?? (0, id_1.uuidv7)());
            const storedAnchor = {
                id: (0, id_1.uuidv7)(),
                deviceId,
                roomId: item.roomId,
                x: item.x,
                y: item.y,
                anchorType: item.subtype,
            };
            this.deviceAnchors.set(storedAnchor.id, storedAnchor);
        }
        home.layoutRevision += 1;
        home.updatedAt = nowIso();
        this.appendEvent(homeId, 'room.state.updated', 'info', { layoutRevision: home.layoutRevision }, userId);
        this.writeAudit(userId, homeId, 'layout', homeId, 'layout.replace', 'Updated home layout');
        return this.getLayout(homeId, userId);
    }
    getDevices(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.devices.values()].filter((device) => device.homeId === homeId);
    }
    getDeviceDetails(userId, deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw (0, http_errors_1.notFound)('device_not_found', 'Device was not found');
        }
        this.ensureHomeAccess(userId, device.homeId);
        return {
            device,
            capabilities: this.getCapabilities(deviceId),
            latestState: this.getLatestState(deviceId),
            commands: [...this.commands.values()].filter((command) => command.deviceId === deviceId),
            firmware: [...this.firmwareRecords.values()].filter((record) => record.deviceId === deviceId),
        };
    }
    getCapabilities(deviceId) {
        return [...this.capabilities.values()].filter((capability) => capability.deviceId === deviceId);
    }
    getLatestState(deviceId) {
        return ([...this.snapshots.values()]
            .filter((snapshot) => snapshot.deviceId === deviceId)
            .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0] ?? null);
    }
    submitCommand(user, deviceId, idempotencyKey, dto) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw (0, http_errors_1.notFound)('device_not_found', 'Device was not found');
        }
        this.ensureHomeAccess(user.id, device.homeId);
        const capability = this.getCapabilities(deviceId).find((candidate) => candidate.key === dto.capabilityKey);
        if (!capability || !capability.writable) {
            throw (0, http_errors_1.forbidden)('capability_not_writable', 'Capability is not writable');
        }
        this.validateCommandValue(capability, dto.requestedValue);
        const existing = [...this.commands.values()].find((command) => command.homeId === device.homeId &&
            command.idempotencyKey === idempotencyKey);
        if (existing) {
            if (existing.deviceId !== deviceId ||
                existing.capabilityKey !== dto.capabilityKey ||
                JSON.stringify(existing.requestedValue) !==
                    JSON.stringify(dto.requestedValue)) {
                throw (0, http_errors_1.conflict)('idempotency_conflict', 'Idempotency key already exists with a different payload');
            }
            return existing;
        }
        const command = {
            id: (0, id_1.uuidv7)(),
            homeId: device.homeId,
            deviceId,
            capabilityKey: dto.capabilityKey,
            requestedValue: dto.requestedValue,
            requestedAt: nowIso(),
            actorUserId: user.id,
            idempotencyKey,
            deliveryStatus: 'queued',
            failureReason: null,
            externalCommandRef: `demo-${(0, id_1.uuidv7)()}`,
            acknowledgedAt: null,
            reconciledAt: null,
        };
        this.commands.set(command.id, command);
        this.appendEvent(device.homeId, 'device.command.submitted', 'info', command, user.id);
        setTimeout(() => this.dispatchCommand(command.id), 25);
        return command;
    }
    getCommandStatus(userId, homeId, deviceId, commandId) {
        this.ensureHomeAccess(userId, homeId);
        const command = this.commands.get(commandId);
        if (!command ||
            command.homeId !== homeId ||
            command.deviceId !== deviceId) {
            throw (0, http_errors_1.notFound)('command_not_found', 'Command was not found');
        }
        return command;
    }
    getScenarios(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.scenarios.values()].filter((scenario) => scenario.homeId === homeId);
    }
    createScenario(userId, dto) {
        this.ensureHomeAccess(userId, dto.homeId);
        const scenario = {
            id: (0, id_1.uuidv7)(),
            homeId: dto.homeId,
            title: dto.title,
            description: dto.description,
            iconKey: dto.iconKey,
            enabled: true,
            executionMode: dto.executionMode,
            updatedAt: nowIso(),
        };
        this.scenarios.set(scenario.id, scenario);
        this.appendEvent(dto.homeId, 'automation.run.updated', 'info', { scenarioId: scenario.id }, userId);
        return scenario;
    }
    updateScenario(userId, scenarioId, dto) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw (0, http_errors_1.notFound)('scenario_not_found', 'Scenario was not found');
        }
        this.ensureHomeAccess(userId, scenario.homeId);
        Object.assign(scenario, {
            ...(dto.title ? { title: dto.title } : {}),
            ...(dto.description ? { description: dto.description } : {}),
            ...(dto.iconKey ? { iconKey: dto.iconKey } : {}),
            ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
            ...(dto.executionMode ? { executionMode: dto.executionMode } : {}),
            updatedAt: nowIso(),
        });
        this.appendEvent(scenario.homeId, 'automation.run.updated', 'info', scenario, userId);
        return scenario;
    }
    runScenario(userId, scenarioId) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw (0, http_errors_1.notFound)('scenario_not_found', 'Scenario was not found');
        }
        this.ensureHomeAccess(userId, scenario.homeId);
        this.appendEvent(scenario.homeId, 'automation.run.updated', 'info', { scenarioId: scenario.id, status: 'completed' }, userId);
        return {
            scenarioId: scenario.id,
            status: 'completed',
            executedAt: nowIso(),
        };
    }
    getAutomations(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return this.getScenarios(homeId, userId).map((scenario) => ({
            id: (0, id_1.uuidv7)(),
            scenarioId: scenario.id,
            homeId,
            status: scenario.enabled ? 'completed' : 'queued',
            startedAt: nowIso(),
            finishedAt: nowIso(),
        }));
    }
    getEvents(homeId, userId, afterOffset = 0) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.events.values()]
            .filter((event) => event.homeId === homeId && event.offset > afterOffset)
            .sort((a, b) => a.offset - b.offset);
    }
    getEvent(homeId, eventId, userId) {
        this.ensureHomeAccess(userId, homeId);
        const event = this.events.get(eventId);
        if (!event || event.homeId !== homeId) {
            throw (0, http_errors_1.notFound)('event_not_found', 'Event was not found');
        }
        return event;
    }
    getNotifications(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.notifications.values()]
            .filter((notification) => notification.homeId === homeId && notification.userId === userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    markNotificationRead(userId, notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.userId !== userId) {
            throw (0, http_errors_1.notFound)('notification_not_found', 'Notification was not found');
        }
        notification.readAt = nowIso();
        return notification;
    }
    getIntegrations(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        return [...this.integrations.values()].filter((integration) => integration.homeId === homeId);
    }
    createPairingSession(userId, dto) {
        this.ensureHomeAccess(userId, dto.homeId);
        const pairing = {
            id: (0, id_1.uuidv7)(),
            publicToken: (0, id_1.uuidv7)(),
            homeId: dto.homeId,
            actorUserId: userId,
            deviceType: dto.deviceType,
            discoveryMethod: dto.discoveryMethod,
            status: 'created',
            expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            createdAt: nowIso(),
            completedAt: null,
            selectedCandidateId: null,
            candidateListHash: null,
            candidates: [],
        };
        this.pairingSessions.set(pairing.id, pairing);
        this.writeAudit(userId, dto.homeId, 'pairing_session', pairing.id, 'pairing.create', 'Created pairing session');
        return pairing;
    }
    getPairingSession(userId, pairingSessionId) {
        const pairing = this.getPairingSessionOrThrow(pairingSessionId);
        this.ensureHomeAccess(userId, pairing.homeId);
        return pairing;
    }
    discoverPairingCandidates(userId, pairingSessionId) {
        const pairing = this.getPairingSessionOrThrow(pairingSessionId);
        this.ensureHomeAccess(userId, pairing.homeId);
        pairing.status = 'discovering';
        const candidates = this.buildCandidates(pairing.discoveryMethod);
        pairing.candidates = candidates;
        pairing.candidateListHash = hashToken(JSON.stringify(candidates));
        return pairing;
    }
    selectPairingCandidate(userId, pairingSessionId, dto) {
        const pairing = this.getPairingSessionOrThrow(pairingSessionId);
        this.ensureHomeAccess(userId, pairing.homeId);
        const candidate = pairing.candidates.find((item) => item.id === dto.candidateId);
        if (!candidate) {
            throw (0, http_errors_1.notFound)('candidate_not_found', 'Pairing candidate was not found');
        }
        pairing.selectedCandidateId = candidate.id;
        pairing.status = 'candidate_selected';
        return pairing;
    }
    completePairingSession(userId, pairingSessionId, dto) {
        const pairing = this.getPairingSessionOrThrow(pairingSessionId);
        this.ensureHomeAccess(userId, pairing.homeId);
        const candidate = pairing.candidates.find((item) => item.id === pairing.selectedCandidateId);
        if (!candidate) {
            throw (0, http_errors_1.conflict)('candidate_missing', 'Select a pairing candidate before completion');
        }
        const roomId = dto.roomId ?? this.getRooms(pairing.homeId, userId)[0]?.id;
        if (!roomId) {
            throw (0, http_errors_1.conflict)('room_required', 'At least one room is required before pairing');
        }
        const device = {
            id: (0, id_1.uuidv7)(),
            homeId: pairing.homeId,
            roomId,
            name: dto.deviceName ?? candidate.label,
            category: 'light',
            vendor: candidate.vendor,
            model: candidate.model,
            connectionType: candidate.connectionType,
            transportMode: candidate.connectionType === 'cloud' ? 'cloud' : 'mobile_edge',
            externalDeviceRef: `${candidate.vendor.toLowerCase()}-${candidate.id}`,
            availabilityStatus: 'online',
            lastSeenAt: nowIso(),
            updatedAt: nowIso(),
        };
        this.devices.set(device.id, device);
        for (const capability of this.buildLightCapabilities(device.id)) {
            this.capabilities.set(capability.id, capability);
        }
        const snapshot = {
            id: (0, id_1.uuidv7)(),
            deviceId: device.id,
            observedAt: nowIso(),
            source: 'pairing',
            values: {
                power: false,
                brightness: 45,
                colorTemperature: 3800,
                onlineState: 'online',
            },
        };
        this.snapshots.set(snapshot.id, snapshot);
        const anchor = {
            id: (0, id_1.uuidv7)(),
            deviceId: device.id,
            roomId,
            x: 1,
            y: 1,
            anchorType: 'device',
        };
        this.deviceAnchors.set(anchor.id, anchor);
        pairing.status = 'completed';
        pairing.completedAt = nowIso();
        this.appendEvent(pairing.homeId, 'device.state.changed', 'info', { deviceId: device.id }, userId);
        this.writeAudit(userId, pairing.homeId, 'pairing_session', pairing.id, 'pairing.complete', 'Completed smart bulb pairing');
        return {
            pairingSession: pairing,
            device,
        };
    }
    cancelPairingSession(userId, pairingSessionId) {
        const pairing = this.getPairingSessionOrThrow(pairingSessionId);
        this.ensureHomeAccess(userId, pairing.homeId);
        pairing.status = 'cancelled';
        this.writeAudit(userId, pairing.homeId, 'pairing_session', pairing.id, 'pairing.cancel', 'Cancelled pairing session');
        return pairing;
    }
    getSnapshot(homeId, userId) {
        this.ensureHomeAccess(userId, homeId);
        const notifications = this.getNotifications(homeId, userId);
        const events = this.getEvents(homeId, userId, 0);
        const devices = this.getDevices(homeId, userId);
        const rooms = this.getRooms(homeId, userId);
        const home = this.getHome(homeId);
        const tasks = [];
        const layout = this.getLayout(homeId, userId);
        const floors = [
            {
                id: `${homeId}-default-floor`,
                homeId,
                title: 'Основной этаж',
                sortOrder: 0,
                createdAt: nowIso(),
                updatedAt: nowIso(),
            },
        ];
        const preferences = {
            userId,
            favoriteDeviceIds: devices.slice(0, 4).map((device) => device.id),
            allowedDeviceIds: devices
                .filter((device) => ['light', 'climate', 'curtain', 'media'].includes(device.category))
                .map((device) => device.id),
            pinnedSections: ['home', 'rooms', 'devices'],
            preferredHomeTab: 'home',
            themeMode: 'system',
            motionMode: 'standard',
            uiDensity: 'comfortable',
            activeFloorId: floors[0].id,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        return {
            home,
            family: null,
            members: this.getMembers(homeId, userId),
            floors,
            preferences,
            rooms,
            layoutBlocks: layout.blocks,
            layoutItems: layout.items,
            devices,
            capabilities: devices.flatMap((device) => this.getCapabilities(device.id)),
            latestStates: devices
                .map((device) => this.getLatestState(device.id))
                .filter((snapshot) => snapshot !== null),
            tasks,
            notifications,
            favoriteDevices: devices.slice(0, 4),
            roomSummaries: rooms.map((room) => ({
                roomId: room.id,
                floorId: floors[0].id,
                title: room.title,
                type: room.type,
                deviceCount: devices.filter((device) => device.roomId === room.id)
                    .length,
                taskCount: 0,
            })),
            securitySummary: {
                securityMode: home.securityMode,
                activeAlerts: events.filter((item) => item.severity === 'critical')
                    .length,
                openEntries: 0,
                cameraCount: devices.filter((item) => item.category === 'camera')
                    .length,
                lockCount: devices.filter((item) => item.category === 'lock').length,
            },
            familySummary: {
                totalMembers: this.getMembers(homeId, userId).length,
                adults: 1,
                children: 1,
                elderly: 0,
            },
            alerts: events.filter((item) => item.severity !== 'info').slice(0, 8),
            activityFeed: events.slice(-12).reverse(),
            integrationSummary: {
                connected: this.getIntegrations(homeId, userId).filter((item) => item.status === 'connected').length,
                attentionNeeded: this.getIntegrations(homeId, userId).filter((item) => item.status === 'attention_needed').length,
                providers: this.getIntegrations(homeId, userId).map((item) => item.provider),
            },
            allowedDevicesForChild: devices.filter((device) => preferences.allowedDeviceIds.includes(device.id)),
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
    getSync(homeId, userId, afterOffset) {
        const events = this.getEvents(homeId, userId, afterOffset);
        return {
            homeId,
            afterOffset,
            latestOffset: events.at(-1)?.offset ?? afterOffset,
            events,
        };
    }
    getAuditLogs(homeId, userId) {
        const membership = this.ensureHomeAccess(userId, homeId);
        if (membership.role === 'guest') {
            throw (0, http_errors_1.forbidden)('audit_access_denied', 'Guests cannot inspect audit logs');
        }
        return [...this.auditLogs.values()].filter((log) => log.homeId === homeId);
    }
    dispatchCommand(commandId) {
        const command = this.commands.get(commandId);
        if (!command || command.deliveryStatus !== 'queued') {
            return;
        }
        command.deliveryStatus = 'dispatched';
        this.appendEvent(command.homeId, 'device.command.dispatched', 'info', command, command.actorUserId);
        setTimeout(() => {
            const current = this.commands.get(commandId);
            if (!current ||
                current.deliveryStatus === 'rejected' ||
                current.deliveryStatus === 'timed_out') {
                return;
            }
            current.deliveryStatus = 'acknowledged';
            current.acknowledgedAt = nowIso();
            this.appendEvent(current.homeId, 'device.command.acknowledged', 'info', current, current.actorUserId);
            this.applySnapshotForCommand(current);
        }, 60);
    }
    applySnapshotForCommand(command) {
        const snapshot = {
            id: (0, id_1.uuidv7)(),
            deviceId: command.deviceId,
            observedAt: nowIso(),
            source: 'demo-adapter',
            values: {
                ...(this.getLatestState(command.deviceId)?.values ?? {}),
                [command.capabilityKey]: command.requestedValue,
                onlineState: 'online',
            },
        };
        this.snapshots.set(snapshot.id, snapshot);
        command.deliveryStatus = 'reconciled';
        command.reconciledAt = snapshot.observedAt;
        const device = this.devices.get(command.deviceId);
        if (device) {
            device.lastSeenAt = snapshot.observedAt;
            device.availabilityStatus = 'online';
            device.updatedAt = snapshot.observedAt;
        }
        this.appendEvent(command.homeId, 'device.state.changed', 'info', snapshot.values, command.actorUserId);
    }
    buildCandidates(connectionType) {
        if (connectionType === 'matter') {
            return [
                {
                    id: 'matter-bulb-1',
                    label: 'Matter Bulb A19',
                    vendor: 'Matter Labs',
                    model: 'ML-A19',
                    connectionType,
                    signalStrength: 87,
                },
            ];
        }
        return [
            {
                id: 'lan-bulb-1',
                label: 'LAN Smart Bulb',
                vendor: 'LanLux',
                model: 'LL-100',
                connectionType,
                signalStrength: 74,
            },
        ];
    }
    validateLayout(homeId, blocks, items, userId) {
        const roomIds = new Set(this.getRooms(homeId, userId).map((room) => room.id));
        for (const block of blocks) {
            if (!roomIds.has(block.roomId)) {
                throw (0, http_errors_1.conflict)('layout_room_scope_invalid', 'Layout block references a room outside the home');
            }
        }
        const normalized = blocks.map((block, index) => ({
            id: `candidate-${index}`,
            ...block,
        }));
        for (let index = 0; index < normalized.length; index += 1) {
            for (let otherIndex = index + 1; otherIndex < normalized.length; otherIndex += 1) {
                if (intersects(normalized[index], normalized[otherIndex])) {
                    throw (0, http_errors_1.conflict)('layout_overlap', 'Layout blocks cannot overlap');
                }
            }
        }
        for (const item of items) {
            if (item.kind !== 'device') {
                continue;
            }
            const blocksForRoom = normalized.filter((block) => block.roomId === item.roomId);
            const inside = blocksForRoom.some((block) => item.x >= block.x &&
                item.x < block.x + block.width &&
                item.y >= block.y &&
                item.y < block.y + block.height);
            if (!inside) {
                throw (0, http_errors_1.conflict)('anchor_outside_room', 'Device anchor must be inside the owning room');
            }
        }
    }
    validateCommandValue(capability, value) {
        if (typeof value === 'number' &&
            capability.rangeMin !== null &&
            capability.rangeMin !== undefined &&
            value < capability.rangeMin) {
            throw (0, http_errors_1.conflict)('capability_range', 'Requested value is below the minimum range');
        }
        if (typeof value === 'number' &&
            capability.rangeMax !== null &&
            capability.rangeMax !== undefined &&
            value > capability.rangeMax) {
            throw (0, http_errors_1.conflict)('capability_range', 'Requested value is above the maximum range');
        }
        if (capability.allowedOptions &&
            !capability.allowedOptions.includes(String(value))) {
            throw (0, http_errors_1.conflict)('capability_option', 'Requested value is not part of the allowed options');
        }
    }
    appendEvent(homeId, topic, severity, payload, userId) {
        const payloadRecord = payload;
        const event = {
            id: (0, id_1.uuidv7)(),
            homeId,
            roomId: null,
            deviceId: typeof payloadRecord.deviceId === 'string'
                ? payloadRecord.deviceId
                : null,
            userId: userId ?? null,
            topic,
            severity,
            payload: payloadRecord,
            createdAt: nowIso(),
            offset: ++this.eventOffset,
        };
        this.events.set(event.id, event);
        this.realtimeService.publish({
            eventId: event.id,
            schemaVersion: 1,
            homeId,
            topic,
            offset: event.offset,
            occurredAt: event.createdAt,
            correlationId: typeof payloadRecord.correlationId === 'string' ||
                typeof payloadRecord.correlationId === 'number'
                ? String(payloadRecord.correlationId)
                : event.id,
            data: payloadRecord,
        });
        return event;
    }
    writeAudit(actorUserId, homeId, targetType, targetId, action, reason) {
        const log = {
            id: (0, id_1.uuidv7)(),
            actorUserId,
            homeId,
            targetType,
            targetId,
            action,
            reason,
            payloadHash: hashToken(`${actorUserId}:${targetType}:${targetId}:${action}:${reason}`),
            createdAt: nowIso(),
        };
        this.auditLogs.set(log.id, log);
        return log;
    }
    getPairingSessionOrThrow(pairingSessionId) {
        const pairing = this.pairingSessions.get(pairingSessionId);
        if (!pairing) {
            throw (0, http_errors_1.notFound)('pairing_session_not_found', 'Pairing session was not found');
        }
        if (new Date(pairing.expiresAt).getTime() < Date.now() &&
            pairing.status !== 'completed') {
            pairing.status = 'expired';
            throw (0, http_errors_1.conflict)('pairing_session_expired', 'Pairing session has expired');
        }
        return pairing;
    }
    buildLightCapabilities(deviceId) {
        const createdAt = nowIso();
        return [
            {
                id: (0, id_1.uuidv7)(),
                deviceId,
                key: 'power',
                type: 'boolean',
                readable: true,
                writable: true,
                unit: null,
                rangeMin: null,
                rangeMax: null,
                step: null,
                allowedOptions: null,
                validationRules: {},
                source: 'adapter',
                lastSyncAt: createdAt,
                freshness: 'fresh',
                quality: 'good',
            },
            {
                id: (0, id_1.uuidv7)(),
                deviceId,
                key: 'brightness',
                type: 'integer',
                readable: true,
                writable: true,
                unit: '%',
                rangeMin: 1,
                rangeMax: 100,
                step: 1,
                allowedOptions: null,
                validationRules: {},
                source: 'adapter',
                lastSyncAt: createdAt,
                freshness: 'fresh',
                quality: 'good',
            },
            {
                id: (0, id_1.uuidv7)(),
                deviceId,
                key: 'colorTemperature',
                type: 'integer',
                readable: true,
                writable: true,
                unit: 'K',
                rangeMin: 2700,
                rangeMax: 6500,
                step: 100,
                allowedOptions: null,
                validationRules: {},
                source: 'adapter',
                lastSyncAt: createdAt,
                freshness: 'fresh',
                quality: 'good',
            },
            {
                id: (0, id_1.uuidv7)(),
                deviceId,
                key: 'onlineState',
                type: 'enum',
                readable: true,
                writable: false,
                unit: null,
                rangeMin: null,
                rangeMax: null,
                step: null,
                allowedOptions: ['online', 'degraded', 'offline'],
                validationRules: {},
                source: 'derived',
                lastSyncAt: createdAt,
                freshness: 'fresh',
                quality: 'good',
            },
        ];
    }
    createSnapshot(deviceId, source, values) {
        return {
            id: (0, id_1.uuidv7)(),
            deviceId,
            observedAt: nowIso(),
            source,
            values,
        };
    }
    seed() {
        if (this.users.size > 0) {
            return;
        }
        const now = nowIso();
        const user = {
            id: (0, id_1.uuidv7)(),
            email: DEMO_EMAIL,
            loginIdentifier: DEMO_EMAIL,
            identifierType: 'email',
            birthYear: 1990,
            accountMode: 'adult',
            displayName: 'Алексей Орлов',
            locale: 'ru-RU',
            createdAt: now,
            updatedAt: now,
        };
        const guest = {
            id: (0, id_1.uuidv7)(),
            email: 'guest@rosdom.local',
            loginIdentifier: 'guest@rosdom.local',
            identifierType: 'email',
            birthYear: 2015,
            accountMode: 'child',
            displayName: 'Гость',
            locale: 'ru-RU',
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(user.id, user);
        this.users.set(guest.id, guest);
        const home = {
            id: (0, id_1.uuidv7)(),
            title: 'Квартира на Ленина',
            addressLabel: 'Якутск, ул. Ленина, 8',
            timezone: 'Asia/Yakutsk',
            ownerUserId: user.id,
            currentMode: 'home',
            securityMode: 'disarmed',
            updatedAt: now,
            layoutRevision: 1,
        };
        this.homes.set(home.id, home);
        const ownerMember = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            userId: user.id,
            role: 'owner',
            status: 'active',
            createdAt: now,
        };
        const guestMember = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            userId: guest.id,
            role: 'guest',
            status: 'active',
            createdAt: now,
        };
        this.members.set(ownerMember.id, ownerMember);
        this.members.set(guestMember.id, guestMember);
        const livingRoom = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            title: 'Гостиная',
            type: 'living_room',
            sortOrder: 0,
            updatedAt: now,
        };
        const bedroom = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            title: 'Спальня',
            type: 'bedroom',
            sortOrder: 1,
            updatedAt: now,
        };
        const hallway = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            title: 'Прихожая',
            type: 'hallway',
            sortOrder: 2,
            updatedAt: now,
        };
        [livingRoom, bedroom, hallway].forEach((room) => this.rooms.set(room.id, room));
        const blocks = [
            {
                id: (0, id_1.uuidv7)(),
                roomId: livingRoom.id,
                x: 0,
                y: 0,
                width: 4,
                height: 3,
                zIndex: 0,
            },
            {
                id: (0, id_1.uuidv7)(),
                roomId: bedroom.id,
                x: 4,
                y: 0,
                width: 3,
                height: 3,
                zIndex: 0,
            },
            {
                id: (0, id_1.uuidv7)(),
                roomId: hallway.id,
                x: 0,
                y: 3,
                width: 7,
                height: 1,
                zIndex: 0,
            },
        ];
        blocks.forEach((block) => this.layoutBlocks.set(block.id, block));
        const devices = this.seedDevices(home.id, livingRoom.id, bedroom.id, hallway.id);
        devices.forEach((device) => this.devices.set(device.id, device));
        const anchors = [
            {
                id: (0, id_1.uuidv7)(),
                deviceId: devices[0].id,
                roomId: livingRoom.id,
                x: 1,
                y: 1,
                anchorType: 'light',
            },
            {
                id: (0, id_1.uuidv7)(),
                deviceId: devices[1].id,
                roomId: bedroom.id,
                x: 5,
                y: 1,
                anchorType: 'climate',
            },
            {
                id: (0, id_1.uuidv7)(),
                deviceId: devices[2].id,
                roomId: hallway.id,
                x: 1,
                y: 3,
                anchorType: 'sensor',
            },
        ];
        anchors.forEach((anchor) => this.deviceAnchors.set(anchor.id, anchor));
        devices.forEach((device) => {
            const capabilities = device.category === 'light'
                ? this.buildLightCapabilities(device.id)
                : [
                    {
                        id: (0, id_1.uuidv7)(),
                        deviceId: device.id,
                        key: 'onlineState',
                        type: 'enum',
                        readable: true,
                        writable: false,
                        unit: null,
                        rangeMin: null,
                        rangeMax: null,
                        step: null,
                        allowedOptions: ['online', 'degraded', 'offline'],
                        validationRules: {},
                        source: 'derived',
                        lastSyncAt: now,
                        freshness: 'fresh',
                        quality: 'good',
                    },
                ];
            capabilities.forEach((capability) => this.capabilities.set(capability.id, capability));
        });
        const lightSnapshot = this.createSnapshot(devices[0].id, 'seed', {
            power: true,
            brightness: 72,
            colorTemperature: 4000,
            onlineState: 'online',
        });
        const climateSnapshot = this.createSnapshot(devices[1].id, 'seed', {
            temperature: 22.4,
            humidity: 41,
            onlineState: 'online',
        });
        const sensorSnapshot = this.createSnapshot(devices[2].id, 'seed', {
            motion: false,
            onlineState: 'online',
        });
        [lightSnapshot, climateSnapshot, sensorSnapshot].forEach((snapshot) => this.snapshots.set(snapshot.id, snapshot));
        const firmware = {
            id: (0, id_1.uuidv7)(),
            deviceId: devices[0].id,
            version: '1.2.4',
            channel: 'stable',
            recordedAt: now,
        };
        this.firmwareRecords.set(firmware.id, firmware);
        const scenario = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            title: 'Доброй ночи',
            description: 'Выключает свет и переводит квартиру в ночной режим.',
            iconKey: 'moon',
            enabled: true,
            executionMode: 'manual',
            updatedAt: now,
        };
        this.scenarios.set(scenario.id, scenario);
        const event = this.appendEvent(home.id, 'security.alert.created', 'warning', {
            title: 'Движение у входа',
            deviceId: devices[2].id,
        }, user.id);
        const notification = {
            id: (0, id_1.uuidv7)(),
            userId: user.id,
            homeId: home.id,
            eventId: event.id,
            type: 'security',
            title: 'Движение у входа',
            body: 'Датчик в прихожей зафиксировал движение 2 минуты назад.',
            readAt: null,
            createdAt: now,
        };
        this.notifications.set(notification.id, notification);
        const integration = {
            id: (0, id_1.uuidv7)(),
            homeId: home.id,
            provider: 'matter',
            status: 'connected',
            createdAt: now,
            updatedAt: now,
        };
        this.integrations.set(integration.id, integration);
    }
    seedDevices(homeId, livingRoomId, bedroomId, hallwayId) {
        const createdAt = nowIso();
        return [
            {
                id: (0, id_1.uuidv7)(),
                homeId,
                roomId: livingRoomId,
                name: 'Свет в гостиной',
                category: 'light',
                vendor: 'Matter Labs',
                model: 'ML-A19',
                connectionType: 'matter',
                transportMode: 'mobile_edge',
                externalDeviceRef: 'matter-ml-a19',
                availabilityStatus: 'online',
                lastSeenAt: createdAt,
                updatedAt: createdAt,
            },
            {
                id: (0, id_1.uuidv7)(),
                homeId,
                roomId: bedroomId,
                name: 'Увлажнитель',
                category: 'humidifier',
                vendor: 'RosDom Demo',
                model: 'AIR-02',
                connectionType: 'cloud',
                transportMode: 'cloud',
                externalDeviceRef: 'humidifier-air-02',
                availabilityStatus: 'online',
                lastSeenAt: createdAt,
                updatedAt: createdAt,
            },
            {
                id: (0, id_1.uuidv7)(),
                homeId,
                roomId: hallwayId,
                name: 'Датчик движения',
                category: 'sensor',
                vendor: 'LanLux',
                model: 'LL-MOTION',
                connectionType: 'lan',
                transportMode: 'mobile_edge',
                externalDeviceRef: 'll-motion-1',
                availabilityStatus: 'online',
                lastSeenAt: createdAt,
                updatedAt: createdAt,
            },
        ];
    }
    mapAnchorToLayoutItem(homeId, anchor) {
        return {
            id: anchor.id,
            homeId,
            roomId: anchor.roomId,
            kind: 'device',
            subtype: anchor.anchorType,
            title: this.devices.get(anchor.deviceId)?.name ?? null,
            x: anchor.x,
            y: anchor.y,
            width: 1,
            height: 1,
            rotation: 0,
            metadata: {
                deviceId: anchor.deviceId,
            },
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
    }
};
exports.DemoService = DemoService;
exports.DemoService = DemoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        realtime_service_1.RealtimeService])
], DemoService);
//# sourceMappingURL=demo.service.js.map