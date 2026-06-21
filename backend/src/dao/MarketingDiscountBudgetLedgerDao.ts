import { BaseDao, PageOptions } from './BaseDao';
import { MarketingDiscountBudgetLedger } from '../models/MarketingDiscountBudgetLedger';

export class MarketingDiscountBudgetLedgerDao extends BaseDao<MarketingDiscountBudgetLedger> {
  constructor() {
    super(MarketingDiscountBudgetLedger);
  }

  async findByRuleId(ruleId: number, options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { rule_id: ruleId },
      order: [['created_at', 'DESC']],
    });
  }

  async findByMarketingId(marketingId: number, options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { marketing_id: marketingId },
      order: [['created_at', 'DESC']],
    });
  }

  async findByLedgerType(ledgerType: number): Promise<MarketingDiscountBudgetLedger[]> {
    return this.findAll({
      where: { ledger_type: ledgerType },
      order: [['created_at', 'DESC']],
    });
  }

  async sumAmountByRuleId(ruleId: number, ledgerType?: number): Promise<number> {
    const where: any = { rule_id: ruleId };
    if (ledgerType !== undefined) {
      where.ledger_type = ledgerType;
    }
    const result: any = await (this.model as any).sum('amount', { where });
    return Number(result) || 0;
  }
}

export default MarketingDiscountBudgetLedgerDao;
