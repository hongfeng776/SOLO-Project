import { BaseRepository } from './BaseRepository';
import { LoanApprovalFlow, LoanApprovalLog, Loan, User, Customer, Product, Organization } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

class LoanApprovalLogRepository extends BaseRepository<LoanApprovalLog> {
  constructor() {
    super(LoanApprovalLog);
  }
}

export class LoanApprovalRepository extends BaseRepository<LoanApprovalFlow> {
  constructor() {
    super(LoanApprovalFlow);
  }

  private logRepository: LoanApprovalLogRepository = new LoanApprovalLogRepository();

  async findByLoanId(loanId: string): Promise<LoanApprovalFlow[]> {
    return await this.model.findAll({
      where: { loan_id: loanId },
      order: [['current_level', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  async findCurrentByLoanId(loanId: string): Promise<LoanApprovalFlow | null> {
    return await this.model.findOne({
      where: { loan_id: loanId, status: 1 },
      order: [['current_level', 'ASC']]
    });
  }

  async findByLoanNo(loanNo: string): Promise<LoanApprovalFlow[]> {
    return await this.model.findAll({
      where: { loan_no: loanNo },
      order: [['current_level', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  async findLogsByLoanId(loanId: string): Promise<LoanApprovalLog[]> {
    return await this.logRepository.findAll({
      where: { loan_id: loanId },
      order: [['operation_time', 'DESC']]
    });
  }

  async findLogsByLoanNo(loanNo: string): Promise<LoanApprovalLog[]> {
    return await this.logRepository.findAll({
      where: { loan_no: loanNo },
      order: [['operation_time', 'DESC']]
    });
  }

  async createLog(data: Partial<LoanApprovalLog>): Promise<LoanApprovalLog> {
    return await this.logRepository.create(data);
  }

  async getApprovalLevelByAmount(amount: number): Promise<{ currentLevel: number; totalLevels: number }> {
    if (amount <= 500000) {
      return { currentLevel: 1, totalLevels: 1 };
    } else if (amount <= 1000000) {
      return { currentLevel: 1, totalLevels: 2 };
    } else if (amount <= 3000000) {
      return { currentLevel: 1, totalLevels: 3 };
    } else if (amount <= 5000000) {
      return { currentLevel: 1, totalLevels: 4 };
    } else {
      return { currentLevel: 1, totalLevels: 5 };
    }
  }

  async findPendingApproval(
    pagination: any,
    where?: WhereOptions,
    sort?: any,
    options?: any
  ): Promise<any> {
    const defaultWhere = {
      ...where,
      status: 1
    };
    return await this.findPaginated(
      pagination,
      defaultWhere,
      sort || { sortBy: 'createdAt', sortOrder: 'DESC' },
      options
    );
  }

  async checkLevelConflict(loanId: string, level: number, operatorId: string): Promise<boolean> {
    const count = await this.model.count({
      where: {
        loan_id: loanId,
        current_level: level,
        approver_id: operatorId,
        approval_result: { [Op.in]: [1, 2] }
      }
    });
    return count > 0;
  }

  async hasApprovedBefore(loanId: string, operatorId: string): Promise<boolean> {
    const count = await this.model.count({
      where: {
        loan_id: loanId,
        approver_id: operatorId,
        approval_result: { [Op.in]: [1, 2] }
      }
    });
    return count > 0;
  }

  buildFlowQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { loan_no: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.loan_no) {
      where.loan_no = { [Op.like]: `%${params.loan_no}%` };
    }

    if (params.loan_id) {
      where.loan_id = params.loan_id;
    }

    if (params.current_level) {
      where.current_level = params.current_level;
    }

    if (params.status !== undefined && params.status !== null) {
      where.status = params.status;
    }

    if (params.approver_id) {
      where.approver_id = params.approver_id;
    }

    if (params.start_time) {
      where.createdAt = { ...where.createdAt, [Op.gte]: dayjs(params.start_time).toDate() };
    }

    if (params.end_time) {
      where.createdAt = { ...where.createdAt, [Op.lte]: dayjs(params.end_time).endOf('day').toDate() };
    }

    return where;
  }

  buildLogQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.loan_id) {
      where.loan_id = params.loan_id;
    }

    if (params.loan_no) {
      where.loan_no = { [Op.like]: `%${params.loan_no}%` };
    }

    if (params.approval_level) {
      where.approval_level = params.approval_level;
    }

    if (params.operator_id) {
      where.operator_id = params.operator_id;
    }

    if (params.operation_type) {
      where.operation_type = params.operation_type;
    }

    if (params.unauthorized_flag !== undefined) {
      where.unauthorized_flag = params.unauthorized_flag;
    }

    if (params.illegal_flag !== undefined) {
      where.illegal_flag = params.illegal_flag;
    }

    if (params.conflict_flag !== undefined) {
      where.conflict_flag = params.conflict_flag;
    }

    if (params.start_time) {
      where.operation_time = { ...where.operation_time, [Op.gte]: dayjs(params.start_time).toDate() };
    }

    if (params.end_time) {
      where.operation_time = { ...where.operation_time, [Op.lte]: dayjs(params.end_time).endOf('day').toDate() };
    }

    return where;
  }

  getLoanInclude(): Includeable {
    return {
      model: Loan,
      as: 'loan',
      include: [
        { model: Customer, as: 'customer' },
        { model: Product, as: 'product' },
        { model: Organization, as: 'organization' },
        { model: User, as: 'operator' }
      ]
    };
  }

  getApproverInclude(): Includeable {
    return {
      model: User,
      as: 'approver',
      attributes: ['id', 'username', 'real_name', 'email']
    };
  }

  getOperatorInclude(): Includeable {
    return {
      model: User,
      as: 'operator',
      attributes: ['id', 'username', 'real_name', 'email']
    };
  }
}
