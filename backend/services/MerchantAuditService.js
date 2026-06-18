const BaseService = require('./BaseService');
const Merchant = require('../models/Merchant');
const MerchantQualification = require('../models/MerchantQualification');
const MerchantAuditLog = require('../models/MerchantAuditLog');
const { Op, QueryTypes } = require('sequelize');
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error');
const { sequelize } = require('../config/db');

const AUDIT_ACTION = {
  SUBMIT: 'submit',
  AUDIT_PASS: 'audit_pass',
  AUDIT_REJECT: 'audit_reject',
  AUDIT_TEMPORARY: 'audit_temporary',
  REVISE: 'revise',
  FINAL_PASS: 'final_pass',
  FINAL_REJECT: 'final_reject',
  EXPIRE: 'expire',
  AUTO_RESET: 'auto_reset',
  DETECT_VIOLATION: 'detect_violation'
};

const ACTION_LABELS = {
  submit: '提交入驻申请',
  audit_pass: '审核通过',
  audit_reject: '审核驳回',
  audit_temporary: '审核暂存',
  revise: '信息修正',
  final_pass: '终审通过',
  final_reject: '终审驳回',
  expire: '审核过期',
  auto_reset: '自动重置审核状态',
  detect_violation: '违规检测拦截'
};

const BUSINESS_TYPE_CATEGORY_REQUIREMENTS = {
  flight: ['business_license', 'operation_permit', 'authorization', 'legal_person', 'flight_permit'],
  hotel: ['business_license', 'operation_permit', 'authorization', 'legal_person', 'hotel_permit'],
  tourism: ['business_license', 'operation_permit', 'authorization', 'legal_person', 'ticket_permit'],
  car: ['business_license', 'operation_permit', 'authorization', 'legal_person', 'car_permit']
};

const CATEGORY_NAMES = {
  business_license: '营业执照',
  operation_permit: '经营资质证书',
  authorization: '品牌授权证明',
  legal_person: '法人身份证明',
  flight_permit: '航空运营许可证/航司代理资质',
  hotel_permit: '特种行业许可证/卫生许可证',
  ticket_permit: '旅行社业务经营许可证/景区授权',
  car_permit: '道路运输经营许可证/车辆营运证'
};

class MerchantAuditService extends BaseService {
  constructor() {
    super(Merchant);
  }

  async checkAuditorPermission(operator) {
    if (!operator || !operator.id) {
      throw new ForbiddenError('审核人员未登录');
    }
    const allowedRoles = ['admin', 'merchant_auditor', 'senior_auditor'];
    if (!allowedRoles.includes(operator.role)) {
      throw new ForbiddenError('当前用户无商家资质审核权限');
    }
    return true;
  }

  async validateBusinessType(businessType) {
    const validTypes = ['flight', 'hotel', 'tourism', 'car'];
    if (!validTypes.includes(businessType)) {
      throw new ValidationError(`无效的商家入驻品类: ${businessType}，请选择机票/酒店/文旅/租车中的一种`);
    }
    return true;
  }

  async validateQualificationCompleteness(merchantId, businessType) {
    const requiredCategories = BUSINESS_TYPE_CATEGORY_REQUIREMENTS[businessType] || [];
    const qualifications = await MerchantQualification.findAll({
      where: { merchantId },
      raw: true
    });

    const existingCategories = new Set(qualifications.map(q => q.category));
    const missingCategories = requiredCategories.filter(cat => !existingCategories.has(cat));
    const incompleteItems = [];
    const expiredItems = [];

    for (const q of qualifications) {
      const issues = [];
      if (!q.fileUrl && !q.licenseNo) {
        issues.push('文件或证照编号缺失');
      }
      if (q.isExpired) {
        expiredItems.push({
          id: q.id,
          name: q.name || CATEGORY_NAMES[q.category] || q.category,
          category: q.category,
          reason: '资质已过期'
        });
      }
      if (q.expiryDate && new Date(q.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        issues.push('资质即将到期(30天内)');
      }
      if (issues.length > 0) {
        incompleteItems.push({
          id: q.id,
          name: q.name || CATEGORY_NAMES[q.category] || q.category,
          category: q.category,
          issues
        });
      }
    }

    return {
      complete: missingCategories.length === 0 && expiredItems.length === 0,
      missingCategories: missingCategories.map(cat => ({
        category: cat,
        name: CATEGORY_NAMES[cat] || cat
      })),
      incompleteItems,
      expiredItems,
      qualifications
    };
  }

  async detectViolations(merchantId, businessType) {
    const violations = [];
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      throw new NotFoundError('商家不存在');
    }

    if (merchant.unifiedCreditCode) {
      const duplicateMerchant = await Merchant.findOne({
        where: {
          unifiedCreditCode: merchant.unifiedCreditCode,
          id: { [Op.ne]: merchantId }
        },
        paranoid: false
      });
      if (duplicateMerchant) {
        violations.push({
          type: 'duplicate_settlement',
          level: 'high',
          reason: `统一社会信用代码重复，与商家「${duplicateMerchant.name}」(ID:${duplicateMerchant.id})疑似重复入驻`
        });
      }
    }

    if (merchant.legalPersonIdCard) {
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(merchant.legalPersonIdCard)) {
        violations.push({
          type: 'fake_legal_person',
          level: 'high',
          reason: '法人身份证号格式异常，疑似虚假信息'
        });
      }
    }

    if (merchant.unifiedCreditCode) {
      const uccRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
      if (!uccRegex.test(merchant.unifiedCreditCode)) {
        violations.push({
          type: 'fake_license',
          level: 'high',
          reason: '统一社会信用代码格式异常，疑似虚假营业执照'
        });
      }
    }

    const qualifications = await MerchantQualification.findAll({ where: { merchantId } });
    for (const q of qualifications) {
      if (q.expiryDate && new Date(q.expiryDate) < new Date()) {
        violations.push({
          type: 'expired_qualification',
          level: 'medium',
          qualificationId: q.id,
          reason: `${q.name || CATEGORY_NAMES[q.category] || '资质材料'}已过期`
        });
      }
      if (q.effectiveDate && new Date(q.effectiveDate) > new Date()) {
        violations.push({
          type: 'not_effective',
          level: 'medium',
          qualificationId: q.id,
          reason: `${q.name || CATEGORY_NAMES[q.category] || '资质材料'}尚未生效`
        });
      }
    }

    const merchantScope = (merchant.scope || '').toLowerCase();
    const typeScopeMap = {
      flight: ['航空', '机票', '客运', '代理', '旅游'],
      hotel: ['住宿', '酒店', '宾馆', '旅馆', '民宿'],
      tourism: ['旅游', '旅行社', '景区', '票务', '门票'],
      car: ['租车', '汽车租赁', '运输', '车辆', '客运']
    };
    const requiredKeywords = typeScopeMap[businessType] || [];
    const scopeMatch = requiredKeywords.some(kw => merchantScope.includes(kw));
    if (merchantScope && !scopeMatch && requiredKeywords.length > 0) {
      violations.push({
        type: 'out_of_scope',
        level: 'medium',
        reason: `营业执照经营范围「${merchant.scope}」与入驻品类「${businessType}」不匹配，涉嫌超范围入驻`
      });
    }

    const authQualification = qualifications.find(q => q.category === 'authorization');
    if (authQualification && authQualification.expiryDate) {
      const now = new Date();
      const expiry = new Date(authQualification.expiryDate);
      const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        violations.push({
          type: 'authorization_expired',
          level: 'high',
          qualificationId: authQualification.id,
          reason: '品牌授权已过期，授权层级失效'
        });
      }
    }

    return {
      hasViolation: violations.length > 0,
      highRiskCount: violations.filter(v => v.level === 'high').length,
      mediumRiskCount: violations.filter(v => v.level === 'medium').length,
      lowRiskCount: violations.filter(v => v.level === 'low').length,
      violations
    };
  }

  async getQualificationAuditConfig(businessType) {
    const baseConfig = [
      { category: 'business_license', name: '营业执照', requiredFields: ['licenseNo', 'legalPerson', 'scope', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity', 'scope_match'] },
      { category: 'operation_permit', name: '经营资质证书', requiredFields: ['licenseNo', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity'] },
      { category: 'authorization', name: '品牌授权证明', requiredFields: ['scope', 'effectiveDate', 'expiryDate'], checks: ['validity', 'authorization_level'] },
      { category: 'legal_person', name: '法人信息', requiredFields: ['legalPerson', 'legalPersonIdCard'], checks: ['idcard_format', 'consistency'] }
    ];

    const typeSpecificConfig = {
      flight: [{ category: 'flight_permit', name: '航空运营资质', requiredFields: ['licenseNo', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity', 'scope_match'] }],
      hotel: [{ category: 'hotel_permit', name: '酒店特种行业许可', requiredFields: ['licenseNo', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity'] }],
      tourism: [{ category: 'ticket_permit', name: '文旅经营许可', requiredFields: ['licenseNo', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity', 'scope_match'] }],
      car: [{ category: 'car_permit', name: '车辆运营资质', requiredFields: ['licenseNo', 'effectiveDate', 'expiryDate'], checks: ['format', 'validity'] }]
    };

    return [...baseConfig, ...(typeSpecificConfig[businessType] || [])];
  }

  async performBranchAudit(merchantId, businessType, qualificationResults) {
    const config = await this.getQualificationAuditConfig(businessType);
    const qualifications = await MerchantQualification.findAll({ where: { merchantId }, raw: true });
    const qMap = {};
    qualifications.forEach(q => { qMap[q.category] = q; });
    const auditDetails = [];
    let allPassed = true;

    for (const cfg of config) {
      const q = qMap[cfg.category];
      const result = {
        category: cfg.category,
        name: cfg.name,
        provided: !!q,
        passed: true,
        issues: [],
        qualificationId: q?.id
      };

      if (!q) {
        result.passed = false;
        result.issues.push('缺失资质材料');
        allPassed = false;
      } else {
        for (const field of cfg.requiredFields) {
          if (!q[field] && field !== 'scope') {
            result.passed = false;
            result.issues.push(`缺少字段: ${field}`);
          }
        }
        if (q.expiryDate && new Date(q.expiryDate) < new Date()) {
          result.passed = false;
          result.issues.push('资质已过期');
        }
        if (q.effectiveDate && new Date(q.effectiveDate) > new Date()) {
          result.passed = false;
          result.issues.push('资质尚未生效');
        }
        if (qualificationResults && qualificationResults[q.id] !== undefined) {
          result.auditorOverride = qualificationResults[q.id];
          result.passed = qualificationResults[q.id] === 1;
          if (!result.passed) {
            result.issues.push('审核人员判定不合格');
          }
        }
        if (!result.passed) allPassed = false;
      }
      auditDetails.push(result);
    }

    return { passed: allPassed, auditDetails };
  }

  async preAuditCheck(merchantId, operator) {
    await this.checkAuditorPermission(operator);
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) throw new NotFoundError('商家不存在');
    await this.validateBusinessType(merchant.businessType);
    const completeness = await this.validateQualificationCompleteness(merchantId, merchant.businessType);
    const violations = await this.detectViolations(merchantId, merchant.businessType);
    return { merchant, completeness, violations };
  }

  async createAuditLog(data) {
    return await MerchantAuditLog.create({
      ...data,
      actionLabel: ACTION_LABELS[data.action] || data.action
    });
  }

  async submitAudit(merchantId, operator, { qualificationResults = {}, remark = '', type = 'pass' }) {
    const { merchant, completeness, violations } = await this.preAuditCheck(merchantId, operator);

    if (type === 'pass' && !completeness.complete) {
      throw new ValidationError({
        message: '资质材料不完整，无法通过审核',
        data: { missingCategories: completeness.missingCategories, expiredItems: completeness.expiredItems }
      });
    }

    const branchAudit = await this.performBranchAudit(merchantId, merchant.businessType, qualificationResults);
    const failedItems = branchAudit.auditDetails.filter(d => !d.passed);

    if (type === 'pass' && failedItems.length > 0) {
      throw new ValidationError({
        message: '存在未通过的资质审核项，请修正后再提交通过',
        data: { failedItems }
      });
    }

    const t = await sequelize.transaction();
    try {
      const oldStatus = merchant.auditStatus;
      let newStatus;
      let action;
      let settleStatus = merchant.settleStatus;
      let businessPermission = merchant.businessPermission || {};
      let listingPermission = merchant.listingPermission;
      let settledAt = merchant.settledAt;

      if (type === 'pass') {
        if (violations.hasViolation && violations.highRiskCount > 0) {
          throw new ValidationError({
            message: '检测到高风险违规项，禁止审核通过，请先处理违规问题',
            data: violations
          });
        }
        if (merchant.auditLevel === 2) {
          newStatus = 1;
          action = AUDIT_ACTION.FINAL_PASS;
          settleStatus = 4;
          businessPermission = {
            ...businessPermission,
            [merchant.businessType]: true,
            allCategories: (businessPermission.allCategories || []).concat([merchant.businessType])
          };
          listingPermission = 1;
          settledAt = new Date();
        } else {
          newStatus = 6;
          action = AUDIT_ACTION.AUDIT_PASS;
          settleStatus = 3;
        }
      } else if (type === 'reject') {
        newStatus = 2;
        action = AUDIT_ACTION.AUDIT_REJECT;
        settleStatus = 5;
      } else if (type === 'temporary') {
        newStatus = 4;
        action = AUDIT_ACTION.AUDIT_TEMPORARY;
      } else {
        throw new ValidationError('无效的审核类型');
      }

      await merchant.update({
        auditStatus: newStatus,
        settleStatus,
        businessPermission,
        listingPermission,
        settledAt,
        rejectReason: type === 'reject' ? remark : merchant.rejectReason,
        auditLevel: type === 'pass' && merchant.auditLevel === 1 ? 2 : merchant.auditLevel
      }, { transaction: t });

      for (const qr of Object.entries(qualificationResults)) {
        const [qid, result] = qr;
        const related = branchAudit.auditDetails.find(d => String(d.qualificationId) === String(qid));
        if (related) {
          await MerchantQualification.update({
            auditResult: result,
            auditRemark: related.issues.join('; ')
          }, { where: { id: qid }, transaction: t });
        }
      }

      const qualificationSnapshot = await MerchantQualification.findAll({
        where: { merchantId },
        raw: true,
        attributes: ['id', 'category', 'name', 'licenseNo', 'auditResult', 'auditRemark', 'effectiveDate', 'expiryDate'],
        transaction: t
      });

      await this.createAuditLog({
        merchantId,
        action,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        oldStatus,
        newStatus,
        businessType: merchant.businessType,
        remark,
        detectInfo: violations,
        qualificationSnapshot,
        detail: JSON.stringify({ branchAudit, completeness }),
        riskLevel: violations.highRiskCount > 0 ? 3 : (violations.mediumRiskCount > 0 ? 2 : (violations.violations.length > 0 ? 1 : 0))
      }, { transaction: t });

      await t.commit();
      return { merchant, branchAudit, violations };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async batchAudit(operator, { ids, type, remark = '', qualificationResultsMap = {} }) {
    await this.checkAuditorPermission(operator);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要批量审核的商家');
    }

    const merchants = await Merchant.findAll({ where: { id: { [Op.in]: ids } } });
    if (merchants.length !== ids.length) {
      const foundIds = merchants.map(m => m.id);
      const missing = ids.filter(id => !foundIds.includes(id));
      throw new ValidationError(`部分商家不存在: ${missing.join(', ')}`);
    }

    const highRiskIds = merchants.filter(m => m.merchantCategory === 2).map(m => m.id);
    if (highRiskIds.length > 0) {
      throw new ValidationError({
        message: `选中商家包含高危行业商家（ID: ${highRiskIds.join(', ')}），禁止批量审核，请进行人工专项核验`,
        data: { highRiskIds }
      });
    }

    const invalidStatusIds = merchants.filter(m => ![0, 3, 4, 7].includes(m.auditStatus)).map(m => m.id);
    if (invalidStatusIds.length > 0) {
      throw new ValidationError({
        message: `部分商家状态不允许审核（ID: ${invalidStatusIds.join(', ')}）`,
        data: { invalidStatusIds }
      });
    }

    const results = { successCount: 0, failCount: 0, failedItems: [], successItems: [] };

    for (const merchant of merchants) {
      try {
        const qResults = qualificationResultsMap[merchant.id] || {};
        await this.submitAudit(merchant.id, operator, {
          qualificationResults: qResults,
          remark,
          type
        });
        results.successCount++;
        results.successItems.push({ id: merchant.id, name: merchant.name });
      } catch (err) {
        results.failCount++;
        results.failedItems.push({ id: merchant.id, name: merchant.name, reason: err.message });
      }
    }

    return results;
  }

  async checkAndResetExpiredAudits() {
    const now = new Date();
    const expiredMerchants = await Merchant.findAll({
      where: {
        auditStatus: { [Op.in]: [0, 3, 6] },
        auditExpireTime: { [Op.lt]: now }
      }
    });

    const results = [];
    for (const merchant of expiredMerchants) {
      const oldStatus = merchant.auditStatus;
      await merchant.update({
        auditStatus: 0,
        auditLevel: 1,
        settleStatus: 2
      });
      const log = await this.createAuditLog({
        merchantId: merchant.id,
        action: AUDIT_ACTION.AUTO_RESET,
        oldStatus,
        newStatus: 0,
        businessType: merchant.businessType,
        remark: '审核过期，自动重置为待审核状态',
        riskLevel: 0
      });
      results.push({ id: merchant.id, name: merchant.name, logId: log.id });
    }

    return { resetCount: results.length, results };
  }

  async getAuditTrace(merchantId, params = {}) {
    const { pageNum = 1, pageSize = 20 } = params;
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await MerchantAuditLog.findAndCountAll({
      where: { merchantId },
      offset,
      limit: pageSize,
      order: [['id', 'DESC']]
    });

    return { list: rows, total: count, pageNum, pageSize };
  }

  async getAuditDetail(merchantId) {
    const merchant = await Merchant.findByPk(merchantId, {
      include: [
        { model: MerchantQualification, as: 'qualifications' },
        { model: MerchantAuditLog, as: 'auditLogs', limit: 50, order: [['id', 'DESC']] }
      ]
    });

    if (!merchant) throw new NotFoundError('商家不存在');

    const completeness = await this.validateQualificationCompleteness(merchantId, merchant.businessType);
    const violations = await this.detectViolations(merchantId, merchant.businessType);
    const branchAudit = await this.performBranchAudit(merchantId, merchant.businessType, {});

    return {
      merchant,
      qualifications: merchant.qualifications,
      auditLogs: merchant.auditLogs,
      completeness,
      violations,
      branchAudit
    };
  }

  async getPendingAuditList(params = {}) {
    const {
      pageNum = 1, pageSize = 10, businessType, auditStatus, keyword,
      merchantCategory, auditLevel, dateRange
    } = params;
    const offset = (pageNum - 1) * pageSize;
    const where = {};

    if (businessType) where.businessType = businessType;
    if (auditStatus !== undefined && auditStatus !== null && auditStatus !== '') where.auditStatus = auditStatus;
    if (merchantCategory) where.merchantCategory = merchantCategory;
    if (auditLevel) where.auditLevel = auditLevel;

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { contact: { [Op.like]: `%${keyword}%` } },
        { unifiedCreditCode: { [Op.like]: `%${keyword}%` } }
      ];
    }

    if (dateRange && dateRange.startTime) {
      where.auditSubmitTime = where.auditSubmitTime || {};
      where.auditSubmitTime[Op.gte] = new Date(dateRange.startTime);
    }
    if (dateRange && dateRange.endTime) {
      where.auditSubmitTime = where.auditSubmitTime || {};
      where.auditSubmitTime[Op.lte] = new Date(dateRange.endTime);
    }

    where.settleStatus = { [Op.in]: [1, 2, 3, 5, 7] };

    const { count, rows } = await Merchant.findAndCountAll({
      where,
      include: [{ model: MerchantQualification, as: 'qualifications', attributes: ['id', 'category', 'name', 'auditResult'] }],
      offset,
      limit: pageSize,
      order: [['auditSubmitTime', 'ASC NULLS LAST'], ['id', 'DESC']]
    });

    return { list: rows, total: count, pageNum, pageSize };
  }
}

module.exports = new MerchantAuditService();
