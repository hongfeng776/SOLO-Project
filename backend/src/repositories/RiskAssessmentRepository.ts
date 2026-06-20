import { BaseRepository } from './BaseRepository';
import { RiskAssessment, RiskIndicator, Customer, User, Organization, RiskAssessmentBatch } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class RiskAssessmentRepository extends BaseRepository<RiskAssessment> {
  constructor() {
    super(RiskAssessment);
  }

  async findByAssessmentNo(assessmentNo: string): Promise<RiskAssessment | null> {
    return await this.model.findOne({ where: { assessment_no: assessmentNo } });
  }

  async findByCustomerId(customerId: string): Promise<RiskAssessment[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']]
    });
  }

  async findLatestByCustomerId(customerId: string): Promise<RiskAssessment | null> {
    return await this.model.findOne({
      where: { customer_id: customerId, status: 2 },
      order: [['assessment_time', 'DESC']]
    });
  }

  async findByBatchId(batchId: string): Promise<RiskAssessment[]> {
    return await this.model.findAll({ where: { batch_id: batchId } });
  }

  async generateAssessmentNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RAS${now}${random}`;
  }

  async countPendingByCustomerId(customerId: string): Promise<number> {
    return await this.model.count({
      where: { customer_id: customerId, status: { [Op.in]: [0, 1] } }
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { assessment_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.assessment_no) {
      where.assessment_no = { [Op.like]: `%${params.assessment_no}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.assessment_type !== undefined) {
      where.assessment_type = params.assessment_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.batch_id) {
      where.batch_id = params.batch_id;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.data_sync_status !== undefined) {
      where.data_sync_status = params.data_sync_status;
    }

    if (params.is_illegal_downgrade !== undefined) {
      where.is_illegal_downgrade = params.is_illegal_downgrade;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'risk_level', 'status']
    };
  }

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }

  getBatchInclude(): Includeable {
    return {
      model: RiskAssessmentBatch,
      required: false,
      attributes: ['id', 'batch_no', 'batch_name', 'batch_type', 'status']
    };
  }
}

export class RiskIndicatorRepository extends BaseRepository<RiskIndicator> {
  constructor() {
    super(RiskIndicator);
  }

  async findByIndicatorCode(indicatorCode: string): Promise<RiskIndicator | null> {
    return await this.model.findOne({ where: { indicator_code: indicatorCode } });
  }

  async findByCategory(category: number): Promise<RiskIndicator[]> {
    return await this.model.findAll({
      where: { category, status: 1 },
      order: [['sort_order', 'ASC']]
    });
  }

  async findAllActive(): Promise<RiskIndicator[]> {
    return await this.model.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { indicator_code: { [Op.like]: `%${params.keyword}%` } },
        { indicator_name: { [Op.like]: `%${params.keyword}%` } },
        { description: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.indicator_code) {
      where.indicator_code = { [Op.like]: `%${params.indicator_code}%` };
    }

    if (params.category !== undefined) {
      where.category = params.category;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.is_required !== undefined) {
      where.is_required = params.is_required;
    }

    return where;
  }
}

export class RiskAssessmentBatchRepository extends BaseRepository<RiskAssessmentBatch> {
  constructor() {
    super(RiskAssessmentBatch);
  }

  async findByBatchNo(batchNo: string): Promise<RiskAssessmentBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
  }

  async generateBatchNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RAB${now}${random}`;
  }

  async findPendingBatches(): Promise<RiskAssessmentBatch[]> {
    return await this.model.findAll({
      where: { status: { [Op.in]: [0, 1] } },
      order: [['created_at', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { batch_no: { [Op.like]: `%${params.keyword}%` } },
        { batch_name: { [Op.like]: `%${params.keyword}%` } },
        { remark: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.batch_no) {
      where.batch_no = { [Op.like]: `%${params.batch_no}%` };
    }

    if (params.batch_name) {
      where.batch_name = { [Op.like]: `%${params.batch_name}%` };
    }

    if (params.batch_type !== undefined) {
      where.batch_type = params.batch_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.creator_id) {
      where.creator_id = params.creator_id;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCreatorInclude(): Includeable {
    return {
      model: User,
      as: 'creator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}
