import { BaseDao } from './BaseDao';
import { GoodsSnapshot } from '../models/GoodsSnapshot';

export class GoodsSnapshotDao extends BaseDao<GoodsSnapshot> {
  constructor() {
    super(GoodsSnapshot);
  }
}

export default GoodsSnapshotDao;
