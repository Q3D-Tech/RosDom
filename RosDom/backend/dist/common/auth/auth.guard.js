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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const http_errors_1 = require("../http/http-errors");
const access_token_1 = require("./access-token");
const public_decorator_1 = require("./public.decorator");
const platform_service_1 = require("../../platform/platform.service");
let AuthGuard = class AuthGuard {
    reflector;
    jwtService;
    configService;
    platformService;
    constructor(reflector, jwtService, configService, platformService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
        this.configService = configService;
        this.platformService = platformService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context
            .switchToHttp()
            .getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw (0, http_errors_1.unauthorized)();
        }
        const token = authHeader.slice('Bearer '.length);
        try {
            const decoded = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_ACCESS_SECRET') ??
                    'rosdom-access',
            });
            if (!(0, access_token_1.isAccessTokenPayload)(decoded)) {
                throw (0, http_errors_1.unauthorized)('invalid_token', 'Token payload is malformed');
            }
            const payload = decoded;
            const user = await this.platformService.authenticateSession(payload.sessionId, payload.sub);
            request.user = user;
            return true;
        }
        catch {
            throw (0, http_errors_1.unauthorized)('invalid_token', 'Token is invalid or expired');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService,
        platform_service_1.PlatformService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map