import type { AuthenticatedUser } from '../common/types/contracts';
import { LoginDto, RefreshDto, RegisterDto } from '../common/types/dtos';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<import("../common/http/api-response").ApiResponse<{
        user: import("../common/types/contracts").User;
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
    }>>;
    login(dto: LoginDto): Promise<import("../common/http/api-response").ApiResponse<{
        user: import("../common/types/contracts").User;
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
    }>>;
    refresh(dto: RefreshDto): Promise<import("../common/http/api-response").ApiResponse<{
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
        user: import("../common/types/contracts").User;
    }>>;
    logout(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiResponse<{
        success: boolean;
    }>>;
    me(user: AuthenticatedUser): Promise<import("../common/http/api-response").ApiResponse<import("../common/types/contracts").User>>;
}
