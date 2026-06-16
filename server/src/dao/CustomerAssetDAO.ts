import BaseDAO from './BaseDAO';
import { db } from '../models';
import CustomerAsset from '../models/CustomerAsset';

class CustomerAssetDAO extends BaseDAO<CustomerAsset> {
  constructor() {
    super(db.CustomerAsset);
  }

  async findByIdCard(idCard: string): Promise<CustomerAsset | null> {
    return this.model.findOne({ where: { id_card: idCard } });
  }

  async findByRiskLevel(riskLevel: string): Promise<CustomerAsset[]> {
    return this.model.findAll({ where: { risk_level: riskLevel } });
  }

  async findByCustomerType(customerType: string): Promise<CustomerAsset[]> {
    return this.model.findAll({ where: { customer_type: customerType } });
  }
}

export default new CustomerAssetDAO();
