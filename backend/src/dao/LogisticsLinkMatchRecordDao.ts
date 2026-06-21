import { BaseDao } from './BaseDao';
import { LogisticsLinkMatchRecord } from '../models/LogisticsLinkMatchRecord';

export class LogisticsLinkMatchRecordDao extends BaseDao<LogisticsLinkMatchRecord> {
  constructor() {
    super(LogisticsLinkMatchRecord);
  }
}

export default LogisticsLinkMatchRecordDao;
