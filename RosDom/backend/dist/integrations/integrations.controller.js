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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const public_decorator_1 = require("../common/auth/public.decorator");
const api_response_1 = require("../common/http/api-response");
const http_errors_1 = require("../common/http/http-errors");
const dtos_1 = require("../common/types/dtos");
const integrations_service_1 = require("./integrations.service");
let IntegrationsController = class IntegrationsController {
    integrationsService;
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async list(user, homeId) {
        if (!homeId) {
            throw (0, http_errors_1.badRequest)('home_id_required', 'homeId query parameter is required');
        }
        return (0, api_response_1.okList)(await this.integrationsService.list(user, homeId));
    }
    async connectTuya(user, dto) {
        return (0, api_response_1.ok)(await this.integrationsService.connectTuya(user, dto));
    }
    async createTuyaLinkSession(user, dto) {
        return (0, api_response_1.ok)(await this.integrationsService.createTuyaLinkSession(user, dto));
    }
    async getTuyaLinkSession(user, sessionId) {
        return (0, api_response_1.ok)(await this.integrationsService.getTuyaLinkSession(user, sessionId));
    }
    async completeTuyaOAuthCallback(query, response) {
        const html = await this.integrationsService.completeTuyaOAuthCallback(query);
        response.type('html').send(html);
    }
    async syncTuya(user, dto) {
        return (0, api_response_1.ok)(await this.integrationsService.syncTuya(user, dto));
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('tuya/connect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.ConnectTuyaIntegrationDto]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "connectTuya", null);
__decorate([
    (0, common_1.Post)('tuya/link-sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreateTuyaLinkSessionDto]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createTuyaLinkSession", null);
__decorate([
    (0, common_1.Get)('tuya/link-sessions/:sessionId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getTuyaLinkSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tuya/oauth/callback'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.TuyaOAuthCallbackQueryDto, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "completeTuyaOAuthCallback", null);
__decorate([
    (0, common_1.Post)('tuya/sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.SyncIntegrationDto]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "syncTuya", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map