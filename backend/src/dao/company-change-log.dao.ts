import { BaseDao } from './base.dao';
import { CompanyChangeLog } from '../models';
import CompanyChangeLogModel from '../models/company-change-log.model';

class CompanyChangeLogDao extends BaseDao<CompanyChangeLogModel> {
  constructor() {
    super(CompanyChangeLog);
  }

  async findByCompanyId(companyId: number, options: any = {}) {
    return this.findAll({
      where: { companyId },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findPendingAudit(options: any = {}) {
    return this.findAll({
      where: { auditStatus: 'pending', needAudit: true },
      order: [['id', 'DESC']],
      ...options,
    });
  }

  async findWithFilters(params: any = {}) {
    const { companyId, operatorId, action, auditStatus, startTime, endTime, changedFields, ...rest } = params;
    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (operatorId) where.operatorId = operatorId;
    if (action) where.action = action;
    if (auditStatus) where.auditStatus = auditStatus;
    if (changedFields) {
      const { Op } = require('sequelize');
      where.changedFields = { [Op.like]: `%${changedFields}%` };
    }
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at['$gte'] = new Date(startTime);
      if (endTime) where.created_at['$lte'] = new Date(endTime);
    }

    return this.paginate(rest, {
      where,
      order: [['id', 'DESC']],
    });
  }
}

export default new CompanyChangeLogDao();
