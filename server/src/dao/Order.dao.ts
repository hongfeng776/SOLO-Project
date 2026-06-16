import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import Order, { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';

interface OrderQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  orderNo?: string;
  channelId?: string;
  promoterId?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}

class OrderDao {
  public async create(data: OrderCreationAttributes, options?: CreateOptions): Promise<Order> {
    return Order.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<Order | null> {
    return Order.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<Order | null> {
    return Order.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<Order[]> {
    return Order.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: Order[]; count: number }> {
    return Order.findAndCountAll(options);
  }

  public async update(data: Partial<OrderAttributes>, options: UpdateOptions): Promise<[number, Order[]]> {
    return Order.update(data, options) as unknown as Promise<[number, Order[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return Order.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return Order.count(options);
  }

  public async findById(id: string): Promise<Order | null> {
    return this.findByPk(id);
  }

  public async findAllPaged(params: OrderQueryParams): Promise<{ rows: Order[]; count: number }> {
    const { page, pageSize, keyword, orderNo, channelId, promoterId, status, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (keyword || orderNo) {
      const searchKeyword = keyword || orderNo;
      where.orderNo = { [Op.like]: `%${searchKeyword}%` };
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (promoterId) {
      where.promoterId = promoterId;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByOrderNo(orderNo: string): Promise<Order | null> {
    return this.findOne({ where: { orderNo } });
  }

  public async existsByOrderNo(orderNo: string): Promise<boolean> {
    const count = await this.count({ where: { orderNo } });
    return count > 0;
  }

  public async softDelete(id: string): Promise<number> {
    return this.destroy({ where: { id } });
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    return this.destroy({ where: { id: { [Op.in]: ids } } });
  }

  public async bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<[number, Order[]]> {
    return this.update(data, { where: { id: { [Op.in]: ids } } });
  }
}

export default new OrderDao();
