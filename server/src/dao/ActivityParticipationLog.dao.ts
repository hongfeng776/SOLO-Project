import { FindOptions, CreateOptions, Op } from 'sequelize';
import ActivityParticipationLog, { ActivityParticipationLogCreationAttributes } from '../models/ActivityParticipationLog.model';
import { ParticipationRecordType } from '../constants/enum';

interface ParticipationLogQueryParams {
  page: number;
  pageSize: number;
  marketingId?: string;
  userId?: string;
  participationId?: string;
  recordType?: ParticipationRecordType;
  startTime?: Date;
  endTime?: Date;
}

class ActivityParticipationLogDao {
  public async create(data: ActivityParticipationLogCreationAttributes, options?: CreateOptions): Promise<ActivityParticipationLog> {
    return ActivityParticipationLog.create(data as any, options);
  }

  public async findAllPaged(params: ParticipationLogQueryParams): Promise<{ rows: ActivityParticipationLog[]; count: number }> {
    const { page, pageSize, marketingId, userId, participationId, recordType, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (marketingId) where.marketingId = marketingId;
    if (userId) where.userId = userId;
    if (participationId) where.participationId = participationId;
    if (recordType) where.recordType = recordType;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = startTime;
      if (endTime) where.createdAt[Op.lte] = endTime;
    }

    return ActivityParticipationLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByParticipationId(participationId: string): Promise<ActivityParticipationLog[]> {
    return ActivityParticipationLog.findAll({
      where: { participationId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByMarketingId(marketingId: string): Promise<ActivityParticipationLog[]> {
    return ActivityParticipationLog.findAll({
      where: { marketingId },
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new ActivityParticipationLogDao();
