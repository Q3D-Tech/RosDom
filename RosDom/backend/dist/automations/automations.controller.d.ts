import type { AuthenticatedUser } from '../common/types/contracts';
import { AutomationsService } from './automations.service';
export declare class AutomationsController {
    private readonly automationsService;
    constructor(automationsService: AutomationsService);
    listRuns(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<{
        id: string;
        scenarioId: string;
        homeId: string;
        status: "queued" | "completed" | "failed" | "running";
        startedAt: string;
        finishedAt: string | null;
    }>>;
}
