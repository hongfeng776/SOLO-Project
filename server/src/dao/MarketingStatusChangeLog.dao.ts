import { FindOptions, CreateOptions, Op } from 'sequelize';
import MarketingStatusChangeLog, { MarketingStatusChangeLogCreationAttributes } from '../models/MarketingStatusChangeLog.model';

interface StatusChangeLogQueryParams {
  page: number;
  pageSize: number;
  marketingId?: string;
  changeType?: string;
  operatorId?: string;
  startTime?: Date;
  endTime?: Date;
}

class MarketingStatusChangeLogDao {
  public async create(data: MarketingStatusChangeLogCreationAttributes, options?: CreateOptions): Promise<MarketingStatusChangeLog> {
    return MarketingStatusChangeLog.create(data as any, options);
  }

  public async findByMarketingId(marketingId: string, options?: FindOptions): Promise<MarketingStatusChangeLog[]> {
    return MarketingStatusChangeLog.findAll({
      where: { marketingId },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  public async findAllPaged(params: StatusChangeLogQueryParams): Promise<{ rows: MarketingStatusChangeLog[]; count: number }> {
    const { page, pageSize, marketingId, changeType, operatorId, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (marketingId) {
      where.marketingId = marketingId;
    }
    if (changeType) {
      where.changeType = changeType;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = startTime;
      if (endTime) where.createdAt[Op.lte] = endTime;
    }

    return MarketingStatusChangeLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByTimeRange(startTime: Date, endTime: Date): Promise<MarketingStatusChangeLog[]> {
    return MarketingStatusChangeLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async countByChangeType(changeType: string): Promise<number> {
    return MarketingStatusChangeLog.count({ where: { changeType } });
  }
}

export default new MarketingStatusChangeLogDao();
