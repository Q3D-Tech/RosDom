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
exports.ScenariosController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const api_response_1 = require("../common/http/api-response");
const http_errors_1 = require("../common/http/http-errors");
const dtos_1 = require("../common/types/dtos");
const scenarios_service_1 = require("./scenarios.service");
let ScenariosController = class ScenariosController {
    scenariosService;
    constructor(scenariosService) {
        this.scenariosService = scenariosService;
    }
    async list(user, homeId) {
        if (!homeId) {
            throw (0, http_errors_1.badRequest)('home_id_required', 'homeId query parameter is required');
        }
        return (0, api_response_1.okList)(await this.scenariosService.list(user, homeId));
    }
    async create(user, dto) {
        return (0, api_response_1.ok)(await this.scenariosService.create(user, dto));
    }
    async update(user, scenarioId, dto) {
        return (0, api_response_1.ok)(await this.scenariosService.update(user, scenarioId, dto));
    }
    async run(user, scenarioId) {
        return (0, api_response_1.ok)(await this.scenariosService.run(user, scenarioId));
    }
};
exports.ScenariosController = ScenariosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CreateScenarioDto]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':scenarioId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('scenarioId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.UpdateScenarioDto]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':scenarioId/run'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('scenarioId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ScenariosController.prototype, "run", null);
exports.ScenariosController = ScenariosController = __decorate([
    (0, common_1.Controller)('scenarios'),
    __metadata("design:paramtypes", [scenarios_service_1.ScenariosService])
], ScenariosController);
//# sourceMappingURL=scenarios.controller.js.map