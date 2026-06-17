import { BaseDao } from './base.dao';
import { QualificationAuditLog } from '../models';

class QualificationAuditLogDao extends BaseDao<any> {
  constructor() {
    super(QualificationAuditLog);
  }

  async findByQualificationId(qualificationId: number) {
    return this.findAll({
      where: { qualificationId },
      order: [['id', 'DESC']],
    });
  }
}

export default new QualificationAuditLogDao();
