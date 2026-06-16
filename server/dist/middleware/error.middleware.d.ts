import { Request, Response, NextFunction } from 'express';
declare class AppError extends Error {
    code: number;
    httpStatus: number;
    constructor(message: string, code?: number, httpStatus?: number);
}
declare const errorMiddleware: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
declare const notFoundMiddleware: (req: Request, res: Response) => void;
export { errorMiddleware, notFoundMiddleware, AppError };
export default errorMiddleware;
//# sourceMappingURL=error.middleware.d.ts.map