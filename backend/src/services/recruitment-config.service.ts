import { Op } from 'sequelize';
import recruitmentConfigDao from '../dao/recruitment-config.dao';
import recruitmentConfigLogDao from '../dao/recruitment-config-log.dao';
import companyDao from '../dao/company.dao';
import jobDao from '../dao/job.dao';
import { NotFoundError, ForbiddenError, ParamError, ConflictError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import RecruitmentConfigModel from '../models/recruitment-config.model';
import RecruitmentConfigLogModel from '../models/recruitment-config-log.model';
import CompanyModel from '../models/company.model';
import {
  UserRole,
  ConfigStatus,
  ConfigLogAction,
  WELFARE_TAGS,
  GENERAL_WELFARE_TAGS,
  VIOLATION_KEYWORDS,
  FALSE_RECRUITMENT_KEYWORDS,
  COMPANY_INFO_FIELDS,
  INFO_COMPLETENESS_THRESHOLD,
  DISPLAY_TAGS,
  IndustryJobCategoryMap,
} from '../constants/recruitment.enum';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
}

interface CompletenessResult {
  score: number;
  threshold: number;
  isReached: boolean;
  fieldDetails: { key: string; label: string; filled: boolean; weight: number }[];
}

interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  violationTags: string[];
  falseRecruitmentTags: string[];
}

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: { configId: number; companyName: string; message: string }[];
}

class RecruitmentConfigService {
  async getList(params: any, currentUser: CurrentUser): Promise<IPaginationResult<RecruitmentConfigModel>> {
    const where: any = {};
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    return recruitmentConfigDao.getList({ ...params, ...where });
  }

  async getByCompanyId(companyId: number, currentUser: CurrentUser): Promise<RecruitmentConfigModel | null> {
    this.checkPermission(companyId, currentUser);
    const config = await recruitmentConfigDao.findByCompanyId(companyId);
    return config;
  }

  async getById(id: number, currentUser: CurrentUser): Promise<RecruitmentConfigModel> {
    const config = await recruitmentConfigDao.findById(id);
    if (!config) {
      throw new NotFoundError('招聘配置不存在');
    }
    this.checkPermission(config.companyId, currentUser);
    return config;
  }

  async checkInfoCompleteness(companyId: number): Promise<CompletenessResult> {
    const company = await companyDao.findById(companyId);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }

    const companyData = company.toJSON();
    let totalScore = 0;
    const fieldDetails: { key: string; label: string; filled: boolean; weight: number }[] = [];

    for (const field of COMPANY_INFO_FIELDS) {
      const value = companyData[field.key];
      const filled = value !== undefined && value !== null && value !== '';
      if (filled) {
        totalScore += field.weight;
      }
      fieldDetails.push({
        key: field.key,
        label: field.label,
        filled,
        weight: field.weight,
      });
    }

    return {
      score: totalScore,
      threshold: INFO_COMPLETENESS_THRESHOLD,
      isReached: totalScore >= INFO_COMPLETENESS_THRESHOLD,
      fieldDetails,
    };
  }

  async getMatchingTags(industry: string, jobCategory: string): Promise<{ welfareTags: string[]; displayTags: string[] }> {
    const welfareTags = WELFARE_TAGS[jobCategory] || [];
    return {
      welfareTags: [...welfareTags, ...GENERAL_WELFARE_TAGS],
      displayTags: DISPLAY_TAGS,
    };
  }

  async getMatchingWelfareByIndustry(industry: string): Promise<string[]> {
    const jobCategories = IndustryJobCategoryMap[industry] || [];
    const welfareSet = new Set<string>(GENERAL_WELFARE_TAGS);
    for (const cat of jobCategories) {
      const tags = WELFARE_TAGS[cat] || [];
      tags.forEach(t => welfareSet.add(t));
    }
    return Array.from(welfareSet);
  }

  validateConfig(data: any, companyIndustry: string): ValidateResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const violationTags: string[] = [];
    const falseRecruitmentTags: string[] = [];

    const allTexts = [
      data.displayTags || '',
      data.welfareTags || '',
      data.requirements || '',
    ].join(' ');

    for (const keyword of VIOLATION_KEYWORDS) {
      if (allTexts.includes(keyword)) {
        violationTags.push(keyword);
      }
    }
    if (violationTags.length > 0) {
      errors.push(`配置内容包含违规关键词：${violationTags.join('、')}`);
    }

    for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
      if (allTexts.includes(keyword)) {
        falseRecruitmentTags.push(keyword);
      }
    }
    if (falseRecruitmentTags.length > 0) {
      warnings.push(`配置内容包含疑似虚假招聘描述：${falseRecruitmentTags.join('、')}`);
    }

    if (data.welfareTags) {
      const welfareList = data.welfareTags.split(',').filter(Boolean);
      const jobCategories = IndustryJobCategoryMap[companyIndustry] || [];
      const allowedWelfare = new Set(GENERAL_WELFARE_TAGS);
      for (const cat of jobCategories) {
        (WELFARE_TAGS[cat] || []).forEach(t => allowedWelfare.add(t));
      }

      const mismatchedTags: string[] = [];
      for (const tag of welfareList) {
        if (!allowedWelfare.has(tag)) {
          mismatchedTags.push(tag);
        }
      }
      if (mismatchedTags.length > 0) {
        errors.push(`以下福利标签与企业行业不匹配：${mismatchedTags.join('、')}`);
      }
    }

    if (data.displayTags) {
      const tagList = data.displayTags.split(',').filter(Boolean);
      const invalidTags = tagList.filter(t => !DISPLAY_TAGS.includes(t));
      if (invalidTags.length > 0) {
        errors.push(`无效的展示标签：${invalidTags.join('、')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      violationTags,
      falseRecruitmentTags,
    };
  }

  async checkDuplicateConfig(configId: number | null, data: any): Promise<{ isDuplicate: boolean; message: string }> {
    const dataStr = JSON.stringify({
      displayTags: data.displayTags || '',
      welfareTags: data.welfareTags || '',
      requirements: data.requirements || '',
      workTypes: data.workTypes || '',
      jobCategories: data.jobCategories || '',
    });

    if (!configId) {
      return { isDuplicate: false, message: '' };
    }

    const latestLog = await recruitmentConfigLogDao.findLatestByConfigId(configId);
    if (latestLog && latestLog.newValues) {
      try {
        const latestData = JSON.parse(latestLog.newValues);
        const latestKeys = Object.keys(latestData).filter(k =>
          ['displayTags', 'welfareTags', 'requirements', 'workTypes', 'jobCategories'].includes(k)
        );
        const isSame = latestKeys.every(k => latestData[k] === (data[k] || ''));
        if (isSame && latestLog.action !== 'disable' && latestLog.action !== 'enable') {
          return { isDuplicate: true, message: '检测到与最近一次配置内容完全相同，无需重复提交' };
        }
      } catch {
        // ignore parse error
      }
    }

    return { isDuplicate: false, message: '' };
  }

  async create(companyId: number, data: any, currentUser: CurrentUser): Promise<RecruitmentConfigModel> {
    this.checkPermission(companyId, currentUser);

    const completeness = await this.checkInfoCompleteness(companyId);
    if (!completeness.isReached) {
      throw new ForbiddenError(`企业基础信息完整度为${completeness.score}%，未达到${completeness.threshold}%的要求，无法配置招聘信息`);
    }

    const company = await companyDao.findById(companyId);
    if (!company) {
      throw new NotFoundError('企业不存在');
    }

    const existing = await recruitmentConfigDao.findByCompanyId(companyId);
    if (existing) {
      throw new ConflictError('该企业招聘配置已存在，请使用更新操作');
    }

    const validation = this.validateConfig(data, company.industry || '');
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const duplicateCheck = await this.checkDuplicateConfig(null, data);
    if (duplicateCheck.isDuplicate) {
      throw new ConflictError(duplicateCheck.message);
    }

    const configData = {
      companyId,
      companyName: company.name,
      displayTags: data.displayTags || '',
      welfareTags: data.welfareTags || '',
      requirements: data.requirements || '',
      workTypes: data.workTypes || '',
      jobCategories: data.jobCategories || '',
      configStatus: ConfigStatus.DISABLED,
      version: 1,
      createdBy: currentUser.id,
      createdByName: currentUser.username,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    const config = await recruitmentConfigDao.create(configData);

    await this.writeConfigLog({
      configId: config.id,
      companyId,
      companyName: company.name,
      action: ConfigLogAction.CREATE,
      changedFields: 'displayTags,welfareTags,requirements,workTypes,jobCategories',
      oldValues: '',
      newValues: JSON.stringify(configData),
      versionBefore: 0,
      versionAfter: 1,
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      isComplianceChecked: validation.valid,
      complianceIssues: validation.warnings.join(','),
      isDuplicateDetected: false,
    });

    return config;
  }

  async update(id: number, data: any, currentUser: CurrentUser): Promise<RecruitmentConfigModel> {
    const config = await this.getById(id, currentUser);

    const completeness = await this.checkInfoCompleteness(config.companyId);
    if (!completeness.isReached) {
      throw new ForbiddenError(`企业基础信息完整度为${completeness.score}%，未达到${completeness.threshold}%的要求，无法修改招聘配置`);
    }

    const company = await companyDao.findById(config.companyId);
    const validation = this.validateConfig(data, company?.industry || '');
    if (!validation.valid) {
      throw new ParamError(validation.errors.join('；'));
    }

    const duplicateCheck = await this.checkDuplicateConfig(id, data);
    if (duplicateCheck.isDuplicate) {
      throw new ConflictError(duplicateCheck.message);
    }

    const changedFields = this.getChangedFields(config, data);
    if (changedFields.length === 0) {
      throw new ConflictError('未检测到配置变更，无需提交');
    }

    const oldValues = this.extractConfigData(config);
    const newVersion = config.version + 1;

    const updateData = {
      ...data,
      version: newVersion,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    await recruitmentConfigDao.updateById(id, updateData);

    const newValues = { ...oldValues, ...data };
    await this.writeConfigLog({
      configId: id,
      companyId: config.companyId,
      companyName: config.companyName,
      action: ConfigLogAction.UPDATE,
      changedFields: changedFields.join(','),
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(newValues),
      versionBefore: config.version,
      versionAfter: newVersion,
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      isComplianceChecked: validation.valid,
      complianceIssues: validation.warnings.join(','),
      isDuplicateDetected: false,
    });

    return (await recruitmentConfigDao.findById(id))!;
  }

  async toggleStatus(id: number, targetStatus: string, currentUser: CurrentUser, remark?: string): Promise<RecruitmentConfigModel> {
    const config = await this.getById(id, currentUser);

    if (config.configStatus === targetStatus) {
      throw new ConflictError(`配置已处于${targetStatus === 'enabled' ? '启用' : '停用'}状态`);
    }

    const action = targetStatus === 'enabled' ? ConfigLogAction.ENABLE : ConfigLogAction.DISABLE;

    const updateData: any = {
      configStatus: targetStatus as any,
      updatedBy: currentUser.id,
      updatedByName: currentUser.username,
    };

    if (targetStatus === 'enabled') {
      updateData.activatedAt = new Date();
    } else {
      updateData.deactivatedAt = new Date();
    }

    await recruitmentConfigDao.updateById(id, updateData);

    await this.writeConfigLog({
      configId: id,
      companyId: config.companyId,
      companyName: config.companyName,
      action,
      changedFields: 'configStatus',
      oldValues: JSON.stringify({ configStatus: config.configStatus }),
      newValues: JSON.stringify({ configStatus: targetStatus }),
      versionBefore: config.version,
      versionAfter: config.version,
      operatorId: currentUser.id,
      operatorName: currentUser.username,
      operatorRole: currentUser.role,
      operationRemark: remark,
      isComplianceChecked: true,
      isDuplicateDetected: false,
    });

    return (await recruitmentConfigDao.findById(id))!;
  }

  async batchToggleStatus(ids: number[], targetStatus: string, currentUser: CurrentUser): Promise<BatchResult> {
    const configs = await recruitmentConfigDao.getByIds(ids);
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const config of configs) {
      try {
        if (currentUser.role !== UserRole.ADMIN && currentUser.companyId !== config.companyId) {
          throw new ForbiddenError('无权限操作该企业配置');
        }
        if (config.configStatus !== targetStatus) {
          await this.toggleStatus(config.id, targetStatus, currentUser);
        }
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          configId: config.id,
          companyName: config.companyName || '',
          message: err.message || '操作失败',
        });
      }
    }

    return result;
  }

  async batchReplaceWelfare(ids: number[], oldTags: string[], newTags: string[], currentUser: CurrentUser): Promise<BatchResult> {
    const configs = await recruitmentConfigDao.getByIds(ids);
    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const config of configs) {
      try {
        if (currentUser.role !== UserRole.ADMIN && currentUser.companyId !== config.companyId) {
          throw new ForbiddenError('无权限操作该企业配置');
        }

        let welfareList = config.welfareTags ? config.welfareTags.split(',').filter(Boolean) : [];
        let changed = false;

        for (const oldTag of oldTags) {
          const idx = welfareList.indexOf(oldTag);
          if (idx > -1) {
            welfareList.splice(idx, 1);
            changed = true;
          }
        }

        for (const newTag of newTags) {
          if (!welfareList.includes(newTag)) {
            welfareList.push(newTag);
            changed = true;
          }
        }

        if (changed) {
          const newWelfareTags = welfareList.join(',');
          const oldValues = { welfareTags: config.welfareTags };
          const newValues = { welfareTags: newWelfareTags };

          await recruitmentConfigDao.updateById(config.id, {
            welfareTags: newWelfareTags,
            version: config.version + 1,
            updatedBy: currentUser.id,
            updatedByName: currentUser.username,
          });

          await this.writeConfigLog({
            configId: config.id,
            companyId: config.companyId,
            companyName: config.companyName,
            action: ConfigLogAction.BATCH_REPLACE,
            changedFields: 'welfareTags',
            oldValues: JSON.stringify(oldValues),
            newValues: JSON.stringify(newValues),
            versionBefore: config.version,
            versionAfter: config.version + 1,
            operatorId: currentUser.id,
            operatorName: currentUser.username,
            operatorRole: currentUser.role,
            operationRemark: `批量替换福利标签：移除${oldTags.join('、')}，新增${newTags.join('、')}`,
            isComplianceChecked: true,
            isDuplicateDetected: false,
          });
        }

        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          configId: config.id,
          companyName: config.companyName || '',
          message: err.message || '操作失败',
        });
      }
    }

    return result;
  }

  async getConfigLogs(params: any, currentUser: CurrentUser): Promise<IPaginationResult<RecruitmentConfigLogModel>> {
    const where: any = {};
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    return recruitmentConfigLogDao.findWithFilters({ ...params, ...where });
  }

  async getConfigLogsByConfigId(configId: number, currentUser: CurrentUser): Promise<IPaginationResult<RecruitmentConfigLogModel>> {
    const config = await this.getById(configId, currentUser);
    return recruitmentConfigLogDao.findByConfigId(configId);
  }

  private checkPermission(companyId: number, currentUser: CurrentUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.companyId || currentUser.companyId !== companyId) {
        throw new ForbiddenError('无权限访问该企业配置');
      }
    }
  }

  private getChangedFields(oldConfig: RecruitmentConfigModel, newData: any): string[] {
    const fields = ['displayTags', 'welfareTags', 'requirements', 'workTypes', 'jobCategories'];
    const changed: string[] = [];
    for (const field of fields) {
      const oldVal = (oldConfig as any)[field] || '';
      const newVal = newData[field] !== undefined ? newData[field] : oldVal;
      if (oldVal !== newVal) {
        changed.push(field);
      }
    }
    return changed;
  }

  private extractConfigData(config: RecruitmentConfigModel): any {
    return {
      displayTags: config.displayTags || '',
      welfareTags: config.welfareTags || '',
      requirements: config.requirements || '',
      workTypes: config.workTypes || '',
      jobCategories: config.jobCategories || '',
    };
  }

  private async writeConfigLog(data: any): Promise<void> {
    await recruitmentConfigLogDao.create(data);
  }
}

export default new RecruitmentConfigService();
