import type { AuthenticatedUser } from '../common/types/contracts';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").NotificationRecord>>;
    markRead(user: AuthenticatedUser, notificationId: string, homeId?: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").NotificationRecord>>;
}
