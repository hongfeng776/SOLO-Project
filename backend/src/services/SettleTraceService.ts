import { Op } from 'sequelize';
import { daos } from '../dao';
import { SettleApplyOrder } from '../models/SettleApplyOrder';
import { SettleDeductDetail } from '../models/SettleDeductDetail';
import { SettleAuditLog, AuditAction } from '../models/SettleAuditLog';
import { SettleTransferVoucher } from '../models/SettleTransferVoucher';

export interface TimelineItem {
  time: Date;
  type: string;
  title: string;
  description: string;
  operator?: string;
  data?: any;
}

export interface FullTraceData {
  applyOrder: SettleApplyOrder | null;
  deductDetails: SettleDeductDetail[];
  auditLogs: SettleAuditLog[];
  transferVoucher: SettleTransferVoucher | null;
  relatedOrders: any[];
  relatedFundSettlements: any[];
  timeline: TimelineItem[];
}

export interface ConsistencyCheckResult {
  pass: boolean;
  score: number;
  checks: Array<{
    name: string;
    key: string;
    pass: boolean;
    message: string;
    actual?: any;
    expected?: any;
  }>;
  issues: string[];
}

class SettleTraceService {
  readonly settleApplyOrderDao = daos.settleApplyOrderDao;
  readonly settleDeductDetailDao = daos.settleDeductDetailDao;
  readonly settleAuditLogDao = daos.settleAuditLogDao;
  readonly settleTransferVoucherDao = daos.settleTransferVoucherDao;
  readonly orderDao = daos.orderDao;
  readonly fundSettlementDao = daos.fundSettlementDao;
  readonly merchantDao = daos.merchantDao;

  buildTimeline(
    applyOrder: SettleApplyOrder,
    auditLogs: SettleAuditLog[],
    transferVoucher: SettleTransferVoucher | null,
    merchantName: string
  ): TimelineItem[] {
    const timeline: TimelineItem[] = [];
    const o = applyOrder as any;

    timeline.push({
      time: o.created_at,
      type: 'apply',
      title: '提交结算申请',
      description: `商家${merchantName}提交结算申请，金额¥${o.actual_settle_amount}`,
      data: { applyNo: o.apply_no, amount: o.actual_settle_amount },
    });

    for (const log of auditLogs) {
      const l = log as any;
      timeline.push({
        time: l.created_at,
        type: String(l.audit_action),
        title: l.audit_action_label || this.getAuditActionName(l.audit_action),
        description: this.buildAuditLogDescription(l),
        operator: l.operator_name,
        data: {
          oldStatus: l.before_status,
          newStatus: l.after_status,
          auditDetail: l.audit_detail,
        },
      });
    }

    if (transferVoucher) {
      const tv = transferVoucher as any;
      if (tv.transfer_time) {
        timeline.push({
          time: tv.transfer_time,
          type: 'transfer_start',
          title: '发起转账',
          description: `财务人员${tv.operator_name || ''}发起转账，金额¥${tv.transfer_amount}`,
          operator: tv.operator_name,
          data: { transferNo: tv.transfer_no, amount: tv.transfer_amount },
        });
      }
      if (o.arrive_time) {
        timeline.push({
          time: o.arrive_time,
          type: 'transfer_success',
          title: '转账到账',
          description: `转账已到账，金额¥${tv.transfer_amount || o.actual_settle_amount}，银行流水号：${tv.transfer_no || '无'}`,
          data: { transferNo: tv.transfer_no, amount: tv.transfer_amount || o.actual_settle_amount },
        });
      }
      if (o.apply_status === 6) {
        timeline.push({
          time: tv.created_at,
          type: 'transfer_fail',
          title: '转账失败',
          description: `转账失败：${tv.remark || '未知原因'}`,
          operator: tv.operator_name,
          data: { failReason: tv.remark },
        });
      }
    }

    timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return timeline;
  }

  buildAuditLogDescription(log: any): string {
    let desc = log.audit_action_label || this.getAuditActionName(log.audit_action);
    const statusMap: Record<number, string> = {
      1: '待审核',
      2: '审核通过',
      3: '审核驳回',
      4: '打款中',
      5: '已到账',
      6: '打款失败',
    };
    if (log.before_status !== undefined && log.after_status !== undefined && log.before_status !== null) {
      desc += `（${statusMap[log.before_status] || '未知'} → ${statusMap[log.after_status] || '未知'}）`;
    }
    if (log.audit_detail) {
      desc += ` | ${log.audit_detail}`;
    }
    return desc;
  }

  getAuditActionName(action?: number): string {
    const names: Record<number, string> = {
      1: '提交申请',
      2: '审核通过',
      3: '审核驳回',
      4: '发起打款',
      5: '确认到账',
      6: '打款失败重试',
      7: '取消申请',
    };
    return names[action || 0] || '操作';
  }

  async getFullTrace(applyId: number): Promise<FullTraceData> {
    const applyOrder = await this.settleApplyOrderDao.findById(applyId);

    if (!applyOrder) {
      return {
        applyOrder: null,
        deductDetails: [],
        auditLogs: [],
        transferVoucher: null,
        relatedOrders: [],
        relatedFundSettlements: [],
        timeline: [],
      };
    }

    const o = applyOrder as any;

    const deductDetails = await this.settleDeductDetailDao.findAll({
      where: { settle_apply_id: applyId },
      order: [['created_at', 'ASC']],
    } as any);

    const auditLogs = await this.settleAuditLogDao.findAll({
      where: { settle_apply_id: applyId },
      order: [['created_at', 'ASC']],
    } as any);

    const transferVoucher = await this.settleTransferVoucherDao.findOne({
      where: { settle_apply_id: applyId },
    } as any);

    const start = new Date(o.period_start_date);
    const end = new Date(o.period_end_date);
    const nextDay = new Date(end);
    nextDay.setDate(nextDay.getDate() + 1);

    const relatedOrders = await this.orderDao.findAll({
      where: {
        merchant_id: o.merchant_id,
        status: 3,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
      attributes: ['id', 'order_no', 'pay_amount', 'total_amount', 'status', 'created_at', 'signed_at'],
      order: [['created_at', 'DESC']],
    } as any);

    const relatedFundSettlements = await this.fundSettlementDao.findAll({
      where: {
        merchant_id: o.merchant_id,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
      order: [['created_at', 'DESC']],
    } as any);

    const merchant = await this.merchantDao.findById(o.merchant_id);
    const merchantName = merchant ? ((merchant as any).name || (merchant as any).merchant_name || '') : '';

    const timeline = this.buildTimeline(applyOrder, auditLogs, transferVoucher, merchantName);

    return {
      applyOrder,
      deductDetails,
      auditLogs,
      transferVoucher,
      relatedOrders,
      relatedFundSettlements,
      timeline,
    };
  }

  async checkConsistency(applyId: number): Promise<ConsistencyCheckResult> {
    const result: ConsistencyCheckResult = {
      pass: true,
      score: 100,
      checks: [],
      issues: [],
    };

    const applyOrder = await this.settleApplyOrderDao.findById(applyId);

    if (!applyOrder) {
      result.pass = false;
      result.score = 0;
      result.checks.push({ name: '申请单存在', key: 'apply_exists', pass: false, message: '结算申请单不存在' });
      result.issues.push('结算申请单不存在');
      return result;
    }

    const o = applyOrder as any;

    const start = new Date(o.period_start_date);
    const end = new Date(o.period_end_date);
    const nextDay = new Date(end);
    nextDay.setDate(nextDay.getDate() + 1);

    const deductDetails = await this.settleDeductDetailDao.findAll({
      where: { settle_apply_id: applyId },
    } as any);

    const auditLogs = await this.settleAuditLogDao.findAll({
      where: { settle_apply_id: applyId },
      order: [['created_at', 'ASC']],
    } as any);

    const transferVoucher = await this.settleTransferVoucherDao.findOne({
      where: { settle_apply_id: applyId },
    } as any);

    const orders = await this.orderDao.findAll({
      where: {
        merchant_id: o.merchant_id,
        status: 3,
        created_at: {
          [Op.gte]: start,
          [Op.lt]: nextDay,
        },
      },
    } as any);

    const orderTotalAmount = orders.reduce((sum, ord) => sum + Number((ord as any).pay_amount || 0), 0);
    const check1Pass = Math.abs(Number(o.total_settle_base || 0) - orderTotalAmount) < 0.01;
    result.checks.push({
      name: '订单总金额匹配',
      key: 'amount_match',
      pass: check1Pass,
      message: check1Pass ? '订单总金额与实际订单汇总一致' : `订单总金额不匹配：申请单¥${o.total_settle_base}，实际订单汇总¥${orderTotalAmount.toFixed(2)}`,
      actual: orderTotalAmount.toFixed(2),
      expected: o.total_settle_base,
    });
    if (!check1Pass) { result.pass = false; result.score -= 12.5; result.issues.push('订单总金额与周期内实际订单汇总不一致'); }

    const periodOrders = await this.settleApplyOrderDao.findAll({
      where: {
        merchant_id: o.merchant_id,
        settle_period_type: o.settle_period_type,
        period_start_date: o.period_start_date,
        period_end_date: o.period_end_date,
        apply_status: { [Op.ne]: 3 },
      },
    } as any);
    const check2Pass = periodOrders.length <= 1;
    result.checks.push({
      name: '申请单号唯一',
      key: 'unique_apply',
      pass: check2Pass,
      message: check2Pass ? '该周期无重复申请' : `该周期存在${periodOrders.length}条未驳回的重复申请`,
      actual: periodOrders.length,
      expected: 1,
    });
    if (!check2Pass) { result.pass = false; result.score -= 12.5; result.issues.push('同一周期存在重复的未驳回结算申请'); }

    const merchant = await this.merchantDao.findById(o.merchant_id);
    const check3Pass = !merchant || Number(o.actual_settle_amount || 0) <= Number((merchant as any).available_settle_balance ?? 0) + Number(o.actual_settle_amount || 0);
    result.checks.push({
      name: '不超额结算',
      key: 'no_over_settle',
      pass: check3Pass,
      message: check3Pass ? '申请金额未超出可结算余额' : `申请金额¥${o.actual_settle_amount}超出商家可结算余额`,
      actual: o.actual_settle_amount,
      expected: merchant ? (merchant as any).available_settle_balance : null,
    });
    if (!check3Pass) { result.pass = false; result.score -= 12.5; result.issues.push('申请结算金额超出商家可结算余额'); }

    const bankSnapshot = o.bank_snapshot || {};
    const check4Pass = Boolean(bankSnapshot.bank_account_name && bankSnapshot.bank_account_no && bankSnapshot.bank_name);
    result.checks.push({
      name: '银行卡信息匹配',
      key: 'bank_info_match',
      pass: check4Pass,
      message: check4Pass ? '银行卡信息完整' : '银行卡信息不完整（开户名/账号/开户行缺失）',
      actual: { name: bankSnapshot.bank_account_name, no: bankSnapshot.bank_account_no, bank: bankSnapshot.bank_name },
      expected: '三项均需非空',
    });
    if (!check4Pass) { result.pass = false; result.score -= 12.5; result.issues.push('申请单银行卡信息不完整'); }

    const totalDeductFromDetails = deductDetails.reduce((sum, d) => sum + Number((d as any).deduct_amount || 0), 0);
    const totalDeductFromOrder = Number(o.aftersale_deduct_amount || 0)
      + Number(o.penalty_deduct_amount || 0)
      + Number(o.platform_fee_amount || 0)
      + Number(o.other_deduct_amount || 0);
    const check5Pass = Math.abs(totalDeductFromOrder - totalDeductFromDetails) < 0.01;
    result.checks.push({
      name: '扣减明细汇总匹配',
      key: 'deduct_summary_match',
      pass: check5Pass,
      message: check5Pass ? '扣减明细汇总与申请单一致' : `扣减明细汇总不匹配：申请单¥${totalDeductFromOrder.toFixed(2)}，明细汇总¥${totalDeductFromDetails.toFixed(2)}`,
      actual: totalDeductFromDetails.toFixed(2),
      expected: totalDeductFromOrder.toFixed(2),
    });
    if (!check5Pass) { result.pass = false; result.score -= 12.5; result.issues.push('扣减明细汇总金额与申请单总扣减金额不一致'); }

    const check6Pass = auditLogs.length > 0 && auditLogs.some((l: any) => Number(l.audit_action) === AuditAction.SUBMIT_APPLY);
    result.checks.push({
      name: '审核日志连续',
      key: 'audit_log_continuous',
      pass: check6Pass,
      message: check6Pass ? '审核日志链路完整' : '审核日志不完整，缺少提交环节记录',
      actual: auditLogs.length,
      expected: '>=1 且包含 submit 记录',
    });
    if (!check6Pass) { result.pass = false; result.score -= 12.5; result.issues.push('审核日志不完整或不连续'); }

    let check7Pass = true;
    let check7Msg = '到账凭证金额一致';
    if (transferVoucher && (o.apply_status === 5 || o.apply_status === 4)) {
      check7Pass = Math.abs(Number((transferVoucher as any).transfer_amount || 0) - Number(o.actual_settle_amount || 0)) < 0.01;
      if (!check7Pass) {
        check7Msg = `到账凭证金额不匹配：凭证¥${(transferVoucher as any).transfer_amount}，申请单¥${o.actual_settle_amount}`;
      }
    }
    result.checks.push({
      name: '到账凭证金额一致',
      key: 'voucher_amount_match',
      pass: check7Pass,
      message: check7Msg,
      actual: transferVoucher ? (transferVoucher as any).transfer_amount : undefined,
      expected: o.actual_settle_amount,
    });
    if (!check7Pass) { result.pass = false; result.score -= 12.5; result.issues.push('到账凭证转账金额与申请单实际结算金额不一致'); }

    const check8Pass = orders.length === Number(o.total_order_count || 0);
    result.checks.push({
      name: '周期订单数匹配',
      key: 'order_count_match',
      pass: check8Pass,
      message: check8Pass ? '周期内订单数量一致' : `订单数量不匹配：申请单${o.total_order_count}个，实际查询${orders.length}个`,
      actual: orders.length,
      expected: o.total_order_count,
    });
    if (!check8Pass) { result.pass = false; result.score -= 12.5; result.issues.push('申请单订单数量与周期内实际订单数量不一致'); }

    result.score = Math.max(0, Math.min(100, result.score));
    return result;
  }

  async interceptDuplicateSettle(
    merchantId: number,
    periodType: number,
    start: string,
    end: string
  ): Promise<{ hasDuplicate: boolean; existing?: SettleApplyOrder; message?: string }> {
    const existing = await this.settleApplyOrderDao.findOne({
      where: {
        merchant_id: merchantId,
        settle_period_type: periodType,
        period_start_date: new Date(start),
        period_end_date: new Date(end),
        apply_status: { [Op.ne]: 3 },
      },
      order: [['created_at', 'DESC']],
    } as any);

    if (existing) {
      return {
        hasDuplicate: true,
        existing,
        message: `该周期已存在结算申请（单号：${(existing as any).apply_no}，状态：${this.getStatusName(Number((existing as any).apply_status || 0))}），请勿重复申请`,
      };
    }

    return { hasDuplicate: false };
  }

  async interceptOverSettle(
    merchantId: number,
    applyAmount: number
  ): Promise<{ isOver: boolean; availableBalance?: number; applyAmount?: number; message?: string }> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      return { isOver: true, message: '商家不存在' };
    }

    const availableBalance = Number((merchant as any).available_settle_balance || 0);

    if (applyAmount > availableBalance) {
      return {
        isOver: true,
        availableBalance,
        applyAmount,
        message: `申请结算金额¥${applyAmount.toFixed(2)}超出可结算余额¥${availableBalance.toFixed(2)}`,
      };
    }

    return {
      isOver: false,
      availableBalance,
      applyAmount,
    };
  }

  getStatusName(status?: number): string {
    const names: Record<number, string> = {
      1: '待审核',
      2: '审核通过',
      3: '审核驳回',
      4: '打款中',
      5: '已到账',
      6: '打款失败',
    };
    return names[status || 0] || '未知';
  }
}

export const settleTraceService = new SettleTraceService();
export default settleTraceService;
