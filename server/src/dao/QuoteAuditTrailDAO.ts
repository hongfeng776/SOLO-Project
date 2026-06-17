import { Op } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import QuoteAuditTrail from '../models/QuoteAuditTrail';

class QuoteAuditTrailDAO extends BaseDAO<QuoteAuditTrail> {
  constructor() {
    super(db.QuoteAuditTrail);
  }

  async findByStockId(stockId: number, days: number = 30): Promise<QuoteAuditTrail[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.model.findAll({
      where: {
        stock_id: stockId,
        created_at: { [Op.gte]: since },
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findByOperator(operatorId: number): Promise<QuoteAuditTrail[]> {
    return this.model.findAll({
      where: { operator_id: operatorId },
      order: [['created_at', 'DESC']],
    });
  }

  async findByOperationType(type: string): Promise<QuoteAuditTrail[]> {
    return this.model.findAll({
      where: { operation_type: type },
      order: [['created_at', 'DESC']],
    });
  }

  async getLatestByStockId(stockId: number, limit: number = 10): Promise<QuoteAuditTrail[]> {
    return this.model.findAll({
      where: { stock_id: stockId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }
}

export default new QuoteAuditTrailDAO();
