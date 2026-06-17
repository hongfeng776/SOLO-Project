import { createHash } from 'crypto';
import { promoterDao, promoterBlacklistDao, promoterAuditLogDao, userDao } from '../dao';
import { PromoterCreationAttributes, PromoterAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  PromoterStatus,
  AuditStage,
  AuditAction,
  AuditStatus,
  BlacklistType,
  REJECT_REASONS,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

const LOCK_WINDOW_DAYS = 7;

interface PreCheckResult {
  valid: boolean;
  errors: string[];
  blacklistMatched?: {
    items: any[];
  };
  lockInfo?: {
    locked: boolean;
    lockUntil?: Date;
    remainingHours?: number;
  };
  dataIntegrity?: {
    missingFields: string[];
  };
  riskFlags: string[];
}

interface ApplyData {
  name: string;
  phone: string;
  idCard?: string;
  wechatId?: string;
  channelId?: string;
  idCardFrontImg?: string;
  idCardBackImg?: string;
  [key: string]: any;
}

interface RejectData {
  reasonCode: string;
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
    phone: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const ID_CARD_REGEX = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

function validateIdCard(idCard: string): boolean {
  if (!ID_CARD_REGEX.test(idCard)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard.charAt(i), 10) * weights[i];
  }
  const expectedCode = checkCodes[sum % 11];
  const actualCode = idCard.charAt(17).toUpperCase();
  return expectedCode === actualCode;
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

class PromoterAuditService {
  public async preCheckApplyData(data: ApplyData, promoterId?: string): Promise<PreCheckResult> {
    const result: PreCheckResult = {
      valid: true,
      errors: [],
      riskFlags: [],
    };

    const requiredFields = ['name', 'phone'];
    const missingFields = requiredFields.filter((f) => !data[f] || String(data[f]).trim() === '');
    if (missingFields.length > 0) {
      result.valid = false;
      result.dataIntegrity = { missingFields };
      result.errors.push(`缺少必填字段：${missingFields.join('、')}`);
    }

    if (data.phone) {
      if (!validatePhone(data.phone)) {
        result.valid = false;
        result.errors.push('手机号格式不正确');
      } else {
        const phoneExists = await promoterDao.existsByPhone(data.phone, promoterId);
        if (phoneExists) {
          result.valid = false;
          result.errors.push('手机号已被其他推客使用');
          result.riskFlags.push('手机号重复');
        }
      }
    }

    if (data.idCard) {
      if (!validateIdCard(data.idCard)) {
        result.valid = false;
        result.errors.push('身份证号码格式不正确或校验位错误');
        result.riskFlags.push('身份证信息异常');
      } else {
        const idCardExists = await promoterDao.existsByIdCard(data.idCard, promoterId);
        if (idCardExists) {
          result.valid = false;
          result.errors.push('身份证号已被其他推客使用');
          result.riskFlags.push('身份证重复');
        }
      }
    }

    const blacklistResult = await promoterBlacklistDao.checkMatch({
      phone: data.phone,
      idCard: data.idCard,
      name: data.name,
      wechatId: data.wechatId,
    });
    if (blacklistResult.matched) {
      result.valid = false;
      result.blacklistMatched = { items: blacklistResult.items };
      result.errors.push('申请信息匹配黑名单记录，已被拦截');
      result.riskFlags.push('黑名单匹配');
    }

    const lockStatus = await promoterDao.checkLockStatus(data.phone, data.idCard);
    if (lockStatus.locked && lockStatus.lockUntil) {
      result.valid = false;
      result.lockInfo = {
        locked: true,
        lockUntil: lockStatus.lockUntil,
        remainingHours: getRemainingHours(lockStatus.lockUntil),
      };
      result.errors.push(
        `当前账号处于锁定状态，剩余锁定时间约 ${result.lockInfo.remainingHours} 小时`
      );
    }

    return result;
  }

  public async submitApply(data: PromoterCreationAttributes & ApplyData): Promise<any> {
    const preCheck = await this.preCheckApplyData(data);
    if (!preCheck.valid) {
      throw new AppError(preCheck.errors.join('；'), BusinessCode.PARAM_ERROR);
    }

    const existingByPhone = await promoterDao.findByPhone(data.phone);
    if (existingByPhone) {
      const applyCount = (existingByPhone.applyCount || 0) + 1;
      const newHash = calculateDataHash({
        name: data.name,
        phone: data.phone,
        idCard: data.idCard,
        wechatId: data.wechatId,
        channelId: data.channelId,
      });
      const hashChanged = existingByPhone.dataHash && existingByPhone.dataHash !== newHash;
      const riskFlagged = hashChanged;
      const riskReason = hashChanged ? '申请信息与历史记录不一致，存在篡改痕迹' : undefined;

      await promoterDao.update(
        {
          ...data,
          auditStage: AuditStage.FIRST_AUDIT as any,
          auditStatus: AuditStatus.FIRST_AUDITING as any,
          status: PromoterStatus.PENDING as any,
          applyCount,
          lastApplyAt: new Date(),
          dataHash: newHash,
          riskFlagged,
          riskReason,
          rejectReasonCode: undefined,
          rejectCustomRemark: undefined,
          rejectedAt: undefined,
          firstAuditorId: undefined,
          firstAuditAt: undefined,
          firstAuditRemark: undefined,
          secondAuditorId: undefined,
          secondAuditAt: undefined,
          secondAuditRemark: undefined,
        } as any,
        { where: { id: existingByPhone.id } }
      );

      await promoterAuditLogDao.create({
        promoterId: existingByPhone.id,
        action: AuditAction.SUBMIT,
        fromStage: existingByPhone.auditStage,
        toStage: AuditStage.FIRST_AUDIT,
        fromStatus: existingByPhone.auditStatus,
        toStatus: AuditStatus.FIRST_AUDITING,
        metadata: JSON.stringify({
          applyCount,
          hashChanged,
          riskFlagged,
        }),
      } as any);

      await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${existingByPhone.id}`);
      await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
      return promoterDao.findById(existingByPhone.id);
    }

    const code = await this.generateCode();
    const dataHash = calculateDataHash({
      name: data.name,
      phone: data.phone,
      idCard: data.idCard,
      wechatId: data.wechatId,
      channelId: data.channelId,
    });

    const promoter = await promoterDao.create({
      ...data,
      code,
      level: data.level as any || 'L1',
      status: PromoterStatus.PENDING as any,
      auditStage: AuditStage.FIRST_AUDIT as any,
      auditStatus: AuditStatus.FIRST_AUDITING as any,
      registerAt: new Date(),
      lastApplyAt: new Date(),
      applyCount: 1,
      dataHash,
    } as any);

    await promoterAuditLogDao.create({
      promoterId: promoter.id,
      action: AuditAction.SUBMIT,
      fromStage: AuditStage.PENDING_SUBMIT,
      toStage: AuditStage.FIRST_AUDIT,
      fromStatus: AuditStatus.PENDING,
      toStatus: AuditStatus.FIRST_AUDITING,
      metadata: JSON.stringify({ firstApply: true }),
    } as any);

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return promoter;
  }

  private async generateCode(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const todayCount = await promoterDao.getTodayCount();
    const seq = String(todayCount + 1).padStart(6, '0');
    const code = `P${dateStr}${seq}`;
    const exists = await promoterDao.existsByCode(code);
    if (exists) {
      return this.generateCode();
    }
    return code;
  }

  public async firstAuditPass(id: string, auditUserId: string, remark?: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客申请不存在', BusinessCode.NOT_FOUND);
    }
    if (promoter.auditStage !== AuditStage.FIRST_AUDIT) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行初审通过操作`,
        BusinessCode.ERROR
      );
    }
    if (promoter.auditStatus !== AuditStatus.FIRST_AUDITING) {
      throw new AppError(
        `当前审核状态为「${this.getStatusLabel(promoter.auditStatus)}」，不可执行初审通过操作`,
        BusinessCode.ERROR
      );
    }

    const auditor = await userDao.findById(auditUserId);

    await promoterDao.update(
      {
        auditStage: AuditStage.SECOND_AUDIT as any,
        auditStatus: AuditStatus.SECOND_AUDITING as any,
        firstAuditorId: auditUserId,
        firstAuditAt: new Date(),
        firstAuditRemark: remark,
      } as any,
      { where: { id } }
    );

    await promoterAuditLogDao.create({
      promoterId: id,
      action: AuditAction.FIRST_PASS,
      fromStage: AuditStage.FIRST_AUDIT,
      toStage: AuditStage.SECOND_AUDIT,
      fromStatus: AuditStatus.FIRST_AUDITING,
      toStatus: AuditStatus.SECOND_AUDITING,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || auditor?.username || '系统',
      remark,
    });

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async firstAuditReject(
    id: string,
    auditUserId: string,
    rejectData: RejectData
  ): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客申请不存在', BusinessCode.NOT_FOUND);
    }
    if (promoter.auditStage !== AuditStage.FIRST_AUDIT) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行初审驳回操作`,
        BusinessCode.ERROR
      );
    }

    const validReason = REJECT_REASONS.find((r) => r.code === rejectData.reasonCode);
    if (!validReason) {
      throw new AppError('驳回原因代码无效', BusinessCode.PARAM_ERROR);
    }

    const auditor = await userDao.findById(auditUserId);
    const lockDays = rejectData.lockDays ?? LOCK_WINDOW_DAYS;
    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + lockDays);

    await promoterDao.update(
      {
        auditStage: AuditStage.REJECTED as any,
        auditStatus: AuditStatus.REJECTED as any,
        status: PromoterStatus.REJECTED as any,
        firstAuditorId: auditUserId,
        firstAuditAt: new Date(),
        firstAuditRemark: rejectData.customRemark,
        rejectReasonCode: rejectData.reasonCode,
        rejectCustomRemark: rejectData.customRemark,
        rejectedAt: new Date(),
        lockUntil,
      } as any,
      { where: { id } }
    );

    await promoterAuditLogDao.create({
      promoterId: id,
      action: AuditAction.FIRST_REJECT,
      fromStage: AuditStage.FIRST_AUDIT,
      toStage: AuditStage.REJECTED,
      fromStatus: AuditStatus.FIRST_AUDITING,
      toStatus: AuditStatus.REJECTED,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || auditor?.username || '系统',
      remark: `[${validReason.label}] ${rejectData.customRemark || ''}`.trim(),
      rejectReasonCode: rejectData.reasonCode,
      rejectCustomRemark: rejectData.customRemark,
      metadata: JSON.stringify({ lockDays, lockUntil }),
    });

    await this.sendRejectNotification(promoter, validReason.label, rejectData.customRemark, lockUntil);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async secondAuditPass(id: string, auditUserId: string, remark?: string): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客申请不存在', BusinessCode.NOT_FOUND);
    }
    if (promoter.auditStage !== AuditStage.SECOND_AUDIT) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行复审通过操作`,
        BusinessCode.ERROR
      );
    }
    if (promoter.auditStatus !== AuditStatus.SECOND_AUDITING) {
      throw new AppError(
        `当前审核状态为「${this.getStatusLabel(promoter.auditStatus)}」，不可执行复审通过操作`,
        BusinessCode.ERROR
      );
    }

    const auditor = await userDao.findById(auditUserId);

    await promoterDao.update(
      {
        auditStage: AuditStage.COMPLETED as any,
        auditStatus: AuditStatus.PASSED as any,
        status: PromoterStatus.NORMAL as any,
        secondAuditorId: auditUserId,
        secondAuditAt: new Date(),
        secondAuditRemark: remark,
      } as any,
      { where: { id } }
    );

    await promoterAuditLogDao.create({
      promoterId: id,
      action: AuditAction.SECOND_PASS,
      fromStage: AuditStage.SECOND_AUDIT,
      toStage: AuditStage.COMPLETED,
      fromStatus: AuditStatus.SECOND_AUDITING,
      toStatus: AuditStatus.PASSED,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || auditor?.username || '系统',
      remark,
    });

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async secondAuditReject(
    id: string,
    auditUserId: string,
    rejectData: RejectData
  ): Promise<void> {
    const promoter = await promoterDao.findById(id);
    if (!promoter) {
      throw new AppError('推客申请不存在', BusinessCode.NOT_FOUND);
    }
    if (promoter.auditStage !== AuditStage.SECOND_AUDIT) {
      throw new AppError(
        `当前审核阶段为「${this.getStageLabel(promoter.auditStage)}」，不可执行复审驳回操作`,
        BusinessCode.ERROR
      );
    }

    const validReason = REJECT_REASONS.find((r) => r.code === rejectData.reasonCode);
    if (!validReason) {
      throw new AppError('驳回原因代码无效', BusinessCode.PARAM_ERROR);
    }

    const auditor = await userDao.findById(auditUserId);
    const lockDays = rejectData.lockDays ?? LOCK_WINDOW_DAYS;
    const lockUntil = new Date();
    lockUntil.setDate(lockUntil.getDate() + lockDays);

    await promoterDao.update(
      {
        auditStage: AuditStage.REJECTED as any,
        auditStatus: AuditStatus.REJECTED as any,
        status: PromoterStatus.REJECTED as any,
        secondAuditorId: auditUserId,
        secondAuditAt: new Date(),
        secondAuditRemark: rejectData.customRemark,
        rejectReasonCode: rejectData.reasonCode,
        rejectCustomRemark: rejectData.customRemark,
        rejectedAt: new Date(),
        lockUntil,
      } as any,
      { where: { id } }
    );

    await promoterAuditLogDao.create({
      promoterId: id,
      action: AuditAction.SECOND_REJECT,
      fromStage: AuditStage.SECOND_AUDIT,
      toStage: AuditStage.REJECTED,
      fromStatus: AuditStatus.SECOND_AUDITING,
      toStatus: AuditStatus.REJECTED,
      operatorId: auditUserId,
      operatorName: (auditor as any)?.nickname || auditor?.username || '系统',
      remark: `[${validReason.label}] ${rejectData.customRemark || ''}`.trim(),
      rejectReasonCode: rejectData.reasonCode,
      rejectCustomRemark: rejectData.customRemark,
      metadata: JSON.stringify({ lockDays, lockUntil }),
    });

    await this.sendRejectNotification(promoter, validReason.label, rejectData.customRemark, lockUntil);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async batchFirstPass(ids: string[], auditUserId: string): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'firstPass');
  }

  public async batchSecondPass(ids: string[], auditUserId: string): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'secondPass');
  }

  public async batchFirstReject(
    ids: string[],
    auditUserId: string,
    rejectData: RejectData
  ): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'firstReject', rejectData);
  }

  public async batchSecondReject(
    ids: string[],
    auditUserId: string,
    rejectData: RejectData
  ): Promise<BatchAuditResult> {
    return this.batchAudit(ids, auditUserId, 'secondReject', rejectData);
  }

  private async batchAudit(
    ids: string[],
    auditUserId: string,
    operation: 'firstPass' | 'secondPass' | 'firstReject' | 'secondReject',
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

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          result.skipped++;
          result.details.push({ id, name: '-', phone: '-', status: 'skipped', reason: '记录不存在' });
          continue;
        }

        const blacklistCheck = await promoterBlacklistDao.checkMatch({
          phone: promoter.phone,
          idCard: promoter.idCard,
          name: promoter.name,
        });
        if (blacklistCheck.matched && (operation === 'firstPass' || operation === 'secondPass')) {
          result.skipped++;
          result.details.push({
            id,
            name: promoter.name,
            phone: promoter.phone || '-',
            status: 'skipped',
            reason: '匹配黑名单记录，已跳过',
          });
          continue;
        }

        if (promoter.riskFlagged && (operation === 'firstPass' || operation === 'secondPass')) {
          result.skipped++;
          result.details.push({
            id,
            name: promoter.name,
            phone: promoter.phone || '-',
            status: 'skipped',
            reason: promoter.riskReason || '存在风险标记，已跳过',
          });
          continue;
        }

        const expectedStage = operation.startsWith('first') ? AuditStage.FIRST_AUDIT : AuditStage.SECOND_AUDIT;
        if (promoter.auditStage !== expectedStage) {
          result.skipped++;
          result.details.push({
            id,
            name: promoter.name,
            phone: promoter.phone || '-',
            status: 'skipped',
            reason: `审核阶段不匹配（当前：${this.getStageLabel(promoter.auditStage)}）`,
          });
          continue;
        }

        if (operation === 'firstPass') {
          await this.firstAuditPass(id, auditUserId);
        } else if (operation === 'secondPass') {
          await this.secondAuditPass(id, auditUserId);
        } else if (operation === 'firstReject' && rejectData) {
          await this.firstAuditReject(id, auditUserId, rejectData);
        } else if (operation === 'secondReject' && rejectData) {
          await this.secondAuditReject(id, auditUserId, rejectData);
        }

        result.success++;
        result.details.push({
          id,
          name: promoter.name,
          phone: promoter.phone || '-',
          status: 'success',
        });
      } catch (err: any) {
        result.failed++;
        const promoter = await promoterDao.findById(id);
        result.details.push({
          id,
          name: promoter?.name || '-',
          phone: promoter?.phone || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return result;
  }

  public async getAuditList(params: PaginationParams & {
    keyword?: string;
    auditStageList?: AuditStage[];
    auditStatusList?: AuditStatus[];
    channelId?: string;
    level?: string;
    phone?: string;
    idCard?: string;
    riskFlagged?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.PROMOTER_LIST}audit_${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await promoterDao.findAuditListPaged(params as any);
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
    const cacheKey = `${CacheKey.PROMOTER_DETAIL}audit_${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const promoter = await promoterDao.findByIdWithAuditLogs(id);
    if (!promoter) {
      throw new AppError('推客申请不存在', BusinessCode.NOT_FOUND);
    }

    const plain = promoter.get({ plain: true }) as any;
    const rejectRecords = (plain.auditLogs || []).filter((log: any) =>
      [AuditAction.FIRST_REJECT, AuditAction.SECOND_REJECT].includes(log.action)
    );

    const result = {
      ...plain,
      rejectRecords: rejectRecords.map((log: any) => {
        const lockUntil = log.metadata?.lockUntil ? new Date(log.metadata.lockUntil) : null;
        return {
          id: log.id,
          action: log.action,
          stage: this.getStageLabel(log.fromStage),
          operator: log.operatorName,
          reasonCode: log.rejectReasonCode,
          reasonLabel: REJECT_REASONS.find((r) => r.code === log.rejectReasonCode)?.label,
          customRemark: log.rejectCustomRemark,
          fullRemark: log.remark,
          lockUntil,
          remainingHours: lockUntil ? getRemainingHours(lockUntil) : 0,
          locked: lockUntil ? lockUntil.getTime() > Date.now() : false,
          createdAt: log.createdAt,
        };
      }),
      lockRemainingHours: plain.lockUntil ? getRemainingHours(new Date(plain.lockUntil)) : 0,
      isLocked: plain.lockUntil && new Date(plain.lockUntil).getTime() > Date.now(),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async searchAuditLogs(params: {
    page: number;
    pageSize: number;
    phone?: string;
    idCard?: string;
    promoterId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginationResult<any>> {
    const { page, pageSize, phone, idCard } = params;

    let promoterId = params.promoterId;
    if (!promoterId && (phone || idCard)) {
      const where: any = {};
      if (phone) where.phone = phone;
      if (idCard) where.idCard = idCard;
      const promoter = await promoterDao.findOne({ where });
      if (promoter) {
        promoterId = promoter.id;
      } else {
        return { list: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

    const { rows, count } = await promoterAuditLogDao.findAllPaged({
      ...params,
      promoterId,
    } as any);

    return {
      list: rows.map((r) => ({
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
    const [pendingFirst, pendingSecond, rejected, passed] = await Promise.all([
      promoterDao.count({ where: { auditStage: AuditStage.FIRST_AUDIT as any } }),
      promoterDao.count({ where: { auditStage: AuditStage.SECOND_AUDIT as any } }),
      promoterDao.count({ where: { auditStatus: AuditStatus.REJECTED as any } }),
      promoterDao.count({ where: { auditStatus: AuditStatus.PASSED as any } }),
    ]);

    return {
      pendingFirst,
      pendingSecond,
      pendingTotal: pendingFirst + pendingSecond,
      rejected,
      passed,
    };
  }

  private async sendRejectNotification(
    promoter: any,
    reasonLabel: string,
    customRemark?: string,
    lockUntil?: Date
  ): Promise<void> {
    try {
      const lockInfo = lockUntil
        ? `，锁定期间无法重复提交申请，解锁时间：${lockUntil.toLocaleString('zh-CN')}`
        : '';
      const message = `您的推客入驻申请已被驳回，原因：${reasonLabel}${customRemark ? `（${customRemark}）` : ''}${lockInfo}`;
      console.log(`[Notification] 发送给 ${promoter.phone}: ${message}`);
    } catch (err) {
      console.error('发送通知失败:', err);
    }
  }

  private getStageLabel(stage: AuditStage): string {
    const map: Record<AuditStage, string> = {
      [AuditStage.PENDING_SUBMIT]: '待提交',
      [AuditStage.FIRST_AUDIT]: '初审中',
      [AuditStage.SECOND_AUDIT]: '复审中',
      [AuditStage.COMPLETED]: '审核完成',
      [AuditStage.REJECTED]: '已驳回',
    };
    return map[stage] || String(stage);
  }

  private getStatusLabel(status: AuditStatus): string {
    const map: Record<AuditStatus, string> = {
      [AuditStatus.PENDING]: '待处理',
      [AuditStatus.FIRST_AUDITING]: '初审中',
      [AuditStatus.FIRST_PASSED]: '初审通过',
      [AuditStatus.SECOND_AUDITING]: '复审中',
      [AuditStatus.PASSED]: '审核通过',
      [AuditStatus.REJECTED]: '已驳回',
      [AuditStatus.BLACKLISTED]: '黑名单拦截',
      [AuditStatus.LOCKED]: '锁定中',
    };
    return map[status] || String(status);
  }

  private getActionLabel(action: AuditAction): string {
    const map: Record<AuditAction, string> = {
      [AuditAction.SUBMIT]: '提交申请',
      [AuditAction.FIRST_PASS]: '初审通过',
      [AuditAction.FIRST_REJECT]: '初审驳回',
      [AuditAction.SECOND_PASS]: '复审通过',
      [AuditAction.SECOND_REJECT]: '复审驳回',
      [AuditAction.ROLLBACK]: '回退状态',
      [AuditAction.BLACKLIST_BLOCK]: '黑名单拦截',
    };
    return map[action] || String(action);
  }
}

export default new PromoterAuditService();
