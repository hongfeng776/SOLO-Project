import BaseDAO from './BaseDAO';
import { db } from '../models';
import CustomerQualification from '../models/CustomerQualification';

class CustomerQualificationDAO extends BaseDAO<CustomerQualification> {
  constructor() {
    super(db.CustomerQualification);
  }

  async findByQualificationNo(qualificationNo: string): Promise<CustomerQualification | null> {
    return this.model.findOne({ where: { qualification_no: qualificationNo } });
  }

  async findByCustomerId(customerId: number): Promise<CustomerQualification | null> {
    return this.model.findOne({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findPendingByReviewType(reviewType: string): Promise<CustomerQualification[]> {
    return this.model.findAll({
      where: { qualification_status: 'pending', review_type: reviewType },
      order: [['created_at', 'ASC']],
    });
  }

  async findExpireSoon(days: number): Promise<CustomerQualification[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.model.findAll({
      where: {
        qualification_status: 'approved',
        expire_warning_sent: false,
        expiry_date: { lte: threshold },
      },
    });
  }

  async findExpired(): Promise<CustomerQualification[]> {
    const now = new Date();
    return this.model.findAll({
      where: {
        qualification_status: 'approved',
        expiry_date: { lt: now },
      },
    });
  }

  async findApprovedByQualificationLevel(level: string): Promise<CustomerQualification[]> {
    return this.model.findAll({
      where: { qualification_status: 'approved', qualification_level: level },
    });
  }
}

export default new CustomerQualificationDAO();
