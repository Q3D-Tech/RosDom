import type { AuthenticatedUser } from '../common/types/contracts';
import { SubmitCommandDto, UpdateDevicePlacementDto } from '../common/types/dtos';
import { DevicesService } from './devices.service';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    listDevices(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").Device>>;
    getDevice(user: AuthenticatedUser, deviceId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").DeviceDetails>>;
    getDeviceState(user: AuthenticatedUser, deviceId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").DeviceStateSnapshot | null>>;
    updateDevicePlacement(user: AuthenticatedUser, deviceId: string, dto: UpdateDevicePlacementDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").DeviceDetails>>;
    submitCommand(user: AuthenticatedUser, deviceId: string, idempotencyKey: string | undefined, dto: SubmitCommandDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").CommandLog>>;
    getHistory(user: AuthenticatedUser, deviceId: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").CommandLog>>;
    getCommandStatus(user: AuthenticatedUser, homeId: string, deviceId: string, commandId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").CommandLog>>;
}
