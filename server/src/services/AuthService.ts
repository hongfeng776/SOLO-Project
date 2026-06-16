import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userDAO from '@dao/UserDAO';
import { db } from '@models/index';
import { jwtConfig } from '@config/index';
import { CacheUtil } from '@utils/cache';
import { IJwtPayload } from '@typings/index';
import { AppError } from '@middlewares/errorHandler';

const USER_CACHE_PREFIX = 'user:info:';
const USER_CACHE_TTL = 3600;

class AuthService {
  async login(username: string, password: string, ip?: string) {
    const user = await userDAO.findByUsername(username);
    if (!user) {
      throw new AppError(401, 'Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError(401, 'Invalid username or password');
    }

    if (user.status !== 1) {
      throw new AppError(403, 'Account is disabled');
    }

    const userWithRoles: any = await db.User.findByPk(user.id, {
      include: [{ model: db.Role, as: 'roles', include: [{ model: db.Permission, as: 'permissions' }] }],
    });

    const roleCodes = userWithRoles?.roles?.map((r: any) => r.role_code) || [];

    const jwtPayload: IJwtPayload = {
      userId: user.id,
      username: user.username,
      roles: roleCodes,
    };

    const accessToken = jwt.sign(jwtPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);
    const refreshToken = jwt.sign({ userId: user.id }, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as jwt.SignOptions);

    await userDAO.update(
      { last_login_at: new Date(), last_login_ip: ip || '' } as any,
      { where: { id: user.id } } as any,
    );

    const userInfo = userWithRoles?.toJSON();
    await CacheUtil.set(`${USER_CACHE_PREFIX}${user.id}`, userInfo, USER_CACHE_TTL);

    return { accessToken, refreshToken, user: userInfo };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as { userId: number };
      const user: any = await db.User.findByPk(decoded.userId, {
        include: [{ model: db.Role, as: 'roles' }],
      });

      if (!user) {
        throw new AppError(401, 'User not found');
      }

      if (user.status !== 1) {
        throw new AppError(403, 'Account is disabled');
      }

      const roleCodes = user.roles?.map((r: any) => r.role_code) || [];
      const jwtPayload: IJwtPayload = {
        userId: user.id,
        username: user.username,
        roles: roleCodes,
      };

      const accessToken = jwt.sign(jwtPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);
      return { accessToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: number) {
    const cacheKey = `${USER_CACHE_PREFIX}${userId}`;
    const cached = await CacheUtil.get(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await db.User.findByPk(userId, {
      include: [{ model: db.Role, as: 'roles', include: [{ model: db.Permission, as: 'permissions' }] }],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const userInfo = user.toJSON();
    await CacheUtil.set(cacheKey, userInfo, USER_CACHE_TTL);
    return userInfo;
  }
}

export default new AuthService();
