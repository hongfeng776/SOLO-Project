import {
  promoterDao,
  promoterRiskRecordDao,
  promoterRiskReleaseDao,
  promoterRiskBehaviorDao,
  promoterRiskWarningDao,
  orderDao,
  commissionDao,
  userDao,
} from '../dao';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  RiskLevel,
  RiskType,
  RiskControlStatus,
  RiskReleaseStatus,
  RiskWarningLevel,
  RISK_LEVEL_LABELS,
  RISK_TYPE_LABELS,
  RISK_CONTROL_PERMISSIONS,
  HIGH_FREQUENCY_THRESHOLD,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

interface RiskMarkCheckResult {
  canMark: boolean;
  currentRisk?: any;
  issues: string[];
}

interface HighFrequencyCheckResult {
  isHighFrequency: boolean;
  riskCount: number;
  abnormalOrderCount: number;
  complaintCount: number;
  warnings: string[];
}

interface ComplianceCheckResult {
  passed: boolean;
  abnormalDataRemaining: string[];
  issues: string[];
}

class PromoterRiskService {
  public async getRiskProfile(promoterId: string): Promise<any> {
    const cacheKey = `risk:profile:${promoterId}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const now = new Date();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    const activeRisk = await promoterRiskRecordDao.findOne({
      where: { promoterId, isActive: true },
      order: [['createdAt', 'DESC']],
    } as any);

    const recentWarnings = await promoterRiskWarningDao.findAll({
      where: { promoterId, createdAt: { [Op.gte]: thirtyDaysAgo } },
      order: [['createdAt', 'DESC']],
      limit: 10,
    } as any);

    const behaviorCount = await promoterRiskBehaviorDao.count({
      where: { promoterId, createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const allRisks = await promoterRiskRecordDao.findAll({
      where: { promoterId, createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const abnormalOrders = await orderDao.findAll({
      where: {
        promoterId,
        createdAt: { [Op.gte]: sevenDaysAgo },
        status: { [Op.in]: ['abnormal', 'cancelled', 'refunded'] },
      },
    } as any);

    const complaints = await promoterRiskBehaviorDao.count({
      where: { promoterId, behaviorType: 'complaint', createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const riskScore = this.calculateRiskScore(
      allRisks.length,
      abnormalOrders.length,
      complaints,
      activeRisk ? (RISK_LEVEL_LABELS as any)[(activeRisk as any).riskLevel] : null
    );

    const plainPromoter = promoter.get({ plain: true });
    const permissions = plainPromoter.riskControlPermissions
      ? JSON.parse(plainPromoter.riskControlPermissions)
      : null;

    const result = {
      riskControlStatus: plainPromoter.riskControlStatus ?? RiskControlStatus.NORMAL,
      riskLevel: plainPromoter.riskLevel,
      riskType: plainPromoter.riskType,
      riskMarkedAt: plainPromoter.riskMarkedAt,
      riskExpireAt: plainPromoter.riskExpireAt,
      permissions: permissions || RISK_CONTROL_PERMISSIONS[plainPromoter.riskLevel as RiskLevel] || {
        canPromote: true, canJoinActivity: true, canWithdraw: true, canLogin: true,
      },
      activeRiskRecord: activeRisk ? (activeRisk as any).get({ plain: true }) : null,
      recentWarnings: recentWarnings.map((w: any) => w.get({ plain: true })),
      behaviorCount30Days: behaviorCount,
      riskScore,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async checkCanMarkRisk(promoterId: string, targetLevel: RiskLevel): Promise<RiskMarkCheckResult> {
    const profile = await this.getRiskProfile(promoterId);
    const issues: string[] = [];

    if (profile.riskControlStatus !== RiskControlStatus.NORMAL) {
      issues.push(`推客当前为「${RISK_LEVEL_LABELS[profile.riskLevel as RiskLevel]?.label || '风控中'}」状态，不可叠加风控`);
    }

    return {
      canMark: issues.length === 0,
      currentRisk: profile.activeRiskRecord,
      issues,
    };
  }

  public async getPromoterRiskAnalysis(promoterId: string): Promise<{
    promotionData: any;
    orderData: any;
    complaintCount: number;
    abnormalOrderCount: number;
    riskHistory: any[];
  }> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    const promotionData = {
      totalOrders: Number((promoter as any).totalOrders || 0),
      totalAmount: Number((promoter as any).totalAmount || 0),
      monthlyOrders: Number((promoter as any).monthlyOrders || 0),
      monthlyAmount: Number((promoter as any).monthlyAmount || 0),
      lastActiveAt: (promoter as any).lastActiveAt,
      activeDays: Number((promoter as any).activeDays || 0),
    };

    const recentOrders = await orderDao.findAll({
      where: { promoterId, createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: ['id', 'status', 'amount', 'createdAt'],
    } as any);

    const orderData = {
      last30Days: recentOrders.length,
      abnormal: recentOrders.filter((o: any) => ['abnormal', 'cancelled', 'refunded'].includes(o.status)).length,
      cancelled: recentOrders.filter((o: any) => o.status === 'cancelled').length,
      refunded: recentOrders.filter((o: any) => o.status === 'refunded').length,
      totalAmount: recentOrders.reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0),
    };

    const abnormalOrderCount = recentOrders.filter((o: any) =>
      ['abnormal', 'cancelled', 'refunded'].includes(o.status)
    ).length;

    const complaintCount = await promoterRiskBehaviorDao.count({
      where: { promoterId, behaviorType: 'complaint', createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const riskHistory = await promoterRiskRecordDao.findAll({
      where: { promoterId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    } as any);

    return {
      promotionData,
      orderData,
      complaintCount,
      abnormalOrderCount,
      riskHistory: riskHistory.map((r: any) => r.get({ plain: true })),
    };
  }

  public async markRisk(
    promoterId: string,
    operatorId: string,
    data: {
      riskLevel: RiskLevel;
      riskType: RiskType;
      riskTitle: string;
      riskDescription?: string;
      riskEvidence?: string[];
      expireAt?: string;
    }
  ): Promise<any> {
    const checkResult = await this.checkCanMarkRisk(promoterId, data.riskLevel);
    if (!checkResult.canMark) {
      throw new AppError(checkResult.issues.join('；'), BusinessCode.ERROR);
    }

    const analysis = await this.getPromoterRiskAnalysis(promoterId);

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const permissions = { ...RISK_CONTROL_PERMISSIONS[data.riskLevel] };
    const controlStatusMap: Record<RiskLevel, RiskControlStatus> = {
      [RiskLevel.MILD]: RiskControlStatus.MILD_CONTROL,
      [RiskLevel.MODERATE]: RiskControlStatus.MODERATE_CONTROL,
      [RiskLevel.SEVERE]: RiskControlStatus.SEVERE_CONTROL,
    };

    const expireDate = data.expireAt ? new Date(data.expireAt) : undefined;

    const riskRecord = await promoterRiskRecordDao.create({
      promoterId,
      riskLevel: data.riskLevel,
      riskType: data.riskType,
      riskTitle: data.riskTitle,
      riskDescription: data.riskDescription,
      riskEvidence: data.riskEvidence ? JSON.stringify(data.riskEvidence) : undefined,
      operatorId,
      operatorName,
      controlStatus: controlStatusMap[data.riskLevel],
      permissionsSnapshot: JSON.stringify(permissions),
      expireAt: expireDate,
      isActive: true,
    } as any);

    await promoterDao.update(
      {
        riskControlStatus: controlStatusMap[data.riskLevel] as any,
        riskLevel: data.riskLevel as any,
        riskType: data.riskType as any,
        riskMarkedAt: new Date(),
        riskMarkedBy: operatorId,
        riskMarkedReason: data.riskTitle,
        riskExpireAt: expireDate as any,
        riskControlPermissions: JSON.stringify(permissions),
        riskFlagged: true,
        riskReason: data.riskTitle,
      } as any,
      { where: { id: promoterId } }
    );

    const hfCheck = await this.checkHighFrequency(promoterId);
    if (hfCheck.isHighFrequency) {
      await this.createWarning(
        promoterId,
        RiskWarningLevel.HIGH,
        'high_frequency_risk',
        '高频风险用户预警',
        hfCheck.warnings.join('；'),
        'HF_RISK_AUTO',
        95
      );
    }

    await CacheUtils.del(`risk:profile:${promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);

    return riskRecord;
  }

  public async cancelRisk(riskRecordId: string, operatorId: string): Promise<void> {
    const riskRecord = await promoterRiskRecordDao.findByPk(riskRecordId);
    if (!riskRecord) {
      throw new AppError('风控记录不存在', BusinessCode.NOT_FOUND);
    }
    const record = riskRecord as any;
    if (!record.isActive) {
      throw new AppError('该风控已解除', BusinessCode.ERROR);
    }

    const promoter = await promoterDao.findById(record.promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    await promoterRiskRecordDao.update(record.id, {
      isActive: false,
    } as any);

    await promoterDao.update(
      {
        riskControlStatus: RiskControlStatus.NORMAL as any,
        riskLevel: null as any,
        riskType: null as any,
        riskMarkedAt: null as any,
        riskMarkedBy: null as any,
        riskMarkedReason: null as any,
        riskExpireAt: null as any,
        riskControlPermissions: null as any,
        riskFlagged: false,
        riskReason: null as any,
      } as any,
      { where: { id: record.promoterId } }
    );

    await CacheUtils.del(`risk:profile:${record.promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async checkHighFrequency(promoterId: string): Promise<HighFrequencyCheckResult> {
    const now = new Date();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

    const riskCount = await promoterRiskRecordDao.count({
      where: { promoterId, createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const abnormalOrderCount = await orderDao.count({
      where: {
        promoterId,
        createdAt: { [Op.gte]: sevenDaysAgo },
        status: { [Op.in]: ['abnormal', 'cancelled', 'refunded'] },
      },
    } as any);

    const complaintCount = await promoterRiskBehaviorDao.count({
      where: { promoterId, behaviorType: 'complaint', createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    const warnings: string[] = [];
    if (riskCount >= HIGH_FREQUENCY_THRESHOLD.riskCountIn30Days) {
      warnings.push(`30天内被风控${riskCount}次，超过阈值${HIGH_FREQUENCY_THRESHOLD.riskCountIn30Days}次`);
    }
    if (abnormalOrderCount >= HIGH_FREQUENCY_THRESHOLD.abnormalOrdersIn7Days) {
      warnings.push(`7天内异常订单${abnormalOrderCount}笔，超过阈值${HIGH_FREQUENCY_THRESHOLD.abnormalOrdersIn7Days}笔`);
    }
    if (complaintCount >= HIGH_FREQUENCY_THRESHOLD.complaintCountIn30Days) {
      warnings.push(`30天内被投诉${complaintCount}次，超过阈值${HIGH_FREQUENCY_THRESHOLD.complaintCountIn30Days}次`);
    }

    return {
      isHighFrequency: warnings.length > 0,
      riskCount,
      abnormalOrderCount,
      complaintCount,
      warnings,
    };
  }

  public async checkReleaseCompliance(promoterId: string, riskRecordId: string): Promise<ComplianceCheckResult> {
    const profile = await this.getRiskProfile(promoterId);
    const issues: string[] = [];
    const abnormalDataRemaining: string[] = [];

    if (!profile.activeRiskRecord || profile.activeRiskRecord.id !== riskRecordId) {
      issues.push('当前风控记录不匹配');
    }

    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();
    const recentAbnormalOrders = await orderDao.findAll({
      where: {
        promoterId,
        createdAt: { [Op.gte]: sevenDaysAgo },
        status: { [Op.in]: ['abnormal', 'cancelled', 'refunded'] },
      },
    } as any);

    if (recentAbnormalOrders.length > 0) {
      abnormalDataRemaining.push(`近7天仍有${recentAbnormalOrders.length}笔异常订单未处理`);
    }

    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const recentComplaints = await promoterRiskBehaviorDao.count({
      where: { promoterId, behaviorType: 'complaint', createdAt: { [Op.gte]: thirtyDaysAgo } },
    } as any);

    if (recentComplaints > 0) {
      abnormalDataRemaining.push(`近30天仍有${recentComplaints}起投诉未结案`);
    }

    return {
      passed: abnormalDataRemaining.length === 0,
      abnormalDataRemaining,
      issues,
    };
  }

  public async submitRelease(
    promoterId: string,
    applicantId: string,
    data: {
      riskRecordId: string;
      releaseReason: string;
      proofMaterials?: string[];
      rectificationDesc?: string;
    }
  ): Promise<any> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const riskRecord = await promoterRiskRecordDao.findByPk(data.riskRecordId);
    if (!riskRecord) {
      throw new AppError('风控记录不存在', BusinessCode.NOT_FOUND);
    }

    if (!data.releaseReason || data.releaseReason.trim().length < 10) {
      throw new AppError('解除风控理由至少10个字', BusinessCode.PARAM_ERROR);
    }

    const compliance = await this.checkReleaseCompliance(promoterId, data.riskRecordId);

    const applicant = await userDao.findById(applicantId);
    const release = await promoterRiskReleaseDao.create({
      promoterId,
      applicantId,
      applicantName: (applicant as any)?.nickname || applicant?.username || '-',
      riskRecordId: data.riskRecordId,
      releaseReason: data.releaseReason.trim(),
      proofMaterials: data.proofMaterials ? JSON.stringify(data.proofMaterials) : undefined,
      rectificationDesc: data.rectificationDesc,
      abnormalDataCleared: compliance.passed,
      verifyStatus: RiskReleaseStatus.PENDING,
      restoreStage: 0,
    } as any);

    await CacheUtils.del(`risk:profile:${promoterId}`);
    return release;
  }

  public async reviewRelease(
    releaseId: string,
    reviewerId: string,
    data: {
      passed: boolean;
      verifyRemark?: string;
      restoreStage?: number;
    }
  ): Promise<void> {
    const release = await promoterRiskReleaseDao.findByPk(releaseId);
    if (!release) {
      throw new AppError('解除申请不存在', BusinessCode.NOT_FOUND);
    }
    const rel = release as any;
    if (rel.verifyStatus !== RiskReleaseStatus.PENDING) {
      throw new AppError('该申请已处理，不可重复审核', BusinessCode.ERROR);
    }

    const reviewer = await userDao.findById(reviewerId);
    const reviewerName = (reviewer as any)?.nickname || reviewer?.username || '系统';

    if (data.passed) {
      const compliance = await this.checkReleaseCompliance(rel.promoterId, rel.riskRecordId);
      if (!compliance.passed && !(data.restoreStage && data.restoreStage > 0)) {
        throw new AppError(
          '异常数据未清零：' + compliance.abnormalDataRemaining.join('；'),
          BusinessCode.ERROR
        );
      }

      const targetStage = data.restoreStage ?? 5;
      if (targetStage >= 5) {
        await this.cancelRisk(rel.riskRecordId, reviewerId);
      } else {
        const permissions = this.calculateStagePermissions(targetStage);
        await promoterDao.update(
          { riskControlPermissions: JSON.stringify(permissions) } as any,
          { where: { id: rel.promoterId } }
        );
      }

      await promoterRiskReleaseDao.update(rel.id, {
        verifyStatus: RiskReleaseStatus.APPROVED as any,
        verifierId: reviewerId,
        verifierName: reviewerName,
        verifyRemark: data.verifyRemark,
        verifiedAt: new Date(),
        restoreStage: targetStage,
      } as any);

      await promoterRiskRecordDao.update(rel.riskRecordId, {
        permissionsSnapshot: JSON.stringify(this.calculateStagePermissions(targetStage)),
      } as any);
    } else {
      await promoterRiskReleaseDao.update(rel.id, {
        verifyStatus: RiskReleaseStatus.REJECTED as any,
        verifierId: reviewerId,
        verifierName: reviewerName,
        verifyRemark: data.verifyRemark,
        verifiedAt: new Date(),
      } as any);
    }

    await CacheUtils.del(`risk:profile:${rel.promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  private calculateStagePermissions(stage: number) {
    const base = { canPromote: true, canJoinActivity: true, canWithdraw: true, canLogin: true };
    if (stage <= 1) return { ...base, canWithdraw: false, canJoinActivity: false };
    if (stage === 2) return { ...base, canJoinActivity: false };
    if (stage === 3) return { ...base, canJoinActivity: false, canWithdraw: true };
    if (stage === 4) return { ...base };
    return base;
  }

  public async batchMarkRisk(
    ids: string[],
    operatorId: string,
    data: {
      riskLevel: RiskLevel;
      riskType: RiskType;
      riskTitle: string;
      riskDescription?: string;
      expireAt?: string;
    }
  ): Promise<any> {
    const details: any[] = [];
    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
          continue;
        }

        const profile = await this.getRiskProfile(id);
        if (profile.riskControlStatus !== RiskControlStatus.NORMAL) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: `当前已是「${RISK_LEVEL_LABELS[profile.riskLevel as RiskLevel]?.label}」状态`,
          });
          continue;
        }

        if ((promoter as any).isCorePromoter) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: '核心推客禁止批量风控，请单独操作',
          });
          continue;
        }

        const analysis = await this.getPromoterRiskAnalysis(id);
        let autoType = data.riskType;
        if (data.riskType === RiskType.OTHER) {
          if (analysis.abnormalOrderCount > analysis.complaintCount) {
            autoType = analysis.complaintCount > 0 ? RiskType.COMPLAINT : RiskType.BRUSH_ORDER;
          }
        }

        await this.markRisk(id, operatorId, { ...data, riskType: autoType });
        success++;
        details.push({ id, name: promoter.name, status: 'success' });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          id,
          name: promoter?.name || '-',
          status: 'failed',
          reason: err.message,
        });
      }
    }

    return { total: ids.length, success, skipped, failed, details };
  }

  public async batchCancelRisk(ids: string[], operatorId: string): Promise<any> {
    const details: any[] = [];
    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const activeRisk = await promoterRiskRecordDao.findOne({
          where: { promoterId: id, isActive: true },
          order: [['createdAt', 'DESC']],
        } as any);

        if (!activeRisk) {
          skipped++;
          const promoter = await promoterDao.findById(id);
          details.push({
            id,
            name: promoter?.name || '-',
            status: 'skipped',
            reason: '推客当前无有效风控',
          });
          continue;
        }

        await this.cancelRisk((activeRisk as any).id, operatorId);
        const promoter = await promoterDao.findById(id);
        success++;
        details.push({ id, name: promoter?.name || '-', status: 'success' });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          id,
          name: promoter?.name || '-',
          status: 'failed',
          reason: err.message,
        });
      }
    }

    return { total: ids.length, success, skipped, failed, details };
  }

  public async createWarning(
    promoterId: string,
    warningLevel: RiskWarningLevel,
    warningType: string,
    warningTitle: string,
    warningDesc: string,
    ruleCode: string,
    riskScore: number
  ): Promise<any> {
    const existing = await promoterRiskWarningDao.findOne({
      where: { promoterId, ruleCode, isHandled: false },
    } as any);
    if (existing) return existing;

    return promoterRiskWarningDao.create({
      promoterId,
      warningLevel,
      warningType,
      warningTitle,
      warningDesc,
      ruleCode,
      riskScore,
      isHandled: false,
    } as any);
  }

  public async getBehaviorTrace(
    promoterId: string,
    params: PaginationParams & { behaviorType?: string; riskFlagged?: boolean; startDate?: string; endDate?: string }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const where: any = { promoterId };
    if (params.behaviorType) where.behaviorType = params.behaviorType;
    if (params.riskFlagged !== undefined) where.riskFlagged = params.riskFlagged;
    if (params.startDate) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(params.startDate) };
    if (params.endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(params.endDate) };

    const { rows, count } = await promoterRiskBehaviorDao.findAllPaged(
      { where, page, pageSize, order: [['createdAt', 'DESC']] } as any
    );

    return {
      list: rows.map((r: any) => r.get({ plain: true })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getRiskList(
    params: PaginationParams & { riskLevel?: string; riskType?: string; controlStatus?: number; isActive?: boolean }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const where: any = {};
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    if (params.riskType) where.riskType = params.riskType;
    if (params.controlStatus !== undefined) where.controlStatus = params.controlStatus;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    const { rows, count } = await promoterRiskRecordDao.findAllPaged(
      { where, page, pageSize, order: [['createdAt', 'DESC']], include: [{ association: 'promoter', attributes: ['id', 'name', 'code', 'phone'] }] } as any
    );

    return {
      list: rows.map((r: any) => r.get({ plain: true })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getStatistics(params?: { startDate?: string; endDate?: string }) {
    const cacheKey = `risk:stats:${params?.startDate || ''}:${params?.endDate || ''}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const dateWhere: any = {};
    if (params?.startDate) dateWhere.createdAt = { [Op.gte]: new Date(params.startDate) };
    if (params?.endDate) dateWhere.createdAt = { ...dateWhere.createdAt, [Op.lte]: new Date(params.endDate) };

    const distribution: any = { mild: 0, moderate: 0, severe: 0 };
    const records = await promoterRiskRecordDao.findAll({ where: { ...dateWhere, isActive: true } } as any);
    records.forEach((r: any) => {
      const lvl = (r as any).riskLevel as RiskLevel;
      distribution[lvl] = (distribution[lvl] || 0) + 1;
    });

    const totalControlled = records.length;
    const pendingReleases = await promoterRiskReleaseDao.count({ where: { verifyStatus: RiskReleaseStatus.PENDING } } as any);
    const activeWarnings = await promoterRiskWarningDao.count({ where: { isHandled: false } } as any);

    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const allPromoters = await promoterDao.findAll({ where: { deletedAt: null } } as any);

    const highFrequencyList: any[] = [];
    for (const p of allPromoters) {
      const hf = await this.checkHighFrequency((p as any).id);
      if (hf.isHighFrequency) {
        highFrequencyList.push({
          promoterId: (p as any).id,
          name: (p as any).name,
          code: (p as any).code,
          riskCount: hf.riskCount,
          abnormalOrderCount: hf.abnormalOrderCount,
          complaintCount: hf.complaintCount,
        });
      }
    }

    const result = {
      distribution,
      totalControlled,
      pendingReleases,
      activeWarnings,
      highFrequencyList: highFrequencyList.sort(
        (a, b) => b.riskCount + b.abnormalOrderCount * 2 - (a.riskCount + a.abnormalOrderCount * 2)
      ).slice(0, 10),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  private calculateRiskScore(riskCount: number, abnormalOrders: number, complaints: number, currentLevel: any): number {
    let score = 0;
    score += riskCount * 15;
    score += abnormalOrders * 3;
    score += complaints * 20;
    if (currentLevel) {
      score += currentLevel.label === '轻度风控' ? 30 : currentLevel.label === '中度风控' ? 60 : 90;
    }
    return Math.min(100, score);
  }
}

export default new PromoterRiskService();
