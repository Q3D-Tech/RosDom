import type { Response } from 'express';
import type { AuthenticatedUser } from '../common/types/contracts';
import { ConnectTuyaIntegrationDto, CreateTuyaLinkSessionDto, SyncIntegrationDto, TuyaOAuthCallbackQueryDto } from '../common/types/dtos';
import { IntegrationsService } from './integrations.service';
export declare class IntegrationsController {
    private readonly integrationsService;
    constructor(integrationsService: IntegrationsService);
    list(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").IntegrationAccount>>;
    connectTuya(user: AuthenticatedUser, dto: ConnectTuyaIntegrationDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").IntegrationAccount>>;
    createTuyaLinkSession(user: AuthenticatedUser, dto: CreateTuyaLinkSessionDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TuyaLinkSession>>;
    getTuyaLinkSession(user: AuthenticatedUser, sessionId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TuyaLinkSession | null>>;
    completeTuyaOAuthCallback(query: TuyaOAuthCallbackQueryDto, response: Response): Promise<void>;
    syncTuya(user: AuthenticatedUser, dto: SyncIntegrationDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").IntegrationSyncResult>>;
}
