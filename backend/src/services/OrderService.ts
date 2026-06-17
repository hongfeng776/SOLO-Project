import { Op, WhereOptions, Transaction } from 'sequelize';
import { daos } from '../dao';
import { Order } from '../models/Order';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';
import {
  orderValidateService,
  OrderStatus,
  CreateOrderData,
  ValidationResult,
  PayType,
} from './OrderValidateService';
import { orderBatchService, BatchQueryParams } from './OrderBatchService';
import { orderTraceService, OrderTraceData, OrderValidationReport } from './OrderTraceService';
import database from '../config/database';

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  order_no?: string;
  user_id?: number;
  status?: number;
  start_time?: string;
  end_time?: string;
  pay_type?: number;
  min_amount?: number;
  max_amount?: number;
  is_exception?: number;
  is_archived?: number;
  merchant_id?: number;
}

export interface OrderUpdateData {
  remark?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_province?: string;
  receiver_city?: string;
  receiver_district?: string;
  receiver_address?: string;
  logistics_company?: string;
  logistics_no?: string;
}

export interface OrderCreateResult {
  success: boolean;
  order?: Order;
  validationErrors?: ValidationResult[];
}

export interface EditOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
  forbiddenFields?: string[];
}

class OrderService {
  private readonly orderDao = daos.orderDao;
  private readonly orderItemDao = daos.orderItemDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly goodsSnapshotDao = daos.goodsSnapshotDao;
  private readonly paymentFlowDao = daos.paymentFlowDao;
  private readonly merchantOrderRecordDao = daos.merchantOrderRecordDao;
  private readonly orderLogDao = daos.orderLogDao;

  async getList(params: OrderQueryParams): Promise<PageResult<Order>> {
    const {
      page = 1,
      pageSize = 10,
      order_no,
      user_id,
      status,
      start_time,
      end_time,
      pay_type,
      min_amount,
      max_amount,
      is_exception,
      is_archived,
      merchant_id,
    } = params;

    const where: WhereOptions<Order> = {};

    if (order_no) {
      where.order_no = { [Op.like]: `%${order_no}%` };
    }
    if (user_id !== undefined) {
      where.user_id = user_id;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (start_time || end_time) {
      where.created_at = {};
      if (start_time) {
        (where.created_at as any)[Op.gte] = new Date(start_time);
      }
      if (end_time) {
        (where.created_at as any)[Op.lte] = new Date(end_time);
      }
    }
    if (pay_type !== undefined) {
      where.pay_type = pay_type;
    }
    if (min_amount !== undefined || max_amount !== undefined) {
      where.pay_amount = {};
      if (min_amount !== undefined) {
        (where.pay_amount as any)[Op.gte] = min_amount;
      }
      if (max_amount !== undefined) {
        (where.pay_amount as any)[Op.lte] = max_amount;
      }
    }
    if (is_exception !== undefined) {
      where.is_exception = is_exception;
    }
    if (is_archived !== undefined) {
      where.is_archived = is_archived;
    }
    if (merchant_id !== undefined) {
      where.merchant_id = merchant_id;
    }

    return this.orderDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getById(id: number): Promise<Order> {
    const order = await this.orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', 404);
    }
    return order;
  }

  async getDetailWithItems(id: number) {
    const order = await this.getById(id);
    const items = await this.orderItemDao.findAll({
      where: { order_id: id },
      order: [['id', 'ASC']],
    });
    return { order, items };
  }

  async createOrder(data: CreateOrderData): Promise<OrderCreateResult> {
    const validationResults = await orderValidateService.validateAll(data);

    if (validationResults.length > 0) {
      const tempOrder = await this.orderDao.create({
        order_no: data.orderNo,
        user_id: data.userId,
        merchant_id: data.merchantId,
        total_amount: data.totalAmount,
        pay_amount: data.payAmount,
        freight_amount: data.freightAmount || 0,
        discount_amount: data.discountAmount || 0,
        pay_type: data.payType,
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        receiver_province: data.receiverProvince,
        receiver_city: data.receiverCity,
        receiver_district: data.receiverDistrict,
        receiver_address: data.receiverAddress,
        remark: data.remark,
        status: OrderStatus.PENDING_PAYMENT,
        pay_status: 0,
        shipping_status: 0,
      });

      await orderValidateService.createExceptionOrder(tempOrder.id, data.orderNo, validationResults);

      const order = await this.getById(tempOrder.id);
      return {
        success: false,
        order,
        validationErrors: validationResults,
      };
    }

    const transaction: Transaction = await database.transaction();

    try {
      const order = await this.orderDao.create(
        {
          order_no: data.orderNo,
          user_id: data.userId,
          merchant_id: data.merchantId,
          total_amount: data.totalAmount,
          pay_amount: data.payAmount,
          freight_amount: data.freightAmount || 0,
          discount_amount: data.discountAmount || 0,
          pay_type: data.payType,
          receiver_name: data.receiverName,
          receiver_phone: data.receiverPhone,
          receiver_province: data.receiverProvince,
          receiver_city: data.receiverCity,
          receiver_district: data.receiverDistrict,
          receiver_address: data.receiverAddress,
          remark: data.remark,
          status: OrderStatus.PENDING_PAYMENT,
          pay_status: 0,
          shipping_status: 0,
        },
        { transaction }
      );

      for (const item of data.items) {
        await this.orderItemDao.create(
          {
            order_id: order.id,
            goods_id: item.goodsId,
            goods_name: item.goodsName,
            goods_image: item.goodsImage,
            spec_info: item.specInfo,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          },
          { transaction }
        );

        const goods = await this.goodsDao.findById(item.goodsId);
        if (goods) {
          await this.goodsSnapshotDao.create(
            {
              snapshot_no: `SNAP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              order_id: order.id,
              goods_id: item.goodsId,
              sku_code: goods.sku_code,
              name: goods.name,
              category_id: goods.category_id,
              brand_id: goods.brand_id,
              price: goods.price,
              original_price: goods.original_price,
              stock: goods.stock,
              cover_image: goods.cover_image,
              description: goods.description,
              merchant_id: goods.merchant_id,
              spec_info: item.specInfo,
              snapshot_data: goods.toJSON() as any,
            },
            { transaction }
          );

          await this.goodsDao.update(
            item.goodsId,
            {
              stock: (goods.stock || 0) - item.quantity,
              sales: (goods.sales || 0) + item.quantity,
            },
            { transaction }
          );
        }
      }

      if (data.payType !== PayType.UNKNOWN) {
        await this.paymentFlowDao.create(
          {
            flow_no: `FLOW${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            order_id: order.id,
            order_no: data.orderNo,
            user_id: data.userId,
            amount: data.payAmount,
            pay_type: data.payType,
            pay_status: 0,
            remark: '订单创建，等待支付',
          },
          { transaction }
        );
      }

      await this.orderLogDao.create(
        {
          order_id: order.id,
          operator_id: 0,
          operator_type: 2,
          action: '订单创建',
          remark: '订单创建成功，所有校验通过',
        },
        { transaction }
      );

      await transaction.commit();

      const createdOrder = await this.getById(order.id);
      return {
        success: true,
        order: createdOrder,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async editOrder(id: number, data: OrderUpdateData, _operatorId: number, _operatorName: string): Promise<EditOrderResult> {
    const order = await this.getById(id);
    const currentStatus = order.status as OrderStatus;

    const shippingFields = ['receiver_name', 'receiver_phone', 'receiver_province', 'receiver_city', 'receiver_district', 'receiver_address'];
    const isShippingEdit = Object.keys(data).some(key => shippingFields.includes(key));

    if (isShippingEdit) {
      const shippingValidation = orderValidateService.canEditShippingInfo(currentStatus);
      if (!shippingValidation.valid) {
        return {
          success: false,
          error: shippingValidation.reason,
          forbiddenFields: shippingValidation.fields,
        };
      }
    }

    if (data.remark !== undefined) {
      const remarkValidation = orderValidateService.canEditRemark(currentStatus);
      if (!remarkValidation.valid) {
        return {
          success: false,
          error: remarkValidation.reason,
          forbiddenFields: remarkValidation.fields,
        };
      }
    }

    const updateData: Partial<Order> = {};
    if (data.remark !== undefined) updateData.remark = data.remark;
    if (data.receiver_name !== undefined) updateData.receiver_name = data.receiver_name;
    if (data.receiver_phone !== undefined) updateData.receiver_phone = data.receiver_phone;
    if (data.receiver_province !== undefined) updateData.receiver_province = data.receiver_province;
    if (data.receiver_city !== undefined) updateData.receiver_city = data.receiver_city;
    if (data.receiver_district !== undefined) updateData.receiver_district = data.receiver_district;
    if (data.receiver_address !== undefined) updateData.receiver_address = data.receiver_address;
    if (data.logistics_company !== undefined) updateData.logistics_company = data.logistics_company;
    if (data.logistics_no !== undefined) updateData.logistics_no = data.logistics_no;

    await this.orderDao.update(id, updateData);

    const changedFields = Object.keys(data);
    await this.orderLogDao.create({
      order_id: id,
      operator_id: 1,
      operator_type: 1,
      action: '订单编辑',
      remark: `修改字段：${changedFields.join('、')}`,
    });

    const updatedOrder = await this.getById(id);
    return {
      success: true,
      order: updatedOrder,
    };
  }

  async updateOrderStatus(id: number, targetStatus: OrderStatus, _operatorId: number, _operatorName: string): Promise<EditOrderResult> {
    const order = await this.getById(id);
    const currentStatus = order.status as OrderStatus;

    const transitionValidation = orderValidateService.validateStatusTransition(currentStatus, targetStatus);
    if (!transitionValidation.valid) {
      return {
        success: false,
        error: transitionValidation.reason,
        forbiddenFields: transitionValidation.fields,
      };
    }

    await this.orderDao.update(id, { status: targetStatus });

    const statusNames: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_PAYMENT]: '待支付',
      [OrderStatus.PENDING_SHIPMENT]: '待发货',
      [OrderStatus.SHIPPED]: '已发货',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
    };

    await this.orderLogDao.create({
      order_id: id,
      operator_id: 1,
      operator_type: 1,
      action: '状态变更',
      remark: `从 [${statusNames[currentStatus]}] 变更为 [${statusNames[targetStatus]}]`,
    });

    const updatedOrder = await this.getById(id);
    return {
      success: true,
      order: updatedOrder,
    };
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.orderDao.delete(id);
  }

  async batchDelete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的订单', 400);
    }
    return this.orderDao.batchDelete(ids);
  }

  getBatchList(params: BatchQueryParams) {
    return orderBatchService.getBatchList(params);
  }

  batchRemind(ids: number[], operatorId: number, operatorName: string) {
    return orderBatchService.batchRemind(ids, operatorId, operatorName);
  }

  batchMarkException(ids: number[], operatorId: number, operatorName: string) {
    return orderBatchService.batchMarkException(ids, operatorId, operatorName);
  }

  batchArchive(ids: number[], operatorId: number, operatorName: string) {
    return orderBatchService.batchArchive(ids, operatorId, operatorName);
  }

  batchRemindByQuery(params: BatchQueryParams, operatorId: number, operatorName: string) {
    return orderBatchService.batchRemindByQuery(params, operatorId, operatorName);
  }

  batchMarkExceptionByQuery(params: BatchQueryParams, operatorId: number, operatorName: string) {
    return orderBatchService.batchMarkExceptionByQuery(params, operatorId, operatorName);
  }

  batchArchiveByQuery(params: BatchQueryParams, operatorId: number, operatorName: string) {
    return orderBatchService.batchArchiveByQuery(params, operatorId, operatorName);
  }

  getOrderTrace(orderId: number): Promise<OrderTraceData> {
    return orderTraceService.getOrderTrace(orderId);
  }

  validateOrderData(orderId: number): Promise<OrderValidationReport> {
    return orderTraceService.validateOrderData(orderId);
  }

  getOrderStatistics(orderId: number) {
    return orderTraceService.getOrderStatistics(orderId);
  }

  getUserOrderHistory(userId: number, limit?: number) {
    return orderTraceService.getUserOrderHistory(userId, limit);
  }

  async shipOrder(id: number, logisticsCompany: string, logisticsNo: string, operatorId: number, operatorName: string): Promise<EditOrderResult> {
    const order = await this.getById(id);
    const currentStatus = order.status as OrderStatus;

    if (currentStatus !== OrderStatus.PENDING_SHIPMENT) {
      return {
        success: false,
        error: '只有待发货状态的订单才能发货',
        forbiddenFields: ['status'],
      };
    }

    const transaction = await database.transaction();

    try {
      await this.orderDao.update(
        id,
        {
          status: OrderStatus.SHIPPED,
          shipping_status: 1,
          logistics_company: logisticsCompany,
          logistics_no: logisticsNo,
        },
        { transaction }
      );

      await this.merchantOrderRecordDao.create(
        {
          order_id: id,
          order_no: order.order_no,
          merchant_id: order.merchant_id || 0,
          merchant_name: '系统',
          operator_id: operatorId,
          operator_name: operatorName,
          action: 3,
          reason: `发货：${logisticsCompany} - ${logisticsNo}`,
          accept_time: new Date(),
        },
        { transaction }
      );

      await this.orderLogDao.create(
        {
          order_id: id,
          operator_id: 1,
          operator_type: 1,
          action: '订单发货',
          remark: `物流公司：${logisticsCompany}，物流单号：${logisticsNo}`,
        },
        { transaction }
      );

      await transaction.commit();

      const updatedOrder = await this.getById(id);
      return {
        success: true,
        order: updatedOrder,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async completeOrder(id: number, operatorId: number, operatorName: string): Promise<EditOrderResult> {
    return this.updateOrderStatus(id, OrderStatus.COMPLETED, operatorId, operatorName);
  }

  async cancelOrder(id: number, operatorId: number, operatorName: string, reason?: string): Promise<EditOrderResult> {
    const result = await this.updateOrderStatus(id, OrderStatus.CANCELLED, operatorId, operatorName);
    if (result.success) {
      await this.orderLogDao.create({
        order_id: id,
        operator_id: 1,
        operator_type: 1,
        action: '订单取消',
        remark: reason || '订单取消',
      });
    }
    return result;
  }
}

export const orderService = new OrderService();
export default OrderService;
