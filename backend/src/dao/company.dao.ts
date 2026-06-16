import { BaseDao } from './base.dao';
import { Company } from '../models';
import CompanyModel from '../models/company.model';

class CompanyDao extends BaseDao<CompanyModel> {
  constructor() {
    super(Company);
  }
}

export default new CompanyDao();
