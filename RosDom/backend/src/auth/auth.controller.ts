import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { Public } from '../common/auth/public.decorator';
import { ok } from '../common/http/api-response';
import type { AuthenticatedUser } from '../common/types/contracts';
import { LoginDto, RefreshDto, RegisterDto } from '../common/types/dtos';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return ok(await this.authService.register(dto));
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return ok(await this.authService.login(dto));
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return ok(await this.authService.refresh(dto));
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.sessionId);
    return ok({ success: true });
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.authService.me(user.id));
  }
}
