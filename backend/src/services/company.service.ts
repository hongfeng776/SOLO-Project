import { Op } from 'sequelize';
import companyDao from '../dao/company.dao';
import companyChangeLogDao from '../dao/company-change-log.dao';
import jobDao from '../dao/job.dao';
import { NotFoundError, ForbiddenError, ParamError, ConflictError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import CompanyModel from '../models/company.model';
import CompanyChangeLogModel from '../models/company-change-log.model';
import { UserRole, RecruitStatus, CompanyChangeAction, IndustryJobCategoryMap, ScaleRecruitRangeMap } from '../constants/recruitment.enum';
import { QualificationAuditStatus } from '../constants/recruitment.enum';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
}

interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

interface BatchUpdateResult {
  total: number;
  success: number;
  failed: number;
  needAudit: number;
  errors: { companyId: number; companyName: string; message: string }[];
}

class CompanyService {
  async getList(params: any): Promise<IPaginationResult<CompanyModel>> {
    const { name, status, industry, scale, recruitStatus, ...rest } = params;
    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = status;
    }
    if (industry) {
      where.industry = industry;
    }
    if (scale) {
      where.scale = scale;
    }
    if (recruitStatus) {
      where.recruitStatus = recruitStatus;
    }

    return companyDao.paginate(rest, {
      where,
      order: [['sort', 'ASC'], ['id', 'DESC']],
    });
  }

  async getById(id: number): Promise<CompanyModel | null> {
    const company = await companyDao.findById(id);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }
    return company;
  }

  async getDetailWithLogs(id: number): Promise<{ company: CompanyModel; changeLogs: CompanyChangeLogModel[] }> {
    const company = await this.getById(id);
    const changeLogs = await companyChangeLogDao.findByCompanyId(id);
    return { company, changeLogs };
  }

  async checkQualificationApproved(companyId: number): Promise<boolean> {
    const company = await this.getById(companyId);
    return company.isQualificationApproved === true;
  }

  async validateData(data: any, excludeId?: number): Promise<ValidateResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.contactPhone && !/^1[3-9]\d{9}$/.test(data.contactPhone)) {
      errors.push('手机号格式错误，请输入正确的11位手机号码');
    }

    if (data.address !== undefined && data.address !== null && data.address !== '' && data.address.trim() === '') {
      errors.push('办公地址不能为空');
    }

    if (data.officeAddress !== undefined && data.officeAddress !== null && data.officeAddress !== '' && data.officeAddress.trim() === '') {
      errors.push('办公地址不能为空');
    }

    if (data.scale) {
      const validScales = ['少于50人', '50-100人', '100-500人', '500-1000人', '1000人以上'];
      if (!validScales.includes(data.scale)) {
        errors.push('企业规模数值异常，请选择正确的规模范围');
      }
    }

    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      warnings.push('邮箱格式不正确');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async checkDuplicateChanges(id: number, newData: any): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    const changedFields = this.getChangedFields(existing.toJSON(), newData);
    return changedFields.length === 0;
  }

  getChangedFields(oldData: any, newData: any): FieldDiff[] {
    const diffs: FieldDiff[] = [];
    const trackedFields = [
      'name', 'shortName', 'industry', 'scale', 'nature', 'address', 'officeAddress',
      'contactPerson', 'contactPhone', 'contactEmail', 'description',
      'recruitStatus', 'jobCategories', 'status', 'sort',
    ];

    for (const field of trackedFields) {
      if (newData[field] !== undefined && newData[field] !== oldData[field]) {
        diffs.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field],
        });
      }
    }
    return diffs;
  }

  async getMatchingJobCategories(industry: string): Promise<string[]> {
    return IndustryJobCategoryMap[industry] || [];
  }

  async getMatchingRecruitRange(scale: string): Promise<string[]> {
    return ScaleRecruitRangeMap[scale] || [];
  }

  async clearUnmatchedJobCategories(companyId: number, newIndustry: string): Promise<void> {
    const company = await this.getById(companyId);
    const currentCategories = company.jobCategories ? company.jobCategories.split(',') : [];
    const allowedCategories = await this.getMatchingJobCategories(newIndustry);

    const unmatched = currentCategories.filter(cat => !allowedCategories.includes(cat));
    const matched = currentCategories.filter(cat => allowedCategories.includes(cat));

    if (unmatched.length > 0) {
      await companyDao.updateById(companyId, { jobCategories: matched.join(',') });
    }

    await jobDao.update(
      { jobType: '' },
      { where: { companyId, jobType: { [Op.in]: unmatched } } }
    );
  }

  async create(data: any, currentUser: CurrentUser): Promise<CompanyModel> {
    const validateResult = await this.validateData(data);
    if (!validateResult.valid) {
      throw new ParamError(validateResult.errors.join('；'));
    }

    const company = await companyDao.create({
      ...data,
      isQualificationApproved: false,
    });

    await this.writeChangeLog(
      company.id,
      CompanyChangeAction.CREATE,
      [],
      {},
      data,
      currentUser,
      false,
      'global'
    );

    return company;
  }

  async update(id: number, data: any, currentUser: CurrentUser): Promise<{ needAudit: boolean; company: CompanyModel }> {
    const existing = await this.getById(id);
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!existing.isQualificationApproved && !isAdmin) {
      throw new ForbiddenError('企业资质未审核通过，无法编辑');
    }

    if (existing.changeAuditStatus === 'pending' && !isAdmin) {
      throw new ConflictError('该企业有变更正在审核中，请等待审核完成后再操作');
    }

    const validateResult = await this.validateData(data);
    if (!validateResult.valid) {
      throw new ParamError(validateResult.errors.join('；'));
    }

    const oldData = existing.toJSON();
    const changedFields = this.getChangedFields(oldData, data);

    if (changedFields.length === 0) {
      throw new ConflictError('未检测到内容变更，无需重复操作');
    }

    if (data.industry && data.industry !== existing.industry) {
      await this.clearUnmatchedJobCategories(id, data.industry);
    }

    const needAudit = !isAdmin;
    let company: CompanyModel;
    let action = CompanyChangeAction.UPDATE;

    if (needAudit) {
      await companyDao.updateById(id, {
        pendingChanges: JSON.stringify(data),
        changeAuditStatus: 'pending',
        changeOperatorId: currentUser.id,
        changeOperatorName: currentUser.username,
      });
      company = (await this.getById(id))!;
    } else {
      const updated = await companyDao.updateById(id, data);
      company = updated[1][0];
    }

    await this.writeChangeLog(
      id,
      action,
      changedFields,
      oldData,
      data,
      currentUser,
      needAudit,
      'global'
    );

    return { needAudit, company };
  }

  async approveChange(id: number, auditRemark: string, currentUser: CurrentUser): Promise<CompanyModel> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('无权限执行审核操作');
    }

    const company = await this.getById(id);

    if (company.changeAuditStatus !== 'pending' || !company.pendingChanges) {
      throw new ConflictError('该企业没有待审核的变更申请');
    }

    let pendingData: any;
    try {
      pendingData = JSON.parse(company.pendingChanges);
    } catch {
      throw new ParamError('待审核数据格式错误');
    }

    const oldData = company.toJSON();

    await companyDao.updateById(id, {
      ...pendingData,
      pendingChanges: null,
      changeAuditStatus: 'approved',
      changeOperatorId: null,
      changeOperatorName: null,
    });

    const updatedCompany = (await this.getById(id))!;

    const changedFields = this.getChangedFields(oldData, pendingData);
    await companyChangeLogDao.create({
      companyId: id,
      action: CompanyChangeAction.UPDATE_APPROVE,
      changedFields: changedFields.map(f => f.field).join(','),
      oldValues: JSON.stringify(oldData),
      newValues: JSON.stringify(pendingData),
      operatorId: company.changeOperatorId,
      operatorName: company.changeOperatorName,
      needAudit: true,
      auditStatus: 'approved',
      auditorId: currentUser.id,
      auditorName: currentUser.username,
      auditRemark,
      auditTime: new Date(),
      effectiveMode: 'global',
    });

    return updatedCompany;
  }

  async rejectChange(id: number, rejectReason: string, currentUser: CurrentUser): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('无权限执行审核操作');
    }

    const company = await this.getById(id);

    if (company.changeAuditStatus !== 'pending') {
      throw new ConflictError('该企业没有待审核的变更申请');
    }

    await companyDao.updateById(id, {
      pendingChanges: null,
      changeAuditStatus: 'rejected',
      changeOperatorId: null,
      changeOperatorName: null,
    });

    await companyChangeLogDao.create({
      companyId: id,
      action: CompanyChangeAction.UPDATE_REJECT,
      changedFields: '变更审核驳回',
      oldValues: company.pendingChanges,
      operatorId: company.changeOperatorId,
      operatorName: company.changeOperatorName,
      needAudit: true,
      auditStatus: 'rejected',
      auditorId: currentUser.id,
      auditorName: currentUser.username,
      auditRemark: rejectReason,
      auditTime: new Date(),
      effectiveMode: 'global',
    });
  }

  async batchUpdate(
    ids: number[],
    updateData: any,
    currentUser: CurrentUser,
    effectiveMode: 'global' | 'backend_only' = 'global'
  ): Promise<BatchUpdateResult> {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const result: BatchUpdateResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      needAudit: 0,
      errors: [],
    };

    const validateResult = await this.validateData(updateData);

    for (const id of ids) {
      try {
        const company = await this.getById(id);

        if (!company.isQualificationApproved && !isAdmin) {
          result.failed++;
          result.errors.push({ companyId: id, companyName: company.name, message: '企业资质未审核通过' });
          continue;
        }

        if (!isAdmin && company.changeAuditStatus === 'pending') {
          result.failed++;
          result.errors.push({ companyId: id, companyName: company.name, message: '有变更正在审核中' });
          continue;
        }

        const changedFields = this.getChangedFields(company.toJSON(), updateData);
        if (changedFields.length === 0) {
          result.failed++;
          result.errors.push({ companyId: id, companyName: company.name, message: '未检测到内容变更' });
          continue;
        }

        if (updateData.industry && updateData.industry !== company.industry) {
          await this.clearUnmatchedJobCategories(id, updateData.industry);
        }

        const needAudit = !isAdmin;

        if (needAudit) {
          result.needAudit++;
          await companyDao.updateById(id, {
            pendingChanges: JSON.stringify(updateData),
            changeAuditStatus: 'pending',
            changeOperatorId: currentUser.id,
            changeOperatorName: currentUser.username,
          });
        } else {
          result.success++;
          await companyDao.updateById(id, updateData);
        }

        await this.writeChangeLog(
          id,
          CompanyChangeAction.BATCH_UPDATE,
          changedFields,
          company.toJSON(),
          updateData,
          currentUser,
          needAudit,
          effectiveMode
        );
      } catch (error: any) {
        result.failed++;
        const company = await companyDao.findById(id);
        result.errors.push({
          companyId: id,
          companyName: company?.name || '未知企业',
          message: error.message || '操作失败',
        });
      }
    }

    return result;
  }

  async getChangeLogs(params: any): Promise<IPaginationResult<CompanyChangeLogModel>> {
    return companyChangeLogDao.findWithFilters(params);
  }

  async remove(id: number): Promise<number> {
    await this.getById(id);
    return companyDao.destroyById(id);
  }

  async batchRemove(ids: number[]): Promise<number> {
    return companyDao.destroy({ where: { id: ids } });
  }

  private async writeChangeLog(
    companyId: number,
    action: CompanyChangeAction,
    changedFields: FieldDiff[],
    oldValues: any,
    newValues: any,
    currentUser: CurrentUser,
    needAudit: boolean,
    effectiveMode: 'global' | 'backend_only'
  ): Promise<void> {
    await companyChangeLogDao.create({
      companyId,
      action,
      changedFields: changedFields.length > 0 ? changedFields.map(f => f.field).join(','),
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(newValues),
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      needAudit,
      auditStatus: needAudit ? 'pending' : undefined,
      effectiveMode,
    });
  }
}

export default new CompanyService();
