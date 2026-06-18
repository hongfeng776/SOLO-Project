import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userDao from '../dao/user.dao';
import loginLogDao from '../dao/login-log.dao';
import { AuthError, NotFoundError, ForbiddenError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import UserModel from '../models/user.model';
import userPermissionService from './user-permission.service';

interface ClientInfo {
  ip?: string;
  device?: string;
  deviceFingerprint?: string;
  location?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  networkType?: string;
  isp?: string;
  proxyDetected?: boolean;
  vpnDetected?: boolean;
  behaviorScore?: number;
  latitude?: number;
  longitude?: number;
  source?: string;
}

class AuthService {
  async login(username: string, password: string, clientInfo: ClientInfo = {}) {
    const ip = clientInfo.ip || '127.0.0.1';
    const deviceFingerprint = clientInfo.deviceFingerprint || 'default_' + Date.now();

    const user = await userDao.findByUsername(username);
    if (!user) {
      await userPermissionService.recordLoginFailed(username, ip, deviceFingerprint, clientInfo, '用户不存在');
      throw new AuthError('用户名或密码错误');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await userPermissionService.recordLoginFailed(username, ip, deviceFingerprint, clientInfo, '密码错误');
      throw new AuthError('用户名或密码错误');
    }

    if (user.status !== 1) {
      await userPermissionService.recordLoginFailed(username, ip, deviceFingerprint, clientInfo, '账号已禁用');
      throw new AuthError('账号已被禁用');
    }

    if ((user as any).accountStatus !== 'normal') {
      await userPermissionService.recordLoginFailed(username, ip, deviceFingerprint, clientInfo, '账号状态异常');
      throw new AuthError('账号已被冻结或过期');
    }

    const riskCheck = await userPermissionService.checkLoginRisk(
      username,
      ip,
      deviceFingerprint,
      clientInfo
    );

    if (!riskCheck.passed) {
      await userPermissionService.recordLoginFailed(username, ip, deviceFingerprint, clientInfo, riskCheck.blockReason || '风控拦截');
      throw new ForbiddenError(riskCheck.blockReason || '登录被风控系统拦截');
    }

    if (riskCheck.requireVerify) {
      return {
        requireVerify: true,
        verifyType: riskCheck.verifyType,
        verificationToken: riskCheck.verificationToken,
        riskLevel: riskCheck.riskLevel,
        riskScore: riskCheck.riskScore,
        anomalyType: riskCheck.anomalyType,
        anomalyReason: riskCheck.anomalyReason,
      };
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET || 'youcai-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await userPermissionService.recordLoginSuccess(user.id, username, ip, deviceFingerprint, clientInfo);

    const userData = user.toJSON();
    delete (userData as any).password;

    return {
      token,
      user: userData,
      riskLevel: riskCheck.riskLevel,
      riskScore: riskCheck.riskScore,
    };
  }

  async verifyLogin(verificationToken: string, verifyCode: string, verifyType: string) {
    const result = await userPermissionService.verifyTwoFactor(verificationToken, verifyCode, verifyType);

    if (!result.success || !result.userId) {
      throw new AuthError(result.message || '验证失败');
    }

    const user = await userDao.findById(result.userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET || 'youcai-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const userData = user.toJSON();
    delete (userData as any).password;

    return {
      token,
      user: userData,
    };
  }

  async getUserInfo(id: number) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    const userData = user.toJSON();
    delete (userData as any).password;
    return userData;
  }
}

class UserService {
  async getList(params: any): Promise<IPaginationResult<UserModel>> {
    const { username, role, status, ...rest } = params;
    const where: any = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }
    if (role) {
      where.role = role;
    }
    if (status !== undefined) {
      where.status = status;
    }

    return userDao.paginate(rest, {
      where,
      order: [['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<UserModel | null> {
    const user = await userDao.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    const userData = user.toJSON();
    delete (userData as any).password;
    return userData as any;
  }

  async create(data: any): Promise<UserModel> {
    const user = await userDao.create(data);
    const userData = user.toJSON();
    delete (userData as any).password;
    return userData as any;
  }

  async update(id: number, data: any): Promise<[number, UserModel[]]> {
    await this.getById(id);
    if (data.password === '') {
      delete data.password;
    }
    return userDao.updateById(id, data);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return userDao.destroyById(id);
  }
}

const userService = new UserService();

export default new AuthService();
export { UserService, userService };
