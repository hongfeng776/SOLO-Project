import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Admin } from '../models/Admin';
import redis from '../config/redis';
import { jwtConfig } from '../config';
import { AppError } from '../middlewares/errorHandler';

export interface LoginPayload {
  username: string;
  password: string;
  captchaKey: string;
  captcha: string;
}

export interface TokenPayload {
  id: number;
  username: string;
  role: number;
}

export interface CaptchaResponse {
  key: string;
  image: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
    role: number;
  };
}

class AuthService {
  private readonly CAPTCHA_TTL = 300;
  private readonly TOKEN_PREFIX = 'auth:token:';
  private readonly CAPTCHA_PREFIX = 'auth:captcha:';

  async generateCaptcha(): Promise<CaptchaResponse> {
    const key = crypto.randomUUID();
    const code = this.generateRandomCode(4);
    const image = this.generateSvgCaptcha(code);

    await redis.setex(
      `${this.CAPTCHA_PREFIX}${key}`,
      this.CAPTCHA_TTL,
      code.toLowerCase()
    );

    return { key, image };
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { username, password, captchaKey, captcha } = payload;

    await this.verifyCaptcha(captchaKey, captcha);

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      throw new AppError('用户名或密码错误', 401);
    }

    if (admin.status !== 1) {
      throw new AppError('账户已被禁用', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401);
    }

    const tokenPayload: TokenPayload = {
      id: admin.id,
      username: admin.username,
      role: admin.role ?? 2,
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    const tokenKey = `${this.TOKEN_PREFIX}${admin.id}`;
    await redis.setex(tokenKey, this.getTokenExpiresIn(), token);

    return {
      token,
      refreshToken,
      user: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        avatar: admin.avatar,
        role: admin.role ?? 2,
      },
    };
  }

  async logout(userId: number): Promise<void> {
    const tokenKey = `${this.TOKEN_PREFIX}${userId}`;
    await redis.del(tokenKey);
  }

  async getUserInfo(userId: number): Promise<{
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
    role: number;
    status: number;
    created_at: Date;
  }> {
    const admin = await Admin.findByPk(userId, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'role', 'status', 'created_at'],
    });

    if (!admin) {
      throw new AppError('用户不存在', 404);
    }

    return {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      avatar: admin.avatar,
      role: admin.role ?? 2,
      status: admin.status ?? 1,
      created_at: admin.created_at,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as TokenPayload;

      const admin = await Admin.findByPk(decoded.id);
      if (!admin || admin.status !== 1) {
        throw new AppError('用户不存在或已被禁用', 401);
      }

      const tokenPayload: TokenPayload = {
        id: admin.id,
        username: admin.username,
        role: admin.role ?? 2,
      };

      const newToken = this.generateToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      const tokenKey = `${this.TOKEN_PREFIX}${admin.id}`;
      await redis.setex(tokenKey, this.getTokenExpiresIn(), newToken);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('刷新令牌已过期', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的刷新令牌', 401);
      }
      throw error;
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as TokenPayload;

      const tokenKey = `${this.TOKEN_PREFIX}${decoded.id}`;
      const storedToken = await redis.get(tokenKey);

      if (!storedToken || storedToken !== token) {
        throw new AppError('令牌已失效', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('令牌已过期', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('无效的令牌', 401);
      }
      throw error;
    }
  }

  private async verifyCaptcha(key: string, code: string): Promise<void> {
    const captchaKey = `${this.CAPTCHA_PREFIX}${key}`;
    const storedCode = await redis.get(captchaKey);

    if (!storedCode) {
      throw new AppError('验证码已过期', 400);
    }

    if (storedCode !== code.toLowerCase()) {
      throw new AppError('验证码错误', 400);
    }

    await redis.del(captchaKey);
  }

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateSvgCaptcha(code: string): string {
    const width = 120;
    const height = 40;
    const colors = ['#333', '#666', '#999', '#336699', '#663399', '#993366'];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svg += `<rect width="100%" height="100%" fill="#f5f5f5"/>`;

    for (let i = 0; i < 4; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
    }

    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = Math.random() * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.5"/>`;
    }

    const charWidth = width / code.length;
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = charWidth * i + charWidth / 2;
      const y = height / 2 + (Math.random() * 10 - 5);
      const rotate = (Math.random() * 30 - 15);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const fontSize = 20 + Math.random() * 8;
      svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="${color}" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    }

    svg += '</svg>';
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.secret as jwt.Secret, {
      expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret as jwt.Secret, {
      expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  private getTokenExpiresIn(): number {
    const match = jwtConfig.expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 604800;
    }
  }
}

export const authService = new AuthService();
export default AuthService;
