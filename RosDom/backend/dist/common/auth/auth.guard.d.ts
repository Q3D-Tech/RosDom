import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PlatformService } from '../../platform/platform.service';
export declare class AuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtService;
    private readonly configService;
    private readonly platformService;
    constructor(reflector: Reflector, jwtService: JwtService, configService: ConfigService, platformService: PlatformService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
