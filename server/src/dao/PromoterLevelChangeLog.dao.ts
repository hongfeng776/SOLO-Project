import { FindOptions, CreateOptions, Op, fn, col } from 'sequelize';
import PromoterLevelChangeLog, { PromoterLevelChangeLogAttributes, PromoterLevelChangeLogCreationAttributes } from '../models/PromoterLevelChangeLog.model';
import { LevelChangeSource, PromoterLevel } from '../constants/enum';

class PromoterLevelChangeLogDao {
  public async create(data: PromoterLevelChangeLogCreationAttributes, options?: CreateOptions): Promise<PromoterLevelChangeLog> {
    return PromoterLevelChangeLog.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<PromoterLevelChangeLog | null> {
    return PromoterLevelChangeLog.findByPk(id, options);
  }

  public async findAllPaged(params: {
    page: number;
    pageSize: number;
    promoterId?: string;
    changeSource?: LevelChangeSource;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    anomalyFlagged?: boolean;
    operatorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ rows: PromoterLevelChangeLog[]; count: number }> {
    const { page, pageSize, promoterId, changeSource, fromLevel, toLevel, anomalyFlagged, operatorId, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (promoterId) {
      where.promoterId = promoterId;
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

    return PromoterLevelChangeLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByPromoterId(promoterId: string, options?: FindOptions): Promise<PromoterLevelChangeLog[]> {
    return PromoterLevelChangeLog.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        promoterId,
      },
      order: [['createdAt', 'ASC']],
    });
  }

  public async countByPromoterId(promoterId: string): Promise<number> {
    return PromoterLevelChangeLog.count({
      where: { promoterId },
    });
  }

  public async findAnomalies(options?: FindOptions): Promise<PromoterLevelChangeLog[]> {
    return PromoterLevelChangeLog.findAll({
      ...options,
      where: {
        ...(options?.where || {}),
        anomalyFlagged: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  public async getIterationStats(options?: FindOptions): Promise<{ promoterId: string; totalChanges: number; lastChangeAt: Date | null }[]> {
    const result = await PromoterLevelChangeLog.findAll({
      ...options,
      attributes: [
        'promoterId',
        [fn('COUNT', col('id')), 'totalChanges'],
        [fn('MAX', col('created_at')), 'lastChangeAt'],
      ],
      group: ['promoterId'],
      raw: true,
    });

    return result.map((row: any) => ({
      promoterId: row.promoterId,
      totalChanges: Number(row.totalChanges) || 0,
      lastChangeAt: row.lastChangeAt ? new Date(row.lastChangeAt) : null,
    }));
  }
}

export default new PromoterLevelChangeLogDao();
