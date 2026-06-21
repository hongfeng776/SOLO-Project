import { BaseDao, PageOptions } from './BaseDao';
import { MarketingDiscountStackConflict } from '../models/MarketingDiscountStackConflict';
import { Op } from 'sequelize';

export class MarketingDiscountStackConflictDao extends BaseDao<MarketingDiscountStackConflict> {
  constructor() {
    super(MarketingDiscountStackConflict);
  }

  async findByRuleId(ruleId: number): Promise<MarketingDiscountStackConflict[]> {
    return this.findAll({
      where: {
        [Op.or]: [{ rule_id: ruleId }, { conflict_rule_id: ruleId }],
      },
      order: [['last_intercept_time', 'DESC']],
    });
  }

  async findPendingConflicts(options?: PageOptions): Promise<any> {
    return this.findPage({
      ...options,
      where: { status: 1 },
      order: [['last_intercept_time', 'DESC']],
    });
  }

  async findByConflictType(conflictType: number): Promise<MarketingDiscountStackConflict[]> {
    return this.findAll({
      where: { conflict_type: conflictType },
      order: [['last_intercept_time', 'DESC']],
    });
  }

  async findOrCreateConflict(
    ruleId: number,
    conflictRuleId: number,
    conflictType: number,
    conflictDetail?: string
  ): Promise<MarketingDiscountStackConflict> {
    let conflict = await this.findOne({
      where: {
        rule_id: ruleId,
        conflict_rule_id: conflictRuleId,
        conflict_type: conflictType,
      },
    });

    const now = new Date();
    if (conflict) {
      await conflict.update({
        intercept_count: (conflict.intercept_count || 0) + 1,
        last_intercept_time: now,
        conflict_detail: conflictDetail || conflict.conflict_detail,
      });
    } else {
      conflict = await this.create({
        rule_id: ruleId,
        conflict_rule_id: conflictRuleId,
        conflict_type: conflictType,
        conflict_detail: conflictDetail,
        intercept_count: 1,
        first_intercept_time: now,
        last_intercept_time: now,
        status: 1,
      } as any);
    }

    return conflict;
  }
}

export default MarketingDiscountStackConflictDao;
