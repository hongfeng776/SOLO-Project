import { BaseDao } from './base.dao';
import OperationLogModel from '../models/operation-log.model';

class OperationLogDao extends BaseDao<OperationLogModel> {
  constructor() {
    super(OperationLogModel);
  }
}

export default new OperationLogDao();
