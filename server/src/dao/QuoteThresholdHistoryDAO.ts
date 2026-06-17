import { Op, WhereOptions } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import QuoteThresholdHistory, { ChangeType } from '../models/QuoteThresholdHistory';

class QuoteThresholdHistoryDAO extends BaseDAO<QuoteThresholdHistory> {
  constructor() {
    super(db.QuoteThresholdHistory);
  }

  async findByThresholdId(thresholdId: number, days: number = 90): Promise<QuoteThresholdHistory[]> {
    const where: WhereOptions = {
      threshold_id: thresholdId,
    };

    if (days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      where.created_at = { [Op.gte]: since };
    }

    return this.model.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async findRecentByTypeAndSector(
    type: string,
    sector: string,
    hours: number = 24,
  ): Promise<QuoteThresholdHistory[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const thresholdIds = await db.QuoteThreshold.findAll({
      where: {
        threshold_type: type,
        sector,
      },
      attributes: ['id'],
    });

    const ids = thresholdIds.map((t) => (t as { id: number }).id);

    if (ids.length === 0) {
      return [];
    }

    return this.model.findAll({
      where: {
        threshold_id: { [Op.in]: ids },
        created_at: { [Op.gte]: since },
      },
      order: [['created_at', 'DESC']],
    });
  }

  async getStatsByThresholdId(thresholdId: number, days: number = 90): Promise<{
    changeTypeDist: Record<ChangeType, number>;
    operatorDist: Record<string, number>;
    avgInterval: number;
  }> {
    const list = await this.findByThresholdId(thresholdId, days);

    const changeTypeDist: Record<string, number> = {
      create: 0,
      update: 0,
      delete: 0,
      expire: 0,
    };
    const operatorDist: Record<string, number> = {};
    const timestamps: number[] = [];

    for (const record of list) {
      changeTypeDist[record.change_type] = (changeTypeDist[record.change_type] || 0) + 1;
      operatorDist[record.operator_name] = (operatorDist[record.operator_name] || 0) + 1;
      if (record.created_at) {
        timestamps.push(record.created_at.getTime());
      }
    }

    let avgInterval = 0;
    if (timestamps.length >= 2) {
      timestamps.sort((a, b) => a - b);
      const intervals: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      changeTypeDist: changeTypeDist as Record<ChangeType, number>,
      operatorDist,
      avgInterval,
    };
  }
}

export default new QuoteThresholdHistoryDAO();
