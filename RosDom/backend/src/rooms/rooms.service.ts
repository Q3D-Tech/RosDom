import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import { CreateRoomDto, UpdateRoomDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class RoomsService {
  constructor(private readonly platformService: PlatformService) {}

  listRooms(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getRooms(homeId, user.id);
  }

  createRoom(user: AuthenticatedUser, homeId: string, dto: CreateRoomDto) {
    return this.platformService.createRoom(user.id, homeId, dto);
  }

  updateRoom(user: AuthenticatedUser, roomId: string, dto: UpdateRoomDto) {
    return this.platformService.updateRoom(user.id, roomId, dto);
  }
}
