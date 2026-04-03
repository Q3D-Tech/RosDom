"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformModule = void 0;
const common_1 = require("@nestjs/common");
const integration_credentials_service_1 = require("./integration-credentials.service");
const platform_service_1 = require("./platform.service");
const tuya_open_api_client_1 = require("./tuya-open-api.client");
let PlatformModule = class PlatformModule {
};
exports.PlatformModule = PlatformModule;
exports.PlatformModule = PlatformModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            platform_service_1.PlatformService,
            integration_credentials_service_1.IntegrationCredentialsService,
            tuya_open_api_client_1.TuyaOpenApiClient,
        ],
        exports: [platform_service_1.PlatformService, integration_credentials_service_1.IntegrationCredentialsService, tuya_open_api_client_1.TuyaOpenApiClient],
    })
], PlatformModule);
//# sourceMappingURL=platform.module.js.map