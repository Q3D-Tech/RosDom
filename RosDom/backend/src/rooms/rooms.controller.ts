import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateRoomDto, UpdateRoomDto } from '../common/types/dtos';
import { RoomsService } from './rooms.service';

@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('homes/:homeId/rooms')
  async listRooms(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
  ) {
    return okList(await this.roomsService.listRooms(user, homeId));
  }

  @Post('homes/:homeId/rooms')
  async createRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: CreateRoomDto,
  ) {
    return ok(await this.roomsService.createRoom(user, homeId, dto));
  }

  @Patch('rooms/:roomId')
  async updateRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return ok(await this.roomsService.updateRoom(user, roomId, dto));
  }
}
