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
exports.FamiliesService = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("../platform/platform.service");
let FamiliesService = class FamiliesService {
    platformService;
    constructor(platformService) {
        this.platformService = platformService;
    }
    getCurrentFamily(user) {
        return this.platformService.getCurrentFamily(user.id);
    }
    getFamilyMembers(user) {
        return this.platformService.getFamilyMembers(user.id);
    }
    createFamily(user, dto) {
        return this.platformService.createFamily(user.id, dto);
    }
    createInvite(user, dto) {
        return this.platformService.createFamilyInvite(user.id, dto);
    }
    joinFamily(user, dto) {
        return this.platformService.joinFamily(user.id, dto);
    }
};
exports.FamiliesService = FamiliesService;
exports.FamiliesService = FamiliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], FamiliesService);
//# sourceMappingURL=families.service.js.map