import { daos } from '../dao';
import { PageResult } from '../dao/BaseDao';
import { Merchant } from '../models/Merchant';
import { AppError } from '../middlewares/errorHandler';
import { Op } from 'sequelize';

const { merchantDao } = daos;

export interface MerchantCreatePayload {
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  status?: number;
}

export interface MerchantUpdatePayload {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
  status?: number;
}

export interface MerchantQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  phone?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}

class MerchantService {
  async getList(params: MerchantQueryParams): Promise<PageResult<Merchant>> {
    const { page = 1, pageSize = 10, name, phone, status, startDate, endDate } = params;

    const where: any = {};

    if (name) {
      where.name = {
        [Op.like]: `%${name}%`,
      };
    }
    if (phone) {
      where.phone = {
        [Op.like]: `%${phone}%`,
      };
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    return merchantDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getDetail(id: number): Promise<Merchant> {
    const merchant = await merchantDao.findById(id);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }
    return merchant;
  }

  async create(payload: MerchantCreatePayload): Promise<Merchant> {
    return merchantDao.create({
      name: payload.name,
      contact: payload.contact,
      phone: payload.phone,
      address: payload.address,
      status: payload.status ?? 1,
    });
  }

  async update(id: number, payload: MerchantUpdatePayload): Promise<number> {
    const merchant = await merchantDao.findById(id);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    return merchantDao.update(id, {
      name: payload.name,
      contact: payload.contact,
      phone: payload.phone,
      address: payload.address,
      status: payload.status,
    });
  }

  async delete(id: number): Promise<number> {
    const merchant = await merchantDao.findById(id);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }
    return merchantDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', 400);
    }
    return merchantDao.batchDelete(ids);
  }

  async updateStatus(id: number, status: number): Promise<number> {
    const merchant = await merchantDao.findById(id);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    if (status !== 0 && status !== 1) {
      throw new AppError('无效的状态值', 400);
    }

    return merchantDao.update(id, { status });
  }
}

export const merchantService = new MerchantService();
export default MerchantService;
