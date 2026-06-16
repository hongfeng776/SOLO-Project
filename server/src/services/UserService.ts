import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import userDAO from '@dao/UserDAO';
import { db } from '@models/index';
import { CacheUtil } from '@utils/cache';
import { AppError } from '@middlewares/errorHandler';

const USER_CACHE_PREFIX = 'user:info:';

class UserService {
  async getUserList(params: { page: number; pageSize: number; keyword?: string; status?: number }) {
    const { page, pageSize, keyword, status } = params;
    const where: any = {};

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const { rows, count } = await db.User.findAndCountAll({
      where,
      include: [{ model: db.Role, as: 'roles', attributes: ['id', 'role_name', 'role_code'] }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getUserById(id: number) {
    const user = await db.User.findByPk(id, {
      include: [{ model: db.Role, as: 'roles', include: [{ model: db.Permission, as: 'permissions' }] }],
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async createUser(data: any) {
    const existing = await userDAO.findByUsername(data.username);
    if (existing) {
      throw new AppError(409, 'Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await db.User.create({ ...data, password: hashedPassword });
    return user;
  }

  async updateUser(id: number, data: any) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    await db.User.update(updateData, { where: { id } });
    await CacheUtil.del(`${USER_CACHE_PREFIX}${id}`);

    return db.User.findByPk(id, {
      include: [{ model: db.Role, as: 'roles' }],
    });
  }

  async deleteUser(id: number) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    await db.User.destroy({ where: { id } });
    await CacheUtil.del(`${USER_CACHE_PREFIX}${id}`);
  }

  async assignRoles(userId: number, roleIds: number[]) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await db.UserRole.destroy({ where: { user_id: userId } });

    if (roleIds.length > 0) {
      const records = roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }));
      await db.UserRole.bulkCreate(records);
    }

    await CacheUtil.del(`${USER_CACHE_PREFIX}${userId}`);

    return db.User.findByPk(userId, {
      include: [{ model: db.Role, as: 'roles' }],
    });
  }
}

export default new UserService();
