import { BaseDao } from './BaseDao';
import { GoodsEditLog } from '../models/GoodsEditLog';

export class GoodsEditLogDao extends BaseDao<GoodsEditLog> {
  constructor() {
    super(GoodsEditLog);
  }
}

export default GoodsEditLogDao;
