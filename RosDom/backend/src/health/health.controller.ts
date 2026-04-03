import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/auth/public.decorator';
import { ok } from '../common/http/api-response';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  getHealth() {
    return ok(this.healthService.getHealth());
  }
}
