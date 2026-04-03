import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { unauthorized } from '../http/http-errors';
import { AccessTokenPayload, isAccessTokenPayload } from './access-token';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PlatformService } from '../../platform/platform.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly platformService: PlatformService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw unauthorized();
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const decoded: unknown = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'rosdom-access',
      });
      if (!isAccessTokenPayload(decoded)) {
        throw unauthorized('invalid_token', 'Token payload is malformed');
      }
      const payload: AccessTokenPayload = decoded;

      const user = await this.platformService.authenticateSession(
        payload.sessionId,
        payload.sub,
      );
      request.user = user;
      return true;
    } catch {
      throw unauthorized('invalid_token', 'Token is invalid or expired');
    }
  }
}
