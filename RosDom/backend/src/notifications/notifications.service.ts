import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly platformService: PlatformService) {}

  list(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getNotifications(homeId, user.id);
  }

  markRead(user: AuthenticatedUser, homeId: string, notificationId: string) {
    return this.platformService.markNotificationRead(
      homeId,
      notificationId,
      user.id,
    );
  }
}
