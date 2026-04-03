import type { AuthenticatedUser } from '../common/types/contracts';
import { EventQueryDto } from '../common/types/dtos';
import { EventsService } from './events.service';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    list(user: AuthenticatedUser, query: EventQueryDto): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").EventRecord>>;
    get(user: AuthenticatedUser, eventId: string, homeId?: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").EventRecord>>;
}
