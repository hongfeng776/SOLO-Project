import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import ChannelAuditLog, { ChannelAuditLogAttributes, ChannelAuditLogCreationAttributes } from '../models/ChannelAuditLog.model';

interface ChannelAuditLogQueryParams {
  page: number;
  pageSize: number;
  channelAuditId?: string;
  operatorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

class ChannelAuditLogDao {
  public async create(data: ChannelAuditLogCreationAttributes, options?: CreateOptions): Promise<ChannelAuditLog> {
    return ChannelAuditLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelAuditLog | null> {
    return ChannelAuditLog.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<ChannelAuditLog | null> {
    return ChannelAuditLog.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<ChannelAuditLog[]> {
    return ChannelAuditLog.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: ChannelAuditLog[]; count: number }> {
    return ChannelAuditLog.findAndCountAll(options);
  }

  public async update(data: Partial<ChannelAuditLogAttributes>, options: UpdateOptions): Promise<[number, ChannelAuditLog[]]> {
    return ChannelAuditLog.update(data, options) as unknown as Promise<[number, ChannelAuditLog[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ChannelAuditLog.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ChannelAuditLog.count(options);
  }

  public async findAllPaged(params: ChannelAuditLogQueryParams): Promise<{ rows: ChannelAuditLog[]; count: number }> {
    const { page, pageSize, channelAuditId, operatorId, action, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (channelAuditId) where.channelAuditId = channelAuditId;
    if (operatorId) where.operatorId = operatorId;
    if (action) where.action = action;
    if (startDate) {
      where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(endDate + ' 23:59:59') };
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new ChannelAuditLogDao();
