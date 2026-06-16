import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';
import { JwtPayload, UserInfo } from '../types';
import { User } from '../models/User';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    unauthorized(res, 'Authorization header is missing or invalid');
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    unauthorized(res, 'Token is missing');
    return;
  }

  const payload = verifyToken(token) as JwtPayload | null;

  if (!payload) {
    unauthorized(res, 'Token is invalid or expired');
    return;
  }

  try {
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'username', 'phone', 'email', 'avatar', 'status'],
    });

    if (!user) {
      unauthorized(res, 'User not found');
      return;
    }

    if (user.status === 0) {
      unauthorized(res, 'Account is disabled');
      return;
    }

    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    };

    req.user = userInfo;
    next();
  } catch (error) {
    unauthorized(res, 'Authentication failed');
  }
}

export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token) as JwtPayload | null;

  if (!payload) {
    next();
    return;
  }

  User.findByPk(payload.id, {
    attributes: ['id', 'username', 'phone', 'email', 'avatar', 'status'],
  })
    .then((user) => {
      if (user && user.status !== 0) {
        req.user = {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
        };
      }
      next();
    })
    .catch(() => {
      next();
    });
}
