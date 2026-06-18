import {
  SettlementRepository,
  SettlementBatchRepository,
  AccountRepository,
  CustomerRepository,
  TransactionRepository,
  OrganizationRepository,
  AuditRuleRepository,
  AuditRecordRepository,
  UserRepository,
  ViolationRepository
} from '../repositories';
import {
  TransferType,
  TransferMode,
  SettlementStatus,
  AuditStatus,
  RiskLevel,
  TransferTypeText,
  TransferModeText,
  SettlementStatusText,
  TRANSFER_FEE_CONFIG,
  ARRIVAL_TIME_CONFIG,
  REVIEW_RULE_CONFIG,
  TRANSFER_LIMIT_CONFIG,
  PUBLIC_PRIVATE_RULES,
  RISK_DETECTION_RULES
} from '../models/Settlement';
import {
  BatchType,
  BatchTypeText,
  BatchStatusText,
  type SettlementConfig,
  type SettlementPreCheckRequest,
  type SettlementPreCheckResult,
  type LimitCheckResult,
  type PublicPrivateCheckResult,
  type FeeCalcResult,
  type SettlementQueryParams,
  type SettlementVO,
  type CreateSettlementRequest,
  type ReviewSettlementRequest,
  type CreateBatchSettlementRequest,
  type BatchSettlementResult,
  type BatchSettlementResultItem,
  type BatchQueryParams,
  type BatchSettlementVO,
  type SettlementBatchReviewRequest,
  type BatchProgressVO,
  type SettlementTraceRequest,
  type SettlementTraceResult,
  type SameNameTransferCheck,
  type LargeAmountNoPurposeCheck,
  type AbnormalLocationCheck,
  type AccountComplianceCheck,
  type TransactionAuthenticityCheck
} from '../types/settlement';
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

const auditStatusMap: Record<number, string> = {
  0: '待审核',
  1: '一级审核中',
  2: '二级审核中',
  3: '三级审核中',
  10: '审核通过',
  11: '审核拒绝'
};

const batchStatusMap: Record<number, string> = {
  0: '待提交',
  1: '待复核',
  2: '处理中',
  3: '部分完成',
  4: '全部完成',
  5: '已撤销',
  6: '已失败'
};

export class SettlementService {
  private settlementRepository: SettlementRepository;
  private settlementBatchRepository: SettlementBatchRepository;
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;
  private transactionRepository: TransactionRepository;
  private organizationRepository: OrganizationRepository;
  private auditRuleRepository: AuditRuleRepository;
  private auditRecordRepository: AuditRecordRepository;
  private userRepository: UserRepository;
  private violationRepository: ViolationRepository;
  private riskControlService: RiskControlService;

  constructor() {
    this.settlementRepository = new SettlementRepository();
    this.settlementBatchRepository = new SettlementBatchRepository();
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
    this.transactionRepository = new TransactionRepository();
    this.organizationRepository = new OrganizationRepository();
    this.auditRuleRepository = new AuditRuleRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.userRepository = new UserRepository();
    this.violationRepository = new ViolationRepository();
    this.riskControlService = new RiskControlService();
  }

  private formatMoneyWithComma(amount: number): string {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private calculateFee(amount: number, transferType: TransferType, transferMode: TransferMode): FeeCalcResult {
    const feeConfig = TRANSFER_FEE_CONFIG[transferType]?.[transferMode] || { min_fee: 0, max_fee: 0, rate: 0 };
    let fee = 0;
    let desc = '';

    if (feeConfig.fixed_amount !== undefined) {
      fee = feeConfig.fixed_amount;
      desc = `固定手续费：${this.formatMoneyWithComma(fee)}元`;
    } else if (feeConfig.rate > 0) {
      fee = amount * feeConfig.rate;
      fee = Number(fee.toFixed(2));
      desc = `按金额${(feeConfig.rate * 100).toFixed(4)}%计费：${this.formatMoneyWithComma(fee)}元`;
    }

    if (feeConfig.min_fee > 0 && fee < feeConfig.min_fee) {
      fee = feeConfig.min_fee;
      desc += `，按最低手续费${this.formatMoneyWithComma(feeConfig.min_fee)}元收取`;
    }
    if (feeConfig.max_fee > 0 && fee > feeConfig.max_fee) {
      fee = feeConfig.max_fee;
      desc += `，按最高手续费${this.formatMoneyWithComma(feeConfig.max_fee)}元收取`;
    }

    return {
      fee: Number(fee.toFixed(2)),
      fee_calc_desc: desc,
      min_fee: feeConfig.min_fee,
      max_fee: feeConfig.max_fee,
      rate: feeConfig.rate
    };
  }

  private getArrivalTime(transferType: TransferType, transferMode: TransferMode): string {
    return ARRIVAL_TIME_CONFIG[transferType]?.[transferMode] || 'T+1到账';
  }

  private determinePayerAccountType(account: any): string {
    if (account?.account_type === 1 || account?.account_type === 2 || account?.account_type === 3) {
      const customer = account?.customer;
      if (customer?.customer_type === 2) return 'P';
      return 'I';
    }
    return 'I';
  }

  private determineReviewLevel(amount: number): { needReview: boolean; level: number; reason: string } {
    if (amount >= REVIEW_RULE_CONFIG.MULTI_LEVEL_REVIEW_THRESHOLD) {
      return { needReview: true, level: 3, reason: `金额超过${this.formatMoneyWithComma(REVIEW_RULE_CONFIG.MULTI_LEVEL_REVIEW_THRESHOLD)}元，需三级复核` };
    }
    if (amount >= REVIEW_RULE_CONFIG.SINGLE_LEVEL_REVIEW_THRESHOLD) {
      return { needReview: true, level: 2, reason: `金额超过${this.formatMoneyWithComma(REVIEW_RULE_CONFIG.SINGLE_LEVEL_REVIEW_THRESHOLD)}元，需二级复核` };
    }
    if (amount >= REVIEW_RULE_CONFIG.SINGLE_AUTO_REVIEW_THRESHOLD) {
      return { needReview: true, level: 1, reason: `金额超过${this.formatMoneyWithComma(REVIEW_RULE_CONFIG.SINGLE_AUTO_REVIEW_THRESHOLD)}元，需一级复核` };
    }
    return { needReview: false, level: 0, reason: '' };
  }

  async getSettlementConfig(): Promise<SettlementConfig> {
    return {
      transfer_types: Object.entries(TransferTypeText).map(([value, label]) => ({ value: Number(value) as TransferType, label })),
      transfer_modes: Object.entries(TransferModeText).map(([value, label]) => ({ value: Number(value) as TransferMode, label })),
      settlement_statuses: Object.entries(SettlementStatusText).map(([value, label]) => ({
        value: Number(value) as SettlementStatus,
        label
      })),
      batch_types: Object.entries(BatchTypeText).map(([value, label]) => ({ value: Number(value) as BatchType, label: label as string })),
      fee_config: TRANSFER_FEE_CONFIG,
      arrival_time_config: ARRIVAL_TIME_CONFIG,
      review_rules: {
        single_auto_review_threshold: REVIEW_RULE_CONFIG.SINGLE_AUTO_REVIEW_THRESHOLD,
        batch_small_amount_threshold: REVIEW_RULE_CONFIG.BATCH_SMALL_AMOUNT_THRESHOLD,
        batch_large_amount_threshold: REVIEW_RULE_CONFIG.BATCH_LARGE_AMOUNT_THRESHOLD,
        single_level_review_threshold: REVIEW_RULE_CONFIG.SINGLE_LEVEL_REVIEW_THRESHOLD,
        multi_level_review_threshold: REVIEW_RULE_CONFIG.MULTI_LEVEL_REVIEW_THRESHOLD
      },
      transfer_limits: TRANSFER_LIMIT_CONFIG,
      public_private_rules: {
        allow_public_to_private: PUBLIC_PRIVATE_RULES.ALLOW_PUBLIC_TO_PRIVATE,
        allow_private_to_public: PUBLIC_PRIVATE_RULES.ALLOW_PRIVATE_TO_PUBLIC,
        public_to_private_daily_limit: PUBLIC_PRIVATE_RULES.PUBLIC_TO_PRIVATE_DAILY_LIMIT,
        private_to_public_daily_limit: PUBLIC_PRIVATE_RULES.PRIVATE_TO_PUBLIC_DAILY_LIMIT,
        required_purpose_public_to_private: PUBLIC_PRIVATE_RULES.REQUIRED_PURPOSE_FOR_PUBLIC_TO_PRIVATE,
        required_purpose_private_to_public: PUBLIC_PRIVATE_RULES.REQUIRED_PURPOSE_FOR_PRIVATE_TO_PUBLIC
      },
      risk_detection_rules: {
        same_name_transfer_count_threshold: RISK_DETECTION_RULES.SAME_NAME_TRANSFER_COUNT_THRESHOLD,
        same_name_transfer_time_window_hours: RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS,
        large_amount_no_purpose_threshold: RISK_DETECTION_RULES.LARGE_AMOUNT_NO_PURPOSE_THRESHOLD,
        abnormal_location_check: RISK_DETECTION_RULES.ABNORMAL_LOCATION_CHECK,
        night_transaction_start_hour: RISK_DETECTION_RULES.NIGHT_TRANSACTION_START_HOUR,
        night_transaction_end_hour: RISK_DETECTION_RULES.NIGHT_TRANSACTION_END_HOUR,
        night_transaction_amount_threshold: RISK_DETECTION_RULES.NIGHT_TRANSACTION_AMOUNT_THRESHOLD
      }
    };
  }

  async preCheckSettlement(request: SettlementPreCheckRequest, currentUserId?: string): Promise<SettlementPreCheckResult> {
    const { payer_account_no, transfer_type, transfer_mode, payee_account, amount, purpose } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';
    let blockField = '';

    if (!payer_account_no) {
      throwValidationError('转出账户号不能为空');
    }
    if (![1, 2, 3, 4].includes(transfer_type)) {
      throwValidationError('无效的转账类型');
    }
    if (![1, 2, 3].includes(transfer_mode)) {
      throwValidationError('无效的转账模式');
    }
    if (!isValidAmount(amount) || amount <= 0) {
      throwValidationError('转账金额无效');
      blockField = 'amount';
    }
    if (!payee_account?.account_no) {
      throwValidationError('收款账户号不能为空');
      blockField = 'payee_account_no';
    }
    if (!payee_account?.account_name) {
      throwValidationError('收款账户户名不能为空');
      blockField = 'payee_account_name';
    }

    const payerAccount = await this.accountRepository.findByAccountNo(payer_account_no);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    const payerCustomer = payerAccount.customer_id
      ? await this.customerRepository.findById(payerAccount.customer_id)
      : null;

    const payerAccountStatus = payerAccount.status;
    const payerAccountStatusText = accountStatusMap[payerAccountStatus] || '未知';
    let payerAccountValid = true;
    let payerNotFrozen = true;

    if (payerAccountStatus === 0) {
      blocked = true;
      blockReason = '转出账户已注销';
      blockField = 'payer_account_no';
      payerAccountValid = false;
    } else if (payerAccountStatus === 2) {
      blocked = true;
      blockReason = '转出账户已冻结';
      blockField = 'payer_account_no';
      payerNotFrozen = false;
    } else if (payerAccountStatus === 3) {
      blocked = true;
      blockReason = '转出账户已挂失';
      blockField = 'payer_account_no';
      payerAccountValid = false;
    } else if (payerAccountStatus === 4) {
      warnings.push('转出账户处于休眠状态，办理转账后将自动激活');
    }

    const frozenAmount = Number(payerAccount.frozen_amount || 0);
    if (frozenAmount > 0) {
      payerNotFrozen = false;
      if (!blocked) {
        warnings.push(`转出账户存在${this.formatMoneyWithComma(frozenAmount)}元冻结金额`);
      }
    }

    const availableBalance = Number(payerAccount.available_balance || 0);
    const feeCalc = this.calculateFee(amount, transfer_type, transfer_mode);
    const totalDeduct = amount + feeCalc.fee;
    const balanceSufficient = availableBalance >= totalDeduct;

    if (!balanceSufficient && !blocked) {
      blocked = true;
      blockReason = `转出账户可用余额不足，可用余额${this.formatMoneyWithComma(availableBalance)}元，需扣除${this.formatMoneyWithComma(totalDeduct)}元（含手续费）`;
      blockField = 'amount';
    }

    let payeeInfoValid = true;
    let payeeNameMatched = true;

    if (transfer_type === 1 || transfer_type === 4) {
      const payeeAccount = await this.accountRepository.findByAccountNo(payee_account.account_no);
      if (payeeAccount) {
        const payeeCustomer = payeeAccount.customer_id
          ? await this.customerRepository.findById(payeeAccount.customer_id)
          : null;
        const expectedName = payeeCustomer?.customer_name;
        if (expectedName && payee_account.account_name !== expectedName) {
          payeeNameMatched = false;
          if (!blocked) {
            warnings.push(`收款账户户名与系统记录不一致，系统记录户名：${expectedName}`);
          }
        }
      }
    }

    const accountLimitConfig = TRANSFER_LIMIT_CONFIG[payerAccount.account_type] || TRANSFER_LIMIT_CONFIG[1];
    const singleLimit = accountLimitConfig.single_limit;
    const dailyLimit = accountLimitConfig.daily_limit;
    const monthlyLimit = accountLimitConfig.monthly_limit;

    const today = new Date();
    const dailyUsedAmount = await this.settlementRepository.getDailySettlementAmount(payer_account_no, today);
    const monthlyUsedAmount = await this.settlementRepository.getMonthlySettlementAmount(payer_account_no, today);
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsedAmount);
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsedAmount);

    const withinSingleLimit = amount <= singleLimit;
    const withinDailyLimit = dailyUsedAmount + amount <= dailyLimit;
    const withinMonthlyLimit = monthlyUsedAmount + amount <= monthlyLimit;
    let limitError = '';
    let amountValid = true;

    if (!withinSingleLimit) {
      amountValid = false;
      limitError = `单笔转账金额超限，单笔限额${this.formatMoneyWithComma(singleLimit)}元`;
      if (!blocked) {
        blocked = true;
        blockReason = limitError;
        blockField = 'amount';
      }
    } else if (!withinDailyLimit) {
      amountValid = false;
      limitError = `单日累计转账金额超限，单日限额${this.formatMoneyWithComma(dailyLimit)}元，已使用${this.formatMoneyWithComma(dailyUsedAmount)}元，剩余可转${this.formatMoneyWithComma(dailyRemaining)}元`;
      if (!blocked) {
        blocked = true;
        blockReason = limitError;
        blockField = 'amount';
      }
    } else if (!withinMonthlyLimit) {
      amountValid = false;
      limitError = `单月累计转账金额超限，单月限额${this.formatMoneyWithComma(monthlyLimit)}元，已使用${this.formatMoneyWithComma(monthlyUsedAmount)}元，剩余可转${this.formatMoneyWithComma(monthlyRemaining)}元`;
      if (!blocked) {
        blocked = true;
        blockReason = limitError;
        blockField = 'amount';
      }
    }

    const limitCheck: LimitCheckResult = {
      single_limit: singleLimit,
      daily_limit: dailyLimit,
      monthly_limit: monthlyLimit,
      daily_used_amount: dailyUsedAmount,
      monthly_used_amount: monthlyUsedAmount,
      daily_remaining: dailyRemaining,
      monthly_remaining: monthlyRemaining,
      within_single_limit: withinSingleLimit,
      within_daily_limit: withinDailyLimit,
      within_monthly_limit: withinMonthlyLimit,
      limit_error: limitError || undefined
    };

    const payerType = this.determinePayerAccountType({ ...payerAccount.toJSON(), customer: payerCustomer?.toJSON() });
    const payeeType = payee_account.account_type || (transfer_type === 3 ? 'P' : transfer_type === 4 ? 'I' : undefined);
    const isPublicToPrivate = payerType === 'P' && payeeType === 'I';
    const isPrivateToPublic = payerType === 'I' && payeeType === 'P';
    const isSameType = payerType === payeeType;

    let ppAllowed = true;
    let ppRuleError = '';
    let ppPurposeRequired = false;
    let ppPurposeValid = true;
    let ppDailyLimit: number | undefined;
    let ppDailyUsed: number | undefined;
    let ppDailyRemaining: number | undefined;

    if (isPublicToPrivate) {
      ppAllowed = PUBLIC_PRIVATE_RULES.ALLOW_PUBLIC_TO_PRIVATE;
      ppPurposeRequired = true;
      ppDailyLimit = PUBLIC_PRIVATE_RULES.PUBLIC_TO_PRIVATE_DAILY_LIMIT;
      ppDailyUsed = await this.settlementRepository.getPublicPrivateDailyAmount(payer_account_no, 'P', 'I', today);
      ppDailyRemaining = Math.max(0, (ppDailyLimit || 0) - (ppDailyUsed || 0));

      if (!ppAllowed && !blocked) {
        blocked = true;
        blockReason = '系统当前不允许公户转私户';
        blockField = 'transfer_type';
      }

      if (ppPurposeRequired) {
        if (!purpose) {
          ppPurposeValid = false;
          ppRuleError = '公户转私户必须填写转账用途';
          if (!blocked) {
            blocked = true;
            blockReason = ppRuleError;
            blockField = 'purpose';
          }
        } else if (!PUBLIC_PRIVATE_RULES.REQUIRED_PURPOSE_FOR_PUBLIC_TO_PRIVATE.includes(purpose)) {
          ppPurposeValid = false;
          ppRuleError = `公户转私户用途必须为以下之一：${PUBLIC_PRIVATE_RULES.REQUIRED_PURPOSE_FOR_PUBLIC_TO_PRIVATE.join('、')}`;
          if (!blocked) {
            warnings.push(ppRuleError);
          }
        }
      }

      if ((ppDailyUsed || 0) + amount > (ppDailyLimit || 0) && !blocked) {
        blocked = true;
        blockReason = `公户转私户单日限额${this.formatMoneyWithComma(ppDailyLimit || 0)}元，已使用${this.formatMoneyWithComma(ppDailyUsed || 0)}元，剩余可转${this.formatMoneyWithComma(ppDailyRemaining || 0)}元`;
        blockField = 'amount';
      }
    } else if (isPrivateToPublic) {
      ppAllowed = PUBLIC_PRIVATE_RULES.ALLOW_PRIVATE_TO_PUBLIC;
      ppPurposeRequired = true;
      ppDailyLimit = PUBLIC_PRIVATE_RULES.PRIVATE_TO_PUBLIC_DAILY_LIMIT;
      ppDailyUsed = await this.settlementRepository.getPublicPrivateDailyAmount(payer_account_no, 'I', 'P', today);
      ppDailyRemaining = Math.max(0, (ppDailyLimit || 0) - (ppDailyUsed || 0));

      if (!ppAllowed && !blocked) {
        blocked = true;
        blockReason = '系统当前不允许私户转公户';
        blockField = 'transfer_type';
      }

      if (ppPurposeRequired && !purpose) {
        ppPurposeValid = false;
        ppRuleError = '私户转公户建议填写转账用途';
        warnings.push(ppRuleError);
      }
    }

    const publicPrivateCheck: PublicPrivateCheckResult = {
      payer_type: payerType,
      payee_type: payeeType,
      is_public_to_private: isPublicToPrivate,
      is_private_to_public: isPrivateToPublic,
      is_same_type: isSameType,
      allowed: ppAllowed,
      rule_error: ppRuleError || undefined,
      purpose_required: ppPurposeRequired,
      purpose_valid: ppPurposeValid,
      daily_limit: ppDailyLimit,
      daily_used: ppDailyUsed,
      daily_remaining: ppDailyRemaining
    };

    const arrivalTime = this.getArrivalTime(transfer_type, transfer_mode);
    const reviewInfo = this.determineReviewLevel(amount);
    const needReview = reviewInfo.needReview;
    const reviewReason = reviewInfo.reason;
    const suggestedAuditLevel = reviewInfo.level;

    if (needReview && !blocked) {
      warnings.push(reviewReason);
    }

    if (payerCustomer?.risk_level && payerCustomer.risk_level >= 4 && !blocked) {
      warnings.push(`转出客户风险等级为【${riskLevelMap[payerCustomer.risk_level]}】，建议加强审核`);
    }

    const sameNameWindowStart = dayjs().subtract(RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS, 'hour').toDate();
    const sameNameTransfers = await this.settlementRepository.countSameNameTransfers(
      payer_account_no,
      payee_account.account_name,
      sameNameWindowStart,
      new Date()
    );
    if (sameNameTransfers.length >= RISK_DETECTION_RULES.SAME_NAME_TRANSFER_COUNT_THRESHOLD) {
      warnings.push(`检测到${RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS}小时内向【${payee_account.account_name}】转账${sameNameTransfers.length}次，存在同名频繁转账风险`);
    }

    const currentHour = dayjs().hour();
    const isNightTime = currentHour >= RISK_DETECTION_RULES.NIGHT_TRANSACTION_START_HOUR || currentHour < RISK_DETECTION_RULES.NIGHT_TRANSACTION_END_HOUR;
    if (isNightTime && amount >= RISK_DETECTION_RULES.NIGHT_TRANSACTION_AMOUNT_THRESHOLD) {
      warnings.push(`夜间大额转账（${this.formatMoneyWithComma(amount)}元），建议复核`);
    }

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      block_field: blockField || undefined,
      warnings,
      payer_account_valid: payerAccountValid,
      payer_account_status: payerAccountStatus,
      payer_account_status_text: payerAccountStatusText,
      payer_not_frozen: payerNotFrozen,
      payer_available_balance: availableBalance,
      balance_sufficient: balanceSufficient,
      payee_info_valid: payeeInfoValid,
      payee_name_matched: payeeNameMatched,
      amount_valid: amountValid,
      limit_check: limitCheck,
      public_private_check: publicPrivateCheck,
      fee_calc: feeCalc,
      arrival_time: arrivalTime,
      need_review: needReview,
      review_reason: reviewReason || undefined,
      suggested_audit_level: suggestedAuditLevel
    };
  }

  async getSettlementList(
    params: SettlementQueryParams,
    currentUserId?: string,
    userOrgId?: string
  ): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.settlementRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.settlementRepository.getOrganizationInclude(),
      this.settlementRepository.getOperatorInclude(),
      this.settlementRepository.getReviewerInclude(),
      this.settlementRepository.getPayerAccountInclude(),
      this.settlementRepository.getPayerCustomerInclude()
    ];

    const result = await this.settlementRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: SettlementVO[] = result.list.map(s => this.convertSettlementToVO(s));

    return { ...result, list };
  }

  private convertSettlementToVO(s: any): SettlementVO {
    const data = s.toJSON ? s.toJSON() : s;
    const vo: SettlementVO = { ...data };

    if (data.organization) {
      vo.org_name = data.organization.name;
    }
    if (data.operator) {
      vo.operator_name = data.operator.real_name || data.operator.username;
    }
    if (data.reviewer) {
      vo.reviewer_name = data.reviewer.real_name || data.reviewer.username;
    }
    if (data.payer_customer) {
      vo.payer_customer_name = data.payer_customer.customer_name;
    }

    vo.transfer_type_text = TransferTypeText[data.transfer_type] || '未知';
    vo.transfer_mode_text = TransferModeText[data.transfer_mode] || '未知';
    vo.status_text = SettlementStatusText[data.status] || '未知';
    vo.audit_status_text = auditStatusMap[data.audit_status] || '未知';
    vo.risk_level_text = riskLevelMap[data.risk_level] || undefined;
    vo.amount_formatted = this.formatMoneyWithComma(Number(data.amount || 0));
    vo.fee_formatted = this.formatMoneyWithComma(Number(data.fee || 0));
    vo.is_risk_warning = (data.risk_level || 0) >= 3;

    return vo;
  }

  async getSettlementById(id: string): Promise<SettlementVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的结算ID');
    }

    const settlement = await this.settlementRepository.findById(id, {
      include: [
        this.settlementRepository.getOrganizationInclude(),
        this.settlementRepository.getOperatorInclude(),
        this.settlementRepository.getReviewerInclude(),
        this.settlementRepository.getPayerAccountInclude(),
        this.settlementRepository.getPayerCustomerInclude()
      ]
    });

    if (!settlement) {
      throwNotFoundError('结算记录不存在');
    }

    return this.convertSettlementToVO(settlement);
  }

  async createSettlement(
    request: CreateSettlementRequest,
    operatorId: string,
    orgId?: string
  ): Promise<SettlementVO> {
    const {
      transfer_type,
      transfer_mode,
      channel_code,
      payer_account_no,
      payee_account_no,
      payee_account_name,
      payee_bank_code,
      payee_bank_name,
      payee_account_type,
      payee_location,
      amount,
      currency,
      purpose,
      remark,
      request_id
    } = request;

    if (request_id) {
      const existed = await this.settlementRepository.findByRequestId(request_id);
      if (existed) {
        throwBusinessError(`重复提交请求：requestId=${request_id}，结算流水号：${existed.settlement_no}`);
      }
    }

    const preCheckResult = await this.preCheckSettlement({
      payer_account_no,
      transfer_type: transfer_type as TransferType,
      transfer_mode: transfer_mode as TransferMode,
      payee_account: {
        account_no: payee_account_no,
        account_name: payee_account_name,
        account_type: payee_account_type,
        bank_code: payee_bank_code,
        bank_name: payee_bank_name,
        location: payee_location
      },
      amount,
      purpose
    }, operatorId);

    if (preCheckResult.blocked) {
      throwBusinessError(preCheckResult.block_reason || '前置校验未通过');
    }

    const payerAccount = await this.accountRepository.findByAccountNo(payer_account_no);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    const payerCustomer = payerAccount.customer_id
      ? await this.customerRepository.findById(payerAccount.customer_id)
      : null;

    const feeCalc = preCheckResult.fee_calc;
    const arrivalTime = preCheckResult.arrival_time;
    const needReview = preCheckResult.need_review;
    const suggestedAuditLevel = preCheckResult.suggested_audit_level;

    const targetOrgId = orgId;
    if (targetOrgId && !isValidId(targetOrgId)) {
      throwValidationError('无效的机构ID');
    }

    const settlementNo = await this.settlementRepository.generateSettlementNo();
    const transactionNo = await this.transactionRepository.generateTransactionNo();
    const payerType = preCheckResult.public_private_check.payer_type;
    const totalDeduct = amount + feeCalc.fee;

    let settlement: any;
    let transaction: any;

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(payerAccount.balance || 0);
      const originalAvailable = Number(payerAccount.available_balance || 0);
      const newBalance = originalBalance - totalDeduct;
      const newAvailable = originalAvailable - totalDeduct;

      settlement = await this.settlementRepository.create({
        settlement_no: settlementNo,
        transfer_type,
        transfer_mode,
        channel_code,
        payer_account_id: payerAccount.id,
        payer_account_no,
        payer_account_name: payerCustomer?.customer_name || payer_account_no,
        payer_customer_id: payerCustomer?.id,
        payer_account_type: payerType,
        payee_account_no,
        payee_account_name,
        payee_bank_code,
        payee_bank_name,
        payee_account_type,
        payee_location,
        amount,
        currency: currency || 'CNY',
        fee: feeCalc.fee,
        fee_calc_desc: feeCalc.fee_calc_desc,
        arrival_time: arrivalTime,
        purpose,
        remark,
        org_id: targetOrgId,
        operator_id: operatorId,
        status: needReview ? 1 : 2,
        audit_status: needReview ? (suggestedAuditLevel || 1) as AuditStatus : 10,
        need_review: needReview,
        review_reason: needReview ? preCheckResult.review_reason : undefined,
        original_balance: originalBalance,
        new_balance: newBalance,
        request_id,
        submit_time: needReview ? undefined : new Date(),
        settle_time: needReview ? undefined : new Date()
      }, { transaction: t });

      transaction = await this.transactionRepository.create({
        transaction_no: transactionNo,
        type: 3,
        business_line: payerType === 'P' ? 'corporate' : 'retail',
        amount,
        currency: currency || 'CNY',
        customer_id: payerCustomer?.id,
        customer_no: payerCustomer?.customer_no,
        payer_account: payer_account_no,
        payer_name: payerCustomer?.customer_name || payer_account_no,
        payee_account: payee_account_no,
        payee_name: payee_account_name,
        payee_bank_code,
        org_id: targetOrgId,
        operator_id: operatorId,
        channel_code,
        status: needReview ? 0 : 2,
        audit_status: needReview ? 0 : 10,
        transaction_time: new Date(),
        fee: feeCalc.fee,
        request_id
      }, { transaction: t });

      if (!needReview) {
        await this.accountRepository.update(payerAccount.id, {
          balance: newBalance,
          available_balance: newAvailable
        }, { transaction: t });
      }

      if (needReview) {
        await this.auditRecordRepository.create({
          biz_type: 'settlement',
          biz_id: (settlement as any).id,
          biz_no: settlementNo,
          type: amount >= REVIEW_RULE_CONFIG.MULTI_LEVEL_REVIEW_THRESHOLD ? 2 : 1,
          level: suggestedAuditLevel || 1,
          status: 0,
          submitter_id: operatorId,
          submitter_org_id: targetOrgId,
          submit_time: new Date(),
          current_node: suggestedAuditLevel === 3 ? 'AUDIT_LEVEL_3' : suggestedAuditLevel === 2 ? 'AUDIT_LEVEL_2' : 'AUDIT_LEVEL_1'
        }, { transaction: t });
      }
    });

    try {
      if (transaction && transaction.id) {
        await this.riskControlService.evaluateTransactionRisk(transaction.id);
      }
    } catch (e) {
    }

    return this.getSettlementById((settlement as any).id);
  }

  async cancelSettlement(
    id: string,
    operatorId: string,
    cancelReason: string
  ): Promise<SettlementVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的结算ID');
    }
    if (!cancelReason) {
      throwValidationError('撤销原因不能为空');
    }

    const settlement = await this.settlementRepository.findById(id);
    if (!settlement) {
      throwNotFoundError('结算记录不存在');
    }

    if (![0, 1].includes(settlement.status)) {
      throwBusinessError('仅待提交或待复核状态的转账可撤销');
    }

    const payerAccount = await this.accountRepository.findById(settlement.payer_account_id);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const totalDeduct = Number(settlement.amount || 0) + Number(settlement.fee || 0);

      if (settlement.status === 2 || settlement.audit_status === 10) {
        const originalBalance = Number(payerAccount.balance || 0);
        const originalAvailable = Number(payerAccount.available_balance || 0);
        await this.accountRepository.update(payerAccount.id, {
          balance: originalBalance + totalDeduct,
          available_balance: originalAvailable + totalDeduct
        }, { transaction: t });
      }

      await this.settlementRepository.update(id, {
        status: 4,
        cancel_reason: cancelReason,
        reviewer_id: operatorId,
        review_time: new Date()
      }, { transaction: t });

      const relatedTx = await this.transactionRepository.findOne({
        where: { request_id: settlement.request_id }
      });
      if (relatedTx) {
        await this.transactionRepository.update(relatedTx.id, {
          status: 5
        }, { transaction: t });
      }

      const auditRecord = await this.auditRecordRepository.findOne({
        where: { biz_id: id, biz_type: 'settlement' }
      });
      if (auditRecord) {
        await this.auditRecordRepository.update(auditRecord.id, {
          status: 3,
          remark: cancelReason
        }, { transaction: t });
      }
    });

    return this.getSettlementById(id);
  }

  async reviewSettlement(
    request: ReviewSettlementRequest,
    operatorId: string
  ): Promise<SettlementVO> {
    const { settlement_no, approved, audit_level, review_reason } = request;

    if (!settlement_no) {
      throwValidationError('结算流水号不能为空');
    }
    if (typeof approved !== 'boolean') {
      throwValidationError('审核结果不能为空');
    }

    const settlement = await this.settlementRepository.findBySettlementNo(settlement_no);
    if (!settlement) {
      throwNotFoundError('结算记录不存在');
    }

    if (settlement.status !== 1) {
      throwBusinessError('仅待复核状态的转账可复核');
    }

    const payerAccount = await this.accountRepository.findById(settlement.payer_account_id);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      if (approved) {
        const requiredLevel = audit_level || 1;
        const nextLevel = requiredLevel - 1;

        if (nextLevel > 0) {
          await this.settlementRepository.update(settlement.id, {
            audit_status: nextLevel as AuditStatus
          }, { transaction: t });

          const auditRecord = await this.auditRecordRepository.findOne({
            where: { biz_id: settlement.id, biz_type: 'settlement' }
          });
          if (auditRecord) {
            await this.auditRecordRepository.update(auditRecord.id, {
              status: nextLevel,
              current_node: nextLevel === 2 ? 'AUDIT_LEVEL_2' : 'AUDIT_LEVEL_1'
            }, { transaction: t });
          }
        } else {
          const totalDeduct = Number(settlement.amount || 0) + Number(settlement.fee || 0);
          const originalBalance = Number(payerAccount.balance || 0);
          const originalAvailable = Number(payerAccount.available_balance || 0);
          const newBalance = originalBalance - totalDeduct;
          const newAvailable = originalAvailable - totalDeduct;

          await this.accountRepository.update(payerAccount.id, {
            balance: newBalance,
            available_balance: newAvailable
          }, { transaction: t });

          await this.settlementRepository.update(settlement.id, {
            status: 2,
            audit_status: 10,
            reviewer_id: operatorId,
            review_time: new Date(),
            submit_time: new Date(),
            settle_time: new Date(),
            original_balance: originalBalance,
            new_balance: newBalance
          }, { transaction: t });

          const relatedTx = await this.transactionRepository.findOne({
            where: { request_id: settlement.request_id }
          });
          if (relatedTx) {
            await this.transactionRepository.update(relatedTx.id, {
              status: 2,
              audit_status: 10
            }, { transaction: t });
          }

          const auditRecord = await this.auditRecordRepository.findOne({
            where: { biz_id: settlement.id, biz_type: 'settlement' }
          });
          if (auditRecord) {
            await this.auditRecordRepository.update(auditRecord.id, {
              status: 1,
              result: 1,
              auditor_id: operatorId
            }, { transaction: t });
          }
        }
      } else {
        await this.settlementRepository.update(settlement.id, {
          status: 4,
          audit_status: 11,
          reviewer_id: operatorId,
          review_time: new Date(),
          cancel_reason: review_reason || '审核拒绝'
        }, { transaction: t });

        const relatedTx = await this.transactionRepository.findOne({
          where: { request_id: settlement.request_id }
        });
        if (relatedTx) {
          await this.transactionRepository.update(relatedTx.id, {
            status: 5,
            audit_status: 11
          }, { transaction: t });
        }

        const auditRecord = await this.auditRecordRepository.findOne({
          where: { biz_id: settlement.id, biz_type: 'settlement' }
        });
        if (auditRecord) {
          await this.auditRecordRepository.update(auditRecord.id, {
            status: 2,
            result: 2,
            auditor_id: operatorId,
            remark: review_reason
          }, { transaction: t });
        }
      }
    });

    return this.getSettlementById(settlement.id);
  }

  async batchCreateSettlement(
    request: CreateBatchSettlementRequest,
    operatorId: string,
    userRoles: string[] = []
  ): Promise<BatchSettlementResult> {
    const { batch_name, batch_type, payer_account_no, channel_code, items, remark } = request;
    const isManager = userRoles.includes('admin') || userRoles.includes('manager');

    if (!batch_name) {
      throwValidationError('批次名称不能为空');
    }
    if (![1, 2, 3, 4].includes(batch_type)) {
      throwValidationError('无效的批量类型');
    }
    if (!payer_account_no) {
      throwValidationError('转出账户号不能为空');
    }
    if (!items || items.length === 0) {
      throwValidationError('批量转账明细不能为空');
    }

    const payerAccount = await this.accountRepository.findByAccountNo(payer_account_no);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    const payerCustomer = payerAccount.customer_id
      ? await this.customerRepository.findById(payerAccount.customer_id)
      : null;

    const batchNo = await this.settlementBatchRepository.generateBatchNo();
    const totalCount = items.length;
    let totalAmount = 0;
    let totalFee = 0;
    let successCount = 0;
    let failCount = 0;
    let pendingCount = 0;
    const details: BatchSettlementResultItem[] = [];

    let needBatchReview = false;
    let batchReviewReason = '';

    const payerType = this.determinePayerAccountType({
      ...payerAccount.toJSON(),
      customer: payerCustomer?.toJSON()
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const index = i + 1;

      try {
        if (item.amount > REVIEW_RULE_CONFIG.BATCH_LARGE_AMOUNT_THRESHOLD && !isManager) {
          failCount++;
          details.push({
            index,
            success: false,
            error: `单笔金额超过${this.formatMoneyWithComma(REVIEW_RULE_CONFIG.BATCH_LARGE_AMOUNT_THRESHOLD)}元，需管理员处理`
          });
          continue;
        }

        const transferType = this.inferTransferType(batch_type as BatchType, payerType, item.payee_account_type);
        const transferMode: TransferMode = 1;

        const preCheckResult = await this.preCheckSettlement({
          payer_account_no,
          transfer_type: transferType,
          transfer_mode: transferMode,
          payee_account: {
            account_no: item.payee_account_no,
            account_name: item.payee_account_name,
            account_type: item.payee_account_type,
            bank_code: item.payee_bank_code,
            bank_name: item.payee_bank_name,
            location: item.payee_location
          },
          amount: item.amount,
          purpose: item.purpose
        }, operatorId);

        if (preCheckResult.blocked) {
          failCount++;
          details.push({
            index,
            success: false,
            error: preCheckResult.block_reason || '前置校验未通过',
            pre_check_result: preCheckResult
          });
          continue;
        }

        const itemNeedReview = preCheckResult.need_review ||
          (!isManager && item.amount > REVIEW_RULE_CONFIG.BATCH_SMALL_AMOUNT_THRESHOLD);

        if (itemNeedReview) {
          needBatchReview = true;
          batchReviewReason = `包含${itemNeedReview ? '需复核' : '大额'}转账明细`;
        }

        const isAutoReview = !itemNeedReview || (item.amount <= REVIEW_RULE_CONFIG.BATCH_SMALL_AMOUNT_THRESHOLD && isManager);

        const feeCalc = preCheckResult.fee_calc;
        totalAmount += item.amount;
        totalFee += feeCalc.fee;

        if (isAutoReview) {
          pendingCount++;
          details.push({
            index,
            success: true,
            need_review: false,
            pre_check_result: preCheckResult,
            fee: feeCalc.fee
          });
        } else {
          pendingCount++;
          details.push({
            index,
            success: true,
            need_review: true,
            pre_check_result: preCheckResult,
            fee: feeCalc.fee,
            warning: '该笔明细需复核后执行'
          });
        }
      } catch (err: any) {
        failCount++;
        details.push({
          index,
          success: false,
          error: err?.message || '处理失败'
        });
      }
    }

    successCount = details.filter(d => d.success && !d.need_review).length;
    pendingCount = details.filter(d => d.success && d.need_review).length;
    failCount = details.filter(d => !d.success).length;

    const targetOrgId = payerAccount.open_org_id;

    let batch: any;
    await sequelize.transaction(async (t: SequelizeTransaction) => {
      batch = await this.settlementBatchRepository.create({
        batch_no: batchNo,
        batch_name,
        batch_type,
        payer_account_id: payerAccount.id,
        payer_account_no,
        payer_account_name: payerCustomer?.customer_name || payer_account_no,
        total_count: totalCount,
        total_amount: Number(totalAmount.toFixed(2)),
        total_fee: Number(totalFee.toFixed(2)),
        success_count: successCount,
        fail_count: failCount,
        pending_count: pendingCount,
        processing_count: 0,
        status: needBatchReview ? 1 : 2,
        audit_status: needBatchReview ? 0 : 10,
        need_review: needBatchReview,
        review_reason: needBatchReview ? batchReviewReason : undefined,
        org_id: targetOrgId,
        operator_id: operatorId,
        remark,
        submit_time: needBatchReview ? undefined : new Date()
      }, { transaction: t });

      const settlementPromises = details
        .filter(d => d.success)
        .map(async (d, idx) => {
          const item = items[d.index - 1];
          const preCheck = d.pre_check_result;
          const transferType = this.inferTransferType(batch_type as BatchType, payerType, item.payee_account_type);
          const feeCalc = preCheck?.fee_calc || this.calculateFee(item.amount, transferType, 1);

          const settlementNo = await this.settlementRepository.generateSettlementNo();
          const transactionNo = await this.transactionRepository.generateTransactionNo();
          const itemNeedReview = d.need_review;
          const totalDeduct = item.amount + feeCalc.fee;

          const settlementData: any = {
            settlement_no: settlementNo,
            batch_id: (batch as any).id,
            transfer_type: transferType,
            transfer_mode: 1,
            channel_code,
            payer_account_id: payerAccount.id,
            payer_account_no,
            payer_account_name: payerCustomer?.customer_name || payer_account_no,
            payer_customer_id: payerCustomer?.id,
            payer_account_type: payerType,
            payee_account_no: item.payee_account_no,
            payee_account_name: item.payee_account_name,
            payee_bank_code: item.payee_bank_code,
            payee_bank_name: item.payee_bank_name,
            payee_account_type: item.payee_account_type,
            payee_location: item.payee_location,
            amount: item.amount,
            currency: 'CNY',
            fee: feeCalc.fee,
            fee_calc_desc: feeCalc.fee_calc_desc,
            arrival_time: this.getArrivalTime(transferType, 1),
            purpose: item.purpose,
            remark: item.remark,
            org_id: targetOrgId,
            operator_id: operatorId,
            status: itemNeedReview ? 1 : 2,
            audit_status: itemNeedReview ? (preCheck?.suggested_audit_level || 1) as AuditStatus : 10,
            need_review: !!itemNeedReview,
            review_reason: itemNeedReview ? preCheck?.review_reason : undefined,
            request_id: `${batchNo}_${idx}`,
            submit_time: itemNeedReview ? undefined : new Date(),
            settle_time: itemNeedReview ? undefined : new Date()
          };

          if (!itemNeedReview) {
            settlementData.original_balance = Number(payerAccount.balance || 0);
            settlementData.new_balance = Number(payerAccount.balance || 0) - totalDeduct;
          }

          const createdSettlement = await this.settlementRepository.create(settlementData, { transaction: t });
          d.settlement_id = (createdSettlement as any).id;
          d.settlement_no = settlementNo;

          await this.transactionRepository.create({
            transaction_no: transactionNo,
            type: 3,
            business_line: payerType === 'P' ? 'corporate' : 'retail',
            amount: item.amount,
            currency: 'CNY',
            customer_id: payerCustomer?.id,
            customer_no: payerCustomer?.customer_no,
            payer_account: payer_account_no,
            payer_name: payerCustomer?.customer_name || payer_account_no,
            payee_account: item.payee_account_no,
            payee_name: item.payee_account_name,
            payee_bank_code: item.payee_bank_code,
            org_id: targetOrgId,
            operator_id: operatorId,
            channel_code,
            status: itemNeedReview ? 0 : 2,
            audit_status: itemNeedReview ? 0 : 10,
            transaction_time: new Date(),
            fee: feeCalc.fee,
            request_id: `${batchNo}_${idx}`
          }, { transaction: t });
        });

      await Promise.all(settlementPromises);

      if (!needBatchReview && successCount > 0) {
        const totalDeductAll = totalAmount + totalFee;
        const originalBalance = Number(payerAccount.balance || 0);
        const originalAvailable = Number(payerAccount.available_balance || 0);
        await this.accountRepository.update(payerAccount.id, {
          balance: originalBalance - totalDeductAll,
          available_balance: originalAvailable - totalDeductAll
        }, { transaction: t });

        await this.settlementBatchRepository.update((batch as any).id, {
          complete_time: new Date()
        }, { transaction: t });
      }
    });

    return {
      batch_id: (batch as any).id,
      batch_no: batchNo,
      total_count: totalCount,
      total_amount: Number(totalAmount.toFixed(2)),
      total_fee: Number(totalFee.toFixed(2)),
      success_count: successCount,
      fail_count: failCount,
      pending_count: pendingCount,
      details
    };
  }

  private inferTransferType(batchType: BatchType, payerType: string, payeeType?: string): TransferType {
    if (batchType === 1) return 3;
    if (batchType === 2) return 4;
    if (batchType === 3) return 4;
    if (payerType === 'P' && payeeType === 'P') return 3;
    if (payerType === 'I' && payeeType === 'I') return 1;
    return 2;
  }

  async getBatchList(
    params: BatchQueryParams,
    currentUserId?: string,
    userOrgId?: string
  ): Promise<any> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.settlementBatchRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.settlementBatchRepository.getOrganizationInclude(),
      this.settlementBatchRepository.getOperatorInclude(),
      this.settlementBatchRepository.getReviewerInclude(),
      this.settlementBatchRepository.getPayerAccountInclude()
    ];

    const result = await this.settlementBatchRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: BatchSettlementVO[] = result.list.map(b => this.convertBatchToVO(b));

    return { ...result, list };
  }

  private convertBatchToVO(b: any): BatchSettlementVO {
    const data = b.toJSON ? b.toJSON() : b;
    const vo: BatchSettlementVO = { ...data };

    if (data.organization) {
      vo.org_name = data.organization.name;
    }
    if (data.operator) {
      vo.operator_name = data.operator.real_name || data.operator.username;
    }
    if (data.reviewer) {
      vo.reviewer_name = data.reviewer.real_name || data.reviewer.username;
    }

    vo.batch_type_text = BatchTypeText[data.batch_type] || '未知';
    vo.status_text = batchStatusMap[data.status] || '未知';
    vo.audit_status_text = auditStatusMap[data.audit_status] || '未知';
    vo.total_amount_formatted = this.formatMoneyWithComma(Number(data.total_amount || 0));
    vo.total_fee_formatted = this.formatMoneyWithComma(Number(data.total_fee || 0));
    vo.progress_percent = data.total_count > 0
      ? Number(((data.success_count + data.fail_count) / data.total_count * 100).toFixed(2))
      : 0;

    return vo;
  }

  async getBatchById(id: string): Promise<BatchSettlementVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的批量ID');
    }

    const batch = await this.settlementBatchRepository.findById(id, {
      include: [
        this.settlementBatchRepository.getOrganizationInclude(),
        this.settlementBatchRepository.getOperatorInclude(),
        this.settlementBatchRepository.getReviewerInclude(),
        this.settlementBatchRepository.getPayerAccountInclude()
      ]
    });

    if (!batch) {
      throwNotFoundError('批量转账记录不存在');
    }

    return this.convertBatchToVO(batch);
  }

  async reviewBatch(
    request: SettlementBatchReviewRequest,
    operatorId: string
  ): Promise<BatchSettlementVO> {
    const { batch_id, approved, review_reason } = request;

    if (!batch_id) {
      throwValidationError('批量ID不能为空');
    }
    if (typeof approved !== 'boolean') {
      throwValidationError('审核结果不能为空');
    }

    const batch = await this.settlementBatchRepository.findById(batch_id);
    if (!batch) {
      throwNotFoundError('批量转账记录不存在');
    }

    if (batch.status !== 1) {
      throwBusinessError('仅待复核状态的批量转账可复核');
    }

    const batchSettlements = await this.settlementRepository.findByBatchId(batch_id);
    const payerAccount = await this.accountRepository.findById(batch.payer_account_id);
    if (!payerAccount) {
      throwNotFoundError('转出账户不存在');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      if (approved) {
        let totalDeduct = 0;
        let approvedPendingCount = 0;

        for (const s of batchSettlements) {
          if (s.status === 1) {
            totalDeduct += Number(s.amount || 0) + Number(s.fee || 0);
            approvedPendingCount++;
          }
        }

        if (totalDeduct > 0) {
          const originalBalance = Number(payerAccount.balance || 0);
          const originalAvailable = Number(payerAccount.available_balance || 0);
          await this.accountRepository.update(payerAccount.id, {
            balance: originalBalance - totalDeduct,
            available_balance: originalAvailable - totalDeduct
          }, { transaction: t });
        }

        for (const s of batchSettlements) {
          if (s.status === 1) {
            const originalBalance = Number(payerAccount.balance || 0);
            const totalItemDeduct = Number(s.amount || 0) + Number(s.fee || 0);
            await this.settlementRepository.update(s.id, {
              status: 2,
              audit_status: 10,
              reviewer_id: operatorId,
              review_time: new Date(),
              submit_time: new Date(),
              settle_time: new Date(),
              original_balance: originalBalance,
              new_balance: originalBalance - totalItemDeduct
            }, { transaction: t });

            const relatedTx = await this.transactionRepository.findOne({
              where: { request_id: s.request_id }
            });
            if (relatedTx) {
              await this.transactionRepository.update(relatedTx.id, {
                status: 2,
                audit_status: 10
              }, { transaction: t });
            }
          }
        }

        const newSuccessCount = Number(batch.success_count) + approvedPendingCount;
        const newPendingCount = Number(batch.pending_count) - approvedPendingCount;

        await this.settlementBatchRepository.update(batch_id, {
          status: newPendingCount > 0 ? 3 : 4,
          audit_status: 10,
          reviewer_id: operatorId,
          review_reason,
          success_count: newSuccessCount,
          pending_count: newPendingCount,
          submit_time: new Date(),
          complete_time: newPendingCount > 0 ? undefined : new Date()
        }, { transaction: t });
      } else {
        for (const s of batchSettlements) {
          if (s.status === 1) {
            await this.settlementRepository.update(s.id, {
              status: 4,
              audit_status: 11,
              reviewer_id: operatorId,
              review_time: new Date(),
              cancel_reason: review_reason || '批量审核拒绝'
            }, { transaction: t });

            const relatedTx = await this.transactionRepository.findOne({
              where: { request_id: s.request_id }
            });
            if (relatedTx) {
              await this.transactionRepository.update(relatedTx.id, {
                status: 5,
                audit_status: 11
              }, { transaction: t });
            }
          }
        }

        await this.settlementBatchRepository.update(batch_id, {
          status: 5,
          audit_status: 11,
          reviewer_id: operatorId,
          review_reason,
          fail_count: Number(batch.fail_count) + Number(batch.pending_count),
          pending_count: 0
        }, { transaction: t });
      }
    });

    return this.getBatchById(batch_id);
  }

  async getBatchProgress(batchId: string): Promise<BatchProgressVO> {
    if (!isValidId(batchId)) {
      throwValidationError('无效的批量ID');
    }

    const batch = await this.settlementBatchRepository.findById(batchId);
    if (!batch) {
      throwNotFoundError('批量转账记录不存在');
    }

    const batchSettlements = await this.settlementRepository.findByBatchId(batchId);
    const latestSettlements = batchSettlements
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
      .slice(0, 10)
      .map(s => this.convertSettlementToVO(s));

    const totalCount = Number(batch.total_count || 0);
    const successCount = Number(batch.success_count || 0);
    const failCount = Number(batch.fail_count || 0);
    const pendingCount = Number(batch.pending_count || 0);
    const processingCount = Number(batch.processing_count || 0);

    const progressPercent = totalCount > 0
      ? Number(((successCount + failCount) / totalCount * 100).toFixed(2))
      : 0;

    return {
      batch_id: batch.id,
      batch_no: batch.batch_no,
      status: batch.status,
      total_count: totalCount,
      success_count: successCount,
      fail_count: failCount,
      pending_count: pendingCount,
      processing_count: processingCount,
      progress_percent: progressPercent,
      latest_settlements: latestSettlements
    };
  }

  async traceSettlement(request: SettlementTraceRequest): Promise<SettlementTraceResult> {
    const { settlement_no, payer_account_no, payee_account_no, payer_customer_id, start_time, end_time } = request;

    if (!settlement_no && !payer_account_no && !payee_account_no && !payer_customer_id) {
      throwValidationError('请至少提供结算流水号、转出账户号、收款账户号或客户ID中的一项');
    }

    const where: any = {};
    if (settlement_no) where.settlement_no = settlement_no;
    if (payer_account_no) where.payer_account_no = payer_account_no;
    if (payee_account_no) where.payee_account_no = payee_account_no;
    if (payer_customer_id) where.payer_customer_id = payer_customer_id;
    if (start_time) {
      where.created_at = { ...(where.created_at || {}), [Op.gte]: dayjs(start_time).startOf('day').toDate() };
    }
    if (end_time) {
      where.created_at = { ...(where.created_at || {}), [Op.lte]: dayjs(end_time).endOf('day').toDate() };
    }

    const include = [
      this.settlementRepository.getOrganizationInclude(),
      this.settlementRepository.getOperatorInclude(),
      this.settlementRepository.getReviewerInclude(),
      this.settlementRepository.getPayerAccountInclude(),
      this.settlementRepository.getPayerCustomerInclude()
    ];

    const settlements = await this.settlementRepository.findByWhere(where, {
      include,
      order: [['created_at', 'DESC']]
    });

    if (settlements.length === 0) {
      return {
        query_params: request,
        total_count: 0,
        total_amount: 0,
        total_fee: 0,
        records: [],
        same_name_check: {
          has_risk: false,
          same_name_count: 0,
          time_window_hours: RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS,
          transfers: []
        },
        large_amount_check: {
          has_risk: false,
          threshold: RISK_DETECTION_RULES.LARGE_AMOUNT_NO_PURPOSE_THRESHOLD,
          transfers: []
        },
        abnormal_location_check: {
          has_risk: false,
          transfers: []
        },
        account_compliance_check: {
          payer_compliant: true,
          payee_compliant: true,
          payer_issues: [],
          payee_issues: []
        },
        transaction_authenticity_check: {
          is_authentic: true,
          authenticity_score: 100,
          issues: []
        },
        risk_warnings: [],
        validation_passed: true
      };
    }

    const settlementVOs = settlements.map(s => this.convertSettlementToVO(s));
    const totalAmount = settlementVOs.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalFee = settlementVOs.reduce((sum, s) => sum + Number(s.fee || 0), 0);

    const sameNameMap = new Map<string, typeof settlementVOs>();
    settlementVOs.forEach(s => {
      const key = `${s.payer_account_no}_${s.payee_account_name}`;
      if (!sameNameMap.has(key)) {
        sameNameMap.set(key, []);
      }
      sameNameMap.get(key)!.push(s);
    });

    const sameNameRiskTransfers: SameNameTransferCheck['transfers'] = [];
    let sameNameHasRisk = false;
    const windowHours = RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS;

    sameNameMap.forEach((group) => {
      if (group.length >= RISK_DETECTION_RULES.SAME_NAME_TRANSFER_COUNT_THRESHOLD) {
        sameNameHasRisk = true;
        group.forEach(s => {
          sameNameRiskTransfers.push({
            settlement_no: s.settlement_no,
            amount: Number(s.amount),
            create_time: dayjs(s.created_at).format('YYYY-MM-DD HH:mm:ss'),
            payee_account_name: s.payee_account_name
          });
        });
      }
    });

    const sameNameCheck: SameNameTransferCheck = {
      has_risk: sameNameHasRisk,
      same_name_count: sameNameRiskTransfers.length,
      time_window_hours: windowHours,
      transfers: sameNameRiskTransfers
    };

    const largeAmountThreshold = RISK_DETECTION_RULES.LARGE_AMOUNT_NO_PURPOSE_THRESHOLD;
    const largeAmountRiskTransfers: LargeAmountNoPurposeCheck['transfers'] = [];

    settlementVOs.forEach(s => {
      const amount = Number(s.amount || 0);
      if (amount >= largeAmountThreshold && !s.purpose) {
        largeAmountRiskTransfers.push({
          settlement_no: s.settlement_no,
          amount,
          create_time: dayjs(s.created_at).format('YYYY-MM-DD HH:mm:ss'),
          payee_account_no: s.payee_account_no
        });
      }
    });

    const largeAmountCheck: LargeAmountNoPurposeCheck = {
      has_risk: largeAmountRiskTransfers.length > 0,
      threshold: largeAmountThreshold,
      transfers: largeAmountRiskTransfers
    };

    const abnormalLocationTransfers: AbnormalLocationCheck['transfers'] = [];
    const payerLocations = new Set<string>();
    settlementVOs.forEach(s => {
      if (s.payee_location) {
        payerLocations.add(s.payee_location);
      }
    });

    settlementVOs.forEach(s => {
      if (s.payee_location && payerLocations.size > 1) {
        const countInLocation = settlementVOs.filter(x => x.payee_location === s.payee_location).length;
        const isAbnormal = countInLocation === 1;
        abnormalLocationTransfers.push({
          settlement_no: s.settlement_no,
          amount: Number(s.amount),
          create_time: dayjs(s.created_at).format('YYYY-MM-DD HH:mm:ss'),
          payee_location: s.payee_location,
          is_abnormal: isAbnormal
        });
      }
    });

    const abnormalLocationCheck: AbnormalLocationCheck = {
      has_risk: abnormalLocationTransfers.some(t => t.is_abnormal),
      transfers: abnormalLocationTransfers
    };

    const payerIssues: string[] = [];
    const payeeIssues: string[] = [];
    let payerCompliant = true;
    let payeeCompliant = true;

    const uniquePayerAccounts = new Set(settlementVOs.map(s => s.payer_account_no));
    const uniquePayeeAccounts = new Set(settlementVOs.map(s => s.payee_account_no));

    for (const accountNo of uniquePayerAccounts) {
      const account = await this.accountRepository.findByAccountNo(accountNo);
      if (account) {
        if (account.status === 0) {
          payerIssues.push(`转出账户${accountNo}已注销`);
          payerCompliant = false;
        }
        if (account.status === 2) {
          payerIssues.push(`转出账户${accountNo}已冻结`);
          payerCompliant = false;
        }
        const blacklistV = await this.violationRepository.findByWhere({
          biz_no: accountNo,
          violation_type: 2,
          status: { [Op.in]: [0, 1] }
        });
        if (blacklistV.length > 0) {
          payerIssues.push(`转出账户${accountNo}存在历史可疑记录`);
          payerCompliant = false;
        }
      }
    }

    for (const accountNo of uniquePayeeAccounts) {
      const blacklistV = await this.violationRepository.findByWhere({
        biz_no: accountNo,
        violation_type: 2,
        status: { [Op.in]: [0, 1] }
      });
      if (blacklistV.length > 0) {
        payeeIssues.push(`收款账户${accountNo}存在历史可疑记录`);
        payeeCompliant = false;
      }
    }

    const accountComplianceCheck: AccountComplianceCheck = {
      payer_compliant: payerCompliant,
      payee_compliant: payeeCompliant,
      payer_issues: payerIssues,
      payee_issues: payeeIssues
    };

    const authenticityIssues: string[] = [];
    let score = 100;
    const highRiskCount = settlementVOs.filter(s => (s.risk_level || 0) >= 4).length;
    if (highRiskCount > 0) {
      score -= highRiskCount * 10;
      authenticityIssues.push(`检测到${highRiskCount}笔高风险等级转账`);
    }
    if (sameNameHasRisk) {
      score -= 15;
      authenticityIssues.push('存在同名频繁转账行为');
    }
    if (largeAmountRiskTransfers.length > 0) {
      score -= 10;
      authenticityIssues.push('存在大额无用途转账');
    }
    if (abnormalLocationCheck.has_risk) {
      score -= 10;
      authenticityIssues.push('存在异地异常转账行为');
    }
    if (!payerCompliant || !payeeCompliant) {
      score -= 15;
      authenticityIssues.push('转账双方账户存在合规问题');
    }
    score = Math.max(0, score);

    const transactionAuthenticityCheck: TransactionAuthenticityCheck = {
      is_authentic: score >= 60,
      authenticity_score: score,
      issues: authenticityIssues
    };

    const riskWarnings: SettlementTraceResult['risk_warnings'] = [];
    const relatedSameName = sameNameRiskTransfers.map(t => t.settlement_no);
    const relatedLarge = largeAmountRiskTransfers.map(t => t.settlement_no);
    const relatedAbnormal = abnormalLocationTransfers.filter(t => t.is_abnormal).map(t => t.settlement_no);

    if (relatedSameName.length > 0) {
      riskWarnings.push({
        risk_type: '同名频繁转账',
        risk_level: 3,
        description: `检测到${RISK_DETECTION_RULES.SAME_NAME_TRANSFER_TIME_WINDOW_HOURS}小时内同名收款人转账${RISK_DETECTION_RULES.SAME_NAME_TRANSFER_COUNT_THRESHOLD}次以上，存在洗钱或套现嫌疑`,
        related_settlement_nos: relatedSameName
      });
    }
    if (relatedLarge.length > 0) {
      riskWarnings.push({
        risk_type: '大额无用途转账',
        risk_level: 4,
        description: `检测到${relatedLarge.length}笔金额超过${this.formatMoneyWithComma(RISK_DETECTION_RULES.LARGE_AMOUNT_NO_PURPOSE_THRESHOLD)}元且未标注用途的转账，建议核实交易背景`,
        related_settlement_nos: relatedLarge
      });
    }
    if (relatedAbnormal.length > 0) {
      riskWarnings.push({
        risk_type: '异地异常转账',
        risk_level: 3,
        description: `检测到${relatedAbnormal.length}笔收款地异常的转账，建议核实收款人所在地`,
        related_settlement_nos: relatedAbnormal
      });
    }
    if (payerIssues.length > 0) {
      riskWarnings.push({
        risk_type: '转出账户合规问题',
        risk_level: 4,
        description: payerIssues.join('；'),
        related_settlement_nos: []
      });
    }
    if (payeeIssues.length > 0) {
      riskWarnings.push({
        risk_type: '收款账户合规问题',
        risk_level: 4,
        description: payeeIssues.join('；'),
        related_settlement_nos: []
      });
    }

    if (riskWarnings.length > 0) {
      try {
        for (const w of riskWarnings) {
          if (w.risk_level >= 3) {
            const relatedNos = w.related_settlement_nos;
            const firstS = settlementVOs.find(s => relatedNos.includes(s.settlement_no)) || settlementVOs[0];
            await this.violationRepository.create({
              violation_no: await this.violationRepository.generateViolationNo(),
              customer_id: firstS?.payer_customer_id,
              customer_no: firstS?.payer_account_no,
              biz_id: firstS?.id,
              biz_no: firstS?.settlement_no,
              biz_type: 'settlement',
              violation_type: 1,
              violation_level: Math.min(5, w.risk_level),
              description: w.description,
              rule_ref: w.risk_type,
              status: 0,
              discover_time: new Date()
            });
          }
        }
      } catch (e) {
      }
    }

    const validationPassed = riskWarnings.length === 0 && score >= 80;

    return {
      query_params: request,
      total_count: settlementVOs.length,
      total_amount: Number(totalAmount.toFixed(2)),
      total_fee: Number(totalFee.toFixed(2)),
      records: settlementVOs,
      same_name_check: sameNameCheck,
      large_amount_check: largeAmountCheck,
      abnormal_location_check: abnormalLocationCheck,
      account_compliance_check: accountComplianceCheck,
      transaction_authenticity_check: transactionAuthenticityCheck,
      risk_warnings: riskWarnings,
      validation_passed: validationPassed
    };
  }
}
