import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import MarketingActivityLog, { MarketingActivityLogAttributes, MarketingActivityLogCreationAttributes } from '../models/MarketingActivityLog.model';
import { ActivityOperationType } from '../constants/enum';

interface ActivityLogQueryParams {
  page: number;
  pageSize: number;
  marketingId?: string;
  templateId?: string;
  operatorId?: string;
  operationType?: ActivityOperationType;
  startTime?: Date;
  endTime?: Date;
}

class MarketingActivityLogDao {
  public async create(data: MarketingActivityLogCreationAttributes, options?: CreateOptions): Promise<MarketingActivityLog> {
    return MarketingActivityLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<MarketingActivityLog | null> {
    return MarketingActivityLog.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<MarketingActivityLog | null> {
    return MarketingActivityLog.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<MarketingActivityLog[]> {
    return MarketingActivityLog.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: MarketingActivityLog[]; count: number }> {
    return MarketingActivityLog.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return MarketingActivityLog.count(options);
  }

  public async findById(id: string): Promise<MarketingActivityLog | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: ActivityLogQueryParams): Promise<{ rows: MarketingActivityLog[]; count: number }> {
    const { page, pageSize, marketingId, templateId, operatorId, operationType, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (marketingId) {
      where.marketingId = marketingId;
    }
    if (templateId) {
      where.templateId = templateId;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (operationType) {
      where.operationType = operationType;
    }
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [startTime, endTime] };
    } else if (startTime) {
      where.createdAt = { [Op.gte]: startTime };
    } else if (endTime) {
      where.createdAt = { [Op.lte]: endTime };
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByMarketingId(marketingId: string, limit?: number): Promise<MarketingActivityLog[]> {
    const options: FindOptions = {
      where: { marketingId },
      order: [['createdAt', 'DESC']],
    };
    if (limit) {
      options.limit = limit;
    }
    return this.findAll(options);
  }

  public async findByTemplateId(templateId: string, limit?: number): Promise<MarketingActivityLog[]> {
    const options: FindOptions = {
      where: { templateId },
      order: [['createdAt', 'DESC']],
    };
    if (limit) {
      options.limit = limit;
    }
    return this.findAll(options);
  }
}

export default new MarketingActivityLogDao();
