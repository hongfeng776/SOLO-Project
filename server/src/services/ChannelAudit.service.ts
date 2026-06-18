import { createHash } from 'crypto';
import {
  channelAuditDao,
  channelAuditLogDao,
  channelBlacklistDao,
  channelQualificationDao,
  channelDao,
  userDao,
} from '../dao';
import { ChannelAuditCreationAttributes } from '../models/ChannelAudit.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  ChannelAuditStage,
  ChannelAuditAction,
  ChannelAuditStatus,
  ChannelRejectIssueType,
  CHANNEL_REJECT_ISSUE_LABELS,
  ChannelPriority,
  ChannelQualificationType,
  VerifyStatus,
  ChannelStatus,
  CHANNEL_AUDIT_STAGES,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';

const LOCK_WINDOW_DAYS = 7;

interface PreCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  blacklistMatched?: { items: any[] };
  lockInfo?: { locked: boolean; lockUntil?: Date; remainingHours?: number };
  duplicateInfo?: { fields: string[] };
  creditCheck?: { status: string; score?: number; warnings: string[] };
  riskFlags: string[];
}

interface RejectData {
  issueTypes: ChannelRejectIssueType[];
  customRemark?: string;
  lockDays?: number;
}

interface BatchAuditResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: Array<{
    id: string;
    name: string;
    contactPhone: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const CREDIT_CODE_REGEX = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;

function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

function validateCreditCode(code: string): boolean {
  return CREDIT_CODE_REGEX.test(code);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateDataHash(data: any): string {
  const keys = Object.keys(data).sort();
  const str = keys.map((k) => `${k}:${data[k] ?? ''}`).join('|');
  return createHash('sha256').update(str).digest('hex');
}

function getRemainingHours(lockUntil: Date): number {
  const now = Date.now();
  const diff = lockUntil.getTime() - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

interface ChannelApplyData {
  name: string;
  type?: string;
  companyName?: string;
  creditCode?: string;
  legalPerson?: string;
  legalPersonIdCard?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  businessLicenseImg?: string;
  idCardFrontImg?: string;
  idCardBackImg?: string;
  otherQualificationImgs?: any;
  commissionRate?: number;
  remark?: string;
  [key: string]: any;
}

class ChannelAuditService {
  public async preCheckApplyData(data: ChannelApplyData, auditId?: string): Promise<PreCheckResult> {
    const result: PreCheckResult = {
      valid: true,
      errors: [],
      warnings: [],
      riskFlags: [],
    };

    const requiredFields = ['name', 'contactName', 'contactPhone'];
    const missingFields = requiredFields.filter((f) => !data[f] || String(data[f]).trim() === '');
    if (missingFields.length > 0) {
      result.valid = false;
      result.errors.push(`缺少必填字段：${missingFields.join('、')}`);
    }

    if (data.contactPhone) {
      if (!validatePhone(data.contactPhone)) {
        result.valid = false;
        result.errors.push('联系电话格式不正确');
      } else {
        const phoneExists = await channelAuditDao.existsByContactPhone(data.contactPhone, auditId);
        if (phoneExists) {
          result.valid = false;
          result.errors.push('联系电话已被其他渠道使用');
          result.riskFlags.push('联系方式重复');
          result.duplicateInfo = result.duplicateInfo || { fields: [] };
          result.duplicateInfo.fields.push('contactPhone');
        }
      }
    }

    if (data.contactEmail && !validateEmail(data.contactEmail)) {
      result.warnings.push('联系邮箱格式不规范');
    }

    if (data.creditCode) {
      if (!validateCreditCode(data.creditCode)) {
        result.warnings.push('统一社会信用代码格式可能不正确');
      } else {
        const creditCodeExists = await channelAuditDao.existsByCreditCode(data.creditCode, auditId);
        if (creditCodeExists) {
          result.valid = false;
          result.errors.push('合作主体（统一社会信用代码）已存在');
          result.riskFlags.push('合作主体重复');
          result.duplicateInfo = result.duplicateInfo || { fields: [] };
          result.duplicateInfo.fields.push('creditCode');
        }
      }
    }

    if (data.companyName) {
      const companyExists = await channelAuditDao.existsByCompanyName(data.companyName, auditId);
      if (companyExists) {
        result.valid = false;
        result.errors.push('企业名称已被其他渠道注册');
        result.riskFlags.push('企业名称重复');
        result.duplicateInfo = result.duplicateInfo || { fields: [] };
        result.duplicateInfo.fields.push('companyName');
      }
    }

    const blacklistResult = await channelBlacklistDao.checkMatch({
      companyName: data.companyName,
      creditCode: data.creditCode,
      contactPhone: data.contactPhone,
      legalPerson: data.legalPerson,
    });
    if (blacklistResult.matched) {
      result.valid = false;
      result.blacklistMatched = { items: blacklistResult.items };
      result.errors.push('申请信息匹配黑名单记录，已被拦截入驻');
      result.riskFlags.push('黑名单匹配');
    }

    const lockStatus = await channelAuditDao.checkLockStatus(data.contactPhone, data.creditCode);
    if (lockStatus.locked && lockStatus.lockUntil) {
      result.valid = false;
      result.lockInfo = {
        locked: true,
        lockUntil: lockStatus.lockUntil,
        remainingHours: getRemainingHours(lockStatus.lockUntil),
      };
      result.errors.push(
        `当前渠道处于锁定状态，剩余锁定时间约 ${result.lockInfo.remainingHours} 小时`
      );
    }

    result.creditCheck = await this.simulateCreditCheck(data);
    if (result.creditCheck.status === 'abnormal') {
      result.riskFlags.push('企业征信异常');
      result.warnings.push(`企业征信存在异常：${result.creditCheck.warnings.join('；')}`);
    }

    return result;
  }

  private async simulateCreditCheck(data: ChannelApplyData): Promise<{ status: string; score?: number; warnings: string[] }> {
    const warnings: string[] = [];
    let score = 80;

    if (!data.creditCode) {
      warnings.push('未提供统一社会信用代码');
      score -= 10;
    }
    if (!data.businessLicenseImg) {
      warnings.push('未上传营业执照');
      score -= 15;
    }
    if (!data.companyName) {
      warnings.push('未填写企业名称');
      score -= 10;
    }

    const status = score < 60 ? 'abnormal' : score < 80 ? 'warning' : 'normal';
    return { status, score, warnings };
  }

  public async submitApply(data: ChannelApplyData): Promise<any> {
    const preCheck = await this.preCheckApplyData(data);
    if (!preCheck.valid) {
      throw new AppError(preCheck.errors.join('；'), BusinessCode.PARAM_ERROR);
    }

    const existingByPhone = await channelAuditDao.findOne({ where: { contactPhone: data.contactPhone } });

    const dataHash = calculateDataHash({
      name: data.name,
      contactPhone: data.contactPhone,
      companyName: data.companyName,
      creditCode: data.creditCode,
      legalPerson: data.legalPerson,
    });

    if (existingByPhone) {
      const applyCount = ((existingByPhone as any).applyCount || 0) + 1;
      const hashChanged = (existingByPhone as any).dataHash && (existingByPhone as any).dataHash !== dataHash;
      const riskFlagged = hashChanged;
      const riskReason = hashChanged ? '申请信息与历史记录不一致，存在篡改痕迹' : undefined;

      await channelAuditDao.update(
        {
          ...data,
          auditStage: ChannelAuditStage.DATA_REVIEW as any,
          auditStatus: ChannelAuditStatus.DATA_AUDITING as any,
          applyCount,
          lastApplyAt: new Date(),
          dataHash,
          riskFlagged,
          riskReason,
          rejectIssueTypes: null,
          rejectCustomRemark: null,
          rejectedAt: null,
          dataAuditorId: null,
          dataAuditAt: null,
          dataAuditRemark: null,
          qualificationAuditorId: null,
          qualificationAuditAt: null,
          qualificationAuditRemark: null,
          permissionAuditorId: null,
          permissionAuditAt: null,
          permissionAuditRemark: null,
          creditCheckResult: preCheck.creditCheck as any,
          blacklistMatched: !!preCheck.blacklistMatched,
          blacklistItems: preCheck.blacklistMatched?.items as any,
        } as any,
        { where: { id: (existingByPhone as any).id } }
      );

      await channelAuditLogDao.create({
        channelAuditId: (existingByPhone as any).id,
        action: ChannelAuditAction.SUBMIT,
        fromStage: (existingByPhone as any).auditStage,
        toStage: ChannelAuditStage.DATA_REVIEW,
        fromStatus: (existingByPhone as any).auditStatus,
        toStatus: ChannelAuditStatus.DATA_AUDITING,
        metadata: JSON.stringify({
          applyCount,
          hashChanged,
          riskFlagged,
          creditCheck: preCheck.creditCheck,
        }),
      } as any);

      await CacheUtils.del(`${CacheKey.CHANNEL_AUDIT_DETAIL}${(existingByPhone as any).id}`);
      await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
      return this.getAuditDetail((existingByPhone as any).id);
    }

    const code = await this.generateCode();
    const priority = this.determinePriority(data);

    const audit = await channelAuditDao.create({
      ...data,
      code,
      priority,
      auditStage: ChannelAuditStage.DATA_REVIEW as any,
      auditStatus: ChannelAuditStatus.DATA_AUDITING as any,
      applyCount: 1,
      lastApplyAt: new Date(),
      dataHash,
      isKeyChannel: priority === ChannelPriority.KEY,
      creditCheckResult: preCheck.creditCheck as any,
      blacklistMatched: !!preCheck.blacklistMatched,
      blacklistItems: preCheck.blacklistMatched?.items as any,
    } as ChannelAuditCreationAttributes);

    await channelAuditLogDao.create({
      channelAuditId: (audit as any).id,
      action: ChannelAuditAction.SUBMIT,
      fromStage: ChannelAuditStage.PENDING_SUBMIT,
      toStage: ChannelAuditStage.DATA_REVIEW,
      fromStatus: ChannelAuditStatus.PENDING,
      toStatus: ChannelAuditStatus.DATA_AUDITING,
      metadata: JSON.stringify({ firstApply: true, creditCheck: preCheck.creditCheck }),
    } as any);

    if (data.otherQualificationImgs && Array.isArray(data.otherQualificationImgs)) {
      for (const img of data.otherQualificationImgs) {
        await channelQualificationDao.create({
          channelAuditId: (audit as any).id,
          type: img.type || ChannelQualificationType.OTHER,
          title: img.title,
          fileUrl: img.fileUrl || img.url,
          expireAt: img.expireAt ? new Date(img.expireAt) : undefined,
          verifyStatus: VerifyStatus.PENDING as any,
        } as any);
      }
    }

    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
    return this.getAuditDetail((audit as any).id);
  }

  private determinePriority(data: ChannelApplyData): ChannelPriority {
    let score = 0;
    if (data.companyName && data.creditCode) score += 1;
    if (data.businessLicenseImg) score += 1;
    if (data.commissionRate && Number(data.commissionRate) >= 0.1) score += 1;
    if (score >= 3) return ChannelPriority.KEY;
    if (score >= 1) return ChannelPriority.IMPORTANT;
    return ChannelPriority.NORMAL;
  }

  private async generateCode(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const todayCount = await channelAuditDao.getTodayCount();
    const seq = String(todayCount + 1).padStart(6, '0');
    const code = `CH${dateStr}${seq}`;
    return code;
  }

  public async dataReviewPass(id: string, auditUserId: string, remark?: string): Promise<void> {
    const audit = await channelAuditDao.findById(id);
    if (!audit) {
      throw new AppError('渠道审核申请不存在', BusinessCode.NOT_FOUND);
    }
    if ((audit as any).auditStage !== ChannelAuditStage.DATA_REVIEW) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel((audit as any).auditStage)}」，不可执行资料初审通过操作`,
        BusinessCode.ERROR
      );
    }
    if ((audit as any).auditStatus !== ChannelAuditStatus.DATA_AUDITING) {
      throw new AppError(
        `当前审核状态为「${this.getStatusLabel((audit as any).auditStatus)}」，不可执行资料初审通过操作`,
        BusinessCode.ERROR
      );
    }

    const auditor = await userDao.findById(auditUserId);

    await channelAuditDao.update(
      {
        auditStage: ChannelAuditStage.QUALIFICATION_VERIFY as any,
        auditStatus: ChannelAuditStatus.QUALIFICATION_AUDITING as any,
        dataAuditorId: auditUserId,
        dataAuditAt: new Date(),
        dataAuditRemark: remark,
      } as any,
      { where: { id } }
    );

    await channelAuditLogDao.create({
      channelAuditId: id,
      action: ChannelAuditAction.DATA_PASS,
      fromStage: ChannelAuditStage.DATA_REVIEW,
      toStage: ChannelAuditStage.QUALIFICATION_VERIFY,
      fromStatus: ChannelAuditStatus.DATA_AUDITING,
      toStatus: ChannelAuditStatus.QUALIFICATION_AUDITING,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || (auditor as any)?.username || '系统',
      remark,
    });

    await CacheUtils.del(`${CacheKey.CHANNEL_AUDIT_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
  }

  public async dataReviewReject(id: string, auditUserId: string, rejectData: RejectData): Promise<void> {
    await this.performReject(id, auditUserId, rejectData, 'data');
  }

  public async qualificationVerifyPass(id: string, auditUserId: string, remark?: string): Promise<void> {
    const audit = await channelAuditDao.findById(id);
    if (!audit) {
      throw new AppError('渠道审核申请不存在', BusinessCode.NOT_FOUND);
    }
    if ((audit as any).auditStage !== ChannelAuditStage.QUALIFICATION_VERIFY) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel((audit as any).auditStage)}」，不可执行资质核验通过操作`,
        BusinessCode.ERROR
      );
    }
    if ((audit as any).auditStatus !== ChannelAuditStatus.QUALIFICATION_AUDITING) {
      throw new AppError(
        `当前审核状态为「${this.getStatusLabel((audit as any).auditStatus)}」，不可执行资质核验通过操作`,
        BusinessCode.ERROR
      );
    }

    const auditor = await userDao.findById(auditUserId);

    await channelAuditDao.update(
      {
        auditStage: ChannelAuditStage.PERMISSION_ACTIVATE as any,
        auditStatus: ChannelAuditStatus.PERMISSION_AUDITING as any,
        qualificationAuditorId: auditUserId,
        qualificationAuditAt: new Date(),
        qualificationAuditRemark: remark,
      } as any,
      { where: { id } }
    );

    await channelAuditLogDao.create({
      channelAuditId: id,
      action: ChannelAuditAction.QUALIFICATION_PASS,
      fromStage: ChannelAuditStage.QUALIFICATION_VERIFY,
      toStage: ChannelAuditStage.PERMISSION_ACTIVATE,
      fromStatus: ChannelAuditStatus.QUALIFICATION_AUDITING,
      toStatus: ChannelAuditStatus.PERMISSION_AUDITING,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || (auditor as any)?.username || '系统',
      remark,
    });

    await CacheUtils.del(`${CacheKey.CHANNEL_AUDIT_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
  }

  public async qualificationVerifyReject(id: string, auditUserId: string, rejectData: RejectData): Promise<void> {
    await this.performReject(id, auditUserId, rejectData, 'qualification');
  }

  public async permissionActivatePass(id: string, auditUserId: string, remark?: string): Promise<void> {
    const audit = await channelAuditDao.findById(id);
    if (!audit) {
      throw new AppError('渠道审核申请不存在', BusinessCode.NOT_FOUND);
    }
    if ((audit as any).auditStage !== ChannelAuditStage.PERMISSION_ACTIVATE) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel((audit as any).auditStage)}」，不可执行权限开通操作`,
        BusinessCode.ERROR
      );
    }
    if ((audit as any).auditStatus !== ChannelAuditStatus.PERMISSION_AUDITING) {
      throw new AppError(
        `当前审核状态为「${this.getStatusLabel((audit as any).auditStatus)}」，不可执行权限开通操作`,
        BusinessCode.ERROR
      );
    }

    const auditor = await userDao.findById(auditUserId);

    let channelId = (audit as any).channelId;
    if (!channelId) {
      const channel = await channelDao.create({
        name: (audit as any).name,
        code: (audit as any).code || await this.generateChannelCode(),
        type: (audit as any).type || 'other',
        contactName: (audit as any).contactName,
        contactPhone: (audit as any).contactPhone,
        contactEmail: (audit as any).contactEmail,
        commissionRate: (audit as any).commissionRate || 0,
        status: ChannelStatus.ENABLED as any,
        remark: (audit as any).remark,
      } as any);
      channelId = (channel as any).id;
    } else {
      await channelDao.update(
        { status: ChannelStatus.ENABLED as any },
        { where: { id: channelId } }
      );
    }

    await channelAuditDao.update(
      {
        channelId,
        auditStage: ChannelAuditStage.COMPLETED as any,
        auditStatus: ChannelAuditStatus.PASSED as any,
        permissionAuditorId: auditUserId,
        permissionAuditAt: new Date(),
        permissionAuditRemark: remark,
        activatedAt: new Date(),
      } as any,
      { where: { id } }
    );

    await channelAuditLogDao.create({
      channelAuditId: id,
      action: ChannelAuditAction.PERMISSION_PASS,
      fromStage: ChannelAuditStage.PERMISSION_ACTIVATE,
      toStage: ChannelAuditStage.COMPLETED,
      fromStatus: ChannelAuditStatus.PERMISSION_AUDITING,
      toStatus: ChannelAuditStatus.PASSED,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || (auditor as any)?.username || '系统',
      remark,
      metadata: JSON.stringify({ channelId }),
    });

    await CacheUtils.del(`${CacheKey.CHANNEL_AUDIT_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_LIST}*`);
  }

  private async generateChannelCode(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `C${dateStr}${random}`;
  }

  public async permissionActivateReject(id: string, auditUserId: string, rejectData: RejectData): Promise<void> {
    await this.performReject(id, auditUserId, rejectData, 'permission');
  }

  private async performReject(
    id: string,
    auditUserId: string,
    rejectData: RejectData,
    stage: 'data' | 'qualification' | 'permission'
  ): Promise<void> {
    const audit = await channelAuditDao.findById(id);
    if (!audit) {
      throw new AppError('渠道审核申请不存在', BusinessCode.NOT_FOUND);
    }

    const expectedStage = stage === 'data'
      ? ChannelAuditStage.DATA_REVIEW
      : stage === 'qualification'
      ? ChannelAuditStage.QUALIFICATION_VERIFY
      : ChannelAuditStage.PERMISSION_ACTIVATE;

    if ((audit as any).auditStage !== expectedStage) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel((audit as any).auditStage)}」，不可执行该阶段驳回操作`,
        BusinessCode.ERROR
      );
    }

    if (!rejectData.issueTypes || rejectData.issueTypes.length === 0) {
      throw new AppError('请至少选择一个驳回问题类型', BusinessCode.PARAM_ERROR);
    }

    for (const issueType of rejectData.issueTypes) {
      if (!Object.values(ChannelRejectIssueType).includes(issueType)) {
        throw new AppError(`无效的驳回问题类型：${issueType}`, BusinessCode.PARAM_ERROR);
      }
    }

    const auditor = await userDao.findById(auditUserId);
    const lockDays = rejectData.lockDays ?? LOCK_WINDOW_DAYS;
    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + lockDays);

    const issueLabels = rejectData.issueTypes.map((t) => CHANNEL_REJECT_ISSUE_LABELS[t]).join('、');
    const fullRemark = `[${issueLabels}] ${rejectData.customRemark || ''}`.trim();

    const action = stage === 'data'
      ? ChannelAuditAction.DATA_REJECT
      : stage === 'qualification'
      ? ChannelAuditAction.QUALIFICATION_REJECT
      : ChannelAuditAction.PERMISSION_REJECT;

    const auditorField = stage === 'data'
      ? 'dataAuditorId'
      : stage === 'qualification'
      ? 'qualificationAuditorId'
      : 'permissionAuditorId';
    const auditAtField = stage === 'data'
      ? 'dataAuditAt'
      : stage === 'qualification'
      ? 'qualificationAuditAt'
      : 'permissionAuditAt';
    const auditRemarkField = stage === 'data'
      ? 'dataAuditRemark'
      : stage === 'qualification'
      ? 'qualificationAuditRemark'
      : 'permissionAuditRemark';

    const updateData: any = {
      auditStage: ChannelAuditStage.REJECTED as any,
      auditStatus: ChannelAuditStatus.REJECTED as any,
      rejectIssueTypes: rejectData.issueTypes as any,
      rejectCustomRemark: rejectData.customRemark,
      rejectedAt: new Date(),
      lockUntil,
      [auditorField]: auditUserId,
      [auditAtField]: new Date(),
      [auditRemarkField]: fullRemark,
    };

    await channelAuditDao.update(updateData, { where: { id } });

    await channelAuditLogDao.create({
      channelAuditId: id,
      action,
      fromStage: (audit as any).auditStage,
      toStage: ChannelAuditStage.REJECTED,
      fromStatus: (audit as any).auditStatus,
      toStatus: ChannelAuditStatus.REJECTED,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || (auditor as any)?.username || '系统',
      remark: fullRemark,
      rejectIssueTypes: rejectData.issueTypes as any,
      rejectCustomRemark: rejectData.customRemark,
      metadata: JSON.stringify({ lockDays, lockUntil }),
    });

    await this.sendRejectNotification(audit, issueLabels, rejectData.customRemark, lockUntil);

    await CacheUtils.del(`${CacheKey.CHANNEL_AUDIT_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
  }

  public async batchDataPass(ids: string[], auditUserId: string): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'dataPass');
  }

  public async batchQualificationPass(ids: string[], auditUserId: string): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'qualificationPass');
  }

  public async batchPermissionPass(ids: string[], auditUserId: string): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'permissionPass');
  }

  public async batchDataReject(ids: string[], auditUserId: string, rejectData: RejectData): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'dataReject', rejectData);
  }

  public async batchQualificationReject(ids: string[], auditUserId: string, rejectData: RejectData): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'qualificationReject', rejectData);
  }

  public async batchPermissionReject(ids: string[], auditUserId: string, rejectData: RejectData): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'permissionReject', rejectData);
  }

  private async batchAudit(
    ids: string[],
    auditUserId: string,
    operation: 'dataPass' | 'qualificationPass' | 'permissionPass' | 'dataReject' | 'qualificationReject' | 'permissionReject',
    rejectData?: RejectData
  ): Promise<BatchAuditResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }

    const result: BatchAuditResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    const isPassOperation = operation.endsWith('Pass');

    for (const id of ids) {
      try {
        const audit = await channelAuditDao.findById(id);
        if (!audit) {
          result.skipped++;
          result.details.push({ id, name: '-', contactPhone: '-', status: 'skipped', reason: '记录不存在' });
          continue;
        }

        const blacklistCheck = await channelBlacklistDao.checkMatch({
          contactPhone: (audit as any).contactPhone,
          creditCode: (audit as any).creditCode,
          companyName: (audit as any).companyName,
        });
        if (blacklistCheck.matched && isPassOperation) {
          result.skipped++;
          result.details.push({
            id,
            name: (audit as any).name,
            contactPhone: (audit as any).contactPhone || '-',
            status: 'skipped',
            reason: '匹配黑名单记录，已自动过滤跳过',
          });
          continue;
        }

        if ((audit as any).riskFlagged && isPassOperation) {
          result.skipped++;
          result.details.push({
            id,
            name: (audit as any).name,
            contactPhone: (audit as any).contactPhone || '-',
            status: 'skipped',
            reason: (audit as any).riskReason || '存在风险标记，已自动过滤跳过',
          });
          continue;
        }

        const expectedStage = operation.startsWith('data')
          ? ChannelAuditStage.DATA_REVIEW
          : operation.startsWith('qualification')
          ? ChannelAuditStage.QUALIFICATION_VERIFY
          : ChannelAuditStage.PERMISSION_ACTIVATE;

        if ((audit as any).auditStage !== expectedStage) {
          result.skipped++;
          result.details.push({
            id,
            name: (audit as any).name,
            contactPhone: (audit as any).contactPhone || '-',
            status: 'skipped',
            reason: `审核阶段不匹配（当前：${this.getStageLabel((audit as any).auditStage)}）`,
          });
          continue;
        }

        if (isPassOperation) {
          if (operation === 'dataPass') {
            await this.dataReviewPass(id, auditUserId);
          } else if (operation === 'qualificationPass') {
            await this.qualificationVerifyPass(id, auditUserId);
          } else if (operation === 'permissionPass') {
            await this.permissionActivatePass(id, auditUserId);
          }
        } else if (rejectData) {
          if (operation === 'dataReject') {
            await this.dataReviewReject(id, auditUserId, rejectData);
          } else if (operation === 'qualificationReject') {
            await this.qualificationVerifyReject(id, auditUserId, rejectData);
          } else if (operation === 'permissionReject') {
            await this.permissionActivateReject(id, auditUserId, rejectData);
          }
        }

        result.success++;
        result.details.push({
          id,
          name: (audit as any).name,
          contactPhone: (audit as any).contactPhone || '-',
          status: 'success',
        });
      } catch (err: any) {
        result.failed++;
        const audit = await channelAuditDao.findById(id);
        result.details.push({
          id,
          name: audit ? (audit as any).name : '-',
          contactPhone: audit ? ((audit as any).contactPhone || '-') : '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.CHANNEL_AUDIT_LIST}*`);
    return result;
  }

  public async getAuditList(params: PaginationParams & {
    keyword?: string;
    auditStageList?: ChannelAuditStage[];
    auditStatusList?: ChannelAuditStatus[];
    priority?: number;
    riskFlagged?: boolean;
    contactPhone?: string;
    creditCode?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    isKeyChannel?: boolean;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.CHANNEL_AUDIT_LIST}:${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await channelAuditDao.findAllPaged(params as any);
    const list = rows.map((row: any) => {
      const plain = row.get ? row.get({ plain: true }) : row;
      return {
        ...plain,
        lockRemainingHours: plain.lockUntil ? getRemainingHours(new Date(plain.lockUntil)) : 0,
      };
    });

    const result: PaginationResult<any> = {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getAuditDetail(id: string): Promise<any> {
    const cacheKey = `${CacheKey.CHANNEL_AUDIT_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const audit = await channelAuditDao.findByIdWithAuditLogs(id);
    if (!audit) {
      throw new AppError('渠道审核申请不存在', BusinessCode.NOT_FOUND);
    }

    const plain = audit.get({ plain: true }) as any;
    const rejectRecords = (plain.auditLogs || []).filter((log: any) =>
      [ChannelAuditAction.DATA_REJECT, ChannelAuditAction.QUALIFICATION_REJECT, ChannelAuditAction.PERMISSION_REJECT].includes(log.action)
    );

    const timeline = this.buildTimeline(plain);

    const result = {
      ...plain,
      rejectRecords: rejectRecords.map((log: any) => {
        const lockUntil = log.metadata?.lockUntil ? new Date(log.metadata.lockUntil) : null;
        return {
          id: log.id,
          action: log.action,
          stage: this.getStageLabel(log.fromStage),
          operator: log.operatorName,
          issueTypes: log.rejectIssueTypes || [],
          issueLabels: (log.rejectIssueTypes || []).map((t: string) => (CHANNEL_REJECT_ISSUE_LABELS as any)[t] || t),
          customRemark: log.rejectCustomRemark,
          fullRemark: log.remark,
          lockUntil,
          remainingHours: lockUntil ? getRemainingHours(lockUntil) : 0,
          locked: lockUntil ? lockUntil.getTime() > Date.now() : false,
          createdAt: log.createdAt,
        };
      }),
      timeline,
      lockRemainingHours: plain.lockUntil ? getRemainingHours(new Date(plain.lockUntil)) : 0,
      isLocked: plain.lockUntil && new Date(plain.lockUntil).getTime() > Date.now(),
      stageConfig: CHANNEL_AUDIT_STAGES,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  private buildTimeline(audit: any): any[] {
    const timeline: any[] = [];

    timeline.push({
      stage: '提交申请',
      time: audit.createdAt,
      status: 'completed',
      description: '渠道提交入驻申请',
    });

    if (audit.dataAuditAt) {
      const passed = audit.auditStage >= ChannelAuditStage.QUALIFICATION_VERIFY || audit.auditStatus === ChannelAuditStatus.PASSED;
      timeline.push({
        stage: '资料初审',
        time: audit.dataAuditAt,
        operator: audit.dataAuditor?.nickname || audit.dataAuditor?.username,
        status: passed ? 'completed' : (audit.auditStage === ChannelAuditStage.DATA_REVIEW ? 'current' : 'rejected'),
        description: audit.dataAuditRemark || (passed ? '资料初审通过' : '资料初审驳回'),
      });
    } else if (audit.auditStage >= ChannelAuditStage.DATA_REVIEW) {
      timeline.push({
        stage: '资料初审',
        status: audit.auditStage === ChannelAuditStage.DATA_REVIEW ? 'current' : 'pending',
        description: '等待资料初审',
      });
    }

    if (audit.qualificationAuditAt) {
      const passed = audit.auditStage >= ChannelAuditStage.PERMISSION_ACTIVATE || audit.auditStatus === ChannelAuditStatus.PASSED;
      timeline.push({
        stage: '资质核验',
        time: audit.qualificationAuditAt,
        operator: audit.qualificationAuditor?.nickname || audit.qualificationAuditor?.username,
        status: passed ? 'completed' : (audit.auditStage === ChannelAuditStage.QUALIFICATION_VERIFY ? 'current' : 'rejected'),
        description: audit.qualificationAuditRemark || (passed ? '资质核验通过' : '资质核验驳回'),
      });
    } else if (audit.auditStage >= ChannelAuditStage.QUALIFICATION_VERIFY) {
      timeline.push({
        stage: '资质核验',
        status: audit.auditStage === ChannelAuditStage.QUALIFICATION_VERIFY ? 'current' : 'pending',
        description: '等待资质核验',
      });
    }

    if (audit.permissionAuditAt) {
      const passed = audit.auditStatus === ChannelAuditStatus.PASSED;
      timeline.push({
        stage: '权限开通',
        time: audit.permissionAuditAt,
        operator: audit.permissionAuditor?.nickname || audit.permissionAuditor?.username,
        status: passed ? 'completed' : (audit.auditStage === ChannelAuditStage.PERMISSION_ACTIVATE ? 'current' : 'rejected'),
        description: audit.permissionAuditRemark || (passed ? '权限已开通' : '权限开通驳回'),
      });
    } else if (audit.auditStage >= ChannelAuditStage.PERMISSION_ACTIVATE) {
      timeline.push({
        stage: '权限开通',
        status: audit.auditStage === ChannelAuditStage.PERMISSION_ACTIVATE ? 'current' : 'pending',
        description: '等待权限开通',
      });
    }

    return timeline;
  }

  public async searchAuditLogs(params: {
    page: number;
    pageSize: number;
    channelAuditId?: string;
    operatorId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;

    const { rows, count } = await channelAuditLogDao.findAllPaged(params as any);

    return {
      list: rows.map((r: any) => ({
        ...(r.get ? r.get({ plain: true }) : r),
        actionLabel: this.getActionLabel(r.action),
        fromStageLabel: this.getStageLabel(r.fromStage),
        toStageLabel: this.getStageLabel(r.toStage),
        fromStatusLabel: this.getStatusLabel(r.fromStatus),
        toStatusLabel: this.getStatusLabel(r.toStatus),
      })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getStatistics(): Promise<any> {
    const [dataReview, qualificationVerify, permissionActivate, rejected, passed, total, riskFlagged, keyChannels] = await Promise.all([
      channelAuditDao.count({ where: { auditStage: ChannelAuditStage.DATA_REVIEW as any } }),
      channelAuditDao.count({ where: { auditStage: ChannelAuditStage.QUALIFICATION_VERIFY as any } }),
      channelAuditDao.count({ where: { auditStage: ChannelAuditStage.PERMISSION_ACTIVATE as any } }),
      channelAuditDao.count({ where: { auditStatus: ChannelAuditStatus.REJECTED as any } }),
      channelAuditDao.count({ where: { auditStatus: ChannelAuditStatus.PASSED as any } }),
      channelAuditDao.count(),
      channelAuditDao.count({ where: { riskFlagged: true as any } }),
      channelAuditDao.count({ where: { isKeyChannel: true as any } }),
    ]);

    return {
      dataReview,
      qualificationVerify,
      permissionActivate,
      pendingTotal: dataReview + qualificationVerify + permissionActivate,
      rejected,
      passed,
      total,
      riskFlagged,
      keyChannels,
    };
  }

  private async sendRejectNotification(
    audit: any,
    issueLabels: string,
    customRemark?: string,
    lockUntil?: Date
  ): Promise<void> {
    try {
      const lockInfo = lockUntil
        ? `，整改锁定期间无法重复提交申请，解锁时间：${lockUntil.toLocaleString('zh-CN')}`
        : '';
      const message = `您的渠道入驻申请已被驳回，存在以下问题：${issueLabels}${customRemark ? `（${customRemark}）` : ''}${lockInfo}`;
      console.log(`[ChannelNotification] 发送给 ${audit.contactPhone}: ${message}`);
    } catch (err) {
      console.error('发送渠道驳回通知失败:', err);
    }
  }

  private getStageLabel(stage: ChannelAuditStage): string {
    const map: Record<ChannelAuditStage, string> = {
      [ChannelAuditStage.PENDING_SUBMIT]: '待提交',
      [ChannelAuditStage.DATA_REVIEW]: '资料初审',
      [ChannelAuditStage.QUALIFICATION_VERIFY]: '资质核验',
      [ChannelAuditStage.PERMISSION_ACTIVATE]: '权限开通',
      [ChannelAuditStage.COMPLETED]: '审核完成',
      [ChannelAuditStage.REJECTED]: '已驳回',
    };
    return map[stage] || String(stage);
  }

  private getStatusLabel(status: ChannelAuditStatus): string {
    const map: Record<ChannelAuditStatus, string> = {
      [ChannelAuditStatus.PENDING]: '待处理',
      [ChannelAuditStatus.DATA_AUDITING]: '资料初审中',
      [ChannelAuditStatus.DATA_PASSED]: '资料初审通过',
      [ChannelAuditStatus.QUALIFICATION_AUDITING]: '资质核验中',
      [ChannelAuditStatus.QUALIFICATION_PASSED]: '资质核验通过',
      [ChannelAuditStatus.PERMISSION_AUDITING]: '权限开通中',
      [ChannelAuditStatus.PASSED]: '审核通过',
      [ChannelAuditStatus.REJECTED]: '已驳回',
      [ChannelAuditStatus.BLACKLISTED]: '黑名单拦截',
      [ChannelAuditStatus.LOCKED]: '锁定中',
    };
    return map[status] || String(status);
  }

  private getActionLabel(action: ChannelAuditAction): string {
    const map: Record<ChannelAuditAction, string> = {
      [ChannelAuditAction.SUBMIT]: '提交申请',
      [ChannelAuditAction.DATA_PASS]: '资料初审通过',
      [ChannelAuditAction.DATA_REJECT]: '资料初审驳回',
      [ChannelAuditAction.QUALIFICATION_PASS]: '资质核验通过',
      [ChannelAuditAction.QUALIFICATION_REJECT]: '资质核验驳回',
      [ChannelAuditAction.PERMISSION_PASS]: '权限开通',
      [ChannelAuditAction.PERMISSION_REJECT]: '权限开通驳回',
      [ChannelAuditAction.BLACKLIST_BLOCK]: '黑名单拦截',
    };
    return map[action] || String(action);
  }
}

export default new ChannelAuditService();
