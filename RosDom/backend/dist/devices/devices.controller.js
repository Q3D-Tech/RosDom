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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/auth/current-user.decorator");
const api_response_1 = require("../common/http/api-response");
const http_errors_1 = require("../common/http/http-errors");
const dtos_1 = require("../common/types/dtos");
const devices_service_1 = require("./devices.service");
let DevicesController = class DevicesController {
    devicesService;
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    async listDevices(user, homeId) {
        if (!homeId) {
            throw (0, http_errors_1.badRequest)('home_id_required', 'homeId query parameter is required');
        }
        return (0, api_response_1.okList)(await this.devicesService.listDevices(user, homeId));
    }
    async getDevice(user, deviceId) {
        return (0, api_response_1.ok)(await this.devicesService.getDevice(user, deviceId));
    }
    async getDeviceState(user, deviceId) {
        return (0, api_response_1.ok)(await this.devicesService.getDeviceState(user, deviceId));
    }
    async updateDevicePlacement(user, deviceId, dto) {
        return (0, api_response_1.ok)(await this.devicesService.updateDevicePlacement(user, deviceId, dto));
    }
    async submitCommand(user, deviceId, idempotencyKey, dto) {
        if (!idempotencyKey) {
            throw (0, http_errors_1.badRequest)('idempotency_key_required', 'Idempotency-Key header is required');
        }
        return (0, api_response_1.ok)(await this.devicesService.submitCommand(user, deviceId, idempotencyKey, dto));
    }
    async getHistory(user, deviceId) {
        return (0, api_response_1.okList)(await this.devicesService.getHistory(user, deviceId));
    }
    async getCommandStatus(user, homeId, deviceId, commandId) {
        return (0, api_response_1.ok)(await this.devicesService.getCommandStatus(user, homeId, deviceId, commandId));
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Get)('devices'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/state'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDeviceState", null);
__decorate([
    (0, common_1.Patch)('devices/:deviceId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dtos_1.UpdateDevicePlacementDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateDevicePlacement", null);
__decorate([
    (0, common_1.Post)('devices/:deviceId/commands'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, dtos_1.SubmitCommandDto]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "submitCommand", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('homes/:homeId/devices/:deviceId/command-status/:commandId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('homeId')),
    __param(2, (0, common_1.Param)('deviceId')),
    __param(3, (0, common_1.Param)('commandId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getCommandStatus", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map