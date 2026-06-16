import { orderDao } from '../dao';
import { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { OrderStatus } from '../constants/enum';

interface OrderQueryParams extends PaginationParams {
  keyword?: string;
  orderNo?: string;
  channelId?: string;
  promoterId?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}

class OrderService {
  public async create(data: OrderCreationAttributes) {
    const orderNo = await this.generateOrderNo();
    return orderDao.create({
      ...data,
      orderNo,
      status: data.status ?? OrderStatus.PENDING_PAY,
    });
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const orderNo = `O${timestamp}${random}`;
    const exists = await orderDao.existsByOrderNo(orderNo);
    if (exists) {
      return this.generateOrderNo();
    }
    return orderNo;
  }

  public async findById(id: string) {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    return order;
  }

  public async findAll(params: OrderQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await orderDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<OrderAttributes>) {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    await orderDao.update(data, { where: { id } });
    return orderDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    await orderDao.softDelete(id);
  }

  public async bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }
    await orderDao.bulkUpdate(ids, data);
  }

  public async export(params: OrderQueryParams) {
    const { rows } = await orderDao.findAllPaged({
      ...params,
      page: 1,
      pageSize: 99999,
    });
    return rows;
  }
}

export default new OrderService();
