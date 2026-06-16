import { BaseRepository } from './BaseRepository';
import { Transaction } from '../models';
import { WhereOptions, Op, Includeable, fn, col, literal } from 'sequelize';
import { Product } from '../models';
import { Organization } from '../models';
import { User } from '../models';
import { Customer } from '../models';
import dayjs from 'dayjs';

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(Transaction);
  }

  async findByTransactionNo(transactionNo: string): Promise<Transaction | null> {
    return await this.model.findOne({ where: { transaction_no: transactionNo } });
  }

  async findByRequestId(requestId: string): Promise<Transaction | null> {
    if (!requestId) return null;
    return await this.model.findOne({ where: { request_id: requestId } });
  }

  async generateTransactionNo(): Promise<string> {
    const now = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${now}${random}`;
  }

  async countRecentByAccount(account: string, minutes: number = 60): Promise<number> {
    if (!account) return 0;
    const since = dayjs().subtract(minutes, 'minute').toDate();
    return await this.model.count({
      where: {
        [Op.or]: [
          { payer_account: account },
          { payee_account: account }
        ],
        transaction_time: { [Op.gte]: since },
        status: { [Op.in]: [0, 1, 2, 6] }
      }
    });
  }

  async aggregateByChannel(startTime: Date, endTime: Date, orgId?: string): Promise<any[]> {
    const where: any = {
      transaction_time: { [Op.gte]: startTime, [Op.lte]: endTime },
      status: 2
    };
    if (orgId) where.org_id = orgId;
    const rows = await this.model.findAll({
      where,
      attributes: [
        'channel_code',
        [fn('SUM', col('amount')), 'total_amount'],
        [fn('COUNT', col('id')), 'total_count']
      ],
      group: ['channel_code'],
      raw: true
    } as any);
    return rows as any[];
  }

  async aggregateByDay(startTime: Date, endTime: Date, orgId?: string): Promise<any[]> {
    const where: any = {
      transaction_time: { [Op.gte]: startTime, [Op.lte]: endTime },
      status: 2
    };
    if (orgId) where.org_id = orgId;
    const rows = await this.model.findAll({
      where,
      attributes: [
        [literal('DATE(transaction_time)'), 'day'],
        [fn('SUM', col('amount')), 'total_amount'],
        [fn('COUNT', col('id')), 'total_count']
      ],
      group: [literal('DATE(transaction_time)')],
      order: [[literal('DATE(transaction_time)'), 'ASC']],
      raw: true
    } as any);
    return rows as any[];
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { transaction_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { payer_account: { [Op.like]: `%${params.keyword}%` } },
        { payer_name: { [Op.like]: `%${params.keyword}%` } },
        { payee_account: { [Op.like]: `%${params.keyword}%` } },
        { payee_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.transaction_no) {
      where.transaction_no = { [Op.like]: `%${params.transaction_no}%` };
    }

    if (params.channel_code) {
      where.channel_code = params.channel_code;
    }

    if (params.business_line) {
      where.business_line = params.business_line;
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.customer_no) {
      where.customer_no = { [Op.like]: `%${params.customer_no}%` };
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

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.start_time) {
      where.transaction_time = {
        ...(where.transaction_time || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.transaction_time = {
        ...(where.transaction_time || {}),
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

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'customer_level', 'risk_level']
    };
  }
}