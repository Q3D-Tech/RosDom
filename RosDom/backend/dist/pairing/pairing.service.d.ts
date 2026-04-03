import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser, PairingSession } from '../common/types/contracts';
import { CreatePairingSessionDto, SelectCandidateDto } from '../common/types/dtos';
export declare class PairingService {
    private readonly db;
    constructor(db: DatabaseService);
    createPairingSession(user: AuthenticatedUser, dto: CreatePairingSessionDto): Promise<PairingSession>;
    getPairingSession(user: AuthenticatedUser, pairingSessionId: string): Promise<PairingSession>;
    discover(user: AuthenticatedUser, pairingSessionId: string): Promise<void>;
    selectCandidate(user: AuthenticatedUser, pairingSessionId: string, dto: SelectCandidateDto): Promise<PairingSession>;
    complete(user: AuthenticatedUser, pairingSessionId: string): Promise<void>;
    cancel(user: AuthenticatedUser, pairingSessionId: string): Promise<PairingSession>;
    private assertHomeAccess;
    private getPairingSessionRow;
    private toPairingSession;
    private parseCandidates;
}
