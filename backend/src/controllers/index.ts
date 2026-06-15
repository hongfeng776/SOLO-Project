import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import User from '@/models/User';
import SystemConfig from '@/models/SystemConfig';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import Content from '@/models/Content';
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
      const orderBy = req.query.orderBy as string || 'createdAt';
      const orderDir = (req.query.orderDir as string || 'DESC').toUpperCase();
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

      const sortableFields = new Set(['id', 'username', 'nickname', 'phone', 'role', 'status', 'fansCount', 'visits', 'createdAt', 'updatedAt', 'lastLoginAt']);
      const validOrderDirs = new Set(['ASC', 'DESC']);
      const safeField = sortableFields.has(orderBy) ? orderBy : 'createdAt';
      const safeDir = validOrderDirs.has(orderDir) ? orderDir : 'DESC';
      const fieldToColumn: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        lastLoginAt: 'last_login_at',
        fansCount: 'fans_count',
        visits: 'visits',
      };
      const colName = fieldToColumn[safeField] ?? safeField;

      const options: FindOptions = {
        where,
        offset,
        limit: pageSize,
        order: [[colName, safeDir]],
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

export const categoryController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const keyword = req.query.keyword as string || '';
      const orderBy = req.query.orderBy as string || 'sort';
      const orderDir = (req.query.orderDir as string || 'ASC').toUpperCase();
      const offset = (page - 1) * pageSize;

      const where: any = {};
      if (keyword) {
        where.name = { [Op.like as any]: `%${keyword}%` };
      }

      const sortableFields = new Set(['id', 'name', 'sort', 'status', 'createdAt', 'updatedAt']);
      const validOrderDirs = new Set(['ASC', 'DESC']);
      const safeField = sortableFields.has(orderBy) ? orderBy : 'sort';
      const safeDir = validOrderDirs.has(orderDir) ? orderDir : 'ASC';
      const fieldToColumn: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };
      const colName = fieldToColumn[safeField] ?? safeField;

      const orderClause: [string, string][] = [[colName, safeDir]];
      if (safeField !== 'id') {
        orderClause.push(['id', 'DESC']);
      }

      const { rows, count } = await Category.findAndCountAll({
        where,
        offset,
        limit: pageSize,
        order: orderClause,
      });
      responseUtil.paginate(res, rows, count, page, pageSize);
    } catch (error) {
      console.error('[Category List]:', error);
      responseUtil.internalError(res);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, sort, status } = req.body;
      if (!name) {
        responseUtil.badRequest(res, '分类名称不能为空');
        return;
      }
      const exists = await Category.findOne({ where: { name } });
      if (exists) {
        responseUtil.fail(res, '分类名称已存在');
        return;
      }
      const item = await Category.create({ name, description, sort: sort || 0, status: status ?? 1 });
      responseUtil.success(res, item, '创建成功', 201);
    } catch (error) {
      console.error('[Category Create]:', error);
      responseUtil.internalError(res);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, sort, status } = req.body;
      const item = await Category.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '分类不存在');
        return;
      }
      if (name && name !== item.name) {
        const exists = await Category.findOne({ where: { name } });
        if (exists) {
          responseUtil.fail(res, '分类名称已存在');
          return;
        }
      }
      const updateData: Record<string, any> = { name, description, sort, status };
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      await item.update(updateData);
      responseUtil.success(res, item, '更新成功');
    } catch (error) {
      console.error('[Category Update]:', error);
      responseUtil.internalError(res);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Category.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '分类不存在');
        return;
      }
      const contentCount = await Content.count({ where: { categoryId: item.id } });
      if (contentCount > 0) {
        responseUtil.fail(res, '该分类下存在内容，无法删除');
        return;
      }
      await item.destroy();
      responseUtil.success(res, null, '删除成功');
    } catch (error) {
      console.error('[Category Delete]:', error);
      responseUtil.internalError(res);
    }
  },
};

export const tagController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { rows, count } = await Tag.findAndCountAll({
        where: { status: 1 },
        order: [['id', 'DESC']],
      });
      responseUtil.paginate(res, rows, count, 1, count);
    } catch (error) {
      console.error('[Tag List]:', error);
      responseUtil.internalError(res);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, color, status } = req.body;
      if (!name) {
        responseUtil.badRequest(res, '标签名称不能为空');
        return;
      }
      const exists = await Tag.findOne({ where: { name } });
      if (exists) {
        responseUtil.fail(res, '标签名称已存在');
        return;
      }
      const item = await Tag.create({ name, color, status: status ?? 1 });
      responseUtil.success(res, item, '创建成功', 201);
    } catch (error) {
      console.error('[Tag Create]:', error);
      responseUtil.internalError(res);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, color, status } = req.body;
      const item = await Tag.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '标签不存在');
        return;
      }
      if (name && name !== item.name) {
        const exists = await Tag.findOne({ where: { name } });
        if (exists) {
          responseUtil.fail(res, '标签名称已存在');
          return;
        }
      }
      const updateData: Record<string, any> = { name, color, status };
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      await item.update(updateData);
      responseUtil.success(res, item, '更新成功');
    } catch (error) {
      console.error('[Tag Update]:', error);
      responseUtil.internalError(res);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Tag.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '标签不存在');
        return;
      }
      await item.destroy();
      responseUtil.success(res, null, '删除成功');
    } catch (error) {
      console.error('[Tag Delete]:', error);
      responseUtil.internalError(res);
    }
  },
};

export const contentController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const keyword = req.query.keyword as string || '';
      const status = req.query.status as string || '';
      const categoryId = req.query.categoryId as string || '';
      const startDate = req.query.startDate as string || '';
      const endDate = req.query.endDate as string || '';
      const orderBy = req.query.orderBy as string || 'publishTime';
      const orderDir = (req.query.orderDir as string || 'DESC').toUpperCase();
      const offset = (page - 1) * pageSize;

      const where: any = {};

      if (keyword) {
        where.title = { [Op.like as any]: `%${keyword}%` };
      }
      if (status) {
        where.status = status;
      }
      if (categoryId) {
        where.categoryId = parseInt(categoryId);
      }
      if (startDate || endDate) {
        where.publishTime = {} as any;
        if (startDate) {
          where.publishTime[Op.gte as any] = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.publishTime[Op.lte as any] = end;
        }
      }

      const sortableFields = new Set(['id', 'title', 'status', 'views', 'likes', 'publishTime', 'createdAt', 'updatedAt']);
      const validOrderDirs = new Set(['ASC', 'DESC']);
      const safeField = sortableFields.has(orderBy) ? orderBy : 'publishTime';
      const safeDir = validOrderDirs.has(orderDir) ? orderDir : 'DESC';
      const fieldToColumn: Record<string, string> = {
        publishTime: 'publish_time',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };
      const colName = fieldToColumn[safeField] ?? safeField;

      const orderClause: [string, string][] = [[colName, safeDir]];
      if (safeField !== 'id') {
        orderClause.push(['id', 'DESC']);
      }

      const options: FindOptions = {
        where,
        offset,
        limit: pageSize,
        order: orderClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      };

      const { rows, count } = await Content.findAndCountAll(options);
      responseUtil.paginate(res, rows, count, page, pageSize);
    } catch (error) {
      console.error('[Content List]:', error);
      responseUtil.internalError(res);
    }
  },

  async detail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Content.findByPk(parseInt(id), {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });
      if (!item) {
        responseUtil.notFound(res, '内容不存在');
        return;
      }
      responseUtil.success(res, item);
    } catch (error) {
      console.error('[Content Detail]:', error);
      responseUtil.internalError(res);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, coverImage, status, categoryId, tagIds, publishTime } = req.body;
      if (!title || !content) {
        responseUtil.badRequest(res, '标题和内容不能为空');
        return;
      }

      const createData: Record<string, any> = {
        title,
        content,
        coverImage,
        status: status || 'pending',
        categoryId: categoryId || null,
        publishTime: publishTime ? new Date(publishTime) : new Date(),
      };

      const item = await Content.create(createData as any);

      if (tagIds && tagIds.length > 0) {
        const tags = await Tag.findAll({ where: { id: { [Op.in as any]: tagIds } } });
        await item.$set('tags', tags);
      }

      const result = await Content.findByPk(item.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });

      responseUtil.success(res, result, '创建成功', 201);
    } catch (error) {
      console.error('[Content Create]:', error);
      responseUtil.internalError(res);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, coverImage, status, categoryId, tagIds, publishTime } = req.body;
      const item = await Content.findByPk(parseInt(id));

      if (!item) {
        responseUtil.notFound(res, '内容不存在');
        return;
      }

      const updateData: Record<string, any> = {
        title,
        content,
        coverImage,
        status,
        categoryId: categoryId || null,
      };
      if (publishTime) updateData.publishTime = new Date(publishTime);
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      await item.update(updateData);

      if (tagIds !== undefined) {
        if (tagIds.length > 0) {
          const tags = await Tag.findAll({ where: { id: { [Op.in as any]: tagIds } } });
          await item.$set('tags', tags);
        } else {
          await item.$set('tags', []);
        }
      }

      const result = await Content.findByPk(item.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });

      responseUtil.success(res, result, '更新成功');
    } catch (error) {
      console.error('[Content Update]:', error);
      responseUtil.internalError(res);
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Content.findByPk(parseInt(id));
      if (!item) {
        responseUtil.notFound(res, '内容不存在');
        return;
      }
      if (item.status === 'published') {
        responseUtil.fail(res, '已发布内容不能删除，请先下线');
        return;
      }
      await item.$set('tags', []);
      await item.destroy();
      responseUtil.success(res, null, '删除成功');
    } catch (error) {
      console.error('[Content Delete]:', error);
      responseUtil.internalError(res);
    }
  },
};

export const uploadController = {
  async image(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        responseUtil.badRequest(res, '请选择要上传的文件');
        return;
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        responseUtil.badRequest(res, '只支持 JPG、PNG、GIF、WebP 格式的图片');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        responseUtil.badRequest(res, '图片大小不能超过 2MB');
        return;
      }
      const url = `/uploads/${file.filename}`;
      responseUtil.success(res, { url, filename: file.originalname }, '上传成功');
    } catch (error) {
      console.error('[Upload Image]:', error);
      responseUtil.internalError(res);
    }
  },
};
