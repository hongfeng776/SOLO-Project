import { BaseDao } from './BaseDao';
import { PaymentFlow } from '../models/PaymentFlow';

export class PaymentFlowDao extends BaseDao<PaymentFlow> {
  constructor() {
    super(PaymentFlow);
  }
}

export default PaymentFlowDao;
