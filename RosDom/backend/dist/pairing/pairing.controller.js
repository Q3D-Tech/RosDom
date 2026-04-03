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
exports.PairingController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const api_response_1 = require("../common/http/api-response");
const dtos_1 = require("../common/types/dtos");
const pairing_service_1 = require("./pairing.service");
let PairingController = class PairingController {
    pairingService;
    constructor(pairingService) {
        this.pairingService = pairingService;
    }
    async createPairingSession(user, dto) {
        return (0, api_response_1.ok)(await this.pairingService.createPairingSession(user, dto));
    }
    async getPairingSession(user, pairingSessionId) {
        return (0, api_response_1.ok)(await this.pairingService.getPairingSession(user, pairingSessionId));
    }
    async discover(user, pairingSessionId) {
        return (0, api_response_1.ok)(await this.pairingService.discover(user, pairingSessionId));
    }
    async selectCandidate(user, pairingSessionId, dto) {
        return (0, api_response_1.ok)(await this.pairingService.selectCandidate(user, pairingSessionId, dto));
    }
    async complete(user, pairingSessionId, dto) {
        void dto;
        return (0, api_response_1.ok)(await this.pairingService.complete(user, pairingSessionId));
    }
    async cancel(user, pairingSessionId) {
        return (0, api_response_1.ok)(await this.pairingService.cancel(user, pairingSessionId));
    }
};
exports.PairingController = PairingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreatePairingSessionDto]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "createPairingSession", null);
__decorate([
    (0, common_1.Get)(':pairingSessionId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pairingSessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "getPairingSession", null);
__decorate([
    (0, common_1.Post)(':pairingSessionId/discover'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pairingSessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "discover", null);
__decorate([
    (0, common_1.Post)(':pairingSessionId/select-candidate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pairingSessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.SelectCandidateDto]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "selectCandidate", null);
__decorate([
    (0, common_1.Post)(':pairingSessionId/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pairingSessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.CompletePairingSessionDto]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':pairingSessionId/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('pairingSessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PairingController.prototype, "cancel", null);
exports.PairingController = PairingController = __decorate([
    (0, common_1.Controller)('pairing-sessions'),
    __metadata("design:paramtypes", [pairing_service_1.PairingService])
], PairingController);
//# sourceMappingURL=pairing.controller.js.map