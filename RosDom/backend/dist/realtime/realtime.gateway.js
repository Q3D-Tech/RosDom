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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const access_token_1 = require("../common/auth/access-token");
const platform_service_1 = require("../platform/platform.service");
const realtime_service_1 = require("./realtime.service");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    realtimeService;
    jwtService;
    configService;
    platformService;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    constructor(realtimeService, jwtService, configService, platformService) {
        this.realtimeService = realtimeService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.platformService = platformService;
    }
    afterInit() {
        this.realtimeService.bindServer(this.server);
    }
    async handleConnection(client) {
        const authToken = client.handshake.auth?.token;
        const headerToken = typeof client.handshake.headers.authorization === 'string'
            ? client.handshake.headers.authorization.replace(/^Bearer\s+/u, '')
            : undefined;
        const token = typeof authToken === 'string' ? authToken : headerToken;
        if (!token) {
            client.disconnect(true);
            return;
        }
        try {
            const decoded = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_ACCESS_SECRET') ??
                    'rosdom-access',
            });
            if (!(0, access_token_1.isAccessTokenPayload)(decoded)) {
                throw new Error('Invalid access token payload');
            }
            const payload = decoded;
            const user = await this.platformService.authenticateSession(payload.sessionId, payload.sub);
            client.data.user = user;
        }
        catch {
            this.logger.warn('Rejected realtime client with invalid token');
            client.disconnect(true);
        }
    }
    async subscribeHome(client, body) {
        const user = client.data.user;
        if (!user) {
            client.disconnect(true);
            return { ok: false };
        }
        await this.platformService.ensureHomeAccess(user.id, body.homeId);
        void client.join(`home:${body.homeId}`);
        return { ok: true, topic: `home:${body.homeId}` };
    }
    async subscribeDevice(client, body) {
        const user = client.data.user;
        if (!user) {
            client.disconnect(true);
            return { ok: false };
        }
        const details = await this.platformService.getDeviceDetails(user.id, body.deviceId);
        void client.join(`device:${details.device.id}`);
        return { ok: true, topic: `device:${details.device.id}` };
    }
    emitHomeScopedEvent(payload) {
        this.server.to(`home:${payload.homeId}`).emit(payload.topic, payload);
        if (payload.data &&
            typeof payload.data === 'object' &&
            'deviceId' in payload.data) {
            const deviceId = String(payload.data.deviceId);
            this.server.to(`device:${deviceId}`).emit(payload.topic, payload);
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe-home'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeHome", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe-device'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeDevice", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/v1/realtime',
        cors: true,
    }),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService,
        jwt_1.JwtService,
        config_1.ConfigService,
        platform_service_1.PlatformService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map