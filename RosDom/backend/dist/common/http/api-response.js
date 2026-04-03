"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseMeta = responseMeta;
exports.ok = ok;
exports.okList = okList;
function responseMeta(overrides) {
    return {
        serverTime: new Date().toISOString(),
        ...overrides,
    };
}
function ok(data, requestId) {
    return {
        data,
        meta: responseMeta({ requestId }),
    };
}
function okList(data, nextCursor, requestId) {
    return {
        data,
        meta: responseMeta({ nextCursor: nextCursor ?? null, requestId }),
    };
}
//# sourceMappingURL=api-response.js.map