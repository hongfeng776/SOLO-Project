import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import SystemConfig from '@/models/SystemConfig';
import { responseUtil, PaginatedData } from '@/utils/response';
import { signToken, AuthRequest } from '@/middleware/auth';
import config from '@/config';
import { FindOptions, Op } from 'sequelize';

const SALT_ROUNDS = config.bcryptRounds;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        responseUtil.badRequest(res, '用户名和密码不能为空');
        return;
      }

      const user = await User.findOne({ where: { username } });
      if (!user) {
        responseUtil.fail(res, '用户名或密码错误');
        return;
      }

      if (user.status !== 1) {
        responseUtil.fail(res, '账号已被禁用，请联系管理员');
        return;
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        responseUtil.fail(res, '用户名或密码错误');
        return;
      }

      await user.update({ lastLoginAt: new Date() });

      const token = signToken({ id: user.id, username: user.username, role: user.role });
      responseUtil.success(res, { token, user: user.toJSON() }, '登录成功');
    } catch (error) {
      console.error('[Auth Login]:', error);
      responseUtil.internalError(res);
    }
  },

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, nickname, email, phone } = req.body;
      if (!username || !password || !nickname) {
        responseUtil.badRequest(res, '用户名、密码、昵称不能为空');
        return;
      }

      const exists = await User.findOne({ where: { username } });
      if (exists) {
        responseUtil.fail(res, '用户名已存在');
        return;
      }

      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        username,
        password: hashedPassword,
        nickname,
        email,
        phone,
      });

      const token = signToken({ id: user.id, username: user.username, role: user.role });
      responseUtil.success(res, { token, user: user.toJSON() }, '注册成功', 201);
    } catch (error) {
      console.error('[Auth Register]:', error);
      responseUtil.internalError(res);
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        responseUtil.unauthorized(res);
        return;
      }
      const user = await User.findByPk(req.user.id);
      if (!user) {
        responseUtil.unauthorized(res, '用户不存在');
        return;
      }
      responseUtil.success(res, user.toJSON());
    } catch (error) {
      console.error('[Auth Me]:', error);
      responseUtil.internalError(res);
    }
  },
};

export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const username = req.query.username as string || '';
      const nickname = req.query.nickname as string || '';
      const phone = req.query.phone as string || '';
      const offset = (page - 1) * pageSize;

      const where: any = {};

      if (username) {
        where.username = { [Op.like as any]: `%${username}%` };
      }
      if (nickname) {
        where.nickname = { [Op.like as any]: `%${nickname}%` };
      }
      if (phone) {
        where.phone = { [Op.like as any]: `%${phone}%` };
      }

      const options: FindOptions = {
        where,
        offset,
        limit: pageSize,
        order: [['created_at', 'DESC']],
      };

      const { rows, count } = await User.findAndCountAll(options);
      const list = rows.map(u => u.toJSON());
      responseUtil.paginate(res, list, count, page, pageSize);
    } catch (error) {
      console.error('[User List]:', error);
      responseUtil.internalError(res);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, nickname, email, phone, role, status, createdAt, fansCount, visits } = req.body;
      if (!username || !password || !nickname) {
        responseUtil.badRequest(res, '用户名、密码、昵称不能为空');
        return;
      }

      const exists = await User.findOne({ where: { username } });
      if (exists) {
        responseUtil.fail(res, '用户名已存在');
        return;
      }

      const hashedPassword = await hashPassword(password);
      const createData: Record<string, any> = {
        username,
        password: hashedPassword,
        nickname,
        email,
        phone,
        role: role || 'user',
        status: status ?? 1,
        fansCount: fansCount ?? Math.floor(Math.random() * 50000),
        visits: visits ?? Math.floor(Math.random() * 100000),
      };
      if (createdAt) createData.createdAt = createdAt;
      const user = await User.create(createData as any);

      responseUtil.success(res, user.toJSON(), '创建成功', 201);
    } catch (error) {
      console.error('[User Create]:', error);
      responseUtil.internalError(res);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { password, nickname, email, phone, role, status } = req.body;
      const user = await User.findByPk(parseInt(id));

      if (!user) {
        responseUtil.notFound(res, '用户不存在');
        return;
      }

      const updateData: Record<string, any> = { nickname, email, phone, role, status };
      if (password) updateData.password = await hashPassword(password);
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await user.update(updateData);
      responseUtil.success(res, user.toJSON(), '更新成功');
    } catch (error) {
      console.error('[User Update]:', error);
      responseUtil.internalError(res);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findByPk(parseInt(id));
      if (!user) {
        responseUtil.notFound(res, '用户不存在');
        return;
      }
      await user.destroy();
      responseUtil.success(res, null, '删除成功');
    } catch (error) {
      console.error('[User Delete]:', error);
      responseUtil.internalError(res);
    }
  },
};

export const configController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const keyword = req.query.keyword as string || '';
      const offset = (page - 1) * pageSize;

      const where: any = {};
      if (keyword) {
        where[Op.or as any] = [
          { configKey: { [Op.like as any]: `%${keyword}%` } },
          { description: { [Op.like as any]: `%${keyword}%` } },
        ];
      }

      const { rows, count } = await SystemConfig.findAndCountAll({
        where,
        offset,
        limit: pageSize,
        order: [['config_key', 'ASC']],
      });

      responseUtil.paginate(res, rows, count, page, pageSize);
    } catch (error) {
      console.error('[Config List]:', error);
      responseUtil.internalError(res);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { configKey, configValue, description } = req.body;
      if (!configKey || configValue === undefined) {
        responseUtil.badRequest(res, '配置键和值不能为空');
        return;
      }

      const exists = await SystemConfig.findOne({ where: { configKey } });
      if (exists) {
        responseUtil.fail(res, '配置键已存在');
        return;
      }

      const item = await SystemConfig.create({ configKey, configValue: String(configValue), description });
      responseUtil.success(res, item, '创建成功', 201);
    } catch (error) {
      console.error('[Config Create]:', error);
      responseUtil.internalError(res);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { configValue, description } = req.body;
      const item = await SystemConfig.findByPk(parseInt(id));

      if (!item) {
        responseUtil.notFound(res, '配置不存在');
        return;
      }

      const updateData: Record<string, any> = { description };
      if (configValue !== undefined) updateData.configValue = String(configValue);
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await item.update(updateData);
      responseUtil.success(res, item, '更新成功');
    } catch (error) {
      console.error('[Config Update]:', error);
      responseUtil.internalError(res);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await SystemConfig.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '配置不存在');
        return;
      }
      await item.destroy();
      responseUtil.success(res, null, '删除成功');
    } catch (error) {
      console.error('[Config Delete]:', error);
      responseUtil.internalError(res);
    }
  },
};
