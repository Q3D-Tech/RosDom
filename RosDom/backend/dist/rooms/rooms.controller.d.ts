import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateRoomDto, UpdateRoomDto } from '../common/types/dtos';
import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    listRooms(user: AuthenticatedUser, homeId: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").Room>>;
    createRoom(user: AuthenticatedUser, homeId: string, dto: CreateRoomDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Room>>;
    updateRoom(user: AuthenticatedUser, roomId: string, dto: UpdateRoomDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Room>>;
}
