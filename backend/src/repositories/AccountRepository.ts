import { BaseRepository } from './BaseRepository';
import { Account } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Customer, Organization, User } from '../models';
import dayjs from 'dayjs';

export class AccountRepository extends BaseRepository<Account> {
  constructor() {
    super(Account);
  }

  async findByAccountNo(accountNo: string): Promise<Account | null> {
    return await this.model.findOne({ where: { account_no: accountNo } });
  }

  async findByCustomerId(customerId: string): Promise<Account[]> {
    return await this.model.findAll({ where: { customer_id: customerId } });
  }

  async generateAccountNo(): Promise<string> {
    const prefix = '6222';
    const datePart = dayjs().format('YYYYMMDD');
    let seq = '000001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { account_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(6, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { account_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.account_no) {
      where.account_no = { [Op.like]: `%${params.account_no}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
    }

    if (params.account_type !== undefined) {
      where.account_type = params.account_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.open_org_id) {
      where.open_org_id = params.open_org_id;
    }

    if (params.start_time) {
      where.open_date = {
        ...(where.open_date || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.open_date = {
        ...(where.open_date || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'mobile']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
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
}
