import { daos } from '../dao';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Goods } from '../models/Goods';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  PENDING_RECEIPT = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum PayStatus {
  UNPAID = 0,
  PAID = 1,
}

export enum ShippingStatus {
  UNSHIPPED = 0,
  SHIPPED = 1,
}

export enum OperatorType {
  USER = 0,
  ADMIN = 1,
  SYSTEM = 2,
}

export enum OrderAction {
  CREATE = 'create',
  PAY = 'pay',
  CANCEL = 'cancel',
  SHIP = 'ship',
  RECEIVE = 'receive',
  COMPLETE = 'complete',
  REFUND = 'refund',
}

export const ORDER_STATUS_MAP: Record<number, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待付款',
  [OrderStatus.PENDING_SHIPMENT]: '待发货',
  [OrderStatus.PENDING_RECEIPT]: '待收货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
};

export interface OrderItemCreateData {
  goods_id: number;
  goods_name: string;
  goods_image?: string;
  spec_info?: string;
  price: number;
  quantity: number;
}

export interface CreateOrderParams {
  order_no: string;
  user_id: number;
  total_amount: number;
  pay_amount: number;
  items: OrderItemCreateData[];
  operator_id?: number;
  operator_type?: OperatorType;
  remark?: string;
}

export interface FlowOperationParams {
  order_id: number;
  operator_id?: number;
  operator_type: OperatorType;
  remark?: string;
}

class OrderFlowService {
  private readonly orderDao = daos.orderDao;
  private readonly orderLogDao = daos.orderLogDao;
  private readonly orderItemDao = daos.orderItemDao;
  private readonly goodsDao = daos.goodsDao;

  private readonly TRANSITION_MAP: Record<string, OrderStatus[]> = {
    [OrderAction.CANCEL]: [OrderStatus.PENDING_PAYMENT],
    [OrderAction.PAY]: [OrderStatus.PENDING_PAYMENT],
    [OrderAction.SHIP]: [OrderStatus.PENDING_SHIPMENT],
    [OrderAction.RECEIVE]: [OrderStatus.PENDING_RECEIPT],
    [OrderAction.COMPLETE]: [OrderStatus.PENDING_RECEIPT],
  };

  private async writeLog(
    orderId: number,
    action: OrderAction,
    oldStatus: number | undefined,
    newStatus: number | undefined,
    operatorId: number | undefined,
    operatorType: OperatorType,
    remark?: string
  ): Promise<void> {
    await this.orderLogDao.create({
      order_id: orderId,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      operator_id: operatorId,
      operator_type: operatorType,
      remark,
    });
  }

  private validateTransition(action: OrderAction, currentStatus: number): void {
    const allowedFrom = this.TRANSITION_MAP[action];
    if (!allowedFrom) {
      throw new AppError(`不支持的操作类型: ${action}`, 400);
    }
    if (!allowedFrom.includes(currentStatus as OrderStatus)) {
      const currentStatusName = ORDER_STATUS_MAP[currentStatus] || `未知(${currentStatus})`;
      const allowedNames = allowedFrom.map((s) => ORDER_STATUS_MAP[s]).join('、');
      throw new AppError(
        `当前订单状态为【${currentStatusName}】，无法执行该操作。仅允许在【${allowedNames}】状态下执行`,
        400
      );
    }
  }

  private async decreaseStock(items: OrderItemCreateData[], transaction: Transaction): Promise<void> {
    for (const item of items) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (!goods) {
        throw new AppError(`商品不存在: ID=${item.goods_id}`, 404);
      }
      const currentStock = (goods.stock as number) || 0;
      if (currentStock < item.quantity) {
        throw new AppError(
          `商品【${goods.name}】库存不足，当前库存: ${currentStock}，需要: ${item.quantity}`,
          400
        );
      }
      const [affectedCount] = await (Goods as any).update(
        {
          stock: currentStock - item.quantity,
        },
        {
          where: { id: item.goods_id },
          transaction,
        }
      );
      if (affectedCount === 0) {
        throw new AppError(`扣减库存失败: 商品ID=${item.goods_id}`, 500);
      }
    }
  }

  private async restoreStock(orderId: number, transaction: Transaction): Promise<void> {
    const items = await this.orderItemDao.findByOrderId(orderId);
    for (const item of items) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (goods) {
        const currentStock = (goods.stock as number) || 0;
        await (Goods as any).update(
          {
            stock: currentStock + item.quantity,
          },
          {
            where: { id: item.goods_id },
            transaction,
          }
        );
      }
    }
  }

  private async increaseSales(items: OrderItemCreateData[], transaction: Transaction): Promise<void> {
    for (const item of items) {
      const goods = await this.goodsDao.findById(item.goods_id);
      if (goods) {
        const currentSales = (goods.sales as number) || 0;
        await (Goods as any).update(
          {
            sales: currentSales + item.quantity,
          },
          {
            where: { id: item.goods_id },
            transaction,
          }
        );
      }
    }
  }

  async createOrder(params: CreateOrderParams): Promise<{ order: Order; items: OrderItem[] }> {
    const transaction = await sequelize.transaction();

    try {
      for (const item of params.items) {
        const goods = await this.goodsDao.findById(item.goods_id);
        if (!goods) {
          throw new AppError(`商品不存在: ID=${item.goods_id}`, 404);
        }
        if (!item.goods_name) {
          item.goods_name = goods.name;
        }
        if (!item.goods_image && goods.cover_image) {
          item.goods_image = goods.cover_image;
        }
      }

      const order = await this.orderDao.create(
        {
          order_no: params.order_no,
          user_id: params.user_id,
          total_amount: params.total_amount,
          pay_amount: params.pay_amount,
          status: OrderStatus.PENDING_PAYMENT,
          pay_status: PayStatus.UNPAID,
          shipping_status: ShippingStatus.UNSHIPPED,
        },
        { transaction }
      );

      const orderId = (order as any).id;
      const orderItemsData = params.items.map((item) => ({
        order_id: orderId,
        goods_id: item.goods_id,
        goods_name: item.goods_name,
        goods_image: item.goods_image,
        spec_info: item.spec_info,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const items = await this.orderItemDao.batchCreate(orderItemsData);
      await this.decreaseStock(params.items, transaction);

      await this.writeLog(
        orderId,
        OrderAction.CREATE,
        undefined,
        OrderStatus.PENDING_PAYMENT,
        params.operator_id ?? params.user_id,
        params.operator_type ?? OperatorType.USER,
        params.remark
      );

      await transaction.commit();
      return { order, items };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async pay(params: FlowOperationParams): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const order = await this.orderDao.findById(params.order_id);
      if (!order) {
        throw new AppError('订单不存在', 404);
      }

      this.validateTransition(OrderAction.PAY, (order.status as number) ?? 0);

      if ((order.pay_status as number) === PayStatus.PAID) {
        throw new AppError('订单已支付，请勿重复支付', 400);
      }

      const items = await this.orderItemDao.findByOrderId(params.order_id);
      const goodsItems = items.map((i) => ({
        goods_id: i.goods_id,
        goods_name: i.goods_name,
        goods_image: i.goods_image,
        spec_info: i.spec_info,
        price: Number(i.price),
        quantity: i.quantity,
      }));
      await this.increaseSales(goodsItems, transaction);

      await this.orderDao.update(
        params.order_id,
        {
          status: OrderStatus.PENDING_SHIPMENT,
          pay_status: PayStatus.PAID,
          pay_time: new Date(),
        } as any,
        { transaction }
      );

      await this.writeLog(
        params.order_id,
        OrderAction.PAY,
        order.status,
        OrderStatus.PENDING_SHIPMENT,
        params.operator_id,
        params.operator_type,
        params.remark
      );

      await transaction.commit();
      return (await this.orderDao.findById(params.order_id)) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async cancel(params: FlowOperationParams): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const order = await this.orderDao.findById(params.order_id);
      if (!order) {
        throw new AppError('订单不存在', 404);
      }

      this.validateTransition(OrderAction.CANCEL, (order.status as number) ?? 0);

      await this.restoreStock(params.order_id, transaction);

      await this.orderDao.update(
        params.order_id,
        {
          status: OrderStatus.CANCELLED,
        } as any,
        { transaction }
      );

      await this.writeLog(
        params.order_id,
        OrderAction.CANCEL,
        order.status,
        OrderStatus.CANCELLED,
        params.operator_id,
        params.operator_type,
        params.remark
      );

      await transaction.commit();
      return (await this.orderDao.findById(params.order_id)) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async ship(params: FlowOperationParams): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const order = await this.orderDao.findById(params.order_id);
      if (!order) {
        throw new AppError('订单不存在', 404);
      }

      this.validateTransition(OrderAction.SHIP, (order.status as number) ?? 0);

      if ((order.shipping_status as number) === ShippingStatus.SHIPPED) {
        throw new AppError('订单已发货，请勿重复操作', 400);
      }

      await this.orderDao.update(
        params.order_id,
        {
          status: OrderStatus.PENDING_RECEIPT,
          shipping_status: ShippingStatus.SHIPPED,
        } as any,
        { transaction }
      );

      await this.writeLog(
        params.order_id,
        OrderAction.SHIP,
        order.status,
        OrderStatus.PENDING_RECEIPT,
        params.operator_id,
        params.operator_type,
        params.remark
      );

      await transaction.commit();
      return (await this.orderDao.findById(params.order_id)) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async receive(params: FlowOperationParams): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const order = await this.orderDao.findById(params.order_id);
      if (!order) {
        throw new AppError('订单不存在', 404);
      }

      this.validateTransition(OrderAction.RECEIVE, (order.status as number) ?? 0);

      await this.orderDao.update(
        params.order_id,
        {
          status: OrderStatus.COMPLETED,
        } as any,
        { transaction }
      );

      await this.writeLog(
        params.order_id,
        OrderAction.RECEIVE,
        order.status,
        OrderStatus.COMPLETED,
        params.operator_id,
        params.operator_type,
        params.remark
      );

      await transaction.commit();
      return (await this.orderDao.findById(params.order_id)) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async complete(params: FlowOperationParams): Promise<Order> {
    const transaction = await sequelize.transaction();

    try {
      const order = await this.orderDao.findById(params.order_id);
      if (!order) {
        throw new AppError('订单不存在', 404);
      }

      this.validateTransition(OrderAction.COMPLETE, (order.status as number) ?? 0);

      await this.orderDao.update(
        params.order_id,
        {
          status: OrderStatus.COMPLETED,
        } as any,
        { transaction }
      );

      await this.writeLog(
        params.order_id,
        OrderAction.COMPLETE,
        order.status,
        OrderStatus.COMPLETED,
        params.operator_id,
        params.operator_type,
        params.remark
      );

      await transaction.commit();
      return (await this.orderDao.findById(params.order_id)) as Order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getOrderLogs(orderId: number): Promise<any[]> {
    const logs = await this.orderLogDao.findAll({
      where: { order_id: orderId } as any,
      order: [['created_at', 'DESC']],
    });
    return logs.map((log) => ({
      ...(log as any).toJSON(),
      old_status_text: log.old_status !== undefined ? ORDER_STATUS_MAP[log.old_status] : null,
      new_status_text: log.new_status !== undefined ? ORDER_STATUS_MAP[log.new_status] : null,
      operator_type_text:
        log.operator_type === OperatorType.USER
          ? '用户'
          : log.operator_type === OperatorType.ADMIN
          ? '管理员'
          : '系统',
    }));
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItemDao.findByOrderId(orderId);
  }

  canTransition(status: number, action: OrderAction): boolean {
    const allowedFrom = this.TRANSITION_MAP[action];
    if (!allowedFrom) return false;
    return allowedFrom.includes(status as OrderStatus);
  }
}

export const orderFlowService = new OrderFlowService();
export default OrderFlowService;
