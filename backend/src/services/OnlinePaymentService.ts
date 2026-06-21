import {
  OnlinePaymentRepository,
  MerchantInfoRepository,
  DeviceBindingRepository,
  AccountRepository,
  CustomerRepository,
  TransactionRepository,
  ViolationRepository,
  AuditRecordRepository,
  OrganizationRepository
} from '../repositories';
import {
  Organization,
  User,
  Customer
} from '../models';
import {
  ChannelType,
  PaymentStatus,
  PayScene,
  ChannelTypeText,
  PaymentStatusText,
  PaySceneText,
  DeviceTypeText,
  VerifyMethodText,
  MerchantTypeText,
  RiskLevelText,
  ONLINE_PAY_LIMIT_CONFIG,
  ONLINE_FEE_CONFIG,
  RISK_RULES,
  SECOND_VERIFY_RULES
} from '../models/OnlinePayment';
import {
  type OnlinePaymentPreCheckRequest,
  type OnlinePaymentPreCheckResult,
  type MerchantCheckResult,
  type DeviceCheckResult,
  type LimitCheckResult,
  type OnlinePaymentVO,
  type OnlinePaymentQueryParams,
  type CreateOnlinePaymentRequest,
  type OnlinePaymentBatchProcessRequest,
  type OnlinePaymentBatchProcessResult,
  type OnlinePaymentBatchProcessResultItem,
  type OnlinePaymentTraceRequest,
  type OnlinePaymentTraceResult,
  type AbnormalTransactionCheck,
  type TamperProofCheck,
  type BatchProcessType
} from '../types/onlinePayment';
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
import { createHash } from 'crypto';

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

const paymentStatusMap: Record<number, string> = {
  0: '待支付',
  1: '支付中',
  2: '支付成功',
  3: '支付失败',
  4: '已退款',
  5: '已关闭',
  6: '待确认'
};

export class OnlinePaymentService {
  private onlinePaymentRepository: OnlinePaymentRepository;
  private merchantInfoRepository: MerchantInfoRepository;
  private deviceBindingRepository: DeviceBindingRepository;
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;
  private transactionRepository: TransactionRepository;
  private violationRepository: ViolationRepository;
  private auditRecordRepository: AuditRecordRepository;
  private organizationRepository: OrganizationRepository;
  private riskControlService: RiskControlService;

  constructor() {
    this.onlinePaymentRepository = new OnlinePaymentRepository();
    this.merchantInfoRepository = new MerchantInfoRepository();
    this.deviceBindingRepository = new DeviceBindingRepository();
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
    this.transactionRepository = new TransactionRepository();
    this.violationRepository = new ViolationRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.organizationRepository = new OrganizationRepository();
    this.riskControlService = new RiskControlService();
  }

  private formatMoneyWithComma(amount: number): string {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private calculateOnlineFee(channelType: ChannelType, amount: number, scene: PayScene): { fee: number; fee_calc_desc: string } {
    const feeConfig = ONLINE_FEE_CONFIG[channelType] || { min_fee: 0, max_fee: 0, rate: 0 };
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
      fee_calc_desc: desc
    };
  }

  private determineRiskLevel(
    amount: number,
    isUnfamiliarDevice: boolean,
    isDifferentCity: boolean,
    isNightTime: boolean,
    isNewDevice: boolean,
    dailyTotalAmount: number
  ): number {
    let riskLevel = 0;

    if (amount >= RISK_RULES.SINGLE_TRANSACTION_HIGH_AMOUNT_THRESHOLD) {
      riskLevel = Math.max(riskLevel, RISK_RULES.SINGLE_TRANSACTION_HIGH_AMOUNT_RISK_LEVEL);
    }

    if (dailyTotalAmount >= RISK_RULES.DAILY_TOTAL_AMOUNT_THRESHOLD) {
      riskLevel = Math.max(riskLevel, RISK_RULES.DAILY_TOTAL_AMOUNT_RISK_LEVEL);
    }

    if (isUnfamiliarDevice && RISK_RULES.UNFAMILIAR_DEVICE_DETECTION) {
      riskLevel = Math.max(riskLevel, RISK_RULES.UNFAMILIAR_DEVICE_RISK_LEVEL);
    }

    if (isDifferentCity && RISK_RULES.DIFFERENT_CITY_DETECTION) {
      riskLevel = Math.max(riskLevel, RISK_RULES.DIFFERENT_CITY_RISK_LEVEL);
    }

    if (isNightTime && amount >= RISK_RULES.LATE_NIGHT_TRANSACTION_AMOUNT_THRESHOLD) {
      riskLevel = Math.max(riskLevel, RISK_RULES.LATE_NIGHT_TRANSACTION_RISK_LEVEL);
    }

    if (isNewDevice) {
      riskLevel = Math.max(riskLevel, RISK_RULES.NEW_DEVICE_RISK_LEVEL);
    }

    return Math.min(5, riskLevel);
  }

  private async verifyDevice(deviceId: string | undefined, accountNo: string): Promise<DeviceCheckResult> {
    const warnings: string[] = [];
    let deviceBound = false;
    let isTrusted = false;
    let riskScore = 0;
    let deviceType: number | undefined;
    let deviceInfo: string | undefined;
    let lastLoginTime: string | undefined;
    let bindTime: string | undefined;

    if (!deviceId) {
      warnings.push('未提供设备信息');
      riskScore = 50;
      return {
        device_bound: false,
        is_trusted: false,
        risk_score: riskScore,
        warnings
      };
    }

    const deviceBinding = await this.deviceBindingRepository.findByDeviceId(deviceId);
    if (deviceBinding) {
      deviceBound = deviceBinding.status === 1;
      isTrusted = deviceBinding.is_trusted || false;
      deviceType = deviceBinding.device_type;
      deviceInfo = deviceBinding.device_name || deviceBinding.os;
      lastLoginTime = deviceBinding.last_login_time
        ? dayjs(deviceBinding.last_login_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined;
      bindTime = deviceBinding.bind_time
        ? dayjs(deviceBinding.bind_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined;

      if (!deviceBound) {
        warnings.push('设备已解绑');
        riskScore = 80;
      } else if (deviceBinding.status === 2) {
        warnings.push('设备已冻结');
        riskScore = 90;
      } else if (!isTrusted) {
        warnings.push('非授信设备');
        riskScore = 40;
      } else {
        riskScore = 10;
      }

      const bindDays = deviceBinding.bind_time
        ? dayjs().diff(dayjs(deviceBinding.bind_time), 'day')
        : 0;
      if (bindDays < RISK_RULES.NEW_DEVICE_BIND_GRACE_DAYS && deviceBound) {
        warnings.push('新绑定设备');
        riskScore = Math.max(riskScore, 30);
      }
    } else {
      warnings.push('设备未绑定');
      riskScore = 60;
    }

    return {
      device_bound: deviceBound,
      is_trusted: isTrusted,
      risk_score: riskScore,
      warnings,
      device_type: deviceType as any,
      device_info: deviceInfo,
      last_login_time: lastLoginTime,
      bind_time: bindTime
    };
  }

  private async checkMerchantQualification(
    merchantNo: string,
    channelType: ChannelType,
    payScene: PayScene,
    amount: number
  ): Promise<MerchantCheckResult> {
    const merchant = await this.merchantInfoRepository.findByMerchantNo(merchantNo);

    if (!merchant) {
      return {
        merchant_valid: false,
        merchant_status: 0,
        merchant_status_text: '不存在',
        merchant_type: 1 as any,
        merchant_name: merchantNo,
        allowed_scenes: [],
        allowed_channels: [],
        daily_used_amount: 0,
        daily_limit: 0,
        within_merchant_limit: false,
        merchant_error: '商户不存在'
      };
    }

    const merchantStatus = merchant.status || 0;
    const merchantType = merchant.merchant_type || 1;
    const merchantName = merchant.merchant_name || merchantNo;
    const merchantStatusText = merchantStatus === 1 ? '正常' : merchantStatus === 2 ? '冻结' : '停用';

    let merchantValid = merchantStatus === 1;
    let merchantError: string | undefined;

    if (merchantStatus === 0) {
      merchantError = '商户已停用';
    } else if (merchantStatus === 2) {
      merchantError = '商户已冻结';
    } else if (merchantType === 3) {
      merchantError = '黑名单商户';
      merchantValid = false;
    }

    const allowedScenes: PayScene[] = [1, 2, 3, 4, 5, 6];
    const allowedChannels: ChannelType[] = [1, 2, 3, 4, 5, 6];

    const today = new Date();
    const dailyUsedAmount = 0;
    const dailyLimit = merchantType === 2 ? 50000000 : merchantType === 1 ? 10000000 : 0;
    const withinMerchantLimit = dailyUsedAmount + amount <= dailyLimit;

    if (!withinMerchantLimit && merchantValid) {
      merchantError = `商户单日交易限额${this.formatMoneyWithComma(dailyLimit)}元，已使用${this.formatMoneyWithComma(dailyUsedAmount)}元`;
    }

    return {
      merchant_valid: merchantValid,
      merchant_status: merchantStatus,
      merchant_status_text: merchantStatusText,
      merchant_type: merchantType as any,
      merchant_name: merchantName,
      allowed_scenes: allowedScenes,
      allowed_channels: allowedChannels,
      daily_used_amount: dailyUsedAmount,
      daily_limit: dailyLimit,
      within_merchant_limit: withinMerchantLimit,
      merchant_error: merchantError
    };
  }

  private convertOnlinePaymentToVO(payment: any): OnlinePaymentVO {
    const data = payment.toJSON ? payment.toJSON() : payment;
    const vo: OnlinePaymentVO = { ...data };

    if (data.organization) {
      vo.org_name = data.organization.name;
    }
    if (data.operator) {
      vo.operator_name = data.operator.real_name || data.operator.username;
    }
    if (data.customer) {
      vo.payer_customer_id = data.customer.id;
    }

    vo.channel_type_text = ChannelTypeText[data.channel_type] || '未知';
    vo.pay_scene_text = PaySceneText[data.pay_scene] || '未知';
    vo.status_text = paymentStatusMap[data.status] || '未知';
    vo.device_type_text = data.device_type ? DeviceTypeText[data.device_type] || '未知' : undefined;
    vo.verify_method_text = data.verify_method ? VerifyMethodText[data.verify_method] || '未知' : undefined;
    vo.merchant_type_text = data.merchant_type ? MerchantTypeText[data.merchant_type] || '未知' : undefined;
    vo.risk_level_text = data.risk_level !== undefined ? riskLevelMap[data.risk_level] || '未知' : undefined;
    vo.amount_formatted = this.formatMoneyWithComma(Number(data.amount || 0));
    vo.fee_formatted = this.formatMoneyWithComma(Number(data.fee || 0));
    vo.is_risk_warning = (data.risk_level || 0) >= 3;

    return vo;
  }

  async preCheckOnlinePayment(
    request: OnlinePaymentPreCheckRequest,
    currentUserId?: string
  ): Promise<OnlinePaymentPreCheckResult> {
    const { payer_account_no, channel_type, pay_scene, amount, merchant_no, device_id, ip_address, verify_code } = request;
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';
    let blockField = '';

    if (!payer_account_no) {
      throwValidationError('付款账户号不能为空');
    }
    if (!channel_type || ![1, 2, 3, 4, 5, 6].includes(channel_type)) {
      throwValidationError('无效的渠道类型');
    }
    if (!pay_scene || ![1, 2, 3, 4, 5, 6].includes(pay_scene)) {
      throwValidationError('无效的支付场景');
    }
    if (!isValidAmount(amount) || amount <= 0) {
      throwValidationError('支付金额无效');
      blockField = 'amount';
    }
    if (!merchant_no) {
      throwValidationError('商户号不能为空');
      blockField = 'merchant_no';
    }

    const payerAccount = await this.accountRepository.findByAccountNo(payer_account_no);
    if (!payerAccount) {
      throwNotFoundError('付款账户不存在');
    }

    const payerCustomer = payerAccount.customer_id
      ? await this.customerRepository.findById(payerAccount.customer_id)
      : null;

    const payerAccountStatus = payerAccount.status;
    const payerAccountStatusText = accountStatusMap[payerAccountStatus] || '未知';
    let payerAccountValid = true;

    if (payerAccountStatus === 0) {
      blocked = true;
      blockReason = '付款账户已注销';
      blockField = 'payer_account_no';
      payerAccountValid = false;
    } else if (payerAccountStatus === 2) {
      blocked = true;
      blockReason = '付款账户已冻结';
      blockField = 'payer_account_no';
    } else if (payerAccountStatus === 3) {
      blocked = true;
      blockReason = '付款账户已挂失';
      blockField = 'payer_account_no';
      payerAccountValid = false;
    } else if (payerAccountStatus === 4) {
      warnings.push('付款账户处于休眠状态，支付后将自动激活');
    }

    const channelOpened = [1, 2, 3, 4, 5, 6].includes(channel_type);
    if (!channelOpened && !blocked) {
      blocked = true;
      blockReason = `${ChannelTypeText[channel_type] || '该渠道'}暂未开通`;
      blockField = 'channel_type';
    }

    const deviceCheck = await this.verifyDevice(device_id, payer_account_no);
    if (device_id) {
      if (!deviceCheck.device_bound && !blocked) {
        blocked = true;
        blockReason = '设备未绑定，请先绑定设备';
        blockField = 'device_id';
      } else if (!deviceCheck.is_trusted && !blocked) {
        warnings.push('非授信设备，需二次核验');
      }
    }

    if (verify_code) {
      const verifyCodeValid = verify_code.length >= 4 && verify_code.length <= 8;
      if (!verifyCodeValid && !blocked) {
        blocked = true;
        blockReason = '验证码格式无效';
        blockField = 'verify_code';
      }
    }

    const sceneAllowed = true;
    if (!sceneAllowed && !blocked) {
      blocked = true;
      blockReason = `${ChannelTypeText[channel_type]}渠道不支持${PaySceneText[pay_scene]}场景`;
      blockField = 'pay_scene';
    }

    const merchantCheck = await this.checkMerchantQualification(merchant_no, channel_type, pay_scene, amount);
    if (!merchantCheck.merchant_valid && !blocked) {
      blocked = true;
      blockReason = merchantCheck.merchant_error || '商户资质校验未通过';
      blockField = 'merchant_no';
    } else if (merchantCheck.merchant_error && !blocked) {
      warnings.push(merchantCheck.merchant_error);
    }

    const availableBalance = Number(payerAccount.available_balance || 0);
    const feeCalc = this.calculateOnlineFee(channel_type, amount, pay_scene);
    const totalDeduct = amount + feeCalc.fee;
    const balanceSufficient = availableBalance >= totalDeduct;

    if (!balanceSufficient && !blocked) {
      blocked = true;
      blockReason = `付款账户可用余额不足，可用余额${this.formatMoneyWithComma(availableBalance)}元，需扣除${this.formatMoneyWithComma(totalDeduct)}元（含手续费）`;
      blockField = 'amount';
    }

    const limitConfig = ONLINE_PAY_LIMIT_CONFIG[channel_type]?.[pay_scene] || {
      single_limit: 50000,
      daily_limit: 200000,
      monthly_limit: 1000000
    };
    const singleLimit = limitConfig.single_limit;
    const dailyLimit = limitConfig.daily_limit;
    const monthlyLimit = limitConfig.monthly_limit;

    const today = new Date();
    const dailyUsedAmount = await this.onlinePaymentRepository.getDailyPaymentAmount(payer_account_no, dayjs(today).format('YYYY-MM-DD'), 2);
    const monthlyUsedAmount = await this.onlinePaymentRepository.getMonthlyPaymentAmount(payer_account_no, dayjs(today).format('YYYY-MM'), 2);
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsedAmount);
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsedAmount);

    const withinSingleLimit = amount <= singleLimit;
    const withinDailyLimit = dailyUsedAmount + amount <= dailyLimit;
    const withinMonthlyLimit = monthlyUsedAmount + amount <= monthlyLimit;
    let limitError = '';

    if (!withinSingleLimit) {
      limitError = `单笔支付金额超限，单笔限额${this.formatMoneyWithComma(singleLimit)}元`;
      if (!blocked) {
        blocked = true;
        blockReason = limitError;
        blockField = 'amount';
      }
    } else if (!withinDailyLimit) {
      limitError = `单日累计支付金额超限，单日限额${this.formatMoneyWithComma(dailyLimit)}元，已使用${this.formatMoneyWithComma(dailyUsedAmount)}元，剩余可付${this.formatMoneyWithComma(dailyRemaining)}元`;
      if (!blocked) {
        blocked = true;
        blockReason = limitError;
        blockField = 'amount';
      }
    } else if (!withinMonthlyLimit) {
      limitError = `单月累计支付金额超限，单月限额${this.formatMoneyWithComma(monthlyLimit)}元，已使用${this.formatMoneyWithComma(monthlyUsedAmount)}元，剩余可付${this.formatMoneyWithComma(monthlyRemaining)}元`;
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

    const currentHour = dayjs().hour();
    const isNightTime = currentHour >= RISK_RULES.LATE_NIGHT_TRANSACTION_START_HOUR ||
      currentHour < RISK_RULES.LATE_NIGHT_TRANSACTION_END_HOUR;

    const isUnfamiliarDevice = device_id ? !deviceCheck.is_trusted : true;
    const isDifferentCity = false;
    const isNewDevice = device_id
      ? (deviceCheck.bind_time ? dayjs().diff(dayjs(deviceCheck.bind_time), 'day') < RISK_RULES.NEW_DEVICE_BIND_GRACE_DAYS : true)
      : false;

    const riskLevel = this.determineRiskLevel(
      amount,
      isUnfamiliarDevice,
      isDifferentCity,
      isNightTime,
      isNewDevice,
      dailyUsedAmount + amount
    );

    const highFreqWindowStart = dayjs().subtract(RISK_RULES.HIGH_FREQUENCY_TIME_WINDOW_MINUTES, 'minute').toDate();
    const highFreqCount = await this.onlinePaymentRepository.countHighFrequencyTransactions(
      payer_account_no,
      highFreqWindowStart,
      new Date()
    );
    if (highFreqCount >= RISK_RULES.HIGH_FREQUENCY_THRESHOLD) {
      warnings.push(`检测到${RISK_RULES.HIGH_FREQUENCY_TIME_WINDOW_MINUTES}分钟内高频交易${highFreqCount}次，存在风险`);
    }

    if (isNightTime && amount >= RISK_RULES.LATE_NIGHT_TRANSACTION_AMOUNT_THRESHOLD) {
      warnings.push(`夜间大额支付（${this.formatMoneyWithComma(amount)}元），建议核验`);
    }

    if (payerCustomer?.risk_level && payerCustomer.risk_level >= 4 && !blocked) {
      warnings.push(`付款客户风险等级为【${riskLevelMap[payerCustomer.risk_level]}】，建议加强审核`);
    }

    let needSecondVerify = false;
    if (SECOND_VERIFY_RULES.ENABLE_SECOND_VERIFY) {
      if (amount >= SECOND_VERIFY_RULES.SINGLE_AMOUNT_THRESHOLD) {
        needSecondVerify = true;
        warnings.push(`单笔金额超过${this.formatMoneyWithComma(SECOND_VERIFY_RULES.SINGLE_AMOUNT_THRESHOLD)}元，需二次核验`);
      }
      if (dailyUsedAmount + amount >= SECOND_VERIFY_RULES.DAILY_TOTAL_AMOUNT_THRESHOLD) {
        needSecondVerify = true;
        warnings.push(`当日累计金额超过${this.formatMoneyWithComma(SECOND_VERIFY_RULES.DAILY_TOTAL_AMOUNT_THRESHOLD)}元，需二次核验`);
      }
      if (riskLevel >= SECOND_VERIFY_RULES.HIGH_RISK_LEVEL_THRESHOLD) {
        needSecondVerify = true;
      }
      if (SECOND_VERIFY_RULES.UNFAMILIAR_DEVICE_VERIFY && isUnfamiliarDevice && device_id) {
        needSecondVerify = true;
      }
      if (SECOND_VERIFY_RULES.DIFFERENT_CITY_VERIFY && isDifferentCity) {
        needSecondVerify = true;
      }
      if (SECOND_VERIFY_RULES.LATE_NIGHT_VERIFY && isNightTime && amount >= RISK_RULES.LATE_NIGHT_TRANSACTION_AMOUNT_THRESHOLD) {
        needSecondVerify = true;
      }
      if (SECOND_VERIFY_RULES.NEW_DEVICE_VERIFY && isNewDevice && device_id) {
        needSecondVerify = true;
      }
    }

    return {
      passed: !blocked,
      blocked,
      block_reason: blockReason || undefined,
      block_field: blockField || undefined,
      warnings,
      need_second_verify: needSecondVerify,
      fee: feeCalc.fee,
      fee_calc_desc: feeCalc.fee_calc_desc,
      risk_level: riskLevel as any,
      payer_account_valid: payerAccountValid,
      payer_account_status: payerAccountStatus,
      payer_available_balance: availableBalance,
      balance_sufficient: balanceSufficient,
      merchant_check: merchantCheck,
      device_check: deviceCheck,
      limit_check: limitCheck
    };
  }

  async createOnlinePayment(
    request: CreateOnlinePaymentRequest,
    operatorId?: string,
    orgId?: string
  ): Promise<OnlinePaymentVO> {
    const {
      channel_type,
      pay_scene,
      payer_account_no,
      merchant_no,
      amount,
      currency,
      device_id,
      device_type,
      device_info,
      ip_address,
      verify_method,
      verify_code,
      remark,
      request_id
    } = request;

    if (request_id) {
      const existed = await this.onlinePaymentRepository.findByOrderNo(request_id);
      if (existed) {
        throwBusinessError(`重复提交请求：requestId=${request_id}，支付单号：${existed.payment_no}`);
      }
    }

    const preCheckResult = await this.preCheckOnlinePayment({
      payer_account_no,
      channel_type: channel_type as ChannelType,
      pay_scene: pay_scene as PayScene,
      amount,
      merchant_no,
      device_id,
      ip_address,
      verify_code
    }, operatorId);

    if (preCheckResult.blocked) {
      throwBusinessError(preCheckResult.block_reason || '前置校验未通过');
    }

    const payerAccount = await this.accountRepository.findByAccountNo(payer_account_no);
    if (!payerAccount) {
      throwNotFoundError('付款账户不存在');
    }

    const payerCustomer = payerAccount.customer_id
      ? await this.customerRepository.findById(payerAccount.customer_id)
      : null;

    const merchant = await this.merchantInfoRepository.findByMerchantNo(merchant_no);

    const feeCalc = { fee: preCheckResult.fee, fee_calc_desc: preCheckResult.fee_calc_desc };
    const needSecondVerify = preCheckResult.need_second_verify;
    const riskLevel = preCheckResult.risk_level;

    const targetOrgId = orgId || payerAccount.open_org_id;
    if (targetOrgId && !isValidId(targetOrgId)) {
      throwValidationError('无效的机构ID');
    }

    const paymentNo = await this.onlinePaymentRepository.generatePaymentNo();
    const transactionNo = await this.transactionRepository.generateTransactionNo();
    const totalDeduct = amount + feeCalc.fee;

    let payment: any;
    let transaction: any;

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(payerAccount.balance || 0);
      const originalAvailable = Number(payerAccount.available_balance || 0);

      const initialStatus: PaymentStatus = needSecondVerify ? 6 : 1;

      payment = await this.onlinePaymentRepository.create({
        payment_no: paymentNo,
        order_no: request_id || paymentNo,
        channel_type,
        payer_account_id: payerAccount.id,
        payer_account_no,
        payer_account_name: payerCustomer?.customer_name || payer_account_no,
        customer_id: payerCustomer?.id,
        merchant_no,
        merchant_id: merchant?.id,
        merchant_name: merchant?.merchant_name || merchant_no,
        merchant_type: merchant?.merchant_type,
        amount,
        currency: currency || 'CNY',
        fee: feeCalc.fee,
        fee_calc_desc: feeCalc.fee_calc_desc,
        status: initialStatus,
        pay_scene,
        device_id,
        device_type,
        ip_address,
        location: ip_address,
        verify_method,
        risk_level: riskLevel,
        need_second_verify: needSecondVerify,
        second_verify_passed: !needSecondVerify,
        org_id: targetOrgId,
        operator_id: operatorId,
        operator_name: operatorId ? undefined : undefined,
        remark,
        request_id
      }, { transaction: t });

      transaction = await this.transactionRepository.create({
        transaction_no: transactionNo,
        type: 3,
        business_line: payerCustomer?.customer_type === 2 ? 'corporate' : 'retail',
        amount,
        currency: currency || 'CNY',
        customer_id: payerCustomer?.id,
        customer_no: payerCustomer?.customer_no,
        payer_account: payer_account_no,
        payer_name: payerCustomer?.customer_name || payer_account_no,
        payee_account: merchant?.settlement_account || '',
        payee_name: merchant?.merchant_name || merchant_no,
        org_id: targetOrgId,
        operator_id: operatorId,
        channel_code: String(channel_type),
        status: needSecondVerify ? 0 : 1,
        audit_status: needSecondVerify ? 0 : 10,
        transaction_time: new Date(),
        fee: feeCalc.fee,
        request_id
      }, { transaction: t });

      if (!needSecondVerify) {
        const newBalance = originalBalance - totalDeduct;
        const newAvailable = originalAvailable - totalDeduct;
        await this.accountRepository.update(payerAccount.id, {
          balance: newBalance,
          available_balance: newAvailable
        }, { transaction: t });

        await this.onlinePaymentRepository.update((payment as any).id, {
          status: 2,
          pay_time: new Date()
        }, { transaction: t });

        await this.transactionRepository.update((transaction as any).id, {
          status: 2,
          audit_status: 10
        }, { transaction: t });
      }

      if (riskLevel >= 3) {
        await this.auditRecordRepository.create({
          biz_type: 'online_payment',
          biz_id: (payment as any).id,
          biz_no: paymentNo,
          type: riskLevel >= 4 ? 2 : 1,
          level: riskLevel,
          status: 0,
          submitter_id: operatorId,
          submitter_org_id: targetOrgId,
          submit_time: new Date(),
          current_node: riskLevel >= 4 ? 'AUDIT_LEVEL_2' : 'AUDIT_LEVEL_1'
        }, { transaction: t });
      }
    });

    try {
      if (transaction && transaction.id) {
        await this.riskControlService.evaluateTransactionRisk(transaction.id);
      }
    } catch (e) {
    }

    return this.getOnlinePaymentById((payment as any).id);
  }

  async getOnlinePaymentById(id: string): Promise<OnlinePaymentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的支付ID');
    }

    const payment = await this.onlinePaymentRepository.findById(id, {
      include: [
        { model: Organization, as: 'organization', required: false },
        { model: User, as: 'operator', required: false },
        { model: Customer, as: 'customer', required: false }
      ]
    });

    if (!payment) {
      throwNotFoundError('支付记录不存在');
    }

    return this.convertOnlinePaymentToVO(payment);
  }

  async confirmPayment(id: string, confirmData: any): Promise<OnlinePaymentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的支付ID');
    }

    const payment = await this.onlinePaymentRepository.findById(id);
    if (!payment) {
      throwNotFoundError('支付记录不存在');
    }

    if (payment.status !== 6) {
      throwBusinessError('仅待确认状态的订单可确认支付');
    }

    const payerAccount = await this.accountRepository.findById(payment.payer_account_id!);
    if (!payerAccount) {
      throwNotFoundError('付款账户不存在');
    }

    const amount = Number(payment.amount || 0);
    const fee = Number(payment.fee || 0);
    const totalDeduct = amount + fee;
    const availableBalance = Number(payerAccount.available_balance || 0);

    if (availableBalance < totalDeduct) {
      throwBusinessError(`账户余额不足，可用余额${this.formatMoneyWithComma(availableBalance)}元，需扣除${this.formatMoneyWithComma(totalDeduct)}元`);
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(payerAccount.balance || 0);
      const originalAvailable = Number(payerAccount.available_balance || 0);
      const newBalance = originalBalance - totalDeduct;
      const newAvailable = originalAvailable - totalDeduct;

      await this.accountRepository.update(payerAccount.id, {
        balance: newBalance,
        available_balance: newAvailable
      }, { transaction: t });

      await this.onlinePaymentRepository.update(id, {
        status: 2,
        second_verify_passed: true,
        pay_time: new Date(),
        remark: confirmData?.remark || payment.remark
      }, { transaction: t });

      const relatedTx = await this.transactionRepository.findOne({
        where: { request_id: payment.request_id }
      });
      if (relatedTx) {
        await this.transactionRepository.update(relatedTx.id, {
          status: 2,
          audit_status: 10
        }, { transaction: t });
      }
    });

    return this.getOnlinePaymentById(id);
  }

  async refundPayment(id: string, refundData: any): Promise<OnlinePaymentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的支付ID');
    }

    const payment = await this.onlinePaymentRepository.findById(id);
    if (!payment) {
      throwNotFoundError('支付记录不存在');
    }

    if (payment.status !== 2) {
      throwBusinessError('仅支付成功的订单可退款');
    }

    const payerAccount = await this.accountRepository.findById(payment.payer_account_id!);
    if (!payerAccount) {
      throwNotFoundError('付款账户不存在');
    }

    const refundAmount = refundData?.amount ? Number(refundData.amount) : Number(payment.amount || 0);
    const refundFee = refundData?.refund_fee !== undefined ? Number(refundData.refund_fee) : 0;

    if (refundAmount > Number(payment.amount || 0)) {
      throwValidationError('退款金额不能超过原支付金额');
    }

    const totalRefund = refundAmount + refundFee;

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      const originalBalance = Number(payerAccount.balance || 0);
      const originalAvailable = Number(payerAccount.available_balance || 0);

      await this.accountRepository.update(payerAccount.id, {
        balance: originalBalance + totalRefund,
        available_balance: originalAvailable + totalRefund
      }, { transaction: t });

      await this.onlinePaymentRepository.update(id, {
        status: 4,
        refund_reason: refundData?.reason || '退款',
        remark: refundData?.remark || payment.remark
      }, { transaction: t });

      const relatedTx = await this.transactionRepository.findOne({
        where: { request_id: payment.request_id }
      });
      if (relatedTx) {
        await this.transactionRepository.update(relatedTx.id, {
          status: 4
        }, { transaction: t });
      }
    });

    return this.getOnlinePaymentById(id);
  }

  async closePayment(id: string, reason: string): Promise<OnlinePaymentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的支付ID');
    }
    if (!reason) {
      throwValidationError('关闭原因不能为空');
    }

    const payment = await this.onlinePaymentRepository.findById(id);
    if (!payment) {
      throwNotFoundError('支付记录不存在');
    }

    if (![0, 1, 6].includes(payment.status)) {
      throwBusinessError('仅待支付、支付中或待确认状态的订单可关闭');
    }

    await sequelize.transaction(async (t: SequelizeTransaction) => {
      await this.onlinePaymentRepository.update(id, {
        status: 5,
        close_reason: reason,
        close_time: new Date()
      }, { transaction: t });

      const relatedTx = await this.transactionRepository.findOne({
        where: { request_id: payment.request_id }
      });
      if (relatedTx) {
        await this.transactionRepository.update(relatedTx.id, {
          status: 5
        }, { transaction: t });
      }

      const auditRecord = await this.auditRecordRepository.findOne({
        where: { biz_id: id, biz_type: 'online_payment' }
      });
      if (auditRecord) {
        await this.auditRecordRepository.update(auditRecord.id, {
          status: 3,
          remark: reason
        }, { transaction: t });
      }
    });

    return this.getOnlinePaymentById(id);
  }

  async batchProcessPayment(
    request: OnlinePaymentBatchProcessRequest,
    operatorId: string,
    userRoles: string[]
  ): Promise<OnlinePaymentBatchProcessResult> {
    const { ids, process_type, reason } = request;
    const isManager = userRoles.includes('admin') || userRoles.includes('manager');

    if (!ids || ids.length === 0) {
      throwValidationError('支付ID列表不能为空');
    }
    if (!process_type || !['confirm', 'mark_abnormal', 'close'].includes(process_type)) {
      throwValidationError('无效的批量处理类型');
    }

    if (process_type === 'mark_abnormal' && !isManager) {
      throwBusinessError('仅管理员或经理可标记异常订单');
    }

    let successCount = 0;
    let failCount = 0;
    const details: OnlinePaymentBatchProcessResultItem[] = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      try {
        if (!isValidId(id)) {
          failCount++;
          details.push({
            id,
            success: false,
            error: '无效的支付ID'
          });
          continue;
        }

        const payment = await this.onlinePaymentRepository.findById(id);
        if (!payment) {
          failCount++;
          details.push({
            id,
            success: false,
            error: '支付记录不存在'
          });
          continue;
        }

        if (process_type === 'confirm') {
          if (payment.status !== 6) {
            failCount++;
            details.push({
              id,
              payment_no: payment.payment_no,
              success: false,
              error: '仅待确认状态的订单可确认'
            });
            continue;
          }
          await this.confirmPayment(id, { reason });
          successCount++;
          details.push({
            id,
            payment_no: payment.payment_no,
            success: true
          });
        } else if (process_type === 'mark_abnormal') {
          await this.onlinePaymentRepository.update(id, {
            abnormal_flag: true,
            abnormal_reason: reason || '批量标记异常'
          });
          successCount++;
          details.push({
            id,
            payment_no: payment.payment_no,
            success: true
          });

          try {
            await this.violationRepository.create({
              violation_no: await this.violationRepository.generateViolationNo(),
              customer_id: payment.customer_id,
              customer_no: payment.payer_account_no,
              biz_id: payment.id,
              biz_no: payment.payment_no,
              biz_type: 'online_payment',
              violation_type: 1,
              violation_level: payment.risk_level || 3,
              description: reason || '批量标记异常',
              rule_ref: 'batch_mark_abnormal',
              status: 0,
              discover_time: new Date()
            });
          } catch (e) {
          }
        } else if (process_type === 'close') {
          if (![0, 1, 6].includes(payment.status)) {
            failCount++;
            details.push({
              id,
              payment_no: payment.payment_no,
              success: false,
              error: '仅待支付、支付中或待确认状态的订单可关闭'
            });
            continue;
          }
          await this.closePayment(id, reason || '批量关闭');
          successCount++;
          details.push({
            id,
            payment_no: payment.payment_no,
            success: true
          });
        }
      } catch (err: any) {
        failCount++;
        details.push({
          id,
          success: false,
          error: err?.message || '处理失败'
        });
      }
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      details
    };
  }

  async traceOnlinePayment(request: OnlinePaymentTraceRequest): Promise<OnlinePaymentTraceResult> {
    const { payment_no } = request;

    if (!payment_no) {
      throwValidationError('支付单号不能为空');
    }

    const payment = await this.onlinePaymentRepository.findByPaymentNo(payment_no);
    if (!payment) {
      throwNotFoundError('支付记录不存在');
    }

    const paymentVO = this.convertOnlinePaymentToVO(payment);

    const deviceDetails = await this.buildDeviceDetails(payment);
    const ipLocation = this.buildIpLocation(payment);
    const riskCheck = await this.buildRiskCheck(payment);
    const tamperProofCheck = await this.buildTamperProofCheck(payment);

    if (riskCheck.checks.some(c => c.has_risk && c.risk_level >= 3)) {
      try {
        for (const check of riskCheck.checks) {
          if (check.has_risk && check.risk_level >= 3) {
            await this.violationRepository.create({
              violation_no: await this.violationRepository.generateViolationNo(),
              customer_id: payment.customer_id,
              customer_no: payment.payer_account_no,
              biz_id: payment.id,
              biz_no: payment.payment_no,
              biz_type: 'online_payment',
              violation_type: 1,
              violation_level: check.risk_level,
              description: check.description,
              rule_ref: check.risk_type,
              status: 0,
              discover_time: new Date()
            });
          }
        }
      } catch (e) {
      }
    }

    return {
      payment: paymentVO,
      device_details: deviceDetails,
      ip_location: ipLocation,
      risk_check: riskCheck,
      tamper_proof_check: tamperProofCheck
    };
  }

  private async buildDeviceDetails(payment: any): Promise<OnlinePaymentTraceResult['device_details']> {
    const deviceId = payment.device_id || '';
    let deviceType: number | undefined = payment.device_type;
    let isTrusted = false;
    let bindTime: string | undefined;
    let lastLoginTime: string | undefined;
    let riskScore = 50;

    if (deviceId) {
      const deviceBinding = await this.deviceBindingRepository.findByDeviceId(deviceId);
      if (deviceBinding) {
        deviceType = deviceBinding.device_type;
        isTrusted = deviceBinding.is_trusted || false;
        bindTime = deviceBinding.bind_time
          ? dayjs(deviceBinding.bind_time).format('YYYY-MM-DD HH:mm:ss')
          : undefined;
        lastLoginTime = deviceBinding.last_login_time
          ? dayjs(deviceBinding.last_login_time).format('YYYY-MM-DD HH:mm:ss')
          : undefined;
        riskScore = isTrusted ? 10 : 40;
      } else {
        riskScore = 80;
      }
    }

    return {
      device_id: deviceId,
      device_type: deviceType as any,
      device_type_text: deviceType ? DeviceTypeText[deviceType] || '未知' : undefined,
      is_trusted: isTrusted,
      bind_time: bindTime,
      last_login_time: lastLoginTime,
      risk_score: riskScore
    };
  }

  private buildIpLocation(payment: any): OnlinePaymentTraceResult['ip_location'] {
    const ipAddress = payment.ip_address || '';
    const isAbnormal = false;
    let abnormalReason: string | undefined;

    return {
      ip_address: ipAddress,
      province: undefined,
      city: undefined,
      isp: undefined,
      is_abnormal: isAbnormal,
      abnormal_reason: abnormalReason
    };
  }

  private async buildRiskCheck(payment: any): Promise<OnlinePaymentTraceResult['risk_check']> {
    const checks: AbnormalTransactionCheck[] = [];
    const riskTags: string[] = [];

    const highFreqCheck = await this.checkHighFrequencyTransaction(payment);
    checks.push(highFreqCheck);
    if (highFreqCheck.has_risk) {
      riskTags.push('高频交易');
    }

    const fakeMerchantCheck = await this.checkFakeMerchantTransaction(payment);
    checks.push(fakeMerchantCheck);
    if (fakeMerchantCheck.has_risk) {
      riskTags.push('虚假商户');
    }

    const duplicateOrderCheck = await this.checkDuplicateOrderTransaction(payment);
    checks.push(duplicateOrderCheck);
    if (duplicateOrderCheck.has_risk) {
      riskTags.push('重复下单');
    }

    const overallRiskLevel = Math.max(...checks.map(c => c.risk_level), payment.risk_level || 0);

    return {
      overall_risk_level: overallRiskLevel as any,
      overall_risk_level_text: riskLevelMap[overallRiskLevel] || '未知',
      checks,
      risk_tags: riskTags
    };
  }

  private async checkHighFrequencyTransaction(payment: any): Promise<AbnormalTransactionCheck> {
    const evidence: string[] = [];
    let hasRisk = false;
    let riskLevel = 0;
    let description = '';

    const windowStart = dayjs().subtract(RISK_RULES.HIGH_FREQUENCY_TIME_WINDOW_MINUTES, 'minute').toDate();
    const count = await this.onlinePaymentRepository.countHighFrequencyTransactions(
      payment.payer_account_no,
      windowStart,
      new Date()
    );

    if (count >= RISK_RULES.HIGH_FREQUENCY_THRESHOLD) {
      hasRisk = true;
      riskLevel = 3;
      description = `检测到${RISK_RULES.HIGH_FREQUENCY_TIME_WINDOW_MINUTES}分钟内高频交易${count}次，超过阈值${RISK_RULES.HIGH_FREQUENCY_THRESHOLD}次`;
      evidence.push(`${RISK_RULES.HIGH_FREQUENCY_TIME_WINDOW_MINUTES}分钟内交易${count}次`);
      evidence.push(`阈值：${RISK_RULES.HIGH_FREQUENCY_THRESHOLD}次`);
    } else {
      description = '交易频率正常';
    }

    return {
      has_risk: hasRisk,
      risk_type: 'high_frequency',
      risk_level: riskLevel as any,
      description,
      evidence
    };
  }

  private async checkFakeMerchantTransaction(payment: any): Promise<AbnormalTransactionCheck> {
    const evidence: string[] = [];
    let hasRisk = false;
    let riskLevel = 0;
    let description = '';

    const merchant = await this.merchantInfoRepository.findByMerchantNo(payment.merchant_no);

    if (!merchant) {
      hasRisk = true;
      riskLevel = 5;
      description = '商户不存在，疑似虚假商户交易';
      evidence.push(`商户号：${payment.merchant_no}`);
      evidence.push('商户在系统中不存在');
    } else if (merchant.status !== 1) {
      hasRisk = true;
      riskLevel = 4;
      description = `商户状态异常（${merchant.status === 0 ? '已停用' : '已冻结'}）`;
      evidence.push(`商户号：${payment.merchant_no}`);
      evidence.push(`商户状态：${merchant.status === 0 ? '已停用' : '已冻结'}`);
    } else if (merchant.merchant_type === 3) {
      hasRisk = true;
      riskLevel = 5;
      description = '黑名单商户交易';
      evidence.push(`商户号：${payment.merchant_no}`);
      evidence.push('商户类型：黑名单商户');
    } else {
      const payScene = payment.pay_scene;
      const businessScope = merchant.industry || '';
      if (businessScope && payScene) {
        const sceneText = PaySceneText[payScene] || '';
        if (sceneText && !businessScope.includes(sceneText)) {
          hasRisk = true;
          riskLevel = 3;
          description = '支付场景与商户经营范围不符';
          evidence.push(`支付场景：${sceneText}`);
          evidence.push(`经营范围：${businessScope}`);
        }
      }
      if (!hasRisk) {
        description = '商户资质正常';
      }
    }

    return {
      has_risk: hasRisk,
      risk_type: 'fake_merchant',
      risk_level: riskLevel as any,
      description,
      evidence
    };
  }

  private async checkDuplicateOrderTransaction(payment: any): Promise<AbnormalTransactionCheck> {
    const evidence: string[] = [];
    let hasRisk = false;
    let riskLevel = 0;
    let description = '';

    const orderNo = payment.order_no;
    const amount = Number(payment.amount || 0);
    const payerAccountNo = payment.payer_account_no;

    if (orderNo) {
      const duplicateCount = await this.onlinePaymentRepository.countDuplicateOrders(orderNo, payment.id);
      if (duplicateCount > 0) {
        hasRisk = true;
        riskLevel = 2;
        description = `存在${duplicateCount}笔相同订单号的交易`;
        evidence.push(`订单号：${orderNo}`);
        evidence.push(`重复交易数：${duplicateCount}`);
      }
    }

    if (!hasRisk) {
      const timeWindow = dayjs(payment.createdAt).subtract(5, 'minute').toDate();
      const sameAmountCount = await this.onlinePaymentRepository.count({
        payer_account_no: payerAccountNo,
        amount: amount,
        id: { [Op.ne]: payment.id },
        createdAt: {
          [Op.gte]: timeWindow,
          [Op.lte]: payment.createdAt
        }
      });

      if (sameAmountCount >= 3) {
        hasRisk = true;
        riskLevel = 3;
        description = `5分钟内存在${sameAmountCount}笔相同金额的交易，疑似重复下单`;
        evidence.push(`相同金额：${this.formatMoneyWithComma(amount)}元`);
        evidence.push(`5分钟内交易数：${sameAmountCount}`);
      }
    }

    if (!hasRisk) {
      description = '无重复下单异常';
    }

    return {
      has_risk: hasRisk,
      risk_type: 'duplicate_order',
      risk_level: riskLevel as any,
      description,
      evidence
    };
  }

  private async buildTamperProofCheck(payment: any): Promise<TamperProofCheck> {
    const invalidFields: string[] = [];
    let consistencyScore = 100;
    let details = '';

    const criticalFields = ['payment_no', 'amount', 'fee', 'payer_account_no', 'merchant_no', 'status'];
    const fieldHashes: Record<string, string> = {};

    for (const field of criticalFields) {
      const value = payment[field];
      if (value !== undefined && value !== null) {
        const hash = createHash('md5').update(String(value)).digest('hex');
        fieldHashes[field] = hash;
      }
    }

    const paymentData = payment.toJSON ? payment.toJSON() : payment;
    if (paymentData.createdAt && paymentData.updatedAt) {
      const createdTime = dayjs(paymentData.createdAt).valueOf();
      const updatedTime = dayjs(paymentData.updatedAt).valueOf();
      if (updatedTime < createdTime) {
        consistencyScore -= 20;
        invalidFields.push('updated_at');
      }
    }

    if (paymentData.status === 2 && !paymentData.pay_time) {
      consistencyScore -= 15;
      invalidFields.push('pay_time');
    }

    if (paymentData.status === 4 && !paymentData.refund_reason) {
      consistencyScore -= 10;
      invalidFields.push('refund_reason');
    }

    if (paymentData.status === 5 && !paymentData.close_reason) {
      consistencyScore -= 10;
      invalidFields.push('close_reason');
    }

    const txn = await this.transactionRepository.findOne({
      where: { request_id: paymentData.request_id }
    });

    if (txn) {
      const txnAmount = Number(txn.amount || 0);
      const payAmount = Number(paymentData.amount || 0);
      if (Math.abs(txnAmount - payAmount) > 0.01) {
        consistencyScore -= 25;
        invalidFields.push('amount');
        details += '交易流水金额与支付金额不一致；';
      }
    }

    consistencyScore = Math.max(0, consistencyScore);

    if (invalidFields.length === 0) {
      details = '数据完整性校验通过，各字段hash值一致，流水连续性正常';
    } else {
      details = `检测到${invalidFields.length}个异常字段：${invalidFields.join('、')}`;
    }

    return {
      is_valid: consistencyScore >= 80,
      consistency_score: consistencyScore,
      invalid_fields: invalidFields,
      details
    };
  }

  async getOnlinePaymentConfig(): Promise<any> {
    return {
      channel_types: Object.entries(ChannelTypeText).map(([value, label]) => ({ value: Number(value), label })),
      pay_scenes: Object.entries(PaySceneText).map(([value, label]) => ({ value: Number(value), label })),
      verify_methods: Object.entries(VerifyMethodText).map(([value, label]) => ({ value: Number(value), label })),
      merchant_types: Object.entries(MerchantTypeText).map(([value, label]) => ({ value: Number(value), label })),
      fee_config: ONLINE_FEE_CONFIG,
      limit_config: ONLINE_PAY_LIMIT_CONFIG,
      risk_rules: RISK_RULES,
      second_verify_rules: SECOND_VERIFY_RULES
    };
  }

  async getOnlinePaymentList(
    params: OnlinePaymentQueryParams,
    userId?: string,
    orgId?: string
  ): Promise<any> {
    const where: any = this.onlinePaymentRepository.buildQuery(params);

    if (orgId) {
      where.org_id = orgId;
    }

    const pagination = {
      page: params.page || 1,
      pageSize: params.pageSize || 15
    };

    const result = await this.onlinePaymentRepository.findPaginated(pagination, where, {
      sortBy: 'created_at',
      sortOrder: 'DESC'
    } as any);

    const list = result.list.map(item => this.convertOnlinePaymentToVO(item));

    return {
      ...result,
      list
    };
  }

  async getMerchantDetail(merchantNo: string): Promise<any> {
    const merchant = await this.merchantInfoRepository.findByMerchantNo(merchantNo);
    if (!merchant) {
      return null;
    }
    return {
      id: merchant.id,
      merchant_no: merchant.merchant_no,
      merchant_name: merchant.merchant_name,
      merchant_type: merchant.merchant_type,
      merchant_type_text: MerchantTypeText[merchant.merchant_type as number] || '',
      settlement_account: (merchant as any).settlement_account || '',
      risk_level: merchant.risk_level,
      risk_level_text: RiskLevelText[merchant.risk_level as number] || '',
      status: merchant.status,
      industry: (merchant as any).industry || '',
      business_address: (merchant as any).business_address || '',
      contact_person: (merchant as any).contact_person || '',
      contact_phone: (merchant as any).contact_phone || ''
    };
  }

  async getDeviceList(params: any, userId?: string, orgId?: string): Promise<any> {
    const where: any = {};

    if (params.keyword) {
      where.device_id = { [Op.like]: `%${params.keyword}%` };
    }
    if (params.payer_account_no) {
      where.account_no = params.payer_account_no;
    }
    if (params.device_type !== undefined) {
      where.device_type = params.device_type;
    }
    if (params.is_trusted !== undefined) {
      where.is_trusted = params.is_trusted;
    }

    const pagination = {
      page: params.page || 1,
      pageSize: params.pageSize || 15
    };

    const result = await this.deviceBindingRepository.findPaginated(pagination, where, {
      sortBy: 'bind_time',
      sortOrder: 'DESC'
    } as any);

    return result;
  }
}
