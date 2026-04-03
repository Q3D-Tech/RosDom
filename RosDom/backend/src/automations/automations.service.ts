import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser, AutomationRun } from '../common/types/contracts';
import { forbidden } from '../common/http/http-errors';

type AutomationRunRow = {
  id: string;
  scenario_id: string;
  home_id: string;
  status: AutomationRun['status'];
  started_at: string;
  finished_at: string | null;
};

@Injectable()
export class AutomationsService {
  constructor(private readonly db: DatabaseService) {}

  async listRuns(user: AuthenticatedUser, homeId: string) {
    await this.assertHomeAccess(user.id, homeId);
    const rows = await this.db.query<AutomationRunRow>(
      `select id, scenario_id, home_id, status, started_at, finished_at
       from automation_runs
       where home_id = $1
       order by started_at desc
       limit 100`,
      [homeId],
    );

    return rows.map((row) => ({
      id: row.id,
      scenarioId: row.scenario_id,
      homeId: row.home_id,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
    }));
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
}
