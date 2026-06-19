import { FindOptions, CreateOptions, Op, fn, col } from 'sequelize';
import ChannelGradeChangeLog, { ChannelGradeChangeLogAttributes, ChannelGradeChangeLogCreationAttributes } from '../models/ChannelGradeChangeLog.model';
import { ChannelLevelChangeSource, ChannelLevel } from '../constants/enum';

class ChannelGradeChangeLogDao {
  public async create(data: ChannelGradeChangeLogCreationAttributes, options?: CreateOptions): Promise<ChannelGradeChangeLog> {
    return ChannelGradeChangeLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelGradeChangeLog | null> {
    return ChannelGradeChangeLog.findByPk(id, options);
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    channelId?: string;
    changeSource?: ChannelLevelChangeSource;
    fromLevel?: ChannelLevel;
    toLevel?: ChannelLevel;
    anomalyFlagged?: boolean;
    operatorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: ChannelGradeChangeLog[]; count: number }> {
    const { page, pageSize, channelId, changeSource, fromLevel, toLevel, anomalyFlagged, operatorId, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (channelId) {
      where.channelId = channelId;
    }
    if (changeSource) {
      where.changeSource = changeSource;
    }
    if (fromLevel) {
      where.fromLevel = fromLevel;
    }
    if (toLevel) {
      where.toLevel = toLevel;
    }
    if (anomalyFlagged !== undefined) {
      where.anomalyFlagged = anomalyFlagged;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return ChannelGradeChangeLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByChannelId(channelId: string, options?: FindOptions): Promise<ChannelGradeChangeLog[]> {
    return ChannelGradeChangeLog.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        channelId,
      },
      order: [['createdAt', 'ASC']],
    });
  }

  public async countByChannelId(channelId: string): Promise<number> {
    return ChannelGradeChangeLog.count({
      where: { channelId },
    });
  }

  public async findAnomalies(options?: FindOptions): Promise<ChannelGradeChangeLog[]> {
    return ChannelGradeChangeLog.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        anomalyFlagged: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAll(options?: FindOptions): Promise<ChannelGradeChangeLog[]> {
    return ChannelGradeChangeLog.findAll(options);
  }

  public async getIterationStats(options?: FindOptions): Promise<{ channelId: string; totalChanges: number; lastChangeAt: Date | null }[]> {
    const result = await ChannelGradeChangeLog.findAll({
      ...options,
      attributes: [
        'channelId',
        [fn('COUNT', col('id')), 'totalChanges'],
        [fn('MAX', col('created_at')), 'lastChangeAt'],
      ],
      group: ['channelId'],
      raw: true,
    });

    return result.map((row: any) => ({
      channelId: row.channelId,
      totalChanges: Number(row.totalChanges) || 0,
      lastChangeAt: row.lastChangeAt ? new Date(row.lastChangeAt) : null,
    }));
  }
}

export default new ChannelGradeChangeLogDao();
