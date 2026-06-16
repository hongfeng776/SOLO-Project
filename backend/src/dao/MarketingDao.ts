import { BaseDao } from './BaseDao';
import { Marketing } from '../models/Marketing';

export class MarketingDao extends BaseDao<Marketing> {
  constructor() {
    super(Marketing);
  }
}

export default MarketingDao;
