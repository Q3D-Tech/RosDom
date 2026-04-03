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
import { CreateScenarioDto, UpdateScenarioDto } from '../common/types/dtos';
import { ScenariosService } from './scenarios.service';

@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
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
    return okList(await this.scenariosService.list(user, homeId));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScenarioDto,
  ) {
    return ok(await this.scenariosService.create(user, dto));
  }

  @Patch(':scenarioId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scenarioId') scenarioId: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return ok(await this.scenariosService.update(user, scenarioId, dto));
  }

  @Post(':scenarioId/run')
  async run(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scenarioId') scenarioId: string,
  ) {
    return ok(await this.scenariosService.run(user, scenarioId));
  }
}
