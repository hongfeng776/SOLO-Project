import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';

export interface FullTraceResult {
  submit_info: any;
  initial_review: any;
  final_review: any;
  resubmit_timeline: any[];
  timeout_alerts: any[];
}

export interface AuditStatsResult {
  status_counts: Record<number, number>;
  avg_review_hours: number;
  reject_rate: number;
  timeout_rate: number;
  total: number;
}

class GoodsAuditTraceService {
  private readonly goodsAuditMainDao = daos.goodsAuditMainDao;
  private readonly goodsAuditTimeoutDao = daos.goodsAuditTimeoutDao;
  private readonly goodsAuditResubmitDao = daos.goodsAuditResubmitDao;

  async getAuditFullTrace(auditId: number): Promise<FullTraceResult> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;

    const submitInfo = {
      audit_no: auditData.audit_no,
      goods_id: auditData.goods_id,
      merchant_id: auditData.merchant_id,
      risk_level: auditData.risk_level,
      merchant_credit_score: auditData.merchant_credit_score,
      submit_at: auditData.submit_at,
      status: auditData.status,
    };

    const initialReview = auditData.initial_result
      ? {
          initial_reviewer_id: auditData.initial_reviewer_id,
          initial_result: auditData.initial_result,
          initial_remark: auditData.initial_remark,
          initial_reviewed_at: auditData.initial_reviewed_at,
        }
      : null;

    const finalReview = auditData.final_result
      ? {
          final_reviewer_id: auditData.final_reviewer_id,
          final_result: auditData.final_result,
          final_remark: auditData.final_remark,
          final_reviewed_at: auditData.final_reviewed_at,
          reject_reasons: auditData.reject_reasons_json,
        }
      : null;

    const resubmitRecords = await this.goodsAuditResubmitDao.findByAuditId(auditId);
    const resubmitTimeline = resubmitRecords.map((r: any) => {
      const data = (r as any).toJSON ? (r as any).toJSON() : r;
      return {
        resubmit_no: data.resubmit_no,
        previous_status: data.previous_status,
        change_fields: data.change_fields,
        supplement_materials_json: data.supplement_materials_json,
        submitter_id: data.submitter_id,
        submit_at: data.submit_at,
      };
    });

    const timeoutRecords = await this.goodsAuditTimeoutDao.findByAuditId(auditId);
    const timeoutAlerts = timeoutRecords.map((t: any) => {
      const data = (t as any).toJSON ? (t as any).toJSON() : t;
      return {
        timeout_type: data.timeout_type,
        deadline: data.deadline,
        actual_time: data.actual_time,
        status: data.status,
        handler_id: data.handler_id,
        handle_remark: data.handle_remark,
      };
    });

    return {
      submit_info: submitInfo,
      initial_review: initialReview,
      final_review: finalReview,
      resubmit_timeline: resubmitTimeline,
      timeout_alerts: timeoutAlerts,
    };
  }

  async checkDuplicateSubmit(goodsId: number): Promise<{ is_duplicate: boolean; active_audits: any[] }> {
    const pendingAudits = await this.goodsAuditMainDao.findPendingByGoodsId(goodsId);
    const activeAudits = pendingAudits.map((a: any) => {
      const data = (a as any).toJSON ? (a as any).toJSON() : a;
      return {
        id: data.id,
        audit_no: data.audit_no,
        status: data.status,
        submit_at: data.submit_at,
      };
    });

    return {
      is_duplicate: activeAudits.length > 0,
      active_audits: activeAudits,
    };
  }

  async checkAuditTimeliness(auditId: number): Promise<{
    is_timely: boolean;
    timeout_hours: number;
    actual_hours: number | null;
  }> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    const timeoutHours = auditData.timeout_hours ?? 48;
    const submitAt = auditData.submit_at ? new Date(auditData.submit_at) : null;

    if (!submitAt) {
      return { is_timely: true, timeout_hours: timeoutHours, actual_hours: null };
    }

    const completedAt =
      auditData.final_reviewed_at
        ? new Date(auditData.final_reviewed_at)
        : auditData.initial_reviewed_at
        ? new Date(auditData.initial_reviewed_at)
        : null;

    let actualHours: number | null = null;
    if (completedAt) {
      actualHours = (completedAt.getTime() - submitAt.getTime()) / (1000 * 60 * 60);
    } else {
      actualHours = (Date.now() - submitAt.getTime()) / (1000 * 60 * 60);
    }

    return {
      is_timely: actualHours !== null ? actualHours <= timeoutHours : true,
      timeout_hours: timeoutHours,
      actual_hours: actualHours !== null ? Math.round(actualHours * 100) / 100 : null,
    };
  }

  async getTimeoutAlerts(): Promise<any[]> {
    const unhandled = await this.goodsAuditTimeoutDao.findUnhandled();
    return unhandled.map((t: any) => {
      const data = (t as any).toJSON ? (t as any).toJSON() : t;
      return {
        id: data.id,
        audit_id: data.audit_id,
        goods_id: data.goods_id,
        merchant_id: data.merchant_id,
        timeout_type: data.timeout_type,
        deadline: data.deadline,
        status: data.status,
      };
    });
  }

  async getAuditStats(): Promise<AuditStatsResult> {
    const allAudits = await this.goodsAuditMainDao.findAll();
    const total = allAudits.length;

    const statusCounts: Record<number, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0,
    };

    let totalReviewHours = 0;
    let reviewedCount = 0;
    let rejectCount = 0;
    let timeoutCount = 0;

    for (const audit of allAudits) {
      const data = (audit as any).toJSON ? (audit as any).toJSON() : audit;

      statusCounts[data.status ?? 0] = (statusCounts[data.status ?? 0] || 0) + 1;

      if (data.submit_at && data.final_reviewed_at) {
        const hours =
          (new Date(data.final_reviewed_at).getTime() - new Date(data.submit_at).getTime()) /
          (1000 * 60 * 60);
        totalReviewHours += hours;
        reviewedCount++;
      }

      if ([2, 4].includes(data.status)) {
        rejectCount++;
      }

      if (data.timeout_flag === 1) {
        timeoutCount++;
      }
    }

    return {
      status_counts: statusCounts,
      avg_review_hours: reviewedCount > 0 ? Math.round((totalReviewHours / reviewedCount) * 100) / 100 : 0,
      reject_rate: total > 0 ? Math.round((rejectCount / total) * 10000) / 100 : 0,
      timeout_rate: total > 0 ? Math.round((timeoutCount / total) * 10000) / 100 : 0,
      total,
    };
  }
}

export const goodsAuditTraceService = new GoodsAuditTraceService();
export default GoodsAuditTraceService;
