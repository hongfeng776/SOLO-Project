import { Op } from 'sequelize';
import { Marketing } from '../models/Marketing';
import { MarketingDao } from '../dao/MarketingDao';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';
import { marketingValidateService, type MarketingValidateParams } from './MarketingValidateService';

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

  async create(payload: MarketingCreatePayload & { create_user_id?: number; create_user_name?: string }): Promise<Marketing> {
    const { name, type, status = 0, start_time, end_time, discount, create_user_id, create_user_name } = payload;

    if (!name) {
      throw new AppError('活动名称不能为空', 400);
    }

    const validateParams: MarketingValidateParams = {
      name,
      type,
      startTime: start_time,
      endTime: end_time,
      discountValue: discount,
    };

    const validateResult = await marketingValidateService.validateCreate(validateParams);
    if (!validateResult.valid) {
      throw new AppError(validateResult.errors[0]?.message || '参数校验失败', 400);
    }

    const marketing = await this.marketingDao.create({
      name,
      type,
      status,
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined,
      discount,
      discount_value: discount,
      create_user_id,
    });

    if (create_user_id && create_user_name) {
      marketingValidateService.logOperation(
        marketing.id,
        'create',
        create_user_id,
        1,
        create_user_name,
        [],
        '创建营销活动'
      );
    }

    return marketing;
  }

  async update(id: number, payload: MarketingUpdatePayload & { operator_id?: number; operator_name?: string }): Promise<Marketing> {
    const marketing = await this.marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    const validateParams: MarketingValidateParams = {
      id,
      name: payload.name,
      type: payload.type,
      startTime: payload.start_time,
      endTime: payload.end_time,
      discountValue: payload.discount,
    };

    const validateResult = await marketingValidateService.validateEdit(id, validateParams);
    if (!validateResult.valid) {
      throw new AppError(validateResult.errors[0]?.message || '参数校验失败', 400);
    }

    const updateData: any = { ...payload };

    if (payload.start_time) {
      updateData.start_time = new Date(payload.start_time);
    }
    if (payload.end_time) {
      updateData.end_time = new Date(payload.end_time);
    }
    if (payload.discount !== undefined) {
      updateData.discount_value = payload.discount;
    }

    const changes: Array<{ field: string; oldValue?: string; newValue?: string }> = [];
    const fields = ['name', 'type', 'start_time', 'end_time', 'discount', 'description', 'min_amount', 'max_discount', 'total_count', 'per_user_limit'];
    for (const field of fields) {
      const dbField = field;
      if (updateData[field] !== undefined && updateData[field] !== (marketing as any)[dbField]) {
        changes.push({
          field,
          oldValue: String((marketing as any)[dbField] ?? ''),
          newValue: String(updateData[field] ?? ''),
        });
      }
    }

    await this.marketingDao.update(id, updateData);

    if (payload.operator_id && payload.operator_name && changes.length > 0) {
      marketingValidateService.logOperation(
        id,
        'update',
        payload.operator_id,
        1,
        payload.operator_name,
        changes,
        '编辑营销活动'
      );
    }

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

  async updateStatus(id: number, status: number, operatorId?: number, operatorName?: string): Promise<Marketing> {
    const marketing = await this.marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', 404);
    }

    if (status < 0 || status > 3) {
      throw new AppError('状态值无效', 400);
    }

    const oldStatus = marketing.status ?? 0;
    await this.marketingDao.update(id, { status });

    if (operatorId && operatorName) {
      marketingValidateService.logOperation(
        id,
        'status_change',
        operatorId,
        1,
        operatorName,
        [{ field: 'status', oldValue: String(oldStatus), newValue: String(status) }],
        '更新活动状态'
      );
    }

    const updatedMarketing = await this.marketingDao.findById(id);
    if (!updatedMarketing) {
      throw new AppError('营销活动不存在', 404);
    }

    return updatedMarketing;
  }
}

export const marketingService = new MarketingService();
export default MarketingService;
