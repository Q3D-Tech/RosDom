import { Injectable } from '@nestjs/common';
import { LoginDto, RefreshDto, RegisterDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';

@Injectable()
export class AuthService {
  constructor(private readonly platformService: PlatformService) {}

  register(dto: RegisterDto) {
    return this.platformService.register(dto);
  }

  login(dto: LoginDto) {
    return this.platformService.login(dto);
  }

  refresh(dto: RefreshDto) {
    return this.platformService.refresh(dto);
  }

  logout(sessionId: string) {
    return this.platformService.logout(sessionId);
  }

  me(userId: string) {
    return this.platformService.getUser(userId);
  }
}
