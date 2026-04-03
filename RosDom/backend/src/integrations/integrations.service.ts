import { Injectable } from '@nestjs/common';
import { TuyaOAuthCallbackQueryDto } from '../common/types/dtos';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  ConnectTuyaIntegrationDto,
  CreateTuyaLinkSessionDto,
  SyncIntegrationDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly platformService: PlatformService) {}

  list(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getIntegrations(homeId, user.id);
  }

  connectTuya(user: AuthenticatedUser, dto: ConnectTuyaIntegrationDto) {
    return this.platformService.connectTuyaIntegration(user.id, dto);
  }

  createTuyaLinkSession(
    user: AuthenticatedUser,
    dto: CreateTuyaLinkSessionDto,
  ) {
    return this.platformService.createTuyaLinkSession(user.id, dto);
  }

  getTuyaLinkSession(user: AuthenticatedUser, sessionId: string) {
    return this.platformService.getTuyaLinkSession(user.id, sessionId);
  }

  completeTuyaOAuthCallback(query: TuyaOAuthCallbackQueryDto) {
    return this.platformService.completeTuyaOAuthCallback(query);
  }

  syncTuya(user: AuthenticatedUser, dto: SyncIntegrationDto) {
    return this.platformService.syncTuyaIntegration(user.id, dto.homeId);
  }
}
