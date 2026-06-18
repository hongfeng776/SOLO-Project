import { BaseDao } from './BaseDao';
import { AfterSaleLedger } from '../models/AfterSaleLedger';

export class AfterSaleLedgerDao extends BaseDao<AfterSaleLedger> {
  constructor() {
    super(AfterSaleLedger);
  }
}

export default AfterSaleLedgerDao;
