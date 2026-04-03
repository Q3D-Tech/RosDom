import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import { badRequest } from '../common/http/http-errors';
import type { AuthenticatedUser } from '../common/types/contracts';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(await this.notificationsService.list(user, homeId));
  }

  @Post(':notificationId/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return ok(
      await this.notificationsService.markRead(user, homeId, notificationId),
    );
  }
}
