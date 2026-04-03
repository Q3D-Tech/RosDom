import { AuthenticatedUser } from '../common/types/contracts';
import { PlatformService } from '../platform/platform.service';
export declare class AuditService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    list(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").AuditLog[]>;
}
