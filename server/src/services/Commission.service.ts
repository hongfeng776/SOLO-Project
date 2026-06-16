import { commissionDao } from '../dao';
import { CommissionSummary } from '../dao/Commission.dao';
import { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { CommissionStatus } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

interface CommissionQueryParams extends PaginationParams {
  promoterId?: string;
  status?: number;
  type?: number;
  startTime?: string;
  endTime?: string;
}

class CommissionService {
  public async create(data: CommissionCreationAttributes) {
    const result = await commissionDao.create(data);
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
    return result;
  }

  public async findById(id: string) {
    const commission = await commissionDao.findById(id);
    if (!commission) {
      throw new AppError('佣金记录不存在', BusinessCode.NOT_FOUND);
    }
    return commission;
  }

  public async findAll(params: CommissionQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.COMMISSION_LIST}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await commissionDao.findAllPaged(params);
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

  public async update(id: string, data: Partial<CommissionAttributes>) {
    const commission = await commissionDao.findById(id);
    if (!commission) {
      throw new AppError('佣金记录不存在', BusinessCode.NOT_FOUND);
    }
    await commissionDao.update(data, { where: { id } });
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
    return commissionDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const commission = await commissionDao.findById(id);
    if (!commission) {
      throw new AppError('佣金记录不存在', BusinessCode.NOT_FOUND);
    }
    await commissionDao.softDelete(id);
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
  }

  public async summary(params: Partial<CommissionQueryParams>): Promise<CommissionSummary> {
    const cacheKey = `${CacheKey.COMMISSION_SUMMARY}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<CommissionSummary>(cacheKey);
    if (cached) return cached;

    const result = await commissionDao.summary(params);
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async settle(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要结算的记录', BusinessCode.PARAM_ERROR);
    }
    await commissionDao.bulkUpdate(ids, {
      status: CommissionStatus.SETTLED as any,
      settleTime: new Date(),
    });
    await CacheUtils.delPattern(`${CacheKey.COMMISSION_LIST}*`);
    await CacheUtils.del(`${CacheKey.COMMISSION_SUMMARY}`);
  }
}

export default new CommissionService();
