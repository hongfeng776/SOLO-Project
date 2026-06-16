import BaseDAO from './BaseDAO';
import { db } from '../models';
import ComplianceAudit from '../models/ComplianceAudit';

class ComplianceAuditDAO extends BaseDAO<ComplianceAudit> {
  constructor() {
    super(db.ComplianceAudit);
  }

  async findByAuditNo(auditNo: string): Promise<ComplianceAudit | null> {
    return this.model.findOne({ where: { audit_no: auditNo } });
  }

  async findByAuditType(auditType: string): Promise<ComplianceAudit[]> {
    return this.model.findAll({ where: { audit_type: auditType } });
  }

  async findByAuditStatus(auditStatus: string): Promise<ComplianceAudit[]> {
    return this.model.findAll({ where: { audit_status: auditStatus } });
  }
}

export default new ComplianceAuditDAO();
