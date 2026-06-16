import { orderDao } from '../dao';
import { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { OrderStatus, CommissionStatus } from '../constants/enum';
import commissionEngineService from './CommissionEngine.service';
import { commissionDao } from '../dao';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';

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
    const result = await orderDao.create({
      ...data,
      orderNo,
      status: data.status ?? OrderStatus.PENDING_PAY,
    });
    await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);
    return result;
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
    const cacheKey = `${CacheKey.ORDER_DETAIL}${id}`;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    await CacheUtils.set(cacheKey, order, CacheTTL.MEDIUM);
    return order;
  }

  public async findAll(params: OrderQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const cacheKey = `${CacheKey.ORDER_LIST}${JSON.stringify(params)}`;
    const cached = await CacheUtils.get<PaginationResult<any>>(cacheKey);
    if (cached) return cached;

    const { rows, count } = await orderDao.findAllPaged(params);
    const result: PaginationResult<any> = {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async update(id: string, data: Partial<OrderAttributes>) {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    if (data.status !== undefined && data.status !== order.status) {
      const { status: _status, ...restData } = data;
      if (Object.keys(restData).length > 0) {
        await orderDao.update(restData, { where: { id } });
      }
      await this.updateStatus(id, data.status as OrderStatus);
      await this.clearOrderCache(id);
      return orderDao.findById(id);
    }
    await orderDao.update(data, { where: { id } });
    await this.clearOrderCache(id);
    return orderDao.findById(id);
  }

  public async updateStatus(id: string, status: OrderStatus, userId?: string): Promise<void> {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }

    const currentStatus = order.status as OrderStatus;

    this.validateStatusTransition(currentStatus, status);

    const updateData: Partial<OrderAttributes> = { status: status as any };

    switch (status) {
      case OrderStatus.PAID:
        updateData.payTime = new Date();
        await orderDao.update(updateData, { where: { id } });
        if (order.promoterId) {
          await commissionEngineService.calculateFromOrder(id);
        }
        break;

      case OrderStatus.COMPLETED:
        updateData.completeTime = new Date();
        await orderDao.update(updateData, { where: { id } });
        const commissions = await commissionDao.findByOrderId(id);
        for (const commission of commissions) {
          if (commission.status === CommissionStatus.PENDING) {
            await commissionDao.update(
              { status: CommissionStatus.SETTLING as any } as any,
              { where: { id: commission.id } }
            );
          }
        }
        break;

      case OrderStatus.CANCELLED:
        updateData.cancelTime = new Date();
        await orderDao.update(updateData, { where: { id } });
        if (order.promoterId) {
          await commissionEngineService.deductFromOrder(id, '订单取消，佣金扣减');
        }
        break;

      case OrderStatus.REFUNDED:
        await orderDao.update(updateData, { where: { id } });
        if (order.promoterId) {
          await commissionEngineService.deductFromOrder(id, '订单退款，佣金扣减');
        }
        break;

      case OrderStatus.SHIPPED:
        updateData.shipTime = new Date();
        await orderDao.update(updateData, { where: { id } });
        break;

      default:
        await orderDao.update(updateData, { where: { id } });
        break;
    }

    await this.clearOrderCache(id);
  }

  private validateStatusTransition(current: OrderStatus, target: OrderStatus): void {
    const validTransitions: Record<number, OrderStatus[]> = {
      [OrderStatus.PENDING_PAY]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDING],
      [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDING],
      [OrderStatus.COMPLETED]: [OrderStatus.REFUNDING],
      [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.COMPLETED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowed = validTransitions[current];
    if (!allowed || !allowed.includes(target)) {
      const statusLabels: Record<number, string> = {
        [OrderStatus.PENDING_PAY]: '待支付',
        [OrderStatus.PAID]: '已支付',
        [OrderStatus.SHIPPED]: '已发货',
        [OrderStatus.COMPLETED]: '已完成',
        [OrderStatus.CANCELLED]: '已取消',
        [OrderStatus.REFUNDING]: '退款中',
        [OrderStatus.REFUNDED]: '已退款',
      };
      throw new AppError(
        `订单状态不能从【${statusLabels[current]}】变更为【${statusLabels[target]}】`,
        BusinessCode.ERROR
      );
    }
  }

  public async delete(id: string): Promise<void> {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new AppError('订单不存在', BusinessCode.NOT_FOUND);
    }
    await orderDao.softDelete(id);
    await this.clearOrderCache(id);
  }

  public async bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要操作的记录', BusinessCode.PARAM_ERROR);
    }
    await orderDao.bulkUpdate(ids, data);
    await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);
  }

  public async export(params: OrderQueryParams) {
    const { rows } = await orderDao.findAllPaged({
      ...params,
      page: 1,
      pageSize: 99999,
    });
    return rows;
  }

  private async clearOrderCache(id: string): Promise<void> {
    await CacheUtils.del(`${CacheKey.ORDER_DETAIL}${id}`);
    await CacheUtils.delPattern(`${CacheKey.ORDER_LIST}*`);
  }
}

export default new OrderService();
