import { CustomerPrivacyRuleRepository, CustomerPrivacyLogRepository } from '../repositories/CustomerPrivacyRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { CorporateProfileRepository } from '../repositories/CorporateProfileRepository';
import {
  PrivacySceneType,
  PrivacyOperationType,
  DesensitizationLevel,
  SensitivityLevel,
  PrivacyPreCheckResult,
  PrivacyPreCheckFieldError,
  PrivacySceneAdaptResult,
  PrivacyComplianceCheckResult,
  DesensitizationRuleConfig,
  RetentionRuleConfig,
  CreatePrivacyRuleRequest,
  UpdatePrivacyRuleRequest,
  PrivacyRuleQueryParams,
  PrivacyRuleVO,
  PrivacyLogQueryParams,
  PrivacyLogVO,
  PrivacyTraceRequest,
  PrivacyTraceResponse,
  PrivacyTraceStatistics,
  PrivacyTraceRecord,
  PrivacyBatchConfigRequest,
  PrivacyBatchConfigResponse,
  PrivacyBatchConfigResultItem,
  PrivacyViewRequest,
  PrivacyViewResponse,
  PrivacyExportRequest,
  PrivacyExportResponse,
  PRIVACY_SCENE_MAP,
  OPERATION_TYPE_MAP,
  DESENSITIZATION_LEVEL_MAP,
  BLOCK_TYPE_MAP,
  OPERATOR_POSITION_MAP,
  SENSITIVITY_LEVEL_MAP,
  RULE_STATUS_MAP,
  CUSTOMER_TYPE_MAP,
  CUSTOMER_LEVEL_MAP
} from '../types';
import { PaginatedResult } from '../types/common';
import { CustomerPrivacyRule, CustomerPrivacyLog } from '../models';
import dayjs from 'dayjs';

const DEFAULT_SENSITIVE_FIELDS = [
  'id_card_no', 'legal_id_card_no', 'mobile', 'legal_mobile',
  'address', 'registered_address', 'business_address',
  'contact_phone', 'contact_email', 'bank_account', 'credit_card_no'
];

const DEFAULT_DESENSITIZATION_RULES: Record<number, DesensitizationRuleConfig[]> = {
  2: [
    { field: 'id_card_no', field_name: '身份证号', desensitization_type: 'mask', mask_start: 6, mask_end: 14, mask_char: '*' },
    { field: 'legal_id_card_no', field_name: '法人证件号', desensitization_type: 'mask', mask_start: 6, mask_end: 14, mask_char: '*' },
    { field: 'mobile', field_name: '手机号', desensitization_type: 'mask', mask_start: 3, mask_end: 7, mask_char: '*' },
    { field: 'legal_mobile', field_name: '法人手机号', desensitization_type: 'mask', mask_start: 3, mask_end: 7, mask_char: '*' },
    { field: 'address', field_name: '地址', desensitization_type: 'mask', mask_start: 3, mask_end: 10, mask_char: '*' },
    { field: 'registered_address', field_name: '注册地址', desensitization_type: 'mask', mask_start: 3, mask_end: 10, mask_char: '*' },
    { field: 'business_address', field_name: '经营地址', desensitization_type: 'mask', mask_start: 3, mask_end: 10, mask_char: '*' },
    { field: 'contact_phone', field_name: '联系电话', desensitization_type: 'mask', mask_start: 3, mask_end: 7, mask_char: '*' },
    { field: 'contact_email', field_name: '联系邮箱', desensitization_type: 'mask', mask_start: 2, mask_end: 8, mask_char: '*' }
  ],
  3: [
    { field: 'id_card_no', field_name: '身份证号', desensitization_type: 'replace', replace_value: '******************' },
    { field: 'legal_id_card_no', field_name: '法人证件号', desensitization_type: 'replace', replace_value: '******************' },
    { field: 'mobile', field_name: '手机号', desensitization_type: 'replace', replace_value: '***********' },
    { field: 'legal_mobile', field_name: '法人手机号', desensitization_type: 'replace', replace_value: '***********' },
    { field: 'address', field_name: '地址', desensitization_type: 'replace', replace_value: '***' },
    { field: 'registered_address', field_name: '注册地址', desensitization_type: 'replace', replace_value: '***' },
    { field: 'business_address', field_name: '经营地址', desensitization_type: 'replace', replace_value: '***' },
    { field: 'contact_phone', field_name: '联系电话', desensitization_type: 'replace', replace_value: '***********' },
    { field: 'contact_email', field_name: '联系邮箱', desensitization_type: 'replace', replace_value: '***@***.com' }
  ],
  4: [
    { field: 'id_card_no', field_name: '身份证号', desensitization_type: 'hide' },
    { field: 'legal_id_card_no', field_name: '法人证件号', desensitization_type: 'hide' },
    { field: 'mobile', field_name: '手机号', desensitization_type: 'hide' },
    { field: 'legal_mobile', field_name: '法人手机号', desensitization_type: 'hide' },
    { field: 'address', field_name: '地址', desensitization_type: 'hide' },
    { field: 'registered_address', field_name: '注册地址', desensitization_type: 'hide' },
    { field: 'business_address', field_name: '经营地址', desensitization_type: 'hide' },
    { field: 'contact_phone', field_name: '联系电话', desensitization_type: 'hide' },
    { field: 'contact_email', field_name: '联系邮箱', desensitization_type: 'hide' }
  ]
};

const DEFAULT_RETENTION_RULES: Record<number, RetentionRuleConfig> = {
  1: { retention_days: 30, need_archive: false, need_approval: false },
  2: { retention_days: 90, need_archive: true, need_approval: false },
  3: { retention_days: 180, need_archive: true, need_approval: true, approval_position: [3, 5] },
  4: { retention_days: 365, need_archive: true, need_approval: true, approval_position: [4, 5] }
};

const SCENE_DESENSITIZATION_MAP: Record<number, DesensitizationLevel> = {
  1: 2,
  2: 2,
  3: 3,
  4: 1
};

const SCENE_TIME_LIMIT_MAP: Record<number, number> = {
  1: 30,
  2: 60,
  3: 120,
  4: 240
};

const HIGH_FREQUENCY_THRESHOLD = 50;
const HIGH_FREQUENCY_WINDOW_HOURS = 1;
const MALICIOUS_EXPORT_THRESHOLD = 100;
const MALICIOUS_EXPORT_WINDOW_HOURS = 24;

export class CustomerPrivacyService {
  private ruleRepo: CustomerPrivacyRuleRepository;
  private logRepo: CustomerPrivacyLogRepository;
  private customerRepo: CustomerRepository;
  private corporateRepo: CorporateProfileRepository;

  constructor() {
    this.ruleRepo = new CustomerPrivacyRuleRepository();
    this.logRepo = new CustomerPrivacyLogRepository();
    this.customerRepo = new CustomerRepository();
    this.corporateRepo = new CorporateProfileRepository();
  }

  async preCheckPrivacy(
    data: PrivacyViewRequest,
    operatorId?: string,
    operatorName?: string,
    operatorPosition?: number,
    operatorOrgId?: string,
    operatorOrgName?: string
  ): Promise<PrivacyPreCheckResult> {
    const errors: PrivacyPreCheckFieldError[] = [];
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';
    let permissionValid = true;
    let sceneValid = true;
    let recordComplete = true;

    let customerLevel = 1;
    let sensitivityLevel: SensitivityLevel = 1;
    let desensitizationLevel: DesensitizationLevel = 2;
    let timeLimit = 30;
    let needRecord = false;
    let matchedRuleCode: string | undefined;
    let matchedRuleName: string | undefined;

    if (!operatorId) {
      permissionValid = false;
      blocked = true;
      blockReason = '操作人员未登录，无操作权限';
      errors.push({ field: 'operator_id', message: '操作人员未登录', code: 'OPERATOR_NOT_LOGIN' });
    }

    if (!data.scene_type) {
      sceneValid = false;
      blocked = true;
      blockReason = blockReason || '未指定查看场景，禁止查看客户信息';
      errors.push({ field: 'scene_type', message: '查看场景不能为空', code: 'SCENE_TYPE_REQUIRED' });
    }

    if (!data.customer_id && !data.corporate_id) {
      errors.push({ field: 'customer_id', message: '客户ID不能为空', code: 'CUSTOMER_ID_REQUIRED' });
    }

    let customer: any = null;
    let corporate: any = null;

    if (data.customer_id) {
      customer = await this.customerRepo.findById(data.customer_id);
      if (!customer) {
        blocked = true;
        blockReason = blockReason || '客户信息不存在';
        errors.push({ field: 'customer_id', message: '客户信息不存在', code: 'CUSTOMER_NOT_FOUND' });
      } else {
        customerLevel = customer.customer_level || 1;
        if (customerLevel >= 4) {
          sensitivityLevel = 4;
        } else if (customerLevel >= 3) {
          sensitivityLevel = 3;
        } else if (customerLevel >= 2) {
          sensitivityLevel = 2;
        }
      }
    }

    if (data.corporate_id) {
      corporate = await this.corporateRepo.findById(data.corporate_id);
      if (!corporate) {
        blocked = true;
        blockReason = blockReason || '对公客户信息不存在';
        errors.push({ field: 'corporate_id', message: '对公客户信息不存在', code: 'CORPORATE_NOT_FOUND' });
      } else {
        const corpCustomerType = corporate.customer_type || 1;
        if (corpCustomerType >= 4) {
          customerLevel = 5;
          sensitivityLevel = 4;
        } else if (corpCustomerType >= 3) {
          customerLevel = 4;
          sensitivityLevel = 4;
        } else if (corpCustomerType >= 2) {
          customerLevel = 3;
          sensitivityLevel = 3;
        }
      }
    }

    const matchedRule = await this.ruleRepo.findMatchingRule(
      customerLevel,
      sensitivityLevel,
      operatorPosition || 1,
      data.scene_type || 1
    );

    if (matchedRule) {
      matchedRuleCode = matchedRule.rule_code;
      matchedRuleName = matchedRule.rule_name;
      desensitizationLevel = matchedRule.desensitization_rules ? 3 : SCENE_DESENSITIZATION_MAP[data.scene_type || 1];
      timeLimit = matchedRule.time_limit || SCENE_TIME_LIMIT_MAP[data.scene_type || 1];
      needRecord = matchedRule.need_record === 1;

      if (needRecord && !data.operation_purpose) {
        recordComplete = false;
        blocked = true;
        blockReason = blockReason || '当前场景需要备案操作用途，请先填写操作用途';
        errors.push({ field: 'operation_purpose', message: '操作用途不能为空', code: 'PURPOSE_REQUIRED' });
      }
    } else {
      desensitizationLevel = SCENE_DESENSITIZATION_MAP[data.scene_type || 1];
      timeLimit = SCENE_TIME_LIMIT_MAP[data.scene_type || 1];
      needRecord = data.scene_type !== 4;

      if (needRecord && !data.operation_purpose) {
        recordComplete = false;
        blocked = true;
        blockReason = blockReason || '当前场景需要备案操作用途，请先填写操作用途';
        errors.push({ field: 'operation_purpose', message: '操作用途不能为空', code: 'PURPOSE_REQUIRED' });
      }

      warnings.push('未匹配到定制化规则，使用默认脱敏策略');
    }

    if (customerLevel >= 4) {
      warnings.push(`高端客户（${CUSTOMER_LEVEL_MAP[customerLevel]}）隐私防护等级已自动提升`);
    }

    const complianceCheck = await this.checkCompliance(
      operatorId || '',
      data.operation_type || 1,
      data.customer_id || data.corporate_id || '',
      data.scene_type || 1
    );

    if (complianceCheck.is_high_frequency) {
      blocked = true;
      blockReason = blockReason || '检测到高频访问行为，操作已被拦截';
      errors.push({ field: 'operation_frequency', message: '操作频率过高，已触发风控拦截', code: 'HIGH_FREQUENCY' });
    }

    if (complianceCheck.is_malicious_export) {
      blocked = true;
      blockReason = blockReason || '检测到批量恶意导出行为，操作已被拦截';
      errors.push({ field: 'export_behavior', message: '导出行为异常，已触发风控拦截', code: 'MALICIOUS_EXPORT' });
    }

    if (!blocked) {
      await this.logRepo.create({
        customer_id: data.customer_id,
        corporate_id: data.corporate_id,
        customer_no: customer?.customer_no || corporate?.profile_no,
        customer_name: customer?.customer_name || corporate?.enterprise_name,
        customer_type: data.customer_id ? 1 : 2,
        customer_level: customerLevel,
        operator_id: operatorId,
        operator_name: operatorName,
        operator_position: operatorPosition || 1,
        operator_org_id: operatorOrgId,
        operator_org_name: operatorOrgName,
        scene_type: data.scene_type,
        operation_type: data.operation_type || 1,
        sensitive_fields: matchedRule?.sensitive_fields || DEFAULT_SENSITIVE_FIELDS.join(','),
        desensitization_level: desensitizationLevel,
        operation_purpose: data.operation_purpose,
        is_blocked: 0,
        block_type: 0,
        is_unauthorized: 0,
        is_violation: 0,
        operation_time: new Date(),
        view_count: 1,
        is_risk_alert: complianceCheck.risk_alert ? 1 : 0,
        risk_alert_info: complianceCheck.risk_alert_info,
        rule_id: matchedRule?.id,
        rule_code: matchedRule?.rule_code,
        request_params: JSON.stringify(data)
      } as any);
    } else {
      await this.logRepo.create({
        customer_id: data.customer_id,
        corporate_id: data.corporate_id,
        customer_no: customer?.customer_no || corporate?.profile_no,
        customer_name: customer?.customer_name || corporate?.enterprise_name,
        customer_type: data.customer_id ? 1 : 2,
        customer_level: customerLevel,
        operator_id: operatorId,
        operator_name: operatorName,
        operator_position: operatorPosition || 1,
        operator_org_id: operatorOrgId,
        operator_org_name: operatorOrgName,
        scene_type: data.scene_type,
        operation_type: data.operation_type || 1,
        sensitive_fields: matchedRule?.sensitive_fields || DEFAULT_SENSITIVE_FIELDS.join(','),
        desensitization_level: desensitizationLevel,
        operation_purpose: data.operation_purpose,
        is_blocked: 1,
        block_type: complianceCheck.is_high_frequency ? 4 : (complianceCheck.is_malicious_export ? 5 : (needRecord && !data.operation_purpose ? 2 : 1)),
        block_reason: blockReason,
        is_unauthorized: !permissionValid ? 1 : 0,
        is_violation: (complianceCheck.is_high_frequency || complianceCheck.is_malicious_export) ? 1 : 0,
        operation_time: new Date(),
        view_count: 1,
        is_risk_alert: 1,
        risk_alert_info: blockReason,
        rule_id: matchedRule?.id,
        rule_code: matchedRule?.rule_code,
        request_params: JSON.stringify(data)
      } as any);
    }

    return {
      passed: errors.length === 0 && !blocked,
      blocked,
      permission_valid: permissionValid,
      scene_valid: sceneValid,
      record_complete: recordComplete,
      customer_level: customerLevel,
      customer_level_text: CUSTOMER_LEVEL_MAP[customerLevel] || '普通',
      sensitivity_level: sensitivityLevel,
      sensitivity_level_text: SENSITIVITY_LEVEL_MAP[sensitivityLevel],
      desensitization_level: desensitizationLevel,
      desensitization_level_text: DESENSITIZATION_LEVEL_MAP[desensitizationLevel],
      time_limit: timeLimit,
      need_record: needRecord,
      errors,
      warnings,
      block_reason: blockReason || undefined,
      matched_rule_code: matchedRuleCode,
      matched_rule_name: matchedRuleName
    };
  }

  async adaptScene(
    sceneType: PrivacySceneType,
    customerLevel: number = 1,
    operatorPosition: number = 1
  ): Promise<PrivacySceneAdaptResult> {
    const adaptRules: string[] = [];
    const sensitivityLevel: SensitivityLevel = customerLevel >= 4 ? 4 : customerLevel >= 3 ? 3 : customerLevel >= 2 ? 2 : 1;

    const matchedRule = await this.ruleRepo.findMatchingRule(
      customerLevel,
      sensitivityLevel,
      operatorPosition,
      sceneType
    );

    let desensitizationLevel: DesensitizationLevel;
    let desensitizationRules: DesensitizationRuleConfig[];
    let retentionRules: RetentionRuleConfig;
    let timeLimit: number;
    let needRecord: boolean;
    let needOperationLog: boolean;
    let sensitiveFields: string[];

    if (matchedRule) {
      desensitizationLevel = matchedRule.desensitization_rules ? 3 : SCENE_DESENSITIZATION_MAP[sceneType];
      try {
        desensitizationRules = matchedRule.desensitization_rules ? JSON.parse(matchedRule.desensitization_rules) : DEFAULT_DESENSITIZATION_RULES[desensitizationLevel];
      } catch {
        desensitizationRules = DEFAULT_DESENSITIZATION_RULES[desensitizationLevel];
      }
      try {
        retentionRules = matchedRule.retention_rules ? JSON.parse(matchedRule.retention_rules) : DEFAULT_RETENTION_RULES[sensitivityLevel];
      } catch {
        retentionRules = DEFAULT_RETENTION_RULES[sensitivityLevel];
      }
      timeLimit = matchedRule.time_limit || SCENE_TIME_LIMIT_MAP[sceneType];
      needRecord = matchedRule.need_record === 1;
      needOperationLog = matchedRule.need_operation_log === 1;
      sensitiveFields = matchedRule.sensitive_fields ? matchedRule.sensitive_fields.split(',') : DEFAULT_SENSITIVE_FIELDS;

      adaptRules.push(`匹配规则：${matchedRule.rule_name}（${matchedRule.rule_code}）`);
      if (matchedRule.is_global) adaptRules.push('规则为全局生效规则');
    } else {
      desensitizationLevel = SCENE_DESENSITIZATION_MAP[sceneType];
      desensitizationRules = DEFAULT_DESENSITIZATION_RULES[desensitizationLevel];
      retentionRules = DEFAULT_RETENTION_RULES[sensitivityLevel];
      timeLimit = SCENE_TIME_LIMIT_MAP[sceneType];
      needRecord = sceneType !== 4;
      needOperationLog = true;
      sensitiveFields = DEFAULT_SENSITIVE_FIELDS;

      adaptRules.push('未匹配定制化规则，使用默认策略');
    }

    adaptRules.push(`场景类型：${PRIVACY_SCENE_MAP[sceneType]} → 脱敏级别：${DESENSITIZATION_LEVEL_MAP[desensitizationLevel]}`);
    adaptRules.push(`客户等级：${CUSTOMER_LEVEL_MAP[customerLevel]} → 敏感度：${SENSITIVITY_LEVEL_MAP[sensitivityLevel]}`);
    adaptRules.push(`操作岗位：${OPERATOR_POSITION_MAP[operatorPosition]} → 时效限制：${timeLimit}分钟`);
    if (customerLevel >= 4) adaptRules.push('高端客户自动提升防护等级');
    if (needRecord) adaptRules.push('当前场景需要备案操作用途');

    return {
      scene_type: sceneType,
      scene_type_text: PRIVACY_SCENE_MAP[sceneType],
      desensitization_level: desensitizationLevel,
      desensitization_level_text: DESENSITIZATION_LEVEL_MAP[desensitizationLevel],
      desensitization_rules: desensitizationRules,
      retention_rules: retentionRules,
      time_limit: timeLimit,
      need_record: needRecord,
      need_operation_log: needOperationLog,
      sensitive_fields: sensitiveFields,
      adapt_rules: adaptRules
    };
  }

  private async checkCompliance(
    operatorId: string,
    operationType: PrivacyOperationType,
    targetId: string,
    sceneType: PrivacySceneType
  ): Promise<PrivacyComplianceCheckResult> {
    let isHighFrequency = false;
    let isMaliciousExport = false;
    let isUnauthorized = false;
    let isViolation = false;
    let riskAlert = false;
    let riskAlertInfo: string | undefined;
    let violationType: string | undefined;
    let violationMessage: string | undefined;

    const now = new Date();
    const highFreqStart = dayjs(now).subtract(HIGH_FREQUENCY_WINDOW_HOURS, 'hour').toDate();
    const highFreqCount = await this.logRepo.countHighFrequencyOperations(
      operatorId,
      highFreqStart,
      now,
      HIGH_FREQUENCY_THRESHOLD
    );

    if (highFreqCount >= HIGH_FREQUENCY_THRESHOLD) {
      isHighFrequency = true;
      isViolation = true;
      riskAlert = true;
      violationType = 'HIGH_FREQUENCY_ACCESS';
      violationMessage = `${HIGH_FREQUENCY_WINDOW_HOURS}小时内操作次数达到${highFreqCount}次，超过阈值${HIGH_FREQUENCY_THRESHOLD}次`;
      riskAlertInfo = violationMessage;
    }

    if (operationType === 2) {
      const exportStart = dayjs(now).subtract(MALICIOUS_EXPORT_WINDOW_HOURS, 'hour').toDate();
      const exportCount = await this.logRepo.countMaliciousExports(
        operatorId,
        exportStart,
        now,
        MALICIOUS_EXPORT_THRESHOLD
      );

      if (exportCount >= MALICIOUS_EXPORT_THRESHOLD) {
        isMaliciousExport = true;
        isViolation = true;
        riskAlert = true;
        violationType = 'MALICIOUS_EXPORT';
        violationMessage = `${MALICIOUS_EXPORT_WINDOW_HOURS}小时内导出记录数达到${exportCount}条，超过阈值${MALICIOUS_EXPORT_THRESHOLD}条`;
        riskAlertInfo = violationMessage;
      }
    }

    return {
      compliant: !isHighFrequency && !isMaliciousExport && !isUnauthorized && !isViolation,
      is_high_frequency: isHighFrequency,
      is_malicious_export: isMaliciousExport,
      is_unauthorized: isUnauthorized,
      is_violation: isViolation,
      violation_type: violationType,
      violation_message: violationMessage,
      risk_alert: riskAlert,
      risk_alert_info: riskAlertInfo
    };
  }

  async createRule(
    data: CreatePrivacyRuleRequest,
    operatorId?: string,
    operatorName?: string
  ): Promise<PrivacyRuleVO> {
    const existing = await this.ruleRepo.findByRuleCode(data.rule_code);
    if (existing) {
      throw new Error('规则编码已存在');
    }

    const rule = await this.ruleRepo.create({
      rule_code: data.rule_code,
      rule_name: data.rule_name,
      customer_level: data.customer_level ?? 0,
      sensitivity_level: data.sensitivity_level,
      operator_position: data.operator_position ?? 0,
      scene_type: data.scene_type,
      desensitization_rules: JSON.stringify(data.desensitization_rules),
      retention_rules: JSON.stringify(data.retention_rules),
      time_limit: data.time_limit ?? 30,
      sensitive_fields: data.sensitive_fields.join(','),
      need_record: data.need_record ?? 1,
      need_operation_log: data.need_operation_log ?? 1,
      is_global: data.is_global ?? 0,
      status: data.status ?? 1,
      description: data.description,
      org_id: data.org_id,
      creator_id: operatorId,
      creator_name: operatorName,
      effective_time: data.effective_time ? new Date(data.effective_time) : new Date(),
      expire_time: data.expire_time ? new Date(data.expire_time) : undefined
    } as any);

    return this.toRuleVO(rule);
  }

  async updateRule(
    id: string,
    data: UpdatePrivacyRuleRequest,
    operatorId?: string,
    operatorName?: string
  ): Promise<PrivacyRuleVO> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throw new Error('规则不存在');

    const updateData: any = {};
    if (data.rule_name !== undefined) updateData.rule_name = data.rule_name;
    if (data.customer_level !== undefined) updateData.customer_level = data.customer_level;
    if (data.sensitivity_level !== undefined) updateData.sensitivity_level = data.sensitivity_level;
    if (data.operator_position !== undefined) updateData.operator_position = data.operator_position;
    if (data.scene_type !== undefined) updateData.scene_type = data.scene_type;
    if (data.desensitization_rules !== undefined) updateData.desensitization_rules = JSON.stringify(data.desensitization_rules);
    if (data.retention_rules !== undefined) updateData.retention_rules = JSON.stringify(data.retention_rules);
    if (data.time_limit !== undefined) updateData.time_limit = data.time_limit;
    if (data.sensitive_fields !== undefined) updateData.sensitive_fields = data.sensitive_fields.join(',');
    if (data.need_record !== undefined) updateData.need_record = data.need_record;
    if (data.need_operation_log !== undefined) updateData.need_operation_log = data.need_operation_log;
    if (data.is_global !== undefined) updateData.is_global = data.is_global;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.effective_time !== undefined) updateData.effective_time = data.effective_time ? new Date(data.effective_time) : undefined;
    if (data.expire_time !== undefined) updateData.expire_time = data.expire_time ? new Date(data.expire_time) : undefined;

    await this.ruleRepo.update(id, updateData);
    const updated = await this.ruleRepo.findById(id);
    return this.toRuleVO(updated!);
  }

  async getRuleList(params: PrivacyRuleQueryParams): Promise<PaginatedResult<PrivacyRuleVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.ruleRepo.buildQuery(queryParams);
    const include = [this.ruleRepo.getOrganizationInclude()];

    const result = await this.ruleRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list = result.list.map((r: any) => this.toRuleVO(r));
    return { list, total: result.total, page, pageSize };
  }

  async getRuleDetail(id: string): Promise<PrivacyRuleVO> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throw new Error('规则不存在');
    return this.toRuleVO(rule);
  }

  async deleteRule(id: string): Promise<void> {
    const rule = await this.ruleRepo.findById(id);
    if (!rule) throw new Error('规则不存在');
    await this.ruleRepo.delete(id);
  }

  async getLogList(params: PrivacyLogQueryParams): Promise<PaginatedResult<PrivacyLogVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.logRepo.buildQuery(queryParams);
    const include = [
      this.logRepo.getCustomerInclude(),
      this.logRepo.getCorporateInclude()
    ];

    const result = await this.logRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'operation_time', sortOrder: 'DESC' },
      { include }
    );

    const list = result.list.map((l: any) => this.toLogVO(l));
    return { list, total: result.total, page, pageSize };
  }

  async getLogDetail(id: string): Promise<PrivacyLogVO> {
    const log = await this.logRepo.findById(id);
    if (!log) throw new Error('日志不存在');
    return this.toLogVO(log);
  }

  async tracePrivacy(params: PrivacyTraceRequest): Promise<PrivacyTraceResponse> {
    const { customer_id, corporate_id, customer_no, start_time, end_time } = params;

    let allLogs: CustomerPrivacyLog[] = [];
    let customerName: string | undefined;
    let matched = false;

    if (customer_id) {
      const customer = await this.customerRepo.findById(customer_id);
      if (customer) {
        customerName = customer.customer_name;
        matched = true;
        allLogs = await this.logRepo.findByCustomerId(customer_id, start_time, end_time);
      }
    } else if (corporate_id) {
      const corporate = await this.corporateRepo.findById(corporate_id);
      if (corporate) {
        customerName = corporate.enterprise_name;
        matched = true;
        allLogs = await this.logRepo.findByCorporateId(corporate_id, start_time, end_time);
      }
    } else if (customer_no) {
      const customer = await this.customerRepo.findByCustomerNo(customer_no);
      if (customer) {
        customerName = customer.customer_name;
        matched = true;
        allLogs = await this.logRepo.findByCustomerId(customer.id, start_time, end_time);
      }
    }

    const statistics: PrivacyTraceStatistics = {
      total_operations: allLogs.length,
      view_count: allLogs.filter(l => l.operation_type === 1).length,
      export_count: allLogs.filter(l => l.operation_type === 2).length,
      modify_count: allLogs.filter(l => l.operation_type === 3).length,
      delete_count: allLogs.filter(l => l.operation_type === 4).length,
      blocked_count: allLogs.filter(l => l.is_blocked === 1).length,
      unauthorized_count: allLogs.filter(l => l.is_unauthorized === 1).length,
      violation_count: allLogs.filter(l => l.is_violation === 1).length,
      risk_alert_count: allLogs.filter(l => l.is_risk_alert === 1).length,
      high_frequency_count: allLogs.filter(l => l.block_type === 4).length,
      malicious_export_count: allLogs.filter(l => l.block_type === 5).length
    };

    const hasUnauthorized = statistics.unauthorized_count > 0;
    const hasViolation = statistics.violation_count > 0;
    const hasHighFrequency = statistics.high_frequency_count > 0;
    const hasMaliciousExport = statistics.malicious_export_count > 0;
    const hasRiskAlert = statistics.risk_alert_count > 0;

    const riskPrompts: string[] = [];
    if (hasUnauthorized) riskPrompts.push(`存在${statistics.unauthorized_count}次越权操作记录，已被拦截`);
    if (hasViolation) riskPrompts.push(`存在${statistics.violation_count}次违规操作记录，已被拦截`);
    if (hasHighFrequency) riskPrompts.push(`存在${statistics.high_frequency_count}次高频访问行为，已触发风控`);
    if (hasMaliciousExport) riskPrompts.push(`存在${statistics.malicious_export_count}次批量恶意导出行为，已触发风控`);
    if (hasRiskAlert) riskPrompts.push(`累计触发${statistics.risk_alert_count}次风控预警`);

    const historyRecords: PrivacyTraceRecord[] = allLogs.map(l => ({
      id: l.id,
      log_no: l.log_no,
      operation_time: dayjs(l.operation_time).format('YYYY-MM-DD HH:mm:ss'),
      operator_name: l.operator_name,
      operator_position: l.operator_position,
      operator_position_text: OPERATOR_POSITION_MAP[l.operator_position],
      scene_type: l.scene_type as PrivacySceneType,
      scene_type_text: PRIVACY_SCENE_MAP[l.scene_type],
      operation_type: l.operation_type as PrivacyOperationType,
      operation_type_text: OPERATION_TYPE_MAP[l.operation_type],
      is_blocked: l.is_blocked,
      block_type: l.block_type as any,
      block_type_text: BLOCK_TYPE_MAP[l.block_type],
      block_reason: l.block_reason,
      is_unauthorized: l.is_unauthorized,
      is_violation: l.is_violation,
      is_risk_alert: l.is_risk_alert,
      risk_alert_info: l.risk_alert_info,
      sensitive_fields: l.sensitive_fields ? l.sensitive_fields.split(',') : []
    }));

    const logVOs = allLogs.map(l => this.toLogVO(l));

    let allowed = true;
    let blockReason: string | undefined;
    if (hasViolation || hasMaliciousExport) {
      allowed = false;
      blockReason = '存在违规操作记录，隐私访问已被限制';
    }

    return {
      customer_id,
      corporate_id,
      customer_no,
      customer_name: customerName,
      matched,
      statistics,
      has_unauthorized: hasUnauthorized,
      has_violation: hasViolation,
      has_high_frequency: hasHighFrequency,
      has_malicious_export: hasMaliciousExport,
      has_risk_alert: hasRiskAlert,
      history_records: historyRecords,
      change_logs: logVOs,
      risk_prompts: riskPrompts,
      allowed,
      block_reason: blockReason
    };
  }

  async batchConfigRules(
    data: PrivacyBatchConfigRequest,
    operatorId?: string,
    operatorName?: string
  ): Promise<PrivacyBatchConfigResponse> {
    let successCount = 0;
    let failCount = 0;
    let unauthorizedCount = 0;
    let violationCount = 0;
    const items: PrivacyBatchConfigResultItem[] = [];

    for (const item of data.items) {
      let processResult: 0 | 1 | 2 | 3 | 4 = 0;
      let processMessage = '';
      let blockReason = '';
      let ruleCode: string | undefined;
      let ruleId: string | undefined;

      try {
        const sceneType = item.scene_type || 1;
        const customerLevel = item.customer_level || 0;
        const sensitivityLevel = item.sensitivity_level || 1;
        const operatorPosition = item.operator_position || 0;

        const existingRule = await this.ruleRepo.findMatchingRule(
          customerLevel,
          sensitivityLevel,
          operatorPosition,
          sceneType
        );

        if (existingRule && existingRule.is_global) {
          processResult = 4;
          blockReason = '该维度已存在全局规则，禁止重复配置';
          violationCount++;
        } else {
          ruleCode = `PRIV_RULE_${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          const desensitizationLevel = SCENE_DESENSITIZATION_MAP[sceneType];
          const desensitizationRules = item.desensitization_rules || DEFAULT_DESENSITIZATION_RULES[desensitizationLevel];
          const retentionRules = item.retention_rules || DEFAULT_RETENTION_RULES[sensitivityLevel];
          const timeLimit = item.time_limit || SCENE_TIME_LIMIT_MAP[sceneType];
          const sensitiveFields = item.sensitive_fields || DEFAULT_SENSITIVE_FIELDS;

          const rule = await this.ruleRepo.create({
            rule_code: ruleCode,
            rule_name: `${CUSTOMER_LEVEL_MAP[customerLevel]}${PRIVACY_SCENE_MAP[sceneType]}防护规则`,
            customer_level: customerLevel,
            sensitivity_level: sensitivityLevel,
            operator_position: operatorPosition,
            scene_type: sceneType,
            desensitization_rules: JSON.stringify(desensitizationRules),
            retention_rules: JSON.stringify(retentionRules),
            time_limit: timeLimit,
            sensitive_fields: sensitiveFields.join(','),
            need_record: sceneType !== 4 ? 1 : 0,
            need_operation_log: 1,
            is_global: data.is_global,
            status: 1,
            org_id: data.org_id,
            creator_id: operatorId,
            creator_name: operatorName,
            effective_time: new Date()
          } as any);

          ruleId = rule.id;
          processResult = 1;
          processMessage = '规则配置成功';
          successCount++;
        }
      } catch (e: any) {
        processResult = 2;
        processMessage = e.message || '配置失败';
        failCount++;
      }

      let processResultText = '未知';
      const pr = processResult as number;
      if (pr === 1) processResultText = '成功';
      else if (pr === 2) processResultText = '失败';
      else if (pr === 3) processResultText = '越权拦截';
      else if (pr === 4) processResultText = '违规拦截';

      items.push({
        row_index: item.row_index,
        customer_level: item.customer_level,
        sensitivity_level: item.sensitivity_level,
        process_result: processResult,
        process_result_text: processResultText,
        process_message: processMessage,
        block_reason: blockReason || undefined,
        rule_code: ruleCode,
        rule_id: ruleId
      });
    }

    return {
      batch_id: uuidv4().replace(/-/g, ''),
      batch_name: data.batch_name,
      total_count: data.items.length,
      success_count: successCount,
      fail_count: failCount,
      unauthorized_count: unauthorizedCount,
      violation_count: violationCount,
      items
    };
  }

  async viewCustomerInfo(
    data: PrivacyViewRequest,
    operatorId?: string,
    operatorName?: string,
    operatorPosition?: number,
    operatorOrgId?: string,
    operatorOrgName?: string
  ): Promise<PrivacyViewResponse> {
    const preCheck = await this.preCheckPrivacy(
      data,
      operatorId,
      operatorName,
      operatorPosition,
      operatorOrgId,
      operatorOrgName
    );

    if (preCheck.blocked) {
      return {
        allowed: false,
        blocked: true,
        block_reason: preCheck.block_reason,
        desensitization_level: preCheck.desensitization_level as DesensitizationLevel,
        desensitization_level_text: preCheck.desensitization_level_text,
        sensitive_fields: [],
        time_limit: preCheck.time_limit,
        warnings: preCheck.warnings
      };
    }

    let customerInfo: any = null;

    if (data.customer_id) {
      customerInfo = await this.customerRepo.findById(data.customer_id);
      if (customerInfo) {
        customerInfo = customerInfo.get({ plain: true });
        customerInfo = this.applyDesensitization(customerInfo, preCheck.desensitization_level as DesensitizationLevel);
      }
    } else if (data.corporate_id) {
      customerInfo = await this.corporateRepo.findById(data.corporate_id);
      if (customerInfo) {
        customerInfo = customerInfo.get({ plain: true });
        customerInfo = this.applyDesensitization(customerInfo, preCheck.desensitization_level as DesensitizationLevel);
      }
    }

    return {
      allowed: true,
      blocked: false,
      desensitization_level: preCheck.desensitization_level as DesensitizationLevel,
      desensitization_level_text: preCheck.desensitization_level_text,
      sensitive_fields: preCheck.matched_rule_code ? [] : DEFAULT_SENSITIVE_FIELDS,
      time_limit: preCheck.time_limit,
      customer_info: customerInfo,
      warnings: preCheck.warnings
    };
  }

  async exportCustomerInfo(
    data: PrivacyExportRequest,
    operatorId?: string,
    operatorName?: string,
    operatorPosition?: number,
    operatorOrgId?: string,
    operatorOrgName?: string
  ): Promise<PrivacyExportResponse> {
    const complianceCheck = await this.checkCompliance(
      operatorId || '',
      2,
      (data.customer_ids?.[0] || data.corporate_ids?.[0]) || '',
      data.scene_type
    );

    if (complianceCheck.is_high_frequency || complianceCheck.is_malicious_export) {
      await this.logRepo.create({
        operator_id: operatorId,
        operator_name: operatorName,
        operator_position: operatorPosition || 1,
        operator_org_id: operatorOrgId,
        operator_org_name: operatorOrgName,
        scene_type: data.scene_type,
        operation_type: 2,
        sensitive_fields: data.export_fields.join(','),
        desensitization_level: 3,
        operation_purpose: data.operation_purpose,
        is_blocked: 1,
        block_type: complianceCheck.is_high_frequency ? 4 : 5,
        block_reason: complianceCheck.risk_alert_info,
        is_unauthorized: 0,
        is_violation: 1,
        operation_time: new Date(),
        view_count: data.customer_ids?.length || data.corporate_ids?.length || 0,
        is_risk_alert: 1,
        risk_alert_info: complianceCheck.risk_alert_info,
        request_params: JSON.stringify(data)
      } as any);

      return {
        allowed: false,
        blocked: true,
        block_reason: complianceCheck.risk_alert_info,
        desensitization_level: 3,
        sensitive_fields: [],
        export_count: 0,
        warnings: complianceCheck.risk_alert_info ? [complianceCheck.risk_alert_info] : []
      };
    }

    if (!data.operation_purpose || data.operation_purpose.trim().length < 10) {
      return {
        allowed: false,
        blocked: true,
        block_reason: '导出操作需要详细备案操作用途（至少10个字符）',
        desensitization_level: 3,
        sensitive_fields: [],
        export_count: 0
      };
    }

    const exportCount = (data.customer_ids?.length || 0) + (data.corporate_ids?.length || 0);

    await this.logRepo.create({
      operator_id: operatorId,
      operator_name: operatorName,
      operator_position: operatorPosition || 1,
      operator_org_id: operatorOrgId,
      operator_org_name: operatorOrgName,
      scene_type: data.scene_type,
      operation_type: 2,
      sensitive_fields: data.export_fields.join(','),
      desensitization_level: SCENE_DESENSITIZATION_MAP[data.scene_type],
      operation_purpose: data.operation_purpose,
      is_blocked: 0,
      block_type: 0,
      is_unauthorized: 0,
      is_violation: 0,
      operation_time: new Date(),
      view_count: exportCount,
      is_risk_alert: exportCount > 50 ? 1 : 0,
      risk_alert_info: exportCount > 50 ? `导出记录数${exportCount}条，已触发大额导出预警` : undefined,
      request_params: JSON.stringify(data)
    } as any);

    return {
      allowed: true,
      blocked: false,
      export_token: uuidv4().replace(/-/g, ''),
      desensitization_level: SCENE_DESENSITIZATION_MAP[data.scene_type],
      sensitive_fields: data.export_fields.filter(f => DEFAULT_SENSITIVE_FIELDS.includes(f)),
      export_count: exportCount,
      warnings: exportCount > 50 ? [`导出记录数${exportCount}条，已触发大额导出预警`] : []
    };
  }

  private applyDesensitization(data: any, level: DesensitizationLevel): any {
    if (level === 1) return data;

    const rules = DEFAULT_DESENSITIZATION_RULES[level] || [];
    const result = { ...data };

    for (const rule of rules) {
      if (result[rule.field] === undefined || result[rule.field] === null) continue;

      switch (rule.desensitization_type) {
        case 'mask':
          const value = String(result[rule.field]);
          const start = rule.mask_start || 0;
          const end = rule.mask_end || value.length;
          const maskChar = rule.mask_char || '*';
          if (value.length > start) {
            result[rule.field] = value.substring(0, start) +
              maskChar.repeat(Math.max(0, Math.min(end, value.length) - start)) +
              value.substring(Math.min(end, value.length));
          }
          break;
        case 'replace':
          result[rule.field] = rule.replace_value || '***';
          break;
        case 'hide':
          delete result[rule.field];
          break;
        case 'encrypt':
          result[rule.field] = `[已加密]${rule.encrypt_algorithm || 'AES'}`;
          break;
      }
    }

    return result;
  }

  private toRuleVO(rule: CustomerPrivacyRule): PrivacyRuleVO {
    const plain = rule.get({ plain: true }) as any;
    let desensitizationRules: DesensitizationRuleConfig[] = [];
    let retentionRules: RetentionRuleConfig = { retention_days: 30, need_archive: false, need_approval: false };

    if (plain.desensitization_rules) {
      try { desensitizationRules = JSON.parse(plain.desensitization_rules); } catch { /* ignore */ }
    }
    if (plain.retention_rules) {
      try { retentionRules = JSON.parse(plain.retention_rules); } catch { /* ignore */ }
    }

    return {
      id: plain.id,
      rule_code: plain.rule_code,
      rule_name: plain.rule_name,
      customer_level: plain.customer_level,
      customer_level_text: CUSTOMER_LEVEL_MAP[plain.customer_level] || '全部',
      sensitivity_level: plain.sensitivity_level,
      sensitivity_level_text: SENSITIVITY_LEVEL_MAP[plain.sensitivity_level],
      operator_position: plain.operator_position,
      operator_position_text: OPERATOR_POSITION_MAP[plain.operator_position] || '全部',
      scene_type: plain.scene_type,
      scene_type_text: PRIVACY_SCENE_MAP[plain.scene_type],
      desensitization_rules: desensitizationRules,
      retention_rules: retentionRules,
      time_limit: plain.time_limit,
      sensitive_fields: plain.sensitive_fields ? plain.sensitive_fields.split(',') : [],
      need_record: plain.need_record,
      need_operation_log: plain.need_operation_log,
      is_global: plain.is_global,
      status: plain.status,
      status_text: RULE_STATUS_MAP[plain.status],
      description: plain.description,
      org_id: plain.org_id,
      org_name: plain.organization?.name,
      creator_id: plain.creator_id,
      creator_name: plain.creator_name,
      effective_time: plain.effective_time ? dayjs(plain.effective_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      expire_time: plain.expire_time ? dayjs(plain.expire_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }

  private toLogVO(log: CustomerPrivacyLog): PrivacyLogVO {
    const plain = log.get({ plain: true }) as any;
    return {
      id: plain.id,
      log_no: plain.log_no,
      customer_id: plain.customer_id,
      corporate_id: plain.corporate_id,
      customer_no: plain.customer_no,
      customer_name: plain.customer_name,
      customer_type: plain.customer_type,
      customer_type_text: CUSTOMER_TYPE_MAP[plain.customer_type],
      customer_level: plain.customer_level,
      customer_level_text: CUSTOMER_LEVEL_MAP[plain.customer_level] || '普通',
      operator_id: plain.operator_id,
      operator_name: plain.operator_name,
      operator_position: plain.operator_position,
      operator_position_text: OPERATOR_POSITION_MAP[plain.operator_position],
      operator_org_id: plain.operator_org_id,
      operator_org_name: plain.operator_org_name,
      scene_type: plain.scene_type,
      scene_type_text: PRIVACY_SCENE_MAP[plain.scene_type],
      operation_type: plain.operation_type,
      operation_type_text: OPERATION_TYPE_MAP[plain.operation_type],
      sensitive_fields: plain.sensitive_fields ? plain.sensitive_fields.split(',') : [],
      desensitization_level: plain.desensitization_level,
      desensitization_level_text: DESENSITIZATION_LEVEL_MAP[plain.desensitization_level],
      operation_purpose: plain.operation_purpose,
      is_blocked: plain.is_blocked,
      block_type: plain.block_type,
      block_type_text: BLOCK_TYPE_MAP[plain.block_type],
      block_reason: plain.block_reason,
      is_unauthorized: plain.is_unauthorized,
      is_violation: plain.is_violation,
      operation_ip: plain.operation_ip,
      operation_device: plain.operation_device,
      operation_time: dayjs(plain.operation_time).format('YYYY-MM-DD HH:mm:ss'),
      operation_duration: plain.operation_duration,
      view_count: plain.view_count,
      is_risk_alert: plain.is_risk_alert,
      risk_alert_info: plain.risk_alert_info,
      rule_id: plain.rule_id,
      rule_code: plain.rule_code,
      request_params: plain.request_params,
      response_summary: plain.response_summary,
      remark: plain.remark,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
