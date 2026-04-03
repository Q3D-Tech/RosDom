import { AuthenticatedUser } from '../common/types/contracts';
import { LayoutQueryDto, PatchLayoutDto, PutLayoutDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class LayoutsService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    getLayout(user: AuthenticatedUser, homeId: string, query: LayoutQueryDto): Promise<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>;
    replaceLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto): Promise<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>;
    patchLayout(user: AuthenticatedUser, homeId: string, dto: PatchLayoutDto): Promise<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>;
    validateLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto): Promise<{
        valid: boolean;
    }>;
}
