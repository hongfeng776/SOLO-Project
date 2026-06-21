import { BaseDao } from './BaseDao';
import { LogisticsProviderOperationLog } from '../models/LogisticsProviderOperationLog';

export class LogisticsProviderOperationLogDao extends BaseDao<LogisticsProviderOperationLog> {
  constructor() {
    super(LogisticsProviderOperationLog);
  }
}

export default LogisticsProviderOperationLogDao;
