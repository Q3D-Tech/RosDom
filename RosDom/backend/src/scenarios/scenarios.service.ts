import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser, Scenario } from '../common/types/contracts';
import { CreateScenarioDto, UpdateScenarioDto } from '../common/types/dtos';
import { forbidden, notFound } from '../common/http/http-errors';
import { uuidv7 } from '../common/platform/id';

function nowIso() {
  return new Date().toISOString();
}

type ScenarioRow = {
  id: string;
  home_id: string;
  title: string;
  description: string;
  icon_key: string;
  enabled: boolean;
  execution_mode: Scenario['executionMode'];
  updated_at: string;
};

@Injectable()
export class ScenariosService {
  constructor(private readonly db: DatabaseService) {}

  async list(user: AuthenticatedUser, homeId: string) {
    await this.assertHomeAccess(user.id, homeId);
    const rows = await this.db.query<ScenarioRow>(
      `select id, home_id, title, description, icon_key, enabled, execution_mode, updated_at
       from scenarios
       where home_id = $1
       order by updated_at desc, created_at desc`,
      [homeId],
    );
    return rows.map((row) => this.toScenario(row));
  }

  async create(user: AuthenticatedUser, dto: CreateScenarioDto) {
    await this.assertHomeAccess(user.id, dto.homeId);
    const id = uuidv7();
    const updatedAt = nowIso();

    await this.db.execute(
      `insert into scenarios (
        id, home_id, title, description, icon_key, enabled, execution_mode, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, true, $6, $7, $7)`,
      [
        id,
        dto.homeId,
        dto.title,
        dto.description,
        dto.iconKey,
        dto.executionMode,
        updatedAt,
      ],
    );

    await this.writeEvent(dto.homeId, user.id, 'automation.run.updated', {
      scenarioId: id,
      state: 'created',
    });

    const created = await this.getScenarioRow(id);
    return this.toScenario(created);
  }

  async update(
    user: AuthenticatedUser,
    scenarioId: string,
    dto: UpdateScenarioDto,
  ) {
    const current = await this.getScenarioRow(scenarioId);
    await this.assertHomeAccess(user.id, current.home_id);

    const updatedAt = nowIso();
    const next = {
      title: dto.title ?? current.title,
      description: dto.description ?? current.description,
      iconKey: dto.iconKey ?? current.icon_key,
      enabled: dto.enabled ?? current.enabled,
      executionMode: dto.executionMode ?? current.execution_mode,
    };

    await this.db.execute(
      `update scenarios
       set title = $2,
           description = $3,
           icon_key = $4,
           enabled = $5,
           execution_mode = $6,
           updated_at = $7
       where id = $1`,
      [
        scenarioId,
        next.title,
        next.description,
        next.iconKey,
        next.enabled,
        next.executionMode,
        updatedAt,
      ],
    );

    await this.writeEvent(current.home_id, user.id, 'automation.run.updated', {
      scenarioId,
      state: 'updated',
    });

    const updated = await this.getScenarioRow(scenarioId);
    return this.toScenario(updated);
  }

  async run(user: AuthenticatedUser, scenarioId: string) {
    const scenario = await this.getScenarioRow(scenarioId);
    await this.assertHomeAccess(user.id, scenario.home_id);

    const runId = uuidv7();
    const startedAt = nowIso();
    await this.db.execute(
      `insert into automation_runs (
        id, scenario_id, home_id, status, started_at, finished_at
      ) values ($1, $2, $3, 'queued', $4, null)`,
      [runId, scenarioId, scenario.home_id, startedAt],
    );

    await this.writeEvent(scenario.home_id, user.id, 'automation.run.updated', {
      scenarioId,
      runId,
      status: 'queued',
    });

    return {
      runId,
      scenarioId,
      status: 'queued',
      executedAt: startedAt,
    };
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

  private async getScenarioRow(scenarioId: string) {
    const row = await this.db.one<ScenarioRow>(
      `select id, home_id, title, description, icon_key, enabled, execution_mode, updated_at
       from scenarios
       where id = $1`,
      [scenarioId],
    );
    if (!row) {
      throw notFound('scenario_not_found', 'Scenario was not found');
    }
    return row;
  }

  private async writeEvent(
    homeId: string,
    userId: string,
    topic: string,
    payload: Record<string, unknown>,
  ) {
    await this.db.execute(
      `insert into events (
        id, home_id, user_id, topic, severity, payload, created_at
      ) values ($1, $2, $3, $4, 'info', $5::jsonb, $6)`,
      [uuidv7(), homeId, userId, topic, JSON.stringify(payload), nowIso()],
    );
  }

  private toScenario(row: ScenarioRow): Scenario {
    return {
      id: row.id,
      homeId: row.home_id,
      title: row.title,
      description: row.description,
      iconKey: row.icon_key,
      enabled: row.enabled,
      executionMode: row.execution_mode,
      updatedAt: row.updated_at,
    };
  }
}
