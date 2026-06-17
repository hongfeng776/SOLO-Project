import { BaseDao } from './BaseDao';
import { MerchantOrderRecord } from '../models/MerchantOrderRecord';

export class MerchantOrderRecordDao extends BaseDao<MerchantOrderRecord> {
  constructor() {
    super(MerchantOrderRecord);
  }
}

export default MerchantOrderRecordDao;
