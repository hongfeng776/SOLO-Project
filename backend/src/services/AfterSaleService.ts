import { daos } from '../dao';
import { PageResult } from '../dao/BaseDao';
import { AfterSale } from '../models/AfterSale';
import { AppError } from '../middlewares/errorHandler';
import { Op } from 'sequelize';

const { afterSaleDao } = daos;

export interface AfterSaleCreatePayload {
  order_id: number;
  user_id: number;
  type: number;
  reason?: string;
  amount?: number;
}

export interface AfterSaleUpdatePayload {
  type?: number;
  reason?: string;
  amount?: number;
}

export interface AfterSaleQueryParams {
  page?: number;
  pageSize?: number;
  order_id?: number;
  user_id?: number;
  type?: number;
  status?: number;
  startDate?: string;
  endDate?: string;
}

class AfterSaleService {
  async getList(params: AfterSaleQueryParams): Promise<PageResult<AfterSale>> {
    const { page = 1, pageSize = 10, order_id, user_id, type, status, startDate, endDate } = params;

    const where: any = {};

    if (order_id !== undefined) {
      where.order_id = order_id;
    }
    if (user_id !== undefined) {
      where.user_id = user_id;
    }
    if (type !== undefined) {
      where.type = type;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    return afterSaleDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<AfterSale> {
    const afterSale = await afterSaleDao.findById(id);
    if (!afterSale) {
      throw new AppError('售后记录不存在', 404);
    }
    return afterSale;
  }

  async create(payload: AfterSaleCreatePayload): Promise<AfterSale> {
    return afterSaleDao.create({
      order_id: payload.order_id,
      user_id: payload.user_id,
      type: payload.type,
      reason: payload.reason,
      amount: payload.amount,
      status: 0,
    });
  }

  async update(id: number, payload: AfterSaleUpdatePayload): Promise<number> {
    const afterSale = await afterSaleDao.findById(id);
    if (!afterSale) {
      throw new AppError('售后记录不存在', 404);
    }

    return afterSaleDao.update(id, {
      type: payload.type,
      reason: payload.reason,
      amount: payload.amount,
    });
  }

  async delete(id: number): Promise<number> {
    const afterSale = await afterSaleDao.findById(id);
    if (!afterSale) {
      throw new AppError('售后记录不存在', 404);
    }
    return afterSaleDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', 400);
    }
    return afterSaleDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<number> {
    const afterSale = await afterSaleDao.findById(id);
    if (!afterSale) {
      throw new AppError('售后记录不存在', 404);
    }

    if (status < 0 || status > 3) {
      throw new AppError('无效的状态值', 400);
    }

    return afterSaleDao.update(id, { status });
  }
}

export const afterSaleService = new AfterSaleService();
export default AfterSaleService;
