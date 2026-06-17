import { Op } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import ReplayConclusion from '../models/ReplayConclusion';

class ReplayConclusionDAO extends BaseDAO<ReplayConclusion> {
  constructor() {
    super(db.ReplayConclusion);
  }

  async findBySessionId(sessionId: number): Promise<ReplayConclusion[]> {
    return this.model.findAll({
      where: { session_id: sessionId },
      order: [['stock_code', 'ASC']],
    });
  }

  async findByStockCode(stockCode: string, start: string, end: string): Promise<ReplayConclusion[]> {
    return this.model.findAll({
      where: { stock_code: stockCode },
      include: [
        {
          model: db.ReplaySession,
          as: 'session',
          where: {
            start_date: { [Op.lte]: end },
            end_date: { [Op.gte]: start },
          },
          attributes: ['id', 'session_name', 'start_date', 'end_date'],
        },
      ],
    });
  }

  async findSectorComparison(sector: string, start: string, end: string): Promise<ReplayConclusion[]> {
    return this.model.findAll({
      where: { sector },
      include: [
        {
          model: db.ReplaySession,
          as: 'session',
          where: {
            start_date: { [Op.lte]: end },
            end_date: { [Op.gte]: start },
          },
          attributes: ['id', 'session_name', 'start_date', 'end_date'],
        },
      ],
      order: [['avg_change_rate', 'DESC']],
    });
  }
}

export default new ReplayConclusionDAO();
