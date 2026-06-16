import { TransactionRepository, ProductRepository, OrganizationRepository, AuditRecordRepository, AuditRuleRepository } from '../repositories';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  PaginatedResult,
  TransactionVO,
  AuditStatus
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId, isValidAmount } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const transactionStatusMap: Record<number, string> = {
  0: '待处理',
  1: '处理中',
  2: '成功',
  3: '失败',
  4: '已冲正',
  5: '已撤销'
};

const auditStatusMap: Record<number, string> = {
  0: '待审核',
  1: '审核中',
  2: '审核通过',
  3: '审核拒绝'
};

const transactionTypeMap: Record<number, string> = {
  1: '存款',
  2: '取款',
  3: '转账',
  4: '理财购买'
};

export class TransactionService {
  private transactionRepository: TransactionRepository;
  private productRepository: ProductRepository;
  private organizationRepository: OrganizationRepository;
  private auditRecordRepository: AuditRecordRepository;
  private auditRuleRepository: AuditRuleRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.productRepository = new ProductRepository();
    this.organizationRepository = new OrganizationRepository();
    this.auditRecordRepository = new AuditRecordRepository();
    this.auditRuleRepository = new AuditRuleRepository();
  }

  async getTransactionList(params: TransactionQueryParams, currentUserId?: string, userOrgId?: string): Promise<PaginatedResult<TransactionVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.transactionRepository.buildQuery(queryParams);

    const include = [
      this.transactionRepository.getProductInclude(),
      this.transactionRepository.getOrganizationInclude(),
      this.transactionRepository.getOperatorInclude()
    ];

    const result = await this.transactionRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'createdAt', sortOrder: 'DESC' },
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

    vo.status_text = transactionStatusMap[data.status] || '未知';
    vo.audit_status_text = auditStatusMap[data.audit_status] || '未知';
    vo.type_text = transactionTypeMap[data.type] || '未知';

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
        this.transactionRepository.getOperatorInclude()
      ]
    });

    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    return this.convertToVO(transaction);
  }

  async createTransaction(request: CreateTransactionRequest, operatorId: string, orgId?: string): Promise<TransactionVO> {
    const { type, amount, product_id, org_id, ...txData } = request;

    if (![1, 2, 3, 4].includes(type)) {
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

    const transactionNo = await this.transactionRepository.generateTransactionNo();

    let auditStatus: AuditStatus = 2;
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
      status: needAudit ? 0 : 2,
      audit_status: auditStatus,
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
        submit_time: new Date()
      });
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

    if (transaction.audit_status === 2 && transaction.status === 2) {
      throwBusinessError('已完成的交易不能修改');
    }

    await this.transactionRepository.update(id, request);

    return this.getTransactionById(id);
  }

  async cancelTransaction(id: string, operatorId: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的交易ID');
    }

    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throwNotFoundError('交易不存在');
    }

    if (transaction.status === 2) {
      throwBusinessError('已完成的交易不能撤销');
    }

    if (transaction.status === 5) {
      throwBusinessError('交易已撤销');
    }

    await this.transactionRepository.update(id, { status: 5 });
  }

  async getTransactionStatistics(startTime?: string, endTime?: string, orgId?: string): Promise<any> {
    const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const where: any = {
      createdAt: {
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
      4: { count: 0, amount: 0 }
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