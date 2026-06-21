import { BaseDao, PageOptions } from './BaseDao';
import { MarketingDiscountRule } from '../models/MarketingDiscountRule';
import { Op } from 'sequelize';

export class MarketingDiscountRuleDao extends BaseDao<MarketingDiscountRule> {
  constructor() {
    super(MarketingDiscountRule);
  }

  async findByMarketingId(marketingId: number): Promise<MarketingDiscountRule[]> {
    return this.findAll({
      where: { marketing_id: marketingId },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
    });
  }

  async findEffectiveRules(marketingId?: number, discountType?: number): Promise<MarketingDiscountRule[]> {
    const where: any = { effective_status: 1 };

    if (marketingId) {
      where.marketing_id = marketingId;
    }
    if (discountType) {
      where.discount_type = discountType;
    }

    where[Op.and] = [
      { [Op.or]: [{ start_time: { [Op.is]: null } as any }, { start_time: { [Op.lte]: new Date() } }] },
      { [Op.or]: [{ end_time: { [Op.is]: null } as any }, { end_time: { [Op.gte]: new Date() } }] },
    ];

    return this.findAll({
      where,
      order: [['sort_order', 'ASC'], ['min_amount', 'DESC']],
    });
  }

  async findByDiscountType(discountType: number): Promise<MarketingDiscountRule[]> {
    return this.findAll({
      where: { discount_type: discountType },
      order: [['sort_order', 'ASC'], ['id', 'DESC']],
    });
  }

  async findStackableRules(): Promise<MarketingDiscountRule[]> {
    return this.findAll({
      where: { stackable: 1, effective_status: 1 },
      order: [['sort_order', 'ASC']],
    });
  }

  async findPageByConditions(options: PageOptions & {
    marketingId?: number;
    discountType?: number;
    effectiveStatus?: number;
    keyword?: string;
    minAmountMin?: number;
    minAmountMax?: number;
  }): Promise<any> {
    const { marketingId, discountType, effectiveStatus, keyword, minAmountMin, minAmountMax, page, pageSize } = options;
    const where: any = {};

    if (marketingId) where.marketing_id = marketingId;
    if (discountType) where.discount_type = discountType;
    if (effectiveStatus !== undefined) where.effective_status = effectiveStatus;
    if (keyword) {
      where.rule_name = { [Op.like]: `%${keyword}%` };
    }
    if (minAmountMin !== undefined) {
      where.min_amount = { ...(where.min_amount || {}), [Op.gte]: minAmountMin };
    }
    if (minAmountMax !== undefined) {
      where.min_amount = { ...(where.min_amount || {}), [Op.lte]: minAmountMax };
    }

    return this.findPage({ page, pageSize, where, order: [['sort_order', 'ASC'], ['id', 'DESC']] });
  }
}

export default MarketingDiscountRuleDao;
