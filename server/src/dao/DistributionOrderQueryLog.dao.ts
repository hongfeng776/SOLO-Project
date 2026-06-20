import { FindOptions, CreateOptions, CountOptions, Op } from 'sequelize';
import DistributionOrderQueryLog, {
  DistributionOrderQueryLogAttributes,
  DistributionOrderQueryLogCreationAttributes,
} from '../models/DistributionOrderQueryLog.model';

class DistributionOrderQueryLogDao {
  public async create(
    data: DistributionOrderQueryLogCreationAttributes,
    options?: CreateOptions
  ): Promise<DistributionOrderQueryLog> {
    return DistributionOrderQueryLog.create(data, options);
  }

  public async findAndCountAll(
    options?: FindOptions
  ): Promise<{ rows: DistributionOrderQueryLog[]; count: number }> {
    return DistributionOrderQueryLog.findAndCountAll(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return DistributionOrderQueryLog.count(options);
  }

  public async countByUserInTimeWindow(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    return this.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }

  public async countByIpInTimeWindow(ip: string, startTime: Date, endTime: Date): Promise<number> {
    return this.count({
      where: {
        ip,
        createdAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }
}

export default new DistributionOrderQueryLogDao();
