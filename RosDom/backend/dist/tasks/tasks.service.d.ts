import { AuthenticatedUser } from '../common/types/contracts';
import { CreateTaskDto, ReviewTaskDto, SubmitTaskCompletionDto, UpdateTaskDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class TasksService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    list(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").TaskRecord[]>;
    create(user: AuthenticatedUser, dto: CreateTaskDto): Promise<import("../common/types/contracts").TaskRecord>;
    update(user: AuthenticatedUser, taskId: string, dto: UpdateTaskDto): Promise<import("../common/types/contracts").TaskRecord>;
    submit(user: AuthenticatedUser, taskId: string, dto: SubmitTaskCompletionDto): Promise<import("../common/types/contracts").TaskRecord>;
    review(user: AuthenticatedUser, taskId: string, dto: ReviewTaskDto): Promise<import("../common/types/contracts").TaskRecord>;
    balance(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").RewardBalance>;
    ledger(user: AuthenticatedUser, homeId: string): Promise<import("../common/types/contracts").RewardLedgerEntry[]>;
}
