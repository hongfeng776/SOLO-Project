import { BaseDao, PageOptions } from './BaseDao';
import { MarketingDiscountRuleLog } from '../models/MarketingDiscountRuleLog';
import { Op } from 'sequelize';

export class MarketingDiscountRuleLogDao extends BaseDao<MarketingDiscountRuleLog> {
  constructor() {
    super(MarketingDiscountRuleLog);
  }

  async findByRuleId(ruleId: number): Promise<MarketingDiscountRuleLog[]> {
    return this.findAll({
      where: { rule_id: ruleId },
      order: [['created_at', 'DESC']],
    });
  }

  async findByMarketingId(marketingId: number, options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { rule_id: { [Op.in]: (this.model as any).sequelize.literal(`(SELECT id FROM marketing_discount_rules WHERE marketing_id = ${marketingId})`) } },
      order: [['created_at', 'DESC']],
    });
  }

  async findByActionType(actionType: string): Promise<MarketingDiscountRuleLog[]> {
    return this.findAll({
      where: { action_type: actionType },
      order: [['created_at', 'DESC']],
    });
  }
}

export default MarketingDiscountRuleLogDao;
