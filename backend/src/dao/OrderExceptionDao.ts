import { BaseDao } from './BaseDao';
import { OrderException } from '../models/OrderException';

export class OrderExceptionDao extends BaseDao<OrderException> {
  constructor() {
    super(OrderException);
  }
}

export default OrderExceptionDao;
