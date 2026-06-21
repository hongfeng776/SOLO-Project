import { BaseDao } from './BaseDao';
import { LogisticsFeeChangeLog } from '../models/LogisticsFeeChangeLog';

export class LogisticsFeeChangeLogDao extends BaseDao<LogisticsFeeChangeLog> {
  constructor() {
    super(LogisticsFeeChangeLog);
  }
}

export default LogisticsFeeChangeLogDao;
