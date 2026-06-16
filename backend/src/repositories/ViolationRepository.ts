import { BaseRepository } from './BaseRepository';
import { ViolationRecord } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Customer } from '../models';
import { User } from '../models';
import { Organization } from '../models';
import dayjs from 'dayjs';

export class ViolationRepository extends BaseRepository<ViolationRecord> {
  constructor() {
    super(ViolationRecord);
  }

  async findByViolationNo(violationNo: string): Promise<ViolationRecord | null> {
    return await this.model.findOne({ where: { violation_no: violationNo } });
  }

  async findByBizId(bizId: string, bizType?: string): Promise<ViolationRecord[]> {
    const where: any = { biz_id: bizId };
    if (bizType) {
      where.biz_type = bizType;
    }
    return await this.model.findAll({ where });
  }

  async generateViolationNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VIO${now}${random}`;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { violation_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { biz_no: { [Op.like]: `%${params.keyword}%` } },
        { description: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.violation_no) {
      where.violation_no = { [Op.like]: `%${params.violation_no}%` };
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.biz_id) {
      where.biz_id = params.biz_id;
    }

    if (params.biz_no) {
      where.biz_no = { [Op.like]: `%${params.biz_no}%` };
    }

    if (params.biz_type) {
      where.biz_type = params.biz_type;
    }

    if (params.violation_type !== undefined) {
      where.violation_type = params.violation_type;
    }

    if (params.violation_level !== undefined) {
      where.violation_level = params.violation_level;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.discoverer_id) {
      where.discoverer_id = params.discoverer_id;
    }

    if (params.discoverer_org_id) {
      where.discoverer_org_id = params.discoverer_org_id;
    }

    if (params.handler_id) {
      where.handler_id = params.handler_id;
    }

    if (params.org_id) {
      where.discoverer_org_id = params.org_id;
    }

    if (params.start_time) {
      where.discover_time = {
        ...(where.discover_time || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.discover_time = {
        ...(where.discover_time || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'risk_level']
    };
  }

  getDiscovererInclude(): Includeable {
    return {
      model: User,
      as: 'discoverer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getHandlerInclude(): Includeable {
    return {
      model: User,
      as: 'handler',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getDiscovererOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'discoverer_org',
      required: false,
      attributes: ['id', 'name']
    };
  }
}
