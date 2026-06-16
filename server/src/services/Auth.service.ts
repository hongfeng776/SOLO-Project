import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig, bcryptConfig } from '../config/jwt';
import { userDao } from '../dao';
import { JwtPayload, LoginRequest, LoginResponse, CreateUserRequest } from '../types';
import { UserStatus, UserRole } from '../constants/enum';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';

class AuthService {
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, bcryptConfig.saltRounds);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'] });
  }

  public generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'] });
  }

  public verifyToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
  }

  public verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
  }

  public async login(data: LoginRequest): Promise<LoginResponse> {
    const user = await userDao.findByUsername(data.username);

    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.DISABLED) {
      throw new AppError('User is disabled', BusinessCode.USER_DISABLED);
    }

    const isPasswordValid = await this.comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', BusinessCode.USER_PASSWORD_ERROR);
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await userDao.update({ lastLoginAt: new Date() }, { where: { id: user.id } });

    return {
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
      },
    };
  }

  public async register(data: CreateUserRequest): Promise<LoginResponse> {
    const exists = await userDao.existsByUsername(data.username);
    if (exists) {
      throw new AppError('Username already exists', BusinessCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = await userDao.create({
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname || data.username,
      role: data.role as UserRole | undefined,
    });

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
      },
    };
  }

  public async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      const newToken = this.generateToken({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      });
      const newRefreshToken = this.generateRefreshToken({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      });
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', BusinessCode.TOKEN_INVALID);
    }
  }
}

export default new AuthService();
