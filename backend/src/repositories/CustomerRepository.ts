import { BaseRepository } from './BaseRepository';
import { Customer } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Organization } from '../models';
import dayjs from 'dayjs';

export class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super(Customer);
  }

  async findByCustomerNo(customerNo: string): Promise<Customer | null> {
    return await this.model.findOne({ where: { customer_no: customerNo } });
  }

  async findByIdCardNo(idCardNo: string): Promise<Customer | null> {
    return await this.model.findOne({ where: { id_card_no: idCardNo } });
  }

  async findByMobile(mobile: string): Promise<Customer | null> {
    return await this.model.findOne({ where: { mobile } });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } },
        { mobile: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.customer_type !== undefined) {
      where.customer_type = params.customer_type;
    }

    if (params.customer_level !== undefined) {
      where.customer_level = params.customer_level;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
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
