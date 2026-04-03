import type { AuthenticatedUser } from '../common/types/contracts';
import { CompletePairingSessionDto, CreatePairingSessionDto, SelectCandidateDto } from '../common/types/dtos';
import { PairingService } from './pairing.service';
export declare class PairingController {
    private readonly pairingService;
    constructor(pairingService: PairingService);
    createPairingSession(user: AuthenticatedUser, dto: CreatePairingSessionDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").PairingSession>>;
    getPairingSession(user: AuthenticatedUser, pairingSessionId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").PairingSession>>;
    discover(user: AuthenticatedUser, pairingSessionId: string): Promise<import("../common/http/api-response").ApiResponse<void>>;
    selectCandidate(user: AuthenticatedUser, pairingSessionId: string, dto: SelectCandidateDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").PairingSession>>;
    complete(user: AuthenticatedUser, pairingSessionId: string, dto: CompletePairingSessionDto): Promise<import("../common/http/api-response").ApiResponse<void>>;
    cancel(user: AuthenticatedUser, pairingSessionId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").PairingSession>>;
}
