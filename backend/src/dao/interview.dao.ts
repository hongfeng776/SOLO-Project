import { BaseDao } from './base.dao';
import { Interview, Resume, Job, InterviewOperationLog, InterviewCancelRecord, InterviewMessage, InterviewerAllocationLog, InterviewWarningLog } from '../models';
import InterviewModel from '../models/interview.model';
import { Op, Sequelize, BulkCreateOptions } from 'sequelize';
import { InterviewSessionStatus, InterviewResult, InterviewAbnormalScoreType, INTERVIEW_RECORD_VALIDATION_RULES, InterviewerStatus, WarningStatus, WarningLevel } from '../constants/recruitment.enum';
import dayjs from 'dayjs';

class InterviewDao extends BaseDao<InterviewModel> {
  constructor() {
    super(Interview);
  }

  async findWithRelations(options: any = {}) {
    return this.findAndCountAll({
      ...options,
      include: ['resume', 'job', 'cancelRecord'],
    });
  }

  async findByIdFull(id: number) {
    return this.findById(id, {
      include: ['resume', 'job', 'cancelRecord', 'operationLogs', 'messages'],
    });
  }

  async checkInterviewerTimeConflict(
    interviewer: string,
    startTime: Date,
    endTime: Date,
    excludeId?: number
  ): Promise<InterviewModel[]> {
    const where: any = {
      interviewer,
      sessionStatus: {
        [Op.in]: [
          InterviewSessionStatus.APPOINTED,
          InterviewSessionStatus.PENDING_INTERVIEW,
        ],
      },
      [Op.and]: [
        { interviewTime: { [Op.lt]: endTime } },
        { endTime: { [Op.gt]: startTime } },
      ],
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.findAll({ where });
  }

  async checkCandidateDuplicateAppointment(
    resumeId: number,
    jobId: number,
    excludeId?: number
  ): Promise<InterviewModel[]> {
    const where: any = {
      resumeId,
      jobId,
      sessionStatus: {
        [Op.in]: [
          InterviewSessionStatus.PENDING_APPOINT,
          InterviewSessionStatus.APPOINTED,
          InterviewSessionStatus.PENDING_INTERVIEW,
        ],
      },
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.findAll({ where });
  }

  async findOverduePendingInterviews(beforeTime: Date): Promise<InterviewModel[]> {
    return this.findAll({
      where: {
        sessionStatus: InterviewSessionStatus.PENDING_INTERVIEW,
        interviewTime: { [Op.lt]: beforeTime },
      },
      include: ['resume', 'job'],
    });
  }

  async findByInterviewerAndTimeRange(
    interviewer: string,
    startTime: Date,
    endTime: Date
  ): Promise<InterviewModel[]> {
    return this.findAll({
      where: {
        interviewer,
        sessionStatus: {
          [Op.in]: [
            InterviewSessionStatus.APPOINTED,
            InterviewSessionStatus.PENDING_INTERVIEW,
            InterviewSessionStatus.COMPLETED,
          ],
        },
        interviewTime: { [Op.between]: [startTime, endTime] },
      },
      include: ['resume', 'job'],
    });
  }

  async getAppointmentStats(startTime?: Date, endTime?: Date): Promise<any> {
    const dateWhere: any = {};
    if (startTime && endTime) {
      dateWhere.created_at = { [Op.between]: [startTime, endTime] };
    }
    const total = await this.count({ where: dateWhere });
    const successCount = await this.count({
      where: {
        ...dateWhere,
        sessionStatus: {
          [Op.in]: [
            InterviewSessionStatus.APPOINTED,
            InterviewSessionStatus.PENDING_INTERVIEW,
            InterviewSessionStatus.COMPLETED,
          ],
        },
      },
    });
    const cancelledCount = await this.count({
      where: {
        ...dateWhere,
        sessionStatus: InterviewSessionStatus.CANCELLED,
      },
    });
    const pendingCount = await this.count({
      where: {
        ...dateWhere,
        sessionStatus: InterviewSessionStatus.PENDING_APPOINT,
      },
    });
    const successRate = total > 0 ? Number(((successCount / total) * 100).toFixed(2)) : 0;
    return { total, successCount, cancelledCount, pendingCount, successRate };
  }

  async batchUpdateSortWeight(updates: { id: number; sortWeight: number }[]) {
    const cases = updates.map((u, idx) => `WHEN id = ${u.id} THEN ${u.sortWeight}`).join(' ');
    const ids = updates.map((u) => u.id);
    const sql = `UPDATE interview SET sort_weight = CASE ${cases} ELSE sort_weight END WHERE id IN (${ids.join(',')})`;
    return this.execute(sql);
  }

  async findOverdueForSupplement(options: { jobId?: number; interviewer?: string; days?: number } = {}): Promise<InterviewModel[]> {
    const { jobId, interviewer, days = INTERVIEW_RECORD_VALIDATION_RULES.OVERDUE_SUPPLEMENT_DAYS } = options;
    const beforeTime = dayjs().subtract(days, 'day').toDate();
    const where: any = {
      sessionStatus: InterviewSessionStatus.PENDING_INTERVIEW,
      interviewTime: { [Op.lt]: beforeTime },
      result: InterviewResult.PENDING,
    };
    if (jobId) where.jobId = jobId;
    if (interviewer) where.interviewer = interviewer;
    return this.findAll({
      where,
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async findPendingDecisionInterviews(options: { jobId?: number; interviewer?: string; startTime?: Date; endTime?: Date } = {}): Promise<InterviewModel[]> {
    const { jobId, interviewer, startTime, endTime } = options;
    const where: any = {
      sessionStatus: {
        [Op.in]: [InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.COMPLETED],
      },
      result: InterviewResult.PENDING_DECISION,
    };
    if (jobId) where.jobId = jobId;
    if (interviewer) where.interviewer = interviewer;
    if (startTime && endTime) {
      where.interviewTime = { [Op.between]: [startTime, endTime] };
    }
    return this.findAll({
      where,
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async getJobScoreStats(jobId: number, stage?: string): Promise<{ avgScore: number; count: number; scores: number[] }> {
    const where: any = {
      jobId,
      sessionStatus: InterviewSessionStatus.COMPLETED,
      result: { [Op.in]: [InterviewResult.PASS, InterviewResult.FAIL, InterviewResult.PENDING_DECISION] },
      score: { [Op.ne]: null },
    };
    if (stage) where.stage = stage;
    const records = await this.findAll({ where, attributes: ['score'] });
    const scores = records.map((r: any) => Number(r.score)).filter((s) => !isNaN(s));
    const count = scores.length;
    const avgScore = count > 0 ? Number((scores.reduce((a, b) => a + b, 0) / count).toFixed(1)) : 0;
    return { avgScore, count, scores };
  }

  async checkCandidateResultConflict(resumeId: number, excludeId?: number): Promise<any[]> {
    const where: any = {
      resumeId,
      sessionStatus: InterviewSessionStatus.COMPLETED,
      result: { [Op.in]: [InterviewResult.PASS, InterviewResult.FAIL] },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.findAll({
      where,
      attributes: ['id', 'jobId', 'stage', 'result', 'score'],
      include: ['job'],
      order: [['interviewTime', 'DESC']],
    });
  }

  async batchUpdateResultByIds(
    ids: number[],
    updates: {
      result: InterviewResult;
      sessionStatus?: InterviewSessionStatus;
      score?: number;
      evaluation?: string;
      feedback?: string;
      completeTime?: Date;
      lastSubmitTime?: Date;
    },
  ): Promise<[number, any]> {
    const where = { id: { [Op.in]: ids } };
    return this.update(updates as any, { where });
  }

  async findBySubmitLockToken(token: string): Promise<InterviewModel | null> {
    return this.findOne({ where: { submitLockToken: token } });
  }

  async getInterviewRecordStats(jobId?: number): Promise<any> {
    const dateWhere: any = {};
    if (jobId) dateWhere.jobId = jobId;
    const [total, completedCount, passCount, failCount, pendingDecisionCount, abnormalCount] = await Promise.all([
      this.count({ where: dateWhere }),
      this.count({ where: { ...dateWhere, sessionStatus: InterviewSessionStatus.COMPLETED } }),
      this.count({ where: { ...dateWhere, result: InterviewResult.PASS } }),
      this.count({ where: { ...dateWhere, result: InterviewResult.FAIL } }),
      this.count({ where: { ...dateWhere, result: InterviewResult.PENDING_DECISION } }),
      this.count({
        where: {
          ...dateWhere,
          abnormalScoreType: { [Op.in]: [InterviewAbnormalScoreType.TOO_HIGH, InterviewAbnormalScoreType.TOO_LOW, InterviewAbnormalScoreType.DEVIATION] },
        },
      }),
    ]);
    return {
      total,
      completedCount,
      passCount,
      failCount,
      pendingDecisionCount,
      abnormalCount,
      passRate: completedCount > 0 ? Number(((passCount / completedCount) * 100).toFixed(2)) : 0,
      abnormalRate: completedCount > 0 ? Number(((abnormalCount / completedCount) * 100).toFixed(2)) : 0,
    };
  }

  async countInterviewerDailyWorkload(interviewerId: number, date: Date): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();
    return this.count({
      where: {
        interviewerId,
        sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] },
        interviewTime: { [Op.between]: [startOfDay, endOfDay] },
      },
    });
  }

  async countInterviewerWeeklyWorkload(interviewerId: number, date: Date): Promise<number> {
    const startOfWeek = dayjs(date).startOf('week').toDate();
    const endOfWeek = dayjs(date).endOf('week').toDate();
    return this.count({
      where: {
        interviewerId,
        sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.COMPLETED] },
        interviewTime: { [Op.between]: [startOfWeek, endOfWeek] },
      },
    });
  }

  async findInterviewerSessions(interviewerId: number, options: { startTime?: Date; endTime?: Date; sessionStatuses?: InterviewSessionStatus[] } = {}): Promise<InterviewModel[]> {
    const where: any = { interviewerId };
    if (options.sessionStatuses) {
      where.sessionStatus = { [Op.in]: options.sessionStatuses };
    } else {
      where.sessionStatus = { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] };
    }
    if (options.startTime && options.endTime) {
      where.interviewTime = { [Op.between]: [options.startTime, options.endTime] };
    }
    return this.findAll({
      where,
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async findSessionsForBatchReplace(options: { interviewerId?: number; jobId?: number; sessionStatuses?: InterviewSessionStatus[]; ids?: number[] }): Promise<InterviewModel[]> {
    const where: any = {};
    if (options.ids && options.ids.length > 0) {
      where.id = { [Op.in]: options.ids };
    } else {
      if (options.interviewerId) where.interviewerId = options.interviewerId;
      if (options.jobId) where.jobId = options.jobId;
    }
    where.sessionStatus = { [Op.in]: options.sessionStatuses || [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] };
    return this.findAll({
      where,
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async getInterviewerWorkloadStats(interviewerId: number): Promise<any> {
    const now = new Date();
    const [daily, weekly, monthly] = await Promise.all([
      this.countInterviewerDailyWorkload(interviewerId, now),
      this.countInterviewerWeeklyWorkload(interviewerId, now),
      this.count({
        where: {
          interviewerId,
          sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.COMPLETED] },
          interviewTime: { [Op.gte]: dayjs(now).startOf('month').toDate() },
        },
      }),
    ]);
    const completedCount = await this.count({
      where: {
        interviewerId,
        sessionStatus: InterviewSessionStatus.COMPLETED,
        result: { [Op.in]: [InterviewResult.PASS, InterviewResult.FAIL] },
      },
    });
    const passCount = await this.count({
      where: {
        interviewerId,
        sessionStatus: InterviewSessionStatus.COMPLETED,
        result: InterviewResult.PASS,
      },
    });
    return {
      daily,
      weekly,
      monthly,
      completedCount,
      passCount,
      passRate: completedCount > 0 ? Number(((passCount / completedCount) * 100).toFixed(2)) : 0,
    };
  }

  async findWarningInterviews(options: {
    warningStatus?: WarningStatus;
    warningLevel?: WarningLevel;
    sessionStatuses?: InterviewSessionStatus[];
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: InterviewModel[]; count: number }> {
    const where: any = {};
    if (options.warningStatus) where.warningStatus = options.warningStatus;
    if (options.warningLevel) where.warningLevel = options.warningLevel;
    if (options.sessionStatuses) where.sessionStatus = { [Op.in]: options.sessionStatuses };
    if (!options.warningStatus && !options.warningLevel) {
      where.warningStatus = { [Op.ne]: WarningStatus.NORMAL };
    }
    return Interview.findAndCountAll({
      where,
      include: ['resume', 'job'],
      order: [[options.sortBy || 'interviewTime', options.sortOrder || 'ASC']],
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
  }

  async findInterviewsForWarningCheck(): Promise<InterviewModel[]> {
    const now = new Date();
    const approaching24h = dayjs(now).add(24, 'hour').toDate();
    return Interview.findAll({
      where: {
        sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] },
        interviewTime: { [Op.lte]: approaching24h, [Op.gt]: now },
        warningStatus: { [Op.in]: [WarningStatus.NORMAL, WarningStatus.APPROACHING] },
      },
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async findOverdueInterviewsForWarning(): Promise<InterviewModel[]> {
    const now = new Date();
    return Interview.findAll({
      where: {
        sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] },
        interviewTime: { [Op.lt]: now },
        warningStatus: { [Op.ne]: WarningStatus.HANDLED },
      },
      include: ['resume', 'job'],
      order: [['interviewTime', 'ASC']],
    });
  }

  async getWarningStats(): Promise<any> {
    const [total, approachingCount, overdueCount, handledCount, normalCount] = await Promise.all([
      Interview.count({ where: { sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW] } } }),
      Interview.count({ where: { warningStatus: WarningStatus.APPROACHING } }),
      Interview.count({ where: { warningStatus: WarningStatus.OVERDUE } }),
      Interview.count({ where: { warningStatus: WarningStatus.HANDLED } }),
      Interview.count({ where: { warningStatus: WarningStatus.NORMAL } }),
    ]);
    return { total, approachingCount, overdueCount, handledCount, normalCount };
  }

  async getOverdueRateStats(): Promise<any> {
    const now = new Date();
    const monthStart = dayjs(now).startOf('month').toDate();
    const [totalActive, overdueTotal, overdueThisMonth, handledThisMonth, falseAlarmCount] = await Promise.all([
      Interview.count({
        where: { sessionStatus: { [Op.in]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.COMPLETED] } },
      }),
      Interview.count({ where: { warningStatus: { [Op.ne]: WarningStatus.NORMAL } } }),
      InterviewWarningLog.count({
        where: {
          action: 'auto_trigger',
          warningLevel: WarningLevel.OVERDUE,
          created_at: { [Op.gte]: monthStart },
        },
      }),
      InterviewWarningLog.count({
        where: {
          action: { [Op.in]: ['handle_overdue', 'batch_handle'] },
          created_at: { [Op.gte]: monthStart },
        },
      }),
      InterviewWarningLog.count({ where: { falseAlarmVerified: true } }),
    ]);
    return {
      totalActive,
      overdueTotal,
      overdueThisMonth,
      handledThisMonth,
      falseAlarmCount,
      overdueRate: totalActive > 0 ? Number(((overdueTotal / totalActive) * 100).toFixed(2)) : 0,
      handleRate: overdueThisMonth > 0 ? Number(((handledThisMonth / overdueThisMonth) * 100).toFixed(2)) : 0,
    };
  }
}

export default new InterviewDao();

export class InterviewOperationLogDao extends BaseDao<any> {
  constructor() {
    super(InterviewOperationLog);
  }

  async findByInterviewId(interviewId: number) {
    return this.findAll({
      where: { interviewId },
      order: [['created_at', 'DESC']],
    });
  }

  async batchCreate(logs: any[], options?: BulkCreateOptions<any>) {
    return InterviewOperationLog.bulkCreate(logs, options as any);
  }
}

export class InterviewCancelRecordDao extends BaseDao<any> {
  constructor() {
    super(InterviewCancelRecord);
  }

  async findByInterviewId(interviewId: number) {
    return this.findOne({ where: { interviewId } });
  }
}

export class InterviewMessageDao extends BaseDao<any> {
  constructor() {
    super(InterviewMessage);
  }

  async findByInterviewId(interviewId: number) {
    return this.findAll({
      where: { interviewId },
      order: [['created_at', 'DESC']],
    });
  }

  async batchCreate(messages: any[], options?: BulkCreateOptions<any>) {
    return InterviewMessage.bulkCreate(messages, options as any);
  }
}

export const interviewOperationLogDao = new InterviewOperationLogDao();
export const interviewCancelRecordDao = new InterviewCancelRecordDao();
export const interviewMessageDao = new InterviewMessageDao();

export class InterviewerAllocationLogDao extends BaseDao<any> {
  constructor() {
    super(InterviewerAllocationLog);
  }

  async findByInterviewId(interviewId: number) {
    return this.findAll({
      where: { interviewId },
      include: ['interviewer', 'previousInterviewer', 'operator'],
      order: [['created_at', 'DESC']],
    });
  }

  async findByInterviewerId(interviewerId: number, options: { limit?: number } = {}) {
    return this.findAll({
      where: { interviewerId },
      include: ['interview', 'operator'],
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
    });
  }

  async findByOperatorId(operatorId: number, options: { limit?: number } = {}) {
    return this.findAll({
      where: { operatorId },
      include: ['interview', 'interviewer'],
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
    });
  }
}

export class InterviewWarningLogDao extends BaseDao<any> {
  constructor() {
    super(InterviewWarningLog);
  }

  async findByInterviewId(interviewId: number) {
    return this.findAll({
      where: { interviewId },
      include: ['interview', 'handler', 'operator'],
      order: [['created_at', 'DESC']],
    });
  }

  async findByHandlerId(handlerId: number, options: { limit?: number } = {}) {
    return this.findAll({
      where: { handlerId },
      include: ['interview', 'operator'],
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
    });
  }

  async findByOperatorId(operatorId: number, options: { limit?: number } = {}) {
    return this.findAll({
      where: { operatorId },
      include: ['interview', 'handler'],
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
    });
  }

  async findFalseAlarms(options: { limit?: number } = {}) {
    return this.findAll({
      where: { falseAlarmVerified: true },
      include: ['interview', 'handler', 'operator'],
      order: [['created_at', 'DESC']],
      limit: options.limit || 50,
    });
  }

  async batchCreate(logs: any[], options?: BulkCreateOptions<any>) {
    return InterviewWarningLog.bulkCreate(logs, options as any);
  }
}

export const interviewWarningLogDao = new InterviewWarningLogDao();

export const interviewerAllocationLogDao = new InterviewerAllocationLogDao();
