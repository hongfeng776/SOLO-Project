import { TransactionRepository, CustomerRepository, ViolationRepository, UserRepository, OrganizationRepository, RiskAssessmentRepository, RiskIndicatorRepository, RiskAssessmentBatchRepository, LoanRepository } from '../repositories';
import {
  PaginatedResult,
  RiskAssessmentVO,
  RiskAssessmentBatchVO,
  RiskIndicatorVO,
  DataSyncCheckResult,
  WeightValidationResult,
  IndicatorMissingCheckResult,
  RiskScoreResult,
  IndicatorScore,
  MultiDimensionalData,
  RiskLevelText,
  RiskLevelColor,
  AssessmentTypeText,
  AssessmentStatusText,
  DataSyncStatusText,
  IndicatorCategoryText,
  BatchTypeText,
  BatchStatusText,
  ReviewFrequencyStrategyText,
  DataSyncStatus,
  AssessmentStatus,
  IndicatorCategory,
  RiskLevel,
  BatchStatus,
  IllegalDowngradeCheckResult,
  BusinessPermissionUpdateResult,
  TraceRecord,
  AssessmentType,
  BatchType,
  ReviewFrequencyStrategy
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op, Sequelize } from 'sequelize';

const LOCAL_BANK_CODE_PREFIX = '102';

const violationTypeMap: Record<number, string> = {
  1: '资金异常',
  2: '可疑账户',
  3: '操作违规',
  4: '资料不全',
  5: '反洗钱',
  6: '监管违规',
  7: '其他'
};

const violationLevelMap: Record<number, string> = {
  1: '轻微',
  2: '一般',
  3: '较重',
  4: '严重',
  5: '重大'
};

const violationStatusMap: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '已整改',
  3: '已驳回',
  4: '已关闭'
};

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

const ASSESSMENT_SCORE_THRESHOLDS = {
  [RiskLevel.LOW]: 70,
  [RiskLevel.MEDIUM]: 50,
  [RiskLevel.HIGH_MEDIUM]: 30,
  [RiskLevel.HIGH]: 0
};

const REVIEW_FREQUENCY_DAYS = {
  [ReviewFrequencyStrategy.MONTHLY]: 30,
  [ReviewFrequencyStrategy.QUARTERLY]: 90,
  [ReviewFrequencyStrategy.SEMIANNUAL]: 180,
  [ReviewFrequencyStrategy.ANNUAL]: 365,
  [ReviewFrequencyStrategy.BY_ACTIVITY]: 0,
  [ReviewFrequencyStrategy.BY_RISK_CHANGE]: 0
};

const HIGH_RISK_REVIEW_DAYS = 7;

export interface AnomalyQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  customer_no?: string;
  org_id?: string;
  start_time?: string;
  end_time?: string;
  risk_level?: number;
  min_amount?: number;
  max_amount?: number;
  is_high_frequency?: boolean;
  is_large_amount?: boolean;
  is_night?: boolean;
  is_cross_border?: boolean;
}

export interface CreateViolationRequest {
  customer_id?: string;
  customer_no?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: string;
  violation_type: number;
  violation_level: number;
  description?: string;
  rule_ref?: string;
  discoverer_id?: string;
  discoverer_org_id?: string;
}

export interface HandleViolationRequest {
  status: number;
  rectification?: string;
  remark?: string;
}

export interface ViolationVO {
  id: string;
  violation_no: string;
  customer_id?: string;
  customer_no?: string;
  customer_name?: string;
  biz_id?: string;
  biz_no?: string;
  biz_type?: string;
  violation_type?: number;
  violation_type_text?: string;
  violation_level?: number;
  violation_level_text?: string;
  description?: string;
  rule_ref?: string;
  status: number;
  status_text?: string;
  discoverer_id?: string;
  discoverer_name?: string;
  discoverer_org_id?: string;
  discoverer_org_name?: string;
  handler_id?: string;
  handler_name?: string;
  discover_time?: Date;
  handle_time?: Date;
  rectification?: string;
  remark?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface RiskAssessmentResult {
  risk_level: number;
  risk_tags: string[];
}

export class RiskControlService {
  private transactionRepository: TransactionRepository;
  private customerRepository: CustomerRepository;
  private violationRepository: ViolationRepository;
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;
  private riskAssessmentRepository: RiskAssessmentRepository;
  private riskIndicatorRepository: RiskIndicatorRepository;
  private riskAssessmentBatchRepository: RiskAssessmentBatchRepository;
  private loanRepository: LoanRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.customerRepository = new CustomerRepository();
    this.violationRepository = new ViolationRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
    this.riskAssessmentRepository = new RiskAssessmentRepository();
    this.riskIndicatorRepository = new RiskIndicatorRepository();
    this.riskAssessmentBatchRepository = new RiskAssessmentBatchRepository();
    this.loanRepository = new LoanRepository();
  }

  async evaluateTransactionRisk(transactionId: string): Promise<RiskAssessmentResult> {
    if (!isValidId(transactionId)) {
      throwValidationError('无效的交易ID');
    }

    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    const riskTags: string[] = [];
    let totalScore = 0;

    const amount = Number(transaction.amount) || 0;

    if (amount >= 1000000) {
      totalScore += 2;
      riskTags.push('大额交易');
    } else if (amount >= 500000) {
      totalScore += 1;
      riskTags.push('较大金额');
    }

    const txTime = transaction.transaction_time ? dayjs(transaction.transaction_time) : dayjs();
    const hour = txTime.hour();
    if (hour >= 0 && hour < 5) {
      totalScore += 1;
      riskTags.push('夜间交易');
    }

    if (transaction.customer_id) {
      const oneHourAgo = txTime.subtract(1, 'hour').toDate();
      const recentTxs = await this.transactionRepository.findByWhere({
        customer_id: transaction.customer_id,
        id: { [Op.ne]: transactionId },
        transaction_time: { [Op.gte]: oneHourAgo, [Op.lte]: txTime.toDate() }
      });

      if (recentTxs.length > 3) {
        totalScore += 2;
        riskTags.push('高频交易');
      } else if (recentTxs.length >= 2) {
        totalScore += 1;
      }
    }

    if (transaction.payee_bank_code) {
      const isLocalBank = transaction.payee_bank_code.startsWith(LOCAL_BANK_CODE_PREFIX);
      if (!isLocalBank) {
        totalScore += 1;
        riskTags.push('跨境/跨行交易');
      }
    }

    if (transaction.customer_id) {
      const customer = await this.customerRepository.findById(transaction.customer_id);
      if (customer && customer.risk_level) {
        const customerRisk = customer.risk_level;
        if (customerRisk >= 4) {
          totalScore += 2;
          riskTags.push('高风险客户');
        } else if (customerRisk >= 2) {
          totalScore += 1;
        }
      }
    }

    if (transaction.payee_account) {
      const blacklistViolations = await this.violationRepository.findByWhere({
        biz_no: transaction.payee_account,
        violation_type: 2,
        status: { [Op.in]: [0, 1, 2] }
      });
      if (blacklistViolations.length > 0) {
        totalScore += 2;
        riskTags.push('收款账户历史黑名单');
      }
    }

    let riskLevel = 0;
    if (totalScore >= 6) {
      riskLevel = 5;
    } else if (totalScore >= 5) {
      riskLevel = 4;
    } else if (totalScore >= 4) {
      riskLevel = 3;
    } else if (totalScore >= 2) {
      riskLevel = 2;
    } else if (totalScore >= 1) {
      riskLevel = 1;
    }

    return {
      risk_level: riskLevel,
      risk_tags: riskTags
    };
  }

  async detectAnomalyTransactions(params: AnomalyQueryParams): Promise<PaginatedResult<any>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.transactionRepository.buildQuery(queryParams);

    if (queryParams.risk_level !== undefined) {
      where.risk_level = queryParams.risk_level;
    }

    if (queryParams.is_large_amount) {
      where.amount = { ...(where.amount || {}), [Op.gte]: 500000 };
    }

    if (queryParams.is_night) {
      where.transaction_time = {
        ...(where.transaction_time || {}),
        [Op.and]: [
          Sequelize.literal(`HOUR(transaction_time) >= 0`),
          Sequelize.literal(`HOUR(transaction_time) < 5`)
        ]
      };
    }

    if (queryParams.is_cross_border) {
      where.payee_bank_code = { [Op.notLike]: `${LOCAL_BANK_CODE_PREFIX}%` };
    }

    const include = [
      this.transactionRepository.getProductInclude(),
      this.transactionRepository.getOrganizationInclude(),
      this.transactionRepository.getOperatorInclude()
    ];

    const result = await this.transactionRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'transaction_time', sortOrder: 'DESC' },
      { include }
    );

    return result;
  }

  async createViolationRecord(request: CreateViolationRequest): Promise<ViolationVO> {
    const { violation_type, violation_level, ...rest } = request;

    if (![1, 2, 3, 4, 5, 6, 7].includes(violation_type)) {
      throwValidationError('违规类型无效');
    }

    if (![1, 2, 3, 4, 5].includes(violation_level)) {
      throwValidationError('违规等级无效');
    }

    if (request.customer_id && !isValidId(request.customer_id)) {
      throwValidationError('无效的客户ID');
    }

    if (request.discoverer_id && !isValidId(request.discoverer_id)) {
      throwValidationError('无效的发现人ID');
    }

    if (request.discoverer_org_id && !isValidId(request.discoverer_org_id)) {
      throwValidationError('无效的发现机构ID');
    }

    const violationNo = await this.violationRepository.generateViolationNo();

    const violation = await this.violationRepository.create({
      ...rest,
      violation_no: violationNo,
      violation_type,
      violation_level,
      status: 0,
      discover_time: new Date()
    });

    return this.getViolationById(violation.id);
  }

  async getViolationById(id: string): Promise<ViolationVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的违规台账ID');
    }

    const violation = await this.violationRepository.findById(id, {
      include: [
        this.violationRepository.getCustomerInclude(),
        this.violationRepository.getDiscovererInclude(),
        this.violationRepository.getHandlerInclude(),
        this.violationRepository.getDiscovererOrgInclude()
      ]
    });

    if (!violation) {
      throwNotFoundError('违规台账不存在');
    }

    return this.convertViolationToVO(violation);
  }

  async getViolationList(params: any): Promise<PaginatedResult<ViolationVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.violationRepository.buildQuery(queryParams);

    const include = [
      this.violationRepository.getCustomerInclude(),
      this.violationRepository.getDiscovererInclude(),
      this.violationRepository.getHandlerInclude(),
      this.violationRepository.getDiscovererOrgInclude()
    ];

    const result = await this.violationRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'discover_time', sortOrder: 'DESC' },
      { include }
    );

    const list: ViolationVO[] = result.list.map(v => this.convertViolationToVO(v));

    return { ...result, list };
  }

  async handleViolation(
    id: string,
    operatorId: string,
    request: HandleViolationRequest
  ): Promise<ViolationVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的违规台账ID');
    }

    if (!isValidId(operatorId)) {
      throwValidationError('无效的处理人ID');
    }

    const { status, rectification, remark } = request;

    if (![0, 1, 2, 3, 4].includes(status)) {
      throwValidationError('处理状态无效');
    }

    const violation = await this.violationRepository.findById(id);
    if (!violation) {
      throwNotFoundError('违规台账不存在');
    }

    if (violation.status === 2 || violation.status === 4) {
      throwBusinessError('已整改或已关闭的违规台账不能修改');
    }

    const updateData: any = {
      status,
      handler_id: operatorId,
      handle_time: new Date()
    };

    if (rectification !== undefined) {
      updateData.rectification = rectification;
    }
    if (remark !== undefined) {
      updateData.remark = remark;
    }

    await this.violationRepository.update(id, updateData);

    return this.getViolationById(id);
  }

  async getRiskStatistics(startTime?: string, endTime?: string, orgId?: string): Promise<any> {
    const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const txWhere: any = {
      transaction_time: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };

    if (orgId) {
      txWhere.org_id = orgId;
    }

    const allTransactions = await this.transactionRepository.findByWhere(txWhere);

    const riskLevelDistribution: Record<number, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    for (const tx of allTransactions) {
      const level = tx.risk_level || 0;
      riskLevelDistribution[level] = (riskLevelDistribution[level] || 0) + 1;
    }

    const vioWhere: any = {
      discover_time: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };

    if (orgId) {
      vioWhere.discoverer_org_id = orgId;
    }

    const allViolations = await this.violationRepository.findByWhere(vioWhere);

    const violationTypeDistribution: Record<number, number> = {};
    let totalViolations = allViolations.length;
    let rectifiedCount = 0;

    for (const v of allViolations) {
      const type = v.violation_type || 0;
      violationTypeDistribution[type] = (violationTypeDistribution[type] || 0) + 1;
      if (v.status === 2) {
        rectifiedCount++;
      }
    }

    const rectificationRate = totalViolations > 0 ? Number(((rectifiedCount / totalViolations) * 100).toFixed(2)) : 0;

    const highRiskCount = riskLevelDistribution[4] + riskLevelDistribution[5];

    return {
      total_transactions: allTransactions.length,
      high_risk_count: highRiskCount,
      risk_level_distribution: riskLevelDistribution,
      risk_level_distribution_text: Object.entries(riskLevelDistribution).map(([level, count]) => ({
        level: Number(level),
        level_text: riskLevelMap[Number(level)] || '未知',
        count
      })),
      total_violations: totalViolations,
      rectified_count: rectifiedCount,
      rectification_rate: rectificationRate,
      violation_type_distribution: violationTypeDistribution,
      violation_type_distribution_text: Object.entries(violationTypeDistribution).map(([type, count]) => ({
        type: Number(type),
        type_text: violationTypeMap[Number(type)] || '未知',
        count
      })),
      start_time: dayjs(start).format('YYYY-MM-DD'),
      end_time: dayjs(end).format('YYYY-MM-DD')
    };
  }

  private convertViolationToVO(v: any): ViolationVO {
    const data = v.toJSON ? v.toJSON() : v;
    const vo: ViolationVO = { ...data };

    if (data.customer) {
      vo.customer_name = data.customer.customer_name;
    }
    if (data.discoverer) {
      vo.discoverer_name = data.discoverer.real_name || data.discoverer.username;
    }
    if (data.handler) {
      vo.handler_name = data.handler.real_name || data.handler.username;
    }
    if (data.discoverer_org) {
      vo.discoverer_org_name = data.discoverer_org.name;
    }

    vo.violation_type_text = violationTypeMap[data.violation_type] || '未知';
    vo.violation_level_text = violationLevelMap[data.violation_level] || '未知';
    vo.status_text = violationStatusMap[data.status] || '未知';

    return vo;
  }

  async checkDataSyncStatus(customerId: string): Promise<DataSyncCheckResult> {
    if (!isValidId(customerId)) {
      throwValidationError('无效的客户ID');
    }

    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const missingDataTypes: string[] = [];
    const syncingDataTypes: string[] = [];

    const now = dayjs();
    const syncThreshold = 24;

    const latestAssessment = await this.riskAssessmentRepository.findLatestByCustomerId(customerId);
    if (latestAssessment) {
      if (latestAssessment.data_sync_status === DataSyncStatus.SYNCING) {
        syncingDataTypes.push('数据同步中');
      }
    }

    const transactions = await this.transactionRepository.findByWhere({
      customer_id: customerId,
      transaction_time: { [Op.gte]: now.subtract(30, 'day').toDate() }
    });
    if (transactions.length === 0) {
      missingDataTypes.push('交易数据');
    }

    const loans = await this.loanRepository.findByWhere({
      customer_id: customerId,
      status: { [Op.in]: [5, 7] }
    });

    if (missingDataTypes.length > 0 || syncingDataTypes.length > 0) {
      return {
        can_assess: false,
        missing_data_types: missingDataTypes,
        syncing_data_types: syncingDataTypes,
        error_message: `数据不完整或同步中：${[...missingDataTypes, ...syncingDataTypes].join('、')}`
      };
    }

    return {
      can_assess: true,
      missing_data_types: [],
      syncing_data_types: []
    };
  }

  async collectMultiDimensionalData(customerId: string): Promise<MultiDimensionalData> {
    if (!isValidId(customerId)) {
      throwValidationError('无效的客户ID');
    }

    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, 'day').toDate();

    const transactions = await this.transactionRepository.findByWhere({
      customer_id: customerId,
      transaction_time: { [Op.gte]: thirtyDaysAgo, [Op.lte]: now.toDate() }
    });

    const loans = await this.loanRepository.findByWhere({
      customer_id: customerId,
      status: { [Op.in]: [5, 7] }
    });

    const violations = await this.violationRepository.findByWhere({
      customer_id: customerId,
      violation_type: { [Op.in]: [1, 2, 5] },
      status: { [Op.in]: [0, 1, 2] }
    });

    const transactionCount30d = transactions.length;
    const transactionAmount30d = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    let avgTransactionAmount = transactionCount30d > 0 ? transactionAmount30d / transactionCount30d : 0;
    let abnormalTxCount = transactions.filter(tx => tx.risk_level && tx.risk_level >= 3).length;
    let highFreqCount = 0;
    let nightTxCount = transactions.filter(tx => {
      const hour = dayjs(tx.transaction_time).hour();
      return hour >= 0 && hour < 5;
    }).length;
    let crossBorderCount = transactions.filter(tx => tx.payee_bank_code && !tx.payee_bank_code.startsWith(LOCAL_BANK_CODE_PREFIX)).length;

    const totalLoanBalance = loans.reduce((sum, loan) => sum + (Number(loan.amount) || 0), 0);
    let debtRatio = totalLoanBalance > 0 ? Math.min(Number((totalLoanBalance / 100000) * 100), 100) : 0;
    const overdueLoanCount = loans.filter(l => l.status === 7 && l.risk_level && l.risk_level >= 3).length;

    const lawsuitCount = violations.filter(v => v.violation_type === 5).length;
    const pendingLawsuitCount = violations.filter(v => v.violation_type === 5 && v.status === 0).length;
    const executedCount = violations.filter(v => v.violation_type === 5 && v.status === 1).length;

    const accountOpenDays = customer.open_date ? now.diff(dayjs(customer.open_date), 'day') : 0;

    return {
      credit_data: {
        credit_score: customer.risk_level ? Math.max(300, Math.min(900, 850 - (customer.risk_level * 100))) : 750,
        credit_level: customer.risk_level && customer.risk_level <= 1 ? '优秀' : (customer.risk_level && customer.risk_level <= 3) ? '良好' : '一般',
        overdue_count: overdueLoanCount,
        overdue_amount: loans.filter(l => l.status === 7 && l.risk_level && l.risk_level >= 3).reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
        query_count_30d: Math.floor(Math.random() * 5),
        data_source: '内部系统',
        sync_time: now.toDate()
      },
      transaction_data: {
        transaction_count_30d: transactionCount30d,
        transaction_amount_30d: transactionAmount30d,
        avg_transaction_amount: avgTransactionAmount,
        abnormal_transaction_count: abnormalTxCount,
        high_frequency_count: highFreqCount,
        night_transaction_count: nightTxCount,
        cross_border_count: crossBorderCount,
        sync_time: now.toDate()
      },
      debt_data: {
        total_loan_balance: totalLoanBalance,
        debt_ratio: debtRatio,
        overdue_loan_count: overdueLoanCount,
        credit_card_balance: totalLoanBalance * 0.3,
        credit_limit_utilization: debtRatio,
        sync_time: now.toDate()
      },
      lawsuit_data: {
        lawsuit_count: lawsuitCount,
        pending_lawsuit_count: pendingLawsuitCount,
        executed_count: executedCount,
        dishonest_count: violations.filter(v => v.violation_type === 5 && v.status === 2).length,
        lawsuit_amount: lawsuitCount * 50000,
        sync_time: now.toDate()
      },
      account_behavior_data: {
        account_open_days: accountOpenDays,
        login_count_30d: Math.max(0, transactionCount30d * 2),
        channel_diversity: Math.min(5, new Set(transactions.map(t => t.channel_code)).size),
        address_change_count: 0,
        phone_change_count: 0,
        sync_time: now.toDate()
      }
    };
  }

  async validateIndicatorWeights(): Promise<WeightValidationResult> {
    const activeIndicators = await this.riskIndicatorRepository.findAllActive();
    let totalWeight = 0;
    const invalidIndicators: string[] = [];

    for (const indicator of activeIndicators) {
      totalWeight += Number(indicator.weight) || 0;
      if (indicator.weight < 0 || indicator.weight > 100) {
        invalidIndicators.push(indicator.indicator_name);
      }
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
      return {
        is_valid: false,
        total_weight: totalWeight,
        invalid_indicators: invalidIndicators,
        error_message: `指标权重总和应为100%，当前为${totalWeight}%`
      };
    }

    if (invalidIndicators.length > 0) {
      return {
        is_valid: false,
        total_weight: totalWeight,
        invalid_indicators: invalidIndicators,
        error_message: `以下指标权重配置无效：${invalidIndicators.join('、')}`
      };
    }

    return {
      is_valid: true,
      total_weight: totalWeight,
      invalid_indicators: []
    };
  }

  async checkMissingIndicators(multiDimensionalData: MultiDimensionalData): Promise<IndicatorMissingCheckResult> {
    const activeIndicators = await this.riskIndicatorRepository.findAllActive();
    const requiredIndicators = activeIndicators.filter(i => i.is_required === 1);
    const missingIndicators: string[] = [];

    for (const indicator of requiredIndicators) {
      let hasData = false;
      switch (indicator.category) {
        case IndicatorCategory.CREDIT:
          hasData = multiDimensionalData.credit_data.credit_score !== undefined;
          break;
        case IndicatorCategory.TRANSACTION:
          hasData = multiDimensionalData.transaction_data.transaction_count_30d !== undefined;
          break;
        case IndicatorCategory.DEBT:
          hasData = multiDimensionalData.debt_data.debt_ratio !== undefined;
          break;
        case IndicatorCategory.LAWSUIT:
          hasData = multiDimensionalData.lawsuit_data.lawsuit_count !== undefined;
          break;
        case IndicatorCategory.ACCOUNT_BEHAVIOR:
          hasData = multiDimensionalData.account_behavior_data.account_open_days !== undefined;
          break;
      }
      if (!hasData) {
        missingIndicators.push(indicator.indicator_name);
      }
    }

    if (missingIndicators.length > 0) {
      return {
        is_complete: false,
        missing_indicators: missingIndicators,
        error_message: `缺失必填指标数据：${missingIndicators.join('、')}`
      };
    }

    return {
      is_complete: true,
      missing_indicators: []
    };
  }

  async calculateRiskScore(customerId: string, multiDimensionalData: MultiDimensionalData): Promise<RiskScoreResult> {
    const activeIndicators = await this.riskIndicatorRepository.findAllActive();
    const indicatorScores: IndicatorScore[] = [];
    const riskTags: string[] = [];
    let totalWeightedScore = 0;

    const creditScore = multiDimensionalData.credit_data.credit_score || 0;
    const debtRatio = multiDimensionalData.debt_data.debt_ratio || 0;
    const lawsuitCount = multiDimensionalData.lawsuit_data.lawsuit_count || 0;
    const transactionCount30d = multiDimensionalData.transaction_data.transaction_count_30d || 0;
    const transactionAmount30d = multiDimensionalData.transaction_data.transaction_amount_30d || 0;
    const accountOpenDays = multiDimensionalData.account_behavior_data.account_open_days || 0;
    const abnormalTxCount = multiDimensionalData.transaction_data.abnormal_transaction_count || 0;
    const overdueCount = multiDimensionalData.credit_data.overdue_count || 0;

    for (const indicator of activeIndicators) {
      let score = 0;
      let rawValue: any = null;
      let scoringDetails = '';

      switch (indicator.indicator_code) {
        case 'CREDIT_SCORE':
          rawValue = creditScore;
          if (creditScore >= 750) {
            score = 100;
            scoringDetails = '征信评分优秀';
          } else if (creditScore >= 650) {
            score = 80;
            scoringDetails = '征信评分良好';
          } else if (creditScore >= 550) {
            score = 60;
            scoringDetails = '征信评分一般';
          } else {
            score = 30;
            scoringDetails = '征信评分较低';
            riskTags.push('征信不良');
          }
          break;

        case 'DEBT_RATIO':
          rawValue = debtRatio;
          if (debtRatio <= 30) {
            score = 100;
            scoringDetails = '负债率良好';
          } else if (debtRatio <= 50) {
            score = 70;
            scoringDetails = '负债率适中';
          } else if (debtRatio <= 70) {
            score = 40;
            scoringDetails = '负债率较高';
            riskTags.push('高负债');
          } else {
            score = 20;
            scoringDetails = '负债率过高';
            riskTags.push('高负债');
          }
          break;

        case 'LAWSUIT_COUNT':
          rawValue = lawsuitCount;
          if (lawsuitCount === 0) {
            score = 100;
            scoringDetails = '无涉诉记录';
          } else if (lawsuitCount === 1) {
            score = 60;
            scoringDetails = '有涉诉记录';
            riskTags.push('涉诉记录');
          } else {
            score = 20;
            scoringDetails = '多条涉诉记录';
            riskTags.push('涉诉记录');
          }
          break;

        case 'TRANSACTION_ACTIVITY':
          rawValue = transactionCount30d;
          if (transactionCount30d >= 20) {
            score = 100;
            scoringDetails = '交易活跃';
          } else if (transactionCount30d >= 10) {
            score = 80;
            scoringDetails = '交易较活跃';
          } else if (transactionCount30d >= 5) {
            score = 60;
            scoringDetails = '交易一般';
          } else {
            score = 40;
            scoringDetails = '交易不活跃';
            riskTags.push('交易不活跃');
          }
          break;

        case 'TRANSACTION_AMOUNT':
          rawValue = transactionAmount30d;
          if (transactionAmount30d >= 1000000) {
            score = 100;
            scoringDetails = '交易金额大';
          } else if (transactionAmount30d >= 500000) {
            score = 80;
            scoringDetails = '交易金额较大';
          } else if (transactionAmount30d >= 100000) {
            score = 60;
            scoringDetails = '交易金额适中';
          } else {
            score = 40;
            scoringDetails = '交易金额较小';
          }
          break;

        case 'ABNORMAL_TRANSACTION':
          rawValue = abnormalTxCount;
          if (abnormalTxCount === 0) {
            score = 100;
            scoringDetails = '无异常交易';
          } else if (abnormalTxCount <= 2) {
            score = 70;
            scoringDetails = '少量异常交易';
            riskTags.push('异常交易');
          } else {
            score = 30;
            scoringDetails = '多次异常交易';
            riskTags.push('异常交易');
          }
          break;

        case 'OVERDUE_COUNT':
          rawValue = overdueCount;
          if (overdueCount === 0) {
            score = 100;
            scoringDetails = '无逾期记录';
          } else if (overdueCount === 1) {
            score = 60;
            scoringDetails = '有逾期记录';
            riskTags.push('逾期记录');
          } else {
            score = 20;
            scoringDetails = '多次逾期记录';
            riskTags.push('逾期记录');
          }
          break;

        case 'ACCOUNT_AGE':
          rawValue = accountOpenDays;
          if (accountOpenDays >= 365) {
            score = 100;
            scoringDetails = '开户时间长';
          } else if (accountOpenDays >= 180) {
            score = 80;
            scoringDetails = '开户时间较长';
          } else if (accountOpenDays >= 90) {
            score = 60;
            scoringDetails = '开户时间适中';
          } else {
            score = 40;
            scoringDetails = '新开户客户';
            riskTags.push('新开户');
          }
          break;

        default:
          score = 80;
          scoringDetails = '默认评分';
      }

      const weightedScore = (score / indicator.max_score) * indicator.weight;
      totalWeightedScore += weightedScore;

      indicatorScores.push({
        indicator_code: indicator.indicator_code,
        indicator_name: indicator.indicator_name,
        category: indicator.category,
        weight: indicator.weight,
        score: score,
        max_score: indicator.max_score,
        weighted_score: Number(weightedScore.toFixed(2)),
        raw_value: rawValue,
        scoring_details: scoringDetails
      });
    }

    const finalScore = Number(totalWeightedScore.toFixed(2));
    let riskLevel = RiskLevel.LOW;

    if (finalScore >= ASSESSMENT_SCORE_THRESHOLDS[RiskLevel.LOW]) {
      riskLevel = RiskLevel.LOW;
    } else if (finalScore >= ASSESSMENT_SCORE_THRESHOLDS[RiskLevel.MEDIUM]) {
      riskLevel = RiskLevel.MEDIUM;
    } else if (finalScore >= ASSESSMENT_SCORE_THRESHOLDS[RiskLevel.HIGH_MEDIUM]) {
      riskLevel = RiskLevel.HIGH_MEDIUM;
    } else {
      riskLevel = RiskLevel.HIGH;
    }

    if (riskLevel === RiskLevel.HIGH) {
      riskTags.push('高风险客户');
    } else if (riskLevel === RiskLevel.HIGH_MEDIUM) {
      riskTags.push('较高风险客户');
    }

    return {
      total_score: finalScore,
      risk_level: riskLevel,
      risk_level_text: RiskLevelText[riskLevel],
      risk_tags: [...new Set(riskTags)],
      indicator_scores: indicatorScores
    };
  }

  async checkIllegalDowngrade(
    customerId: string,
    requestedRiskLevel: number,
    currentRiskLevel?: number
  ): Promise<IllegalDowngradeCheckResult> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const existingRiskLevel = currentRiskLevel ?? customer.risk_level ?? RiskLevel.LOW;

    const existingLevel4Level = existingRiskLevel >= 4 ? RiskLevel.HIGH : existingRiskLevel >= 3 ? RiskLevel.HIGH_MEDIUM : existingRiskLevel >= 2 ? RiskLevel.MEDIUM : RiskLevel.LOW;

    if (requestedRiskLevel < existingLevel4Level) {
      const highRiskReasons: string[] = [];

      const multiDimensionalData = await this.collectMultiDimensionalData(customerId);

      if (multiDimensionalData.credit_data.credit_score && multiDimensionalData.credit_data.credit_score < 550) {
        highRiskReasons.push('征信评分较低');
      }
      if (multiDimensionalData.debt_data.debt_ratio && multiDimensionalData.debt_data.debt_ratio > 70) {
        highRiskReasons.push('负债率过高');
      }
      if (multiDimensionalData.lawsuit_data.lawsuit_count && multiDimensionalData.lawsuit_data.lawsuit_count > 0) {
        highRiskReasons.push('存在涉诉记录');
      }
      if (multiDimensionalData.transaction_data.abnormal_transaction_count && multiDimensionalData.transaction_data.abnormal_transaction_count > 2) {
        highRiskReasons.push('存在多次异常交易');
      }
      if (multiDimensionalData.credit_data.overdue_count && multiDimensionalData.credit_data.overdue_count > 0) {
        highRiskReasons.push('存在逾期记录');
      }

      const openViolations = await this.violationRepository.findByWhere({
        customer_id: customerId,
        status: { [Op.in]: [0, 1] }
      });
      if (openViolations.length > 0) {
        highRiskReasons.push('存在未处理违规记录');
      }

      if (highRiskReasons.length > 0) {
        return {
          is_illegal: true,
          block_reason: `存在高风险因素，不能调低风险等级：${highRiskReasons.join('、')}`,
          current_risk_level: existingLevel4Level,
          requested_risk_level: requestedRiskLevel,
          high_risk_reasons: highRiskReasons
        };
      }
    }

    return {
      is_illegal: false,
      current_risk_level: existingLevel4Level,
      requested_risk_level: requestedRiskLevel,
      high_risk_reasons: []
    };
  }

  async updateBusinessPermissions(
    customerId: string,
    newRiskLevel: number
  ): Promise<BusinessPermissionUpdateResult> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const previousRiskLevel = customer.risk_level;
    const updatedModules: string[] = ['交易限额', '业务权限', '审核标准'];

    const riskLevelMap: Record<number, any> = {
      [RiskLevel.LOW]: {
        transaction_limit: 5000000,
        daily_limit: 10000000,
        review_required: false,
        allowed_products: ['all'],
        audit_level: 1
      },
      [RiskLevel.MEDIUM]: {
        transaction_limit: 2000000,
        daily_limit: 5000000,
        review_required: false,
        allowed_products: ['basic', 'loan', 'wealth'],
        audit_level: 2
      },
      [RiskLevel.HIGH_MEDIUM]: {
        transaction_limit: 500000,
        daily_limit: 2000000,
        review_required: true,
        allowed_products: ['basic'],
        audit_level: 3
      },
      [RiskLevel.HIGH]: {
        transaction_limit: 100000,
        daily_limit: 500000,
        review_required: true,
        allowed_products: ['basic'],
        audit_level: 4
      }
    };

    const newPermissions = riskLevelMap[newRiskLevel] || riskLevelMap[RiskLevel.MEDIUM];
    const previousPermissions = riskLevelMap[previousRiskLevel || RiskLevel.LOW];

    await this.customerRepository.update(customerId, {
      risk_level: newRiskLevel >= 4 ? 5 : newRiskLevel >= 3 ? 4 : newRiskLevel >= 2 ? 3 : 1,
      risk_tags: newPermissions.allowed_products.join(',')
    });

    return {
      success: true,
      updated_modules: updatedModules,
      previous_permissions: previousPermissions,
      new_permissions: newPermissions
    };
  }

  async calculateNextReviewTime(
    customerId: string,
    riskLevel: number,
    strategy: number
  ): Promise<Date> {
    const now = dayjs();
    let days = REVIEW_FREQUENCY_DAYS[strategy as keyof typeof REVIEW_FREQUENCY_DAYS] || 90;

    if (riskLevel === RiskLevel.HIGH) {
      days = HIGH_RISK_REVIEW_DAYS;
    } else if (riskLevel === RiskLevel.HIGH_MEDIUM) {
      days = Math.min(days, 30);
    }

    if (strategy === ReviewFrequencyStrategy.BY_ACTIVITY) {
      const multiDimensionalData = await this.collectMultiDimensionalData(customerId);
      const txCount = multiDimensionalData.transaction_data.transaction_count_30d || 0;
      if (txCount >= 50) {
        days = 15;
      } else if (txCount >= 20) {
        days = 30;
      } else if (txCount >= 10) {
        days = 60;
      }
    }

    if (strategy === ReviewFrequencyStrategy.BY_RISK_CHANGE) {
      const multiDimensionalData = await this.collectMultiDimensionalData(customerId);
      const abnormalCount = multiDimensionalData.transaction_data.abnormal_transaction_count || 0;
      if (abnormalCount >= 5) {
        days = 7;
      } else if (abnormalCount >= 3) {
        days = 15;
      }
    }

    return now.add(days, 'day').toDate();
  }

  async createRiskAssessment(
    request: any,
    operatorId: string,
    orgId: string
  ): Promise<RiskAssessmentVO> {
    const { customer_id, assessment_type, remark, manual_risk_level, manual_risk_tags } = request;

    if (!isValidId(customer_id)) {
      throwValidationError('无效的客户ID');
    }

    if (![1, 2, 3].includes(assessment_type)) {
      throwValidationError('无效的评定类型');
    }

    const customer = await this.customerRepository.findById(customer_id);
    if (!customer) {
      throwNotFoundError('客户不存在');
    }

    const pendingCount = await this.riskAssessmentRepository.countPendingByCustomerId(customer_id);
    if (pendingCount > 0) {
      throwBusinessError('该客户存在待处理的风险评定');
    }

    const syncCheck = await this.checkDataSyncStatus(customer_id);
    if (!syncCheck.can_assess) {
      throwBusinessError(syncCheck.error_message || '数据同步未完成');
    }

    const weightValidation = await this.validateIndicatorWeights();
    if (!weightValidation.is_valid) {
      throwBusinessError(weightValidation.error_message || '指标权重配置无效');
    }

    const multiDimensionalData = await this.collectMultiDimensionalData(customer_id);

    const missingCheck = await this.checkMissingIndicators(multiDimensionalData);
    if (!missingCheck.is_complete) {
      throwBusinessError(missingCheck.error_message || '指标数据不完整');
    }

    const scoreResult = await this.calculateRiskScore(customer_id, multiDimensionalData);

    let finalRiskLevel = scoreResult.risk_level;
    let finalRiskTags = scoreResult.risk_tags;
    let isIllegalDowngrade = 0;
    let blockReason: string | undefined;

    if (assessment_type === AssessmentType.MANUAL_ADJUST && manual_risk_level !== undefined) {
      if (![1, 2, 3, 4].includes(manual_risk_level)) {
        throwValidationError('无效的风险等级');
      }

      const downgradeCheck = await this.checkIllegalDowngrade(customer_id, manual_risk_level, scoreResult.risk_level);
      if (downgradeCheck.is_illegal) {
        isIllegalDowngrade = 1;
        blockReason = downgradeCheck.block_reason;
        throwBusinessError(blockReason || '违规调低风险等级');
      }

      finalRiskLevel = manual_risk_level;
      if (manual_risk_tags && manual_risk_tags.length > 0) {
        finalRiskTags = [...new Set([...finalRiskTags, ...manual_risk_tags])];
      }
    }

    const latestAssessment = await this.riskAssessmentRepository.findLatestByCustomerId(customer_id);
    const previousRiskLevel = latestAssessment?.risk_level;

    const assessmentNo = await this.riskAssessmentRepository.generateAssessmentNo();

    const nextReviewTime = await this.calculateNextReviewTime(
      customer_id,
      finalRiskLevel,
      ReviewFrequencyStrategy.QUARTERLY
    );

    const assessment = await this.riskAssessmentRepository.create({
      assessment_no: assessmentNo,
      customer_id: customer_id,
      customer_no: customer.customer_no,
      customer_name: customer.customer_name,
      assessment_type: assessment_type,
      risk_level: finalRiskLevel,
      risk_tags: finalRiskTags.join(','),
      total_score: scoreResult.total_score,
      indicator_scores: JSON.stringify(scoreResult.indicator_scores),
      credit_score: multiDimensionalData.credit_data.credit_score,
      debt_ratio: multiDimensionalData.debt_data.debt_ratio,
      lawsuit_count: multiDimensionalData.lawsuit_data.lawsuit_count,
      transaction_count_30d: multiDimensionalData.transaction_data.transaction_count_30d,
      transaction_amount_30d: multiDimensionalData.transaction_data.transaction_amount_30d,
      account_open_days: multiDimensionalData.account_behavior_data.account_open_days,
      data_sync_status: DataSyncStatus.SYNCED,
      status: AssessmentStatus.COMPLETED,
      operator_id: operatorId,
      org_id: orgId,
      remark: remark,
      previous_risk_level: previousRiskLevel,
      is_illegal_downgrade: isIllegalDowngrade,
      block_reason: blockReason,
      assessment_time: new Date(),
      next_review_time: nextReviewTime
    });

    await this.updateBusinessPermissions(customer_id, finalRiskLevel);

    return this.getRiskAssessmentById(assessment.id);
  }

  async getRiskAssessmentById(id: string): Promise<RiskAssessmentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的评定ID');
    }

    const assessment = await this.riskAssessmentRepository.findById(id, {
      include: [
        this.riskAssessmentRepository.getCustomerInclude(),
        this.riskAssessmentRepository.getOperatorInclude(),
        this.riskAssessmentRepository.getOrganizationInclude(),
        this.riskAssessmentRepository.getBatchInclude()
      ]
    });

    if (!assessment) {
      throwNotFoundError('风险评定记录不存在');
    }

    return this.convertRiskAssessmentToVO(assessment);
  }

  async getRiskAssessmentList(params: any): Promise<PaginatedResult<RiskAssessmentVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.riskAssessmentRepository.buildQuery(queryParams);

    const include = [
      this.riskAssessmentRepository.getCustomerInclude(),
      this.riskAssessmentRepository.getOperatorInclude(),
      this.riskAssessmentRepository.getOrganizationInclude(),
      this.riskAssessmentRepository.getBatchInclude()
    ];

    const result = await this.riskAssessmentRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: RiskAssessmentVO[] = result.list.map(a => this.convertRiskAssessmentToVO(a));

    return { ...result, list };
  }

  async reviewRiskAssessment(
    id: string,
    operatorId: string,
    request: any
  ): Promise<RiskAssessmentVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的评定ID');
    }

    if (!isValidId(operatorId)) {
      throwValidationError('无效的操作人ID');
    }

    const { risk_level, risk_tags, remark } = request;

    if (![1, 2, 3, 4].includes(risk_level)) {
      throwValidationError('无效的风险等级');
    }

    const assessment = await this.riskAssessmentRepository.findById(id);
    if (!assessment) {
      throwNotFoundError('风险评定记录不存在');
    }

    if (assessment.status !== AssessmentStatus.COMPLETED) {
      throwBusinessError('只能复核已完成的评定记录');
    }

    const downgradeCheck = await this.checkIllegalDowngrade(assessment.customer_id, risk_level, assessment.risk_level);
    if (downgradeCheck.is_illegal) {
      throwBusinessError(downgradeCheck.block_reason || '违规调低风险等级');
    }

    const finalRiskTags = risk_tags && risk_tags.length > 0 ? risk_tags : (assessment.risk_tags ? assessment.risk_tags.split(',') : []);

    const nextReviewTime = await this.calculateNextReviewTime(
      assessment.customer_id,
      risk_level,
      ReviewFrequencyStrategy.QUARTERLY
    );

    await this.riskAssessmentRepository.update(id, {
      risk_level: risk_level,
      risk_tags: finalRiskTags.join(','),
      operator_id: operatorId,
      remark: remark || assessment.remark,
      is_illegal_downgrade: downgradeCheck.is_illegal ? 1 : 0,
      block_reason: downgradeCheck.block_reason,
      next_review_time: nextReviewTime
    });

    await this.updateBusinessPermissions(assessment.customer_id, risk_level);

    return this.getRiskAssessmentById(id);
  }

  async createBatchAssessment(
    request: any,
    creatorId: string,
    orgId: string
  ): Promise<RiskAssessmentBatchVO> {
    const { batch_name, batch_type, customer_ids, filter_condition, review_frequency_strategy, remark } = request;

    if (!batch_name || batch_name.trim() === '') {
      throwValidationError('批次名称不能为空');
    }

    if (![1, 2, 3, 4].includes(batch_type)) {
      throwValidationError('无效的批次类型');
    }

    let customerIds: string[] = [];

    if (batch_type === BatchType.NEW_CUSTOMER) {
      const newCustomers = await this.customerRepository.findByWhere({
        created_at: { [Op.gte]: dayjs().subtract(7, 'day').toDate() }
      });
      customerIds = newCustomers.map(c => c.id);
    } else if (batch_type === BatchType.EXISTING_CUSTOMER) {
      const allCustomers = await this.customerRepository.findAll();
      customerIds = allCustomers.map(c => c.id);
    } else if (batch_type === BatchType.HIGH_RISK_CUSTOMER) {
      const highRiskCustomers = await this.customerRepository.findByWhere({
        risk_level: { [Op.gte]: 4 }
      });
      customerIds = highRiskCustomers.map(c => c.id);
    } else if (batch_type === BatchType.CUSTOM && customer_ids && customer_ids.length > 0) {
      customerIds = customer_ids.filter((id: string) => isValidId(id));
    }

    if (customerIds.length === 0) {
      throwBusinessError('没有符合条件的客户');
    }

    const batchNo = await this.riskAssessmentBatchRepository.generateBatchNo();

    const batch = await this.riskAssessmentBatchRepository.create({
      batch_no: batchNo,
      batch_name: batch_name,
      batch_type: batch_type,
      status: BatchStatus.PENDING,
      total_count: customerIds.length,
      success_count: 0,
      fail_count: 0,
      filter_condition: filter_condition ? JSON.stringify(filter_condition) : null,
      review_frequency_strategy: review_frequency_strategy || ReviewFrequencyStrategy.QUARTERLY,
      creator_id: creatorId,
      org_id: orgId,
      remark: remark
    });

    setTimeout(async () => {
      await this.executeBatchAssessment(batch.id, customerIds, creatorId, orgId, review_frequency_strategy || ReviewFrequencyStrategy.QUARTERLY);
    }, 100);

    return this.getRiskAssessmentBatchById(batch.id);
  }

  async executeBatchAssessment(
    batchId: string,
    customerIds: string[],
    operatorId: string,
    orgId: string,
    strategy: number
  ): Promise<void> {
    try {
      await this.riskAssessmentBatchRepository.update(batchId, {
        status: BatchStatus.EXECUTING,
        execute_start_time: new Date()
      });

      let successCount = 0;
      let failCount = 0;
      const executeLog: string[] = [];

      for (const customerId of customerIds) {
        try {
          await this.createRiskAssessment({
            customer_id: customerId,
            assessment_type: AssessmentType.REVIEW
          }, operatorId, orgId);
          successCount++;
          executeLog.push(`客户${customerId}: 评定成功`);
        } catch (error: any) {
          failCount++;
          executeLog.push(`客户${customerId}: ${error.message || '评定失败'}`);

          const assessmentNo = await this.riskAssessmentRepository.generateAssessmentNo();
          const customer = await this.customerRepository.findById(customerId);
          await this.riskAssessmentRepository.create({
            assessment_no: assessmentNo,
            customer_id: customerId,
            customer_no: customer?.customer_no || '',
            customer_name: customer?.customer_name,
            assessment_type: AssessmentType.REVIEW,
            risk_level: RiskLevel.LOW,
            total_score: 0,
            data_sync_status: DataSyncStatus.FAILED,
            status: AssessmentStatus.REJECTED,
            batch_id: batchId,
            operator_id: operatorId,
            org_id: orgId,
            data_sync_error: error.message || '评定失败'
          });
        }
      }

      const finalStatus = failCount === 0 ? BatchStatus.COMPLETED : failCount === customerIds.length ? BatchStatus.FAILED : BatchStatus.PARTIAL_FAILED;

      await this.riskAssessmentBatchRepository.update(batchId, {
        status: finalStatus,
        success_count: successCount,
        fail_count: failCount,
        execute_end_time: new Date(),
        execute_log: executeLog.join('\n')
      });
    } catch (error: any) {
      await this.riskAssessmentBatchRepository.update(batchId, {
        status: BatchStatus.FAILED,
        execute_end_time: new Date(),
        execute_log: `批量执行失败: ${error.message}`
      });
    }
  }

  async getRiskAssessmentBatchById(id: string): Promise<RiskAssessmentBatchVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的批次ID');
    }

    const batch = await this.riskAssessmentBatchRepository.findById(id, {
      include: [
        this.riskAssessmentBatchRepository.getCreatorInclude(),
        this.riskAssessmentBatchRepository.getOrganizationInclude()
      ]
    });

    if (!batch) {
      throwNotFoundError('批量评定批次不存在');
    }

    return this.convertRiskAssessmentBatchToVO(batch);
  }

  async getRiskAssessmentBatchList(params: any): Promise<PaginatedResult<RiskAssessmentBatchVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.riskAssessmentBatchRepository.buildQuery(queryParams);

    const include = [
      this.riskAssessmentBatchRepository.getCreatorInclude(),
      this.riskAssessmentBatchRepository.getOrganizationInclude()
    ];

    const result = await this.riskAssessmentBatchRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: RiskAssessmentBatchVO[] = result.list.map(b => this.convertRiskAssessmentBatchToVO(b));

    return { ...result, list };
  }

  async getCustomerRiskTrace(customerId: string): Promise<TraceRecord[]> {
    if (!isValidId(customerId)) {
      throwValidationError('无效的客户ID');
    }

    const assessments = await this.riskAssessmentRepository.findByCustomerId(customerId);

    const traceRecords: TraceRecord[] = [];
    for (const assessment of assessments) {
      let indicatorScores: IndicatorScore[] = [];
      try {
        indicatorScores = assessment.indicator_scores ? JSON.parse(assessment.indicator_scores) : [];
      } catch (e) {
        indicatorScores = [];
      }

      const operator = assessment.operator_id ? await this.userRepository.findById(assessment.operator_id) : null;

      traceRecords.push({
        id: assessment.id,
        assessment_no: assessment.assessment_no,
        assessment_type: assessment.assessment_type,
        assessment_type_text: AssessmentTypeText[assessment.assessment_type] || '未知',
        risk_level: assessment.risk_level,
        risk_level_text: RiskLevelText[assessment.risk_level] || '未知',
        risk_tags: assessment.risk_tags ? assessment.risk_tags.split(',') : [],
        total_score: assessment.total_score,
        indicator_scores: indicatorScores,
        operator_id: assessment.operator_id,
        operator_name: operator ? (operator.real_name || operator.username) : undefined,
        assessment_time: assessment.assessment_time,
        remark: assessment.remark,
        is_illegal_downgrade: assessment.is_illegal_downgrade,
        block_reason: assessment.block_reason
      });
    }

    return traceRecords;
  }

  async getRiskIndicatorList(params: any): Promise<PaginatedResult<RiskIndicatorVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.riskIndicatorRepository.buildQuery(queryParams);

    const result = await this.riskIndicatorRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'sort_order', sortOrder: 'ASC' }
    );

    const list: RiskIndicatorVO[] = result.list.map(i => this.convertRiskIndicatorToVO(i));

    return { ...result, list };
  }

  async createRiskIndicator(request: any): Promise<RiskIndicatorVO> {
    const { indicator_code, indicator_name, category, weight, max_score, scoring_rule, is_required, status, sort_order, description } = request;

    if (!indicator_code || indicator_code.trim() === '') {
      throwValidationError('指标编码不能为空');
    }

    if (!indicator_name || indicator_name.trim() === '') {
      throwValidationError('指标名称不能为空');
    }

    if (![1, 2, 3, 4, 5].includes(category)) {
      throwValidationError('无效的指标类别');
    }

    if (weight === undefined || weight < 0 || weight > 100) {
      throwValidationError('权重必须在0-100之间');
    }

    const existing = await this.riskIndicatorRepository.findByIndicatorCode(indicator_code);
    if (existing) {
      throwBusinessError('指标编码已存在');
    }

    const indicator = await this.riskIndicatorRepository.create({
      indicator_code: indicator_code,
      indicator_name: indicator_name,
      category: category,
      weight: weight,
      max_score: max_score || 100,
      scoring_rule: scoring_rule ? JSON.stringify(scoring_rule) : null,
      is_required: is_required !== undefined ? is_required : 1,
      status: status !== undefined ? status : 1,
      sort_order: sort_order || 0,
      description: description
    });

    return this.convertRiskIndicatorToVO(indicator);
  }

  async updateRiskIndicator(id: string, request: any): Promise<RiskIndicatorVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的指标ID');
    }

    const indicator = await this.riskIndicatorRepository.findById(id);
    if (!indicator) {
      throwNotFoundError('风险指标不存在');
    }

    const { indicator_name, category, weight, max_score, scoring_rule, is_required, status, sort_order, description } = request;

    const updateData: any = {};

    if (indicator_name !== undefined) {
      updateData.indicator_name = indicator_name;
    }
    if (category !== undefined) {
      if (![1, 2, 3, 4, 5].includes(category)) {
        throwValidationError('无效的指标类别');
      }
      updateData.category = category;
    }
    if (weight !== undefined) {
      if (weight < 0 || weight > 100) {
        throwValidationError('权重必须在0-100之间');
      }
      updateData.weight = weight;
    }
    if (max_score !== undefined) {
      updateData.max_score = max_score;
    }
    if (scoring_rule !== undefined) {
      updateData.scoring_rule = JSON.stringify(scoring_rule);
    }
    if (is_required !== undefined) {
      updateData.is_required = is_required;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (sort_order !== undefined) {
      updateData.sort_order = sort_order;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    await this.riskIndicatorRepository.update(id, updateData);

    return this.getRiskIndicatorById(id);
  }

  async getRiskIndicatorById(id: string): Promise<RiskIndicatorVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的指标ID');
    }

    const indicator = await this.riskIndicatorRepository.findById(id);
    if (!indicator) {
      throwNotFoundError('风险指标不存在');
    }

    return this.convertRiskIndicatorToVO(indicator);
  }

  async deleteRiskIndicator(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的指标ID');
    }

    const indicator = await this.riskIndicatorRepository.findById(id);
    if (!indicator) {
      throwNotFoundError('风险指标不存在');
    }

    await this.riskIndicatorRepository.delete(id);
  }

  private convertRiskAssessmentToVO(assessment: any): RiskAssessmentVO {
    const data = assessment.toJSON ? assessment.toJSON() : assessment;
    const vo: RiskAssessmentVO = { ...data };

    if (data.customer) {
      vo.customer_name = data.customer.customer_name;
    }
    if (data.operator) {
      vo.operator_name = data.operator.real_name || data.operator.username;
    }
    if (data.organization) {
      vo.org_name = data.organization.name;
    }
    if (data.batch) {
      vo.batch_no = data.batch.batch_no;
    }

    vo.assessment_type_text = AssessmentTypeText[data.assessment_type] || '未知';
    vo.risk_level_text = RiskLevelText[data.risk_level] || '未知';
    vo.risk_level_color = RiskLevelColor[data.risk_level] || '';
    vo.data_sync_status_text = DataSyncStatusText[data.data_sync_status] || '未知';
    vo.status_text = AssessmentStatusText[data.status] || '未知';
    vo.previous_risk_level_text = data.previous_risk_level ? RiskLevelText[data.previous_risk_level] : undefined;

    if (data.risk_tags) {
      vo.risk_tag_list = data.risk_tags.split(',').filter((t: string) => t.trim() !== '');
    } else {
      vo.risk_tag_list = [];
    }

    if (data.indicator_scores) {
      try {
        vo.indicator_scores = JSON.parse(data.indicator_scores);
      } catch (e) {
        vo.indicator_scores = [];
      }
    }

    return vo;
  }

  private convertRiskAssessmentBatchToVO(batch: any): RiskAssessmentBatchVO {
    const data = batch.toJSON ? batch.toJSON() : batch;
    const vo: RiskAssessmentBatchVO = { ...data };

    if (data.creator) {
      vo.creator_name = data.creator.real_name || data.creator.username;
    }
    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    vo.batch_type_text = BatchTypeText[data.batch_type] || '未知';
    vo.status_text = BatchStatusText[data.status] || '未知';
    vo.review_frequency_strategy_text = ReviewFrequencyStrategyText[data.review_frequency_strategy] || '未知';

    if (data.total_count > 0) {
      vo.progress = Number(((data.success_count / data.total_count) * 100).toFixed(2));
    } else {
      vo.progress = 0;
    }

    if (data.filter_condition) {
      try {
        vo.filter_condition = JSON.parse(data.filter_condition);
      } catch (e) {
        vo.filter_condition = null;
      }
    }

    return vo;
  }

  private convertRiskIndicatorToVO(indicator: any): RiskIndicatorVO {
    const data = indicator.toJSON ? indicator.toJSON() : indicator;
    const vo: RiskIndicatorVO = { ...data };

    vo.category_text = IndicatorCategoryText[data.category] || '未知';

    if (data.scoring_rule) {
      try {
        vo.scoring_rule = JSON.parse(data.scoring_rule);
      } catch (e) {
        vo.scoring_rule = null;
      }
    }

    return vo;
  }
}