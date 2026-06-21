import { BaseRepository } from './BaseRepository';
import { BlacklistRecord, BlacklistBatch, BlacklistTraceLog, ViolationRecord, Customer, User, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class BlacklistRecordRepository extends BaseRepository<BlacklistRecord> {
  constructor() {
    super(BlacklistRecord);
  }

  async findByBlacklistNo(blacklistNo: string): Promise<BlacklistRecord | null> {
    return await this.model.findOne({ where: { blacklist_no: blacklistNo } });
  }

  async findByCustomerId(customerId: string): Promise<BlacklistRecord[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']]
    });
  }

  async findActiveByCustomerId(customerId: string): Promise<BlacklistRecord | null> {
    return await this.model.findOne({
      where: {
        customer_id: customerId,
        status: { [Op.in]: [1, 2] }
      },
      order: [['created_at', 'DESC']]
    });
  }

  async findByBatchId(batchId: string): Promise<BlacklistRecord[]> {
    return await this.model.findAll({ where: { batch_id: batchId } });
  }

  async generateBlacklistNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BLK${now}${random}`;
  }

  async countByGrade(grade: number, startTime?: string, endTime?: string): Promise<number> {
    const where: any = { grade };
    if (startTime || endTime) {
      where.created_at = {};
      if (startTime) where.created_at[Op.gte] = dayjs(startTime).startOf('day').toDate();
      if (endTime) where.created_at[Op.lte] = dayjs(endTime).endOf('day').toDate();
    }
    return await this.model.count({ where });
  }

  async countByStatus(status: number): Promise<number> {
    return await this.model.count({ where: { status } });
  }

  async countExpireSoon(days: number = 7): Promise<number> {
    const expireDate = dayjs().add(days, 'day').endOf('day').toDate();
    return await this.model.count({
      where: {
        status: 1,
        expire_date: { [Op.lte]: expireDate, [Op.gte]: dayjs().startOf('day').toDate() }
      }
    });
  }

  async countReviewDue(): Promise<number> {
    const now = dayjs().startOf('day').toDate();
    return await this.model.count({
      where: {
        status: 1,
        next_review_date: { [Op.lte]: now }
      }
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { blacklist_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.blacklist_no) {
      where.blacklist_no = { [Op.like]: `%${params.blacklist_no}%` };
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.id_card_no) {
      where.id_card_no = { [Op.like]: `%${params.id_card_no}%` };
    }

    if (params.grade !== undefined && params.grade !== null) {
      where.grade = params.grade;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
    }

    if (params.violation_type !== undefined && params.violation_type !== null) {
      where.violation_type = params.violation_type;
    }

    if (params.is_auto_remind !== undefined && params.is_auto_remind !== null) {
      where.auto_remind = params.is_auto_remind;
    }

    if (params.start_date) {
      where.created_at = { ...where.created_at, [Op.gte]: dayjs(params.start_date).startOf('day').toDate() };
    }

    if (params.end_date) {
      where.created_at = { ...where.created_at, [Op.lte]: dayjs(params.end_date).endOf('day').toDate() };
    }

    if (params.expire_start_date) {
      where.expire_date = { ...where.expire_date, [Op.gte]: dayjs(params.expire_start_date).startOf('day').toDate() };
    }

    if (params.expire_end_date) {
      where.expire_date = { ...where.expire_date, [Op.lte]: dayjs(params.expire_end_date).endOf('day').toDate() };
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    return where;
  }

  getDefaultInclude(): Includeable[] {
    return [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'customer_type', 'customer_level', 'mobile', 'risk_level']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'real_name']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'username', 'real_name']
      },
      {
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'code']
      }
    ];
  }
}

export class BlacklistBatchRepository extends BaseRepository<BlacklistBatch> {
  constructor() {
    super(BlacklistBatch);
  }

  async findByBatchNo(batchNo: string): Promise<BlacklistBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
  }

  async generateBatchNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BBT${now}${random}`;
  }

  async findPendingBatches(): Promise<BlacklistBatch[]> {
    return await this.model.findAll({
      where: { status: 0 },
      order: [['created_at', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { batch_no: { [Op.like]: `%${params.keyword}%` } },
        { batch_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.batch_no) {
      where.batch_no = { [Op.like]: `%${params.batch_no}%` };
    }

    if (params.batch_type !== undefined && params.batch_type !== null) {
      where.batch_type = params.batch_type;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
    }

    if (params.start_date) {
      where.created_at = { ...where.created_at, [Op.gte]: dayjs(params.start_date).startOf('day').toDate() };
    }

    if (params.end_date) {
      where.created_at = { ...where.created_at, [Op.lte]: dayjs(params.end_date).endOf('day').toDate() };
    }

    if (params.creator_id) {
      where.creator_id = params.creator_id;
    }

    return where;
  }

  getDefaultInclude(): Includeable[] {
    return [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'real_name']
      },
      {
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'code']
      }
    ];
  }
}

export class BlacklistTraceLogRepository extends BaseRepository<BlacklistTraceLog> {
  constructor() {
    super(BlacklistTraceLog);
  }

  async findByBlacklistId(blacklistId: string): Promise<BlacklistTraceLog[]> {
    return await this.model.findAll({
      where: { blacklist_id: blacklistId },
      order: [['created_at', 'DESC']]
    });
  }

  async findNonCompliant(blacklistId?: string): Promise<BlacklistTraceLog[]> {
    const where: any = { is_compliant: 0 };
    if (blacklistId) {
      where.blacklist_id = blacklistId;
    }
    return await this.model.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.blacklist_id) {
      where.blacklist_id = params.blacklist_id;
    }

    if (params.trace_type !== undefined && params.trace_type !== null) {
      where.trace_type = params.trace_type;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.start_date) {
      where.created_at = { ...where.created_at, [Op.gte]: dayjs(params.start_date).startOf('day').toDate() };
    }

    if (params.end_date) {
      where.created_at = { ...where.created_at, [Op.lte]: dayjs(params.end_date).endOf('day').toDate() };
    }

    return where;
  }

  getDefaultInclude(): Includeable[] {
    return [
      {
        model: BlacklistRecord,
        as: 'blacklist',
        attributes: ['id', 'blacklist_no', 'customer_id', 'customer_no', 'customer_name']
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'username', 'real_name']
      }
    ];
  }
}
