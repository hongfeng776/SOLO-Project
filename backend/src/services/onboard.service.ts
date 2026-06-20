import onboardDao from '../dao/onboard.dao';
import onboardOperationLogDao from '../dao/onboard-operation-log.dao';
import onboardLedgerDao from '../dao/onboard-ledger.dao';
import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import OnboardModel from '../models/onboard.model';
import OnboardOperationLogModel from '../models/onboard-operation-log.model';
import OnboardLedgerModel from '../models/onboard-ledger.model';
import {
  OnboardStatus,
  OnboardOperationAction,
  JOB_LEVEL_SALARY_RANGE,
  ONBOARD_LOCKED_STATUSES,
  InterviewResult,
  UserRole,
  OnboardStatusLabel,
} from '../constants/recruitment.enum';
import { Onboard, Resume, Job, Interview, OnboardLedger, OnboardOperationLog } from '../models';
import sequelize from '../config/database';
import { Transaction, Op } from 'sequelize';

interface IUserContext {
  id: number;
  realName?: string;
  username?: string;
  role: UserRole;
  ip?: string;
  userAgent?: string;
}

interface IBatchResult {
  success: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    id?: number;
    name?: string;
    error?: string;
  }>;
}

const REQUIRED_ONBOARD_FIELDS = [
  'resumeId',
  'jobId',
  'name',
  'phone',
  'department',
  'position',
  'jobLevel',
  'offerSalary',
  'expectOnboardDate',
];

const FAKE_INFO_KEYWORDS = [
  '测试', '假的', '虚构', '随便填', '123456', 'abcdef',
  '000000', '999999', '暂无', '无', '不详',
];

const ID_CARD_REGEX = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const EMAIL_REGEX = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

class OnboardService {
  async getList(params: any): Promise<IPaginationResult<OnboardModel>> {
    const { resumeId, jobId, status, hrOperatorId, name, phone, startDate, endDate, ...rest } = params;
    const where: any = {};

    if (resumeId) where.resumeId = resumeId;
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;
    if (hrOperatorId) where.hrOperatorId = hrOperatorId;
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };
    if (startDate && endDate) {
      where.expectOnboardDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.expectOnboardDate = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.expectOnboardDate = { [Op.lte]: new Date(endDate) };
    }

    return onboardDao.paginateWithRelations(rest, { where });
  }

  async getById(id: number): Promise<OnboardModel> {
    const onboard = await onboardDao.findWithOperationLogs(id);
    if (!onboard) {
      throw new NotFoundError('入职记录不存在');
    }
    return onboard;
  }

  async getOperationLogs(onboardId: number): Promise<OnboardOperationLogModel[]> {
    await this.getById(onboardId);
    return onboardOperationLogDao.findByOnboardId(onboardId);
  }

  async checkPrerequisites(resumeId: number): Promise<{ interview?: any; resume?: any }> {
    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      throw new BadRequestError('简历不存在');
    }

    const interviews = await Interview.findAll({
      where: { resumeId },
      order: [['stage', 'DESC']],
    });

    if (interviews.length === 0) {
      throw new BadRequestError('该简历暂无面试记录，无法办理入职');
    }

    const finalInterview = interviews[0];
    if (finalInterview.result !== InterviewResult.PASS) {
      throw new BadRequestError(
        `面试结果为"${finalInterview.result}"，非"通过(PASS)"状态，无法办理入职`
      );
    }

    return { interview: finalInterview, resume };
  }

  validateSalaryLevel(jobLevel: string, salaryMin: number, salaryMax: number): {
    valid: boolean;
    warning?: string;
    rangeMin?: number;
    rangeMax?: number;
  } {
    const range = JOB_LEVEL_SALARY_RANGE[jobLevel];
    if (!range) {
      return { valid: true };
    }

    if (salaryMax < range.min || salaryMin > range.max) {
      return {
        valid: false,
        warning: `薪资范围 ${salaryMin}K-${salaryMax}K 超出职级 ${jobLevel} 标准范围 ${range.min}K-${range.max}K`,
        rangeMin: range.min,
        rangeMax: range.max,
      };
    }

    return { valid: true, rangeMin: range.min, rangeMax: range.max };
  }

  async checkDuplicateOnboard(
    resumeId?: number,
    phone?: string,
    idCard?: string,
    excludeId?: number
  ): Promise<OnboardModel | null> {
    return onboardDao.checkDuplicate(resumeId, phone, idCard, excludeId);
  }

  checkDataConsistency(onboard: any, resume: any): {
    consistent: boolean;
    mismatches: Array<{ field: string; resumeValue: any; onboardValue: any }>;
  } {
    const mismatches: Array<{ field: string; resumeValue: any; onboardValue: any }> = [];

    const checkField = (field: string, strict: boolean = false) => {
      const resumeVal = resume[field];
      const onboardVal = onboard[field];
      if (!resumeVal || !onboardVal) return;
      if (strict) {
        if (String(resumeVal).trim() !== String(onboardVal).trim()) {
          mismatches.push({ field, resumeValue: resumeVal, onboardValue: onboardVal });
        }
      } else {
        if (String(resumeVal).trim().toLowerCase() !== String(onboardVal).trim().toLowerCase()) {
          mismatches.push({ field, resumeValue: resumeVal, onboardValue: onboardVal });
        }
      }
    };

    checkField('name', true);
    checkField('phone', true);
    checkField('email');
    checkField('gender');
    checkField('education');
    checkField('school');
    checkField('major');

    return {
      consistent: mismatches.length === 0,
      mismatches,
    };
  }

  checkRequiredFields(data: any): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    for (const field of REQUIRED_ONBOARD_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }
    return { valid: missingFields.length === 0, missingFields };
  }

  detectFakeInfo(data: any): {
    detected: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (data.name) {
      for (const keyword of FAKE_INFO_KEYWORDS) {
        if (data.name.includes(keyword)) {
          reasons.push(`姓名包含可疑关键词: ${keyword}`);
          break;
        }
      }
      if (data.name.length < 2) {
        reasons.push('姓名长度异常');
      }
    }

    if (data.phone) {
      if (!PHONE_REGEX.test(data.phone)) {
        reasons.push('手机号格式不正确');
      }
      const uniqueDigits = new Set(data.phone.replace(/\D/g, '')).size;
      if (uniqueDigits <= 2) {
        reasons.push('手机号数字过于重复');
      }
    }

    if (data.email && data.email !== '') {
      if (!EMAIL_REGEX.test(data.email)) {
        reasons.push('邮箱格式不正确');
      }
    }

    if (data.idCard && data.idCard !== '') {
      if (!ID_CARD_REGEX.test(data.idCard)) {
        reasons.push('身份证号格式不正确');
      }
    }

    if (data.idCard && data.age) {
      const year = new Date().getFullYear();
      let birthYear: number | null = null;
      if (data.idCard.length === 18) {
        birthYear = parseInt(data.idCard.substring(6, 10));
      } else if (data.idCard.length === 15) {
        birthYear = 1900 + parseInt(data.idCard.substring(6, 8));
      }
      if (birthYear) {
        const calcAge = year - birthYear;
        if (Math.abs(calcAge - data.age) > 3) {
          reasons.push(`年龄与身份证推算年龄不一致 (${data.age} vs ${calcAge})`);
        }
      }
    }

    return { detected: reasons.length > 0, reasons };
  }

  parseSalary(offerSalary: string): { min: number; max: number } | null {
    if (!offerSalary) return null;

    const cleaned = offerSalary.replace(/\s+/g, '').toLowerCase();

    const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      let min = parseFloat(rangeMatch[1]);
      let max = parseFloat(rangeMatch[2]);

      if (cleaned.includes('万') || cleaned.includes('w')) {
        min *= 10;
        max *= 10;
      }
      return { min, max };
    }

    const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
      let val = parseFloat(singleMatch[1]);
      if (cleaned.includes('万') || cleaned.includes('w')) {
        val *= 10;
      }
      return { min: val, max: val };
    }

    return null;
  }

  private async _recordOperationLog(
    onboardId: number,
    action: OnboardOperationAction,
    user: IUserContext,
    beforeData: any,
    afterData: any,
    changedFields: string[],
    remark?: string,
    transaction?: Transaction
  ): Promise<OnboardOperationLogModel> {
    return onboardOperationLogDao.createLog(
      {
        onboardId,
        action,
        operatorId: user.id,
        operatorName: user.realName || user.username,
        operatorRole: user.role,
        beforeData,
        afterData,
        changedFields,
        remark,
        ipAddress: user.ip,
        userAgent: user.userAgent,
      },
      transaction ? { transaction } : undefined
    );
  }

  private _getChangedFields(beforeData: any, afterData: any, excludeFields: string[] = []): string[] {
    const fields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {}),
    ]);

    for (const key of allKeys) {
      if (excludeFields.includes(key)) continue;
      if (['created_at', 'updated_at', 'deleted_at', 'version'].includes(key)) continue;
      const beforeVal = beforeData?.[key];
      const afterVal = afterData?.[key];
      if (String(beforeVal ?? '') !== String(afterVal ?? '')) {
        fields.push(key);
      }
    }
    return fields;
  }

  private async _updateJobCounts(
    jobId: number,
    transaction: Transaction
  ): Promise<void> {
    const inProgressCount = await onboardDao.countInProgressByJobId(jobId);
    const completedCount = await onboardDao.countCompletedByJobId(jobId);

    await Job.update(
      {
        onboardInProgressCount: inProgressCount,
        hireCompletedCount: completedCount,
      },
      { where: { id: jobId }, transaction }
    );
  }

  async createOnboard(data: any, user: IUserContext): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const prereqResult = await this.checkPrerequisites(data.resumeId);
      const resume = prereqResult.resume;

      const fieldCheck = this.checkRequiredFields(data);
      if (!fieldCheck.valid) {
        throw new ValidationError(
          `必填字段不完整: ${fieldCheck.missingFields.join(', ')}`,
          fieldCheck.missingFields
        );
      }

      const duplicate = await this.checkDuplicateOnboard(data.resumeId, data.phone, data.idCard);
      if (duplicate) {
        throw new BadRequestError(
          `入职信息已存在，重复项: 简历ID=${duplicate.resumeId}, 姓名=${duplicate.name}`
        );
      }

      const fakeInfo = this.detectFakeInfo(data);

      const consistency = this.checkDataConsistency(data, resume);

      let salaryMin = data.salaryMin;
      let salaryMax = data.salaryMax;
      let salaryMismatchWarning = false;

      if (data.offerSalary) {
        const parsed = this.parseSalary(data.offerSalary);
        if (parsed) {
          if (!salaryMin) salaryMin = parsed.min;
          if (!salaryMax) salaryMax = parsed.max;
        }
      }

      if (data.jobLevel && salaryMin && salaryMax) {
        const salaryCheck = this.validateSalaryLevel(data.jobLevel, salaryMin, salaryMax);
        if (!salaryCheck.valid) {
          salaryMismatchWarning = true;
        }
      }

      const createData: any = {
        ...data,
        salaryMin,
        salaryMax,
        status: OnboardStatus.PENDING_AUDIT,
        hrOperatorId: user.id,
        hrOperatorName: user.realName || user.username,
        submitTime: new Date(),
        dataConsistencyCheck: consistency.consistent,
        consistencyCheckResult: JSON.stringify(consistency.mismatches),
        fakeInfoDetected: fakeInfo.detected,
        fakeInfoReason: fakeInfo.reasons.join('; '),
        fieldCheckResult: JSON.stringify(fieldCheck.missingFields),
        originalResumeSnapshot: JSON.stringify(resume.toJSON()),
        salaryMismatchWarning,
        interviewId: prereqResult.interview?.id,
      };

      if (data.candidateConfirmed && !createData.candidateConfirmTime) {
        createData.candidateConfirmTime = new Date();
      }

      const onboard = await onboardDao.create(createData, { transaction });

      await this._recordOperationLog(
        onboard.id,
        OnboardOperationAction.CREATE,
        user,
        null,
        createData,
        Object.keys(createData),
        `创建入职登记 - ${data.name || ''}`,
        transaction
      );

      await this._updateJobCounts(data.jobId, transaction);

      await transaction.commit();
      return onboard;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateOnboard(id: number, data: any, user: IUserContext): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (ONBOARD_LOCKED_STATUSES.includes(existing.status)) {
        throw new ForbiddenError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，不允许修改`
        );
      }

      if (data.resumeId && data.resumeId !== existing.resumeId) {
        throw new BadRequestError('不允许修改关联的简历ID');
      }

      if (data.jobId && data.jobId !== existing.jobId) {
        throw new BadRequestError('不允许修改关联的岗位ID');
      }

      const beforeData = existing.toJSON();

      const updateData: any = { ...data };

      if (data.phone || data.idCard) {
        const duplicate = await this.checkDuplicateOnboard(
          undefined,
          data.phone || existing.phone,
          data.idCard || existing.idCard,
          id
        );
        if (duplicate) {
          throw new BadRequestError(
            `入职信息已存在，与ID=${duplicate.id}的记录重复`
          );
        }
      }

      if (data.offerSalary && (!data.salaryMin || !data.salaryMax)) {
        const parsed = this.parseSalary(data.offerSalary);
        if (parsed) {
          updateData.salaryMin = data.salaryMin || parsed.min;
          updateData.salaryMax = data.salaryMax || parsed.max;
        }
      }

      if ((data.jobLevel || updateData.salaryMin) && updateData.salaryMin && updateData.salaryMax) {
        const salaryCheck = this.validateSalaryLevel(
          data.jobLevel || existing.jobLevel,
          updateData.salaryMin,
          updateData.salaryMax
        );
        updateData.salaryMismatchWarning = !salaryCheck.valid;
      }

      if (data.candidateConfirmed && !existing.candidateConfirmTime) {
        updateData.candidateConfirmTime = new Date();
      }

      updateData.version = (existing.version || 1) + 1;

      const [count] = await onboardDao.updateWithVersion(
        id,
        updateData,
        existing.version || 1,
        transaction
      );

      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      const changedFields = this._getChangedFields(beforeData, updateData);

      const updated = await onboardDao.findById(id);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.UPDATE,
        user,
        beforeData,
        updateData,
        changedFields,
        `修改入职信息，变更字段: ${changedFields.join(', ') || '无'}`,
        transaction
      );

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async submitAudit(id: number, user: IUserContext): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      await this.validateBeforeSubmission(id);

      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (existing.status === OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError('该记录已在待审核状态');
      }

      if (ONBOARD_LOCKED_STATUSES.includes(existing.status)) {
        throw new ForbiddenError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，不允许提交审核`
        );
      }

      if (user.role === UserRole.HR && existing.hrOperatorId !== user.id) {
        throw new ForbiddenError('只能提交本人对接的入职人员');
      }

      const beforeData = existing.toJSON();

      const updateData: any = {
        status: OnboardStatus.PENDING_AUDIT,
        submitTime: new Date(),
        rejectReason: null,
        version: (existing.version || 1) + 1,
      };

      await onboardDao.updateWithVersion(id, updateData, existing.version || 1, transaction);
      const updated = await onboardDao.findById(id);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.SUBMIT,
        user,
        beforeData,
        updateData,
        ['status', 'submitTime', 'rejectReason'],
        '提交审核',
        transaction
      );

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approve(id: number, remark: string, user: IUserContext): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (existing.status !== OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，只能审核待审核状态的记录`
        );
      }

      const beforeData = existing.toJSON();
      const now = new Date();

      const updateData: any = {
        status: OnboardStatus.AUDIT_PASSED,
        auditTime: now,
        auditUserId: user.id,
        auditUserName: user.realName || user.username,
        auditRemark: remark,
        version: (existing.version || 1) + 1,
      };

      await onboardDao.updateWithVersion(id, updateData, existing.version || 1, transaction);

      const ledgerNo = await onboardLedgerDao.generateLedgerNo();
      const employeeNo = await onboardLedgerDao.generateEmployeeNo();

      const ledgerData: any = {
        onboardId: id,
        ledgerNo,
        employeeNo,
        name: existing.name,
        gender: existing.gender,
        phone: existing.phone,
        email: existing.email,
        idCard: existing.idCard,
        department: existing.department,
        position: existing.position,
        jobLevel: existing.jobLevel,
        onboardDate: existing.expectOnboardDate || existing.onboardDate,
        workType: existing.workType,
        workLocation: existing.workLocation,
        offerSalary: existing.offerSalary,
        salaryBase: existing.salaryBase,
        salaryPerformance: existing.salaryPerformance,
        salaryUnit: existing.salaryUnit,
        probationPeriod: existing.probationPeriod,
        probationSalary: existing.probationSalary,
        contractType: existing.contractType,
        contractTerm: existing.contractTerm,
        reportTo: existing.reportTo,
        contractSigned: existing.contractSigned,
        materialsComplete: existing.materialsComplete,
        socialSecurityAccount: existing.socialSecurityAccount,
        providentFundAccount: existing.providentFundAccount,
        generatedBy: user.id,
        generatedByName: user.realName || user.username,
        originalData: JSON.stringify(existing.toJSON()),
      };

      await onboardLedgerDao.create(ledgerData, { transaction });

      await onboardDao.updateById(
        id,
        {
          ledgerGenerated: true,
          ledgerGenerateTime: now,
        },
        { transaction }
      );

      await this._updateJobCounts(existing.jobId, transaction);

      const updated = await onboardDao.findWithLedger(id);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.APPROVE,
        user,
        beforeData,
        { ...updateData, ledgerNo, employeeNo },
        ['status', 'auditTime', 'auditUserId', 'auditUserName', 'ledgerGenerated'],
        remark ? `审核通过: ${remark}` : '审核通过',
        transaction
      );

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reject(
    id: number,
    rejectReason: string,
    remark: string,
    user: IUserContext
  ): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (existing.status !== OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，只能驳回待审核状态的记录`
        );
      }

      if (!rejectReason || rejectReason.trim() === '') {
        throw new ValidationError('请填写驳回原因', ['rejectReason']);
      }

      const beforeData = existing.toJSON();

      const updateData: any = {
        status: OnboardStatus.AUDIT_REJECTED,
        rejectReason,
        auditTime: new Date(),
        auditUserId: user.id,
        auditUserName: user.realName || user.username,
        auditRemark: remark,
        version: (existing.version || 1) + 1,
      };

      await onboardDao.updateWithVersion(id, updateData, existing.version || 1, transaction);
      const updated = await onboardDao.findById(id);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.REJECT,
        user,
        beforeData,
        updateData,
        ['status', 'rejectReason', 'auditTime', 'auditUserId', 'auditUserName'],
        `审核驳回: ${rejectReason}${remark ? ` (${remark})` : ''}`,
        transaction
      );

      await this._updateJobCounts(existing.jobId, transaction);

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resubmit(id: number, data: any, user: IUserContext): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (existing.status !== OnboardStatus.AUDIT_REJECTED) {
        throw new BadRequestError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，只有审核驳回状态才能重新提交`
        );
      }

      if (user.role === UserRole.HR && existing.hrOperatorId !== user.id) {
        throw new ForbiddenError('只能重新提交本人对接的入职人员');
      }

      const beforeData = existing.toJSON();
      const updateData: any = { ...data };

      if (data.offerSalary && (!data.salaryMin || !data.salaryMax)) {
        const parsed = this.parseSalary(data.offerSalary);
        if (parsed) {
          updateData.salaryMin = data.salaryMin || parsed.min;
          updateData.salaryMax = data.salaryMax || parsed.max;
        }
      }

      if (data.jobLevel && updateData.salaryMin && updateData.salaryMax) {
        const salaryCheck = this.validateSalaryLevel(data.jobLevel, updateData.salaryMin, updateData.salaryMax);
        updateData.salaryMismatchWarning = !salaryCheck.valid;
      }

      updateData.status = OnboardStatus.PENDING_AUDIT;
      updateData.submitTime = new Date();
      updateData.rejectReason = null;
      updateData.version = (existing.version || 1) + 1;

      await onboardDao.updateWithVersion(id, updateData, existing.version || 1, transaction);
      const updated = await onboardDao.findById(id);

      const changedFields = this._getChangedFields(beforeData, updateData);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.RESUBMIT,
        user,
        beforeData,
        updateData,
        changedFields,
        `驳回重新提交审核，变更字段: ${changedFields.join(', ') || '无'}`,
        transaction
      );

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async markOnboarded(
    id: number,
    actualOnboardDate: Date,
    user: IUserContext
  ): Promise<OnboardModel> {
    const transaction = await sequelize.transaction();

    try {
      const existing = await onboardDao.findById(id);
      if (!existing) {
        throw new NotFoundError('入职记录不存在');
      }

      if (existing.status !== OnboardStatus.AUDIT_PASSED) {
        throw new BadRequestError(
          `当前状态为"${OnboardStatusLabel[existing.status]}"，只有审核通过状态才能标记已入职`
        );
      }

      const beforeData = existing.toJSON();

      const updateData: any = {
        status: OnboardStatus.ONBOARDED,
        actualOnboardDate,
        onboardDate: actualOnboardDate,
        version: (existing.version || 1) + 1,
      };

      await onboardDao.updateWithVersion(id, updateData, existing.version || 1, transaction);

      await OnboardLedger.update(
        { onboardDate: actualOnboardDate },
        { where: { onboardId: id }, transaction }
      );

      await this._updateJobCounts(existing.jobId, transaction);

      const updated = await onboardDao.findWithLedger(id);

      await this._recordOperationLog(
        id,
        OnboardOperationAction.MARK_ONBOARDED,
        user,
        beforeData,
        updateData,
        ['status', 'actualOnboardDate', 'onboardDate'],
        `标记已入职，实际入职日期: ${actualOnboardDate}`,
        transaction
      );

      await transaction.commit();
      return updated!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchCreate(list: any[], user: IUserContext): Promise<IBatchResult> {
    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    const normalizedList = list.map((item, index) => {
      if (!item.expectOnboardDate && item.onboardDate) {
        item.expectOnboardDate = item.onboardDate;
      }
      if (item.expectOnboardDate && typeof item.expectOnboardDate === 'string') {
        item.expectOnboardDate = new Date(item.expectOnboardDate);
      }
      return { item, index };
    });

    normalizedList.sort((a, b) => {
      const dateA = a.item.expectOnboardDate?.getTime() || 0;
      const dateB = b.item.expectOnboardDate?.getTime() || 0;
      return dateA - dateB;
    });

    for (const { item, index } of normalizedList) {
      try {
        const onboard = await this.createOnboard(item, user);
        result.success++;
        result.results.push({
          index,
          success: true,
          id: onboard.id,
          name: onboard.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index,
          success: false,
          name: item.name,
          error: error.message || '未知错误',
        });
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const jobIds = [...new Set(list.filter(x => x.jobId).map(x => x.jobId))];
      for (const jobId of jobIds) {
        await this._updateJobCounts(jobId, transaction);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
    }

    return result;
  }

  async batchSubmit(ids: number[], user: IUserContext): Promise<IBatchResult> {
    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    const onboards = await onboardDao.findByIds(ids);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const onboard = onboards.find(o => o.id === id);
      try {
        if (!onboard) {
          throw new NotFoundError(`ID=${id} 的入职记录不存在`);
        }

        if (user.role === UserRole.HR && onboard.hrOperatorId !== user.id) {
          throw new ForbiddenError(`ID=${id} 不是您对接的入职人员，无权限提交`);
        }

        await this.submitAudit(id, user);
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id,
          name: onboard.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id,
          name: onboard?.name,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async batchApprove(
    ids: number[],
    remark: string,
    user: IUserContext
  ): Promise<IBatchResult> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('只有超级管理员才能批量审核通过');
    }

    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    const onboards = await onboardDao.findByIds(ids);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const onboard = onboards.find(o => o.id === id);
      try {
        if (!onboard) {
          throw new NotFoundError(`ID=${id} 的入职记录不存在`);
        }

        await this.approve(id, remark, user);
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id,
          name: onboard.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id,
          name: onboard?.name,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async validateBeforeSubmission(id: number): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const onboard = await onboardDao.findById(id);
    if (!onboard) {
      throw new NotFoundError('入职记录不存在');
    }

    const issues: string[] = [];

    const fieldCheck = this.checkRequiredFields(onboard.toJSON());
    if (!fieldCheck.valid) {
      issues.push(`必填字段缺失: ${fieldCheck.missingFields.join(', ')}`);
    }

    if (!onboard.candidateConfirmed) {
      issues.push('候选人尚未确认入职');
    }

    if (onboard.fakeInfoDetected) {
      issues.push(`检测到可能的虚假信息: ${onboard.fakeInfoReason}`);
    }

    if (!onboard.dataConsistencyCheck && onboard.consistencyCheckResult) {
      try {
        const mismatches = JSON.parse(onboard.consistencyCheckResult);
        if (mismatches.length > 0) {
          issues.push(
            `与简历信息不一致字段: ${mismatches.map((m: any) => m.field).join(', ')}`
          );
        }
      } catch (e) {}
    }

    return { valid: issues.length === 0, issues };
  }

  async remove(id: number, user: IUserContext): Promise<number> {
    const existing = await onboardDao.findById(id);
    if (!existing) {
      throw new NotFoundError('入职记录不存在');
    }

    if (ONBOARD_LOCKED_STATUSES.includes(existing.status)) {
      throw new ForbiddenError(
        `当前状态为"${OnboardStatusLabel[existing.status]}"，不允许删除`
      );
    }

    if (user.role === UserRole.HR && existing.hrOperatorId !== user.id) {
      throw new ForbiddenError('只能删除本人对接的入职人员');
    }

    const transaction = await sequelize.transaction();
    try {
      await OnboardOperationLog.destroy({
        where: { onboardId: id },
        transaction,
      });

      const count = await onboardDao.destroyById(id, { transaction });
      await this._updateJobCounts(existing.jobId, transaction);
      await transaction.commit();
      return count;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new OnboardService();
