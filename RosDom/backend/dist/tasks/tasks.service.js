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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("../platform/platform.service");
let TasksService = class TasksService {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    list(user, homeId) {
        return this.platformService.listTasks(homeId, user.id);
    }
    create(user, dto) {
        return this.platformService.createTask(user.id, dto);
    }
    update(user, taskId, dto) {
        return this.platformService.updateTask(user.id, taskId, dto);
    }
    submit(user, taskId, dto) {
        return this.platformService.submitTask(user.id, taskId, dto);
    }
    review(user, taskId, dto) {
        return this.platformService.reviewTask(user.id, taskId, dto);
    }
    balance(user, homeId) {
        return this.platformService.getRewardBalance(user.id, homeId);
    }
    ledger(user, homeId) {
        return this.platformService.getRewardLedger(user.id, homeId);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map