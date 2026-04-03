import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class EventsService {
  constructor(private readonly platformService: PlatformService) {}

  list(user: AuthenticatedUser, homeId: string, afterOffset = 0) {
    return this.platformService.getEvents(homeId, user.id, afterOffset);
  }

  get(user: AuthenticatedUser, homeId: string, eventId: string) {
    return this.platformService.getEvent(homeId, eventId, user.id);
  }
}
