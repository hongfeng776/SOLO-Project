import { BlacklistRecordRepository, BlacklistBatchRepository, BlacklistTraceLogRepository, CustomerRepository, ViolationRepository, AccountRepository, UserRepository } from '../repositories';
import {
  PaginatedResult, BlacklistGradeText, BlacklistGradeColor, BlacklistStatusText, BlacklistStatusColor,
  BusinessRestrictionTypeText, EvidenceTypeText, BlacklistTraceTypeText, BlacklistBatchTypeText,
  BlacklistBatchStatusText, ViolationTypeText, BlacklistGrade, BlacklistStatus, BlacklistTraceType,
  BlacklistBatchStatus, BusinessRestrictionType, GradeConfig, ReleaseCondition, BusinessRestrictionConfig,
  BlacklistVO, BlacklistBatchVO, BlacklistTraceVO, BlacklistStatisticsVO, BlacklistComplianceCheckResult,
  BlacklistPreCheckResult, EvidenceItem, BusinessStatusInfo, PendingBusinessInfo, BlacklistGradeConfigVO
} from '../types';
import { throwBusinessError, throwNotFoundError, throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const GRADE_CONFIGS: GradeConfig[] = [
  {
    grade: 1,
    default_duration_days: 7,
    review_cycle_days: 7,
    restrictions: [
      { restriction_type: 1, is_enabled: true, description: '禁止大额交易' },
      { restriction_type: 5, is_enabled: true, description: '取现限额单日5万' }
    ],
    release_condition: {
      min_duration_days: 3,
      rectification_required: true,
      review_required: true,
      approval_required: false
    },
    allow_manual_remove: true,
    allow_extend: true,
    max_extend_days: 14
  },
  {
    grade: 2,
    default_duration_days: 30,
    review_cycle_days: 15,
    restrictions: [
      { restriction_type: 1, is_enabled: true, description: '禁止交易' },
      { restriction_type: 2, is_enabled: false, description: '账户冻结' },
      { restriction_type: 3, is_enabled: true, description: '拒绝贷款申请' },
      { restriction_type: 4, is_enabled: true, description: '拒绝开卡申请' }
    ],
    release_condition: {
      min_duration_days: 15,
      rectification_required: true,
      review_required: true,
      approval_required: true
    },
    allow_manual_remove: true,
    allow_extend: true,
    max_extend_days: 60
  },
  {
    grade: 3,
    default_duration_days: 180,
    review_cycle_days: 30,
    restrictions: [
      { restriction_type: 1, is_enabled: true, description: '禁止所有交易' },
      { restriction_type: 2, is_enabled: true, description: '账户冻结' },
      { restriction_type: 3, is_enabled: true, description: '拒绝贷款申请' },
      { restriction_type: 4, is_enabled: true, description: '拒绝开卡申请' },
      { restriction_type: 5, is_enabled: true, description: '禁止取现' }
    ],
    release_condition: {
      min_duration_days: 90,
      rectification_required: true,
      review_required: true,
      approval_required: true,
      additional_conditions: ['需提供监管部门认可的整改证明']
    },
    allow_manual_remove: false,
    allow_extend: true,
    max_extend_days: 365
  },
  {
    grade: 4,
    default_duration_days: undefined,
    review_cycle_days: 90,
    restrictions: [
      { restriction_type: 6, is_enabled: true, description: '全渠道业务限制' }
    ],
    release_condition: {
      min_duration_days: 365,
      rectification_required: true,
      review_required: true,
      approval_required: true,
      additional_conditions: ['需经风控委员会审议通过', '需提供司法机关解除证明']
    },
    allow_manual_remove: false,
    allow_extend: false
  }
];

export class BlacklistService {
  private blacklistRepo = new BlacklistRecordRepository();
  private batchRepo = new BlacklistBatchRepository();
  private traceRepo = new BlacklistTraceLogRepository();
  private customerRepo = new CustomerRepository();
  private violationRepo = new ViolationRepository();
  private accountRepo = new AccountRepository();
  private userRepo = new UserRepository();

  getGradeConfig(grade: number): GradeConfig {
    return GRADE_CONFIGS.find(c => c.grade === grade) || GRADE_CONFIGS[0];
  }

  async preCheck(customerId: string): Promise<BlacklistPreCheckResult> {
    if (!isValidId(customerId)) throwValidationError('无效的客户ID');

    const customer = await this.customerRepo.findById(customerId);
    if (!customer) throwNotFoundError('客户不存在');

    const failedReasons: string[] = [];
    const missingEvidence: string[] = [];
    const incompleteProcesses: string[] = [];

    const violationRecords = await this.violationRepo.findByWhere({
      customer_id: customerId,
      status: { [Op.in]: [0, 1, 2] }
    });

    if (violationRecords.length === 0) {
      failedReasons.push('客户无待处理或处理中的违规记录');
    }

    const pendingViolations = violationRecords.filter((v: any) => v.status === 0 || v.status === 1);
    if (pendingViolations.length > 0) {
      incompleteProcesses.push(`存在${pendingViolations.length}条未完成处理的违规记录`);
    }

    const evidenceItems: EvidenceItem[] = [];
    for (const vr of violationRecords) {
      evidenceItems.push({
        evidence_type: 1,
        evidence_id: vr.id,
        evidence_no: vr.violation_no,
        evidence_name: ViolationTypeText[vr.violation_type || 9] || '其他违规',
        upload_time: vr.createdAt ? dayjs(vr.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined
      });
    }

    if (evidenceItems.length === 0) {
      missingEvidence.push('缺少违规事实证据');
    }

    const accounts = await this.accountRepo.findByWhere({ customer_id: customerId });
    const businessStatuses: BusinessStatusInfo[] = accounts.map((acc: any) => ({
      account_id: acc.id,
      account_no: acc.account_no,
      account_type: acc.account_type,
      account_status: acc.status,
      is_locked: false
    }));

    const pendingBusinesses: PendingBusinessInfo[] = [];

    const activeBlacklist = await this.blacklistRepo.findActiveByCustomerId(customerId);
    if (activeBlacklist) {
      failedReasons.push('客户已在黑名单中');
    }

    const passed = failedReasons.length === 0 && missingEvidence.length === 0 && incompleteProcesses.length === 0;

    return {
      passed,
      failed_reasons: failedReasons,
      violation_records: violationRecords,
      evidence_items: evidenceItems,
      missing_evidence: missingEvidence,
      incomplete_processes: incompleteProcesses,
      business_statuses: businessStatuses,
      pending_businesses: pendingBusinesses
    };
  }

  async getBlacklistList(params: any): Promise<PaginatedResult<BlacklistVO>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const where = this.blacklistRepo.buildQuery(params);

    const result = await this.blacklistRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include: this.blacklistRepo.getDefaultInclude() }
    );

    return {
      ...result,
      list: result.list.map(item => this.convertToVO(item))
    };
  }

  async getBlacklistDetail(id: string): Promise<BlacklistVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id, {
      include: this.blacklistRepo.getDefaultInclude()
    });
    if (!record) throwNotFoundError('黑名单记录不存在');

    return this.convertToVO(record);
  }

  async createBlacklist(request: any, creatorId: string, orgId?: string): Promise<BlacklistVO> {
    const preCheck = await this.preCheck(request.customer_id);
    if (!preCheck.passed && request.force !== true) {
      const allErrors = [...preCheck.failed_reasons, ...preCheck.missing_evidence, ...preCheck.incomplete_processes];
      throwBusinessError(`前置校验不通过：${allErrors.join('；')}`);
    }

    const customer = await this.customerRepo.findById(request.customer_id);
    if (!customer) throwNotFoundError('客户不存在');

    const gradeConfig = this.getGradeConfig(request.grade);
    const effectiveDate = request.effective_date ? dayjs(request.effective_date).toDate() : dayjs().toDate();
    let expireDate: Date | undefined;

    if (request.grade !== 4) {
      if (request.expire_date) {
        expireDate = dayjs(request.expire_date).toDate();
      } else if (gradeConfig.default_duration_days) {
        expireDate = dayjs(effectiveDate).add(gradeConfig.default_duration_days, 'day').toDate();
      }
    }

    const nextReviewDate = dayjs(effectiveDate).add(gradeConfig.review_cycle_days, 'day').toDate();

    const lockedAccounts = preCheck.business_statuses.map((bs: any) => ({
      ...bs,
      is_locked: gradeConfig.restrictions.some(r => r.restriction_type === 1 || r.restriction_type === 2)
    }));

    const blacklist_no = await this.blacklistRepo.generateBlacklistNo();

    const record = await this.blacklistRepo.create({
      blacklist_no,
      customer_id: request.customer_id,
      customer_no: customer.customer_no,
      customer_name: customer.customer_name,
      id_card_no: customer.id_card_no,
      customer_type: customer.customer_type,
      violation_type: request.violation_type,
      violation_level: request.violation_level,
      grade: request.grade,
      status: 0,
      description: request.description,
      violation_record_ids: JSON.stringify(request.evidence_ids || []),
      evidence_items: JSON.stringify(request.evidence_items || preCheck.evidence_items),
      business_restrictions: JSON.stringify(gradeConfig.restrictions),
      effective_date: effectiveDate,
      expire_date: expireDate,
      auto_remind: request.auto_remind,
      next_review_date: nextReviewDate,
      locked_accounts: JSON.stringify(lockedAccounts),
      locked_businesses: JSON.stringify(preCheck.pending_businesses),
      creator_id: creatorId,
      org_id: orgId,
      remark: request.remark,
      is_compliant: 1
    } as any);

    await this.createTraceLog({
      blacklist_id: record.id,
      blacklist_no: record.blacklist_no,
      trace_type: 1,
      operator_id: creatorId,
      operation_detail: JSON.stringify({ request, preCheck, gradeConfig }),
      after_grade: request.grade,
      after_status: 0,
      is_compliant: 1
    });

    return this.convertToVO(record);
  }

  async reviewBlacklist(id: string, request: any, reviewerId: string): Promise<BlacklistVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id);
    if (!record) throwNotFoundError('黑名单记录不存在');

    if (record.status !== 0) {
      throwBusinessError('当前状态不允许审核');
    }

    const reviewResult = request.review_result;
    const beforeStatus = record.status;
    let afterStatus: number;

    if (reviewResult === 1) {
      afterStatus = 1;
    } else if (reviewResult === 0) {
      afterStatus = 5;
    } else {
      throwValidationError('无效的审核结果');
    }

    const gradeConfig = this.getGradeConfig(record.grade);
    const effectiveDate = record.effective_date || dayjs().toDate();
    const nextReviewDate = dayjs(effectiveDate).add(gradeConfig.review_cycle_days, 'day').toDate();

    await this.blacklistRepo.update(id, {
      status: afterStatus,
      reviewer_id: reviewerId,
      review_time: dayjs().toDate(),
      review_opinion: request.review_opinion,
      review_count: (record.review_count || 0) + 1,
      last_review_date: dayjs().toDate(),
      next_review_date: nextReviewDate
    } as any);

    const updated = await this.blacklistRepo.findById(id);

    await this.createTraceLog({
      blacklist_id: id,
      blacklist_no: record.blacklist_no,
      trace_type: reviewResult === 1 ? 2 : 3,
      operator_id: reviewerId,
      operation_detail: JSON.stringify(request),
      before_status: beforeStatus,
      after_status: afterStatus,
      is_compliant: 1
    });

    return this.convertToVO(updated!);
  }

  async removeBlacklist(id: string, request: any, removerId: string): Promise<BlacklistVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id);
    if (!record) throwNotFoundError('黑名单记录不存在');

    if (record.status !== 1 && record.status !== 2) {
      throwBusinessError('当前状态不允许移除');
    }

    const complianceCheck = await this.checkCompliance(id, 4);
    if (!complianceCheck.passed && request.force !== true) {
      throwBusinessError(`合规校验不通过：${complianceCheck.failed_reasons.join('；')}`);
    }

    const gradeConfig = this.getGradeConfig(record.grade);
    if (!gradeConfig.allow_manual_remove && request.force !== true) {
      throwBusinessError(`${BlacklistGradeText[record.grade]}不允许手动移除`);
    }

    if (gradeConfig.release_condition.rectification_required && !request.release_conditions_met) {
      throwBusinessError('需提供整改完成证明');
    }

    const beforeStatus = record.status;
    const beforeGrade = record.grade;

    await this.blacklistRepo.update(id, {
      status: 4,
      remove_reason: request.remove_reason,
      remove_time: dayjs().toDate(),
      remover_id: removerId,
      is_compliant: complianceCheck.passed ? 1 : 0,
      violation_details: complianceCheck.passed ? undefined : complianceCheck.failed_reasons.join('；')
    } as any);

    const updated = await this.blacklistRepo.findById(id);

    await this.createTraceLog({
      blacklist_id: id,
      blacklist_no: record.blacklist_no,
      trace_type: 4,
      operator_id: removerId,
      operation_detail: JSON.stringify(request),
      before_grade: beforeGrade,
      before_status: beforeStatus,
      after_status: 4,
      is_compliant: complianceCheck.passed ? 1 : 0,
      violation_type: complianceCheck.passed ? undefined : 1,
      violation_details: complianceCheck.passed ? undefined : complianceCheck.failed_reasons.join('；')
    });

    return this.convertToVO(updated!);
  }

  async extendBlacklist(id: string, request: any, operatorId: string): Promise<BlacklistVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id);
    if (!record) throwNotFoundError('黑名单记录不存在');

    if (record.status !== 1 && record.status !== 2) {
      throwBusinessError('当前状态不允许延期');
    }

    const gradeConfig = this.getGradeConfig(record.grade);
    if (!gradeConfig.allow_extend) {
      throwBusinessError(`${BlacklistGradeText[record.grade]}不允许延期`);
    }

    if (gradeConfig.max_extend_days && request.extend_days > gradeConfig.max_extend_days) {
      throwBusinessError(`延期天数不能超过${gradeConfig.max_extend_days}天`);
    }

    if (!record.expire_date) {
      throwBusinessError('永久黑名单不允许延期');
    }

    const newExpireDate = dayjs(record.expire_date).add(request.extend_days, 'day').toDate();
    const beforeExpireDate = record.expire_date;

    await this.blacklistRepo.update(id, {
      expire_date: newExpireDate
    } as any);

    const updated = await this.blacklistRepo.findById(id);

    await this.createTraceLog({
      blacklist_id: id,
      blacklist_no: record.blacklist_no,
      trace_type: 5,
      operator_id: operatorId,
      operation_detail: JSON.stringify({
        extend_days: request.extend_days,
        extend_reason: request.extend_reason,
        before_expire_date: dayjs(beforeExpireDate).format('YYYY-MM-DD'),
        after_expire_date: dayjs(newExpireDate).format('YYYY-MM-DD')
      }),
      before_grade: record.grade,
      after_grade: record.grade,
      before_status: record.status,
      after_status: record.status,
      is_compliant: 1
    });

    return this.convertToVO(updated!);
  }

  async changeGrade(id: string, request: any, operatorId: string): Promise<BlacklistVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id);
    if (!record) throwNotFoundError('黑名单记录不存在');

    if (record.status !== 1 && record.status !== 2) {
      throwBusinessError('当前状态不允许变更等级');
    }

    const complianceCheck = await this.checkCompliance(id, 6);
    if (!complianceCheck.passed && request.force !== true) {
      throwBusinessError(`合规校验不通过：${complianceCheck.failed_reasons.join('；')}`);
    }

    const beforeGrade = record.grade;
    const targetGrade = request.target_grade;
    const targetGradeConfig = this.getGradeConfig(targetGrade);
    const effectiveDate = record.effective_date || dayjs().toDate();

    let newExpireDate: Date | undefined;
    if (targetGrade === 4) {
      newExpireDate = undefined;
    } else if (targetGradeConfig.default_duration_days) {
      newExpireDate = dayjs(effectiveDate).add(targetGradeConfig.default_duration_days, 'day').toDate();
    }

    const nextReviewDate = dayjs().add(targetGradeConfig.review_cycle_days, 'day').toDate();

    await this.blacklistRepo.update(id, {
      grade: targetGrade,
      business_restrictions: JSON.stringify(targetGradeConfig.restrictions),
      expire_date: newExpireDate,
      next_review_date: nextReviewDate,
      is_compliant: complianceCheck.passed ? 1 : 0,
      violation_details: complianceCheck.passed ? undefined : complianceCheck.failed_reasons.join('；')
    } as any);

    const updated = await this.blacklistRepo.findById(id);

    await this.createTraceLog({
      blacklist_id: id,
      blacklist_no: record.blacklist_no,
      trace_type: 6,
      operator_id: operatorId,
      operation_detail: JSON.stringify(request),
      before_grade: beforeGrade,
      after_grade: targetGrade,
      before_status: record.status,
      after_status: record.status,
      is_compliant: complianceCheck.passed ? 1 : 0,
      violation_type: complianceCheck.passed ? undefined : 1,
      violation_details: complianceCheck.passed ? undefined : complianceCheck.failed_reasons.join('；')
    });

    return this.convertToVO(updated!);
  }

  async checkCompliance(id: string, checkType: number): Promise<BlacklistComplianceCheckResult> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const record = await this.blacklistRepo.findById(id);
    if (!record) throwNotFoundError('黑名单记录不存在');

    const failedReasons: string[] = [];
    const riskPoints: string[] = [];
    const suggestions: string[] = [];

    switch (checkType) {
      case 1:
        if (!record.evidence_items || JSON.parse(record.evidence_items).length === 0) {
          failedReasons.push('缺少违规证据');
          riskPoints.push('证据链不完整');
          suggestions.push('补充违规事实证明材料');
        }
        if (!record.violation_record_ids || JSON.parse(record.violation_record_ids).length === 0) {
          failedReasons.push('未关联违规记录');
          riskPoints.push('违规事实依据不足');
          suggestions.push('关联相关违规记录');
        }
        break;
      case 4:
        const gradeConfig = this.getGradeConfig(record.grade);
        const duration = dayjs().diff(dayjs(record.effective_date), 'day');
        if (duration < gradeConfig.release_condition.min_duration_days) {
          failedReasons.push(`未满足最短管控期限，已管控${duration}天，最低要求${gradeConfig.release_condition.min_duration_days}天`);
          riskPoints.push('管控期限不足');
          suggestions.push(`请等待至${dayjs(record.effective_date).add(gradeConfig.release_condition.min_duration_days, 'day').format('YYYY-MM-DD')}后再申请解除`);
        }
        if (gradeConfig.release_condition.approval_required) {
          riskPoints.push('需经审批流程');
          suggestions.push('请提交审批申请，经有权人审批后方可解除');
        }
        if (record.grade === 4) {
          failedReasons.push('永久黑名单禁止随意解除');
          riskPoints.push('高风险客户解除管控');
          suggestions.push('需经风控委员会审议通过，并提供司法机关解除证明');
        }
        break;
      case 6:
        const violationRecords = record.violation_record_ids ? JSON.parse(record.violation_record_ids) : [];
        if (violationRecords.length > 0) {
          const pendingVios = await this.violationRepo.findByWhere({
            id: { [Op.in]: violationRecords },
            status: { [Op.in]: [0, 1] }
          });
          if (pendingVios.length > 0) {
            failedReasons.push(`存在${pendingVios.length}条未完成处理的关联违规记录`);
            riskPoints.push('关联违规未闭环');
            suggestions.push('先完成所有关联违规记录的处理');
          }
        }
        break;
    }

    const passed = failedReasons.length === 0;

    if (!passed) {
      await this.createTraceLog({
        blacklist_id: id,
        blacklist_no: record.blacklist_no,
        trace_type: 7,
        operation_detail: JSON.stringify({ checkType, failedReasons, riskPoints, suggestions }),
        before_grade: record.grade,
        after_grade: record.grade,
        before_status: record.status,
        after_status: record.status,
        is_compliant: 0,
        violation_type: 1,
        violation_details: failedReasons.join('；')
      });
    }

    return {
      passed,
      check_type: checkType,
      failed_reasons: failedReasons,
      risk_points: riskPoints,
      suggestions
    };
  }

  async createBatchHandle(request: any, creatorId: string, orgId?: string): Promise<BlacklistBatchVO> {
    const batchNo = await this.batchRepo.generateBatchNo();
    let totalCount = 0;

    if (request.customer_ids && request.customer_ids.length > 0) {
      totalCount = request.customer_ids.length;
    } else {
      const filterWhere: any = {};
      if (request.grade_filter !== undefined && request.grade_filter !== null) {
        filterWhere.grade = request.grade_filter;
      }
      if (request.violation_type_filter !== undefined && request.violation_type_filter !== null) {
        filterWhere.violation_type = request.violation_type_filter;
      }
      filterWhere.status = { [Op.in]: [1, 2] };
      totalCount = await this.blacklistRepo.count(filterWhere);
    }

    const batch = await this.batchRepo.create({
      batch_no: batchNo,
      batch_name: request.batch_name,
      batch_type: request.batch_type,
      status: 0,
      total_count: totalCount,
      success_count: 0,
      fail_count: 0,
      filter_condition: request.filter_condition ? JSON.stringify(request.filter_condition) : undefined,
      grade_filter: request.grade_filter,
      violation_type_filter: request.violation_type_filter,
      target_grade: request.target_grade,
      extend_days: request.extend_days,
      handle_reason: request.handle_reason,
      creator_id: creatorId,
      org_id: orgId
    } as any);

    setImmediate(async () => {
      await this.executeBatch(batch.id, request);
    });

    return this.convertBatchToVO(batch);
  }

  async executeBatch(batchId: string, request: any): Promise<void> {
    try {
      await this.batchRepo.update(batchId, {
        status: 1,
        execute_start_time: dayjs().toDate()
      } as any);

      let records: any[] = [];
      if (request.customer_ids && request.customer_ids.length > 0) {
        for (const customerId of request.customer_ids) {
          const active = await this.blacklistRepo.findActiveByCustomerId(customerId);
          if (active) {
            records.push(active);
          }
        }
      } else {
        const filterWhere: any = {};
        if (request.grade_filter !== undefined && request.grade_filter !== null) {
          filterWhere.grade = request.grade_filter;
        }
        if (request.violation_type_filter !== undefined && request.violation_type_filter !== null) {
          filterWhere.violation_type = request.violation_type_filter;
        }
        filterWhere.status = { [Op.in]: [1, 2] };
        const result = await this.blacklistRepo.findByWhere(filterWhere);
        records = result;
      }

      let successCount = 0;
      let failCount = 0;
      const executeLog: string[] = [];

      for (const record of records) {
        try {
          if (request.batch_type === 3) {
            await this.removeBlacklist(record.id, {
              remove_reason: request.handle_reason,
              release_conditions_met: true,
              force: true
            }, 'system');
            successCount++;
            executeLog.push(`[SUCCESS] ${record.blacklist_no}: 批量移除成功`);
          } else if (request.batch_type === 4) {
            await this.extendBlacklist(record.id, {
              extend_days: request.extend_days,
              extend_reason: request.handle_reason
            }, 'system');
            successCount++;
            executeLog.push(`[SUCCESS] ${record.blacklist_no}: 批量延期${request.extend_days}天成功`);
          } else if (request.batch_type === 5) {
            await this.changeGrade(record.id, {
              target_grade: request.target_grade,
              change_reason: request.handle_reason,
              force: true
            }, 'system');
            successCount++;
            executeLog.push(`[SUCCESS] ${record.blacklist_no}: 等级变更为${BlacklistGradeText[request.target_grade]}成功`);
          }

          await this.blacklistRepo.update(record.id, { batch_id: batchId } as any);

          await this.createTraceLog({
            blacklist_id: record.id,
            blacklist_no: record.blacklist_no,
            trace_type: 8,
            operator_id: 'system',
            operator_name: '系统批量处理',
            operation_detail: JSON.stringify({
              batch_id: batchId,
              batch_type: request.batch_type,
              handle_reason: request.handle_reason,
              target_grade: request.target_grade,
              extend_days: request.extend_days
            }),
            before_grade: record.grade,
            after_grade: request.target_grade || record.grade,
            before_status: record.status,
            after_status: record.status,
            is_compliant: 1
          });
        } catch (error: any) {
          failCount++;
          executeLog.push(`[FAILED] ${record.blacklist_no}: ${error.message}`);
        }
      }

      await this.batchRepo.update(batchId, {
        status: 2,
        success_count: successCount,
        fail_count: failCount,
        execute_end_time: dayjs().toDate(),
        execute_log: executeLog.join('\n')
      } as any);
    } catch (error: any) {
      await this.batchRepo.update(batchId, {
        status: 3,
        execute_end_time: dayjs().toDate(),
        execute_log: `执行失败: ${error.message}`
      } as any);
    }
  }

  async getBatchList(params: any): Promise<PaginatedResult<BlacklistBatchVO>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const where = this.batchRepo.buildQuery(params);

    const result = await this.batchRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include: this.batchRepo.getDefaultInclude() }
    );

    return {
      ...result,
      list: result.list.map(item => this.convertBatchToVO(item))
    };
  }

  async getBatchDetail(id: string): Promise<BlacklistBatchVO> {
    if (!isValidId(id)) throwValidationError('无效的ID');

    const batch = await this.batchRepo.findById(id, {
      include: this.batchRepo.getDefaultInclude()
    });
    if (!batch) throwNotFoundError('批次不存在');

    const items = await this.blacklistRepo.findByBatchId(id);

    return {
      ...this.convertBatchToVO(batch),
      items: items.map(item => this.convertToVO(item))
    };
  }

  async getTraceList(params: any): Promise<PaginatedResult<BlacklistTraceVO>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const where = this.traceRepo.buildQuery(params);

    const result = await this.traceRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include: this.traceRepo.getDefaultInclude() }
    );

    return {
      ...result,
      list: result.list.map(item => this.convertTraceToVO(item))
    };
  }

  async getBlacklistTraces(blacklistId: string): Promise<BlacklistTraceVO[]> {
    if (!isValidId(blacklistId)) throwValidationError('无效的ID');

    const traces = await this.traceRepo.findByBlacklistId(blacklistId);
    return traces.map(item => this.convertTraceToVO(item));
  }

  async getStatistics(): Promise<BlacklistStatisticsVO> {
    const totalCount = await this.blacklistRepo.count();
    const activeCount = await this.blacklistRepo.countByStatus(1);
    const pendingReviewCount = await this.blacklistRepo.countByStatus(0);
    const expiredCount = await this.blacklistRepo.countByStatus(3);
    const removedCount = await this.blacklistRepo.countByStatus(4);

    const temporaryCount = await this.blacklistRepo.countByGrade(1);
    const shortTermCount = await this.blacklistRepo.countByGrade(2);
    const longTermCount = await this.blacklistRepo.countByGrade(3);
    const permanentCount = await this.blacklistRepo.countByGrade(4);

    const today = dayjs().format('YYYY-MM-DD');
    const todayAddCount = await this.blacklistRepo.count({
      where: {
        created_at: {
          [Op.gte]: dayjs(today).startOf('day').toDate(),
          [Op.lte]: dayjs(today).endOf('day').toDate()
        }
      }
    });

    const todayRemoveCount = await this.blacklistRepo.count({
      where: {
        remove_time: {
          [Op.gte]: dayjs(today).startOf('day').toDate(),
          [Op.lte]: dayjs(today).endOf('day').toDate()
        }
      }
    });

    const expireSoonCount = await this.blacklistRepo.countExpireSoon(7);
    const reviewDueCount = await this.blacklistRepo.countReviewDue();

    const gradeDistribution = [];
    for (let i = 1; i <= 4; i++) {
      const count = await this.blacklistRepo.countByGrade(i);
      gradeDistribution.push({ grade: i, count });
    }

    const violationTypeDistribution = [];
    for (let i = 1; i <= 9; i++) {
      const count = await this.blacklistRepo.count({
        where: { violation_type: i, status: { [Op.in]: [1, 2] } }
      });
      if (count > 0) {
        violationTypeDistribution.push({ type: i, count });
      }
    }

    return {
      total_count: totalCount,
      active_count: activeCount,
      pending_review_count: pendingReviewCount,
      expired_count: expiredCount,
      removed_count: removedCount,
      temporary_count: temporaryCount,
      short_term_count: shortTermCount,
      long_term_count: longTermCount,
      permanent_count: permanentCount,
      today_add_count: todayAddCount as number,
      today_remove_count: todayRemoveCount as number,
      expire_soon_count: expireSoonCount,
      review_due_count: reviewDueCount,
      grade_distribution: gradeDistribution,
      violation_type_distribution: violationTypeDistribution
    };
  }

  getGradeConfigs(): BlacklistGradeConfigVO[] {
    return GRADE_CONFIGS.map(config => ({
      grade: config.grade,
      grade_text: BlacklistGradeText[config.grade],
      default_duration_days: config.default_duration_days,
      review_cycle_days: config.review_cycle_days,
      restrictions: config.restrictions,
      release_condition: config.release_condition,
      allow_manual_remove: config.allow_manual_remove,
      allow_extend: config.allow_extend,
      max_extend_days: config.max_extend_days
    }));
  }

  private async createTraceLog(data: any): Promise<void> {
    const operatorName = data.operator_name;
    if (!operatorName && data.operator_id && data.operator_id !== 'system') {
      const user = await this.userRepo.findById(data.operator_id);
      data.operator_name = user?.real_name || user?.username || '未知用户';
    }
    await this.traceRepo.create(data);
  }

  private convertToVO(record: any): BlacklistVO {
    const gradeConfig = this.getGradeConfig(record.grade);
    let remainingDays: number | undefined;
    if (record.expire_date && (record.status === 1 || record.status === 2)) {
      remainingDays = dayjs(record.expire_date).diff(dayjs(), 'day');
    }

    return {
      id: record.id,
      blacklist_no: record.blacklist_no,
      customer_id: record.customer_id,
      customer_no: record.customer_no,
      customer_name: record.customer_name,
      id_card_no: record.id_card_no,
      customer_type: record.customer_type,
      violation_type: record.violation_type,
      violation_type_text: ViolationTypeText[record.violation_type],
      violation_level: record.violation_level,
      grade: record.grade,
      grade_text: BlacklistGradeText[record.grade],
      grade_color: BlacklistGradeColor[record.grade],
      status: record.status,
      status_text: BlacklistStatusText[record.status],
      status_color: BlacklistStatusColor[record.status],
      description: record.description,
      evidence_count: record.evidence_items ? JSON.parse(record.evidence_items).length : 0,
      violation_record_ids: record.violation_record_ids ? JSON.parse(record.violation_record_ids) : [],
      evidence_items: record.evidence_items ? JSON.parse(record.evidence_items) : [],
      business_restrictions: record.business_restrictions ? JSON.parse(record.business_restrictions) : [],
      effective_date: dayjs(record.effective_date).format('YYYY-MM-DD'),
      expire_date: record.expire_date ? dayjs(record.expire_date).format('YYYY-MM-DD') : undefined,
      remaining_days: remainingDays,
      auto_remind: record.auto_remind,
      review_count: record.review_count || 0,
      last_review_date: record.last_review_date ? dayjs(record.last_review_date).format('YYYY-MM-DD') : undefined,
      next_review_date: record.next_review_date ? dayjs(record.next_review_date).format('YYYY-MM-DD') : undefined,
      locked_accounts: record.locked_accounts ? JSON.parse(record.locked_accounts) : [],
      locked_businesses: record.locked_businesses ? JSON.parse(record.locked_businesses) : [],
      creator_id: record.creator_id,
      creator_name: record.creator?.real_name || record.creator?.username,
      reviewer_id: record.reviewer_id,
      reviewer_name: record.reviewer?.real_name || record.reviewer?.username,
      review_time: record.review_time ? dayjs(record.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      review_opinion: record.review_opinion,
      remove_reason: record.remove_reason,
      remove_time: record.remove_time ? dayjs(record.remove_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      remover_id: record.remover_id,
      remover_name: record.remover?.real_name || record.remover?.username,
      org_id: record.org_id,
      org_name: record.organization?.name,
      batch_id: record.batch_id,
      batch_no: record.batch_no,
      is_compliant: record.is_compliant,
      violation_details: record.violation_details,
      created_at: record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: record.updated_at ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }

  private convertBatchToVO(batch: any): BlacklistBatchVO {
    return {
      id: batch.id,
      batch_no: batch.batch_no,
      batch_name: batch.batch_name,
      batch_type: batch.batch_type,
      batch_type_text: BlacklistBatchTypeText[batch.batch_type],
      status: batch.status,
      status_text: BlacklistBatchStatusText[batch.status],
      status_color: batch.status === 2 ? 'success' : batch.status === 3 ? 'danger' : batch.status === 1 ? 'warning' : 'info',
      total_count: batch.total_count,
      success_count: batch.success_count,
      fail_count: batch.fail_count,
      filter_condition: batch.filter_condition ? JSON.parse(batch.filter_condition) : undefined,
      grade_filter: batch.grade_filter,
      violation_type_filter: batch.violation_type_filter,
      target_grade: batch.target_grade,
      extend_days: batch.extend_days,
      handle_reason: batch.handle_reason,
      execute_start_time: batch.execute_start_time ? dayjs(batch.execute_start_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      execute_end_time: batch.execute_end_time ? dayjs(batch.execute_end_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      execute_log: batch.execute_log,
      creator_id: batch.creator_id,
      creator_name: batch.creator?.real_name || batch.creator?.username,
      org_id: batch.org_id,
      remark: batch.remark,
      created_at: batch.created_at ? dayjs(batch.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: batch.updated_at ? dayjs(batch.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }

  private convertTraceToVO(trace: any): BlacklistTraceVO {
    return {
      id: trace.id,
      blacklist_id: trace.blacklist_id,
      blacklist_no: trace.blacklist_no,
      trace_type: trace.trace_type,
      trace_type_text: BlacklistTraceTypeText[trace.trace_type],
      operator_id: trace.operator_id,
      operator_name: trace.operator_name || trace.operator?.real_name || trace.operator?.username,
      operation_detail: trace.operation_detail ? JSON.parse(trace.operation_detail) : undefined,
      before_grade: trace.before_grade,
      after_grade: trace.after_grade,
      before_status: trace.before_status,
      after_status: trace.after_status,
      is_compliant: trace.is_compliant,
      violation_type: trace.violation_type,
      violation_details: trace.violation_details,
      remark: trace.remark,
      created_at: trace.created_at ? dayjs(trace.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }
}
