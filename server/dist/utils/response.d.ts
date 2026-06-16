import { Response } from 'express';
declare class ResponseUtils {
    static success<T = any>(res: Response, data?: T | null, message?: string): void;
    static created<T = any>(res: Response, data?: T | null, message?: string): void;
    static error(res: Response, message: string, code?: number, httpStatus?: number): void;
    static unauthorized(res: Response, message?: string, code?: number): void;
    static forbidden(res: Response, message?: string, code?: number): void;
    static notFound(res: Response, message?: string, code?: number): void;
    static serverError(res: Response, message?: string, code?: number): void;
    static paginated<T = any>(res: Response, list: T[], total: number, page: number, pageSize: number, message?: string): void;
}
export default ResponseUtils;
//# sourceMappingURL=response.d.ts.map