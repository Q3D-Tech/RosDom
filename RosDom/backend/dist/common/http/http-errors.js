"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppHttpException = void 0;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.conflict = conflict;
const common_1 = require("@nestjs/common");
class AppHttpException extends common_1.HttpException {
    constructor(code, message, status, details = []) {
        super({
            code,
            message,
            details,
        }, status);
    }
}
exports.AppHttpException = AppHttpException;
function badRequest(code, message, details = []) {
    return new AppHttpException(code, message, common_1.HttpStatus.BAD_REQUEST, details);
}
function unauthorized(code = 'unauthorized', message = 'Authentication required') {
    return new AppHttpException(code, message, common_1.HttpStatus.UNAUTHORIZED);
}
function forbidden(code = 'forbidden', message = 'Access denied') {
    return new AppHttpException(code, message, common_1.HttpStatus.FORBIDDEN);
}
function notFound(code, message) {
    return new AppHttpException(code, message, common_1.HttpStatus.NOT_FOUND);
}
function conflict(code, message, details = []) {
    return new AppHttpException(code, message, common_1.HttpStatus.CONFLICT, details);
}
//# sourceMappingURL=http-errors.js.map