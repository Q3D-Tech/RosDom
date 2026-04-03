import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';
export declare class NotificationsService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    list(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").NotificationRecord[]>;
    markRead(user: AuthenticatedUser, homeId: string, notificationId: string): Promise<import("../common/types/contracts").NotificationRecord>;
}
