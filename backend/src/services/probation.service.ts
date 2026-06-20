import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import probationDao from '../dao/probation.dao';
import onboardDao from '../dao/onboard.dao';
import jobDao from '../dao/job.dao';
import onboardLedgerDao from '../dao/onboard-ledger.dao';
import probationOperationLogDao from '../dao/probation-operation-log.dao';
import probationAssessmentIndicatorDao from '../dao/probation-assessment-indicator.dao';
import ProbationModel, { ProbationAttributes } from '../models/probation.model';
import { AssessmentIndicatorAttributes } from '../models/probation-assessment-indicator.model';
import { Onboard, Job, OnboardLedger, Probation, ProbationOperationLog, ProbationAssessmentIndicator } from '../models';
import {
  ParamError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  BadRequestError,
} from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import {
  OnboardStatus,
  UserRole,
  JobCategory,
  JobCategoryLabel,
  ProbationStatus,
  ProbationOperationAction,
  ProbationOperationActionLabel,
} from '../constants/recruitment.enum';

export const PROBATION_DURATION_BY_CATEGORY: Record<string, number> = {
  [JobCategory.TECH]: 3,
  [JobCategory.PRODUCT]: 3,
  [JobCategory.DESIGN]: 3,
  [JobCategory.OPERATIONS]: 2,
  [JobCategory.MARKETING]: 2,
  [JobCategory.HR]: 2,
  [JobCategory.FINANCE]: 3,
  [JobCategory.ADMIN]: 2,
  [JobCategory.SALES]: 2,
  [JobCategory.OTHER]: 2,
};

export const PROBATION_ADJUST_MIN = 1;
export const PROBATION_ADJUST_MAX = 6;
export const PROBATION_ADJUST_DELTA = 0.5;

export const DEFAULT_REQUIRED_INDICATORS = [
  { name: '工作态度', weight: 15, category: 'basic', description: '出勤情况、工作积极性、责任心等' },
  { name: '任务完成', weight: 25, category: 'work', description: '工作任务按时完成情况及质量' },
  { name: '团队协作', weight: 15, category: 'soft', description: '与同事配合、沟通协调能力' },
  { name: '学习能力', weight: 15, category: 'growth', description: '对新知识新技能的学习掌握速度' },
  { name: '专业技能', weight: 20, category: 'skill', description: '岗位所需专业知识和技能水平' },
];

export interface IUserContext {
  id: number;
  realName?: string;
  username?: string;
  role: UserRole;
  ip?: string;
  userAgent?: string;
}

export interface IBatchResult {
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

export interface IDurationComplianceResult {
  compliant: boolean;
  result: string;
  details?: {
    jobCategoryDuration?: number;
    contractTermLimit?: number;
    actualDuration: number;
  };
}

export interface IAssessmentIndicatorInput {
  name: string;
  description?: string;
  weight: number;
  sortOrder?: number;
  isRequired?: boolean;
  category?: string;
}

const LOCKED_STATUSES = [ProbationStatus.PASSED, ProbationStatus.FAILED];
const EDITABLE_DURATION_STATUSES = [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON, ProbationStatus.EXTENDED];
const ASSESSABLE_STATUSES = [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON, ProbationStatus.EXTENDED, ProbationStatus.REVIEWING];

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatOnboardBatch(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

class ProbationService {
  async checkPrerequisites(onboardId: number): Promise<Onboard> {
    const onboard = await onboardDao.findById(onboardId);
    if (!onboard) {
      throw new ParamError(`入职记录ID=${onboardId}不存在`);
    }
    if (onboard.status !== OnboardStatus.AUDIT_PASSED && onboard.status !== OnboardStatus.ONBOARDED) {
      throw new ParamError(
        `入职状态不满足前置条件：当前状态=${onboard.status}，需要 AUDIT_PASSED 或 ONBOARDED`
      );
    }
    const existingProbation = await probationDao.findByOnboardId(onboardId);
    if (existingProbation) {
      throw new ParamError(`该入职记录已存在试用期记录(ID=${existingProbation.id})`);
    }
    return onboard;
  }

  async matchDurationByJobCategory(jobId: number): Promise<{ category: string; duration: number }> {
    const job = await jobDao.findById(jobId);
    if (!job) {
      throw new ParamError(`岗位ID=${jobId}不存在`);
    }
    const category = (job as any).category || JobCategory.OTHER;
    const duration = PROBATION_DURATION_BY_CATEGORY[category] ?? PROBATION_DURATION_BY_CATEGORY[JobCategory.OTHER];
    return { category, duration };
  }

  validateDurationAdjust(proposedMonths: number, jobCategory: string): { valid: boolean; defaultDuration: number } {
    if (typeof proposedMonths !== 'number' || isNaN(proposedMonths)) {
      throw new ParamError('时长必须为数字');
    }
    const defaultDuration = PROBATION_DURATION_BY_CATEGORY[jobCategory] ?? PROBATION_DURATION_BY_CATEGORY[JobCategory.OTHER];
    if (proposedMonths < PROBATION_ADJUST_MIN || proposedMonths > PROBATION_ADJUST_MAX) {
      throw new ParamError(
        `微调时长超出允许范围：${proposedMonths}个月，允许范围 ${PROBATION_ADJUST_MIN}~${PROBATION_ADJUST_MAX} 个月`
      );
    }
    const delta = Math.abs(proposedMonths - defaultDuration);
    if (delta > PROBATION_ADJUST_DELTA + 0.001) {
      throw new ParamError(
        `微调量超过±${PROBATION_ADJUST_DELTA}个月：默认${defaultDuration}个月，提议${proposedMonths}个月`
      );
    }
    return { valid: true, defaultDuration };
  }

  async generateIndicatorsFromJob(jobId: number): Promise<Array<Omit<AssessmentIndicatorAttributes, 'id' | 'probationId'>>> {
    const job = await jobDao.findById(jobId);
    if (!job) {
      throw new ParamError(`岗位ID=${jobId}不存在`);
    }
    const description = (job as any).description || '';
    const dynamicIndicators: Array<{ name: string; weight: number; category: string; description: string }> = [];

    if (description.trim()) {
      const segments = description
        .split(/[\n。；;、,.!?！？\r]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length >= 2 && s.length <= 30)
        .slice(0, 3);

      const keywordMap: Record<string, { name: string; category: string }> = {
        '开发': { name: '代码质量', category: 'skill' },
        '编码': { name: '代码质量', category: 'skill' },
        '测试': { name: '测试质量', category: 'skill' },
        '设计': { name: '设计产出', category: 'skill' },
        '产品': { name: '需求分析', category: 'skill' },
        '运营': { name: '数据指标', category: 'work' },
        '销售': { name: '业绩达成', category: 'work' },
        '客户': { name: '客户满意度', category: 'work' },
        '沟通': { name: '沟通能力', category: 'soft' },
        '协调': { name: '协调能力', category: 'soft' },
        '管理': { name: '管理能力', category: 'growth' },
        '文档': { name: '文档撰写', category: 'work' },
        '学习': { name: '知识掌握', category: 'growth' },
      };

      let dynIdx = 0;
      for (const seg of segments) {
        let matched: { name: string; category: string } | null = null;
        for (const kw of Object.keys(keywordMap)) {
          if (seg.includes(kw)) {
            matched = keywordMap[kw];
            break;
          }
        }
        const indicatorName = matched ? matched.name : `岗位专项能力${dynIdx + 1}`;
        const category = matched ? matched.category : 'custom';
        if (!dynamicIndicators.find(d => d.name === indicatorName)) {
          dynamicIndicators.push({
            name: indicatorName,
            weight: 0,
            category,
            description: seg,
          });
          dynIdx++;
        }
      }
    }

    const requiredTotal = DEFAULT_REQUIRED_INDICATORS.reduce((s, i) => s + i.weight, 0);
    const remainingWeight = 100 - requiredTotal;

    if (dynamicIndicators.length > 0 && remainingWeight > 0) {
      const perWeight = Math.floor(remainingWeight / dynamicIndicators.length);
      let leftover = remainingWeight - perWeight * dynamicIndicators.length;
      for (const di of dynamicIndicators) {
        di.weight = perWeight + (leftover > 0 ? 1 : 0);
        if (leftover > 0) leftover--;
      }
    } else if (dynamicIndicators.length === 0 && remainingWeight >= 10) {
      dynamicIndicators.push({
        name: '创新能力',
        weight: Math.floor(remainingWeight / 2),
        category: 'growth',
        description: '工作中的创新意识和改进建议',
      });
      dynamicIndicators.push({
        name: '合规意识',
        weight: remainingWeight - Math.floor(remainingWeight / 2),
        category: 'basic',
        description: '遵守公司规章制度情况',
      });
    } else if (dynamicIndicators.length === 0) {
      DEFAULT_REQUIRED_INDICATORS[4].weight += remainingWeight;
    }

    const result: Array<Omit<AssessmentIndicatorAttributes, 'id' | 'probationId'>> = [];
    let sortOrder = 0;
    for (const ri of DEFAULT_REQUIRED_INDICATORS) {
      result.push({
        name: ri.name,
        description: ri.description,
        weight: ri.weight,
        isRequired: true,
        category: ri.category,
        sortOrder: sortOrder++,
      });
    }
    for (const di of dynamicIndicators) {
      result.push({
        name: di.name,
        description: di.description,
        weight: di.weight,
        isRequired: false,
        category: di.category,
        sortOrder: sortOrder++,
      });
    }

    const total = result.reduce((s, i) => s + Number(i.weight), 0);
    if (total !== 100) {
      const diff = 100 - total;
      result[0].weight = Number(result[0].weight) + diff;
    }

    return result;
  }

  validateAssessmentIndicators(indicators: IAssessmentIndicatorInput[]): { valid: boolean; fields?: string[]; details?: any } {
    const fields: string[] = [];
    const details: any = {};

    if (!Array.isArray(indicators) || indicators.length === 0) {
      throw new ValidationError('考核指标不能为空', ['indicators'], { reason: '数组为空' });
    }

    let totalWeight = 0;
    const namesSeen = new Set<string>();

    for (let i = 0; i < indicators.length; i++) {
      const ind = indicators[i];
      const prefix = `indicators[${i}]`;

      if (!ind.name || String(ind.name).trim() === '') {
        fields.push(`${prefix}.name`);
        details[`${prefix}.name`] = '指标名称不能为空';
      } else {
        if (namesSeen.has(ind.name)) {
          fields.push(`${prefix}.name`);
          details[`${prefix}.name`] = `指标名称重复: ${ind.name}`;
        }
        namesSeen.add(ind.name);
      }

      if (ind.weight === undefined || ind.weight === null) {
        fields.push(`${prefix}.weight`);
        details[`${prefix}.weight`] = '权重不能为空';
      } else {
        const w = Number(ind.weight);
        if (isNaN(w) || w < 0 || w > 100) {
          fields.push(`${prefix}.weight`);
          details[`${prefix}.weight`] = `权重必须在0-100之间，当前=${ind.weight}`;
        } else {
          totalWeight += w;
        }
      }
    }

    if (Math.abs(totalWeight - 100) > 0.001) {
      fields.push('totalWeight');
      details['totalWeight'] = `权重合计必须为100%，当前=${totalWeight}%`;
    }

    if (fields.length > 0) {
      throw new ValidationError('考核指标校验失败', fields, details);
    }

    return { valid: true };
  }

  checkDurationCompliance(probation: ProbationAttributes): IDurationComplianceResult {
    const category = probation.jobCategory || JobCategory.OTHER;
    const categoryDuration = PROBATION_DURATION_BY_CATEGORY[category] ?? PROBATION_DURATION_BY_CATEGORY[JobCategory.OTHER];
    const actualDuration = Number(probation.duration);
    const contractTerm = probation.contractTerm;

    const issues: string[] = [];
    let contractLimit: number | undefined;

    if (contractTerm !== undefined && contractTerm !== null) {
      if (contractTerm >= 3) {
        contractLimit = 6;
        if (actualDuration > 6) {
          issues.push(`合同期限${contractTerm}年(>=3年)，试用期不得超过6个月`);
        }
      } else if (contractTerm >= 1) {
        contractLimit = 2;
        if (actualDuration > 2) {
          issues.push(`合同期限${contractTerm}年(1-3年)，试用期不得超过2个月`);
        }
      }
    }

    if (actualDuration < 1) {
      issues.push('试用期时长不得少于1个月');
    }
    if (actualDuration > 6) {
      issues.push('试用期时长不得超过6个月（法定上限）');
    }

    const compliant = issues.length === 0;
    return {
      compliant,
      result: compliant
        ? `合规：岗位类别${JobCategoryLabel[category as JobCategory] || category}匹配${categoryDuration}个月${contractTerm ? `，合同期限${contractTerm}年` : ''}`
        : `不合规：${issues.join('；')}`,
      details: {
        jobCategoryDuration: categoryDuration,
        contractTermLimit: contractLimit,
        actualDuration,
      },
    };
  }

  async refreshStatusAutomatically(id: number): Promise<ProbationModel> {
    const probation = await probationDao.findById(id);
    if (!probation) {
      throw new NotFoundError('试用期记录不存在');
    }
    if (LOCKED_STATUSES.includes(probation.status as ProbationStatus) || probation.archived) {
      return probation;
    }

    const now = new Date();
    const endDate = new Date(probation.endDate);
    const daysLeft = diffDays(now, endDate);
    let newStatus = probation.status;
    const remarks: string[] = [];
    const before = probation.toJSON();

    if (daysLeft <= 7 && daysLeft >= 0) {
      if (probation.status === ProbationStatus.IN_PROBATION || probation.status === ProbationStatus.EXTENDED) {
        newStatus = ProbationStatus.EXPIRING_SOON;
        remarks.push(`距结束还有${daysLeft}天，自动切换为即将到期状态`);
      }
    }

    if (daysLeft < -30) {
      remarks.push(`已过期${Math.abs(daysLeft)}天未处理，标记warning`);
    }

    if (newStatus !== probation.status || remarks.length > 0) {
      const transaction = await sequelize.transaction();
      try {
        const updateData: any = {};
        const changedFields: string[] = [];
        if (newStatus !== probation.status) {
          updateData.status = newStatus;
          changedFields.push('status');
        }
        if (daysLeft <= 7 && daysLeft >= 0 && !probation.warningTriggered) {
          updateData.warningTriggered = true;
          changedFields.push('warningTriggered');
        }
        if (remarks.length > 0) {
          updateData.remark = (probation.remark || '') + (probation.remark ? '；' : '') + remarks.join('；');
          changedFields.push('remark');
        }
        updateData.version = (probation.version || 1) + 1;
        changedFields.push('version');

        const [count] = await probationDao.updateWithVersion(
          id,
          updateData,
          probation.version || 1,
          transaction
        );
        if (count === 0) {
          throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
        }

        await this._recordOperationLog(
          id,
          ProbationOperationAction.REFRESH_STATUS,
          { id: 0, role: UserRole.ADMIN, username: 'SYSTEM' },
          before,
          { ...before, ...updateData },
          changedFields,
          remarks.join('；'),
          transaction
        );
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return (await probationDao.findById(id))!;
  }

  async createProbation(
    onboardId: number,
    duration?: number,
    reason?: string,
    user: IUserContext = { id: 0, role: UserRole.HR }
  ): Promise<ProbationModel> {
    const transaction = await sequelize.transaction();
    try {
      const onboard = await this.checkPrerequisites(onboardId);
      const { category, duration: defaultDuration } = await this.matchDurationByJobCategory(onboard.jobId);

      let finalDuration = duration !== undefined ? duration : defaultDuration;
      if (duration !== undefined) {
        this.validateDurationAdjust(duration, category);
      }

      const startDate = onboard.actualOnboardDate || onboard.onboardDate || onboard.expectOnboardDate || new Date();
      const startDateObj = new Date(startDate);
      const endDateObj = addDays(addMonths(startDateObj, Math.floor(finalDuration)), Math.round((finalDuration % 1) * 30));

      const ledger = await onboardLedgerDao.findByOnboardId(onboardId);

      const onboardDate = onboard.actualOnboardDate || onboard.onboardDate || onboard.expectOnboardDate;
      const onboardBatch = onboardDate ? formatOnboardBatch(new Date(onboardDate)) : formatOnboardBatch(new Date());

      const createData: Partial<ProbationAttributes> = {
        onboardId,
        resumeId: onboard.resumeId,
        jobId: onboard.jobId,
        employeeNo: ledger?.employeeNo,
        onboardBatch,
        name: onboard.name,
        gender: onboard.gender as any,
        phone: onboard.phone,
        department: onboard.department,
        position: onboard.position,
        jobLevel: onboard.jobLevel,
        jobCategory: category as any,
        contractTerm: onboard.contractTerm,
        startDate: startDateObj,
        endDate: endDateObj,
        duration: finalDuration,
        originalDuration: finalDuration,
        salaryProbation: onboard.probationSalary,
        status: ProbationStatus.IN_PROBATION,
        createReason: reason,
        archived: false,
        assessmentLocked: false,
        warningTriggered: false,
        extendDays: 0,
        version: 1,
      };

      const compliance = this.checkDurationCompliance(createData as ProbationAttributes);
      if (!compliance.compliant) {
        createData.remark = `时长合规性警告: ${compliance.result}`;
      }

      const probation = await probationDao.create(createData, { transaction });

      const defaultIndicators = await this.generateIndicatorsFromJob(onboard.jobId);
      await probationAssessmentIndicatorDao.bulkCreateForProbation(
        probation.id,
        defaultIndicators,
        transaction
      );

      await this._recordOperationLog(
        probation.id,
        ProbationOperationAction.CREATE,
        user,
        null,
        probation.toJSON(),
        Object.keys(createData),
        reason ? `创建试用期：${reason}` : `创建试用期：岗位类别=${JobCategoryLabel[category as JobCategory] || category}，时长=${finalDuration}个月`,
        transaction
      );

      await transaction.commit();
      return probation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateDuration(
    id: number,
    newDuration: number,
    reason: string,
    user: IUserContext
  ): Promise<ProbationModel> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await probationDao.findById(id);
      if (!probation) {
        throw new NotFoundError('试用期记录不存在');
      }
      if (!EDITABLE_DURATION_STATUSES.includes(probation.status as ProbationStatus)) {
        throw new BadRequestError(
          `当前状态"${probation.status}"不允许调整时长，仅试用中/即将到期/已延长状态可调整`
        );
      }

      const category = probation.jobCategory || JobCategory.OTHER;
      this.validateDurationAdjust(newDuration, category);

      const beforeData = probation.toJSON();
      const startDate = new Date(probation.startDate);
      const newEndDate = addDays(addMonths(startDate, Math.floor(newDuration)), Math.round((newDuration % 1) * 30));

      const tempCheck = { ...probation.toJSON(), duration: newDuration, contractTerm: probation.contractTerm } as ProbationAttributes;
      const compliance = this.checkDurationCompliance(tempCheck);

      const updateData: any = {
        duration: newDuration,
        endDate: newEndDate,
        adjustReason: reason,
        version: (probation.version || 1) + 1,
      };

      if (!compliance.compliant) {
        updateData.remark = (probation.remark || '') + (probation.remark ? '；' : '') + `调整后合规警告：${compliance.result}`;
      }

      const [count] = await probationDao.updateWithVersion(
        id,
        updateData,
        probation.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      const changedFields = ['duration', 'endDate', 'adjustReason', 'version'];
      if (updateData.remark) changedFields.push('remark');

      await this._recordOperationLog(
        id,
        ProbationOperationAction.UPDATE_DURATION,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `调整时长：${probation.duration}个月 -> ${newDuration}个月，原因：${reason || '未说明'}，合规性：${compliance.compliant ? '合规' : compliance.result}`,
        transaction
      );

      await transaction.commit();
      return (await probationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async setAssessments(
    id: number,
    indicators: IAssessmentIndicatorInput[],
    user: IUserContext
  ): Promise<ProbationAssessmentIndicator[]> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await probationDao.findById(id);
      if (!probation) {
        throw new NotFoundError('试用期记录不存在');
      }
      if (probation.assessmentLocked || LOCKED_STATUSES.includes(probation.status as ProbationStatus) || probation.archived) {
        throw new BadRequestError('当前考核指标已锁定（已转正/未通过/归档），无法修改');
      }
      if (!ASSESSABLE_STATUSES.includes(probation.status as ProbationStatus)) {
        throw new BadRequestError(`当前状态"${probation.status}"不允许设置考核指标`);
      }

      this.validateAssessmentIndicators(indicators);

      const beforeIndicators = await probationAssessmentIndicatorDao.findByProbationId(id);
      const beforeData = beforeIndicators.map(i => i.toJSON());

      await probationAssessmentIndicatorDao.deleteByProbationId(id, transaction);

      const created = await probationAssessmentIndicatorDao.bulkCreateForProbation(
        id,
        indicators.map((ind, idx) => ({
          name: ind.name,
          description: ind.description,
          weight: ind.weight,
          sortOrder: ind.sortOrder ?? idx,
          isRequired: ind.isRequired ?? true,
          category: ind.category,
        })),
        transaction
      );

      await this._recordOperationLog(
        id,
        ProbationOperationAction.SET_ASSESSMENTS,
        user,
        { indicators: beforeData },
        { indicators: created.map(c => c.toJSON()) },
        ['assessmentIndicators'],
        `设置考核指标：共${indicators.length}项，权重合计100%`,
        transaction
      );

      await transaction.commit();
      return created;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async extendProbation(
    id: number,
    extendDays: number,
    reason: string,
    user: IUserContext
  ): Promise<ProbationModel> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await probationDao.findById(id);
      if (!probation) {
        throw new NotFoundError('试用期记录不存在');
      }
      if (!EDITABLE_DURATION_STATUSES.includes(probation.status as ProbationStatus)) {
        throw new BadRequestError(
          `当前状态"${probation.status}"不允许延长，仅试用中/即将到期/已延长状态可操作`
        );
      }
      if (!extendDays || extendDays < 1 || extendDays > 90) {
        throw new ParamError(`延长天数必须在1-90天之间，当前=${extendDays}`);
      }
      if (!reason || reason.trim() === '') {
        throw new ParamError('请填写延长原因');
      }

      const originalTotalMonths = Number(probation.originalDuration || probation.duration);
      const currentTotalDays = diffDays(new Date(probation.startDate), new Date(probation.endDate));
      const newTotalDays = currentTotalDays + extendDays;
      const maxAllowedDays = 6 * 30;
      if (newTotalDays > maxAllowedDays) {
        throw new ParamError(
          `延长后总时长(${Math.ceil(newTotalDays / 30)}个月)不得超过法定上限6个月，请减少延长天数`
        );
      }

      const beforeData = probation.toJSON();
      const newEndDate = addDays(new Date(probation.endDate), extendDays);
      const newDuration = Number((newTotalDays / 30).toFixed(1));

      const tempCheck = {
        ...probation.toJSON(),
        duration: newDuration,
        contractTerm: probation.contractTerm,
      } as ProbationAttributes;
      const compliance = this.checkDurationCompliance(tempCheck);

      const updateData: any = {
        endDate: newEndDate,
        duration: newDuration,
        extendDays: (probation.extendDays || 0) + extendDays,
        status: ProbationStatus.EXTENDED,
        extendReason: reason,
        version: (probation.version || 1) + 1,
      };

      if (!compliance.compliant) {
        updateData.remark = (probation.remark || '') + (probation.remark ? '；' : '') + `延长后合规警告：${compliance.result}`;
      }

      const [count] = await probationDao.updateWithVersion(
        id,
        updateData,
        probation.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      const changedFields = ['endDate', 'duration', 'extendDays', 'status', 'extendReason', 'version'];
      if (updateData.remark) changedFields.push('remark');

      await this._recordOperationLog(
        id,
        ProbationOperationAction.EXTEND,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `延长试用期：+${extendDays}天，新结束日期=${newEndDate.toISOString().slice(0, 10)}，总时长=${newDuration}个月，原因：${reason}`,
        transaction
      );

      await transaction.commit();
      return (await probationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async passProbation(
    id: number,
    finalScore?: number,
    comment?: string,
    user: IUserContext = { id: 0, role: UserRole.ADMIN }
  ): Promise<ProbationModel> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await probationDao.findById(id);
      if (!probation) {
        throw new NotFoundError('试用期记录不存在');
      }
      if (!ASSESSABLE_STATUSES.includes(probation.status as ProbationStatus) || probation.archived) {
        throw new BadRequestError(
          `当前状态"${probation.status}"不允许执行转正操作，仅试用中/即将到期/已延长/考核中状态可操作`
        );
      }

      const beforeData = probation.toJSON();
      const score = finalScore !== undefined ? Number(finalScore) : 85;
      const now = new Date();

      const updateData: any = {
        status: ProbationStatus.PASSED,
        assessmentFinalScore: score,
        assessmentFinalResult: 'PASS',
        assessmentFinalTime: now,
        assessmentFinalComment: comment,
        assessmentLocked: true,
        archived: true,
        actualEndDate: now,
        reviewDate: now,
        reviewResult: 'passed',
        reviewComment: comment,
        version: (probation.version || 1) + 1,
      };

      const [count] = await probationDao.updateWithVersion(
        id,
        updateData,
        probation.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      try {
        const ledger = await onboardLedgerDao.findByOnboardId(probation.onboardId);
        if (ledger) {
          await OnboardLedger.update(
            { probationPeriod: probation.duration },
            { where: { id: ledger.id }, transaction }
          );
        }
      } catch (e) {}

      const changedFields = [
        'status', 'assessmentFinalScore', 'assessmentFinalResult', 'assessmentFinalTime',
        'assessmentFinalComment', 'assessmentLocked', 'archived', 'actualEndDate',
        'reviewDate', 'reviewResult', 'reviewComment', 'version'
      ];

      await this._recordOperationLog(
        id,
        ProbationOperationAction.PASS,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `转正通过：综合得分=${score}分${comment ? `，评语：${comment}` : ''}`,
        transaction
      );

      await transaction.commit();
      return (await probationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async failProbation(
    id: number,
    finalScore?: number,
    comment?: string,
    user: IUserContext = { id: 0, role: UserRole.ADMIN }
  ): Promise<ProbationModel> {
    const transaction = await sequelize.transaction();
    try {
      const probation = await probationDao.findById(id);
      if (!probation) {
        throw new NotFoundError('试用期记录不存在');
      }
      if (!ASSESSABLE_STATUSES.includes(probation.status as ProbationStatus) || probation.archived) {
        throw new BadRequestError(
          `当前状态"${probation.status}"不允许执行未通过操作，仅试用中/即将到期/已延长/考核中状态可操作`
        );
      }

      const beforeData = probation.toJSON();
      const score = finalScore !== undefined ? Number(finalScore) : 50;
      const now = new Date();

      const updateData: any = {
        status: ProbationStatus.FAILED,
        assessmentFinalScore: score,
        assessmentFinalResult: 'FAIL',
        assessmentFinalTime: now,
        assessmentFinalComment: comment,
        assessmentLocked: true,
        archived: true,
        actualEndDate: now,
        reviewDate: now,
        reviewResult: 'failed',
        reviewComment: comment,
        version: (probation.version || 1) + 1,
      };

      const [count] = await probationDao.updateWithVersion(
        id,
        updateData,
        probation.version || 1,
        transaction
      );
      if (count === 0) {
        throw new BadRequestError('数据已被其他操作修改，请刷新后重试');
      }

      const changedFields = [
        'status', 'assessmentFinalScore', 'assessmentFinalResult', 'assessmentFinalTime',
        'assessmentFinalComment', 'assessmentLocked', 'archived', 'actualEndDate',
        'reviewDate', 'reviewResult', 'reviewComment', 'version'
      ];

      await this._recordOperationLog(
        id,
        ProbationOperationAction.FAIL,
        user,
        beforeData,
        { ...beforeData, ...updateData },
        changedFields,
        `转正不通过：综合得分=${score}分${comment ? `，评语：${comment}` : ''}`,
        transaction
      );

      await transaction.commit();
      return (await probationDao.findById(id))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async syncExpiringStatus(): Promise<{ updated: number; warnings: number; list: number[] }> {
    const transaction = await sequelize.transaction();
    try {
      const allActive = await probationDao.findInProbation();
      const now = new Date();
      const updatedList: number[] = [];
      let updatedCount = 0;
      let warningCount = 0;

      for (const probation of allActive) {
        const endDate = new Date(probation.endDate);
        const daysLeft = diffDays(now, endDate);
        const before = probation.toJSON();
        const updateData: any = {};
        const changedFields: string[] = [];

        if (daysLeft <= 7 && daysLeft >= 0
          && (probation.status === ProbationStatus.IN_PROBATION || probation.status === ProbationStatus.EXTENDED)) {
          updateData.status = ProbationStatus.EXPIRING_SOON;
          changedFields.push('status');
        }

        if (daysLeft <= 7 && !probation.warningTriggered) {
          updateData.warningTriggered = true;
          changedFields.push('warningTriggered');
        }

        if (changedFields.length > 0) {
          updateData.version = (probation.version || 1) + 1;
          changedFields.push('version');
          const [count] = await probationDao.updateWithVersion(
            probation.id,
            updateData,
            probation.version || 1,
            transaction
          );
          if (count > 0) {
            updatedList.push(probation.id);
            updatedCount++;
            if (daysLeft < 0) warningCount++;

            await probationOperationLogDao.createLog(
              {
                probationId: probation.id,
                action: ProbationOperationAction.SYNC_EXPIRING,
                operatorId: 0,
                operatorName: 'SYSTEM',
                operatorRole: UserRole.ADMIN,
                beforeData: before,
                afterData: { ...before, ...updateData },
                changedFields,
                remark: `自动同步状态：距结束${daysLeft >= 0 ? `还有${daysLeft}天` : `已过期${Math.abs(daysLeft)}天`}，${changedFields.includes('status') ? `状态变更为${updateData.status}` : ''}`,
              },
              { transaction }
            );
          }
        }
      }

      await transaction.commit();
      return { updated: updatedCount, warnings: warningCount, list: updatedList };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchSetAssessments(
    list: Array<{ probationId: number; indicators: IAssessmentIndicatorInput[] }>,
    normalizeBy?: 'onboardBatch' | 'jobCategory',
    user: IUserContext = { id: 0, role: UserRole.ADMIN }
  ): Promise<IBatchResult> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('只有管理员可以批量设置考核指标');
    }
    if (!Array.isArray(list) || list.length === 0) {
      throw new ParamError('批量数据不能为空');
    }

    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    let templateIndicators: IAssessmentIndicatorInput[] | null = null;
    if (normalizeBy) {
      const firstItem = list[0];
      const firstProbation = await probationDao.findById(firstItem.probationId);
      if (firstProbation) {
        const groupKey = normalizeBy === 'onboardBatch'
          ? firstProbation.onboardBatch
          : firstProbation.jobCategory;
        if (firstItem.indicators && firstItem.indicators.length > 0) {
          try {
            this.validateAssessmentIndicators(firstItem.indicators);
            templateIndicators = JSON.parse(JSON.stringify(firstItem.indicators));
          } catch (e) {
            // 校验失败则逐条处理
          }
        }
      }
    }

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        if (!item.probationId) {
          throw new ParamError('缺少probationId');
        }
        let indicators = item.indicators;
        if (templateIndicators) {
          indicators = JSON.parse(JSON.stringify(templateIndicators));
        }
        const created = await this.setAssessments(item.probationId, indicators, user);
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id: item.probationId,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id: item.probationId,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async batchUpdateStatus(
    ids: number[],
    action: 'pass' | 'fail' | 'extend',
    params?: { finalScore?: number; comment?: string; extendDays?: number; reason?: string },
    user: IUserContext = { id: 0, role: UserRole.ADMIN }
  ): Promise<IBatchResult> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('只有管理员可以批量更新状态');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ParamError('ID列表不能为空');
    }
    if (!['pass', 'fail', 'extend'].includes(action)) {
      throw new ParamError(`不支持的批量操作：${action}`);
    }

    const result: IBatchResult = {
      success: 0,
      failed: 0,
      results: [],
    };

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        let probation;
        switch (action) {
          case 'pass':
            probation = await this.passProbation(id, params?.finalScore, params?.comment, user);
            break;
          case 'fail':
            probation = await this.failProbation(id, params?.finalScore, params?.comment, user);
            break;
          case 'extend':
            if (!params?.extendDays) {
              throw new ParamError('extend操作需要extendDays参数');
            }
            probation = await this.extendProbation(id, params.extendDays, params.reason || '批量延长', user);
            break;
        }
        result.success++;
        result.results.push({
          index: i,
          success: true,
          id,
          name: probation?.name,
        });
      } catch (error: any) {
        result.failed++;
        result.results.push({
          index: i,
          success: false,
          id,
          error: error.message || '未知错误',
        });
      }
    }

    return result;
  }

  async getPassRateReport(filters: {
    department?: string;
    jobCategory?: string;
    onboardBatch?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    const overall = await probationDao.getPassRateStats({
      department: filters.department,
      jobCategory: filters.jobCategory,
      onboardBatch: filters.onboardBatch,
    });

    const byDepartment = await probationDao.getStatsByDimension('department');
    const byJobCategory = await probationDao.getStatsByDimension('jobCategory');
    const byOnboardBatch = await probationDao.getStatsByDimension('onboardBatch');

    const calcRate = (row: any) => ({
      ...row,
      passRate: row.total > 0 ? Number(((Number(row.passed) / row.total) * 100).toFixed(2)) : 0,
    });

    return {
      filters,
      overall,
      byDepartment: byDepartment.map(calcRate),
      byJobCategory: byJobCategory.map(calcRate),
      byOnboardBatch: byOnboardBatch.map(calcRate),
      generatedAt: new Date().toISOString(),
    };
  }

  async getList(params: any): Promise<IPaginationResult<ProbationModel>> {
    const {
      status,
      department,
      jobCategory,
      onboardBatch,
      mentor,
      name,
      startDateStart,
      startDateEnd,
      endDateStart,
      endDateEnd,
      warningTriggered,
      archived,
      ...rest
    } = params;

    const where: any = {};

    if (status) where.status = status;
    if (department) where.department = { [Op.like]: `%${department}%` };
    if (jobCategory) where.jobCategory = jobCategory;
    if (onboardBatch) where.onboardBatch = onboardBatch;
    if (mentor) where.mentor = { [Op.like]: `%${mentor}%` };
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (warningTriggered !== undefined) where.warningTriggered = Boolean(warningTriggered);
    if (archived !== undefined) where.archived = Boolean(archived);

    if (startDateStart || startDateEnd) {
      where.startDate = {};
      if (startDateStart) where.startDate[Op.gte] = new Date(startDateStart);
      if (startDateEnd) where.startDate[Op.lte] = new Date(startDateEnd);
    }
    if (endDateStart || endDateEnd) {
      where.endDate = {};
      if (endDateStart) where.endDate[Op.gte] = new Date(endDateStart);
      if (endDateEnd) where.endDate[Op.lte] = new Date(endDateEnd);
    }

    return probationDao.paginateWithRelations(rest, { where });
  }

  async getById(id: number): Promise<ProbationModel> {
    const probation = await probationDao.findById(id);
    if (!probation) {
      throw new NotFoundError('试用期记录不存在');
    }
    return probation;
  }

  async getDetail(id: number): Promise<any> {
    const probation = await Probation.findByPk(id, {
      include: [
        { association: 'onboard' },
        { association: 'job' },
        { association: 'resume' },
        {
          association: 'assessmentIndicators',
          order: [['sortOrder', 'ASC']],
        },
        {
          association: 'operationLogs',
          order: [['created_at', 'DESC']],
          include: [{ association: 'operator' }],
        },
      ],
    });
    if (!probation) {
      throw new NotFoundError('试用期记录不存在');
    }
    const compliance = this.checkDurationCompliance(probation.toJSON() as ProbationAttributes);
    return {
      ...probation.toJSON(),
      durationCompliance: compliance,
    };
  }

  async getExpiringList(days: number = 7, includeOverdue: boolean = true): Promise<ProbationModel[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const where: any = {
      archived: false,
      [Op.or]: [
        {
          status: { [Op.in]: [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON, ProbationStatus.EXTENDED] },
          endDate: { [Op.between]: [now, future] },
        },
      ],
    };
    if (includeOverdue) {
      where[Op.or].push({
        status: { [Op.in]: [ProbationStatus.IN_PROBATION, ProbationStatus.EXPIRING_SOON, ProbationStatus.EXTENDED] },
        endDate: { [Op.lt]: now },
      });
    }
    return probationDao.findAll({
      where,
      order: [['endDate', 'ASC']],
    });
  }

  private async _recordOperationLog(
    probationId: number,
    action: ProbationOperationAction,
    operator: IUserContext,
    before: any,
    after: any,
    changed: string[],
    remark?: string,
    transaction?: Transaction
  ) {
    return probationOperationLogDao.createLog(
      {
        probationId,
        action,
        operatorId: operator.id,
        operatorName: operator.realName || operator.username || `User#${operator.id}`,
        operatorRole: operator.role,
        beforeData: before,
        afterData: after,
        changedFields: changed,
        remark,
        ipAddress: operator.ip,
        userAgent: operator.userAgent,
      },
      transaction ? { transaction } : undefined
    );
  }
}

export default new ProbationService();
