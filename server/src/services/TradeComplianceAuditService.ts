import { Op } from 'sequelize';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

const LARGE_AMOUNT_THRESHOLD = 500000;
const TIMEOUT_THRESHOLD_MINUTES = 120;

function generateAuditNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TCA${dateStr}${random}`;
}

function determineRiskCategory(amount: number, riskScore: number): { category: string; reviewType: string } {
  if (riskScore >= 70 || amount >= LARGE_AMOUNT_THRESHOLD * 2) {
    return { category: 'abnormal', reviewType: 'manual' };
  }
  if (amount >= LARGE_AMOUNT_THRESHOLD) {
    return { category: 'large_amount', reviewType: 'manual' };
  }
  return { category: 'normal', reviewType: 'auto' };
}

function calculateComplianceDeadline(): Date {
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + TIMEOUT_THRESHOLD_MINUTES);
  return deadline;
}

function runConsistencyCheck(audit: any, action: string, auditStatus: string): {
  passed: boolean;
  score: number;
  issues: Array<{ field: string; rule: string; message: string; severity: 'high' | 'medium' | 'low'; suggestion?: string }>;
} {
  const issues: Array<{ field: string; rule: string; message: string; severity: 'high' | 'medium' | 'low'; suggestion?: string }> = [];

  if (action === 'approve' && audit.risk_score >= 80 && auditStatus === 'approved') {
    issues.push({
      field: 'risk_score',
      rule: 'HIGH_RISK_AUTO_APPROVE',
      message: '高风险订单不应被通过，风险评分超过阈值',
      severity: 'high',
      suggestion: '建议驳回并标注具体违规原因',
    });
  }

  if (action === 'reject' && (!audit.violation_reasons || audit.violation_reasons.length === 0)) {
    issues.push({
      field: 'violation_reasons',
      rule: 'REJECT_WITHOUT_REASON',
      message: '驳回订单必须标注具体违规原因',
      severity: 'high',
      suggestion: '请补充违规原因后重新提交',
    });
  }

  if (action === 'approve' && audit.risk_category === 'abnormal') {
    issues.push({
      field: 'risk_category',
      rule: 'ABNORMAL_TRADE_APPROVE',
      message: '异常交易通过审核需额外确认',
      severity: 'medium',
      suggestion: '请确认已充分审核异常交易细节',
    });
  }

  if (action === 'approve' && audit.trade_amount >= LARGE_AMOUNT_THRESHOLD && audit.review_type !== 'manual') {
    issues.push({
      field: 'review_type',
      rule: 'LARGE_AMOUNT_AUTO_REVIEW',
      message: '大额交易必须经过人工审核',
      severity: 'high',
      suggestion: '请转为人工审核流程',
    });
  }

  const score = Math.max(0, 100 - issues.reduce((acc, issue) => {
    if (issue.severity === 'high') return acc + 40;
    if (issue.severity === 'medium') return acc + 20;
    return acc + 10;
  }, 0));

  return { passed: issues.filter(i => i.severity === 'high').length === 0, score, issues };
}

class TradeComplianceAuditService {
  async getAuditById(id: number) {
    const audit = await db.TradeComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Trade compliance audit not found');
    }
    return audit;
  }

  async getAuditList(params: {
    page: number;
    pageSize: number;
    complianceStatus?: string;
    riskCategory?: string;
    reviewType?: string;
    tradeType?: string;
    keyword?: string;
    timeoutOnly?: boolean;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    violationType?: string;
  }) {
    const { page, pageSize, complianceStatus, riskCategory, reviewType, tradeType, keyword, timeoutOnly, startDate, endDate, minAmount, maxAmount, violationType } = params;
    const where: any = {};

    if (complianceStatus) {
      where.compliance_status = complianceStatus;
    }
    if (riskCategory) {
      where.risk_category = riskCategory;
    }
    if (reviewType) {
      where.review_type = reviewType;
    }
    if (tradeType) {
      where.trade_type = tradeType;
    }
    if (timeoutOnly) {
      where.timeout_flag = true;
    }
    if (keyword) {
      where[Op.or] = [
        { audit_no: { [Op.like]: `%${keyword}%` } },
        { trade_no: { [Op.like]: `%${keyword}%` } },
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { stock_code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [startDate, endDate] };
    }
    if (minAmount !== undefined) {
      where.trade_amount = { ...where.trade_amount, [Op.gte]: minAmount };
    }
    if (maxAmount !== undefined) {
      where.trade_amount = { ...where.trade_amount, [Op.lte]: maxAmount };
    }
    if (violationType) {
      where.violation_types = { [Op.contains]: [violationType] };
    }

    const { rows, count } = await db.TradeComplianceAudit.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['timeout_flag', 'DESC'], ['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getAuditLogs(auditId: number) {
    const audit = await db.TradeComplianceAudit.findByPk(auditId);
    if (!audit) {
      throw new AppError(404, 'Trade compliance audit not found');
    }
    return db.TradeComplianceAuditLog.findAll({
      where: { audit_id: auditId },
      order: [['created_at', 'ASC']],
    });
  }

  async preCheck(id: number, reviewerId: number) {
    const audit = await db.TradeComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Trade compliance audit not found');
    }

    const result: any = {
      canReview: true,
      permissionValid: true,
      orderStatusValid: true,
      timelinessValid: true,
      autoReviewable: false,
      requireManualReview: false,
      duplicateReviewBlocked: false,
      messages: [],
      warnings: [],
    };

    const reviewer = await db.User.findByPk(reviewerId);
    if (!reviewer) {
      result.permissionValid = false;
      result.canReview = false;
      result.messages.push('审核人员不存在或权限不足');
    }

    if (['dealed', 'cancelled'].includes(audit.order_status)) {
      result.orderStatusValid = false;
      result.canReview = false;
      result.messages.push(`订单状态为${audit.order_status === 'dealed' ? '已成交' : '已撤单'}，禁止重复审核`);
      result.duplicateReviewBlocked = true;
      result.duplicateReason = audit.order_status === 'dealed' ? '订单已成交' : '订单已撤单';
    }

    if (['approved', 'rejected'].includes(audit.compliance_status)) {
      result.duplicateReviewBlocked = true;
      result.canReview = false;
      result.messages.push('该订单已完成合规审核，禁止重复审核');
      result.duplicateReason = `合规状态为${audit.compliance_status === 'approved' ? '已通过' : '已驳回'}`;
    }

    const { category, reviewType } = determineRiskCategory(audit.trade_amount, audit.risk_score);
    result.autoReviewable = category === 'normal';
    result.requireManualReview = category !== 'normal';

    if (result.requireManualReview) {
      result.warnings.push(category === 'large_amount' ? '大额交易需人工审核' : '异常交易需人工审核');
    }

    if (audit.compliance_deadline) {
      const remaining = (new Date(audit.compliance_deadline).getTime() - Date.now()) / 60000;
      result.timeRemainingMinutes = Math.max(0, Math.round(remaining));
      if (remaining <= 0) {
        result.timelinessValid = false;
        result.warnings.push('该订单已超时未审核，请优先处理');
      } else if (remaining < 30) {
        result.warnings.push(`该订单审核时效即将到期，剩余${Math.round(remaining)}分钟`);
      }
      result.timeoutMinutes = TIMEOUT_THRESHOLD_MINUTES;
    }

    await db.TradeComplianceAuditLog.create({
      audit_id: audit.id,
      audit_no: audit.audit_no,
      action: 'pre_check',
      operator_id: reviewerId,
      operator_name: reviewer?.dataValues?.username || '',
      detail: result,
    });

    return result;
  }

  async createAudit(data: any) {
    const audit_no = generateAuditNo();
    const { category, reviewType } = determineRiskCategory(data.trade_amount || 0, data.risk_score || 0);
    const complianceDeadline = calculateComplianceDeadline();

    const auditData: any = {
      ...data,
      audit_no,
      compliance_status: reviewType === 'auto' ? 'auto_approved' : 'manual_pending',
      review_type: reviewType,
      risk_category: category,
      compliance_deadline: complianceDeadline,
      synced_to_trade: false,
      synced_to_customer: false,
      timeout_flag: false,
    };

    const audit = await db.TradeComplianceAudit.create(auditData);

    await db.TradeComplianceAuditLog.create({
      audit_id: audit.id,
      audit_no: audit.audit_no,
      action: reviewType === 'auto' ? 'auto_approve' : 'manual_review',
      operator_id: 0,
      operator_name: 'system',
      detail: { category, reviewType, autoDecision: reviewType === 'auto' },
    });

    if (reviewType === 'auto') {
      await db.TradeComplianceAudit.update(
        {
          compliance_status: 'auto_approved',
          review_at: new Date(),
          review_opinion: '普通交易自动审核通过',
          synced_to_trade: true,
          synced_to_customer: true,
        },
        { where: { id: audit.id } },
      );
    }

    return db.TradeComplianceAudit.findByPk(audit.id);
  }

  async approveAudit(id: number, reviewerId: number, opinion: string) {
    const audit = await db.TradeComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Trade compliance audit not found');
    }

    if (['approved', 'rejected', 'auto_approved'].includes(audit.compliance_status)) {
      throw new AppError(400, '该订单已完成合规审核，禁止重复审核');
    }

    const consistencyCheck = runConsistencyCheck(audit, 'approve', 'approved');

    if (!consistencyCheck.passed) {
      await db.TradeComplianceAuditLog.create({
        audit_id: audit.id,
        audit_no: audit.audit_no,
        action: 'violation_intercept',
        operator_id: reviewerId,
        operator_name: '',
        detail: { attemptedAction: 'approve' },
        consistency_check: consistencyCheck,
        violation_intercepted: true,
        violation_message: '违规通过审核已被拦截，请检查审核结果与合规规则的一致性',
      });
      throw new AppError(400, '违规通过审核已被拦截，请检查审核结果与合规规则的一致性');
    }

    const reviewer = await db.User.findByPk(reviewerId);

    await db.TradeComplianceAudit.update(
      {
        compliance_status: 'approved',
        reviewer_id: reviewerId,
        reviewer_name: reviewer?.dataValues?.username || '',
        review_opinion: opinion,
        review_at: new Date(),
        synced_to_trade: true,
        synced_to_customer: true,
      },
      { where: { id } },
    );

    await db.TradeComplianceAuditLog.create({
      audit_id: audit.id,
      audit_no: audit.audit_no,
      action: 'approve',
      operator_id: reviewerId,
      operator_name: reviewer?.dataValues?.username || '',
      detail: { opinion, fromStatus: audit.compliance_status },
      consistency_check: consistencyCheck,
    });

    return db.TradeComplianceAudit.findByPk(id);
  }

  async rejectAudit(id: number, reviewerId: number, opinion: string, violationTypes: string[], violationReasons: string[]) {
    const audit = await db.TradeComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Trade compliance audit not found');
    }

    if (['approved', 'rejected', 'auto_approved'].includes(audit.compliance_status)) {
      throw new AppError(400, '该订单已完成合规审核，禁止重复审核');
    }

    const consistencyCheck = runConsistencyCheck(audit, 'reject', 'rejected');

    if (consistencyCheck.issues.some(i => i.rule === 'REJECT_WITHOUT_REASON')) {
      if (!violationReasons || violationReasons.length === 0) {
        await db.TradeComplianceAuditLog.create({
          audit_id: audit.id,
          audit_no: audit.audit_no,
          action: 'violation_intercept',
          operator_id: reviewerId,
          operator_name: '',
          detail: { attemptedAction: 'reject' },
          consistency_check: consistencyCheck,
          violation_intercepted: true,
          violation_message: '无故驳回审核已被拦截，驳回订单必须标注具体违规原因',
        });
        throw new AppError(400, '无故驳回审核已被拦截，驳回订单必须标注具体违规原因');
      }
    }

    const reviewer = await db.User.findByPk(reviewerId);

    await db.TradeComplianceAudit.update(
      {
        compliance_status: 'returned',
        reviewer_id: reviewerId,
        reviewer_name: reviewer?.dataValues?.username || '',
        review_opinion: opinion,
        violation_types: violationTypes || [],
        violation_reasons: violationReasons || [],
        review_at: new Date(),
        synced_to_trade: true,
        synced_to_customer: true,
      },
      { where: { id } },
    );

    await db.TradeComplianceAuditLog.create({
      audit_id: audit.id,
      audit_no: audit.audit_no,
      action: 'reject',
      operator_id: reviewerId,
      operator_name: reviewer?.dataValues?.username || '',
      detail: { opinion, violationTypes, violationReasons, fromStatus: audit.compliance_status },
      consistency_check: consistencyCheck,
    });

    return db.TradeComplianceAudit.findByPk(id);
  }

  async batchAudit(ids: number[], reviewerId: number, auditStatus: 'approved' | 'rejected', opinion: string, violationTypes?: string[], violationReasons?: string[]) {
    const results: any = { total: ids.length, success: 0, failed: 0, failedItems: [] };

    for (const id of ids) {
      try {
        if (auditStatus === 'approved') {
          await this.approveAudit(id, reviewerId, opinion);
        } else {
          await this.rejectAudit(id, reviewerId, opinion, violationTypes || [], violationReasons || []);
        }
        results.success++;
      } catch (err: any) {
        results.failed++;
        const audit = await db.TradeComplianceAudit.findByPk(id);
        results.failedItems.push({
          id,
          tradeNo: audit?.dataValues?.trade_no || '',
          reason: err.message || '审核失败',
        });
      }
    }

    await db.TradeComplianceAuditLog.create({
      audit_id: ids[0],
      audit_no: '',
      action: auditStatus === 'approved' ? 'batch_approve' : 'batch_reject',
      operator_id: reviewerId,
      operator_name: '',
      detail: { ids, auditStatus, opinion, violationTypes, violationReasons, results },
    });

    return results;
  }

  async batchPreview(ids: number[]) {
    const audits = await db.TradeComplianceAudit.findAll({ where: { id: { [Op.in]: ids } } });

    const byAmount = { '<50万': 0, '50-100万': 0, '>100万': 0 };
    const byTradeType: Record<string, number> = {};
    const byRiskCategory: Record<string, number> = { normal: 0, large_amount: 0, abnormal: 0 };
    let canBatchApprove = 0;
    let canBatchReject = 0;
    const blockedItems: Array<{ id: number; tradeNo: string; reason: string }> = [];

    for (const audit of audits) {
      const a = audit.dataValues;
      if (a.trade_amount < 500000) byAmount['<50万']++;
      else if (a.trade_amount < 1000000) byAmount['50-100万']++;
      else byAmount['>100万']++;

      byTradeType[a.trade_type] = (byTradeType[a.trade_type] || 0) + 1;
      byRiskCategory[a.risk_category] = (byRiskCategory[a.risk_category] || 0) + 1;

      if (['approved', 'rejected', 'auto_approved'].includes(a.compliance_status)) {
        blockedItems.push({ id: a.id, tradeNo: a.trade_no, reason: '已审核，禁止重复审核' });
      } else if (['dealed', 'cancelled'].includes(a.order_status)) {
        blockedItems.push({ id: a.id, tradeNo: a.trade_no, reason: '订单已完结/已撤单' });
      } else {
        canBatchApprove++;
        canBatchReject++;
      }
    }

    return {
      totalSelected: ids.length,
      byAmount,
      byTradeType,
      byRiskCategory,
      canBatchApprove,
      canBatchReject,
      blockedItems,
    };
  }

  async markTimeout() {
    const now = new Date();
    const [updatedCount] = await db.TradeComplianceAudit.update(
      { timeout_flag: true, timeout_reminded_at: now },
      {
        where: {
          compliance_status: { [Op.in]: ['pending', 'manual_pending'] },
          timeout_flag: false,
          compliance_deadline: { [Op.lt]: now },
        },
      },
    );

    const timeoutAudits = await db.TradeComplianceAudit.findAll({
      where: { timeout_flag: true, timeout_reminded_at: now },
    });

    for (const audit of timeoutAudits) {
      await db.TradeComplianceAuditLog.create({
        audit_id: audit.id,
        audit_no: audit.audit_no,
        action: 'timeout_remind',
        operator_id: 0,
        operator_name: 'system',
        detail: { message: '超时未审核订单自动置顶提醒' },
      });
    }

    return { marked: updatedCount };
  }

  async getStats() {
    const total = await db.TradeComplianceAudit.count();
    const totalPending = await db.TradeComplianceAudit.count({ where: { compliance_status: 'pending' } });
    const totalAutoApproved = await db.TradeComplianceAudit.count({ where: { compliance_status: 'auto_approved' } });
    const totalManualPending = await db.TradeComplianceAudit.count({ where: { compliance_status: 'manual_pending' } });
    const totalApproved = await db.TradeComplianceAudit.count({ where: { compliance_status: 'approved' } });
    const totalRejected = await db.TradeComplianceAudit.count({ where: { compliance_status: 'returned' } });
    const timeoutCount = await db.TradeComplianceAudit.count({ where: { timeout_flag: true } });

    const reviewedAudits = await db.TradeComplianceAudit.findAll({
      where: { compliance_status: { [Op.in]: ['approved', 'rejected', 'returned', 'auto_approved'] }, review_at: { [Op.ne]: null } },
      attributes: ['created_at', 'review_at'],
    });

    let totalReviewMinutes = 0;
    for (const a of reviewedAudits) {
      if (a.dataValues.review_at && a.dataValues.created_at) {
        totalReviewMinutes += (new Date(a.dataValues.review_at).getTime() - new Date(a.dataValues.created_at).getTime()) / 60000;
      }
    }
    const avgReviewMinutes = reviewedAudits.length > 0 ? Math.round(totalReviewMinutes / reviewedAudits.length) : 0;

    const complianceRate = total > 0 ? Math.round(((totalApproved + totalAutoApproved) / total) * 100) / 100 : 0;

    const byRiskCategory: Record<string, number> = {};
    const byViolationType: Record<string, number> = {};

    const riskGroup = await db.TradeComplianceAudit.findAll({
      attributes: ['risk_category', [db.sequelize.fn('COUNT', '*'), 'count']],
      group: ['risk_category'],
    });
    for (const item of riskGroup) {
      byRiskCategory[item.dataValues.risk_category] = Number(item.dataValues.count);
    }

    return {
      totalPending,
      totalAutoApproved,
      totalManualPending,
      totalApproved,
      totalRejected,
      totalReturned: totalRejected,
      timeoutCount,
      avgReviewMinutes,
      complianceRate,
      byRiskCategory,
      byViolationType,
    };
  }
}

export default new TradeComplianceAuditService();
