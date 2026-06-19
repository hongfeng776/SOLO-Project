import { CorporateProfileRepository, CorporateProfileLogRepository, CorporateProfileBatchRepository, CorporateProfileBatchItemRepository } from '../repositories/CorporateProfileRepository';
import {
  CorpPreCheckResult,
  CorpPreCheckFieldError,
  CorpTypeAdaptResult,
  CreateCorporateProfileRequest,
  UpdateCorporateProfileRequest,
  CorporateProfileQueryParams,
  CorporateProfileVO,
  CorporateProfileLogVO,
  CorporateTraceRequest,
  CorporateTraceResponse,
  CorporateTraceRecord,
  CorpBatchUpdateRequest,
  CorpBatchUpdateResponse,
  CorpBatchUpdateResultItem,
  CorpBatchQueryParams,
  CorpBatchItemQueryParams,
  CorpBatchVO,
  CorpBatchItemVO,
  CorpReviewAbnormalRequest,
  CorporateCustomerType,
  BusinessStatus,
  CorpServiceLevel,
  CorpRiskLevel,
  CorpBatchUpdateType
} from '../types';
import { PaginatedResult } from '../types/common';
import { CorporateProfile, CorporateProfileLog, CorporateProfileBatch, CorporateProfileBatchItem } from '../models';
import dayjs from 'dayjs';

const CUSTOMER_TYPE_MAP: Record<number, string> = { 1: '小微企业', 2: '中型企业', 3: '大型企业', 4: '集团客户' };
const BUSINESS_STATUS_MAP: Record<number, string> = { 1: '正常', 2: '停业', 3: '注销', 4: '吊销', 5: '迁出', 6: '异常' };
const SERVICE_LEVEL_MAP: Record<number, string> = { 1: '基础', 2: '标准', 3: '优先', 4: '专属' };
const RISK_LEVEL_MAP: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险', 4: '极高风险' };
const VERIFY_STATUS_MAP: Record<number, string> = { 0: '未校验', 1: '通过', 2: '不通过' };
const PROFILE_STATUS_MAP: Record<number, string> = { 0: '草稿', 1: '已建档', 2: '已变更', 3: '已销户', 4: '锁定待复核' };
const CHANGE_TYPE_MAP: Record<string, string> = { '1': '建档', '2': '信息变更', '3': '类型变更', '4': '资质更新', '5': '风控变更', '6': '销户', '7': '锁定', '8': '解锁', '9': '复核通过' };
const BATCH_STATUS_MAP: Record<number, string> = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '部分完成', 4: '已取消' };
const PROCESS_RESULT_MAP: Record<number, string> = { 0: '未处理', 1: '成功', 2: '失败', 3: '待完善', 4: '待复核' };
const UPDATE_TYPE_MAP: Record<number, string> = { 1: '经营信息', 2: '资质信息', 3: '风控等级', 4: '综合更新' };
const ID_TYPE_MAP: Record<number, string> = { 1: '身份证', 2: '护照' };

export class CorporateProfileService {
  private profileRepo: CorporateProfileRepository;
  private logRepo: CorporateProfileLogRepository;
  private batchRepo: CorporateProfileBatchRepository;
  private batchItemRepo: CorporateProfileBatchItemRepository;

  constructor() {
    this.profileRepo = new CorporateProfileRepository();
    this.logRepo = new CorporateProfileLogRepository();
    this.batchRepo = new CorporateProfileBatchRepository();
    this.batchItemRepo = new CorporateProfileBatchItemRepository();
  }

  async preCheckProfile(data: CreateCorporateProfileRequest): Promise<CorpPreCheckResult> {
    const errors: CorpPreCheckFieldError[] = [];
    const warnings: string[] = [];
    let blocked = false;
    let blockReason = '';
    let filingVerify: number = 0;
    let legalVerify: number = 0;
    let qualificationVerify: number = 0;

    if (!data.credit_code || data.credit_code.trim().length !== 18) {
      errors.push({ field: 'credit_code', message: '统一社会信用代码格式不正确，必须为18位', code: 'INVALID_CREDIT_CODE' });
    } else {
      const creditCodePattern = /^[0-9A-Z]{18}$/;
      if (!creditCodePattern.test(data.credit_code)) {
        errors.push({ field: 'credit_code', message: '统一社会信用代码仅包含大写字母和数字', code: 'INVALID_CREDIT_CODE' });
      }
    }

    if (!data.legal_representative || data.legal_representative.trim().length < 2) {
      errors.push({ field: 'legal_representative', message: '法人姓名不能为空且不少于2个字符', code: 'INVALID_LEGAL_NAME' });
    }

    if (!data.legal_id_card_no || data.legal_id_card_no.trim().length < 15) {
      errors.push({ field: 'legal_id_card_no', message: '法人证件号码格式不正确', code: 'INVALID_LEGAL_ID' });
    }

    if (!data.enterprise_name || data.enterprise_name.trim().length < 4) {
      errors.push({ field: 'enterprise_name', message: '企业名称不能为空且不少于4个字符', code: 'INVALID_ENTERPRISE_NAME' });
    }

    if (!data.registered_address || data.registered_address.trim().length < 5) {
      errors.push({ field: 'registered_address', message: '注册地址不能为空', code: 'INVALID_ADDRESS' });
    }

    if (data.credit_code && data.credit_code.trim().length === 18) {
      const existing = await this.profileRepo.findByCreditCode(data.credit_code);
      if (existing) {
        blocked = true;
        blockReason = '该统一社会信用代码已存在有效对公客户档案，禁止重复建档';
        errors.push({ field: 'credit_code', message: '信用代码已存在有效档案', code: 'DUPLICATE_CREDIT_CODE' });
      }

      filingVerify = this.simulateFilingVerify(data.credit_code);
      if (filingVerify === 2) {
        blocked = true;
        blockReason = '企业工商备案信息校验不通过，禁止建档';
        errors.push({ field: 'credit_code', message: '企业工商备案信息不一致', code: 'FILING_MISMATCH' });
      }
    }

    if (data.legal_id_card_no && data.legal_representative) {
      legalVerify = this.simulateLegalVerify(data.legal_id_card_no, data.legal_representative);
      if (legalVerify === 2) {
        errors.push({ field: 'legal_id_card_no', message: '法人实名信息校验不通过', code: 'LEGAL_VERIFY_FAIL' });
      }
    }

    if (data.license_no) {
      qualificationVerify = this.simulateQualificationVerify(data);
      if (qualificationVerify === 2) {
        if (data.license_permanent !== 1) {
          const validTo = data.license_valid_to ? dayjs(data.license_valid_to) : null;
          if (validTo && validTo.isBefore(dayjs())) {
            blocked = true;
            blockReason = '企业经营资质已失效，禁止建档';
            errors.push({ field: 'license_valid_to', message: '营业执照已过期', code: 'LICENSE_EXPIRED' });
          } else {
            warnings.push('经营资质校验异常，请核实后提交');
          }
        }
      }
    } else {
      qualificationVerify = 0;
      warnings.push('未提供营业执照编号，经营资质未校验');
    }

    if (data.industry_type && data.registered_capital !== undefined) {
      const capital = Number(data.registered_capital);
      if (data.industry_type.includes('金融') && capital < 1000) {
        warnings.push('金融行业注册资本低于1000万元，请确认行业分类与资本匹配');
      }
      if (data.industry_type.includes('建筑') && capital < 500) {
        warnings.push('建筑行业注册资本低于500万元，请确认行业分类与资本匹配');
      }
    }

    if (data.business_status !== undefined && data.business_status !== 1) {
      const statusMap: Record<number, string> = { 2: '停业', 3: '注销', 4: '吊销', 5: '迁出', 6: '异常' };
      if ([3, 4, 6].includes(data.business_status)) {
        blocked = true;
        blockReason = `企业经营状态为"${statusMap[data.business_status]}"，禁止建档`;
        errors.push({ field: 'business_status', message: `企业${statusMap[data.business_status]}，不允许建档`, code: 'INVALID_BUSINESS_STATUS' });
      } else {
        warnings.push(`企业经营状态为"${statusMap[data.business_status]}"，请确认是否继续`);
      }
    }

    const requiredFields = ['enterprise_name', 'credit_code', 'legal_representative', 'legal_id_card_no', 'registered_address'];
    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!(data as any)[field]) {
        missingFields.push(field);
      }
    }

    return {
      passed: errors.length === 0 && !blocked,
      blocked,
      filing_verify_status: filingVerify as any,
      legal_verify_status: legalVerify as any,
      qualification_verify_status: qualificationVerify as any,
      info_completeness: missingFields.length === 0 ? 1 : 0,
      missing_fields: missingFields,
      errors,
      warnings,
      block_reason: blocked ? blockReason : undefined
    };
  }

  private simulateFilingVerify(creditCode: string): number {
    if (creditCode.startsWith('91')) return 1;
    if (creditCode.startsWith('00')) return 2;
    return 1;
  }

  private simulateLegalVerify(idCard: string, name: string): number {
    if (!idCard || idCard.length < 15) return 2;
    if (name.length < 2) return 2;
    return 1;
  }

  private simulateQualificationVerify(data: CreateCorporateProfileRequest): number {
    if (!data.license_no) return 0;
    if (data.license_permanent === 1) return 1;
    if (data.license_valid_to) {
      const validTo = dayjs(data.license_valid_to);
      if (validTo.isBefore(dayjs())) return 2;
    }
    return 1;
  }

  adaptCustomerType(
    registeredCapital: number,
    businessYears: number,
    businessStatus: BusinessStatus,
    industryType: string
  ): CorpTypeAdaptResult {
    let customerType: CorporateCustomerType = 1;
    let creditLimit = 100;
    let serviceLevel: CorpServiceLevel = 1;
    let riskLevel: CorpRiskLevel = 1;
    const rules: string[] = [];

    if (registeredCapital >= 50000 && businessYears >= 10) {
      customerType = 4;
      creditLimit = 50000;
      serviceLevel = 4;
      riskLevel = 1;
      rules.push('注册资本≥5亿+经营≥10年→集团客户');
    } else if (registeredCapital >= 5000 && businessYears >= 5) {
      customerType = 3;
      creditLimit = 10000;
      serviceLevel = 3;
      riskLevel = 1;
      rules.push('注册资本≥5000万+经营≥5年→大型企业');
    } else if (registeredCapital >= 500 && businessYears >= 2) {
      customerType = 2;
      creditLimit = 2000;
      serviceLevel = 2;
      riskLevel = 2;
      rules.push('注册资本≥500万+经营≥2年→中型企业');
    } else {
      customerType = 1;
      creditLimit = 500;
      serviceLevel = 1;
      riskLevel = 2;
      rules.push('默认→小微企业');
    }

    if (businessStatus === 2) {
      riskLevel = 3;
      rules.push('停业企业→风控升级为高风险');
    } else if (businessStatus === 6) {
      riskLevel = 4;
      rules.push('经营异常→风控升级为极高风险');
    }

    if (industryType && (industryType.includes('金融') || industryType.includes('房地产'))) {
      if (riskLevel < 3) riskLevel = (riskLevel + 1) as CorpRiskLevel;
      rules.push('金融/房地产行业→风控等级+1');
    }

    const riskTags: string[] = [];
    if (riskLevel >= 3) riskTags.push('高风险客户');
    if (businessStatus === 6) riskTags.push('经营异常');
    if (customerType === 1 && registeredCapital < 100) riskTags.push('小微关注');

    const servicePermissions: string[] = [];
    if (serviceLevel >= 2) servicePermissions.push('专属客户经理');
    if (serviceLevel >= 3) servicePermissions.push('优先审批通道');
    if (serviceLevel >= 4) servicePermissions.push('定制化融资方案');

    return {
      customer_type: customerType,
      customer_type_text: CUSTOMER_TYPE_MAP[customerType],
      credit_limit: creditLimit,
      service_level: serviceLevel,
      service_level_text: SERVICE_LEVEL_MAP[serviceLevel],
      risk_level: riskLevel,
      risk_level_text: RISK_LEVEL_MAP[riskLevel],
      risk_tags: riskTags,
      service_permissions: servicePermissions,
      adapt_factors: {
        registered_capital: registeredCapital,
        business_years: businessYears,
        business_status: businessStatus,
        industry_type: industryType
      },
      adapt_rules: rules
    };
  }

  async createProfile(data: CreateCorporateProfileRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CorporateProfile> {
    if (!data.skip_precheck) {
      const precheck = await this.preCheckProfile(data);
      if (precheck.blocked) {
        throw new Error(precheck.block_reason || '前置校验未通过，禁止建档');
      }
    }

    const existing = await this.profileRepo.findByCreditCode(data.credit_code);
    if (existing) {
      throw new Error('该信用代码已存在有效对公客户档案');
    }

    const capital = Number(data.registered_capital ?? 0);
    const years = Number(data.business_years ?? 0);
    const bStatus = (data.business_status ?? 1) as BusinessStatus;
    const typeResult = this.adaptCustomerType(capital, years, bStatus, data.industry_type || '');

    const totalCount = await this.profileRepo.count({});
    const profileNo = `CP${dayjs().format('YYYYMMDD')}${String(totalCount + 1).padStart(6, '0')}`;

    const profileData: any = {
      profile_no: profileNo,
      org_id: data.org_id || orgId,
      enterprise_name: data.enterprise_name,
      credit_code: data.credit_code,
      enterprise_short_name: data.enterprise_short_name,
      legal_representative: data.legal_representative,
      legal_id_card_no: data.legal_id_card_no,
      legal_id_type: data.legal_id_type || 1,
      legal_mobile: data.legal_mobile,
      industry_type: data.industry_type,
      industry_code: data.industry_code,
      registered_capital: capital,
      registered_address: data.registered_address,
      business_address: data.business_address,
      establish_date: data.establish_date ? new Date(data.establish_date) : undefined,
      business_years: years,
      business_status: bStatus,
      business_scope: data.business_scope,
      license_no: data.license_no,
      license_valid_from: data.license_valid_from ? new Date(data.license_valid_from) : undefined,
      license_valid_to: data.license_valid_to ? new Date(data.license_valid_to) : undefined,
      license_permanent: data.license_permanent || 0,
      customer_type: typeResult.customer_type,
      credit_limit: typeResult.credit_limit,
      service_level: typeResult.service_level,
      risk_level: typeResult.risk_level,
      risk_tags: typeResult.risk_tags.join(','),
      service_permissions: JSON.stringify(typeResult.service_permissions),
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      filing_verify_status: 1,
      legal_verify_status: 1,
      qualification_verify_status: 1,
      info_completeness: 1,
      need_complete: 0,
      is_abnormal: 0,
      is_dishonest: 0,
      status: 1,
      creator_id: operatorId,
      creator_name: operatorName,
      profile_time: new Date(),
      related_customer_id: data.related_customer_id
    };

    const profile = await this.profileRepo.create(profileData);

    await this.logRepo.create({
      profile_id: profile.id,
      profile_no: profileNo,
      change_type: '1',
      change_type_name: CHANGE_TYPE_MAP['1'],
      after_content: JSON.stringify(profileData),
      change_remark: '对公客户建档',
      operator_id: operatorId,
      operator_name: operatorName,
      operator_org_id: orgId,
      operate_time: new Date(),
      status: 1
    });

    return profile;
  }

  async updateProfile(id: string, data: UpdateCorporateProfileRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CorporateProfile> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new Error('对公客户信息不存在');
    if (profile.status === 3) throw new Error('已销户档案不允许更新');
    if (profile.status === 4) throw new Error('锁定待复核档案不允许更新');

    const originalData = profile.get({ plain: true });

    if (data.business_status !== undefined && [3, 4, 6].includes(data.business_status)) {
      throw new Error('经营状态为注销/吊销/异常时不允许信息更新，请先处理经营异常');
    }

    const updateData: any = { ...data };
    let needRecalc = false;

    if (data.registered_capital !== undefined || data.business_status !== undefined || data.industry_type !== undefined) {
      needRecalc = true;
    }

    if (needRecalc) {
      const capital = Number(data.registered_capital ?? profile.registered_capital);
      const bStatus = (data.business_status ?? profile.business_status) as BusinessStatus;
      const typeResult = this.adaptCustomerType(capital, profile.business_years, bStatus, (data.industry_type ?? profile.industry_type) || '');

      if (typeResult.customer_type !== profile.customer_type) {
        updateData.customer_type = typeResult.customer_type;
        await this.logRepo.create({
          profile_id: id,
          profile_no: profile.profile_no,
          change_type: '3',
          change_type_name: CHANGE_TYPE_MAP['3'],
          before_content: JSON.stringify({ customer_type: profile.customer_type }),
          after_content: JSON.stringify({ customer_type: typeResult.customer_type }),
          change_remark: `客户类型变更：${CUSTOMER_TYPE_MAP[profile.customer_type]}→${typeResult.customer_type_text}`,
          operator_id: operatorId,
          operator_name: operatorName,
          operator_org_id: orgId,
          operate_time: new Date(),
          status: 1
        });
      }

      updateData.credit_limit = typeResult.credit_limit;
      updateData.service_level = typeResult.service_level;
      updateData.risk_level = typeResult.risk_level;
      updateData.risk_tags = typeResult.risk_tags.join(',');
      updateData.service_permissions = JSON.stringify(typeResult.service_permissions);
    }

    const changedFields: string[] = [];
    for (const key of Object.keys(updateData)) {
      if ((originalData as any)[key] !== (updateData as any)[key] && key !== 'change_remark') {
        changedFields.push(key);
      }
    }

    if (changedFields.length > 0) {
      updateData.status = 2;
      await this.profileRepo.update(id, updateData);

      await this.logRepo.create({
        profile_id: id,
        profile_no: profile.profile_no,
        change_type: '2',
        change_type_name: CHANGE_TYPE_MAP['2'],
        before_content: JSON.stringify(changedFields.reduce((acc: any, f) => { acc[f] = (originalData as any)[f]; return acc; }, {})),
        after_content: JSON.stringify(changedFields.reduce((acc: any, f) => { acc[f] = (updateData as any)[f]; return acc; }, {})),
        change_remark: data.change_remark || `更新字段：${changedFields.join(', ')}`,
        operator_id: operatorId,
        operator_name: operatorName,
        operator_org_id: orgId,
        operate_time: new Date(),
        status: 1
      });
    }

    return (await this.profileRepo.findById(id))!;
  }

  async traceProfile(request: CorporateTraceRequest): Promise<CorporateTraceResponse> {
    const { credit_code, enterprise_name } = request;

    const allProfiles = await this.profileRepo.findAllByCreditCode(credit_code);
    const changeLogs = await this.logRepo.findByCreditCode(credit_code);

    const totalProfiles = allProfiles.length;
    const totalActive = allProfiles.filter(p => p.status === 1 || p.status === 2).length;
    const totalClosed = allProfiles.filter(p => p.status === 3).length;
    const totalAbnormal = allProfiles.filter(p => p.status === 4 || p.is_abnormal === 1).length;
    const hasDuplicate = totalActive > 1;
    const hasDishonest = allProfiles.some(p => p.is_dishonest === 1);

    let hasTampering = false;
    const riskPrompts: string[] = [];
    let blocked = false;
    let blockReason = '';

    if (hasDuplicate) {
      riskPrompts.push(`该信用代码存在${totalActive}条有效档案，存在重复建档风险`);
      blocked = true;
      blockReason = '检测到重复建档，请先核查处理';
    }

    if (hasDishonest) {
      riskPrompts.push('该企业为失信企业，禁止信息更新操作');
      blocked = true;
      blockReason = blockReason || '失信企业，已拦截';
    }

    if (totalAbnormal > 0) {
      riskPrompts.push(`存在${totalAbnormal}条异常锁定档案，请及时复核`);
    }

    const logMap = new Map<string, CorporateProfileLog[]>();
    for (const log of changeLogs) {
      const arr = logMap.get(log.profile_id) || [];
      arr.push(log);
      logMap.set(log.profile_id, arr);
    }

    for (const [profileId, logs] of logMap) {
      const sorted = logs.sort((a, b) => {
        const ta = a.operate_time ? new Date(a.operate_time).getTime() : 0;
        const tb = b.operate_time ? new Date(b.operate_time).getTime() : 0;
        return tb - ta;
      });
      for (const log of sorted) {
        if (log.before_content && log.after_content) {
          try {
            const before = JSON.parse(log.before_content);
            const after = JSON.parse(log.after_content);
            for (const key of Object.keys(after)) {
              if (['credit_code', 'enterprise_name', 'legal_representative', 'legal_id_card_no'].includes(key)) {
                if (before[key] && after[key] && before[key] !== after[key]) {
                  hasTampering = true;
                  riskPrompts.push(`检测到关键信息变更：${key}发生变更，可能存在信息篡改`);
                }
              }
            }
          } catch (_e) { /* ignore */ }
        }
      }
    }

    if (hasTampering) {
      blocked = true;
      blockReason = blockReason || '检测到关键信息篡改风险，已拦截';
    }

    const historyRecords: CorporateTraceRecord[] = allProfiles.map(p => {
      const profileLogs = logMap.get(p.id) || [];
      const latestLog = profileLogs[0];
      return {
        id: p.id,
        profile_no: p.profile_no,
        enterprise_name: p.enterprise_name,
        credit_code: p.credit_code,
        status: p.status,
        status_text: PROFILE_STATUS_MAP[p.status] || '未知',
        customer_type: p.customer_type,
        customer_type_text: CUSTOMER_TYPE_MAP[p.customer_type] || '未知',
        change_type: latestLog?.change_type,
        change_type_name: latestLog?.change_type_name,
        operate_time: latestLog?.operate_time ? dayjs(latestLog.operate_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
        operator_name: latestLog?.operator_name,
        org_name: latestLog?.operator_org_name,
        remark: latestLog?.change_remark
      };
    });

    const logVOs: CorporateProfileLogVO[] = changeLogs.map(l => ({
      id: l.id,
      profile_id: l.profile_id,
      profile_no: l.profile_no,
      change_type: l.change_type,
      change_type_name: l.change_type_name || CHANGE_TYPE_MAP[l.change_type],
      before_content: l.before_content,
      after_content: l.after_content,
      change_remark: l.change_remark,
      operator_id: l.operator_id,
      operator_name: l.operator_name,
      operator_org_id: l.operator_org_id,
      operator_org_name: l.operator_org_name,
      operate_time: l.operate_time ? dayjs(l.operate_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      reviewer_id: l.reviewer_id,
      reviewer_name: l.reviewer_name,
      review_time: l.review_time ? dayjs(l.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      status: l.status,
      created_at: (l as any).createdAt ? dayjs((l as any).createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: (l as any).updatedAt ? dayjs((l as any).updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    }));

    return {
      credit_code,
      matched: totalProfiles > 0,
      total_profiles: totalProfiles,
      total_active: totalActive,
      total_closed: totalClosed,
      total_abnormal: totalAbnormal,
      has_duplicate: hasDuplicate,
      has_dishonest: hasDishonest,
      has_tampering: hasTampering,
      history_records: historyRecords,
      change_logs: logVOs,
      risk_prompts: riskPrompts,
      allowed: !blocked,
      block_reason: blocked ? blockReason : undefined
    };
  }

  async batchUpdateProfiles(request: CorpBatchUpdateRequest, operatorId?: string, operatorName?: string, orgId?: string): Promise<CorpBatchUpdateResponse> {
    const totalCount = await this.batchRepo.count({});
    const batchNo = `CB${dayjs().format('YYYYMMDD')}${String(totalCount + 1).padStart(6, '0')}`;

    const batch = await this.batchRepo.create({
      batch_no: batchNo,
      org_id: request.org_id || orgId,
      batch_name: request.batch_name,
      update_type: request.update_type,
      total_count: request.items.length,
      success_count: 0,
      fail_count: 0,
      need_complete_count: 0,
      review_count: 0,
      file_url: request.file_url,
      file_name: request.file_name,
      status: 1,
      creator_id: operatorId,
      creator_name: operatorName,
      import_time: new Date()
    });

    const resultItems: CorpBatchUpdateResultItem[] = [];
    let successCount = 0;
    let failCount = 0;
    let needCompleteCount = 0;
    let reviewCount = 0;

    for (const item of request.items) {
      const errors: CorpPreCheckFieldError[] = [];
      const warnings: string[] = [];
      let processResult: number = 1;
      let processMessage = '';
      let needReview = false;
      let reviewReason = '';
      const missingFieldsList: string[] = [];

      if (!item.credit_code || item.credit_code.trim().length !== 18) {
        errors.push({ field: 'credit_code', message: '统一社会信用代码格式不正确', code: 'INVALID_CREDIT_CODE' });
      }

      if (!item.enterprise_name) {
        errors.push({ field: 'enterprise_name', message: '企业名称不能为空', code: 'REQUIRED' });
      }

      let profile: CorporateProfile | null = null;
      if (item.credit_code && item.credit_code.trim().length === 18) {
        profile = await this.profileRepo.findByCreditCode(item.credit_code);
        if (!profile) {
          errors.push({ field: 'credit_code', message: '未找到对应对公客户档案', code: 'NOT_FOUND' });
        }
      }

      if (profile) {
        if (profile.is_dishonest === 1) {
          errors.push({ field: 'credit_code', message: '失信企业禁止信息更新', code: 'DISHONEST_BLOCKED' });
          processResult = 2;
          processMessage = '失信企业禁止信息更新';
        }

        if (profile.status === 4) {
          errors.push({ field: 'credit_code', message: '档案锁定待复核，不允许更新', code: 'LOCKED' });
          processResult = 2;
          processMessage = '档案锁定待复核';
        }

        if (item.business_status !== undefined && [3, 4, 6].includes(item.business_status)) {
          needReview = true;
          reviewReason = `经营状态变更为"${BUSINESS_STATUS_MAP[item.business_status]}"，需人工复核`;
        }

        if (profile.business_status === 6 && item.business_status === undefined) {
          needReview = true;
          reviewReason = '经营异常企业信息更新，需人工复核';
        }

        const updateData: any = {};
        if (item.business_status !== undefined) updateData.business_status = item.business_status;
        if (item.industry_type !== undefined) updateData.industry_type = item.industry_type;
        if (item.registered_capital !== undefined) updateData.registered_capital = item.registered_capital;
        if (item.risk_level !== undefined) updateData.risk_level = item.risk_level;

        if (item.registered_capital !== undefined && item.registered_capital >= 5000 && (!item.industry_type && !profile.industry_type)) {
          missingFieldsList.push('industry_type');
          warnings.push('大型企业(注册资本≥5000万)缺少行业分类信息');
        }

        if (errors.length === 0 && processResult !== 2) {
          if (needReview) {
            processResult = 4;
            processMessage = reviewReason;

            if (Object.keys(updateData).length > 0) {
              await this.profileRepo.update(profile.id, { ...updateData, status: 4, is_abnormal: 1, abnormal_reason: reviewReason });

              await this.logRepo.create({
                profile_id: profile.id,
                profile_no: profile.profile_no,
                change_type: '7',
                change_type_name: CHANGE_TYPE_MAP['7'],
                before_content: JSON.stringify({}),
                after_content: JSON.stringify(updateData),
                change_remark: reviewReason,
                operator_id: operatorId,
                operator_name: operatorName,
                operator_org_id: orgId,
                operate_time: new Date(),
                status: 1
              });
            }
          } else if (missingFieldsList.length > 0) {
            processResult = 3;
            processMessage = `缺失字段：${missingFieldsList.join(', ')}`;
            if (Object.keys(updateData).length > 0) {
              await this.profileRepo.update(profile.id, { ...updateData, need_complete: 1, missing_fields: missingFieldsList.join(',') });
            }
          } else {
            if (Object.keys(updateData).length > 0) {
              updateData.status = 2;
              await this.profileRepo.update(profile.id, updateData);

              await this.logRepo.create({
                profile_id: profile.id,
                profile_no: profile.profile_no,
                change_type: '4',
                change_type_name: CHANGE_TYPE_MAP['4'],
                before_content: JSON.stringify({}),
                after_content: JSON.stringify(updateData),
                change_remark: '批量更新经营/资质/风控信息',
                operator_id: operatorId,
                operator_name: operatorName,
                operator_org_id: orgId,
                operate_time: new Date(),
                status: 1
              });
            }
          }
        }
      } else if (errors.length > 0 && processResult !== 2) {
        processResult = 2;
        processMessage = errors.map(e => e.message).join('; ');
      }

      if (processResult === 1) successCount++;
      else if (processResult === 2) failCount++;
      else if (processResult === 3) needCompleteCount++;
      else if (processResult === 4) reviewCount++;

      resultItems.push({
        row_index: item.row_index,
        profile_id: profile?.id,
        profile_no: profile?.profile_no,
        enterprise_name: item.enterprise_name,
        credit_code: item.credit_code,
        process_result: processResult as any,
        process_result_text: PROCESS_RESULT_MAP[processResult],
        process_message: processMessage,
        errors: errors.length > 0 ? errors : undefined,
        missing_fields: missingFieldsList.length > 0 ? missingFieldsList : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        need_review: needReview || undefined,
        review_reason: reviewReason || undefined
      });

      await this.batchItemRepo.create({
        batch_id: batch.id,
        row_index: item.row_index,
        profile_id: profile?.id,
        enterprise_name: item.enterprise_name,
        credit_code: item.credit_code,
        business_status: item.business_status,
        industry_type: item.industry_type,
        registered_capital: item.registered_capital,
        risk_level: item.risk_level,
        process_result: processResult,
        process_message: processMessage,
        error_fields: errors.length > 0 ? JSON.stringify(errors) : undefined,
        missing_fields: missingFieldsList.length > 0 ? JSON.stringify(missingFieldsList) : undefined,
        status: 1
      });
    }

    await this.batchRepo.update(batch.id, {
      success_count: successCount,
      fail_count: failCount,
      need_complete_count: needCompleteCount,
      review_count: reviewCount,
      status: failCount === 0 && needCompleteCount === 0 && reviewCount === 0 ? 2 : 3,
      finish_time: new Date()
    });

    return {
      batch_id: batch.id,
      batch_no: batchNo,
      batch_name: request.batch_name,
      update_type: request.update_type as CorpBatchUpdateType,
      total_count: request.items.length,
      success_count: successCount,
      fail_count: failCount,
      need_complete_count: needCompleteCount,
      review_count: reviewCount,
      status: batch.status,
      status_text: BATCH_STATUS_MAP[batch.status],
      items: resultItems
    };
  }

  async reviewAbnormalProfile(request: CorpReviewAbnormalRequest, reviewerId?: string, reviewerName?: string): Promise<CorporateProfile> {
    const profile = await this.profileRepo.findById(request.profile_id);
    if (!profile) throw new Error('对公客户信息不存在');
    if (profile.status !== 4) throw new Error('档案非锁定待复核状态');
    if (profile.is_abnormal !== 1) throw new Error('档案非异常状态');

    if (request.passed) {
      await this.profileRepo.update(profile.id, {
        status: 1,
        is_abnormal: 0,
        abnormal_reason: null
      });

      await this.logRepo.create({
        profile_id: profile.id,
        profile_no: profile.profile_no,
        change_type: '9',
        change_type_name: CHANGE_TYPE_MAP['9'],
        before_content: JSON.stringify({ status: 4, is_abnormal: 1 }),
        after_content: JSON.stringify({ status: 1, is_abnormal: 0 }),
        change_remark: request.review_remark || '复核通过，解锁档案',
        operator_id: reviewerId,
        operator_name: reviewerName,
        operate_time: new Date(),
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        review_time: new Date(),
        status: 1
      });
    } else {
      await this.profileRepo.update(profile.id, {
        status: 3,
        is_abnormal: 0,
        abnormal_reason: null
      });

      await this.logRepo.create({
        profile_id: profile.id,
        profile_no: profile.profile_no,
        change_type: '6',
        change_type_name: CHANGE_TYPE_MAP['6'],
        before_content: JSON.stringify({ status: 4 }),
        after_content: JSON.stringify({ status: 3 }),
        change_remark: request.review_remark || '复核不通过，执行销户',
        operator_id: reviewerId,
        operator_name: reviewerName,
        operate_time: new Date(),
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        review_time: new Date(),
        status: 1
      });
    }

    return (await this.profileRepo.findById(request.profile_id))!;
  }

  async getProfileList(params: CorporateProfileQueryParams): Promise<PaginatedResult<CorporateProfileVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.profileRepo.buildQuery(queryParams);
    const include = [this.profileRepo.getOrganizationInclude()];

    const result = await this.profileRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list = result.list.map((r: any) => this.toVO(r));

    return { list, total: result.total, page, pageSize };
  }

  async getProfileDetail(id: string): Promise<CorporateProfileVO> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new Error('对公客户信息不存在');
    return this.toVO(profile);
  }

  async getProfileLogs(profileId: string): Promise<CorporateProfileLogVO[]> {
    const logs = await this.logRepo.findByProfileId(profileId);
    return logs.map(l => ({
      id: l.id,
      profile_id: l.profile_id,
      profile_no: l.profile_no,
      change_type: l.change_type,
      change_type_name: l.change_type_name || CHANGE_TYPE_MAP[l.change_type],
      before_content: l.before_content,
      after_content: l.after_content,
      change_remark: l.change_remark,
      operator_id: l.operator_id,
      operator_name: l.operator_name,
      operator_org_id: l.operator_org_id,
      operator_org_name: l.operator_org_name,
      operate_time: l.operate_time ? dayjs(l.operate_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      reviewer_id: l.reviewer_id,
      reviewer_name: l.reviewer_name,
      review_time: l.review_time ? dayjs(l.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      status: l.status,
      created_at: (l as any).createdAt ? dayjs((l as any).createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: (l as any).updatedAt ? dayjs((l as any).updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    }));
  }

  async getBatchList(params: CorpBatchQueryParams): Promise<PaginatedResult<CorpBatchVO>> {
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

  async getBatchItems(params: CorpBatchItemQueryParams): Promise<PaginatedResult<CorpBatchItemVO>> {
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

  private toVO(profile: CorporateProfile): CorporateProfileVO {
    const plain = profile.get({ plain: true }) as any;
    return {
      id: plain.id,
      profile_no: plain.profile_no,
      org_id: plain.org_id,
      org_name: plain.organization?.name,
      enterprise_name: plain.enterprise_name,
      credit_code: plain.credit_code,
      enterprise_short_name: plain.enterprise_short_name,
      legal_representative: plain.legal_representative,
      legal_id_card_no: plain.legal_id_card_no,
      legal_id_type: plain.legal_id_type,
      legal_id_type_text: ID_TYPE_MAP[plain.legal_id_type],
      legal_mobile: plain.legal_mobile,
      industry_type: plain.industry_type,
      industry_code: plain.industry_code,
      registered_capital: plain.registered_capital,
      registered_address: plain.registered_address,
      business_address: plain.business_address,
      establish_date: plain.establish_date ? dayjs(plain.establish_date).format('YYYY-MM-DD') : undefined,
      business_years: plain.business_years,
      business_status: plain.business_status,
      business_status_text: BUSINESS_STATUS_MAP[plain.business_status],
      business_scope: plain.business_scope,
      license_no: plain.license_no,
      license_valid_from: plain.license_valid_from ? dayjs(plain.license_valid_from).format('YYYY-MM-DD') : undefined,
      license_valid_to: plain.license_valid_to ? dayjs(plain.license_valid_to).format('YYYY-MM-DD') : undefined,
      license_permanent: plain.license_permanent,
      customer_type: plain.customer_type,
      customer_type_text: CUSTOMER_TYPE_MAP[plain.customer_type],
      credit_limit: plain.credit_limit,
      service_level: plain.service_level,
      service_level_text: SERVICE_LEVEL_MAP[plain.service_level],
      risk_level: plain.risk_level,
      risk_level_text: RISK_LEVEL_MAP[plain.risk_level],
      risk_tags: plain.risk_tags,
      risk_tag_list: plain.risk_tags ? plain.risk_tags.split(',').filter(Boolean) : [],
      contact_person: plain.contact_person,
      contact_phone: plain.contact_phone,
      contact_email: plain.contact_email,
      filing_verify_status: plain.filing_verify_status,
      filing_verify_status_text: VERIFY_STATUS_MAP[plain.filing_verify_status],
      legal_verify_status: plain.legal_verify_status,
      legal_verify_status_text: VERIFY_STATUS_MAP[plain.legal_verify_status],
      qualification_verify_status: plain.qualification_verify_status,
      qualification_verify_status_text: VERIFY_STATUS_MAP[plain.qualification_verify_status],
      verify_fail_reason: plain.verify_fail_reason,
      is_dishonest: plain.is_dishonest,
      dishonest_info: plain.dishonest_info,
      info_completeness: plain.info_completeness,
      missing_fields: plain.missing_fields,
      missing_field_list: plain.missing_fields ? plain.missing_fields.split(',').filter(Boolean) : [],
      need_complete: plain.need_complete,
      is_abnormal: plain.is_abnormal,
      abnormal_reason: plain.abnormal_reason,
      service_permissions: plain.service_permissions,
      service_permission_list: plain.service_permissions ? JSON.parse(plain.service_permissions) : [],
      status: plain.status,
      status_text: PROFILE_STATUS_MAP[plain.status],
      related_customer_id: plain.related_customer_id,
      creator_id: plain.creator_id,
      creator_name: plain.creator_name,
      profile_time: plain.profile_time ? dayjs(plain.profile_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }

  private toBatchVO(batch: CorporateProfileBatch): CorpBatchVO {
    const plain = batch.get({ plain: true }) as any;
    return {
      id: plain.id,
      batch_no: plain.batch_no,
      org_id: plain.org_id,
      org_name: plain.organization?.name,
      batch_name: plain.batch_name,
      update_type: plain.update_type,
      update_type_text: UPDATE_TYPE_MAP[plain.update_type],
      total_count: plain.total_count,
      success_count: plain.success_count,
      fail_count: plain.fail_count,
      need_complete_count: plain.need_complete_count,
      review_count: plain.review_count,
      file_url: plain.file_url,
      file_name: plain.file_name,
      status: plain.status,
      status_text: BATCH_STATUS_MAP[plain.status],
      fail_reason: plain.fail_reason,
      creator_id: plain.creator_id,
      creator_name: plain.creator_name,
      import_time: plain.import_time ? dayjs(plain.import_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      finish_time: plain.finish_time ? dayjs(plain.finish_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }

  private toBatchItemVO(item: CorporateProfileBatchItem): CorpBatchItemVO {
    const plain = item.get({ plain: true }) as any;
    let errorFieldList: CorpPreCheckFieldError[] | undefined;
    if (plain.error_fields) {
      try { errorFieldList = JSON.parse(plain.error_fields); } catch (_e) { /* ignore */ }
    }
    let missingFieldList: string[] | undefined;
    if (plain.missing_fields) {
      try { missingFieldList = JSON.parse(plain.missing_fields); } catch (_e) { /* ignore */ }
    }
    return {
      id: plain.id,
      batch_id: plain.batch_id,
      row_index: plain.row_index,
      profile_id: plain.profile_id,
      enterprise_name: plain.enterprise_name,
      credit_code: plain.credit_code,
      business_status: plain.business_status,
      industry_type: plain.industry_type,
      registered_capital: plain.registered_capital,
      risk_level: plain.risk_level,
      process_result: plain.process_result,
      process_result_text: PROCESS_RESULT_MAP[plain.process_result],
      process_message: plain.process_message,
      error_field_list: errorFieldList,
      missing_field_list: missingFieldList,
      created_at: plain.createdAt ? dayjs(plain.createdAt).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: plain.updatedAt ? dayjs(plain.updatedAt).format('YYYY-MM-DD HH:mm:ss') : undefined
    } as any;
  }
}
