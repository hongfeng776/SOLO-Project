import { BaseDao } from './BaseDao';
import { WarehouseOutboundRecord } from '../models/WarehouseOutboundRecord';

export class WarehouseOutboundRecordDao extends BaseDao<WarehouseOutboundRecord> {
  constructor() {
    super(WarehouseOutboundRecord);
  }
}

export default WarehouseOutboundRecordDao;
