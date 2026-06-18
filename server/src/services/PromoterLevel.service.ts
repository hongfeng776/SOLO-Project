import {
  promoterDao,
  promoterLevelRuleDao,
  promoterLevelAdjustRequestDao,
  promoterLevelChangeLogDao,
  promoterChangeLogDao,
  userDao,
} from '../dao';
import { PromoterAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  PromoterLevel,
  LEVEL_RULE_THRESHOLDS,
  LEVEL_CHANGE_SOURCE_LABELS,
  ManualLevelAdjustStatus,
  LevelChangeSource,
  AccountLevel,
  UserRole,
  PROMOTER_LEVEL_CONFIGS,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';

interface ThresholdValidation {
  valid: boolean;
  failingFields: {
    field: string;
    label: string;
    current: number;
    required: number;
    gap: number;
  }[];
}

interface AutoLevelResult {
  promoterId: string;
  name: string;
  code: string;
  originalLevel: string;
  newLevel: string;
  changed: boolean;
  metrics: any;
  reason?: string;
}

interface BatchLevelResult {
  total: number;
  regraded: number;
  skipped: number;
  failed: number;
  details: AutoLevelResult[];
}

interface ComplianceCheckResult {
  compliant: boolean;
  issues: string[];
  anomalyFlagged: boolean;
  anomalyReason?: string;
}

const LEVEL_ORDER = [PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5];
const TOP_CORE_LEVEL = PromoterLevel.L5;
const CORE_LEVELS = [PromoterLevel.L4, PromoterLevel.L5];
const MIN_GAP_FOR_ANOMALY = 50;
const MAX_DOWNGRADE_LEVELS = 2;

function getLevelIndex(level: string): number {
  return LEVEL_ORDER.indexOf(level as PromoterLevel);
}

function parsePromoterMetrics(promoter: any): {
  monthlyAmount: number;
  monthlyOrders: number;
  activeDays: number;
  reputationScore: number;
} {
  return {
    monthlyAmount: Number(promoter.monthlyAmount || promoter.totalAmount || 0),
    monthlyOrders: Number(promoter.monthlyOrders || promoter.totalOrders || 0),
    activeDays: Number(promoter.activeDays || 0),
    reputationScore: Number(promoter.reputationScore ?? 100),
  };
}

class PromoterLevelService {
  public async validateThresholds(level: string, metrics: any): Promise<ThresholdValidation> {
    const rule = await this.getEffectiveRule(level);
    if (!rule) {
      throw new AppError('等级规则未配置', BusinessCode.NOT_FOUND);
    }

    const failingFields: ThresholdValidation['failingFields'] = [];
    const fields: { key: string; label: string; value: number; threshold: number }[] = [
      { key: 'minMonthlyAmount', label: '推广业绩', value: metrics.monthlyAmount, threshold: Number(rule.minMonthlyAmount || 0) },
      { key: 'minMonthlyOrders', label: '订单量', value: metrics.monthlyOrders, threshold: Number(rule.minMonthlyOrders || 0) },
      { key: 'minActiveDays', label: '活跃度', value: metrics.activeDays, threshold: Number(rule.minActiveDays || 0) },
      { key: 'minReputationScore', label: '信誉分', value: metrics.reputationScore, threshold: Number(rule.minReputationScore || 0) },
    ];

    for (const f of fields) {
      if (f.value < f.threshold) {
        failingFields.push({
          field: f.key,
          label: f.label,
          current: f.value,
          required: f.threshold,
          gap: f.threshold - f.value,
        });
      }
    }

    return {
      valid: failingFields.length === 0,
      failingFields,
    };
  }

  public async getEffectiveRule(level: string) {
    const cacheKey = `level:rule:${level}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    let rule = await promoterLevelRuleDao.findByLevel(level as PromoterLevel);
    if (!rule) {
      const fallback = LEVEL_RULE_THRESHOLDS.find(t => t.level === level);
      const fallbackConfig = PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
      rule = { ...fallback, ...fallbackConfig, level, levelName: `L${getLevelIndex(level) + 1}` } as any;
    }

    await CacheUtils.set(cacheKey, rule, CacheTTL.MEDIUM);
    return rule;
  }

  public async getAllEffectiveRules() {
    const cacheKey = 'level:rules:all';
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const activeRules = await promoterLevelRuleDao.findAllActive();
    const result = LEVEL_ORDER.map(level => {
      const rule = activeRules.find(r => (r as any).level === level);
      if (rule) return rule;
      const fallback = LEVEL_RULE_THRESHOLDS.find(t => t.level === level);
      const fallbackConfig = PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
      return { ...fallback, ...fallbackConfig, level, levelName: `L${getLevelIndex(level) + 1}` };
    });

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async saveLevelRule(ruleData: any, operatorId: string): Promise<any> {
    const fields = ['minMonthlyAmount', 'minMonthlyOrders', 'minActiveDays', 'minReputationScore'];
    for (const f of fields) {
      const v = Number(ruleData[f] ?? 0);
      if (isNaN(v) || v < 0) {
        throw new AppError(`${f}参数异常，必须为非负数`, BusinessCode.PARAM_ERROR);
      }
    }

    const currentIdx = getLevelIndex(ruleData.level);
    if (currentIdx > 0) {
      const prevLevel = LEVEL_ORDER[currentIdx - 1];
      const prevRule = await this.getEffectiveRule(prevLevel);
      const checkPairs: [string, string][] = [
        ['minMonthlyAmount', 'minMonthlyAmount'],
        ['minMonthlyOrders', 'minMonthlyOrders'],
        ['minActiveDays', 'minActiveDays'],
        ['minReputationScore', 'minReputationScore'],
      ];
      for (const [cur, prev] of checkPairs) {
        if (Number(ruleData[cur]) < Number((prevRule as any)[prev] || 0)) {
          throw new AppError(
            `${cur}阈值(${ruleData[cur]})不能低于上一级${prevLevel}的阈值(${(prevRule as any)[prev]})`,
            BusinessCode.PARAM_ERROR
          );
        }
      }
    }

    if (ruleData.commissionRate !== undefined) {
      const rate = Number(ruleData.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        throw new AppError('佣金比例必须在0到1之间', BusinessCode.PARAM_ERROR);
      }
    }

    ruleData.updatedBy = operatorId;
    let result;
    const existing = await promoterLevelRuleDao.findByLevel(ruleData.level);
    if (existing) {
      await promoterLevelRuleDao.update((existing as any).id, ruleData);
      result = await promoterLevelRuleDao.findByLevel(ruleData.level);
    } else {
      ruleData.createdBy = operatorId;
      result = await promoterLevelRuleDao.create(ruleData);
    }

    await CacheUtils.delPattern('level:rule:*');
    await CacheUtils.delPattern('level:rules:*');

    return result;
  }

  public async batchReEvaluateAllLevels(operatorId: string): Promise<BatchLevelResult> {
    const allPromoters = await promoterDao.findAll({
      where: { deletedAt: null },
    } as any);

    const details: AutoLevelResult[] = [];
    let regraded = 0;
    let skipped = 0;
    let failed = 0;

    for (const promoter of allPromoters) {
      try {
        if ((promoter as any).isCorePromoter) {
          skipped++;
          details.push({
            promoterId: promoter.id,
            name: promoter.name,
            code: (promoter as any).code,
            originalLevel: promoter.level,
            newLevel: promoter.level,
            changed: false,
            metrics: parsePromoterMetrics(promoter),
            reason: '顶级核心推客，禁止批量修改',
          });
          continue;
        }

        const result = await this.autoEvaluateSingleLevel(promoter, operatorId, LevelChangeSource.RULE_CHANGE);
        details.push(result);
        if (result.changed) regraded++;
        else skipped++;
      } catch (err: any) {
        failed++;
        details.push({
          promoterId: promoter.id,
          name: promoter.name,
          code: (promoter as any).code,
          originalLevel: promoter.level,
          newLevel: promoter.level,
          changed: false,
          metrics: {},
          reason: err.message,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);

    return {
      total: allPromoters.length,
      regraded,
      skipped,
      failed,
      details,
    };
  }

  public async autoEvaluateSingleLevel(
    promoter: any,
    operatorId: string,
    changeSource: LevelChangeSource = LevelChangeSource.AUTO
  ): Promise<AutoLevelResult> {
    const metrics = parsePromoterMetrics(promoter);
    const originalLevel = promoter.level as PromoterLevel;

    let highestValidLevel = PromoterLevel.L1;
    for (const level of LEVEL_ORDER) {
      const validation = await this.validateThresholds(level, metrics);
      if (validation.valid) {
        highestValidLevel = level as PromoterLevel;
      } else {
        break;
      }
    }

    if (highestValidLevel === originalLevel) {
      return {
        promoterId: promoter.id,
        name: promoter.name,
        code: (promoter as any).code,
        originalLevel,
        newLevel: originalLevel,
        changed: false,
        metrics,
      };
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const compliance = await this.checkLevelChangeCompliance(
      promoter,
      originalLevel,
      highestValidLevel,
      metrics,
      changeSource
    );

    const levelChangedCount = Number((promoter as any).levelChangedCount || 0) + 1;

    await promoterDao.update(
      {
        level: highestValidLevel as any,
        levelChangedCount,
        lastLevelChangedAt: new Date(),
      } as any,
      { where: { id: promoter.id } }
    );

    await promoterLevelChangeLogDao.create({
      promoterId: promoter.id,
      changeSource,
      fromLevel: originalLevel,
      toLevel: highestValidLevel,
      operatorId,
      operatorName,
      metricsAtChange: JSON.stringify(metrics),
      meetsThreshold: true,
      changeReason: compliance.anomalyFlagged
        ? `[自动评级]${compliance.issues.join('；')}`
        : '自动评级：根据业绩/订单/活跃/信誉综合判定',
      complianceCheck: JSON.stringify(compliance),
      anomalyFlagged: compliance.anomalyFlagged,
      anomalyReason: compliance.anomalyReason,
      iterationCount: levelChangedCount,
    } as any);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoter.id}`);

    return {
      promoterId: promoter.id,
      name: promoter.name,
      code: (promoter as any).code,
      originalLevel,
      newLevel: highestValidLevel,
      changed: true,
      metrics,
    };
  }

  public async requestManualAdjust(
    promoterId: string,
    applicantId: string,
    targetLevel: PromoterLevel,
    adjustReason?: string
  ): Promise<any> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const currentLevel = promoter.level as PromoterLevel;
    const targetIdx = getLevelIndex(targetLevel);
    const currentIdx = getLevelIndex(currentLevel);

    const metrics = parsePromoterMetrics(promoter);
    const thresholdCheck = await this.validateThresholds(targetLevel, metrics);
    const isUpgrade = targetIdx > currentIdx;
    const meetsThreshold = thresholdCheck.valid;

    if (isUpgrade && meetsThreshold) {
      const applicant = await userDao.findById(applicantId);
      const result = await this.autoEvaluateSingleLevel(promoter, applicantId, LevelChangeSource.MANUAL);

      await promoterLevelAdjustRequestDao.create({
        promoterId,
        applicantId,
        applicantName: (applicant as any)?.nickname || applicant?.username || '-',
        fromLevel: currentLevel,
        toLevel: targetLevel,
        adjustReason: adjustReason || '(业绩达标，直接升级)',
        metricsSnapshot: JSON.stringify(metrics),
        meetsThreshold: true,
        approveStatus: ManualLevelAdjustStatus.APPROVED,
        approverId: applicantId,
        approverName: '系统自动通过(业绩达标)',
        approvedAt: new Date(),
        syncedToFrontend: true,
      } as any);

      return { autoApproved: true, result };
    }

    if (!adjustReason || adjustReason.trim().length < 5) {
      throw new AppError('未达标调整必须填写特殊调整理由(至少5个字)', BusinessCode.PARAM_ERROR);
    }

    const applicant = await userDao.findById(applicantId);
    const request = await promoterLevelAdjustRequestDao.create({
      promoterId,
      applicantId,
      applicantName: (applicant as any)?.nickname || applicant?.username || '-',
      fromLevel: currentLevel,
      toLevel: targetLevel,
      adjustReason: adjustReason.trim(),
      metricsSnapshot: JSON.stringify(metrics),
      meetsThreshold: false,
      approveStatus: ManualLevelAdjustStatus.PENDING,
    } as any);

    return { autoApproved: false, requestId: (request as any).id, needsApproval: true };
  }

  public async reviewManualAdjust(
    requestId: string,
    approverId: string,
    approved: boolean,
    approveRemark?: string
  ): Promise<void> {
    const request = await promoterLevelAdjustRequestDao.findByPk(requestId);
    if (!request) {
      throw new AppError('调整申请不存在', BusinessCode.NOT_FOUND);
    }
    const req = request as any;
    if (req.approveStatus !== ManualLevelAdjustStatus.PENDING) {
      throw new AppError('该申请已处理，不可重复审核', BusinessCode.ERROR);
    }

    const approver = await userDao.findById(approverId);
    const approverLevel = Number((approver as any)?.accountLevel || AccountLevel.OPERATOR);
    if (approverLevel >= AccountLevel.OPERATOR && approverLevel < AccountLevel.MANAGER) {
      throw new AppError('仅主管及以上角色可审核手动调整申请', BusinessCode.FORBIDDEN);
    }
    const approverName = (approver as any)?.nickname || approver?.username || '-';

    if (approved) {
      const promoter = await promoterDao.findById(req.promoterId);
      if (!promoter) {
        throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
      }

      const metrics = parsePromoterMetrics(promoter);
      const compliance = await this.checkLevelChangeCompliance(
        promoter,
        req.fromLevel,
        req.toLevel,
        metrics,
        LevelChangeSource.MANUAL
      );

      const levelChangedCount = Number((promoter as any).levelChangedCount || 0) + 1;

      await promoterDao.update(
        {
          level: req.toLevel as any,
          levelChangedCount,
          lastLevelChangedAt: new Date(),
        } as any,
        { where: { id: req.promoterId } }
      );

      await promoterLevelChangeLogDao.create({
        promoterId: req.promoterId,
        changeSource: LevelChangeSource.MANUAL,
        fromLevel: req.fromLevel,
        toLevel: req.toLevel,
        operatorId: approverId,
        operatorName: approverName,
        metricsAtChange: JSON.stringify(metrics),
        meetsThreshold: false,
        adjustRequestId: req.id,
        changeReason: approveRemark || req.adjustReason || '手动调整审核通过',
        complianceCheck: JSON.stringify(compliance),
        anomalyFlagged: compliance.anomalyFlagged,
        anomalyReason: compliance.anomalyReason,
        iterationCount: levelChangedCount,
      } as any);

      await promoterLevelAdjustRequestDao.update(req.id, {
        approveStatus: ManualLevelAdjustStatus.APPROVED as any,
        approverId,
        approverName,
        approveRemark,
        approvedAt: new Date(),
        syncedToFrontend: true,
      } as any);

      await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${req.promoterId}`);
    } else {
      await promoterLevelAdjustRequestDao.update(req.id, {
        approveStatus: ManualLevelAdjustStatus.REJECTED as any,
        approverId,
        approverName,
        approveRemark,
      } as any);
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async batchResetLevels(
    ids: string[],
    operatorId: string,
    resetTo: PromoterLevel = PromoterLevel.L1
  ): Promise<BatchLevelResult> {
    const details: AutoLevelResult[] = [];
    let regraded = 0;
    let skipped = 0;
    let failed = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          skipped++;
          details.push({ promoterId: id, name: '-', code: '-', originalLevel: '-', newLevel: '-', changed: false, metrics: {}, reason: '推客不存在' });
          continue;
        }
        if ((promoter as any).isCorePromoter || promoter.level === TOP_CORE_LEVEL) {
          skipped++;
          details.push({
            promoterId: id,
            name: promoter.name,
            code: (promoter as any).code,
            originalLevel: promoter.level,
            newLevel: promoter.level,
            changed: false,
            metrics: {},
            reason: '顶级核心推客禁止批量重置',
          });
          continue;
        }
        if (CORE_LEVELS.includes(promoter.level as PromoterLevel)) {
          skipped++;
          details.push({
            promoterId: id,
            name: promoter.name,
            code: (promoter as any).code,
            originalLevel: promoter.level,
            newLevel: promoter.level,
            changed: false,
            metrics: {},
            reason: 'L4及以上推客禁止批量重置，请单独操作',
          });
          continue;
        }
        if (promoter.level === resetTo) {
          skipped++;
          details.push({
            promoterId: id,
            name: promoter.name,
            code: (promoter as any).code,
            originalLevel: promoter.level,
            newLevel: promoter.level,
            changed: false,
            metrics: {},
            reason: '等级未变化',
          });
          continue;
        }

        const metrics = parsePromoterMetrics(promoter);
        const compliance = await this.checkLevelChangeCompliance(promoter, promoter.level, resetTo, metrics, LevelChangeSource.BATCH);
        const levelChangedCount = Number((promoter as any).levelChangedCount || 0) + 1;

        await promoterDao.update(
          { level: resetTo as any, levelChangedCount, lastLevelChangedAt: new Date() } as any,
          { where: { id } }
        );

        await promoterLevelChangeLogDao.create({
          promoterId: id,
          changeSource: LevelChangeSource.BATCH,
          fromLevel: promoter.level,
          toLevel: resetTo,
          operatorId,
          operatorName,
          metricsAtChange: JSON.stringify(metrics),
          meetsThreshold: resetTo === PromoterLevel.L1,
          changeReason: '批量重置等级',
          complianceCheck: JSON.stringify(compliance),
          anomalyFlagged: compliance.anomalyFlagged,
          anomalyReason: compliance.anomalyReason,
          iterationCount: levelChangedCount,
        } as any);

        regraded++;
        details.push({
          promoterId: id,
          name: promoter.name,
          code: (promoter as any).code,
          originalLevel: promoter.level,
          newLevel: resetTo,
          changed: true,
          metrics,
        });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          promoterId: id,
          name: promoter?.name || '-',
          code: (promoter as any)?.code || '-',
          originalLevel: promoter?.level || '-',
          newLevel: promoter?.level || '-',
          changed: false,
          metrics: {},
          reason: err.message,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return { total: ids.length, regraded, skipped, failed, details };
  }

  public async checkLevelChangeCompliance(
    promoter: any,
    fromLevel: string,
    toLevel: string,
    metrics: any,
    changeSource: LevelChangeSource
  ): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    let anomalyFlagged = false;
    let anomalyReason: string | undefined;

    const fromIdx = getLevelIndex(fromLevel);
    const toIdx = getLevelIndex(toLevel);
    const diff = Math.abs(toIdx - fromIdx);

    if (diff > MAX_DOWNGRADE_LEVELS && changeSource === LevelChangeSource.AUTO) {
      anomalyFlagged = true;
      anomalyReason = `自动评级跨度过大(${fromLevel}→${toLevel})，疑似数据异常`;
      issues.push(anomalyReason);
    }

    if (changeSource === LevelChangeSource.AUTO) {
      const validation = await this.validateThresholds(toLevel, metrics);
      if (!validation.valid) {
        anomalyFlagged = true;
        const msgs = validation.failingFields.map(f => `${f.label}差${f.gap}`).join('；');
        anomalyReason = `升级但未达标：${msgs}`;
        issues.push(anomalyReason);
      }
    }

    if (diff === 0) {
      issues.push('等级未变化');
    }

    if ((promoter as any).riskFlagged && toIdx > fromIdx) {
      anomalyFlagged = true;
      anomalyReason = '存在风险标记的推客异常升级';
      issues.push(anomalyReason);
    }

    if (metrics.reputationScore < 60 && toIdx > fromIdx) {
      anomalyFlagged = true;
      anomalyReason = `信誉分${metrics.reputationScore}过低，禁止升级`;
      issues.push(anomalyReason);
    }

    return {
      compliant: !anomalyFlagged,
      issues,
      anomalyFlagged,
      anomalyReason,
    };
  }

  public async getChangeLogs(
    promoterId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await promoterLevelChangeLogDao.findAllPaged(
      { promoterId, page, pageSize } as any
    );

    return {
      list: rows.map((r: any) => ({
        ...r.get({ plain: true }),
        changeSourceLabel: LEVEL_CHANGE_SOURCE_LABELS[(r as any).changeSource as LevelChangeSource] || (r as any).changeSource,
      })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getIterationStatistics(params: { startDate?: string; endDate?: string }) {
    const cacheKey = `level:iteration:stats:${params.startDate || ''}:${params.endDate || ''}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const allLogs = await promoterLevelChangeLogDao.getIterationStats(params as any);
    const promoters = await promoterDao.findAll({
      where: { deletedAt: null },
      attributes: ['id', 'level', 'levelChangedCount', 'lastLevelChangedAt'],
    } as any);

    const distribution: Record<string, number> = {};
    LEVEL_ORDER.forEach(l => { distribution[l] = 0; });
    promoters.forEach((p: any) => { distribution[p.level] = (distribution[p.level] || 0) + 1; });

    const totalChanges = promoters.reduce((sum: number, p: any) => sum + Number(p.levelChangedCount || 0), 0);
    const maxIterationPromoter = promoters.reduce((max: any, p: any) =>
      (!max || Number(p.levelChangedCount || 0) > Number(max.levelChangedCount || 0)) ? p : max, null);

    const result = {
      distribution,
      totalChangeEvents: (allLogs as any)?.total || 0,
      totalChanges,
      avgIterationsPerPromoter: promoters.length > 0 ? +(totalChanges / promoters.length).toFixed(2) : 0,
      maxIterationPromoter: maxIterationPromoter
        ? { id: maxIterationPromoter.id, count: Number(maxIterationPromoter.levelChangedCount || 0) }
        : null,
      anomaliesCount: (allLogs as any)?.anomalies || 0,
      totalPromoters: promoters.length,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getAdjustRequests(params: any): Promise<PaginationResult<any>> {
    const { page = 1, pageSize = 20, promoterId, approveStatus, applicantId } = params;
    const { rows, count } = await promoterLevelAdjustRequestDao.findAllPaged(
      { page, pageSize, promoterId, approveStatus, applicantId } as any
    );
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }
}

export default new PromoterLevelService();
