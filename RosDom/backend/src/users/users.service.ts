import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  InviteMemberDto,
  UpdateBirthYearDto,
  UpdateMemberDto,
  UpdateProfileDto,
  UpdateUserPreferencesDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class UsersService {
  constructor(private readonly platformService: PlatformService) {}

  getProfile(user: AuthenticatedUser) {
    return this.platformService.getUser(user.id);
  }

  updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
    return this.platformService.updateProfile(user.id, dto);
  }

  getPreferences(user: AuthenticatedUser) {
    return this.platformService.getUserPreferences(user.id);
  }

  updatePreferences(user: AuthenticatedUser, dto: UpdateUserPreferencesDto) {
    return this.platformService.updateUserPreferences(user.id, dto);
  }

  updateBirthYear(
    user: AuthenticatedUser,
    targetUserId: string,
    dto: UpdateBirthYearDto,
  ) {
    return this.platformService.updateBirthYear(user.id, targetUserId, dto);
  }

  getMembers(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getMembers(homeId, user.id);
  }

  inviteMember(user: AuthenticatedUser, dto: InviteMemberDto) {
    return this.platformService.inviteMember(user.id, {
      homeId: dto.homeId,
      userId: dto.userId,
      role: dto.role,
    });
  }

  updateMember(
    user: AuthenticatedUser,
    memberId: string,
    dto: UpdateMemberDto,
  ) {
    return this.platformService.updateMember(user.id, memberId, dto);
  }
}
