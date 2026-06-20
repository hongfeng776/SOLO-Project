import { BaseDao } from './BaseDao';
import { MarketingCategory } from '../models/MarketingCategory';

export class MarketingCategoryDao extends BaseDao<MarketingCategory> {
  constructor() {
    super(MarketingCategory);
  }
}

export default MarketingCategoryDao;
