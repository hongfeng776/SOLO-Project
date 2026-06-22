import { FindOptions, CreateOptions, Op, WhereOptions } from 'sequelize';
import ActivityParticipation, { ActivityParticipationCreationAttributes, ActivityParticipationAttributes } from '../models/ActivityParticipation.model';
import { ParticipationEligibilityStatus, ParticipationUserType, ParticipationAnomalyType } from '../constants/enum';

interface ParticipationQueryParams {
  page: number;
  pageSize: number;
  marketingId?: string;
  userId?: string;
  userType?: ParticipationUserType;
  eligibilityStatus?: ParticipationEligibilityStatus;
  isAnomaly?: boolean;
  isRestricted?: boolean;
}

class ActivityParticipationDao {
  public async create(data: ActivityParticipationCreationAttributes, options?: CreateOptions): Promise<ActivityParticipation> {
    return ActivityParticipation.create(data as any, options);
  }

  public async findById(id: string, options?: FindOptions): Promise<ActivityParticipation | null> {
    return ActivityParticipation.findByPk(id, options);
  }

  public async findByMarketingAndUser(marketingId: string, userId: string, options?: FindOptions): Promise<ActivityParticipation | null> {
    return ActivityParticipation.findOne({
      where: { marketingId, userId },
      ...options,
    });
  }

  public async findAllPaged(params: ParticipationQueryParams): Promise<{ rows: ActivityParticipation[]; count: number }> {
    const { page, pageSize, marketingId, userId, userType, eligibilityStatus, isAnomaly, isRestricted } = params;
    const offset = (page - 1) * pageSize;
    const where: WhereOptions = {};

    if (marketingId) where.marketingId = marketingId;
    if (userId) where.userId = userId;
    if (userType) where.userType = userType;
    if (eligibilityStatus !== undefined) where.eligibilityStatus = eligibilityStatus;
    if (isAnomaly !== undefined) where.isAnomaly = isAnomaly;
    if (isRestricted !== undefined) where.isRestricted = isRestricted;

    return ActivityParticipation.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['registeredAt', 'DESC']],
    });
  }

  public async findByMarketingId(marketingId: string, options?: FindOptions): Promise<ActivityParticipation[]> {
    return ActivityParticipation.findAll({
      where: { marketingId },
      order: [['registeredAt', 'DESC']],
      ...options,
    });
  }

  public async countByMarketingId(marketingId: string, eligibilityStatus?: ParticipationEligibilityStatus): Promise<number> {
    const where: WhereOptions = { marketingId };
    if (eligibilityStatus !== undefined) where.eligibilityStatus = eligibilityStatus;
    return ActivityParticipation.count({ where });
  }

  public async countAnomalyByMarketingId(marketingId: string): Promise<number> {
    return ActivityParticipation.count({ where: { marketingId, isAnomaly: true } });
  }

  public async sumRewardByMarketingId(marketingId: string): Promise<number> {
    const result = await ActivityParticipation.sum('participantReward', {
      where: { marketingId, eligibilityStatus: ParticipationEligibilityStatus.APPROVED },
    });
    return result || 0;
  }

  public async findAnomalyParticipations(marketingId: string): Promise<ActivityParticipation[]> {
    return ActivityParticipation.findAll({
      where: { marketingId, isAnomaly: true },
      order: [['anomalyMarkedAt', 'DESC']],
    });
  }

  public async findRestrictedParticipations(marketingId: string): Promise<ActivityParticipation[]> {
    return ActivityParticipation.findAll({
      where: { marketingId, isRestricted: true },
    });
  }

  public async update(id: string, data: Partial<ActivityParticipationAttributes>, options?: any): Promise<any> {
    return ActivityParticipation.update(data, { where: { id }, ...options });
  }

  public async bulkUpdate(ids: string[], data: Partial<ActivityParticipationAttributes>, options?: any): Promise<any> {
    return ActivityParticipation.update(data, { where: { id: { [Op.in]: ids } }, ...options });
  }

  public async findByUserAndTimeRange(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<ActivityParticipation[]> {
    return ActivityParticipation.findAll({
      where: {
        userId,
        registeredAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }

  public async findByIpAddressAndTimeRange(
    ipAddress: string,
    startTime: Date,
    endTime: Date
  ): Promise<ActivityParticipation[]> {
    return ActivityParticipation.findAll({
      where: {
        ipAddress,
        registeredAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }
}

export default new ActivityParticipationDao();
