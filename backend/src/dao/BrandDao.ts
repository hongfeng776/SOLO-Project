import { BaseDao } from './BaseDao';
import { Brand } from '../models/Brand';

export class BrandDao extends BaseDao<Brand> {
  constructor() {
    super(Brand);
  }
}

export default BrandDao;
