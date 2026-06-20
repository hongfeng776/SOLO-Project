import { BaseDao } from './BaseDao';
import { MarketingMerchantQualification } from '../models/MarketingMerchantQualification';

export class MarketingMerchantQualificationDao extends BaseDao<MarketingMerchantQualification> {
  constructor() {
    super(MarketingMerchantQualification);
  }
}

export default MarketingMerchantQualificationDao;
