import { BaseRepository } from './BaseRepository';
import { Deposit } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Product, Organization, User, Customer, Account } from '../models';
import dayjs from 'dayjs';

export class DepositRepository extends BaseRepository<Deposit> {
  constructor() {
    super(Deposit);
  }

  async findByDepositNo(depositNo: string): Promise<Deposit | null> {
    return await this.model.findOne({ where: { deposit_no: depositNo } });
  }

  async findByAccountNo(accountNo: string): Promise<Deposit[]> {
    return await this.model.findAll({ where: { account_no: accountNo }, order: [['created_at', 'DESC']] });
  }

  async findByCustomerId(customerId: string): Promise<Deposit[]> {
    return await this.model.findAll({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findByRequestId(requestId: string): Promise<Deposit | null> {
    return await this.model.findOne({ where: { request_id: requestId } });
  }

  async getDailyDepositAmount(accountNo: string, date: Date): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const result = await this.model.sum('amount', {
      where: {
        account_no: accountNo,
        status: { [Op.in]: [1, 2, 4, 5] },
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      }
    });

    return Number(result) || 0;
  }

  async checkDuplicateDeposit(accountNo: string, amount: number, timeWindowMinutes: number = 5): Promise<Deposit[]> {
    const now = dayjs();
    const startTime = now.subtract(timeWindowMinutes, 'minute').toDate();
    const endTime = now.toDate();

    return await this.model.findAll({
      where: {
        account_no: accountNo,
        amount: amount,
        status: { [Op.in]: [0, 1, 2, 4, 5] },
        created_at: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      }
    });
  }

  async generateDepositNo(): Promise<string> {
    const prefix = 'DEP';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { deposit_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { deposit_no: { [Op.like]: `%${params.keyword}%` } },
        { account_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.deposit_no) {
      where.deposit_no = { [Op.like]: `%${params.deposit_no}%` };
    }

    if (params.account_no) {
      where.account_no = params.account_no;
    }

    if (params.customer_no) {
      where.customer_no = params.customer_no;
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.deposit_type !== undefined) {
      where.deposit_type = params.deposit_type;
    }

    if (params.product_id) {
      where.product_id = params.product_id;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.term !== undefined) {
      where.term = params.term;
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

    if (params.min_amount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        [Op.gte]: params.min_amount
      };
    }

    if (params.max_amount !== undefined) {
      where.amount = {
        ...(where.amount || {}),
        [Op.lte]: params.max_amount
      };
    }

    return where;
  }

  getProductInclude(): Includeable {
    return {
      model: Product,
      required: false,
      attributes: ['id', 'name', 'code', 'category', 'type', 'interest_rate', 'term_days']
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

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'mobile', 'risk_level', 'customer_level']
    };
  }

  getAccountInclude(): Includeable {
    return {
      model: Account,
      required: false,
      attributes: ['id', 'account_no', 'account_type', 'balance', 'available_balance', 'frozen_amount', 'status', 'daily_limit', 'single_limit']
    };
  }
}
