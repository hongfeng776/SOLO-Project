import { AccountOpeningRepository, CustomerRepository, AccountRepository, OrganizationRepository, UserRepository } from '../repositories';
import {
  PrecheckRequest, PrecheckResponse, PrecheckItemResult,
  CreateAccountOpeningRequest, UpdateAccountOpeningRequest, AccountOpeningQueryParams,
  AccountOpeningVO, AccountOpeningStatus, AccountOpeningStatusText,
  AccountTypeConfig, AccountTypeText,
  BatchImportRequest, BatchImportResultItem, BatchReviewRequest, BatchReviewResult,
  TraceCheckRequest, TraceCheckResponse
} from '../types';
import { AccountOpening, Account, Customer } from '../models';
import { isValidId, isValidMobile, isValidIdCard, throwNotFoundError, throwValidationError, throwBusinessError, throwForbiddenError } from '../utils';
import dayjs from 'dayjs';
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
  mobile: '手机银行',
  ebank: '网上银行',
  atm: '自助设备',
  phone: '电话银行',
  smart: '智慧柜员',
  pos: 'POS终端',
  wechat: '微信',
  alipay: '支付宝'
};

const BLACKLIST_ID_CARDS = ['110101199001011234', '310101199202028888'];
const BLACKLIST_MOBILES = ['13800138000', '13900139000'];

export class AccountOpeningService {
  private openingRepository: AccountOpeningRepository;
  private accountRepository: AccountRepository;
  private customerRepository: CustomerRepository;
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.openingRepository = new AccountOpeningRepository();
    this.accountRepository = new AccountRepository();
    this.customerRepository = new CustomerRepository();
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
  }

  private maskIdCard(id: string): string {
    if (!id || id.length < 8) return id || '';
    return id.slice(0, 4) + '*'.repeat(id.length - 8) + id.slice(-4);
  }

  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 7) return mobile || '';
    return mobile.slice(0, 3) + '****' + mobile.slice(-4);
  }

  async precheck(req: PrecheckRequest): Promise<PrecheckResponse> {
    const items: PrecheckItemResult[] = [];
    let overallScore = 100;
    const riskTags: string[] = [];
    let riskLevel = 0;

    if (!req.customer_name || req.customer_name.trim().length < 2) {
      items.push({ field: 'customer_name', passed: false, message: '客户姓名不能为空且至少2个字符', level: 'error' });
      overallScore -= 30;
    } else {
      items.push({ field: 'customer_name', passed: true, message: '姓名格式合规' });
    }

    if (!req.id_card_no || !isValidIdCard(req.id_card_no)) {
      items.push({ field: 'id_card_no', passed: false, message: '身份证号格式不正确', level: 'error' });
      overallScore -= 40;
    } else {
      items.push({ field: 'id_card_no', passed: true, message: '身份证号格式正确' });
    }

    if (!req.mobile || !isValidMobile(req.mobile)) {
      items.push({ field: 'mobile', passed: false, message: '手机号格式不正确', level: 'error' });
      overallScore -= 30;
    } else {
      items.push({ field: 'mobile', passed: true, message: '手机号格式正确' });
    }

    if (req.id_permanent !== 1) {
      if (!req.id_valid_to) {
        items.push({ field: 'id_valid_to', passed: false, message: '请填写身份证有效期止', level: 'error' });
        overallScore -= 20;
      } else if (dayjs(req.id_valid_to).isBefore(dayjs())) {
        items.push({ field: 'id_valid_to', passed: false, message: '身份证已过期', level: 'error' });
        overallScore -= 40;
        riskTags.push('身份证过期');
        riskLevel = Math.max(riskLevel, 3);
      } else {
        const daysLeft = dayjs(req.id_valid_to).diff(dayjs(), 'day');
        if (daysLeft < 90) {
          items.push({ field: 'id_valid_to', passed: true, message: `身份证将于 ${daysLeft} 天后到期，建议尽快更新`, level: 'warning' });
          riskTags.push('身份证即将过期');
          riskLevel = Math.max(riskLevel, 2);
        } else {
          items.push({ field: 'id_valid_to', passed: true, message: `身份证有效期正常（剩余 ${daysLeft} 天）` });
        }
      }
    } else {
      items.push({ field: 'id_valid_to', passed: true, message: '身份证为长期有效' });
    }

    if (req.id_card_no && BLACKLIST_ID_CARDS.includes(req.id_card_no)) {
      items.push({ field: 'id_card_no', passed: false, message: '该身份证在银行黑名单内，禁止开户', level: 'error' });
      overallScore -= 100;
      riskTags.push('黑名单客户');
      riskLevel = 5;
    }
    if (req.mobile && BLACKLIST_MOBILES.includes(req.mobile)) {
      items.push({ field: 'mobile', passed: false, message: '该手机号在银行黑名单内，禁止开户', level: 'error' });
      overallScore -= 100;
      riskTags.push('黑名单手机号');
      riskLevel = 5;
    }

    let customerId: string | undefined;
    let customerNo: string | undefined;
    let customerExists = false;

    if (req.id_card_no && isValidIdCard(req.id_card_no)) {
      const existingCustomer = await this.customerRepository.findByIdCardNo(req.id_card_no);
      if (existingCustomer) {
        customerExists = true;
        customerId = existingCustomer.id;
        customerNo = existingCustomer.customer_no;
        items.push({ field: 'customer_info', passed: true, message: `已匹配存量客户（${customerNo}），实名信息完整度校验通过` });

        if (existingCustomer.status === 0) {
          items.push({ field: 'customer_status', passed: false, message: '该客户账户已冻结，禁止开户', level: 'error' });
          overallScore -= 100;
          riskTags.push('客户冻结');
          riskLevel = 5;
        }
        if (existingCustomer.risk_level && existingCustomer.risk_level >= 4) {
          items.push({ field: 'customer_risk', passed: true, message: `客户风险等级为 ${RISK_LEVEL_TEXT[existingCustomer.risk_level]}，需要人工复核`, level: 'warning' });
          riskLevel = Math.max(riskLevel, existingCustomer.risk_level);
          riskTags.push(`客户风险等级${RISK_LEVEL_TEXT[existingCustomer.risk_level]}`);
        }
      } else {
        items.push({ field: 'customer_info', passed: true, message: '新客户，将在开户成功时自动创建客户档案', level: 'info' });
      }
    }

    if (req.id_card_no && isValidIdCard(req.id_card_no)) {
      const recentCount = await this.openingRepository.countRecentByIdCard(req.id_card_no, 30);
      if (recentCount >= 3) {
        items.push({ field: 'duplicate_check', passed: false, message: `该证件近30天内已提交 ${recentCount} 次开户申请，涉嫌重复开户`, level: 'error' });
        overallScore -= 50;
        riskLevel = Math.max(riskLevel, 4);
        riskTags.push('短期内重复开户');
      } else if (recentCount >= 1) {
        items.push({ field: 'duplicate_check', passed: true, message: `该证件近30天内已提交 ${recentCount} 次开户申请`, level: 'warning' });
        riskTags.push('近期开户记录');
      } else {
        items.push({ field: 'duplicate_check', passed: true, message: '近期无重复开户记录' });
      }
    }

    const passed = overallScore >= 60 && items.filter(i => i.level === 'error').length === 0;
    const requireManualReview = riskLevel >= 3 || !passed;
    let blockedReason: string | undefined;

    if (!passed) {
      const errors = items.filter(i => i.level === 'error').map(i => i.message);
      blockedReason = errors.join('；');
    }

    return {
      passed,
      overall_score: Math.max(0, overallScore),
      items,
      risk_level: riskLevel,
      risk_tags: riskTags,
      customer_exists: customerExists,
      customer_id: customerId,
      customer_no: customerNo,
      require_manual_review: requireManualReview,
      blocked_reason: blockedReason
    };
  }

  async createOpening(req: CreateAccountOpeningRequest, userId?: string, orgId?: string): Promise<AccountOpeningVO> {
    const precheck = await this.precheck({
      customer_name: req.customer_name,
      id_card_no: req.id_card_no,
      mobile: req.mobile,
      id_valid_from: req.id_valid_from,
      id_valid_to: req.id_valid_to,
      id_permanent: req.id_permanent,
      account_type: req.account_type,
      channel_code: req.channel_code
    });

    if (!precheck.passed) {
      throwBusinessError(`开户预检未通过：${precheck.blocked_reason || '请检查必填项'}`, 400, precheck.items);
    }

    if (![1, 2, 3].includes(req.account_type)) {
      throwValidationError('无效的账户类型');
    }

    if (orgId) {
      const org = await this.organizationRepository.findById(orgId);
      if (!org) {
        throwValidationError('无效的机构ID');
      }
    }

    let cust: Customer | null = null;
    if (precheck.customer_id) {
      cust = await this.customerRepository.findById(precheck.customer_id);
    }

    const openingNo = await this.openingRepository.generateOpeningNo();
    const typeConfig = AccountTypeConfig[req.account_type];
    const initialStatus = precheck.require_manual_review
      ? AccountOpeningStatus.PENDING_REVIEW
      : AccountOpeningStatus.FILLING;

    const opening = await this.openingRepository.create({
      opening_no: openingNo,
      customer_id: cust?.id,
      customer_no: cust?.customer_no,
      account_type: req.account_type,
      customer_name: req.customer_name,
      id_card_no: req.id_card_no,
      id_type: req.id_type || 1,
      id_valid_from: req.id_valid_from ? new Date(req.id_valid_from) : undefined,
      id_valid_to: req.id_valid_to ? new Date(req.id_valid_to) : undefined,
      id_permanent: req.id_permanent || 0,
      mobile: req.mobile,
      mobile_verified: req.mobile_verified || 2,
      residential_address: req.residential_address,
      residential_province_code: req.residential_province_code,
      target_org_id: req.target_org_id || orgId,
      target_org_province_code: req.target_org_province_code,
      region_matched: req.region_matched || 2,
      open_purpose: req.open_purpose,
      image_urls: req.image_urls,
      image_clarity_score: req.image_clarity_score,
      risk_level: precheck.risk_level,
      risk_tags: precheck.risk_tags.join(','),
      channel_code: req.channel_code || 'counter',
      status: initialStatus,
      precheck_result: 1,
      precheck_reasons: JSON.stringify(precheck.items),
      submit_org_id: orgId,
      submitter_id: userId,
      submit_time: new Date(),
      is_isolated: 0,
      remark: req.remark
    });

    return await this.getOpeningById(opening.id);
  }

  async updateOpening(id: string, req: UpdateAccountOpeningRequest, userId?: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (![0, 1, 2].includes(opening.status)) {
      throwBusinessError('当前申请状态不允许修改');
    }

    const updateData: any = {};
    const preservedFields = ['customer_name', 'id_card_no', 'id_type', 'id_valid_from', 'id_valid_to', 'id_permanent', 'account_type'];

    for (const key of Object.keys(req)) {
      if (preservedFields.includes(key)) continue;
      (updateData as any)[key] = (req as any)[key];
    }

    if (Object.keys(updateData).length > 0) {
      if (opening.status === AccountOpeningStatus.FILLING) {
        updateData.status = AccountOpeningStatus.PENDING_REVIEW;
      }
      await this.openingRepository.update(id, updateData);
    }

    return await this.getOpeningById(id);
  }

  async cancelOpening(id: string, userId?: string, remark?: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if ([5, 6, 7, 8].includes(opening.status)) {
      throwBusinessError('当前申请状态不允许取消');
    }

    const preservedData = {
      customer_name: opening.customer_name,
      id_card_no: opening.id_card_no,
      id_type: opening.id_type,
      id_valid_from: opening.id_valid_from,
      id_valid_to: opening.id_valid_to,
      id_permanent: opening.id_permanent,
      mobile: opening.mobile,
      customer_id: opening.customer_id,
      customer_no: opening.customer_no,
      account_type: opening.account_type
    };

    await this.openingRepository.update(id, {
      status: AccountOpeningStatus.CANCELLED,
      residential_address: null,
      residential_province_code: null,
      target_org_province_code: null,
      region_matched: null,
      open_purpose: null,
      image_urls: null,
      image_clarity_score: null,
      mobile_verified: 2,
      remark: remark || opening.remark
    });

    return await this.getOpeningById(id);
  }

  async reviewOpening(id: string, operation: 'approve' | 'reject', reviewerId: string, reason?: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.status !== AccountOpeningStatus.PENDING_REVIEW) {
      throwBusinessError('当前申请状态不允许复核');
    }

    if (operation === 'approve') {
      await this.openingRepository.update(id, {
        status: AccountOpeningStatus.REVIEW_PASSED,
        reviewer_id: reviewerId,
        review_time: new Date()
      });
    } else {
      await this.openingRepository.update(id, {
        status: AccountOpeningStatus.REJECTED,
        reviewer_id: reviewerId,
        review_time: new Date(),
        reject_reason: reason || '复核未通过'
      });
    }

    return await this.getOpeningById(id);
  }

  async openAccount(id: string, operatorId: string, orgId: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.status !== AccountOpeningStatus.REVIEW_PASSED && opening.status !== AccountOpeningStatus.FILLING) {
      throwBusinessError('当前申请状态不允许开户');
    }

    let customer = opening.customer_id ? await this.customerRepository.findById(opening.customer_id) : null;

    if (!customer) {
      customer = await this.customerRepository.create({
        customer_name: opening.customer_name,
        id_card_no: opening.id_card_no,
        customer_type: 1,
        customer_level: 1,
        risk_level: opening.risk_level,
        status: 1,
        org_id: orgId,
        mobile: opening.mobile,
        open_date: new Date()
      });
    }

    const accountNo = await this.accountRepository.generateAccountNo();
    const typeConfig = AccountTypeConfig[opening.account_type];

    const account = await this.accountRepository.create({
      account_no: accountNo,
      customer_id: customer.id,
      customer_no: customer.customer_no,
      account_type: opening.account_type,
      alias: `${AccountTypeText[opening.account_type]}账户`,
      currency: 'CNY',
      balance: 0,
      available_balance: 0,
      frozen_amount: 0,
      daily_limit: typeConfig.daily_limit,
      single_limit: typeConfig.single_limit,
      annual_fee: typeConfig.annual_fee,
      open_purpose: opening.open_purpose,
      function_permissions: typeConfig.permissions.join(','),
      open_org_id: orgId,
      open_operator_id: operatorId,
      status: 1,
      open_date: new Date(),
      opening_id: opening.id
    });

    await this.openingRepository.update(id, {
      status: AccountOpeningStatus.ACCOUNT_OPENED,
      customer_id: customer.id,
      customer_no: customer.customer_no,
      account_id: account.id,
      account_no: account.account_no
    });

    return await this.getOpeningById(id);
  }

  async getOpeningList(params: AccountOpeningQueryParams, userId?: string, orgId?: string, userRoles?: string[]): Promise<PaginatedResult<AccountOpeningVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where: any = this.openingRepository.buildQuery(queryParams);
    if (orgId && !userRoles?.includes('admin')) {
      where.submit_org_id = orgId;
    }

    const include = [
      this.openingRepository.getCustomerInclude(),
      this.openingRepository.getTargetOrgInclude(),
      this.openingRepository.getSubmitOrgInclude(),
      this.openingRepository.getSubmitterInclude(),
      this.openingRepository.getReviewerInclude()
    ];

    const result = await this.openingRepository.findPaginated(
      { page: page || 1, pageSize: pageSize || 10 },
      where,
      { sortBy: 'created_at', sortOrder: 'DESC' },
      { include }
    );

    const list: AccountOpeningVO[] = result.list.map((o: any) => this.convertToVO(o));
    return { ...result, list };
  }

  async getOpeningById(id: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id, {
      include: [
        this.openingRepository.getCustomerInclude(),
        this.openingRepository.getTargetOrgInclude(),
        this.openingRepository.getSubmitOrgInclude(),
        this.openingRepository.getSubmitterInclude(),
        this.openingRepository.getReviewerInclude()
      ]
    });
    if (!opening) throwNotFoundError('开户申请不存在');
    return this.convertToVO(opening);
  }

  async batchImport(req: BatchImportRequest, userId?: string, orgId?: string, userRoles?: string[]): Promise<BatchImportResultItem[]> {
    const results: BatchImportResultItem[] = [];

    for (let i = 0; i < req.items.length; i++) {
      const item = req.items[i];
      const result: BatchImportResultItem = {
        index: i,
        success: false,
        errors: [],
        warnings: []
      };

      try {
        if (!item.customer_name || item.customer_name.length < 2) {
          result.errors!.push('客户姓名不能为空');
        }
        if (!item.id_card_no || !isValidIdCard(item.id_card_no)) {
          result.errors!.push('身份证号格式错误');
        }
        if (!item.mobile || !isValidMobile(item.mobile)) {
          result.errors!.push('手机号格式错误');
        }
        if (![1, 2, 3].includes(item.account_type)) {
          result.errors!.push('账户类型无效');
        }

        if (item.id_card_no && BLACKLIST_ID_CARDS.includes(item.id_card_no)) {
          result.errors!.push('该身份证在黑名单内');
        }

        const precheck = await this.precheck({
          customer_name: item.customer_name,
          id_card_no: item.id_card_no,
          mobile: item.mobile,
          id_valid_from: item.id_valid_from,
          id_valid_to: item.id_valid_to,
          id_permanent: item.id_permanent,
          account_type: item.account_type,
          channel_code: item.channel_code
        });

        result.need_manual_review = precheck.require_manual_review;
        result.risk_level = precheck.risk_level;

        if (precheck.risk_level >= 4) {
          result.warnings!.push(`客户风险等级：${RISK_LEVEL_TEXT[precheck.risk_level]}，需人工复核`);
        }
        if (precheck.risk_tags.length > 0) {
          result.warnings!.push(`风险标签：${precheck.risk_tags.join('、')}`);
        }
        if (precheck.overall_score < 80) {
          result.warnings!.push(`综合评分：${precheck.overall_score} 分`);
        }

        if (result.errors!.length === 0) {
          let cust = precheck.customer_id ? await this.customerRepository.findById(precheck.customer_id) : null;

          if (item.open_purpose === 'investment' && precheck.risk_level >= 3) {
            result.need_manual_review = true;
            result.warnings!.push('投资用途+中高风险，触发差异化校验');
          }

          const openingNo = await this.openingRepository.generateOpeningNo();
          const status = precheck.require_manual_review || result.need_manual_review
            ? AccountOpeningStatus.PENDING_REVIEW
            : AccountOpeningStatus.FILLING;

          const opening = await this.openingRepository.create({
            opening_no: openingNo,
            customer_id: cust?.id,
            customer_no: cust?.customer_no,
            account_type: item.account_type,
            customer_name: item.customer_name,
            id_card_no: item.id_card_no,
            id_type: 1,
            id_valid_from: item.id_valid_from ? new Date(item.id_valid_from) : undefined,
            id_valid_to: item.id_valid_to ? new Date(item.id_valid_to) : undefined,
            id_permanent: item.id_permanent || 0,
            mobile: item.mobile,
            mobile_verified: 2,
            residential_address: item.residential_address,
            open_purpose: item.open_purpose,
            image_urls: item.image_urls,
            risk_level: precheck.risk_level,
            risk_tags: precheck.risk_tags.join(','),
            channel_code: item.channel_code || 'counter',
            status,
            precheck_result: 1,
            precheck_reasons: JSON.stringify(precheck.items),
            target_org_id: item.target_org_id || orgId,
            submit_org_id: orgId,
            submitter_id: userId,
            submit_time: new Date(),
            is_isolated: 0,
            remark: item.remark
          });

          result.success = true;
          result.opening_id = opening.id;
          result.opening_no = opening.opening_no;
          result.status = status;
        }
      } catch (e: any) {
        result.errors!.push(e.message || '系统错误');
      }

      results.push(result);
    }

    return results;
  }

  async batchReview(req: BatchReviewRequest, userId: string, userRoles?: string[]): Promise<BatchReviewResult> {
    const details: Array<{ id: string; success: boolean; message?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    const isAdmin = userRoles?.includes('admin');

    for (const id of req.ids) {
      try {
        if (req.operation === 'approve' && !isAdmin) {
          throwForbiddenError('仅管理员可批量通过预审');
        }

        if (req.operation === 'isolate') {
          await this.openingRepository.update(id, {
            is_isolated: 1,
            isolate_reason: req.reason || '批量异常隔离'
          });
        } else if (req.operation === 'deisolate') {
          await this.openingRepository.update(id, {
            is_isolated: 0,
            isolate_reason: null
          });
        } else if (req.operation === 'approve') {
          await this.reviewOpening(id, 'approve', userId, req.reason);
        } else if (req.operation === 'reject') {
          await this.reviewOpening(id, 'reject', userId, req.reason);
        }

        successCount++;
        details.push({ id, success: true });
      } catch (e: any) {
        failCount++;
        details.push({ id, success: false, message: e.message });
      }
    }

    return {
      success_count: successCount,
      fail_count: failCount,
      details
    };
  }

  async refreshOpening(id: string): Promise<AccountOpeningVO> {
    if (!isValidId(id)) throwValidationError('无效的申请ID');
    const opening = await this.openingRepository.findById(id);
    if (!opening) throwNotFoundError('开户申请不存在');

    if (opening.is_isolated === 1) {
      throwBusinessError('该数据已被隔离，无法刷新');
    }

    const precheck = await this.precheck({
      customer_name: opening.customer_name,
      id_card_no: opening.id_card_no,
      mobile: opening.mobile,
      account_type: opening.account_type,
      channel_code: opening.channel_code
    });

    await this.openingRepository.update(id, {
      risk_level: precheck.risk_level,
      risk_tags: precheck.risk_tags.join(','),
      precheck_result: precheck.passed ? 1 : 0,
      precheck_reasons: JSON.stringify(precheck.items)
    });

    return await this.getOpeningById(id);
  }

  async traceCheck(req: TraceCheckRequest): Promise<TraceCheckResponse> {
    if (!req.id_card_no || !isValidIdCard(req.id_card_no)) {
      throwValidationError('身份证号格式错误');
    }

    const recentOpenings = await this.openingRepository.findByIdCardNo(req.id_card_no);
    const sorted = recentOpenings.sort((a: any, b: any) =>
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );
    const in30Days = sorted.filter((o: any) =>
      o.status !== 7 && dayjs(o.created_at).isAfter(dayjs().subtract(30, 'day'))
    );
    const in7Days = in30Days.filter((o: any) => dayjs(o.created_at).isAfter(dayjs().subtract(7, 'day')));

    let duplicateRisk = false;
    let duplicateRiskReason: string | undefined;
    if (in7Days.length >= 2) {
      duplicateRisk = true;
      duplicateRiskReason = `近7天内提交 ${in7Days.length} 次开户申请，疑似重复开户`;
    } else if (in30Days.length >= 3) {
      duplicateRisk = true;
      duplicateRiskReason = `近30天内提交 ${in30Days.length} 次开户申请，超出正常频次`;
    }

    const clarityOk = true;
    const consistencyOk = true;
    const validityOk = !duplicateRisk;

    const details: string[] = [];
    if (!clarityOk) details.push('身份证影像清晰度不达标（建议分辨率≥300DPI）');
    if (!consistencyOk) details.push('客户姓名、证件号与实名信息不一致');
    if (!validityOk) details.push('身份证有效期异常或证件已过期');

    const allowed = !duplicateRisk && clarityOk && consistencyOk && validityOk;
    let blockReason: string | undefined;
    if (!allowed) {
      const reasons = [duplicateRiskReason].filter(Boolean).concat(details);
      blockReason = reasons.join('；');
    }

    return {
      id_card_no: req.id_card_no,
      matched: recentOpenings.length > 0,
      total_openings: recentOpenings.length,
      recent_openings: sorted.slice(0, 10).map((o: any) => ({
        opening_no: o.opening_no,
        account_type: o.account_type,
        status: o.status,
        created_at: o.created_at ? dayjs(o.created_at).format('YYYY-MM-DD HH:mm:ss') : '',
        target_org_name: (o as any).target_org?.name
      })),
      duplicate_risk: duplicateRisk,
      duplicate_risk_reason: duplicateRiskReason,
      image_checks: {
        clarity_ok: clarityOk,
        consistency_ok: consistencyOk,
        validity_ok: validityOk,
        details: details.length > 0 ? details : undefined
      },
      allowed,
      block_reason: blockReason
    };
  }

  private convertToVO(opening: AccountOpening): AccountOpeningVO {
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
      account_type_text: AccountTypeText[data.account_type] || '未知',
      customer_name: data.customer_name,
      id_card_no: data.id_card_no,
      id_masked: this.maskIdCard(data.id_card_no),
      id_type: data.id_type,
      id_valid_from: data.id_valid_from ? dayjs(data.id_valid_from).format('YYYY-MM-DD') : undefined,
      id_valid_to: data.id_valid_to ? dayjs(data.id_valid_to).format('YYYY-MM-DD') : undefined,
      id_permanent: data.id_permanent,
      mobile: data.mobile,
      mobile_masked: this.maskMobile(data.mobile),
      mobile_verified: data.mobile_verified,
      residential_address: data.residential_address,
      residential_province_code: data.residential_province_code,
      target_org_id: data.target_org_id,
      target_org_name: data.target_org?.name,
      target_org_province_code: data.target_org_province_code,
      region_matched: data.region_matched,
      region_matched_text: data.region_matched === 0 ? '不匹配' : data.region_matched === 1 ? '匹配' : '待核验',
      open_purpose: data.open_purpose,
      image_urls: data.image_urls,
      image_clarity_score: data.image_clarity_score,
      risk_level: data.risk_level,
      risk_level_text: RISK_LEVEL_TEXT[data.risk_level] || '未知',
      risk_tags: data.risk_tags,
      channel_code: data.channel_code,
      channel_text: CHANNEL_TEXT[data.channel_code] || data.channel_code || '未知',
      status: data.status,
      status_text: AccountOpeningStatusText[data.status] || '未知',
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
      is_isolated: data.is_isolated,
      isolate_reason: data.isolate_reason,
      remark: data.remark,
      created_at: data.created_at ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss') : undefined,
      updated_at: data.updated_at ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : undefined
    };
  }
}
