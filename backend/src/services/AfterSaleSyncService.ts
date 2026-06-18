import { Transaction } from 'sequelize';
import { daos } from '../dao';
import database from '../config/database';
import { OrderStatus } from './ShippingValidateService';
import { AfterSaleApplyData } from './AfterSaleValidateService';

export interface ProcessAfterSaleData {
  afterSaleId: number;
  action: string;
  status: number;
  handleRemark?: string;
  operatorId: number;
  operatorName: string;
}

export interface CancelOrderData {
  orderId: number;
  cancelScene: number;
  reason?: string;
  operatorId: number;
  operatorName: string;
}

export interface RefundData {
  afterSaleId: number;
  orderId: number;
  refundAmount: number;
  operatorId: number;
  operatorName: string;
}

const AFTER_SALE_DEADLINE_DAYS = 7;

const ACTION_STATUS_MAP: Record<string, { status: number; orderAfterSaleStatus?: number }> = {
  audit_pass: { status: 1, orderAfterSaleStatus: 1 },
  audit_reject: { status: 3, orderAfterSaleStatus: 3 },
  complete: { status: 4 },
  close: { status: 5 },
};

class AfterSaleSyncService {
  readonly orderDao = daos.orderDao;
  readonly orderItemDao = daos.orderItemDao;
  readonly afterSaleDao = daos.afterSaleDao;
  readonly afterSaleOperationLogDao = daos.afterSaleOperationLogDao;
  readonly afterSaleLedgerDao = daos.afterSaleLedgerDao;
  readonly goodsDao = daos.goodsDao;
  readonly merchantDao = daos.merchantDao;
  readonly userDao = daos.userDao;

  async applyAfterSale(
    data: AfterSaleApplyData & { orderNo: string; merchantId: number; merchantName?: string }
  ): Promise<any> {
    const transaction = await database.transaction();

    try {
      const order = await this.orderDao.findById(data.orderId);
      if (!order) {
        await transaction.rollback();
        throw new Error('订单不存在');
      }

      const afterSaleNo = 'AS' + Date.now() + Math.floor(Math.random() * 10000);

      const now = new Date();
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + AFTER_SALE_DEADLINE_DAYS);

      const afterSaleRecord = await this.afterSaleDao.create(
        {
          after_sale_no: afterSaleNo,
          order_id: data.orderId,
          order_no: data.orderNo,
          user_id: data.userId,
          merchant_id: data.merchantId,
          merchant_name: data.merchantName || '',
          type: data.type,
          reason: data.reason || '',
          amount: data.amount || 0,
          items: data.items ? JSON.stringify(data.items) : null,
          status: 0,
          deadline,
        },
        { transaction }
      );

      await this.orderDao.update(
        data.orderId,
        {
          after_sale_status: 1,
          after_sale_count: (order.after_sale_count || 0) + 1,
        },
        { transaction }
      );

      await this.createOperationLog(
        afterSaleRecord.id,
        afterSaleNo,
        data.orderId,
        data.orderNo,
        'apply',
        '提交售后申请',
        { type: data.type, reason: data.reason, amount: data.amount },
        transaction
      );

      await transaction.commit();
      return afterSaleRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async processAfterSale(data: ProcessAfterSaleData): Promise<any> {
    const transaction = await database.transaction();

    try {
      const afterSale = await this.afterSaleDao.findById(data.afterSaleId);
      if (!afterSale) {
        await transaction.rollback();
        throw new Error('售后记录不存在');
      }

      const order = await this.orderDao.findById(afterSale.order_id);
      if (!order) {
        await transaction.rollback();
        throw new Error('订单不存在');
      }

      const actionConfig = ACTION_STATUS_MAP[data.action];
      if (!actionConfig) {
        await transaction.rollback();
        throw new Error(`无效的售后操作：${data.action}`);
      }

      const updateData: any = {
        status: actionConfig.status,
        handle_time: new Date(),
        handle_remark: data.handleRemark || '',
        handler_id: data.operatorId,
        handler_name: data.operatorName,
      };

      if (data.action === 'audit_pass') {
        updateData.audit_time = new Date();
      }

      if (data.action === 'complete') {
        updateData.complete_time = new Date();
      }

      await this.afterSaleDao.update(data.afterSaleId, updateData, { transaction });

      if (actionConfig.orderAfterSaleStatus !== undefined) {
        await this.orderDao.update(
          afterSale.order_id,
          { after_sale_status: actionConfig.orderAfterSaleStatus },
          { transaction }
        );
      }

      if (data.action === 'complete') {
        await this.rollbackStock(afterSale.order_id, data.afterSaleId, transaction);
        await this.deductSettleAmount(afterSale.order_id, afterSale.amount || 0, transaction);
        await this.rollbackUserPoints(afterSale.user_id, order.pay_amount || 0, transaction);
        await this.orderDao.update(
          afterSale.order_id,
          { after_sale_status: 4 },
          { transaction }
        );
        await this.generateLedger(
          data.afterSaleId,
          afterSale.order_id,
          {
            amount: afterSale.amount,
            type: afterSale.type,
            refundAmount: afterSale.amount,
            points: order.pay_amount || 0,
          },
          transaction
        );
      }

      const actionDescMap: Record<string, string> = {
        audit_pass: '审核通过',
        audit_reject: '审核拒绝',
        complete: '售后完成',
        close: '售后关闭',
      };

      await this.createOperationLog(
        data.afterSaleId,
        afterSale.after_sale_no,
        afterSale.order_id,
        afterSale.order_no,
        data.action,
        actionDescMap[data.action] || data.action,
        {
          oldStatus: afterSale.status,
          newStatus: actionConfig.status,
          handleRemark: data.handleRemark,
        },
        transaction
      );

      await transaction.commit();
      return afterSale;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancelOrder(data: CancelOrderData): Promise<any> {
    const transaction = await database.transaction();

    try {
      const order = await this.orderDao.findById(data.orderId);
      if (!order) {
        await transaction.rollback();
        throw new Error('订单不存在');
      }

      const now = new Date();
      await this.orderDao.update(
        data.orderId,
        {
          status: OrderStatus.CANCELLED,
          terminate_type: data.cancelScene,
          terminated_at: now,
          terminate_reason: data.reason || '',
          terminate_operator_id: data.operatorId,
          terminate_operator_name: data.operatorName,
        },
        { transaction }
      );

      if (order.pay_status === 1) {
        await this.rollbackStock(data.orderId, 0, transaction);
        await this.deductSettleAmount(data.orderId, order.pay_amount || 0, transaction);
        await this.rollbackUserPoints(order.user_id, order.pay_amount || 0, transaction);

        const afterSaleNo = 'AS' + Date.now() + Math.floor(Math.random() * 10000);
        const afterSaleRecord = await this.afterSaleDao.create(
          {
            after_sale_no: afterSaleNo,
            order_id: data.orderId,
            order_no: order.order_no,
            user_id: order.user_id,
            merchant_id: order.merchant_id || 0,
            type: 1,
            reason: data.reason || '订单取消退款',
            amount: order.pay_amount || 0,
            status: 4,
            deadline: now,
            audited_at: now,
            completed_at: now,
            handle_remark: '订单取消自动退款',
            operator_id: data.operatorId,
            operator_name: data.operatorName,
          },
          { transaction }
        );

        await this.generateLedger(
          afterSaleRecord.id,
          data.orderId,
          {
            amount: order.pay_amount || 0,
            type: 1,
            refundAmount: order.pay_amount || 0,
            points: order.pay_amount || 0,
            cancelScene: data.cancelScene,
          },
          transaction
        );
      }

      await this.createOperationLog(
        0,
        '',
        data.orderId,
        order.order_no,
        'cancel_order',
        '取消订单',
        {
          cancelScene: data.cancelScene,
          reason: data.reason,
          wasPaid: order.pay_status === 1,
        },
        transaction
      );

      await transaction.commit();
      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rollbackStock(orderId: number, _afterSaleId: number, transaction: Transaction): Promise<any[]> {
    const orderItems = await this.orderItemDao.findAll({
      where: { order_id: orderId },
    });

    const details: any[] = [];

    if (!orderItems || orderItems.length === 0) {
      return details;
    }

    for (const item of orderItems) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (goods) {
        const quantity = Number(item.quantity || 0);
        const currentStock = Number(goods.stock || 0);
        const currentSales = Number(goods.sales || 0);

        await this.goodsDao.update(
          item.goods_id,
          {
            stock: currentStock + quantity,
            sales: Math.max(0, currentSales - quantity),
          },
          { transaction }
        );

        details.push({
          goodsId: item.goods_id,
          goodsName: item.goods_name,
          quantity,
          stockBefore: currentStock,
          stockAfter: currentStock + quantity,
          salesBefore: currentSales,
          salesAfter: Math.max(0, currentSales - quantity),
        });
      }
    }

    return details;
  }

  async deductSettleAmount(orderId: number, amount: number, transaction: Transaction): Promise<void> {
    const order = await this.orderDao.findById(orderId);
    if (!order || !order.merchant_id) return;

    const merchant = await this.merchantDao.findById(order.merchant_id);
    if (!merchant) return;

    const pendingSettle = Number(merchant.pending_settle_amount || 0);
    const deductedSettle = Number(merchant.deducted_settle_amount || 0);
    const deductAmount = Math.min(amount, pendingSettle);

    await this.merchantDao.update(
      order.merchant_id,
      {
        pending_settle_amount: pendingSettle - deductAmount,
        deducted_settle_amount: deductedSettle + deductAmount,
      },
      { transaction }
    );
  }

  async rollbackUserPoints(userId: number, points: number, transaction: Transaction): Promise<void> {
    if (!points || points <= 0) return;

    const user = await this.userDao.findById(userId);
    if (!user) return;

    const currentPoints = Number(user.points || 0);
    const currentTotalPayPoints = Number(user.total_pay_points || 0);

    await this.userDao.update(
      userId,
      {
        points: currentPoints + points,
        total_pay_points: Math.max(0, currentTotalPayPoints - points),
      },
      { transaction }
    );
  }

  async generateLedger(afterSaleId: number, orderId: number, data: any, transaction: Transaction): Promise<any> {
    const order = await this.orderDao.findById(orderId);

    const ledgerNo = 'LD' + Date.now() + Math.floor(Math.random() * 10000);

    const ledger = await this.afterSaleLedgerDao.create(
      {
        ledger_no: ledgerNo,
        after_sale_id: afterSaleId,
        order_id: orderId,
        order_no: order?.order_no || '',
        user_id: order?.user_id || 0,
        merchant_id: order?.merchant_id || 0,
        after_sale_type: data.type || 0,
        refund_amount: data.refundAmount || 0,
        points_rollback: data.points || 0,
        remark: data.remark || '',
      },
      { transaction }
    );

    return ledger;
  }

  async createOperationLog(
    afterSaleId: number,
    afterSaleNo: string,
    orderId: number,
    orderNo: string,
    action: string,
    actionDesc: string,
    data: any,
    transaction: Transaction
  ): Promise<any> {
    const log = await this.afterSaleOperationLogDao.create(
      {
        after_sale_id: afterSaleId,
        after_sale_no: afterSaleNo,
        order_id: orderId,
        order_no: orderNo,
        action,
        action_desc: actionDesc,
        old_status: data?.oldStatus ?? undefined,
        new_status: data?.newStatus ?? undefined,
        operator_id: data?.operatorId || 0,
        operator_name: data?.operatorName || '系统',
        fund_change: data?.amountChange ? JSON.stringify({ amountChange: data.amountChange }) : undefined,
        stock_change: data?.stockChange ? JSON.stringify(data.stockChange) : undefined,
        remark: data?.handleRemark || data?.reason || '',
        created_at: new Date(),
      },
      { transaction }
    );

    return log;
  }
}

export const afterSaleSyncService = new AfterSaleSyncService();
export default afterSaleSyncService;
