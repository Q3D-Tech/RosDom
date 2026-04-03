"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
class RequestIdMiddleware {
    use = (req, res, next) => {
        const requestId = req.header('x-request-id') ?? (0, node_crypto_1.randomUUID)();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        next();
    };
}
exports.RequestIdMiddleware = RequestIdMiddleware;
//# sourceMappingURL=request-id.middleware.js.map