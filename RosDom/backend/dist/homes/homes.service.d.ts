import { AuthenticatedUser } from '../common/types/contracts';
import { CreateFloorDto, CreateHomeDto, SyncQueryDto, UpdateFloorDto, UpdateHomeStateDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class HomesService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    listHomes(user: AuthenticatedUser): Promise<import("../common/types/contracts").Home[]>;
    createHome(user: AuthenticatedUser, dto: CreateHomeDto): Promise<import("../common/types/contracts").Home>;
    getHome(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").Home>;
    getFloors(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").Floor[]>;
    createFloor(user: AuthenticatedUser, homeId: string, dto: CreateFloorDto): Promise<import("../common/types/contracts").Floor>;
    updateFloor(user: AuthenticatedUser, floorId: string, dto: UpdateFloorDto): Promise<import("../common/types/contracts").Floor>;
    updateHomeState(user: AuthenticatedUser, homeId: string, dto: UpdateHomeStateDto): Promise<import("../common/types/contracts").Home>;
    getSnapshot(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").HomeSnapshot>;
    getSync(user: AuthenticatedUser, homeId: string, query: SyncQueryDto): Promise<import("../common/types/contracts").SyncResponse>;
}
