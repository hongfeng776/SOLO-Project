import BaseDAO from './BaseDAO';
import { db } from '../models';
import BusinessInspection from '../models/BusinessInspection';

class BusinessInspectionDAO extends BaseDAO<BusinessInspection> {
  constructor() {
    super(db.BusinessInspection);
  }

  async findByInspectionNo(inspectionNo: string): Promise<BusinessInspection | null> {
    return this.model.findOne({ where: { inspection_no: inspectionNo } });
  }

  async findRunning(): Promise<BusinessInspection[]> {
    return this.model.findAll({ where: { inspection_status: 'running' }, order: [['created_at', 'DESC']] });
  }

  async findPendingIssues(inspectionId: number) {
    return db.BusinessInspectionIssue.findAll({
      where: { inspection_id: inspectionId, issue_status: 'pending' },
      order: [['violation_level', 'DESC'], ['created_at', 'ASC']],
    });
  }
}

export default new BusinessInspectionDAO();
