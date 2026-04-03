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

export function responseMeta(overrides?: Partial<ApiMeta>): ApiMeta {
  return {
    serverTime: new Date().toISOString(),
    ...overrides,
  };
}

export function ok<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    data,
    meta: responseMeta({ requestId }),
  };
}

export function okList<T>(
  data: T[],
  nextCursor?: string | null,
  requestId?: string,
): ApiListResponse<T> {
  return {
    data,
    meta: responseMeta({ nextCursor: nextCursor ?? null, requestId }),
  };
}
