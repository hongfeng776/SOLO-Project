import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@/config';
import { responseUtil } from '@/utils/response';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signToken(payload: Omit<AuthUser, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.jwt.secret) as AuthUser;
  } catch {
    return null;
  }
}

export function authMiddleware(required = true) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization as string;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      if (required) {
        return responseUtil.unauthorized(res);
      }
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      if (required) {
        return responseUtil.unauthorized(res, 'Token 已过期或无效');
      }
      return next();
    }

    req.user = decoded;
    next();
  };
}

export default authMiddleware;
