import { AuthenticatedUser } from '../common/types/contracts';
import { InviteMemberDto, UpdateBirthYearDto, UpdateMemberDto, UpdateProfileDto, UpdateUserPreferencesDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class UsersService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    getProfile(user: AuthenticatedUser): Promise<import("../common/types/contracts").User>;
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<import("../common/types/contracts").User>;
    getPreferences(user: AuthenticatedUser): Promise<import("../common/types/contracts").UserPreferences>;
    updatePreferences(user: AuthenticatedUser, dto: UpdateUserPreferencesDto): Promise<import("../common/types/contracts").UserPreferences>;
    updateBirthYear(user: AuthenticatedUser, targetUserId: string, dto: UpdateBirthYearDto): Promise<import("../common/types/contracts").User>;
    getMembers(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").HomeMember[]>;
    inviteMember(user: AuthenticatedUser, dto: InviteMemberDto): Promise<import("../common/types/contracts").HomeMember>;
    updateMember(user: AuthenticatedUser, memberId: string, dto: UpdateMemberDto): Promise<import("../common/types/contracts").HomeMember>;
}
