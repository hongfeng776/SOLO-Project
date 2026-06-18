import { BaseRepository } from './BaseRepository';
import { SettlementBatch } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Organization, User, Account } from '../models';
import dayjs from 'dayjs';

export class SettlementBatchRepository extends BaseRepository<SettlementBatch> {
  constructor() {
    super(SettlementBatch);
  }

  async findByBatchNo(batchNo: string): Promise<SettlementBatch | null> {
    return await this.model.findOne({ where: { batch_no: batchNo } });
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
