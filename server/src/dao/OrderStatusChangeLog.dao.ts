import { FindOptions, Op } from 'sequelize';
import OrderStatusChangeLog, { OrderStatusChangeLogAttributes, OrderStatusChangeLogCreationAttributes } from '../models/OrderStatusChangeLog.model';
import { OrderStatus } from '../constants/enum';

class OrderStatusChangeLogDao {
  public async create(data: OrderStatusChangeLogCreationAttributes): Promise<OrderStatusChangeLog> {
    return OrderStatusChangeLog.create(data);
  }

  public async findByOrderId(orderId: string): Promise<OrderStatusChangeLog[]> {
    return OrderStatusChangeLog.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByOrderNo(orderNo: string): Promise<OrderStatusChangeLog[]> {
    return OrderStatusChangeLog.findAll({
      where: { orderNo },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAndCountAll(options: FindOptions): Promise<{ rows: OrderStatusChangeLog[]; count: number }> {
    return OrderStatusChangeLog.findAndCountAll(options);
  }

  public async countByOperatorInTimeWindow(operatorId: string, startTime: Date, endTime: Date): Promise<number> {
    return OrderStatusChangeLog.count({
      where: {
        operatorId,
        createdAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }

  public async countByIpInTimeWindow(ip: string, startTime: Date, endTime: Date): Promise<number> {
    return OrderStatusChangeLog.count({
      where: {
        ip,
        createdAt: {
          [Op.gte]: startTime,
          [Op.lte]: endTime,
        },
      },
    });
  }

  public async getRecentChangesByOrder(orderId: string, limit: number = 10): Promise<OrderStatusChangeLog[]> {
    return OrderStatusChangeLog.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  public async findByOperator(operatorId: string, page: number, pageSize: number): Promise<{ rows: OrderStatusChangeLog[]; count: number }> {
    const offset = (page - 1) * pageSize;
    return OrderStatusChangeLog.findAndCountAll({
      where: { operatorId },
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async validateChangeConsistency(orderId: string, expectedFromStatus: OrderStatus): Promise<{ valid: boolean; latestStatus?: OrderStatus; message?: string }> {
    const latestChange = await OrderStatusChangeLog.findOne({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });

    if (!latestChange) {
      return { valid: true };
    }

    if (latestChange.toStatus !== expectedFromStatus) {
      return {
        valid: false,
        latestStatus: latestChange.toStatus,
        message: `订单最新状态为${latestChange.toStatus}，与预期起始状态${expectedFromStatus}不一致`,
      };
    }

    return { valid: true };
  }
}

export default new OrderStatusChangeLogDao();
