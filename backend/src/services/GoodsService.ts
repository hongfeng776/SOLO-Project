import { Op } from 'sequelize';
import { daos } from '../dao';
import { Goods } from '../models/Goods';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface GoodsQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  category_id?: number;
  status?: number;
  merchant_id?: number;
}

export interface GoodsCreateData {
  name: string;
  category_id?: number;
  price: number;
  original_price?: number;
  stock?: number;
  cover_image?: string;
  description?: string;
  merchant_id?: number;
}

export interface GoodsUpdateData {
  name?: string;
  category_id?: number;
  price?: number;
  original_price?: number;
  stock?: number;
  cover_image?: string;
  description?: string;
  merchant_id?: number;
}

class GoodsService {
  private readonly goodsDao = daos.goodsDao;

  async getList(params: GoodsQueryParams): Promise<PageResult<Goods>> {
    const { page = 1, pageSize = 10, name, category_id, status, merchant_id } = params;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (category_id !== undefined) {
      where.category_id = category_id;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (merchant_id !== undefined) {
      where.merchant_id = merchant_id;
    }

    return this.goodsDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getById(id: number): Promise<Goods> {
    const goods = await this.goodsDao.findById(id);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }
    return goods;
  }

  async create(data: GoodsCreateData): Promise<Goods> {
    return this.goodsDao.create({
      ...data,
      status: 1,
    });
  }

  async update(id: number, data: GoodsUpdateData): Promise<Goods> {
    await this.getById(id);
    await this.goodsDao.update(id, data);
    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.goodsDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的商品', 400);
    }
    return this.goodsDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<Goods> {
    await this.getById(id);
    if (status !== 0 && status !== 1) {
      throw new AppError('无效的状态值', 400);
    }
    await this.goodsDao.update(id, { status });
    return this.getById(id);
  }
}

export const goodsService = new GoodsService();
export default GoodsService;
