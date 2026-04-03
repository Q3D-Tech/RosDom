import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateTaskDto,
  ReviewTaskDto,
  SubmitTaskCompletionDto,
  UpdateTaskDto,
} from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class TasksService {
  constructor(private readonly platformService: PlatformService) {}

  list(user: AuthenticatedUser, homeId: string) {
    return this.platformService.listTasks(homeId, user.id);
  }

  create(user: AuthenticatedUser, dto: CreateTaskDto) {
    return this.platformService.createTask(user.id, dto);
  }

  update(user: AuthenticatedUser, taskId: string, dto: UpdateTaskDto) {
    return this.platformService.updateTask(user.id, taskId, dto);
  }

  submit(
    user: AuthenticatedUser,
    taskId: string,
    dto: SubmitTaskCompletionDto,
  ) {
    return this.platformService.submitTask(user.id, taskId, dto);
  }

  review(user: AuthenticatedUser, taskId: string, dto: ReviewTaskDto) {
    return this.platformService.reviewTask(user.id, taskId, dto);
  }

  balance(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getRewardBalance(user.id, homeId);
  }

  ledger(user: AuthenticatedUser, homeId: string) {
    return this.platformService.getRewardLedger(user.id, homeId);
  }
}
