import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { Order } from '../models/Order';
import { OrderStatus, ExceptionType } from './OrderValidateService';
import { AppError } from '../middlewares/errorHandler';

export interface BatchQueryParams {
  page?: number;
  pageSize?: number;
  orderNo?: string;
  payType?: number;
  status?: number;
  startTime?: string;
  endTime?: string;
  minAmount?: number;
  maxAmount?: number;
  isException?: number;
  isArchived?: number;
  merchantId?: number;
  userId?: number;
}

export interface BatchRemindResult {
  success: number;
  failed: number;
  total: number;
  details: Array<{ id: number; orderNo: string; success: boolean; message?: string }>;
}

export interface BatchMarkResult {
  success: number;
  failed: number;
  total: number;
}

export interface BatchArchiveResult {
  success: number;
  failed: number;
  total: number;
}

class OrderBatchService {
  private readonly orderDao = daos.orderDao;
  private readonly orderExceptionDao = daos.orderExceptionDao;
  private readonly messageDao = daos.messageDao;
  private readonly orderLogDao = daos.orderLogDao;

  buildQueryConditions(params: BatchQueryParams): WhereOptions<Order> {
    const where: WhereOptions<Order> = {};

    if (params.orderNo) {
      where.order_no = { [Op.like]: `%${params.orderNo}%` };
    }
    if (params.payType !== undefined) {
      where.pay_type = params.payType;
    }
    if (params.status !== undefined) {
      where.status = params.status;
    }
    if (params.startTime || params.endTime) {
      where.created_at = {};
      if (params.startTime) {
        (where.created_at as any)[Op.gte] = new Date(params.startTime);
      }
      if (params.endTime) {
        (where.created_at as any)[Op.lte] = new Date(params.endTime);
      }
    }
    if (params.minAmount !== undefined || params.maxAmount !== undefined) {
      where.pay_amount = {};
      if (params.minAmount !== undefined) {
        (where.pay_amount as any)[Op.gte] = params.minAmount;
      }
      if (params.maxAmount !== undefined) {
        (where.pay_amount as any)[Op.lte] = params.maxAmount;
      }
    }
    if (params.isException !== undefined) {
      where.is_exception = params.isException;
    }
    if (params.isArchived !== undefined) {
      where.is_archived = params.isArchived;
    }
    if (params.merchantId !== undefined) {
      where.merchant_id = params.merchantId;
    }
    if (params.userId !== undefined) {
      where.user_id = params.userId;
    }

    return where;
  }

  async getBatchList(params: BatchQueryParams) {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.buildQueryConditions(queryParams);

    return this.orderDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getIdsByQuery(params: BatchQueryParams): Promise<number[]> {
    const where = this.buildQueryConditions(params);
    const orders = await this.orderDao.findAll({
      where,
      attributes: ['id'],
    });
    return orders.map(o => o.id);
  }

  async batchRemind(ids: number[], _operatorId: number, _operatorName: string): Promise<BatchRemindResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要提醒的订单', 400);
    }

    const details: Array<{ id: number; orderNo: string; success: boolean; message?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    const orders = await this.orderDao.findAll({
      where: { id: { [Op.in]: ids }, status: OrderStatus.PENDING_PAYMENT },
    });

    const orderMap = new Map(orders.map(o => [o.id, o]));

    for (const id of ids) {
      const order = orderMap.get(id);
      if (!order) {
        failedCount++;
        details.push({ id, orderNo: '未知', success: false, message: '订单不存在或不是待支付状态' });
        continue;
      }

      try {
        await this.messageDao.create({
          user_type: 1,
          user_id: order.user_id,
          type: 2,
          title: '支付提醒',
          content: `您的订单 ${order.order_no} 尚未支付，请尽快完成支付。`,
          is_read: 0,
        });

        await this.orderLogDao.create({
          order_id: order.id,
          operator_id: 1,
          operator_type: 1,
          action: '批量提醒支付',
          remark: '系统批量发送支付提醒',
        });

        successCount++;
        details.push({ id, orderNo: order.order_no, success: true });
      } catch (error) {
        failedCount++;
        details.push({ id, orderNo: order.order_no, success: false, message: error instanceof Error ? error.message : '未知错误' });
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      total: ids.length,
      details,
    };
  }

  async batchMarkException(ids: number[], _operatorId: number, _operatorName: string): Promise<BatchMarkResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要标记的订单', 400);
    }

    let successCount = 0;
    let failedCount = 0;

    const orders = await this.orderDao.findAll({
      where: { id: { [Op.in]: ids } },
    });

    for (const order of orders) {
      try {
        await this.orderDao.update(order.id, {
          is_exception: 1,
        });

        const existingException = await this.orderExceptionDao.findAll({
          where: { order_id: order.id },
        });

        if (existingException.length === 0) {
          await this.orderExceptionDao.create({
            order_id: order.id,
            order_no: order.order_no,
            type: ExceptionType.OTHER,
            reason: '人工标记为异常订单',
            status: 0,
          });
        }

        await this.orderLogDao.create({
          order_id: order.id,
          operator_id: 1,
          operator_type: 1,
          action: '批量标记异常',
          remark: '人工批量标记为异常订单',
        });

        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      total: ids.length,
    };
  }

  async batchArchive(ids: number[], _operatorId: number, _operatorName: string): Promise<BatchArchiveResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要归档的订单', 400);
    }

    let successCount = 0;
    let failedCount = 0;

    const orders = await this.orderDao.findAll({
      where: { id: { [Op.in]: ids }, is_archived: 0 },
    });

    for (const order of orders) {
      try {
        await this.orderDao.update(order.id, {
          is_archived: 1,
        });

        await this.orderLogDao.create({
          order_id: order.id,
          operator_id: 1,
          operator_type: 1,
          action: '批量归档',
          remark: '无效订单批量归档',
        });

        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      total: ids.length,
    };
  }

  async batchRemindByQuery(params: BatchQueryParams, operatorId: number, operatorName: string): Promise<BatchRemindResult> {
    const ids = await this.getIdsByQuery(params);
    return this.batchRemind(ids, operatorId, operatorName);
  }

  async batchMarkExceptionByQuery(params: BatchQueryParams, operatorId: number, operatorName: string): Promise<BatchMarkResult> {
    const ids = await this.getIdsByQuery(params);
    return this.batchMarkException(ids, operatorId, operatorName);
  }

  async batchArchiveByQuery(params: BatchQueryParams, operatorId: number, operatorName: string): Promise<BatchArchiveResult> {
    const ids = await this.getIdsByQuery(params);
    return this.batchArchive(ids, operatorId, operatorName);
  }
}

export const orderBatchService = new OrderBatchService();
export default OrderBatchService;
