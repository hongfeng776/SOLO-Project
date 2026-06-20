import { BaseDao } from './BaseDao';
import { MarketingLog } from '../models/MarketingLog';

export class MarketingLogDao extends BaseDao<MarketingLog> {
  constructor() {
    super(MarketingLog);
  }
}

export default MarketingLogDao;
