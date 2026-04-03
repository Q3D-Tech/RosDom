import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateScenarioDto, UpdateScenarioDto } from '../common/types/dtos';
import { ScenariosService } from './scenarios.service';
export declare class ScenariosController {
    private readonly scenariosService;
    constructor(scenariosService: ScenariosService);
    list(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").Scenario>>;
    create(user: AuthenticatedUser, dto: CreateScenarioDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Scenario>>;
    update(user: AuthenticatedUser, scenarioId: string, dto: UpdateScenarioDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Scenario>>;
    run(user: AuthenticatedUser, scenarioId: string): Promise<import("../common/http/api-response").ApiResponse<{
        runId: string;
        scenarioId: string;
        status: string;
        executedAt: string;
    }>>;
}
