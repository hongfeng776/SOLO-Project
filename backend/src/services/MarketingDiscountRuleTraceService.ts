import { daos } from '../dao';
import type { PageOptions, PageResult } from '../dao/BaseDao';
import type { MarketingDiscountRule } from '../models/MarketingDiscountRule';
import type { MarketingDiscountRuleLog } from '../models/MarketingDiscountRuleLog';
import type { MarketingDiscountUsageRecord } from '../models/MarketingDiscountUsageRecord';
import type { MarketingDiscountStackConflict } from '../models/MarketingDiscountStackConflict';
import type { MarketingDiscountBudgetLedger } from '../models/MarketingDiscountBudgetLedger';

const {
  marketingDiscountRuleDao,
  marketingDiscountRuleLogDao,
  marketingDiscountUsageRecordDao,
  marketingDiscountStackConflictDao,
  marketingDiscountBudgetLedgerDao,
} = daos;

export interface DiscountRuleTraceData {
  basicInfo: MarketingDiscountRule | null;
  configLogs: MarketingDiscountRuleLog[];
  usageRecords: MarketingDiscountUsageRecord[];
  stackConflicts: MarketingDiscountStackConflict[];
  budgetLedger: MarketingDiscountBudgetLedger[];
  usageStats: {
    totalUsed: number;
    totalDiscountAmount: number;
    budgetUsageRate: number;
    quotaUsageRate: number;
  };
  ruleMatchDetails: {
    field: string;
    ruleValue: string;
    passed: boolean;
    description: string;
  }[];
}

export interface IllegalStackCheckResult {
  illegal: boolean;
  conflicts: { ruleId1: number; ruleId2: number; reason: string }[];
  message: string;
}

export interface OverLimitCheckResult {
  overLimit: boolean;
  overLimitRules: { ruleId: number; ruleName: string; field: string; limit: number; actual: number }[];
  message: string;
}

export class MarketingDiscountRuleTraceService {
  async getTraceData(ruleId: number): Promise<DiscountRuleTraceData> {
    const basicInfo = await marketingDiscountRuleDao.findById(ruleId);
    if (!basicInfo) {
      throw new Error('优惠规则不存在');
    }

    const configLogs = await marketingDiscountRuleLogDao.findByRuleId(ruleId);
    const usageRecordsResult = await marketingDiscountUsageRecordDao.findByRuleId(ruleId, { page: 1, pageSize: 50 });
    const usageRecords = usageRecordsResult.list || [];
    const stackConflicts = await marketingDiscountStackConflictDao.findByRuleId(ruleId);
    const budgetLedgerResult = await marketingDiscountBudgetLedgerDao.findByRuleId(ruleId, { page: 1, pageSize: 50 });
    const budgetLedger = budgetLedgerResult.list || [];

    const totalUsed = basicInfo.quota_used || 0;
    const totalDiscountAmount = await marketingDiscountUsageRecordDao.sumDiscountByRuleId(ruleId);
    const budgetUsageRate = basicInfo.budget_total ? Number(((basicInfo.budget_used || 0) / basicInfo.budget_total * 100).toFixed(2)) : 0;
    const quotaUsageRate = basicInfo.quota_total ? Number(((basicInfo.quota_used || 0) / basicInfo.quota_total * 100).toFixed(2)) : 0;

    const ruleMatchDetails = await this.buildRuleMatchDetails(basicInfo);

    return {
      basicInfo,
      configLogs,
      usageRecords,
      stackConflicts,
      budgetLedger,
      usageStats: { totalUsed, totalDiscountAmount, budgetUsageRate, quotaUsageRate },
      ruleMatchDetails,
    };
  }

  private async buildRuleMatchDetails(rule: MarketingDiscountRule): Promise<DiscountRuleTraceData['ruleMatchDetails']> {
    const details: DiscountRuleTraceData['ruleMatchDetails'] = [];

    details.push({
      field: '优惠类型',
      ruleValue: this.getDiscountTypeLabel(rule.discount_type),
      passed: true,
      description: '优惠类型合法',
    });

    details.push({
      field: '使用门槛',
      ruleValue: `≥ ¥${(rule.min_amount || 0).toFixed(2)}`,
      passed: (rule.min_amount || 0) >= 0,
      description: '最低消费金额设置',
    });

    if (rule.discount_type === 1 || rule.discount_type === 3) {
      details.push({
        field: '优惠金额',
        ruleValue: `¥${(rule.discount_value || 0).toFixed(2)}`,
        passed: !!rule.discount_value && rule.discount_value > 0 && (rule.min_amount || 0) > rule.discount_value,
        description: rule.discount_value && (rule.min_amount || 0) > rule.discount_value ? '优惠金额小于门槛，合理' : '优惠金额设置异常',
      });
    }

    if (rule.discount_type === 2) {
      details.push({
        field: '折扣率',
        ruleValue: `${(rule.discount_value || 0).toFixed(2)}%`,
        passed: !!rule.discount_value && rule.discount_value > 0 && rule.discount_value < 100,
        description: '折扣率应在0-100之间',
      });
    }

    if (rule.max_discount_amount) {
      details.push({
        field: '最大优惠金额',
        ruleValue: `¥${rule.max_discount_amount.toFixed(2)}`,
        passed: rule.max_discount_amount > 0,
        description: '优惠上限设置',
      });
    }

    details.push({
      field: '是否可叠加',
      ruleValue: rule.stackable ? '是（最多' + (rule.stack_limit || 1) + '次）' : '否',
      passed: true,
      description: '叠加规则设置',
    });

    if (rule.budget_total) {
      details.push({
        field: '预算',
        ruleValue: `¥${rule.budget_total.toFixed(2)} / 已用 ¥${(rule.budget_used || 0).toFixed(2)}`,
        passed: (rule.budget_used || 0) <= rule.budget_total,
        description: (rule.budget_used || 0) <= rule.budget_total ? '预算未超限' : '预算已超限',
      });
    }

    if (rule.quota_total) {
      details.push({
        field: '配额',
        ruleValue: `${rule.quota_total}个 / 已用 ${rule.quota_used || 0}个`,
        passed: (rule.quota_used || 0) <= rule.quota_total,
        description: (rule.quota_used || 0) <= rule.quota_total ? '配额未超限' : '配额已超限',
      });
    }

    if (rule.start_time && rule.end_time) {
      const now = new Date();
      details.push({
        field: '有效期',
        ruleValue: `${rule.start_time.toLocaleString()} ~ ${rule.end_time.toLocaleString()}`,
        passed: now >= rule.start_time && now <= rule.end_time,
        description: now < rule.start_time ? '未生效' : now > rule.end_time ? '已过期' : '有效期内',
      });
    }

    return details;
  }

  private getDiscountTypeLabel(type: number): string {
    const labels: Record<number, string> = { 1: '满减', 2: '折扣', 3: '优惠券' };
    return labels[type] || '未知';
  }

  async getConfigLogs(ruleId: number, pageOptions: PageOptions): Promise<PageResult<MarketingDiscountRuleLog>> {
    const allLogs = await marketingDiscountRuleLogDao.findByRuleId(ruleId);
    const page = pageOptions.page || 1;
    const pageSize = pageOptions.pageSize || 10;
    const start = (page - 1) * pageSize;
    return {
      list: allLogs.slice(start, start + pageSize),
      total: allLogs.length,
      page,
      pageSize,
    } as any;
  }

  async getUsageRecords(ruleId: number, pageOptions: PageOptions): Promise<PageResult<MarketingDiscountUsageRecord>> {
    return marketingDiscountUsageRecordDao.findByRuleId(ruleId, pageOptions);
  }

  async getStackConflicts(ruleId: number): Promise<MarketingDiscountStackConflict[]> {
    return marketingDiscountStackConflictDao.findByRuleId(ruleId);
  }

  async getBudgetLedger(ruleId: number, pageOptions: PageOptions): Promise<PageResult<MarketingDiscountBudgetLedger>> {
    return marketingDiscountBudgetLedgerDao.findByRuleId(ruleId, pageOptions);
  }

  async checkIllegalStacking(ruleIds: number[]): Promise<IllegalStackCheckResult> {
    const conflicts: { ruleId1: number; ruleId2: number; reason: string }[] = [];
    const rules = await marketingDiscountRuleDao.findAll({ where: { id: ruleIds } as any });

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i];
        const r2 = rules[j];

        const excludeIds1 = (r1.exclude_rule_ids || '').split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (excludeIds1.includes(r2.id)) {
          conflicts.push({ ruleId1: r1.id, ruleId2: r2.id, reason: `规则"${r1.rule_name}"明确排除了规则"${r2.rule_name}"` });
          continue;
        }

        if (!r1.stackable || !r2.stackable) {
          if (r1.discount_type === r2.discount_type) {
            conflicts.push({ ruleId1: r1.id, ruleId2: r2.id, reason: `同类型且至少一个不可叠加` });
          }
        }
      }
    }

    return {
      illegal: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 ? `检测到${conflicts.length}组违规叠加` : '未检测到违规叠加',
    };
  }

  async checkOverLimit(marketingId: number): Promise<OverLimitCheckResult> {
    const rules = await marketingDiscountRuleDao.findByMarketingId(marketingId);
    const overLimitRules: { ruleId: number; ruleName: string; field: string; limit: number; actual: number }[] = [];

    for (const rule of rules) {
      if (rule.budget_total && (rule.budget_used || 0) > rule.budget_total) {
        overLimitRules.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          field: 'budget_total',
          limit: rule.budget_total,
          actual: rule.budget_used || 0,
        });
      }
      if (rule.quota_total && (rule.quota_used || 0) > rule.quota_total) {
        overLimitRules.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          field: 'quota_total',
          limit: rule.quota_total,
          actual: rule.quota_used || 0,
        });
      }
    }

    return {
      overLimit: overLimitRules.length > 0,
      overLimitRules,
      message: overLimitRules.length > 0 ? `检测到${overLimitRules.length}个超限优惠规则` : '所有规则未超限',
    };
  }

  async getBudgetLedgerByMarketing(marketingId: number, pageOptions: PageOptions): Promise<PageResult<MarketingDiscountBudgetLedger>> {
    return marketingDiscountBudgetLedgerDao.findByMarketingId(marketingId, pageOptions);
  }
}

export const marketingDiscountRuleTraceService = new MarketingDiscountRuleTraceService();

export default MarketingDiscountRuleTraceService;
