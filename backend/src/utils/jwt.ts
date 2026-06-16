import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, LoginResponse } from '../types';
import { TokenExpiredError, TokenInvalidError } from './error';

export function generateToken(payload: JwtPayload): LoginResponse {
  const accessToken = jwt.sign(
    payload as object,
    String(config.jwt.secret),
    { expiresIn: config.jwt.expiresIn as any }
  );

  const refreshToken = jwt.sign(
    { userId: payload.userId },
    String(config.jwt.refreshSecret),
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );

  let expiresIn = 86400;
  const expiresInStr = config.jwt.expiresIn;
  if (expiresInStr.endsWith('h')) {
    expiresIn = parseInt(expiresInStr) * 3600;
  } else if (expiresInStr.endsWith('d')) {
    expiresIn = parseInt(expiresInStr) * 86400;
  } else if (expiresInStr.endsWith('m')) {
    expiresIn = parseInt(expiresInStr) * 60;
  } else {
    expiresIn = parseInt(expiresInStr);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer'
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, String(config.jwt.secret)) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new TokenInvalidError();
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, String(config.jwt.refreshSecret)) as { userId: string };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('Refresh Token已过期');
    }
    throw new TokenInvalidError('Refresh Token无效');
  }
}

export function parseBearerToken(authHeader: string): string | null {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenRemainingTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}