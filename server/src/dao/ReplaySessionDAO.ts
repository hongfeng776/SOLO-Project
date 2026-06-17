import { Op } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import ReplaySession from '../models/ReplaySession';

class ReplaySessionDAO extends BaseDAO<ReplaySession> {
  constructor() {
    super(db.ReplaySession);
  }

  async findByDateRange(start: string, end: string): Promise<ReplaySession[]> {
    return this.model.findAll({
      where: {
        start_date: { [Op.lte]: end },
        end_date: { [Op.gte]: start },
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findBySector(sector: string): Promise<ReplaySession[]> {
    return this.model.findAll({
      where: { sector },
      order: [['created_at', 'DESC']],
    });
  }

  async findWithConclusions(id: number): Promise<ReplaySession | null> {
    return this.model.findByPk(id, {
      include: [
        {
          model: db.ReplayConclusion,
          as: 'conclusions',
        },
      ],
    });
  }
}

export default new ReplaySessionDAO();
