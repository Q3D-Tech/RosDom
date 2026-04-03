"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccessTokenPayload = isAccessTokenPayload;
function isAccessTokenPayload(payload) {
    if (typeof payload !== 'object' || payload === null) {
        return false;
    }
    const candidate = payload;
    return (typeof candidate.sub === 'string' &&
        typeof candidate.sessionId === 'string' &&
        (candidate.email === undefined || typeof candidate.email === 'string'));
}
//# sourceMappingURL=access-token.js.map