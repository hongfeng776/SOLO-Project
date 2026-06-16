import { marketingDao } from '../dao';
import { MarketingAttributes, MarketingCreationAttributes } from '../models/Marketing.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';

interface MarketingQueryParams extends PaginationParams {
  keyword?: string;
  type?: string;
  status?: number;
}

class MarketingService {
  public async create(data: MarketingCreationAttributes) {
    const exists = await marketingDao.existsByCode(data.code);
    if (exists) {
      throw new AppError('活动编码已存在', BusinessCode.ERROR);
    }
    return marketingDao.create(data);
  }

  public async findById(id: string) {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    return marketing;
  }

  public async findAll(params: MarketingQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await marketingDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<MarketingAttributes>) {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== marketing.code) {
      const exists = await marketingDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('活动编码已存在', BusinessCode.ERROR);
      }
    }
    await marketingDao.update(data, { where: { id } });
    return marketingDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    await marketingDao.softDelete(id);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await marketingDao.bulkSoftDelete(ids);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    await marketingDao.update({ status: status as any }, { where: { id } });
  }
}

export default new MarketingService();
