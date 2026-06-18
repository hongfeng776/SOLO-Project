import { BaseRepository } from './BaseRepository';
import { LoanRepayment, LoanWithhold, Loan, Customer, Account, User } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

class LoanWithholdRepository extends BaseRepository<LoanWithhold> {
  constructor() {
    super(LoanWithhold);
  }
}

export class LoanRepaymentRepository extends BaseRepository<LoanRepayment> {
  constructor() {
    super(LoanRepayment);
  }

  private withholdRepository: LoanWithholdRepository = new LoanWithholdRepository();

  async findByLoanId(loanId: string): Promise<LoanRepayment[]> {
    return await this.model.findAll({
      where: { loan_id: loanId },
      order: [['repay_time', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  async findByLoanNo(loanNo: string): Promise<LoanRepayment[]> {
    return await this.model.findAll({
      where: { loan_no: loanNo },
      order: [['repay_time', 'DESC'], ['createdAt', 'DESC']]
    });
  }

  async findByRepaymentNo(repaymentNo: string): Promise<LoanRepayment | null> {
    return await this.model.findOne({
      where: { repayment_no: repaymentNo }
    });
  }

  async findByTransactionNo(transactionNo: string): Promise<LoanRepayment | null> {
    return await this.model.findOne({
      where: { transaction_no: transactionNo }
    });
  }

  async findSuccessRepayments(loanId: string): Promise<LoanRepayment[]> {
    return await this.model.findAll({
      where: { loan_id: loanId, status: 2 },
      order: [['period_no', 'ASC']]
    });
  }

  async checkDuplicateRepayment(loanId: string, amount: number, timeRange: { start: Date; end: Date }): Promise<number> {
    const count = await this.model.count({
      where: {
        loan_id: loanId,
        status: 2,
        amount,
        repay_time: {
          [Op.between]: [timeRange.start, timeRange.end]
        }
      }
    });
    return count;
  }

  async getTotalRepaidAmount(loanId: string): Promise<{
    total_amount: number;
    total_principal: number;
    total_interest: number;
    total_penalty: number;
  }> {
    const result: any = await this.model.findAll({
      where: { loan_id: loanId, status: 2 },
      attributes: [
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('amount')), 'total_amount'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('principal')), 'total_principal'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('interest')), 'total_interest'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('penalty')), 'total_penalty']
      ],
      raw: true
    });
    return {
      total_amount: Number(result[0]?.total_amount || 0),
      total_principal: Number(result[0]?.total_principal || 0),
      total_interest: Number(result[0]?.total_interest || 0),
      total_penalty: Number(result[0]?.total_penalty || 0)
    };
  }

  async createWithhold(data: Partial<LoanWithhold>): Promise<LoanWithhold> {
    return await this.withholdRepository.create(data);
  }

  async bulkCreateWithholds(data: Partial<LoanWithhold>[]): Promise<LoanWithhold[]> {
    return await this.withholdRepository.bulkCreate(data);
  }

  async findWithholds(query: any): Promise<{ list: LoanWithhold[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, ...params } = query;
    const where = this.buildWithholdQuery(params);
    return await this.withholdRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'repayment_priority', sortOrder: 'DESC' },
      {
        include: [this.getLoanInclude(), this.getCustomerInclude(), this.getAccountInclude()]
      }
    );
  }

  async findPendingWithholds(date?: Date): Promise<LoanWithhold[]> {
    const where: any = { status: 0 };
    if (date) {
      where.due_date = { [Op.lte]: date };
    }
    return await this.withholdRepository.findAll({
      where,
      order: [['repayment_priority', 'DESC'], ['due_date', 'ASC']],
      include: [this.getLoanInclude(), this.getCustomerInclude(), this.getAccountInclude()]
    });
  }

  async updateWithhold(id: string, data: any): Promise<[number, LoanWithhold[]]> {
    return await this.withholdRepository.update(id, data);
  }

  async findWithholdsByBatchNo(batchNo: string): Promise<LoanWithhold[]> {
    return await this.withholdRepository.findAll({
      where: { batch_no: batchNo },
      order: [['repayment_priority', 'DESC']]
    });
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { repayment_no: { [Op.like]: `%${params.keyword}%` } },
        { loan_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.loan_id) {
      where.loan_id = params.loan_id;
    }

    if (params.loan_no) {
      where.loan_no = { [Op.like]: `%${params.loan_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.repayment_type !== undefined && params.repayment_type !== null) {
      where.repayment_type = params.repayment_type;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
    }

    if (params.repayment_channel) {
      where.repayment_channel = params.repayment_channel;
    }

    if (params.min_amount) {
      where.amount = { ...where.amount, [Op.gte]: params.min_amount };
    }

    if (params.max_amount) {
      where.amount = { ...where.amount, [Op.lte]: params.max_amount };
    }

    if (params.abnormal_flag !== undefined && params.abnormal_flag !== null) {
      where.abnormal_flag = params.abnormal_flag;
    }

    if (params.need_review !== undefined && params.need_review !== null) {
      where.need_review = params.need_review;
    }

    if (params.start_time) {
      where.repay_time = { ...where.repay_time, [Op.gte]: dayjs(params.start_time).toDate() };
    }

    if (params.end_time) {
      where.repay_time = { ...where.repay_time, [Op.lte]: dayjs(params.end_time).endOf('day').toDate() };
    }

    return where;
  }

  buildWithholdQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { loan_no: { [Op.like]: `%${params.keyword}%` } },
        { customer_name: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.loan_no) {
      where.loan_no = { [Op.like]: `%${params.loan_no}%` };
    }

    if (params.customer_name) {
      where.customer_name = { [Op.like]: `%${params.customer_name}%` };
    }

    if (params.loan_type !== undefined && params.loan_type !== null) {
      where.loan_type = params.loan_type;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
    }

    if (params.min_amount) {
      where.due_amount = { ...where.due_amount, [Op.gte]: params.min_amount };
    }

    if (params.max_amount) {
      where.due_amount = { ...where.due_amount, [Op.lte]: params.max_amount };
    }

    if (params.is_overdue !== undefined && params.is_overdue !== null) {
      where.is_overdue = params.is_overdue ? 1 : 0;
    }

    if (params.repayment_priority) {
      where.repayment_priority = params.repayment_priority;
    }

    if (params.start_date) {
      where.due_date = { ...where.due_date, [Op.gte]: dayjs(params.start_date).toDate() };
    }

    if (params.end_date) {
      where.due_date = { ...where.due_date, [Op.lte]: dayjs(params.end_date).endOf('day').toDate() };
    }

    return where;
  }

  getLoanInclude(): Includeable {
    return {
      model: Loan,
      as: 'loan',
      attributes: ['id', 'loan_no', 'loan_type', 'amount', 'term', 'interest_rate', 'status', 'risk_level']
    };
  }

  getCustomerInclude(): Includeable {
    return {
      model: Customer,
      as: 'customer',
      attributes: ['id', 'customer_no', 'customer_name', 'id_card_no', 'phone']
    };
  }

  getAccountInclude(): Includeable {
    return {
      model: Account,
      as: 'account',
      attributes: ['id', 'account_no', 'balance', 'available_balance', 'status']
    };
  }

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      attributes: ['id', 'username', 'real_name']
    };
  }
}
