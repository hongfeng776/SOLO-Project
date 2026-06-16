import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import { JwtPayload, TokenResult } from '../types';

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenResult {
  const accessToken = jwt.sign(payload, jwtConfig.secret as jwt.Secret, {
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret as jwt.Secret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const decoded = jwt.decode(accessToken) as JwtPayload;
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

export function refreshToken(refreshToken: string): TokenResult | null {
  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as JwtPayload;
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      id: decoded.id,
      username: decoded.username,
    };
    return generateToken(payload);
  } catch {
    return null;
  }
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
