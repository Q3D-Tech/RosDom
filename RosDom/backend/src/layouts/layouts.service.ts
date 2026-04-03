import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  LayoutQueryDto,
  PatchLayoutDto,
  PutLayoutDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class LayoutsService {
  constructor(private readonly platformService: PlatformService) {}

  getLayout(user: AuthenticatedUser, homeId: string, query: LayoutQueryDto) {
    return this.platformService.getLayout(homeId, user.id, query.floorId);
  }

  replaceLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto) {
    return this.platformService.replaceLayout(user.id, homeId, dto);
  }

  patchLayout(user: AuthenticatedUser, homeId: string, dto: PatchLayoutDto) {
    return this.platformService.replaceLayout(user.id, homeId, dto);
  }

  validateLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto) {
    return this.platformService.validateLayoutDraft(user.id, homeId, dto);
  }
}
