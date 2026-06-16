import { AuditRecordRepository, AuditRuleRepository, TransactionRepository, UserRepository } from '../repositories';
import {
  AuditRequest,
  AuditApprovalRequest,
  AuditQueryParams,
  PaginatedResult,
  AuditVO,
  AuditRuleRequest
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const auditStatusMap: Record<number, string> = {
  0: '待审核',
  1: '审核中',
  2: '已完成',
  3: '已取消'
};

const auditResultMap: Record<number, string> = {
  1: '通过',
  2: '拒绝'
};

const auditTypeMap: Record<number, string> = {
  1: '普通审核',
  2: '金额审核',
  3: '特殊审核'
};

export class AuditService {
  private auditRecordRepository: AuditRecordRepository;
  private auditRuleRepository: AuditRuleRepository;
  private transactionRepository: TransactionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.auditRecordRepository = new AuditRecordRepository();
    this.auditRuleRepository = new AuditRuleRepository();
    this.transactionRepository = new TransactionRepository();
    this.userRepository = new UserRepository();
  }

  async getAuditList(params: AuditQueryParams, currentUserId?: string): Promise<PaginatedResult<AuditVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.auditRecordRepository.buildQuery(queryParams);

    const include = [
      this.auditRecordRepository.getSubmitterInclude(),
      this.auditRecordRepository.getAuditorInclude()
    ];

    const result = await this.auditRecordRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'createdAt', sortOrder: 'DESC' },
      { include }
    );

    const list: AuditVO[] = result.list.map(a => this.convertToVO(a));

    return { ...result, list };
  }

  private convertToVO(a: any): AuditVO {
    const data = a.toJSON ? a.toJSON() : a;
    const vo: AuditVO = { ...data };

    if (data.submitter) {
      vo.submitter_name = data.submitter.real_name || data.submitter.username;
    }
    if (data.auditor) {
      vo.auditor_name = data.auditor.real_name || data.auditor.username;
    }

    vo.status_text = auditStatusMap[data.status] || '未知';
    vo.result_text = data.result ? (auditResultMap[data.result] || '未知') : undefined;
    vo.type_text = auditTypeMap[data.type] || '未知';

    return vo;
  }

  async getAuditById(id: string): Promise<AuditVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的审核ID');
    }

    const audit = await this.auditRecordRepository.findById(id, {
      include: [
        this.auditRecordRepository.getSubmitterInclude(),
        this.auditRecordRepository.getAuditorInclude()
      ]
    });

    if (!audit) {
      throwNotFoundError('审核记录不存在');
    }

    return this.convertToVO(audit);
  }

  async submitAudit(request: AuditRequest, submitterId: string, submitterOrgId?: string): Promise<AuditVO> {
    const { biz_type, biz_id, biz_no } = request;

    if (!biz_type || !biz_id || !biz_no) {
      throwValidationError('业务类型、业务ID和业务编号不能为空');
    }

    const existing = await this.auditRecordRepository.findByBiz(biz_type, biz_id);
    if (existing && existing.status !== 2 && existing.status !== 3) {
      throwBusinessError('该业务已存在待处理的审核记录');
    }

    const audit = await this.auditRecordRepository.create({
      ...request,
      status: 0,
      submitter_id: submitterId,
      submitter_org_id: submitterOrgId,
      submit_time: new Date()
    });

    return this.getAuditById(audit.id);
  }

  async approveAudit(request: AuditApprovalRequest, auditorId: string, auditorOrgId?: string): Promise<AuditVO> {
    const { id, result, audit_remark } = request;

    if (!isValidId(id)) {
      throwValidationError('无效的审核ID');
    }

    if (![1, 2].includes(result)) {
      throwValidationError('审核结果无效');
    }

    const audit = await this.auditRecordRepository.findById(id);
    if (!audit) {
      throwNotFoundError('审核记录不存在');
    }

    if (audit.status === 2 || audit.status === 3) {
      throwBusinessError('该审核已完成，不能重复审核');
    }

    await this.auditRecordRepository.update(id, {
      status: 2,
      result,
      audit_remark,
      auditor_id: auditorId,
      auditor_org_id: auditorOrgId,
      audit_time: new Date()
    });

    if (audit.biz_type === 'transaction' && result === 1) {
      await this.transactionRepository.update(audit.biz_id, {
        audit_status: 2,
        status: 2
      });
    } else if (audit.biz_type === 'transaction' && result === 2) {
      await this.transactionRepository.update(audit.biz_id, {
        audit_status: 3,
        status: 5
      });
    }

    return this.getAuditById(id);
  }

  async cancelAudit(id: string, operatorId: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的审核ID');
    }

    const audit = await this.auditRecordRepository.findById(id);
    if (!audit) {
      throwNotFoundError('审核记录不存在');
    }

    if (audit.submitter_id !== operatorId) {
      throwBusinessError('只能取消自己提交的审核');
    }

    if (audit.status === 2 || audit.status === 3) {
      throwBusinessError('该审核已完成，不能取消');
    }

    await this.auditRecordRepository.update(id, { status: 3 });

    if (audit.biz_type === 'transaction') {
      await this.transactionRepository.update(audit.biz_id, {
        audit_status: 3,
        status: 5
      });
    }
  }

  async getPendingAudits(auditorId: string): Promise<AuditVO[]> {
    const audits = await this.auditRecordRepository.findPendingByAuditor(auditorId);
    return audits.map(a => this.convertToVO(a));
  }

  async getAuditRuleList(params: any): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 10, ...queryParams } = params;
    const where = this.auditRuleRepository.buildQuery(queryParams);

    return await this.auditRuleRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'sort', sortOrder: 'ASC' }
    );
  }

  async getAuditRuleById(id: string): Promise<any> {
    if (!isValidId(id)) {
      throwValidationError('无效的规则ID');
    }

    const rule = await this.auditRuleRepository.findById(id);
    if (!rule) {
      throwNotFoundError('审核规则不存在');
    }

    return rule.toJSON ? rule.toJSON() : rule;
  }

  async createAuditRule(request: AuditRuleRequest): Promise<any> {
    const { name, code, ...ruleData } = request;

    if (!name || name.trim().length === 0) {
      throwValidationError('规则名称不能为空');
    }

    if (!code || code.trim().length === 0) {
      throwValidationError('规则编码不能为空');
    }

    const existing = await this.auditRuleRepository.findByCode(code);
    if (existing) {
      throwBusinessError('规则编码已存在');
    }

    if (![1, 2].includes(request.rule_type)) {
      throwValidationError('规则类型无效');
    }

    if (![1, 2, 3].includes(request.audit_level)) {
      throwValidationError('审核级别无效');
    }

    const rule = await this.auditRuleRepository.create({
      ...ruleData,
      name: name.trim(),
      code: code.trim(),
      status: request.status ?? 1
    });

    return this.getAuditRuleById(rule.id);
  }

  async updateAuditRule(id: string, request: Partial<AuditRuleRequest>): Promise<any> {
    if (!isValidId(id)) {
      throwValidationError('无效的规则ID');
    }

    const rule = await this.auditRuleRepository.findById(id);
    if (!rule) {
      throwNotFoundError('审核规则不存在');
    }

    await this.auditRuleRepository.update(id, request);

    return this.getAuditRuleById(id);
  }

  async deleteAuditRule(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的规则ID');
    }

    const rule = await this.auditRuleRepository.findById(id);
    if (!rule) {
      throwNotFoundError('审核规则不存在');
    }

    await this.auditRuleRepository.delete(id);
  }

  async batchDeleteAuditRules(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的规则');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的规则ID');
      }
    }

    await this.auditRuleRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async updateAuditRuleStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的规则ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const rule = await this.auditRuleRepository.findById(id);
    if (!rule) {
      throwNotFoundError('审核规则不存在');
    }

    await this.auditRuleRepository.update(id, { status });
  }

  async getAuditStatistics(startTime?: string, endTime?: string): Promise<any> {
    const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const where: any = {
      createdAt: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };

    const all = await this.auditRecordRepository.findByWhere(where);

    const total = all.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    for (const audit of all) {
      if (audit.status === 0 || audit.status === 1) {
        pending++;
      } else if (audit.status === 2 && audit.result === 1) {
        approved++;
      } else if (audit.status === 2 && audit.result === 2) {
        rejected++;
      } else if (audit.status === 3) {
        cancelled++;
      }
    }

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      approval_rate: total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0,
      start_time: dayjs(start).format('YYYY-MM-DD'),
      end_time: dayjs(end).format('YYYY-MM-DD')
    };
  }
}