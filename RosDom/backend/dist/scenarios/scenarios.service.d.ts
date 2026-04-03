import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser, Scenario } from '../common/types/contracts';
import { CreateScenarioDto, UpdateScenarioDto } from '../common/types/dtos';
export declare class ScenariosService {
    private readonly db;
    constructor(db: DatabaseService);
    list(user: AuthenticatedUser, homeId: string): Promise<Scenario[]>;
    create(user: AuthenticatedUser, dto: CreateScenarioDto): Promise<Scenario>;
    update(user: AuthenticatedUser, scenarioId: string, dto: UpdateScenarioDto): Promise<Scenario>;
    run(user: AuthenticatedUser, scenarioId: string): Promise<{
        runId: string;
        scenarioId: string;
        status: string;
        executedAt: string;
    }>;
    private assertHomeAccess;
    private getScenarioRow;
    private writeEvent;
    private toScenario;
}
