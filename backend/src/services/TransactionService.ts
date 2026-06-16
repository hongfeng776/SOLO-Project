import { TransactionRepository, ProductRepository, OrganizationRepository, AuditRecordRepository, AuditRuleRepository, CustomerRepository } from '../repositories';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  PaginatedResult,
  TransactionVO,
  AuditStatus,
  TransactionStatus,
  BatchOperationRequest
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId, isValidAmount } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { RiskControlService } from './RiskControlService';

const transactionStatusMap: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '成功',
  3: '失败',
  4: '已冲正',
  5: '已撤销',
  6: '冻结',
  7: '退款中',
  8: '已退款'
};

const auditStatusMap: Record<number, string> = {
  0: '待审核',
  1: '一级审核中',
  2: '二级审核中',
  3: '三级审核中',
  10: '审核通过',
  11: '审核拒绝'
};

const transactionTypeMap: Record<number, string> = {
  1: '存款',
  2: '取款',
  3: '转账',
  4: '理财购买',
  5: '贷款发放',
  6: '缴费支付',
  7: '结售汇',
  8: '信用卡还款'
};

const channelCodeMap: Record<string, string> = {
  counter: '柜面渠道',
  mobile: '手机银行',
  ebank: '网上银行',
  atm: '自助终端',
  phone: '电话银行',
  smart: '智慧柜员机',
  pos: 'POS终端',
  wechat: '微信渠道',
  alipay: '支付宝渠道'
};

const riskLevelMap: Record<number, string> = {
  0: '无风险',
  1: '低',
  2: '中低',
  3: '中',
  4: '中高',
  5: '高'
};

const STATUS_MUTEX_RULES: Partial<Record<TransactionStatus, TransactionStatus[]>> = {
  2: [0, 1, 2, 5, 4],
  3: [0, 1, 3],
  4: [2, 4],
  5: [0, 5],
  6: [0, 1, 6],
  7: [2, 7],
  8: [2, 7, 8]
};

export class TransactionService {
  private transactionRepository: TransactionRepository;
  private productRepository: ProductRepository;
  private organizationRepository: OrganizationRepository;
  private auditRecordRepository: AuditRecordRepository;
  private auditRuleRepository: AuditRuleRepository;
  private customerRepository: CustomerRepository;
  private riskControlService: RiskControlService;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.productRepository = new ProductRepository();
    this.organizationRepository = new OrganizationRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.auditRuleRepository = new AuditRuleRepository();
    this.customerRepository = new CustomerRepository();
    this.riskControlService = new RiskControlService();
  }

  private checkStatusMutex(currentStatus: TransactionStatus, targetStatus: TransactionStatus): void {
    const disallowed = STATUS_MUTEX_RULES[targetStatus];
    if (disallowed && disallowed.includes(currentStatus)) {
      throwBusinessError(`状态互斥校验失败：当前状态【${transactionStatusMap[currentStatus] || currentStatus}】不允许流转到【${transactionStatusMap[targetStatus] || targetStatus}】`);
    }
    if (currentStatus === targetStatus) {
      throwBusinessError(`交易已是【${transactionStatusMap[currentStatus] || currentStatus}】状态，无需重复操作`);
    }
  }

  private async checkIdempotency(requestId?: string): Promise<void> {
    if (!requestId) return;
    const existed = await this.transactionRepository.findByRequestId(requestId);
    if (existed) {
      throwBusinessError(`重复提交请求：requestId=${requestId}，交易流水号：${existed.transaction_no}`);
    }
  }

  async getTransactionList(params: TransactionQueryParams, currentUserId?: string, userOrgId?: string): Promise<PaginatedResult<TransactionVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.transactionRepository.buildQuery(queryParams);

    if (userOrgId && !queryParams.org_id) {
      where.org_id = userOrgId;
    }

    const include = [
      this.transactionRepository.getProductInclude(),
      this.transactionRepository.getOrganizationInclude(),
      this.transactionRepository.getOperatorInclude(),
      this.transactionRepository.getCustomerInclude()
    ];

    const result = await this.transactionRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'transaction_time', sortOrder: 'DESC' },
      { include }
    );

    const list: TransactionVO[] = result.list.map(t => this.convertToVO(t));

    return { ...result, list };
  }

  private convertToVO(t: any): TransactionVO {
    const data = t.toJSON ? t.toJSON() : t;
    const vo: TransactionVO = { ...data };

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

    vo.status_text = transactionStatusMap[data.status] || '未知';
    vo.audit_status_text = auditStatusMap[data.audit_status] || '未知';
    vo.type_text = transactionTypeMap[data.type] || '未知';
    vo.channel_text = (data.channel_code && channelCodeMap[data.channel_code]) || data.channel_code || '未知';
    vo.risk_level_text = (data.risk_level !== undefined && riskLevelMap[data.risk_level]) || undefined;

    return vo;
  }

  async getTransactionById(id: string): Promise<TransactionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }

    const transaction = await this.transactionRepository.findById(id, {
      include: [
        this.transactionRepository.getProductInclude(),
        this.transactionRepository.getOrganizationInclude(),
        this.transactionRepository.getOperatorInclude(),
        this.transactionRepository.getCustomerInclude()
      ]
    });

    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    return this.convertToVO(transaction);
  }

  async createTransaction(request: CreateTransactionRequest, operatorId: string, orgId?: string): Promise<TransactionVO> {
    const { type, amount, product_id, org_id, request_id, channel_code, customer_no, ...txData } = request;

    await this.checkIdempotency(request_id);

    if (![1, 2, 3, 4, 5, 6, 7, 8].includes(type)) {
      throwValidationError('交易类型无效');
    }

    if (!isValidAmount(amount) || amount <= 0) {
      throwValidationError('交易金额无效');
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
        throwBusinessError('产品已下架');
      }
      if (product.min_amount && amount < product.min_amount) {
        throwBusinessError(`金额低于产品起购金额: ${product.min_amount}`);
      }
      if (product.max_amount && product.max_amount > 0 && amount > product.max_amount) {
        throwBusinessError(`金额超过产品最高金额: ${product.max_amount}`);
      }
    }

    const targetOrgId = org_id || orgId;
    if (targetOrgId && !isValidId(targetOrgId)) {
      throwValidationError('无效的机构ID');
    }
    if (targetOrgId) {
      const org = await this.organizationRepository.findById(targetOrgId);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    let resolvedCustomerId: string | undefined;
    if (customer_no) {
      const customer = await this.customerRepository.findByCustomerNo(customer_no);
      if (customer) {
        resolvedCustomerId = customer.id;
      }
    }

    const transactionNo = await this.transactionRepository.generateTransactionNo();

    let auditStatus: AuditStatus = 10;
    let needAudit = false;
    let auditLevel = 1;

    const auditRules = await this.auditRuleRepository.findMatchingRules('transaction', amount);
    if (auditRules.length > 0) {
      needAudit = true;
      auditStatus = 0;
      auditLevel = auditRules[0].audit_level || 1;
    }

    const transaction = await this.transactionRepository.create({
      ...txData,
      transaction_no: transactionNo,
      type,
      amount,
      product_id,
      org_id: targetOrgId,
      operator_id: operatorId,
      channel_code,
      customer_id: resolvedCustomerId,
      customer_no,
      request_id,
      status: needAudit ? 0 : 2,
      audit_status: auditStatus,
      current_node: needAudit ? 'AUDIT_PENDING' : 'COMPLETED',
      next_node: needAudit ? 'AUDIT_LEVEL_1' : undefined,
      transaction_time: new Date()
    });

    if (needAudit) {
      await this.auditRecordRepository.create({
        biz_type: 'transaction',
        biz_id: transaction.id,
        biz_no: transactionNo,
        type: amount > 100000 ? 2 : 1,
        level: auditLevel,
        status: 0,
        submitter_id: operatorId,
        submitter_org_id: targetOrgId,
        submit_time: new Date(),
        current_node: auditLevel === 1 ? 'AUDIT_LEVEL_1' : auditLevel === 2 ? 'AUDIT_LEVEL_2' : 'AUDIT_LEVEL_3'
      });
    }

    try {
      await this.riskControlService.evaluateTransactionRisk(transaction.id);
    } catch (e) {
      // 风控评估不影响主流程
    }

    return this.getTransactionById(transaction.id);
  }

  async updateTransaction(id: string, request: UpdateTransactionRequest): Promise<TransactionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }

    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    if (transaction.audit_status === 10 && transaction.status === 2) {
      throwBusinessError('已完成的交易不能修改');
    }

    await this.transactionRepository.update(id, request);

    return this.getTransactionById(id);
  }

  async cancelTransaction(id: string, operatorId: string): Promise<TransactionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }

    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    this.checkStatusMutex(transaction.status as TransactionStatus, 5);

    await this.transactionRepository.update(id, {
      status: 5,
      current_node: 'CANCELLED',
      next_node: undefined
    });

    return this.getTransactionById(id);
  }

  async freezeTransaction(id: string, operatorId: string, remark?: string): Promise<TransactionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throwNotFoundError('交易不存在');
    this.checkStatusMutex(transaction.status as TransactionStatus, 6);

    await this.transactionRepository.update(id, {
      status: 6,
      current_node: 'FROZEN',
      next_node: undefined,
      remark: remark || transaction.remark
    });

    return this.getTransactionById(id);
  }

  async reverseTransaction(id: string, operatorId: string, remark?: string): Promise<TransactionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throwNotFoundError('交易不存在');
    this.checkStatusMutex(transaction.status as TransactionStatus, 4);

    const reverseNo = await this.transactionRepository.generateTransactionNo();
    await this.transactionRepository.create({
      transaction_no: reverseNo,
      type: transaction.type,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      payer_account: transaction.payee_account,
      payer_name: transaction.payee_name,
      payee_account: transaction.payer_account,
      payee_name: transaction.payer_name,
      product_id: transaction.product_id,
      org_id: transaction.org_id,
      operator_id: operatorId,
      channel_code: transaction.channel_code,
      customer_id: transaction.customer_id,
      customer_no: transaction.customer_no,
      status: 2,
      audit_status: 10,
      original_transaction_no: transaction.transaction_no,
      current_node: 'REVERSED',
      remark: remark || `冲正交易：原流水 ${transaction.transaction_no}`,
      transaction_time: new Date()
    });

    await this.transactionRepository.update(id, {
      status: 4,
      current_node: 'REVERSED',
      next_node: undefined
    });

    return this.getTransactionById(id);
  }

  async batchOperation(request: BatchOperationRequest, operatorId: string): Promise<{ success_count: number; fail_count: number; details: any[] }> {
    const { ids, operation, remark } = request || {} as any;
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要操作的交易');
    }
    if (!['cancel', 'freeze', 'reverse'].includes(operation as string)) {
      throwValidationError('无效的批量操作类型');
    }

    const details: any[] = [];
    let success = 0;
    let fail = 0;

    for (const id of ids) {
      try {
        if (operation === 'cancel') {
          await this.cancelTransaction(id, operatorId);
        } else if (operation === 'freeze') {
          await this.freezeTransaction(id, operatorId, remark);
        } else if (operation === 'reverse') {
          await this.reverseTransaction(id, operatorId, remark);
        }
        success++;
        details.push({ id, success: true });
      } catch (err: any) {
        fail++;
        details.push({ id, success: false, message: err?.message || '操作失败' });
      }
    }

    return { success_count: success, fail_count: fail, details };
  }

  async syncChannelTransaction(request: any): Promise<TransactionVO> {
    const { channel_code, channel_terminal, external_txn_no, ...rest } = request || {};
    if (!channel_code) {
      throwValidationError('渠道编码不能为空');
    }
    if (!channelCodeMap[channel_code]) {
      throwValidationError(`不支持的渠道编码：${channel_code}`);
    }
    return await this.createTransaction(
      { ...rest, channel_code, channel_terminal, request_id: external_txn_no || rest.request_id },
      rest.operator_id || 'system',
      rest.org_id
    );
  }

  async getTransactionStatistics(startTime?: string, endTime?: string, orgId?: string): Promise<any> {
    const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const where: any = {
      transaction_time: {
        [Op.gte]: start,
        [Op.lte]: end
      },
      status: 2
    };

    if (orgId) {
      where.org_id = orgId;
    }

    const allTransactions = await this.transactionRepository.findByWhere(where);

    let totalAmount = 0;
    let totalCount = allTransactions.length;
    const typeStats: Record<number, { count: number; amount: number }> = {
      1: { count: 0, amount: 0 },
      2: { count: 0, amount: 0 },
      3: { count: 0, amount: 0 },
      4: { count: 0, amount: 0 },
      5: { count: 0, amount: 0 },
      6: { count: 0, amount: 0 },
      7: { count: 0, amount: 0 },
      8: { count: 0, amount: 0 }
    };

    for (const tx of allTransactions) {
      const amount = Number(tx.amount) || 0;
      totalAmount += amount;
      if (typeStats[tx.type]) {
        typeStats[tx.type].count++;
        typeStats[tx.type].amount += amount;
      }
    }

    return {
      total_count: totalCount,
      total_amount: Number(totalAmount.toFixed(2)),
      type_stats: typeStats,
      start_time: dayjs(start).format('YYYY-MM-DD'),
      end_time: dayjs(end).format('YYYY-MM-DD')
    };
  }
}
