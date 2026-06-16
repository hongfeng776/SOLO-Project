import { userDao } from '../dao';
import { CreateUserRequest, UpdateUserRequest, PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import authService from './Auth.service';
import { UserAttributes } from '../models/User.model';
import { UserRole } from '../constants/enum';
import { omit } from 'lodash';

class UserService {
  public async create(data: CreateUserRequest) {
    const exists = await userDao.existsByUsername(data.username);
    if (exists) {
      throw new AppError('Username already exists', BusinessCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await authService.hashPassword(data.password);
    const user = await userDao.create({
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname || data.username,
      role: data.role as UserRole | undefined,
    });

    return this.sanitizeUser(user);
  }

  public async findById(id: string) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  public async findByUsername(username: string) {
    const user = await userDao.findByUsername(username);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  public async findAll(params: PaginationParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await userDao.findAndCountAll({
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const sanitizedList = rows.map((user) => this.sanitizeUser(user));

    return {
      list: sanitizedList,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: UpdateUserRequest) {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }

    const updateData: Partial<UserAttributes> = {};

    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname;
    }
    if (data.password !== undefined) {
      updateData.password = await authService.hashPassword(data.password);
    }
    if (data.role !== undefined) {
      updateData.role = data.role as any;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    await userDao.update(updateData, { where: { id } });

    const updatedUser = await userDao.findById(id);
    return this.sanitizeUser(updatedUser!);
  }

  public async delete(id: string): Promise<void> {
    const user = await userDao.findById(id);
    if (!user) {
      throw new AppError('User not found', BusinessCode.USER_NOT_FOUND);
    }
    await userDao.destroy({ where: { id } });
  }

  private sanitizeUser(user: any) {
    const userData = user.toJSON ? user.toJSON() : user;
    return omit(userData, ['password', 'deletedAt']);
  }
}

export default new UserService();
