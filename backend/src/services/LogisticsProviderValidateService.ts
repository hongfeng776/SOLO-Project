import { daos } from '../dao';
import { Op } from 'sequelize';

export const PROVIDER_CODE_REGEX = /^WL\d{6}$/;
export const CREDIT_CODE_REGEX = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
export const BUSINESS_LICENSE_REGEX = /^(?:(?![IOZSV])[\dA-Z]){2}\d{6}(?:(?![IOZSV])[\dA-Z]){10}$/;
export const PHONE_REGEX = /^1[3-9]\d{9}$/;
export const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
export const EMAIL_REGEX = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;

export interface ValidationResult {
  valid: boolean;
  message?: string;
  errorCode?: string;
  suggestions?: string[];
}

export interface ProviderPreCheckResult {
  passed: boolean;
  enterprise: { valid: boolean; issues: string[] };
  coverage: { valid: boolean; issues: string[]; branchCount: number; cityCount: number };
  timeliness: { valid: boolean; issues: string[] };
  permissions: { valid: boolean; issues: string[] };
  codeUnique: { valid: boolean; issues: string[] };
  blockingIssues: string[];
  warningIssues: string[];
}

export interface FeeComplianceCheckResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
}

class LogisticsProviderValidateService {
  private readonly providerDao = daos.logisticsProviderDao;
  private readonly qualificationDao = daos.logisticsProviderQualificationDao;
  private readonly branchDao = daos.logisticsBranchNetworkDao;
  private readonly feeStandardDao = daos.logisticsFeeStandardDao;
  private readonly MIN_COVERAGE_CITIES = 5;
  private readonly MIN_BRANCH_COUNT = 10;

  validateProviderCode(code: string): ValidationResult {
    if (!code) {
      return { valid: false, message: '服务商编码不能为空', errorCode: 'CODE_EMPTY' };
    }
    if (!PROVIDER_CODE_REGEX.test(code)) {
      return {
        valid: false,
        message: '服务商编码格式错误，应为WL+6位数字（例如：WL000001）',
        errorCode: 'CODE_FORMAT',
        suggestions: ['格式：WL + 6位数字', '示例：WL000001、WL123456'],
      };
    }
    return { valid: true };
  }

  validateCreditCode(code: string): ValidationResult {
    if (!code) {
      return { valid: false, message: '统一社会信用代码不能为空', errorCode: 'CREDIT_EMPTY' };
    }
    if (!CREDIT_CODE_REGEX.test(code)) {
      return {
        valid: false,
        message: '统一社会信用代码格式不正确（应为18位大写字母和数字组合）',
        errorCode: 'CREDIT_FORMAT',
      };
    }
    return { valid: true };
  }

  validateBusinessLicenseNo(no: string): ValidationResult {
    if (!no) {
      return { valid: false, message: '营业执照注册号不能为空', errorCode: 'LICENSE_EMPTY' };
    }
    if (!BUSINESS_LICENSE_REGEX.test(no)) {
      return {
        valid: false,
        message: '营业执照注册号格式不正确',
        errorCode: 'LICENSE_FORMAT',
      };
    }
    return { valid: true };
  }

  validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return { valid: true };
    }
    if (!PHONE_REGEX.test(phone)) {
      return { valid: false, message: '联系电话格式不正确', errorCode: 'PHONE_FORMAT' };
    }
    return { valid: true };
  }

  validateEmail(email: string): ValidationResult {
    if (!email) {
      return { valid: true };
    }
    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, message: '邮箱格式不正确', errorCode: 'EMAIL_FORMAT' };
    }
    return { valid: true };
  }

  validateIdCard(idCard: string): ValidationResult {
    if (!idCard) {
      return { valid: true };
    }
    if (!ID_CARD_REGEX.test(idCard)) {
      return { valid: false, message: '法人身份证号格式不正确', errorCode: 'IDCARD_FORMAT' };
    }
    return { valid: true };
  }

  validateDateRange(from?: string, to?: string): ValidationResult {
    if (!from || !to) {
      return { valid: true };
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return { valid: false, message: '日期格式不正确', errorCode: 'DATE_FORMAT' };
    }
    if (fromDate >= toDate) {
      return { valid: false, message: '有效期起始日期必须早于终止日期', errorCode: 'DATE_RANGE' };
    }
    return { valid: true };
  }

  isExpired(expireDate?: Date): boolean {
    if (!expireDate) return false;
    return new Date(expireDate) < new Date();
  }

  isExpiringSoon(expireDate?: Date, days: number = 30): boolean {
    if (!expireDate) return false;
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return new Date(expireDate) <= threshold && new Date(expireDate) >= now;
  }

  async checkProviderCodeUnique(code: string, excludeId?: number): Promise<ValidationResult> {
    const where: any = { provider_code: code };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await this.providerDao.findOne({ where });
    if (existing) {
      return {
        valid: false,
        message: `服务商编码 ${code} 已被使用，请更换其他编码`,
        errorCode: 'CODE_DUPLICATE',
      };
    }
    return { valid: true };
  }

  async checkCreditCodeUnique(creditCode: string, excludeId?: number): Promise<ValidationResult> {
    if (!creditCode) return { valid: true };
    const where: any = { credit_code: creditCode };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await this.providerDao.findOne({ where });
    if (existing) {
      return {
        valid: false,
        message: `统一社会信用代码 ${creditCode} 已存在，服务商：${existing.provider_name}`,
        errorCode: 'CREDIT_DUPLICATE',
      };
    }
    return { valid: true };
  }

  async checkBusinessLicenseUnique(licenseNo: string, excludeId?: number): Promise<ValidationResult> {
    if (!licenseNo) return { valid: true };
    const where: any = { business_license_no: licenseNo };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await this.providerDao.findOne({ where });
    if (existing) {
      return {
        valid: false,
        message: `营业执照注册号 ${licenseNo} 已存在，服务商：${existing.provider_name}`,
        errorCode: 'LICENSE_DUPLICATE',
      };
    }
    return { valid: true };
  }

  async checkDuplicateProvider(creditCode?: string, licenseNo?: string, providerName?: string, excludeId?: number): Promise<{ valid: boolean; duplicates: string[] }> {
    const duplicates: string[] = [];

    const creditCheck = await this.checkCreditCodeUnique(creditCode || '', excludeId);
    if (!creditCheck.valid) duplicates.push(creditCheck.message!);

    const licenseCheck = await this.checkBusinessLicenseUnique(licenseNo || '', excludeId);
    if (!licenseCheck.valid) duplicates.push(licenseCheck.message!);

    if (providerName) {
      const where: any = { provider_name: providerName };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const existing = await this.providerDao.findOne({ where });
      if (existing) {
        duplicates.push(`服务商名称 ${providerName} 已存在`);
      }
    }

    return { valid: duplicates.length === 0, duplicates };
  }

  async validateEnterpriseQualification(providerId: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const provider = await this.providerDao.findById(providerId);
    if (!provider) {
      return { valid: false, issues: ['服务商不存在'] };
    }

    if (!provider.credit_code && !provider.business_license_no) {
      issues.push('缺少统一社会信用代码或营业执照注册号');
    }
    if (!provider.legal_person) {
      issues.push('缺少企业法人信息');
    }
    if (!provider.license_valid_from || !provider.license_valid_to) {
      issues.push('缺少营业执照有效期');
    }
    if (provider.license_valid_to && this.isExpired(provider.license_valid_to as any)) {
      issues.push('营业执照已过期，请及时更新');
    }
    if (provider.license_valid_to && this.isExpiringSoon(provider.license_valid_to as any)) {
      issues.push('营业执照即将过期（30天内），请尽快续期');
    }
    if (provider.road_transport_valid_to && this.isExpired(provider.road_transport_valid_to as any)) {
      issues.push('道路运输经营许可证已过期');
    }

    const qualifications = await this.qualificationDao.findAll({ where: { provider_id: providerId } });
    const qualTypes = new Set(qualifications.map(q => q.qualification_type));
    if (!qualTypes.has('business_license')) {
      issues.push('缺少营业执照资质材料');
    }
    if (!qualTypes.has('road_transport')) {
      issues.push('缺少道路运输经营许可证');
    }

    for (const q of qualifications) {
      if (q.status === 2 || (q.expire_date && this.isExpired(q.expire_date))) {
        issues.push(`资质 [${q.qualification_name || q.qualification_type}] 已过期`);
      }
      if (q.status === 0 || q.status === 4) {
        issues.push(`资质 [${q.qualification_name || q.qualification_type}] 待审核`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  async validateCoverage(providerId: number): Promise<{ valid: boolean; issues: string[]; branchCount: number; cityCount: number }> {
    const issues: string[] = [];
    const provider = await this.providerDao.findById(providerId);

    const activeBranches = await this.branchDao.findAll({
      where: { provider_id: providerId, status: 1 },
    });
    const branchCount = activeBranches.length;

    const cities = new Set<string>();
    activeBranches.forEach(b => {
      if (b.city) cities.add(b.city);
    });
    const cityCount = cities.size;

    const providerCities = provider?.service_cities ? provider.service_cities.split(',').filter(Boolean) : [];
    const declaredCityCount = providerCities.length;

    if (branchCount < this.MIN_BRANCH_COUNT) {
      issues.push(`网点覆盖不足：当前有效网点 ${branchCount} 个，最低要求 ${this.MIN_BRANCH_COUNT} 个`);
    }
    if (cityCount < this.MIN_COVERAGE_CITIES) {
      issues.push(`城市覆盖不足：当前覆盖 ${cityCount} 个城市，最低要求 ${this.MIN_COVERAGE_CITIES} 个`);
    }
    if (declaredCityCount > 0 && cityCount < declaredCityCount * 0.6) {
      issues.push(`实际网点覆盖与声明覆盖区域差距较大（声明${declaredCityCount}城，实际覆盖${cityCount}城）`);
    }

    return { valid: issues.length === 0, issues, branchCount, cityCount };
  }

  async validateTimeliness(providerId: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const provider = await this.providerDao.findById(providerId);
    if (!provider) {
      return { valid: false, issues: ['服务商不存在'] };
    }

    if (!provider.cross_province_timeliness || provider.cross_province_timeliness <= 0) {
      issues.push('缺少跨省时效承诺');
    }
    if (!provider.intra_province_timeliness || provider.intra_province_timeliness <= 0) {
      issues.push('缺少省内时效承诺');
    }
    if (provider.cross_province_timeliness && provider.intra_province_timeliness
      && Number(provider.cross_province_timeliness) <= Number(provider.intra_province_timeliness)) {
      issues.push('跨省时效承诺不应小于或等于省内时效');
    }
    if (provider.on_time_rate && Number(provider.on_time_rate) < 0.9) {
      issues.push(`准时率偏低：当前${(Number(provider.on_time_rate) * 100).toFixed(1)}%，建议不低于90%`);
    }

    return { valid: issues.length === 0, issues };
  }

  async validatePermissions(providerId: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const provider = await this.providerDao.findById(providerId);
    if (!provider) {
      return { valid: false, issues: ['服务商不存在'] };
    }

    if (!provider.daily_order_limit || provider.daily_order_limit < 10) {
      issues.push('合作权限额度偏低，建议不少于每日10单');
    }
    if (!provider.first_weight_fee || Number(provider.first_weight_fee) <= 0) {
      issues.push('缺少首重资费配置');
    }
    if (!provider.additional_weight_fee || Number(provider.additional_weight_fee) <= 0) {
      issues.push('缺少续重资费配置');
    }

    return { valid: issues.length === 0, issues };
  }

  async runProviderPreCheck(providerId: number): Promise<ProviderPreCheckResult> {
    const provider = await this.providerDao.findById(providerId);
    const result: ProviderPreCheckResult = {
      passed: false,
      enterprise: { valid: true, issues: [] },
      coverage: { valid: true, issues: [], branchCount: 0, cityCount: 0 },
      timeliness: { valid: true, issues: [] },
      permissions: { valid: true, issues: [] },
      codeUnique: { valid: true, issues: [] },
      blockingIssues: [],
      warningIssues: [],
    };

    if (!provider) {
      result.blockingIssues.push('服务商不存在');
      return result;
    }

    const codeCheck = this.validateProviderCode(provider.provider_code);
    if (!codeCheck.valid) {
      result.codeUnique.valid = false;
      result.codeUnique.issues.push(codeCheck.message!);
    }

    result.enterprise = await this.validateEnterpriseQualification(providerId);
    result.coverage = await this.validateCoverage(providerId);
    result.timeliness = await this.validateTimeliness(providerId);
    result.permissions = await this.validatePermissions(providerId);

    const blockingCategories = [result.enterprise, result.coverage, result.timeliness, result.codeUnique];
    for (const cat of blockingCategories) {
      if (!cat.valid) {
        result.blockingIssues.push(...cat.issues);
      }
    }

    if (!result.permissions.valid) {
      result.warningIssues.push(...result.permissions.issues);
    }

    result.passed = result.blockingIssues.length === 0;
    return result;
  }

  async checkFeeCompliance(providerId: number, feeData: any): Promise<FeeComplianceCheckResult> {
    const violations: string[] = [];
    const warnings: string[] = [];
    const provider = await this.providerDao.findById(providerId);

    if (feeData.first_weight !== undefined && feeData.first_weight_fee !== undefined) {
      const firstWeightFee = Number(feeData.first_weight_fee);
      if (firstWeightFee <= 0) {
        violations.push('首重费用必须大于0');
      }
      if (firstWeightFee > 100) {
        warnings.push('首重费用偏高，请确认是否符合市场行情');
      }
    }

    if (feeData.additional_weight_step !== undefined && feeData.additional_weight_fee !== undefined) {
      const stepFee = Number(feeData.additional_weight_fee);
      if (stepFee < 0) {
        violations.push('续重费用不能为负数');
      }
      if (Number(feeData.additional_weight_step) > 0 && stepFee / Number(feeData.additional_weight_step) > 20) {
        warnings.push('续重单位费用偏高，请确认资费合理性');
      }
    }

    if (feeData.base_service_fee !== undefined) {
      const baseFee = Number(feeData.base_service_fee);
      if (baseFee < 0) {
        violations.push('基础服务费不能为负数');
      }
    }

    if (feeData.min_fee !== undefined && feeData.max_fee !== undefined
      && feeData.max_fee !== null && feeData.min_fee !== null) {
      if (Number(feeData.min_fee) > Number(feeData.max_fee)) {
        violations.push('最低收费不能大于最高收费');
      }
    }

    if (feeData.effective_date && feeData.expiry_date) {
      const effective = new Date(feeData.effective_date);
      const expiry = new Date(feeData.expiry_date);
      if (effective >= expiry) {
        violations.push('生效日期必须早于失效日期');
      }
    }

    const existingSameRule = await this.feeStandardDao.findOne({
      where: {
        provider_id: providerId,
        fee_type: feeData.fee_type,
        from_province: feeData.from_province || null,
        to_province: feeData.to_province || null,
        status: 1,
      },
    });
    if (existingSameRule && (!feeData.id || existingSameRule.id !== feeData.id)) {
      warnings.push('已存在相同起讫区域的同类资费规则，建议确认是否覆盖');
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
    };
  }

  canEditByCooperationStatus(cooperationStatus: number, field: string): { canEdit: boolean; reason?: string } {
    const CORE_FIELDS = [
      'provider_code', 'credit_code', 'business_license_no',
      'first_weight_fee', 'additional_weight_fee', 'base_service_fee',
      'cross_province_timeliness', 'intra_province_timeliness',
      'daily_order_limit', 'cooperation_status',
    ];

    const LOCKED_FIELDS_WHEN_ACTIVE = [
      'provider_code', 'credit_code', 'business_license_no',
    ];

    if (cooperationStatus === 1) {
      if (LOCKED_FIELDS_WHEN_ACTIVE.includes(field)) {
        return { canEdit: false, reason: '合作生效中的服务商，企业主体信息不可修改' };
      }
      if (CORE_FIELDS.includes(field)) {
        return { canEdit: true, reason: '核心参数，修改需二次确认并同步物流匹配规则' };
      }
      return { canEdit: true };
    }

    if (cooperationStatus === 2) {
      return { canEdit: false, reason: '合作暂停状态，不可编辑服务商参数' };
    }

    if (cooperationStatus === 3) {
      return { canEdit: false, reason: '合作已终止，不可编辑服务商参数' };
    }

    return { canEdit: true };
  }

  isCoreField(field: string): boolean {
    const CORE_FIELDS = [
      'first_weight_fee', 'additional_weight_fee', 'base_service_fee',
      'cross_province_timeliness', 'intra_province_timeliness',
      'daily_order_limit', 'match_priority', 'service_province',
      'service_cities', 'cooperation_status', 'level',
    ];
    return CORE_FIELDS.includes(field);
  }
}

export const logisticsProviderValidateService = new LogisticsProviderValidateService();
export default LogisticsProviderValidateService;
