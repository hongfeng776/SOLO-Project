import { Op, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { Order } from '../models/Order';
import { AppError } from '../middlewares/errorHandler';
import { PageResult } from '../types';

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  order_no?: string;
  user_id?: number;
  status?: number;
  start_time?: string;
  end_time?: string;
}

export interface OrderCreateData {
  order_no: string;
  user_id: number;
  total_amount: number;
  pay_amount: number;
  status?: number;
  pay_status?: number;
  pay_time?: Date;
  shipping_status?: number;
}

export interface OrderUpdateData {
  order_no?: string;
  user_id?: number;
  total_amount?: number;
  pay_amount?: number;
  status?: number;
  pay_status?: number;
  pay_time?: Date;
  shipping_status?: number;
}

class OrderService {
  private readonly orderDao = daos.orderDao;

  async getList(params: OrderQueryParams): Promise<PageResult<Order>> {
    const { page = 1, pageSize = 10, order_no, user_id, status, start_time, end_time } = params;

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

  async create(data: OrderCreateData): Promise<Order> {
    return this.orderDao.create({
      ...data,
      status: data.status ?? 0,
      pay_status: data.pay_status ?? 0,
      shipping_status: data.shipping_status ?? 0,
    });
  }

  async update(id: number, data: OrderUpdateData): Promise<Order> {
    await this.getById(id);
    await this.orderDao.update(id, data);
    return this.getById(id);
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

  async updateStatus(id: number, status: number): Promise<Order> {
    await this.getById(id);
    if (status < 0 || status > 4) {
      throw new AppError('无效的状态值', 400);
    }
    await this.orderDao.update(id, { status });
    return this.getById(id);
  }
}

export const orderService = new OrderService();
export default OrderService;
