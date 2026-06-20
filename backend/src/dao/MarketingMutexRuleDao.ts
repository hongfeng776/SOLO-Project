import { BaseDao } from './BaseDao';
import { MarketingMutexRule } from '../models/MarketingMutexRule';

export class MarketingMutexRuleDao extends BaseDao<MarketingMutexRule> {
  constructor() {
    super(MarketingMutexRule);
  }
}

export default MarketingMutexRuleDao;
