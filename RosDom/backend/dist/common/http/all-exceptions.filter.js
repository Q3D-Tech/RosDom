"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'internal_error';
        let message = 'Internal server error';
        let details = [];
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const payload = exception.getResponse();
            if (typeof payload === 'string') {
                message = payload;
            }
            else if (typeof payload === 'object' && payload !== null) {
                const record = payload;
                code = typeof record.code === 'string' ? record.code : code;
                message =
                    typeof record.message === 'string'
                        ? record.message
                        : Array.isArray(record.message)
                            ? record.message.join(', ')
                            : message;
                details = Array.isArray(record.details)
                    ? record.details
                    : Array.isArray(record.message)
                        ? record.message
                        : [];
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        const body = {
            error: {
                code,
                message,
                details,
                requestId: request.requestId,
                retryable: Number(status) >= 500,
            },
        };
        response.status(status).json(body);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map