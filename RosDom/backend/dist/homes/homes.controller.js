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
exports.HomesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const api_response_1 = require("../common/http/api-response");
const dtos_1 = require("../common/types/dtos");
const homes_service_1 = require("./homes.service");
let HomesController = class HomesController {
    homesService;
    constructor(homesService) {
        this.homesService = homesService;
    }
    async listHomes(user) {
        return (0, api_response_1.okList)(await this.homesService.listHomes(user));
    }
    async createHome(user, dto) {
        return (0, api_response_1.ok)(await this.homesService.createHome(user, dto));
    }
    async getHome(user, homeId) {
        return (0, api_response_1.ok)(await this.homesService.getHome(user, homeId));
    }
    async updateHomeState(user, homeId, dto) {
        return (0, api_response_1.ok)(await this.homesService.updateHomeState(user, homeId, dto));
    }
    async getFloors(user, homeId) {
        return (0, api_response_1.okList)(await this.homesService.getFloors(user, homeId));
    }
    async createFloor(user, homeId, dto) {
        return (0, api_response_1.ok)(await this.homesService.createFloor(user, homeId, dto));
    }
    async updateFloor(user, floorId, dto) {
        return (0, api_response_1.ok)(await this.homesService.updateFloor(user, floorId, dto));
    }
    async getSnapshot(user, homeId) {
        return (0, api_response_1.ok)(await this.homesService.getSnapshot(user, homeId));
    }
    async getSync(user, homeId, query) {
        return (0, api_response_1.ok)(await this.homesService.getSync(user, homeId, query));
    }
};
exports.HomesController = HomesController;
__decorate([
    (0, common_1.Get)('homes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "listHomes", null);
__decorate([
    (0, common_1.Post)('homes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreateHomeDto]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "createHome", null);
__decorate([
    (0, common_1.Get)('homes/:homeId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "getHome", null);
__decorate([
    (0, common_1.Patch)('homes/:homeId/state'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.UpdateHomeStateDto]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "updateHomeState", null);
__decorate([
    (0, common_1.Get)('homes/:homeId/floors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "getFloors", null);
__decorate([
    (0, common_1.Post)('homes/:homeId/floors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.CreateFloorDto]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "createFloor", null);
__decorate([
    (0, common_1.Patch)('floors/:floorId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('floorId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.UpdateFloorDto]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "updateFloor", null);
__decorate([
    (0, common_1.Get)('homes/:homeId/snapshot'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "getSnapshot", null);
__decorate([
    (0, common_1.Get)('homes/:homeId/sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.SyncQueryDto]),
    __metadata("design:returntype", Promise)
], HomesController.prototype, "getSync", null);
exports.HomesController = HomesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [homes_service_1.HomesService])
], HomesController);
//# sourceMappingURL=homes.controller.js.map