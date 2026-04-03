"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomesModule = void 0;
const common_1 = require("@nestjs/common");
const homes_service_1 = require("./homes.service");
const homes_controller_1 = require("./homes.controller");
let HomesModule = class HomesModule {
};
exports.HomesModule = HomesModule;
exports.HomesModule = HomesModule = __decorate([
    (0, common_1.Module)({
        providers: [homes_service_1.HomesService],
        controllers: [homes_controller_1.HomesController],
    })
], HomesModule);
//# sourceMappingURL=homes.module.js.map