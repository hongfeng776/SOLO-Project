import { Transaction, Op } from 'sequelize';
import interviewDao, {
  interviewOperationLogDao,
  interviewCancelRecordDao,
  interviewMessageDao,
  interviewerAllocationLogDao,
  interviewWarningLogDao,
} from '../dao/interview.dao';
import resumeDao from '../dao/resume.dao';
import jobDao from '../dao/job.dao';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/app-error';
import { IPaginationResult } from '../dao/base.dao';
import InterviewModel from '../models/interview.model';
import { Resume, Job, User, Interview } from '../models';
import {
  InterviewSessionStatus,
  InterviewSessionStatusLabel,
  InterviewAction,
  INTERVIEW_STATUS_FLOW,
  LOCKED_INTERVIEW_STATUSES,
  ResumeStatus,
  JobStatus,
  InterviewCancelReasonType,
  InterviewBatchSortType,
  UserRole,
  InterviewResult,
  InterviewResultLabel,
  INTERVIEW_SCORE_RANGE,
  SCORE_RESULT_MATCH_RULES,
  INTERVIEW_RECORD_VALIDATION_RULES,
  InterviewAbnormalScoreType,
  InterviewAbnormalScoreTypeLabel,
  InterviewScoreDimension,
  InterviewerStatus,
  InterviewerStatusLabel,
  InterviewerDomain,
  InterviewerDomainLabel,
  JOB_CATEGORY_DOMAIN_MAP,
  DOMAIN_CROSS_MATCH,
  BUSY_STATUS_CANNOT_ALLOCATE,
  AllocationAction,
  AllocationActionLabel,
  AllocationValidationType,
  INTERVIEWER_ALLOCATION_RULES,
  JobCategory,
  WarningStatus,
  WarningStatusLabel,
  WarningLevel,
  WarningLevelLabel,
  WARNING_LEVEL_ORDER,
  OverdueReasonType,
  OverdueReasonTypeLabel,
  WarningAction,
  WarningActionLabel,
  INTERVIEW_WARNING_RULES,
  WARNING_SORT_STRATEGIES,
} from '../constants/recruitment.enum';
import {
  InterviewMessageType,
  InterviewMessageTypeLabel,
  InterviewMessageChannel,
} from '../models/interview-message.model';
import dayjs from 'dayjs';
import sequelize from '../config/database';

interface AppointContext {
  operatorId?: number;
  operatorName?: string;
  ip?: string;
  userAgent?: string;
}

interface AppointValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  conflictInterviews?: any[];
  resume?: any;
  job?: any;
}

class InterviewService {
  private async validateAppointParams(
    data: any,
    excludeId?: number
  ): Promise<AppointValidationResult> {
    const { resumeId, jobId, interviewer, interviewTime, endTime } = data;

    if (!resumeId || !jobId || !interviewer || !interviewTime || !endTime) {
      return { valid: false, error: '缺少必填字段：简历ID、岗位ID、面试官、面试时间、结束时间', errorCode: 'MISSING_FIELDS' };
    }

    const startTime = new Date(interviewTime);
    const finishTime = new Date(endTime);

    if (startTime >= finishTime) {
      return { valid: false, error: '面试结束时间必须晚于开始时间', errorCode: 'INVALID_TIME_RANGE' };
    }

    if (startTime <= new Date()) {
      return { valid: false, error: '面试时间必须晚于当前时间', errorCode: 'PAST_TIME' };
    }

    const resume = await resumeDao.findById(resumeId);
    if (!resume) {
      return { valid: false, error: '简历不存在', errorCode: 'RESUME_NOT_FOUND' };
    }

    const allowedResumeStatus = [ResumeStatus.SCREENING, ResumeStatus.INTERVIEW];
    if (!allowedResumeStatus.includes((resume as any).status)) {
      return { valid: false, error: `简历状态不允许预约，当前状态：${(resume as any).status}，请先将简历置于初筛中或面试中状态`, errorCode: 'RESUME_STATUS_INVALID' };
    }

    const job = await jobDao.findById(jobId);
    if (!job) {
      return { valid: false, error: '岗位不存在', errorCode: 'JOB_NOT_FOUND' };
    }

    if ((job as any).status !== JobStatus.PUBLISHED) {
      return { valid: false, error: `岗位状态不允许预约，当前状态：${(job as any).status}，请确保岗位已正常上架`, errorCode: 'JOB_STATUS_INVALID' };
    }

    const duplicates = await interviewDao.checkCandidateDuplicateAppointment(resumeId, jobId, excludeId);
    if (duplicates.length > 0) {
      return { valid: false, error: '该候选人在同一岗位已存在有效面试预约，不可重复预约', errorCode: 'DUPLICATE_APPOINTMENT' };
    }

    const conflicts = await interviewDao.checkInterviewerTimeConflict(interviewer, startTime, finishTime, excludeId);
    if (conflicts.length > 0) {
      const conflictInfos = conflicts.map((c) => ({
        id: c.id,
        interviewTime: c.interviewTime,
        endTime: c.endTime,
        resumeId: c.resumeId,
      }));
      return { valid: false, error: '面试官时间冲突，请重新选择时间段', errorCode: 'INTERVIEWER_TIME_CONFLICT', conflictInterviews: conflictInfos };
    }

    return { valid: true, resume, job };
  }

  private recordOperationLog(
    transaction: Transaction,
    interviewId: number,
    action: InterviewAction,
    ctx: AppointContext,
    beforeStatus?: InterviewSessionStatus,
    afterStatus?: InterviewSessionStatus,
    beforeData?: any,
    afterData?: any,
    remark?: string
  ) {
    return interviewOperationLogDao.create(
      {
        interviewId,
        action,
        operatorId: ctx.operatorId,
        operatorName: ctx.operatorName,
        beforeStatus,
        afterStatus,
        beforeData: beforeData ? JSON.stringify(beforeData) : undefined,
        afterData: afterData ? JSON.stringify(afterData) : undefined,
        remark,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
      { transaction }
    );
  }

  private async pushMessages(
    transaction: Transaction,
    interview: any,
    resume: any,
    job: any,
    messageTypes: InterviewMessageType[],
    extraData?: any
  ) {
    const messages: any[] = [];
    const timeStr = dayjs(interview.interviewTime).format('YYYY-MM-DD HH:mm');

    for (const msgType of messageTypes) {
      let title = '';
      let content = '';
      let receiverName = '';
      let receiverContact = '';
      let receiverId: number | undefined;

      switch (msgType) {
        case InterviewMessageType.APPOINT_SUCCESS_CANDIDATE:
          receiverName = resume.name;
          receiverContact = resume.phone;
          title = '面试预约成功通知';
          content = `您好${resume.name}，您应聘【${job.title}】岗位的面试已预约成功。\n面试时间：${timeStr}\n面试官：${interview.interviewer}\n面试地点：${interview.location || '待通知'}\n面试方式：${this.getTypeLabel(interview.type)}\n请准时参加，如有问题请及时联系HR。`;
          break;
        case InterviewMessageType.APPOINT_SUCCESS_INTERVIEWER:
          receiverName = interview.interviewer;
          receiverId = interview.interviewerId;
          title = '新面试预约通知';
          content = `您好${interview.interviewer}，您有一场新的面试安排。\n候选人：${resume.name}\n应聘岗位：${job.title}\n面试时间：${timeStr}\n面试阶段：${this.getStageLabel(interview.stage)}\n请提前做好面试准备。`;
          break;
        case InterviewMessageType.CANCEL_CANDIDATE:
          receiverName = resume.name;
          receiverContact = resume.phone;
          title = '面试取消通知';
          content = `您好${resume.name}，您应聘【${job.title}】岗位的面试已取消。\n原面试时间：${timeStr}\n取消原因：${extraData?.reason || '公司安排调整'}\n如有疑问请联系HR，给您带来的不便请谅解。`;
          break;
        case InterviewMessageType.CANCEL_INTERVIEWER:
          receiverName = interview.interviewer;
          receiverId = interview.interviewerId;
          title = '面试取消通知';
          content = `您好${interview.interviewer}，原定于${timeStr}的面试已取消。\n候选人：${resume.name}\n应聘岗位：${job.title}\n取消原因：${extraData?.reason || '候选人/公司原因'}\n您的时间已释放。`;
          break;
        case InterviewMessageType.STATUS_CHANGE_CANDIDATE:
          receiverName = resume.name;
          receiverContact = resume.phone;
          title = '面试状态更新通知';
          content = `您好${resume.name}，您应聘【${job.title}】岗位的面试状态已更新为：${InterviewSessionStatusLabel[interview.sessionStatus as InterviewSessionStatus]}`;
          break;
        case InterviewMessageType.STATUS_CHANGE_INTERVIEWER:
          receiverName = interview.interviewer;
          receiverId = interview.interviewerId;
          title = '面试状态更新通知';
          content = `您好${interview.interviewer}，${resume.name}面试【${job.title}】的状态已更新为：${InterviewSessionStatusLabel[interview.sessionStatus as InterviewSessionStatus]}`;
          break;
      }

      if (title && content) {
        messages.push({
          interviewId: interview.id,
          messageType: msgType,
          channel: InterviewMessageChannel.SYSTEM,
          receiverId,
          receiverName,
          receiverContact,
          title,
          content,
        });
      }
    }

    if (messages.length > 0) {
      const createdMsgs = await interviewMessageDao.batchCreate(messages, { transaction });
      createdMsgs.forEach((m: any) => {
        m.status = 'sent';
        m.sentTime = new Date();
        m.save({ transaction });
      });
      return createdMsgs;
    }
    return [];
  }

  private getStageLabel(stage: string): string {
    const map: Record<string, string> = {
      phone: '电话面试', first: '一面', second: '二面', third: '三面', hr: 'HR面', final: '终面',
    };
    return map[stage] || stage;
  }

  private getTypeLabel(type: string): string {
    const map: Record<string, string> = { onsite: '现场面试', video: '视频面试', phone: '电话面试' };
    return map[type] || type;
  }

  private checkStatusTransition(current: InterviewSessionStatus, target: InterviewSessionStatus): boolean {
    const allowed = INTERVIEW_STATUS_FLOW[current] || [];
    return allowed.includes(target);
  }

  async getList(params: any): Promise<IPaginationResult<InterviewModel>> {
    const { resumeId, jobId, stage, result, sessionStatus, interviewer, keyword, ...rest } = params;
    const where: any = {};
    const include: any[] = [
      { model: Resume, as: 'resume' },
      { model: Job, as: 'job' },
    ];

    if (resumeId) where.resumeId = resumeId;
    if (jobId) where.jobId = jobId;
    if (stage) where.stage = stage;
    if (result) where.result = result;
    if (sessionStatus) where.sessionStatus = sessionStatus;
    if (interviewer) where.interviewer = { [require('sequelize').Op.like]: `%${interviewer}%` };

    if (keyword) {
      include[0].where = {
        name: { [require('sequelize').Op.like]: `%${keyword}%` },
      };
    }

    const order: any[] = [['sortWeight', 'DESC'], ['interviewTime', 'ASC']];
    if (rest.sortBy) {
      order.unshift([rest.sortBy, rest.sortOrder || 'DESC']);
    }

    return interviewDao.paginate(rest, { where, include, order });
  }

  async getById(id: number): Promise<InterviewModel | null> {
    const interview = await interviewDao.findByIdFull(id);
    if (!interview) {
      throw new NotFoundError('面试记录不存在');
    }
    return interview;
  }

  async getOperationLogs(id: number) {
    await this.getById(id);
    return interviewOperationLogDao.findByInterviewId(id);
  }

  async getStats(params: any): Promise<any> {
    const { startTime, endTime } = params;
    return interviewDao.getAppointmentStats(
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined
    );
  }

  async create(data: any, ctx: AppointContext = {}): Promise<any> {
    const validation = await this.validateAppointParams(data);
    if (!validation.valid) {
      throw new BadRequestError(validation.error || '参数校验失败', validation.errorCode, validation.conflictInterviews);
    }

    const transaction = await sequelize.transaction();
    try {
      const { resume, job } = validation;
      const snapshotResume = resume as any;
      const snapshotJob = job as any;

      const urgencyScore = this.calculateJobUrgency(snapshotJob);

      const created = await interviewDao.create(
        {
          ...data,
          sessionStatus: InterviewSessionStatus.PENDING_APPOINT,
          isLocked: false,
          matchScoreSnapshot: snapshotResume.matchScore,
          jobUrgencySnapshot: urgencyScore,
          candidatePhoneSnapshot: snapshotResume.phone,
          candidateEmailSnapshot: snapshotResume.email,
        },
        { transaction }
      );

      await this.recordOperationLog(
        transaction, created.id, InterviewAction.CREATE, ctx,
        undefined, InterviewSessionStatus.PENDING_APPOINT,
        undefined, data,
        `创建面试预约 - ${snapshotResume.name} - ${snapshotJob.title}`
      );

      await transaction.commit();
      return { interview: created, message: '创建成功，待确认预约' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private calculateJobUrgency(job: any): number {
    let score = 0;
    if (job.recruitNum && job.hireCompletedCount !== undefined) {
      const remaining = job.recruitNum - job.hireCompletedCount;
      score += Math.min(remaining * 10, 50);
    }
    if (job.deadline) {
      const daysLeft = dayjs(job.deadline).diff(dayjs(), 'day');
      if (daysLeft <= 3) score += 50;
      else if (daysLeft <= 7) score += 30;
      else if (daysLeft <= 14) score += 15;
    }
    if (job.interviewInProgressCount !== undefined) {
      score += Math.min(job.interviewInProgressCount * 5, 20);
    }
    return Math.min(score, 100);
  }

  private matchScoreToResult(score: number): { allowed: InterviewResult[]; defaultResult: InterviewResult } {
    const rule = SCORE_RESULT_MATCH_RULES.find((r) => score >= r.minScore && score <= r.maxScore);
    if (rule) return { allowed: rule.allowedResults, defaultResult: rule.defaultResult };
    return { allowed: [InterviewResult.FAIL], defaultResult: InterviewResult.FAIL };
  }

  private validateInterviewRecord(resultData: any, interview: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { score, result, evaluation, feedback, scoreDetail } = resultData;

    if (result !== InterviewResult.PENDING_DECISION) {
      if (score === undefined || score === null) {
        errors.push('请填写面试评分');
      } else {
        const s = Number(score);
        if (isNaN(s) || s < INTERVIEW_SCORE_RANGE.MIN || s > INTERVIEW_SCORE_RANGE.MAX) {
          errors.push(`面试评分必须在${INTERVIEW_SCORE_RANGE.MIN}-${INTERVIEW_SCORE_RANGE.MAX}分之间`);
        } else {
          const { allowed } = this.matchScoreToResult(s);
          if (!allowed.includes(result)) {
            errors.push(`评分${s}分不允许选择结果为【${InterviewResultLabel[result as InterviewResult]}】，允许的结果：${allowed.map((r) => InterviewResultLabel[r]).join('、')}`);
          }
        }
      }
    }

    if (result === InterviewResult.PASS && Number(score) < INTERVIEW_SCORE_RANGE.PASS_THRESHOLD) {
      errors.push(`评分低于${INTERVIEW_SCORE_RANGE.PASS_THRESHOLD}分，无法判定为【通过】`);
    }

    if (!evaluation || evaluation.trim().length < INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH) {
      errors.push(`综合评价内容不少于${INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH}个字符`);
    }

    if (!feedback || feedback.trim().length < INTERVIEW_RECORD_VALIDATION_RULES.MIN_FEEDBACK_LENGTH) {
      warnings.push(`建议填写面试反馈（不少于${INTERVIEW_RECORD_VALIDATION_RULES.MIN_FEEDBACK_LENGTH}字）`);
    }

    if (scoreDetail) {
      try {
        const details = typeof scoreDetail === 'string' ? JSON.parse(scoreDetail) : scoreDetail;
        const dims = Object.values(InterviewScoreDimension);
        for (const key of Object.keys(details)) {
          const val = Number(details[key]);
          if (!dims.includes(key as InterviewScoreDimension)) continue;
          if (isNaN(val) || val < 0 || val > 100) {
            errors.push(`维度【${key}】评分不合法`);
          }
        }
      } catch {
        errors.push('评分明细格式错误');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private async detectAbnormalScore(jobId: number, stage: string, score: number): Promise<{ type: InterviewAbnormalScoreType; reason: string; jobAvg: number; jobCount: number }> {
    const { avgScore, count } = await interviewDao.getJobScoreStats(jobId, stage);
    if (count < 3) {
      return { type: InterviewAbnormalScoreType.NONE, reason: '', jobAvg: avgScore, jobCount: count };
    }
    const deviation = Math.abs(score - avgScore);
    if (deviation >= INTERVIEW_RECORD_VALIDATION_RULES.ABNORMAL_SCORE_DEVIATION) {
      const type = score > avgScore ? InterviewAbnormalScoreType.TOO_HIGH : InterviewAbnormalScoreType.TOO_LOW;
      const reason = `与同岗位${count}场面试平均分${avgScore}偏差${deviation.toFixed(1)}分，${score > avgScore ? '偏高' : '偏低'}`;
      return { type, reason, jobAvg: avgScore, jobCount: count };
    }
    if (score >= 98 || score <= 5) {
      const type = score >= 98 ? InterviewAbnormalScoreType.TOO_HIGH : InterviewAbnormalScoreType.TOO_LOW;
      const reason = `评分为${score}分，属于${type === InterviewAbnormalScoreType.TOO_HIGH ? '极高' : '极低'}分，请确认`;
      return { type, reason, jobAvg: avgScore, jobCount: count };
    }
    return { type: InterviewAbnormalScoreType.NONE, reason: '', jobAvg: avgScore, jobCount: count };
  }

  private async syncResumeStatusByResult(
    transaction: Transaction,
    resumeId: number,
    interviewResult: InterviewResult
  ): Promise<void> {
    const resume = await resumeDao.findById(resumeId);
    if (!resume) return;
    let targetStatus: ResumeStatus | null = null;
    switch (interviewResult) {
      case InterviewResult.PASS:
        targetStatus = ResumeStatus.OFFER;
        break;
      case InterviewResult.FAIL:
        targetStatus = ResumeStatus.REJECTED;
        break;
      case InterviewResult.PENDING_DECISION:
        targetStatus = ResumeStatus.INTERVIEW;
        break;
      default:
        break;
    }
    if (targetStatus && (resume as any).status !== targetStatus) {
      await resumeDao.updateById(resumeId, { status: targetStatus }, { transaction });
    }
  }

  private async checkAntiDuplicateSubmit(id: number, lastSubmitTime?: Date): Promise<boolean> {
    if (!lastSubmitTime) return true;
    const diff = Date.now() - new Date(lastSubmitTime).getTime();
    return diff > INTERVIEW_RECORD_VALIDATION_RULES.ANTI_DUPLICATE_SUBMIT_MS;
  }

  async confirmAppointment(id: number, ctx: AppointContext = {}): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const currentStatus = (interview as any).sessionStatus;
    const targetStatus = InterviewSessionStatus.APPOINTED;

    if (!this.checkStatusTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(`无法从状态【${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}】变更为【${InterviewSessionStatusLabel[targetStatus]}】`);
    }

    const beforeData = JSON.parse(JSON.stringify(interview));
    const resume = (interview as any).resume;
    const job = (interview as any).job;

    const transaction = await sequelize.transaction();
    try {
      (interview as any).sessionStatus = targetStatus;
      (interview as any).isLocked = true;
      (interview as any).appointTime = new Date();
      (interview as any).appointOperatorId = ctx.operatorId;
      (interview as any).appointOperatorName = ctx.operatorName;
      await (interview as any).save({ transaction });

      if ((resume as any).status === ResumeStatus.SCREENING) {
        await resumeDao.updateById(resume.id, { status: ResumeStatus.INTERVIEW }, { transaction });
      }

      await this.recordOperationLog(
        transaction, id, InterviewAction.APPOINT, ctx,
        currentStatus, targetStatus,
        beforeData, interview,
        '确认预约成功，场次信息已锁定'
      );

      await this.pushMessages(
        transaction, interview, resume, job,
        [InterviewMessageType.APPOINT_SUCCESS_CANDIDATE, InterviewMessageType.APPOINT_SUCCESS_INTERVIEWER]
      );

      await transaction.commit();
      return { interview, message: '预约成功，已通知候选人与面试官' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async confirmByInterviewer(id: number, ctx: AppointContext = {}): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const currentStatus = (interview as any).sessionStatus;
    const targetStatus = InterviewSessionStatus.PENDING_INTERVIEW;

    if (!this.checkStatusTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(`无法从状态【${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}】变更为【${InterviewSessionStatusLabel[targetStatus]}】`);
    }

    const beforeData = JSON.parse(JSON.stringify(interview));
    const resume = (interview as any).resume;
    const job = (interview as any).job;

    const transaction = await sequelize.transaction();
    try {
      (interview as any).sessionStatus = targetStatus;
      (interview as any).confirmTime = new Date();
      await (interview as any).save({ transaction });

      await this.recordOperationLog(
        transaction, id, InterviewAction.CONFIRM, ctx,
        currentStatus, targetStatus,
        beforeData, interview,
        '面试官确认参加面试'
      );

      await this.pushMessages(
        transaction, interview, resume, job,
        [InterviewMessageType.STATUS_CHANGE_CANDIDATE],
      );

      await transaction.commit();
      return { interview, message: '已确认参加面试' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async completeInterview(id: number, resultData: any, ctx: AppointContext = {}): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const currentStatus = (interview as any).sessionStatus;
    const allowedStatus = [InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.APPOINTED];
    if (!allowedStatus.includes(currentStatus)) {
      throw new BadRequestError(
        `仅允许待面试或面试中状态的场次录入记录，当前状态：${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}`,
        'INVALID_SESSION_STATUS'
      );
    }

    const canSubmit = await this.checkAntiDuplicateSubmit(id, (interview as any).lastSubmitTime);
    if (!canSubmit) {
      throw new BadRequestError('操作过于频繁，请稍候再试', 'DUPLICATE_SUBMIT');
    }

    const validation = this.validateInterviewRecord(resultData, interview);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join('；'), 'VALIDATION_ERROR', {
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const { score, result } = resultData;
    const conflicts = await interviewDao.checkCandidateResultConflict((interview as any).resumeId, id);
    if (conflicts.length > 0 && result !== InterviewResult.PENDING_DECISION) {
      const conflictInfo = conflicts
        .map((c: any) => `【${(c.job as any)?.title || c.jobId} - ${InterviewResultLabel[c.result as InterviewResult]}】`)
        .join('、');
      if (result === InterviewResult.PASS) {
        const hasFail = conflicts.some((c: any) => c.result === InterviewResult.FAIL);
        if (hasFail) {
          throw new BadRequestError(
            `该候选人在其他场次已有淘汰记录，不可判定为通过。冲突记录：${conflictInfo}`,
            'CANDIDATE_RESULT_CONFLICT',
            { conflicts }
          );
        }
      }
    }

    const resume = (interview as any).resume;
    const job = (interview as any).job;

    const abnormal = Number(score) !== undefined
      ? await this.detectAbnormalScore((interview as any).jobId, (interview as any).stage, Number(score))
      : { type: InterviewAbnormalScoreType.NONE, reason: '', jobAvg: 0, jobCount: 0 };

    const targetStatus = InterviewSessionStatus.COMPLETED;
    const beforeData = JSON.parse(JSON.stringify(interview));

    const transaction = await sequelize.transaction();
    try {
      const now = new Date();
      Object.assign(interview as any, resultData, {
        sessionStatus: targetStatus,
        completeTime: now,
        lastSubmitTime: now,
        abnormalScoreType: abnormal.type,
        abnormalScoreReason: abnormal.reason,
      });
      await (interview as any).save({ transaction });

      await this.syncResumeStatusByResult(transaction, (interview as any).resumeId, result);

      await this.recordOperationLog(
        transaction, id, InterviewAction.COMPLETE, ctx,
        currentStatus, targetStatus,
        beforeData, interview,
        `面试完成 - 评分：${score} - 结果：${InterviewResultLabel[result as InterviewResult]}` +
          (abnormal.type !== InterviewAbnormalScoreType.NONE ? `；${abnormal.reason}` : '')
      );

      const msgTypes = [InterviewMessageType.STATUS_CHANGE_CANDIDATE, InterviewMessageType.STATUS_CHANGE_INTERVIEWER];
      await this.pushMessages(transaction, interview, resume, job, msgTypes, {
        result,
        score,
        jobAvg: abnormal.jobAvg,
      });

      await transaction.commit();
      return {
        interview,
        message: '面试记录已提交',
        warnings: validation.warnings,
        abnormal: abnormal.type !== InterviewAbnormalScoreType.NONE ? abnormal : undefined,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancelInterview(
    id: number,
    cancelData: { reasonType: InterviewCancelReasonType; reasonDetail: string; cancelledByCandidate?: boolean },
    ctx: AppointContext = {}
  ): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const currentStatus = (interview as any).sessionStatus;
    const targetStatus = InterviewSessionStatus.CANCELLED;

    if (!this.checkStatusTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(`状态【${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}】的面试不可取消`);
    }

    if (!cancelData.reasonDetail || cancelData.reasonDetail.trim().length < 5) {
      throw new BadRequestError('请填写详细的取消原因（至少5个字符）');
    }

    const beforeData = JSON.parse(JSON.stringify(interview));
    const resume = (interview as any).resume;
    const job = (interview as any).job;

    const transaction = await sequelize.transaction();
    try {
      (interview as any).sessionStatus = targetStatus;
      (interview as any).isLocked = true;
      (interview as any).cancelTime = new Date();
      await (interview as any).save({ transaction });

      await interviewCancelRecordDao.create(
        {
          interviewId: id,
          reasonType: cancelData.reasonType,
          reasonDetail: cancelData.reasonDetail,
          cancellerId: ctx.operatorId,
          cancellerName: ctx.operatorName,
          cancelledByCandidate: cancelData.cancelledByCandidate || false,
          affectCandidate: true,
          affectInterviewer: true,
        },
        { transaction }
      );

      await this.recordOperationLog(
        transaction, id, InterviewAction.CANCEL, ctx,
        currentStatus, targetStatus,
        beforeData, interview,
        `取消面试 - 原因：${cancelData.reasonDetail}`
      );

      await this.pushMessages(
        transaction, interview, resume, job,
        [InterviewMessageType.CANCEL_CANDIDATE, InterviewMessageType.CANCEL_INTERVIEWER],
        { reason: cancelData.reasonDetail }
      );

      await transaction.commit();
      return { interview, message: '面试已取消，相关人员已收到通知' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: number, data: any, ctx: AppointContext = {}): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const currentStatus = (interview as any).sessionStatus;
    if (LOCKED_INTERVIEW_STATUSES.includes(currentStatus)) {
      throw new ForbiddenError(`场次状态为【${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}】已锁定，不可修改，请先取消后重新预约`);
    }

    const validation = await this.validateAppointParams({ ...interview, ...data }, id);
    if (!validation.valid) {
      throw new BadRequestError(validation.error || '参数校验失败', validation.errorCode, validation.conflictInterviews);
    }

    const beforeData = JSON.parse(JSON.stringify(interview));
    const transaction = await sequelize.transaction();
    try {
      Object.assign(interview as any, data);
      await (interview as any).save({ transaction });

      await this.recordOperationLog(
        transaction, id, InterviewAction.UPDATE, ctx,
        currentStatus, currentStatus,
        beforeData, data,
        '修改面试场次信息'
      );

      await transaction.commit();
      return { interview, message: '更新成功' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number, ctx: AppointContext = {}): Promise<number> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const transaction = await sequelize.transaction();
    try {
      await this.recordOperationLog(
        transaction, id, InterviewAction.CANCEL, ctx,
        (interview as any).sessionStatus, undefined,
        interview, undefined,
        '删除面试记录'
      );
      const result = await interviewDao.destroyById(id, { transaction });
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async validateTimeConflict(data: any): Promise<any> {
    const { interviewer, interviewTime, endTime, excludeId } = data;
    if (!interviewer || !interviewTime || !endTime) {
      return { conflict: false };
    }
    const conflicts = await interviewDao.checkInterviewerTimeConflict(
      interviewer,
      new Date(interviewTime),
      new Date(endTime),
      excludeId
    );
    return {
      conflict: conflicts.length > 0,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        interviewTime: c.interviewTime,
        endTime: c.endTime,
      })),
    };
  }

  async batchAppoint(items: any[], ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量预约仅管理员或招聘负责人可执行');
    }
    if (!items || items.length === 0) {
      throw new BadRequestError('批量预约列表不能为空');
    }

    const results: { success: boolean; data?: any; error?: string; item?: any }[] = [];
    const transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const validation = await this.validateAppointParams(item);
          if (!validation.valid) {
            results.push({ success: false, error: validation.error, item });
            continue;
          }

          const { resume, job } = validation;
          const urgencyScore = this.calculateJobUrgency(job as any);

          const created = await interviewDao.create(
            {
              ...item,
              sessionStatus: InterviewSessionStatus.APPOINTED,
              isLocked: true,
              appointTime: new Date(),
              appointOperatorId: ctx.operatorId,
              appointOperatorName: ctx.operatorName,
              matchScoreSnapshot: (resume as any).matchScore,
              jobUrgencySnapshot: urgencyScore,
              candidatePhoneSnapshot: (resume as any).phone,
              candidateEmailSnapshot: (resume as any).email,
            },
            { transaction }
          );

          await this.recordOperationLog(
            transaction, created.id, InterviewAction.BATCH_APPOINT, ctx,
            undefined, InterviewSessionStatus.APPOINTED,
            undefined, item,
            `批量预约 - ${(resume as any).name} - ${(job as any).title}`
          );

          if ((resume as any).status === ResumeStatus.SCREENING) {
            await resumeDao.updateById((resume as any).id, { status: ResumeStatus.INTERVIEW }, { transaction });
          }

          await this.pushMessages(
            transaction, created, resume, job,
            [InterviewMessageType.APPOINT_SUCCESS_CANDIDATE, InterviewMessageType.APPOINT_SUCCESS_INTERVIEWER]
          );

          results.push({ success: true, data: created, item });
        } catch (err: any) {
          results.push({ success: false, error: err.message, item });
        }
      }

      await transaction.commit();
      const successCount = results.filter((r) => r.success).length;
      return {
        total: items.length,
        successCount,
        failedCount: items.length - successCount,
        results,
        message: `批量预约完成：成功${successCount}条，失败${items.length - successCount}条`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchCancelOverdue(ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量取消仅管理员或招聘负责人可执行');
    }

    const overdueThreshold = dayjs().subtract(1, 'hour').toDate();
    const overdueList = await interviewDao.findOverduePendingInterviews(overdueThreshold);

    if (overdueList.length === 0) {
      return { total: 0, successCount: 0, message: '暂无逾期未面试场次' };
    }

    const results: { success: boolean; id: number; error?: string }[] = [];
    const transaction = await sequelize.transaction();

    try {
      for (const interview of overdueList) {
        try {
          const currentStatus = (interview as any).sessionStatus;
          const targetStatus = InterviewSessionStatus.CANCELLED;

          if (!this.checkStatusTransition(currentStatus, targetStatus)) {
            results.push({ success: false, id: (interview as any).id, error: '状态不允许取消' });
            continue;
          }

          (interview as any).sessionStatus = targetStatus;
          (interview as any).isLocked = true;
          (interview as any).cancelTime = new Date();
          await (interview as any).save({ transaction });

          await interviewCancelRecordDao.create(
            {
              interviewId: (interview as any).id,
              reasonType: InterviewCancelReasonType.OTHER,
              reasonDetail: '系统批量取消：面试时间已逾期未进行',
              cancellerId: ctx.operatorId,
              cancellerName: ctx.operatorName,
              cancelledByCandidate: false,
            },
            { transaction }
          );

          await this.recordOperationLog(
            transaction, (interview as any).id, InterviewAction.BATCH_CANCEL, ctx,
            currentStatus, targetStatus,
            undefined, interview,
            '批量取消逾期未面试场次'
          );

          const resume = (interview as any).resume;
          const job = (interview as any).job;
          await this.pushMessages(
            transaction, interview, resume, job,
            [InterviewMessageType.CANCEL_CANDIDATE, InterviewMessageType.CANCEL_INTERVIEWER],
            { reason: '面试时间已逾期，系统自动取消' }
          );

          results.push({ success: true, id: (interview as any).id });
        } catch (err: any) {
          results.push({ success: false, id: (interview as any).id, error: err.message });
        }
      }

      await transaction.commit();
      const successCount = results.filter((r) => r.success).length;
      return {
        total: overdueList.length,
        successCount,
        failedCount: overdueList.length - successCount,
        results,
        message: `批量取消逾期场次完成：成功${successCount}条，失败${overdueList.length - successCount}条`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchSort(
    ids: number[],
    sortType: InterviewBatchSortType,
    ctx: AppointContext,
    role?: string
  ): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量排序仅管理员或招聘负责人可执行');
    }
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择需要排序的面试场次');
    }

    const transaction = await sequelize.transaction();
    try {
      const interviews = await interviewDao.findAll({
        where: { id: ids },
        include: ['resume', 'job'],
      });

      const scored = interviews.map((iv: any) => {
        let score = 0;
        switch (sortType) {
          case InterviewBatchSortType.MATCH_SCORE_DESC:
            score = iv.matchScoreSnapshot || (iv.resume?.matchScore) || 0;
            break;
          case InterviewBatchSortType.JOB_URGENCY_DESC:
            score = iv.jobUrgencySnapshot || this.calculateJobUrgency(iv.job);
            break;
          case InterviewBatchSortType.MATCH_AND_URGENCY:
            const match = iv.matchScoreSnapshot || (iv.resume?.matchScore) || 0;
            const urgency = iv.jobUrgencySnapshot || this.calculateJobUrgency(iv.job);
            score = match * 0.6 + urgency * 0.4;
            break;
        }
        return { id: iv.id, score: Number(score.toFixed(2)) };
      });

      scored.sort((a, b) => b.score - a.score);

      const updates = scored.map((item, index) => ({
        id: item.id,
        sortWeight: scored.length - index,
      }));

      for (const item of scored) {
        await this.recordOperationLog(
          transaction, item.id, InterviewAction.BATCH_SORT, ctx,
          undefined, undefined,
          undefined, { score: item.score, sortType },
          `批量排序 - 类型:${sortType} - 得分:${item.score}`
        );
      }

      if (updates.length > 0) {
        await interviewDao.batchUpdateSortWeight(updates);
      }

      await transaction.commit();
      return {
        total: ids.length,
        reordered: updates.length,
        order: updates,
        message: `已按【${sortType === 'match_score_desc' ? '匹配度降序' : sortType === 'job_urgency_desc' ? '岗位紧急程度' : '综合权重'}】重新排序${updates.length}条场次`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchSupplementOverdue(
    options: { jobId?: number; interviewer?: string; days?: number; defaultResult?: InterviewResult; defaultScore?: number },
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量补录仅管理员或招聘负责人可执行');
    }

    const list = await interviewDao.findOverdueForSupplement(options);
    if (list.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0, message: '没有需要补录的逾期场次' };
    }

    const defaultResult = options.defaultResult || InterviewResult.FAIL;
    const defaultScore = options.defaultScore !== undefined ? Number(options.defaultScore) : 30;

    const transaction = await sequelize.transaction();
    const result = { total: list.length, success: 0, failed: 0, skipped: 0, errors: [] as any[] };

    try {
      for (const item of list) {
        try {
          const interviewData = item as any;
          const recordData = {
            result: defaultResult,
            score: defaultScore,
            evaluation: `【系统批量补录】逾期未录记录，默认结果：${InterviewResultLabel[defaultResult]}`,
            feedback: '逾期未及时录入面试记录，系统自动补录',
          };

          const validation = this.validateInterviewRecord(recordData, item);
          if (!validation.valid) {
            result.skipped++;
            result.errors.push({ id: item.id, message: validation.errors.join('；') });
            continue;
          }

          const abnormal = await this.detectAbnormalScore(interviewData.jobId, interviewData.stage, defaultScore);

          await (item as any).update(
            {
              ...recordData,
              sessionStatus: InterviewSessionStatus.COMPLETED,
              completeTime: new Date(),
              lastSubmitTime: new Date(),
              isSupplementary: true,
              supplementaryTime: new Date(),
              supplementaryOperatorId: ctx.operatorId,
              supplementaryOperatorName: ctx.operatorName,
              abnormalScoreType: abnormal.type,
              abnormalScoreReason: abnormal.reason,
            },
            { transaction }
          );

          await this.syncResumeStatusByResult(transaction, interviewData.resumeId, defaultResult);

          await this.recordOperationLog(
            transaction, item.id, InterviewAction.BATCH_APPOINT, ctx,
            interviewData.sessionStatus, InterviewSessionStatus.COMPLETED,
            undefined, recordData,
            `批量补录逾期记录 - 结果：${InterviewResultLabel[defaultResult]} - 评分：${defaultScore}`
          );

          result.success++;
        } catch (err: any) {
          result.failed++;
          result.errors.push({ id: item.id, message: err.message });
        }
      }

      await transaction.commit();
      return { ...result, message: `批量补录完成：成功${result.success}条，失败${result.failed}条，跳过${result.skipped}条` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchUpdatePendingResults(
    params: { ids: number[]; result: InterviewResult; score?: number; evaluation?: string; feedback?: string },
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量修改待定结果仅管理员或招聘负责人可执行');
    }

    const { ids, result: targetResult, score, evaluation, feedback } = params;
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择需要修改的场次');
    }
    if (!Object.values(InterviewResult).includes(targetResult)) {
      throw new BadRequestError('目标结果不合法');
    }
    if (targetResult === InterviewResult.PENDING || targetResult === InterviewResult.PENDING_DECISION) {
      throw new BadRequestError('请选择确定的面试结果（通过或不通过）');
    }

    const interviews = await Promise.all(ids.map((id) => interviewDao.findByIdFull(id)));
    const validList = interviews.filter((i: any) => i && (i as any).result === InterviewResult.PENDING_DECISION);
    const invalidIds = ids.filter(
      (id) => !interviews.find((i: any) => i && i.id === id && (i as any).result === InterviewResult.PENDING_DECISION)
    );

    const now = new Date();
    const result = { total: ids.length, success: 0, failed: 0, invalid: invalidIds.length, errors: [] as any[] };

    const resumeMap = new Map<number, { pass: boolean; fail: boolean }>();
    for (const item of validList) {
      if (!item) continue;
      const rid = (item as any).resumeId;
      if (!resumeMap.has(rid)) {
        const conflicts = await interviewDao.checkCandidateResultConflict(rid, (item as any).id);
        resumeMap.set(rid, {
          pass: conflicts.some((c) => c.result === InterviewResult.PASS),
          fail: conflicts.some((c) => c.result === InterviewResult.FAIL),
        });
      }
    }

    const transaction = await sequelize.transaction();
    try {
      for (const item of validList) {
        try {
          if (!item) continue;
          const rid = (item as any).resumeId;
          const resumeStatus = resumeMap.get(rid)!;
          if (targetResult === InterviewResult.PASS && resumeStatus.fail) {
            result.failed++;
            result.errors.push({ id: (item as any).id, message: '该候选人已存在淘汰记录，不可标记为通过' });
            continue;
          }

          const beforeData = JSON.parse(JSON.stringify(item));
          const recordData = {
            result: targetResult,
            score: score !== undefined ? Number(score) : (item as any).score,
            evaluation: evaluation || (item as any).evaluation || (targetResult === InterviewResult.PASS ? '综合评估符合要求' : '综合评估未达到标准'),
            feedback: feedback || (item as any).feedback,
            lastSubmitTime: now,
          };

          if (targetResult === InterviewResult.PASS && Number(recordData.score) < INTERVIEW_SCORE_RANGE.PASS_THRESHOLD) {
            recordData.score = INTERVIEW_SCORE_RANGE.PASS_THRESHOLD;
          }

          await (item as any).update(
            { ...recordData, completeTime: (item as any).completeTime || now },
            { transaction }
          );

          await this.syncResumeStatusByResult(transaction, rid, targetResult);

          await this.recordOperationLog(
            transaction, (item as any).id, InterviewAction.BATCH_SORT, ctx,
            (item as any).sessionStatus, (item as any).sessionStatus,
            beforeData, recordData,
            `批量修改待定结果为【${InterviewResultLabel[targetResult]}】`
          );

          result.success++;
        } catch (err: any) {
          result.failed++;
          result.errors.push({ id: item ? (item as any).id : undefined, message: err.message });
        }
      }

      await transaction.commit();
      return {
        ...result,
        invalidIds,
        message: `批量修改完成：成功${result.success}条，失败${result.failed}条${invalidIds.length > 0 ? `，非待定状态跳过${invalidIds.length}条` : ''}`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async validateInterviewRecordApi(id: number, resultData: any): Promise<any> {
    const interview = await this.getById(id);
    if (!interview) throw new NotFoundError('面试记录不存在');

    const validation = this.validateInterviewRecord(resultData, interview);
    const { defaultResult, allowed } = resultData.score !== undefined
      ? this.matchScoreToResult(Number(resultData.score))
      : { defaultResult: undefined, allowed: [] };

    const abnormal = resultData.score !== undefined
      ? await this.detectAbnormalScore((interview as any).jobId, (interview as any).stage, Number(resultData.score))
      : undefined;

    const conflicts = await interviewDao.checkCandidateResultConflict((interview as any).resumeId, id);

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      allowedResults: allowed,
      defaultResult,
      abnormal,
      conflicts: conflicts.map((c: any) => ({
        id: c.id,
        jobId: c.jobId,
        jobTitle: (c.job as any)?.title,
        result: c.result,
        score: c.score,
      })),
    };
  }

  async getRecordStats(jobId?: number): Promise<any> {
    return interviewDao.getInterviewRecordStats(jobId);
  }

  private validateAllocationPermission(operatorRole?: string, operatorDept?: string, interviewerDept?: string): { allowed: boolean; reason?: string } {
    if (operatorRole === UserRole.ADMIN) return { allowed: true };
    if (operatorRole === UserRole.HR) return { allowed: true };
    if (operatorDept && interviewerDept && operatorDept !== interviewerDept) {
      return { allowed: false, reason: '部门负责人仅可调配本部门人员' };
    }
    return { allowed: true };
  }

  private checkDomainMatch(interviewerDomain: InterviewerDomain, jobCategory: string): { matched: boolean; crossDomain: boolean; requiredDomain: InterviewerDomain } {
    const requiredDomain = JOB_CATEGORY_DOMAIN_MAP[jobCategory] || InterviewerDomain.OTHER;
    if (interviewerDomain === requiredDomain) return { matched: true, crossDomain: false, requiredDomain };
    const crossAllowed = DOMAIN_CROSS_MATCH[requiredDomain] || [];
    if (crossAllowed.includes(interviewerDomain)) return { matched: true, crossDomain: interviewerDomain !== requiredDomain, requiredDomain };
    return { matched: false, crossDomain: true, requiredDomain };
  }

  private async validateAllocation(interviewId: number, targetInterviewerId: number, ctx: AppointContext, role?: string): Promise<{ valid: boolean; errors: string[]; warnings: string[]; crossDomain?: boolean; domainMatched?: boolean; interviewer?: any }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const interview = await this.getById(interviewId);
    if (!interview) { errors.push('面试场次不存在'); return { valid: false, errors, warnings }; }

    const currentStatus = (interview as any).sessionStatus;
    const allowedStatuses = [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.PENDING_APPOINT];
    if (!allowedStatuses.includes(currentStatus)) {
      errors.push(`仅已预约场次可调配面试官，当前状态：${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}`);
    }

    const interviewerUser = await User.findByPk(targetInterviewerId);
    if (!interviewerUser) { errors.push('目标面试官不存在'); return { valid: false, errors, warnings }; }

    const permResult = this.validateAllocationPermission(role, ctx.operatorId ? (await User.findByPk(ctx.operatorId))?.department : undefined, (interviewerUser as any).department);
    if (!permResult.allowed) {
      errors.push(permResult.reason || '无权限调配该人员');
    }

    const iStatus = (interviewerUser as any).interviewerStatus as InterviewerStatus;
    if (BUSY_STATUS_CANNOT_ALLOCATE.includes(iStatus)) {
      errors.push(`面试官当前状态为【${InterviewerStatusLabel[iStatus]}】，无法调配新增面试场次`);
    }

    const job = (interview as any).job;
    const jobCategory = (job as any)?.category || JobCategory.OTHER;
    const interviewerDomain = (interviewerUser as any).interviewerDomain as InterviewerDomain || InterviewerDomain.OTHER;
    const domainCheck = this.checkDomainMatch(interviewerDomain, jobCategory);
    if (!domainCheck.matched) {
      warnings.push(`面试官擅长领域【${InterviewerDomainLabel[interviewerDomain]}】与岗位领域【${InterviewerDomainLabel[domainCheck.requiredDomain]}】不匹配`);
    }

    const dailyWorkload = await interviewDao.countInterviewerDailyWorkload(targetInterviewerId, new Date());
    if (dailyWorkload >= INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS) {
      errors.push(`面试官今日已有${dailyWorkload}场面试，超过日最大限制${INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS}场`);
    } else if (dailyWorkload >= INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS * INTERVIEWER_ALLOCATION_RULES.OVERLOAD_THRESHOLD) {
      warnings.push(`面试官今日已有${dailyWorkload}场面试，接近负荷上限`);
    }

    if ((interview as any).interviewTime && (interview as any).endTime) {
      const conflicts = await interviewDao.checkInterviewerTimeConflict(
        (interviewerUser as any).realName || (interviewerUser as any).username,
        new Date((interview as any).interviewTime),
        new Date((interview as any).endTime),
        interviewId
      );
      if (conflicts.length > 0) {
        errors.push('面试官在该时间段有时间冲突');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      crossDomain: domainCheck.crossDomain,
      domainMatched: domainCheck.matched,
      interviewer: interviewerUser,
    };
  }

  async allocateInterviewer(
    interviewId: number,
    targetInterviewerId: number,
    crossDomainConfirmed: boolean,
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    const validation = await this.validateAllocation(interviewId, targetInterviewerId, ctx, role);
    if (!validation.valid) {
      throw new BadRequestError(validation.errors.join('；'), 'ALLOCATION_VALIDATION_ERROR', { errors: validation.errors, warnings: validation.warnings });
    }

    if (validation.crossDomain && !crossDomainConfirmed) {
      throw new BadRequestError('跨领域调配需二次确认', 'CROSS_DOMAIN_CONFIRM_REQUIRED', { crossDomain: true, warnings: validation.warnings });
    }

    const interview = await this.getById(interviewId);
    const interviewerUser = validation.interviewer;
    const previousInterviewerId = (interview as any).interviewerId;
    const previousInterviewerName = (interview as any).interviewer;
    const newInterviewerName = (interviewerUser as any).realName || (interviewerUser as any).username;
    const beforeData = JSON.parse(JSON.stringify(interview));

    const transaction = await sequelize.transaction();
    try {
      await (interview as any).update({
        interviewer: newInterviewerName,
        interviewerId: targetInterviewerId,
      }, { transaction });

      const previousStatus = (interviewerUser as any).interviewerStatus;
      if (previousStatus === InterviewerStatus.IDLE) {
        await (interviewerUser as any).update({
          interviewerStatus: InterviewerStatus.INTERVIEWING,
          interviewerStatusUpdateTime: new Date(),
        }, { transaction });
      }

      if (previousInterviewerId) {
        const prevUser = await User.findByPk(previousInterviewerId);
        if (prevUser) {
          const remainingSessions = await interviewDao.findInterviewerSessions(previousInterviewerId);
          if (remainingSessions.length === 0 && (prevUser as any).interviewerStatus === InterviewerStatus.INTERVIEWING) {
            await (prevUser as any).update({
              interviewerStatus: InterviewerStatus.IDLE,
              interviewerStatusUpdateTime: new Date(),
            }, { transaction });
          }
        }
      }

      await interviewerAllocationLogDao.create({
        interviewId,
        interviewerId: targetInterviewerId,
        interviewerName: newInterviewerName,
        previousInterviewerId,
        previousInterviewerName,
        action: previousInterviewerId ? AllocationAction.REPLACE : AllocationAction.ALLOCATE,
        beforeStatus: previousStatus,
        afterStatus: (interviewerUser as any).interviewerStatus,
        domainMatched: validation.domainMatched,
        crossDomainConfirmed: validation.crossDomain ? crossDomainConfirmed : undefined,
        operatorId: ctx.operatorId,
        operatorName: ctx.operatorName,
        operatorRole: role,
        remark: previousInterviewerId
          ? `替换面试官：${previousInterviewerName} → ${newInterviewerName}`
          : `调配面试官：${newInterviewerName}`,
        ip: ctx.ip,
      }, { transaction });

      await this.recordOperationLog(
        transaction, interviewId, InterviewAction.UPDATE, ctx,
        (interview as any).sessionStatus, (interview as any).sessionStatus,
        beforeData, interview,
        previousInterviewerId
          ? `替换面试官：${previousInterviewerName} → ${newInterviewerName}`
          : `调配面试官：${newInterviewerName}`
      );

      const resume = (interview as any).resume;
      const job = (interview as any).job;
      if (resume && job) {
        await this.pushMessages(
          transaction, interview, resume, job,
          [InterviewMessageType.STATUS_CHANGE_INTERVIEWER],
          { result: undefined, interviewerName: newInterviewerName }
        );
      }

      await transaction.commit();
      return {
        interview,
        message: previousInterviewerId
          ? `面试官已替换为${newInterviewerName}`
          : `面试官${newInterviewerName}调配成功`,
        warnings: validation.warnings,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateInterviewerStatus(
    interviewerId: number,
    newStatus: InterviewerStatus,
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    const interviewerUser = await User.findByPk(interviewerId);
    if (!interviewerUser) throw new NotFoundError('面试官不存在');
    if ((interviewerUser as any).role !== UserRole.INTERVIEWER && (interviewerUser as any).role !== UserRole.HR) {
      throw new BadRequestError('该用户不是面试官');
    }

    const permResult = this.validateAllocationPermission(role, ctx.operatorId ? (await User.findByPk(ctx.operatorId))?.department : undefined, (interviewerUser as any).department);
    if (!permResult.allowed) {
      throw new ForbiddenError(permResult.reason || '无权限修改该面试官状态');
    }

    const previousStatus = (interviewerUser as any).interviewerStatus as InterviewerStatus;
    if (previousStatus === newStatus) {
      return { interviewer: interviewerUser, message: '状态未变更' };
    }

    const transaction = await sequelize.transaction();
    const warnings: string[] = [];
    try {
      await (interviewerUser as any).update({
        interviewerStatus: newStatus,
        interviewerStatusUpdateTime: new Date(),
      }, { transaction });

      if (newStatus === InterviewerStatus.BUSY || newStatus === InterviewerStatus.ON_LEAVE) {
        const activeSessions = await interviewDao.findInterviewerSessions(interviewerId);
        if (activeSessions.length > 0) {
          warnings.push(`该面试官有${activeSessions.length}场待面试场次，状态设为${InterviewerStatusLabel[newStatus]}后这些场次仍保留`);
        }
      }

      if (newStatus === InterviewerStatus.IDLE) {
        const activeSessions = await interviewDao.findInterviewerSessions(interviewerId);
        if (activeSessions.length > 0) {
          await (interviewerUser as any).update({ interviewerStatus: InterviewerStatus.INTERVIEWING }, { transaction });
        }
      }

      await interviewerAllocationLogDao.create({
        interviewerId,
        interviewerName: (interviewerUser as any).realName || (interviewerUser as any).username,
        action: AllocationAction.STATUS_CHANGE,
        beforeStatus: previousStatus,
        afterStatus: newStatus,
        operatorId: ctx.operatorId,
        operatorName: ctx.operatorName,
        operatorRole: role,
        remark: `面试官状态变更：${InterviewerStatusLabel[previousStatus]} → ${InterviewerStatusLabel[newStatus]}`,
        ip: ctx.ip,
      }, { transaction });

      await transaction.commit();
      return {
        interviewer: interviewerUser,
        message: `面试官状态已更新为【${InterviewerStatusLabel[newStatus]}】`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAvailableInterviewers(
    jobCategory?: string,
    date?: string,
    domain?: InterviewerDomain
  ): Promise<any> {
    const where: any = {
      role: { [require('sequelize').Op.in]: [UserRole.INTERVIEWER, UserRole.HR] },
      accountStatus: 'normal',
      status: 1,
      interviewerStatus: { [require('sequelize').Op.in]: [InterviewerStatus.IDLE, InterviewerStatus.INTERVIEWING] },
    };
    if (domain) where.interviewerDomain = domain;

    const interviewers = await User.findAll({ where, order: [['currentWorkload', 'ASC'], ['interviewerStatus', 'ASC']] });

    const results = await Promise.all((interviewers as any[]).map(async (u) => {
      const dailyWorkload = date
        ? await interviewDao.countInterviewerDailyWorkload(u.id, new Date(date))
        : await interviewDao.countInterviewerDailyWorkload(u.id, new Date());

      const workloadStats = await interviewDao.getInterviewerWorkloadStats(u.id);
      const iDomain = u.interviewerDomain as InterviewerDomain || InterviewerDomain.OTHER;
      let domainMatchInfo = null;
      if (jobCategory) {
        const check = this.checkDomainMatch(iDomain, jobCategory);
        domainMatchInfo = { matched: check.matched, crossDomain: check.crossDomain, requiredDomain: check.requiredDomain, interviewerDomain: iDomain };
      }

      return {
        id: u.id,
        name: u.realName || u.username,
        department: u.department,
        position: u.position,
        interviewerStatus: u.interviewerStatus,
        interviewerDomain: iDomain,
        expertise: u.expertise,
        maxDailyInterviews: u.maxDailyInterviews,
        currentWorkload: u.currentWorkload,
        dailyWorkload,
        workloadStats,
        domainMatchInfo,
      };
    }));

    results.sort((a, b) => {
      if (jobCategory) {
        const aMatch = a.domainMatchInfo?.matched ? 0 : 1;
        const bMatch = b.domainMatchInfo?.matched ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      const aBusy = BUSY_STATUS_CANNOT_ALLOCATE.includes(a.interviewerStatus) ? 1 : 0;
      const bBusy = BUSY_STATUS_CANNOT_ALLOCATE.includes(b.interviewerStatus) ? 1 : 0;
      if (aBusy !== bBusy) return aBusy - bBusy;
      return a.dailyWorkload - b.dailyWorkload;
    });

    return results;
  }

  async batchReplaceInterviewer(
    params: { ids: number[]; targetInterviewerId: number; crossDomainConfirmed?: boolean },
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量替换面试官仅管理员或HR可执行');
    }
    const { ids, targetInterviewerId, crossDomainConfirmed } = params;
    if (!ids || ids.length === 0) throw new BadRequestError('请选择需要替换面试官的场次');

    const result = { total: ids.length, success: 0, failed: 0, errors: [] as any[], warnings: [] as string[] };
    const transaction = await sequelize.transaction();
    try {
      const interviewerUser = await User.findByPk(targetInterviewerId);
      if (!interviewerUser) throw new NotFoundError('目标面试官不存在');
      const iStatus = (interviewerUser as any).interviewerStatus as InterviewerStatus;
      if (BUSY_STATUS_CANNOT_ALLOCATE.includes(iStatus)) {
        throw new BadRequestError(`面试官状态为【${InterviewerStatusLabel[iStatus]}】，无法调配`);
      }
      const newInterviewerName = (interviewerUser as any).realName || (interviewerUser as any).username;

      for (const id of ids) {
        try {
          const interview = await interviewDao.findByIdFull(id);
          if (!interview) { result.failed++; result.errors.push({ id, message: '场次不存在' }); continue; }

          const currentStatus = (interview as any).sessionStatus;
          if (![InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW].includes(currentStatus)) {
            result.failed++; result.errors.push({ id, message: `状态不允许替换：${InterviewSessionStatusLabel[currentStatus as InterviewSessionStatus]}` }); continue;
          }

          const previousInterviewerId = (interview as any).interviewerId;
          const previousInterviewerName = (interview as any).interviewer;

          if ((interview as any).interviewTime && (interview as any).endTime) {
            const conflicts = await interviewDao.checkInterviewerTimeConflict(
              newInterviewerName,
              new Date((interview as any).interviewTime),
              new Date((interview as any).endTime),
              id
            );
            if (conflicts.length > 0) {
              result.failed++; result.errors.push({ id, message: '面试官时间冲突' }); continue;
            }
          }

          const job = (interview as any).job;
          const jobCategory = (job as any)?.category;
          const iDomain = (interviewerUser as any).interviewerDomain as InterviewerDomain;
          const domainCheck = this.checkDomainMatch(iDomain, jobCategory);
          if (!domainCheck.matched && !crossDomainConfirmed) {
            result.failed++; result.errors.push({ id, message: '跨领域调配需确认' }); continue;
          }

          const dailyWorkload = await interviewDao.countInterviewerDailyWorkload(targetInterviewerId, new Date((interview as any).interviewTime || Date.now()));
          if (dailyWorkload >= INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS) {
            result.failed++; result.errors.push({ id, message: `面试官今日已达${dailyWorkload}场上限` }); continue;
          }

          await (interview as any).update({
            interviewer: newInterviewerName,
            interviewerId: targetInterviewerId,
          }, { transaction });

          await interviewerAllocationLogDao.create({
            interviewId: id,
            interviewerId: targetInterviewerId,
            interviewerName: newInterviewerName,
            previousInterviewerId,
            previousInterviewerName,
            action: AllocationAction.BATCH_REPLACE,
            domainMatched: domainCheck.matched,
            crossDomainConfirmed: domainCheck.crossDomain ? !!crossDomainConfirmed : undefined,
            operatorId: ctx.operatorId,
            operatorName: ctx.operatorName,
            operatorRole: role,
            remark: `批量替换：${previousInterviewerName} → ${newInterviewerName}`,
            ip: ctx.ip,
          }, { transaction });

          result.success++;
          if (domainCheck.crossDomain) result.warnings.push(`场次#${id}跨领域调配`);
        } catch (err: any) {
          result.failed++;
          result.errors.push({ id, message: err.message });
        }
      }

      if (result.success > 0) {
        const prevStatus = (interviewerUser as any).interviewerStatus;
        if (prevStatus === InterviewerStatus.IDLE) {
          await (interviewerUser as any).update({
            interviewerStatus: InterviewerStatus.INTERVIEWING,
            interviewerStatusUpdateTime: new Date(),
          }, { transaction });
        }
      }

      await transaction.commit();
      return { ...result, message: `批量替换完成：成功${result.success}条，失败${result.failed}条` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchScheduleOptimize(
    params: { interviewerId?: number; jobId?: number; optimizeBy: 'workload' | 'domain' | 'availability'; ids?: number[] },
    ctx: AppointContext = {},
    role?: string
  ): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('批量优化排班仅管理员或HR可执行');
    }

    const sessions = await interviewDao.findSessionsForBatchReplace({
      interviewerId: params.interviewerId,
      jobId: params.jobId,
      ids: params.ids,
    });

    if (sessions.length === 0) return { total: 0, success: 0, message: '无可优化场次' };

    const availableInterviewers = await this.getAvailableInterviewers(
      params.jobId ? ((await jobDao.findById(params.jobId)) as any)?.category : undefined
    );

    const result = { total: sessions.length, success: 0, failed: 0, errors: [] as any[], suggestions: [] as any[] };

    for (const session of sessions) {
      const currentInterviewerId = (session as any).interviewerId;
      const currentWorkload = await interviewDao.countInterviewerDailyWorkload(currentInterviewerId, new Date((session as any).interviewTime || Date.now()));

      let bestCandidate: any = null;
      let bestScore = -1;

      for (const candidate of availableInterviewers) {
        if (candidate.id === currentInterviewerId) continue;
        if (candidate.dailyWorkload >= INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS) continue;

        let score = 0;
        if (params.optimizeBy === 'workload') {
          score = INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS - candidate.dailyWorkload;
        } else if (params.optimizeBy === 'domain') {
          score = candidate.domainMatchInfo?.matched ? 100 : (candidate.domainMatchInfo?.crossDomain ? 50 : 0);
          score -= candidate.dailyWorkload * 2;
        } else {
          if (candidate.interviewerStatus === InterviewerStatus.IDLE) score += 50;
          score += INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS - candidate.dailyWorkload;
          if (candidate.domainMatchInfo?.matched) score += 30;
        }

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate && (params.optimizeBy === 'workload' ? currentWorkload > bestCandidate.dailyWorkload + 2 : bestScore > 0)) {
        result.suggestions.push({
          interviewId: (session as any).id,
          currentInterviewer: (session as any).interviewer,
          currentInterviewerId,
          suggestedInterviewer: bestCandidate.name,
          suggestedInterviewerId: bestCandidate.id,
          reason: `优化策略：${params.optimizeBy === 'workload' ? '工作量均衡' : params.optimizeBy === 'domain' ? '领域匹配' : '综合可用性'}，评分${bestScore.toFixed(1)}`,
        });
      }
    }

    result.success = result.suggestions.length;
    result.failed = sessions.length - result.suggestions.length;
    return { ...result, message: `排班优化完成：产生${result.suggestions.length}条建议` };
  }

  async getInterviewerWorkload(interviewerId: number): Promise<any> {
    const interviewerUser = await User.findByPk(interviewerId);
    if (!interviewerUser) throw new NotFoundError('面试官不存在');

    const workloadStats = await interviewDao.getInterviewerWorkloadStats(interviewerId);
    const sessions = await interviewDao.findInterviewerSessions(interviewerId);
    const allocationLogs = await interviewerAllocationLogDao.findByInterviewerId(interviewerId, { limit: 20 });

    return {
      interviewer: {
        id: (interviewerUser as any).id,
        name: (interviewerUser as any).realName || (interviewerUser as any).username,
        department: (interviewerUser as any).department,
        position: (interviewerUser as any).position,
        interviewerStatus: (interviewerUser as any).interviewerStatus,
        interviewerDomain: (interviewerUser as any).interviewerDomain,
        expertise: (interviewerUser as any).expertise,
        maxDailyInterviews: (interviewerUser as any).maxDailyInterviews,
      },
      workload: workloadStats,
      upcomingSessions: sessions.map((s: any) => ({
        id: s.id,
        interviewTime: s.interviewTime,
        endTime: s.endTime,
        stage: s.stage,
        sessionStatus: s.sessionStatus,
        resumeName: s.resume?.name,
        jobTitle: s.job?.title,
      })),
      recentAllocationLogs: allocationLogs,
    };
  }

  async getAllocationLogs(options: { interviewId?: number; interviewerId?: number; operatorId?: number; limit?: number }): Promise<any> {
    if (options.interviewId) {
      return interviewerAllocationLogDao.findByInterviewId(options.interviewId);
    }
    if (options.interviewerId) {
      return interviewerAllocationLogDao.findByInterviewerId(options.interviewerId, { limit: options.limit });
    }
    if (options.operatorId) {
      return interviewerAllocationLogDao.findByOperatorId(options.operatorId, { limit: options.limit });
    }
    return [];
  }

  private canBatchOperate(role?: string): boolean {
    return role === UserRole.ADMIN || role === UserRole.HR;
  }

  private computeWarningLevel(interviewTime: Date): WarningLevel {
    const now = Date.now();
    const diff = new Date(interviewTime).getTime() - now;
    if (diff <= 0) return WarningLevel.OVERDUE;
    if (diff <= INTERVIEW_WARNING_RULES.APPROACHING_1H_MS) return WarningLevel.APPROACHING_1H;
    if (diff <= INTERVIEW_WARNING_RULES.APPROACHING_24H_MS) return WarningLevel.APPROACHING_24H;
    return WarningLevel.NORMAL;
  }

  private warningLevelToStatus(level: WarningLevel): WarningStatus {
    switch (level) {
      case WarningLevel.OVERDUE: return WarningStatus.OVERDUE;
      case WarningLevel.APPROACHING_24H:
      case WarningLevel.APPROACHING_1H: return WarningStatus.APPROACHING;
      default: return WarningStatus.NORMAL;
    }
  }

  async checkAndTriggerWarnings(): Promise<{ triggered: number; updated: number }> {
    const approachingInterviews = await interviewDao.findInterviewsForWarningCheck();
    const overdueInterviews = await interviewDao.findOverdueInterviewsForWarning();
    const allInterviews = [...approachingInterviews, ...overdueInterviews];
    const triggeredIds = new Set<number>();
    let triggered = 0;
    let updated = 0;
    for (const interview of allInterviews) {
      if (triggeredIds.has(interview.id)) continue;
      triggeredIds.add(interview.id);
      const newLevel = this.computeWarningLevel(interview.interviewTime!);
      const newStatus = this.warningLevelToStatus(newLevel);
      const currentLevel = interview.warningLevel || WarningLevel.NORMAL;
      if (WARNING_LEVEL_ORDER[newLevel] > WARNING_LEVEL_ORDER[currentLevel]) {
        const previousWarningLevel = currentLevel;
        const previousWarningStatus = interview.warningStatus || WarningStatus.NORMAL;
        await interviewDao.update(interview.id, {
          warningLevel: newLevel,
          warningStatus: newStatus,
          lastWarningTriggeredAt: new Date(),
        } as any);
        await interviewWarningLogDao.batchCreate([{
          interviewId: interview.id,
          warningStatus: newStatus,
          warningLevel: newLevel,
          action: WarningAction.AUTO_TRIGGER,
          previousWarningLevel,
          previousWarningStatus,
          operatorName: 'system',
        }]);
        if (interview.interviewerId) {
          await interviewMessageDao.batchCreate([{
            interviewId: interview.id,
            type: InterviewMessageType.SYSTEM_NOTIFICATION,
            channel: InterviewMessageChannel.IN_APP,
            recipientId: interview.interviewerId,
            recipientName: interview.interviewer,
            content: `面试预警：您有一场面试即将${newLevel === WarningLevel.OVERDUE ? '逾期' : '到期'}，候选人：${(interview as any).resume?.name || '-'}，时间：${dayjs(interview.interviewTime).format('YYYY-MM-DD HH:mm')}`,
          }]);
        }
        triggered++;
        updated++;
      }
    }
    return { triggered, updated };
  }

  async getWarningList(options: {
    warningStatus?: WarningStatus;
    warningLevel?: WarningLevel;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    const { warningStatus, warningLevel, sortBy, sortOrder, page = 1, pageSize = 20 } = options;
    const result = await interviewDao.findWarningInterviews({
      warningStatus,
      warningLevel,
      sortBy: sortBy || 'interviewTime',
      sortOrder: sortOrder || 'ASC',
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const rows = result.rows.map((r: any) => ({
      ...r.toJSON(),
      warningStatusLabel: WarningStatusLabel[r.warningStatus as WarningStatus] || '正常',
      warningLevelLabel: WarningLevelLabel[r.warningLevel as WarningLevel] || '正常',
      overdueReasonTypeLabel: r.overdueReasonType ? OverdueReasonTypeLabel[r.overdueReasonType as OverdueReasonType] : null,
      countdownMs: r.interviewTime ? new Date(r.interviewTime).getTime() - Date.now() : null,
    }));
    return { rows, total: result.count, page, pageSize };
  }

  async getWarningStats(): Promise<any> {
    return interviewDao.getWarningStats();
  }

  async handleOverdueInterview(interviewId: number, data: {
    overdueReasonType: OverdueReasonType;
    overdueReason: string;
    remedyPlan: string;
  }, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可处理逾期面试');
    }
    const interview = await interviewDao.findById(interviewId, { include: ['resume', 'job'] });
    if (!interview) throw new NotFoundError('面试场次不存在');
    if (interview.warningStatus !== WarningStatus.OVERDUE && interview.warningLevel !== WarningLevel.OVERDUE) {
      throw new BadRequestError('该面试场次未处于逾期状态');
    }
    if (!data.overdueReasonType || !data.overdueReason || !data.remedyPlan) {
      throw new BadRequestError('逾期原因类型、逾期原因和补救方案为必填项');
    }
    const previousWarningLevel = interview.warningLevel;
    const previousWarningStatus = interview.warningStatus;
    await interviewDao.update(interviewId, {
      warningStatus: WarningStatus.HANDLED,
      overdueReasonType: data.overdueReasonType,
      overdueReason: data.overdueReason,
      remedyPlan: data.remedyPlan,
      warningHandledAt: new Date(),
    } as any);
    await interviewWarningLogDao.batchCreate([{
      interviewId,
      warningStatus: WarningStatus.HANDLED,
      warningLevel: interview.warningLevel,
      overdueReasonType: data.overdueReasonType,
      overdueReason: data.overdueReason,
      remedyPlan: data.remedyPlan,
      action: WarningAction.HANDLE_OVERDUE,
      handlerId: ctx.operatorId,
      handlerName: ctx.operatorName,
      handlerRole: role,
      previousWarningLevel,
      previousWarningStatus,
      operatorId: ctx.operatorId,
      operatorName: ctx.operatorName,
      operatorRole: role,
      ip: ctx.ip,
    }]);
    if (interview.interviewerId) {
      await interviewMessageDao.batchCreate([{
        interviewId,
        type: InterviewMessageType.SYSTEM_NOTIFICATION,
        channel: InterviewMessageChannel.IN_APP,
        recipientId: interview.interviewerId,
        recipientName: interview.interviewer,
        content: `逾期面试已处理：候选人${(interview as any).resume?.name || '-'}的面试，处理人：${ctx.operatorName}`,
      }]);
    }
    return { message: '逾期面试处理成功' };
  }

  async batchHandleOverdue(data: {
    ids: number[];
    overdueReasonType: OverdueReasonType;
    overdueReason: string;
    remedyPlan: string;
  }, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可批量处理逾期面试');
    }
    if (!data.ids || data.ids.length === 0) {
      throw new BadRequestError('请选择需要处理的逾期面试场次');
    }
    if (data.ids.length > INTERVIEW_WARNING_RULES.BATCH_HANDLE_LIMIT) {
      throw new BadRequestError(`单次批量处理上限${INTERVIEW_WARNING_RULES.BATCH_HANDLE_LIMIT}条`);
    }
    const results = { success: 0, failed: 0, details: [] as any[] };
    const transaction = await sequelize.transaction();
    try {
      for (const id of data.ids) {
        try {
          const interview = await interviewDao.findById(id);
          if (!interview) {
            results.details.push({ id, success: false, error: '场次不存在' });
            results.failed++;
            continue;
          }
          if (interview.warningStatus !== WarningStatus.OVERDUE && interview.warningLevel !== WarningLevel.OVERDUE && interview.warningStatus !== WarningStatus.APPROACHING) {
            results.details.push({ id, success: false, error: '场次非逾期/即将逾期状态' });
            results.failed++;
            continue;
          }
          const previousWarningLevel = interview.warningLevel;
          const previousWarningStatus = interview.warningStatus;
          await interviewDao.update(id, {
            warningStatus: WarningStatus.HANDLED,
            overdueReasonType: data.overdueReasonType,
            overdueReason: data.overdueReason,
            remedyPlan: data.remedyPlan,
            warningHandledAt: new Date(),
          } as any, { transaction });
          await interviewWarningLogDao.batchCreate([{
            interviewId: id,
            warningStatus: WarningStatus.HANDLED,
            warningLevel: interview.warningLevel,
            overdueReasonType: data.overdueReasonType,
            overdueReason: data.overdueReason,
            remedyPlan: data.remedyPlan,
            action: WarningAction.BATCH_HANDLE,
            handlerId: ctx.operatorId,
            handlerName: ctx.operatorName,
            handlerRole: role,
            previousWarningLevel,
            previousWarningStatus,
            operatorId: ctx.operatorId,
            operatorName: ctx.operatorName,
            operatorRole: role,
            ip: ctx.ip,
          }], { transaction });
          results.success++;
          results.details.push({ id, success: true });
        } catch (err: any) {
          results.failed++;
          results.details.push({ id, success: false, error: err.message });
        }
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    return { ...results, message: `批量处理完成：成功${results.success}条，失败${results.failed}条` };
  }

  async batchPostponeInterviews(data: {
    ids: number[];
    postponeHours: number;
  }, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可批量延后面试时间');
    }
    if (!data.ids || data.ids.length === 0) {
      throw new BadRequestError('请选择需要延后的面试场次');
    }
    if (!data.postponeHours || data.postponeHours <= 0) {
      throw new BadRequestError('延后时间必须大于0小时');
    }
    const results = { success: 0, failed: 0, details: [] as any[], effective: 0, pending: 0 };
    for (const id of data.ids) {
      try {
        const interview = await interviewDao.findById(id);
        if (!interview) {
          results.details.push({ id, success: false, error: '场次不存在' });
          results.failed++;
          continue;
        }
        if (interview.sessionStatus !== InterviewSessionStatus.APPOINTED && interview.sessionStatus !== InterviewSessionStatus.PENDING_INTERVIEW) {
          results.details.push({ id, success: false, error: '场次状态不允许延后' });
          results.failed++;
          continue;
        }
        if (!interview.interviewTime) {
          results.details.push({ id, success: false, error: '场次无面试时间' });
          results.failed++;
          continue;
        }
        const newTime = dayjs(interview.interviewTime).add(data.postponeHours, 'hour').toDate();
        const newEndTime = interview.endTime ? dayjs(interview.endTime).add(data.postponeHours, 'hour').toDate() : null;
        const previousWarningLevel = interview.warningLevel;
        const previousWarningStatus = interview.warningStatus;
        const newWarningLevel = this.computeWarningLevel(newTime);
        const newWarningStatus = this.warningLevelToStatus(newWarningLevel);
        await interviewDao.update(id, {
          interviewTime: newTime,
          endTime: newEndTime,
          warningLevel: newWarningLevel,
          warningStatus: newWarningStatus,
          lastWarningTriggeredAt: new Date(),
        } as any);
        await interviewWarningLogDao.batchCreate([{
          interviewId: id,
          warningStatus: newWarningStatus,
          warningLevel: newWarningLevel,
          action: WarningAction.BATCH_POSTPONE,
          previousWarningLevel,
          previousWarningStatus,
          postponedTime: newTime,
          operatorId: ctx.operatorId,
          operatorName: ctx.operatorName,
          operatorRole: role,
          ip: ctx.ip,
          remark: `批量延后${data.postponeHours}小时`,
        }]);
        results.success++;
        if (newWarningStatus === WarningStatus.NORMAL) {
          results.effective++;
        } else {
          results.pending++;
        }
        results.details.push({ id, success: true, newWarningStatus, newWarningLevel });
      } catch (err: any) {
        results.failed++;
        results.details.push({ id, success: false, error: err.message });
      }
    }
    return { ...results, message: `批量延后完成：成功${results.success}条(已生效${results.effective}，待生效${results.pending})，失败${results.failed}条` };
  }

  async dismissWarning(interviewId: number, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可解除预警');
    }
    const interview = await interviewDao.findById(interviewId);
    if (!interview) throw new NotFoundError('面试场次不存在');
    if (interview.warningStatus === WarningStatus.NORMAL) {
      throw new BadRequestError('该面试场次未处于预警状态');
    }
    const previousWarningLevel = interview.warningLevel;
    const previousWarningStatus = interview.warningStatus;
    await interviewDao.update(interviewId, {
      warningStatus: WarningStatus.NORMAL,
      warningLevel: WarningLevel.NORMAL,
    } as any);
    await interviewWarningLogDao.batchCreate([{
      interviewId,
      warningStatus: WarningStatus.NORMAL,
      warningLevel: WarningLevel.NORMAL,
      action: WarningAction.DISMISS_WARNING,
      previousWarningLevel,
      previousWarningStatus,
      operatorId: ctx.operatorId,
      operatorName: ctx.operatorName,
      operatorRole: role,
      ip: ctx.ip,
    }]);
    return { message: '预警已解除' };
  }

  async markFalseAlarm(interviewId: number, data: { falseAlarmReason: string }, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可标记误预警');
    }
    const interview = await interviewDao.findById(interviewId);
    if (!interview) throw new NotFoundError('面试场次不存在');
    if (interview.warningStatus === WarningStatus.NORMAL && interview.warningLevel === WarningLevel.NORMAL) {
      throw new BadRequestError('该面试场次未触发过预警');
    }
    const previousWarningLevel = interview.warningLevel;
    const previousWarningStatus = interview.warningStatus;
    await interviewDao.update(interviewId, {
      warningStatus: WarningStatus.NORMAL,
      warningLevel: WarningLevel.NORMAL,
    } as any);
    await interviewWarningLogDao.batchCreate([{
      interviewId,
      warningStatus: WarningStatus.NORMAL,
      warningLevel: WarningLevel.NORMAL,
      action: WarningAction.FALSE_ALARM,
      previousWarningLevel,
      previousWarningStatus,
      falseAlarmVerified: true,
      falseAlarmReason: data.falseAlarmReason,
      operatorId: ctx.operatorId,
      operatorName: ctx.operatorName,
      operatorRole: role,
      ip: ctx.ip,
    }]);
    return { message: '已标记为误预警' };
  }

  async getWarningLogs(options: { interviewId?: number; handlerId?: number; operatorId?: number; limit?: number }): Promise<any> {
    if (options.interviewId) {
      return interviewWarningLogDao.findByInterviewId(options.interviewId);
    }
    if (options.handlerId) {
      return interviewWarningLogDao.findByHandlerId(options.handlerId, { limit: options.limit });
    }
    if (options.operatorId) {
      return interviewWarningLogDao.findByOperatorId(options.operatorId, { limit: options.limit });
    }
    return [];
  }

  async getOverdueRateStats(): Promise<any> {
    return interviewDao.getOverdueRateStats();
  }

  async sortWarningList(ids: number[], strategy: string, ctx: AppointContext, role?: string): Promise<any> {
    if (!this.canBatchOperate(role)) {
      throw new ForbiddenError('仅管理员或HR可排序预警列表');
    }
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择需要排序的预警场次');
    }
    const interviews = await Interview.findAll({
      where: { id: { [Op.in]: ids } },
      include: ['resume', 'job'],
    });
    let sorted: any[];
    switch (strategy) {
      case WARNING_SORT_STRATEGIES.JOB_URGENCY:
        sorted = interviews.sort((a: any, b: any) => (b.jobUrgencySnapshot || 0) - (a.jobUrgencySnapshot || 0));
        break;
      case WARNING_SORT_STRATEGIES.CANDIDATE_PRIORITY:
        sorted = interviews.sort((a: any, b: any) => (b.matchScoreSnapshot || 0) - (a.matchScoreSnapshot || 0));
        break;
      case WARNING_SORT_STRATEGIES.WARNING_LEVEL:
        sorted = interviews.sort((a: any, b: any) => (WARNING_LEVEL_ORDER[b.warningLevel] || 0) - (WARNING_LEVEL_ORDER[a.warningLevel] || 0));
        break;
      case WARNING_SORT_STRATEGIES.INTERVIEW_TIME:
      default:
        sorted = interviews.sort((a: any, b: any) => new Date(a.interviewTime).getTime() - new Date(b.interviewTime).getTime());
        break;
    }
    return sorted.map((item: any, index: number) => ({
      id: item.id,
      interviewTime: item.interviewTime,
      warningLevel: item.warningLevel,
      warningStatus: item.warningStatus,
      sortRank: index + 1,
      resumeName: item.resume?.name,
      jobTitle: item.job?.title,
      jobUrgency: item.jobUrgencySnapshot,
      matchScore: item.matchScoreSnapshot,
    }));
  }
}

export default new InterviewService();
