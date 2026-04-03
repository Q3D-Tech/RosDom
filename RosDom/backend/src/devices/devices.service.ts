import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  SubmitCommandDto,
  UpdateDevicePlacementDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class DevicesService {
  constructor(private readonly platformService: PlatformService) {}

  listDevices(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getDevices(homeId, user.id);
  }

  getDevice(user: AuthenticatedUser, deviceId: string) {
    return this.platformService.getDeviceDetails(user.id, deviceId);
  }

  getDeviceState(user: AuthenticatedUser, deviceId: string) {
    return this.platformService
      .getDeviceDetails(user.id, deviceId)
      .then((details) => details.latestState);
  }

  updateDevicePlacement(
    user: AuthenticatedUser,
    deviceId: string,
    dto: UpdateDevicePlacementDto,
  ) {
    return this.platformService.updateDevicePlacement(user.id, deviceId, dto);
  }

  submitCommand(
    user: AuthenticatedUser,
    deviceId: string,
    idempotencyKey: string,
    dto: SubmitCommandDto,
  ) {
    return this.platformService.submitCommand(
      user,
      deviceId,
      idempotencyKey,
      dto,
    );
  }

  getHistory(user: AuthenticatedUser, deviceId: string) {
    return this.platformService
      .getDeviceDetails(user.id, deviceId)
      .then((details) => details.commands);
  }

  getCommandStatus(
    user: AuthenticatedUser,
    homeId: string,
    deviceId: string,
    commandId: string,
  ) {
    return this.platformService.getCommandStatus(
      user.id,
      homeId,
      deviceId,
      commandId,
    );
  }
}
