import { BaseRepository } from './BaseRepository';
import { Transaction } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Product } from '../models';
import { Organization } from '../models';
import { User } from '../models';
import dayjs from 'dayjs';

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(Transaction);
  }

  async findByTransactionNo(transactionNo: string): Promise<Transaction | null> {
    return await this.model.findOne({ where: { transaction_no: transactionNo } });
  }

  async generateTransactionNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${now}${random}`;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { transaction_no: { [Op.like]: `%${params.keyword}%` } },
        { payer_account: { [Op.like]: `%${params.keyword}%` } },
        { payer_name: { [Op.like]: `%${params.keyword}%` } },
        { payee_account: { [Op.like]: `%${params.keyword}%` } },
        { payee_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.transaction_no) {
      where.transaction_no = { [Op.like]: `%${params.transaction_no}%` };
    }

    if (params.type !== undefined) {
      where.type = params.type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.audit_status !== undefined) {
      where.audit_status = params.audit_status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.start_time) {
      where.createdAt = {
        ...(where.createdAt || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.createdAt = {
        ...(where.createdAt || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    if (params.min_amount !== undefined) {
      where.amount = { ...(where.amount || {}), [Op.gte]: params.min_amount };
    }

    if (params.max_amount !== undefined) {
      where.amount = { ...(where.amount || {}), [Op.lte]: params.max_amount };
    }

    return where;
  }

  getProductInclude(): Includeable {
    return {
      model: Product,
      required: false,
      attributes: ['id', 'name', 'code']
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