import { BaseDao } from './BaseDao';
import { OrderItem } from '../models/OrderItem';

export class OrderItemDao extends BaseDao<OrderItem> {
  constructor() {
    super(OrderItem);
  }

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    return this.model.findAll({
      where: { order_id: orderId } as any,
      order: [['created_at', 'DESC']],
    });
  }

  async batchCreate(items: Partial<OrderItem['_attributes']>[]): Promise<OrderItem[]> {
    return this.model.bulkCreate(items as any);
  }
}

export default OrderItemDao;
