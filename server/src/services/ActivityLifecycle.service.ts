import { marketingDao, marketingStatusChangeLogDao, userDao } from '../dao';
import { MarketingAttributes } from '../models/Marketing.model';
import { MarketingStatusChangeLogCreationAttributes, StatusValidationResult } from '../models/MarketingStatusChangeLog.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  MarketingStatus,
  MARKETING_STATUS_LABELS,
  STATUS_TRANSITION_RULES,
  EditPermissionLevel,
  STATUS_EDIT_PERMISSIONS,
  ActivityStatusChangeType,
  ACTIVITY_STATUS_CHANGE_TYPE_LABELS,
  ACTIVITY_CORE_FIELDS,
  ACTIVITY_NON_CORE_FIELDS,
  ValidationSeverity,
} from '../constants/enum';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';
import redis from '../config/redis';

export interface StatusTransitionResult {
  allowed: boolean;
  reason?: string;
  ruleCode?: string;
}

export interface EditPermissionResult {
  level: EditPermissionLevel;
  allowedFields: string[];
  blockedFields: string[];
  attemptedFields?: string[];
  blockedAttemptedFields?: string[];
}

export interface BatchOperationResult {
  total: number;
  success: number;
  failed: number;
  details: {
    activityId: string;
    activityName: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
    beforeStatus?: MarketingStatus;
    afterStatus?: MarketingStatus;
  }[];
}

export interface StatusChangeReport {
  generatedAt: Date;
  period: { startTime: Date; endTime: Date };
  summary: {
    totalChanges: number;
    byChangeType: Record<string, number>;
    byBeforeStatus: Record<string, number>;
    byAfterStatus: Record<string, number>;
  };
  details: any[];
  headers: string[];
  rows: string[][];
}

interface ParticipationData {
  participantCount: number;
  pendingRewardAmount: number;
  activeParticipants: number;
}

interface LogStatusChangeParams {
  marketingId: string;
  changeType: ActivityStatusChangeType;
  beforeStatus: MarketingStatus;
  afterStatus: MarketingStatus;
  operatorId: string;
  reason?: string;
  participationSnapshot?: object;
  rewardSnapshot?: object;
  validationResults?: StatusValidationResult[];
  ipAddress?: string;
  userAgent?: string;
}

const STATUS_LOCK_TTL = 10;

class ActivityLifecycleService {
  public validateStatusTransition(
    currentStatus: MarketingStatus,
    targetStatus: MarketingStatus
  ): StatusTransitionResult {
    if (currentStatus === targetStatus) {
      return { allowed: false, reason: '当前状态与目标状态相同', ruleCode: 'SAME_STATUS' };
    }

    const rule = STATUS_TRANSITION_RULES.find(r => r.from === currentStatus);
    if (!rule) {
      return { allowed: false, reason: `不允许从状态 ${MARKETING_STATUS_LABELS[currentStatus]?.label || currentStatus} 进行转换`, ruleCode: 'NO_RULE' };
    }

    if (!rule.to.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `不允许从 ${MARKETING_STATUS_LABELS[currentStatus]?.label || currentStatus} 转换到 ${MARKETING_STATUS_LABELS[targetStatus]?.label || targetStatus}`,
        ruleCode: 'TRANSITION_NOT_ALLOWED',
      };
    }

    return { allowed: true };
  }

  public checkEditPermission(
    status: MarketingStatus,
    fields: string[] = []
  ): EditPermissionResult {
    const permission = STATUS_EDIT_PERMISSIONS[status];
    if (!permission) {
      return {
        level: EditPermissionLevel.NONE,
        allowedFields: [],
        blockedFields: ['*'],
        attemptedFields: fields,
        blockedAttemptedFields: fields,
      };
    }

    const { level, allowedFields, blockedFields } = permission;

    if (level === EditPermissionLevel.FULL) {
      return {
        level,
        allowedFields: ['*'],
        blockedFields: [],
        attemptedFields: fields,
        blockedAttemptedFields: [],
      };
    }

    if (level === EditPermissionLevel.NONE) {
      return {
        level,
        allowedFields: [],
        blockedFields: ['*'],
        attemptedFields: fields,
        blockedAttemptedFields: fields,
      };
    }

    const blockedAttemptedFields = fields.filter(f => {
      if (blockedFields.includes('*')) return true;
      if (blockedFields.includes(f)) return true;
      return false;
    });

    const allowedAttemptedFields = fields.filter(f => !blockedAttemptedFields.includes(f));

    return {
      level,
      allowedFields: allowedFields,
      blockedFields: blockedFields,
      attemptedFields: fields,
      blockedAttemptedFields,
    };
  }

  public async getActivityParticipationData(id: string): Promise<ParticipationData> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    const participantCount = (marketing as any).participantCount || 0;
    const pendingRewardAmount = Number((marketing as any).pendingRewardAmount || 0);

    return {
      participantCount,
      pendingRewardAmount,
      activeParticipants: participantCount,
    };
  }

  public async checkPausePreconditions(id: string): Promise<StatusTransitionResult> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    if (marketing.status !== MarketingStatus.ONGOING) {
      return {
        allowed: false,
        reason: `只有进行中的活动可以暂停，当前状态为 ${MARKETING_STATUS_LABELS[marketing.status]?.label || marketing.status}`,
        ruleCode: 'NOT_ONGOING',
      };
    }

    const participationData = await this.getActivityParticipationData(id);
    if (participationData.pendingRewardAmount > 0) {
      return {
        allowed: false,
        reason: `存在待发放奖励 ¥${participationData.pendingRewardAmount.toFixed(2)}，请先处理奖励后再暂停`,
        ruleCode: 'PENDING_REWARD_EXISTS',
      };
    }

    return { allowed: true };
  }

  public async checkResumePreconditions(id: string): Promise<StatusTransitionResult> {
    const marketing = await marketingDao.findById(id);
    if (!marketing) {
      throw new AppError('营销活动不存在', BusinessCode.NOT_FOUND);
    }

    if (marketing.status !== MarketingStatus.PAUSED) {
      return {
        allowed: false,
        reason: `只有已暂停的活动可以恢复，当前状态为 ${MARKETING_STATUS_LABELS[marketing.status]?.label || marketing.status}`,
        ruleCode: 'NOT_PAUSED',
      };
    }

    if (marketing.endTime && dayjs(marketing.endTime).isBefore(dayjs())) {
      return {
        allowed: false,
        reason: '活动已过期，无法恢复',
        ruleCode: 'ACTIVITY_EXPIRED',
      };
    }

    return { allowed: true };
  }

  private async acquireStatusLock(id: string): Promise<string> {
    const lockKey = `${CacheKey.MARKETING_STATUS_LOCK}${id}`;
    const lockValue = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const acquired = await redis.set(lockKey, lockValue, 'PX', STATUS_LOCK_TTL * 1000, 'NX');
    if (!acquired) {
      throw new AppError('活动状态正在变更中，请稍后重试', BusinessCode.ERROR);
    }
    return lockValue;
  }

  private async releaseStatusLock(id: string, lockValue: string): Promise<void> {
    const lockKey = `${CacheKey.MARKETING_STATUS_LOCK}${id}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, lockKey, lockValue);
  }

  public async pauseActivity(
    id: string,
    operatorId: string,
    reason: string
  ): Promise<MarketingAttributes> {
    const precondition = await this.checkPausePreconditions(id);
    if (!precondition.allowed) {
      throw new AppError(precondition.reason!, BusinessCode.ERROR);
    }

    const transition = this.validateStatusTransition(MarketingStatus.ONGOING, MarketingStatus.PAUSED);
    if (!transition.allowed) {
      throw new AppError(transition.reason!, BusinessCode.ERROR);
    }

    let lockValue: string;
    try {
      lockValue = await this.acquireStatusLock(id);
    } catch {
      throw new AppError('活动状态正在变更中，请稍后重试', BusinessCode.ERROR);
    }

    try {
      const marketing = await marketingDao.findById(id);
      if (!marketing || marketing.status !== MarketingStatus.ONGOING) {
        throw new AppError('活动状态已变更，请刷新后重试', BusinessCode.ERROR);
      }

      const participationData = await this.getActivityParticipationData(id);

      const operator = await userDao.findById(operatorId);
      const operatorName = (operator as any)?.nickname || operator?.username || '系统';

      const t = await sequelize.transaction();

      try {
        await marketingDao.update(
          {
            status: MarketingStatus.PAUSED,
            pausedAt: new Date(),
            pausedBy: operatorId,
            pauseReason: reason,
            statusChangedAt: new Date(),
            statusChangedBy: operatorId,
          } as any,
          { where: { id }, transaction: t }
        );

        await marketingStatusChangeLogDao.create(
          {
            marketingId: id,
            changeType: ActivityStatusChangeType.PAUSE,
            beforeStatus: MarketingStatus.ONGOING,
            afterStatus: MarketingStatus.PAUSED,
            operatorId,
            operatorName,
            reason,
            participationSnapshot: participationData,
            rewardSnapshot: { pendingRewardAmount: participationData.pendingRewardAmount },
          } as MarketingStatusChangeLogCreationAttributes,
          { transaction: t }
        );

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }

      await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
      await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
      await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${id}*`);

      const updated = await marketingDao.findById(id);
      return updated!.get({ plain: true }) as MarketingAttributes;
    } finally {
      await this.releaseStatusLock(id, lockValue);
    }
  }

  public async resumeActivity(
    id: string,
    operatorId: string
  ): Promise<MarketingAttributes> {
    const precondition = await this.checkResumePreconditions(id);
    if (!precondition.allowed) {
      throw new AppError(precondition.reason!, BusinessCode.ERROR);
    }

    const transition = this.validateStatusTransition(MarketingStatus.PAUSED, MarketingStatus.ONGOING);
    if (!transition.allowed) {
      throw new AppError(transition.reason!, BusinessCode.ERROR);
    }

    let lockValue: string;
    try {
      lockValue = await this.acquireStatusLock(id);
    } catch {
      throw new AppError('活动状态正在变更中，请稍后重试', BusinessCode.ERROR);
    }

    try {
      const marketing = await marketingDao.findById(id);
      if (!marketing || marketing.status !== MarketingStatus.PAUSED) {
        throw new AppError('活动状态已变更，请刷新后重试', BusinessCode.ERROR);
      }

      const participationData = await this.getActivityParticipationData(id);

      const operator = await userDao.findById(operatorId);
      const operatorName = (operator as any)?.nickname || operator?.username || '系统';

      const t = await sequelize.transaction();

      try {
        await marketingDao.update(
          {
            status: MarketingStatus.ONGOING,
            pausedAt: null,
            pausedBy: null,
            pauseReason: null,
            statusChangedAt: new Date(),
            statusChangedBy: operatorId,
          } as any,
          { where: { id }, transaction: t }
        );

        await marketingStatusChangeLogDao.create(
          {
            marketingId: id,
            changeType: ActivityStatusChangeType.RESUME,
            beforeStatus: MarketingStatus.PAUSED,
            afterStatus: MarketingStatus.ONGOING,
            operatorId,
            operatorName,
            reason: '恢复活动',
            participationSnapshot: participationData,
            rewardSnapshot: { pendingRewardAmount: participationData.pendingRewardAmount },
          } as MarketingStatusChangeLogCreationAttributes,
          { transaction: t }
        );

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }

      await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
      await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);
      await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${id}*`);

      const updated = await marketingDao.findById(id);
      return updated!.get({ plain: true }) as MarketingAttributes;
    } finally {
      await this.releaseStatusLock(id, lockValue);
    }
  }

  public async batchPauseExpiredActivities(operatorId: string): Promise<BatchOperationResult> {
    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const now = dayjs().toDate();

    const ongoingExpired = await marketingDao.findAll({
      where: {
        status: MarketingStatus.ONGOING,
        endTime: { [Op.lt]: now },
      },
    } as any);

    const pausedExpired = await marketingDao.findAll({
      where: {
        status: MarketingStatus.PAUSED,
        endTime: { [Op.lt]: now },
      },
    } as any);

    const details: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    const allActivities = [
      ...ongoingExpired.map(a => ({ activity: a, currentStatus: MarketingStatus.ONGOING })),
      ...pausedExpired.map(a => ({ activity: a, currentStatus: MarketingStatus.PAUSED })),
    ];

    for (const { activity, currentStatus } of allActivities) {
      try {
        const transition = this.validateStatusTransition(currentStatus, MarketingStatus.ENDED);
        if (!transition.allowed) {
          failed++;
          details.push({
            activityId: activity.id,
            activityName: activity.name,
            status: 'failed',
            reason: transition.reason,
            beforeStatus: currentStatus,
          });
          continue;
        }

        const participationData = await this.getActivityParticipationData(activity.id);

        const changeType = currentStatus === MarketingStatus.PAUSED
          ? ActivityStatusChangeType.AUTO_END
          : ActivityStatusChangeType.AUTO_END;

        const t = await sequelize.transaction();

        try {
          await marketingDao.update(
            {
              status: MarketingStatus.ENDED,
              statusChangedAt: new Date(),
              statusChangedBy: operatorId,
            } as any,
            { where: { id: activity.id }, transaction: t }
          );

          await marketingStatusChangeLogDao.create(
            {
              marketingId: activity.id,
              changeType,
              beforeStatus: currentStatus,
              afterStatus: MarketingStatus.ENDED,
              operatorId,
              operatorName,
              reason: `活动已过期自动结束（原状态：${MARKETING_STATUS_LABELS[currentStatus]?.label || currentStatus}）`,
              participationSnapshot: participationData,
              rewardSnapshot: { pendingRewardAmount: participationData.pendingRewardAmount },
            } as MarketingStatusChangeLogCreationAttributes,
            { transaction: t }
          );

          await t.commit();
        } catch (err) {
          await t.rollback();
          throw err;
        }

        await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${activity.id}`);
        await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${activity.id}*`);

        success++;
        details.push({
          activityId: activity.id,
          activityName: activity.name,
          status: 'success',
          beforeStatus: currentStatus,
          afterStatus: MarketingStatus.ENDED,
        });
      } catch (err: any) {
        failed++;
        details.push({
          activityId: activity.id,
          activityName: activity.name,
          status: 'failed',
          reason: err.message || '操作失败',
          beforeStatus: currentStatus,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return {
      total: allActivities.length,
      success,
      failed,
      details,
    };
  }

  public async batchCancelNotStartedActivities(
    ids: string[],
    operatorId: string,
    reason: string
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的活动', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const marketing = await marketingDao.findById(id);
        if (!marketing) {
          failed++;
          details.push({
            activityId: id,
            activityName: '-',
            status: 'failed',
            reason: '活动不存在',
          });
          continue;
        }

        if (marketing.status !== MarketingStatus.DRAFT) {
          failed++;
          details.push({
            activityId: id,
            activityName: marketing.name,
            status: 'failed',
            reason: `只能作废未开始的活动，当前状态为 ${MARKETING_STATUS_LABELS[marketing.status]?.label || marketing.status}`,
            beforeStatus: marketing.status,
          });
          continue;
        }

        const transition = this.validateStatusTransition(marketing.status, MarketingStatus.CANCELLED);
        if (!transition.allowed) {
          failed++;
          details.push({
            activityId: id,
            activityName: marketing.name,
            status: 'failed',
            reason: transition.reason,
            beforeStatus: marketing.status,
          });
          continue;
        }

        const t = await sequelize.transaction();

        try {
          await marketingDao.update(
            {
              status: MarketingStatus.CANCELLED,
              statusChangedAt: new Date(),
              statusChangedBy: operatorId,
            } as any,
            { where: { id }, transaction: t }
          );

          await marketingStatusChangeLogDao.create(
            {
              marketingId: id,
              changeType: ActivityStatusChangeType.BATCH_CANCEL,
              beforeStatus: MarketingStatus.DRAFT,
              afterStatus: MarketingStatus.CANCELLED,
              operatorId,
              operatorName,
              reason,
            } as MarketingStatusChangeLogCreationAttributes,
            { transaction: t }
          );

          await t.commit();
        } catch (err) {
          await t.rollback();
          throw err;
        }

        await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${id}`);
        await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${id}*`);

        success++;
        details.push({
          activityId: id,
          activityName: marketing.name,
          status: 'success',
          beforeStatus: MarketingStatus.DRAFT,
          afterStatus: MarketingStatus.CANCELLED,
        });
      } catch (err: any) {
        failed++;
        details.push({
          activityId: id,
          activityName: '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return {
      total: ids.length,
      success,
      failed,
      details,
    };
  }

  public async batchEndExpiredActivities(operatorId: string): Promise<BatchOperationResult> {
    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const now = dayjs().toDate();

    const expiredOngoing = await marketingDao.findAll({
      where: {
        status: MarketingStatus.ONGOING,
        endTime: { [Op.lt]: now },
      },
    } as any);

    const details: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const activity of expiredOngoing) {
      try {
        const transition = this.validateStatusTransition(MarketingStatus.ONGOING, MarketingStatus.ENDED);
        if (!transition.allowed) {
          failed++;
          details.push({
            activityId: activity.id,
            activityName: activity.name,
            status: 'failed',
            reason: transition.reason,
            beforeStatus: MarketingStatus.ONGOING,
          });
          continue;
        }

        const participationData = await this.getActivityParticipationData(activity.id);

        const t = await sequelize.transaction();

        try {
          await marketingDao.update(
            {
              status: MarketingStatus.ENDED,
              statusChangedAt: new Date(),
              statusChangedBy: operatorId,
            } as any,
            { where: { id: activity.id }, transaction: t }
          );

          await marketingStatusChangeLogDao.create(
            {
              marketingId: activity.id,
              changeType: ActivityStatusChangeType.BATCH_END,
              beforeStatus: MarketingStatus.ONGOING,
              afterStatus: MarketingStatus.ENDED,
              operatorId,
              operatorName,
              reason: '批量结束已过期的进行中活动',
              participationSnapshot: participationData,
              rewardSnapshot: { pendingRewardAmount: participationData.pendingRewardAmount },
            } as MarketingStatusChangeLogCreationAttributes,
            { transaction: t }
          );

          await t.commit();
        } catch (err) {
          await t.rollback();
          throw err;
        }

        await CacheUtils.del(`${CacheKey.MARKETING_DETAIL}${activity.id}`);
        await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${activity.id}*`);

        success++;
        details.push({
          activityId: activity.id,
          activityName: activity.name,
          status: 'success',
          beforeStatus: MarketingStatus.ONGOING,
          afterStatus: MarketingStatus.ENDED,
        });
      } catch (err: any) {
        failed++;
        details.push({
          activityId: activity.id,
          activityName: activity.name,
          status: 'failed',
          reason: err.message || '操作失败',
          beforeStatus: MarketingStatus.ONGOING,
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.MARKETING_LIST}*`);

    return {
      total: expiredOngoing.length,
      success,
      failed,
      details,
    };
  }

  public async generateStatusChangeReport(
    startTime: Date,
    endTime: Date
  ): Promise<StatusChangeReport> {
    const logs = await marketingStatusChangeLogDao.findByTimeRange(startTime, endTime);

    const byChangeType: Record<string, number> = {};
    const byBeforeStatus: Record<string, number> = {};
    const byAfterStatus: Record<string, number> = {};

    for (const log of logs) {
      const changeTypeLabel = ACTIVITY_STATUS_CHANGE_TYPE_LABELS[(log as any).changeType as ActivityStatusChangeType] || (log as any).changeType;
      const beforeStatusLabel = MARKETING_STATUS_LABELS[(log as any).beforeStatus as MarketingStatus]?.label || String((log as any).beforeStatus);
      const afterStatusLabel = MARKETING_STATUS_LABELS[(log as any).afterStatus as MarketingStatus]?.label || String((log as any).afterStatus);

      byChangeType[changeTypeLabel] = (byChangeType[changeTypeLabel] || 0) + 1;
      byBeforeStatus[beforeStatusLabel] = (byBeforeStatus[beforeStatusLabel] || 0) + 1;
      byAfterStatus[afterStatusLabel] = (byAfterStatus[afterStatusLabel] || 0) + 1;
    }

    const headers = [
      '活动ID',
      '变更类型',
      '变更前状态',
      '变更后状态',
      '操作人',
      '原因',
      '变更时间',
    ];

    const rows = logs.map(log => [
      (log as any).marketingId,
      ACTIVITY_STATUS_CHANGE_TYPE_LABELS[(log as any).changeType as ActivityStatusChangeType] || (log as any).changeType,
      MARKETING_STATUS_LABELS[(log as any).beforeStatus as MarketingStatus]?.label || String((log as any).beforeStatus),
      MARKETING_STATUS_LABELS[(log as any).afterStatus as MarketingStatus]?.label || String((log as any).afterStatus),
      (log as any).operatorName,
      (log as any).reason || '',
      dayjs((log as any).createdAt).format('YYYY-MM-DD HH:mm:ss'),
    ]);

    return {
      generatedAt: new Date(),
      period: { startTime, endTime },
      summary: {
        totalChanges: logs.length,
        byChangeType,
        byBeforeStatus,
        byAfterStatus,
      },
      details: logs.map(l => l.get ? l.get({ plain: true }) : l),
      headers,
      rows,
    };
  }

  public async logStatusChange(params: LogStatusChangeParams): Promise<any> {
    const operator = await userDao.findById(params.operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const log = await marketingStatusChangeLogDao.create({
      marketingId: params.marketingId,
      changeType: params.changeType,
      beforeStatus: params.beforeStatus,
      afterStatus: params.afterStatus,
      operatorId: params.operatorId,
      operatorName,
      reason: params.reason,
      participationSnapshot: params.participationSnapshot,
      rewardSnapshot: params.rewardSnapshot,
      validationResults: params.validationResults,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    } as MarketingStatusChangeLogCreationAttributes);

    await CacheUtils.delPattern(`${CacheKey.MARKETING_STATUS_CHANGE_LOG}${params.marketingId}*`);

    return log;
  }

  public async getStatusChangeLogs(
    marketingId: string,
    params: PaginationParams & { changeType?: string; startTime?: Date; endTime?: Date }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await marketingStatusChangeLogDao.findAllPaged({
      page,
      pageSize,
      marketingId,
      changeType: params.changeType,
      startTime: params.startTime,
      endTime: params.endTime,
    });

    const logs = rows.map((log: any) => ({
      ...log.get({ plain: true }),
      changedAt: log.createdAt,
    }));

    return {
      list: logs,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public validateStatusChangeCompliance(
    currentStatus: MarketingStatus,
    targetStatus: MarketingStatus
  ): StatusValidationResult[] {
    const results: StatusValidationResult[] = [];

    const transition = this.validateStatusTransition(currentStatus, targetStatus);
    if (!transition.allowed) {
      results.push({
        ruleCode: transition.ruleCode || 'TRANSITION_NOT_ALLOWED',
        severity: ValidationSeverity.ERROR,
        message: transition.reason || '状态转换不允许',
        passed: false,
      });
      return results;
    }

    results.push({
      ruleCode: 'TRANSITION_ALLOWED',
      severity: ValidationSeverity.INFO,
      message: '状态转换规则验证通过',
      passed: true,
    });

    const rule = STATUS_TRANSITION_RULES.find(r => r.from === currentStatus);
    if (rule) {
      if (targetStatus === MarketingStatus.PAUSED && rule.requireNoActiveParticipation) {
        results.push({
          ruleCode: 'CHECK_ACTIVE_PARTICIPATION',
          severity: ValidationSeverity.WARNING,
          message: '暂停前需确认无活跃参与数据',
          passed: false,
        });
      }

      if (targetStatus === MarketingStatus.CANCELLED && rule.requireNoPendingReward) {
        results.push({
          ruleCode: 'CHECK_PENDING_REWARD',
          severity: ValidationSeverity.WARNING,
          message: '作废前需确认无待发放奖励',
          passed: false,
        });
      }
    }

    if (targetStatus === MarketingStatus.ONGOING && currentStatus === MarketingStatus.PAUSED) {
      results.push({
        ruleCode: 'CHECK_RESUME_TIME',
        severity: ValidationSeverity.WARNING,
        message: '恢复前需确认活动未过期',
        passed: false,
      });
    }

    if (targetStatus === MarketingStatus.ENDED) {
      results.push({
        ruleCode: 'CHECK_END_PARTICIPATION',
        severity: ValidationSeverity.INFO,
        message: '结束活动将停止所有参与和奖励',
        passed: true,
      });
    }

    if (targetStatus === MarketingStatus.CANCELLED) {
      results.push({
        ruleCode: 'CHECK_CANCEL_IMPACT',
        severity: ValidationSeverity.WARNING,
        message: '作废操作不可逆，请确认影响范围',
        passed: true,
      });
    }

    return results;
  }

  public blockNonCompliantOperation(
    currentStatus: MarketingStatus,
    targetStatus: MarketingStatus
  ): void {
    const validationResults = this.validateStatusChangeCompliance(currentStatus, targetStatus);

    const errors = validationResults.filter(
      r => !r.passed && r.severity === ValidationSeverity.ERROR
    );

    if (errors.length > 0) {
      throw new AppError(
        errors.map(e => e.message).join('；'),
        BusinessCode.ERROR
      );
    }

    const failedValidations = validationResults.filter(r => !r.passed);
    if (failedValidations.length > 0) {
      throw new AppError(
        failedValidations.map(v => v.message).join('；'),
        BusinessCode.ERROR
      );
    }
  }
}

export default new ActivityLifecycleService();
