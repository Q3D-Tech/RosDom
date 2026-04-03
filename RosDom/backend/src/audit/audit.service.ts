import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class AuditService {
  constructor(private readonly platformService: PlatformService) {}

  list(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getAuditLogs(homeId, user.id);
  }
}
