import { BaseDao } from './BaseDao';
import { ShipmentRecord } from '../models/ShipmentRecord';

export class ShipmentRecordDao extends BaseDao<ShipmentRecord> {
  constructor() {
    super(ShipmentRecord);
  }
}

export default ShipmentRecordDao;
