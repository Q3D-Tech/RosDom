import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateFamilyDto, CreateFamilyInviteDto, JoinFamilyDto } from '../common/types/dtos';
import { FamiliesService } from './families.service';
export declare class FamiliesController {
    private readonly familiesService;
    constructor(familiesService: FamiliesService);
    current(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Family | null>>;
    members(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").FamilyMember>>;
    create(user: AuthenticatedUser, dto: CreateFamilyDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Family>>;
    createInvite(user: AuthenticatedUser, dto: CreateFamilyInviteDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").FamilyInvite>>;
    join(user: AuthenticatedUser, dto: JoinFamilyDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Family>>;
}
