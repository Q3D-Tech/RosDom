import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';
export declare class EventsService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    list(user: AuthenticatedUser, homeId: string, afterOffset?: number): Promise<import("../common/types/contracts").EventRecord[]>;
    get(user: AuthenticatedUser, homeId: string, eventId: string): Promise<import("../common/types/contracts").EventRecord>;
}
