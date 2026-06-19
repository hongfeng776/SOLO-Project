import { BaseRepository } from './BaseRepository';
import { CorporateProfile, CorporateProfileLog, CorporateProfileBatch, CorporateProfileBatchItem, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class CorporateProfileRepository extends BaseRepository<CorporateProfile> {
  constructor() {
    super(CorporateProfile);
  }

  async findByProfileNo(profileNo: string): Promise<CorporateProfile | null> {
    return await this.model.findOne({ where: { profile_no: profileNo } });
  }

  async findByCreditCode(creditCode: string): Promise<CorporateProfile | null> {
    return await this.model.findOne({ where: { credit_code: creditCode, status: { [Op.ne]: 3 } } });
  }

  async findAllByCreditCode(creditCode: string): Promise<CorporateProfile[]> {
    return await this.model.findAll({ where: { credit_code: creditCode }, order: [['created_at', 'DESC']] });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { profile_no: { [Op.like]: `%${params.keyword}%` } },
        { enterprise_name: { [Op.like]: `%${params.keyword}%` } },
        { credit_code: { [Op.like]: `%${params.keyword}%` } },
        { legal_representative: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.profile_no) {
      where.profile_no = { [Op.like]: `%${params.profile_no}%` };
    }

    if (params.enterprise_name) {
      where.enterprise_name = { [Op.like]: `%${params.enterprise_name}%` };
    }

    if (params.credit_code) {
      where.credit_code = { [Op.like]: `%${params.credit_code}%` };
    }

    if (params.customer_type !== undefined) {
      where.customer_type = params.customer_type;
    }

    if (params.business_status !== undefined) {
      where.business_status = params.business_status;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.need_complete !== undefined) {
      where.need_complete = params.need_complete;
    }

    if (params.is_abnormal !== undefined) {
      where.is_abnormal = params.is_abnormal;
    }

    if (params.is_dishonest !== undefined) {
      where.is_dishonest = params.is_dishonest;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
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

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}

export class CorporateProfileLogRepository extends BaseRepository<CorporateProfileLog> {
  constructor() {
    super(CorporateProfileLog);
  }

  async findByProfileId(profileId: string): Promise<CorporateProfileLog[]> {
    return await this.model.findAll({
      where: { profile_id: profileId },
      order: [['operate_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async findByCreditCode(creditCode: string): Promise<CorporateProfileLog[]> {
    const profiles = await CorporateProfile.findAll({ where: { credit_code: creditCode }, attributes: ['id'] });
    const profileIds = profiles.map(p => p.id);
    return await this.model.findAll({
      where: { profile_id: profileIds },
      order: [['operate_time', 'DESC']]
    });
  }
}

export class CorporateProfileBatchRepository extends BaseRepository<CorporateProfileBatch> {
  constructor() {
    super(CorporateProfileBatch);
  }

  async findByBatchNo(batchNo: string): Promise<CorporateProfileBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
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

    if (params.batch_name) {
      where.batch_name = { [Op.like]: `%${params.batch_name}%` };
    }

    if (params.update_type !== undefined) {
      where.update_type = params.update_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
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

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}

export class CorporateProfileBatchItemRepository extends BaseRepository<CorporateProfileBatchItem> {
  constructor() {
    super(CorporateProfileBatchItem);
  }

  async findByBatchId(batchId: string): Promise<CorporateProfileBatchItem[]> {
    return await this.model.findAll({
      where: { batch_id: batchId },
      order: [['row_index', 'ASC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.batch_id) {
      where.batch_id = params.batch_id;
    }

    if (params.process_result !== undefined) {
      where.process_result = params.process_result;
    }

    if (params.keyword) {
      where[Op.or] = [
        { enterprise_name: { [Op.like]: `%${params.keyword}%` } },
        { credit_code: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    return where;
  }
}
