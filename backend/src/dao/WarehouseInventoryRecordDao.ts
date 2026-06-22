import { BaseDao } from './BaseDao';
import { WarehouseInventoryRecord } from '../models/WarehouseInventoryRecord';

export class WarehouseInventoryRecordDao extends BaseDao<WarehouseInventoryRecord> {
  constructor() {
    super(WarehouseInventoryRecord);
  }
}

export default WarehouseInventoryRecordDao;
