import { Op } from 'sequelize';
import { Marketing } from '../models/Marketing';
import { MarketingDao } from '../dao/MarketingDao';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface MarketingQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: number;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export interface MarketingCreatePayload {
  name: string;
  type?: number;
  status?: number;
  start_time?: Date | string;
  end_time?: Date | string;
  discount?: number;
}

export interface MarketingUpdatePayload {
  name?: string;
  type?: number;
  status?: number;
  start_time?: Date | string;
  end_time?: Date | string;
  discount?: number;
}

export interface MarketingUpdateStatusPayload {
  status: number;
}

class MarketingService {
  private marketingDao: MarketingDao;

  constructor() {
    this.marketingDao = new MarketingDao();
  }

  async getList(params: MarketingQueryParams): Promise<PageResult<Marketing>> {
    const { page = 1, pageSize = 10, name, type, status, startTime, endTime } = params;

    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (type !== undefined) {
      where.type = type;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) {
        where.created_at[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        where.created_at[Op.lte] = new Date(endTime);
      }
    }

    return this.marketingDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<Marketing> {
    const marketing = await this.marketingDao.findById(id);

    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return marketing;
  }

  async create(payload: MarketingCreatePayload): Promise<Marketing> {
    const { name, type, status = 0, start_time, end_time, discount } = payload;

    if (!name) {
      throw new AppError('活动名称不能为空', 400);
    }

    return this.marketingDao.create({
      name,
      type,
      status,
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined,
      discount,
    });
  }

  async update(id: number, payload: MarketingUpdatePayload): Promise<Marketing> {
    const marketing = await this.marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    const updateData: any = { ...payload };

    if (payload.start_time) {
      updateData.start_time = new Date(payload.start_time);
    }
    if (payload.end_time) {
      updateData.end_time = new Date(payload.end_time);
    }

    await this.marketingDao.update(id, updateData);

    const updatedMarketing = await this.marketingDao.findById(id);
    if (!updatedMarketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return updatedMarketing;
  }

  async delete(id: number): Promise<void> {
    const marketing = await this.marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    await this.marketingDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的营销活动', 400);
    }

    return this.marketingDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<Marketing> {
    const marketing = await this.marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    if (status < 0 || status > 2) {
      throw new AppError('状态值无效', 400);
    }

    await this.marketingDao.update(id, { status });

    const updatedMarketing = await this.marketingDao.findById(id);
    if (!updatedMarketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return updatedMarketing;
  }
}

export const marketingService = new MarketingService();
export default MarketingService;
