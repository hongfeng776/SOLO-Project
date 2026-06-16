import { Op } from 'sequelize';
import { User } from '../models/User';
import { UserDao } from '../dao/UserDao';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  username?: string;
  phone?: string;
  status?: number;
}

export interface UserCreatePayload {
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: number;
}

export interface UserUpdatePayload {
  username?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: number;
}

export interface UserUpdateStatusPayload {
  status: number;
}

class UserService {
  private userDao: UserDao;

  constructor() {
    this.userDao = new UserDao();
  }

  async getList(params: UserQueryParams): Promise<PageResult<User>> {
    const { page = 1, pageSize = 10, username, phone, status } = params;

    const where: any = {};

    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }

    if (phone) {
      where.phone = { [Op.like]: `%${phone}%` };
    }

    if (status !== undefined) {
      where.status = status;
    }

    return this.userDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<User> {
    const user = await this.userDao.findById(id);

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return user;
  }

  async create(payload: UserCreatePayload): Promise<User> {
    const { username, phone, email, status = 1 } = payload;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('用户名已存在', 400);
    }

    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        throw new AppError('手机号已存在', 400);
      }
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new AppError('邮箱已存在', 400);
      }
    }

    return this.userDao.create({
      username,
      phone,
      email,
      avatar: payload.avatar,
      status,
    });
  }

  async update(id: number, payload: UserUpdatePayload): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const { username, phone, email } = payload;

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        throw new AppError('用户名已存在', 400);
      }
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        throw new AppError('手机号已存在', 400);
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new AppError('邮箱已存在', 400);
      }
    }

    await this.userDao.update(id, payload);

    const updatedUser = await this.userDao.findById(id);
    if (!updatedUser) {
      throw new AppError('用户不存在', 404);
    }

    return updatedUser;
  }

  async delete(id: number): Promise<void> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    await this.userDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的用户', 400);
    }

    return this.userDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (status !== 0 && status !== 1) {
      throw new AppError('状态值无效', 400);
    }

    await this.userDao.update(id, { status });

    const updatedUser = await this.userDao.findById(id);
    if (!updatedUser) {
      throw new AppError('用户不存在', 404);
    }

    return updatedUser;
  }
}

export const userService = new UserService();
export default UserService;
