import { channelDao, channelGradeRuleDao, channelGradeAdjustRequestDao, channelGradeChangeLogDao, userDao } from '../dao';
/* [渠道分级管控 - 独立提交标识] */
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { ChannelLevel, CHANNEL_LEVEL_CONFIGS, CHANNEL_LEVEL_ORDER, ChannelLevelChangeSource, CHANNEL_LEVEL_CHANGE_SOURCE_LABELS, ChannelLevelAdjustStatus, AccountLevel } from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

const LEVEL_ORDER = CHANNEL_LEVEL_ORDER;
const TOP_LEVEL = ChannelLevel.DIAMOND;
const PREMIUM_LEVELS = [ChannelLevel.PLATINUM, ChannelLevel.DIAMOND];
const MAX_DOWNGRADE_LEVELS = 2;

function parseChannelMetrics(channel: any) {
  return {
    monthlyAmount: Number(channel.monthlyAmount || 0),
    monthlyOrders: Number(channel.monthlyOrders || 0),
    cooperationMonths: Number(channel.cooperationMonths || 0),
    fulfillmentRate: Number(channel.fulfillmentRate ?? 0),
    promotionScore: Number(channel.promotionScore ?? 0),
  };
}

function getLevelIndex(level: string): number {
  return LEVEL_ORDER.indexOf(level as ChannelLevel);
}

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

interface AutoGradeResult {
  channelId: string;
  name: string;
  code: string;
  originalLevel: string;
  newLevel: string;
  changed: boolean;
  metrics: any;
  reason?: string;
}

interface BatchGradeResult {
  total: number;
  regraded: number;
  skipped: number;
  failed: number;
  details: AutoGradeResult[];
}

interface ComplianceCheckResult {
  compliant: boolean;
  issues: string[];
  anomalyFlagged: boolean;
  anomalyReason?: string;
}

interface RuleValidationResult {
  valid: boolean;
  conflicts: { field: string; message: string }[];
}

class ChannelGradeService {
  public validateRuleParams(ruleData: any): RuleValidationResult {
    const conflicts: RuleValidationResult['conflicts'] = [];
    const currentIdx = getLevelIndex(ruleData.level);

    if (currentIdx > 0) {
      const prevLevel = LEVEL_ORDER[currentIdx - 1];
      const prevConfig = CHANNEL_LEVEL_CONFIGS.find(c => c.level === prevLevel);
      if (prevConfig) {
        const thresholdFields = ['minMonthlyAmount', 'minMonthlyOrders', 'minCooperationMonths', 'minFulfillmentRate', 'minPromotionScore'];
        for (const field of thresholdFields) {
          const currentVal = Number(ruleData[field] ?? 0);
          const prevVal = Number((prevConfig.threshold as any)[field] ?? 0);
          if (currentVal < prevVal) {
            conflicts.push({
              field,
              message: `${field}阈值(${currentVal})不能低于上一级${prevLevel}的阈值(${prevVal})`,
            });
          }
        }
      }
    }

    if (ruleData.commissionRateBonus !== undefined) {
      const val = Number(ruleData.commissionRateBonus);
      if (isNaN(val) || val < 0 || val > 1) {
        conflicts.push({
          field: 'commissionRateBonus',
          message: '佣金加成比例必须在0到1之间',
        });
      }
    }

    if (ruleData.resourceSupportLevel !== undefined) {
      const val = Number(ruleData.resourceSupportLevel);
      if (isNaN(val) || val < 1 || val > 6) {
        conflicts.push({
          field: 'resourceSupportLevel',
          message: '资源支持等级必须在1到6之间',
        });
      }
    }

    return { valid: conflicts.length === 0, conflicts };
  }

  public async validateThresholds(level: string, metrics: any): Promise<ThresholdValidation> {
    const rule = await this.getEffectiveRule(level);
    if (!rule) {
      throw new AppError('等级规则未配置', BusinessCode.NOT_FOUND);
    }

    const failingFields: ThresholdValidation['failingFields'] = [];
    const fields: { key: string; label: string; value: number; threshold: number }[] = [
      { key: 'minMonthlyAmount', label: '渠道体量', value: metrics.monthlyAmount, threshold: Number(rule.minMonthlyAmount || 0) },
      { key: 'minMonthlyOrders', label: '订单量', value: metrics.monthlyOrders, threshold: Number(rule.minMonthlyOrders || 0) },
      { key: 'minCooperationMonths', label: '合作时长', value: metrics.cooperationMonths, threshold: Number(rule.minCooperationMonths || 0) },
      { key: 'minFulfillmentRate', label: '履约质量', value: metrics.fulfillmentRate, threshold: Number(rule.minFulfillmentRate || 0) },
      { key: 'minPromotionScore', label: '推广能力', value: metrics.promotionScore, threshold: Number(rule.minPromotionScore || 0) },
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
    const cacheKey = `channel:grade:rule:${level}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    let rule = await channelGradeRuleDao.findByLevel(level as ChannelLevel);
    if (!rule) {
      const fallbackConfig = CHANNEL_LEVEL_CONFIGS.find(c => c.level === level);
      rule = { ...fallbackConfig?.threshold, ...fallbackConfig?.benefits, level, levelName: fallbackConfig ? CHANNEL_LEVEL_CONFIGS.indexOf(fallbackConfig) + 1 + '' : '-' } as any;
    }

    await CacheUtils.set(cacheKey, rule, CacheTTL.MEDIUM);
    return rule;
  }

  public async getAllEffectiveRules() {
    const cacheKey = 'channel:grade:rules:all';
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const activeRules = await channelGradeRuleDao.findAllActive();
    const result = LEVEL_ORDER.map(level => {
      const rule = activeRules.find(r => (r as any).level === level);
      if (rule) return rule;
      const fallbackConfig = CHANNEL_LEVEL_CONFIGS.find(c => c.level === level);
      return { ...fallbackConfig?.threshold, ...fallbackConfig?.benefits, level };
    });

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async saveLevelRule(ruleData: any, operatorId: string): Promise<any> {
    const validation = this.validateRuleParams(ruleData);
    if (!validation.valid) {
      throw new AppError(validation.conflicts[0].message, BusinessCode.PARAM_ERROR);
    }

    if (ruleData.commissionRateBonus !== undefined) {
      const rate = Number(ruleData.commissionRateBonus);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        throw new AppError('佣金加成比例必须在0到1之间', BusinessCode.PARAM_ERROR);
      }
    }

    ruleData.updatedBy = operatorId;
    let result;
    const existing = await channelGradeRuleDao.findByLevel(ruleData.level);
    if (existing) {
      await channelGradeRuleDao.update((existing as any).id, ruleData);
      result = await channelGradeRuleDao.findByLevel(ruleData.level);
    } else {
      ruleData.createdBy = operatorId;
      result = await channelGradeRuleDao.create(ruleData);
    }

    await CacheUtils.delPattern('channel:grade:rule:*');
    await CacheUtils.delPattern('channel:grade:rules:*');

    return result;
  }

  public async autoEvaluateChannel(
    channel: any,
    operatorId: string,
    changeSource: ChannelLevelChangeSource = ChannelLevelChangeSource.AUTO_EVALUATE
  ): Promise<AutoGradeResult> {
    const metrics = parseChannelMetrics(channel);
    const originalLevel = channel.level as ChannelLevel;

    let highestValidLevel = ChannelLevel.STAR;
    for (const level of LEVEL_ORDER) {
      const validation = await this.validateThresholds(level, metrics);
      if (validation.valid) {
        highestValidLevel = level as ChannelLevel;
      } else {
        break;
      }
    }

    if (highestValidLevel === originalLevel) {
      return {
        channelId: channel.id,
        name: channel.name,
        code: channel.code,
        originalLevel,
        newLevel: originalLevel,
        changed: false,
        metrics,
      };
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const compliance = await this.checkGradeChangeCompliance(
      channel,
      originalLevel,
      highestValidLevel,
      metrics,
      changeSource
    );

    const newLevelConfig = CHANNEL_LEVEL_CONFIGS.find(c => c.level === highestValidLevel);
    const baseRate = Number(channel.commissionRate || 0);
    const bonusRate = Number(newLevelConfig?.benefits?.commissionRateBonus || 0);
    const effectiveRate = baseRate + bonusRate;
    const resourceLevel = newLevelConfig?.benefits?.resourceSupportLevel ?? 1;

    await channelDao.update(
      {
        level: highestValidLevel as any,
        commissionRate: effectiveRate,
        resourceSupportLevel: resourceLevel,
        levelUpdatedAt: new Date(),
      } as any,
      { where: { id: channel.id } }
    );

    await channelGradeChangeLogDao.create({
      channelId: channel.id,
      changeSource,
      fromLevel: originalLevel,
      toLevel: highestValidLevel,
      operatorId,
      operatorName,
      metricsAtChange: JSON.stringify(metrics),
      meetsThreshold: true,
      changeReason: compliance.anomalyFlagged
        ? `[自动评级]${compliance.issues.join('；')}`
        : '自动评级：根据体量/订单/合作/履约/推广综合判定',
      complianceCheck: JSON.stringify(compliance),
      anomalyFlagged: compliance.anomalyFlagged,
      anomalyReason: compliance.anomalyReason,
    } as any);

    await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${channel.id}`);

    return {
      channelId: channel.id,
      name: channel.name,
      code: channel.code,
      originalLevel,
      newLevel: highestValidLevel,
      changed: true,
      metrics,
    };
  }

  public async requestManualAdjust(
    channelId: string,
    applicantId: string,
    targetLevel: ChannelLevel,
    adjustReason?: string
  ): Promise<any> {
    const channel = await channelDao.findById(channelId);
    if (!channel) {
      throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
    }

    const currentLevel = (channel as any).level as ChannelLevel;
    const targetIdx = getLevelIndex(targetLevel);
    const currentIdx = getLevelIndex(currentLevel);

    const metrics = parseChannelMetrics(channel);
    const thresholdCheck = await this.validateThresholds(targetLevel, metrics);
    const isUpgrade = targetIdx > currentIdx;
    const meetsThreshold = thresholdCheck.valid;

    if (isUpgrade && meetsThreshold) {
      const applicant = await userDao.findById(applicantId);
      const result = await this.autoEvaluateChannel(channel, applicantId, ChannelLevelChangeSource.MANUAL_ADJUST);

      await channelGradeAdjustRequestDao.create({
        channelId,
        applicantId,
        applicantName: (applicant as any)?.nickname || applicant?.username || '-',
        fromLevel: currentLevel,
        toLevel: targetLevel,
        adjustReason: adjustReason || '(业绩达标，直接升级)',
        metricsSnapshot: JSON.stringify(metrics),
        meetsThreshold: true,
        approveStatus: ChannelLevelAdjustStatus.APPROVED,
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
    const request = await channelGradeAdjustRequestDao.create({
      channelId,
      applicantId,
      applicantName: (applicant as any)?.nickname || applicant?.username || '-',
      fromLevel: currentLevel,
      toLevel: targetLevel,
      adjustReason: adjustReason.trim(),
      metricsSnapshot: JSON.stringify(metrics),
      meetsThreshold: false,
      approveStatus: ChannelLevelAdjustStatus.PENDING,
    } as any);

    return { autoApproved: false, requestId: (request as any).id, needsApproval: true };
  }

  public async reviewManualAdjust(
    requestId: string,
    approverId: string,
    approved: boolean,
    approveRemark?: string
  ): Promise<void> {
    const request = await channelGradeAdjustRequestDao.findByPk(requestId);
    if (!request) {
      throw new AppError('调整申请不存在', BusinessCode.NOT_FOUND);
    }
    const req = request as any;
    if (req.approveStatus !== ChannelLevelAdjustStatus.PENDING) {
      throw new AppError('该申请已处理，不可重复审核', BusinessCode.ERROR);
    }

    const approver = await userDao.findById(approverId);
    const approverLevel = Number((approver as any)?.accountLevel || AccountLevel.OPERATOR);
    if (approverLevel < AccountLevel.MANAGER) {
      throw new AppError('仅主管及以上角色可审核手动调整申请', BusinessCode.FORBIDDEN);
    }
    const approverName = (approver as any)?.nickname || approver?.username || '-';

    if (approved) {
      const channel = await channelDao.findById(req.channelId);
      if (!channel) {
        throw new AppError('渠道不存在', BusinessCode.NOT_FOUND);
      }

      const metrics = parseChannelMetrics(channel);
      const compliance = await this.checkGradeChangeCompliance(
        channel,
        req.fromLevel,
        req.toLevel,
        metrics,
        ChannelLevelChangeSource.MANUAL_ADJUST
      );

      const newLevelConfig = CHANNEL_LEVEL_CONFIGS.find(c => c.level === req.toLevel);
      const baseRate = Number((channel as any).commissionRate || 0);
      const bonusRate = Number(newLevelConfig?.benefits?.commissionRateBonus || 0);
      const effectiveRate = baseRate + bonusRate;
      const resourceLevel = newLevelConfig?.benefits?.resourceSupportLevel ?? 1;

      await channelDao.update(
        {
          level: req.toLevel as any,
          commissionRate: effectiveRate,
          resourceSupportLevel: resourceLevel,
          levelUpdatedAt: new Date(),
        } as any,
        { where: { id: req.channelId } }
      );

      await channelGradeChangeLogDao.create({
        channelId: req.channelId,
        changeSource: ChannelLevelChangeSource.MANUAL_ADJUST,
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
      } as any);

      await channelGradeAdjustRequestDao.update(req.id, {
        approveStatus: ChannelLevelAdjustStatus.APPROVED as any,
        approverId,
        approverName,
        approveRemark,
        approvedAt: new Date(),
        syncedToFrontend: true,
      } as any);

      await CacheUtils.del(`${CacheKey.CHANNEL_DETAIL}${req.channelId}`);
    } else {
      await channelGradeAdjustRequestDao.update(req.id, {
        approveStatus: ChannelLevelAdjustStatus.REJECTED as any,
        approverId,
        approverName,
        approveRemark,
      } as any);
    }

    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }

  public async batchAdjustLevels(
    ids: string[],
    targetLevel: ChannelLevel,
    operatorId: string
  ): Promise<BatchGradeResult> {
    const details: AutoGradeResult[] = [];
    let regraded = 0;
    let skipped = 0;
    let failed = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    for (const id of ids) {
      try {
        const channel = await channelDao.findById(id);
        if (!channel) {
          skipped++;
          details.push({ channelId: id, name: '-', code: '-', originalLevel: '-', newLevel: '-', changed: false, metrics: {}, reason: '渠道不存在' });
          continue;
        }

        const currentLevel = (channel as any).level as ChannelLevel;
        if (PREMIUM_LEVELS.includes(currentLevel)) {
          skipped++;
          details.push({
            channelId: id,
            name: channel.name,
            code: channel.code,
            originalLevel: currentLevel,
            newLevel: currentLevel,
            changed: false,
            metrics: {},
            reason: '铂金/钻石渠道禁止批量调整，请单独操作',
          });
          continue;
        }

        if (currentLevel === targetLevel) {
          skipped++;
          details.push({
            channelId: id,
            name: channel.name,
            code: channel.code,
            originalLevel: currentLevel,
            newLevel: currentLevel,
            changed: false,
            metrics: {},
            reason: '等级未变化',
          });
          continue;
        }

        const metrics = parseChannelMetrics(channel);
        const currentIdx = getLevelIndex(currentLevel);
        const targetIdx = getLevelIndex(targetLevel);
        const isDowngrade = targetIdx < currentIdx;

        if (isDowngrade) {
          const currentThreshold = await this.validateThresholds(currentLevel, metrics);
          if (currentThreshold.valid) {
            skipped++;
            details.push({
              channelId: id,
              name: channel.name,
              code: channel.code,
              originalLevel: currentLevel,
              newLevel: currentLevel,
              changed: false,
              metrics: {},
              reason: '当前业绩达标，不允许降级',
            });
            continue;
          }
        } else {
          const targetThreshold = await this.validateThresholds(targetLevel, metrics);
          if (!targetThreshold.valid) {
            skipped++;
            details.push({
              channelId: id,
              name: channel.name,
              code: channel.code,
              originalLevel: currentLevel,
              newLevel: currentLevel,
              changed: false,
              metrics: {},
              reason: '目标等级业绩未达标，不允许升级',
            });
            continue;
          }
        }

        const compliance = await this.checkGradeChangeCompliance(channel, currentLevel, targetLevel, metrics, ChannelLevelChangeSource.BATCH_ADJUST);

        await channelDao.update(
          { level: targetLevel as any, levelUpdatedAt: new Date() } as any,
          { where: { id } }
        );

        await channelGradeChangeLogDao.create({
          channelId: id,
          changeSource: ChannelLevelChangeSource.BATCH_ADJUST,
          fromLevel: currentLevel,
          toLevel: targetLevel,
          operatorId,
          operatorName,
          metricsAtChange: JSON.stringify(metrics),
          meetsThreshold: !isDowngrade,
          changeReason: '批量调整渠道等级',
          complianceCheck: JSON.stringify(compliance),
          anomalyFlagged: compliance.anomalyFlagged,
          anomalyReason: compliance.anomalyReason,
        } as any);

        regraded++;
        details.push({
          channelId: id,
          name: channel.name,
          code: channel.code,
          originalLevel: currentLevel,
          newLevel: targetLevel,
          changed: true,
          metrics,
        });
      } catch (err: any) {
        failed++;
        const channel = await channelDao.findById(id);
        details.push({
          channelId: id,
          name: channel?.name || '-',
          code: (channel as any)?.code || '-',
          originalLevel: (channel as any)?.level || '-',
          newLevel: (channel as any)?.level || '-',
          changed: false,
          metrics: {},
          reason: err.message,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
    return { total: ids.length, regraded, skipped, failed, details };
  }

  public async batchAdjustResources(
    ids: string[],
    resourceLevel: number,
    operatorId: string
  ): Promise<BatchGradeResult> {
    const details: AutoGradeResult[] = [];
    let regraded = 0;
    let skipped = 0;
    let failed = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    for (const id of ids) {
      try {
        const channel = await channelDao.findById(id);
        if (!channel) {
          skipped++;
          details.push({ channelId: id, name: '-', code: '-', originalLevel: '-', newLevel: '-', changed: false, metrics: {}, reason: '渠道不存在' });
          continue;
        }

        await channelDao.update(
          { resourceSupportLevel: resourceLevel } as any,
          { where: { id } }
        );

        await channelGradeChangeLogDao.create({
          channelId: id,
          changeSource: ChannelLevelChangeSource.BATCH_ADJUST,
          fromLevel: (channel as any).level,
          toLevel: (channel as any).level,
          operatorId,
          operatorName,
          metricsAtChange: JSON.stringify(parseChannelMetrics(channel)),
          meetsThreshold: true,
          changeReason: `批量调整资源支持等级为${resourceLevel}`,
        } as any);

        regraded++;
        details.push({
          channelId: id,
          name: channel.name,
          code: channel.code,
          originalLevel: (channel as any).level,
          newLevel: (channel as any).level,
          changed: true,
          metrics: { resourceLevel },
        });
      } catch (err: any) {
        failed++;
        const channel = await channelDao.findById(id);
        details.push({
          channelId: id,
          name: channel?.name || '-',
          code: (channel as any)?.code || '-',
          originalLevel: (channel as any)?.level || '-',
          newLevel: (channel as any)?.level || '-',
          changed: false,
          metrics: {},
          reason: err.message,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
    return { total: ids.length, regraded, skipped, failed, details };
  }

  public async checkGradeChangeCompliance(
    channel: any,
    fromLevel: string,
    toLevel: string,
    metrics: any,
    changeSource: ChannelLevelChangeSource
  ): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    let anomalyFlagged = false;
    let anomalyReason: string | undefined;

    const fromIdx = getLevelIndex(fromLevel);
    const toIdx = getLevelIndex(toLevel);
    const diff = Math.abs(toIdx - fromIdx);

    if (diff > MAX_DOWNGRADE_LEVELS && changeSource === ChannelLevelChangeSource.AUTO_EVALUATE) {
      anomalyFlagged = true;
      anomalyReason = `自动评级跨度过大(${fromLevel}→${toLevel})，疑似数据异常`;
      issues.push(anomalyReason);
    }

    if (toIdx > fromIdx) {
      const validation = await this.validateThresholds(toLevel, metrics);
      if (!validation.valid && changeSource === ChannelLevelChangeSource.AUTO_EVALUATE) {
        anomalyFlagged = true;
        const msgs = validation.failingFields.map(f => `${f.label}差${f.gap}`).join('；');
        anomalyReason = `升级但未达标：${msgs}`;
        issues.push(anomalyReason);
      }
    }

    if ((channel as any).riskFlagged && toIdx > fromIdx) {
      anomalyFlagged = true;
      anomalyReason = '存在风险标记的渠道异常升级';
      issues.push(anomalyReason);
    }

    if (metrics.fulfillmentRate < 60 && toIdx > fromIdx) {
      anomalyFlagged = true;
      anomalyReason = `履约率${metrics.fulfillmentRate}%过低，禁止升级`;
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
    channelId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await channelGradeChangeLogDao.findAllPaged(
      { channelId, page, pageSize } as any
    );

    return {
      list: rows.map((r: any) => ({
        ...r.get({ plain: true }),
        changeSourceLabel: CHANNEL_LEVEL_CHANGE_SOURCE_LABELS[(r as any).changeSource as ChannelLevelChangeSource] || (r as any).changeSource,
      })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getAdjustRequests(params: any): Promise<PaginationResult<any>> {
    const { page = 1, pageSize = 20, channelId, approveStatus, applicantId } = params;
    const { rows, count } = await channelGradeAdjustRequestDao.findAllPaged(
      { page, pageSize, channelId, approveStatus, applicantId } as any
    );
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getStatistics() {
    const cacheKey = 'channel:grade:statistics';
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const allChannels = await channelDao.findAll({
      where: { deletedAt: null } as any,
    } as any);

    const distribution: Record<string, number> = {};
    LEVEL_ORDER.forEach(l => { distribution[l] = 0; });
    allChannels.forEach((c: any) => { distribution[c.level] = (distribution[c.level] || 0) + 1; });

    const allLogs = await channelGradeChangeLogDao.findAll({} as any);
    const anomaliesCount = (allLogs as any[]).filter((l: any) => l.anomalyFlagged).length;
    const totalChangeEvents = (allLogs as any[]).length;
    const avgIterations = allChannels.length > 0
      ? +((allLogs as any[]).reduce((sum: number, l: any) => sum + Number(l.iterationCount || 0), 0) / allChannels.length).toFixed(2)
      : 0;

    const result = {
      distribution,
      totalChangeEvents,
      totalChannels: allChannels.length,
      avgIterations,
      anomaliesCount,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }
}

export default new ChannelGradeService();
