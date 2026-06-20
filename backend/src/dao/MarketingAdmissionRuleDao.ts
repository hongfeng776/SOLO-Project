import { BaseDao } from './BaseDao';
import { MarketingAdmissionRule } from '../models/MarketingAdmissionRule';
import { Op } from 'sequelize';

export class MarketingAdmissionRuleDao extends BaseDao<MarketingAdmissionRule> {
  constructor() {
    super(MarketingAdmissionRule);
  }

  async findEnabledRules(marketingId?: number, marketingType?: number): Promise<MarketingAdmissionRule[]> {
    const where: any = {
      status: 1,
    };

    if (marketingId || marketingType) {
      where[Op.or] = [
        { marketing_id: null, marketing_type: null },
      ];
      if (marketingId) {
        where[Op.or].push({ marketing_id: marketingId });
      }
      if (marketingType) {
        where[Op.or].push({ marketing_type: marketingType });
      }
    }

    return this.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
  }

  async findByMarketingId(marketingId: number): Promise<MarketingAdmissionRule[]> {
    return this.findAll({
      where: {
        marketing_id: marketingId,
        status: 1,
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
  }

  async findGlobalRules(): Promise<MarketingAdmissionRule[]> {
    return this.findAll({
      where: {
        marketing_id: { [Op.is]: null } as any,
        marketing_type: { [Op.is]: null } as any,
        status: 1,
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
  }

  async findByRuleType(ruleType: string): Promise<MarketingAdmissionRule[]> {
    return this.findAll({
      where: {
        rule_type: ruleType,
        status: 1,
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
    });
  }
}

export default MarketingAdmissionRuleDao;
