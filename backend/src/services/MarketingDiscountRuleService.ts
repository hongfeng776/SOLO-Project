import { daos } from '../dao';
import { MarketingDiscountRule } from '../models/MarketingDiscountRule';
import { Op } from 'sequelize';

const {
  marketingDiscountRuleDao,
  marketingDiscountRuleLogDao,
  marketingDiscountBudgetLedgerDao,
  marketingDiscountThresholdDao,
  marketingMutexRuleDao,
} = daos;

export interface DiscountValidateError {
  field: string;
  message: string;
  level: 'error' | 'warning';
}

export interface DiscountValidateResult {
  passed: boolean;
  errors: DiscountValidateError[];
  warnings: DiscountValidateError[];
  optimalCombination?: DiscountRuleCombination;
  budgetHint?: string;
}

export interface DiscountRuleCombination {
  ruleIds: number[];
  ruleNames: string[];
  totalDiscount: number;
  originalAmount: number;
  finalAmount: number;
  description: string;
}

export interface CreateDiscountRuleParams {
  marketing_id: number;
  rule_name: string;
  discount_type: number;
  min_amount?: number;
  discount_value?: number;
  max_discount_amount?: number;
  stackable?: number;
  stack_limit?: number;
  exclude_rule_ids?: string;
  user_level_min?: number;
  user_level_max?: number;
  applicable_category_ids?: string;
  applicable_goods_ids?: string;
  exclude_goods_ids?: string;
  budget_total?: number;
  quota_total?: number;
  quota_per_user?: number;
  start_time?: Date;
  end_time?: Date;
  sort_order?: number;
  remark?: string;
}

export class MarketingDiscountRuleService {
  async validateCreate(params: CreateDiscountRuleParams, originalAmount = 0): Promise<DiscountValidateResult> {
    const errors: DiscountValidateError[] = [];
    const warnings: DiscountValidateError[] = [];

    if (!params.marketing_id) {
      errors.push({ field: 'marketing_id', message: '请选择所属营销活动', level: 'error' });
    }
    if (!params.rule_name || params.rule_name.trim().length === 0) {
      errors.push({ field: 'rule_name', message: '规则名称不能为空', level: 'error' });
    }
    if (params.rule_name && params.rule_name.length > 100) {
      errors.push({ field: 'rule_name', message: '规则名称不能超过100字符', level: 'error' });
    }
    if (![1, 2, 3].includes(params.discount_type)) {
      errors.push({ field: 'discount_type', message: '优惠类型不合法', level: 'error' });
    }

    if (params.discount_type === 1) {
      if (!params.discount_value || params.discount_value <= 0) {
        errors.push({ field: 'discount_value', message: '请设置有效的减免金额', level: 'error' });
      }
      if (params.min_amount !== undefined && params.discount_value !== undefined && params.discount_value >= params.min_amount) {
        errors.push({ field: 'discount_value', message: '减免金额不能大于等于最低消费金额', level: 'error' });
      }
    }

    if (params.discount_type === 2) {
      if (!params.discount_value || params.discount_value <= 0 || params.discount_value >= 100) {
        errors.push({ field: 'discount_value', message: '折扣率应在0-100之间（不含0和100）', level: 'error' });
      }
    }

    if (params.discount_type === 3) {
      if (!params.discount_value || params.discount_value <= 0) {
        errors.push({ field: 'discount_value', message: '请设置有效的优惠券面额', level: 'error' });
      }
      if (params.min_amount !== undefined && params.discount_value !== undefined && params.discount_value >= params.min_amount) {
        errors.push({ field: 'discount_value', message: '优惠券面额不能大于等于使用门槛', level: 'error' });
      }
    }

    const stackErrors = await this.validateStackRules(params);
    errors.push(...stackErrors);

    const thresholdErrors = await this.validateDiscountThreshold(params);
    errors.push(...thresholdErrors);

    const budgetWarnings = this.validateBudget(params);
    warnings.push(...budgetWarnings);

    if (params.start_time && params.end_time && params.start_time >= params.end_time) {
      errors.push({ field: 'end_time', message: '结束时间必须晚于开始时间', level: 'error' });
    }

    const optimalCombination = originalAmount > 0
      ? await this.calculateOptimalCombination(params.marketing_id, originalAmount, params)
      : undefined;

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      optimalCombination,
    };
  }

  private async validateStackRules(params: CreateDiscountRuleParams): Promise<DiscountValidateError[]> {
    const errors: DiscountValidateError[] = [];

    if (params.stackable === 1) {
      if (!params.stack_limit || params.stack_limit < 1 || params.stack_limit > 10) {
        errors.push({ field: 'stack_limit', message: '叠加上限应在1-10之间', level: 'error' });
      }

      const mutexRules = await marketingMutexRuleDao.findAll({
        where: { type: params.discount_type, status: 1 },
      });
      if (mutexRules.length > 0) {
        errors.push({
          field: 'stackable',
          message: `该优惠类型存在互斥规则：${mutexRules.map(r => r.rule_name).join('、')}，不可叠加`,
          level: 'error',
        });
      }
    }

    if (params.exclude_rule_ids) {
      const excludeIds = params.exclude_rule_ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      for (const excludeId of excludeIds) {
        const excludeRule = await marketingDiscountRuleDao.findById(excludeId);
        if (!excludeRule) {
          errors.push({ field: 'exclude_rule_ids', message: `互斥规则ID ${excludeId} 不存在`, level: 'error' });
        }
        if (excludeRule && excludeRule.marketing_id !== params.marketing_id) {
          errors.push({ field: 'exclude_rule_ids', message: `互斥规则ID ${excludeId} 不属于同一活动`, level: 'error' });
        }
      }
    }

    return errors;
  }

  private async validateDiscountThreshold(params: CreateDiscountRuleParams): Promise<DiscountValidateError[]> {
    const errors: DiscountValidateError[] = [];
    const thresholds = await marketingDiscountThresholdDao.findAll({
      where: { status: 1 },
    });

    for (const threshold of thresholds) {
      if (threshold.type !== params.discount_type) continue;

      if (params.discount_type === 2 && threshold.max_discount_rate && params.discount_value) {
        const discountRate = 100 - params.discount_value;
        if (discountRate > threshold.max_discount_rate) {
          errors.push({
            field: 'discount_value',
            message: `折扣力度过大，最大折扣率不能超过 ${threshold.max_discount_rate}%（当前设置 ${discountRate}%）`,
            level: 'error',
          });
        }
      }

      if ([1, 3].includes(params.discount_type) && threshold.max_discount_amount && params.discount_value) {
        if (params.discount_value > threshold.max_discount_amount) {
          errors.push({
            field: 'discount_value',
            message: `优惠金额过大，最大优惠金额不能超过 ${threshold.max_discount_amount} 元`,
            level: 'error',
          });
        }
      }
    }

    return errors;
  }

  private validateBudget(params: CreateDiscountRuleParams): DiscountValidateError[] {
    const warnings: DiscountValidateError[] = [];

    if (params.budget_total !== undefined && params.budget_total > 0) {
      if (params.quota_total !== undefined && params.quota_total > 0 && params.discount_value !== undefined) {
        const expectedBudget = params.quota_total * params.discount_value;
        if (expectedBudget > params.budget_total) {
          warnings.push({
            field: 'budget_total',
            message: `按当前配额计算预期消耗 ${expectedBudget.toFixed(2)} 元，可能超出总预算 ${params.budget_total.toFixed(2)} 元`,
            level: 'warning',
          });
        }
      }

      if (params.budget_total < 100) {
        warnings.push({
          field: 'budget_total',
          message: '预算金额较小，可能会很快耗尽',
          level: 'warning',
        });
      }
    }

    return warnings;
  }

  async calculateOptimalCombination(
    marketingId: number,
    originalAmount: number,
    newRule?: CreateDiscountRuleParams
  ): Promise<DiscountRuleCombination | undefined> {
    if (originalAmount <= 0) return undefined;

    let rules = await marketingDiscountRuleDao.findEffectiveRules(marketingId);

    if (newRule) {
      rules = rules.concat([{ ...newRule, id: 0, effective_status: 1 } as any]);
    }

    const applicableRules = rules.filter(r => (r.min_amount ?? 0) <= originalAmount);

    let bestDiscount = 0;
    let bestCombination: number[] = [];
    let bestNames: string[] = [];

    const tryCombination = (startIndex: number, currentRules: typeof rules, currentDiscount: number, usedStackCount: Map<number, number>) => {
      if (currentDiscount > bestDiscount && currentDiscount < originalAmount) {
        bestDiscount = currentDiscount;
        bestCombination = currentRules.map(r => r.id);
        bestNames = currentRules.map(r => r.rule_name);
      }

      for (let i = startIndex; i < applicableRules.length; i++) {
        const rule = applicableRules[i];
        const ruleDiscount = this.calculateSingleDiscount(rule, originalAmount);
        if (ruleDiscount <= 0) continue;

        const hasConflict = currentRules.some(r => {
          const excludeIds = (r.exclude_rule_ids || '').split(',').map(id => parseInt(id, 10));
          return excludeIds.includes(rule.id) || (rule.exclude_rule_ids || '').split(',').map(id => parseInt(id, 10)).includes(r.id);
        });
        if (hasConflict) continue;

        const stackCount = usedStackCount.get(rule.id) || 0;
        if (!rule.stackable && currentRules.some(r => r.id === rule.id)) continue;
        if (rule.stackable && stackCount >= (rule.stack_limit || 1)) continue;

        const newUsedStackCount = new Map(usedStackCount);
        newUsedStackCount.set(rule.id, stackCount + 1);

        tryCombination(i, [...currentRules, rule], currentDiscount + ruleDiscount, newUsedStackCount);
      }
    };

    tryCombination(0, [], 0, new Map());

    if (bestCombination.length === 0) return undefined;

    return {
      ruleIds: bestCombination,
      ruleNames: bestNames,
      totalDiscount: bestDiscount,
      originalAmount,
      finalAmount: originalAmount - bestDiscount,
      description: `最优组合：${bestNames.join(' + ')}，共省 ${bestDiscount.toFixed(2)} 元`,
    };
  }

  private calculateSingleDiscount(rule: MarketingDiscountRule | CreateDiscountRuleParams, originalAmount: number): number {
    if ((rule.min_amount ?? 0) > originalAmount) return 0;

    if (rule.discount_type === 1 || rule.discount_type === 3) {
      const discount = rule.discount_value ?? 0;
      if (rule.max_discount_amount && discount > rule.max_discount_amount) {
        return rule.max_discount_amount;
      }
      return discount;
    }

    if (rule.discount_type === 2) {
      const rate = (rule.discount_value ?? 100) / 100;
      const discount = originalAmount * (1 - rate);
      if (rule.max_discount_amount && discount > rule.max_discount_amount) {
        return rule.max_discount_amount;
      }
      return discount;
    }

    return 0;
  }

  async createRule(params: CreateDiscountRuleParams, operatorId: number, operatorName: string): Promise<MarketingDiscountRule> {
    const validateResult = await this.validateCreate(params);
    if (!validateResult.passed) {
      throw new Error(validateResult.errors[0].message);
    }

    const rule = await marketingDiscountRuleDao.create({
      ...params,
      budget_used: 0,
      quota_used: 0,
      effective_status: 1,
      operator_id: operatorId,
      operator_name: operatorName,
    } as any);

    await marketingDiscountRuleLogDao.create({
      rule_id: rule.id,
      operator_id: operatorId,
      operator_type: 1,
      operator_name: operatorName,
      action_type: 'create',
      new_value: JSON.stringify(params),
      remark: '创建优惠规则',
    } as any);

    if (params.budget_total && params.budget_total > 0) {
      await marketingDiscountBudgetLedgerDao.create({
        rule_id: rule.id,
        marketing_id: params.marketing_id,
        ledger_type: 1,
        amount: params.budget_total,
        balance_before: 0,
        balance_after: params.budget_total,
        operator_id: operatorId,
        operator_name: operatorName,
        remark: '初始预算划拨',
      } as any);
    }

    return rule;
  }

  async updateRule(id: number, params: Partial<CreateDiscountRuleParams>, operatorId: number, operatorName: string): Promise<MarketingDiscountRule> {
    const rule = await marketingDiscountRuleDao.findById(id);
    if (!rule) {
      throw new Error('优惠规则不存在');
    }

    const existingParams: CreateDiscountRuleParams = {
      marketing_id: rule.marketing_id,
      rule_name: rule.rule_name,
      discount_type: rule.discount_type,
      min_amount: rule.min_amount,
      discount_value: rule.discount_value,
      max_discount_amount: rule.max_discount_amount,
      stackable: rule.stackable,
      stack_limit: rule.stack_limit,
      ...params,
    };

    const validateResult = await this.validateCreate(existingParams);
    if (!validateResult.passed) {
      throw new Error(validateResult.errors[0].message);
    }

    const changedFields: { field: string; old: any; new: any }[] = [];
    for (const key of Object.keys(params)) {
      const oldVal = (rule as any)[key];
      const newVal = (params as any)[key];
      if (oldVal !== newVal) {
        changedFields.push({ field: key, old: oldVal, new: newVal });
      }
    }

    await rule.update({ ...params, operator_id: operatorId, operator_name: operatorName } as any);

    for (const change of changedFields) {
      await marketingDiscountRuleLogDao.create({
        rule_id: id,
        operator_id: operatorId,
        operator_type: 1,
        operator_name: operatorName,
        action_type: 'update',
        field_name: change.field,
        old_value: JSON.stringify(change.old),
        new_value: JSON.stringify(change.new),
        remark: `修改字段 ${change.field}`,
      } as any);
    }

    return rule;
  }

  async enableRule(id: number, operatorId: number, operatorName: string): Promise<MarketingDiscountRule> {
    const rule = await marketingDiscountRuleDao.findById(id);
    if (!rule) throw new Error('优惠规则不存在');

    const oldStatus = rule.effective_status;
    await rule.update({ effective_status: 1, operator_id: operatorId, operator_name: operatorName });

    await marketingDiscountRuleLogDao.create({
      rule_id: id,
      operator_id: operatorId,
      operator_type: 1,
      operator_name: operatorName,
      action_type: 'enable',
      old_status: oldStatus,
      new_status: 1,
      remark: '启用优惠规则',
    } as any);

    return rule;
  }

  async disableRule(id: number, operatorId: number, operatorName: string): Promise<MarketingDiscountRule> {
    const rule = await marketingDiscountRuleDao.findById(id);
    if (!rule) throw new Error('优惠规则不存在');

    const oldStatus = rule.effective_status;
    await rule.update({ effective_status: 3, operator_id: operatorId, operator_name: operatorName });

    await marketingDiscountRuleLogDao.create({
      rule_id: id,
      operator_id: operatorId,
      operator_type: 1,
      operator_name: operatorName,
      action_type: 'disable',
      old_status: oldStatus,
      new_status: 3,
      remark: '禁用优惠规则',
    } as any);

    return rule;
  }

  async adjustThreshold(id: number, field: string, value: number, operatorId: number, operatorName: string): Promise<MarketingDiscountRule> {
    const rule = await marketingDiscountRuleDao.findById(id);
    if (!rule) throw new Error('优惠规则不存在');

    const allowedFields = ['min_amount', 'discount_value', 'max_discount_amount', 'budget_total', 'quota_total', 'stack_limit'];
    if (!allowedFields.includes(field)) {
      throw new Error('不支持调整该字段');
    }

    const oldVal = (rule as any)[field];
    await rule.update({ [field]: value, operator_id: operatorId, operator_name: operatorName } as any);

    await marketingDiscountRuleLogDao.create({
      rule_id: id,
      operator_id: operatorId,
      operator_type: 1,
      operator_name: operatorName,
      action_type: 'threshold_adjust',
      field_name: field,
      old_value: String(oldVal),
      new_value: String(value),
      remark: `调整阈值 ${field}`,
    } as any);

    return rule;
  }

  async checkIllegalStacking(ruleIds: number[]): Promise<{ illegal: boolean; conflicts: { ruleId1: number; ruleId2: number; reason: string }[] }> {
    const conflicts: { ruleId1: number; ruleId2: number; reason: string }[] = [];
    const rules = await marketingDiscountRuleDao.findAll({ where: { id: { [Op.in]: ruleIds } } });

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i];
        const r2 = rules[j];

        const excludeIds1 = (r1.exclude_rule_ids || '').split(',').map(id => parseInt(id, 10));
        if (excludeIds1.includes(r2.id)) {
          conflicts.push({ ruleId1: r1.id, ruleId2: r2.id, reason: '规则设置为互斥' });
          continue;
        }

        const mutexRules = await marketingMutexRuleDao.findAll({
          where: {
            [Op.or]: [
              { type: r1.discount_type, mutex_type: r2.discount_type, status: 1 },
              { type: r2.discount_type, mutex_type: r1.discount_type, status: 1 },
            ],
          },
        });
        if (mutexRules.length > 0) {
          conflicts.push({ ruleId1: r1.id, ruleId2: r2.id, reason: `系统级互斥：${mutexRules.map(r => r.rule_name).join('、')}` });
        }

        if (!r1.stackable || !r2.stackable) {
          if (r1.discount_type === r2.discount_type) {
            conflicts.push({ ruleId1: r1.id, ruleId2: r2.id, reason: '同类型且至少一个不可叠加' });
          }
        }
      }
    }

    return { illegal: conflicts.length > 0, conflicts };
  }
}

export const marketingDiscountRuleService = new MarketingDiscountRuleService();

export default MarketingDiscountRuleService;
