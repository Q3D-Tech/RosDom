import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok, okList } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  CreateFamilyDto,
  CreateFamilyInviteDto,
  JoinFamilyDto,
} from '../common/types/dtos';
import { FamiliesService } from './families.service';

@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get('current')
  async current(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.familiesService.getCurrentFamily(user));
  }

  @Get('members')
  async members(@CurrentUser() user: AuthenticatedUser) {
    return okList(await this.familiesService.getFamilyMembers(user));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFamilyDto,
  ) {
    return ok(await this.familiesService.createFamily(user, dto));
  }

  @Post('invites')
  async createInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFamilyInviteDto,
  ) {
    return ok(await this.familiesService.createInvite(user, dto));
  }

  @Post('join')
  async join(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinFamilyDto,
  ) {
    return ok(await this.familiesService.joinFamily(user, dto));
  }
}
