import { daos } from '../dao';
import { Op } from 'sequelize';

const {
  marketingDiscountRuleDao,
  marketingDiscountRuleLogDao,
  marketingDiscountBudgetLedgerDao,
} = daos;

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  results: { id: number; success: boolean; message: string }[];
}

export interface BatchFilterParams {
  marketingId?: number;
  discountType?: number;
  effectiveStatus?: number;
  keyword?: string;
  minAmountMin?: number;
  minAmountMax?: number;
}

export class MarketingDiscountRuleBatchService {
  async batchEnable(ids: number[], operatorId: number, operatorName: string): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      try {
        const rule = await marketingDiscountRuleDao.findById(id);
        if (!rule) {
          results.push({ id, success: false, message: '规则不存在' });
          failedCount++;
          continue;
        }

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
          remark: '批量启用优惠规则',
        } as any);

        results.push({ id, success: true, message: '启用成功' });
        successCount++;
      } catch (err) {
        results.push({ id, success: false, message: (err as Error).message });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, total: ids.length, results };
  }

  async batchDisable(ids: number[], operatorId: number, operatorName: string): Promise<BatchOperationResult> {
    const results: { id: number; success: boolean; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      try {
        const rule = await marketingDiscountRuleDao.findById(id);
        if (!rule) {
          results.push({ id, success: false, message: '规则不存在' });
          failedCount++;
          continue;
        }

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
          remark: '批量禁用优惠规则',
        } as any);

        results.push({ id, success: true, message: '禁用成功' });
        successCount++;
      } catch (err) {
        results.push({ id, success: false, message: (err as Error).message });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, total: ids.length, results };
  }

  async batchAdjustThreshold(
    ids: number[],
    field: string,
    value: number,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const allowedFields = ['min_amount', 'discount_value', 'max_discount_amount', 'budget_total', 'quota_total', 'stack_limit'];
    if (!allowedFields.includes(field)) {
      return { success: 0, failed: ids.length, total: ids.length, results: ids.map(id => ({ id, success: false, message: '不支持调整该字段' })) };
    }

    const results: { id: number; success: boolean; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      try {
        const rule = await marketingDiscountRuleDao.findById(id);
        if (!rule) {
          results.push({ id, success: false, message: '规则不存在' });
          failedCount++;
          continue;
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
          remark: '批量调整阈值',
        } as any);

        results.push({ id, success: true, message: '调整成功' });
        successCount++;
      } catch (err) {
        results.push({ id, success: false, message: (err as Error).message });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, total: ids.length, results };
  }

  async batchClearExpiredQuota(
    marketingId: number,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const rules = await marketingDiscountRuleDao.findAll({
      where: {
        marketing_id: marketingId,
        effective_status: { [Op.in]: [2, 3] },
      },
    });

    const results: { id: number; success: boolean; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const rule of rules) {
      try {
        await rule.update({ quota_used: 0, budget_used: 0, operator_id: operatorId, operator_name: operatorName } as any);

        if (rule.budget_total && rule.budget_total > 0) {
          await marketingDiscountBudgetLedgerDao.create({
            rule_id: rule.id,
            marketing_id: rule.marketing_id,
            ledger_type: 3,
            amount: rule.budget_total,
            balance_before: rule.budget_used || 0,
            balance_after: 0,
            operator_id: operatorId,
            operator_name: operatorName,
            remark: '批量清零过期优惠额度',
          } as any);
        }

        results.push({ id: rule.id, success: true, message: '清零成功' });
        successCount++;
      } catch (err) {
        results.push({ id: rule.id, success: false, message: (err as Error).message });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, total: rules.length, results };
  }

  async filterAndOperate(
    operation: 'enable' | 'disable' | 'clear_quota',
    params: BatchFilterParams,
    operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const where: any = {};
    if (params.marketingId) where.marketing_id = params.marketingId;
    if (params.discountType) where.discount_type = params.discountType;
    if (params.effectiveStatus !== undefined) where.effective_status = params.effectiveStatus;
    if (params.keyword) where.rule_name = { [Op.like]: `%${params.keyword}%` };
    if (params.minAmountMin !== undefined) where.min_amount = { ...(where.min_amount || {}), [Op.gte]: params.minAmountMin };
    if (params.minAmountMax !== undefined) where.min_amount = { ...(where.min_amount || {}), [Op.lte]: params.minAmountMax };

    const rules = await marketingDiscountRuleDao.findAll({ where });
    const ids = rules.map(r => r.id);

    if (ids.length === 0) {
      return { success: 0, failed: 0, total: 0, results: [] };
    }

    if (operation === 'enable') return this.batchEnable(ids, operatorId, operatorName);
    if (operation === 'disable') return this.batchDisable(ids, operatorId, operatorName);
    if (operation === 'clear_quota' && params.marketingId) return this.batchClearExpiredQuota(params.marketingId, operatorId, operatorName);

    return { success: 0, failed: ids.length, total: ids.length, results: ids.map(id => ({ id, success: false, message: '不支持的操作' })) };
  }
}

export const marketingDiscountRuleBatchService = new MarketingDiscountRuleBatchService();

export default MarketingDiscountRuleBatchService;
