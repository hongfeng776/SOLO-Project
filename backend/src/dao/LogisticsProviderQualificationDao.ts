import { BaseDao } from './BaseDao';
import { LogisticsProviderQualification } from '../models/LogisticsProviderQualification';

export class LogisticsProviderQualificationDao extends BaseDao<LogisticsProviderQualification> {
  constructor() {
    super(LogisticsProviderQualification);
  }
}

export default LogisticsProviderQualificationDao;
