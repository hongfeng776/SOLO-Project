import {
  CustomerProfileRepository,
  CustomerProfileLogRepository,
  CustomerProfileBatchRepository,
  CustomerProfileBatchItemRepository,
  OrganizationRepository,
  CustomerRepository
} from '../repositories';
import {
  CreateCustomerProfileRequest,
  UpdateCustomerProfileRequest,
  CustomerProfileQueryParams,
  PaginatedResult,
  CustomerProfileVO,
  CustomerProfileLogVO,
  CustomerProfilePreCheckResult,
  PreCheckFieldError,
  LevelJudgeResult,
  CustomerProfileTraceRequest,
  CustomerProfileTraceResponse,
  CustomerProfileTraceRecord,
  BatchImportRequest,
  BatchImportResponse,
  BatchImportResultItem,
  ProfileBatchQueryParams,
  BatchItemQueryParams,
  BatchVO,
  BatchItemVO,
  ReviewAbnormalRequest
} from '../types';
import {
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId, isValidPhone, isValidIdCard } from '../utils/validate';
import * as _ from 'lodash';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const PROFILE_REQUIRED_FIELDS = [
  { key: 'customer_name', label: '客户姓名' },
  { key: 'id_card_no', label: '证件号码' },
  { key: 'gender', label: '性别' },
  { key: 'mobile', label: '手机号' },
  { key: 'registered_address', label: '户籍地址' },
  { key: 'residential_address', label: '居住地址' }
];

const BATCH_BASE_REQUIRED_FIELDS = [
  { key: 'customer_name', label: '客户姓名' },
  { key: 'id_card_no', label: '证件号码' },
  { key: 'mobile', label: '手机号' }
];

const CUSTOMER_LEVEL_CONFIG: Record<number, {
  name: string;
  tags: string[];
  permissions: string[];
  rules: {
    min_assets?: number;
    min_transactions?: number;
    min_retention?: number;
  };
}> = {
  1: {
    name: '普通客户',
    tags: ['普通客户', '新客'],
    permissions: ['基础查询', '基础存取款', '基础转账'],
    rules: {}
  },
  2: {
    name: '优质客户',
    tags: ['优质客户', '活跃客户'],
    permissions: ['基础查询', '基础存取款', '基础转账', '理财产品购买', '小额贷款'],
    rules: { min_assets: 100000, min_transactions: 10, min_retention: 90 }
  },
  3: {
    name: '贵宾客户',
    tags: ['贵宾客户', '高净值客户', '专属服务'],
    permissions: ['基础查询', '基础存取款', '基础转账', '理财产品购买', '大额贷款', '私人银行服务', '专属理财顾问'],
    rules: { min_assets: 1000000, min_transactions: 30, min_retention: 365 }
  },
  4: {
    name: '潜力客户',
    tags: ['潜力客户', '成长型客户'],
    permissions: ['基础查询', '基础存取款', '基础转账', '理财产品推荐', '信用卡升级'],
    rules: { min_assets: 50000, min_retention: 180 }
  }
};

export class CustomerProfileService {
  private profileRepo: CustomerProfileRepository;
  private logRepo: CustomerProfileLogRepository;
  private batchRepo: CustomerProfileBatchRepository;
  private batchItemRepo: CustomerProfileBatchItemRepository;
  private orgRepo: OrganizationRepository;
  private customerRepo: CustomerRepository;

  constructor() {
    this.profileRepo = new CustomerProfileRepository();
    this.logRepo = new CustomerProfileLogRepository();
    this.batchRepo = new CustomerProfileBatchRepository();
    this.batchItemRepo = new CustomerProfileBatchItemRepository();
    this.orgRepo = new OrganizationRepository();
    this.customerRepo = new CustomerRepository();
  }

  async preCheckProfile(request: CreateCustomerProfileRequest): Promise<CustomerProfilePreCheckResult> {
    const errors: PreCheckFieldError[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    let blocked = false;
    let blockReason: string | undefined;
    let idVerifyStatus: 0 | 1 | 2 = 0;
    let faceVerifyStatus: 0 | 1 | 2 = 0;
    let mobileVerifyStatus: 0 | 1 | 2 = 0;
    let policeVerifyStatus: 0 | 1 | 2 = 0;

    for (const field of PROFILE_REQUIRED_FIELDS) {
      const value = (request as any)[field.key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        missingFields.push(field.key);
        errors.push({ field: field.key, message: `${field.label}不能为空`, code: 'REQUIRED' });
      }
    }

    if (request.id_card_no) {
      const idValid = isValidIdCard(request.id_card_no);
      if (!idValid) {
        idVerifyStatus = 2;
        errors.push({ field: 'id_card_no', message: '身份证号码格式不正确', code: 'ID_INVALID' });
      } else {
        idVerifyStatus = 1;
        if (request.customer_name) {
          const seed = this.getIdCardSeed(request.id_card_no);
          if (seed && seed.fakeProbability > 0.7) {
            policeVerifyStatus = 2;
            blocked = true;
            blockReason = '证件信息与公安备案信息不符，请核实后重新录入';
            errors.push({ field: 'id_card_no', message: '公安备案校验不通过：证件信息异常', code: 'POLICE_MISMATCH' });
          } else {
            policeVerifyStatus = 1;
          }
        }
      }

      const existing = await this.profileRepo.findByIdCardNo(request.id_card_no);
      if (existing) {
        blocked = true;
        blockReason = `该证件号码已存在建档记录，档案编号：${existing.profile_no}`;
        errors.push({ field: 'id_card_no', message: `该证件号码已建档（${existing.profile_no}），禁止重复建档`, code: 'DUPLICATE' });
      }
    }

    if (request.mobile) {
      if (!isValidPhone(request.mobile)) {
        mobileVerifyStatus = 2;
        errors.push({ field: 'mobile', message: '手机号码格式不正确', code: 'MOBILE_INVALID' });
      } else {
        mobileVerifyStatus = 1;
      }
    }

    if (request.id_card_no && request.gender) {
      const idGender = this.getGenderFromIdCard(request.id_card_no);
      if (idGender && idGender !== request.gender) {
        errors.push({ field: 'gender', message: '性别与身份证信息不一致', code: 'GENDER_MISMATCH' });
      }
    }

    if (request.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        errors.push({ field: 'email', message: '电子邮箱格式不正确', code: 'EMAIL_INVALID' });
      }
    }

    if (!request.occupation && Number(request.total_assets || 0) > 500000) {
      warnings.push('高资产客户建议补充职业信息');
    }
    if (!request.employer && Number(request.total_assets || 0) > 1000000) {
      warnings.push('高资产客户建议补充工作单位信息');
    }

    if (request.id_card_no && idVerifyStatus === 1) {
      faceVerifyStatus = Math.random() > 0.05 ? 1 : 2;
      if (faceVerifyStatus === 2) {
        errors.push({ field: 'face_verify', message: '人脸核验未通过，请重新进行人脸识别', code: 'FACE_MISMATCH' });
      }
    }

    const infoCompleteness = missingFields.length === 0 ? 1 : 0;

    return {
      passed: errors.length === 0,
      blocked,
      id_verify_status: idVerifyStatus,
      face_verify_status: faceVerifyStatus,
      mobile_verify_status: mobileVerifyStatus,
      police_verify_status: policeVerifyStatus,
      info_completeness: infoCompleteness,
      missing_fields: missingFields,
      errors,
      warnings,
      block_reason: blockReason
    };
  }

  judgeCustomerLevel(
    totalAssets: number,
    monthlyTransactionCount: number,
    retentionDays: number
  ): LevelJudgeResult {
    const assets = Number(totalAssets) || 0;
    const transactions = Number(monthlyTransactionCount) || 0;
    const retention = Number(retentionDays) || 0;
    let level: 1 | 2 | 3 | 4 = 1;
    const rules: string[] = [];

    if (
      assets >= (CUSTOMER_LEVEL_CONFIG[3].rules.min_assets || Infinity) &&
      transactions >= (CUSTOMER_LEVEL_CONFIG[3].rules.min_transactions || 0) &&
      retention >= (CUSTOMER_LEVEL_CONFIG[3].rules.min_retention || 0)
    ) {
      level = 3;
      rules.push(`资产规模≥100万元（${assets}元）`);
      rules.push(`月交易频次≥30笔（${transactions}笔）`);
      rules.push(`留存时长≥365天（${retention}天）`);
    } else if (
      assets >= (CUSTOMER_LEVEL_CONFIG[2].rules.min_assets || Infinity) &&
      transactions >= (CUSTOMER_LEVEL_CONFIG[2].rules.min_transactions || 0) &&
      retention >= (CUSTOMER_LEVEL_CONFIG[2].rules.min_retention || 0)
    ) {
      level = 2;
      rules.push(`资产规模≥10万元（${assets}元）`);
      rules.push(`月交易频次≥10笔（${transactions}笔）`);
      rules.push(`留存时长≥90天（${retention}天）`);
    } else if (
      assets >= (CUSTOMER_LEVEL_CONFIG[4].rules.min_assets || Infinity) &&
      retention >= (CUSTOMER_LEVEL_CONFIG[4].rules.min_retention || 0)
    ) {
      level = 4;
      rules.push(`资产规模≥5万元（${assets}元）`);
      rules.push(`留存时长≥180天（${retention}天）`);
    } else {
      level = 1;
      rules.push('未达到升级条件，默认为普通客户');
    }

    const config = CUSTOMER_LEVEL_CONFIG[level];
    return {
      customer_level: level,
      customer_level_text: config.name,
      customer_tags: config.tags,
      service_permissions: config.permissions,
      judge_factors: {
        total_assets: assets,
        monthly_transaction_count: transactions,
        retention_days: retention
      },
      judge_rules: rules
    };
  }

  async getProfileList(params: CustomerProfileQueryParams): Promise<PaginatedResult<CustomerProfileVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.profileRepo.buildQuery(queryParams);
    const include = [this.profileRepo.getOrganizationInclude()];

    const result = await this.profileRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: CustomerProfileVO[] = result.list.map(profile => this.convertToVO(profile));
    return { ...result, list };
  }

  async getProfileById(id: string): Promise<CustomerProfileVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的档案ID');
    }
    const profile = await this.profileRepo.findById(id, {
      include: [this.profileRepo.getOrganizationInclude()]
    });
    if (!profile) {
      throwNotFoundError('客户档案不存在');
    }
    return this.convertToVO(profile);
  }

  async createProfile(
    request: CreateCustomerProfileRequest,
    operator?: { id?: string; name?: string; org_id?: string; org_name?: string }
  ): Promise<CustomerProfileVO> {
    const preCheck = await this.preCheckProfile(request);
    if (preCheck.blocked && !request.skip_precheck) {
      throwValidationError(preCheck.block_reason || '前置校验未通过');
    }

    if (preCheck.errors.length > 0 && !request.skip_precheck) {
      const firstError = preCheck.errors[0];
      throwValidationError(`${firstError.field}: ${firstError.message}`);
    }

    if (request.org_id) {
      if (!isValidId(request.org_id)) {
        throwValidationError('无效的机构ID');
      }
      const org = await this.orgRepo.findById(request.org_id);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    const totalAssets = Number(request.total_assets) || 0;
    const transactionCount = Number(request.monthly_transaction_count) || 0;
    const retentionDays = Number(request.retention_days) || 0;
    const levelResult = this.judgeCustomerLevel(totalAssets, transactionCount, retentionDays);

    const profileNo = this.generateProfileNo();

    let birthDate: Date | undefined;
    if (request.id_card_no && request.id_card_no.length === 18) {
      const birthStr = request.id_card_no.substring(6, 14);
      birthDate = dayjs(birthStr, 'YYYYMMDD').isValid()
        ? dayjs(birthStr, 'YYYYMMDD').toDate()
        : undefined;
    }

    const isAbnormal = preCheck.police_verify_status === 2;
    const needComplete = preCheck.info_completeness === 0;

    const profile = await this.profileRepo.create({
      profile_no: profileNo,
      org_id: request.org_id,
      customer_name: request.customer_name,
      id_card_no: request.id_card_no,
      id_type: request.id_type || 1,
      gender: request.gender || this.getGenderFromIdCard(request.id_card_no) || 'U',
      birth_date: birthDate,
      nation: request.nation,
      mobile: request.mobile,
      email: request.email,
      registered_address: request.registered_address,
      residential_address: request.residential_address,
      occupation: request.occupation,
      employer: request.employer,
      position: request.position,
      education: request.education,
      marital_status: request.marital_status,
      total_assets: totalAssets,
      monthly_transaction_count: transactionCount,
      retention_days: retentionDays,
      customer_level: levelResult.customer_level,
      customer_tags: levelResult.customer_tags.join(','),
      service_permissions: JSON.stringify(levelResult.service_permissions),
      id_verify_status: preCheck.id_verify_status,
      face_verify_status: preCheck.face_verify_status,
      mobile_verify_status: preCheck.mobile_verify_status,
      police_verify_status: preCheck.police_verify_status,
      police_verify_reason: preCheck.police_verify_status === 2 ? '公安备案信息校验不通过' : undefined,
      info_completeness: preCheck.info_completeness,
      missing_fields: preCheck.missing_fields.length > 0 ? preCheck.missing_fields.join(',') : undefined,
      need_complete: needComplete ? 1 : 0,
      is_abnormal: isAbnormal ? 1 : 0,
      abnormal_reason: isAbnormal ? '公安备案信息不符，待人工复核' : undefined,
      status: isAbnormal ? 4 : 1,
      related_customer_id: request.related_customer_id,
      creator_id: operator?.id,
      creator_name: operator?.name,
      profile_time: new Date()
    });

    await this.logRepo.create({
      profile_id: profile.id,
      profile_no: profileNo,
      change_type: '1',
      change_type_name: '建档',
      after_content: JSON.stringify({
        customer_name: profile.customer_name,
        customer_level: levelResult.customer_level_text,
        tags: levelResult.customer_tags
      }),
      change_remark: isAbnormal ? '建档后自动锁定，待复核' : '建档成功',
      operator_id: operator?.id,
      operator_name: operator?.name,
      operator_org_id: operator?.org_id,
      operator_org_name: operator?.org_name,
      operate_time: new Date(),
      status: 1
    });

    if (request.related_customer_id) {
      try {
        const customer = await this.customerRepo.findById(request.related_customer_id);
        if (customer) {
          await this.customerRepo.update(request.related_customer_id, {
            customer_level: levelResult.customer_level as any,
            risk_tags: levelResult.customer_tags.join(',')
          });
        }
      } catch (_e) {
      }
    }

    return this.getProfileById(profile.id);
  }

  async updateProfile(
    id: string,
    request: UpdateCustomerProfileRequest,
    operator?: { id?: string; name?: string; org_id?: string; org_name?: string }
  ): Promise<CustomerProfileVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的档案ID');
    }

    const profile = await this.profileRepo.findById(id);
    if (!profile) {
      throwNotFoundError('客户档案不存在');
    }

    if (profile.status === 3) {
      throwValidationError('已销户档案不可修改');
    }

    if (profile.status === 4) {
      throwValidationError('锁定待复核档案不可修改，请先完成复核');
    }

    const originalData = profile.toJSON();
    const updateData: any = {};

    if (request.mobile !== undefined) {
      if (request.mobile && !isValidPhone(request.mobile)) {
        throwValidationError('手机号格式不正确');
      }
      if (request.mobile) {
        updateData.mobile_verify_status = 1;
      }
      updateData.mobile = request.mobile;
    }

    if (request.email !== undefined) {
      if (request.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(request.email)) {
          throwValidationError('电子邮箱格式不正确');
        }
      }
      updateData.email = request.email;
    }

    const updatableFields = [
      'org_id', 'customer_name', 'registered_address', 'residential_address',
      'occupation', 'employer', 'position', 'education', 'marital_status',
      'total_assets', 'monthly_transaction_count', 'retention_days'
    ];
    for (const field of updatableFields) {
      if ((request as any)[field] !== undefined) {
        updateData[field] = (request as any)[field];
      }
    }

    if (updateData.total_assets !== undefined || updateData.monthly_transaction_count !== undefined || updateData.retention_days !== undefined) {
      const assets = Number(updateData.total_assets ?? profile.total_assets);
      const transactions = Number(updateData.monthly_transaction_count ?? profile.monthly_transaction_count);
      const retention = Number(updateData.retention_days ?? profile.retention_days);
      const levelResult = this.judgeCustomerLevel(assets, transactions, retention);
      updateData.customer_level = levelResult.customer_level;
      updateData.customer_tags = levelResult.customer_tags.join(',');
      updateData.service_permissions = JSON.stringify(levelResult.service_permissions);
    }

    const changedFields: string[] = [];
    for (const key of Object.keys(updateData)) {
      if ((originalData as any)[key] !== (updateData as any)[key]) {
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
        change_type_name: '信息变更',
        before_content: JSON.stringify(_.pick(originalData, changedFields)),
        after_content: JSON.stringify(_.pick(updateData, changedFields)),
        change_remark: request.change_remark || `变更字段：${changedFields.join(', ')}`,
        operator_id: operator?.id,
        operator_name: operator?.name,
        operator_org_id: operator?.org_id,
        operator_org_name: operator?.org_name,
        operate_time: new Date(),
        status: 1
      });
    }

    return this.getProfileById(id);
  }

  async getProfileLogs(profileId: string): Promise<CustomerProfileLogVO[]> {
    if (!isValidId(profileId)) {
      throwValidationError('无效的档案ID');
    }
    const logs = await this.logRepo.findByProfileId(profileId);
    return logs.map(log => this.convertLogToVO(log));
  }

  async traceProfile(request: CustomerProfileTraceRequest): Promise<CustomerProfileTraceResponse> {
    if (!request.id_card_no) {
      throwValidationError('证件号码不能为空');
    }

    const profiles = await this.profileRepo.findAllByIdCardNo(request.id_card_no);
    const matched = profiles.length > 0;

    let hasDuplicate = false;
    let hasFakeInfo = false;
    const riskPrompts: string[] = [];
    let allowed = true;
    let blockReason: string | undefined;

    const activeProfiles = profiles.filter(p => p.status !== 3);
    if (activeProfiles.length > 1) {
      hasDuplicate = true;
      riskPrompts.push(`发现 ${activeProfiles.length} 条有效档案，存在重复建档风险`);
      allowed = false;
      blockReason = '存在重复建档记录，请核实后操作';
    }

    const abnormalProfiles = profiles.filter(p => p.is_abnormal === 1);
    if (abnormalProfiles.length > 0) {
      hasFakeInfo = true;
      riskPrompts.push(`发现 ${abnormalProfiles.length} 条异常档案，存在虚假信息风险`);
    }

    const closedCount = profiles.filter(p => p.status === 3).length;
    const abnormalCount = abnormalProfiles.length;
    const activeCount = activeProfiles.length;

    const historyRecords: CustomerProfileTraceRecord[] = profiles.map(p => {
      const levelConfig = CUSTOMER_LEVEL_CONFIG[p.customer_level];
      const statusMap: Record<number, string> = {
        0: '草稿', 1: '已建档', 2: '已变更', 3: '已销户', 4: '锁定待复核'
      };
      return {
        id: p.id,
        profile_no: p.profile_no,
        customer_name: p.customer_name,
        id_card_no: p.id_card_no,
        status: p.status,
        status_text: statusMap[p.status] || '未知',
        customer_level: p.customer_level,
        customer_level_text: levelConfig?.name || '未知',
        org_name: (p as any).organization?.name,
        operate_time: p.profile_time ? dayjs(p.profile_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
        operator_name: p.creator_name,
        remark: p.is_abnormal === 1 ? `异常：${p.abnormal_reason || '公安信息不符'}` : undefined
      };
    });

    const allLogIds = profiles.map(p => p.id);
    let allLogs: any[] = [];
    for (const pid of allLogIds) {
      const logs = await this.logRepo.findByProfileId(pid);
      allLogs = allLogs.concat(logs);
    }
    allLogs.sort((a, b) => new Date(b.operate_time || b.created_at).getTime() - new Date(a.operate_time || a.created_at).getTime());
    const changeLogs: CustomerProfileLogVO[] = allLogs.slice(0, 100).map(log => this.convertLogToVO(log));

    return {
      id_card_no: request.id_card_no,
      matched,
      total_profiles: profiles.length,
      total_active: activeCount,
      total_closed: closedCount,
      total_abnormal: abnormalCount,
      has_duplicate: hasDuplicate,
      has_fake_info: hasFakeInfo,
      history_records: historyRecords,
      change_logs: changeLogs,
      risk_prompts: riskPrompts,
      allowed,
      block_reason: blockReason
    };
  }

  async batchImportProfiles(
    request: BatchImportRequest,
    operator?: { id?: string; name?: string; org_id?: string; org_name?: string }
  ): Promise<BatchImportResponse> {
    const { items, org_id, batch_name, file_name, file_url } = request;

    if (!items || items.length === 0) {
      throwValidationError('导入数据不能为空');
    }

    const batchNo = this.generateBatchNo();
    const batch = await this.batchRepo.create({
      batch_no: batchNo,
      org_id: org_id || operator?.org_id,
      batch_name: batch_name || `批量建档-${dayjs().format('YYYYMMDDHHmmss')}`,
      total_count: items.length,
      success_count: 0,
      fail_count: 0,
      need_complete_count: 0,
      abnormal_count: 0,
      file_name,
      file_url,
      status: 1,
      creator_id: operator?.id,
      creator_name: operator?.name,
      import_time: new Date()
    });

    const resultItems: BatchImportResultItem[] = [];
    let successCount = 0;
    let failCount = 0;
    let needCompleteCount = 0;
    let abnormalCount = 0;

    for (const item of items) {
      const errors: PreCheckFieldError[] = [];
      const missingFields: string[] = [];
      const warnings: string[] = [];

      for (const field of BATCH_BASE_REQUIRED_FIELDS) {
        const value = (item as any)[field.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          missingFields.push(field.key);
          errors.push({ field: field.key, message: `${field.label}不能为空`, code: 'REQUIRED' });
        }
      }

      if (item.id_card_no && !isValidIdCard(item.id_card_no)) {
        errors.push({ field: 'id_card_no', message: '身份证号码格式不正确', code: 'ID_INVALID' });
      }

      if (item.mobile && !isValidPhone(item.mobile)) {
        errors.push({ field: 'mobile', message: '手机号码格式不正确', code: 'MOBILE_INVALID' });
      }

      const totalAssets = Number(item.total_assets) || 0;
      const extendedFields = [
        { key: 'registered_address', label: '户籍地址' },
        { key: 'residential_address', label: '居住地址' },
        { key: 'occupation', label: '职业' }
      ];
      const needExtraCheck = totalAssets >= 100000;
      for (const field of extendedFields) {
        const value = (item as any)[field.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          if (needExtraCheck) {
            missingFields.push(field.key);
            errors.push({ field: field.key, message: `${field.label}不能为空（资产≥10万客户必填）`, code: 'REQUIRED_EXTRA' });
          } else {
            missingFields.push(field.key);
          }
        }
      }

      let processResult: 0 | 1 | 2 | 3 | 4 = 1;
      let processMessage = '导入成功';
      let profileId: string | undefined;
      let profileNo: string | undefined;
      let isAbnormal = false;
      let abnormalReason: string | undefined;

      if (item.id_card_no) {
        const existing = await this.profileRepo.findByIdCardNo(item.id_card_no);
        if (existing) {
          processResult = 2;
          processMessage = `证件号码已建档（${existing.profile_no}）`;
          errors.push({ field: 'id_card_no', message: '证件号码已存在', code: 'DUPLICATE' });
        }
      }

      if (processResult === 1 && errors.length > 0 && missingFields.length > 3) {
        processResult = 2;
        processMessage = '基础信息缺失，导入失败';
      } else if (processResult === 1 && missingFields.length > 0) {
        processResult = 3;
        processMessage = '基础信息不完整，标记待完善';
      }

      if (item.id_card_no && processResult !== 2) {
        const seed = this.getIdCardSeed(item.id_card_no);
        if (seed && seed.fakeProbability > 0.7) {
          processResult = 4;
          processMessage = '公安备案校验异常，锁定待复核';
          isAbnormal = true;
          abnormalReason = '证件信息与公安备案信息不符';
        }
      }

      if (processResult === 1 || processResult === 3 || processResult === 4) {
        try {
          const transactionCount = Number(item.monthly_transaction_count) || 0;
          const retentionDays = Number(item.retention_days) || 0;
          const levelResult = this.judgeCustomerLevel(totalAssets, transactionCount, retentionDays);

          profileNo = this.generateProfileNo();

          let birthDate: Date | undefined;
          if (item.id_card_no && item.id_card_no.length === 18) {
            const birthStr = item.id_card_no.substring(6, 14);
            birthDate = dayjs(birthStr, 'YYYYMMDD').isValid()
              ? dayjs(birthStr, 'YYYYMMDD').toDate()
              : undefined;
          }

          const createdProfile = await this.profileRepo.create({
            profile_no: profileNo,
            org_id: org_id || operator?.org_id,
            customer_name: item.customer_name || '',
            id_card_no: item.id_card_no || '',
            id_type: item.id_type || 1,
            gender: item.gender || this.getGenderFromIdCard(item.id_card_no || '') || 'U',
            birth_date: birthDate,
            mobile: item.mobile || '',
            registered_address: item.registered_address || '',
            residential_address: item.residential_address || '',
            occupation: item.occupation,
            employer: item.employer,
            total_assets: totalAssets,
            monthly_transaction_count: transactionCount,
            retention_days: retentionDays,
            customer_level: levelResult.customer_level,
            customer_tags: levelResult.customer_tags.join(','),
            service_permissions: JSON.stringify(levelResult.service_permissions),
            id_verify_status: item.id_card_no && isValidIdCard(item.id_card_no) ? 1 : 0,
            face_verify_status: 0,
            mobile_verify_status: item.mobile && isValidPhone(item.mobile) ? 1 : 0,
            police_verify_status: isAbnormal ? 2 : 0,
            police_verify_reason: abnormalReason,
            info_completeness: missingFields.length === 0 ? 1 : 0,
            missing_fields: missingFields.length > 0 ? missingFields.join(',') : undefined,
            need_complete: processResult === 3 ? 1 : 0,
            is_abnormal: processResult === 4 ? 1 : 0,
            abnormal_reason: abnormalReason,
            status: processResult === 4 ? 4 : 1,
            creator_id: operator?.id,
            creator_name: operator?.name,
            profile_time: new Date()
          });
          profileId = createdProfile.id;

          await this.logRepo.create({
            profile_id: profileId,
            profile_no: profileNo,
            change_type: '1',
            change_type_name: '批量建档',
            after_content: JSON.stringify({
              customer_name: item.customer_name,
              customer_level: levelResult.customer_level_text,
              from_batch: batchNo
            }),
            change_remark: `批量导入，批次号：${batchNo}`,
            operator_id: operator?.id,
            operator_name: operator?.name,
            operator_org_id: operator?.org_id,
            operator_org_name: operator?.org_name,
            operate_time: new Date(),
            status: 1
          });

          if (processResult === 1) successCount++;
          if (processResult === 3) needCompleteCount++;
          if (processResult === 4) abnormalCount++;
        } catch (e: any) {
          processResult = 2;
          processMessage = `建档异常：${e.message || '未知错误'}`;
        }
      }

      if (processResult === 2) {
        failCount++;
      }

      await this.batchItemRepo.create({
        batch_id: batch.id,
        row_index: item.row_index,
        profile_id: profileId,
        customer_name: item.customer_name,
        id_card_no: item.id_card_no,
        id_type: item.id_type,
        gender: item.gender,
        mobile: item.mobile,
        registered_address: item.registered_address,
        residential_address: item.residential_address,
        occupation: item.occupation,
        employer: item.employer,
        total_assets: totalAssets,
        monthly_transaction_count: Number(item.monthly_transaction_count) || 0,
        retention_days: Number(item.retention_days) || 0,
        process_result: processResult,
        process_message: processMessage,
        error_fields: errors.length > 0 ? JSON.stringify(errors) : undefined,
        missing_fields: missingFields.length > 0 ? JSON.stringify(missingFields) : undefined,
        status: 1
      });

      const processResultMap: Record<number, string> = {
        0: '未处理', 1: '成功', 2: '失败', 3: '待完善', 4: '待复核'
      };

      resultItems.push({
        row_index: item.row_index,
        profile_id: profileId,
        profile_no: profileNo,
        customer_name: item.customer_name,
        id_card_no: item.id_card_no,
        process_result: processResult,
        process_result_text: processResultMap[processResult],
        process_message: processMessage,
        errors: errors.length > 0 ? errors : undefined,
        missing_fields: missingFields.length > 0 ? missingFields : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        is_abnormal: isAbnormal,
        abnormal_reason: abnormalReason
      });
    }

    let batchStatus: 0 | 1 | 2 | 3 | 4 = 2;
    if (failCount === items.length) {
      batchStatus = 3;
    } else if (successCount === items.length) {
      batchStatus = 2;
    } else {
      batchStatus = 3;
    }

    await this.batchRepo.update(batch.id, {
      success_count: successCount,
      fail_count: failCount,
      need_complete_count: needCompleteCount,
      abnormal_count: abnormalCount,
      status: batchStatus,
      finish_time: new Date()
    });

    const batchStatusMap: Record<number, string> = {
      0: '待处理', 1: '处理中', 2: '已完成', 3: '部分完成', 4: '已取消'
    };

    return {
      batch_id: batch.id,
      batch_no: batchNo,
      batch_name: batch.batch_name,
      total_count: items.length,
      success_count: successCount,
      fail_count: failCount,
      need_complete_count: needCompleteCount,
      abnormal_count: abnormalCount,
      status: batchStatus,
      status_text: batchStatusMap[batchStatus],
      items: resultItems
    };
  }

  async getBatchList(params: ProfileBatchQueryParams): Promise<PaginatedResult<BatchVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.batchRepo.buildQuery(queryParams);
    const include = [this.batchRepo.getOrganizationInclude()];

    const result = await this.batchRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: BatchVO[] = result.list.map(batch => this.convertBatchToVO(batch));
    return { ...result, list };
  }

  async getBatchItemList(params: BatchItemQueryParams): Promise<PaginatedResult<BatchItemVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.batchItemRepo.buildQuery(queryParams);

    const result = await this.batchItemRepo.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'row_index', sortOrder: 'ASC' }
    );

    const list: BatchItemVO[] = result.list.map(item => this.convertBatchItemToVO(item));
    return { ...result, list };
  }

  async reviewAbnormalProfile(
    request: ReviewAbnormalRequest,
    operator?: { id?: string; name?: string; org_id?: string; org_name?: string }
  ): Promise<CustomerProfileVO> {
    const { profile_id, passed, review_remark } = request;

    if (!isValidId(profile_id)) {
      throwValidationError('无效的档案ID');
    }
    if (!review_remark || !review_remark.trim()) {
      throwValidationError('复核意见不能为空');
    }

    const profile = await this.profileRepo.findById(profile_id);
    if (!profile) {
      throwNotFoundError('客户档案不存在');
    }

    if (profile.status !== 4 && profile.is_abnormal !== 1) {
      throwValidationError('该档案不是异常待复核状态');
    }

    if (passed) {
      await this.profileRepo.update(profile_id, {
        status: 1,
        is_abnormal: 0,
        abnormal_reason: undefined,
        police_verify_status: 1,
        police_verify_reason: undefined
      });

      await this.logRepo.create({
        profile_id,
        profile_no: profile.profile_no,
        change_type: '7',
        change_type_name: '复核通过',
        change_remark: `复核意见：${review_remark}`,
        reviewer_id: operator?.id,
        reviewer_name: operator?.name,
        review_time: new Date(),
        operator_id: operator?.id,
        operator_name: operator?.name,
        operator_org_id: operator?.org_id,
        operator_org_name: operator?.org_name,
        operate_time: new Date(),
        status: 1
      });
    } else {
      await this.profileRepo.update(profile_id, {
        status: 3,
        is_abnormal: 1,
        abnormal_reason: `复核不通过：${review_remark}`
      });

      await this.logRepo.create({
        profile_id,
        profile_no: profile.profile_no,
        change_type: '3',
        change_type_name: '销户',
        change_remark: `复核不通过，销户处理：${review_remark}`,
        reviewer_id: operator?.id,
        reviewer_name: operator?.name,
        review_time: new Date(),
        operator_id: operator?.id,
        operator_name: operator?.name,
        operator_org_id: operator?.org_id,
        operator_org_name: operator?.org_name,
        operate_time: new Date(),
        status: 1
      });
    }

    return this.getProfileById(profile_id);
  }

  private generateProfileNo(): string {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CP${timestamp}${random}`;
  }

  private generateBatchNo(): string {
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BATCH${timestamp}${random}`;
  }

  private getGenderFromIdCard(idCard: string): string | undefined {
    if (!idCard || idCard.length < 17) return undefined;
    const genderCode = parseInt(idCard.charAt(16));
    return isNaN(genderCode) ? undefined : (genderCode % 2 === 1 ? 'M' : 'F');
  }

  private getIdCardSeed(idCard: string): { fakeProbability: number } | null {
    if (!idCard || idCard.length < 6) return null;
    const areaCode = idCard.substring(0, 6);
    const validAreaCodes = ['110101', '110102', '110105', '310101', '310104', '440103', '440305'];
    if (!validAreaCodes.includes(areaCode) && !areaCode.startsWith('1') && !areaCode.startsWith('3') && !areaCode.startsWith('4')) {
      return { fakeProbability: 0.85 };
    }
    if (idCard === '123456789012345678' || idCard === '000000000000000000') {
      return { fakeProbability: 0.99 };
    }
    return { fakeProbability: 0.1 };
  }

  private convertToVO(profile: any): CustomerProfileVO {
    const data = profile.toJSON ? profile.toJSON() : profile;
    const vo: CustomerProfileVO = _.omit(data, []) as CustomerProfileVO;

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    const idTypeMap: Record<number, string> = { 1: '身份证', 2: '护照', 3: '军官证', 4: '港澳台居民证' };
    vo.id_type_text = data.id_type ? idTypeMap[data.id_type] : undefined;

    const genderMap: Record<string, string> = { M: '男', F: '女', U: '未知' };
    vo.gender_text = data.gender ? genderMap[data.gender] : undefined;

    const levelConfig = CUSTOMER_LEVEL_CONFIG[data.customer_level];
    vo.customer_level_text = levelConfig?.name || '未知';
    vo.customer_tag_list = data.customer_tags ? data.customer_tags.split(',') : [];
    try {
      vo.service_permission_list = data.service_permissions ? JSON.parse(data.service_permissions) : [];
    } catch {
      vo.service_permission_list = [];
    }

    const verifyMap: Record<number, string> = { 0: '未校验', 1: '通过', 2: '未通过' };
    vo.id_verify_status_text = verifyMap[data.id_verify_status] || '未知';
    vo.face_verify_status_text = verifyMap[data.face_verify_status] || '未知';
    vo.mobile_verify_status_text = verifyMap[data.mobile_verify_status] || '未知';
    vo.police_verify_status_text = data.police_verify_status === 0 ? '未校验' : data.police_verify_status === 1 ? '一致' : '不一致';

    vo.missing_field_list = data.missing_fields ? data.missing_fields.split(',') : [];

    const statusMap: Record<number, string> = {
      0: '草稿', 1: '已建档', 2: '已变更', 3: '已销户', 4: '锁定待复核'
    };
    vo.status_text = statusMap[data.status] || '未知';

    vo.birth_date = data.birth_date ? dayjs(data.birth_date).format('YYYY-MM-DD') : undefined;
    vo.profile_time = data.profile_time ? dayjs(data.profile_time).format('YYYY-MM-DD HH:mm:ss') : undefined;

    return vo;
  }

  private convertLogToVO(log: any): CustomerProfileLogVO {
    const data = log.toJSON ? log.toJSON() : log;
    const vo: CustomerProfileLogVO = _.omit(data, []) as CustomerProfileLogVO;

    const changeTypeMap: Record<string, string> = {
      '1': '建档', '2': '信息变更', '3': '等级变更', '4': '销户',
      '5': '锁定', '6': '解锁', '7': '复核通过'
    };
    vo.change_type_name = changeTypeMap[data.change_type] || data.change_type_name || '未知';

    vo.operate_time = data.operate_time ? dayjs(data.operate_time).format('YYYY-MM-DD HH:mm:ss') : undefined;
    vo.review_time = data.review_time ? dayjs(data.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined;

    return vo;
  }

  private convertBatchToVO(batch: any): BatchVO {
    const data = batch.toJSON ? batch.toJSON() : batch;
    const vo: BatchVO = _.omit(data, []) as BatchVO;

    if (data.organization) {
      vo.org_name = data.organization.name;
    }

    const statusMap: Record<number, string> = {
      0: '待处理', 1: '处理中', 2: '已完成', 3: '部分完成', 4: '已取消'
    };
    vo.status_text = statusMap[data.status] || '未知';

    vo.import_time = data.import_time ? dayjs(data.import_time).format('YYYY-MM-DD HH:mm:ss') : undefined;
    vo.finish_time = data.finish_time ? dayjs(data.finish_time).format('YYYY-MM-DD HH:mm:ss') : undefined;

    return vo;
  }

  private convertBatchItemToVO(item: any): BatchItemVO {
    const data = item.toJSON ? item.toJSON() : item;
    const vo: BatchItemVO = _.omit(data, []) as BatchItemVO;

    const resultMap: Record<number, string> = {
      0: '未处理', 1: '成功', 2: '失败', 3: '待完善', 4: '待复核'
    };
    vo.process_result_text = resultMap[data.process_result] || '未知';

    try {
      vo.error_field_list = data.error_fields ? JSON.parse(data.error_fields) : [];
    } catch {
      vo.error_field_list = [];
    }
    try {
      vo.missing_field_list = data.missing_fields ? JSON.parse(data.missing_fields) : [];
    } catch {
      vo.missing_field_list = [];
    }

    return vo;
  }
}
