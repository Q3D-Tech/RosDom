import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import { badRequest } from '../common/http/http-errors';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateTaskDto,
  ReviewTaskDto,
  SubmitTaskCompletionDto,
  UpdateTaskDto,
} from '../common/types/dtos';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(await this.tasksService.list(user, homeId));
  }

  @Post('tasks')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    return ok(await this.tasksService.create(user, dto));
  }

  @Patch('tasks/:taskId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return ok(await this.tasksService.update(user, taskId, dto));
  }

  @Post('tasks/:taskId/submit')
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body() dto: SubmitTaskCompletionDto,
  ) {
    return ok(await this.tasksService.submit(user, taskId, dto));
  }

  @Post('tasks/:taskId/approve')
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return ok(
      await this.tasksService.review(user, taskId, {
        ...dto,
        approved: true,
      }),
    );
  }

  @Post('tasks/:taskId/reject')
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return ok(
      await this.tasksService.review(user, taskId, {
        ...dto,
        approved: false,
      }),
    );
  }

  @Get('rewards/balance')
  async balance(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return ok(await this.tasksService.balance(user, homeId));
  }

  @Get('rewards/ledger')
  async ledger(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(await this.tasksService.ledger(user, homeId));
  }
}
