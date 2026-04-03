import { AuthenticatedUser } from '../common/types/contracts';
import { CreateFamilyDto, CreateFamilyInviteDto, JoinFamilyDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class FamiliesService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    getCurrentFamily(user: AuthenticatedUser): Promise<import("../common/types/contracts").Family | null>;
    getFamilyMembers(user: AuthenticatedUser): Promise<import("../common/types/contracts").FamilyMember[]>;
    createFamily(user: AuthenticatedUser, dto: CreateFamilyDto): Promise<import("../common/types/contracts").Family>;
    createInvite(user: AuthenticatedUser, dto: CreateFamilyInviteDto): Promise<import("../common/types/contracts").FamilyInvite>;
    joinFamily(user: AuthenticatedUser, dto: JoinFamilyDto): Promise<import("../common/types/contracts").Family>;
}
