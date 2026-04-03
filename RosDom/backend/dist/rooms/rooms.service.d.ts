import { AuthenticatedUser } from '../common/types/contracts';
import { CreateRoomDto, UpdateRoomDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class RoomsService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    listRooms(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").Room[]>;
    createRoom(user: AuthenticatedUser, homeId: string, dto: CreateRoomDto): Promise<import("../common/types/contracts").Room>;
    updateRoom(user: AuthenticatedUser, roomId: string, dto: UpdateRoomDto): Promise<import("../common/types/contracts").Room>;
}
