import { BaseDao } from './BaseDao';
import { Merchant } from '../models/Merchant';

export class MerchantDao extends BaseDao<Merchant> {
  constructor() {
    super(Merchant);
  }
}

export default MerchantDao;
