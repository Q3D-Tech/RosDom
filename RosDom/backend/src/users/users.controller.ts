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
  InviteMemberDto,
  UpdateBirthYearDto,
  UpdateMemberDto,
  UpdateProfileDto,
  UpdateUserPreferencesDto,
} from '../common/types/dtos';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/me')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.usersService.getProfile(user));
  }

  @Patch('users/me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return ok(await this.usersService.updateProfile(user, dto));
  }

  @Get('users/me/preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.usersService.getPreferences(user));
  }

  @Patch('users/me/preferences')
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return ok(await this.usersService.updatePreferences(user, dto));
  }

  @Patch('users/:userId/birth-year')
  async updateBirthYear(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateBirthYearDto,
  ) {
    return ok(await this.usersService.updateBirthYear(user, userId, dto));
  }

  @Get('members')
  async getMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('homeId') homeId?: string,
  ) {
    if (!homeId) {
      throw badRequest(
        'home_id_required',
        'homeId query parameter is required',
      );
    }
    return okList(await this.usersService.getMembers(user, homeId));
  }

  @Post('members/invite')
  async inviteMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ) {
    return ok(await this.usersService.inviteMember(user, dto));
  }

  @Patch('members/:memberId')
  async updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return ok(await this.usersService.updateMember(user, memberId, dto));
  }
}
