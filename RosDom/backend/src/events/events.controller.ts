import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import { badRequest } from '../common/http/http-errors';
import type { AuthenticatedUser } from '../common/types/contracts';
import { EventQueryDto } from '../common/types/dtos';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EventQueryDto,
  ) {
    const homeId = query.homeId;
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(
      await this.eventsService.list(user, homeId, query.afterOffset ?? 0),
    );
  }

  @Get(':eventId')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return ok(await this.eventsService.get(user, homeId, eventId));
  }
}
