import { Op } from 'sequelize';
import jobDao from '../dao/job.dao';
import jobOperationLogDao from '../dao/job-operation-log.dao';
import companyDao from '../dao/company.dao';
import recruitmentConfigDao from '../dao/recruitment-config.dao';
import { Job, JobOperationLog } from '../models';
import {
  NotFoundError,
  AppError,
  ParamError,
  ForbiddenError,
  ConflictError,
} from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import { JobStatus, UserRole, ConfigStatus, VIOLATION_KEYWORDS, FALSE_RECRUITMENT_KEYWORDS, JobCategory } from '../constants/recruitment.enum';
import { JobOperationAction, JobOperationActionLabel } from '../models/job-operation-log.model';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
  realName?: string;
}

interface PreCheckResult {
  passed: boolean;
  failedItems: { key: string; label: string; reason?: string }[];
}

interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateJobs: any[];
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { jobId?: number; title?: string; message: string }[];
}

interface BatchOnlineOfflineFilter {
  category?: string;
  publishDaysMin?: number;
  publishDaysMax?: number;
  deliveryCountMin?: number;
  deliveryCountMax?: number;
  hireCompleteRateMin?: number;
  hireCompleteRateMax?: number;
  status?: string;
  companyId?: number;
}

const JOB_EDITABLE_FIELDS_DRAFT = [
  'title', 'category', 'department', 'jobType',
  'salaryMin', 'salaryMax', 'salaryUnit',
  'city', 'address', 'experience', 'education',
  'recruitNum', 'description', 'requirements', 'benefits',
  'deadline', 'sort'
];

const JOB_EDITABLE_FIELDS_PENDING = ['sort'];

const JOB_EDITABLE_FIELDS_PUBLISHED = [
  'salaryMin', 'salaryMax', 'salaryUnit',
  'recruitNum', 'city', 'address',
  'description', 'requirements', 'benefits',
  'deadline', 'sort'
];

const JOB_MAJOR_CHANGE_FIELDS = [
  'salaryMin', 'salaryMax', 'salaryUnit',
  'experience', 'education', 'category',
  'city', 'recruitNum'
];

const INDUSTRY_SALARY_RANGES: Record<string, { min: number; max: number }> = {
  tech: { min: 8, max: 80 },
  product: { min: 6, max: 60 },
  design: { min: 5, max: 40 },
  operations: { min: 4, max: 30 },
  marketing: { min: 4, max: 35 },
  hr: { min: 3, max: 25 },
  finance: { min: 4, max: 40 },
  admin: { min: 3, max: 20 },
  sales: { min: 3, max: 50 },
  other: { min: 3, max: 30 },
};

const EDUCATION_WEIGHTS: Record<string, number> = {
  '不限': 0,
  '大专': 1,
  '本科': 2,
  '硕士': 3,
  '博士': 4,
};

const EXPERIENCE_WEIGHTS: Record<string, number> = {
  '不限': 0,
  '应届生': 1,
  '1年以内': 2,
  '1-3年': 3,
  '3-5年': 5,
  '5-10年': 8,
  '10年以上': 10,
};

interface VersionDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

interface EditCheckResult {
  canEdit: boolean;
  reason?: string;
  editableFields: string[];
  isMajorChange?: boolean;
}

interface BatchEditFilter {
  category?: string;
  publishTimeStart?: string;
  publishTimeEnd?: string;
  status?: string;
  companyId?: number;
}

class JobService {
  async checkPreConditions(companyId: number, currentUser: CurrentUser): Promise<PreCheckResult> {
    const failedItems: { key: string; label: string; reason?: string }[] = [];

    const company: any = await companyDao.findById(companyId);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }

    if (!company.isQualificationApproved) {
      failedItems.push({
        key: 'qualification',
        label: '企业资质审核',
        reason: '企业资质尚未审核通过',
      });
    }

    const config = await recruitmentConfigDao.findByCompanyId(companyId);
    if (!config || config.configStatus !== ConfigStatus.ENABLED) {
      failedItems.push({
        key: 'recruitmentConfig',
        label: '招聘配置启用',
        reason: '企业招聘配置尚未启用',
      });
    }

    const hasJobPermission = this.checkJobPermission(currentUser);
    if (!hasJobPermission) {
      failedItems.push({
        key: 'permission',
        label: '岗位发布权限',
        reason: '当前账号不具备岗位发布权限',
      });
    }

    return {
      passed: failedItems.length === 0,
      failedItems,
    };
  }

  private checkJobPermission(currentUser: CurrentUser): boolean {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.HR) return true;
    return false;
  }

  validateJobData(data: any, companyCity?: string): ValidateResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.salaryMin !== undefined && data.salaryMax !== undefined) {
      if (data.salaryMin > data.salaryMax) {
        errors.push('薪资区间设置错误：最低薪资不能高于最高薪资');
      }
    }

    if (data.city && companyCity) {
      const isMatch = this.checkCityMatch(data.city, companyCity);
      if (!isMatch) {
        warnings.push(`工作城市"${data.city}"与企业属地"${companyCity}"不匹配，请确认`);
      }
    }

    if (data.title) {
      for (const keyword of VIOLATION_KEYWORDS) {
        if (data.title.includes(keyword)) {
          errors.push(`岗位名称包含违规关键词：${keyword}`);
        }
      }
      for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
        if (data.title.includes(keyword)) {
          warnings.push(`岗位名称包含疑似虚假招聘描述：${keyword}`);
        }
      }
    }

    if (data.salaryMin && data.salaryMax) {
      const ratio = data.salaryMax / data.salaryMin;
      if (ratio > 5) {
        warnings.push('薪资区间过大，可能存在虚假薪资风险，请核实');
      }
    }

    if (data.requirements) {
      const reqLength = data.requirements.trim().length;
      if (reqLength < 20) {
        warnings.push('任职要求内容过短，建议补充核心任职要求');
      }
    }

    if (data.category) {
      const validCategories = Object.values(JobCategory);
      if (!validCategories.includes(data.category)) {
        warnings.push(`岗位类别"${data.category}"不在标准分类中`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private checkCityMatch(jobCity: string, companyCity: string): boolean {
    if (!jobCity || !companyCity) return true;
    if (jobCity === companyCity) return true;
    if (companyCity.includes(jobCity) || jobCity.includes(companyCity)) return true;
    return false;
  }

  async checkDuplicateJob(data: any, excludeId?: number): Promise<DuplicateCheckResult> {
    const where: any = {
      companyId: data.companyId,
      title: data.title,
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const duplicateJobs = await jobDao.findAll({ where });

    return {
      isDuplicate: duplicateJobs.length > 0,
      duplicateJobs: duplicateJobs.map((j: any) => j.toJSON()),
    };
  }

  async getList(params: any, currentUser?: CurrentUser): Promise<IPaginationResult<any>> {
    const { title, status, companyId, category, department, ...rest } = params;
    const where: any = {};

    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (category) {
      where.category = category;
    }
    if (department) {
      where.department = department;
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (currentUser.companyId) {
        where.companyId = currentUser.companyId;
      }
    }

    return jobDao.paginate(rest, {
      where,
      include: ['company'],
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<any> {
    const job = await jobDao.findById(id, { include: ['company', 'operationLogs'] });
    if (!job) {
      throw new NotFoundError('岗位不存在');
    }
    return job;
  }

  async create(data: any, currentUser?: CurrentUser): Promise<any> {
    if (currentUser) {
      const preCheck = await this.checkPreConditions(data.companyId, currentUser);
      if (!preCheck.passed) {
        const reasons = preCheck.failedItems.map((i) => `${i.label}：${i.reason}`).join('；');
        throw new ForbiddenError(`无法新增岗位，前置条件未满足：${reasons}`);
      }
    }

    const company: any = await companyDao.findById(data.companyId);
    const companyCity = company?.address ? this.extractCity(company.address) : '';

    const validation = this.validateJobData(data, companyCity);
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const duplicate = await this.checkDuplicateJob(data);
    if (duplicate.isDuplicate) {
      throw new ConflictError('该企业下已存在同名岗位');
    }

    const createData: any = {
      ...data,
      status: JobStatus.DRAFT,
    };

    if (currentUser) {
      createData.creatorId = currentUser.id;
      createData.creatorName = currentUser.realName || currentUser.username;
    }

    const result = await jobDao.create(createData);

    await this.writeOperationLog({
      jobId: result.id,
      action: JobOperationAction.CREATE,
      fromStatus: '',
      toStatus: JobStatus.DRAFT,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '创建岗位',
      newValues: JSON.stringify(createData),
    });

    return result;
  }

  async update(id: number, data: any, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可编辑本人创建的岗位');
      }
    }

    const allowedFields = this.getEditableFields(job.status);
    const filteredData: any = {};
    const changedFields: string[] = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
        if (job[field] !== data[field]) {
          changedFields.push(field);
        }
      }
    }

    if (changedFields.length === 0) {
      return [0, [job]];
    }

    if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.REJECTED) {
      if (changedFields.some((f) => !JOB_EDITABLE_FIELDS_PENDING.includes(f))) {
        throw new ForbiddenError('非草稿/驳回状态下，仅可修改排序等非核心字段');
      }
    }

    const company: any = await companyDao.findById(job.companyId);
    const companyCity = company?.address ? this.extractCity(company.address) : '';

    const validation = this.validateJobData({ ...job.toJSON(), ...filteredData }, companyCity);
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const oldValues = this.extractJobValues(job, changedFields);
    const result = await jobDao.updateById(id, filteredData);

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.UPDATE,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: `更新字段：${changedFields.join('、')}`,
      changedFields: changedFields.join(','),
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(filteredData),
    });

    return result;
  }

  private getEditableFields(status: string): string[] {
    if (status === JobStatus.DRAFT || status === JobStatus.REJECTED) {
      return JOB_EDITABLE_FIELDS_DRAFT;
    }
    return JOB_EDITABLE_FIELDS_PENDING;
  }

  private extractJobValues(job: any, fields: string[]): any {
    const result: any = {};
    for (const field of fields) {
      result[field] = job[field];
    }
    return result;
  }

  async submitAudit(id: number, currentUser: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可提交本人创建的岗位');
      }
    }

    if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.REJECTED) {
      throw new AppError(40001, '仅草稿或驳回状态的岗位可提交审核', 400);
    }

    const preCheck = await this.checkPreConditions(job.companyId, currentUser);
    if (!preCheck.passed) {
      const reasons = preCheck.failedItems.map((i) => `${i.label}：${i.reason}`).join('；');
      throw new ForbiddenError(`无法提交审核，前置条件未满足：${reasons}`);
    }

    const company: any = await companyDao.findById(job.companyId);
    const companyCity = company?.address ? this.extractCity(company.address) : '';
    const validation = this.validateJobData(job.toJSON(), companyCity);
    if (!validation.valid) {
      throw new ParamError(`岗位信息校验不通过：${validation.errors.join('；')}`);
    }

    const requiredFields = ['title', 'category', 'salaryMin', 'salaryMax', 'city', 'requirements'];
    const missingFields = requiredFields.filter((f) => !job[f]);
    if (missingFields.length > 0) {
      const fieldLabels: Record<string, string> = {
        title: '岗位名称',
        category: '岗位类别',
        salaryMin: '最低薪资',
        salaryMax: '最高薪资',
        city: '工作城市',
        requirements: '任职要求',
      };
      throw new ParamError(`请完善必填信息：${missingFields.map((f) => fieldLabels[f] || f).join('、')}`);
    }

    const fromStatus = job.status;
    const result = await jobDao.updateById(id, {
      status: JobStatus.PENDING_AUDIT,
      submitTime: new Date(),
      rejectReason: '',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.SUBMIT_AUDIT,
      fromStatus,
      toStatus: JobStatus.PENDING_AUDIT,
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      remark: '提交审核',
    });

    return result;
  }

  async approve(id: number, currentUser: CurrentUser, remark?: string): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可执行审核通过操作');
    }

    const job: any = await this.getById(id);

    if (job.status !== JobStatus.PENDING_AUDIT) {
      throw new AppError(40002, '仅待审核状态的岗位可执行审核通过操作', 400);
    }

    const preCheck = await this.checkPreConditions(job.companyId, currentUser);
    if (!preCheck.passed) {
      const reasons = preCheck.failedItems.map((i) => `${i.label}：${i.reason}`).join('；');
      throw new ForbiddenError(`无法审核通过，前置条件未满足：${reasons}`);
    }

    const fromStatus = job.status;
    const result = await jobDao.updateById(id, {
      status: JobStatus.PUBLISHED,
      auditTime: new Date(),
      auditUserId: currentUser.id,
      auditUserName: currentUser.realName || currentUser.username,
      publishTime: new Date(),
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.APPROVE,
      fromStatus,
      toStatus: JobStatus.PUBLISHED,
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      remark: remark || '审核通过，岗位已发布',
    });

    return result;
  }

  async reject(id: number, rejectReason: string, currentUser: CurrentUser): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可执行审核驳回操作');
    }

    const job: any = await this.getById(id);

    if (job.status !== JobStatus.PENDING_AUDIT) {
      throw new AppError(40003, '仅待审核状态的岗位可执行驳回操作', 400);
    }

    if (!rejectReason || rejectReason.trim().length === 0) {
      throw new ParamError('驳回原因不能为空');
    }

    const fromStatus = job.status;
    const result = await jobDao.updateById(id, {
      status: JobStatus.REJECTED,
      rejectReason,
      auditTime: new Date(),
      auditUserId: currentUser.id,
      auditUserName: currentUser.realName || currentUser.username,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.REJECT,
      fromStatus,
      toStatus: JobStatus.REJECTED,
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      remark: `驳回原因：${rejectReason}`,
    });

    return result;
  }

  async remove(id: number, currentUser?: CurrentUser): Promise<number> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可删除本人创建的岗位');
      }
    }

    if (job.status === JobStatus.PUBLISHED) {
      throw new AppError(40004, '已发布的岗位不可直接删除，请先关闭', 400);
    }

    const result = await jobDao.destroyById(id);

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.DELETE,
      fromStatus: job.status,
      toStatus: '',
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '删除岗位',
    });

    return result;
  }

  async batchRemove(ids: number[], currentUser?: CurrentUser): Promise<number> {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      const jobs = await jobDao.findAll({ where: { id: ids } });
      const selfJobIds = jobs
        .filter((j: any) => j.creatorId === currentUser.id && j.status !== JobStatus.PUBLISHED)
        .map((j: any) => j.id);
      if (selfJobIds.length === 0) {
        return 0;
      }
      return jobDao.destroy({ where: { id: selfJobIds } });
    }
    return jobDao.destroy({ where: { id: ids } });
  }

  async batchCreate(jobList: any[], currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: jobList.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const seenTitles = new Set<string>();
    const duplicateInBatch: string[] = [];

    for (let i = 0; i < jobList.length; i++) {
      const jobData = jobList[i];
      const titleKey = `${jobData.companyId}-${jobData.title}`;

      try {
        if (seenTitles.has(titleKey)) {
          duplicateInBatch.push(jobData.title);
          throw new Error('批次内存在重复岗位');
        }
        seenTitles.add(titleKey);

        const created = await this.create(jobData, currentUser);
        result.success++;

        await this.writeOperationLog({
          jobId: created.id,
          action: JobOperationAction.BATCH_CREATE,
          fromStatus: '',
          toStatus: JobStatus.DRAFT,
          operatorId: currentUser.id,
          operatorName: currentUser.realName || currentUser.username,
          remark: '批量创建岗位',
        });
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          title: jobData.title,
          message: error.message || '创建失败',
        });
      }
    }

    return result;
  }

  async batchSubmitAudit(ids: number[], currentUser: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const job: any = await jobDao.findById(id);
        if (!job) {
          result.failed++;
          result.errors.push({ jobId: id, message: '岗位不存在' });
          continue;
        }

        if (currentUser.role !== UserRole.ADMIN) {
          if (job.creatorId && job.creatorId !== currentUser.id) {
            result.failed++;
            result.errors.push({ jobId: id, title: job.title, message: '仅可提交本人创建的岗位' });
            continue;
          }
        }

        await this.submitAudit(id, currentUser);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          jobId: id,
          message: error.message || '提交失败',
        });
      }
    }

    return result;
  }

  async batchApprove(ids: number[], currentUser: CurrentUser, remark?: string): Promise<BatchResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可执行批量审核');
    }

    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        await this.approve(id, currentUser, remark);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          jobId: id,
          message: error.message || '审核失败',
        });
      }
    }

    return result;
  }

  async getOperationLogs(jobId: number): Promise<any[]> {
    const logs = await jobOperationLogDao.findByJobId(jobId);
    return logs.map((log: any) => ({
      ...log.toJSON(),
      actionLabel: JobOperationActionLabel[log.action as JobOperationAction] || log.action,
    }));
  }

  async validateForSubmit(jobId: number): Promise<ValidateResult> {
    const job: any = await this.getById(jobId);
    const company: any = await companyDao.findById(job.companyId);
    const companyCity = company?.address ? this.extractCity(company.address) : '';
    return this.validateJobData(job.toJSON(), companyCity);
  }

  async getPreCheckInfo(companyId: number, currentUser: CurrentUser): Promise<PreCheckResult> {
    return this.checkPreConditions(companyId, currentUser);
  }

  async batchFillByCategory(category: string, department?: string): Promise<any> {
    const baseConfig: any = {
      category,
      department: department || '',
      jobType: 'full_time',
      experience: '不限',
      education: '不限',
      salaryUnit: 'K',
    };

    const categorySalaryMap: Record<string, { min: number; max: number }> = {
      tech: { min: 15, max: 30 },
      product: { min: 12, max: 25 },
      design: { min: 10, max: 20 },
      operations: { min: 8, max: 15 },
      marketing: { min: 8, max: 18 },
      hr: { min: 6, max: 12 },
      finance: { min: 8, max: 18 },
      admin: { min: 5, max: 10 },
      sales: { min: 6, max: 15 },
      other: { min: 5, max: 10 },
    };

    if (categorySalaryMap[category]) {
      baseConfig.salaryMin = categorySalaryMap[category].min;
      baseConfig.salaryMax = categorySalaryMap[category].max;
    }

    return baseConfig;
  }

  private extractCity(address: string): string {
    if (!address) return '';
    const cityMatch = address.match(/(.+?)市/);
    return cityMatch ? cityMatch[1] + '市' : address;
  }

  private async writeOperationLog(data: any): Promise<void> {
    await jobOperationLogDao.create(data);
  }

  async publish(id: number, currentUser: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (job.status === JobStatus.PUBLISHED) {
      throw new ConflictError('岗位已处于发布状态');
    }

    if (job.status === JobStatus.PENDING_AUDIT) {
      return this.approve(id, currentUser);
    }

    if (job.status === JobStatus.DRAFT || job.status === JobStatus.REJECTED) {
      await this.submitAudit(id, currentUser);
      return this.approve(id, currentUser);
    }

    throw new AppError(40005, '当前状态不可发布', 400);
  }

  async close(id: number, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (job.status !== JobStatus.PUBLISHED) {
      throw new AppError(40006, '仅已发布的岗位可关闭', 400);
    }

    const fromStatus = job.status;
    const result = await jobDao.updateById(id, { status: JobStatus.CLOSED });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.CLOSE,
      fromStatus,
      toStatus: JobStatus.CLOSED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '关闭岗位',
    });

    return result;
  }

  async checkEditPermission(id: number, currentUser?: CurrentUser): Promise<EditCheckResult> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        return {
          canEdit: false,
          reason: '仅可编辑本人创建的岗位',
          editableFields: [],
        };
      }
    }

    if (job.status === JobStatus.PENDING_AUDIT) {
      return {
        canEdit: true,
        reason: '待审核状态仅可编辑排序等非核心字段',
        editableFields: JOB_EDITABLE_FIELDS_PENDING,
      };
    }

    if (job.status === JobStatus.DRAFT || job.status === JobStatus.REJECTED) {
      return {
        canEdit: true,
        editableFields: JOB_EDITABLE_FIELDS_DRAFT,
      };
    }

    if (job.status === JobStatus.PUBLISHED) {
      return {
        canEdit: true,
        reason: '已发布岗位编辑核心字段需重新审核',
        editableFields: JOB_EDITABLE_FIELDS_PUBLISHED,
      };
    }

    return {
      canEdit: false,
      reason: '当前状态不可编辑',
      editableFields: [],
    };
  }

  calculateMatchWeight(data: any): number {
    let weight = 0;

    if (data.salaryMin && data.salaryMax) {
      const avgSalary = (data.salaryMin + data.salaryMax) / 2;
      weight += Math.min(avgSalary / 10, 10);
    }

    if (data.education && EDUCATION_WEIGHTS[data.education] !== undefined) {
      weight += EDUCATION_WEIGHTS[data.education] * 2;
    }

    if (data.experience && EXPERIENCE_WEIGHTS[data.experience] !== undefined) {
      weight += EXPERIENCE_WEIGHTS[data.experience];
    }

    if (data.requirements) {
      const reqLength = data.requirements.trim().length;
      weight += Math.min(reqLength / 50, 5);
    }

    if (data.benefits) {
      const benefitsLength = data.benefits.trim().length;
      weight += Math.min(benefitsLength / 30, 3);
    }

    return Math.round(Math.min(weight, 30) * 100) / 100;
  }

  validateIndustryNorm(data: any, category?: string): ValidateResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.salaryMin !== undefined && data.salaryMax !== undefined && category) {
      const range = INDUSTRY_SALARY_RANGES[category] || INDUSTRY_SALARY_RANGES.other;

      if (data.salaryMin < range.min) {
        errors.push(`薪资低于行业标准（${category}类别最低建议${range.min}K），请核实`);
      }
      if (data.salaryMax > range.max) {
        warnings.push(`薪资高于行业常规范围（${category}类别最高建议${range.max}K），请确认是否合理`);
      }
    }

    if (data.experience && data.salaryMin) {
      const expSalaryMap: Record<string, number> = {
        '应届生': 6,
        '1年以内': 8,
        '1-3年': 10,
        '3-5年': 15,
        '5-10年': 20,
        '10年以上': 30,
      };
      const expectedMin = expSalaryMap[data.experience];
      if (expectedMin && data.salaryMin < expectedMin * 0.6) {
        warnings.push(`薪资与经验要求不匹配，${data.experience}经验建议最低薪资${expectedMin}K`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  checkDuplicateEdit(jobId: number, operatorId: number): boolean {
    return false;
  }

  isMajorChange(changedFields: string[]): boolean {
    return changedFields.some(f => JOB_MAJOR_CHANGE_FIELDS.includes(f));
  }

  async updateJob(id: number, data: any, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可编辑本人创建的岗位');
      }
    }

    const editCheck = await this.checkEditPermission(id, currentUser);
    if (!editCheck.canEdit) {
      throw new ForbiddenError(editCheck.reason || '当前状态不可编辑');
    }

    const allowedFields = editCheck.editableFields;
    const filteredData: any = {};
    const changedFields: string[] = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
        if (job[field] !== data[field]) {
          changedFields.push(field);
        }
      }
    }

    if (changedFields.length === 0) {
      throw new ParamError('未检测到有效变更');
    }

    const isMajor = this.isMajorChange(changedFields);

    const company: any = await companyDao.findById(job.companyId);
    const companyCity = company?.address ? this.extractCity(company.address) : '';

    const validation = this.validateJobData({ ...job.toJSON(), ...filteredData }, companyCity);
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const industryValidation = this.validateIndustryNorm({ ...job.toJSON(), ...filteredData }, job.category);
    if (!industryValidation.valid) {
      throw new ParamError(industryValidation.errors.join('；'));
    }

    const duplicate = await this.checkDuplicateJob({ ...job.toJSON(), ...filteredData }, id);
    if (duplicate.isDuplicate) {
      throw new ConflictError('该企业下已存在同名岗位');
    }

    const weightFields = ['salaryMin', 'salaryMax', 'experience', 'education', 'requirements', 'benefits'];
    const hasWeightChange = changedFields.some(f => weightFields.includes(f));
    let matchWeight = job.matchWeight;
    if (hasWeightChange) {
      matchWeight = this.calculateMatchWeight({ ...job.toJSON(), ...filteredData });
      filteredData.matchWeight = matchWeight;
    }

    if (job.status === JobStatus.DRAFT || job.status === JobStatus.REJECTED) {
      const oldValues = this.extractJobValues(job, changedFields);
      const version = (job.version || 1) + 1;

      const result = await jobDao.updateById(id, {
        ...filteredData,
        version,
        lastEditTime: new Date(),
        lastEditorId: currentUser?.id,
        lastEditorName: currentUser?.realName || currentUser?.username,
      });

      await this.writeOperationLog({
        jobId: id,
        action: JobOperationAction.UPDATE,
        fromStatus: job.status,
        toStatus: job.status,
        operatorId: currentUser?.id,
        operatorName: currentUser?.realName || currentUser?.username,
        remark: `更新字段：${changedFields.join('、')}（即时生效）`,
        changedFields: changedFields.join(','),
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(filteredData),
      });

      if (hasWeightChange) {
        await this.writeOperationLog({
          jobId: id,
          action: JobOperationAction.UPDATE_MATCH_WEIGHT,
          fromStatus: job.status,
          toStatus: job.status,
          operatorId: currentUser?.id,
          operatorName: currentUser?.realName || currentUser?.username,
          remark: `智能匹配权重更新：${job.matchWeight || 0} → ${matchWeight}`,
        });
      }

      return {
        ...result,
        effectiveMode: 'immediate',
        matchWeight,
      };
    }

    if (job.status === JobStatus.PUBLISHED) {
      if (!isMajor) {
        const oldValues = this.extractJobValues(job, changedFields);
        const version = (job.version || 1) + 1;

        const result = await jobDao.updateById(id, {
          ...filteredData,
          version,
          lastEditTime: new Date(),
          lastEditorId: currentUser?.id,
          lastEditorName: currentUser?.realName || currentUser?.username,
        });

        await this.writeOperationLog({
          jobId: id,
          action: JobOperationAction.UPDATE,
          fromStatus: job.status,
          toStatus: job.status,
          operatorId: currentUser?.id,
          operatorName: currentUser?.realName || currentUser?.username,
          remark: `更新字段：${changedFields.join('、')}（即时生效）`,
          changedFields: changedFields.join(','),
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(filteredData),
        });

        return {
          ...result,
          effectiveMode: 'immediate',
          matchWeight,
        };
      }

      const oldValues = this.extractJobValues(job, changedFields);
      const pendingChanges = {
        changes: filteredData,
        changedFields,
        oldValues,
        matchWeight,
        version: (job.version || 1) + 1,
      };

      const result = await jobDao.updateById(id, {
        pendingChanges: JSON.stringify(pendingChanges),
        isMajorChange: true,
        changeOperatorId: currentUser?.id,
        changeOperatorName: currentUser?.realName || currentUser?.username,
        changeSubmitTime: new Date(),
        lastEditTime: new Date(),
        lastEditorId: currentUser?.id,
        lastEditorName: currentUser?.realName || currentUser?.username,
      });

      await this.writeOperationLog({
        jobId: id,
        action: JobOperationAction.SUBMIT_CHANGE_AUDIT,
        fromStatus: job.status,
        toStatus: job.status,
        operatorId: currentUser?.id,
        operatorName: currentUser?.realName || currentUser?.username,
        remark: `提交变更审核：${changedFields.join('、')}`,
        changedFields: changedFields.join(','),
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(filteredData),
      });

      return {
        ...result,
        effectiveMode: 'audit_required',
        matchWeight,
      };
    }

    throw new ForbiddenError('当前状态不可编辑');
  }

  async approveChange(id: number, currentUser: CurrentUser, remark?: string): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可审核变更');
    }

    const job: any = await this.getById(id);

    if (!job.pendingChanges) {
      throw new NotFoundError('没有待审核的变更');
    }

    let pendingData: any;
    try {
      pendingData = JSON.parse(job.pendingChanges);
    } catch {
      throw new ParamError('待审核变更数据格式错误');
    }

    const { changes, matchWeight, version } = pendingData;

    const result = await jobDao.updateById(id, {
      ...changes,
      matchWeight,
      version,
      pendingChanges: null,
      isMajorChange: false,
      changeOperatorId: null,
      changeOperatorName: null,
      changeSubmitTime: null,
      lastEditTime: new Date(),
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.APPROVE_CHANGE,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      remark: remark || '变更审核通过，已同步更新',
      changedFields: pendingData.changedFields.join(','),
      oldValues: JSON.stringify(pendingData.oldValues),
      newValues: JSON.stringify(changes),
    });

    return result;
  }

  async rejectChange(id: number, rejectReason: string, currentUser: CurrentUser): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可驳回变更');
    }

    const job: any = await this.getById(id);

    if (!job.pendingChanges) {
      throw new NotFoundError('没有待审核的变更');
    }

    let pendingData: any;
    try {
      pendingData = JSON.parse(job.pendingChanges);
    } catch {
      throw new ParamError('待审核变更数据格式错误');
    }

    const result = await jobDao.updateById(id, {
      pendingChanges: null,
      isMajorChange: false,
      changeOperatorId: null,
      changeOperatorName: null,
      changeSubmitTime: null,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.REJECT_CHANGE,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      remark: `变更审核驳回：${rejectReason}`,
      changedFields: pendingData.changedFields.join(','),
      oldValues: JSON.stringify(pendingData.oldValues),
      newValues: JSON.stringify(pendingData.changes),
    });

    return result;
  }

  async cancelChange(id: number, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (!job.pendingChanges) {
      throw new NotFoundError('没有待审核的变更');
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.changeOperatorId && job.changeOperatorId !== currentUser.id) {
        throw new ForbiddenError('仅可取消本人提交的变更');
      }
    }

    const result = await jobDao.updateById(id, {
      pendingChanges: null,
      isMajorChange: false,
      changeOperatorId: null,
      changeOperatorName: null,
      changeSubmitTime: null,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.CANCEL_CHANGE,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '取消待审核变更',
    });

    return result;
  }

  async getVersionDiff(id: number, fromVersion?: number, toVersion?: number): Promise<VersionDiff[]> {
    const job: any = await this.getById(id);
    const logs = await jobOperationLogDao.findByJobId(id);

    const fieldLabels: Record<string, string> = {
      title: '岗位名称',
      category: '岗位类别',
      department: '所属部门',
      jobType: '工作类型',
      salaryMin: '最低薪资',
      salaryMax: '最高薪资',
      salaryUnit: '薪资单位',
      city: '工作城市',
      address: '工作地址',
      experience: '经验要求',
      education: '学历要求',
      recruitNum: '招聘人数',
      description: '岗位职责',
      requirements: '任职要求',
      benefits: '福利待遇',
      deadline: '截止日期',
      sort: '排序',
      status: '岗位状态',
    };

    const diffs: VersionDiff[] = [];
    const updateLogs = logs.filter(
      (l: any) => l.action === JobOperationAction.UPDATE || l.action === JobOperationAction.APPROVE_CHANGE
    );

    if (updateLogs.length >= 2) {
      const newLog = updateLogs[0];
      const oldLog = updateLogs[1];

      let newValues = {};
      let oldValues = {};

      try {
        newValues = newLog.newValues ? JSON.parse(newLog.newValues) : {};
        oldValues = oldLog.oldValues ? JSON.parse(oldLog.oldValues) : {};
      } catch {}

      const allFields = new Set([...Object.keys(newValues), ...Object.keys(oldValues)]);

      for (const field of allFields) {
        if (JOB_EDITABLE_FIELDS_DRAFT.includes(field)) {
          const oldVal = oldValues[field as keyof typeof oldValues];
          const newVal = newValues[field as keyof typeof newValues];
          diffs.push({
            field,
            label: fieldLabels[field] || field,
            oldValue: oldVal,
            newValue: newVal,
            changed: oldVal !== newVal,
          });
        }
      }
    } else {
      const allFields = [
        'title', 'category', 'department', 'jobType',
        'salaryMin', 'salaryMax', 'salaryUnit',
        'city', 'address', 'experience', 'education',
        'recruitNum', 'description', 'requirements', 'benefits',
      ];

      for (const field of allFields) {
        diffs.push({
          field,
          label: fieldLabels[field] || field,
          oldValue: job[field],
          newValue: job[field],
          changed: false,
        });
      }
    }

    return diffs;
  }

  async getEditHistory(jobId: number): Promise<any[]> {
    const logs = await jobOperationLogDao.findByJobId(jobId);
    const editActions = [
      JobOperationAction.UPDATE,
      JobOperationAction.SUBMIT_CHANGE_AUDIT,
      JobOperationAction.APPROVE_CHANGE,
      JobOperationAction.REJECT_CHANGE,
      JobOperationAction.CANCEL_CHANGE,
      JobOperationAction.ROLLBACK_VERSION,
    ];

    return logs
      .filter((l: any) => editActions.includes(l.action as JobOperationAction))
      .map((log: any) => ({
        ...log.toJSON(),
        actionLabel: JobOperationActionLabel[log.action as JobOperationAction] || log.action,
      }));
  }

  async checkQualificationMatch(job: any): Promise<{ matched: boolean; reason?: string }> {
    if (!job.category) {
      return { matched: true };
    }

    const company: any = await companyDao.findById(job.companyId);
    if (!company) {
      return { matched: false, reason: '企业不存在' };
    }

    if (!company.isQualificationApproved) {
      return { matched: false, reason: '企业资质未审核通过' };
    }

    if (company.jobCategories) {
      const allowedCategories = company.jobCategories.split(',');
      if (!allowedCategories.includes(job.category)) {
        return { matched: false, reason: `企业无"${job.category}"类岗位的招聘资质` };
      }
    }

    return { matched: true };
  }

  async updateAbnormalStatus(id: number, abnormal: boolean, reason?: string, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    const result = await jobDao.updateById(id, {
      abnormalFlag: abnormal,
      abnormalReason: reason,
    });

    await this.writeOperationLog({
      jobId: id,
      action: abnormal ? JobOperationAction.MARK_ABNORMAL : JobOperationAction.CLEAR_ABNORMAL,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: abnormal ? `标记异常：${reason || ''}` : '解除异常标记',
    });

    return result;
  }

  async batchUpdate(ids: number[], data: any, filter: BatchEditFilter, currentUser?: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const allowedBatchFields = ['salaryMin', 'salaryMax', 'salaryUnit', 'recruitNum', 'city', 'status'];
    const filteredData: any = {};
    for (const field of allowedBatchFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new ParamError('未指定要更新的字段');
    }

    for (const id of ids) {
      try {
        const job: any = await jobDao.findById(id);
        if (!job) {
          result.failed++;
          result.errors.push({ jobId: id, message: '岗位不存在' });
          continue;
        }

        if (currentUser && currentUser.role !== UserRole.ADMIN) {
          if (job.creatorId && job.creatorId !== currentUser.id) {
            result.failed++;
            result.errors.push({ jobId: id, title: job.title, message: '仅可编辑本人创建的岗位' });
            continue;
          }
        }

        const editCheck = await this.checkEditPermission(id, currentUser);
        if (!editCheck.canEdit) {
          result.failed++;
          result.errors.push({ jobId: id, title: job.title, message: editCheck.reason || '不可编辑' });
          continue;
        }

        const hasResume = await this.checkHasResume(id);
        const updateData = hasResume
          ? Object.fromEntries(Object.entries(filteredData).filter(([key]) => ['salaryMin', 'salaryMax', 'salaryUnit', 'recruitNum'].includes(key)))
          : filteredData;

        if (Object.keys(updateData).length === 0) {
          result.failed++;
          result.errors.push({ jobId: id, title: job.title, message: '已投递简历的岗位仅可更新薪资和招聘人数' });
          continue;
        }

        const changedFields = Object.keys(updateData).filter(f => job[f] !== updateData[f]);
        if (changedFields.length === 0) {
          result.failed++;
          result.errors.push({ jobId: id, title: job.title, message: '无有效变更' });
          continue;
        }

        const oldValues = this.extractJobValues(job, changedFields);
        const version = (job.version || 1) + 1;

        await jobDao.updateById(id, {
          ...updateData,
          version,
          lastEditTime: new Date(),
          lastEditorId: currentUser?.id,
          lastEditorName: currentUser?.realName || currentUser?.username,
        });

        await this.writeOperationLog({
          jobId: id,
          action: JobOperationAction.BATCH_UPDATE,
          fromStatus: job.status,
          toStatus: updateData.status || job.status,
          operatorId: currentUser?.id,
          operatorName: currentUser?.realName || currentUser?.username,
          remark: `批量更新：${changedFields.join('、')}`,
          changedFields: changedFields.join(','),
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(updateData),
        });

        const qualMatch = await this.checkQualificationMatch({ ...job.toJSON(), ...updateData });
        if (!qualMatch.matched) {
          await this.updateAbnormalStatus(id, true, qualMatch.reason, currentUser);
        } else if (job.abnormalFlag) {
          await this.updateAbnormalStatus(id, false, '', currentUser);
        }

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          jobId: id,
          message: error.message || '更新失败',
        });
      }
    }

    return result;
  }

  private async checkHasResume(jobId: number): Promise<boolean> {
    try {
      const { Resume } = await import('../models');
      const count = await Resume.count({ where: { jobId } });
      return count > 0;
    } catch {
      return false;
    }
  }

  async rollbackVersion(id: number, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);
    const logs = await jobOperationLogDao.findByJobId(id);

    const updateLogs = logs.filter(
      (l: any) => l.action === JobOperationAction.UPDATE || l.action === JobOperationAction.APPROVE_CHANGE
    );

    if (updateLogs.length < 2) {
      throw new AppError(40007, '没有可回滚的历史版本', 400);
    }

    const lastLog = updateLogs[1];
    let oldValues = {};
    try {
      oldValues = lastLog.oldValues ? JSON.parse(lastLog.oldValues) : {};
    } catch {
      throw new ParamError('历史版本数据格式错误');
    }

    const changedFields = Object.keys(oldValues);
    const version = (job.version || 1) + 1;

    const result = await jobDao.updateById(id, {
      ...oldValues,
      version,
      lastEditTime: new Date(),
      lastEditorId: currentUser?.id,
      lastEditorName: currentUser?.realName || currentUser?.username,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.ROLLBACK_VERSION,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: `回滚到上一版本，恢复字段：${changedFields.join('、')}`,
      changedFields: changedFields.join(','),
      oldValues: JSON.stringify(this.extractJobValues(job, changedFields)),
      newValues: JSON.stringify(oldValues),
    });

    return result;
  }

  async checkOnlinePermission(id: number): Promise<{ canOnline: boolean; reason?: string }> {
    const job: any = await this.getById(id);

    if (job.status !== JobStatus.PUBLISHED) {
      return { canOnline: false, reason: '仅已发布状态的岗位可上架' };
    }

    const company: any = await companyDao.findById(job.companyId);
    if (!company) {
      return { canOnline: false, reason: '企业不存在' };
    }
    if (!company.isQualificationApproved) {
      return { canOnline: false, reason: '企业资质未审核通过' };
    }

    const config = await recruitmentConfigDao.findByCompanyId(job.companyId);
    if (!config || config.configStatus !== ConfigStatus.ENABLED) {
      return { canOnline: false, reason: '企业招聘配置未启用' };
    }

    if (job.violationFlag) {
      return { canOnline: false, reason: '岗位存在违规风控标记，需先解除' };
    }

    if (job.expireTime && new Date(job.expireTime) < new Date()) {
      return { canOnline: false, reason: '岗位已过期' };
    }

    return { canOnline: true };
  }

  async checkOfflinePermission(id: number): Promise<{ canOffline: boolean; reason?: string; blockedItems?: string[] }> {
    const job: any = await this.getById(id);

    if (job.status !== JobStatus.PUBLISHED) {
      return { canOffline: false, reason: '仅已发布状态的岗位可下架' };
    }

    const blockedItems: string[] = [];

    try {
      const { Interview } = await import('../models');
      const interviewCount = await Interview.count({
        where: { jobId: id, result: 'pending' },
      });
      if (interviewCount > 0) {
        blockedItems.push(`存在 ${interviewCount} 个正在进行的面试流程`);
      }
    } catch {
      // ignore
    }

    try {
      const { Onboard } = await import('../models');
      const onboardCount = await Onboard.count({
        where: { jobId: id, status: { [Op.in]: ['pending', 'confirmed'] } },
      });
      if (onboardCount > 0) {
        blockedItems.push(`存在 ${onboardCount} 个正在进行的入职流程`);
      }
    } catch {
      // ignore
    }

    if (blockedItems.length > 0) {
      return { canOffline: false, reason: '存在未完结业务流程', blockedItems };
    }

    return { canOffline: true };
  }

  async onlineJob(id: number, remark?: string, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可操作本人创建的岗位');
      }
    }

    const check = await this.checkOnlinePermission(id);
    if (!check.canOnline) {
      throw new ForbiddenError(check.reason || '不满足上架条件');
    }

    const newCount = (job.onlineOfflineCount || 0) + 1;

    const result = await jobDao.updateById(id, {
      status: JobStatus.PUBLISHED,
      resumeCollectEnabled: true,
      smartMatchEnabled: true,
      exposurePushEnabled: true,
      onlineTime: new Date(),
      onlineOfflineCount: newCount,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.ONLINE,
      fromStatus: job.status,
      toStatus: JobStatus.PUBLISHED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: remark || '岗位上架，开启简历收录、智能匹配、曝光推送',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.ENABLE_RESUME_COLLECT,
      fromStatus: job.status,
      toStatus: JobStatus.PUBLISHED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '开启简历收录功能',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.ENABLE_SMART_MATCH,
      fromStatus: job.status,
      toStatus: JobStatus.PUBLISHED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '开启智能匹配功能',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.ENABLE_EXPOSURE_PUSH,
      fromStatus: job.status,
      toStatus: JobStatus.PUBLISHED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '开启曝光推送功能',
    });

    await this.checkAndMarkRiskWarning(id, newCount, currentUser);

    return result;
  }

  async offlineJob(id: number, remark?: string, force?: boolean, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (job.creatorId && job.creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可操作本人创建的岗位');
      }
    }

    if (!force) {
      const check = await this.checkOfflinePermission(id);
      if (!check.canOffline) {
        throw new ForbiddenError(check.reason || '不满足下架条件');
      }
    }

    const newCount = (job.onlineOfflineCount || 0) + 1;

    const result = await jobDao.updateById(id, {
      status: JobStatus.PAUSED,
      resumeCollectEnabled: false,
      smartMatchEnabled: false,
      exposurePushEnabled: false,
      offlineTime: new Date(),
      onlineOfflineCount: newCount,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.OFFLINE,
      fromStatus: job.status,
      toStatus: JobStatus.PAUSED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: remark || `岗位下架，暂停简历收录、智能匹配、曝光推送${force ? '（强制下架）' : ''}`,
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.DISABLE_RESUME_COLLECT,
      fromStatus: job.status,
      toStatus: JobStatus.PAUSED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '关闭简历收录功能',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.DISABLE_SMART_MATCH,
      fromStatus: job.status,
      toStatus: JobStatus.PAUSED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '关闭智能匹配功能',
    });

    await this.writeOperationLog({
      jobId: id,
      action: JobOperationAction.DISABLE_EXPOSURE_PUSH,
      fromStatus: job.status,
      toStatus: JobStatus.PAUSED,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: '关闭曝光推送功能',
    });

    await this.checkAndMarkRiskWarning(id, newCount, currentUser);

    return result;
  }

  async batchOnline(ids: number[], filter: BatchOnlineOfflineFilter, remark?: string, currentUser?: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const job: any = await jobDao.findById(id);
        if (!job) {
          result.failed++;
          result.errors.push({ jobId: id, message: '岗位不存在' });
          continue;
        }

        if (currentUser && currentUser.role !== UserRole.ADMIN) {
          if (job.creatorId && job.creatorId !== currentUser.id) {
            result.failed++;
            result.errors.push({ jobId: id, title: job.title, message: '仅可操作本人创建的岗位' });
            continue;
          }
        }

        const check = await this.checkOnlinePermission(id);
        if (!check.canOnline) {
          result.failed++;
          result.errors.push({ jobId: id, title: job.title, message: check.reason || '不满足上架条件' });
          continue;
        }

        await this.onlineJob(id, remark, currentUser);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          jobId: id,
          message: error.message || '上架失败',
        });
      }
    }

    return result;
  }

  async batchOffline(ids: number[], filter: BatchOnlineOfflineFilter, remark?: string, force?: boolean, currentUser?: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const job: any = await jobDao.findById(id);
        if (!job) {
          result.failed++;
          result.errors.push({ jobId: id, message: '岗位不存在' });
          continue;
        }

        if (currentUser && currentUser.role !== UserRole.ADMIN) {
          if (job.creatorId && job.creatorId !== currentUser.id) {
            result.failed++;
            result.errors.push({ jobId: id, title: job.title, message: '仅可操作本人创建的岗位' });
            continue;
          }
        }

        await this.offlineJob(id, remark, force, currentUser);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          jobId: id,
          message: error.message || '下架失败',
        });
      }
    }

    return result;
  }

  async getOnlineOfflineHistory(jobId: number): Promise<any[]> {
    const logs = await jobOperationLogDao.findByJobId(jobId);
    return logs.filter((l: any) =>
      [JobOperationAction.ONLINE, JobOperationAction.OFFLINE].includes(l.action)
    ).map((l: any) => ({
      id: l.id,
      action: l.action,
      actionLabel: JobOperationActionLabel[l.action as JobOperationAction],
      fromStatus: l.fromStatus,
      toStatus: l.toStatus,
      operatorId: l.operatorId,
      operatorName: l.operatorName,
      remark: l.remark,
      createdAt: l.created_at,
    }));
  }

  private async checkAndMarkRiskWarning(jobId: number, count: number, currentUser?: CurrentUser): Promise<void> {
    const RISK_THRESHOLD = 5;
    if (count >= RISK_THRESHOLD) {
      await jobDao.updateById(jobId, {
        riskWarningFlag: true,
        riskWarningReason: `岗位上下架切换频繁，近${count}次操作，可能存在异常`,
      });

      await this.writeOperationLog({
        jobId,
        action: JobOperationAction.MARK_RISK_WARNING,
        operatorId: currentUser?.id,
        operatorName: currentUser?.realName || currentUser?.username,
        remark: `岗位上下架频次达${count}次，自动标记风控预警`,
      });
    }
  }

  async updateRiskWarning(id: number, isWarning: boolean, reason?: string, currentUser?: CurrentUser): Promise<any> {
    const job: any = await this.getById(id);

    const result = await jobDao.updateById(id, {
      riskWarningFlag: isWarning,
      riskWarningReason: isWarning ? reason : '',
    });

    await this.writeOperationLog({
      jobId: id,
      action: isWarning ? JobOperationAction.MARK_RISK_WARNING : JobOperationAction.CLEAR_RISK_WARNING,
      fromStatus: job.status,
      toStatus: job.status,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
      remark: isWarning ? `标记风控预警：${reason || ''}` : '解除风控预警',
    });

    return result;
  }

  async getOnlineOfflineStats(): Promise<{ totalCount: number; onlineCount: number; offlineCount: number; riskCount: number }> {
    const totalCount = await jobDao.count();
    const onlineCount = await jobDao.count({ where: { status: JobStatus.PUBLISHED } });
    const offlineCount = await jobDao.count({ where: { status: { [Op.in]: [JobStatus.PAUSED, JobStatus.CLOSED] } } });
    const riskCount = await jobDao.count({ where: { riskWarningFlag: true } });

    return { totalCount, onlineCount, offlineCount, riskCount };
  }
}

export default new JobService();
