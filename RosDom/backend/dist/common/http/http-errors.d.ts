import { HttpException, HttpStatus } from '@nestjs/common';
export declare class AppHttpException extends HttpException {
    constructor(code: string, message: string, status: HttpStatus, details?: unknown[]);
}
export declare function badRequest(code: string, message: string, details?: unknown[]): AppHttpException;
export declare function unauthorized(code?: string, message?: string): AppHttpException;
export declare function forbidden(code?: string, message?: string): AppHttpException;
export declare function notFound(code: string, message: string): AppHttpException;
export declare function conflict(code: string, message: string, details?: unknown[]): AppHttpException;
