import { Request, Response, NextFunction } from 'express';
import { RequestUser } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}
declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map