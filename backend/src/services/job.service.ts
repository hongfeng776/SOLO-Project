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

const JOB_EDITABLE_FIELDS_DRAFT = [
  'title', 'category', 'department', 'jobType',
  'salaryMin', 'salaryMax', 'salaryUnit',
  'city', 'address', 'experience', 'education',
  'recruitNum', 'description', 'requirements', 'benefits',
  'deadline', 'sort'
];

const JOB_EDITABLE_FIELDS_PENDING = ['sort'];

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
}

export default new JobService();
