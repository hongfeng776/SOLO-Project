import { Op } from 'sequelize';
import resumeDao from '../dao/resume.dao';
import resumeScreenLogDao from '../dao/resume-screen-log.dao';
import screenTemplateDao from '../dao/screen-template.dao';
import { NotFoundError, ParamError, ForbiddenError, ConflictError, AppError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import {
  ParseStatus,
  MatchLevel,
  ResumeTag,
  ScreenAction,
  MatchLevelLabel,
  MATCH_SCORE_THRESHOLDS,
  MUTEX_SCREEN_CONDITIONS,
  SCREEN_CONDITION_FIELDS,
  Education,
  UserRole,
} from '../constants/recruitment.enum';
import resumeParserService from './resume-parser.service';
import { Job, Resume } from '../models';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
  realName?: string;
}

interface ScreenConditions {
  education?: string;
  minEducation?: string;
  minExperience?: number;
  maxExperience?: number;
  experienceRange?: string;
  minSalary?: number;
  maxSalary?: number;
  skillTags?: string[];
  city?: string;
  isFreshGraduate?: boolean;
  matchLevel?: MatchLevel;
  resumeTag?: ResumeTag;
}

interface ScreenResult {
  total: number;
  filtered: any[];
  conditions: ScreenConditions;
  conflictDetected: boolean;
  conflictReason?: string;
}

interface BatchTagResult {
  total: number;
  success: number;
  failed: number;
  errors: { resumeId?: number; message: string }[];
}

interface MatchOptimizationData {
  jobId: number;
  totalResumes: number;
  matchDistribution: Record<MatchLevel, number>;
  averageScore: number;
  suggestions: string[];
  weightAnalysis: any;
}

class ResumeScreenService {
  calculateMatchLevel(matchScore: number | undefined | null): MatchLevel {
    if (matchScore === undefined || matchScore === null) return MatchLevel.NONE;
    if (matchScore >= MATCH_SCORE_THRESHOLDS.HIGH) return MatchLevel.HIGH;
    if (matchScore >= MATCH_SCORE_THRESHOLDS.MEDIUM) return MatchLevel.MEDIUM;
    if (matchScore >= MATCH_SCORE_THRESHOLDS.LOW) return MatchLevel.LOW;
    return MatchLevel.NONE;
  }

  validateScreenConditions(conditions: ScreenConditions): { valid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];

    for (const [fieldA, fieldB] of MUTEX_SCREEN_CONDITIONS) {
      if ((conditions as any)[fieldA] && (conditions as any)[fieldB]) {
        const labelA = this.getConditionLabel(fieldA);
        const labelB = this.getConditionLabel(fieldB);
        conflicts.push(`条件冲突："${labelA}"与"${labelB}"互斥，不能同时选择`);
      }
    }

    if (conditions.isFreshGraduate && conditions.minExperience && conditions.minExperience > 0) {
      conflicts.push('条件冲突：选择"应届生"后不应设置工作经验要求');
    }

    if (conditions.minExperience !== undefined && conditions.maxExperience !== undefined) {
      if (conditions.minExperience > conditions.maxExperience) {
        conflicts.push('条件冲突：最小工作年限不能大于最大工作年限');
      }
    }

    if (conditions.minSalary !== undefined && conditions.maxSalary !== undefined) {
      if (conditions.minSalary > conditions.maxSalary) {
        conflicts.push('条件冲突：最低薪资不能大于最高薪资');
      }
    }

    return { valid: conflicts.length === 0, conflicts };
  }

  async checkPreconditions(jobId: number): Promise<{ canScreen: boolean; reason?: string }> {
    const job = await Job.findByPk(jobId);
    if (!job) {
      return { canScreen: false, reason: '岗位不存在' };
    }

    const jobJson = job.toJSON();
    const requiredFields = ['title', 'education', 'experience', 'city'];
    const missingFields = requiredFields.filter((f) => !jobJson[f]);
    if (missingFields.length > 0) {
      return { canScreen: false, reason: `岗位信息不完整，缺少：${missingFields.join('、')}` };
    }

    const resumeCount = await resumeDao.count({
      where: { jobId, parseStatus: ParseStatus.SUCCESS },
    } as any);

    if (resumeCount === 0) {
      return { canScreen: false, reason: '该岗位尚无解析完成的简历，无法进行筛选' };
    }

    return { canScreen: true };
  }

  async screenResumes(jobId: number, conditions: ScreenConditions, currentUser?: CurrentUser): Promise<ScreenResult> {
    const precondition = await this.checkPreconditions(jobId);
    if (!precondition.canScreen) {
      throw new ParamError(precondition.reason || '不满足筛选前置条件');
    }

    const validation = this.validateScreenConditions(conditions);
    if (!validation.valid) {
      throw new ConflictError(`筛选条件冲突：${validation.conflicts.join('；')}`);
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role === UserRole.HR) {
        const job = await Job.findByPk(jobId);
        if (job && (job as any).creatorId && (job as any).creatorId !== currentUser.id) {
          throw new ForbiddenError('子账号仅可筛选本岗位简历');
        }
      }
    }

    const where: any = {
      jobId,
      parseStatus: ParseStatus.SUCCESS,
      isLocked: false,
    };

    if (conditions.education) {
      where.education = conditions.education;
    } else if (conditions.minEducation) {
      const eduRank = [Education.HIGH_SCHOOL, Education.COLLEGE, Education.BACHELOR, Education.MASTER, Education.DOCTOR];
      const minIdx = eduRank.indexOf(conditions.minEducation as Education);
      if (minIdx >= 0) {
        where.education = { [Op.in]: eduRank.slice(minIdx) };
      }
    }

    if (conditions.isFreshGraduate) {
      where.experience = { [Op.lte]: 1 };
    } else {
      if (conditions.minExperience !== undefined) {
        where.experience = where.experience || {};
        where.experience[Op.gte] = conditions.minExperience;
      }
      if (conditions.maxExperience !== undefined) {
        where.experience = where.experience || {};
        where.experience[Op.lte] = conditions.maxExperience;
      }
    }

    if (conditions.city) {
      where.city = { [Op.like]: `%${conditions.city}%` };
    }

    if (conditions.matchLevel) {
      where.matchLevel = conditions.matchLevel;
    }

    if (conditions.resumeTag) {
      where.resumeTag = conditions.resumeTag;
    }

    if (conditions.minSalary !== undefined || conditions.maxSalary !== undefined) {
      const salaryWhere: any = {};
      if (conditions.minSalary !== undefined) {
        salaryWhere[Op.gte] = conditions.minSalary;
      }
      if (conditions.maxSalary !== undefined) {
        salaryWhere[Op.lte] = conditions.maxSalary;
      }
    }

    if (conditions.skillTags && conditions.skillTags.length > 0) {
      const skillConditions = conditions.skillTags.map((tag) => ({
        skillTags: { [Op.like]: `%"${tag}"%` },
      }));
      where[Op.and] = skillConditions;
    }

    const resumes = await resumeDao.findAll({
      where,
      include: ['job'],
      order: [['matchScore', 'DESC'], ['id', 'ASC']],
    });

    let filtered = resumes.map((r: any) => r.toJSON());

    if (conditions.minSalary !== undefined || conditions.maxSalary !== undefined) {
      filtered = filtered.filter((r: any) => {
        if (!r.expectedSalary) return false;
        const salaryRange = this.parseSalaryFromExpected(r.expectedSalary);
        if (!salaryRange) return false;
        if (conditions.minSalary !== undefined && salaryRange.max < conditions.minSalary) return false;
        if (conditions.maxSalary !== undefined && salaryRange.min > conditions.maxSalary) return false;
        return true;
      });
    }

    return {
      total: filtered.length,
      filtered,
      conditions,
      conflictDetected: false,
    };
  }

  async updateMatchLevel(resumeId: number, currentUser?: CurrentUser): Promise<any> {
    const resume: any = await resumeDao.findById(resumeId, { include: ['job'] });
    if (!resume) {
      throw new NotFoundError('简历不存在');
    }

    const resumeJson = resume.toJSON();

    if (resumeJson.parseStatus !== ParseStatus.SUCCESS) {
      throw new ParamError('仅解析完成的简历可更新匹配等级');
    }

    const matchLevelBefore = resumeJson.matchLevel;
    const matchScoreBefore = resumeJson.matchScore;

    const matchLevelAfter = this.calculateMatchLevel(resumeJson.matchScore);

    if (matchLevelBefore !== matchLevelAfter) {
      await resumeDao.updateById(resumeId, {
        matchLevel: matchLevelAfter,
        screenTime: new Date(),
        screenOperatorId: currentUser?.id,
        screenOperatorName: currentUser?.realName || currentUser?.username,
      });
    }

    await resumeScreenLogDao.createLog({
      resumeId,
      jobId: resumeJson.jobId,
      action: ScreenAction.MATCH,
      matchLevelBefore,
      matchLevelAfter,
      matchScoreBefore,
      matchScoreAfter: resumeJson.matchScore,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    } as any);

    return {
      resumeId,
      matchLevelBefore,
      matchLevelAfter,
      matchScore: resumeJson.matchScore,
    };
  }

  async refreshJobMatchLevels(jobId: number, currentUser?: CurrentUser): Promise<BatchTagResult> {
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new NotFoundError('岗位不存在');
    }

    const jobJson = job.toJSON();
    const jobRequirements = {
      education: jobJson.education,
      experience: jobJson.experience,
      city: jobJson.city,
      salaryMin: jobJson.salaryMin,
      salaryMax: jobJson.salaryMax,
      requirements: jobJson.requirements,
    };

    const resumes = await resumeDao.findAll({
      where: { jobId, parseStatus: ParseStatus.SUCCESS },
    });

    const result: BatchTagResult = {
      total: resumes.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const resume of resumes) {
      try {
        const resumeJson = (resume as any).toJSON();
        const matchLevelBefore = resumeJson.matchLevel;
        const matchScoreBefore = resumeJson.matchScore;

        let matchScoreAfter = matchScoreBefore;
        let matchDetailsAfter = resumeJson.matchDetails;

        const matchResult = resumeParserService.calculateMatchScore(resumeJson, jobRequirements);
        matchScoreAfter = matchResult.score;
        matchDetailsAfter = JSON.stringify(matchResult.details);

        const matchLevelAfter = this.calculateMatchLevel(matchScoreAfter);

        await resumeDao.updateById(resumeJson.id, {
          matchScore: matchScoreAfter,
          matchDetails: matchDetailsAfter,
          matchLevel: matchLevelAfter,
          screenTime: new Date(),
          screenOperatorId: currentUser?.id,
          screenOperatorName: currentUser?.realName || currentUser?.username,
        });

        await resumeScreenLogDao.createLog({
          resumeId: resumeJson.id,
          jobId,
          action: ScreenAction.REFRESH_MATCH,
          matchLevelBefore,
          matchLevelAfter,
          matchScoreBefore,
          matchScoreAfter,
          operatorId: currentUser?.id,
          operatorName: currentUser?.realName || currentUser?.username,
          remark: '岗位要求变更后同步刷新匹配等级',
        } as any);

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          resumeId: (resume as any).id,
          message: error.message || '更新匹配等级失败',
        });
      }
    }

    return result;
  }

  async batchTagResumes(ids: number[], tag: ResumeTag, currentUser?: CurrentUser): Promise<BatchTagResult> {
    if (!Object.values(ResumeTag).includes(tag)) {
      throw new ParamError('无效的简历标记类型');
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      const resumes = await resumeDao.findAll({ where: { id: ids } });
      const notOwned = resumes.filter((r: any) => r.collectorId !== currentUser.id);
      if (notOwned.length > 0 && currentUser.role === UserRole.HR) {
        throw new ForbiddenError('仅管理员可批量标记非本人收录的简历');
      }
    }

    const result: BatchTagResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const resume: any = await resumeDao.findById(id);
        if (!resume) {
          result.failed++;
          result.errors.push({ resumeId: id, message: '简历不存在' });
          continue;
        }

        const resumeJson = resume.toJSON();
        const tagBefore = resumeJson.resumeTag;

        await resumeDao.updateById(id, {
          resumeTag: tag,
          screenTime: new Date(),
          screenOperatorId: currentUser?.id,
          screenOperatorName: currentUser?.realName || currentUser?.username,
        });

        await resumeScreenLogDao.createLog({
          resumeId: id,
          jobId: resumeJson.jobId,
          action: ScreenAction.BATCH_TAG,
          tagBefore,
          tagAfter: tag,
          operatorId: currentUser?.id,
          operatorName: currentUser?.realName || currentUser?.username,
        } as any);

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          resumeId: id,
          message: error.message || '标记失败',
        });
      }
    }

    return result;
  }

  async tagResume(id: number, tag: ResumeTag, currentUser?: CurrentUser): Promise<any> {
    if (!Object.values(ResumeTag).includes(tag)) {
      throw new ParamError('无效的简历标记类型');
    }

    const resume: any = await resumeDao.findById(id);
    if (!resume) {
      throw new NotFoundError('简历不存在');
    }

    const resumeJson = resume.toJSON();
    const tagBefore = resumeJson.resumeTag;

    await resumeDao.updateById(id, {
      resumeTag: tag,
      screenTime: new Date(),
      screenOperatorId: currentUser?.id,
      screenOperatorName: currentUser?.realName || currentUser?.username,
    });

    await resumeScreenLogDao.createLog({
      resumeId: id,
      jobId: resumeJson.jobId,
      action: ScreenAction.TAG,
      tagBefore,
      tagAfter: tag,
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    } as any);

    return resumeDao.findById(id, { include: ['job'] });
  }

  async batchScreenResumes(jobId: number, conditions: ScreenConditions, currentUser?: CurrentUser): Promise<ScreenResult> {
    const screenResult = await this.screenResumes(jobId, conditions, currentUser);

    for (const resume of screenResult.filtered) {
      const isDuplicate = await resumeScreenLogDao.findDuplicateScreen(
        resume.id,
        ScreenAction.BATCH_SCREEN,
        JSON.stringify(conditions)
      );

      await resumeScreenLogDao.createLog({
        resumeId: resume.id,
        jobId,
        action: ScreenAction.BATCH_SCREEN,
        screenConditions: JSON.stringify(conditions),
        isDuplicateScreen: !!isDuplicate,
        matchLevelBefore: resume.matchLevel,
        matchLevelAfter: resume.matchLevel,
        matchScoreBefore: resume.matchScore,
        matchScoreAfter: resume.matchScore,
        tagBefore: resume.resumeTag,
        tagAfter: resume.resumeTag,
        operatorId: currentUser?.id,
        operatorName: currentUser?.realName || currentUser?.username,
      } as any);
    }

    return screenResult;
  }

  async saveScreenTemplate(data: any, currentUser?: CurrentUser): Promise<any> {
    if (!data.name) {
      throw new ParamError('模板名称不能为空');
    }
    if (!data.conditions) {
      throw new ParamError('筛选条件不能为空');
    }

    const validation = this.validateScreenConditions(data.conditions);
    if (!validation.valid) {
      throw new ConflictError(`筛选条件冲突：${validation.conflicts.join('；')}`);
    }

    const templateData: any = {
      name: data.name,
      description: data.description || '',
      conditions: JSON.stringify(data.conditions),
      jobId: data.jobId || null,
      isGlobal: data.isGlobal || false,
      creatorId: currentUser?.id,
      creatorName: currentUser?.realName || currentUser?.username,
    };

    return screenTemplateDao.create(templateData);
  }

  async getScreenTemplates(jobId?: number, currentUser?: CurrentUser): Promise<any[]> {
    const templates: any[] = [];

    const globalTemplates = await screenTemplateDao.findGlobalTemplates();
    templates.push(...globalTemplates.map((t: any) => t.toJSON()));

    if (jobId) {
      const jobTemplates = await screenTemplateDao.findByJobId(jobId);
      for (const t of jobTemplates) {
        const json = t.toJSON();
        if (!templates.find((gt) => gt.id === json.id)) {
          templates.push(json);
        }
      }
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      const userTemplates = await screenTemplateDao.findByCreatorId(currentUser.id);
      for (const t of userTemplates) {
        const json = t.toJSON();
        if (!templates.find((gt) => gt.id === json.id)) {
          templates.push(json);
        }
      }
    }

    return templates;
  }

  async deleteScreenTemplate(id: number, currentUser?: CurrentUser): Promise<number> {
    const template = await screenTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if ((template as any).creatorId !== currentUser.id) {
        throw new ForbiddenError('仅可删除本人创建的模板');
      }
    }

    return screenTemplateDao.destroyById(id);
  }

  async useScreenTemplate(id: number, jobId: number, currentUser?: CurrentUser): Promise<ScreenResult> {
    const template = await screenTemplateDao.findById(id);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    await screenTemplateDao.incrementUseCount(id);

    const conditions = JSON.parse((template as any).conditions);
    return this.screenResumes(jobId, conditions, currentUser);
  }

  async getScreenLogs(resumeId: number, currentUser?: CurrentUser): Promise<any[]> {
    const logs = await resumeScreenLogDao.findByResumeId(resumeId);
    return logs.map((log: any) => log.toJSON());
  }

  async getMatchOptimizationData(jobId: number, currentUser?: CurrentUser): Promise<MatchOptimizationData> {
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new NotFoundError('岗位不存在');
    }

    const resumes = await resumeDao.findAll({
      where: { jobId, parseStatus: ParseStatus.SUCCESS },
    });

    const matchDistribution: Record<MatchLevel, number> = {
      [MatchLevel.HIGH]: 0,
      [MatchLevel.MEDIUM]: 0,
      [MatchLevel.LOW]: 0,
      [MatchLevel.NONE]: 0,
    };

    let totalScore = 0;
    const weightAnalysis: any = {};

    for (const resume of resumes) {
      const resumeJson = (resume as any).toJSON();
      const level = this.calculateMatchLevel(resumeJson.matchScore);
      matchDistribution[level]++;
      totalScore += (resumeJson.matchScore || 0);

      if (resumeJson.matchDetails) {
        try {
          const details = JSON.parse(resumeJson.matchDetails);
          for (const [key, value] of Object.entries(details)) {
            if (!weightAnalysis[key]) {
              weightAnalysis[key] = { matched: 0, partial: 0, unmatched: 0, total: 0 };
            }
            weightAnalysis[key].total++;
            if ((value as any).matched) weightAnalysis[key].matched++;
            else if ((value as any).partial) weightAnalysis[key].partial++;
            else weightAnalysis[key].unmatched++;
          }
        } catch {}
      }
    }

    const suggestions: string[] = [];

    if (matchDistribution[MatchLevel.HIGH] === 0 && matchDistribution[MatchLevel.MEDIUM] === 0) {
      suggestions.push('当前岗位无高/中匹配简历，建议适当降低筛选门槛或调整岗位要求');
    }

    if (matchDistribution[MatchLevel.NONE] > resumes.length * 0.5) {
      suggestions.push('超过50%简历不匹配，建议重新审视岗位要求或优化简历来源');
    }

    for (const [field, analysis] of Object.entries(weightAnalysis)) {
      const a = analysis as any;
      if (a.total > 0 && a.unmatched / a.total > 0.7) {
        suggestions.push(`"${this.getConditionLabel(field)}"维度匹配率低于30%，建议降低该维度权重或调整要求`);
      }
    }

    return {
      jobId,
      totalResumes: resumes.length,
      matchDistribution,
      averageScore: resumes.length > 0 ? Math.round(totalScore / resumes.length) : 0,
      suggestions,
      weightAnalysis,
    };
  }

  private getConditionLabel(field: string): string {
    const labels: Record<string, string> = {
      education: '学历',
      minEducation: '最低学历',
      minExperience: '最小工作经验',
      maxExperience: '最大工作经验',
      experienceRange: '经验范围',
      minSalary: '最低薪资',
      maxSalary: '最高薪资',
      skillTags: '技能标签',
      city: '工作地点',
      isFreshGraduate: '应届生',
      matchLevel: '匹配等级',
      resumeTag: '简历标记',
    };
    return labels[field] || field;
  }

  private parseSalaryFromExpected(expectedSalary: string): { min: number; max: number } | null {
    if (!expectedSalary) return null;

    const match = expectedSalary.match(/(\d+(?:\.\d+)?)\s*[kKwW万]?\s*[-~到至]\s*(\d+(?:\.\d+)?)\s*[kKwW万]?/);
    if (match) {
      let min = parseFloat(match[1]);
      let max = parseFloat(match[2]);
      if (/万/i.test(expectedSalary)) {
        min *= 10;
        max *= 10;
      }
      return { min, max };
    }

    const singleMatch = expectedSalary.match(/(\d+(?:\.\d+)?)\s*[kKwW万]?/);
    if (singleMatch) {
      let val = parseFloat(singleMatch[1]);
      if (/万/i.test(expectedSalary)) val *= 10;
      return { min: val * 0.8, max: val * 1.2 };
    }

    return null;
  }
}

export default new ResumeScreenService();
