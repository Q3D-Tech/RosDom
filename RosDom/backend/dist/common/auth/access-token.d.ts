export interface AccessTokenPayload {
    sub: string;
    sessionId: string;
    email?: string;
}
export declare function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload;
