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
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("../platform/platform.service");
let IntegrationsService = class IntegrationsService {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    list(user, homeId) {
        return this.platformService.getIntegrations(homeId, user.id);
    }
    connectTuya(user, dto) {
        return this.platformService.connectTuyaIntegration(user.id, dto);
    }
    createTuyaLinkSession(user, dto) {
        return this.platformService.createTuyaLinkSession(user.id, dto);
    }
    getTuyaLinkSession(user, sessionId) {
        return this.platformService.getTuyaLinkSession(user.id, sessionId);
    }
    completeTuyaOAuthCallback(query) {
        return this.platformService.completeTuyaOAuthCallback(query);
    }
    syncTuya(user, dto) {
        return this.platformService.syncTuyaIntegration(user.id, dto.homeId);
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map