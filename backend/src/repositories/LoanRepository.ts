import { BaseRepository } from './BaseRepository';
import { Loan } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import { Product, Organization, User, Customer } from '../models';
import dayjs from 'dayjs';

export class LoanRepository extends BaseRepository<Loan> {
  constructor() {
    super(Loan);
  }

  async findByLoanNo(loanNo: string): Promise<Loan | null> {
    return await this.model.findOne({ where: { loan_no: loanNo } });
  }

  async findByCustomerId(customerId: string): Promise<Loan[]> {
    return await this.model.findAll({ where: { customer_id: customerId }, order: [['created_at', 'DESC']] });
  }

  async findByCustomerNo(customerNo: string): Promise<Loan[]> {
    return await this.model.findAll({ where: { customer_no: customerNo }, order: [['created_at', 'DESC']] });
  }

  async findByIdCardNo(idCardNo: string): Promise<Loan[]> {
    return await this.model.findAll({ where: { id_card_no: idCardNo }, order: [['created_at', 'DESC']] });
  }

  async getActiveLoanAmount(customerId: string): Promise<number> {
    const result = await this.model.sum('amount', {
      where: {
        customer_id: customerId,
        status: { [Op.in]: [2, 4, 5, 7] }
      }
    });
    return Number(result) || 0;
  }

  async getOverdueLoanCount(customerId: string): Promise<number> {
    const result = await this.model.count({
      where: {
        customer_id: customerId,
        status: { [Op.in]: [3, 6] }
      }
    });
    return Number(result) || 0;
  }

  async getUnsettledOverdueCount(customerId: string): Promise<number> {
    const result = await this.model.count({
      where: {
        customer_id: customerId,
        status: { [Op.in]: [3, 6] }
      }
    });
    return Number(result) || 0;
  }

  async generateLoanNo(): Promise<string> {
    const prefix = 'LN';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    let seq = '001';
    let finalNo = '';
    while (true) {
      finalNo = `${prefix}${datePart}${seq}`;
      const exists = await this.model.count({ where: { loan_no: finalNo } });
      if (exists === 0) break;
      seq = (parseInt(seq, 10) + 1).toString().padStart(3, '0');
    }
    return finalNo;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { loan_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } },
        { id_card_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.loan_no) {
      where.loan_no = { [Op.like]: `%${params.loan_no}%` };
    }

    if (params.customer_no) {
      where.customer_no = params.customer_no;
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.id_card_no) {
      where.id_card_no = { [Op.like]: `%${params.id_card_no}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.loan_type !== undefined) {
      where.loan_type = params.loan_type;
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

    if (params.pre_reviewer_id) {
      where.pre_reviewer_id = params.pre_reviewer_id;
    }

    if (params.final_reviewer_id) {
      where.final_reviewer_id = params.final_reviewer_id;
    }

    if (params.is_pre_approved !== undefined) {
      where.status = { ...(where.status || {}), [Op.gte]: params.is_pre_approved ? 2 : 0, [Op.lte]: params.is_pre_approved ? 7 : 1 };
    }

    if (params.is_final_approved !== undefined) {
      where.status = { ...(where.status || {}), [Op.gte]: params.is_final_approved ? 5 : 0, [Op.lte]: params.is_final_approved ? 7 : 4 };
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

  getPreReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'pre_reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  getFinalReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'final_reviewer',
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
}
