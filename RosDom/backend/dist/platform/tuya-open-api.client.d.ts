import { ConfigService } from '@nestjs/config';
type TuyaRegion = 'eu' | 'us' | 'cn' | 'in';
export interface TuyaTokenBundle {
    accessToken: string;
    refreshToken: string;
    uid: string;
    expiresAt: string;
    region: TuyaRegion;
    schema?: string;
}
export interface TuyaUserDevice {
    id: string;
    name: string;
    productName: string;
    category: string;
    iconUrl?: string | null;
    online: boolean;
    model?: string | null;
    productId?: string | null;
}
export interface TuyaDeviceFunctionSpec {
    code: string;
    type: string;
    values?: string | Record<string, unknown> | null;
}
export interface TuyaDeviceStatus {
    code: string;
    value: unknown;
}
export declare class TuyaOpenApiClient {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    isConfigured(): boolean;
    createAuthorizationUrl(region: string | undefined, state: string): string;
    exchangeAuthorizationCode(code: string, region: string | undefined): Promise<TuyaTokenBundle>;
    loginAssociatedUser({ username, password, countryCode, schema, region, }: {
        username: string;
        password: string;
        countryCode: string;
        schema?: string;
        region?: string;
    }): Promise<TuyaTokenBundle>;
    refreshAccessToken(bundle: TuyaTokenBundle): Promise<TuyaTokenBundle>;
    getUserDevices(bundle: TuyaTokenBundle): Promise<TuyaUserDevice[]>;
    getDeviceSpecifications(deviceId: string, bundle: TuyaTokenBundle): Promise<TuyaDeviceFunctionSpec[]>;
    getDeviceStatus(deviceId: string, bundle: TuyaTokenBundle): Promise<TuyaDeviceStatus[]>;
    sendDeviceCommands(deviceId: string, commands: Array<{
        code: string;
        value: unknown;
    }>, bundle: TuyaTokenBundle): Promise<Record<string, unknown>>;
    private request;
    private buildStringToSign;
    private mapUserDevice;
    private mapFunctionSpecs;
    private resolveApiBaseUrl;
    private resolveAuthorizationUrl;
    private resolveRegion;
    private resolveAssociatedAppSchema;
    private resolveOAuthIdentifier;
    private asString;
    private get optionalClientId();
    private get optionalClientSecret();
    private get clientId();
    private get clientSecret();
    private get redirectUrl();
}
export {};
