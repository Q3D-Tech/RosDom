import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateFloorDto, CreateHomeDto, SyncQueryDto, UpdateFloorDto, UpdateHomeStateDto } from '../common/types/dtos';
import { HomesService } from './homes.service';
export declare class HomesController {
    private readonly homesService;
    constructor(homesService: HomesService);
    listHomes(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").Home>>;
    createHome(user: AuthenticatedUser, dto: CreateHomeDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Home>>;
    getHome(user: AuthenticatedUser, homeId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Home>>;
    updateHomeState(user: AuthenticatedUser, homeId: string, dto: UpdateHomeStateDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Home>>;
    getFloors(user: AuthenticatedUser, homeId: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").Floor>>;
    createFloor(user: AuthenticatedUser, homeId: string, dto: CreateFloorDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Floor>>;
    updateFloor(user: AuthenticatedUser, floorId: string, dto: UpdateFloorDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").Floor>>;
    getSnapshot(user: AuthenticatedUser, homeId: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").HomeSnapshot>>;
    getSync(user: AuthenticatedUser, homeId: string, query: SyncQueryDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").SyncResponse>>;
}
