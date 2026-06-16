import { Op, WhereOptions } from 'sequelize';
import BaseDAO from './BaseDAO';
import { db } from '../models';
import Trade from '../models/Trade';

class TradeDAO extends BaseDAO<Trade> {
  constructor() {
    super(db.Trade);
  }

  async findByTradeNo(tradeNo: string): Promise<Trade | null> {
    return this.model.findOne({ where: { trade_no: tradeNo } });
  }

  async findByCustomerId(customerId: number): Promise<Trade[]> {
    return this.model.findAll({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findByCustomerIdAndStock(customerId: number, stockId: number): Promise<Trade[]> {
    return this.model.findAll({ where: { customer_id: customerId, stock_id: stockId }, order: [['created_at', 'DESC']] });
  }

  async findByStatus(status: string): Promise<Trade[]> {
    return this.model.findAll({ where: { trade_status: status } });
  }

  async countTodayTradesByCustomerAndStock(customerId: number, stockId: number): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    return this.model.count({
      where: {
        customer_id: customerId,
        stock_id: stockId,
        created_at: {
          [Op.between]: [startOfDay, endOfDay],
        } as WhereOptions,
      },
    });
  }
}

export default new TradeDAO();
