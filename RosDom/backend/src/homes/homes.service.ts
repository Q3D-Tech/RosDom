import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateFloorDto,
  CreateHomeDto,
  SyncQueryDto,
  UpdateFloorDto,
  UpdateHomeStateDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class HomesService {
  constructor(private readonly platformService: PlatformService) {}

  listHomes(user: AuthenticatedUser) {
    return this.platformService.getHomesForUser(user.id);
  }

  createHome(user: AuthenticatedUser, dto: CreateHomeDto) {
    return this.platformService.createHome(user.id, dto);
  }

  getHome(user: AuthenticatedUser, homeId: string) {
    return this.platformService
      .ensureHomeAccess(user.id, homeId)
      .then(() => this.platformService.getHome(homeId));
  }

  getFloors(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getFloors(homeId, user.id);
  }

  createFloor(user: AuthenticatedUser, homeId: string, dto: CreateFloorDto) {
    return this.platformService.createFloor(user.id, homeId, dto);
  }

  updateFloor(user: AuthenticatedUser, floorId: string, dto: UpdateFloorDto) {
    return this.platformService.updateFloor(user.id, floorId, dto);
  }

  updateHomeState(
    user: AuthenticatedUser,
    homeId: string,
    dto: UpdateHomeStateDto,
  ) {
    return this.platformService.updateHomeState(user.id, homeId, dto);
  }

  getSnapshot(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getSnapshot(homeId, user.id);
  }

  getSync(user: AuthenticatedUser, homeId: string, query: SyncQueryDto) {
    return this.platformService.getSync(homeId, user.id, query);
  }
}
