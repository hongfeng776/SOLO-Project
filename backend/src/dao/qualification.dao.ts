import { BaseDao } from './base.dao';
import { Qualification } from '../models';

class QualificationDao extends BaseDao<any> {
  constructor() {
    super(Qualification);
  }

  async findByCreditCode(unifiedCreditCode: string) {
    return this.findOne({ where: { unifiedCreditCode } });
  }
}

export default new QualificationDao();
