import {
  DepositRepository,
  AccountRepository,
  CustomerRepository,
  ProductRepository,
  TransactionRepository,
  OrganizationRepository,
  AuditRuleRepository,
  AuditRecordRepository,
  UserRepository
} from '../repositories';
import {
  DepositType,
  DepositStatus,
  DepositTerm,
  InterestCalculationMethod,
  DepositTypeText,
  DepositStatusText,
  DepositTermText,
  InterestMethodText,
  DEPOSIT_LIMIT_CONFIG,
  LARGE_DEPOSIT_THRESHOLD,
  BATCH_SMALL_AMOUNT_THRESHOLD,
  type DepositPreCheckRequest,
  type DepositPreCheckResult,
  type CreateDepositRequest,
  type DepositUpdateRequest,
  type DepositQueryParams,
  type DepositVO,
  type BatchDepositItem,
  type BatchDepositRequest,
  type BatchDepositResultItem,
  type BatchDepositReviewRequest,
  type DepositTraceRequest,
  type DepositTraceResult,
  type DepositProductConfig
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
import { RiskControlService } from './RiskControlService';

const accountStatusMap: Record<number, string> = {
  0: '已注销',
  1: '正常',
  2: '冻结',
  3: '挂失',
  4: '休眠'
};

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

export class DepositService {
  private depositRepository: DepositRepository;
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;
  private productRepository: ProductRepository;
  private transactionRepository: TransactionRepository;
  private organizationRepository: OrganizationRepository;
  private auditRuleRepository: AuditRuleRepository;
  private auditRecordRepository: AuditRecordRepository;
  private userRepository: UserRepository;
  private riskControlService: RiskControlService;

  constructor() {
    this.depositRepository = new DepositRepository();
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
    this.productRepository = new ProductRepository();
    this.transactionRepository = new TransactionRepository();
    this.organizationRepository = new OrganizationRepository();
    this.auditRuleRepository = new AuditRuleRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.userRepository = new UserRepository();
    this.riskControlService = new RiskControlService();
  }

  private formatMoneyWithComma(amount: number): string {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private calculateInterest(amount: number, rate: number, termDays: number, method: InterestCalculationMethod): number {
    const annualRate = rate / 100;
    let interest = 0;

    switch (method) {
      case 1:
        interest = amount * annualRate * (termDays / 365);
        break;
      case 2:
        interest = amount * annualRate * (termDays / 365);
        break;
      case 3:
        interest = amount * annualRate * (termDays / 365);
        break;
      case 4:
        interest = amount * annualRate * (termDays / 365);
        break;
      default:
        interest = amount * annualRate * (termDays / 365);
    }

    return Number(interest.toFixed(2));
  }

  private getProductConfig(depositType: DepositType, productId?: string, term?: DepositTerm): DepositProductConfig {
    const defaultConfig: DepositProductConfig = {
      min_amount: 0,
      max_amount: 0,
      single_limit: 500000,
      daily_limit: 5000000,
      interest_rate: 0.3,
      available_terms: [0],
      interest_method: 1,
      allow_early_withdraw: true,
      early_withdraw_penalty_rate: 0.3
    };

    if (depositType === 1) {
      return {
        ...defaultConfig,
        min_amount: 0,
        max_amount: 0,
        interest_rate: 0.3,
        available_terms: [0],
        interest_method: 1
      };
    } else if (depositType === 2) {
      const termRates: Record<number, number> = {
        30: 1.25,
        90: 1.45,
        180: 1.65,
        365: 1.95,
        730: 2.15,
        1095: 2.45,
        1825: 2.65
      };
      const selectedTerm = term || 365;
      return {
        ...defaultConfig,
        min_amount: 200000,
        max_amount: 0,
        single_limit: 10000000,
        daily_limit: 50000000,
        interest_rate: termRates[selectedTerm] || 1.95,
        available_terms: [30, 90, 180, 365, 730, 1095, 1825],
        interest_method: 3,
        allow_early_withdraw: false,
        early_withdraw_penalty_rate: 0.3
      };
    } else if (depositType === 3) {
      const termRates: Record<number, number> = {
        30: 1.1,
        90: 1.3,
        180: 1.5,
        365: 1.8,
        730: 2.0,
        1095: 2.3,
        1825: 2.5
      };
      const selectedTerm = term || 365;
      return {
        ...defaultConfig,
        min_amount: 1000,
        max_amount: 0,
        interest_rate: termRates[selectedTerm] || 1.8,
        available_terms: [30, 90, 180, 365, 730, 1095, 1825],
        interest_method: 3,
        allow_early_withdraw: true,
        early_withdraw_penalty_rate: 0.3
      };
    }

    return defaultConfig;
  }

  async preCheckDeposit(request: DepositPreCheckRequest, currentUserId?: string): Promise<DepositPreCheckResult> {
    const { account_no, customer_no, deposit_type, product_id, amount, term } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';

    if (!account_no) {
      throwValidationError('账户号不能为空');
    }
    if (![1, 2, 3].includes(deposit_type)) {
      throwValidationError('无效的存款类型');
    }
    if (!isValidAmount(amount) || amount <= 0) {
      throwValidationError('存款金额无效');
    }

    const account = await this.accountRepository.findByAccountNo(account_no);
    if (!account) {
      throwNotFoundError('账户不存在');
    }

    const customer = account.customer_id
      ? await this.customerRepository.findById(account.customer_id)
      : null;

    const productConfig = this.getProductConfig(deposit_type, product_id, term);

    if (productConfig.min_amount > 0 && amount < productConfig.min_amount) {
      blocked = true;
      blockReason = `存款金额低于产品最低起存金额：${this.formatMoneyWithComma(productConfig.min_amount)}元`;
    }

    if (productConfig.max_amount > 0 && amount > productConfig.max_amount) {
      blocked = true;
      blockReason = `存款金额超过产品最高限额：${this.formatMoneyWithComma(productConfig.max_amount)}元`;
    }

    if (product_id) {
      if (!isValidId(product_id)) {
        throwValidationError('无效的产品ID');
      }
      const product = await this.productRepository.findById(product_id);
      if (!product) {
        throwNotFoundError('产品不存在');
      }
      if (product.status !== 1) {
        blocked = true;
        blockReason = '产品已下架';
      }
    }

    if (term !== undefined && !productConfig.available_terms.includes(term)) {
      throwValidationError(`无效的存期，可选存期：${productConfig.available_terms.map(t => DepositTermText[t]).join('、')}`);
    }

    const accountStatus = account.status;
    const accountStatusText = accountStatusMap[accountStatus] || '未知';

    if (accountStatus === 0) {
      blocked = true;
      blockReason = '账户已注销';
    }
    if (accountStatus === 2) {
      blocked = true;
      blockReason = '账户已冻结';
    }
    if (accountStatus === 3) {
      blocked = true;
      blockReason = '账户已挂失';
    }
    if (accountStatus === 4) {
      warnings.push('账户处于休眠状态，存款将自动激活');
    }

    const isFrozen = account.frozen_amount > 0;
    const isLost = accountStatus === 3;

    const customerRiskLevel = customer?.risk_level || 0;
    const customerRiskLevelText = riskLevelMap[customerRiskLevel] || '未知';

    if (customerRiskLevel >= 4) {
      warnings.push(`客户风险等级为【${customerRiskLevelText}】，建议加强审核`);
    }
    if (customerRiskLevel >= 5) {
      blocked = true;
      blockReason = '客户风险等级过高，禁止办理存款业务';
    }

    const accountLimitConfig = DEPOSIT_LIMIT_CONFIG[account.account_type] || DEPOSIT_LIMIT_CONFIG[1];
    const singleLimit = Math.min(productConfig.single_limit, accountLimitConfig.single_limit);
    const dailyLimit = Math.min(productConfig.daily_limit, accountLimitConfig.daily_limit);

    let amountValid = true;
    let amountValidationMessage = '';

    if (amount > singleLimit) {
      amountValid = false;
      amountValidationMessage = `单笔存款金额超限：单笔限额${this.formatMoneyWithComma(singleLimit)}元`;
      blocked = true;
      blockReason = amountValidationMessage;
    }

    const dailyUsedAmount = await this.depositRepository.getDailyDepositAmount(account_no, new Date());
    const dailyRemainingAmount = Math.max(0, dailyLimit - dailyUsedAmount);

    if (dailyUsedAmount + amount > dailyLimit) {
      amountValid = false;
      amountValidationMessage = `单日累计存款金额超限：单日限额${this.formatMoneyWithComma(dailyLimit)}元，已使用${this.formatMoneyWithComma(dailyUsedAmount)}元，剩余可存${this.formatMoneyWithComma(dailyRemainingAmount)}元`;
      blocked = true;
      blockReason = amountValidationMessage;
    }

    if (amount >= LARGE_DEPOSIT_THRESHOLD) {
      warnings.push(`大额存款（≥${this.formatMoneyWithComma(LARGE_DEPOSIT_THRESHOLD)}元）需按规定进行审核`);
    }

    let calculatedInterest: number | undefined;
    let maturityDate: string | undefined;

    if (term && term > 0 && !blocked) {
      calculatedInterest = this.calculateInterest(amount, productConfig.interest_rate, term, productConfig.interest_method);
      maturityDate = dayjs().add(term, 'day').format('YYYY-MM-DD');
    }

    const duplicates = await this.depositRepository.checkDuplicateDeposit(account_no, amount);
    if (duplicates.length > 0) {
      warnings.push(`检测到近5分钟内有相同金额（${this.formatMoneyWithComma(amount)}元）的存款记录，请确认是否重复录入`);
    }

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      warnings,
      account_status: accountStatus,
      account_status_text: accountStatusText,
      customer_risk_level: customerRiskLevel,
      customer_risk_level_text: customerRiskLevelText,
      is_frozen: isFrozen,
      is_lost: isLost,
      single_limit: singleLimit,
      daily_limit: dailyLimit,
      daily_used_amount: dailyUsedAmount,
      daily_remaining_amount: dailyRemainingAmount,
      amount_valid: amountValid,
      amount_validation_message: amountValidationMessage || undefined,
      product_config: productConfig,
      calculated_interest: calculatedInterest,
      maturity_date: maturityDate
    };
  }

  async getDepositList(params: DepositQueryParams, currentUserId?: string, userOrgId?: string): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.depositRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.depositRepository.getProductInclude(),
      this.depositRepository.getOrganizationInclude(),
      this.depositRepository.getOperatorInclude(),
      this.depositRepository.getCustomerInclude(),
      this.depositRepository.getAccountInclude()
    ];

    const result = await this.depositRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: DepositVO[] = result.list.map(d => this.convertToVO(d));

    return { ...result, list };
  }

  private convertToVO(d: any): DepositVO {
    const data = d.toJSON ? d.toJSON() : d;
    const vo: DepositVO = { ...data };

    if (data.product) {
      vo.product_name = data.product.name;
    }
    if (data.organization) {
      vo.org_name = data.organization.name;
    }
    if (data.operator) {
      vo.operator_name = data.operator.real_name || data.operator.username;
    }
    if (data.customer) {
      vo.customer_name = data.customer.customer_name;
    }

    vo.deposit_type_text = DepositTypeText[data.deposit_type] || '未知';
    vo.status_text = DepositStatusText[data.status] || '未知';
    vo.term_text = data.term !== undefined ? DepositTermText[data.term] : undefined;
    vo.interest_method_text = data.interest_method !== undefined ? InterestMethodText[data.interest_method] : undefined;
    vo.amount_formatted = this.formatMoneyWithComma(Number(data.amount || 0));
    vo.interest_formatted = data.calculated_interest !== undefined ? this.formatMoneyWithComma(Number(data.calculated_interest)) : undefined;

    return vo;
  }

  async getDepositById(id: string): Promise<DepositVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的存款ID');
    }

    const deposit = await this.depositRepository.findById(id, {
      include: [
        this.depositRepository.getProductInclude(),
        this.depositRepository.getOrganizationInclude(),
        this.depositRepository.getOperatorInclude(),
        this.depositRepository.getCustomerInclude(),
        this.depositRepository.getAccountInclude()
      ]
    });

    if (!deposit) {
      throwNotFoundError('存款记录不存在');
    }

    return this.convertToVO(deposit);
  }

  async createDeposit(request: CreateDepositRequest, operatorId: string, orgId?: string): Promise<DepositVO> {
    const { account_no, deposit_type, amount, product_id, term, interest_method, request_id, ...rest } = request;

    if (request_id) {
      const existed = await this.depositRepository.findByRequestId(request_id);
      if (existed) {
        throwBusinessError(`重复提交请求：requestId=${request_id}，存款流水号：${existed.deposit_no}`);
      }
    }

    const preCheckResult = await this.preCheckDeposit({
      account_no,
      deposit_type,
      product_id,
      amount,
      term: term as DepositTerm
    }, operatorId);

    if (preCheckResult.blocked) {
      throwBusinessError(preCheckResult.block_reason || '前置校验未通过');
    }

    const account = await this.accountRepository.findByAccountNo(account_no);
    if (!account) {
      throwNotFoundError('账户不存在');
    }

    const customer = account.customer_id
      ? await this.customerRepository.findById(account.customer_id)
      : null;

    const productConfig = this.getProductConfig(deposit_type, product_id, term as DepositTerm);
    const resolvedTerm = term || (deposit_type === 1 ? 0 : 365);
    const resolvedInterestMethod = interest_method || productConfig.interest_method;
    const calculatedInterest = resolvedTerm > 0
      ? this.calculateInterest(amount, productConfig.interest_rate, resolvedTerm, resolvedInterestMethod)
      : 0;

    const targetOrgId = orgId;
    if (targetOrgId && !isValidId(targetOrgId)) {
      throwValidationError('无效的机构ID');
    }

    const depositNo = await this.depositRepository.generateDepositNo();
    const transactionNo = await this.transactionRepository.generateTransactionNo();

    const needAudit = amount >= LARGE_DEPOSIT_THRESHOLD;
    let auditLevel = 0;

    if (needAudit) {
      const auditRules = await this.auditRuleRepository.findMatchingRules('deposit', amount);
      if (auditRules.length > 0) {
        auditLevel = auditRules[0].audit_level || 1;
      }
    }

    let deposit: any;
    let transaction: any;

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(account.balance || 0);
      const newBalance = originalBalance + amount;

      deposit = await this.depositRepository.create({
        ...rest,
        deposit_no: depositNo,
        account_no,
        account_id: account.id,
        customer_id: customer?.id,
        customer_no: customer?.customer_no,
        deposit_type,
        product_id,
        amount,
        currency: request.currency || 'CNY',
        term: resolvedTerm,
        interest_rate: productConfig.interest_rate,
        interest_method: resolvedInterestMethod,
        calculated_interest: calculatedInterest,
        maturity_date: resolvedTerm > 0 ? dayjs().add(resolvedTerm, 'day').toDate() : undefined,
        value_date: new Date(),
        org_id: targetOrgId,
        operator_id: operatorId,
        status: needAudit ? 0 : 2,
        original_balance: originalBalance,
        new_balance: newBalance,
        request_id,
        related_transaction_no: transactionNo
      }, { transaction: t });

      transaction = await this.transactionRepository.create({
        transaction_no: transactionNo,
        type: 1,
        business_line: customer?.customer_type === 2 ? 'corporate' : 'retail',
        amount,
        currency: request.currency || 'CNY',
        customer_id: customer?.id,
        customer_no: customer?.customer_no,
        payer_account: '',
        payer_name: '',
        payee_account: account_no,
        payee_name: customer?.customer_name || account.account_no,
        product_id,
        org_id: targetOrgId,
        operator_id: operatorId,
        channel_code: request.channel_code,
        channel_terminal: request.channel_terminal,
        status: needAudit ? 0 : 2,
        audit_status: needAudit ? 0 : 10,
        transaction_time: new Date(),
        fee: 0
      }, { transaction: t });

      if (!needAudit) {
        await this.accountRepository.update(account.id, {
          balance: newBalance,
          available_balance: Number(account.available_balance || 0) + amount
        }, { transaction: t });
      }

      if (needAudit) {
        await this.auditRecordRepository.create({
          biz_type: 'deposit',
          biz_id: deposit.id,
          biz_no: depositNo,
          type: amount >= 1000000 ? 2 : 1,
          level: auditLevel,
          status: 0,
          submitter_id: operatorId,
          submitter_org_id: targetOrgId,
          submit_time: new Date(),
          current_node: auditLevel === 1 ? 'AUDIT_LEVEL_1' : auditLevel === 2 ? 'AUDIT_LEVEL_2' : 'AUDIT_LEVEL_3'
        }, { transaction: t });
      }
    });

    try {
      if (deposit && transaction && transaction.id) {
        await this.riskControlService.evaluateTransactionRisk(transaction.id);
      }
    } catch (e) {
    }

    return this.getDepositById((deposit as any).id);
  }

  async cancelDeposit(id: string, operatorId: string): Promise<DepositVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的存款ID');
    }

    const deposit = await this.depositRepository.findById(id);
    if (!deposit) {
      throwNotFoundError('存款记录不存在');
    }

    if (deposit.status !== 0) {
      throwBusinessError('仅待确认状态的存款可撤销');
    }

    const account = await this.accountRepository.findById(deposit.account_id);
    if (!account) {
      throwNotFoundError('账户不存在');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      await this.depositRepository.update(id, {
        status: 3
      }, { transaction: t });

      if (deposit.related_transaction_no) {
        const relatedTx = await this.transactionRepository.findOne({
          where: { transaction_no: deposit.related_transaction_no }
        });
        if (relatedTx) {
          await this.transactionRepository.update(relatedTx.id, {
            status: 5
          }, { transaction: t });
        }
      }

      const auditRecord = await this.auditRecordRepository.findOne({
        where: { biz_id: id, biz_type: 'deposit' }
      });
      if (auditRecord) {
        await this.auditRecordRepository.update(auditRecord.id, { status: 3 });
      }
    });

    return this.getDepositById(id);
  }

  async confirmDeposit(id: string, operatorId: string): Promise<DepositVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的存款ID');
    }

    const deposit = await this.depositRepository.findById(id);
    if (!deposit) {
      throwNotFoundError('存款记录不存在');
    }

    if (deposit.status !== 0) {
      throwBusinessError('仅待确认状态的存款可入账');
    }

    const account = await this.accountRepository.findById(deposit.account_id);
    if (!account) {
      throwNotFoundError('账户不存在');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(account.balance || 0);
      const newBalance = originalBalance + Number(deposit.amount || 0);

      await this.depositRepository.update(id, {
        status: 2,
        original_balance: originalBalance,
        new_balance: newBalance
      }, { transaction: t });

      await this.accountRepository.update(account.id, {
        balance: newBalance,
        available_balance: Number(account.available_balance || 0) + Number(deposit.amount || 0)
      }, { transaction: t });

      if (deposit.related_transaction_no) {
        const relatedTx = await this.transactionRepository.findOne({
          where: { transaction_no: deposit.related_transaction_no }
        });
        if (relatedTx) {
          await this.transactionRepository.update(relatedTx.id, {
            status: 2,
            audit_status: 10
          }, { transaction: t });
        }
      }
    });

    return this.getDepositById(id);
  }

  async batchDeposit(request: BatchDepositRequest, operatorId: string, userRoles: string[] = []): Promise<{ success_count: number; fail_count: number; details: BatchDepositResultItem[] }> {
    const { items, channel_code, channel_terminal } = request;
    const isManager = userRoles.includes('admin') || userRoles.includes('manager');

    if (!items || items.length === 0) {
      throwValidationError('请选择要办理的存款业务');
    }

    const details: BatchDepositResultItem[] = [];
    let success = 0;
    let fail = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i + 1;

      try {
        if (!isManager && item.amount > BATCH_SMALL_AMOUNT_THRESHOLD) {
          fail++;
          details.push({
            index,
            success: false,
            error: `普通员工仅可办理单笔${this.formatMoneyWithComma(BATCH_SMALL_AMOUNT_THRESHOLD)}元以下的小额存款批量录入，大额存款需管理员复核`
          });
          continue;
        }

        const preCheckResult = await this.preCheckDeposit({
          account_no: item.account_no,
          customer_no: item.customer_no,
          deposit_type: item.deposit_type,
          product_id: item.product_id,
          amount: item.amount,
          term: item.term as DepositTerm
        }, operatorId);

        if (preCheckResult.blocked) {
          fail++;
          details.push({
            index,
            success: false,
            error: preCheckResult.block_reason || '前置校验未通过',
            pre_check_result: preCheckResult
          });
          continue;
        }

        const needReview = item.amount >= LARGE_DEPOSIT_THRESHOLD && !isManager;

        if (needReview) {
          fail++;
          details.push({
            index,
            success: false,
            error: `大额存款（≥${this.formatMoneyWithComma(LARGE_DEPOSIT_THRESHOLD)}元）需管理员复核`,
            need_review: true,
            pre_check_result: preCheckResult
          });
          continue;
        }

        const customerLevelAdjust = item.deposit_type === 3 && item.term && item.term >= 365;
        let adjustedRate = preCheckResult.product_config?.interest_rate || 0;
        if (customerLevelAdjust) {
          const account = await this.accountRepository.findByAccountNo(item.account_no);
          if (account?.customer_id) {
            const customer = await this.customerRepository.findById(account.customer_id);
            if (customer?.customer_level && customer.customer_level >= 3) {
              adjustedRate = Number((adjustedRate * 1.1).toFixed(4));
            }
          }
        }

        const result = await this.createDeposit({
          account_no: item.account_no,
          customer_no: item.customer_no,
          deposit_type: item.deposit_type,
          product_id: item.product_id,
          amount: item.amount,
          term: item.term as DepositTerm,
          channel_code,
          channel_terminal,
          remark: item.remark
        }, operatorId);

        success++;
        details.push({
          index,
          success: true,
          deposit_id: result.id,
          deposit_no: result.deposit_no,
          pre_check_result: preCheckResult
        });
      } catch (err: any) {
        fail++;
        details.push({
          index,
          success: false,
          error: err?.message || '办理失败'
        });
      }
    }

    return { success_count: success, fail_count: fail, details };
  }

  async batchReview(request: BatchDepositReviewRequest, operatorId: string): Promise<{ success_count: number; fail_count: number; details: any[] }> {
    const { ids, operation, remark } = request;

    if (!ids || ids.length === 0) {
      throwValidationError('请选择要审核的存款记录');
    }
    if (!['approve', 'reject'].includes(operation)) {
      throwValidationError('无效的审核操作');
    }

    const details: any[] = [];
    let success = 0;
    let fail = 0;

    for (const id of ids) {
      try {
        if (operation === 'approve') {
          await this.confirmDeposit(id, operatorId);
        } else {
          await this.cancelDeposit(id, operatorId);
        }
        success++;
        details.push({ id, success: true });
      } catch (err: any) {
        fail++;
        details.push({ id, success: false, message: err?.message || '审核失败' });
      }
    }

    return { success_count: success, fail_count: fail, details };
  }

  async traceDeposit(request: DepositTraceRequest): Promise<DepositTraceResult> {
    const { account_no, deposit_no, customer_no, start_time, end_time } = request;

    if (!account_no && !deposit_no && !customer_no) {
      throwValidationError('请至少提供账号、存款流水号或客户编号中的一项');
    }

    const where: any = {};
    if (account_no) where.account_no = account_no;
    if (deposit_no) where.deposit_no = deposit_no;
    if (customer_no) where.customer_no = customer_no;
    if (start_time) {
      where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(start_time).startOf('day').toDate() };
    }
    if (end_time) {
      where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(end_time).endOf('day').toDate() };
    }

    const include = [
      this.depositRepository.getProductInclude(),
      this.depositRepository.getOrganizationInclude(),
      this.depositRepository.getOperatorInclude(),
      this.depositRepository.getCustomerInclude(),
      this.depositRepository.getAccountInclude()
    ];

    const deposits = await this.depositRepository.findByWhere(where, {
      include,
      order: [['created_at', 'DESC']]
    });

    if (deposits.length === 0) {
      return {
        query_params: request,
        total_count: 0,
        total_amount: 0,
        records: [],
        duplicate_check: { has_duplicate: false, duplicates: [] },
        amount_anomaly_check: { has_anomaly: false, anomalies: [] },
        rate_match_check: { has_mismatch: false, mismatches: [] },
        validation_passed: true,
        risk_prompts: ['未找到匹配的存款记录']
      };
    }

    const depositVOs = deposits.map(d => this.convertToVO(d));

    const totalAmount = depositVOs.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalInterest = depositVOs.reduce((sum, d) => sum + Number(d.calculated_interest || 0), 0);

    const avgAmount = totalAmount / depositVOs.length;

    const duplicateMap = new Map<string, DepositVO[]>();
    depositVOs.forEach(d => {
      const key = `${d.account_no}_${d.amount}_${dayjs(d.created_at).format('YYYY-MM-DD HH:mm')}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(d);
    });
    const duplicateGroups = Array.from(duplicateMap.values())
      .filter(group => group.length > 1);
    const duplicates: any[] = [];
    duplicateGroups.forEach(group => {
      const firstTime = dayjs(group[0].created_at);
      group.forEach((d, idx) => {
        if (idx > 0) {
          duplicates.push({
            deposit_no: d.deposit_no,
            amount: Number(d.amount),
            create_time: dayjs(d.created_at).format('YYYY-MM-DD HH:mm:ss'),
            time_diff_minutes: dayjs(d.created_at).diff(firstTime, 'minute')
          });
        }
      });
    });

    const anomalies: any[] = [];
    depositVOs.forEach(d => {
      const amount = Number(d.amount || 0);
      const deviation = avgAmount > 0 ? Math.abs((amount - avgAmount) / avgAmount) * 100 : 0;
      let isAnomaly = false;
      if (amount >= 1000000) isAnomaly = true;
      else if (deviation > 200) isAnomaly = true;
      else if (d.customer_risk_level !== undefined && d.customer_risk_level >= 4) isAnomaly = true;

      if (isAnomaly) {
        anomalies.push({
          deposit_no: d.deposit_no,
          amount,
          average_amount: Number(avgAmount.toFixed(2)),
          deviation_percent: Number(deviation.toFixed(2))
        });
      }
    });

    const mismatches: any[] = [];
    for (const d of depositVOs) {
      if (d.term && d.term > 0 && d.interest_rate !== undefined && d.amount) {
        const productConfig = this.getProductConfig(d.deposit_type as DepositType, d.product_id, d.term as DepositTerm);
        const expectedRate = productConfig.interest_rate;
        const appliedRate = Number(d.interest_rate);
        const diff = Number((appliedRate - expectedRate).toFixed(4));
        if (Math.abs(diff) > 0.001) {
          mismatches.push({
            deposit_no: d.deposit_no,
            deposit_type: d.deposit_type,
            term: d.term,
            applied_rate: appliedRate,
            expected_rate: expectedRate,
            diff
          });
        }
      }
    }

    const riskPrompts: string[] = [];
    if (duplicates.length > 0) {
      riskPrompts.push(`检测到 ${duplicates.length} 条疑似重复存款记录，请核实`);
    }
    if (anomalies.length > 0) {
      riskPrompts.push(`检测到 ${anomalies.length} 条金额异常记录，请核实`);
    }
    if (mismatches.length > 0) {
      riskPrompts.push(`检测到 ${mismatches.length} 条利率不匹配记录，请核实`);
    }

    const validationPassed = duplicates.length === 0 && anomalies.length === 0 && mismatches.length === 0;

    return {
      query_params: request,
      total_count: depositVOs.length,
      total_amount: Number(totalAmount.toFixed(2)),
      records: depositVOs,
      duplicate_check: {
        has_duplicate: duplicates.length > 0,
        duplicates
      },
      amount_anomaly_check: {
        has_anomaly: anomalies.length > 0,
        anomalies
      },
      rate_match_check: {
        has_mismatch: mismatches.length > 0,
        mismatches
      },
      validation_passed: validationPassed,
      risk_prompts: riskPrompts
    };
  }

  async getDepositConfig(): Promise<any> {
    return {
      deposit_types: Object.entries(DepositTypeText).map(([value, label]) => ({ value: Number(value), label })),
      deposit_statuses: Object.entries(DepositStatusText).map(([value, label]) => ({ value: Number(value), label })),
      deposit_terms: Object.entries(DepositTermText).map(([value, label]) => ({ value: Number(value), label })),
      interest_methods: Object.entries(InterestMethodText).map(([value, label]) => ({ value: Number(value), label })),
      limit_config: DEPOSIT_LIMIT_CONFIG,
      large_deposit_threshold: LARGE_DEPOSIT_THRESHOLD,
      batch_small_amount_threshold: BATCH_SMALL_AMOUNT_THRESHOLD
    };
  }
}
