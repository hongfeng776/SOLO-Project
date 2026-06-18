import { BaseDao } from './BaseDao';
import { UserConsumptionLedger } from '../models/UserConsumptionLedger';

export class UserConsumptionLedgerDao extends BaseDao<UserConsumptionLedger> {
  constructor() {
    super(UserConsumptionLedger);
  }
}

export default UserConsumptionLedgerDao;
