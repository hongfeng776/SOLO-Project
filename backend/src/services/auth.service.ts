import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userDao from '../dao/user.dao';
import { AuthError, NotFoundError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import UserModel from '../models/user.model';

class AuthService {
  async login(username: string, password: string) {
    const user = await userDao.findByUsername(username);
    if (!user) {
      throw new AuthError('用户名或密码错误');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AuthError('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new AuthError('账号已被禁用');
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

    await userDao.updateById(user.id, {
      lastLoginTime: new Date(),
    });

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
