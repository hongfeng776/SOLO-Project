import BaseDAO from './BaseDAO';
import { db } from '../models';
import CustomerHolding from '../models/CustomerHolding';

class CustomerHoldingDAO extends BaseDAO<CustomerHolding> {
  constructor() {
    super(db.CustomerHolding);
  }

  async findByCustomerId(customerId: number): Promise<CustomerHolding[]> {
    return this.model.findAll({ where: { customer_id: customerId }, order: [['market_value', 'DESC']] });
  }

  async findByCustomerIdAndStock(customerId: number, stockId: number): Promise<CustomerHolding | null> {
    return this.model.findOne({ where: { customer_id: customerId, stock_id: stockId } });
  }

  async findTopHoldingsByCustomer(customerId: number, limit: number = 3): Promise<CustomerHolding[]> {
    return this.model.findAll({
      where: { customer_id: customerId },
      order: [['market_value', 'DESC']],
      limit,
    });
  }
}

export default new CustomerHoldingDAO();
