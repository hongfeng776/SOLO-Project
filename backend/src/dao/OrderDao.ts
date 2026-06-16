import { BaseDao } from './BaseDao';
import { Order } from '../models/Order';

export class OrderDao extends BaseDao<Order> {
  constructor() {
    super(Order);
  }
}

export default OrderDao;
