import { CorporateAccountOpening, Customer, Organization, User } from '../models';
import { isValidId, isValidIdCard, isValidMobile, throwNotFoundError, throwValidationError, throwBusinessError, throwForbiddenError } from '../utils';
import dayjs from 'dayjs';
import { Op, Includeable, WhereOptions } from 'sequelize';
import { PaginatedResult } from '../types/common';

const RISK_LEVEL_TEXT: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
};

const CHANNEL_TEXT: Record<string, string> = {
  counter: '柜面',
  ebank: '网上银行',
  mobile: '手机银行'
};

const CORPORATE_ACCOUNT_TYPE_TEXT: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户'
};

const CORPORATE_STATUS_TEXT: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
};

const CORPORATE_APPROVAL_LEVEL: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
  4: 1
};

const CORPORATE_ACCOUNT_CONFIG: Record<number, {
  daily_limit: number;
  single_limit: number;
  annual_fee: number;
  permissions: string[];
  description: string;
}> = {
  1: {
    daily_limit: 50000000,
    single_limit: 10000000,
    annual_fee: 500,
    permissions: ['transfer', 'deposit', 'withdraw', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax', 'trade', 'investment'],
    description: '基本存款账户是存款人办理日常转账结算和现金收付的账户，是存款人的主办账户'
  },
  2: {
    daily_limit: 20000000,
    single_limit: 5000000,
    annual_fee: 300,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'mobile_banking', 'loan', 'payroll', 'tax'],
    description: '一般存款账户用于办理存款人借款转存、借款归还和其他结算的资金收付，不得办理现金支取'
  },
  3: {
    daily_limit: 10000000,
    single_limit: 2000000,
    annual_fee: 200,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking', 'special_fund'],
    description: '专用存款账户用于办理各项专用资金的收付，如基本建设资金、更新改造资金、财政预算外资金等'
  },
  4: {
    daily_limit: 5000000,
    single_limit: 1000000,
    annual_fee: 100,
    permissions: ['transfer', 'deposit', 'payment', 'online_banking'],
    description: '临时存款账户用于办理临时机构以及存款人临时经营活动发生的资金收付，有效期最长不得超过2年'
  }
};

const DISHONEST_ENTERPRISES = ['91110000MA001ABC12', '91310000MA002DEF34'];
const ABNORMAL_ENTERPRISES = ['91440000MA003GHI56'];

const HIGH_RISK_INDUSTRIES = ['金融', '投资', '担保', '典当', '小额贷款', '房地产开发', '矿产开采', '化工', '危险品'];

interface PrecheckItemResult {
  name: string;
  field: string;
  passed: boolean;
  score: number;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

interface PrecheckResponse {
  passed: boolean;
  overallScore: number;
  riskLevel: number;
  items: PrecheckItemResult[];
  riskTags: string[];
  customerExists: boolean;
  customerId?: string;
  customerNo?: string;
  requireManualReview: boolean;
  blockedReason?: string;
}

interface CorporateOpeningVO {
  id: string;
  opening_no: string;
  customer_id?: string;
  customer_no?: string;
  account_type: number;
  account_type_text: string;
  enterprise_name: string;
  credit_code: string;
  license_valid_from?: string;
  license_valid_to?: string;
  license_permanent?: number;
  legal_representative?: string;
  legal_id_card_no?: string;
  legal_verified?: number;
  agent_name?: string;
  agent_id_card_no?: string;
  agent_mobile?: string;
  agent_verified?: number;
  registered_address?: string;
  business_address?: string;
  business_status?: number;
  tax_registration_no?: string;
  tax_info_consistent?: number;
  industry_type?: string;
  registered_capital?: number;
  business_years?: number;
  authorization_complete?: number;
  target_org_id?: string;
  target_org_name?: string;
  open_purpose?: string;
  supporting_materials?: string;
  approval_level?: string;
  risk_level: number;
  risk_level_text: string;
  risk_tags?: string;
  channel_code?: string;
  channel_text?: string;
  status: number;
  status_text: string;
  precheck_result?: number;
  precheck_reasons?: any;
  reject_reason?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  submit_org_id?: string;
  submit_org_name?: string;
  submitter_id?: string;
  submitter_name?: string;
  submit_time?: string;
  review_time?: string;
  account_id?: string;
  account_no?: string;
  is_dishonest: number;
  is_abnormal: number;
  is_paused: number;
  is_isolated: number;
  isolate_reason?: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

interface BatchImportResultItem {
  index: number;
  success: boolean;
  opening_id?: string;
  opening_no?: string;
  errors?: string[];
  warnings?: string[];
  need_manual_review?: boolean;
  risk_level?: number;
  status?: number;
  is_isolated?: number;
}

interface BatchReviewResult {
  success_count: number;
  fail_count: number;
  details: Array<{
    id: string;
    success: boolean;
    message?: string;
  }>;
}

interface TraceCheckResponse {
  credit_code: string;
  matched: boolean;
  total_openings: number;
  total_closed: number;
  total_abnormal: number;
  history_records: Array<{
    opening_no: string;
    account_type: number;
    status: number;
    created_at: string;
    target_org_name?: string;
  }>;
  is_dishonest: boolean;
  is_abnormal: boolean;
  legal_verified: boolean;
  agent_verified: boolean;
  risk_prompts: string[];
  allowed: boolean;
  block_reason?: string;
}

interface CorporateAccountConfig {
  account_types: Array<{
    type: number;
    name: string;
    description: string;
    daily_limit: number;
    single_limit: number;
    annual_fee: number;
    permissions: string[];
    approval_level: number;
  }>;
  risk_levels: Record<number, string>;
  channels: Record<string, string>;
}

export class CorporateAccountOpeningService {
  private maskIdCard(id: string): string {
    if (!id || id.length < 8) return id || '';
    return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4);
  }

  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 7) return mobile || '';
    return mobile.slice(0, 3) + '****' + mobile.slice(-4);
  }

  private isValidCreditCode(code: string): boolean {
    if (!code || code.length !== 18) return false;
    const regex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    if (!regex.test(code)) return false;
    const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
    const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += chars.indexOf(code[i]) * weights[i];
    }
    const checkCode = 31 - (sum % 31);
    const expectedChar = checkCode === 31 ? '0' : chars[checkCode];
    return expectedChar === code[17];
  }

  private getCustomerInclude(): Includeable {
    return {
      model: Customer,
      required: false,
      attributes: ['id', 'customer_no', 'customer_name', 'risk_level', 'customer_level']
    };
  }

  private getTargetOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'target_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  private getSubmitOrgInclude(): Includeable {
    return {
      model: Organization,
      as: 'submit_org',
      required: false,
      attributes: ['id', 'name']
    };
  }

  private getSubmitterInclude(): Includeable {
    return {
      model: User,
      as: 'submitter',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  private getReviewerInclude(): Includeable {
    return {
      model: User,
      as: 'reviewer',
      required: false,
      attributes: ['id', 'username', 'real_name']
    };
  }

  private async generateOpeningNo(): Promise<string> {
    const prefix = 'CO';
    const datePart = dayjs().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const no = `${prefix}${datePart}${random}`;
    const exists = await CorporateAccountOpening.findOne({ where: { opening_no: no } });
    if (exists) {
      return this.generateOpeningNo();
    }
    return no;
  }

  private buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { opening_no: { [Op.like]: `%${params.keyword}%` } },
        { enterprise_name: { [Op.like]: `%${params.keyword}%` } },
        { credit_code: { [Op.like]: `%${params.keyword}%` } },
        { legal_representative: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.opening_no) {
      where.opening_no = { [Op.like]: `%${params.opening_no}%` };
    }

    if (params.enterprise_name) {
      where.enterprise_name = { [Op.like]: `%${params.enterprise_name}%` };
    }

    if (params.credit_code) {
      where.credit_code = { [Op.like]: `%${params.credit_code}%` };
    }

    if (params.account_type !== undefined) {
      where.account_type = params.account_type;
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.channel_code) {
      where.channel_code = params.channel_code;
    }

    if (params.is_isolated !== undefined) {
      where.is_isolated = params.is_isolated;
    }

    if (params.submit_org_id) {
      where.submit_org_id = params.submit_org_id;
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.industry_type) {
      where.industry_type = params.industry_type;
    }

    if (params.start_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.created_at = {
        ...(where.created_at || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  async precheck(data: any): Promise<PrecheckResponse> {
    const items: PrecheckItemResult[] = [];
    let overallScore = 100;
    const riskTags: string[] = [];
    let riskLevel = 0;

    const licenseScore = 25;
    if (!data.license_permanent && data.license_permanent !== 1) {
      if (!data.license_valid_to) {
        items.push({
          name: '营业执照有效期',
          field: 'license_valid_to',
          passed: false,
          score: 0,
          message: '请填写营业执照有效期止',
          level: 'error'
        });
        overallScore -= licenseScore;
        riskLevel = Math.max(riskLevel, 3);
        riskTags.push('营业执照有效期缺失');
      } else if (dayjs(data.license_valid_to).isBefore(dayjs())) {
        items.push({
          name: '营业执照有效期',
          field: 'license_valid_to',
          passed: false,
          score: 0,
          message: '营业执照已过期',
          level: 'error'
        });
        overallScore -= licenseScore;
        riskLevel = Math.max(riskLevel, 4);
        riskTags.push('营业执照过期');
      } else {
        const daysLeft = dayjs(data.license_valid_to).diff(dayjs(), 'day');
        if (daysLeft < 90) {
          items.push({
            name: '营业执照有效期',
            field: 'license_valid_to',
            passed: true,
            score: Math.floor(licenseScore * 0.6),
            message: `营业执照将于 ${daysLeft} 天后到期，建议尽快更新`,
            level: 'warning'
          });
          overallScore -= Math.floor(licenseScore * 0.4);
          riskLevel = Math.max(riskLevel, 2);
          riskTags.push('营业执照即将过期');
        } else {
          items.push({
            name: '营业执照有效期',
            field: 'license_valid_to',
            passed: true,
            score: licenseScore,
            message: `营业执照有效期正常（剩余 ${daysLeft} 天）`
          });
        }
      }
    } else {
      items.push({
        name: '营业执照有效期',
        field: 'license_permanent',
        passed: true,
        score: licenseScore,
        message: '营业执照为长期有效'
      });
    }

    const creditCodeScore = 25;
    if (!data.credit_code || !this.isValidCreditCode(data.credit_code)) {
      items.push({
        name: '统一社会信用代码',
        field: 'credit_code',
        passed: false,
        score: 0,
        message: '统一社会信用代码格式不正确（需18位合规编码）',
        level: 'error'
      });
      overallScore -= creditCodeScore;
      riskLevel = Math.max(riskLevel, 4);
      riskTags.push('统一社会信用代码无效');
    } else {
      items.push({
        name: '统一社会信用代码',
        field: 'credit_code',
        passed: true,
        score: creditCodeScore,
        message: '统一社会信用代码格式正确'
      });

      if (DISHONEST_ENTERPRISES.includes(data.credit_code)) {
        riskLevel = 5;
        riskTags.push('失信企业');
        overallScore = 0;
      }
      if (ABNORMAL_ENTERPRISES.includes(data.credit_code)) {
        riskLevel = Math.max(riskLevel, 4);
        riskTags.push('经营异常企业');
        overallScore -= 30;
      }
    }

    const legalScore = 25;
    if (data.legal_verified === 1) {
      items.push({
        name: '法人实名备案状态',
        field: 'legal_verified',
        passed: true,
        score: legalScore,
        message: '法人已完成实名备案'
      });
    } else if (data.legal_verified === 2) {
      items.push({
        name: '法人实名备案状态',
        field: 'legal_verified',
        passed: true,
        score: Math.floor(legalScore * 0.5),
        message: '法人实名备案待核验',
        level: 'warning'
      });
      overallScore -= Math.floor(legalScore * 0.5);
      riskLevel = Math.max(riskLevel, 2);
      riskTags.push('法人待核验');
    } else {
      items.push({
        name: '法人实名备案状态',
        field: 'legal_verified',
        passed: false,
        score: 0,
        message: '法人未完成实名备案',
        level: 'error'
      });
      overallScore -= legalScore;
      riskLevel = Math.max(riskLevel, 3);
      riskTags.push('法人未备案');
    }

    const authScore = 25;
    if (data.authorization_complete === 1) {
      items.push({
        name: '授权文件完整性',
        field: 'authorization_complete',
        passed: true,
        score: authScore,
        message: '开户授权文件完整'
      });
    } else if (data.authorization_complete === 2) {
      items.push({
        name: '授权文件完整性',
        field: 'authorization_complete',
        passed: true,
        score: Math.floor(authScore * 0.5),
        message: '授权文件待核验',
        level: 'warning'
      });
      overallScore -= Math.floor(authScore * 0.5);
      riskLevel = Math.max(riskLevel, 2);
      riskTags.push('授权文件待核验');
    } else {
      items.push({
        name: '授权文件完整性',
        field: 'authorization_complete',
        passed: false,
        score: 0,
        message: '开户授权文件缺失',
        level: 'error'
      });
      overallScore -= authScore;
      riskLevel = Math.max(riskLevel, 3);
      riskTags.push('授权文件缺失');
    }

    let customerId: string | undefined;
    let customerNo: string | undefined;
    let customerExists = false;

    if (data.credit_code && this.isValidCreditCode(data.credit_code)) {
      const existingCustomer = await Customer.findOne({
        where: { id_card_no: data.credit_code, customer_type: 2 }
      });
      if (existingCustomer) {
        customerExists = true;
        customerId = existingCustomer.id;
        customerNo = existingCustomer.customer_no;

        if (existingCustomer.status === 0) {
          overallScore = 0;
          riskLevel = 5;
          riskTags.push('客户账户冻结');
        }
        if (existingCustomer.risk_level && existingCustomer.risk_level >= 4) {
          riskLevel = Math.max(riskLevel, existingCustomer.risk_level);
          riskTags.push(`客户风险等级${RISK_LEVEL_TEXT[existingCustomer.risk_level]}`);
        }
      }
    }

    if (data.industry_type && HIGH_RISK_INDUSTRIES.includes(data.industry_type)) {
      riskLevel = Math.max(riskLevel, 3);
      riskTags.push('高风险行业');
      overallScore -= 10;
    }

    if (data.registered_capital !== undefined) {
      const capital = Number(data.registered_capital);
      if (capital < 10) {
        riskLevel = Math.max(riskLevel, 2);
        riskTags.push('注册资本较低');
        overallScore -= 5;
      }
    }

    if (data.business_years !== undefined) {
      const years = Number(data.business_years);
      if (years < 1) {
        riskLevel = Math.max(riskLevel, 2);
        riskTags.push('新设立企业');
        overallScore -= 5;
      }
    }

    const passed = overallScore >= 60 && items.filter(i => !i.passed).length === 0;
    const requireManualReview = riskLevel >= 3 || !passed;
    let blockedReason: string | undefined;

    if (!passed) {
      const errors = items.filter(i => !i.passed).map(i => i.message);
      blockedReason = errors.join('；');
    }

    return {
      passed,
      overallScore: Math.max(0, overallScore),
      riskLevel,
      items,
      riskTags,
      customerExists,
      customerId,
      customerNo,
      requireManualReview,
      blockedReason
    };
  }

  async createOpening(data: any, userId?: string, orgId?: string): Promise<CorporateOpeningVO> {
    const precheck = await this.precheck(data);

    if (!precheck.passed) {
      throwBusinessError(`开户预检未通过：${precheck.blockedReason || '请检查必填项'}`, 400, precheck.items);
    }

    if (![1, 2, 3, 4].includes(data.account_type)) {
      throwValidationError('无效的账户类型');
    }

    if (orgId) {
      const org = await Organization.findByPk(orgId);
      if (!org) {
        throwValidationError('无效的机构ID');
      }
    }

    let cust: Customer | null = null;
    if (precheck.customerId) {
      cust = await Customer.findByPk(precheck.customerId);
    }

    const openingNo = await this.generateOpeningNo();
    const approvalLevel = CORPORATE_APPROVAL_LEVEL[data.account_type];
    const initialStatus = 2;

    const opening = await CorporateAccountOpening.create({
      opening_no: openingNo,
      customer_id: cust?.id,
      customer_no: cust?.customer_no,
      account_type: data.account_type,
      enterprise_name: data.enterprise_name,
      credit_code: data.credit_code,
      license_valid_from: data.license_valid_from ? new Date(data.license_valid_from) : undefined,
      license_valid_to: data.license_valid_to ? new Date(data.license_valid_to) : undefined,
      license_permanent: data.license_permanent || 0,
      legal_representative: data.legal_representative,
      legal_id_card_no: data.legal_id_card_no,
      legal_verified: data.legal_verified || 0,
      agent_name: data.agent_name,
      agent_id_card_no: data.agent_id_card_no,
      agent_mobile: data.agent_mobile,
      agent_verified: data.agent_verified || 0,
      registered_address: data.registered_address,
      business_address: data.business_address,
      business_status: data.business_status || 1,
      tax_registration_no: data.tax_registration_no,
      tax_info_consistent: data.tax_info_consistent || 2,
      industry_type: data.industry_type,
      registered_capital: data.registered_capital,
      business_years: data.business_years,
      authorization_complete: data.authorization_complete || 0,
      target_org_id: data.target_org_id || orgId,
      open_purpose: data.open_purpose,
      supporting_materials: data.supporting_materials,
      approval_level: String(approvalLevel),
      risk_level: precheck.riskLevel,
      risk_tags: precheck.riskTags.join(','),
      channel_code: data.channel_code || 'counter',
      status: initialStatus,
      precheck_result: 1,
      precheck_reasons: JSON.stringify(precheck.items),
      submit_org_id: orgId,
      submitter_id: userId,
      submit_time: new Date(),
      is_dishonest: DISHONEST_ENTERPRISES.includes(data.credit_code) ? 1 : 0,
      is_abnormal: ABNORMAL_ENTERPRISES.includes(data.credit_code) ? 1 : 0,
      is_paused: 0,
      is_isolated: 0,
      remark: data.remark
    } as any);

    return await this.getOpeningById(opening.id);
  }

  async updateOpening(id: string, data: any, userId?: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (![0, 1, 2].includes(opening.status)) {
      throwBusinessError('当前申请状态不允许修改');
    }

    const updateData: any = {};
    const preservedFields = [
      'enterprise_name', 'credit_code', 'account_type',
      'license_valid_from', 'license_valid_to', 'license_permanent'
    ];

    for (const key of Object.keys(data)) {
      if (preservedFields.includes(key)) continue;
      updateData[key] = data[key];
    }

    if (Object.keys(updateData).length > 0) {
      if (opening.status === 2) {
        updateData.status = 3;
      }
      await CorporateAccountOpening.update(updateData, { where: { id } });
    }

    return await this.getOpeningById(id);
  }

  async cancelOpening(id: string, userId?: string, remark?: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if ([5, 6, 7, 8].includes(opening.status)) {
      throwBusinessError('当前申请状态不允许取消');
    }

    await CorporateAccountOpening.update({
      status: 7,
      registered_address: null,
      business_address: null,
      business_status: null,
      tax_registration_no: null,
      tax_info_consistent: null,
      industry_type: null,
      registered_capital: null,
      business_years: null,
      target_org_id: null,
      open_purpose: null,
      supporting_materials: null,
      agent_name: null,
      agent_id_card_no: null,
      agent_mobile: null,
      agent_verified: null,
      legal_verified: 0,
      authorization_complete: 0,
      remark: remark || opening.remark
    } as any, { where: { id } });

    return await this.getOpeningById(id);
  }

  async reviewOpening(id: string, operation: 'approve' | 'reject', reviewerId: string, reason?: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.status !== 3) {
      throwBusinessError('当前申请状态不允许复核');
    }

    if (operation === 'approve') {
      if (opening.customer_id) {
        const customer = await Customer.findByPk(opening.customer_id);
        if (customer) {
          await customer.update({
            risk_level: opening.risk_level,
            risk_tags: opening.risk_tags
          } as any);
        }
      }

      await CorporateAccountOpening.update({
        status: 4,
        reviewer_id: reviewerId,
        review_time: new Date()
      } as any, { where: { id } });
    } else {
      await CorporateAccountOpening.update({
        status: 6,
        reviewer_id: reviewerId,
        review_time: new Date(),
        reject_reason: reason || '复核未通过'
      } as any, { where: { id } });
    }

    return await this.getOpeningById(id);
  }

  async openAccount(id: string, operatorId: string, orgId: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.status !== 4 && opening.status !== 2) {
      throwBusinessError('当前申请状态不允许开户');
    }

    let customer = opening.customer_id ? await Customer.findByPk(opening.customer_id) : null;

    if (!customer) {
      const customerNo = 'C' + dayjs().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      customer = await Customer.create({
        customer_no: customerNo,
        customer_name: opening.enterprise_name,
        id_card_no: opening.credit_code,
        id_type: 4,
        customer_type: 2,
        customer_level: 1,
        risk_level: opening.risk_level,
        risk_tags: opening.risk_tags,
        status: 1,
        org_id: orgId,
        address: opening.registered_address,
        open_date: new Date()
      } as any);
    }

    const accountNo = 'A' + dayjs().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const typeConfig = CORPORATE_ACCOUNT_CONFIG[opening.account_type];

    await CorporateAccountOpening.update({
      status: 5,
      customer_id: customer.id,
      customer_no: customer.customer_no,
      account_id: accountNo,
      account_no: accountNo
    } as any, { where: { id } });

    return await this.getOpeningById(id);
  }

  async getOpeningList(params: any, userId?: string, orgId?: string, userRoles?: string[]): Promise<PaginatedResult<CorporateOpeningVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.buildQuery(queryParams);
    if (orgId && !userRoles?.includes('admin')) {
      where.submit_org_id = orgId;
    }

    const include = [
      this.getCustomerInclude(),
      this.getTargetOrgInclude(),
      this.getSubmitOrgInclude(),
      this.getSubmitterInclude(),
      this.getReviewerInclude()
    ];

    const result = await CorporateAccountOpening.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: pageSize || 10,
      offset: ((page || 1) - 1) * (pageSize || 10)
    } as any);

    const list: CorporateOpeningVO[] = result.rows.map((o: any) => this.convertToVO(o));
    return {
      list,
      total: result.count,
      page: page || 1,
      pageSize: pageSize || 10
    };
  }

  async getOpeningById(id: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id, {
      include: [
        this.getCustomerInclude(),
        this.getTargetOrgInclude(),
        this.getSubmitOrgInclude(),
        this.getSubmitterInclude(),
        this.getReviewerInclude()
      ]
    } as any);
    if (!opening) throwNotFoundError('开户申请不存在');
    return this.convertToVO(opening);
  }

  async batchImport(data: any, userId?: string, orgId?: string, userRoles?: string[]): Promise<{ success_count: number; fail_count: number; items: BatchImportResultItem[] }> {
    const results: BatchImportResultItem[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const result: BatchImportResultItem = {
        index: i,
        success: false,
        errors: [],
        warnings: []
      };

      try {
        if (!item.enterprise_name || item.enterprise_name.length < 2) {
          result.errors!.push('企业名称不能为空');
        }
        if (!item.credit_code || !this.isValidCreditCode(item.credit_code)) {
          result.errors!.push('统一社会信用代码格式错误');
        }
        if (![1, 2, 3, 4].includes(item.account_type)) {
          result.errors!.push('账户类型无效');
        }

        if (item.credit_code && DISHONEST_ENTERPRISES.includes(item.credit_code)) {
          result.errors!.push('该企业为失信企业，禁止开户');
        }

        const precheck = await this.precheck(item);

        result.need_manual_review = precheck.requireManualReview;
        result.risk_level = precheck.riskLevel;

        let isIsolated = 0;
        if (precheck.riskLevel >= 4) {
          result.warnings!.push(`企业风险等级：${RISK_LEVEL_TEXT[precheck.riskLevel]}，需人工复核`);
        }
        if (precheck.riskTags.length > 0) {
          result.warnings!.push(`风险标签：${precheck.riskTags.join('、')}`);
        }
        if (precheck.overallScore < 80) {
          result.warnings!.push(`综合评分：${precheck.overallScore} 分`);
        }

        if (item.industry_type && HIGH_RISK_INDUSTRIES.includes(item.industry_type)) {
          result.warnings!.push('高风险行业，触发差异化校验');
          result.need_manual_review = true;
        }

        if (item.registered_capital !== undefined) {
          const capital = Number(item.registered_capital);
          if (capital < 50) {
            result.warnings!.push('注册资本较低，建议人工复核');
            result.need_manual_review = true;
          }
        }

        if (item.business_years !== undefined) {
          const years = Number(item.business_years);
          if (years < 1) {
            result.warnings!.push('新设立企业，建议人工复核');
            result.need_manual_review = true;
          }
        }

        if (precheck.riskLevel >= 5 || DISHONEST_ENTERPRISES.includes(item.credit_code)) {
          isIsolated = 1;
          result.warnings!.push('高风险企业，自动隔离');
        }

        if (result.errors!.length === 0) {
          const openingNo = await this.generateOpeningNo();
          const approvalLevel = CORPORATE_APPROVAL_LEVEL[item.account_type];
          const status = precheck.requireManualReview || result.need_manual_review ? 3 : 2;

          const opening = await CorporateAccountOpening.create({
            opening_no: openingNo,
            customer_id: precheck.customerId,
            customer_no: precheck.customerNo,
            account_type: item.account_type,
            enterprise_name: item.enterprise_name,
            credit_code: item.credit_code,
            license_valid_from: item.license_valid_from ? new Date(item.license_valid_from) : undefined,
            license_valid_to: item.license_valid_to ? new Date(item.license_valid_to) : undefined,
            license_permanent: item.license_permanent || 0,
            legal_representative: item.legal_representative,
            legal_id_card_no: item.legal_id_card_no,
            legal_verified: item.legal_verified || 0,
            agent_name: item.agent_name,
            agent_id_card_no: item.agent_id_card_no,
            agent_mobile: item.agent_mobile,
            agent_verified: item.agent_verified || 0,
            registered_address: item.registered_address,
            business_address: item.business_address,
            industry_type: item.industry_type,
            registered_capital: item.registered_capital,
            business_years: item.business_years,
            authorization_complete: item.authorization_complete || 0,
            target_org_id: item.target_org_id || orgId,
            open_purpose: item.open_purpose,
            supporting_materials: item.supporting_materials,
            approval_level: String(approvalLevel),
            risk_level: precheck.riskLevel,
            risk_tags: precheck.riskTags.join(','),
            channel_code: item.channel_code || 'counter',
            status,
            precheck_result: precheck.passed ? 1 : 0,
            precheck_reasons: JSON.stringify(precheck.items),
            submit_org_id: orgId,
            submitter_id: userId,
            submit_time: new Date(),
            is_dishonest: DISHONEST_ENTERPRISES.includes(item.credit_code) ? 1 : 0,
            is_abnormal: ABNORMAL_ENTERPRISES.includes(item.credit_code) ? 1 : 0,
            is_paused: 0,
            is_isolated: isIsolated,
            isolate_reason: isIsolated ? '高风险企业自动隔离' : null,
            remark: item.remark
          } as any);

          result.success = true;
          result.opening_id = opening.id;
          result.opening_no = opening.opening_no;
          result.status = status;
          result.is_isolated = isIsolated;
          successCount++;
        } else {
          failCount++;
        }
      } catch (e: any) {
        result.errors!.push(e.message || '系统错误');
        failCount++;
      }

      results.push(result);
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      items: results
    };
  }

  async batchReview(data: any, userId: string, userRoles?: string[]): Promise<BatchReviewResult> {
    const details: Array<{ id: string; success: boolean; message?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    const hasReviewPermission = userRoles?.includes('admin') || userRoles?.includes('business:corporate:review');

    if (!hasReviewPermission) {
      throwForbiddenError('没有对公账户审核权限');
    }

    for (const item of data.items) {
      try {
        const { id, operation, reason } = item;

        if (operation === 'pause') {
          await CorporateAccountOpening.update({
            is_paused: 1
          } as any, { where: { id } });
        } else if (operation === 'resume') {
          await CorporateAccountOpening.update({
            is_paused: 0
          } as any, { where: { id } });
        } else if (operation === 'approve') {
          await this.reviewOpening(id, 'approve', userId, reason);
        } else if (operation === 'reject') {
          await this.reviewOpening(id, 'reject', userId, reason);
        } else if (operation === 'isolate') {
          await CorporateAccountOpening.update({
            is_isolated: 1,
            isolate_reason: reason || '批量审核异常隔离'
          } as any, { where: { id } });
        } else if (operation === 'deisolate') {
          await CorporateAccountOpening.update({
            is_isolated: 0,
            isolate_reason: null
          } as any, { where: { id } });
        }

        successCount++;
        details.push({ id, success: true });
      } catch (e: any) {
        failCount++;
        details.push({ id: item.id, success: false, message: e.message });
      }
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      details
    };
  }

  async refreshOpening(id: string): Promise<CorporateOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await CorporateAccountOpening.findByPk(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.is_isolated === 1) {
      throwBusinessError('该数据已被隔离，无法刷新');
    }

    const precheck = await this.precheck({
      enterprise_name: opening.enterprise_name,
      credit_code: opening.credit_code,
      account_type: opening.account_type,
      license_valid_from: opening.license_valid_from,
      license_valid_to: opening.license_valid_to,
      license_permanent: opening.license_permanent,
      legal_verified: opening.legal_verified,
      authorization_complete: opening.authorization_complete,
      industry_type: opening.industry_type,
      registered_capital: opening.registered_capital,
      business_years: opening.business_years,
      channel_code: opening.channel_code
    });

    await CorporateAccountOpening.update({
      risk_level: precheck.riskLevel,
      risk_tags: precheck.riskTags.join(','),
      precheck_result: precheck.passed ? 1 : 0,
      precheck_reasons: JSON.stringify(precheck.items),
      is_dishonest: DISHONEST_ENTERPRISES.includes(opening.credit_code) ? 1 : 0,
      is_abnormal: ABNORMAL_ENTERPRISES.includes(opening.credit_code) ? 1 : 0
    } as any, { where: { id } });

    return await this.getOpeningById(id);
  }

  async traceCheck(data: any): Promise<TraceCheckResponse> {
    if (!data.credit_code || !this.isValidCreditCode(data.credit_code)) {
      throwValidationError('统一社会信用代码格式错误');
    }

    const allOpenings = await CorporateAccountOpening.findAll({
      where: { credit_code: data.credit_code },
      include: [this.getTargetOrgInclude() as any],
      order: [['created_at', 'DESC']]
    } as any);

    const totalOpenings = allOpenings.length;
    const totalClosed = allOpenings.filter((o: any) => o.status === 7 || o.status === 8).length;
    const totalAbnormal = allOpenings.filter((o: any) => o.is_abnormal === 1 || o.is_isolated === 1).length;

    const sorted = allOpenings.sort((a: any, b: any) =>
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );

    const isDishonest = DISHONEST_ENTERPRISES.includes(data.credit_code);
    const isAbnormal = ABNORMAL_ENTERPRISES.includes(data.credit_code);

    const legalVerified = data.legal_id_card_no ? isValidIdCard(data.legal_id_card_no) : false;
    const agentVerified = data.agent_id_card_no ? isValidIdCard(data.agent_id_card_no) : false;

    const riskPrompts: string[] = [];

    if (isDishonest) {
      riskPrompts.push('该企业为失信企业，禁止开户');
    }
    if (isAbnormal) {
      riskPrompts.push('该企业为经营异常企业，需人工复核');
    }

    const in30Days = sorted.filter((o: any) =>
      o.status !== 7 && dayjs(o.created_at).isAfter(dayjs().subtract(30, 'day'))
    );

    if (in30Days.length >= 3) {
      riskPrompts.push(`近30天内提交 ${in30Days.length} 次开户申请，超出正常频次`);
    }

    if (!legalVerified && data.legal_id_card_no) {
      riskPrompts.push('法定代表人身份证号格式不正确');
    }
    if (!agentVerified && data.agent_id_card_no) {
      riskPrompts.push('经办人身份证号格式不正确');
    }

    if (data.legal_id_card_no && data.agent_id_card_no && data.legal_id_card_no === data.agent_id_card_no) {
      riskPrompts.push('法定代表人与经办人为同一人，建议核实授权关系');
    }

    const allowed = !isDishonest && riskPrompts.filter(p => p.includes('禁止')).length === 0;
    let blockReason: string | undefined;
    if (!allowed) {
      blockReason = riskPrompts.filter(p => p.includes('禁止') || p.includes('格式不正确')).join('；');
    }

    return {
      credit_code: data.credit_code,
      matched: allOpenings.length > 0,
      total_openings: totalOpenings,
      total_closed: totalClosed,
      total_abnormal: totalAbnormal,
      history_records: sorted.slice(0, 10).map((o: any) => ({
        opening_no: o.opening_no,
        account_type: o.account_type,
        status: o.status,
        created_at: o.created_at ? dayjs(o.created_at).format('YYYY-MM-DD HH:mm:ss') : '',
        target_org_name: o.target_org?.name
      })),
      is_dishonest: isDishonest,
      is_abnormal: isAbnormal,
      legal_verified: legalVerified,
      agent_verified: agentVerified,
      risk_prompts: riskPrompts,
      allowed,
      block_reason: blockReason
    };
  }

  getCorporateAccountConfig(): CorporateAccountConfig {
    const accountTypes = Object.keys(CORPORATE_ACCOUNT_CONFIG).map(type => ({
      type: Number(type),
      name: CORPORATE_ACCOUNT_TYPE_TEXT[Number(type)],
      description: CORPORATE_ACCOUNT_CONFIG[Number(type)].description,
      daily_limit: CORPORATE_ACCOUNT_CONFIG[Number(type)].daily_limit,
      single_limit: CORPORATE_ACCOUNT_CONFIG[Number(type)].single_limit,
      annual_fee: CORPORATE_ACCOUNT_CONFIG[Number(type)].annual_fee,
      permissions: CORPORATE_ACCOUNT_CONFIG[Number(type)].permissions,
      approval_level: CORPORATE_APPROVAL_LEVEL[Number(type)]
    }));

    return {
      account_types: accountTypes,
      risk_levels: RISK_LEVEL_TEXT,
      channels: CHANNEL_TEXT
    };
  }

  private convertToVO(opening: any): CorporateOpeningVO {
    const data: any = opening.toJSON ? opening.toJSON() : opening;
    let precheckReasons: any = data.precheck_reasons;
    if (typeof precheckReasons === 'string') {
      try { precheckReasons = JSON.parse(precheckReasons); } catch { precheckReasons = undefined; }
    }

    return {
      id: data.id,
      opening_no: data.opening_no,
      customer_id: data.customer_id,
      customer_no: data.customer_no,
      account_type: data.account_type,
      account_type_text: CORPORATE_ACCOUNT_TYPE_TEXT[data.account_type] || '未知',
      enterprise_name: data.enterprise_name,
      credit_code: data.credit_code,
      license_valid_from: data.license_valid_from ? dayjs(data.license_valid_from).format('YYYY-MM-DD') : undefined,
      license_valid_to: data.license_valid_to ? dayjs(data.license_valid_to).format('YYYY-MM-DD') : undefined,
      license_permanent: data.license_permanent,
      legal_representative: data.legal_representative,
      legal_id_card_no: data.legal_id_card_no,
      legal_verified: data.legal_verified,
      agent_name: data.agent_name,
      agent_id_card_no: data.agent_id_card_no,
      agent_mobile: data.agent_mobile,
      agent_verified: data.agent_verified,
      registered_address: data.registered_address,
      business_address: data.business_address,
      business_status: data.business_status,
      tax_registration_no: data.tax_registration_no,
      tax_info_consistent: data.tax_info_consistent,
      industry_type: data.industry_type,
      registered_capital: data.registered_capital,
      business_years: data.business_years,
      authorization_complete: data.authorization_complete,
      target_org_id: data.target_org_id,
      target_org_name: data.target_org?.name,
      open_purpose: data.open_purpose,
      supporting_materials: data.supporting_materials,
      approval_level: data.approval_level,
      risk_level: data.risk_level,
      risk_level_text: RISK_LEVEL_TEXT[data.risk_level] || '未知',
      risk_tags: data.risk_tags,
      channel_code: data.channel_code,
      channel_text: CHANNEL_TEXT[data.channel_code] || data.channel_code || '未知',
      status: data.status,
      status_text: CORPORATE_STATUS_TEXT[data.status] || '未知',
      precheck_result: data.precheck_result,
      precheck_reasons: precheckReasons,
      reject_reason: data.reject_reason,
      reviewer_id: data.reviewer_id,
      reviewer_name: data.reviewer?.real_name || data.reviewer?.username,
      submit_org_id: data.submit_org_id,
      submit_org_name: data.submit_org?.name,
      submitter_id: data.submitter_id,
      submitter_name: data.submitter?.real_name || data.submitter?.username,
      submit_time: data.submit_time ? dayjs(data.submit_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      review_time: data.review_time ? dayjs(data.review_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      account_id: data.account_id,
      account_no: data.account_no,
      is_dishonest: data.is_dishonest,
      is_abnormal: data.is_abnormal,
      is_paused: data.is_paused,
      is_isolated: data.is_isolated,
      isolate_reason: data.isolate_reason,
      remark: data.remark,
      created_at: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: data.updated_at ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }
}
