import { LoanApprovalRepository } from '../repositories/LoanApprovalRepository';
import { LoanRepository } from '../repositories/LoanRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import {
  LoanTypeText,
  LoanTermText,
  RepaymentMethodText,
  LoanPurposeText,
  LoanStatusText,
  LARGE_LOAN_THRESHOLD
} from '../types/loan';
import {
  HIGH_RISK_LEVEL_THRESHOLD,
  SINGLE_LEVEL_APPROVAL_THRESHOLD,
  type ApprovalPreCheckResult,
  type MaterialCheckItem,
  type CreditReport,
  type DebtData,
  type PreApprovalConclusion,
  type ApprovalDetailVO,
  type ApprovalFlowVO,
  type ApprovalLogVO,
  type DoApprovalRequest,
  type DoApprovalResult,
  type BatchApprovalQueryParams,
  type BatchApprovalItem,
  type BatchApprovalRequest,
  type BatchApprovalResult,
  type ApprovalTraceRequest,
  type ApprovalTraceResult,
  type GenerateContractResult
} from '../types/loanApproval';
import {
  ApprovalLevelText,
  ApprovalResultText,
  ApprovalStatusText,
  APPROVAL_LEVEL_CONFIG
} from '../types/loanApproval';
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

export class LoanApprovalService {
  private approvalRepository: LoanApprovalRepository;
  private loanRepository: LoanRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.approvalRepository = new LoanApprovalRepository();
    this.loanRepository = new LoanRepository();
    this.customerRepository = new CustomerRepository();
  }

  async preCheckApproval(
    loanId: string,
    operatorId?: string
  ): Promise<ApprovalPreCheckResult> {
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
      throwNotFoundError('贷款申请不存在');
    }

    const hasApplicationSubmitted = loan.status >= 1;
    const hasPreApprovalPassed = loan.status === 2 || loan.status >= 4;

    const materialChecks = this.checkMaterials(loan);
    const hasMaterialsComplete = materialChecks.every((m) => m.has_value || !m.required);
    const abnormalFields = materialChecks.filter((m) => m.is_abnormal).map((m) => m.field);
    const missingMaterials = materialChecks.filter((m) => m.required && !m.has_value).map((m) => m.name);

    const canEnter = hasApplicationSubmitted && hasPreApprovalPassed && hasMaterialsComplete && abnormalFields.length === 0;

    let blockReason: string | undefined;
    if (!hasApplicationSubmitted) {
      blockReason = '贷款申请尚未提交';
    } else if (!hasPreApprovalPassed) {
      blockReason = '贷款预审尚未通过';
    } else if (!hasMaterialsComplete) {
      blockReason = `贷款资料不完整，缺失：${missingMaterials.join('、')}`;
    } else if (abnormalFields.length > 0) {
      blockReason = `存在异常字段：${abnormalFields.join('、')}`;
    }

    return {
      can_enter: canEnter,
      has_application_submitted: hasApplicationSubmitted,
      has_pre_approval_passed: hasPreApprovalPassed,
      has_materials_complete: hasMaterialsComplete,
      block_reason: blockReason,
      material_checks: materialChecks,
      abnormal_fields: abnormalFields,
      missing_materials: missingMaterials
    };
  }

  private checkMaterials(loan: any): MaterialCheckItem[] {
    const customer = loan.customer;
    const checks: MaterialCheckItem[] = [
      {
        field: 'id_card_no',
        name: '身份证号码',
        required: true,
        has_value: !!(loan.id_card_no || customer?.id_card_no),
        is_abnormal: false,
        value: loan.id_card_no || customer?.id_card_no
      },
      {
        field: 'customer_name',
        name: '客户姓名',
        required: true,
        has_value: !!(loan.customer_name || customer?.customer_name),
        is_abnormal: false,
        value: loan.customer_name || customer?.customer_name
      },
      {
        field: 'loan_type',
        name: '贷款类型',
        required: true,
        has_value: !!loan.loan_type,
        is_abnormal: false,
        value: loan.loan_type
      },
      {
        field: 'amount',
        name: '贷款金额',
        required: true,
        has_value: !!loan.amount && Number(loan.amount) > 0,
        is_abnormal: Number(loan.amount) <= 0,
        value: loan.amount
      },
      {
        field: 'term',
        name: '贷款期限',
        required: true,
        has_value: !!loan.term,
        is_abnormal: false,
        value: loan.term
      },
      {
        field: 'purpose',
        name: '贷款用途',
        required: true,
        has_value: !!loan.purpose,
        is_abnormal: false,
        value: loan.purpose
      },
      {
        field: 'repayment_method',
        name: '还款方式',
        required: true,
        has_value: !!loan.repayment_method,
        is_abnormal: false,
        value: loan.repayment_method
      },
      {
        field: 'interest_rate',
        name: '年利率',
        required: true,
        has_value: !!loan.interest_rate,
        is_abnormal: Number(loan.interest_rate) <= 0,
        value: loan.interest_rate
      },
      {
        field: 'purpose_detail',
        name: '用途说明',
        required: false,
        has_value: !!loan.purpose_detail,
        is_abnormal: false,
        value: loan.purpose_detail
      },
      {
        field: 'income_proof',
        name: '收入证明',
        required: loan.loan_type === 2 || loan.loan_type === 3,
        has_value: !!(loan.collateral_info && JSON.parse(loan.collateral_info || '{}').income_proof),
        is_abnormal: false,
        remark: loan.loan_type === 2 || loan.loan_type === 3 ? '经营贷/房贷需提供' : '可选'
      },
      {
        field: 'collateral',
        name: '抵押物信息',
        required: loan.loan_type >= 2,
        has_value: !!(loan.collateral_info && Object.keys(JSON.parse(loan.collateral_info || '{}')).length > 0),
        is_abnormal: false,
        remark: loan.loan_type >= 2 ? '经营贷/房贷/车贷需提供' : '可选'
      }
    ];

    if (customer) {
      if (loan.id_card_no && customer.id_card_no && loan.id_card_no !== customer.id_card_no) {
        const idCheck = checks.find((c) => c.field === 'id_card_no');
        if (idCheck) {
          idCheck.is_abnormal = true;
          idCheck.expected_value = customer.id_card_no;
          idCheck.remark = '与系统记录的证件号码不一致';
        }
      }
      if (customer.status !== 1) {
        const nameCheck = checks.find((c) => c.field === 'customer_name');
        if (nameCheck) {
          nameCheck.is_abnormal = true;
          nameCheck.remark = '客户状态异常';
        }
      }
    }

    return checks;
  }

  async getApprovalDetail(
    loanId: string,
    operatorId?: string,
    userRoles?: string[]
  ): Promise<ApprovalDetailVO> {
    const preCheck = await this.preCheckApproval(loanId, operatorId);

    const loan = await this.loanRepository.findById(loanId, {
      include: [
        this.loanRepository.getCustomerInclude(),
        this.loanRepository.getProductInclude(),
        this.loanRepository.getOrganizationInclude(),
        this.loanRepository.getOperatorInclude(),
        this.loanRepository.getPreReviewerInclude()
      ]
    });

    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    const customer = loan.customer;
    const { currentLevel, totalLevels } = await this.approvalRepository.getApprovalLevelByAmount(Number(loan.amount));

    const existingFlows = await this.approvalRepository.findByLoanId(loanId);
    const approvedLevels = existingFlows.filter((f) => f.status === 2).map((f) => f.current_level);
    const currentApprovalLevel = approvedLevels.length > 0 ? Math.max(...approvedLevels) + 1 : currentLevel;
    const isHighRisk = (loan.risk_level || 0) >= HIGH_RISK_LEVEL_THRESHOLD;

    let approvalLocked = !preCheck.can_enter;
    let lockReason = preCheck.block_reason;

    const userLevel = this.getUserApprovalLevel(userRoles || []);
    if (userLevel < currentApprovalLevel) {
      approvalLocked = true;
      lockReason = `您的权限仅支持${ApprovalLevelText[userLevel]}及以下，当前需要${ApprovalLevelText[currentApprovalLevel]}`;
    }

    const creditReport = this.generateCreditReport(loan, customer);
    const debtData = this.generateDebtData(loan, customer);
    const preApprovalConclusion = this.generatePreApprovalConclusion(loan);

    const approvalFlow = await this.buildApprovalFlowVO(loanId, Number(loan.amount), operatorId, userRoles);
    const approvalLogs = await this.getApprovalLogs(loanId);

    const contractFlow = existingFlows.find((f) => f.contract_generated);
    const allPassed = approvalFlow.every((f) => f.approval_result === 1);

    return {
      loan_id: loan.id,
      loan_no: loan.loan_no,
      customer_name: loan.customer_name || customer?.customer_name || '',
      id_card_no: loan.id_card_no || customer?.id_card_no || '',
      loan_type: loan.loan_type,
      loan_type_text: LoanTypeText[loan.loan_type] || '未知',
      amount: Number(loan.amount),
      term: loan.term,
      term_text: LoanTermText[loan.term] || `${loan.term}个月`,
      purpose: loan.purpose,
      purpose_text: LoanPurposeText[loan.purpose] || loan.purpose,
      interest_rate: Number(loan.interest_rate),
      repayment_method: loan.repayment_method,
      repayment_method_text: RepaymentMethodText[loan.repayment_method] || '未知',
      status: loan.status,
      status_text: LoanStatusText[loan.status] || '未知',
      apply_time: loan.apply_time ? dayjs(loan.apply_time).format('YYYY-MM-DD HH:mm:ss') : '',
      pre_approval_passed: preCheck.has_pre_approval_passed,
      pre_reviewer_name: loan.pre_reviewer?.real_name,
      pre_approve_time: loan.pre_approve_time ? dayjs(loan.pre_approve_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      pre_approve_opinion: loan.pre_approve_opinion,
      current_level: currentApprovalLevel,
      current_level_text: ApprovalLevelText[currentApprovalLevel] || '未知',
      total_levels: totalLevels,
      approval_progress: Math.round((approvedLevels.length / totalLevels) * 100),
      is_high_risk: isHighRisk,
      risk_level: loan.risk_level || 0,
      risk_tags: loan.risk_tags || '',
      credit_report: creditReport,
      debt_data: debtData,
      pre_approval_conclusion: preApprovalConclusion,
      material_checks: preCheck.material_checks,
      abnormal_fields: preCheck.abnormal_fields,
      approval_locked: approvalLocked,
      lock_reason: lockReason,
      approval_flow: approvalFlow,
      approval_logs: approvalLogs,
      contract_generated: contractFlow?.contract_generated || (allPassed && loan.status === 5),
      contract_no: contractFlow?.contract_no
    };
  }

  private getUserApprovalLevel(userRoles: string[]): number {
    if (userRoles.includes('admin')) return 5;
    if (userRoles.includes('auditor')) return 4;
    if (userRoles.includes('manager')) return 3;
    if (userRoles.includes('operator')) return 1;
    return 0;
  }

  private generateCreditReport(loan: any, customer: any): CreditReport {
    const creditScore = loan.credit_score || customer?.credit_score || 650;
    return {
      credit_score: creditScore,
      credit_level: creditScore >= 800 ? '优秀' : creditScore >= 700 ? '良好' : creditScore >= 600 ? '一般' : '较差',
      overdue_count: Math.floor(Math.random() * 3),
      overdue_amount: Number(loan.amount) * 0.05,
      current_loan_count: Math.floor(Math.random() * 2) + 1,
      current_loan_amount: Number(loan.amount) * 0.8,
      query_count_30days: Math.floor(Math.random() * 5),
      public_records: [],
      report_date: dayjs().format('YYYY-MM-DD')
    };
  }

  private generateDebtData(loan: any, customer: any): DebtData {
    const monthlyIncome = customer?.monthly_income || 20000;
    const totalDebt = Number(loan.amount) * 0.6;
    return {
      total_debt_amount: totalDebt,
      monthly_debt_payment: Math.round(totalDebt / 36),
      monthly_income: monthlyIncome,
      debt_to_income_ratio: Math.round((totalDebt / 36 / monthlyIncome) * 100),
      credit_card_balance: Math.round(monthlyIncome * 1.5),
      other_loan_balance: Math.round(totalDebt * 0.3),
      mortgage_balance: Math.round(totalDebt * 0.5)
    };
  }

  private generatePreApprovalConclusion(loan: any): PreApprovalConclusion {
    return {
      pre_check_passed: loan.status >= 2,
      pre_reviewer: loan.pre_reviewer?.real_name || '系统自动预审',
      pre_review_time: loan.pre_approve_time ? dayjs(loan.pre_approve_time).format('YYYY-MM-DD HH:mm:ss') : '',
      pre_review_opinion: loan.pre_approve_opinion || '预审通过，资料基本完整，风险可控',
      risk_level: loan.risk_level || 2,
      risk_tags: loan.risk_tags ? loan.risk_tags.split(',') : ['正常'],
      suggested_amount: Number(loan.amount),
      suggested_term: loan.term,
      special_notes: loan.is_low_quality ? '该客户为低资质客户，需重点关注' : '无特殊说明'
    };
  }

  private async buildApprovalFlowVO(
    loanId: string,
    amount: number,
    operatorId?: string,
    userRoles?: string[]
  ): Promise<ApprovalFlowVO[]> {
    const { totalLevels } = await this.approvalRepository.getApprovalLevelByAmount(amount);
    const existingFlows = await this.approvalRepository.findByLoanId(loanId);
    const result: ApprovalFlowVO[] = [];

    const userLevel = this.getUserApprovalLevel(userRoles || []);
    const approvedLevels = existingFlows.filter((f) => f.status === 2).map((f) => f.current_level);
    const currentApprovalLevel = approvedLevels.length > 0 ? Math.max(...approvedLevels) + 1 : 1;

    for (let level = 1; level <= totalLevels; level++) {
      const existingFlow = existingFlows.find((f) => f.current_level === level);
      const isPassed = existingFlow?.status === 2;
      const isRejected = existingFlow?.status === 3;
      const isCurrentLevel = level === currentApprovalLevel && !isPassed && !isRejected;
      const canApprove = isCurrentLevel && userLevel >= level && userLevel < 99;

      result.push({
        id: existingFlow?.id || `temp_${level}`,
        loan_id: loanId,
        loan_no: existingFlow?.loan_no || '',
        current_level: level,
        current_level_text: ApprovalLevelText[level] || `第${level}级审批`,
        total_levels: totalLevels,
        status: existingFlow?.status || (isCurrentLevel ? 1 : 0),
        status_text: existingFlow?.status
          ? existingFlow.status === 1
            ? '审批中'
            : existingFlow.status === 2
            ? '通过'
            : existingFlow.status === 3
            ? '驳回'
            : '取消'
          : isCurrentLevel
          ? '待审批'
          : '未开始',
        approver_id: existingFlow?.approver_id,
        approver_name: existingFlow?.approver_name,
        approve_time: existingFlow?.approve_time ? dayjs(existingFlow.approve_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
        approval_result: existingFlow?.approval_result,
        approval_result_text: existingFlow?.approval_result ? ApprovalResultText[existingFlow.approval_result] : undefined,
        approval_opinion: existingFlow?.approval_opinion,
        reject_reason: existingFlow?.reject_reason,
        next_level: level < totalLevels ? level + 1 : undefined,
        next_level_text: level < totalLevels ? ApprovalLevelText[level + 1] : undefined,
        is_current_level: isCurrentLevel,
        can_approve: canApprove
      });
    }

    return result;
  }

  private async getApprovalLogs(loanId: string): Promise<ApprovalLogVO[]> {
    const logs = await this.approvalRepository.findLogsByLoanId(loanId);
    return logs.map((log) => ({
      id: log.id,
      loan_id: log.loan_id,
      loan_no: log.loan_no,
      approval_level: log.approval_level,
      approval_level_text: ApprovalLevelText[log.approval_level] || `第${log.approval_level}级`,
      operator_id: log.operator_id,
      operator_name: log.operator_name,
      operation_type: log.operation_type,
      operation_time: dayjs(log.operation_time).format('YYYY-MM-DD HH:mm:ss'),
      from_status: log.from_status as number,
      from_status_text: log.from_status !== undefined ? LoanStatusText[log.from_status as any] || '' : '',
      to_status: log.to_status as number,
      to_status_text: log.to_status !== undefined ? LoanStatusText[log.to_status as any] || '' : '',
      approval_result: log.approval_result,
      approval_result_text: log.approval_result ? ApprovalResultText[log.approval_result] : undefined,
      approval_opinion: log.approval_opinion,
      reject_reason: log.reject_reason,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      risk_level_before: log.risk_level_before,
      risk_level_after: log.risk_level_after,
      consistency_check: log.consistency_check,
      conflict_flag: log.conflict_flag,
      conflict_reason: log.violation_reason
    }));
  }

  async doApproval(
    request: DoApprovalRequest,
    operatorId: string,
    operatorName: string,
    userRoles?: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<DoApprovalResult> {
    const { loan_id, approval_level, approval_result, approval_opinion, reject_reason, reject_details } = request;

    if (!isValidId(loan_id)) {
      throwValidationError('无效的贷款ID');
    }

    const detail = await this.getApprovalDetail(loan_id, operatorId, userRoles);

    if (detail.approval_locked) {
      throwBusinessError(detail.lock_reason || '审批已锁定，无法操作');
    }

    const currentFlow = detail.approval_flow?.find((f) => f.is_current_level);
    if (!currentFlow) {
      throwBusinessError('当前没有待审批的环节');
    }

    if (currentFlow.current_level !== approval_level) {
      throwBusinessError(`当前需要${currentFlow.current_level_text}，不能进行${ApprovalLevelText[approval_level]}`);
    }

    if (!currentFlow.can_approve) {
      throwForbiddenError('您没有该级别审批权限');
    }

    if (approval_result === 2 && (!reject_reason || !reject_details)) {
      throwValidationError('驳回审批必须填写驳回原因和详细说明');
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      const loan = await this.loanRepository.findById(loan_id);
      if (!loan) {
        throwNotFoundError('贷款申请不存在');
      }

      const hasConflict = await this.approvalRepository.checkLevelConflict(loan_id, approval_level, operatorId);
      if (hasConflict) {
        throwBusinessError('您已对该笔贷款进行过同级审批，不能重复操作');
      }

      const conflictFlag = await this.checkApprovalConsistency(loan_id, approval_level, approval_result);
      const consistencyCheck = conflictFlag ? 0 : 1;

      await this.approvalRepository.create(
        {
          loan_id,
          loan_no: loan.loan_no,
          current_level: approval_level,
          total_levels: detail.total_levels,
          status: approval_result === 1 ? 2 : 3,
          approver_id: operatorId,
          approver_name: operatorName,
          approve_time: new Date(),
          approval_result,
          approval_opinion,
          reject_reason: approval_result === 2 ? reject_reason : undefined,
          reject_details: approval_result === 2 ? reject_details : undefined,
          risk_level_before: loan.risk_level,
          risk_level_after: loan.risk_level,
          consistency_check: consistencyCheck,
          conflict_flag: conflictFlag ? 1 : 0,
          conflict_reason: conflictFlag ? '与前序审批意见存在冲突' : undefined
        },
        { transaction }
      );

      const fromStatus = loan.status;
      let toStatus = loan.status;
      let isComplete = false;
      let contractGenerated = false;
      let contractNo: string | undefined;

      if (approval_result === 1) {
        if (approval_level >= detail.total_levels) {
          toStatus = 5;
          isComplete = true;

          const contractResult = await this.generateContractInternal(loan_id, transaction);
          contractGenerated = contractResult.success;
          contractNo = contractResult.contract_no;
        } else {
          toStatus = 4;
        }
      } else if (approval_result === 2) {
        toStatus = 6;
        isComplete = true;
      }

      const updateData: any = {
        status: toStatus,
        final_reviewer_id: approval_result === 1 && approval_level >= detail.total_levels ? operatorId : loan.final_reviewer_id,
        final_reviewer_name:
          approval_result === 1 && approval_level >= detail.total_levels ? operatorName : loan.final_reviewer?.real_name,
        final_approve_time:
          approval_result === 1 && approval_level >= detail.total_levels ? new Date() : loan.final_approve_time,
        final_approve_result: approval_result === 1 ? '通过' : approval_result === 2 ? '拒绝' : loan.final_approve_result,
        final_approve_opinion: approval_opinion || loan.final_approve_opinion
      };

      await this.loanRepository.update(loan_id, updateData, { transaction });

      await this.approvalRepository.createLog(
        {
          loan_id,
          loan_no: loan.loan_no,
          approval_level,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_type: approval_result === 1 ? 'approve' : approval_result === 2 ? 'reject' : 'cancel',
          operation_time: new Date(),
          from_status: fromStatus,
          to_status: toStatus,
          approval_result,
          approval_opinion,
          reject_reason,
          ip_address: ipAddress,
          user_agent: userAgent,
          risk_level_before: loan.risk_level,
          risk_level_after: loan.risk_level,
          consistency_check: consistencyCheck,
          unauthorized_flag: 0,
          illegal_flag: 0,
          conflict_flag: conflictFlag ? 1 : 0,
          violation_reason: conflictFlag ? '与前序审批意见存在冲突' : undefined,
          request_snapshot: JSON.stringify(request)
        }
      );

      await transaction.commit();

      return {
        success: true,
        loan_id,
        loan_no: loan.loan_no,
        current_level: approval_result === 1 && !isComplete ? approval_level + 1 : approval_level,
        current_level_text:
          approval_result === 1 && !isComplete
            ? ApprovalLevelText[approval_level + 1] || ''
            : ApprovalLevelText[approval_level] || '',
        status: toStatus,
        status_text: LoanStatusText[toStatus as keyof typeof LoanStatusText] || '',
        approval_progress: approval_result === 1 ? Math.round((approval_level / detail.total_levels) * 100) : 100,
        next_level: approval_result === 1 && !isComplete ? approval_level + 1 : undefined,
        next_level_text: approval_result === 1 && !isComplete ? ApprovalLevelText[approval_level + 1] : undefined,
        is_approval_complete: isComplete,
        contract_generated: contractGenerated,
        contract_no: contractNo,
        message: isComplete
          ? contractGenerated
            ? `审批完成，合同已生成：${contractNo}`
            : '审批完成'
          : approval_result === 1
          ? `${ApprovalLevelText[approval_level]}通过，已进入${ApprovalLevelText[approval_level + 1]}`
          : '已驳回'
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async checkApprovalConsistency(
    loanId: string,
    currentLevel: number,
    currentResult: number
  ): Promise<boolean> {
    const prevFlows = await this.approvalRepository.findByLoanId(loanId);
    const approved = prevFlows.filter((f) => f.approval_result === 1 && f.current_level < currentLevel);
    const rejected = prevFlows.filter((f) => f.approval_result === 2 && f.current_level < currentLevel);

    if (currentResult === 1 && rejected.length > 0) {
      return true;
    }
    if (currentResult === 2 && approved.length > 0) {
      return true;
    }
    return false;
  }

  private async generateContractInternal(loanId: string, transaction: Transaction): Promise<GenerateContractResult> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throwNotFoundError('贷款申请不存在');
    }

    const contractNo = `HT${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const contractUrl = `/contracts/${loanId}/${contractNo}.pdf`;

    const pendingFlows = await this.approvalRepository.findByWhere({ loan_id: loanId, status: 1 });
    for (const flow of pendingFlows) {
      await this.approvalRepository.update(
        flow.id,
        {
          contract_generated: true,
          contract_no: contractNo,
          contract_url: contractUrl,
          contract_generated_at: new Date()
        },
        { transaction }
      );
    }

    return {
      success: true,
      contract_no: contractNo,
      contract_url: contractUrl,
      generated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  async getPendingApprovalList(
    params: BatchApprovalQueryParams,
    operatorId?: string,
    userRoles?: string[],
    orgId?: string
  ): Promise<{ list: BatchApprovalItem[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, ...queryParams } = params;
    const userLevel = this.getUserApprovalLevel(userRoles || []);

    const loanWhere: any = this.loanRepository.buildQuery(queryParams);
    loanWhere.status = { [Object.keys(require('sequelize').Op).includes('in') ? require('sequelize').Op.in : 'in']: [2, 4] };

    if (queryParams.min_amount) {
      loanWhere.amount = { ...loanWhere.amount, [require('sequelize').Op.gte]: queryParams.min_amount };
    }
    if (queryParams.max_amount) {
      loanWhere.amount = { ...loanWhere.amount, [require('sequelize').Op.lte]: queryParams.max_amount };
    }
    if (queryParams.risk_level !== undefined) {
      loanWhere.risk_level = queryParams.risk_level;
    }
    if (queryParams.is_high_risk) {
      loanWhere.risk_level = { ...loanWhere.risk_level, [require('sequelize').Op.gte]: HIGH_RISK_LEVEL_THRESHOLD };
    }
    if (orgId) {
      loanWhere.org_id = orgId;
    }

    const include = [
      this.loanRepository.getProductInclude(),
      this.loanRepository.getOrganizationInclude(),
      this.loanRepository.getOperatorInclude(),
      this.loanRepository.getCustomerInclude(),
      this.loanRepository.getPreReviewerInclude()
    ];

    const result = await this.loanRepository.findPaginated(
      { page, pageSize },
      loanWhere,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const items: BatchApprovalItem[] = [];
    for (const loan of result.list) {
      const amount = Number(loan.amount);
      const { totalLevels } = await this.approvalRepository.getApprovalLevelByAmount(amount);
      const existingFlows = await this.approvalRepository.findByLoanId(loan.id);
      const approvedLevels = existingFlows.filter((f) => f.status === 2).map((f) => f.current_level);
      const currentLevel = approvedLevels.length > 0 ? Math.max(...approvedLevels) + 1 : 1;
      const isHighRisk = (loan.risk_level || 0) >= HIGH_RISK_LEVEL_THRESHOLD;

      let canBatchApprove = true;
      let cannotApproveReason: string | undefined;

      if (userLevel < currentLevel) {
        canBatchApprove = false;
        cannotApproveReason = `需要${ApprovalLevelText[currentLevel]}权限`;
      } else if (isHighRisk) {
        canBatchApprove = false;
        cannotApproveReason = '高风险贷款需单人精细复核';
      } else if (amount > SINGLE_LEVEL_APPROVAL_THRESHOLD && currentLevel > 1) {
        canBatchApprove = false;
        cannotApproveReason = '大额贷款需单人精细复核';
      }

      const hasApproved = await this.approvalRepository.hasApprovedBefore(loan.id, operatorId || '');
      if (hasApproved) {
        canBatchApprove = false;
        cannotApproveReason = '您已审批过该笔贷款';
      }

      items.push({
        loan_id: loan.id,
        loan_no: loan.loan_no,
        customer_name: loan.customer_name || loan.customer?.customer_name || '',
        id_card_no: loan.id_card_no || loan.customer?.id_card_no || '',
        loan_type: loan.loan_type,
        loan_type_text: LoanTypeText[loan.loan_type] || '未知',
        amount,
        term: loan.term,
        term_text: LoanTermText[loan.term] || `${loan.term}个月`,
        purpose_text: LoanPurposeText[loan.purpose] || loan.purpose,
        interest_rate: Number(loan.interest_rate),
        status: loan.status,
        status_text: LoanStatusText[loan.status as keyof typeof LoanStatusText] || '',
        apply_time: loan.apply_time ? dayjs(loan.apply_time).format('YYYY-MM-DD HH:mm:ss') : '',
        current_level: currentLevel,
        current_level_text: ApprovalLevelText[currentLevel] || '',
        total_levels: totalLevels,
        approval_progress: Math.round((approvedLevels.length / totalLevels) * 100),
        risk_level: loan.risk_level || 0,
        is_high_risk: isHighRisk,
        risk_tags: loan.risk_tags || '',
        pre_approve_opinion: loan.pre_approve_opinion,
        can_batch_approve: canBatchApprove,
        cannot_approve_reason: cannotApproveReason
      });
    }

    return { ...result, list: items };
  }

  async batchApproval(
    request: BatchApprovalRequest,
    operatorId: string,
    operatorName: string,
    userRoles?: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<BatchApprovalResult> {
    const details: BatchApprovalResult['details'] = [];
    let successCount = 0;
    let failCount = 0;

    for (const item of request.items) {
      try {
        const result = await this.doApproval(
          {
            loan_id: item.loan_id,
            approval_level: request.approval_level,
            approval_result: item.approval_result,
            approval_opinion: item.approval_opinion,
            reject_reason: item.reject_reason
          },
          operatorId,
          operatorName,
          userRoles,
          ipAddress,
          userAgent
        );

        details.push({
          loan_id: item.loan_id,
          loan_no: result.loan_no,
          success: true,
          message: result.message
        });
        successCount++;
      } catch (e: any) {
        const loan = await this.loanRepository.findById(item.loan_id);
        details.push({
          loan_id: item.loan_id,
          loan_no: loan?.loan_no || '',
          success: false,
          message: e.message || '审批失败'
        });
        failCount++;
      }
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      details
    };
  }

  async traceApproval(
    request: ApprovalTraceRequest,
    operatorId?: string
  ): Promise<ApprovalTraceResult> {
    if (!request.loan_id && !request.loan_no) {
      throwValidationError('请提供贷款ID或贷款编号');
    }

    let loanId = request.loan_id;
    let loanNo = request.loan_no;

    if (!loanId && loanNo) {
      const loan = await this.loanRepository.findByLoanNo(loanNo);
      if (!loan) {
        throwNotFoundError('贷款不存在');
      }
      loanId = loan.id;
      loanNo = loan.loan_no;
    } else if (loanId && !loanNo) {
      const loan = await this.loanRepository.findById(loanId);
      if (!loan) {
        throwNotFoundError('贷款不存在');
      }
      loanNo = loan.loan_no;
    }

    const flows = await this.approvalRepository.findByLoanId(loanId!);
    const logs = await this.approvalRepository.findLogsByLoanId(loanId!);

    const flowVOs = flows.map((f) => ({
      id: f.id,
      loan_id: f.loan_id,
      loan_no: f.loan_no,
      current_level: f.current_level,
      current_level_text: ApprovalLevelText[f.current_level] || '',
      total_levels: f.total_levels,
      status: f.status,
      status_text: f.status === 1 ? '审批中' : f.status === 2 ? '通过' : f.status === 3 ? '驳回' : '取消',
      approver_id: f.approver_id,
      approver_name: f.approver_name,
      approve_time: f.approve_time ? dayjs(f.approve_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      approval_result: f.approval_result,
      approval_result_text: f.approval_result ? ApprovalResultText[f.approval_result] : undefined,
      approval_opinion: f.approval_opinion,
      reject_reason: f.reject_reason,
      next_level: f.next_level,
      next_level_text: f.next_level ? ApprovalLevelText[f.next_level] : undefined,
      is_current_level: false,
      can_approve: false
    }));

    const logVOs = logs.map((log) => ({
      id: log.id,
      loan_id: log.loan_id,
      loan_no: log.loan_no,
      approval_level: log.approval_level,
      approval_level_text: ApprovalLevelText[log.approval_level] || '',
      operator_id: log.operator_id,
      operator_name: log.operator_name,
      operation_type: log.operation_type,
      operation_time: dayjs(log.operation_time).format('YYYY-MM-DD HH:mm:ss'),
      from_status: log.from_status as number,
      from_status_text: log.from_status !== undefined ? LoanStatusText[log.from_status as any] || '' : '',
      to_status: log.to_status as number,
      to_status_text: log.to_status !== undefined ? LoanStatusText[log.to_status as any] || '' : '',
      approval_result: log.approval_result,
      approval_result_text: log.approval_result ? ApprovalResultText[log.approval_result] : undefined,
      approval_opinion: log.approval_opinion,
      reject_reason: log.reject_reason,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      risk_level_before: log.risk_level_before,
      risk_level_after: log.risk_level_after,
      consistency_check: log.consistency_check,
      conflict_flag: log.conflict_flag,
      conflict_reason: log.violation_reason
    }));

    const inconsistentItems: string[] = [];
    const approved = flows.filter((f) => f.approval_result === 1);
    const rejected = flows.filter((f) => f.approval_result === 2);
    if (approved.length > 0 && rejected.length > 0) {
      inconsistentItems.push('审批意见存在矛盾：既有通过也有驳回');
    }

    const flowOpinions = flows.filter((f) => f.approval_opinion).map((f) => f.approval_opinion!);
    if (flowOpinions.length >= 2) {
      const keywords = flowOpinions.map((op) => op.replace(/[，。；、]/g, '').slice(0, 10));
      const unique = [...new Set(keywords)];
      if (unique.length !== keywords.length) {
        inconsistentItems.push('审批意见存在重复，疑似批量复制');
      }
    }

    const unauthorizedApprovals: string[] = [];
    const illegalApprovals: string[] = [];
    const conflictApprovals: string[] = [];

    for (const log of logs) {
      if (log.unauthorized_flag) {
        unauthorizedApprovals.push(`${ApprovalLevelText[log.approval_level]}：${log.operator_name} - 越权审批`);
      }
      if (log.illegal_flag) {
        illegalApprovals.push(`${ApprovalLevelText[log.approval_level]}：${log.operator_name} - 违规审批`);
      }
      if (log.conflict_flag) {
        conflictApprovals.push(`${ApprovalLevelText[log.approval_level]}：${log.operator_name} - ${log.violation_reason || '审批冲突'}`);
      }
    }

    const expectedOperations = ['enter', 'approve', 'complete'];
    const actualOperations = [...new Set(logs.map((l) => l.operation_type))];
    const missingLogs: string[] = [];
    for (const expected of expectedOperations) {
      if (!actualOperations.includes(expected)) {
        missingLogs.push(`缺少${expected}操作日志`);
      }
    }

    return {
      loan_id: loanId!,
      loan_no: loanNo!,
      total_approval_count: flows.length,
      approval_flow_records: flowVOs,
      approval_log_records: logVOs,
      consistency_check: {
        passed: inconsistentItems.length === 0,
        inconsistent_items: inconsistentItems
      },
      violation_check: {
        has_violation:
          unauthorizedApprovals.length > 0 || illegalApprovals.length > 0 || conflictApprovals.length > 0,
        unauthorized_approvals: unauthorizedApprovals,
        illegal_approvals: illegalApprovals,
        conflict_approvals: conflictApprovals
      },
      operation_log_complete: missingLogs.length === 0,
      missing_logs: missingLogs
    };
  }

  async generateContract(loanId: string): Promise<GenerateContractResult> {
    const transaction = await sequelize.transaction();
    try {
      const result = await this.generateContractInternal(loanId, transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
