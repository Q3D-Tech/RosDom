import { ConfigService } from '@nestjs/config';
export declare class IntegrationCredentialsService {
    private readonly configService;
    constructor(configService: ConfigService);
    encrypt(value: unknown): Buffer;
    decrypt<T>(payload: Buffer | Uint8Array | null | undefined): T | null;
    private resolveKey;
}
