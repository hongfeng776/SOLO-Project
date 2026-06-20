import BaseDAO from './BaseDAO';
import { db } from '../models';
import TradeComplianceAudit from '../models/TradeComplianceAudit';

class TradeComplianceAuditDAO extends BaseDAO<TradeComplianceAudit> {
  constructor() {
    super(db.TradeComplianceAudit);
  }

  async findByAuditNo(auditNo: string): Promise<TradeComplianceAudit | null> {
    return this.model.findOne({ where: { audit_no: auditNo } });
  }

  async findByTradeId(tradeId: number): Promise<TradeComplianceAudit | null> {
    return this.model.findOne({ where: { trade_id: tradeId } });
  }

  async findPendingByRiskCategory(riskCategory: string): Promise<TradeComplianceAudit[]> {
    return this.model.findAll({
      where: { compliance_status: 'manual_pending', risk_category: riskCategory },
      order: [['timeout_flag', 'DESC'], ['created_at', 'ASC']],
    });
  }

  async findTimeoutPending(): Promise<TradeComplianceAudit[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        compliance_status: { in: ['pending', 'manual_pending'] },
        timeout_flag: false,
        compliance_deadline: { lt: now },
      },
    });
  }

  async findReviewedByDateRange(startDate: string, endDate: string): Promise<TradeComplianceAudit[]> {
    const { Op } = await import('sequelize');
    return this.model.findAll({
      where: {
        compliance_status: { in: ['approved', 'rejected'] },
        review_at: { [Op.between]: [startDate, endDate] },
      },
    });
  }
}

export default new TradeComplianceAuditDAO();
