import { marketingDao } from '../dao';
import { MarketingAttributes, MarketingCreationAttributes } from '../models/Marketing.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { MarketingStatus } from '../constants/enum';
import { Op } from 'sequelize';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

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

    if (data.startTime && data.endTime) {
      if (new Date(data.startTime) >= new Date(data.endTime)) {
        throw new AppError('活动开始时间必须早于结束时间', BusinessCode.PARAM_ERROR);
      }
    }

    const result = await marketingDao.create(data);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
    return result;
  }

  public async findById(id: string) {
    const cacheKey = `${CacheKey.MARKETING_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    await CacheUtils.set(cacheKey, marketing, CacheTTL.MEDIUM);
    return marketing;
  }

  public async findAll(params: MarketingQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.MARKETING_LIST}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await marketingDao.findAllPaged(params);
    const result: PaginationResult<any> = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
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
    await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
    return marketingDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }
    await marketingDao.softDelete(id);
    await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await marketingDao.bulkSoftDelete(ids);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    const currentStatus = marketing.status as number;

    if (currentStatus === MarketingStatus.ONGOING && status === MarketingStatus.ENDED) {
      if (marketing.endTime && new Date(marketing.endTime) > new Date()) {
        throw new AppError('活动尚未到期，不能手动结束', BusinessCode.ERROR);
      }
    }

    if (currentStatus === MarketingStatus.DRAFT && status === MarketingStatus.ONGOING) {
      if (!marketing.startTime || !marketing.endTime) {
        throw new AppError('活动时间不完整，无法启动', BusinessCode.ERROR);
      }
      if (new Date(marketing.startTime) >= new Date(marketing.endTime)) {
        throw new AppError('活动开始时间必须早于结束时间', BusinessCode.ERROR);
      }
    }

    if (currentStatus === MarketingStatus.ENDED || currentStatus === MarketingStatus.CANCELLED) {
      throw new AppError('已结束或已取消的活动不能再修改状态', BusinessCode.ERROR);
    }

    await marketingDao.update({ status: status as any }, { where: { id } });
    await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
  }

  public async batchUpdateStatus(ids: string[], status: number): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }
    await marketingDao.update({ status: status as any }, { where: { id: { [Op.in]: ids } } });
    for (const id of ids) {
      await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
    }
    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
  }

  public async checkAndAutoEnd(): Promise<number> {
    const now = new Date();
    const ongoingMarketings = await marketingDao.findAll({
      where: {
        status: MarketingStatus.ONGOING,
        endTime: { [Op.lt]: now },
      },
    } as any);

    let count = 0;
    for (const marketing of ongoingMarketings) {
      await marketingDao.update(
        { status: MarketingStatus.ENDED as any },
        { where: { id: marketing.id } }
      );
      await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${marketing.id}`);
      count++;
    }

    if (count > 0) {
      await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
    }

    return count;
  }
}

export default new MarketingService();
