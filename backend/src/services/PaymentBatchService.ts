import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { PaymentFlow } from '../models/PaymentFlow';
import { PageResult } from '../types';
import { PayStatus, ReconcileStatus, RiskFlag, ChannelStatus } from './PaymentValidateService';

export interface PaymentQueryParams {
  page?: number;
  pageSize?: number;
  flow_no?: string;
  order_no?: string;
  user_id?: number;
  merchant_id?: number;
  pay_type?: number;
  pay_status?: number;
  reconcile_status?: number;
  settle_status?: number;
  risk_flag?: number;
  channel_status?: number;
  start_time?: string;
  end_time?: string;
  start_pay_time?: string;
  end_pay_time?: string;
  min_amount?: number;
  max_amount?: number;
  is_overdue?: number;
  is_exception?: number;
  is_reconcile_pending?: number;
}

export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  messages?: string[];
}

const FINANCE_ROLE = 2;

class PaymentBatchService {
  private readonly paymentFlowDao = daos.paymentFlowDao;
  private readonly paymentReconcileDao = daos.paymentReconcileDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly riskAlertDao = daos.riskAlertDao;
  private readonly adminDao = daos.adminDao;

  buildQueryConditions(params: PaymentQueryParams): WhereOptions<PaymentFlow> {
    const where: WhereOptions<PaymentFlow> = {};
    const now = new Date();

    if (params.flow_no) {
      where.flow_no = { [Op.like]: `%${params.flow_no}%` };
    }
    if (params.order_no) {
      where.order_no = { [Op.like]: `%${params.order_no}%` };
    }
    if (params.user_id !== undefined) {
      where.user_id = params.user_id;
    }
    if (params.merchant_id !== undefined) {
      (where as any).order = { merchant_id: params.merchant_id };
    }
    if (params.pay_type !== undefined) {
      where.pay_type = params.pay_type;
    }
    if (params.pay_status !== undefined) {
      where.pay_status = params.pay_status;
    }
    if (params.reconcile_status !== undefined) {
      where.reconcile_status = params.reconcile_status;
    }
    if (params.settle_status !== undefined) {
      where.settle_status = params.settle_status;
    }
    if (params.risk_flag !== undefined) {
      where.risk_flag = params.risk_flag;
    }
    if (params.channel_status !== undefined) {
      where.channel_status = params.channel_status;
    }

    if (params.start_time || params.end_time) {
      where.created_at = {};
      if (params.start_time) {
        (where.created_at as any)[Op.gte] = new Date(params.start_time);
      }
      if (params.end_time) {
        (where.created_at as any)[Op.lte] = new Date(params.end_time);
      }
    }

    if (params.start_pay_time || params.end_pay_time) {
      where.pay_time = {};
      if (params.start_pay_time) {
        (where.pay_time as any)[Op.gte] = new Date(params.start_pay_time);
      }
      if (params.end_pay_time) {
        (where.pay_time as any)[Op.lte] = new Date(params.end_pay_time);
      }
    }

    if (params.min_amount !== undefined || params.max_amount !== undefined) {
      where.amount = {};
      if (params.min_amount !== undefined) {
        (where.amount as any)[Op.gte] = params.min_amount;
      }
      if (params.max_amount !== undefined) {
        (where.amount as any)[Op.lte] = params.max_amount;
      }
    }

    if (params.is_overdue === 1) {
      where.expire_time = { [Op.lt]: now };
      where.pay_status = PayStatus.PENDING;
      where.channel_status = ChannelStatus.NORMAL;
    }

    if (params.is_exception === 1) {
      where.risk_flag = { [Op.gte]: RiskFlag.LOW };
    }

    if (params.is_reconcile_pending === 1) {
      where.reconcile_status = ReconcileStatus.PENDING;
      where.pay_status = PayStatus.SUCCESS;
    }

    return where;
  }

  async getPaymentList(params: PaymentQueryParams): Promise<PageResult<PaymentFlow>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.buildQueryConditions(queryParams);

    const result = await this.paymentFlowDao.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return {
      list: result.rows,
      total: result.count,
      page,
      pageSize,
      totalPages: Math.ceil(result.count / pageSize),
    };
  }

  async getIdsByQuery(params: PaymentQueryParams): Promise<number[]> {
    const where = this.buildQueryConditions(params);
    const flows = await this.paymentFlowDao.findAll({
      where,
      attributes: ['id'],
    });
    return flows.map(f => f.id);
  }

  async checkFinancePermission(adminId: number): Promise<boolean> {
    const admin = await this.adminDao.findById(adminId);
    if (!admin) return false;
    return admin.role === FINANCE_ROLE || admin.role === 1;
  }

  async batchVerifyPayment(
    params: PaymentQueryParams,
    _operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const ids = await this.getIdsByQuery(params);
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const flow = await this.paymentFlowDao.findById(id);
        if (!flow) {
          result.failCount++;
          continue;
        }

        if (flow.pay_status !== PayStatus.PENDING) {
          result.failCount++;
          result.messages?.push(`流水${flow.flow_no}：非待支付状态，跳过核验`);
          continue;
        }

        if (flow.channel_status === ChannelStatus.CLOSED) {
          result.failCount++;
          result.messages?.push(`流水${flow.flow_no}：支付通道已关闭`);
          continue;
        }

        const now = new Date();
        if (flow.expire_time && now > new Date(flow.expire_time)) {
          await this.paymentFlowDao.update(id, {
            channel_status: ChannelStatus.CLOSED,
          });
          result.failCount++;
          result.messages?.push(`流水${flow.flow_no}：支付已超时，通道已关闭`);
          continue;
        }

        await this.paymentFlowDao.update(id, {
          reconcile_status: ReconcileStatus.PROCESSING,
        });

        await this.orderLogDao.create({
          order_id: flow.order_id,
          operator_id: _operatorId,
          operator_type: 1,
          action: '支付核验',
          remark: `操作人员：${operatorName}，核验通过`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.messages?.push(`ID:${id} 核验失败`);
      }
    }

    return result;
  }

  async batchResetExpireTime(
    params: PaymentQueryParams,
    _operatorId: number,
    operatorName: string
  ): Promise<BatchOperationResult> {
    const ids = await this.getIdsByQuery(params);
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    const newExpireTime = new Date();
    newExpireTime.setMinutes(newExpireTime.getMinutes() + 30);

    for (const id of ids) {
      try {
        const flow = await this.paymentFlowDao.findById(id);
        if (!flow) {
          result.failCount++;
          continue;
        }

        if (flow.pay_status !== PayStatus.PENDING) {
          result.failCount++;
          continue;
        }

        await this.paymentFlowDao.update(id, {
          expire_time: newExpireTime,
          channel_status: ChannelStatus.NORMAL,
        });

        await this.orderLogDao.create({
          order_id: flow.order_id,
          operator_id: _operatorId,
          operator_type: 1,
          action: '重置支付时效',
          remark: `操作人员：${operatorName}，新时效：${newExpireTime.toLocaleString()}`,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
      }
    }

    return result;
  }

  async batchMarkReconcileStatus(
    params: PaymentQueryParams,
    reconcileStatus: ReconcileStatus,
    _operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<BatchOperationResult> {
    const hasPermission = await this.checkFinancePermission(_operatorId);
    if (!hasPermission) {
      return {
        success: false,
        total: 0,
        successCount: 0,
        failCount: 0,
        messages: ['无财务权限，无法执行对账操作'],
      };
    }

    const ids = await this.getIdsByQuery(params);
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const flow = await this.paymentFlowDao.findById(id);
        if (!flow) {
          result.failCount++;
          continue;
        }

        if (flow.pay_status !== PayStatus.SUCCESS) {
          result.failCount++;
          result.messages?.push(`流水${flow.flow_no}：非支付成功状态，无法对账`);
          continue;
        }

        await this.paymentFlowDao.update(id, {
          reconcile_status: reconcileStatus,
          reconcile_time: new Date(),
          reconcile_by: _operatorId,
          reconcile_remark: remark,
        });

        const reconcileNo = 'DZ' + Date.now() + Math.floor(Math.random() * 1000);
        const orderAmount = Number(flow.order_amount || flow.amount || 0);
        const payAmount = Number(flow.amount || 0);
        const diffAmount = Math.abs(payAmount - orderAmount);

        await this.paymentReconcileDao.create({
          reconcile_no: reconcileNo,
          flow_id: flow.id,
          flow_no: flow.flow_no,
          order_id: flow.order_id,
          order_no: flow.order_no,
          order_amount: orderAmount,
          pay_amount: payAmount,
          diff_amount: diffAmount,
          status: reconcileStatus,
          reconcile_time: new Date(),
          reconcile_by: _operatorId,
          reconcile_name: operatorName,
          remark,
          exception_remark: diffAmount > 0.01 ? `金额差异${diffAmount}元` : undefined,
        });

        result.successCount++;
      } catch (error) {
        result.failCount++;
      }
    }

    return result;
  }

  async batchHandleRisk(
    params: PaymentQueryParams,
    riskFlag: RiskFlag,
    _operatorId: number,
    operatorName: string,
    reason?: string
  ): Promise<BatchOperationResult> {
    const ids = await this.getIdsByQuery(params);
    const result: BatchOperationResult = {
      success: true,
      total: ids.length,
      successCount: 0,
      failCount: 0,
      messages: [],
    };

    for (const id of ids) {
      try {
        const flow = await this.paymentFlowDao.findById(id);
        if (!flow) {
          result.failCount++;
          continue;
        }

        await this.paymentFlowDao.update(id, {
          risk_flag: riskFlag,
          risk_reason: reason,
        });

        if (riskFlag >= RiskFlag.HIGH) {
          const level = riskFlag === RiskFlag.BLOCKED ? 3 : 2;
          await this.riskAlertDao.create({
            rule_id: 101,
            type: 2,
            target_id: flow.order_id,
            level,
            content: `支付流水${flow.flow_no}：${reason || '批量风控处理'}，操作人：${operatorName}`,
            status: 0,
          });
        }

        result.successCount++;
      } catch (error) {
        result.failCount++;
      }
    }

    return result;
  }
}

export const paymentBatchService = new PaymentBatchService();
export default paymentBatchService;
