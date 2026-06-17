import { Op } from 'sequelize';
import qualificationDao from '../dao/qualification.dao';
import qualificationAuditLogDao from '../dao/qualification-audit-log.dao';
import { Qualification, QualificationAuditLog } from '../models';
import { NotFoundError, AppError, ParamError, ConflictError, ForbiddenError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import { QualificationAuditStatus, QualificationAuditStatusLabel } from '../constants/recruitment.enum';

interface PreConditionCheckResult {
  allPassed: boolean;
  missingItems: { key: string; label: string }[];
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecords: any[];
  isRecentDuplicate: boolean;
}

interface BatchImportResult {
  total: number;
  added: number;
  updated: number;
  invalid: number;
  errors: { row: number; field: string; message: string }[];
}

interface CreditCodeValidateResult {
  valid: boolean;
  message: string;
}

class QualificationService {
  checkPreConditions(data: any): PreConditionCheckResult {
    const missingItems: { key: string; label: string }[] = [];

    if (!data.isRealNameVerified) {
      missingItems.push({ key: 'isRealNameVerified', label: '账号实名认证' });
    }
    if (!data.industryCategory) {
      missingItems.push({ key: 'industryCategory', label: '行业分类选择' });
    }
    if (!data.businessStatus) {
      missingItems.push({ key: 'businessStatus', label: '经营状态填报' });
    }

    return {
      allPassed: missingItems.length === 0,
      missingItems,
    };
  }

  validateCreditCode(code: string): CreditCodeValidateResult {
    if (!code || code.length !== 18) {
      return { valid: false, message: '统一社会信用代码必须为18位' };
    }

    const pattern = /^[0-9A-Z]{18}$/;
    if (!pattern.test(code)) {
      return { valid: false, message: '统一社会信用代码格式不正确，仅允许大写字母和数字' };
    }

    const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
    const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
    let sum = 0;

    for (let i = 0; i < 17; i++) {
      const charIndex = chars.indexOf(code[i]);
      if (charIndex === -1) {
        return { valid: false, message: '统一社会信用代码包含非法字符' };
      }
      sum += charIndex * weights[i];
    }

    const checkCode = chars[31 - (sum % 31)];
    if (code[17] !== checkCode) {
      return { valid: false, message: '统一社会信用代码校验位不正确' };
    }

    return { valid: true, message: '校验通过' };
  }

  validateNameCodeMatch(companyName: string, unifiedCreditCode: string): boolean {
    if (!companyName || !unifiedCreditCode) return false;
    return companyName.length >= 2 && unifiedCreditCode.length === 18;
  }

  async checkDuplicate(unifiedCreditCode: string, excludeId?: number): Promise<DuplicateCheckResult> {
    const where: any = { unifiedCreditCode };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await Qualification.findAll({ where });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isRecentDuplicate = existing.some(
      (record: any) => new Date(record.created_at) >= thirtyDaysAgo
    );

    return {
      isDuplicate: existing.length > 0,
      existingRecords: existing.map((r: any) => r.toJSON()),
      isRecentDuplicate,
    };
  }

  checkBusinessLicenseValidity(qualification: any): boolean {
    if (!qualification.businessLicenseEnd) return true;
    return new Date(qualification.businessLicenseEnd) > new Date();
  }

  async getList(params: any, currentUser?: any): Promise<IPaginationResult<any>> {
    const { companyName, unifiedCreditCode, auditStatus, registerDateStart, registerDateEnd, ...rest } = params;
    const where: any = {};

    if (companyName) {
      where.companyName = { [Op.like]: `%${companyName}%` };
    }
    if (unifiedCreditCode) {
      where.unifiedCreditCode = { [Op.like]: `%${unifiedCreditCode}%` };
    }
    if (auditStatus) {
      where.auditStatus = auditStatus;
    }
    if (registerDateStart || registerDateEnd) {
      where.created_at = {};
      if (registerDateStart) where.created_at[Op.gte] = new Date(registerDateStart);
      if (registerDateEnd) where.created_at[Op.lte] = new Date(registerDateEnd);
    }

    if (currentUser && currentUser.role !== 'admin') {
      where.creatorId = currentUser.id;
    }

    return qualificationDao.paginate(rest, {
      where,
      include: ['auditLogs'],
      order: [['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<any> {
    const qualification = await qualificationDao.findById(id, {
      include: ['auditLogs'],
    });
    if (!qualification) {
      throw new NotFoundError('企业资质不存在');
    }
    return qualification;
  }

  async create(data: any, currentUser?: any): Promise<any> {
    const preCheck = this.checkPreConditions(data);
    if (!preCheck.allPassed) {
      throw new AppError(
        40003,
        `前置条件未满足：${preCheck.missingItems.map((i) => i.label).join('、')}`,
        400
      );
    }

    const codeValidation = this.validateCreditCode(data.unifiedCreditCode);
    if (!codeValidation.valid) {
      throw new ParamError(codeValidation.message);
    }

    const duplicate = await this.checkDuplicate(data.unifiedCreditCode);
    if (duplicate.isDuplicate) {
      throw new ConflictError('该统一社会信用代码已存在，不可重复录入');
    }

    if (!this.validateNameCodeMatch(data.companyName, data.unifiedCreditCode)) {
      throw new ParamError('企业名称与信用代码不匹配');
    }

    if (currentUser) {
      data.creatorId = currentUser.id;
      data.creatorName = currentUser.realName || currentUser.username;
    }

    data.auditStatus = QualificationAuditStatus.PENDING;

    const result = await qualificationDao.create(data);

    await this.writeAuditLog(result.id, 'submit', '', QualificationAuditStatus.PENDING, currentUser, '提交资质审核');

    return result;
  }

  async update(id: number, data: any, currentUser?: any): Promise<any> {
    const qualification: any = await this.getById(id);

    if (currentUser && currentUser.role !== 'admin') {
      if (qualification.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可操作本人创建的企业数据');
      }
    }

    if (data.unifiedCreditCode && data.unifiedCreditCode !== qualification.unifiedCreditCode) {
      const codeValidation = this.validateCreditCode(data.unifiedCreditCode);
      if (!codeValidation.valid) {
        throw new ParamError(codeValidation.message);
      }

      const duplicate = await this.checkDuplicate(data.unifiedCreditCode, id);
      if (duplicate.isDuplicate) {
        throw new ConflictError('该统一社会信用代码已存在');
      }
    }

    if (data.unifiedCreditCode || data.companyName) {
      const code = data.unifiedCreditCode || qualification.unifiedCreditCode;
      const name = data.companyName || qualification.companyName;
      if (!this.validateNameCodeMatch(name, code)) {
        throw new ParamError('企业名称与信用代码不匹配');
      }
    }

    const fromStatus = qualification.auditStatus;

    if (qualification.auditStatus === QualificationAuditStatus.REJECTED && data.auditStatus === undefined) {
      data.auditStatus = QualificationAuditStatus.PENDING;
    }

    const result = await qualificationDao.updateById(id, data);

    if (fromStatus !== data.auditStatus || fromStatus === QualificationAuditStatus.REJECTED) {
      await this.writeAuditLog(
        id,
        fromStatus === QualificationAuditStatus.REJECTED ? 'resubmit' : 'update',
        fromStatus,
        data.auditStatus || fromStatus,
        currentUser,
        fromStatus === QualificationAuditStatus.REJECTED ? '驳回后修改重新提交' : '更新资质信息'
      );
    }

    return result;
  }

  async remove(id: number, currentUser?: any): Promise<number> {
    const qualification: any = await this.getById(id);

    if (currentUser && currentUser.role !== 'admin') {
      if (qualification.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可操作本人创建的企业数据');
      }
    }

    if (qualification.auditStatus === QualificationAuditStatus.APPROVED) {
      throw new AppError(40004, '审核通过的资质不可直接删除，请先作废', 400);
    }

    return qualificationDao.destroyById(id);
  }

  async batchRemove(ids: number[], currentUser?: any): Promise<number> {
    if (currentUser && currentUser.role !== 'admin') {
      const where: any = { id: ids, creatorId: currentUser.id };
      return qualificationDao.destroy({ where });
    }
    return qualificationDao.destroy({ where: { id: ids } });
  }

  async approve(id: number, auditRemark: string, currentUser: any): Promise<any> {
    const qualification: any = await this.getById(id);

    if (qualification.auditStatus !== QualificationAuditStatus.PENDING) {
      throw new AppError(40005, '仅待审核状态可执行审核通过操作', 400);
    }

    if (!this.checkBusinessLicenseValidity(qualification)) {
      throw new AppError(40006, '营业执照已过期，不可审核通过', 400);
    }

    const fromStatus = qualification.auditStatus;
    const result = await qualificationDao.updateById(id, {
      auditStatus: QualificationAuditStatus.APPROVED,
      auditRemark,
      auditUserId: currentUser.id,
      auditTime: new Date(),
    });

    await this.writeAuditLog(id, 'approve', fromStatus, QualificationAuditStatus.APPROVED, currentUser, auditRemark || '审核通过');

    return result;
  }

  async reject(id: number, rejectReason: string, currentUser: any): Promise<any> {
    const qualification: any = await this.getById(id);

    if (qualification.auditStatus !== QualificationAuditStatus.PENDING) {
      throw new AppError(40007, '仅待审核状态可执行审核驳回操作', 400);
    }

    if (!rejectReason) {
      throw new ParamError('驳回原因不能为空');
    }

    const fromStatus = qualification.auditStatus;
    const result = await qualificationDao.updateById(id, {
      auditStatus: QualificationAuditStatus.REJECTED,
      rejectReason,
      auditUserId: currentUser.id,
      auditTime: new Date(),
    });

    await this.writeAuditLog(id, 'reject', fromStatus, QualificationAuditStatus.REJECTED, currentUser, `驳回原因：${rejectReason}`);

    return result;
  }

  async invalidate(id: number, currentUser: any): Promise<any> {
    const qualification: any = await this.getById(id);

    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('仅管理员可执行作废操作');
    }

    const fromStatus = qualification.auditStatus;
    const result = await qualificationDao.updateById(id, {
      auditStatus: QualificationAuditStatus.EXPIRED,
      auditUserId: currentUser.id,
      auditTime: new Date(),
    });

    await this.writeAuditLog(id, 'invalidate', fromStatus, QualificationAuditStatus.EXPIRED, currentUser, '资质作废');

    return result;
  }

  async batchImport(dataList: any[], currentUser: any): Promise<BatchImportResult> {
    const result: BatchImportResult = {
      total: dataList.length,
      added: 0,
      updated: 0,
      invalid: 0,
      errors: [],
    };

    const isAdmin = currentUser.role === 'admin';

    for (let i = 0; i < dataList.length; i++) {
      const row = dataList[i];
      const rowNum = i + 2;

      try {
        if (!row.companyName || !row.unifiedCreditCode || !row.registeredAddress) {
          result.invalid++;
          result.errors.push({
            row: rowNum,
            field: 'required',
            message: '企业名称、信用代码、注册地址为必填项',
          });
          continue;
        }

        const codeValidation = this.validateCreditCode(row.unifiedCreditCode);
        if (!codeValidation.valid) {
          result.invalid++;
          result.errors.push({
            row: rowNum,
            field: 'unifiedCreditCode',
            message: codeValidation.message,
          });
          continue;
        }

        const existing = await qualificationDao.findByCreditCode(row.unifiedCreditCode);

        if (existing) {
          if (!isAdmin && (existing as any).creatorId !== currentUser.id) {
            result.invalid++;
            result.errors.push({
              row: rowNum,
              field: 'permission',
              message: '非管理员不可更新他人创建的数据',
            });
            continue;
          }

          await qualificationDao.updateById((existing as any).id, {
            ...row,
            auditStatus: QualificationAuditStatus.PENDING,
          });
          result.updated++;

          await this.writeAuditLog(
            (existing as any).id,
            'batch_update',
            (existing as any).auditStatus,
            QualificationAuditStatus.PENDING,
            currentUser,
            '批量导入更新'
          );
        } else {
          const created = await qualificationDao.create({
            ...row,
            auditStatus: QualificationAuditStatus.PENDING,
            creatorId: currentUser.id,
            creatorName: currentUser.realName || currentUser.username,
            isRealNameVerified: true,
            businessStatus: row.businessStatus || 'active',
          });
          result.added++;

          await this.writeAuditLog(
            created.id,
            'batch_create',
            '',
            QualificationAuditStatus.PENDING,
            currentUser,
            '批量导入新增'
          );
        }
      } catch (error: any) {
        result.invalid++;
        result.errors.push({
          row: rowNum,
          field: 'system',
          message: error.message || '处理失败',
        });
      }
    }

    return result;
  }

  async getAuditLogs(qualificationId: number): Promise<any[]> {
    return qualificationAuditLogDao.findByQualificationId(qualificationId);
  }

  async checkDuplicateForSubmit(unifiedCreditCode: string, excludeId?: number): Promise<DuplicateCheckResult> {
    return this.checkDuplicate(unifiedCreditCode, excludeId);
  }

  async validateForSubmit(data: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const preCheck = this.checkPreConditions(data);
    if (!preCheck.allPassed) {
      errors.push(...preCheck.missingItems.map((i) => `前置条件未满足：${i.label}`));
    }

    if (data.unifiedCreditCode) {
      const codeValidation = this.validateCreditCode(data.unifiedCreditCode);
      if (!codeValidation.valid) {
        errors.push(codeValidation.message);
      }
    }

    if (data.companyName && data.unifiedCreditCode) {
      if (!this.validateNameCodeMatch(data.companyName, data.unifiedCreditCode)) {
        errors.push('企业名称与信用代码不匹配');
      }
    }

    if (data.businessLicenseEnd) {
      if (new Date(data.businessLicenseEnd) < new Date()) {
        errors.push('营业执照已过期');
      }
    }

    if (data.legalPerson && data.legalPersonIdCard) {
      const idCardPattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (!idCardPattern.test(data.legalPersonIdCard)) {
        errors.push('法人身份证号格式不正确');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async writeAuditLog(
    qualificationId: number,
    action: string,
    fromStatus: string,
    toStatus: string,
    operator?: any,
    remark?: string
  ): Promise<void> {
    await QualificationAuditLog.create({
      qualificationId,
      action,
      fromStatus: fromStatus || '',
      toStatus,
      operatorId: operator?.id,
      operatorName: operator?.realName || operator?.username,
      remark,
    });
  }
}

export default new QualificationService();
