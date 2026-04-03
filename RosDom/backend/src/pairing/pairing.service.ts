import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import {
  AuthenticatedUser,
  PairingCandidate,
  PairingSession,
} from '../common/types/contracts';
import {
  CreatePairingSessionDto,
  SelectCandidateDto,
} from '../common/types/dtos';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../common/http/http-errors';
import { uuidv7 } from '../common/platform/id';

function nowIso() {
  return new Date().toISOString();
}

type PairingSessionRow = {
  id: string;
  public_token: string;
  home_id: string;
  actor_user_id: string;
  device_type: string;
  discovery_method: PairingSession['discoveryMethod'];
  status: PairingSession['status'];
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  selected_candidate_id: string | null;
  candidate_list_hash: string | null;
  candidates: PairingCandidate[] | string | null;
};

@Injectable()
export class PairingService {
  constructor(private readonly db: DatabaseService) {}

  async createPairingSession(
    user: AuthenticatedUser,
    dto: CreatePairingSessionDto,
  ) {
    await this.assertHomeAccess(user.id, dto.homeId);
    const id = uuidv7();
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.db.execute(
      `insert into pairing_sessions (
        id, public_token, home_id, actor_user_id, device_type, discovery_method,
        status, expires_at, completed_at, selected_candidate_id, candidate_list_hash, candidates, created_at
      ) values ($1, $2, $3, $4, $5, $6, 'created', $7, null, null, null, '[]'::jsonb, $8)`,
      [
        id,
        randomBytes(16).toString('hex'),
        dto.homeId,
        user.id,
        dto.deviceType,
        dto.discoveryMethod,
        expiresAt,
        createdAt,
      ],
    );

    return this.getPairingSession(user, id);
  }

  async getPairingSession(user: AuthenticatedUser, pairingSessionId: string) {
    const row = await this.getPairingSessionRow(pairingSessionId);
    await this.assertHomeAccess(user.id, row.home_id);
    return this.toPairingSession(row);
  }

  async discover(user: AuthenticatedUser, pairingSessionId: string) {
    const row = await this.getPairingSessionRow(pairingSessionId);
    await this.assertHomeAccess(user.id, row.home_id);

    throw badRequest(
      'pairing_adapter_not_configured',
      'Обнаружение устройств на этом сервере ещё не подключено. Для pairing нужен реальный Matter/LAN/bridge адаптер.',
    );
  }

  async selectCandidate(
    user: AuthenticatedUser,
    pairingSessionId: string,
    dto: SelectCandidateDto,
  ) {
    const row = await this.getPairingSessionRow(pairingSessionId);
    await this.assertHomeAccess(user.id, row.home_id);

    const candidates = this.parseCandidates(row.candidates);
    const candidate = candidates.find((item) => item.id === dto.candidateId);
    if (!candidate) {
      throw notFound('candidate_not_found', 'Pairing candidate was not found');
    }

    await this.db.execute(
      `update pairing_sessions
       set status = 'candidate_selected',
           selected_candidate_id = $2
       where id = $1`,
      [pairingSessionId, candidate.id],
    );

    const updated = await this.getPairingSessionRow(pairingSessionId);
    return this.toPairingSession(updated);
  }

  async complete(user: AuthenticatedUser, pairingSessionId: string) {
    const row = await this.getPairingSessionRow(pairingSessionId);
    await this.assertHomeAccess(user.id, row.home_id);

    if (!row.selected_candidate_id) {
      throw conflict(
        'candidate_missing',
        'Select a discovered candidate before completing pairing',
      );
    }

    throw badRequest(
      'pairing_completion_requires_adapter',
      'Server-side pairing completion requires a configured bridge or provider adapter. Пока можно сохранить сессию и завершить настройку после подключения реального адаптера.',
    );
  }

  async cancel(user: AuthenticatedUser, pairingSessionId: string) {
    const row = await this.getPairingSessionRow(pairingSessionId);
    await this.assertHomeAccess(user.id, row.home_id);

    await this.db.execute(
      `update pairing_sessions
       set status = 'cancelled'
       where id = $1`,
      [pairingSessionId],
    );

    const updated = await this.getPairingSessionRow(pairingSessionId);
    return this.toPairingSession(updated);
  }

  private async assertHomeAccess(userId: string, homeId: string) {
    const member = await this.db.one<{ id: string }>(
      `select h.id
       from homes h
       left join home_members hm
         on hm.home_id = h.id
        and hm.user_id = $1
        and hm.status = 'active'
       where h.id = $2
         and (h.owner_user_id = $1 or hm.id is not null)`,
      [userId, homeId],
    );
    if (!member) {
      throw forbidden(
        'home_access_denied',
        'You do not have access to this home',
      );
    }
  }

  private async getPairingSessionRow(pairingSessionId: string) {
    const row = await this.db.one<PairingSessionRow>(
      `select
         id,
         public_token,
         home_id,
         actor_user_id,
         device_type,
         discovery_method,
         status,
         expires_at,
         created_at,
         completed_at,
         selected_candidate_id,
         candidate_list_hash,
         candidates
       from pairing_sessions
       where id = $1`,
      [pairingSessionId],
    );

    if (!row) {
      throw notFound(
        'pairing_session_not_found',
        'Pairing session was not found',
      );
    }

    return row;
  }

  private toPairingSession(row: PairingSessionRow): PairingSession {
    return {
      id: row.id,
      publicToken: row.public_token,
      homeId: row.home_id,
      actorUserId: row.actor_user_id,
      deviceType: row.device_type,
      discoveryMethod: row.discovery_method,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      selectedCandidateId: row.selected_candidate_id,
      candidateListHash: row.candidate_list_hash,
      candidates: this.parseCandidates(row.candidates),
    };
  }

  private parseCandidates(
    raw: PairingSessionRow['candidates'],
  ): PairingCandidate[] {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (typeof raw === 'string' && raw.trim()) {
      return JSON.parse(raw) as PairingCandidate[];
    }
    return [];
  }
}
