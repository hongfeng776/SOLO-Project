import { rewardWriteOffDao, rewardWriteOffLogDao, marketingDao, activityParticipationDao, promoterDao, userDao, promoterBlacklistDao, promoterRiskRecordDao, commissionDao } from '../dao';
import { WriteOffVerificationResult, RewardWriteOffCreationAttributes } from '../models/RewardWriteOff.model';
import { RewardWriteOffLogCreationAttributes } from '../models/RewardWriteOffLog.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  RewardWriteOffStatus,
  REWARD_WRITE_OFF_STATUS_LABELS,
  RewardWriteOffType,
  REWARD_WRITE_OFF_TYPE_LABELS,
  REWARD_WRITE_OFF_VERIFICATION_CHECKS,
  WriteOffVerificationSeverity,
  WriteOffLogType,
  WRITE_OFF_LOG_TYPE_LABELS,
  REWARD_WRITE_OFF_RULES,
  ParticipationEligibilityStatus,
  ParticipationUserType,
  RiskControlStatus,
  BlacklistType,
  RewardRuleType,
} from '../constants/enum';
import { sequelize } from '../config/database';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';
import { Op, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface WriteOffVerificationFullResult {
  passed: boolean;
  checks: WriteOffVerificationResult[];
  blockReason?: string;
  canSettle: boolean;
}

export interface WriteOffStats {
  marketingId?: string;
  totalCount: number;
  pendingCount: number;
  verifiedCount: number;
  settledCount: number;
  cancelledCount: number;
  failedCount: number;
  totalAmount: number;
  settledAmount: number;
  pendingAmount: number;
  todayCount: number;
  todayAmount: number;
}

export interface BatchWriteOffResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  totalAmount: number;
  successAmount: number;
  failedAmount: number;
  details: { writeOffId: string; writeOffNo: string; status: 'success' | 'failed' | 'skipped'; reason?: string; amount?: number }[];
}

export interface WriteOffReport {
  generatedAt: Date;
  period: { startTime: Date; endTime: Date };
  summary: WriteOffStats;
  byType: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  headers: string[];
  rows: string[][];
}

class RewardWriteOffService {
  public async getWriteOffList(params: PaginationParams & {
    marketingId?: string;
    userId?: string;
    userType?: string;
    type?: RewardWriteOffType;
    status?: RewardWriteOffStatus;
    writeOffNo?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await rewardWriteOffDao.findAllPaged({
      page,
      pageSize,
      marketingId: params.marketingId,
      userId: params.userId,
      userType: params.userType,
      type: params.type,
      status: params.status,
      writeOffNo: params.writeOffNo,
      startTime: params.startTime,
      endTime: params.endTime,
    } as any);

    const list = rows.map((row: any) => {
      const plain = row.get({ plain: true });
      return {
        ...plain,
        statusLabel: REWARD_WRITE_OFF_STATUS_LABELS[plain.status as RewardWriteOffStatus]?.label || '',
        typeLabel: REWARD_WRITE_OFF_TYPE_LABELS[plain.type as RewardWriteOffType] || '',
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

  public async getWriteOffDetail(writeOffId: string): Promise<any> {
    const cacheKey = `${CacheKey.REWARD_WRITE_OFF}${writeOffId}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const writeOff = await rewardWriteOffDao.findById(writeOffId);
    if (!writeOff) {
      throw new AppError('核销记录不存在', BusinessCode.NOT_FOUND);
    }

    const plain = writeOff.get({ plain: true });
    const logs = await rewardWriteOffLogDao.findByWriteOffId(writeOffId);

    let marketing: any = null;
    let participation: any = null;
    let userInfo: any = null;

    if (plain.marketingId) {
      const m = await marketingDao.findById(plain.marketingId);
      marketing = m ? m.get({ plain: true }) : null;
    }

    if (plain.participationId) {
      const p = await activityParticipationDao.findById(plain.participationId);
      participation = p ? p.get({ plain: true }) : null;
    }

    if (plain.userId) {
      if (plain.userType === ParticipationUserType.PROMOTER) {
        const p = await promoterDao.findById(plain.userId);
        userInfo = p ? { id: p.id, name: (p as any).name, code: (p as any).code } : null;
      } else {
        const u = await userDao.findById(plain.userId);
        userInfo = u ? { id: u.id, username: (u as any).username, nickname: (u as any).nickname } : null;
      }
    }

    const result = {
      ...plain,
      statusLabel: REWARD_WRITE_OFF_STATUS_LABELS[plain.status as RewardWriteOffStatus]?.label || '',
      typeLabel: REWARD_WRITE_OFF_TYPE_LABELS[plain.type as RewardWriteOffType] || '',
      logs,
      marketing,
      participation,
      userInfo,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async createWriteOff(params: RewardWriteOffCreationAttributes & { operatorId?: string }): Promise<any> {
    const writeOffNo = this.generateWriteOffNo();
    const actualAmount = params.rewardAmount || 0;

    const transaction: Transaction = await sequelize.transaction();

    try {
      const writeOff = await rewardWriteOffDao.create({
        ...params,
        writeOffNo,
        actualAmount,
        status: RewardWriteOffStatus.PENDING,
      }, { transaction });

      const operator = params.operatorId ? await userDao.findById(params.operatorId) : null;
      const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

      await this.logWriteOffChange({
        writeOffId: writeOff.id,
        writeOffNo: writeOff.writeOffNo,
        logType: WriteOffLogType.VERIFY,
        beforeStatus: RewardWriteOffStatus.PENDING,
        afterStatus: RewardWriteOffStatus.PENDING,
        operatorId: params.operatorId,
        operatorName,
        beforeAmount: 0,
        afterAmount: actualAmount,
        remark: '创建核销记录',
      }, transaction);

      const verification = await this.verifyWriteOff(writeOff.id);

      let finalStatus = RewardWriteOffStatus.PENDING;
      if (verification.passed && actualAmount < REWARD_WRITE_OFF_RULES.writeOffAutoVerifyThreshold) {
        finalStatus = RewardWriteOffStatus.VERIFIED;
        await rewardWriteOffDao.update(writeOff.id, {
          status: finalStatus,
          verificationResults: verification.checks,
          verifiedAt: new Date(),
        }, { transaction });

        await this.logWriteOffChange({
          writeOffId: writeOff.id,
          writeOffNo: writeOff.writeOffNo,
          logType: WriteOffLogType.VERIFY,
          beforeStatus: RewardWriteOffStatus.PENDING,
          afterStatus: finalStatus,
          operatorId: params.operatorId,
          operatorName,
          beforeAmount: actualAmount,
          afterAmount: actualAmount,
          verificationResults: verification.checks,
          remark: '系统自动复核通过',
        }, transaction);
      } else if (!verification.passed) {
        finalStatus = RewardWriteOffStatus.FAILED;
        await rewardWriteOffDao.update(writeOff.id, {
          status: finalStatus,
          verificationResults: verification.checks,
          failedReason: verification.blockReason,
        }, { transaction });

        await this.logWriteOffChange({
          writeOffId: writeOff.id,
          writeOffNo: writeOff.writeOffNo,
          logType: WriteOffLogType.FAIL,
          beforeStatus: RewardWriteOffStatus.PENDING,
          afterStatus: finalStatus,
          operatorId: params.operatorId,
          operatorName,
          beforeAmount: actualAmount,
          afterAmount: actualAmount,
          verificationResults: verification.checks,
          reason: verification.blockReason,
          remark: '核销校验失败',
        }, transaction);
      } else {
        await rewardWriteOffDao.update(writeOff.id, {
          verificationResults: verification.checks,
        }, { transaction });
      }

      await transaction.commit();

      await CacheUtils.del(`${CacheKey.REWARD_WRITE_OFF}${writeOff.id}`);
      await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

      return this.getWriteOffDetail(writeOff.id);
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }

  public async verifyWriteOff(writeOffId: string): Promise<WriteOffVerificationFullResult> {
    const writeOff = await rewardWriteOffDao.findById(writeOffId);
    if (!writeOff) {
      throw new AppError('核销记录不存在', BusinessCode.NOT_FOUND);
    }

    const checks: WriteOffVerificationResult[] = [];

    const check1 = await this.checkParticipationEligibility(writeOff.participationId);
    checks.push(check1);

    const check2 = await this.checkDataAchievement(writeOffId);
    checks.push(check2);

    const check3 = await this.checkDataAuthenticity(writeOff.participationId);
    checks.push(check3);

    const check4 = await this.checkUserRiskControl(writeOff.userId, writeOff.userType);
    checks.push(check4);

    const check5 = await this.checkDuplicateWriteOff(writeOff.marketingId, writeOff.participationId, writeOff.orderId);
    checks.push(check5);

    const check6 = await this.checkOverAmount(writeOff);
    checks.push(check6);

    const check7 = await this.checkActivityRule(writeOff, writeOff.marketingId);
    checks.push(check7);

    const errorChecks = checks.filter(c => c.severity === WriteOffVerificationSeverity.ERROR && !c.passed);
    const warningChecks = checks.filter(c => c.severity === WriteOffVerificationSeverity.WARNING && !c.passed);

    const passed = errorChecks.length === 0;
    const canSettle = passed;

    let blockReason: string | undefined;
    if (!passed) {
      blockReason = errorChecks.map(c => c.message).join('；');
    } else if (warningChecks.length > 0) {
      blockReason = warningChecks.map(c => c.message).join('；');
    }

    return {
      passed,
      checks,
      blockReason,
      canSettle,
    };
  }

  public async settleWriteOff(writeOffId: string, operatorId: string): Promise<any> {
    const lockValue = uuidv4();
    const lockAcquired = await this.acquireWriteOffLock(writeOffId, lockValue);
    if (!lockAcquired) {
      throw new AppError('核销正在处理中，请稍后再试', BusinessCode.ERROR);
    }

    try {
      const writeOff = await rewardWriteOffDao.findById(writeOffId);
      if (!writeOff) {
        throw new AppError('核销记录不存在', BusinessCode.NOT_FOUND);
      }

      if (writeOff.status === RewardWriteOffStatus.SETTLED) {
        throw new AppError('该核销已发放，不可重复操作', BusinessCode.ERROR);
      }

      if (writeOff.status === RewardWriteOffStatus.CANCELLED || writeOff.status === RewardWriteOffStatus.OVERRIDDEN) {
        throw new AppError('该核销已作废/冲正，不可发放', BusinessCode.ERROR);
      }

      if (writeOff.status === RewardWriteOffStatus.FAILED) {
        throw new AppError('该核销已失败，不可发放', BusinessCode.ERROR);
      }

      const verification = await this.verifyWriteOff(writeOffId);
      if (!verification.canSettle) {
        throw new AppError(`核销校验未通过：${verification.blockReason}`, BusinessCode.ERROR);
      }

      const transaction: Transaction = await sequelize.transaction();

      try {
        const operator = await userDao.findById(operatorId);
        const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

        const voucherNo = this.generateVoucherNo();
        const beforeStatus = writeOff.status;
        const settleAmount = Number(writeOff.actualAmount);

        await rewardWriteOffDao.update(writeOffId, {
          status: RewardWriteOffStatus.SETTLED,
          settledAt: new Date(),
          settledBy: operatorId,
          settleRemark: '手动核销发放',
          voucherNo,
          verificationResults: verification.checks,
        }, { transaction });

        if (writeOff.userType === ParticipationUserType.PROMOTER) {
          const promoter = await promoterDao.findById(writeOff.userId);
          if (promoter) {
            const currentAvailable = Number((promoter as any).availableCommission || 0);
            await promoterDao.update(
              { availableCommission: currentAvailable + settleAmount } as any,
              { where: { id: writeOff.userId }, transaction }
            );
          }
        }

        await this.logWriteOffChange({
          writeOffId,
          writeOffNo: writeOff.writeOffNo,
          logType: WriteOffLogType.SETTLE,
          beforeStatus,
          afterStatus: RewardWriteOffStatus.SETTLED,
          operatorId,
          operatorName,
          beforeAmount: settleAmount,
          afterAmount: settleAmount,
          verificationResults: verification.checks,
          remark: '手动核销发放',
        }, transaction);

        await transaction.commit();

        await CacheUtils.del(`${CacheKey.REWARD_WRITE_OFF}${writeOffId}`);
        await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

        return this.getWriteOffDetail(writeOffId);
      } catch (error: any) {
        await transaction.rollback();
        throw error;
      }
    } finally {
      await this.releaseWriteOffLock(writeOffId, lockValue);
    }
  }

  public async settleWriteOffBatch(writeOffIds: string[], operatorId: string): Promise<BatchWriteOffResult> {
    if (!writeOffIds || writeOffIds.length === 0) {
      throw new AppError('请选择要核销的记录', BusinessCode.PARAM_ERROR);
    }

    const details: BatchWriteOffResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let successAmount = 0;
    let failedAmount = 0;
    let totalAmount = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

    for (const writeOffId of writeOffIds) {
      try {
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        if (!writeOff) {
          skipped++;
          details.push({ writeOffId, writeOffNo: '-', status: 'skipped', reason: '核销记录不存在' });
          continue;
        }

        const amount = Number(writeOff.actualAmount || 0);
        totalAmount += amount;

        if (writeOff.status === RewardWriteOffStatus.SETTLED) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '已核销发放', amount });
          continue;
        }

        if (writeOff.status === RewardWriteOffStatus.CANCELLED || writeOff.status === RewardWriteOffStatus.OVERRIDDEN) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '已作废/冲正', amount });
          continue;
        }

        if (writeOff.status === RewardWriteOffStatus.FAILED) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '已失败', amount });
          continue;
        }

        const verification = await this.verifyWriteOff(writeOffId);
        if (!verification.canSettle) {
          failed++;
          failedAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: verification.blockReason || '校验未通过', amount });
          continue;
        }

        const lockValue = uuidv4();
        const lockAcquired = await this.acquireWriteOffLock(writeOffId, lockValue);
        if (!lockAcquired) {
          failed++;
          failedAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: '处理中，稍后重试', amount });
          continue;
        }

        try {
          const transaction: Transaction = await sequelize.transaction();

          try {
            const voucherNo = this.generateVoucherNo();
            const beforeStatus = writeOff.status;
            const settleAmount = Number(writeOff.actualAmount);

            await rewardWriteOffDao.update(writeOffId, {
              status: RewardWriteOffStatus.SETTLED,
              settledAt: new Date(),
              settledBy: operatorId,
              settleRemark: '批量核销发放',
              voucherNo,
              verificationResults: verification.checks,
            }, { transaction });

            if (writeOff.userType === ParticipationUserType.PROMOTER) {
              const promoter = await promoterDao.findById(writeOff.userId);
              if (promoter) {
                const currentAvailable = Number((promoter as any).availableCommission || 0);
                await promoterDao.update(
                  { availableCommission: currentAvailable + settleAmount } as any,
                  { where: { id: writeOff.userId }, transaction }
                );
              }
            }

            await this.logWriteOffChange({
              writeOffId,
              writeOffNo: writeOff.writeOffNo,
              logType: WriteOffLogType.BATCH_SETTLE,
              beforeStatus,
              afterStatus: RewardWriteOffStatus.SETTLED,
              operatorId,
              operatorName,
              beforeAmount: settleAmount,
              afterAmount: settleAmount,
              verificationResults: verification.checks,
              remark: '批量核销发放',
            }, transaction);

            await transaction.commit();

            success++;
            successAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'success', amount });
          } catch (error: any) {
            await transaction.rollback();
            failed++;
            failedAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: error.message, amount });
          }
        } finally {
          await this.releaseWriteOffLock(writeOffId, lockValue);
        }
      } catch (err: any) {
        failed++;
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        const writeOffNo = writeOff?.writeOffNo || '-';
        const amount = writeOff ? Number(writeOff.actualAmount || 0) : 0;
        totalAmount += amount;
        failedAmount += amount;
        details.push({ writeOffId, writeOffNo, status: 'failed', reason: err.message || '操作失败', amount });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF}*`);
    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

    return {
      total: writeOffIds.length,
      success,
      failed,
      skipped,
      totalAmount,
      successAmount,
      failedAmount,
      details,
    };
  }

  public async batchVerify(writeOffIds: string[], operatorId: string): Promise<BatchWriteOffResult> {
    if (!writeOffIds || writeOffIds.length === 0) {
      throw new AppError('请选择要复核的记录', BusinessCode.PARAM_ERROR);
    }

    const details: BatchWriteOffResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let successAmount = 0;
    let failedAmount = 0;
    let totalAmount = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

    for (const writeOffId of writeOffIds) {
      try {
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        if (!writeOff) {
          skipped++;
          details.push({ writeOffId, writeOffNo: '-', status: 'skipped', reason: '核销记录不存在' });
          continue;
        }

        const amount = Number(writeOff.actualAmount || 0);
        totalAmount += amount;

        if (writeOff.status !== RewardWriteOffStatus.PENDING) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '非待核销状态', amount });
          continue;
        }

        const verification = await this.verifyWriteOff(writeOffId);

        const transaction: Transaction = await sequelize.transaction();

        try {
          if (verification.passed) {
            await rewardWriteOffDao.update(writeOffId, {
              status: RewardWriteOffStatus.VERIFIED,
              verifiedAt: new Date(),
              verifiedBy: operatorId,
              verifiedRemark: '批量复核通过',
              verificationResults: verification.checks,
            }, { transaction });

            await this.logWriteOffChange({
              writeOffId,
              writeOffNo: writeOff.writeOffNo,
              logType: WriteOffLogType.BATCH_VERIFY,
              beforeStatus: RewardWriteOffStatus.PENDING,
              afterStatus: RewardWriteOffStatus.VERIFIED,
              operatorId,
              operatorName,
              beforeAmount: amount,
              afterAmount: amount,
              verificationResults: verification.checks,
              remark: '批量复核通过',
            }, transaction);

            await transaction.commit();

            success++;
            successAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'success', amount });
          } else {
            await rewardWriteOffDao.update(writeOffId, {
              status: RewardWriteOffStatus.FAILED,
              verificationResults: verification.checks,
              failedReason: verification.blockReason,
            }, { transaction });

            await this.logWriteOffChange({
              writeOffId,
              writeOffNo: writeOff.writeOffNo,
              logType: WriteOffLogType.FAIL,
              beforeStatus: RewardWriteOffStatus.PENDING,
              afterStatus: RewardWriteOffStatus.FAILED,
              operatorId,
              operatorName,
              beforeAmount: amount,
              afterAmount: amount,
              verificationResults: verification.checks,
              reason: verification.blockReason,
              remark: '批量复核不通过',
            }, transaction);

            await transaction.commit();

            failed++;
            failedAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: verification.blockReason, amount });
          }
        } catch (error: any) {
          await transaction.rollback();
          failed++;
          failedAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: error.message, amount });
        }
      } catch (err: any) {
        failed++;
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        const writeOffNo = writeOff?.writeOffNo || '-';
        const amount = writeOff ? Number(writeOff.actualAmount || 0) : 0;
        totalAmount += amount;
        failedAmount += amount;
        details.push({ writeOffId, writeOffNo, status: 'failed', reason: err.message || '操作失败', amount });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF}*`);
    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

    return {
      total: writeOffIds.length,
      success,
      failed,
      skipped,
      totalAmount,
      successAmount,
      failedAmount,
      details,
    };
  }

  public async batchCancel(writeOffIds: string[], operatorId: string, reason: string): Promise<BatchWriteOffResult> {
    if (!writeOffIds || writeOffIds.length === 0) {
      throw new AppError('请选择要作废的记录', BusinessCode.PARAM_ERROR);
    }

    if (!reason || reason.trim() === '') {
      throw new AppError('请填写作废原因', BusinessCode.PARAM_ERROR);
    }

    const details: BatchWriteOffResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let successAmount = 0;
    let failedAmount = 0;
    let totalAmount = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

    for (const writeOffId of writeOffIds) {
      try {
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        if (!writeOff) {
          skipped++;
          details.push({ writeOffId, writeOffNo: '-', status: 'skipped', reason: '核销记录不存在' });
          continue;
        }

        const amount = Number(writeOff.actualAmount || 0);
        totalAmount += amount;

        if (writeOff.status !== RewardWriteOffStatus.PENDING && writeOff.status !== RewardWriteOffStatus.VERIFIED) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '仅待核销/待发放状态可作废', amount });
          continue;
        }

        const transaction: Transaction = await sequelize.transaction();

        try {
          const beforeStatus = writeOff.status;

          await rewardWriteOffDao.update(writeOffId, {
            status: RewardWriteOffStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: operatorId,
            cancelReason: reason,
          }, { transaction });

          await this.logWriteOffChange({
            writeOffId,
            writeOffNo: writeOff.writeOffNo,
            logType: WriteOffLogType.BATCH_CANCEL,
            beforeStatus,
            afterStatus: RewardWriteOffStatus.CANCELLED,
            operatorId,
            operatorName,
            beforeAmount: amount,
            afterAmount: amount,
            reason,
            remark: '批量作废',
          }, transaction);

          await transaction.commit();

          success++;
          successAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'success', amount });
        } catch (error: any) {
          await transaction.rollback();
          failed++;
          failedAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: error.message, amount });
        }
      } catch (err: any) {
        failed++;
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        const writeOffNo = writeOff?.writeOffNo || '-';
        const amount = writeOff ? Number(writeOff.actualAmount || 0) : 0;
        totalAmount += amount;
        failedAmount += amount;
        details.push({ writeOffId, writeOffNo, status: 'failed', reason: err.message || '操作失败', amount });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF}*`);
    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

    return {
      total: writeOffIds.length,
      success,
      failed,
      skipped,
      totalAmount,
      successAmount,
      failedAmount,
      details,
    };
  }

  public async batchOverride(writeOffIds: string[], operatorId: string, reason: string): Promise<BatchWriteOffResult> {
    if (!writeOffIds || writeOffIds.length === 0) {
      throw new AppError('请选择要冲正的记录', BusinessCode.PARAM_ERROR);
    }

    if (!reason || reason.trim() === '') {
      throw new AppError('请填写冲正原因', BusinessCode.PARAM_ERROR);
    }

    const details: BatchWriteOffResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let successAmount = 0;
    let failedAmount = 0;
    let totalAmount = 0;

    const operator = await userDao.findById(operatorId);
    const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

    for (const writeOffId of writeOffIds) {
      try {
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        if (!writeOff) {
          skipped++;
          details.push({ writeOffId, writeOffNo: '-', status: 'skipped', reason: '核销记录不存在' });
          continue;
        }

        const amount = Number(writeOff.actualAmount || 0);
        totalAmount += amount;

        if (writeOff.status !== RewardWriteOffStatus.SETTLED) {
          skipped++;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'skipped', reason: '仅已核销状态可冲正', amount });
          continue;
        }

        const lockValue = uuidv4();
        const lockAcquired = await this.acquireWriteOffLock(writeOffId, lockValue);
        if (!lockAcquired) {
          failed++;
          failedAmount += amount;
          details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: '处理中，稍后重试', amount });
          continue;
        }

        try {
          const transaction: Transaction = await sequelize.transaction();

          try {
            await rewardWriteOffDao.update(writeOffId, {
              status: RewardWriteOffStatus.OVERRIDDEN,
              overriddenAt: new Date(),
              overriddenBy: operatorId,
              overrideReason: reason,
            }, { transaction });

            if (writeOff.userType === ParticipationUserType.PROMOTER) {
              const promoter = await promoterDao.findById(writeOff.userId);
              if (promoter) {
                const currentAvailable = Number((promoter as any).availableCommission || 0);
                const newAvailable = Math.max(0, currentAvailable - amount);
                await promoterDao.update(
                  { availableCommission: newAvailable } as any,
                  { where: { id: writeOff.userId }, transaction }
                );
              }
            }

            await this.logWriteOffChange({
              writeOffId,
              writeOffNo: writeOff.writeOffNo,
              logType: WriteOffLogType.BATCH_OVERRIDE,
              beforeStatus: RewardWriteOffStatus.SETTLED,
              afterStatus: RewardWriteOffStatus.OVERRIDDEN,
              operatorId,
              operatorName,
              beforeAmount: amount,
              afterAmount: 0,
              reason,
              remark: '批量冲正',
            }, transaction);

            await transaction.commit();

            success++;
            successAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'success', amount });
          } catch (error: any) {
            await transaction.rollback();
            failed++;
            failedAmount += amount;
            details.push({ writeOffId, writeOffNo: writeOff.writeOffNo, status: 'failed', reason: error.message, amount });
          }
        } finally {
          await this.releaseWriteOffLock(writeOffId, lockValue);
        }
      } catch (err: any) {
        failed++;
        const writeOff = await rewardWriteOffDao.findById(writeOffId);
        const writeOffNo = writeOff?.writeOffNo || '-';
        const amount = writeOff ? Number(writeOff.actualAmount || 0) : 0;
        totalAmount += amount;
        failedAmount += amount;
        details.push({ writeOffId, writeOffNo, status: 'failed', reason: err.message || '操作失败', amount });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF}*`);
    await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

    return {
      total: writeOffIds.length,
      success,
      failed,
      skipped,
      totalAmount,
      successAmount,
      failedAmount,
      details,
    };
  }

  public async getWriteOffLogs(writeOffId: string, params: PaginationParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await rewardWriteOffLogDao.findAllPaged({
      writeOffId,
      page,
      pageSize,
    } as any);

    const logs = rows.map((log: any) => {
      const plain = log.get({ plain: true });
      return {
        ...plain,
        logTypeLabel: WRITE_OFF_LOG_TYPE_LABELS[plain.logType as WriteOffLogType] || '',
      };
    });

    return {
      list: logs,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async checkWriteOffCompliance(writeOffId: string): Promise<WriteOffVerificationFullResult> {
    return this.verifyWriteOff(writeOffId);
  }

  public async blockNonCompliantWriteOff(writeOffId: string, operatorId: string, reason: string): Promise<any> {
    const writeOff = await rewardWriteOffDao.findById(writeOffId);
    if (!writeOff) {
      throw new AppError('核销记录不存在', BusinessCode.NOT_FOUND);
    }

    if (writeOff.status === RewardWriteOffStatus.SETTLED || writeOff.status === RewardWriteOffStatus.CANCELLED || writeOff.status === RewardWriteOffStatus.OVERRIDDEN) {
      throw new AppError('该核销状态不可拦截', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = operator ? ((operator as any)?.nickname || (operator as any)?.username || '系统') : '系统';

    const transaction: Transaction = await sequelize.transaction();

    try {
      const beforeStatus = writeOff.status;

      await rewardWriteOffDao.update(writeOffId, {
        status: RewardWriteOffStatus.FAILED,
        failedReason: reason,
      }, { transaction });

      await this.logWriteOffChange({
        writeOffId,
        writeOffNo: writeOff.writeOffNo,
        logType: WriteOffLogType.FAIL,
        beforeStatus,
        afterStatus: RewardWriteOffStatus.FAILED,
        operatorId,
        operatorName,
        beforeAmount: Number(writeOff.actualAmount || 0),
        afterAmount: Number(writeOff.actualAmount || 0),
        reason,
        remark: '合规拦截',
      }, transaction);

      await transaction.commit();

      await CacheUtils.del(`${CacheKey.REWARD_WRITE_OFF}${writeOffId}`);
      await CacheUtils.delPattern(`${CacheKey.REWARD_WRITE_OFF_STATS}*`);

      return this.getWriteOffDetail(writeOffId);
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }

  public async getWriteOffStats(marketingId?: string): Promise<WriteOffStats> {
    const cacheKey = `${CacheKey.REWARD_WRITE_OFF_STATS}${marketingId || 'all'}`;
    const cached = await CacheUtils.get<WriteOffStats>(cacheKey);
    if (cached) return cached;

    const allStatuses = [
      RewardWriteOffStatus.PENDING,
      RewardWriteOffStatus.VERIFIED,
      RewardWriteOffStatus.SETTLED,
      RewardWriteOffStatus.CANCELLED,
      RewardWriteOffStatus.FAILED,
    ];

    let totalCount = 0;
    let pendingCount = 0;
    let verifiedCount = 0;
    let settledCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    let totalAmount = 0;
    let settledAmount = 0;
    let pendingAmount = 0;
    let todayCount = 0;
    let todayAmount = 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    for (const status of allStatuses) {
      const count = marketingId
        ? await rewardWriteOffDao.countByMarketingAndStatus(marketingId, status)
        : await this.countByStatus(status);

      const amount = marketingId
        ? await rewardWriteOffDao.sumAmountByMarketingAndStatus(marketingId, status)
        : await this.sumAmountByStatus(status);

      totalCount += count;
      totalAmount += amount;

      switch (status) {
        case RewardWriteOffStatus.PENDING:
          pendingCount = count;
          pendingAmount += amount;
          break;
        case RewardWriteOffStatus.VERIFIED:
          verifiedCount = count;
          pendingAmount += amount;
          break;
        case RewardWriteOffStatus.SETTLED:
          settledCount = count;
          settledAmount = amount;
          break;
        case RewardWriteOffStatus.CANCELLED:
          cancelledCount = count;
          break;
        case RewardWriteOffStatus.FAILED:
          failedCount = count;
          break;
      }
    }

    const todayStats = await this.getTodayStats(marketingId);
    todayCount = todayStats.count;
    todayAmount = todayStats.amount;

    const stats: WriteOffStats = {
      marketingId,
      totalCount,
      pendingCount,
      verifiedCount,
      settledCount,
      cancelledCount,
      failedCount,
      totalAmount,
      settledAmount,
      pendingAmount,
      todayCount,
      todayAmount,
    };

    await CacheUtils.set(cacheKey, stats, CacheTTL.SHORT);
    return stats;
  }

  public async generateWriteOffReport(startTime: Date, endTime: Date, marketingId?: string): Promise<WriteOffReport> {
    const summary = await this.getStatsByPeriod(startTime, endTime, marketingId);

    const byType: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, { count: number; amount: number }> = {};

    for (const type of Object.values(RewardWriteOffType)) {
      const stats = await this.getStatsByTypeAndPeriod(type, startTime, endTime, marketingId);
      byType[type] = {
        count: stats.count,
        amount: stats.amount,
      };
    }

    for (const status of Object.values(RewardWriteOffStatus)) {
      const stats = await this.getStatsByStatusAndPeriod(status as number, startTime, endTime, marketingId);
      byStatus[String(status)] = {
        count: stats.count,
        amount: stats.amount,
      };
    }

    const headers = [
      '核销单号',
      '活动名称',
      '用户类型',
      '核销类型',
      '奖励金额',
      '实际金额',
      '状态',
      '创建时间',
      '核销时间',
      '凭证号',
      '操作人',
    ];

    const rows: string[][] = [];
    const list = await this.getWriteOffsByPeriod(startTime, endTime, marketingId);

    for (const item of list) {
      rows.push([
        item.writeOffNo || '',
        (item as any).marketingName || '',
        item.userType || '',
        REWARD_WRITE_OFF_TYPE_LABELS[item.type as RewardWriteOffType] || '',
        String(item.rewardAmount || 0),
        String(item.actualAmount || 0),
        REWARD_WRITE_OFF_STATUS_LABELS[item.status as RewardWriteOffStatus]?.label || '',
        item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
        item.settledAt ? dayjs(item.settledAt).format('YYYY-MM-DD HH:mm:ss') : '',
        item.voucherNo || '',
        (item as any).settledByName || '',
      ]);
    }

    return {
      generatedAt: new Date(),
      period: { startTime, endTime },
      summary,
      byType,
      byStatus,
      headers,
      rows,
    };
  }

  private generateWriteOffNo(): string {
    const dateStr = dayjs().format('YYYYMMDD');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `RW${dateStr}${random}`;
  }

  private generateVoucherNo(): string {
    const dateStr = dayjs().format('YYYYMMDD');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `VC${dateStr}${random}`;
  }

  private async logWriteOffChange(params: {
    writeOffId: string;
    writeOffNo: string;
    logType: WriteOffLogType;
    beforeStatus: number;
    afterStatus: number;
    operatorId?: string;
    operatorName?: string;
    beforeAmount?: number;
    afterAmount?: number;
    verificationResults?: WriteOffVerificationResult[];
    remark?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }, transaction?: Transaction): Promise<void> {
    await rewardWriteOffLogDao.create({
      writeOffId: params.writeOffId,
      writeOffNo: params.writeOffNo,
      logType: params.logType,
      beforeStatus: params.beforeStatus,
      afterStatus: params.afterStatus,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      beforeAmount: params.beforeAmount,
      afterAmount: params.afterAmount,
      verificationResults: params.verificationResults,
      remark: params.remark,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    } as RewardWriteOffLogCreationAttributes, transaction ? { transaction } : undefined);
  }

  private async acquireWriteOffLock(writeOffId: string, lockValue: string): Promise<boolean> {
    const lockKey = `${CacheKey.REWARD_WRITE_OFF_LOCK}${writeOffId}`;
    try {
      const result = await CacheUtils.hGet(lockKey, 'value');
      if (result) {
        return false;
      }
      await CacheUtils.hSet(lockKey, 'value', lockValue);
      await CacheUtils.set(`${lockKey}:expire`, lockValue, 30);
      return true;
    } catch {
      return false;
    }
  }

  private async releaseWriteOffLock(writeOffId: string, lockValue: string): Promise<void> {
    const lockKey = `${CacheKey.REWARD_WRITE_OFF_LOCK}${writeOffId}`;
    try {
      const current = await CacheUtils.hGet(lockKey, 'value');
      if (current === lockValue) {
        await CacheUtils.del(lockKey);
        await CacheUtils.del(`${lockKey}:expire`);
      }
    } catch {
    }
  }

  private async checkParticipationEligibility(participationId?: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find(c => c.code === 'WOV-001')!;

    if (!participationId) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '无关联参与记录，跳过资格校验',
      };
    }

    try {
      const participation = await activityParticipationDao.findById(participationId);
      if (!participation) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '参与记录不存在',
        };
      }

      const plain = participation.get({ plain: true });
      if (plain.eligibilityStatus === ParticipationEligibilityStatus.APPROVED) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: true,
          severity: WriteOffVerificationSeverity.INFO,
          message: '参与资格有效',
        };
      }

      const statusLabel = (ParticipationEligibilityStatus as any)[plain.eligibilityStatus] || String(plain.eligibilityStatus);
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `参与资格无效，当前状态：${statusLabel}`,
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `参与资格校验异常：${error.message}`,
      };
    }
  }

  private async checkDataAchievement(writeOffId: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find(c => c.code === 'WOV-002')!;

    try {
      const writeOff = await rewardWriteOffDao.findById(writeOffId);
      if (!writeOff) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '核销记录不存在',
        };
      }

      if (!writeOff.participationId) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: true,
          severity: WriteOffVerificationSeverity.INFO,
          message: '无关联参与记录，跳过数据达标校验',
        };
      }

      const participation = await activityParticipationDao.findById(writeOff.participationId);
      if (!participation) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '参与记录不存在',
        };
      }

      const plain = participation.get({ plain: true });
      const participantAmount = Number(plain.participantAmount || 0);
      const rewardAmount = Number(writeOff.rewardAmount || 0);

      if (writeOff.type === RewardWriteOffType.FULL_AMOUNT_REWARD || writeOff.type === RewardWriteOffType.LADDER_REWARD) {
        if (writeOff.marketingId) {
          const marketing = await marketingDao.findById(writeOff.marketingId);
          if (marketing) {
            const rules = (marketing as any).rewardRules || [];
            const rewardRule = rules.find((r: any) => r.id === writeOff.rewardRuleId);
            if (rewardRule && rewardRule.thresholdAmount) {
              const threshold = Number(rewardRule.thresholdAmount || 0);
              if (participantAmount >= threshold) {
                return {
                  code: checkInfo.code,
                  name: checkInfo.name,
                  passed: true,
                  severity: WriteOffVerificationSeverity.INFO,
                  message: `数据达标，成交额${participantAmount}元，门槛${threshold}元`,
                };
              } else {
                return {
                  code: checkInfo.code,
                  name: checkInfo.name,
                  passed: false,
                  severity: WriteOffVerificationSeverity.ERROR,
                  message: `数据未达标，成交额${participantAmount}元，门槛${threshold}元`,
                };
              }
            }
          }
        }
      }

      if (rewardAmount > 0 && participantAmount > 0) {
        const ratio = rewardAmount / participantAmount;
        if (ratio > REWARD_WRITE_OFF_RULES.anomalyWriteOffAmountRate) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.WARNING,
            message: `奖励金额占比过高，奖励${rewardAmount}元，成交额${participantAmount}元，占比${(ratio * 100).toFixed(1)}%`,
          };
        }
      }

      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '数据达标校验通过',
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `数据达标校验异常：${error.message}`,
      };
    }
  }

  private async checkDataAuthenticity(participationId?: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find(c => c.code === 'WOV-003')!;

    if (!participationId) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '无关联参与记录，跳过数据真实性校验',
      };
    }

    try {
      const participation = await activityParticipationDao.findById(participationId);
      if (!participation) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '参与记录不存在',
        };
      }

      const plain = participation.get({ plain: true });

      if (plain.isAnomaly) {
        const anomalyTypes = (plain.anomalyTypes || []).join('、');
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: `参与数据存在异常标记：${anomalyTypes || '未知异常'}`,
        };
      }

      if (plain.isRestricted) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.WARNING,
          message: '参与数据受限，需人工复核',
        };
      }

      const riskRecords = await promoterRiskRecordDao.findAllPaged({
        page: 1,
        pageSize: 10,
        promoterId: plain.userId,
        isActive: true,
      } as any);

      if (riskRecords.count > 0) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.WARNING,
          message: `用户存在${riskRecords.count}条有效风险记录，需人工复核`,
        };
      }

      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '数据真实性校验通过',
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `数据真实性校验异常：${error.message}`,
      };
    }
  }

  private async checkUserRiskControl(userId: string, userType: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find(c => c.code === 'WOV-004')!;

    try {
      if (userType === ParticipationUserType.PROMOTER) {
        const promoter = await promoterDao.findById(userId);
        if (!promoter) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '推客用户不存在',
          };
        }

        const plain = promoter.get({ plain: true });
        const riskControlStatus = (plain as any).riskControlStatus ?? RiskControlStatus.NORMAL;

        if (riskControlStatus === RiskControlStatus.SEVERE_CONTROL) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '用户处于重度风控状态，禁止核销',
          };
        }

        if (riskControlStatus === RiskControlStatus.MODERATE_CONTROL) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.WARNING,
            message: '用户处于中度风控状态，需人工复核',
          };
        }

        if (riskControlStatus === RiskControlStatus.MILD_CONTROL) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: true,
            severity: WriteOffVerificationSeverity.WARNING,
            message: '用户处于轻度风控状态，请注意核查',
          };
        }

        const blacklistCheck = await promoterBlacklistDao.checkMatch({
          phone: (plain as any).phone,
          idCard: (plain as any).idCard,
          name: (plain as any).name,
          wechatId: (plain as any).wechatId,
        });

        if (blacklistCheck.matched) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '用户在黑名单中，禁止核销',
          };
        }

        if ((plain as any).settleStatus === 0 || (plain as any).settleStatus === -1) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '用户结算状态异常，禁止核销',
          };
        }

        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: true,
          severity: WriteOffVerificationSeverity.INFO,
          message: '用户风控校验通过',
        };
      } else {
        const user = await userDao.findById(userId);
        if (!user) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '用户不存在',
          };
        }

        const plain = user.get({ plain: true });
        if ((plain as any).status === 0) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: '用户已禁用',
          };
        }

        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: true,
          severity: WriteOffVerificationSeverity.INFO,
          message: '用户风控校验通过',
        };
      }
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `用户风控校验异常：${error.message}`,
      };
    }
  }

  private async checkDuplicateWriteOff(marketingId?: string, participationId?: string, orderId?: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find((c: any) => c.code === 'WOV-005')!;

    try {
      if (orderId) {
        const existing = await rewardWriteOffDao.findByOrderId(orderId);
        if (existing) {
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.ERROR,
            message: `订单已存在核销记录：${existing.writeOffNo}`,
          };
        }
      }

      if (participationId) {
        const existingList = await rewardWriteOffDao.findByParticipationId(participationId);
        const validWriteOffs = existingList.filter((w: any) =>
          w.status !== RewardWriteOffStatus.CANCELLED &&
          w.status !== RewardWriteOffStatus.OVERRIDDEN &&
          w.status !== RewardWriteOffStatus.FAILED
        );

        if (validWriteOffs.length > 0) {
          const writeOffNos = validWriteOffs.map((w: any) => w.writeOffNo).join('、');
          return {
            code: checkInfo.code,
            name: checkInfo.name,
            passed: false,
            severity: WriteOffVerificationSeverity.WARNING,
            message: `该参与记录已存在核销记录：${writeOffNos}`,
          };
        }
      }

      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '无重复核销记录',
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `重复核销校验异常：${error.message}`,
      };
    }
  }

  private async checkOverAmount(writeOff: any): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find(c => c.code === 'WOV-006')!;

    try {
      const rewardAmount = Number(writeOff.rewardAmount || 0);
      const actualAmount = Number(writeOff.actualAmount || 0);

      if (actualAmount > REWARD_WRITE_OFF_RULES.maxSingleWriteOffAmount) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: `单笔核销金额${actualAmount}元超过上限${REWARD_WRITE_OFF_RULES.maxSingleWriteOffAmount}元`,
        };
      }

      if (actualAmount > rewardAmount) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: `实际核销金额${actualAmount}元超过奖励金额${rewardAmount}元`,
        };
      }

      const todayCount = await rewardWriteOffDao.countByUserIdAndDate(writeOff.userId, new Date());
      if (todayCount >= REWARD_WRITE_OFF_RULES.maxDailyWriteOffPerUser) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.WARNING,
          message: `用户今日核销次数${todayCount}次，已达上限${REWARD_WRITE_OFF_RULES.maxDailyWriteOffPerUser}次`,
        };
      }

      if (writeOff.marketingId && writeOff.userId) {
        const userWriteOffs = await rewardWriteOffDao.findByUserId(writeOff.userId);
        const marketingWriteOffs = userWriteOffs.filter((w: any) =>
          w.marketingId === writeOff.marketingId &&
          w.status !== RewardWriteOffStatus.CANCELLED &&
          w.status !== RewardWriteOffStatus.OVERRIDDEN
        );
        const totalMarketingAmount = marketingWriteOffs.reduce((sum: number, w: any) => sum + Number(w.actualAmount || 0), 0);

        if (writeOff.marketingId) {
          const marketing = await marketingDao.findById(writeOff.marketingId);
          if (marketing) {
            const maxRewardPerPromoter = Number((marketing as any).maxRewardPerPromoter || 0);
            if (maxRewardPerPromoter > 0 && totalMarketingAmount + actualAmount > maxRewardPerPromoter) {
              return {
                code: checkInfo.code,
                name: checkInfo.name,
                passed: false,
                severity: WriteOffVerificationSeverity.ERROR,
                message: `活动单用户奖励上限${maxRewardPerPromoter}元，已核销${totalMarketingAmount}元`,
              };
            }
          }
        }
      }

      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '超额核销校验通过',
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `超额核销校验异常：${error.message}`,
      };
    }
  }

  private async checkActivityRule(writeOff: any, marketingId?: string): Promise<WriteOffVerificationResult> {
    const checkInfo = REWARD_WRITE_OFF_VERIFICATION_CHECKS.find((c: any) => c.code === 'WOV-007')!;

    if (!marketingId) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '无关联活动，跳过规则校验',
      };
    }

    try {
      const marketing = await marketingDao.findById(marketingId);
      if (!marketing) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '活动不存在',
        };
      }

      const plain = marketing.get({ plain: true });

      if (writeOff.type === RewardWriteOffType.LADDER_REWARD || writeOff.type === RewardWriteOffType.RANKING_REWARD || writeOff.type === RewardWriteOffType.FULL_AMOUNT_REWARD) {
        if (writeOff.rewardRuleId) {
          const rewardRules = (plain as any).rewardRules || [];
          const matchedRule = rewardRules.find((r: any) => r.id === writeOff.rewardRuleId);
          if (!matchedRule) {
            return {
              code: checkInfo.code,
              name: checkInfo.name,
              passed: false,
              severity: WriteOffVerificationSeverity.ERROR,
              message: '奖励规则不存在或已变更',
            };
          }

          const ruleReward = Number(matchedRule.rewardAmount || matchedRule.reward || 0);
          const writeOffAmount = Number(writeOff.rewardAmount || 0);
          if (Math.abs(writeOffAmount - ruleReward) > 0.01) {
            return {
              code: checkInfo.code,
              name: checkInfo.name,
              passed: false,
              severity: WriteOffVerificationSeverity.WARNING,
              message: `核销金额${writeOffAmount}元与规则奖励${ruleReward}元不一致`,
            };
          }
        }
      }

      const now = new Date();
      const startTime = (plain as any).startTime ? new Date((plain as any).startTime) : null;
      const endTime = (plain as any).endTime ? new Date((plain as any).endTime) : null;

      if (startTime && now < startTime) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.WARNING,
          message: '活动尚未开始',
        };
      }

      if (endTime && now > endTime) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.WARNING,
          message: '活动已结束',
        };
      }

      if ((plain as any).status !== 1) {
        return {
          code: checkInfo.code,
          name: checkInfo.name,
          passed: false,
          severity: WriteOffVerificationSeverity.ERROR,
          message: '活动状态异常',
        };
      }

      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: true,
        severity: WriteOffVerificationSeverity.INFO,
        message: '活动规则校验通过',
      };
    } catch (error: any) {
      return {
        code: checkInfo.code,
        name: checkInfo.name,
        passed: false,
        severity: WriteOffVerificationSeverity.ERROR,
        message: `活动规则校验异常：${error.message}`,
      };
    }
  }

  private async countByStatus(status: RewardWriteOffStatus): Promise<number> {
    const { count } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 1,
      status,
    } as any);
    return count;
  }

  private async sumAmountByStatus(status: RewardWriteOffStatus): Promise<number> {
    const { rows } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 1000,
      status,
    } as any);
    return rows.reduce((sum: number, row: any) => sum + Number(row.actualAmount || 0), 0);
  }

  private async getTodayStats(marketingId?: string): Promise<{ count: number; amount: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { rows, count } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 1000,
      marketingId,
      startTime: startOfDay,
      endTime: endOfDay,
    } as any);

    const amount = rows.reduce((sum: number, row: any) => sum + Number(row.actualAmount || 0), 0);
    return { count, amount };
  }

  private async getStatsByPeriod(startTime: Date, endTime: Date, marketingId?: string): Promise<WriteOffStats> {
    const { rows, count } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 10000,
      marketingId,
      startTime,
      endTime,
    } as any);

    let pendingCount = 0;
    let verifiedCount = 0;
    let settledCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    let totalAmount = 0;
    let settledAmount = 0;
    let pendingAmount = 0;

    for (const row of rows) {
      const plain = row.get({ plain: true });
      const amount = Number(plain.actualAmount || 0);
      totalAmount += amount;

      switch (plain.status) {
        case RewardWriteOffStatus.PENDING:
          pendingCount++;
          pendingAmount += amount;
          break;
        case RewardWriteOffStatus.VERIFIED:
          verifiedCount++;
          pendingAmount += amount;
          break;
        case RewardWriteOffStatus.SETTLED:
          settledCount++;
          settledAmount += amount;
          break;
        case RewardWriteOffStatus.CANCELLED:
          cancelledCount++;
          break;
        case RewardWriteOffStatus.FAILED:
          failedCount++;
          break;
      }
    }

    return {
      marketingId,
      totalCount: count,
      pendingCount,
      verifiedCount,
      settledCount,
      cancelledCount,
      failedCount,
      totalAmount,
      settledAmount,
      pendingAmount,
      todayCount: 0,
      todayAmount: 0,
    };
  }

  private async getStatsByTypeAndPeriod(type: RewardWriteOffType, startTime: Date, endTime: Date, marketingId?: string): Promise<{ count: number; amount: number }> {
    const { rows, count } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 10000,
      marketingId,
      type,
      startTime,
      endTime,
    } as any);

    const amount = rows.reduce((sum: number, row: any) => sum + Number(row.actualAmount || 0), 0);
    return { count, amount };
  }

  private async getStatsByStatusAndPeriod(status: number, startTime: Date, endTime: Date, marketingId?: string): Promise<{ count: number; amount: number }> {
    const { rows, count } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 10000,
      marketingId,
      status,
      startTime,
      endTime,
    } as any);

    const amount = rows.reduce((sum: number, row: any) => sum + Number(row.actualAmount || 0), 0);
    return { count, amount };
  }

  private async getWriteOffsByPeriod(startTime: Date, endTime: Date, marketingId?: string): Promise<any[]> {
    const { rows } = await rewardWriteOffDao.findAllPaged({
      page: 1,
      pageSize: 10000,
      marketingId,
      startTime,
      endTime,
    } as any);

    return rows.map((row: any) => row.get({ plain: true }));
  }
}

export default new RewardWriteOffService();