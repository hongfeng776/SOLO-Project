import { BaseDao } from './BaseDao';
import { MarketingProductAdmissionLog } from '../models/MarketingProductAdmissionLog';
import { FindOptions } from 'sequelize';

export class MarketingProductAdmissionLogDao extends BaseDao<MarketingProductAdmissionLog> {
  constructor() {
    super(MarketingProductAdmissionLog);
  }

  async findByMarketingProductId(marketingProductId: number, options?: FindOptions): Promise<MarketingProductAdmissionLog[]> {
    return this.findAll({
      ...options,
      where: {
        ...options?.where,
        marketing_product_id: marketingProductId,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findByMarketingId(marketingId: number, options?: FindOptions): Promise<MarketingProductAdmissionLog[]> {
    return this.findAll({
      ...options,
      where: {
        ...options?.where,
        marketing_id: marketingId,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findByGoodsId(goodsId: number, options?: FindOptions): Promise<MarketingProductAdmissionLog[]> {
    return this.findAll({
      ...options,
      where: {
        ...options?.where,
        goods_id: goodsId,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findByAction(action: string, options?: FindOptions): Promise<MarketingProductAdmissionLog[]> {
    return this.findAll({
      ...options,
      where: {
        ...options?.where,
        action,
      },
      order: [['created_at', 'DESC']],
    });
  }
}

export default MarketingProductAdmissionLogDao;
