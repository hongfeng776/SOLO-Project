import { FindOptions, CreateOptions, Op, WhereOptions, Order } from 'sequelize';
import RewardWriteOff, { RewardWriteOffCreationAttributes, RewardWriteOffAttributes } from '../models/RewardWriteOff.model';
import { RewardWriteOffStatus, RewardWriteOffType } from '../constants/enum';

interface WriteOffQueryParams {
  page: number;
  pageSize: number;
  marketingId?: string;
  userId?: string;
  userType?: string;
  type?: RewardWriteOffType;
  status?: RewardWriteOffStatus;
  writeOffNo?: string;
  startTime?: Date;
  endTime?: Date;
}

class RewardWriteOffDao {
  public async create(data: RewardWriteOffCreationAttributes, options?: CreateOptions): Promise<RewardWriteOff> {
    return RewardWriteOff.create(data as any, options);
  }

  public async findById(id: string, options?: FindOptions): Promise<RewardWriteOff | null> {
    return RewardWriteOff.findByPk(id, options);
  }

  public async findByWriteOffNo(writeOffNo: string, options?: FindOptions): Promise<RewardWriteOff | null> {
    return RewardWriteOff.findOne({
      where: { writeOffNo },
      ...options,
    });
  }

  public async findByParticipationId(participationId: string): Promise<RewardWriteOff[]> {
    return RewardWriteOff.findAll({
      where: { participationId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAllPaged(params: WriteOffQueryParams): Promise<{ rows: RewardWriteOff[]; count: number }> {
    const { page, pageSize, marketingId, userId, userType, type, status, writeOffNo, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: WhereOptions = {};

    if (marketingId) where.marketingId = marketingId;
    if (userId) where.userId = userId;
    if (userType) where.userType = userType;
    if (type) where.type = type;
    if (status !== undefined) where.status = status;
    if (writeOffNo) where.writeOffNo = { [Op.like]: `%${writeOffNo}%` };
    if (startTime || endTime) {
      (where as any).createdAt = {};
      if (startTime) (where as any).createdAt[Op.gte] = startTime;
      if (endTime) (where as any).createdAt[Op.lte] = endTime;
    }

    return RewardWriteOff.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async update(id: string, data: Partial<RewardWriteOffAttributes>, options?: any): Promise<any> {
    return RewardWriteOff.update(data, { where: { id }, ...options });
  }

  public async bulkUpdate(ids: string[], data: Partial<RewardWriteOffAttributes>, options?: any): Promise<any> {
    return RewardWriteOff.update(data, { where: { id: { [Op.in]: ids } }, ...options });
  }

  public async countByMarketingAndStatus(marketingId: string, status: RewardWriteOffStatus): Promise<number> {
    return RewardWriteOff.count({ where: { marketingId, status } });
  }

  public async sumAmountByMarketingAndStatus(marketingId: string, status: RewardWriteOffStatus): Promise<number> {
    const result = await RewardWriteOff.sum('actualAmount', { where: { marketingId, status } });
    return Number(result) || 0;
  }

  public async findByUserId(userId: string, status?: RewardWriteOffStatus): Promise<RewardWriteOff[]> {
    const where: any = { userId };
    if (status !== undefined) where.status = status;
    return RewardWriteOff.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  public async countByUserIdAndDate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return RewardWriteOff.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });
  }

  public async findByOrderId(orderId: string): Promise<RewardWriteOff | null> {
    return RewardWriteOff.findOne({
      where: { orderId, status: { [Op.ne]: RewardWriteOffStatus.CANCELLED } },
    });
  }

  public async countPendingByMarketingId(marketingId: string): Promise<number> {
    return RewardWriteOff.count({
      where: { marketingId, status: RewardWriteOffStatus.PENDING },
    });
  }

  public async findPendingByMarketingId(marketingId: string, limit?: number): Promise<RewardWriteOff[]> {
    return RewardWriteOff.findAll({
      where: { marketingId, status: RewardWriteOffStatus.PENDING },
      order: [['createdAt', 'ASC']],
      limit,
    });
  }
}

export default new RewardWriteOffDao();
