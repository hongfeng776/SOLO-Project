import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import resumeDao from '../dao/resume.dao';
import resumeParseLogDao from '../dao/resume-parse-log.dao';
import { NotFoundError, ParamError, ForbiddenError, ConflictError, AppError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import ResumeModel from '../models/resume.model';
import {
  ResumeStatus,
  ParseStatus,
  UserRole,
  JobStatus,
  ResumeCollectMode,
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_FILE_SIZE,
} from '../constants/recruitment.enum';
import resumeParserService from './resume-parser.service';
import resumeScreenService from './resume-screen.service';
import { Job, Resume, ResumeParseLog } from '../models';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
  realName?: string;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: { resumeId?: number; fileName?: string; name?: string; message: string }[];
}

interface FileValidateResult {
  valid: boolean;
  error?: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateResume?: any;
  reason?: string;
}

class ResumeService {
  async getList(params: any, currentUser?: CurrentUser): Promise<IPaginationResult<any>> {
    const { name, status, jobId, phone, parseStatus, source, matchScoreMin, matchScoreMax, collectMode, isLocked, collectorId, matchLevel, resumeTag, ...rest } = params;
    const where: any = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    if (status) {
      where.status = status;
    }
    if (jobId) {
      where.jobId = jobId;
    }
    if (phone) {
      where.phone = { [Op.like]: `%${phone}%` };
    }
    if (parseStatus) {
      where.parseStatus = parseStatus;
    }
    if (source) {
      where.source = source;
    }
    if (collectMode) {
      where.collectMode = collectMode;
    }
    if (isLocked !== undefined && isLocked !== '') {
      where.isLocked = isLocked === 'true' || isLocked === true;
    }
    if (collectorId) {
      where.collectorId = Number(collectorId);
    }
    if (matchLevel) {
      where.matchLevel = matchLevel;
    }
    if (resumeTag) {
      where.resumeTag = resumeTag;
    }
    if (matchScoreMin || matchScoreMax) {
      where.matchScore = {};
      if (matchScoreMin) where.matchScore[Op.gte] = Number(matchScoreMin);
      if (matchScoreMax) where.matchScore[Op.lte] = Number(matchScoreMax);
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role === UserRole.INTERVIEWER) {
        where.isLocked = false;
      } else {
        where.collectorId = currentUser.id;
      }
    }

    const result = await resumeDao.paginate(rest, {
      where,
      include: ['job'],
      order: [['id', 'DESC']],
    });

    const listWithParseLogs = await Promise.all(
      result.list.map(async (resume: any) => {
        const resumeJson = resume.toJSON ? resume.toJSON() : resume;
        const latestLog = await resumeParseLogDao.getLatestByResumeId(resumeJson.id);
        return {
          ...resumeJson,
          latestParseLog: latestLog ? latestLog.toJSON() : null,
        };
      })
    );

    return {
      ...result,
      list: listWithParseLogs,
    };
  }

  async getById(id: number, currentUser?: CurrentUser): Promise<any> {
    const resume = await resumeDao.findById(id, { include: ['job'] });
    if (!resume) {
      throw new NotFoundError('简历不存在');
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role === UserRole.HR && resume.collectorId !== currentUser.id) {
        throw new ForbiddenError('仅可查看本人收录的简历');
      }
      if (currentUser.role === UserRole.INTERVIEWER && resume.isLocked) {
        throw new ForbiddenError('该简历已被锁定，无法查看');
      }
    }

    const resumeJson = resume.toJSON();
    const parseLogs = await resumeParseLogDao.findByResumeId(id);
    return {
      ...resumeJson,
      parseLogs: parseLogs.map((log: any) => log.toJSON()),
    };
  }

  async create(data: any, currentUser?: CurrentUser): Promise<any> {
    if (!data.jobId) {
      throw new ParamError('请选择应聘岗位');
    }

    const job = await this.checkJobAvailable(data.jobId);
    if (!job) {
      throw new ParamError('岗位不存在或不可收录简历');
    }

    const duplicate = await this.checkDuplicate(data.name, data.phone);
    if (duplicate.isDuplicate) {
      throw new ConflictError(duplicate.reason || '简历已存在（同名或同手机号）');
    }

    const createData: any = {
      ...data,
      status: ResumeStatus.NEW,
      parseStatus: data.parseStatus || ParseStatus.PENDING,
      collectMode: ResumeCollectMode.MANUAL,
      collectTime: new Date(),
      matchLevel: data.matchScore ? resumeScreenService.calculateMatchLevel(data.matchScore) : undefined,
    };

    if (currentUser) {
      createData.collectorId = currentUser.id;
      createData.collectorName = currentUser.realName || currentUser.username;
    }

    const result = await resumeDao.create(createData);

    if (createData.parseStatus !== ParseStatus.PENDING) {
      await this.writeParseLog({
        resumeId: result.id,
        parseStatus: createData.parseStatus,
        parseTime: new Date(),
        parseDuration: 0,
        parsedFields: JSON.stringify(Object.keys(data).filter((k) => data[k])),
        failedFields: JSON.stringify([]),
        parseAttempts: 1,
        parserVersion: resumeParserService.getParserVersion(),
        operatorId: currentUser?.id,
        operatorName: currentUser?.realName || currentUser?.username,
      });
    }

    return result;
  }

  async update(id: number, data: any, currentUser?: CurrentUser): Promise<[number, ResumeModel[]]> {
    const resume: any = await this.getById(id, currentUser);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (resume.collectorId && resume.collectorId !== currentUser.id) {
        throw new ForbiddenError('仅可编辑本人收录的简历');
      }
    }

    if (resume.isLocked && !data.forceUpdate) {
      throw new ForbiddenError('简历已锁定，无法编辑。请先解锁后再操作');
    }

    const updateData: any = {};
    const editableFields = [
      'name', 'gender', 'age', 'phone', 'email', 'education', 'school', 'major',
      'experience', 'currentCompany', 'currentPosition', 'expectedSalary', 'city',
      'selfEvaluation', 'jobId', 'source', 'remark', 'matchScore', 'matchDetails',
    ];

    for (const field of editableFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.parseStatus === ParseStatus.SUCCESS && resume.parseStatus !== ParseStatus.SUCCESS) {
      updateData.parseStatus = ParseStatus.SUCCESS;
      updateData.isLocked = false;
      updateData.lockReason = '';
    }

    return resumeDao.updateById(id, updateData);
  }

  async remove(id: number, currentUser?: CurrentUser): Promise<number> {
    const resume: any = await this.getById(id, currentUser);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (resume.collectorId && resume.collectorId !== currentUser.id) {
        throw new ForbiddenError('仅可删除本人收录的简历');
      }
    }

    return resumeDao.destroyById(id);
  }

  async batchRemove(ids: number[], currentUser?: CurrentUser): Promise<number> {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      const resumes = await resumeDao.findAll({ where: { id: ids } });
      const selfIds = resumes
        .filter((r: any) => r.collectorId === currentUser.id)
        .map((r: any) => r.id);
      if (selfIds.length === 0) return 0;
      return resumeDao.destroy({ where: { id: selfIds } });
    }
    return resumeDao.destroy({ where: { id: ids } });
  }

  async updateStatus(id: number, status: ResumeStatus, currentUser?: CurrentUser): Promise<[number, ResumeModel[]]> {
    const resume: any = await this.getById(id, currentUser);

    if (resume.isLocked) {
      throw new ForbiddenError('简历已锁定，无法变更状态');
    }

    if (resume.parseStatus === ParseStatus.FAILED) {
      throw new ForbiddenError('解析失败的简历无法进入筛选流程');
    }

    return resumeDao.updateById(id, { status });
  }

  validateFile(fileName: string, fileSize: number): FileValidateResult {
    const ext = path.extname(fileName).toLowerCase();

    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `不支持的文件格式"${ext}"，支持格式：${ALLOWED_RESUME_EXTENSIONS.join('、')}`,
      };
    }

    if (fileSize > MAX_RESUME_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小超过限制，最大支持${MAX_RESUME_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    if (fileSize === 0) {
      return {
        valid: false,
        error: '文件为空',
      };
    }

    return { valid: true };
  }

  async checkDuplicate(name: string, phone: string, excludeId?: number): Promise<DuplicateCheckResult> {
    const where: any = {
      [Op.or]: [
        { [Op.and]: [{ name }, { phone }] },
        { phone },
      ],
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const duplicate = await resumeDao.findOne({ where });
    if (duplicate) {
      return {
        isDuplicate: true,
        duplicateResume: duplicate.toJSON(),
        reason: `已存在${duplicate.name === name && duplicate.phone === phone ? '同名同手机号' : duplicate.phone === phone ? '同手机号' : '同名'}的简历`,
      };
    }

    return { isDuplicate: false };
  }

  async checkJobAvailable(jobId: number): Promise<any> {
    const job = await Job.findByPk(jobId);
    if (!job) return null;

    const jobJson = job.toJSON();
    if (jobJson.status !== JobStatus.PUBLISHED) {
      return null;
    }
    if (!jobJson.resumeCollectEnabled) {
      return null;
    }
    return jobJson;
  }

  async uploadAndParse(fileInfo: any, jobId: number, content: string, currentUser?: CurrentUser): Promise<any> {
    const { fileName, fileSize, filePath } = fileInfo;

    const validate = this.validateFile(fileName, fileSize);
    if (!validate.valid) {
      throw new ParamError(validate.error || '文件校验失败');
    }

    if (!jobId) {
      throw new ParamError('请选择应聘岗位');
    }

    const job = await this.checkJobAvailable(jobId);
    if (!job) {
      throw new ForbiddenError('岗位未上架或未开启简历收录权限，无法收录简历');
    }

    const startTime = Date.now();
    const jobRequirements = {
      education: job.education,
      experience: job.experience,
      city: job.city,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requirements: job.requirements,
    };

    const parseResult = await resumeParserService.parseResume(content, fileName, jobRequirements);
    const parseDuration = Date.now() - startTime;

    if (!parseResult.parsedData.name || !parseResult.parsedData.phone) {
      parseResult.parsedData.name = parseResult.parsedData.name || `未知_${Date.now()}`;
      parseResult.parsedData.phone = parseResult.parsedData.phone || '00000000000';
    }

    const duplicate = await this.checkDuplicate(parseResult.parsedData.name, parseResult.parsedData.phone);
    let resumeId: number;
    let isDuplicate = false;
    let duplicateResumeId: number | undefined;

    if (duplicate.isDuplicate) {
      isDuplicate = true;
      duplicateResumeId = duplicate.duplicateResume?.id;
      resumeId = duplicateResumeId!;
    } else {
      const resumeData: any = {
        ...parseResult.parsedData,
        jobId,
        fileName,
        resumeFile: filePath,
        status: ResumeStatus.NEW,
        parseStatus: parseResult.parseStatus,
        matchScore: parseResult.matchScore,
        matchDetails: JSON.stringify(parseResult.matchDetails || {}),
        source: 'manual',
        collectMode: ResumeCollectMode.MANUAL,
        collectTime: new Date(),
        isLocked: parseResult.parseStatus === ParseStatus.FAILED,
        lockReason: parseResult.parseStatus === ParseStatus.FAILED ? (parseResult.errorMessage || '解析失败') : '',
        isDuplicate,
        duplicateResumeId,
        abnormalFields: JSON.stringify(parseResult.abnormalFields),
        isBlankResume: parseResult.isBlankResume,
        isFakeResume: parseResult.isFakeResume,
        fakeCheckReason: parseResult.fakeCheckReason,
        matchLevel: parseResult.matchScore ? resumeScreenService.calculateMatchLevel(parseResult.matchScore) : undefined,
      };

      if (currentUser) {
        resumeData.collectorId = currentUser.id;
        resumeData.collectorName = currentUser.realName || currentUser.username;
      }

      const created = await resumeDao.create(resumeData);
      resumeId = created.id;
    }

    await this.writeParseLog({
      resumeId,
      parseStatus: parseResult.parseStatus,
      parseTime: new Date(),
      parseDuration,
      parsedFields: JSON.stringify(parseResult.parsedFields),
      failedFields: JSON.stringify(parseResult.failedFields),
      errorMessage: parseResult.errorMessage,
      parseAttempts: 1,
      parserVersion: resumeParserService.getParserVersion(),
      rawContent: content.substring(0, 10000),
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    });

    const finalResume = await this.getById(resumeId, currentUser);

    return {
      ...finalResume,
      parseResult: {
        parseStatus: parseResult.parseStatus,
        parsedFields: parseResult.parsedFields,
        failedFields: parseResult.failedFields,
        abnormalFields: parseResult.abnormalFields,
        errorMessage: parseResult.errorMessage,
        isBlankResume: parseResult.isBlankResume,
        isFakeResume: parseResult.isFakeResume,
        fakeCheckReason: parseResult.fakeCheckReason,
        matchScore: parseResult.matchScore,
      },
      isDuplicate,
      duplicateResumeId,
    };
  }

  async retryParse(resumeId: number, content?: string, currentUser?: CurrentUser): Promise<any> {
    const resume: any = await this.getById(resumeId, currentUser);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (resume.collectorId && resume.collectorId !== currentUser.id) {
        throw new ForbiddenError('仅可重试本人收录的简历解析');
      }
    }

    const latestLog = await resumeParseLogDao.getLatestByResumeId(resumeId);
    const attempts = (latestLog?.parseAttempts || 0) + 1;

    if (attempts > 5) {
      throw new ForbiddenError('解析重试次数已达上限（最多5次），请人工补全信息');
    }

    const startTime = Date.now();
    let parseContent = content || '';

    if (!parseContent && resume.resumeFile) {
      try {
        const filePath = path.resolve(resume.resumeFile);
        if (fs.existsSync(filePath)) {
          parseContent = fs.readFileSync(filePath, 'utf-8');
        }
      } catch {
        parseContent = JSON.stringify(resume);
      }
    }

    if (!parseContent) {
      parseContent = JSON.stringify(resume);
    }

    const job = await Job.findByPk(resume.jobId);
    const jobJson = job?.toJSON();
    const jobRequirements = jobJson ? {
      education: jobJson.education,
      experience: jobJson.experience,
      city: jobJson.city,
      salaryMin: jobJson.salaryMin,
      salaryMax: jobJson.salaryMax,
      requirements: jobJson.requirements,
    } : undefined;

    const parseResult = await resumeParserService.parseResume(parseContent, resume.fileName || '', jobRequirements);
    const parseDuration = Date.now() - startTime;

    const updateData: any = {
      ...parseResult.parsedData,
      parseStatus: parseResult.parseStatus,
      matchScore: parseResult.matchScore,
      matchDetails: JSON.stringify(parseResult.matchDetails || {}),
      isLocked: parseResult.parseStatus === ParseStatus.FAILED,
      lockReason: parseResult.parseStatus === ParseStatus.FAILED ? (parseResult.errorMessage || '解析失败') : '',
      abnormalFields: JSON.stringify(parseResult.abnormalFields),
      isBlankResume: parseResult.isBlankResume,
      isFakeResume: parseResult.isFakeResume,
      fakeCheckReason: parseResult.fakeCheckReason,
      matchLevel: parseResult.matchScore ? resumeScreenService.calculateMatchLevel(parseResult.matchScore) : undefined,
    };

    if (resume.status === ResumeStatus.NEW && parseResult.parseStatus === ParseStatus.SUCCESS) {
      updateData.status = ResumeStatus.SCREENING;
    }

    await resumeDao.updateById(resumeId, updateData);

    await this.writeParseLog({
      resumeId,
      parseStatus: parseResult.parseStatus,
      parseTime: new Date(),
      parseDuration,
      parsedFields: JSON.stringify(parseResult.parsedFields),
      failedFields: JSON.stringify(parseResult.failedFields),
      errorMessage: parseResult.errorMessage,
      parseAttempts: attempts,
      parserVersion: resumeParserService.getParserVersion(),
      rawContent: parseContent.substring(0, 10000),
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    });

    const finalResume = await this.getById(resumeId, currentUser);

    return {
      ...finalResume,
      parseResult: {
        parseStatus: parseResult.parseStatus,
        parsedFields: parseResult.parsedFields,
        failedFields: parseResult.failedFields,
        abnormalFields: parseResult.abnormalFields,
        errorMessage: parseResult.errorMessage,
        isBlankResume: parseResult.isBlankResume,
        isFakeResume: parseResult.isFakeResume,
        fakeCheckReason: parseResult.fakeCheckReason,
        matchScore: parseResult.matchScore,
        attempts,
      },
    };
  }

  async batchUploadAndParse(fileList: any[], jobId: number, contents: string[], currentUser?: CurrentUser): Promise<BatchResult> {
    const result: BatchResult = {
      total: fileList.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    const processed = new Map<string, boolean>();

    for (let i = 0; i < fileList.length; i++) {
      const fileInfo = fileList[i];
      const content = contents[i] || '';
      const fileKey = `${fileInfo.fileName}_${fileInfo.fileSize}`;

      if (processed.has(fileKey)) {
        result.duplicates++;
        result.errors.push({
          fileName: fileInfo.fileName,
          message: '批次内重复文件，已跳过',
        });
        continue;
      }
      processed.set(fileKey, true);

      try {
        const uploadResult = await this.uploadAndParse(fileInfo, jobId, content, currentUser);
        if (uploadResult.isDuplicate) {
          result.duplicates++;
          result.errors.push({
            fileName: fileInfo.fileName,
            name: uploadResult.name,
            message: '与系统已有简历重复',
          });
        } else if (uploadResult.parseResult?.parseStatus === ParseStatus.FAILED) {
          result.failed++;
          result.errors.push({
            resumeId: uploadResult.id,
            fileName: fileInfo.fileName,
            name: uploadResult.name,
            message: uploadResult.parseResult?.errorMessage || '解析失败',
          });
        } else {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          fileName: fileInfo.fileName,
          message: error.message || '上传解析失败',
        });
      }
    }

    return result;
  }

  async batchRetryParse(ids: number[], currentUser?: CurrentUser): Promise<BatchResult> {
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      const resumes = await resumeDao.findAll({ where: { id: ids } });
      const notOwned = resumes.filter((r: any) => r.collectorId !== currentUser.id);
      if (notOwned.length > 0) {
        throw new ForbiddenError('仅管理员可批量重试非本人收录的简历解析');
      }
    }

    const result: BatchResult = {
      total: ids.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        const resume = await resumeDao.findById(id);
        if (!resume) {
          result.failed++;
          result.errors.push({ resumeId: id, message: '简历不存在' });
          continue;
        }
        await this.retryParse(id, undefined, currentUser);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          resumeId: id,
          message: error.message || '重试解析失败',
        });
      }
    }

    return result;
  }

  async getParseLogs(resumeId: number, currentUser?: CurrentUser): Promise<any[]> {
    await this.getById(resumeId, currentUser);
    const logs = await resumeParseLogDao.findByResumeId(resumeId);
    return logs.map((log: any) => log.toJSON());
  }

  async getFailedResumeList(params: any, currentUser?: CurrentUser): Promise<any> {
    const enhancedParams = {
      ...params,
      parseStatus: ParseStatus.FAILED,
    };
    return this.getList(enhancedParams, currentUser);
  }

  async exportExceptionList(currentUser?: CurrentUser): Promise<any[]> {
    const where: any = {
      [Op.or]: [
        { parseStatus: ParseStatus.FAILED },
        { isLocked: true },
        { isFakeResume: true },
        { isBlankResume: true },
      ],
    };

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      where.collectorId = currentUser.id;
    }

    const resumes = await resumeDao.findAll({
      where,
      include: ['job'],
      order: [['id', 'DESC']],
    });

    return resumes.map((r: any) => {
      const json = r.toJSON();
      const exceptionReasons: string[] = [];
      if (json.parseStatus === ParseStatus.FAILED) exceptionReasons.push('解析失败');
      if (json.isLocked) exceptionReasons.push(`已锁定:${json.lockReason || ''}`);
      if (json.isFakeResume) exceptionReasons.push(`虚假简历:${json.fakeCheckReason || ''}`);
      if (json.isBlankResume) exceptionReasons.push('空白简历');
      if (json.isDuplicate) exceptionReasons.push('重复简历');

      return {
        id: json.id,
        name: json.name,
        phone: json.phone,
        jobTitle: json.job?.title || '-',
        parseStatus: json.parseStatus,
        collectorName: json.collectorName || '-',
        collectTime: json.collectTime,
        exceptionReasons,
        abnormalFields: json.abnormalFields ? JSON.parse(json.abnormalFields) : [],
        matchScore: json.matchScore,
      };
    });
  }

  async completeResumeInfo(id: number, data: any, currentUser?: CurrentUser): Promise<any> {
    const resume: any = await this.getById(id, currentUser);

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      if (resume.collectorId && resume.collectorId !== currentUser.id) {
        throw new ForbiddenError('仅可补全本人收录的简历信息');
      }
    }

    if (resume.parseStatus === ParseStatus.SUCCESS) {
      throw new AppError(40001, '解析成功的简历无需人工补全', 400);
    }

    const missingFields = (resume.abnormalFields ? JSON.parse(resume.abnormalFields) : []).filter(
      (f: string) => !data[f]
    );
    const failedFields = this.extractFailedFields(resume);
    const remainingFailed = failedFields.filter((f: string) => !data[f]);

    const updateData: any = {};
    for (const key of Object.keys(data)) {
      if (data[key] !== undefined && data[key] !== '') {
        updateData[key] = data[key];
      }
    }

    if (remainingFailed.length === 0 && missingFields.length === 0) {
      updateData.parseStatus = ParseStatus.SUCCESS;
      updateData.isLocked = false;
      updateData.lockReason = '';
      if (resume.status === ResumeStatus.NEW) {
        updateData.status = ResumeStatus.SCREENING;
      }
    } else if (resume.parseStatus === ParseStatus.FAILED) {
      updateData.parseStatus = ParseStatus.PARTIAL;
      updateData.isLocked = false;
      updateData.lockReason = '';
    }

    const updatedAbnormalFields = missingFields.filter((f: string) => !updateData[f]);
    if (updatedAbnormalFields.length > 0) {
      updateData.abnormalFields = JSON.stringify(updatedAbnormalFields);
    } else {
      updateData.abnormalFields = JSON.stringify([]);
    }

    await resumeDao.updateById(id, updateData);

    await this.writeParseLog({
      resumeId: id,
      parseStatus: updateData.parseStatus || resume.parseStatus,
      parseTime: new Date(),
      parseDuration: 0,
      parsedFields: JSON.stringify(Object.keys(updateData)),
      failedFields: JSON.stringify(remainingFailed),
      errorMessage: remainingFailed.length > 0 ? `仍有${remainingFailed.length}个字段未补全` : '',
      parseAttempts: 0,
      parserVersion: 'manual_completion',
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    });

    return this.getById(id, currentUser);
  }

  async unlockResume(id: number, reason: string, currentUser?: CurrentUser): Promise<any> {
    if (currentUser?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅管理员可解锁简历');
    }

    const resume = await this.getById(id);
    if (!resume.isLocked) {
      throw new AppError(40002, '简历未被锁定', 400);
    }

    await resumeDao.updateById(id, {
      isLocked: false,
      lockReason: '',
    });

    await this.writeParseLog({
      resumeId: id,
      parseStatus: resume.parseStatus,
      parseTime: new Date(),
      parseDuration: 0,
      parsedFields: JSON.stringify([]),
      failedFields: JSON.stringify([]),
      errorMessage: `管理员解锁：${reason || '未填写原因'}`,
      parseAttempts: 0,
      parserVersion: 'admin_unlock',
      operatorId: currentUser?.id,
      operatorName: currentUser?.realName || currentUser?.username,
    });

    return this.getById(id);
  }

  private extractFailedFields(resume: any): string[] {
    try {
      const log = resume.parseLogs?.[0];
      if (log?.failedFields) {
        return JSON.parse(log.failedFields);
      }
    } catch {}
    return [];
  }

  private async writeParseLog(data: any): Promise<void> {
    await resumeParseLogDao.createLog(data);
  }

  async batchTriggerParse(ids: number[], currentUser?: CurrentUser): Promise<BatchResult> {
    return this.batchRetryParse(ids, currentUser);
  }
}

export default new ResumeService();
