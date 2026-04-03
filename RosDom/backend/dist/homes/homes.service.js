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
exports.HomesService = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("../platform/platform.service");
let HomesService = class HomesService {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    listHomes(user) {
        return this.platformService.getHomesForUser(user.id);
    }
    createHome(user, dto) {
        return this.platformService.createHome(user.id, dto);
    }
    getHome(user, homeId) {
        return this.platformService
            .ensureHomeAccess(user.id, homeId)
            .then(() => this.platformService.getHome(homeId));
    }
    getFloors(user, homeId) {
        return this.platformService.getFloors(homeId, user.id);
    }
    createFloor(user, homeId, dto) {
        return this.platformService.createFloor(user.id, homeId, dto);
    }
    updateFloor(user, floorId, dto) {
        return this.platformService.updateFloor(user.id, floorId, dto);
    }
    updateHomeState(user, homeId, dto) {
        return this.platformService.updateHomeState(user.id, homeId, dto);
    }
    getSnapshot(user, homeId) {
        return this.platformService.getSnapshot(homeId, user.id);
    }
    getSync(user, homeId, query) {
        return this.platformService.getSync(homeId, user.id, query);
    }
};
exports.HomesService = HomesService;
exports.HomesService = HomesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], HomesService);
//# sourceMappingURL=homes.service.js.map