import { Request, Response, NextFunction } from 'express';
import { parseBearerToken, verifyAccessToken, ApiResult } from '../utils';
import { UserRepository } from '../repositories';
import { JwtPayload, UserVO } from '../types';
import * as _ from 'lodash';

declare global {
  namespace Express {
    interface Request {
      user?: UserVO;
      userId?: string;
      tokenPayload?: JwtPayload;
    }
  }
}

const userRepository = new UserRepository();
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/refresh-token',
  '/api/auth/captcha',
  '/api/health',
  '/api/health/check'
];

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = req.path;

    if (publicPaths.some(p => url.startsWith(p))) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = parseBearerToken(authHeader || '');

    if (!token) {
      res.status(200).json(ApiResult.unauthorized('请先登录'));
      return;
    }

    const payload = verifyAccessToken(token);
    req.tokenPayload = payload;
    req.userId = payload.userId;

    const user = await userRepository.findWithRoles(payload.userId);

    if (!user) {
      res.status(200).json(ApiResult.unauthorized('用户不存在或已被删除'));
      return;
    }

    if (user.status !== 1) {
      res.status(200).json(ApiResult.forbidden('账号已被禁用，请联系管理员'));
      return;
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const userVO: UserVO = _.omit(userData, ['password']) as UserVO;

    if (userData.roles) {
      userVO.roles = userData.roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code
      }));
    }

    if (userData.organization) {
      userVO.org_name = userData.organization.name;
    }

    req.user = userVO;

    next();
  } catch (error: any) {
    if (error.code === 401001) {
      res.status(200).json(ApiResult.tokenExpired());
      return;
    }
    if (error.code === 401002) {
      res.status(200).json(ApiResult.tokenInvalid());
      return;
    }
    res.status(200).json(ApiResult.unauthorized(error.message || '认证失败'));
  }
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = parseBearerToken(authHeader || '');

    if (token) {
      const payload = verifyAccessToken(token);
      req.tokenPayload = payload;
      req.userId = payload.userId;
    }
  } catch {
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    res.status(200).json(ApiResult.unauthorized('请先登录'));
    return;
  }
  next();
}