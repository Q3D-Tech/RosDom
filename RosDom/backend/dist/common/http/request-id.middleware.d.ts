import type { NextFunction, Request, Response } from 'express';
export declare class RequestIdMiddleware {
    use: (req: Request & {
        requestId?: string;
    }, res: Response, next: NextFunction) => void;
}
