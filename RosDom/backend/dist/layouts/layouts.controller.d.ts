import type { AuthenticatedUser } from '../common/types/contracts';
import { LayoutQueryDto, PatchLayoutDto, PutLayoutDto } from '../common/types/dtos';
import { LayoutsService } from './layouts.service';
export declare class LayoutsController {
    private readonly layoutsService;
    constructor(layoutsService: LayoutsService);
    getLayout(user: AuthenticatedUser, homeId: string, query: LayoutQueryDto): Promise<import("../common/http/api-response").ApiResponse<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>>;
    replaceLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto): Promise<import("../common/http/api-response").ApiResponse<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>>;
    patchLayout(user: AuthenticatedUser, homeId: string, dto: PatchLayoutDto): Promise<import("../common/http/api-response").ApiResponse<{
        homeId: string;
        revision: number;
        floorId: string;
        blocks: import("../common/types/contracts").RoomLayoutBlock[];
        items: import("../common/types/contracts").LayoutItem[];
    }>>;
    validateLayout(user: AuthenticatedUser, homeId: string, dto: PutLayoutDto): Promise<import("../common/http/api-response").ApiResponse<{
        valid: boolean;
    }>>;
}
