import { LoginDto, RefreshDto, RegisterDto } from '../common/types/dtos';
import { PlatformService } from '../platform/platform.service';
export declare class AuthService {
    private readonly platformService;
    constructor(platformService: PlatformService);
    register(dto: RegisterDto): Promise<{
        user: import("../common/types/contracts").User;
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: import("../common/types/contracts").User;
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: string;
        user: import("../common/types/contracts").User;
    }>;
    logout(sessionId: string): Promise<void>;
    me(userId: string): Promise<import("../common/types/contracts").User>;
}
