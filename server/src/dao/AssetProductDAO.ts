import BaseDAO from './BaseDAO';
import { db } from '../models';
import AssetProduct from '../models/AssetProduct';

class AssetProductDAO extends BaseDAO<AssetProduct> {
  constructor() {
    super(db.AssetProduct);
  }

  async findByProductCode(productCode: string): Promise<AssetProduct | null> {
    return this.model.findOne({ where: { product_code: productCode } });
  }

  async findByRiskLevel(riskLevel: string): Promise<AssetProduct[]> {
    return this.model.findAll({ where: { risk_level: riskLevel } });
  }

  async findByProductType(productType: string): Promise<AssetProduct[]> {
    return this.model.findAll({ where: { product_type: productType } });
  }
}

export default new AssetProductDAO();
