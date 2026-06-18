import { BaseRepository } from './BaseRepository';
import { CustomerProfile, CustomerProfileLog, CustomerProfileBatch, CustomerProfileBatchItem, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class CustomerProfileRepository extends BaseRepository<CustomerProfile> {
  constructor() {
    super(CustomerProfile);
  }

  async findByProfileNo(profileNo: string): Promise<CustomerProfile | null> {
    return await this.model.findOne({ where: { profile_no: profileNo } });
  }

  async findByIdCardNo(idCardNo: string): Promise<CustomerProfile | null> {
    return await this.model.findOne({ where: { id_card_no: idCardNo, status: { [Op.ne]: 3 } } });
  }

  async findAllByIdCardNo(idCardNo: string): Promise<CustomerProfile[]> {
    return await this.model.findAll({ where: { id_card_no: idCardNo }, order: [['created_at', 'DESC']] });
  }

  async findByMobile(mobile: string): Promise<CustomerProfile | null> {
    return await this.model.findOne({ where: { mobile, status: { [Op.ne]: 3 } } });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { profile_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } },
        { mobile: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.profile_no) {
      where.profile_no = { [Op.like]: `%${params.profile_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.id_card_no) {
      where.id_card_no = { [Op.like]: `%${params.id_card_no}%` };
    }

    if (params.mobile) {
      where.mobile = { [Op.like]: `%${params.mobile}%` };
    }

    if (params.customer_level !== undefined) {
      where.customer_level = params.customer_level;
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

export class CustomerProfileLogRepository extends BaseRepository<CustomerProfileLog> {
  constructor() {
    super(CustomerProfileLog);
  }

  async findByProfileId(profileId: string): Promise<CustomerProfileLog[]> {
    return await this.model.findAll({
      where: { profile_id: profileId },
      order: [['operate_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async findByIdCardNo(idCardNo: string): Promise<CustomerProfileLog[]> {
    const profiles = await CustomerProfile.findAll({ where: { id_card_no: idCardNo }, attributes: ['id'] });
    const profileIds = profiles.map(p => p.id);
    return await this.model.findAll({
      where: { profile_id: profileIds },
      order: [['operate_time', 'DESC']]
    });
  }
}

export class CustomerProfileBatchRepository extends BaseRepository<CustomerProfileBatch> {
  constructor() {
    super(CustomerProfileBatch);
  }

  async findByBatchNo(batchNo: string): Promise<CustomerProfileBatch | null> {
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

export class CustomerProfileBatchItemRepository extends BaseRepository<CustomerProfileBatchItem> {
  constructor() {
    super(CustomerProfileBatchItem);
  }

  async findByBatchId(batchId: string): Promise<CustomerProfileBatchItem[]> {
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
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } },
        { mobile: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    return where;
  }
}
