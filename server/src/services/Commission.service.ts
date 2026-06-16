import { commissionDao } from '../dao';
import { CommissionSummary } from '../dao/Commission.dao';
import { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { CommissionStatus } from '../constants/enum';

interface CommissionQueryParams extends PaginationParams {
  promoterId?: string;
  status?: number;
  type?: number;
  startTime?: string;
  endTime?: string;
}

class CommissionService {
  public async create(data: CommissionCreationAttributes) {
    return commissionDao.create(data);
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
    const { rows, count } = await commissionDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<CommissionAttributes>) {
    const commission = await commissionDao.findById(id);
    if (!commission) {
      throw new AppError('佣金记录不存在', BusinessCode.NOT_FOUND);
    }
    await commissionDao.update(data, { where: { id } });
    return commissionDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const commission = await commissionDao.findById(id);
    if (!commission) {
      throw new AppError('佣金记录不存在', BusinessCode.NOT_FOUND);
    }
    await commissionDao.softDelete(id);
  }

  public async summary(params: Partial<CommissionQueryParams>): Promise<CommissionSummary> {
    return commissionDao.summary(params);
  }

  public async settle(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要结算的记录', BusinessCode.PARAM_ERROR);
    }
    await commissionDao.bulkUpdate(ids, {
      status: CommissionStatus.SETTLED as any,
      settleTime: new Date(),
    });
  }
}

export default new CommissionService();
