export interface ApiMeta {
    serverTime: string;
    nextCursor?: string | null;
    requestId?: string;
}
export interface ApiResponse<T> {
    data: T;
    meta: ApiMeta;
}
export interface ApiListResponse<T> {
    data: T[];
    meta: ApiMeta;
}
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details: unknown[];
        requestId?: string;
        retryable: boolean;
    };
}
export declare function responseMeta(overrides?: Partial<ApiMeta>): ApiMeta;
export declare function ok<T>(data: T, requestId?: string): ApiResponse<T>;
export declare function okList<T>(data: T[], nextCursor?: string | null, requestId?: string): ApiListResponse<T>;
