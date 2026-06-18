import {
  LoanRepository,
  CustomerRepository,
  ProductRepository,
  AccountRepository,
  TransactionRepository,
  OrganizationRepository,
  AuditRuleRepository,
  AuditRecordRepository,
  UserRepository,
  ViolationRepository
} from '../repositories';
import {
  LoanType,
  LoanStatus,
  RepaymentMethod,
  LoanTypeText,
  LoanStatusText,
  LoanTermText,
  RepaymentMethodText,
  LoanPurposeText,
  LOAN_TYPE_CONFIG,
  LARGE_LOAN_THRESHOLD,
  LOW_QUALITY_CUSTOMER_LEVEL,
  type LoanPreCheckRequest,
  type LoanPreCheckResult,
  type CreateLoanRequest,
  type LoanUpdateRequest,
  type LoanQueryParams,
  type LoanVO,
  type BatchLoanItem,
  type BatchLoanRequest,
  type BatchLoanResultItem,
  type BatchLoanReviewRequest,
  type LoanTraceRequest,
  type LoanTraceResult,
  type LoanTypeConfig
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId, isValidAmount } from '../utils/validate';
import dayjs from 'dayjs';
import { Op, Transaction as SequelizeTransaction } from 'sequelize';
import { sequelize } from '../config/database';

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

const VALID_PURPOSES_BY_TYPE: Record<number, string[]> = {
  1: ['consumption', 'education', 'travel', 'medical', 'other'],
  2: ['business', 'other'],
  3: ['house', 'other'],
  4: ['car', 'other']
};

export class LoanService {
  private loanRepository: LoanRepository;
  private customerRepository: CustomerRepository;
  private productRepository: ProductRepository;
  private accountRepository: AccountRepository;
  private transactionRepository: TransactionRepository;
  private organizationRepository: OrganizationRepository;
  private auditRuleRepository: AuditRuleRepository;
  private auditRecordRepository: AuditRecordRepository;
  private userRepository: UserRepository;
  private violationRepository: ViolationRepository;

  constructor() {
    this.loanRepository = new LoanRepository();
    this.customerRepository = new CustomerRepository();
    this.productRepository = new ProductRepository();
    this.accountRepository = new AccountRepository();
    this.transactionRepository = new TransactionRepository();
    this.organizationRepository = new OrganizationRepository();
    this.auditRuleRepository = new AuditRuleRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.userRepository = new UserRepository();
    this.violationRepository = new ViolationRepository();
  }

  private formatMoneyWithComma(amount: number): string {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private calculateMonthlyPayment(amount: number, annualRate: number, months: number, method: RepaymentMethod): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return amount / months;

    switch (method) {
      case 1: {
        const factor = Math.pow(1 + monthlyRate, months);
        return amount * monthlyRate * factor / (factor - 1);
      }
      case 2: {
        const principalPerMonth = amount / months;
        const firstMonthInterest = amount * monthlyRate;
        return principalPerMonth + firstMonthInterest;
      }
      case 3:
        return amount * monthlyRate;
      case 4:
        return 0;
      default:
        return amount * monthlyRate;
    }
  }

  private calculateTotalInterest(amount: number, annualRate: number, months: number, method: RepaymentMethod): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return 0;

    switch (method) {
      case 1: {
        const monthly = this.calculateMonthlyPayment(amount, annualRate, months, method);
        return monthly * months - amount;
      }
      case 2: {
        let total = 0;
        for (let i = 0; i < months; i++) {
          total += (amount - (amount / months) * i) * monthlyRate;
        }
        return total;
      }
      case 3:
        return amount * monthlyRate * months;
      case 4:
        return amount * annualRate / 100 * (months / 12);
      default:
        return amount * annualRate / 100 * (months / 12);
    }
  }

  private getLoanTypeConfig(loanType: LoanType): LoanTypeConfig {
    const config = LOAN_TYPE_CONFIG[loanType];
    if (!config) {
      throwValidationError('无效的贷款类型');
    }
    return config;
  }

  private async getCustomerByRequest(request: { customer_id?: string; customer_no?: string; id_card_no?: string }) {
    let customer: any = null;
    if (request.customer_id) {
      customer = await this.customerRepository.findById(request.customer_id);
    } else if (request.customer_no) {
      customer = await this.customerRepository.findByCustomerNo(request.customer_no);
    } else if (request.id_card_no) {
      const customerList = await this.customerRepository.findByWhere({ id_card_no: request.id_card_no });
      if (customerList && customerList.length > 0) {
        customer = customerList[0];
      }
    }
    return customer;
  }

  async getLoanConfig(): Promise<any> {
    return {
      loan_types: Object.entries(LoanTypeText).map(([value, label]) => ({ value: Number(value), label })),
      loan_statuses: Object.entries(LoanStatusText).map(([value, label]) => ({ value: Number(value), label })),
      loan_terms: Object.entries(LoanTermText).map(([value, label]) => ({ value: Number(value), label })),
      repayment_methods: Object.entries(RepaymentMethodText).map(([value, label]) => ({ value: Number(value), label })),
      loan_purposes: Object.entries(LoanPurposeText).map(([value, label]) => ({ value, label })),
      type_configs: LOAN_TYPE_CONFIG,
      large_loan_threshold: LARGE_LOAN_THRESHOLD,
      low_quality_customer_level: LOW_QUALITY_CUSTOMER_LEVEL
    };
  }

  async preCheckLoan(request: LoanPreCheckRequest): Promise<LoanPreCheckResult> {
    const { loan_type, amount, term, purpose } = request;
    const warnings: string[] = [];

    if (!loan_type) {
      throwValidationError('请选择贷款类型');
    }
    if (!amount || amount <= 0) {
      throwValidationError('请输入有效的贷款金额');
    }

    const typeConfig = this.getLoanTypeConfig(loan_type);
    const customer = await this.getCustomerByRequest(request);

    let creditScore = 0;
    let debtRatio = 0;
    let accountActivityScore = 0;
    let overdueCount = 0;
    let maxLoanAmount = 0;
    let suggestedAmount = 0;
    let creditStatusValid = false;
    let debtRatioValid = false;
    let accountActivityValid = false;
    let repaymentHistoryValid = false;
    let purposeCompliant = false;
    let amountMatched = false;
    let blockReason: string | undefined;
    let applicableRate = typeConfig.interest_rate_base;

    if (customer) {
      creditScore = Math.floor(350 + Math.random() * 350 + (customer.customer_level || 1) * 40);
      creditStatusValid = creditScore >= 500;
      if (!creditStatusValid) {
        warnings.push('信用评分较低，可能影响贷款审批');
      }

      const activeLoans = await this.loanRepository.getActiveLoanAmount(customer.id);
      const monthlyIncome = 5000 + (customer.customer_level || 1) * 3000;
      const monthlyDebt = activeLoans > 0 ? activeLoans * 0.02 : 0;
      debtRatio = monthlyIncome > 0 ? Number(((monthlyDebt / monthlyIncome) * 100).toFixed(2)) : 0;
      debtRatioValid = debtRatio <= 50;
      if (!debtRatioValid) {
        warnings.push('负债比例过高，可能影响贷款审批');
      }

      const transactions = await this.transactionRepository.findByWhere({ customer_id: customer.id }, { limit: 50 });
      const transCount = transactions?.length || 0;
      accountActivityScore = Math.min(100, transCount * 5 + (customer.customer_level || 1) * 10);
      accountActivityValid = accountActivityScore >= 30;
      if (!accountActivityValid) {
        warnings.push('账户活跃度较低，可能影响贷款审批');
      }

      overdueCount = await this.loanRepository.getOverdueLoanCount(customer.id);
      repaymentHistoryValid = overdueCount === 0;
      if (!repaymentHistoryValid) {
        warnings.push(`存在${overdueCount}条历史逾期记录`);
      }

      const baseMax = monthlyIncome * 36;
      const rateFactor = creditScore / 700;
      maxLoanAmount = Math.min(typeConfig.max_amount, Math.floor(baseMax * rateFactor / 10000) * 10000);
      maxLoanAmount = Math.max(maxLoanAmount, typeConfig.min_amount);

      const qualityFactor = (creditScore / 700) * (1 - debtRatio / 100);
      suggestedAmount = Math.floor(maxLoanAmount * qualityFactor / 10000) * 10000;
      suggestedAmount = Math.max(suggestedAmount, typeConfig.min_amount);

      if (customer.risk_level !== undefined) {
        if (customer.risk_level <= 1) {
          applicableRate = typeConfig.interest_rate_min;
        } else if (customer.risk_level <= 2) {
          applicableRate = typeConfig.interest_rate_base * 0.95;
        } else if (customer.risk_level >= 4) {
          applicableRate = typeConfig.interest_rate_base * 1.2;
        }
      }
    } else {
      maxLoanAmount = typeConfig.max_amount;
      suggestedAmount = typeConfig.min_amount;
      creditScore = 500;
      creditStatusValid = true;
      debtRatioValid = true;
      accountActivityValid = true;
      repaymentHistoryValid = true;
      warnings.push('未找到客户信息，需补充资料后才能准确评估');
    }

    if (purpose) {
      const validPurposes = VALID_PURPOSES_BY_TYPE[loan_type] || [];
      purposeCompliant = validPurposes.includes(purpose);
      if (!purposeCompliant) {
        warnings.push(`贷款用途与${typeConfig.name}类型不匹配`);
      }
    } else {
      purposeCompliant = true;
    }

    amountMatched = amount >= typeConfig.min_amount && amount <= maxLoanAmount;
    if (amount > maxLoanAmount) {
      warnings.push(`申请金额超出资质匹配额度，建议额度：${this.formatMoneyWithComma(suggestedAmount)}元`);
    }
    if (amount < typeConfig.min_amount) {
      warnings.push(`申请金额低于最低额度：${this.formatMoneyWithComma(typeConfig.min_amount)}元`);
    }

    const passed = creditStatusValid && debtRatioValid && accountActivityValid && repaymentHistoryValid && purposeCompliant && amountMatched;

    if (!creditStatusValid && customer) {
      blockReason = '客户征信状态不达标，暂无法申请贷款';
    } else if (!debtRatioValid && customer) {
      blockReason = '客户负债比例过高，暂无法申请贷款';
    } else if (!accountActivityValid && customer) {
      blockReason = '客户账户活跃度不足，暂无法申请贷款';
    } else if (!repaymentHistoryValid) {
      blockReason = '客户存在历史逾期记录，暂无法申请贷款';
    } else if (!purposeCompliant) {
      blockReason = `贷款用途不符合${typeConfig.name}业务要求`;
    } else if (amount > typeConfig.max_amount) {
      blockReason = `申请金额超出${typeConfig.name}最高限额${this.formatMoneyWithComma(typeConfig.max_amount)}元`;
    }

    const requiredMaterials = this.getRequiredMaterials(loan_type, customer);

    return {
      passed,
      credit_status_valid: creditStatusValid,
      debt_ratio_valid: debtRatioValid,
      account_activity_valid: accountActivityValid,
      repayment_history_valid: repaymentHistoryValid,
      purpose_compliant: purposeCompliant,
      amount_matched: amountMatched,
      credit_score: creditScore,
      debt_ratio: debtRatio,
      account_activity_score: accountActivityScore,
      overdue_count: overdueCount,
      max_loan_amount: maxLoanAmount,
      suggested_amount: suggestedAmount,
      block_reason: blockReason,
      warnings,
      applicable_rate: Number(applicableRate.toFixed(2)),
      required_materials: requiredMaterials
    };
  }

  private getRequiredMaterials(loanType: LoanType, customer: any): string[] {
    const materials: string[] = ['身份证', '收入证明', '银行流水'];

    const config = LOAN_TYPE_CONFIG[loanType];
    if (config?.require_collateral) {
      materials.push('抵押物评估报告');
    }

    if (loanType === 2) {
      materials.push('营业执照', '经营场所证明');
    }
    if (loanType === 3) {
      materials.push('购房合同', '首付款证明');
    }
    if (loanType === 4) {
      materials.push('购车合同', '车辆保险');
    }

    return materials;
  }

  async createLoan(request: CreateLoanRequest, operatorId: string, orgId?: string): Promise<LoanVO> {
    const { loan_type, amount, term, purpose, repayment_method, customer_id, customer_no, ...rest } = request;

    if (!loan_type) {
      throwValidationError('请选择贷款类型');
    }
    if (!amount || !isValidAmount(amount)) {
      throwValidationError('请输入有效的贷款金额');
    }
    if (!term) {
      throwValidationError('请选择贷款期限');
    }
    if (!purpose) {
      throwValidationError('请选择贷款用途');
    }
    if (!repayment_method) {
      throwValidationError('请选择还款方式');
    }

    const typeConfig = this.getLoanTypeConfig(loan_type);

    const customer = await this.getCustomerByRequest({ customer_id, customer_no });
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    if (customer.status !== 1) {
      throwBusinessError('客户状态异常，无法申请贷款');
    }

    const preCheck = await this.preCheckLoan({
      customer_id: customer.id,
      loan_type,
      amount,
      term,
      purpose
    });

    if (!preCheck.passed) {
      throwBusinessError(preCheck.block_reason || '贷款前置校验未通过');
    }

    if (!typeConfig.available_terms.includes(term)) {
      throwValidationError(`贷款期限不支持${term}个月`);
    }

    if (!typeConfig.repayment_methods.includes(repayment_method)) {
      throwValidationError('该贷款类型不支持此还款方式');
    }

    const validPurposes = VALID_PURPOSES_BY_TYPE[loan_type] || [];
    if (!validPurposes.includes(purpose)) {
      throwValidationError(`贷款用途与${typeConfig.name}不匹配`);
    }

    const interestRate = rest.interest_rate || preCheck.applicable_rate || typeConfig.interest_rate_base;
    const totalInterest = this.calculateTotalInterest(amount, interestRate, term, repayment_method);
    const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, term, repayment_method);

    const needFinalReview = amount >= LARGE_LOAN_THRESHOLD;
    const isLowQuality = (customer.customer_level || 1) <= LOW_QUALITY_CUSTOMER_LEVEL;

    const loanNo = await this.loanRepository.generateLoanNo();
    const targetOrgId = orgId || customer.org_id;

    let loan: any;
    await sequelize.transaction(async (t: SequelizeTransaction) => {
      loan = await this.loanRepository.create({
        ...rest,
        loan_no: loanNo,
        customer_id: customer.id,
        customer_no: customer.customer_no,
        customer_name: customer.customer_name,
        id_card_no: customer.id_card_no,
        loan_type,
        amount,
        term,
        purpose,
        repayment_method,
        interest_rate: interestRate,
        total_interest: Number(totalInterest.toFixed(2)),
        monthly_payment: Number(monthlyPayment.toFixed(2)),
        status: needFinalReview ? 1 : 1,
        apply_time: new Date(),
        org_id: targetOrgId,
        operator_id: operatorId,
        risk_level: customer.risk_level,
        risk_tags: customer.risk_tags,
        credit_score: preCheck.credit_score,
        debt_ratio: preCheck.debt_ratio,
        is_low_quality: isLowQuality
      }, { transaction: t });

      if (needFinalReview || isLowQuality) {
        await this.auditRecordRepository.create({
          biz_type: 'loan',
          biz_id: loan.id,
          biz_no: loanNo,
          type: isLowQuality ? 2 : 1,
          level: isLowQuality ? 3 : 2,
          status: 0,
          submitter_id: operatorId,
          submitter_org_id: targetOrgId,
          submit_time: new Date(),
          current_node: isLowQuality ? 'PRE_REVIEW_KEY' : 'PRE_REVIEW'
        }, { transaction: t });
      }
    });

    return this.getLoanById(loan.id);
  }

  async getLoanById(id: string): Promise<LoanVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的贷款ID');
    }

    const include = [
      this.loanRepository.getProductInclude(),
      this.loanRepository.getOrganizationInclude(),
      this.loanRepository.getOperatorInclude(),
      this.loanRepository.getPreReviewerInclude(),
      this.loanRepository.getFinalReviewerInclude(),
      this.loanRepository.getCustomerInclude()
    ];

    const loan = await this.loanRepository.findById(id, { include });
    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    return this.convertToVO(loan);
  }

  async getLoanList(params: LoanQueryParams, currentUserId?: string, orgId?: string): Promise<{ list: LoanVO[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.loanRepository.buildQuery(queryParams);

    if (orgId && !queryParams.org_id) {
      where.org_id = orgId;
    }

    const include = [
      this.loanRepository.getProductInclude(),
      this.loanRepository.getOrganizationInclude(),
      this.loanRepository.getOperatorInclude(),
      this.loanRepository.getCustomerInclude()
    ];

    const result = await this.loanRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: LoanVO[] = result.list.map((d: any) => this.convertToVO(d));

    return { ...result, list };
  }

  async cancelLoan(id: string, operatorId: string, reason?: string): Promise<LoanVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的贷款ID');
    }

    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    if (loan.status === 7) {
      throwBusinessError('已放款的贷款申请无法撤销');
    }

    if (loan.status === 8) {
      throwBusinessError('贷款申请已撤销');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      await this.loanRepository.update(id, {
        status: 8,
        cancel_reason: reason,
        cancel_operator_id: operatorId,
        cancel_time: new Date()
      }, { transaction: t });

      const auditRecord = await this.auditRecordRepository.findOne({
        where: { biz_id: id, biz_type: 'loan' }
      });
      if (auditRecord) {
        await this.auditRecordRepository.update(auditRecord.id, { status: 4 }, { transaction: t });
      }
    });

    return this.getLoanById(id);
  }

  async preApproveLoan(id: string, reviewerId: string, approved: boolean, opinion?: string): Promise<LoanVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的贷款ID');
    }

    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    if (loan.status !== 1) {
      throwBusinessError('当前状态不支持预审操作');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const newStatus = approved ? 2 : 3;
      await this.loanRepository.update(id, {
        status: newStatus,
        pre_reviewer_id: reviewerId,
        pre_approve_time: new Date(),
        pre_approve_result: approved ? 'approve' : 'reject',
        pre_approve_opinion: opinion
      }, { transaction: t });

      const auditRecord = await this.auditRecordRepository.findOne({
        where: { biz_id: id, biz_type: 'loan' }
      });
      if (auditRecord) {
        await this.auditRecordRepository.update(auditRecord.id, {
          status: approved ? 1 : 3,
          handler_id: reviewerId,
          handle_time: new Date()
        }, { transaction: t });
      }
    });

    return this.getLoanById(id);
  }

  async finalApproveLoan(id: string, reviewerId: string, approved: boolean, opinion?: string): Promise<LoanVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的贷款ID');
    }

    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    if (loan.status !== 2 && loan.status !== 4) {
      throwBusinessError('当前状态不支持终审操作');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const newStatus = approved ? 5 : 6;
      await this.loanRepository.update(id, {
        status: newStatus,
        final_reviewer_id: reviewerId,
        final_approve_time: new Date(),
        final_approve_result: approved ? 'approve' : 'reject',
        final_approve_opinion: opinion
      }, { transaction: t });
    });

    return this.getLoanById(id);
  }

  async batchPreCheckLoan(request: BatchLoanRequest): Promise<{ details: Array<{ index: number; passed: boolean; pre_check: LoanPreCheckResult; errors?: string[] }> }> {
    const { items } = request;

    if (!items || items.length === 0) {
      throwValidationError('请选择要预审的贷款申请');
    }

    const details: Array<{ index: number; passed: boolean; pre_check: LoanPreCheckResult; errors?: string[] }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i + 1;

      try {
        const preCheck = await this.preCheckLoan({
          customer_no: item.customer_no,
          id_card_no: item.id_card_no,
          loan_type: item.loan_type,
          amount: item.amount,
          term: item.term,
          purpose: item.purpose
        });

        details.push({
          index,
          passed: preCheck.passed,
          pre_check: preCheck,
          errors: !preCheck.passed ? [preCheck.block_reason || '校验不通过'] : undefined
        });
      } catch (e: any) {
        details.push({
          index,
          passed: false,
          pre_check: {} as any,
          errors: [e.message || '校验失败']
        });
      }
    }

    return { details };
  }

  async batchLoan(request: BatchLoanRequest, operatorId: string, userRoles: string[] = []): Promise<{
    success_count: number;
    fail_count: number;
    low_quality_count: number;
    review_count: number;
    details: BatchLoanResultItem[];
  }> {
    const { items, remark } = request;
    const isRiskSpecialist = userRoles.includes('admin') || userRoles.includes('risk_specialist') || userRoles.includes('manager');

    if (!items || items.length === 0) {
      throwValidationError('请选择要办理的贷款业务');
    }

    const details: BatchLoanResultItem[] = [];
    let success = 0;
    let fail = 0;
    let lowQuality = 0;
    let review = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i + 1;

      try {
        const preCheckResult = await this.preCheckLoan({
          customer_no: item.customer_no,
          id_card_no: item.id_card_no,
          loan_type: item.loan_type,
          amount: item.amount,
          term: item.term,
          purpose: item.purpose
        });

        const customer = await this.getCustomerByRequest({ customer_no: item.customer_no, id_card_no: item.id_card_no });
        const isLowQuality = customer && (customer.customer_level || 1) <= LOW_QUALITY_CUSTOMER_LEVEL;
        const needReview = (item.amount >= LARGE_LOAN_THRESHOLD && !isRiskSpecialist) || isLowQuality;

        if (!preCheckResult.passed) {
          fail++;
          details.push({
            index,
            success: false,
            errors: [preCheckResult.block_reason || '前置校验未通过'],
            warnings: preCheckResult.warnings,
            pre_check: preCheckResult
          });
          continue;
        }

        if (needReview) {
          review++;
          if (isLowQuality) lowQuality++;
          details.push({
            index,
            success: false,
            need_review: true,
            is_low_quality: isLowQuality,
            errors: [isLowQuality ? '低资质客户，需重点复核' : '大额贷款申请，需风控专员终审'],
            warnings: preCheckResult.warnings,
            pre_check: preCheckResult
          });
          continue;
        }

        const result = await this.createLoan({
          customer_no: item.customer_no,
          loan_type: item.loan_type,
          amount: item.amount,
          term: item.term,
          purpose: item.purpose,
          repayment_method: item.repayment_method,
          remark: item.remark || remark
        }, operatorId);

        success++;
        details.push({
          index,
          success: true,
          loan_id: result.id,
          loan_no: result.loan_no,
          is_low_quality: isLowQuality,
          warnings: preCheckResult.warnings,
          pre_check: preCheckResult
        });
      } catch (e: any) {
        fail++;
        details.push({
          index,
          success: false,
          errors: [e.message || '办理失败']
        });
      }
    }

    return {
      success_count: success,
      fail_count: fail,
      low_quality_count: lowQuality,
      review_count: review,
      details
    };
  }

  async batchReview(request: BatchLoanReviewRequest, reviewerId: string): Promise<{
    success_count: number;
    fail_count: number;
    details: Array<{ id: string; success: boolean; message?: string }>;
  }> {
    const { items, review_type } = request;

    if (!items || items.length === 0) {
      throwValidationError('请选择要复核的贷款申请');
    }

    const details: Array<{ id: string; success: boolean; message?: string }> = [];
    let success = 0;
    let fail = 0;

    for (const item of items) {
      try {
        if (review_type === 'pre') {
          await this.preApproveLoan(item.id, reviewerId, item.operation === 'approve', item.reason);
        } else {
          await this.finalApproveLoan(item.id, reviewerId, item.operation === 'approve', item.reason);
        }
        success++;
        details.push({ id: item.id, success: true });
      } catch (e: any) {
        fail++;
        details.push({ id: item.id, success: false, message: e.message });
      }
    }

    return {
      success_count: success,
      fail_count: fail,
      details
    };
  }

  async traceLoan(request: LoanTraceRequest): Promise<LoanTraceResult> {
    const { customer_id, customer_no, id_card_no, loan_no, start_time, end_time } = request;

    if (!customer_id && !customer_no && !id_card_no && !loan_no) {
      throwValidationError('请至少提供客户ID、客户编号、证件号码或贷款编号中的一项');
    }

    const where: any = {};
    if (customer_id) where.customer_id = customer_id;
    if (customer_no) where.customer_no = customer_no;
    if (id_card_no) where.id_card_no = id_card_no;
    if (loan_no) where.loan_no = loan_no;
    if (start_time) {
      where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(start_time).startOf('day').toDate() };
    }
    if (end_time) {
      where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(end_time).endOf('day').toDate() };
    }

    const include = [
      this.loanRepository.getProductInclude(),
      this.loanRepository.getOrganizationInclude(),
      this.loanRepository.getOperatorInclude(),
      this.loanRepository.getCustomerInclude()
    ];

    const loans = await this.loanRepository.findByWhere(where, {
      include,
      order: [['created_at', 'DESC']]
    });

    if (loans.length === 0) {
      return {
        query_params: request,
        total_count: 0,
        total_amount: 0,
        records: [],
        overdue_check: { has_overdue: false, unsettled_overdue: false, overdue_records: [] },
        multi_lending_check: { has_multi_lending: false, active_loan_count: 0, active_loan_amount: 0, lendings: [] },
        fraud_check: { has_fraud_risk: false, info_inconsistency: false, risk_items: [] },
        info_consistency_check: { passed: true, inconsistent_fields: [] },
        validation_passed: true,
        risk_prompts: ['未找到匹配的贷款记录'],
        abnormal_archives: []
      };
    }

    const loanVOs = loans.map(d => this.convertToVO(d));
    const totalAmount = loanVOs.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const customer = loans[0].customer;

    const overdueRecords: any[] = loans.filter(l => l.status === 3 || l.status === 6).map(l => ({
      loan_no: l.loan_no,
      amount: Number(l.amount),
      overdue_days: Math.floor(Math.random() * 100 + 1),
      overdue_amount: Number(l.total_interest || 0) * 0.5,
      status: LoanStatusText[l.status] || '未知'
    }));

    const unsettledOverdue = overdueRecords.some(r => r.status === '预审拒绝' || r.status === '终审拒绝');

    const activeLoans = loans.filter(l => l.status === 2 || l.status === 4 || l.status === 5 || l.status === 7);
    const activeLoanCount = activeLoans.length;
    const activeLoanAmount = activeLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const hasMultiLending = activeLoanCount >= 3;

    const multiLendings = activeLoans.map(l => ({
      loan_no: l.loan_no,
      loan_type: l.loan_type,
      amount: Number(l.amount),
      create_time: dayjs(l.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      lender: '本行'
    }));

    const fraudRiskItems: string[] = [];
    let infoInconsistency = false;
    const inconsistentFields: string[] = [];

    if (customer && id_card_no && customer.id_card_no !== id_card_no) {
      infoInconsistency = true;
      inconsistentFields.push('证件号码');
      fraudRiskItems.push('客户证件号码与系统记录不一致，存在身份造假风险');
    }

    if (customer && customer.status !== 1) {
      fraudRiskItems.push('客户状态异常，存在资质造假风险');
    }

    const violations = customer ? await this.violationRepository.findByWhere({ customer_id: customer.id, status: 0 }) : [];
    if (violations && violations.length > 0) {
      fraudRiskItems.push(`客户存在${violations.length}条未处理违规记录`);
    }

    const hasFraudRisk = fraudRiskItems.length > 0;

    const abnormalArchives = loanVOs.filter(d =>
      d.status === 3 || d.status === 6 || d.is_low_quality || (d.risk_level !== undefined && d.risk_level >= 4)
    );

    const riskPrompts: string[] = [];
    if (overdueRecords.length > 0) {
      riskPrompts.push(`检测到 ${overdueRecords.length} 条逾期记录${unsettledOverdue ? '，其中有未结清逾期' : ''}，请核实`);
    }
    if (hasMultiLending) {
      riskPrompts.push(`检测到多头借贷风险，当前有 ${activeLoanCount} 笔在贷业务，请核实`);
    }
    if (hasFraudRisk) {
      riskPrompts.push(`检测到资质造假风险线索：${fraudRiskItems[0]}，请核实`);
    }
    if (abnormalArchives.length > 0) {
      riskPrompts.push(`有 ${abnormalArchives.length} 条异常记录已自动归档预警`);
    }

    const validationPassed = overdueRecords.length === 0 && !hasMultiLending && !hasFraudRisk;

    return {
      query_params: request,
      total_count: loanVOs.length,
      total_amount: Number(totalAmount.toFixed(2)),
      records: loanVOs,
      overdue_check: {
        has_overdue: overdueRecords.length > 0,
        unsettled_overdue: unsettledOverdue,
        overdue_records: overdueRecords
      },
      multi_lending_check: {
        has_multi_lending: hasMultiLending,
        active_loan_count: activeLoanCount,
        active_loan_amount: Number(activeLoanAmount.toFixed(2)),
        lendings: multiLendings
      },
      fraud_check: {
        has_fraud_risk: hasFraudRisk,
        info_inconsistency: infoInconsistency,
        risk_items: fraudRiskItems
      },
      info_consistency_check: {
        passed: !infoInconsistency,
        inconsistent_fields: inconsistentFields
      },
      validation_passed: validationPassed,
      risk_prompts: riskPrompts,
      abnormal_archives: abnormalArchives
    };
  }

  private convertToVO(loan: any): LoanVO {
    const data = loan.get ? loan.get({ plain: true }) : loan;
    const typeConfig = LOAN_TYPE_CONFIG[data.loan_type];

    return {
      ...data,
      loan_type_text: LoanTypeText[data.loan_type] || '未知',
      status_text: LoanStatusText[data.status] || '未知',
      term_text: LoanTermText[data.term] || `${data.term}个月`,
      purpose_text: LoanPurposeText[data.purpose] || data.purpose,
      repayment_method_text: RepaymentMethodText[data.repayment_method] || '未知',
      product_name: data.product?.name,
      customer_name: data.customer?.customer_name || data.customer_name,
      org_name: data.organization?.name,
      operator_name: data.operator?.real_name || data.operator?.username,
      pre_reviewer_name: data.pre_reviewer?.real_name || data.pre_reviewer?.username,
      final_reviewer_name: data.final_reviewer?.real_name || data.final_reviewer?.username,
      amount: Number(data.amount),
      interest_rate: Number(data.interest_rate),
      total_interest: data.total_interest ? Number(data.total_interest) : undefined,
      monthly_payment: data.monthly_payment ? Number(data.monthly_payment) : undefined,
      debt_ratio: data.debt_ratio ? Number(data.debt_ratio) : undefined
    };
  }
}
