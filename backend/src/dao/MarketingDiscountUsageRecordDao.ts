import { BaseDao, PageOptions } from './BaseDao';
import { MarketingDiscountUsageRecord } from '../models/MarketingDiscountUsageRecord';
import { Op } from 'sequelize';

export class MarketingDiscountUsageRecordDao extends BaseDao<MarketingDiscountUsageRecord> {
  constructor() {
    super(MarketingDiscountUsageRecord);
  }

  async findByRuleId(ruleId: number, options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { rule_id: ruleId },
      order: [['usage_time', 'DESC']],
    });
  }

  async findByMarketingId(marketingId: number, options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { marketing_id: marketingId },
      order: [['usage_time', 'DESC']],
    });
  }

  async findByUserId(userId: number): Promise<MarketingDiscountUsageRecord[]> {
    return this.findAll({
      where: { user_id: userId },
      order: [['usage_time', 'DESC']],
    });
  }

  async countByRuleIdAndUserId(ruleId: number, userId: number): Promise<number> {
    return this.model.count({
      where: {
        rule_id: ruleId,
        user_id: userId,
        status: { [Op.ne]: 0 },
      },
    }) as Promise<number>;
  }

  async sumDiscountByRuleId(ruleId: number): Promise<number> {
    const result: any = await (this.model as any).sum('discount_amount', {
      where: { rule_id: ruleId, status: { [Op.ne]: 0 } },
    });
    return Number(result) || 0;
  }
}

export default MarketingDiscountUsageRecordDao;
