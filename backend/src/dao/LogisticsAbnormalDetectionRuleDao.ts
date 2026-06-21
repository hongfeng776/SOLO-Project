import { BaseDao } from './BaseDao';
import { LogisticsAbnormalDetectionRule } from '../models/LogisticsAbnormalDetectionRule';

export class LogisticsAbnormalDetectionRuleDao extends BaseDao<LogisticsAbnormalDetectionRule> {
  constructor() {
    super(LogisticsAbnormalDetectionRule);
  }
}

export default LogisticsAbnormalDetectionRuleDao;
