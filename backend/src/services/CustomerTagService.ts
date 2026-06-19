import { CustomerTagRepository, CustomerTagLogRepository, CustomerTagBatchRepository, CustomerTagBatchItemRepository } from '../repositories/CustomerTagRepository';
import {
  TagPreCheckResult,
  TagPreCheckFieldError,
  TagAdaptResult,
  TagComplianceCheckResult,
  CreateCustomerTagRequest,
  UpdateCustomerTagRequest,
  AdjustTagRequest,
  CustomerTagQueryParams,
  CustomerTagVO,
  CustomerTagLogVO,
  TagTraceRequest,
  TagTraceResponse,
  TagTraceRecord,
  TagBatchRequest,
  TagBatchResponse,
  TagBatchResultItem,
  TagBatchQueryParams,
  TagBatchItemQueryParams,
  TagBatchVO,
  TagBatchItemVO,
  CustomerLevel,
  TagType,
  TagSource,
  TagStatus,
  TagBatchOperationType,
  TagProcessResult
} from '../types';
import { PaginatedResult } from '../types/common';
import { CustomerTag, CustomerTagLog, CustomerTagBatch, CustomerTagBatchItem } from '../models';
import dayjs from 'dayjs';

const CUSTOMER_LEVEL_MAP: Record<number, string> = { 1: '普通', 2: '银卡', 3: '金卡', 4: '白金', 5: '钻石' };
const TAG_TYPE_MAP: Record<number, string> = { 1: '等级标签', 2: '服务标签', 3: '营销标签', 4: '风控标签', 5: '特殊标签' };
const TAG_SOURCE_MAP: Record<number, string> = { 1: '手动调整', 2: '系统自动', 3: '批量赋值', 4: '规则触发' };
const TAG_STATUS_MAP: Record<number, string> = { 1: '有效', 2: '失效', 3: '待生效', 4: '已移除' };
const CHANGE_TYPE_MAP: Record<string, string> = { '1': '标签新增', '2': '标签调整', '3': '标签移除', '4': '标签替换', '5': '等级变更', '6': '批量赋值', '7': '系统自动更新', '8': '锁定', '9': '解锁' };
const BATCH_STATUS_MAP: Record<number, string> = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '部分完成', 4: '已取消' };
const PROCESS_RESULT_MAP: Record<number, string> = { 0: '未处理', 1: '成功', 2: '失败', 3: '越权拦截', 4: '违规拦截' };
const OPERATION_TYPE_MAP: Record<number, string> = { 1: '批量新增', 2: '批量替换', 3: '批量移除', 4: '批量调整等级' };

const HIGH_END_TAG_CODES = ['VIP_DIAMOND', 'PLATINUM_PLUS', 'PRIVATE_BANKING', 'WEALTH_ELITE'];
const TAG_LEVEL_MAPPING: Record<string, CustomerLevel> = {
  'LEVEL_NORMAL': 1, 'LEVEL_SILVER': 2, 'LEVEL_GOLD': 3, 'LEVEL_PLATINUM': 4, 'LEVEL_DIAMOND': 5,
  'VIP_NORMAL': 1, 'VIP_SILVER': 2, 'VIP_GOLD': 3, 'VIP_PLATINUM': 4, 'VIP_DIAMOND': 5
};

const TAG_SERVICE_PERMISSIONS: Record<string, string[]> = {
  'LEVEL_NORMAL': ['基础查询', '活期存取'],
  'LEVEL_SILVER': ['基础查询', '活期存取', '定期存款', '基础理财'],
  'LEVEL_GOLD': ['基础查询', '活期存取', '定期存款', '进阶理财', '信用贷款'],
  'LEVEL_PLATINUM': ['基础查询', '活期存取', '定期存款', '高端理财', '信用贷款', '大额存单'],
  'LEVEL_DIAMOND': ['基础查询', '活期存取', '定期存款', '私人银行理财', '信用贷款', '大额存单', '专属顾问', '跨境金融']
};

const TAG_FEE_DISCOUNTS: Record<string, { code: string; name: string; discount: number }[]> = {
  'LEVEL_NORMAL': [],
  'LEVEL_SILVER': [{ code: 'FEE_TRANSFER', name: '转账手续费', discount: 0.9 }],
  'LEVEL_GOLD': [{ code: 'FEE_TRANSFER', name: '转账手续费', discount: 0.8 }, { code: 'FEE_CARD', name: '年费减免', discount: 0.5 }],
  'LEVEL_PLATINUM': [{ code: 'FEE_TRANSFER', name: '转账手续费', discount: 0.6 }, { code: 'FEE_CARD', name: '年费减免', discount: 0 }, { code: 'FEE_SMS', name: '短信通知费', discount: 0 }],
  'LEVEL_DIAMOND': [{ code: 'FEE_TRANSFER', name: '转账手续费', discount: 0 }, { code: 'FEE_CARD', name: '年费减免', discount: 0 }, { code: 'FEE_SMS', name: '短信通知费', discount: 0 }, { code: 'FEE_MANAGE', name: '资产管理费', discount: 0.5 }]
};

const TAG_MARKETING_RULES: Record<string, { code: string; name: string; description: string }[]> = {
  'LEVEL_NORMAL': [{ code: 'MKT_BASIC', name: '基础营销', description: '节日问候、基础产品推荐' }],
  'LEVEL_SILVER': [{ code: 'MKT_BASIC', name: '基础营销', description: '节日问候、基础产品推荐' }, { code: 'MKT_DEPOSIT', name: '存款营销', description: '定期存款利率优惠活动' }],
  'LEVEL_GOLD': [{ code: 'MKT_WEALTH', name: '理财营销', description: '专属理财推荐、收益升级' }, { code: 'MKT_LOAN', name: '贷款营销', description: '贷款利率优惠' }],
  'LEVEL_PLATINUM': [{ code: 'MKT_WEALTH', name: '理财营销', description: '高端理财优先认购' }, { code: 'MKT_LOAN', name: '贷款营销', description: '贷款利率优惠' }, { code: 'MKT_VIP', name: 'VIP活动', description: '高端客户沙龙、专属活动' }],
  'LEVEL_DIAMOND': [{ code: 'MKT_PRIVATE', name: '私人银行', description: '一对一专属顾问、定制化方案' }, { code: 'MKT_VIP', name: 'VIP活动', description: '高端客户沙龙、专属活动' }, { code: 'MKT_GLOBAL', name: '跨境金融', description: '全球资产配置服务' }]
};

export class CustomerTagService {
  private tagRepo: CustomerTagRepository;
  private logRepo: CustomerTagLogRepository;
  private batchRepo: CustomerTagBatchRepository;
  private batchItemRepo: CustomerTagBatchItemRepository;

  constructor() {
    this.tagRepo = new CustomerTagRepository();
    this.logRepo = new CustomerTagLogRepository();
    this.batchRepo = new CustomerTagBatchRepository();
    this.batchItemRepo = new CustomerTagBatchItemRepository();
  }

  async preCheckTag(data: CreateCustomerTagRequest): Promise<TagPreCheckResult> {
    const errors: TagPreCheckFieldError[] = [];
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';

    let assetReady = false;
    let transactionReady = false;
    let retentionReady = false;
    let riskReady = false;

    const existingTag = await this.tagRepo.findByCustomerIdAndTagCode(data.customer_id, data.tag_code);
    if (existingTag && existingTag.tag_status !== 4) {
      blocked = true;
      blockReason = '该客户已存在相同标签，禁止重复绑定';
      errors.push({ field: 'tag_code', message: '客户已存在相同有效标签', code: 'DUPLICATE_TAG' });
    }

    const customerTags = await this.tagRepo.findAllByCustomerId(data.customer_id);
    const latestTag = customerTags.length > 0 ? customerTags[0] : null;

    if (latestTag) {
      assetReady = latestTag.asset_data_status === 1;
      transactionReady = latestTag.transaction_data_status === 1;
      retentionReady = latestTag.retention_data_status === 1;
      riskReady = latestTag.risk_data_status === 1;

      const now = dayjs();
      const assetTime = latestTag.asset_data_time ? dayjs(latestTag.asset_data_time) : null;
      const transactionTime = latestTag.transaction_data_time ? dayjs(latestTag.transaction_data_time) : null;
      const retentionTime = latestTag.retention_data_time ? dayjs(latestTag.retention_data_time) : null;
      const riskTime = latestTag.risk_data_time ? dayjs(latestTag.risk_data_time) : null;

      if (assetTime && now.diff(assetTime, 'day') > 30) {
        assetReady = false;
        warnings.push('资产数据超过30天未更新，建议先更新资产数据');
      }
      if (transactionTime && now.diff(transactionTime, 'day') > 7) {
        transactionReady = false;
        warnings.push('交易数据超过7天未更新，建议先更新交易数据');
      }
      if (retentionTime && now.diff(retentionTime, 'day') > 30) {
        retentionReady = false;
        warnings.push('留存数据超过30天未更新，建议先更新留存数据');
      }
      if (riskTime && now.diff(riskTime, 'day') > 15) {
        riskReady = false;
        warnings.push('风控数据超过15天未更新，建议先更新风控数据');
      }
    } else {
      assetReady = true;
      transactionReady = true;
      retentionReady = true;
      riskReady = true;
    }

    const allDataReady = assetReady && transactionReady && retentionReady && riskReady;

    if (!allDataReady && !data.skip_precheck) {
      blocked = true;
      blockReason = '基础数据未全部更新完成，禁止执行等级标签调整';
      if (!assetReady) errors.push({ field: 'asset_data', message: '资产数据未更新', code: 'DATA_NOT_READY' });
      if (!transactionReady) errors.push({ field: 'transaction_data', message: '交易数据未更新', code: 'DATA_NOT_READY' });
      if (!retentionReady) errors.push({ field: 'retention_data', message: '留存数据未更新', code: 'DATA_NOT_READY' });
      if (!riskReady) errors.push({ field: 'risk_data', message: '风控数据未更新', code: 'DATA_NOT_READY' });
    }

    const complianceResult = this.checkTagCompliance(data.tag_code, data.customer_id, customerTags);
    if (!complianceResult.compliant) {
      blocked = true;
      blockReason = complianceResult.violation_message || '标签与客户群体不合规';
      errors.push({ field: 'tag_code', message: complianceResult.violation_message || '标签适配客户群体合规性校验失败', code: 'TAG_COMPLIANCE_FAIL' });
    }

    if (!data.tag_code || data.tag_code.trim().length < 2) {
      errors.push({ field: 'tag_code', message: '标签编码不能为空', code: 'INVALID_TAG_CODE' });
    }
    if (!data.tag_name || data.tag_name.trim().length < 2) {
      errors.push({ field: 'tag_name', message: '标签名称不能为空', code: 'INVALID_TAG_NAME' });
    }

    return {
      passed: errors.length === 0 && !blocked,
      blocked,
      asset_data_ready: assetReady,
      transaction_data_ready: transactionReady,
      retention_data_ready: retentionReady,
      risk_data_ready: riskReady,
      all_data_ready: allDataReady,
      tag_compliance_valid: complianceResult.compliant,
      tag_customer_group_match: complianceResult.tag_customer_group_match,
      errors,
      warnings,
      block_reason: blockReason || undefined
    };
  }

  private checkTagCompliance(tagCode: string, _customerId: string, customerTags: CustomerTag[]): TagComplianceCheckResult {
    const tagLevel = TAG_LEVEL_MAPPING[tagCode];
    if (tagLevel === undefined) {
      return { compliant: true, tag_customer_group_match: true };
    }

    if (HIGH_END_TAG_CODES.includes(tagCode)) {
      const currentLevel = customerTags.length > 0 ? customerTags[0].customer_level : 1;
      if (currentLevel < 4) {
        return {
          compliant: false,
          tag_customer_group_match: false,
          violation_type: 'HIGH_END_TAG_RESTRICTED',
          violation_message: `当前客户等级${CUSTOMER_LEVEL_MAP[currentLevel]}，不允许绑定高端标签${tagCode}`
        };
      }
    }

    return { compliant: true, tag_customer_group_match: true };
  }

  adaptTag(tagCode: string, assetAmount: number, transactionCount: number, retentionDays: number, riskLevel: number): TagAdaptResult {
    let level: CustomerLevel = 1;
    const adaptRules: string[] = [];

    if (assetAmount >= 10000000 && transactionCount >= 100 && retentionDays >= 730 && riskLevel <= 1) {
      level = 5;
      adaptRules.push(`资产≥1000万+交易≥100笔+留存≥730天+风控低风险 → 钻石`);
    } else if (assetAmount >= 3000000 && transactionCount >= 50 && retentionDays >= 365 && riskLevel <= 2) {
      level = 4;
      adaptRules.push(`资产≥300万+交易≥50笔+留存≥365天+风控中低风险 → 白金`);
    } else if (assetAmount >= 500000 && transactionCount >= 20 && retentionDays >= 180 && riskLevel <= 3) {
      level = 3;
      adaptRules.push(`资产≥50万+交易≥20笔+留存≥180天+风控中风险 → 金卡`);
    } else if (assetAmount >= 50000 && transactionCount >= 5 && retentionDays >= 90) {
      level = 2;
      adaptRules.push(`资产≥5万+交易≥5笔+留存≥90天 → 银卡`);
    } else {
      level = 1;
      adaptRules.push(`默认 → 普通`);
    }

    if (riskLevel >= 4) {
      level = Math.min(level, 2) as CustomerLevel;
      adaptRules.push(`风控高风险/极高风险，等级上限降为银卡`);
    }

    const resolvedTagCode = tagCode || `LEVEL_${Object.keys(CUSTOMER_LEVEL_MAP).find(k => Number(k) === level)?.toUpperCase() || 'NORMAL'}`;
    const permissions = TAG_SERVICE_PERMISSIONS[resolvedTagCode] || TAG_SERVICE_PERMISSIONS['LEVEL_NORMAL'] || [];
    const discounts = TAG_FEE_DISCOUNTS[resolvedTagCode] || [];
    const marketing = TAG_MARKETING_RULES[resolvedTagCode] || [];

    return {
      tag_code: resolvedTagCode,
      tag_name: CUSTOMER_LEVEL_MAP[level],
      tag_type: 1 as TagType,
      customer_level: level,
      customer_level_text: CUSTOMER_LEVEL_MAP[level],
      service_permissions: permissions,
      fee_discounts: discounts,
      marketing_rules: marketing,
      adapt_factors: { asset_amount: assetAmount, transaction_count: transactionCount, retention_days: retentionDays, risk_level: riskLevel },
      adapt_rules: adaptRules
    };
  }

  async createTag(data: CreateCustomerTagRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CustomerTagVO> {
    if (!data.skip_precheck) {
      const preCheck = await this.preCheckTag(data);
      if (preCheck.blocked) {
        throw new Error(preCheck.block_reason || '前置校验不通过，禁止创建标签');
      }
    }

    const tagLevel = TAG_LEVEL_MAPPING[data.tag_code];
    const tag = await this.tagRepo.create({
      customer_id: data.customer_id,
      tag_code: data.tag_code,
      tag_name: data.tag_name,
      tag_type: data.tag_type || 1,
      tag_source: data.tag_source || 1,
      tag_status: 1,
      customer_level: tagLevel || 1,
      effective_time: data.effective_time ? new Date(data.effective_time) : new Date(),
      expire_time: data.expire_time ? new Date(data.expire_time) : undefined,
      service_permissions: JSON.stringify(TAG_SERVICE_PERMISSIONS[data.tag_code] || []),
      fee_discounts: JSON.stringify(TAG_FEE_DISCOUNTS[data.tag_code] || []),
      marketing_rules: JSON.stringify(TAG_MARKETING_RULES[data.tag_code] || []),
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      remark: data.remark,
      asset_data_status: 1,
      transaction_data_status: 1,
      retention_data_status: 1,
      risk_data_status: 1,
      asset_data_time: new Date(),
      transaction_data_time: new Date(),
      retention_data_time: new Date(),
      risk_data_time: new Date()
    } as any);

    await this.logRepo.create({
      tag_id: tag.id,
      customer_id: data.customer_id,
      tag_code: data.tag_code,
      tag_name: data.tag_name,
      change_type: '1',
      change_type_name: '标签新增',
      after_content: JSON.stringify(data),
      change_remark: data.remark || '新增标签',
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      operate_time: new Date(),
      is_unauthorized: 0,
      is_violation: 0,
      status: 1
    } as any);

    return this.toVO(tag);
  }

  async updateTag(id: string, data: UpdateCustomerTagRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CustomerTagVO> {
    const tag = await this.tagRepo.findById(id);
    if (!tag) throw new Error('标签记录不存在');

    const beforeData = JSON.stringify(this.toVO(tag));
    await this.tagRepo.update(id, {
      tag_status: data.tag_status,
      effective_time: data.effective_time ? new Date(data.effective_time) : undefined,
      expire_time: data.expire_time ? new Date(data.expire_time) : undefined,
      remark: data.remark
    } as any);

    await this.logRepo.create({
      tag_id: id,
      customer_id: tag.customer_id,
      tag_code: tag.tag_code,
      tag_name: tag.tag_name,
      change_type: '2',
      change_type_name: '标签调整',
      before_content: beforeData,
      after_content: JSON.stringify(data),
      change_remark: data.change_remark || '标签状态调整',
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      operate_time: new Date(),
      is_unauthorized: 0,
      is_violation: 0,
      status: 1
    } as any);

    const updated = await this.tagRepo.findById(id);
    return this.toVO(updated!);
  }

  async adjustTag(data: AdjustTagRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CustomerTagVO> {
    const oldTag = await this.tagRepo.findByCustomerIdAndTagCode(data.customer_id, data.old_tag_code);
    if (!oldTag) throw new Error('原标签不存在');

    const newTagLevel = TAG_LEVEL_MAPPING[data.new_tag_code];
    const compliance = this.checkTagCompliance(data.new_tag_code, data.customer_id, await this.tagRepo.findAllByCustomerId(data.customer_id));
    if (!compliance.compliant) {
      await this.logRepo.create({
        tag_id: oldTag.id,
        customer_id: data.customer_id,
        tag_code: data.new_tag_code,
        tag_name: data.new_tag_name,
        change_type: '4',
        change_type_name: '标签替换',
        before_content: JSON.stringify({ tag_code: oldTag.tag_code, tag_name: oldTag.tag_name }),
        after_content: JSON.stringify({ tag_code: data.new_tag_code, tag_name: data.new_tag_name }),
        change_remark: data.change_remark || '标签替换',
        operator_id: operatorId,
        operator_name: operatorName,
        operator_org_id: orgId,
        operate_time: new Date(),
        is_unauthorized: compliance.violation_type === 'HIGH_END_TAG_RESTRICTED' ? 1 : 0,
        is_violation: !compliance.compliant ? 1 : 0,
        block_reason: compliance.violation_message,
        status: 1
      } as any);

      throw new Error(compliance.violation_message || '标签替换违规，操作已拦截');
    }

    await this.tagRepo.update(oldTag.id, {
      tag_code: data.new_tag_code,
      tag_name: data.new_tag_name,
      tag_type: data.tag_type || oldTag.tag_type,
      tag_source: 1,
      customer_level: newTagLevel || oldTag.customer_level,
      service_permissions: JSON.stringify(TAG_SERVICE_PERMISSIONS[data.new_tag_code] || []),
      fee_discounts: JSON.stringify(TAG_FEE_DISCOUNTS[data.new_tag_code] || []),
      marketing_rules: JSON.stringify(TAG_MARKETING_RULES[data.new_tag_code] || [])
    } as any);

    await this.logRepo.create({
      tag_id: oldTag.id,
      customer_id: data.customer_id,
      tag_code: data.new_tag_code,
      tag_name: data.new_tag_name,
      change_type: '4',
      change_type_name: '标签替换',
      before_content: JSON.stringify({ tag_code: oldTag.tag_code, tag_name: oldTag.tag_name }),
      after_content: JSON.stringify({ tag_code: data.new_tag_code, tag_name: data.new_tag_name }),
      change_remark: data.change_remark || '标签替换',
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      operate_time: new Date(),
      is_unauthorized: 0,
      is_violation: 0,
      status: 1
    } as any);

    const updated = await this.tagRepo.findById(oldTag.id);
    return this.toVO(updated!);
  }

  async removeTag(id: string, operatorId?: string, operatorName?: string, orgId?: string): Promise<CustomerTagVO> {
    const tag = await this.tagRepo.findById(id);
    if (!tag) throw new Error('标签记录不存在');

    const beforeData = JSON.stringify(this.toVO(tag));
    await this.tagRepo.update(id, { tag_status: 4 } as any);

    await this.logRepo.create({
      tag_id: id,
      customer_id: tag.customer_id,
      tag_code: tag.tag_code,
      tag_name: tag.tag_name,
      change_type: '3',
      change_type_name: '标签移除',
      before_content: beforeData,
      after_content: JSON.stringify({ tag_status: 4 }),
      change_remark: '标签移除',
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      operate_time: new Date(),
      is_unauthorized: 0,
      is_violation: 0,
      status: 1
    } as any);

    const updated = await this.tagRepo.findById(id);
    return this.toVO(updated!);
  }

  async getTagList(params: CustomerTagQueryParams): Promise<PaginatedResult<CustomerTagVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.tagRepo.buildQuery(queryParams);

    const result = await this.tagRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' }
    );

    const list = result.list.map((t: any) => this.toVO(t));
    return { list, total: result.total, page, pageSize };
  }

  async getTagDetail(id: string): Promise<CustomerTagVO> {
    const tag = await this.tagRepo.findById(id);
    if (!tag) throw new Error('标签记录不存在');
    return this.toVO(tag);
  }

  async getTagLogs(tagId: string): Promise<CustomerTagLogVO[]> {
    const logs = await this.logRepo.findByTagId(tagId);
    return logs.map(l => this.toLogVO(l));
  }

  async traceTag(params: TagTraceRequest): Promise<TagTraceResponse> {
    const { customer_id, tag_code } = params;
    const allTags = await this.tagRepo.findAllByCustomerId(customer_id);
    const allLogs = await this.logRepo.findByCustomerId(customer_id);

    const activeTags = allTags.filter(t => t.tag_status === 1);
    const expiredTags = allTags.filter(t => t.tag_status === 2);
    const removedTags = allTags.filter(t => t.tag_status === 4);

    let hasUnauthorized = false;
    let hasViolation = false;
    let hasTampering = false;
    const riskPrompts: string[] = [];

    for (const log of allLogs) {
      if (log.is_unauthorized) hasUnauthorized = true;
      if (log.is_violation) hasViolation = true;
    }

    const criticalFields = ['tag_code', 'tag_name', 'customer_level'];
    for (const log of allLogs) {
      if (log.before_content && log.after_content) {
        try {
          const before = JSON.parse(log.before_content);
          const after = JSON.parse(log.after_content);
          for (const field of criticalFields) {
            if (before[field] && after[field] && before[field] !== after[field]) {
              if (log.change_type !== '4' && log.change_type !== '2') {
                hasTampering = true;
                riskPrompts.push(`检测到关键字段${field}异常变更: ${before[field]} → ${after[field]}`);
              }
            }
          }
        } catch (_e) { /* ignore */ }
      }
    }

    if (hasUnauthorized) riskPrompts.push('存在越权标签修改行为，已被拦截');
    if (hasViolation) riskPrompts.push('存在违规高端标签赋值行为，已被拦截');
    if (hasTampering) riskPrompts.push('检测到标签关键信息异常变更，可能存在篡改风险');

    const filteredLogs = tag_code ? allLogs.filter(l => l.tag_code === tag_code) : allLogs;

    const historyRecords: TagTraceRecord[] = allTags.map(t => ({
      id: t.id,
      tag_id: t.id,
      customer_id: t.customer_id,
      customer_no: t.customer_no,
      customer_name: t.customer_name,
      tag_code: t.tag_code,
      tag_name: t.tag_name,
      tag_status: t.tag_status,
      tag_status_text: TAG_STATUS_MAP[t.tag_status],
      change_type: undefined,
      change_type_name: undefined,
      operate_time: undefined,
      operator_name: undefined,
      is_unauthorized: 0,
      is_violation: 0,
      block_reason: undefined
    }));

    const logVOs = filteredLogs.map(l => this.toLogVO(l));

    let allowed = true;
    let blockReason: string | undefined;
    if (hasViolation) {
      allowed = false;
      blockReason = '存在违规操作记录，标签变更已被拦截';
    }

    return {
      customer_id,
      customer_name: allTags.length > 0 ? allTags[0].customer_name : undefined,
      matched: allTags.length > 0,
      total_tags: allTags.length,
      active_tags: activeTags.length,
      expired_tags: expiredTags.length,
      removed_tags: removedTags.length,
      has_unauthorized: hasUnauthorized,
      has_violation: hasViolation,
      has_tampering: hasTampering,
      history_records: historyRecords,
      change_logs: logVOs,
      risk_prompts: riskPrompts,
      allowed,
      block_reason: blockReason
    };
  }

  async batchUpdateTags(data: TagBatchRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<TagBatchResponse> {
    const batchNo = `BTAG${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const batch = await this.batchRepo.create({
      batch_no: batchNo,
      org_id: data.org_id || orgId,
      batch_name: data.batch_name,
      operation_type: data.operation_type,
      target_tag_code: data.target_tag_code,
      target_tag_name: data.target_tag_name,
      total_count: data.items.length,
      success_count: 0,
      fail_count: 0,
      unauthorized_count: 0,
      violation_count: 0,
      status: 1,
      creator_id: operatorId,
      creator_name: operatorName,
      create_time: new Date()
    } as any);

    let successCount = 0;
    let failCount = 0;
    let unauthorizedCount = 0;
    let violationCount = 0;
    const resultItems: TagBatchResultItem[] = [];

    for (const item of data.items) {
      let processResult: TagProcessResult = 0;
      let processMessage = '';
      let blockReason = '';

      try {
        const customerTags = item.customer_id ? await this.tagRepo.findAllByCustomerId(item.customer_id) : [];

        if (data.target_tag_code && HIGH_END_TAG_CODES.includes(data.target_tag_code)) {
          const currentLevel = customerTags.length > 0 ? customerTags[0].customer_level : 1;
          if (currentLevel < 4) {
            processResult = 4;
            blockReason = `客户等级${CUSTOMER_LEVEL_MAP[currentLevel]}不允许绑定高端标签`;
            violationCount++;
          }
        }

        if (processResult === 0 && data.target_tag_code && item.customer_id) {
          const existingTag = await this.tagRepo.findByCustomerIdAndTagCode(item.customer_id, data.target_tag_code);
          if (existingTag && data.operation_type === 1) {
            processResult = 2;
            processMessage = '客户已存在相同标签';
            failCount++;
          }
        }

        if (processResult === 0 && item.customer_id) {
          switch (data.operation_type) {
            case 1:
              await this.tagRepo.create({
                customer_id: item.customer_id,
                tag_code: data.target_tag_code,
                tag_name: data.target_tag_name || data.target_tag_code,
                tag_type: 1,
                tag_source: 3,
                tag_status: 1,
                customer_level: TAG_LEVEL_MAPPING[data.target_tag_code || ''] || item.current_level || 1,
                effective_time: new Date(),
                service_permissions: JSON.stringify(TAG_SERVICE_PERMISSIONS[data.target_tag_code || ''] || []),
                fee_discounts: JSON.stringify(TAG_FEE_DISCOUNTS[data.target_tag_code || ''] || []),
                marketing_rules: JSON.stringify(TAG_MARKETING_RULES[data.target_tag_code || ''] || []),
                operator_id: operatorId,
                operator_name: operatorName,
                asset_data_status: 1,
                transaction_data_status: 1,
                retention_data_status: 1,
                risk_data_status: 1
              } as any);
              processResult = 1;
              processMessage = '标签新增成功';
              successCount++;
              break;

            case 2:
              if (customerTags.length > 0) {
                const activeTags = customerTags.filter(t => t.tag_status === 1);
                for (const at of activeTags) {
                  await this.tagRepo.update(at.id, { tag_status: 4 } as any);
                }
                await this.tagRepo.create({
                  customer_id: item.customer_id,
                  tag_code: data.target_tag_code,
                  tag_name: data.target_tag_name || data.target_tag_code,
                  tag_type: 1,
                  tag_source: 3,
                  tag_status: 1,
                  customer_level: TAG_LEVEL_MAPPING[data.target_tag_code || ''] || item.current_level || 1,
                  effective_time: new Date(),
                  service_permissions: JSON.stringify(TAG_SERVICE_PERMISSIONS[data.target_tag_code || ''] || []),
                  fee_discounts: JSON.stringify(TAG_FEE_DISCOUNTS[data.target_tag_code || ''] || []),
                  marketing_rules: JSON.stringify(TAG_MARKETING_RULES[data.target_tag_code || ''] || []),
                  operator_id: operatorId,
                  operator_name: operatorName,
                  asset_data_status: 1,
                  transaction_data_status: 1,
                  retention_data_status: 1,
                  risk_data_status: 1
                } as any);
                processResult = 1;
                processMessage = '标签替换成功';
                successCount++;
              } else {
                processResult = 2;
                processMessage = '客户无有效标签可替换';
                failCount++;
              }
              break;

            case 3:
              if (customerTags.length > 0) {
                const activeTags = customerTags.filter(t => t.tag_status === 1);
                for (const at of activeTags) {
                  await this.tagRepo.update(at.id, { tag_status: 4 } as any);
                }
                processResult = 1;
                processMessage = '标签移除成功';
                successCount++;
              } else {
                processResult = 2;
                processMessage = '客户无有效标签可移除';
                failCount++;
              }
              break;

            case 4:
              if (customerTags.length > 0) {
                const newLevel = TAG_LEVEL_MAPPING[data.target_tag_code || ''] || item.current_level || 1;
                await this.tagRepo.update(customerTags[0].id, {
                  customer_level: newLevel,
                  tag_code: data.target_tag_code || customerTags[0].tag_code,
                  tag_name: data.target_tag_name || customerTags[0].tag_name
                } as any);
                processResult = 1;
                processMessage = '等级调整成功';
                successCount++;
              } else {
                processResult = 2;
                processMessage = '客户无标签记录可调整';
                failCount++;
              }
              break;
          }
        }
      } catch (e: any) {
        processResult = 2;
        processMessage = e.message || '处理失败';
        failCount++;
      }

      resultItems.push({
        row_index: item.row_index,
        customer_id: item.customer_id,
        customer_no: item.customer_no,
        customer_name: item.customer_name,
        current_level: item.current_level,
        process_result: processResult,
        process_result_text: PROCESS_RESULT_MAP[processResult],
        process_message: processMessage,
        block_reason: blockReason || undefined
      });

      await this.batchItemRepo.create({
        batch_id: batch.id,
        row_index: item.row_index,
        customer_id: item.customer_id,
        customer_no: item.customer_no,
        customer_name: item.customer_name,
        current_level: item.current_level,
        current_tags: item.current_tags,
        process_result: processResult,
        process_message: processMessage,
        block_reason: blockReason,
        status: 1
      } as any);
    }

    await this.batchRepo.update(batch.id, {
      success_count: successCount,
      fail_count: failCount,
      unauthorized_count: unauthorizedCount,
      violation_count: violationCount,
      status: failCount + unauthorizedCount + violationCount === 0 ? 2 : (successCount > 0 ? 3 : 2),
      finish_time: new Date()
    } as any);

    return {
      batch_id: batch.id,
      batch_no: batchNo,
      batch_name: data.batch_name,
      operation_type: data.operation_type,
      total_count: data.items.length,
      success_count: successCount,
      fail_count: failCount,
      unauthorized_count: unauthorizedCount,
      violation_count: violationCount,
      status: failCount + unauthorizedCount + violationCount === 0 ? 2 : 3,
      status_text: BATCH_STATUS_MAP[failCount + unauthorizedCount + violationCount === 0 ? 2 : 3],
      items: resultItems
    };
  }

  async getBatchList(params: TagBatchQueryParams): Promise<PaginatedResult<TagBatchVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.batchRepo.buildQuery(queryParams);
    const include = [this.batchRepo.getOrganizationInclude()];

    const result = await this.batchRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list = result.list.map((b: any) => this.toBatchVO(b));
    return { list, total: result.total, page, pageSize };
  }

  async getBatchItems(params: TagBatchItemQueryParams): Promise<PaginatedResult<TagBatchItemVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.batchItemRepo.buildQuery(queryParams);

    const result = await this.batchItemRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'row_index', sortOrder: 'ASC' }
    );

    const list = result.list.map((i: any) => this.toBatchItemVO(i));
    return { list, total: result.total, page, pageSize };
  }

  private toVO(tag: CustomerTag): CustomerTagVO {
    const plain = tag.get({ plain: true }) as any;
    let servicePermissionList: string[] | undefined;
    if (plain.service_permissions) {
      try { servicePermissionList = JSON.parse(plain.service_permissions); } catch (_e) { /* ignore */ }
    }
    let feeDiscountList: any[] | undefined;
    if (plain.fee_discounts) {
      try { feeDiscountList = JSON.parse(plain.fee_discounts); } catch (_e) { /* ignore */ }
    }
    let marketingRuleList: any[] | undefined;
    if (plain.marketing_rules) {
      try { marketingRuleList = JSON.parse(plain.marketing_rules); } catch (_e) { /* ignore */ }
    }

    const allDataReady = plain.asset_data_status === 1 && plain.transaction_data_status === 1 && plain.retention_data_status === 1 && plain.risk_data_status === 1;

    return {
      id: plain.id,
      customer_id: plain.customer_id,
      customer_no: plain.customer_no,
      customer_name: plain.customer_name,
      customer_level: plain.customer_level,
      customer_level_text: CUSTOMER_LEVEL_MAP[plain.customer_level],
      tag_code: plain.tag_code,
      tag_name: plain.tag_name,
      tag_type: plain.tag_type,
      tag_type_text: TAG_TYPE_MAP[plain.tag_type],
      tag_source: plain.tag_source,
      tag_source_text: TAG_SOURCE_MAP[plain.tag_source],
      tag_status: plain.tag_status,
      tag_status_text: TAG_STATUS_MAP[plain.tag_status],
      effective_time: plain.effective_time ? dayjs(plain.effective_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      expire_time: plain.expire_time ? dayjs(plain.expire_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      service_permission_list: servicePermissionList,
      fee_discount_list: feeDiscountList,
      marketing_rule_list: marketingRuleList,
      asset_data_status: plain.asset_data_status,
      transaction_data_status: plain.transaction_data_status,
      retention_data_status: plain.retention_data_status,
      risk_data_status: plain.risk_data_status,
      all_data_ready: allDataReady,
      asset_data_time: plain.asset_data_time ? dayjs(plain.asset_data_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      transaction_data_time: plain.transaction_data_time ? dayjs(plain.transaction_data_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      retention_data_time: plain.retention_data_time ? dayjs(plain.retention_data_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      risk_data_time: plain.risk_data_time ? dayjs(plain.risk_data_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      operator_id: plain.operator_id,
      operator_name: plain.operator_name,
      remark: plain.remark,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }

  private toLogVO(log: CustomerTagLog): CustomerTagLogVO {
    return {
      id: log.id,
      tag_id: log.tag_id,
      customer_id: log.customer_id,
      customer_no: log.customer_no,
      customer_name: log.customer_name,
      tag_code: log.tag_code,
      tag_name: log.tag_name,
      change_type: log.change_type,
      change_type_name: log.change_type_name || CHANGE_TYPE_MAP[log.change_type],
      before_content: log.before_content,
      after_content: log.after_content,
      change_remark: log.change_remark,
      is_unauthorized: log.is_unauthorized,
      is_violation: log.is_violation,
      block_reason: log.block_reason,
      operator_id: log.operator_id,
      operator_name: log.operator_name,
      operator_org_id: log.operator_org_id,
      operator_org_name: log.operator_org_name,
      operate_time: log.operate_time ? dayjs(log.operate_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      reviewer_id: log.reviewer_id,
      reviewer_name: log.reviewer_name,
      review_time: log.review_time ? dayjs(log.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      status: log.status,
      created_at: (log as any).createdAt ? dayjs((log as any).createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: (log as any).updatedAt ? dayjs((log as any).updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }

  private toBatchVO(batch: CustomerTagBatch): TagBatchVO {
    const plain = batch.get({ plain: true }) as any;
    return {
      id: plain.id,
      batch_no: plain.batch_no,
      org_id: plain.org_id,
      org_name: plain.organization?.name,
      batch_name: plain.batch_name,
      operation_type: plain.operation_type,
      operation_type_text: OPERATION_TYPE_MAP[plain.operation_type],
      target_tag_code: plain.target_tag_code,
      target_tag_name: plain.target_tag_name,
      total_count: plain.total_count,
      success_count: plain.success_count,
      fail_count: plain.fail_count,
      unauthorized_count: plain.unauthorized_count,
      violation_count: plain.violation_count,
      status: plain.status,
      status_text: BATCH_STATUS_MAP[plain.status],
      fail_reason: plain.fail_reason,
      creator_id: plain.creator_id,
      creator_name: plain.creator_name,
      create_time: plain.create_time ? dayjs(plain.create_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      finish_time: plain.finish_time ? dayjs(plain.finish_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }

  private toBatchItemVO(item: CustomerTagBatchItem): TagBatchItemVO {
    const plain = item.get({ plain: true }) as any;
    return {
      id: plain.id,
      batch_id: plain.batch_id,
      row_index: plain.row_index,
      customer_id: plain.customer_id,
      customer_no: plain.customer_no,
      customer_name: plain.customer_name,
      current_level: plain.current_level,
      current_tags: plain.current_tags,
      process_result: plain.process_result,
      process_result_text: PROCESS_RESULT_MAP[plain.process_result],
      process_message: plain.process_message,
      block_reason: plain.block_reason,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }
}
