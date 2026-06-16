import { BaseDao } from './BaseDao';
import { AfterSale } from '../models/AfterSale';

export class AfterSaleDao extends BaseDao<AfterSale> {
  constructor() {
    super(AfterSale);
  }
}

export default AfterSaleDao;
