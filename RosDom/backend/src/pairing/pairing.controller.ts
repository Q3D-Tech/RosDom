import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { ok } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import {
  CompletePairingSessionDto,
  CreatePairingSessionDto,
  SelectCandidateDto,
} from '../common/types/dtos';
import { PairingService } from './pairing.service';

@Controller('pairing-sessions')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  @Post()
  async createPairingSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePairingSessionDto,
  ) {
    return ok(await this.pairingService.createPairingSession(user, dto));
  }

  @Get(':pairingSessionId')
  async getPairingSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pairingSessionId') pairingSessionId: string,
  ) {
    return ok(
      await this.pairingService.getPairingSession(user, pairingSessionId),
    );
  }

  @Post(':pairingSessionId/discover')
  async discover(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pairingSessionId') pairingSessionId: string,
  ) {
    return ok(await this.pairingService.discover(user, pairingSessionId));
  }

  @Post(':pairingSessionId/select-candidate')
  async selectCandidate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pairingSessionId') pairingSessionId: string,
    @Body() dto: SelectCandidateDto,
  ) {
    return ok(
      await this.pairingService.selectCandidate(user, pairingSessionId, dto),
    );
  }

  @Post(':pairingSessionId/complete')
  async complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pairingSessionId') pairingSessionId: string,
    @Body() dto: CompletePairingSessionDto,
  ) {
    void dto;
    return ok(await this.pairingService.complete(user, pairingSessionId));
  }

  @Post(':pairingSessionId/cancel')
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('pairingSessionId') pairingSessionId: string,
  ) {
    return ok(await this.pairingService.cancel(user, pairingSessionId));
  }
}
