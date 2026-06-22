import { BaseDao } from './BaseDao';
import { WarehouseInboundRecord } from '../models/WarehouseInboundRecord';

export class WarehouseInboundRecordDao extends BaseDao<WarehouseInboundRecord> {
  constructor() {
    super(WarehouseInboundRecord);
  }
}

export default WarehouseInboundRecordDao;
