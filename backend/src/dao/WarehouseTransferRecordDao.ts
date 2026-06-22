import { BaseDao } from './BaseDao';
import { WarehouseTransferRecord } from '../models/WarehouseTransferRecord';

export class WarehouseTransferRecordDao extends BaseDao<WarehouseTransferRecord> {
  constructor() {
    super(WarehouseTransferRecord);
  }
}

export default WarehouseTransferRecordDao;
