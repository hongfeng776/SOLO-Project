import { LoanRepaymentRepository } from '../repositories/LoanRepaymentRepository';
import { LoanRepository } from '../repositories/LoanRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import {
  LoanTypeText,
  LoanTermText,
  LoanStatusText,
  RepaymentMethodText
} from '../types/loan';
import {
  RepaymentTypeText,
  RepaymentStatusText,
  RepaymentChannelText,
  WithholdStatusText,
  PREPAYMENT_PENALTY_RATE,
  OVERDUE_DAILY_RATE,
  MIN_OVERDUE_FINE,
  MAX_OVERDUE_FINE_RATE,
  REPAYMENT_AMOUNT_TOLERANCE,
  type RepaymentPreCheckResult,
  type RepaymentBillVO,
  type RepaymentDetailVO,
  type DoRepaymentRequest,
  type DoRepaymentResult,
  type BatchWithholdQueryParams,
  type BatchWithholdItem,
  type BatchWithholdRequest,
  type BatchWithholdResult,
  type RepaymentLogVO,
  type RepaymentTraceRequest,
  type RepaymentTraceResult
} from '../types/loanRepayment';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError,
  throwForbiddenError
} from '../utils/error';
import { isValidId } from '../utils/validate';
import { sequelize } from '../config/database';
import { Transaction } from 'sequelize';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export class LoanRepaymentService {
  private repaymentRepository: LoanRepaymentRepository;
  private loanRepository: LoanRepository;
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.repaymentRepository = new LoanRepaymentRepository();
    this.loanRepository = new LoanRepository();
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
  }

  async preCheckRepayment(
    loanId: string,
    accountId?: string,
    repaymentType?: number
  ): Promise<RepaymentPreCheckResult> {
    if (!isValidId(loanId)) {
      throwValidationError('无效的贷款ID');
    }

    const loan = await this.loanRepository.findById(loanId, {
      include: [
        this.loanRepository.getCustomerInclude(),
        this.loanRepository.getProductInclude()
      ]
    });

    if (!loan) {
      throwNotFoundError('贷款不存在');
    }

    const loanStatusValid = loan.status === 7;
    const warnings: string[] = [];

    const bills = this.generateRepaymentBills(loan);
    const currentBill = bills.find(b => b.status === 0 || b.status === 1) || bills[0];

    const dueDate = currentBill?.due_date || '';
    const dueAmount = currentBill?.total_amount || 0;
    const currentPeriod = currentBill?.period_no || 1;
    const totalPeriods = loan.term;

    const today = dayjs();
    const dueDay = dayjs(dueDate);
    const overdueDays = today.isAfter(dueDay) ? today.diff(dueDay, 'day') : 0;
    const overdueAmount = this.calculateOverdueFine(dueAmount, overdueDays);

    let balanceSufficient = true;
    let accountStatusValid = true;
    let withholdAgreementValid = true;

    let account: any = null;
    if (accountId) {
      account = await this.accountRepository.findById(accountId);
      if (account) {
        accountStatusValid = account.status === 1;
        balanceSufficient = Number(account.available_balance) >= dueAmount + overdueAmount;
        withholdAgreementValid = true;
      } else {
        accountStatusValid = false;
        balanceSufficient = false;
      }
    }

    const totalRepaid = await this.repaymentRepository.getTotalRepaidAmount(loanId);
    const remainingPrincipal = Number(loan.amount) - totalRepaid.total_principal;

    const canRepay = loanStatusValid && accountStatusValid && currentPeriod <= totalPeriods;

    let blockReason: string | undefined;
    if (!loanStatusValid) {
      blockReason = `贷款状态异常：${LoanStatusText[loan.status as keyof typeof LoanStatusText] || '未知'}`;
    } else if (currentPeriod > totalPeriods) {
      blockReason = '贷款已结清，无需还款';
    }

    if (!balanceSufficient && accountId) {
      warnings.push('账户余额不足，请先充值');
    }

    return {
      can_repay: canRepay,
      loan_status_valid: loanStatusValid,
      account_status_valid: accountStatusValid,
      balance_sufficient: balanceSufficient,
      withhold_agreement_valid: withholdAgreementValid,
      due_date_valid: dayjs().isBefore(dueDay) || overdueDays >= 0,
      current_period: currentPeriod,
      total_periods: totalPeriods,
      due_amount: dueAmount,
      due_date: dueDate,
      remaining_principal: remainingPrincipal,
      overdue_days: overdueDays,
      overdue_amount: overdueAmount,
      block_reason: blockReason,
      warnings
    };
  }

  async getRepaymentDetail(loanId: string, accountId?: string): Promise<RepaymentDetailVO> {
    const preCheck = await this.preCheckRepayment(loanId, accountId);

    const loan = await this.loanRepository.findById(loanId, {
      include: [
        this.loanRepository.getCustomerInclude(),
        this.loanRepository.getProductInclude(),
        this.loanRepository.getOrganizationInclude()
      ]
    });

    if (!loan) {
      throwNotFoundError('贷款不存在');
    }

    const customer = loan.customer;
    const bills = this.generateRepaymentBills(loan);
    const currentBill = bills.find(b => b.status === 0 || b.status === 1);
    const totalRepaid = await this.repaymentRepository.getTotalRepaidAmount(loanId);
    const remainingPrincipal = Number(loan.amount) - totalRepaid.total_principal;

    const settlementProgress = Math.round((totalRepaid.total_principal / Number(loan.amount)) * 100);

    let accountNo = '';
    let accountBalance = 0;
    if (accountId) {
      const account = await this.accountRepository.findById(accountId);
      if (account) {
        accountNo = account.account_no;
        accountBalance = Number(account.available_balance);
      }
    }

    const overdueDays = preCheck.overdue_days;
    const hasOverdue = overdueDays > 0;
    const canPrepay = loan.status === 7 && remainingPrincipal > 0;
    const prepaymentPenalty = remainingPrincipal * PREPAYMENT_PENALTY_RATE;

    return {
      loan_id: loan.id,
      loan_no: loan.loan_no,
      customer_name: loan.customer_name || customer?.customer_name || '',
      id_card_no: loan.id_card_no || customer?.id_card_no || '',
      loan_type: loan.loan_type,
      loan_type_text: LoanTypeText[loan.loan_type] || '未知',
      loan_amount: Number(loan.amount),
      loan_term: loan.term,
      loan_term_text: LoanTermText[loan.term as keyof typeof LoanTermText] || `${loan.term}个月`,
      interest_rate: Number(loan.interest_rate),
      repayment_method: loan.repayment_method,
      repayment_method_text: RepaymentMethodText[loan.repayment_method] || '未知',
      loan_status: loan.status,
      loan_status_text: LoanStatusText[loan.status as keyof typeof LoanStatusText] || '未知',
      disburse_date: loan.disburse_time ? dayjs(loan.disburse_time).format('YYYY-MM-DD') : '',
      remaining_principal: remainingPrincipal,
      total_repaid_principal: totalRepaid.total_principal,
      total_repaid_interest: totalRepaid.total_interest,
      total_repaid_amount: totalRepaid.total_amount,
      current_period: preCheck.current_period,
      total_periods: preCheck.total_periods,
      current_bill: currentBill,
      overdue_days: overdueDays,
      overdue_amount: preCheck.overdue_amount,
      next_due_date: currentBill?.due_date || '',
      next_due_amount: currentBill?.total_amount || 0,
      can_prepay: canPrepay,
      prepayment_penalty: prepaymentPenalty,
      account_no: accountNo,
      account_balance: accountBalance,
      withhold_agreement_valid: preCheck.withhold_agreement_valid,
      settlement_progress: settlementProgress,
      credit_report_status: hasOverdue ? 2 : 1,
      credit_report_status_text: hasOverdue ? '逾期上报' : '正常',
      bills: bills.slice(0, 12)
    };
  }

  async doRepayment(
    request: DoRepaymentRequest,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string
  ): Promise<DoRepaymentResult> {
    const { loan_id, repayment_type, repayment_channel, amount, period_no, account_id } = request;

    if (!isValidId(loan_id)) {
      throwValidationError('无效的贷款ID');
    }

    if (!amount || amount <= 0) {
      throwValidationError('还款金额必须大于0');
    }

    const preCheck = await this.preCheckRepayment(loan_id, account_id, repayment_type);

    if (!preCheck.can_repay) {
      throwBusinessError(preCheck.block_reason || '当前无法还款');
    }

    if (!preCheck.balance_sufficient && account_id) {
      throwBusinessError('账户余额不足，请先充值后再还款');
    }

    const loan = await this.loanRepository.findById(loan_id);
    if (!loan) {
      throwNotFoundError('贷款不存在');
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      const bills = this.generateRepaymentBills(loan);
      const targetPeriod = period_no || preCheck.current_period;
      const currentBill = bills.find(b => b.period_no === targetPeriod);

      if (!currentBill) {
        throwBusinessError('找不到对应的还款账单');
      }

      let principal = 0;
      let interest = 0;
      let penalty = 0;
      let fee = 0;

      if (repayment_type === 1) {
        principal = currentBill.principal;
        interest = currentBill.interest;
      } else if (repayment_type === 2) {
        const remainingPrincipal = preCheck.remaining_principal;
        principal = amount >= remainingPrincipal ? remainingPrincipal : amount;
        interest = 0;
        penalty = principal * PREPAYMENT_PENALTY_RATE;
      } else if (repayment_type === 3) {
        principal = currentBill.principal;
        interest = currentBill.interest;
        penalty = preCheck.overdue_amount;
      } else if (repayment_type === 4) {
        principal = currentBill.principal;
        interest = currentBill.interest;
      }

      const totalPayable = principal + interest + penalty + fee;

      if (Math.abs(amount - totalPayable) > REPAYMENT_AMOUNT_TOLERANCE && repayment_type !== 2) {
        throwBusinessError(`还款金额不匹配，应还${totalPayable.toFixed(2)}元`);
      }

      let account: any = null;
      let beforeBalance = 0;
      let afterBalance = 0;

      if (account_id) {
        account = await this.accountRepository.findById(account_id);
        if (!account) {
          throwBusinessError('还款账户不存在');
        }
        if (account.status !== 1) {
          throwBusinessError('账户状态异常，无法扣款');
        }
        beforeBalance = Number(account.available_balance);
        if (beforeBalance < amount) {
          throwBusinessError('账户余额不足');
        }
        afterBalance = beforeBalance - amount;

        await this.accountRepository.update(
          account_id,
          {
            balance: Number(account.balance) - amount,
            available_balance: afterBalance
          },
          { transaction }
        );
      }

      const repayment = await this.repaymentRepository.create(
        {
          loan_id,
          loan_no: loan.loan_no,
          customer_id: loan.customer_id,
          customer_name: loan.customer_name || '',
          id_card_no: loan.id_card_no,
          repayment_type,
          repayment_channel,
          period_no: targetPeriod,
          total_periods: loan.term,
          amount,
          principal,
          interest,
          penalty,
          fee,
          status: 2,
          account_id,
          account_no: account?.account_no,
          repay_time: new Date(),
          operator_id: operatorId,
          operator_name: operatorName,
          before_balance: beforeBalance,
          after_balance: afterBalance,
          remaining_principal: preCheck.remaining_principal - principal,
          remaining_periods: preCheck.total_periods - targetPeriod,
          bill_matched: 1,
          bill_match_result: '账单匹配成功',
          abnormal_flag: 0,
          need_review: 0,
          fund_flow: `${account?.account_no || '账户'} → 贷款专户`,
          ip_address: ipAddress,
          request_snapshot: JSON.stringify(request),
          remark: request.remark
        },
        { transaction }
      );

      const totalRepaid = await this.repaymentRepository.getTotalRepaidAmount(loan_id);
      const newRemainingPrincipal = Number(loan.amount) - totalRepaid.total_principal - principal;
      const isSettled = newRemainingPrincipal <= 0.01;

      let newStatus = loan.status;
      if (isSettled) {
        newStatus = 9;
      }

      if (isSettled || newStatus !== loan.status) {
        await this.loanRepository.update(
          loan_id,
          {
            status: newStatus
          },
          { transaction }
        );
      }

      await transaction.commit();

      const settlementProgress = Math.round(
        ((totalRepaid.total_principal + principal) / Number(loan.amount)) * 100
      );

      return {
        success: true,
        repayment_id: repayment.id,
        loan_id,
        loan_no: loan.loan_no,
        repayment_type,
        repayment_type_text: RepaymentTypeText[repayment_type] || '未知',
        amount,
        principal,
        interest,
        penalty,
        fee,
        status: 2,
        status_text: RepaymentStatusText[2],
        repayment_time: dayjs(repayment.repay_time).format('YYYY-MM-DD HH:mm:ss'),
        remaining_principal: Math.max(0, newRemainingPrincipal),
        remaining_periods: Math.max(0, preCheck.total_periods - targetPeriod),
        settlement_progress: Math.min(100, settlementProgress),
        is_settled: isSettled,
        message: isSettled ? '贷款已全部结清' : '还款成功',
        transaction_no: repayment.transaction_no
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getWithholdList(
    params: BatchWithholdQueryParams,
    orgId?: string
  ): Promise<{ list: BatchWithholdItem[]; total: number; page: number; pageSize: number }> {
    const result: any = await this.repaymentRepository['withholdRepository'].findPaginated(
      { page: params.page, pageSize: params.pageSize },
      this.repaymentRepository.buildWithholdQuery(params),
      { sortBy: 'repayment_priority', sortOrder: 'DESC' }
    );

    const items: BatchWithholdItem[] = [];
    for (const withhold of result.list) {
      let canWithhold = true;
      let cannotReason: string | undefined;

      if (withhold.status !== 0) {
        canWithhold = false;
        cannotReason = `当前状态：${WithholdStatusText[withhold.status as keyof typeof WithholdStatusText]}`;
      } else if (withhold.withhold_agreement_valid === 0) {
        canWithhold = false;
        cannotReason = '代扣协议已失效';
      } else if (withhold.account_balance && Number(withhold.account_balance) < Number(withhold.due_amount)) {
        canWithhold = false;
        cannotReason = '账户余额不足';
      }

      items.push({
        id: withhold.id,
        loan_id: withhold.loan_id,
        loan_no: withhold.loan_no,
        customer_id: withhold.customer_id,
        customer_name: withhold.customer_name,
        id_card_no: withhold.id_card_no || '',
        loan_type: withhold.loan_type || 1,
        loan_type_text: LoanTypeText[withhold.loan_type || 1] || '未知',
        loan_amount: Number(withhold.due_amount),
        due_amount: Number(withhold.due_amount),
        due_date: dayjs(withhold.due_date).format('YYYY-MM-DD'),
        period_no: withhold.period_no,
        total_periods: withhold.total_periods || 12,
        overdue_days: withhold.overdue_days || 0,
        is_overdue: withhold.is_overdue === 1,
        repayment_priority: withhold.repayment_priority,
        account_id: withhold.account_id,
        account_no: withhold.account_no,
        account_balance: Number(withhold.account_balance || 0),
        balance_sufficient: Number(withhold.account_balance || 0) >= Number(withhold.due_amount),
        withhold_agreement_valid: withhold.withhold_agreement_valid === 1,
        status: withhold.status,
        status_text: WithholdStatusText[withhold.status as keyof typeof WithholdStatusText] || '未知',
        can_withhold: canWithhold,
        cannot_reason: cannotReason
      });
    }

    return { ...result, list: items };
  }

  async batchWithhold(
    request: BatchWithholdRequest,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string
  ): Promise<BatchWithholdResult> {
    const { items } = request;

    if (items.length === 0) {
      throwValidationError('请选择至少一条代扣记录');
    }

    let successCount = 0;
    let failCount = 0;
    let totalSuccessAmount = 0;
    let totalFailAmount = 0;
    const details: BatchWithholdResult['details'] = [];
    const abnormalList: BatchWithholdResult['abnormal_list'] = [];

    for (const item of items) {
      try {
        const withhold: any = await this.repaymentRepository['withholdRepository'].findById(item.loan_id);

        if (!withhold) {
          failCount++;
          totalFailAmount += item.due_amount;
          abnormalList.push({
            loan_id: item.loan_id,
            loan_no: '',
            customer_name: '',
            due_amount: item.due_amount,
            abnormal_type: 'not_found',
            abnormal_reason: '代扣记录不存在'
          });
          details.push({
            loan_id: item.loan_id,
            loan_no: '',
            customer_name: '',
            due_amount: item.due_amount,
            success: false,
            status: 3,
            message: '代扣记录不存在'
          });
          continue;
        }

        if (withhold.status !== 0) {
          failCount++;
          totalFailAmount += Number(withhold.due_amount);
          details.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: Number(withhold.due_amount),
            success: false,
            status: withhold.status,
            message: `当前状态：${WithholdStatusText[withhold.status as keyof typeof WithholdStatusText]}`
          });
          continue;
        }

        const account: any = await this.accountRepository.findById(withhold.account_id);
        if (!account || account.status !== 1) {
          failCount++;
          totalFailAmount += Number(withhold.due_amount);
          abnormalList.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: Number(withhold.due_amount),
            abnormal_type: 'account_error',
            abnormal_reason: '账户状态异常'
          });
          details.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: Number(withhold.due_amount),
            success: false,
            status: 3,
            message: '账户状态异常'
          });
          continue;
        }

        const dueAmount = Number(withhold.due_amount);
        const balance = Number(account.available_balance);

        if (balance < dueAmount) {
          failCount++;
          totalFailAmount += dueAmount;
          await this.repaymentRepository['withholdRepository'].update(withhold.id, {
            status: 3,
            fail_reason: '账户余额不足',
            retry_count: (withhold.retry_count || 0) + 1
          });
          abnormalList.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: dueAmount,
            abnormal_type: 'insufficient_balance',
            abnormal_reason: '账户余额不足'
          });
          details.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: dueAmount,
            success: false,
            status: 3,
            message: '账户余额不足'
          });
          continue;
        }

        const transaction: Transaction = await sequelize.transaction();

        try {
          const beforeBalance = balance;
          const afterBalance = balance - dueAmount;

          await this.accountRepository.update(
            account.id,
            {
              balance: Number(account.balance) - dueAmount,
              available_balance: afterBalance
            },
            { transaction }
          );

          await this.repaymentRepository.create(
            {
              loan_id: withhold.loan_id,
              loan_no: withhold.loan_no,
              customer_id: withhold.customer_id,
              customer_name: withhold.customer_name,
              id_card_no: withhold.id_card_no,
              repayment_type: withhold.is_overdue ? 3 : 1,
              repayment_channel: 'auto_withhold',
              period_no: withhold.period_no,
              total_periods: withhold.total_periods,
              amount: dueAmount,
              principal: dueAmount * 0.7,
              interest: dueAmount * 0.3,
              penalty: 0,
              fee: 0,
              status: 2,
              account_id: account.id,
              account_no: account.account_no,
              repay_time: new Date(),
              operator_id: operatorId,
              operator_name: operatorName,
              before_balance: beforeBalance,
              after_balance: afterBalance,
              bill_matched: 1,
              bill_match_result: '批量代扣匹配成功',
              abnormal_flag: 0,
              need_review: 0,
              fund_flow: `${account.account_no} → 贷款专户`,
              ip_address: ipAddress
            },
            { transaction }
          );

          await this.repaymentRepository['withholdRepository'].update(
            withhold.id,
            {
              status: 2,
              actual_amount: dueAmount,
              actual_date: new Date(),
              transaction_no: `TX${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 10000)}`
            },
            { transaction }
          );

          await transaction.commit();

          successCount++;
          totalSuccessAmount += dueAmount;
          details.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: dueAmount,
            success: true,
            status: 2,
            message: '代扣成功',
            transaction_no: withhold.transaction_no
          });
        } catch (e) {
          await transaction.rollback();
          failCount++;
          totalFailAmount += dueAmount;
          details.push({
            loan_id: withhold.loan_id,
            loan_no: withhold.loan_no,
            customer_name: withhold.customer_name,
            due_amount: dueAmount,
            success: false,
            status: 3,
            message: '系统处理异常'
          });
        }
      } catch (e: any) {
        failCount++;
        totalFailAmount += item.due_amount;
        details.push({
          loan_id: item.loan_id,
          loan_no: '',
          customer_name: '',
          due_amount: item.due_amount,
          success: false,
          status: 3,
          message: e.message || '处理异常'
        });
      }
    }

    return {
      total_count: items.length,
      success_count: successCount,
      fail_count: failCount,
      total_success_amount: totalSuccessAmount,
      total_fail_amount: totalFailAmount,
      details,
      abnormal_list: abnormalList
    };
  }

  async traceRepayment(
    request: RepaymentTraceRequest,
    operatorId?: string
  ): Promise<RepaymentTraceResult> {
    if (!request.loan_id && !request.loan_no && !request.repayment_id && !request.transaction_no) {
      throwValidationError('请提供贷款ID、贷款编号、还款ID或交易流水号');
    }

    let loanId = request.loan_id;
    let loanNo = request.loan_no;

    if (!loanId && loanNo) {
      const loan = await this.loanRepository.findByLoanNo(loanNo);
      if (loan) {
        loanId = loan.id;
        loanNo = loan.loan_no;
      }
    } else if (loanId && !loanNo) {
      const loan = await this.loanRepository.findById(loanId);
      if (loan) {
        loanNo = loan.loan_no;
      }
    }

    let repayments: any[] = [];

    if (request.repayment_id) {
      const repayment = await this.repaymentRepository.findById(request.repayment_id);
      if (repayment) {
        repayments = [repayment];
        loanId = repayment.loan_id;
        loanNo = repayment.loan_no;
      }
    } else if (request.transaction_no) {
      const repayment = await this.repaymentRepository.findByTransactionNo(request.transaction_no);
      if (repayment) {
        repayments = [repayment];
        loanId = repayment.loan_id;
        loanNo = repayment.loan_no;
      }
    } else if (loanId) {
      repayments = await this.repaymentRepository.findByLoanId(loanId);
    }

    const logVOs: RepaymentLogVO[] = repayments.map((log) => ({
      id: log.id,
      loan_id: log.loan_id,
      loan_no: log.loan_no,
      repayment_id: log.repayment_no,
      period_no: log.period_no,
      repayment_type: log.repayment_type,
      repayment_type_text: RepaymentTypeText[log.repayment_type] || '未知',
      repayment_channel: log.repayment_channel,
      repayment_channel_text: RepaymentChannelText[log.repayment_channel] || '未知',
      amount: Number(log.amount),
      principal: Number(log.principal),
      interest: Number(log.interest),
      penalty: Number(log.penalty),
      fee: Number(log.fee),
      status: log.status,
      status_text: RepaymentStatusText[log.status as keyof typeof RepaymentStatusText] || '未知',
      operator_id: log.operator_id,
      operator_name: log.operator_name,
      operation_time: log.repay_time
        ? dayjs(log.repay_time).format('YYYY-MM-DD HH:mm:ss')
        : dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      account_id: log.account_id,
      account_no: log.account_no,
      transaction_no: log.transaction_no,
      before_balance: log.before_balance ? Number(log.before_balance) : undefined,
      after_balance: log.after_balance ? Number(log.after_balance) : undefined,
      fund_flow: log.fund_flow || '账户 → 贷款专户',
      bill_matched: log.bill_matched,
      bill_match_result: log.bill_match_result,
      abnormal_flag: log.abnormal_flag,
      abnormal_type: log.abnormal_type,
      abnormal_reason: log.abnormal_reason,
      need_review: log.need_review,
      review_status: log.review_status,
      ip_address: log.ip_address,
      request_snapshot: log.request_snapshot
    }));

    const duplicateRecords: string[] = [];
    const seen = new Map<string, number>();
    for (const log of repayments) {
      if (log.status === 2) {
        const key = `${log.loan_id}_${log.amount}_${dayjs(log.repay_time).format('YYYYMMDD')}`;
        const count = (seen.get(key) || 0) + 1;
        seen.set(key, count);
        if (count > 1) {
          duplicateRecords.push(`${log.repayment_no} - ${dayjs(log.repay_time).format('YYYY-MM-DD')} - ${log.amount}元`);
        }
      }
    }

    const abnormalAmountItems: string[] = [];
    const loan = loanId ? await this.loanRepository.findById(loanId) : null;
    if (loan) {
      const monthlyPayment = Number(loan.monthly_payment) || 0;
      for (const log of repayments) {
        if (log.status === 2 && log.repayment_type === 1) {
          const diff = Math.abs(Number(log.amount) - monthlyPayment);
          if (diff > monthlyPayment * 0.5 && monthlyPayment > 0) {
            abnormalAmountItems.push(
              `${log.repayment_no} - 应还${monthlyPayment.toFixed(2)}元，实还${log.amount}元`
            );
          }
        }
      }
    }

    const unmatchedItems: string[] = [];
    for (const log of repayments) {
      if (log.bill_matched === 0) {
        unmatchedItems.push(`${log.repayment_no} - ${log.bill_match_result || '账单不匹配'}`);
      }
    }

    const inconsistentItems: string[] = [];
    if (loan) {
      const totalRepaid = repayments
        .filter((r) => r.status === 2)
        .reduce((sum, r) => sum + Number(r.principal), 0);
      const expectedRemaining = Number(loan.amount) - totalRepaid;
      const latestRepayment = repayments.find((r) => r.status === 2);
      if (latestRepayment && latestRepayment.remaining_principal !== undefined) {
        const diff = Math.abs(expectedRemaining - Number(latestRepayment.remaining_principal));
        if (diff > 0.01) {
          inconsistentItems.push(
            `台账剩余本金${expectedRemaining.toFixed(2)}元，还款记录剩余${Number(latestRepayment.remaining_principal).toFixed(2)}元`
          );
        }
      }
    }

    const abnormalItems: string[] = [];
    let needReviewCount = 0;
    for (const log of repayments) {
      if (log.abnormal_flag === 1) {
        abnormalItems.push(`${log.repayment_no} - ${log.abnormal_reason || '异常还款'}`);
      }
      if (log.need_review === 1) {
        needReviewCount++;
      }
    }

    const totalRepaymentAmount = repayments
      .filter((r) => r.status === 2)
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPrincipalPaid = repayments
      .filter((r) => r.status === 2)
      .reduce((sum, r) => sum + Number(r.principal), 0);
    const totalInterestPaid = repayments
      .filter((r) => r.status === 2)
      .reduce((sum, r) => sum + Number(r.interest), 0);
    const totalPenaltyPaid = repayments
      .filter((r) => r.status === 2)
      .reduce((sum, r) => sum + Number(r.penalty), 0);

    return {
      loan_id: loanId || '',
      loan_no: loanNo || '',
      total_repayment_count: repayments.filter((r) => r.status === 2).length,
      total_repayment_amount: totalRepaymentAmount,
      total_principal_paid: totalPrincipalPaid,
      total_interest_paid: totalInterestPaid,
      total_penalty_paid: totalPenaltyPaid,
      repayment_records: logVOs,
      duplicate_check: {
        has_duplicate: duplicateRecords.length > 0,
        duplicate_count: duplicateRecords.length,
        duplicate_records: duplicateRecords
      },
      amount_check: {
        passed: abnormalAmountItems.length === 0,
        abnormal_amount_count: abnormalAmountItems.length,
        abnormal_items: abnormalAmountItems
      },
      bill_match_check: {
        passed: unmatchedItems.length === 0,
        unmatched_count: unmatchedItems.length,
        unmatched_items: unmatchedItems
      },
      consistency_check: {
        passed: inconsistentItems.length === 0,
        inconsistent_count: inconsistentItems.length,
        inconsistent_items: inconsistentItems
      },
      abnormal_review: {
        has_abnormal: abnormalItems.length > 0 || needReviewCount > 0,
        abnormal_count: abnormalItems.length,
        need_review_count: needReviewCount,
        abnormal_items: abnormalItems
      }
    };
  }

  private generateRepaymentBills(loan: any): RepaymentBillVO[] {
    const bills: RepaymentBillVO[] = [];
    const totalAmount = Number(loan.amount);
    const term = loan.term;
    const rate = Number(loan.interest_rate) / 100 / 12;
    const repaymentMethod = loan.repayment_method;

    let disburseDate = loan.disburse_time ? dayjs(loan.disburse_time) : dayjs();

    for (let i = 1; i <= term; i++) {
      let principal = 0;
      let interest = 0;

      if (repaymentMethod === 1) {
        const monthlyPayment = (totalAmount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
        const remainingPrincipal = totalAmount * Math.pow(1 + rate, i - 1) - monthlyPayment * (Math.pow(1 + rate, i - 1) - 1) / rate;
        interest = remainingPrincipal * rate;
        principal = monthlyPayment - interest;
      } else if (repaymentMethod === 2) {
        principal = totalAmount / term;
        const remainingPrincipal = totalAmount - principal * (i - 1);
        interest = remainingPrincipal * rate;
      } else if (repaymentMethod === 3) {
        interest = totalAmount * rate;
        principal = i === term ? totalAmount : 0;
      } else if (repaymentMethod === 4) {
        principal = i === term ? totalAmount : 0;
        interest = i === term ? totalAmount * rate * term : 0;
      }

      const totalAmountPerMonth = principal + interest;
      const dueDate = disburseDate.add(i, 'month').format('YYYY-MM-DD');

      bills.push({
        id: `bill_${i}`,
        loan_id: loan.id,
        loan_no: loan.loan_no,
        period_no: i,
        total_periods: term,
        bill_date: disburseDate.add(i - 1, 'month').format('YYYY-MM-DD'),
        due_date: dueDate,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        total_amount: Math.round(totalAmountPerMonth * 100) / 100,
        paid_amount: 0,
        remaining_amount: Math.round(totalAmountPerMonth * 100) / 100,
        status: 0,
        status_text: '待还款',
        is_overdue: false,
        overdue_days: 0,
        overdue_fine: 0
      });
    }

    return bills;
  }

  private calculateOverdueFine(dueAmount: number, overdueDays: number): number {
    if (overdueDays <= 0) return 0;
    const fine = dueAmount * OVERDUE_DAILY_RATE * overdueDays;
    const maxFine = dueAmount * MAX_OVERDUE_FINE_RATE;
    return Math.min(Math.max(fine, MIN_OVERDUE_FINE), maxFine);
  }

  async generateWithholdRecords(): Promise<number> {
    const loans: any = await this.loanRepository.findByWhere({ status: 7 });

    let count = 0;
    const batchNo = `DK${dayjs().format('YYYYMMDDHHmmss')}`;

    for (const loan of loans) {
      const bills = this.generateRepaymentBills(loan);
      const currentBill = bills.find(b => b.status === 0);

      if (!currentBill) continue;

      const dueDate = dayjs(currentBill.due_date);
      const today = dayjs();

      if (dueDate.diff(today, 'day') > 3) continue;

      const customer = await this.customerRepository.findById(loan.customer_id);
      const accounts: any = customer
        ? await this.accountRepository.findByWhere({ customer_id: loan.customer_id, status: 1 })
        : [];

      if (accounts.length === 0) continue;

      const account = accounts[0];
      const isOverdue = today.isAfter(dueDate);
      const overdueDays = isOverdue ? today.diff(dueDate, 'day') : 0;
      const priority = isOverdue ? 5 : 1;

      await this.repaymentRepository.createWithhold({
        batch_no: batchNo,
        loan_id: loan.id,
        loan_no: loan.loan_no,
        customer_id: loan.customer_id,
        customer_name: loan.customer_name || customer?.customer_name || '',
        account_id: account.id,
        account_no: account.account_no,
        due_amount: currentBill.total_amount,
        due_date: dueDate.toDate(),
        period_no: currentBill.period_no,
        total_periods: loan.term,
        status: 0,
        repayment_priority: priority,
        is_overdue: isOverdue ? 1 : 0,
        overdue_days: overdueDays,
        loan_type: loan.loan_type,
        account_balance: Number(account.available_balance),
        withhold_agreement_valid: 1,
        retry_count: 0
      });

      count++;
    }

    return count;
  }
}
