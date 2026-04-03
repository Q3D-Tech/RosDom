import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import { badRequest } from '../common/http/http-errors';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  SubmitCommandDto,
  UpdateDevicePlacementDto,
} from '../common/types/dtos';
import { DevicesService } from './devices.service';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('devices')
  async listDevices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(await this.devicesService.listDevices(user, homeId));
  }

  @Get('devices/:deviceId')
  async getDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ) {
    return ok(await this.devicesService.getDevice(user, deviceId));
  }

  @Get('devices/:deviceId/state')
  async getDeviceState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ) {
    return ok(await this.devicesService.getDeviceState(user, deviceId));
  }

  @Patch('devices/:deviceId')
  async updateDevicePlacement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDevicePlacementDto,
  ) {
    return ok(
      await this.devicesService.updateDevicePlacement(user, deviceId, dto),
    );
  }

  @Post('devices/:deviceId/commands')
  async submitCommand(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: SubmitCommandDto,
  ) {
    if (!idempotencyKey) {
      throw badRequest(
        'idempotency_key_required',
        'Idempotency-Key header is required',
      );
    }
    return ok(
      await this.devicesService.submitCommand(
        user,
        deviceId,
        idempotencyKey,
        dto,
      ),
    );
  }

  @Get('devices/:deviceId/history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ) {
    return okList(await this.devicesService.getHistory(user, deviceId));
  }

  @Get('homes/:homeId/devices/:deviceId/command-status/:commandId')
  async getCommandStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Param('deviceId') deviceId: string,
    @Param('commandId') commandId: string,
  ) {
    return ok(
      await this.devicesService.getCommandStatus(
        user,
        homeId,
        deviceId,
        commandId,
      ),
    );
  }
}
