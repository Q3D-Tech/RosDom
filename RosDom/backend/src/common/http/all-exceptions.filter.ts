import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiErrorResponse } from './api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'Internal server error';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
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
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ApiErrorResponse = {
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
}
