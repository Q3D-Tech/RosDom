import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateFloorDto,
  CreateHomeDto,
  SyncQueryDto,
  UpdateFloorDto,
  UpdateHomeStateDto,
} from '../common/types/dtos';
import { HomesService } from './homes.service';

@Controller()
export class HomesController {
  constructor(private readonly homesService: HomesService) {}

  @Get('homes')
  async listHomes(@CurrentUser() user: AuthenticatedUser) {
    return okList(await this.homesService.listHomes(user));
  }

  @Post('homes')
  async createHome(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeDto,
  ) {
    return ok(await this.homesService.createHome(user, dto));
  }

  @Get('homes/:homeId')
  async getHome(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
  ) {
    return ok(await this.homesService.getHome(user, homeId));
  }

  @Patch('homes/:homeId/state')
  async updateHomeState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: UpdateHomeStateDto,
  ) {
    return ok(await this.homesService.updateHomeState(user, homeId, dto));
  }

  @Get('homes/:homeId/floors')
  async getFloors(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
  ) {
    return okList(await this.homesService.getFloors(user, homeId));
  }

  @Post('homes/:homeId/floors')
  async createFloor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: CreateFloorDto,
  ) {
    return ok(await this.homesService.createFloor(user, homeId, dto));
  }

  @Patch('floors/:floorId')
  async updateFloor(
    @CurrentUser() user: AuthenticatedUser,
    @Param('floorId') floorId: string,
    @Body() dto: UpdateFloorDto,
  ) {
    return ok(await this.homesService.updateFloor(user, floorId, dto));
  }

  @Get('homes/:homeId/snapshot')
  async getSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
  ) {
    return ok(await this.homesService.getSnapshot(user, homeId));
  }

  @Get('homes/:homeId/sync')
  async getSync(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Query() query: SyncQueryDto,
  ) {
    return ok(await this.homesService.getSync(user, homeId, query));
  }
}
