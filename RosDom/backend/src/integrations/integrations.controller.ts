import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Public } from '../common/auth/public.decorator';
import { ok, okList } from '../common/http/api-response';
import { badRequest } from '../common/http/http-errors';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  ConnectTuyaIntegrationDto,
  CreateTuyaLinkSessionDto,
  SyncIntegrationDto,
  TuyaOAuthCallbackQueryDto,
} from '../common/types/dtos';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

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
    return okList(await this.integrationsService.list(user, homeId));
  }

  @Post('tuya/connect')
  async connectTuya(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectTuyaIntegrationDto,
  ) {
    return ok(await this.integrationsService.connectTuya(user, dto));
  }

  @Post('tuya/link-sessions')
  async createTuyaLinkSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTuyaLinkSessionDto,
  ) {
    return ok(await this.integrationsService.createTuyaLinkSession(user, dto));
  }

  @Get('tuya/link-sessions/:sessionId')
  async getTuyaLinkSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    return ok(
      await this.integrationsService.getTuyaLinkSession(user, sessionId),
    );
  }

  @Public()
  @Get('tuya/oauth/callback')
  async completeTuyaOAuthCallback(
    @Query() query: TuyaOAuthCallbackQueryDto,
    @Res() response: Response,
  ) {
    const html =
      await this.integrationsService.completeTuyaOAuthCallback(query);
    response.type('html').send(html);
  }

  @Post('tuya/sync')
  async syncTuya(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SyncIntegrationDto,
  ) {
    return ok(await this.integrationsService.syncTuya(user, dto));
  }
}
