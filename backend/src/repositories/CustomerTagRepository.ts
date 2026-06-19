import { BaseRepository } from './BaseRepository';
import { CustomerTag, CustomerTagLog, CustomerTagBatch, CustomerTagBatchItem, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class CustomerTagRepository extends BaseRepository<CustomerTag> {
  constructor() {
    super(CustomerTag);
  }

  async findByCustomerIdAndTagCode(customerId: string, tagCode: string): Promise<CustomerTag | null> {
    return await this.model.findOne({ where: { customer_id: customerId, tag_code: tagCode, tag_status: { [Op.ne]: 4 } } });
  }

  async findAllByCustomerId(customerId: string): Promise<CustomerTag[]> {
    return await this.model.findAll({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findActiveByCustomerId(customerId: string): Promise<CustomerTag[]> {
    return await this.model.findAll({ where: { customer_id: customerId, tag_status: 1 }, order: [['created_at', 'DESC']] });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { tag_code: { [Op.like]: `%${params.keyword}%` } },
        { tag_name: { [Op.like]: `%${params.keyword}%` } }
      ];
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

    if (params.customer_level !== undefined) {
      where.customer_level = params.customer_level;
    }

    if (params.tag_code) {
      where.tag_code = { [Op.like]: `%${params.tag_code}%` };
    }

    if (params.tag_type !== undefined) {
      where.tag_type = params.tag_type;
    }

    if (params.tag_source !== undefined) {
      where.tag_source = params.tag_source;
    }

    if (params.tag_status !== undefined) {
      where.tag_status = params.tag_status;
    }

    if (params.data_ready === 1) {
      where.asset_data_status = 1;
      where.transaction_data_status = 1;
      where.retention_data_status = 1;
      where.risk_data_status = 1;
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

export class CustomerTagLogRepository extends BaseRepository<CustomerTagLog> {
  constructor() {
    super(CustomerTagLog);
  }

  async findByTagId(tagId: string): Promise<CustomerTagLog[]> {
    return await this.model.findAll({
      where: { tag_id: tagId },
      order: [['operate_time', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async findByCustomerId(customerId: string): Promise<CustomerTagLog[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['operate_time', 'DESC']]
    });
  }
}

export class CustomerTagBatchRepository extends BaseRepository<CustomerTagBatch> {
  constructor() {
    super(CustomerTagBatch);
  }

  async findByBatchNo(batchNo: string): Promise<CustomerTagBatch | null> {
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

    if (params.operation_type !== undefined) {
      where.operation_type = params.operation_type;
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

export class CustomerTagBatchItemRepository extends BaseRepository<CustomerTagBatchItem> {
  constructor() {
    super(CustomerTagBatchItem);
  }

  async findByBatchId(batchId: string): Promise<CustomerTagBatchItem[]> {
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
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    return where;
  }
}
