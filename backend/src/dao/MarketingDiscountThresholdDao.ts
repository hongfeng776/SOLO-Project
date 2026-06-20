import { BaseDao } from './BaseDao';
import { MarketingDiscountThreshold } from '../models/MarketingDiscountThreshold';

export class MarketingDiscountThresholdDao extends BaseDao<MarketingDiscountThreshold> {
  constructor() {
    super(MarketingDiscountThreshold);
  }
}

export default MarketingDiscountThresholdDao;
