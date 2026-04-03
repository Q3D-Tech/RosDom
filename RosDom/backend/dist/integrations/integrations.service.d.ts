import { TuyaOAuthCallbackQueryDto } from '../common/types/dtos';
import { AuthenticatedUser } from '../common/types/contracts';
import { ConnectTuyaIntegrationDto, CreateTuyaLinkSessionDto, SyncIntegrationDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class IntegrationsService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    list(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").IntegrationAccount[]>;
    connectTuya(user: AuthenticatedUser, dto: ConnectTuyaIntegrationDto): Promise<import("../common/types/contracts").IntegrationAccount>;
    createTuyaLinkSession(user: AuthenticatedUser, dto: CreateTuyaLinkSessionDto): Promise<import("../common/types/contracts").TuyaLinkSession>;
    getTuyaLinkSession(user: AuthenticatedUser, sessionId: string): Promise<import("../common/types/contracts").TuyaLinkSession | null>;
    completeTuyaOAuthCallback(query: TuyaOAuthCallbackQueryDto): Promise<string>;
    syncTuya(user: AuthenticatedUser, dto: SyncIntegrationDto): Promise<import("../common/types/contracts").IntegrationSyncResult>;
}
