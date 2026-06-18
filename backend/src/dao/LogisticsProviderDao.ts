import { BaseDao } from './BaseDao';
import { LogisticsProvider } from '../models/LogisticsProvider';

export class LogisticsProviderDao extends BaseDao<LogisticsProvider> {
  constructor() {
    super(LogisticsProvider);
  }
}

export default LogisticsProviderDao;
