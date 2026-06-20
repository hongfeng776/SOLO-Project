import { BaseDao } from './BaseDao';
import { MarketingProduct } from '../models/MarketingProduct';

export class MarketingProductDao extends BaseDao<MarketingProduct> {
  constructor() {
    super(MarketingProduct);
  }
}

export default MarketingProductDao;
