import { Op } from 'sequelize';
import { daos } from '../dao';
import { AfterSale } from '../models/AfterSale';
import { AfterSaleOperationLog } from '../models/AfterSaleOperationLog';

export interface AfterSaleTraceData {
  afterSale: any | null;
  orderInfo: any | null;
  userInfo: any | null;
  merchantInfo: any | null;
  operationLogs: any[];
  ledger: any | null;
  orderLogs: any[];
  fundSettlements: any[];
}

export interface AfterSaleValidationReport {
  processCompliance: boolean;
  dataConsistency: boolean;
  noDuplicate: boolean;
  fundMatch: boolean;
  stockMatch: boolean;
  statusConsistency: boolean;
  overallScore: number;
  issues: string[];
}

class AfterSaleTraceService {
  private readonly afterSaleDao = daos.afterSaleDao;
  private readonly afterSaleOperationLogDao = daos.afterSaleOperationLogDao;
  private readonly afterSaleLedgerDao = daos.afterSaleLedgerDao;
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly userDao = daos.userDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly fundSettlementDao = daos.fundSettlementDao;

  async getAfterSaleTrace(afterSaleId: number): Promise<AfterSaleTraceData> {
    const afterSale = await this.afterSaleDao.findById(afterSaleId);

    if (!afterSale) {
      return {
        afterSale: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        operationLogs: [],
        ledger: null,
        orderLogs: [],
        fundSettlements: [],
      };
    }

    return this.buildTraceData(afterSale);
  }

  private async buildTraceData(afterSale: AfterSale): Promise<AfterSaleTraceData> {
    const order = await this.orderDao.findById(afterSale.order_id);
    const user = afterSale.user_id ? await this.userDao.findById(afterSale.user_id) : null;
    const merchant = afterSale.merchant_id ? await this.merchantDao.findById(afterSale.merchant_id) : null;

    const operationLogs = await this.afterSaleOperationLogDao.findAll({
      where: { after_sale_id: afterSale.id },
      order: [['created_at', 'DESC']],
    });

    const ledger = await this.afterSaleLedgerDao.findOne({
      where: { after_sale_id: afterSale.id },
    });

    const orderLogs = await this.orderLogDao.findAll({
      where: { order_id: afterSale.order_id },
      order: [['created_at', 'DESC']],
    });

    const fundSettlements = await this.fundSettlementDao.findAll({
      where: { order_id: afterSale.order_id },
      order: [['created_at', 'DESC']],
    });

    return {
      afterSale,
      orderInfo: order,
      userInfo: user,
      merchantInfo: merchant,
      operationLogs,
      ledger,
      orderLogs,
      fundSettlements,
    };
  }

  async validateAfterSaleData(afterSaleId: number): Promise<AfterSaleValidationReport> {
    const report: AfterSaleValidationReport = {
      processCompliance: true,
      dataConsistency: true,
      noDuplicate: true,
      fundMatch: true,
      stockMatch: true,
      statusConsistency: true,
      overallScore: 100,
      issues: [],
    };

    const afterSale = await this.afterSaleDao.findById(afterSaleId);

    if (!afterSale) {
      report.processCompliance = false;
      report.dataConsistency = false;
      report.noDuplicate = false;
      report.fundMatch = false;
      report.stockMatch = false;
      report.statusConsistency = false;
      report.overallScore = 0;
      report.issues.push('售后记录不存在');
      return report;
    }

    const operationLogs = await this.afterSaleOperationLogDao.findAll({
      where: { after_sale_id: afterSaleId },
      order: [['created_at', 'ASC']],
    });

    const processCheck = this.checkProcessCompliance(afterSale, operationLogs);
    if (!processCheck.compliant) {
      report.processCompliance = false;
      report.overallScore -= 17;
      report.issues.push(...processCheck.issues);
    }

    const order = await this.orderDao.findById(afterSale.order_id);
    if (!order) {
      report.dataConsistency = false;
      report.overallScore -= 17;
      report.issues.push('关联订单不存在');
    } else {
      if (afterSale.order_no !== order.order_no) {
        report.dataConsistency = false;
        report.overallScore -= 8;
        report.issues.push('售后单号与订单编号不匹配');
      }
      if (afterSale.user_id !== order.user_id) {
        report.dataConsistency = false;
        report.overallScore -= 5;
        report.issues.push('售后用户ID与订单用户ID不一致');
      }
      if (afterSale.merchant_id !== order.merchant_id) {
        report.dataConsistency = false;
        report.overallScore -= 5;
        report.issues.push('售后商家ID与订单商家ID不一致');
      }
    }

    const duplicateAfterSales = await this.afterSaleDao.findAll({
      where: {
        order_id: afterSale.order_id,
        id: { [Op.ne]: afterSale.id },
        type: afterSale.type,
        status: { [Op.notIn]: [5, 6] },
      },
    });

    if (duplicateAfterSales.length > 0) {
      report.noDuplicate = false;
      report.overallScore -= 17;
      report.issues.push(`存在${duplicateAfterSales.length}条同类型进行中的重复售后申请`);
    }

    const fundCheck = await this.checkFundMatch(afterSale);
    if (!fundCheck.match) {
      report.fundMatch = false;
      report.overallScore -= 17;
      report.issues.push(...fundCheck.issues);
    }

    const stockCheck = this.checkStockMatch(afterSale, operationLogs);
    if (!stockCheck.match) {
      report.stockMatch = false;
      report.overallScore -= 16;
      report.issues.push(...stockCheck.issues);
    }

    const statusCheck = this.checkStatusConsistency(afterSale, operationLogs);
    if (!statusCheck.consistent) {
      report.statusConsistency = false;
      report.overallScore -= 17;
      report.issues.push(...statusCheck.issues);
    }

    report.overallScore = Math.max(0, Math.min(100, report.overallScore));
    return report;
  }

  private checkProcessCompliance(
    afterSale: AfterSale,
    operationLogs: AfterSaleOperationLog[]
  ): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    let compliant = true;

    if (operationLogs.length === 0) {
      return { compliant: false, issues: ['暂无操作日志记录'] };
    }

    const hasApplyLog = operationLogs.some(log => log.action === 'apply');
    if (!hasApplyLog) {
      compliant = false;
      issues.push('缺少申请环节的操作日志');
    }

    if (afterSale.status !== 0) {
      const hasAuditLog = operationLogs.some(
        log => log.action === 'audit_pass' || log.action === 'audit_reject'
      );
      if (!hasAuditLog) {
        compliant = false;
        issues.push('缺少审核环节的操作日志');
      }
    }

    if (afterSale.status === 3) {
      const hasCompleteLog = operationLogs.some(log => log.action === 'complete');
      if (!hasCompleteLog) {
        compliant = false;
        issues.push('缺少完成环节的操作日志');
      }
    }

    if (afterSale.status === 6) {
      const hasCloseLog = operationLogs.some(log => log.action === 'close');
      if (!hasCloseLog) {
        compliant = false;
        issues.push('缺少关闭环节的操作日志');
      }
    }

    return { compliant, issues };
  }

  private async checkFundMatch(
    afterSale: AfterSale
  ): Promise<{ match: boolean; issues: string[] }> {
    const issues: string[] = [];
    let match = true;

    if (afterSale.status !== 3) {
      return { match: true, issues: [] };
    }

    const ledger = await this.afterSaleLedgerDao.findOne({
      where: { after_sale_id: afterSale.id },
    });

    if (!ledger) {
      match = false;
      issues.push('已完成的售后缺少台账记录');
      return { match, issues };
    }

    if (afterSale.amount && ledger.refund_amount && afterSale.amount !== ledger.refund_amount) {
      match = false;
      issues.push('售后退款金额与台账退款金额不匹配');
    }

    const fundSettlements = await this.fundSettlementDao.findAll({
      where: { order_id: afterSale.order_id },
    });

    if (afterSale.settle_deduct_amount && afterSale.settle_deduct_amount > 0 && fundSettlements.length === 0) {
      match = false;
      issues.push('售后有商家结算扣减金额但缺少资金结算记录');
    }

    return { match, issues };
  }

  private checkStockMatch(
    afterSale: AfterSale,
    operationLogs: AfterSaleOperationLog[]
  ): { match: boolean; issues: string[] } {
    const issues: string[] = [];
    let match = true;

    const needsStockRollback = afterSale.type === 2 || afterSale.type === 3;
    if (!needsStockRollback) {
      return { match: true, issues: [] };
    }

    if (afterSale.status === 3) {
      const hasStockRollbackLog = operationLogs.some(log => log.action === 'stock_rollback');
      if (!hasStockRollbackLog) {
        match = false;
        issues.push('退货退款/换货类已完成售后缺少库存回退操作日志');
      }

      if (afterSale.stock_rollback_status === 0) {
        match = false;
        issues.push('退货退款/换货类已完成售后库存回退状态为未回退');
      }

      if (afterSale.stock_rollback_status === 2) {
        match = false;
        issues.push('售后库存回退失败');
      }
    }

    return { match, issues };
  }

  private checkStatusConsistency(
    afterSale: AfterSale,
    operationLogs: AfterSaleOperationLog[]
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];
    let consistent = true;

    const sortedLogs = [...operationLogs].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let expectedStatus = 0;

    for (const log of sortedLogs) {
      if (log.old_status !== undefined && log.old_status !== null && log.old_status !== expectedStatus) {
        consistent = false;
        issues.push(`操作日志状态跳转异常：期望状态${expectedStatus}，实际${log.old_status}`);
        break;
      }

      if (log.new_status !== undefined && log.new_status !== null) {
        expectedStatus = log.new_status;
      }
    }

    if (expectedStatus !== afterSale.status) {
      consistent = false;
      issues.push(`操作日志最终状态${expectedStatus}与售后当前状态${afterSale.status}不一致`);
    }

    return { consistent, issues };
  }

  async getAfterSaleTraceByOrderId(orderId: number): Promise<AfterSaleTraceData> {
    const afterSale = await this.afterSaleDao.findOne({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });

    if (!afterSale) {
      return {
        afterSale: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        operationLogs: [],
        ledger: null,
        orderLogs: [],
        fundSettlements: [],
      };
    }

    return this.buildTraceData(afterSale);
  }

  async getAfterSaleTraceByAfterSaleNo(afterSaleNo: string): Promise<AfterSaleTraceData> {
    const afterSale = await this.afterSaleDao.findOne({
      where: { after_sale_no: afterSaleNo },
    });

    if (!afterSale) {
      return {
        afterSale: null,
        orderInfo: null,
        userInfo: null,
        merchantInfo: null,
        operationLogs: [],
        ledger: null,
        orderLogs: [],
        fundSettlements: [],
      };
    }

    return this.buildTraceData(afterSale);
  }

  async checkDuplicateAfterSale(orderId: number): Promise<boolean> {
    const existingAfterSales = await this.afterSaleDao.findAll({
      where: {
        order_id: orderId,
        status: { [Op.notIn]: [5, 6] },
      },
    });

    return existingAfterSales.length > 1;
  }

  getStatusName(status?: number): string {
    const names: Record<number, string> = {
      0: '待审核',
      1: '审核通过',
      2: '处理中',
      3: '已完成',
      4: '已拒绝',
      5: '已取消',
      6: '已关闭',
    };
    return names[status || 0] || '未知';
  }

  getAfterSaleTypeName(type?: number): string {
    const names: Record<number, string> = {
      1: '退款',
      2: '退货退款',
      3: '换货',
      4: '维修',
    };
    return names[type || 0] || '未知';
  }

  getActionName(action?: string): string {
    const names: Record<string, string> = {
      apply: '申请',
      audit_pass: '审核通过',
      audit_reject: '审核拒绝',
      process: '处理',
      complete: '完成',
      cancel: '取消',
      close: '关闭',
      stock_rollback: '库存回退',
      settle_deduct: '结算扣减',
      points_rollback: '积分回退',
      terminate: '终止',
      archive: '归档',
    };
    return names[action || ''] || '未知操作';
  }
}

export const afterSaleTraceService = new AfterSaleTraceService();
export default afterSaleTraceService;
