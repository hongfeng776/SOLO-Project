import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthError, ForbiddenError } from '../utils/app-error';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  companyId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new AuthError('请先登录');
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'youcai-secret'
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthError('登录状态已失效');
  }
};

export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthError('请先登录');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('无权限操作');
    }

    next();
  };
};
