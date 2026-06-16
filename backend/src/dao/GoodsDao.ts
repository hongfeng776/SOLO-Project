import { BaseDao } from './BaseDao';
import { Goods } from '../models/Goods';

export class GoodsDao extends BaseDao<Goods> {
  constructor() {
    super(Goods);
  }
}

export default GoodsDao;
