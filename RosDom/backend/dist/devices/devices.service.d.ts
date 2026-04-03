import { AuthenticatedUser } from '../common/types/contracts';
import { SubmitCommandDto, UpdateDevicePlacementDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class DevicesService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    listDevices(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").Device[]>;
    getDevice(user: AuthenticatedUser, deviceId: string): Promise<import("../common/types/contracts").DeviceDetails>;
    getDeviceState(user: AuthenticatedUser, deviceId: string): Promise<import("../common/types/contracts").DeviceStateSnapshot | null>;
    updateDevicePlacement(user: AuthenticatedUser, deviceId: string, dto: UpdateDevicePlacementDto): Promise<import("../common/types/contracts").DeviceDetails>;
    submitCommand(user: AuthenticatedUser, deviceId: string, idempotencyKey: string, dto: SubmitCommandDto): Promise<import("../common/types/contracts").CommandLog>;
    getHistory(user: AuthenticatedUser, deviceId: string): Promise<import("../common/types/contracts").CommandLog[]>;
    getCommandStatus(user: AuthenticatedUser, homeId: string, deviceId: string, commandId: string): Promise<import("../common/types/contracts").CommandLog>;
}
