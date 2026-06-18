import { Op } from 'sequelize';
import { daos } from '../dao';
import { PaymentFlow } from '../models/PaymentFlow';
import { PaymentReconcile } from '../models/PaymentReconcile';
import { FundSettlement } from '../models/FundSettlement';
import { RiskAlert } from '../models/RiskAlert';
import { OrderLog } from '../models/OrderLog';
import { PayStatus, RiskFlag, PayScenario, ReconcileStatus, SettleStatus } from './PaymentValidateService';

export interface PaymentTraceData {
  paymentFlow: PaymentFlow | null;
  orderInfo: any;
  userInfo: any;
  merchantInfo: any;
  reconciles: PaymentReconcile[];
  settlements: FundSettlement[];
  riskAlerts: RiskAlert[];
  orderLogs: OrderLog[];
}

export interface PaymentValidationReport {
  flowMatch: boolean;
  amountMatch: boolean;
  timeMatch: boolean;
  noDuplicate: boolean;
  noFake: boolean;
  overallScore: number;
  issues: string[];
}

export interface PaymentMatchResult {
  matched: boolean;
  matchScore: number;
  mismatches: string[];
}

class PaymentTraceService {
  private readonly paymentFlowDao = daos.paymentFlowDao;
  private readonly paymentReconcileDao = daos.paymentReconcileDao;
  private readonly fundSettlementDao = daos.fundSettlementDao;
  private readonly riskAlertDao = daos.riskAlertDao;
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;

  async getPaymentTrace(flowId: number): Promise<PaymentTraceData> {
    const flow = await this.paymentFlowDao.findById(flowId);
    if (!flow) {
      return {
        paymentFlow: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        reconciles: [],
        settlements: [],
        riskAlerts: [],
        orderLogs: [],
      };
    }

    const order = await this.orderDao.findById(flow.order_id);
    const user = flow.user_id ? await this.userDao.findById(flow.user_id) : null;
    const merchant = order?.merchant_id ? await this.merchantDao.findById(order.merchant_id) : null;

    const reconciles = await this.paymentReconcileDao.findAll({
      where: { flow_id: flowId },
      order: [['created_at', 'DESC']],
    });

    const settlements = await this.fundSettlementDao.findAll({
      where: { flow_id: flowId },
      order: [['created_at', 'DESC']],
    });

    const riskAlerts = await this.riskAlertDao.findAll({
      where: {
        type: 2,
        target_id: flow.order_id,
      },
      order: [['created_at', 'DESC']],
    });

    const orderLogs = await this.orderLogDao.findAll({
      where: { order_id: flow.order_id },
      order: [['created_at', 'DESC']],
    });

    return {
      paymentFlow: flow,
      orderInfo: order,
      userInfo: user,
      merchantInfo: merchant,
      reconciles,
      settlements,
      riskAlerts,
      orderLogs,
    };
  }

  async validatePaymentData(flowId: number): Promise<PaymentValidationReport> {
    const report: PaymentValidationReport = {
      flowMatch: true,
      amountMatch: true,
      timeMatch: true,
      noDuplicate: true,
      noFake: true,
      overallScore: 100,
      issues: [],
    };

    const flow = await this.paymentFlowDao.findById(flowId);
    if (!flow) {
      report.flowMatch = false;
      report.overallScore = 0;
      report.issues.push('支付流不存在');
      return report;
    }

    const order = await this.orderDao.findById(flow.order_id);
    if (!order) {
      report.flowMatch = false;
      report.overallScore = 20;
      report.issues.push('关联订单不存在');
      return report;
    }

    const orderAmount = Number(order.pay_amount || 0);
    const payAmount = Number(flow.amount || 0);

    if (flow.pay_status === PayStatus.SUCCESS) {
      if (Math.abs(payAmount - orderAmount) > 0.01) {
        report.amountMatch = false;
        report.overallScore -= 30;
        report.issues.push(`支付金额(${payAmount}元)与订单金额(${orderAmount}元)不匹配`);
      }
    }

    if (flow.pay_time && order.created_at) {
      const payTime = new Date(flow.pay_time).getTime();
      const orderTime = new Date(order.created_at).getTime();
      if (payTime < orderTime) {
        report.timeMatch = false;
        report.overallScore -= 20;
        report.issues.push('支付时间早于下单时间');
      }
    }

    if (flow.transaction_id) {
      const duplicateFlows = await this.paymentFlowDao.findAll({
        where: {
          transaction_id: flow.transaction_id,
          id: { [Op.ne]: flowId },
          pay_status: PayStatus.SUCCESS,
        },
      });

      if (duplicateFlows.length > 0) {
        report.noDuplicate = false;
        report.overallScore -= 30;
        report.issues.push(`存在${duplicateFlows.length}条重复支付流水`);
      }
    }

    if (payAmount <= 0 || payAmount > orderAmount * 2) {
      report.noFake = false;
      report.overallScore -= 40;
      report.issues.push('支付金额异常，疑似虚假支付');
    }

    if (flow.order_no !== order.order_no) {
      report.flowMatch = false;
      report.overallScore -= 20;
      report.issues.push('订单号不匹配');
    }

    if (flow.user_id !== order.user_id) {
      report.flowMatch = false;
      report.overallScore -= 10;
      report.issues.push('用户ID不匹配');
    }

    report.overallScore = Math.max(0, report.overallScore);
    return report;
  }

  async checkPaymentMatch(flow: PaymentFlow, order: any): Promise<PaymentMatchResult> {
    const mismatches: string[] = [];
    let matchScore = 100;

    if (flow.order_no !== order.order_no) {
      mismatches.push('订单号不匹配');
      matchScore -= 25;
    }

    if (flow.user_id !== order.user_id) {
      mismatches.push('用户ID不匹配');
      matchScore -= 15;
    }

    const orderAmount = Number(order.pay_amount || 0);
    const payAmount = Number(flow.amount || 0);

    if (Math.abs(payAmount - orderAmount) > 0.01) {
      mismatches.push(`金额不匹配：订单${orderAmount}元 vs 支付${payAmount}元`);
      matchScore -= 30;
    }

    if (flow.pay_time && order.created_at) {
      const payTime = new Date(flow.pay_time).getTime();
      const orderTime = new Date(order.created_at).getTime();
      if (payTime < orderTime) {
        mismatches.push('支付时间早于下单时间');
        matchScore -= 20;
      }
    }

    if (flow.pay_type && flow.pay_type < 1 || flow.pay_type > 3) {
      mismatches.push('支付方式不合法');
      matchScore -= 10;
    }

    matchScore = Math.max(0, matchScore);
    return {
      matched: matchScore >= 80,
      matchScore,
      mismatches,
    };
  }

  async getPaymentTraceByOrderId(orderId: number): Promise<PaymentTraceData | null> {
    const flow = await this.paymentFlowDao.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });

    if (!flow) return null;
    return this.getPaymentTrace(flow.id);
  }

  async getPaymentTraceByFlowNo(flowNo: string): Promise<PaymentTraceData | null> {
    const flow = await this.paymentFlowDao.findOne({
      where: { flow_no: flowNo },
    });

    if (!flow) return null;
    return this.getPaymentTrace(flow.id);
  }

  async getPaymentTraceByTransactionId(transactionId: string): Promise<PaymentTraceData[]> {
    const flows = await this.paymentFlowDao.findAll({
      where: { transaction_id: transactionId },
      order: [['created_at', 'DESC']],
    });

    const results: PaymentTraceData[] = [];
    for (const flow of flows) {
      const trace = await this.getPaymentTrace(flow.id);
      results.push(trace);
    }
    return results;
  }

  getPayStatusName(status?: number): string {
    const names: Record<number, string> = {
      [PayStatus.PENDING]: '待支付',
      [PayStatus.SUCCESS]: '支付成功',
      [PayStatus.FAILED]: '支付失败',
      [PayStatus.REFUNDED]: '已退款',
    };
    return names[status || 0] || '未知';
  }

  getPayScenarioName(scenario?: number): string {
    const names: Record<number, string> = {
      [PayScenario.FULL]: '全额支付',
      [PayScenario.PARTIAL]: '部分支付',
      [PayScenario.AFTER_REFUND]: '退款后支付',
    };
    return names[scenario || 0] || '未知';
  }

  getReconcileStatusName(status?: number): string {
    const names: Record<number, string> = {
      [ReconcileStatus.PENDING]: '待对账',
      [ReconcileStatus.PROCESSING]: '对账中',
      [ReconcileStatus.PASSED]: '对账通过',
      [ReconcileStatus.ABNORMAL]: '对账异常',
    };
    return names[status || 0] || '未知';
  }

  getSettleStatusName(status?: number): string {
    const names: Record<number, string> = {
      [SettleStatus.PENDING]: '待结算',
      [SettleStatus.SETTLED]: '已结算',
      [SettleStatus.ABNORMAL]: '结算异常',
    };
    return names[status || 0] || '未知';
  }

  getRiskFlagName(flag?: number): string {
    const names: Record<number, string> = {
      [RiskFlag.NORMAL]: '正常',
      [RiskFlag.LOW]: '低风险',
      [RiskFlag.MEDIUM]: '中风险',
      [RiskFlag.HIGH]: '高风险',
      [RiskFlag.BLOCKED]: '已拦截',
    };
    return names[flag || 0] || '未知';
  }
}

export const paymentTraceService = new PaymentTraceService();
export default paymentTraceService;
