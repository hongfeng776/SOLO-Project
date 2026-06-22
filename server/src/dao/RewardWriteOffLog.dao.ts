import { FindOptions, CreateOptions, Op } from 'sequelize';
import RewardWriteOffLog, { RewardWriteOffLogCreationAttributes } from '../models/RewardWriteOffLog.model';
import { WriteOffLogType } from '../constants/enum';

interface WriteOffLogQueryParams {
  page: number;
  pageSize: number;
  writeOffId?: string;
  writeOffNo?: string;
  logType?: WriteOffLogType;
  operatorId?: string;
  startTime?: Date;
  endTime?: Date;
}

class RewardWriteOffLogDao {
  public async create(data: RewardWriteOffLogCreationAttributes, options?: CreateOptions): Promise<RewardWriteOffLog> {
    return RewardWriteOffLog.create(data as any, options);
  }

  public async findAllPaged(params: WriteOffLogQueryParams): Promise<{ rows: RewardWriteOffLog[]; count: number }> {
    const { page, pageSize, writeOffId, writeOffNo, logType, operatorId, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (writeOffId) where.writeOffId = writeOffId;
    if (writeOffNo) where.writeOffNo = writeOffNo;
    if (logType) where.logType = logType;
    if (operatorId) where.operatorId = operatorId;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = startTime;
      if (endTime) where.createdAt[Op.lte] = endTime;
    }

    return RewardWriteOffLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByWriteOffId(writeOffId: string): Promise<RewardWriteOffLog[]> {
    return RewardWriteOffLog.findAll({
      where: { writeOffId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async countByLogType(logType: WriteOffLogType, startTime?: Date, endTime?: Date): Promise<number> {
    const where: any = { logType };
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = startTime;
      if (endTime) where.createdAt[Op.lte] = endTime;
    }
    return RewardWriteOffLog.count({ where });
  }
}

export default new RewardWriteOffLogDao();
