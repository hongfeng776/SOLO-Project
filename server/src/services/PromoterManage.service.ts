import {
  promoterDao,
  promoterChangeLogDao,
  promoterQualificationDao,
  userDao,
} from '../dao';
import { PromoterAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  PromoterLevel,
  PromoterStatus,
  VerifyStatus,
  QualificationType,
  SettleStatus,
  PromoteStatus,
  PROMOTER_LEVEL_CONFIGS,
  BASIC_EDIT_FIELDS,
  ADMIN_EDIT_FIELDS,
  UserRole,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';

const FIELD_LABEL_MAP: Record<string, string> = {
  name: '姓名',
  nickname: '昵称',
  avatar: '头像',
  email: '邮箱',
  phone: '手机号',
  wechatId: '微信号',
  idCard: '身份证号',
  idCardFrontImg: '身份证人像面',
  idCardBackImg: '身份证国徽面',
  level: '推客等级',
  channelId: '所属渠道',
  parentId: '上级推客',
  status: '账号状态',
  promoteStatus: '推广状态',
  settleStatus: '结算状态',
  commissionRate: '佣金比例',
  realName: '真实姓名',
  verifyStatus: '实名认证状态',
  qualificationImgs: '资质图片',
  qualificationExpireAt: '资质有效期',
  remark: '备注',
};

interface UniquenessCheckResult {
  duplicateFields: { field: string; value: string; duplicatePromoters: any[] }[];
  valid: boolean;
}

interface BatchUpdateResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: {
    id: string;
    name: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }[];
}

interface QualificationValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const LOW_PERFORMANCE_THRESHOLD = {
  minOrders: 10,
  minAmount: 5000,
};

function getFieldLabel(field: string): string {
  return FIELD_LABEL_MAP[field] || field;
}

function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

function validateIdCard(idCard: string): boolean {
  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
    return false;
  }
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard.charAt(i), 10) * weights[i];
  }
  return checkCodes[sum % 11] === idCard.charAt(17).toUpperCase();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLevelConfig(level: PromoterLevel) {
  return PROMOTER_LEVEL_CONFIGS.find(c => c.level === level);
}

class PromoterManageService {
  public async checkEditPermission(
    userId: string,
    editFields: string[]
  ): Promise<{ allowed: boolean; deniedFields: string[]; userRole: string }> {
    const user = await userDao.findById(userId);
    if (!user) {
      throw new AppError('操作人员不存在', BusinessCode.NOT_FOUND);
    }

    const userRole = (user as any).role || UserRole.USER;
    const isAdmin = userRole === UserRole.ADMIN;

    const allowedFields = isAdmin
      ? [...ADMIN_EDIT_FIELDS]
      : [...BASIC_EDIT_FIELDS];

    const deniedFields = editFields.filter(f => !(allowedFields as readonly string[]).includes(f));

    return {
      allowed: deniedFields.length === 0,
      deniedFields,
      userRole,
    };
  }

  public async validateField(
    field: string,
    value: any
  ): Promise<{ valid: boolean; message?: string }> {
    if (value === undefined || value === null || value === '') {
      if (['name', 'phone'].includes(field)) {
        return { valid: false, message: `${getFieldLabel(field)}不能为空` };
      }
      return { valid: true };
    }

    switch (field) {
      case 'phone':
        if (!validatePhone(String(value))) {
          return { valid: false, message: '手机号格式不正确' };
        }
        break;
      case 'idCard':
        if (!validateIdCard(String(value))) {
          return { valid: false, message: '身份证号格式不正确或校验位错误' };
        }
        break;
      case 'email':
        if (!validateEmail(String(value))) {
          return { valid: false, message: '邮箱格式不正确' };
        }
        break;
      case 'commissionRate':
        const rate = Number(value);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          return { valid: false, message: '佣金比例必须在0到1之间' };
        }
        break;
    }

    return { valid: true };
  }

  public async checkUniqueness(
    data: { phone?: string; wechatId?: string; idCard?: string },
    excludePromoterId?: string
  ): Promise<UniquenessCheckResult> {
    const duplicateFields: { field: string; value: string; duplicatePromoters: any[] }[] = [];

    if (data.phone) {
      const exists = await promoterDao.findByPhone(data.phone);
      if (exists && exists.id !== excludePromoterId) {
        duplicateFields.push({
          field: 'phone',
          value: data.phone,
          duplicatePromoters: [{ id: exists.id, name: exists.name, code: exists.code }],
        });
      }
    }

    if (data.wechatId) {
      const list = await promoterDao.findAll({
        where: { wechatId: data.wechatId },
      } as any);
      const duplicates = list.filter(p => p.id !== excludePromoterId);
      if (duplicates.length > 0) {
        duplicateFields.push({
          field: 'wechatId',
          value: data.wechatId,
          duplicatePromoters: duplicates.map(p => ({ id: p.id, name: p.name, code: (p as any).code })),
        });
      }
    }

    if (data.idCard) {
      const list = await promoterDao.findAll({
        where: { idCard: data.idCard },
      } as any);
      const duplicates = list.filter(p => p.id !== excludePromoterId);
      if (duplicates.length > 0) {
        duplicateFields.push({
          field: 'idCard',
          value: data.idCard,
          duplicatePromoters: duplicates.map(p => ({ id: p.id, name: p.name, code: (p as any).code })),
        });
      }
    }

    return {
      valid: duplicateFields.length === 0,
      duplicateFields,
    };
  }

  public async updatePromoterInfo(
    promoterId: string,
    operatorId: string,
    data: Partial<PromoterAttributes> & { [key: string]: any }
  ): Promise<any> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const editFields = Object.keys(data);
    const permCheck = await this.checkEditPermission(operatorId, editFields);
    if (!permCheck.allowed) {
      const deniedLabels = permCheck.deniedFields.map(getFieldLabel).join('、');
      throw new AppError(
        `无权限修改以下字段：${deniedLabels}`,
        BusinessCode.FORBIDDEN
      );
    }

    for (const field of editFields) {
      const validation = await this.validateField(field, (data as any)[field]);
      if (!validation.valid) {
        throw new AppError(validation.message!, BusinessCode.PARAM_ERROR);
      }
    }

    const uniqueness = await this.checkUniqueness(
      {
        phone: data.phone,
        wechatId: data.wechatId,
        idCard: data.idCard,
      },
      promoterId
    );
    if (!uniqueness.valid) {
      const dupMsgs = uniqueness.duplicateFields.map(d =>
        `${getFieldLabel(d.field)}「${d.value}」已被其他推客绑定`
      );
      throw new AppError(dupMsgs.join('；'), BusinessCode.ERROR);
    }

    const updateData: any = {};
    const changeLogs: any[] = [];
    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    let levelChanged = false;
    let newLevelConfig: any = null;

    for (const field of editFields) {
      const oldValue = (promoter as any)[field];
      const newValue = (data as any)[field];

      if (String(oldValue) !== String(newValue)) {
        (updateData as any)[field] = newValue;

        if (field === 'level') {
          levelChanged = true;
          newLevelConfig = getLevelConfig(newValue as PromoterLevel);
        }

        changeLogs.push({
          promoterId,
          operatorId,
          operatorName,
          fieldName: field,
          fieldLabel: getFieldLabel(field),
          oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
          newValue: newValue !== undefined && newValue !== null ? String(newValue) : null,
          changeType: field === 'level'
            ? (Number(String(newValue).replace('L', '')) > Number(String(oldValue).replace('L', '')) ? 'level_up' : 'level_down')
            : ['status', 'promoteStatus', 'settleStatus', 'verifyStatus'].includes(field)
            ? 'status_change'
            : 'update',
          remark: '',
        });
      }
    }

    if (levelChanged && newLevelConfig) {
      updateData.commissionRate = newLevelConfig.commissionRate;
      updateData.promoteStatus = PromoteStatus.ACTIVE;
    }

    if (Object.keys(updateData).length === 0) {
      return promoter;
    }

    await promoterDao.update(updateData, { where: { id: promoterId } });

    for (const log of changeLogs) {
      await promoterChangeLogDao.create(log);
    }

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);

    return this.getPromoterDetail(promoterId);
  }

  public async validateQualification(
    data: {
      type?: string;
      fileUrl?: string;
      expireAt?: string;
      idCard?: string;
      realName?: string;
    }
  ): Promise<QualificationValidateResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.type && !Object.values(QualificationType).includes(data.type as any)) {
      errors.push('资质类型无效');
    }

    if (data.fileUrl) {
      if (!/\.(jpg|jpeg|png|pdf)$/i.test(data.fileUrl)) {
        errors.push('资质文件格式不支持，仅支持JPG/PNG/PDF');
      }
    } else {
      errors.push('请上传资质文件');
    }

    if (data.expireAt) {
      const expireDate = dayjs(data.expireAt);
      if (!expireDate.isValid()) {
        errors.push('资质有效期格式不正确');
      } else if (expireDate.isBefore(dayjs())) {
        errors.push('资质已过期，无法提交认证');
      } else if (expireDate.diff(dayjs(), 'day') < 30) {
        warnings.push(`资质将在 ${expireDate.diff(dayjs(), 'day')} 天后过期`);
      }
    }

    if (data.idCard && data.realName) {
      if (!validateIdCard(data.idCard)) {
        errors.push('身份证信息不合规');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public async submitQualification(
    promoterId: string,
    operatorId: string,
    qualificationData: {
      type: string;
      title?: string;
      fileUrl: string;
      expireAt?: string;
      realName?: string;
      idCard?: string;
    }
  ): Promise<any> {
    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const validation = await this.validateQualification(qualificationData);
    if (!validation.valid) {
      throw new AppError(validation.errors.join('；'), BusinessCode.PARAM_ERROR);
    }

    const expireAt = qualificationData.expireAt
      ? new Date(qualificationData.expireAt)
      : undefined;

    const qualRecord = await promoterQualificationDao.create({
      promoterId,
      type: qualificationData.type,
      title: qualificationData.title,
      fileUrl: qualificationData.fileUrl,
      expireAt,
      verifyStatus: VerifyStatus.PENDING,
    } as any);

    const updateData: any = {
      verifyStatus: VerifyStatus.PENDING,
    };

    if (qualificationData.realName) {
      updateData.realName = qualificationData.realName;
    }
    if (expireAt) {
      updateData.qualificationExpireAt = expireAt;
    }

    await promoterDao.update(updateData, { where: { id: promoterId } });

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    await promoterChangeLogDao.create({
      promoterId,
      operatorId,
      operatorName,
      fieldName: 'qualification',
      fieldLabel: '资质认证',
      oldValue: String((promoter as any).verifyStatus || VerifyStatus.UNVERIFIED),
      newValue: String(VerifyStatus.PENDING),
      changeType: 'status_change',
      remark: `提交资质：${qualificationData.title || qualificationData.type}`,
      metadata: JSON.stringify({ qualificationId: qualRecord.id }),
    } as any);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);

    return { qualificationId: qualRecord.id, warnings: validation.warnings };
  }

  public async reviewQualification(
    qualificationId: string,
    reviewerId: string,
    passed: boolean,
    remark?: string
  ): Promise<void> {
    const qual = await promoterQualificationDao.findByPk(qualificationId);
    if (!qual) {
      throw new AppError('资质记录不存在', BusinessCode.NOT_FOUND);
    }
    if ((qual as any).verifyStatus !== VerifyStatus.PENDING) {
      throw new AppError('该资质已审核，不可重复操作', BusinessCode.ERROR);
    }

    const reviewer = await userDao.findById(reviewerId);
    const reviewerName = (reviewer as any)?.nickname || reviewer?.username || '系统';

    if (passed) {
      await promoterQualificationDao.update(
        qualificationId,
        {
          verifyStatus: VerifyStatus.VERIFIED as any,
          verifyRemark: remark,
          verifiedBy: reviewerId,
          verifiedAt: new Date(),
        } as any
      );

      await promoterDao.update(
        {
          verifyStatus: VerifyStatus.VERIFIED as any,
          verifiedAt: new Date(),
          promoteStatus: PromoteStatus.ACTIVE as any,
          settleStatus: SettleStatus.NORMAL as any,
        } as any,
        { where: { id: (qual as any).promoterId } }
      );
    } else {
      await promoterQualificationDao.update(
        qualificationId,
        {
          verifyStatus: VerifyStatus.REJECTED as any,
          verifyRemark: remark,
          verifiedBy: reviewerId,
          verifiedAt: new Date(),
        } as any
      );

      await promoterDao.update(
        { verifyStatus: VerifyStatus.REJECTED as any } as any,
        { where: { id: (qual as any).promoterId } }
      );
    }

    await promoterChangeLogDao.create({
      promoterId: (qual as any).promoterId,
      operatorId: reviewerId,
      operatorName: reviewerName,
      fieldName: 'verifyStatus',
      fieldLabel: '实名认证状态',
      oldValue: String(VerifyStatus.PENDING),
      newValue: String(passed ? VerifyStatus.VERIFIED : VerifyStatus.REJECTED),
      changeType: 'status_change',
      remark: remark || (passed ? '资质审核通过' : '资质审核驳回'),
      metadata: JSON.stringify({ qualificationId, passed }),
    } as any);

    await CacheUtils.del(`${CacheKey.PROMOTER_DETAIL}${(qual as any).promoterId}`);
    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
  }

  public async batchUpdateLevel(
    ids: string[],
    targetLevel: PromoterLevel,
    operatorId: string
  ): Promise<BatchUpdateResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的推客', BusinessCode.PARAM_ERROR);
    }

    const targetLevelConfig = getLevelConfig(targetLevel);
    if (!targetLevelConfig) {
      throw new AppError('目标等级无效', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const permCheck = await this.checkEditPermission(operatorId, ['level']);
    if (!permCheck.allowed) {
      throw new AppError('无权限修改推客等级', BusinessCode.FORBIDDEN);
    }

    const details: BatchUpdateResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
          continue;
        }

        const currentLevelNum = Number(String(promoter.level).replace('L', ''));
        const targetLevelNum = Number(String(targetLevel).replace('L', ''));

        if (promoter.level === targetLevel) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: '等级未变化',
          });
          continue;
        }

        if (targetLevelNum > currentLevelNum) {
          const orders = (promoter as any).totalOrders || 0;
          const amount = Number((promoter as any).totalAmount || 0);
          if (
            orders < LOW_PERFORMANCE_THRESHOLD.minOrders ||
            amount < LOW_PERFORMANCE_THRESHOLD.minAmount
          ) {
            skipped++;
            details.push({
              id,
              name: promoter.name,
              status: 'skipped',
              reason: `绩效不达标（需≥${LOW_PERFORMANCE_THRESHOLD.minOrders}单/¥${LOW_PERFORMANCE_THRESHOLD.minAmount}），禁止批量升级`,
            });
            continue;
          }
        }

        if ((promoter as any).riskFlagged) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: '存在风险标记，禁止批量修改等级',
          });
          continue;
        }

        await promoterDao.update(
          {
            level: targetLevel as any,
            commissionRate: targetLevelConfig.commissionRate,
            promoteStatus: PromoteStatus.ACTIVE as any,
          } as any,
          { where: { id } }
        );

        await promoterChangeLogDao.create({
          promoterId: id,
          operatorId,
          operatorName,
          fieldName: 'level',
          fieldLabel: '推客等级',
          oldValue: String(promoter.level),
          newValue: String(targetLevel),
          changeType: targetLevelNum > currentLevelNum ? 'level_up' : 'level_down',
          remark: '批量修改等级',
          metadata: JSON.stringify({ batch: true }),
        } as any);

        success++;
        details.push({ id, name: promoter.name, status: 'success' });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          id,
          name: promoter?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);

    return {
      total: ids.length,
      success,
      failed,
      skipped,
      details,
    };
  }

  public async batchUpdatePromoteStatus(
    ids: string[],
    status: PromoteStatus,
    operatorId: string,
    remark?: string
  ): Promise<BatchUpdateResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的推客', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const permCheck = await this.checkEditPermission(operatorId, ['promoteStatus']);
    if (!permCheck.allowed) {
      throw new AppError('无权限修改推广状态', BusinessCode.FORBIDDEN);
    }

    const details: BatchUpdateResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
          continue;
        }
        if ((promoter as any).promoteStatus === status) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: '状态未变化',
          });
          continue;
        }

        const oldStatus = (promoter as any).promoteStatus;
        await promoterDao.update({ promoteStatus: status as any } as any, { where: { id } });
        await promoterChangeLogDao.create({
          promoterId: id,
          operatorId,
          operatorName,
          fieldName: 'promoteStatus',
          fieldLabel: '推广状态',
          oldValue: String(oldStatus),
          newValue: String(status),
          changeType: 'status_change',
          remark: remark || '批量修改推广状态',
          metadata: JSON.stringify({ batch: true }),
        } as any);

        success++;
        details.push({ id, name: promoter.name, status: 'success' });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          id,
          name: promoter?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return { total: ids.length, success, failed, skipped, details };
  }

  public async batchUpdateSettleStatus(
    ids: string[],
    status: SettleStatus,
    operatorId: string,
    remark?: string
  ): Promise<BatchUpdateResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的推客', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const permCheck = await this.checkEditPermission(operatorId, ['settleStatus']);
    if (!permCheck.allowed) {
      throw new AppError('无权限修改结算状态', BusinessCode.FORBIDDEN);
    }

    const details: BatchUpdateResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of ids) {
      try {
        const promoter = await promoterDao.findById(id);
        if (!promoter) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '推客不存在' });
          continue;
        }
        if ((promoter as any).settleStatus === status) {
          skipped++;
          details.push({
            id,
            name: promoter.name,
            status: 'skipped',
            reason: '状态未变化',
          });
          continue;
        }

        const oldStatus = (promoter as any).settleStatus;
        await promoterDao.update({ settleStatus: status as any } as any, { where: { id } });
        await promoterChangeLogDao.create({
          promoterId: id,
          operatorId,
          operatorName,
          fieldName: 'settleStatus',
          fieldLabel: '结算状态',
          oldValue: String(oldStatus),
          newValue: String(status),
          changeType: 'status_change',
          remark: remark || '批量修改结算状态',
          metadata: JSON.stringify({ batch: true }),
        } as any);

        success++;
        details.push({ id, name: promoter.name, status: 'success' });
      } catch (err: any) {
        failed++;
        const promoter = await promoterDao.findById(id);
        details.push({
          id,
          name: promoter?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(`${CacheKey.PROMOTER_LIST}*`);
    return { total: ids.length, success, failed, skipped, details };
  }

  public async getChangeLogs(
    promoterId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await promoterChangeLogDao.findAllPaged(
      { promoterId, page, pageSize } as any
    );

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

  public async getChangeDiff(
    promoterId: string,
    logId: string
  ): Promise<{ before: any; after: any; fieldName: string; fieldLabel: string }> {
    const log = await promoterChangeLogDao.findByPk(logId);
    if (!log) {
      throw new AppError('变更记录不存在', BusinessCode.NOT_FOUND);
    }

    return {
      fieldName: (log as any).fieldName,
      fieldLabel: (log as any).fieldLabel,
      before: (log as any).oldValue,
      after: (log as any).newValue,
    };
  }

  public async getPromoterDetail(promoterId: string): Promise<any> {
    const cacheKey = `${CacheKey.PROMOTER_DETAIL}${promoterId}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const promoter = await promoterDao.findById(promoterId);
    if (!promoter) {
      throw new AppError('推客不存在', BusinessCode.NOT_FOUND);
    }

    const plain = promoter.get({ plain: true });
    const levelConfig = getLevelConfig(plain.level as PromoterLevel);
    const qualifications = await promoterQualificationDao.findByPromoterId(promoterId);

    const result = {
      ...plain,
      levelConfig,
      qualifications,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async getLevelConfigs() {
    return PROMOTER_LEVEL_CONFIGS;
  }
}

export default new PromoterManageService();
