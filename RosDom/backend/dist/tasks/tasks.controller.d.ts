import type { AuthenticatedUser } from '../common/types/contracts';
import { CreateTaskDto, ReviewTaskDto, SubmitTaskCompletionDto, UpdateTaskDto } from '../common/types/dtos';
import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    list(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").TaskRecord>>;
    create(user: AuthenticatedUser, dto: CreateTaskDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TaskRecord>>;
    update(user: AuthenticatedUser, taskId: string, dto: UpdateTaskDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TaskRecord>>;
    submit(user: AuthenticatedUser, taskId: string, dto: SubmitTaskCompletionDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TaskRecord>>;
    approve(user: AuthenticatedUser, taskId: string, dto: ReviewTaskDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TaskRecord>>;
    reject(user: AuthenticatedUser, taskId: string, dto: ReviewTaskDto): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").TaskRecord>>;
    balance(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").RewardBalance>>;
    ledger(user: AuthenticatedUser, homeId?: string): Promise<import("../common/http/api-response").ApiListResponse<import("../common/types/contracts").RewardLedgerEntry>>;
}
