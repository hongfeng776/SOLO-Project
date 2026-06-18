import { BaseDao } from './BaseDao';
import { AfterSaleOperationLog } from '../models/AfterSaleOperationLog';

export class AfterSaleOperationLogDao extends BaseDao<AfterSaleOperationLog> {
  constructor() {
    super(AfterSaleOperationLog);
  }
}

export default AfterSaleOperationLogDao;
