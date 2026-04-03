import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateFamilyDto,
  CreateFamilyInviteDto,
  JoinFamilyDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class FamiliesService {
  constructor(private readonly platformService: PlatformService) {}

  getCurrentFamily(user: AuthenticatedUser) {
    return this.platformService.getCurrentFamily(user.id);
  }

  getFamilyMembers(user: AuthenticatedUser) {
    return this.platformService.getFamilyMembers(user.id);
  }

  createFamily(user: AuthenticatedUser, dto: CreateFamilyDto) {
    return this.platformService.createFamily(user.id, dto);
  }

  createInvite(user: AuthenticatedUser, dto: CreateFamilyInviteDto) {
    return this.platformService.createFamilyInvite(user.id, dto);
  }

  joinFamily(user: AuthenticatedUser, dto: JoinFamilyDto) {
    return this.platformService.joinFamily(user.id, dto);
  }
}
