import BaseDAO from './BaseDAO';
import { db } from '../models';
import RiskAlert from '../models/RiskAlert';

class RiskAlertDAO extends BaseDAO<RiskAlert> {
  constructor() {
    super(db.RiskAlert);
  }

  async findByAlertNo(alertNo: string): Promise<RiskAlert | null> {
    return this.model.findOne({ where: { alert_no: alertNo } });
  }

  async findByCustomerId(customerId: number): Promise<RiskAlert[]> {
    return this.model.findAll({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findByAlertType(alertType: string): Promise<RiskAlert[]> {
    return this.model.findAll({ where: { alert_type: alertType } });
  }

  async findByAlertLevel(alertLevel: string): Promise<RiskAlert[]> {
    return this.model.findAll({ where: { alert_level: alertLevel } });
  }

  async findByAlertStatus(alertStatus: string): Promise<RiskAlert[]> {
    return this.model.findAll({ where: { alert_status: alertStatus } });
  }
}

export default new RiskAlertDAO();
