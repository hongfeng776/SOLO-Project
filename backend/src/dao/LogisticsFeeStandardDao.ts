import { BaseDao } from './BaseDao';
import { LogisticsFeeStandard } from '../models/LogisticsFeeStandard';

export class LogisticsFeeStandardDao extends BaseDao<LogisticsFeeStandard> {
  constructor() {
    super(LogisticsFeeStandard);
  }
}

export default LogisticsFeeStandardDao;
