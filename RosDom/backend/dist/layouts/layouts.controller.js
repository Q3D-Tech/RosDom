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
exports.LayoutsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const api_response_1 = require("../common/http/api-response");
const dtos_1 = require("../common/types/dtos");
const layouts_service_1 = require("./layouts.service");
let LayoutsController = class LayoutsController {
    layoutsService;
    constructor(layoutsService) {
        this.layoutsService = layoutsService;
    }
    async getLayout(user, homeId, query) {
        return (0, api_response_1.ok)(await this.layoutsService.getLayout(user, homeId, query));
    }
    async replaceLayout(user, homeId, dto) {
        return (0, api_response_1.ok)(await this.layoutsService.replaceLayout(user, homeId, dto));
    }
    async patchLayout(user, homeId, dto) {
        return (0, api_response_1.ok)(await this.layoutsService.patchLayout(user, homeId, dto));
    }
    async validateLayout(user, homeId, dto) {
        return (0, api_response_1.ok)(await this.layoutsService.validateLayout(user, homeId, dto));
    }
};
exports.LayoutsController = LayoutsController;
__decorate([
    (0, common_1.Get)('homes/:homeId/layouts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.LayoutQueryDto]),
    __metadata("design:returntype", Promise)
], LayoutsController.prototype, "getLayout", null);
__decorate([
    (0, common_1.Put)('homes/:homeId/layouts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.PutLayoutDto]),
    __metadata("design:returntype", Promise)
], LayoutsController.prototype, "replaceLayout", null);
__decorate([
    (0, common_1.Patch)('homes/:homeId/layouts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.PatchLayoutDto]),
    __metadata("design:returntype", Promise)
], LayoutsController.prototype, "patchLayout", null);
__decorate([
    (0, common_1.Post)('homes/:homeId/layouts/validate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.PutLayoutDto]),
    __metadata("design:returntype", Promise)
], LayoutsController.prototype, "validateLayout", null);
exports.LayoutsController = LayoutsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [layouts_service_1.LayoutsService])
], LayoutsController);
//# sourceMappingURL=layouts.controller.js.map