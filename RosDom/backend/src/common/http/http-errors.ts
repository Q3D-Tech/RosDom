import { HttpException, HttpStatus } from '@nestjs/common';

export class AppHttpException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus,
    details: unknown[] = [],
  ) {
    super(
      {
        code,
        message,
        details,
      },
      status,
    );
  }
}

export function badRequest(
  code: string,
  message: string,
  details: unknown[] = [],
) {
  return new AppHttpException(code, message, HttpStatus.BAD_REQUEST, details);
}

export function unauthorized(
  code = 'unauthorized',
  message = 'Authentication required',
) {
  return new AppHttpException(code, message, HttpStatus.UNAUTHORIZED);
}

export function forbidden(code = 'forbidden', message = 'Access denied') {
  return new AppHttpException(code, message, HttpStatus.FORBIDDEN);
}

export function notFound(code: string, message: string) {
  return new AppHttpException(code, message, HttpStatus.NOT_FOUND);
}

export function conflict(
  code: string,
  message: string,
  details: unknown[] = [],
) {
  return new AppHttpException(code, message, HttpStatus.CONFLICT, details);
}
