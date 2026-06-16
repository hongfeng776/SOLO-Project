import { BaseDao } from './BaseDao';
import { OrderLog } from '../models/OrderLog';

export class OrderLogDao extends BaseDao<OrderLog> {
  constructor() {
    super(OrderLog);
  }
}

export default OrderLogDao;
