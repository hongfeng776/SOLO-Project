import { BaseDao } from './BaseDao';
import { PaymentReconcile } from '../models/PaymentReconcile';

export class PaymentReconcileDao extends BaseDao<PaymentReconcile> {
  constructor() {
    super(PaymentReconcile);
  }
}

export default PaymentReconcileDao;
