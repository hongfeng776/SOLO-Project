import { BaseDao } from './BaseDao';
import { OperateLog } from '../models/OperateLog';

export class OperateLogDao extends BaseDao<OperateLog> {
  constructor() {
    super(OperateLog);
  }
}

export default OperateLogDao;
