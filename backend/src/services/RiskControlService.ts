import { TransactionRepository, CustomerRepository, ViolationRepository, UserRepository, OrganizationRepository } from '../repositories';
import {
  PaginatedResult
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

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

const LOCAL_BANK_CODE_PREFIX = '102';

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

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.customerRepository = new CustomerRepository();
    this.violationRepository = new ViolationRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
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
}
