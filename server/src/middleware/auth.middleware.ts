import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { BusinessCode } from '../constants/statusCode';
import ResponseUtils from '../utils/response';
import { JwtPayload, RequestUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ResponseUtils.unauthorized(res, 'Missing or invalid authorization header', BusinessCode.TOKEN_INVALID);
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtils.unauthorized(res, 'Token expired', BusinessCode.TOKEN_EXPIRED);
    } else {
      ResponseUtils.unauthorized(res, 'Invalid token', BusinessCode.TOKEN_INVALID);
    }
  }
};

export default authMiddleware;
