import { promoterDao } from '../dao';
import { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';

interface PromoterQueryParams extends PaginationParams {
  keyword?: string;
  channelId?: string;
  level?: string;
  status?: number;
}

class PromoterService {
  public async create(data: PromoterCreationAttributes) {
    const code = await this.generateCode();
    return promoterDao.create({
      ...data,
      code,
      registerAt: data.registerAt || new Date(),
    });
  }

  private async generateCode(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const todayCount = await promoterDao.getTodayCount();
    const seq = String(todayCount + 1).padStart(6, '0');
    const code = `P${dateStr}${seq}`;
    const exists = await promoterDao.existsByCode(code);
    if (exists) {
      return this.generateCode();
    }
    return code;
  }

  public async findById(id: string) {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    return promoter;
  }

  public async findAll(params: PromoterQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await promoterDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<PromoterAttributes>) {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== promoter.code) {
      const exists = await promoterDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('推客编号已存在', BusinessCode.ERROR);
      }
    }
    await promoterDao.update(data, { where: { id } });
    return promoterDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    await promoterDao.softDelete(id);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await promoterDao.bulkSoftDelete(ids);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }
    await promoterDao.update({ status: status as any }, { where: { id } });
  }
}

export default new PromoterService();
