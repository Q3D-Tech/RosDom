import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser } from '../common/types/contracts';
export declare class AutomationsService {
    private readonly db;
    constructor(db: DatabaseService);
    listRuns(user: AuthenticatedUser, homeId: string): Promise<{
        id: string;
        scenarioId: string;
        homeId: string;
        status: "queued" | "completed" | "failed" | "running";
        startedAt: string;
        finishedAt: string | null;
    }[]>;
    private assertHomeAccess;
}
