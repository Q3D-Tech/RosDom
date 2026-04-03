export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  email?: string;
}

export function isAccessTokenPayload(
  payload: unknown,
): payload is AccessTokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.sessionId === 'string' &&
    (candidate.email === undefined || typeof candidate.email === 'string')
  );
}
