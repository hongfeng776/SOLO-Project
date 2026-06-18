import { BaseRepository } from './BaseRepository';
import { Settlement, SettlementBatch, Account, Customer, Organization, User } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class SettlementRepository extends BaseRepository<Settlement> {
  constructor() {
    super(Settlement);
  }

  async findBySettlementNo(settlementNo: string): Promise<Settlement | null> {
    return await this.model.findOne({ where: { settlement_no: settlementNo } });
  }

  async findByRequestId(requestId: string): Promise<Settlement | null> {
    return await this.model.findOne({ where: { request_id: requestId } });
  }

  async findByPayerAccountNo(payerAccountNo: string): Promise<Settlement[]> {
    return await this.model.findAll({
      where: { payer_account_no: payerAccountNo },
      order: [['created_at', 'DESC']]
    });
  }

  async findByBatchId(batchId: string): Promise<Settlement[]> {
    return await this.model.findAll({
      where: { batch_id: batchId },
      order: [['created_at', 'ASC']]
    });
  }

  async getDailySettlementAmount(payerAccountNo: string, date: Date): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const result = await this.model.sum('amount', {
      where: {
        payer_account_no: payerAccountNo,
        status: { [Op.in]: [1, 2, 3] },
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      }
    });

    return Number(result) || 0;
  }

  async getMonthlySettlementAmount(payerAccountNo: string, date: Date): Promise<number> {
    const startOfMonth = dayjs(date).startOf('month').toDate();
    const endOfMonth = dayjs(date).endOf('month').toDate();

    const result = await this.model.sum('amount', {
      where: {
        payer_account_no: payerAccountNo,
        status: { [Op.in]: [1, 2, 3] },
        created_at: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfMonth
        }
      }
    });

    return Number(result) || 0;
  }

  async getPublicPrivateDailyAmount(
    payerAccountNo: string,
    payerType: string,
    payeeType: string,
    date: Date
  ): Promise<number> {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const where: any = {
      payer_account_no: payerAccountNo,
      payer_account_type: payerType,
      payee_account_type: payeeType,
      status: { [Op.in]: [1, 2, 3] },
      created_at: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    };

    const result = await this.model.sum('amount', { where });
    return Number(result) || 0;
  }

  async countSameNameTransfers(
    payerAccountNo: string,
    payeeAccountName: string,
    startTime: Date,
    endTime: Date
  ): Promise<Settlement[]> {
    return await this.model.findAll({
      where: {
        payer_account_no: payerAccountNo,
        payee_account_name: payeeAccountName,
        status: { [Op.in]: [1, 2, 3] },
        created_at: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      },
      order: [['created_at', 'DESC']]
    });
  }

  async generateSettlementNo(): Promise<string> {
    const prefix = 'SET';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '0001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { settlement_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(4, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { settlement_no: { [Op.like]: `%${params.keyword}%` } },
        { payer_account_no: { [Op.like]: `%${params.keyword}%` } },
        { payee_account_no: { [Op.like]: `%${params.keyword}%` } },
        { payee_account_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.settlement_no) {
      where.settlement_no = { [Op.like]: `%${params.settlement_no}%` };
    }

    if (params.payer_account_no) {
      where.payer_account_no = params.payer_account_no;
    }

    if (params.payee_account_no) {
      where.payee_account_no = params.payee_account_no;
    }

    if (params.payee_account_name) {
      where.payee_account_name = { [Op.like]: `%${params.payee_account_name}%` };
    }

    if (params.transfer_type !== undefined) {
      where.transfer_type = params.transfer_type;
    }

    if (params.transfer_mode !== undefined) {
      where.transfer_mode = params.transfer_mode;
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

    if (params.need_review !== undefined) {
      where.need_review = params.need_review;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.reviewer_id) {
      where.reviewer_id = params.reviewer_id;
    }

    if (params.batch_id) {
      where.batch_id = params.batch_id;
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

  getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getPayerAccountInclude(): Includeable {
    return {
      model: Account,
      as: 'payer_account',
      required: false,
      attributes: ['id', 'account_no', 'account_type', 'balance', 'available_balance', 'frozen_amount', 'status']
    };
  }

  getPayerCustomerInclude(): Includeable {
    return {
      model: Customer,
      as: 'payer_customer',
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'mobile', 'risk_level', 'customer_level']
    };
  }
}

export class SettlementBatchRepository extends BaseRepository<SettlementBatch> {
  constructor() {
    super(SettlementBatch);
  }

  async findByBatchNo(batchNo: string): Promise<SettlementBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
  }

  async findByPayerAccountNo(payerAccountNo: string): Promise<SettlementBatch[]> {
    return await this.model.findAll({
      where: { payer_account_no: payerAccountNo },
      order: [['created_at', 'DESC']]
    });
  }

  async generateBatchNo(): Promise<string> {
    const prefix = 'BAT';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { batch_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { batch_no: { [Op.like]: `%${params.keyword}%` } },
        { batch_name: { [Op.like]: `%${params.keyword}%` } },
        { payer_account_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.batch_no) {
      where.batch_no = { [Op.like]: `%${params.batch_no}%` };
    }

    if (params.batch_name) {
      where.batch_name = { [Op.like]: `%${params.batch_name}%` };
    }

    if (params.batch_type !== undefined) {
      where.batch_type = params.batch_type;
    }

    if (params.payer_account_no) {
      where.payer_account_no = params.payer_account_no;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.audit_status !== undefined) {
      where.audit_status = params.audit_status;
    }

    if (params.need_review !== undefined) {
      where.need_review = params.need_review;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
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

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getPayerAccountInclude(): Includeable {
    return {
      model: Account,
      as: 'payer_account',
      required: false,
      attributes: ['id', 'account_no', 'account_type', 'balance', 'available_balance', 'frozen_amount', 'status']
    };
  }
}
