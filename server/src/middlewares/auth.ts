import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@config/index';
import { IJwtPayload } from '@typings/index';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as IJwtPayload;
    req.user = decoded;
    next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}

export function authorize(...requiredRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (requiredRoles.length === 0) {
      return next();
    }

    const hasRole = req.user.roles.some((role) => requiredRoles.includes(role));

    if (!hasRole) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}

export function checkPermission(requiredPermission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    const superAdminRole = 'super_admin';

    if (req.user.roles.includes(superAdminRole)) {
      return next();
    }

    const userPermissions = req.headers['x-permissions'] as string | undefined;

    if (!userPermissions) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    const permissions = userPermissions.split(',');

    if (!permissions.includes(requiredPermission)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}
