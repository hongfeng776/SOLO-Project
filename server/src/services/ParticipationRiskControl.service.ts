import { activityParticipationDao, activityParticipationLogDao, marketingDao, promoterDao, userDao, promoterBlacklistDao, promoterRiskRecordDao } from '../dao';
import { ActivityParticipationCreationAttributes, EligibilityCheckResult } from '../models/ActivityParticipation.model';
import { ActivityParticipationLogCreationAttributes, DataChangeDetail } from '../models/ActivityParticipationLog.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  ParticipationEligibilityStatus,
  PARTICIPATION_ELIGIBILITY_STATUS_LABELS,
  ParticipationAnomalyType,
  PARTICIPATION_ANOMALY_TYPE_LABELS,
  ParticipationRecordType,
  PARTICIPATION_RECORD_TYPE_LABELS,
  ParticipationUserType,
  PARTICIPATION_USER_TYPE_LABELS,
  PARTICIPATION_ANOMALY_DETECTION_RULES,
  PARTICIPATION_ELIGIBILITY_CHECKS,
  MarketingStatus,
  MARKETING_STATUS_LABELS,
  ValidationSeverity,
  PromoterLevel,
  PromoterStatus,
  RiskControlStatus,
  BlacklistType,
} from '../constants/enum';
import { sequelize } from '../config/database';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

export interface EligibilityCheckResultFull {
  passed: boolean;
  checks: EligibilityCheckResult[];
  blockReason?: string;
  blockedBy?: string;
}

export interface ParticipationStats {
  marketingId: string;
  totalParticipants: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  revokedCount: number;
  anomalyCount: number;
  restrictedCount: number;
  totalOrders: number;
  totalAmount: number;
  totalReward: number;
  anomalyRate: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyTypes: ParticipationAnomalyType[];
  details: { type: ParticipationAnomalyType; reason: string; severity: ValidationSeverity }[];
}

export interface BatchOperationResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: { participationId: string; userId: string; status: 'success' | 'failed' | 'skipped'; reason?: string }[];
}

export interface ParticipationVerificationResult {
  isValid: boolean;
  anomalies: { type: ParticipationAnomalyType; evidence: string; confidence: number }[];
  riskScore: number;
}

class ParticipationRiskControlService {
  public async checkEligibility(marketingId: string, userId: string, userType: ParticipationUserType): Promise<EligibilityCheckResultFull> {
    const checks: EligibilityCheckResult[] = [];

    const checkDefinitions = [
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name, fn: () => this.checkActivityStatus(marketingId) },
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[0].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[0].name, fn: () => this.checkUserLevel(userId, userType, marketingId) },
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[1].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[1].name, fn: () => this.checkRiskControlStatus(userId, userType) },
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[2].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[2].name, fn: () => this.checkBlacklist(userId, userType) },
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[3].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[3].name, fn: () => this.checkHistoricalPerformance(userId, userType, marketingId) },
      { code: PARTICIPATION_ELIGIBILITY_CHECKS[4].code, name: PARTICIPATION_ELIGIBILITY_CHECKS[4].name, fn: () => this.checkDuplicateParticipation(marketingId, userId) },
    ];

    for (const def of checkDefinitions) {
      const result = await def.fn();
      checks.push(result);
    }

    const blockingCheck = checks.find(c => !c.passed && c.severity === ValidationSeverity.ERROR);
    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      checks,
      blockReason: blockingCheck?.message,
      blockedBy: blockingCheck?.code,
    };
  }

  public async approveParticipation(participationId: string, operatorId: string): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }
    if (participation.eligibilityStatus !== ParticipationEligibilityStatus.PENDING) {
      throw new AppError('当前状态不可审核通过', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const beforeData = {
      eligibilityStatus: participation.eligibilityStatus,
    };

    await activityParticipationDao.update(participationId, {
      eligibilityStatus: ParticipationEligibilityStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: operatorId,
    } as any);

    const afterData = {
      eligibilityStatus: ParticipationEligibilityStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: operatorId,
    };

    const changes: DataChangeDetail[] = [
      { field: 'eligibilityStatus', oldValue: participation.eligibilityStatus, newValue: ParticipationEligibilityStatus.APPROVED },
      { field: 'approvedAt', oldValue: null, newValue: new Date() },
      { field: 'approvedBy', oldValue: null, newValue: operatorId },
    ];

    await this.logParticipationRecord({
      participationId,
      marketingId: participation.marketingId,
      userId: participation.userId,
      userType: participation.userType,
      recordType: ParticipationRecordType.APPROVE,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      dataChanges: changes,
    });

    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

    return { participationId, eligibilityStatus: ParticipationEligibilityStatus.APPROVED };
  }

  public async rejectParticipation(participationId: string, operatorId: string, reason: string): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }
    if (participation.eligibilityStatus !== ParticipationEligibilityStatus.PENDING) {
      throw new AppError('当前状态不可审核拒绝', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const beforeData = {
      eligibilityStatus: participation.eligibilityStatus,
    };

    await activityParticipationDao.update(participationId, {
      eligibilityStatus: ParticipationEligibilityStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedReason: reason,
    } as any);

    const afterData = {
      eligibilityStatus: ParticipationEligibilityStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedReason: reason,
    };

    const changes: DataChangeDetail[] = [
      { field: 'eligibilityStatus', oldValue: participation.eligibilityStatus, newValue: ParticipationEligibilityStatus.REJECTED },
      { field: 'rejectedAt', oldValue: null, newValue: new Date() },
      { field: 'rejectedReason', oldValue: null, newValue: reason },
    ];

    await this.logParticipationRecord({
      participationId,
      marketingId: participation.marketingId,
      userId: participation.userId,
      userType: participation.userType,
      recordType: ParticipationRecordType.REJECT,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      dataChanges: changes,
      reason,
    });

    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

    return { participationId, eligibilityStatus: ParticipationEligibilityStatus.REJECTED };
  }

  public async registerParticipation(
    marketingId: string,
    userId: string,
    userType: ParticipationUserType,
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<any> {
    const lockValue = await this.acquireParticipationLock(userId);
    if (!lockValue) {
      throw new AppError('操作过于频繁，请稍后重试', BusinessCode.FREQUENCY_LIMIT);
    }

    try {
      const existing = await activityParticipationDao.findByMarketingAndUser(marketingId, userId);
      if (existing) {
        throw new AppError('该用户已参与此活动', BusinessCode.ERROR);
      }

      const eligibilityResult = await this.checkEligibility(marketingId, userId, userType);

      const status = eligibilityResult.passed
        ? ParticipationEligibilityStatus.APPROVED
        : ParticipationEligibilityStatus.REJECTED;

      const participation = await sequelize.transaction(async (transaction) => {
        const data: ActivityParticipationCreationAttributes = {
          marketingId,
          userId,
          userType,
          eligibilityStatus: status,
          registeredAt: new Date(),
          eligibilityCheckResults: eligibilityResult.checks,
          ipAddress,
          deviceFingerprint,
        } as any;

        if (eligibilityResult.passed) {
          (data as any).approvedAt = new Date();
          (data as any).approvedBy = 'system';
        } else {
          (data as any).rejectedAt = new Date();
          (data as any).rejectedReason = eligibilityResult.blockReason || '资格校验未通过';
        }

        const record = await activityParticipationDao.create(data, { transaction });

        await this.logParticipationRecord({
          participationId: record.id!,
          marketingId,
          userId,
          userType,
          recordType: ParticipationRecordType.REGISTER,
          operatorId: 'system',
          operatorName: '系统',
          afterData: {
            eligibilityStatus: status,
            eligibilityCheckResults: eligibilityResult.checks,
          },
          reason: eligibilityResult.passed ? '自动审核通过' : eligibilityResult.blockReason,
        });

        if (eligibilityResult.passed) {
          await this.logParticipationRecord({
            participationId: record.id!,
            marketingId,
            userId,
            userType,
            recordType: ParticipationRecordType.APPROVE,
            operatorId: 'system',
            operatorName: '系统',
            afterData: { eligibilityStatus: ParticipationEligibilityStatus.APPROVED },
            reason: '资格校验全部通过，自动审核',
          });
        }

        return record;
      });

      await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${marketingId}`);

      return {
        participationId: participation.id,
        eligibilityStatus: status,
        eligibilityResult,
      };
    } finally {
      await this.releaseParticipationLock(userId, lockValue);
    }
  }

  public async getParticipationStats(marketingId: string): Promise<ParticipationStats> {
    const cacheKey = `${CacheKey.ACTIVITY_PARTICIPATION_STATS}${marketingId}`;
    const cached = await CacheUtils.get<ParticipationStats>(cacheKey);
    if (cached) return cached;

    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new AppError('活动不存在', BusinessCode.NOT_FOUND);
    }

    const totalParticipants = await activityParticipationDao.countByMarketingId(marketingId);
    const approvedCount = await activityParticipationDao.countByMarketingId(marketingId, ParticipationEligibilityStatus.APPROVED);
    const pendingCount = await activityParticipationDao.countByMarketingId(marketingId, ParticipationEligibilityStatus.PENDING);
    const rejectedCount = await activityParticipationDao.countByMarketingId(marketingId, ParticipationEligibilityStatus.REJECTED);
    const revokedCount = await activityParticipationDao.countByMarketingId(marketingId, ParticipationEligibilityStatus.REVOKED);
    const anomalyCount = await activityParticipationDao.countAnomalyByMarketingId(marketingId);

    const restrictedParticipations = await activityParticipationDao.findRestrictedParticipations(marketingId);
    const restrictedCount = restrictedParticipations.length;

    const allApproved = await activityParticipationDao.findByMarketingId(marketingId);
    const approvedRecords = allApproved.filter(p => p.eligibilityStatus === ParticipationEligibilityStatus.APPROVED);
    const totalOrders = approvedRecords.reduce((sum, p) => sum + (p.participantOrders || 0), 0);
    const totalAmount = approvedRecords.reduce((sum, p) => sum + Number(p.participantAmount || 0), 0);
    const totalReward = await activityParticipationDao.sumRewardByMarketingId(marketingId);

    const anomalyRate = totalParticipants > 0 ? anomalyCount / totalParticipants : 0;

    const stats: ParticipationStats = {
      marketingId,
      totalParticipants,
      approvedCount,
      pendingCount,
      rejectedCount,
      revokedCount,
      anomalyCount,
      restrictedCount,
      totalOrders,
      totalAmount,
      totalReward,
      anomalyRate,
    };

    await CacheUtils.set(cacheKey, stats, CacheTTL.MEDIUM);

    return stats;
  }

  public async detectAnomalies(marketingId: string): Promise<AnomalyDetectionResult[]> {
    const participations = await activityParticipationDao.findByMarketingId(marketingId);
    const results: AnomalyDetectionResult[] = [];

    const approvedParticipations = participations.filter(
      p => p.eligibilityStatus === ParticipationEligibilityStatus.APPROVED
    );

    for (const participation of approvedParticipations) {
      const details: AnomalyDetectionResult['details'] = [];
      const anomalyTypes: ParticipationAnomalyType[] = [];

      const sameIpParticipations = participations.filter(
        p => p.ipAddress && p.ipAddress === participation.ipAddress && p.id !== participation.id
      );
      const recentSameIp = sameIpParticipations.filter(p =>
        dayjs(p.registeredAt).isAfter(dayjs(participation.registeredAt).subtract(1, 'hour'))
      );
      if (recentSameIp.length >= PARTICIPATION_ANOMALY_DETECTION_RULES.brushParticipationMinOrders) {
        anomalyTypes.push(ParticipationAnomalyType.BRUSH_PARTICIPATION);
        details.push({
          type: ParticipationAnomalyType.BRUSH_PARTICIPATION,
          reason: `同IP(${participation.ipAddress})在${PARTICIPATION_ANOMALY_DETECTION_RULES.brushParticipationWindowMinutes}分钟内参与${recentSameIp.length + 1}次，超过阈值${PARTICIPATION_ANOMALY_DETECTION_RULES.brushParticipationMinOrders}`,
          severity: ValidationSeverity.ERROR,
        });
      }

      if (participation.participantOrders && participation.participantOrders > 0) {
        const avgOrders = approvedParticipations.reduce((s, p) => s + (p.participantOrders || 0), 0) / approvedParticipations.length;
        if (avgOrders > 0 && participation.participantOrders > avgOrders * PARTICIPATION_ANOMALY_DETECTION_RULES.abnormalOrderSurgeMultiplier) {
          anomalyTypes.push(ParticipationAnomalyType.ABNORMAL_ORDER_SURGE);
          details.push({
            type: ParticipationAnomalyType.ABNORMAL_ORDER_SURGE,
            reason: `订单量${participation.participantOrders}为平均值的${(participation.participantOrders / avgOrders).toFixed(1)}倍，超过${PARTICIPATION_ANOMALY_DETECTION_RULES.abnormalOrderSurgeMultiplier}倍阈值`,
            severity: ValidationSeverity.WARNING,
          });
        }
      }

      if (participation.participantReward && participation.participantReward > 0 && participation.participantAmount && participation.participantAmount > 0) {
        const rewardRate = Number(participation.participantReward) / Number(participation.participantAmount);
        if (rewardRate > PARTICIPATION_ANOMALY_DETECTION_RULES.rewardAbuseThreshold) {
          anomalyTypes.push(ParticipationAnomalyType.REWARD_ABUSE);
          details.push({
            type: ParticipationAnomalyType.REWARD_ABUSE,
            reason: `奖励占成交额比例${(rewardRate * 100).toFixed(1)}%超过阈值${(PARTICIPATION_ANOMALY_DETECTION_RULES.rewardAbuseThreshold * 100)}%`,
            severity: ValidationSeverity.ERROR,
          });
        }
      }

      if (participation.participantOrders === 0 && Number(participation.participantReward || 0) > 0) {
        anomalyTypes.push(ParticipationAnomalyType.FAKE_PERFORMANCE);
        details.push({
          type: ParticipationAnomalyType.FAKE_PERFORMANCE,
          reason: '订单数为0但有奖励记录，疑似虚假业绩',
          severity: ValidationSeverity.ERROR,
        });
      }

      if (participation.ipAddress) {
        const sameDeviceParticipations = participations.filter(
          p => p.deviceFingerprint && p.deviceFingerprint === participation.deviceFingerprint && p.id !== participation.id
        );
        if (sameDeviceParticipations.length >= 3) {
          if (!anomalyTypes.includes(ParticipationAnomalyType.BRUSH_PARTICIPATION)) {
            anomalyTypes.push(ParticipationAnomalyType.BRUSH_PARTICIPATION);
          }
          details.push({
            type: ParticipationAnomalyType.BRUSH_PARTICIPATION,
            reason: `同设备指纹在活动中出现${sameDeviceParticipations.length + 1}次参与`,
            severity: ValidationSeverity.WARNING,
          });
        }
      }

      results.push({
        isAnomaly: anomalyTypes.length > 0,
        anomalyTypes,
        details,
      });
    }

    return results;
  }

  public async flagAnomaly(
    participationId: string,
    anomalyTypes: ParticipationAnomalyType[],
    operatorId: string,
    reason: string
  ): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }
    if (participation.isAnomaly) {
      throw new AppError('该记录已被标记为异常', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const beforeData = {
      isAnomaly: participation.isAnomaly,
      anomalyTypes: participation.anomalyTypes,
    };

    await activityParticipationDao.update(participationId, {
      isAnomaly: true,
      anomalyTypes,
      anomalyMarkedAt: new Date(),
      anomalyMarkedBy: operatorId,
      anomalyMarkedReason: reason,
      isRestricted: true,
      restrictedAt: new Date(),
      restrictedReason: `异常标记：${reason}`,
    } as any);

    const afterData = {
      isAnomaly: true,
      anomalyTypes,
      anomalyMarkedAt: new Date(),
      isRestricted: true,
    };

    const changes: DataChangeDetail[] = [
      { field: 'isAnomaly', oldValue: false, newValue: true },
      { field: 'anomalyTypes', oldValue: null, newValue: anomalyTypes },
      { field: 'isRestricted', oldValue: false, newValue: true },
    ];

    await this.logParticipationRecord({
      participationId,
      marketingId: participation.marketingId,
      userId: participation.userId,
      userType: participation.userType,
      recordType: ParticipationRecordType.ANOMALY_FLAG,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      dataChanges: changes,
      anomalyType: anomalyTypes[0],
      reason,
    });

    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

    return { participationId, isAnomaly: true, anomalyTypes, isRestricted: true };
  }

  public async restrictUser(participationId: string, reason: string): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }
    if (participation.isRestricted) {
      throw new AppError('该用户已被限制', BusinessCode.ERROR);
    }

    await activityParticipationDao.update(participationId, {
      isRestricted: true,
      restrictedAt: new Date(),
      restrictedReason: reason,
    } as any);

    const changes: DataChangeDetail[] = [
      { field: 'isRestricted', oldValue: false, newValue: true },
      { field: 'restrictedReason', oldValue: null, newValue: reason },
    ];

    await this.logParticipationRecord({
      participationId,
      marketingId: participation.marketingId,
      userId: participation.userId,
      userType: participation.userType,
      recordType: ParticipationRecordType.ANOMALY_FLAG,
      operatorId: 'system',
      operatorName: '系统',
      dataChanges: changes,
      reason,
    });

    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

    return { participationId, isRestricted: true };
  }

  public async resolveAnomaly(participationId: string, operatorId: string): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }
    if (!participation.isAnomaly) {
      throw new AppError('该记录未标记为异常', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const beforeData = {
      isAnomaly: participation.isAnomaly,
      anomalyTypes: participation.anomalyTypes,
      isRestricted: participation.isRestricted,
    };

    await activityParticipationDao.update(participationId, {
      isAnomaly: false,
      anomalyTypes: null,
      isRestricted: false,
      restrictedReason: null,
    } as any);

    const afterData = {
      isAnomaly: false,
      anomalyTypes: null,
      isRestricted: false,
    };

    const changes: DataChangeDetail[] = [
      { field: 'isAnomaly', oldValue: true, newValue: false },
      { field: 'anomalyTypes', oldValue: participation.anomalyTypes, newValue: null },
      { field: 'isRestricted', oldValue: true, newValue: false },
    ];

    await this.logParticipationRecord({
      participationId,
      marketingId: participation.marketingId,
      userId: participation.userId,
      userType: participation.userType,
      recordType: ParticipationRecordType.ANOMALY_RESOLVE,
      operatorId,
      operatorName,
      beforeData,
      afterData,
      dataChanges: changes,
    });

    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
    await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

    return { participationId, isAnomaly: false, isRestricted: false };
  }

  public async batchApproveEligibility(participationIds: string[], operatorId: string): Promise<BatchOperationResult> {
    if (!participationIds || participationIds.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of participationIds) {
      try {
        const participation = await activityParticipationDao.findById(id);
        if (!participation) {
          skipped++;
          details.push({ participationId: id, userId: '-', status: 'skipped', reason: '参与记录不存在' });
          continue;
        }

        if (participation.eligibilityStatus === ParticipationEligibilityStatus.APPROVED) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: '已通过审核' });
          continue;
        }

        if (participation.eligibilityStatus === ParticipationEligibilityStatus.REJECTED) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: '已拒绝，不可批量通过' });
          continue;
        }

        if (participation.eligibilityStatus !== ParticipationEligibilityStatus.PENDING) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: '当前状态不可操作' });
          continue;
        }

        const eligibility = await this.checkEligibility(participation.marketingId, participation.userId, participation.userType);
        if (!eligibility.passed) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: eligibility.blockReason || '资格校验未通过' });
          continue;
        }

        await activityParticipationDao.update(id, {
          eligibilityStatus: ParticipationEligibilityStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: operatorId,
          eligibilityCheckResults: eligibility.checks,
        } as any);

        await this.logParticipationRecord({
          participationId: id,
          marketingId: participation.marketingId,
          userId: participation.userId,
          userType: participation.userType,
          recordType: ParticipationRecordType.BATCH_APPROVE,
          operatorId,
          operatorName,
          beforeData: { eligibilityStatus: participation.eligibilityStatus },
          afterData: { eligibilityStatus: ParticipationEligibilityStatus.APPROVED },
          dataChanges: [
            { field: 'eligibilityStatus', oldValue: participation.eligibilityStatus, newValue: ParticipationEligibilityStatus.APPROVED },
          ],
        });

        success++;
        details.push({ participationId: id, userId: participation.userId, status: 'success' });
      } catch (err: any) {
        failed++;
        details.push({ participationId: id, userId: '-', status: 'failed', reason: err.message || '操作失败' });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}*`);

    return { total: participationIds.length, success, failed, skipped, details };
  }

  public async batchRevokeViolations(participationIds: string[], operatorId: string, reason: string): Promise<BatchOperationResult> {
    if (!participationIds || participationIds.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of participationIds) {
      try {
        const participation = await activityParticipationDao.findById(id);
        if (!participation) {
          skipped++;
          details.push({ participationId: id, userId: '-', status: 'skipped', reason: '参与记录不存在' });
          continue;
        }

        if (participation.eligibilityStatus === ParticipationEligibilityStatus.REVOKED) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: '已撤销' });
          continue;
        }

        if (!participation.isAnomaly && !participation.isRestricted) {
          skipped++;
          details.push({ participationId: id, userId: participation.userId, status: 'skipped', reason: '非违规用户' });
          continue;
        }

        const beforeData = {
          eligibilityStatus: participation.eligibilityStatus,
          isAnomaly: participation.isAnomaly,
          isRestricted: participation.isRestricted,
        };

        await activityParticipationDao.update(id, {
          eligibilityStatus: ParticipationEligibilityStatus.REVOKED,
          revokedAt: new Date(),
          revokedBy: operatorId,
          revokeReason: reason,
        } as any);

        const afterData = {
          eligibilityStatus: ParticipationEligibilityStatus.REVOKED,
        };

        const changes: DataChangeDetail[] = [
          { field: 'eligibilityStatus', oldValue: participation.eligibilityStatus, newValue: ParticipationEligibilityStatus.REVOKED },
          { field: 'revokedAt', oldValue: null, newValue: new Date() },
          { field: 'revokeReason', oldValue: null, newValue: reason },
        ];

        await this.logParticipationRecord({
          participationId: id,
          marketingId: participation.marketingId,
          userId: participation.userId,
          userType: participation.userType,
          recordType: ParticipationRecordType.BATCH_REVOKE,
          operatorId,
          operatorName,
          beforeData,
          afterData,
          dataChanges: changes,
          reason,
        });

        success++;
        details.push({ participationId: id, userId: participation.userId, status: 'success' });
      } catch (err: any) {
        failed++;
        details.push({ participationId: id, userId: '-', status: 'failed', reason: err.message || '操作失败' });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}*`);

    return { total: participationIds.length, success, failed, skipped, details };
  }

  public async getParticipationList(
    marketingId: string,
    params: PaginationParams & { eligibilityStatus?: ParticipationEligibilityStatus; isAnomaly?: boolean }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize, eligibilityStatus, isAnomaly } = params;
    const { rows, count } = await activityParticipationDao.findAllPaged({
      page,
      pageSize,
      marketingId,
      eligibilityStatus,
      isAnomaly,
    });

    const list = rows.map((row: any) => {
      const plain = row.get({ plain: true });
      return {
        ...plain,
        eligibilityStatusLabel: PARTICIPATION_ELIGIBILITY_STATUS_LABELS[plain.eligibilityStatus as ParticipationEligibilityStatus]?.label || '',
        userTypeLabel: PARTICIPATION_USER_TYPE_LABELS[plain.userType as ParticipationUserType] || '',
        anomalyTypeLabels: (plain.anomalyTypes || []).map((t: ParticipationAnomalyType) => PARTICIPATION_ANOMALY_TYPE_LABELS[t] || t),
      };
    });

    return {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getParticipationLogs(participationId: string, params: PaginationParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await activityParticipationLogDao.findAllPaged({
      page,
      pageSize,
      participationId,
    });

    const list = rows.map((row: any) => {
      const plain = row.get({ plain: true });
      return {
        ...plain,
        recordTypeLabel: PARTICIPATION_RECORD_TYPE_LABELS[plain.recordType as ParticipationRecordType] || '',
        anomalyTypeLabel: plain.anomalyType ? PARTICIPATION_ANOMALY_TYPE_LABELS[plain.anomalyType as ParticipationAnomalyType] || plain.anomalyType : null,
      };
    });

    return {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getParticipationDetail(participationId: string): Promise<any> {
    const cacheKey = `${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }

    const plain = participation.get({ plain: true });
    const logs = await activityParticipationLogDao.findByParticipationId(participationId);

    const result = {
      ...plain,
      eligibilityStatusLabel: PARTICIPATION_ELIGIBILITY_STATUS_LABELS[plain.eligibilityStatus as ParticipationEligibilityStatus]?.label || '',
      userTypeLabel: PARTICIPATION_USER_TYPE_LABELS[plain.userType as ParticipationUserType] || '',
      anomalyTypeLabels: (plain.anomalyTypes || []).map((t: ParticipationAnomalyType) => PARTICIPATION_ANOMALY_TYPE_LABELS[t] || t),
      logs: logs.map((log: any) => {
        const logPlain = log.get({ plain: true });
        return {
          ...logPlain,
          recordTypeLabel: PARTICIPATION_RECORD_TYPE_LABELS[logPlain.recordType as ParticipationRecordType] || '',
          anomalyTypeLabel: logPlain.anomalyType ? PARTICIPATION_ANOMALY_TYPE_LABELS[logPlain.anomalyType as ParticipationAnomalyType] || logPlain.anomalyType : null,
        };
      }),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async verifyParticipationAuthenticity(participationId: string): Promise<ParticipationVerificationResult> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }

    const anomalies: ParticipationVerificationResult['anomalies'] = [];
    let riskScore = 0;

    if (participation.ipAddress) {
      const sameIpRecords = await activityParticipationDao.findByIpAddressAndTimeRange(
        participation.ipAddress,
        dayjs(participation.registeredAt).subtract(1, 'hour').toDate(),
        dayjs(participation.registeredAt).add(1, 'hour').toDate()
      );
      const otherIpRecords = sameIpRecords.filter(r => r.id !== participationId);
      if (otherIpRecords.length >= 3) {
        anomalies.push({
          type: ParticipationAnomalyType.ABNORMAL_IP,
          evidence: `同IP(${participation.ipAddress})在1小时内存在${otherIpRecords.length + 1}条参与记录`,
          confidence: Math.min(0.5 + otherIpRecords.length * 0.1, 1.0),
        });
        riskScore += 30;
      }
    }

    if (participation.deviceFingerprint) {
      const sameDeviceParticipations = await activityParticipationDao.findByUserAndTimeRange(
        participation.userId,
        dayjs(participation.registeredAt).subtract(24, 'hour').toDate(),
        dayjs(participation.registeredAt).add(24, 'hour').toDate()
      );
      const sameDevice = sameDeviceParticipations.filter(
        r => r.deviceFingerprint === participation.deviceFingerprint && r.id !== participationId
      );
      if (sameDevice.length >= 3) {
        anomalies.push({
          type: ParticipationAnomalyType.ABNORMAL_DEVICE,
          evidence: `同设备指纹在24小时内出现${sameDevice.length + 1}次参与`,
          confidence: Math.min(0.4 + sameDevice.length * 0.1, 1.0),
        });
        riskScore += 25;
      }
    }

    if (participation.participantOrders && participation.participantOrders > 0) {
      const allParticipation = await activityParticipationDao.findByMarketingId(participation.marketingId);
      const approved = allParticipation.filter(p => p.eligibilityStatus === ParticipationEligibilityStatus.APPROVED && p.id !== participationId);
      if (approved.length > 0) {
        const avgOrders = approved.reduce((s, p) => s + (p.participantOrders || 0), 0) / approved.length;
        if (avgOrders > 0 && participation.participantOrders > avgOrders * PARTICIPATION_ANOMALY_DETECTION_RULES.abnormalOrderSurgeMultiplier) {
          anomalies.push({
            type: ParticipationAnomalyType.ABNORMAL_ORDER_SURGE,
            evidence: `订单量${participation.participantOrders}为活动平均值${avgOrders.toFixed(1)}的${(participation.participantOrders / avgOrders).toFixed(1)}倍`,
            confidence: Math.min(0.6, 0.3 + (participation.participantOrders / avgOrders - PARTICIPATION_ANOMALY_DETECTION_RULES.abnormalOrderSurgeMultiplier) * 0.1),
          });
          riskScore += 20;
        }
      }

      if (participation.participantReward && participation.participantAmount) {
        const rewardRate = Number(participation.participantReward) / Number(participation.participantAmount);
        if (rewardRate > PARTICIPATION_ANOMALY_DETECTION_RULES.rewardAbuseThreshold) {
          anomalies.push({
            type: ParticipationAnomalyType.REWARD_ABUSE,
            evidence: `奖励占成交额比例${(rewardRate * 100).toFixed(1)}%超过阈值${(PARTICIPATION_ANOMALY_DETECTION_RULES.rewardAbuseThreshold * 100)}%`,
            confidence: Math.min(0.8, 0.5 + (rewardRate - PARTICIPATION_ANOMALY_DETECTION_RULES.rewardAbuseThreshold) * 2),
          });
          riskScore += 25;
        }
      }
    }

    const registrationTime = dayjs(participation.registeredAt);
    const hour = registrationTime.hour();
    if (hour >= 0 && hour < 5) {
      anomalies.push({
        type: ParticipationAnomalyType.HIGH_FREQUENCY_OPERATION,
        evidence: `注册时间在凌晨${hour}点，属于异常时段`,
        confidence: 0.3,
      });
      riskScore += 10;
    }

    riskScore = Math.min(riskScore, 100);

    return {
      isValid: anomalies.length === 0,
      anomalies,
      riskScore,
    };
  }

  public async blockFakeParticipation(participationId: string, operatorId: string): Promise<any> {
    const participation = await activityParticipationDao.findById(participationId);
    if (!participation) {
      throw new AppError('参与记录不存在', BusinessCode.NOT_FOUND);
    }

    const verification = await this.verifyParticipationAuthenticity(participationId);
    if (verification.isValid) {
      throw new AppError('未检测到异常，无法封锁', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const anomalyTypes = verification.anomalies.map(a => a.type);

    return await sequelize.transaction(async (transaction) => {
      const beforeData = {
        eligibilityStatus: participation.eligibilityStatus,
        isAnomaly: participation.isAnomaly,
        isRestricted: participation.isRestricted,
      };

      await activityParticipationDao.update(participationId, {
        eligibilityStatus: ParticipationEligibilityStatus.REVOKED,
        isAnomaly: true,
        anomalyTypes,
        anomalyMarkedAt: new Date(),
        anomalyMarkedBy: operatorId,
        anomalyMarkedReason: '虚假参与封锁',
        isRestricted: true,
        restrictedAt: new Date(),
        restrictedReason: '虚假参与自动限制',
        revokedAt: new Date(),
        revokedBy: operatorId,
        revokeReason: '虚假参与封锁',
      } as any, { transaction });

      const afterData = {
        eligibilityStatus: ParticipationEligibilityStatus.REVOKED,
        isAnomaly: true,
        anomalyTypes,
        isRestricted: true,
      };

      const changes: DataChangeDetail[] = [
        { field: 'eligibilityStatus', oldValue: participation.eligibilityStatus, newValue: ParticipationEligibilityStatus.REVOKED },
        { field: 'isAnomaly', oldValue: participation.isAnomaly, newValue: true },
        { field: 'isRestricted', oldValue: participation.isRestricted, newValue: true },
      ];

      await this.logParticipationRecord({
        participationId,
        marketingId: participation.marketingId,
        userId: participation.userId,
        userType: participation.userType,
        recordType: ParticipationRecordType.REVOKE,
        operatorId,
        operatorName,
        beforeData,
        afterData,
        dataChanges: changes,
        anomalyType: anomalyTypes[0],
        reason: `虚假参与封锁，风险评分${verification.riskScore}`,
      });

      await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION}${participationId}`);
      await CacheUtils.del(`${CacheKey.ACTIVITY_PARTICIPATION_STATS}${participation.marketingId}`);

      return {
        participationId,
        eligibilityStatus: ParticipationEligibilityStatus.REVOKED,
        isAnomaly: true,
        isRestricted: true,
        anomalyTypes,
        riskScore: verification.riskScore,
      };
    });
  }

  private async checkUserLevel(userId: string, userType: ParticipationUserType, marketingId: string): Promise<EligibilityCheckResult> {
    if (userType === ParticipationUserType.PROMOTER) {
      const promoter = await promoterDao.findById(userId);
      if (!promoter) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[0].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[0].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: '推客不存在',
        };
      }

      const marketing = await marketingDao.findById(marketingId);
      const thresholds = (marketing as any)?.participationThresholds;
      if (thresholds) {
        const levelThreshold = thresholds.find((t: any) => t.type === 'level');
        if (levelThreshold && levelThreshold.value) {
          const requiredLevel = levelThreshold.value as PromoterLevel;
          const levelOrder = [PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5];
          const userLevelIndex = levelOrder.indexOf(promoter.level as PromoterLevel);
          const requiredLevelIndex = levelOrder.indexOf(requiredLevel);
          if (userLevelIndex < requiredLevelIndex) {
            return {
              code: PARTICIPATION_ELIGIBILITY_CHECKS[0].code,
              name: PARTICIPATION_ELIGIBILITY_CHECKS[0].name,
              passed: false,
              severity: ValidationSeverity.ERROR,
              message: `推客等级${promoter.level}不满足要求${requiredLevel}`,
            };
          }
        }
      }
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[0].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[0].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async checkRiskControlStatus(userId: string, userType: ParticipationUserType): Promise<EligibilityCheckResult> {
    if (userType === ParticipationUserType.PROMOTER) {
      const promoter = await promoterDao.findById(userId);
      if (!promoter) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[1].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[1].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: '推客不存在',
        };
      }

      const riskControlStatus = (promoter as any).riskControlStatus;
      if (riskControlStatus !== undefined && riskControlStatus !== RiskControlStatus.NORMAL) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[1].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[1].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: '用户处于风控状态，不可参与活动',
        };
      }

      const riskRecords = await promoterRiskRecordDao.findByPromoterId(userId);
      const activeRiskRecords = riskRecords.filter((r: any) => r.isActive);
      if (activeRiskRecords.length > 0) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[1].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[1].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: `用户存在${activeRiskRecords.length}条活跃风控记录`,
        };
      }
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[1].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[1].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async checkBlacklist(userId: string, userType: ParticipationUserType): Promise<EligibilityCheckResult> {
    if (userType === ParticipationUserType.PROMOTER) {
      const promoter = await promoterDao.findById(userId);
      if (!promoter) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[2].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[2].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: '推客不存在',
        };
      }

      const matchResult = await promoterBlacklistDao.checkMatch({
        phone: (promoter as any).phone,
        idCard: (promoter as any).idCard,
        name: promoter.name,
        wechatId: (promoter as any).wechatId,
      });

      if (matchResult.matched) {
        const types = matchResult.items.map(item => {
          const label: Record<string, string> = {
            [BlacklistType.PHONE]: '手机号',
            [BlacklistType.ID_CARD]: '身份证',
            [BlacklistType.NAME]: '姓名',
            [BlacklistType.WECHAT]: '微信号',
          };
          return label[(item as any).type] || (item as any).type;
        });
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[2].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[2].name,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: `用户在黑名单中，匹配类型：${types.join('、')}`,
        };
      }
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[2].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[2].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async checkHistoricalPerformance(userId: string, userType: ParticipationUserType, marketingId: string): Promise<EligibilityCheckResult> {
    if (userType === ParticipationUserType.PROMOTER) {
      const promoter = await promoterDao.findById(userId);
      if (!promoter) {
        return {
          code: PARTICIPATION_ELIGIBILITY_CHECKS[3].code,
          name: PARTICIPATION_ELIGIBILITY_CHECKS[3].name,
          passed: true,
          severity: ValidationSeverity.INFO,
          message: '',
        };
      }

      const marketing = await marketingDao.findById(marketingId);
      const thresholds = (marketing as any)?.participationThresholds;
      if (thresholds) {
        const totalOrdersThreshold = thresholds.find((t: any) => t.type === 'total_orders');
        if (totalOrdersThreshold && totalOrdersThreshold.value) {
          const totalOrders = (promoter as any).totalOrders || 0;
          if (totalOrders < totalOrdersThreshold.value) {
            return {
              code: PARTICIPATION_ELIGIBILITY_CHECKS[3].code,
              name: PARTICIPATION_ELIGIBILITY_CHECKS[3].name,
              passed: false,
              severity: ValidationSeverity.WARNING,
              message: `累计订单数${totalOrders}不满足要求${totalOrdersThreshold.value}`,
            };
          }
        }

        const totalAmountThreshold = thresholds.find((t: any) => t.type === 'total_amount');
        if (totalAmountThreshold && totalAmountThreshold.value) {
          const totalAmount = Number((promoter as any).totalAmount || 0);
          if (totalAmount < totalAmountThreshold.value) {
            return {
              code: PARTICIPATION_ELIGIBILITY_CHECKS[3].code,
              name: PARTICIPATION_ELIGIBILITY_CHECKS[3].name,
              passed: false,
              severity: ValidationSeverity.WARNING,
              message: `累计成交额${totalAmount}不满足要求${totalAmountThreshold.value}`,
            };
          }
        }
      }
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[3].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[3].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async checkDuplicateParticipation(marketingId: string, userId: string): Promise<EligibilityCheckResult> {
    const existing = await activityParticipationDao.findByMarketingAndUser(marketingId, userId);
    if (existing && existing.eligibilityStatus !== ParticipationEligibilityStatus.REVOKED) {
      return {
        code: PARTICIPATION_ELIGIBILITY_CHECKS[4].code,
        name: PARTICIPATION_ELIGIBILITY_CHECKS[4].name,
        passed: false,
        severity: ValidationSeverity.ERROR,
        message: '用户已参与该活动，不可重复参与',
      };
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[4].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[4].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async checkActivityStatus(marketingId: string): Promise<EligibilityCheckResult> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      return {
        code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code,
        name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name,
        passed: false,
        severity: ValidationSeverity.ERROR,
        message: '活动不存在',
      };
    }

    if (marketing.status !== MarketingStatus.ONGOING) {
      const statusLabel = MARKETING_STATUS_LABELS[marketing.status as MarketingStatus];
      return {
        code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code,
        name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name,
        passed: false,
        severity: ValidationSeverity.ERROR,
        message: `活动状态为${statusLabel?.label || marketing.status}，不可参与`,
      };
    }

    const now = dayjs();
    if (marketing.endTime && now.isAfter(dayjs(marketing.endTime))) {
      return {
        code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code,
        name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name,
        passed: false,
        severity: ValidationSeverity.ERROR,
        message: '活动已结束',
      };
    }

    if (marketing.startTime && now.isBefore(dayjs(marketing.startTime))) {
      return {
        code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code,
        name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name,
        passed: false,
        severity: ValidationSeverity.ERROR,
        message: '活动未开始',
      };
    }

    return {
      code: PARTICIPATION_ELIGIBILITY_CHECKS[5].code,
      name: PARTICIPATION_ELIGIBILITY_CHECKS[5].name,
      passed: true,
      severity: ValidationSeverity.INFO,
      message: '',
    };
  }

  private async logParticipationRecord(params: {
    participationId: string;
    marketingId: string;
    userId: string;
    userType: ParticipationUserType;
    recordType: ParticipationRecordType;
    operatorId?: string;
    operatorName?: string;
    beforeData?: any;
    afterData?: any;
    dataChanges?: DataChangeDetail[];
    anomalyType?: ParticipationAnomalyType;
    reason?: string;
  }): Promise<void> {
    const logData: ActivityParticipationLogCreationAttributes = {
      participationId: params.participationId,
      marketingId: params.marketingId,
      userId: params.userId,
      userType: params.userType,
      recordType: params.recordType,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      beforeData: params.beforeData,
      afterData: params.afterData,
      dataChanges: params.dataChanges,
      anomalyType: params.anomalyType,
      reason: params.reason,
    } as any;

    await activityParticipationLogDao.create(logData);
  }

  private async calculateAnomalyRate(marketingId: string): Promise<number> {
    const total = await activityParticipationDao.countByMarketingId(marketingId);
    if (total === 0) return 0;
    const anomalyCount = await activityParticipationDao.countAnomalyByMarketingId(marketingId);
    return anomalyCount / total;
  }

  private async acquireParticipationLock(userId: string): Promise<string | null> {
    const lockKey = `${CacheKey.ACTIVITY_PARTICIPATION_LOCK}${userId}`;
    const lockValue = `${userId}_${Date.now()}`;
    const exists = await CacheUtils.exists(lockKey);
    if (exists) return null;
    await CacheUtils.set(lockKey, lockValue, CacheTTL.SHORT);
    return lockValue;
  }

  private async releaseParticipationLock(userId: string, lockValue: string): Promise<void> {
    const lockKey = `${CacheKey.ACTIVITY_PARTICIPATION_LOCK}${userId}`;
    const current = await CacheUtils.get<string>(lockKey);
    if (current === lockValue) {
      await CacheUtils.del(lockKey);
    }
  }
}

export default new ParticipationRiskControlService();
