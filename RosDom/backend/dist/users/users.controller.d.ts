import type { AuthenticatedUser } from '../common/types/contracts';
import { InviteMemberDto, UpdateBirthYearDto, UpdateMemberDto, UpdateProfileDto, UpdateUserPreferencesDto } from '../common/types/dtos';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").User>>;
    updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").User>>;
    getPreferences(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").UserPreferences>>;
    updatePreferences(user: AuthenticatedUser, dto: UpdateUserPreferencesDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").UserPreferences>>;
    updateBirthYear(user: AuthenticatedUser, userId: string, dto: UpdateBirthYearDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").User>>;
    getMembers(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").HomeMember>>;
    inviteMember(user: AuthenticatedUser, dto: InviteMemberDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").HomeMember>>;
    updateMember(user: AuthenticatedUser, memberId: string, dto: UpdateMemberDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").HomeMember>>;
}
