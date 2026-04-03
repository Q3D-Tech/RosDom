import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  LayoutQueryDto,
  PatchLayoutDto,
  PutLayoutDto,
} from '../common/types/dtos';
import { LayoutsService } from './layouts.service';

@Controller()
export class LayoutsController {
  constructor(private readonly layoutsService: LayoutsService) {}

  @Get('homes/:homeId/layouts')
  async getLayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Query() query: LayoutQueryDto,
  ) {
    return ok(await this.layoutsService.getLayout(user, homeId, query));
  }

  @Put('homes/:homeId/layouts')
  async replaceLayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: PutLayoutDto,
  ) {
    return ok(await this.layoutsService.replaceLayout(user, homeId, dto));
  }

  @Patch('homes/:homeId/layouts')
  async patchLayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: PatchLayoutDto,
  ) {
    return ok(await this.layoutsService.patchLayout(user, homeId, dto));
  }

  @Post('homes/:homeId/layouts/validate')
  async validateLayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('homeId') homeId: string,
    @Body() dto: PutLayoutDto,
  ) {
    return ok(await this.layoutsService.validateLayout(user, homeId, dto));
  }
}
