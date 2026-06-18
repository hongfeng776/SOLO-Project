const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('../models/Merchant');
const MerchantInfoChangeLog = require('../models/MerchantInfoChangeLog');
const { ValidationError, PermissionError, BusinessError } = require('../utils/errors');

const OPERATION_PERMISSIONS = {
  BASIC_INFO_EDIT: ['admin', 'merchant_operator', 'senior_operator'],
  BUSINESS_TYPE_EDIT: ['admin', 'senior_operator'],
  CONTACT_EDIT: ['admin', 'merchant_operator', 'senior_operator'],
  SETTLEMENT_EDIT: ['admin', 'finance_operator', 'senior_operator'],
  STATUS_EDIT: ['admin', 'senior_operator'],
  BATCH_OPERATION: ['admin', 'senior_operator'],
  HIGH_RISK_EDIT: ['admin']
};

const CHANGE_TYPE_MAP = {
  BASIC: { type: 1, name: '基础工商信息', riskFields: ['name', 'unifiedCreditCode', 'legalPersonName', 'legalPersonIdCard'] },
  BUSINESS: { type: 2, name: '经营品类信息', riskFields: ['businessType', 'secondaryBusinessTypes', 'scope'] },
  CONTACT: { type: 3, name: '联系方式', riskFields: ['phone', 'settleBankAccount'] },
  SETTLEMENT: { type: 4, name: '结算信息', riskFields: ['settleBankAccount', 'settleBankName', 'settleAlipayAccount', 'settleWechatAccount', 'commissionRate', 'settleCycle'] },
  BUSINESS_STATUS: { type: 5, name: '经营状态', riskFields: ['businessStatus'] },
  OPERATION_STATUS: { type: 6, name: '运营状态', riskFields: ['operationStatus'] },
  TAGS: { type: 7, name: '商家标签', riskFields: ['merchantTags', 'merchantLevel'] },
  NOTICE: { type: 8, name: '公示信息', riskFields: ['publicNotice', 'publicIntroduction'] },
  BATCH: { type: 9, name: '批量更新', riskFields: [] }
};

const FIELD_LABEL_MAP = {
  name: '商家名称',
  shortName: '商家简称',
  englishName: '英文名称',
  brandName: '品牌名称',
  unifiedCreditCode: '统一社会信用代码',
  legalPersonName: '法人姓名',
  legalPersonIdCard: '法人身份证号',
  registeredCapital: '注册资本',
  establishDate: '成立日期',
  businessTermStart: '营业期限开始',
  businessTermEnd: '营业期限结束',
  scope: '经营范围',
  businessType: '主营品类',
  secondaryBusinessTypes: '兼营品类',
  merchantLevel: '商家星级',
  merchantTags: '商家标签',
  contact: '联系人',
  contactPosition: '联系人职位',
  phone: '联系电话',
  backupPhone: '备用电话',
  serviceHotline: '客服热线',
  email: '邮箱',
  address: '地址',
  province: '省份',
  city: '城市',
  district: '区县',
  addressDetail: '详细地址',
  settleAccountName: '结算账户名称',
  settleBankName: '开户银行',
  settleBankAccount: '银行账号',
  settleBankBranch: '开户支行',
  settleBankCode: '银行联行号',
  settleAlipayAccount: '支付宝账号',
  settleWechatAccount: '微信账号',
  settleCycle: '结算周期',
  settleThreshold: '起付金额',
  commissionRate: '佣金比例',
  depositAmount: '保证金',
  businessStatus: '经营状态',
  operationStatus: '运营状态',
  businessStartTime: '营业开始时间',
  businessEndTime: '营业结束时间',
  businessDays: '营业日',
  publicIntroduction: '商家简介',
  publicNotice: '公示公告',
  internalRemark: '内部备注',
  logoUrl: '商家Logo',
  bannerUrl: '商家Banner',
  lockReason: '锁定原因',
  unlockTime: '预计解锁时间'
};

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_CARD_REGEX = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
const CREDIT_CODE_REGEX = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
const BANK_ACCOUNT_REGEX = /^\d{16,22}$/;

class MerchantOpsService {
  static checkOperatorPermission(operator, permissionType) {
    if (!operator || !operator.role) {
      throw new PermissionError('未获取到操作人信息');
    }
    const allowedRoles = OPERATION_PERMISSIONS[permissionType];
    if (!allowedRoles.includes(operator.role)) {
      throw new PermissionError(`您没有${permissionType}操作权限`);
    }
    return true;
  }

  static checkBusinessStatusEditable(merchant, changeType) {
    if (merchant.operationStatus === 3) {
      throw new BusinessError('商家已永久锁定，不允许修改任何信息');
    }
    if (merchant.operationStatus === 2 && changeType !== 'OPERATION_STATUS') {
      throw new BusinessError('商家处于临时锁定状态，请先解锁后再修改信息');
    }
    if (merchant.settleStatus === 5 && changeType !== 'OPERATION_STATUS') {
      throw new BusinessError('商家入驻流程已锁定，不允许修改');
    }
    return true;
  }

  static checkFieldEditPermission(operator, fieldName, changeType) {
    const typeConfig = CHANGE_TYPE_MAP[changeType];
    if (typeConfig && typeConfig.riskFields.includes(fieldName)) {
      if (operator.role !== 'admin' && operator.role !== 'senior_operator') {
        throw new PermissionError(`核心字段【${FIELD_LABEL_MAP[fieldName] || fieldName}】仅管理员可修改`);
      }
    }
    return true;
  }

  static async validateFieldUniqueness(fieldName, value, excludeMerchantId = null) {
    const where = { [fieldName]: value };
    if (excludeMerchantId) {
      where.id = { [Op.ne]: excludeMerchantId };
    }
    const count = await Merchant.count({ where, paranoid: false });
    if (count > 0) {
      throw new ValidationError(`${FIELD_LABEL_MAP[fieldName] || fieldName}【${value}】已存在，请检查`);
    }
    return true;
  }

  static validateFieldFormat(fieldName, value) {
    if (!value) return true;
    const errors = [];
    switch (fieldName) {
      case 'phone':
      case 'backupPhone':
      case 'serviceHotline':
      case 'complaintHotline':
        if (!PHONE_REGEX.test(value)) {
          errors.push(`${FIELD_LABEL_MAP[fieldName]}格式不正确，应为11位手机号`);
        }
        break;
      case 'email':
        if (!EMAIL_REGEX.test(value)) {
          errors.push('邮箱格式不正确');
        }
        break;
      case 'legalPersonIdCard':
        if (!ID_CARD_REGEX.test(value)) {
          errors.push('身份证号格式不正确');
        }
        break;
      case 'unifiedCreditCode':
        if (!CREDIT_CODE_REGEX.test(value)) {
          errors.push('统一社会信用代码格式不正确（应为18位）');
        }
        break;
      case 'settleBankAccount':
      case 'settleBankCode':
        if (!BANK_ACCOUNT_REGEX.test(value)) {
          errors.push(`${FIELD_LABEL_MAP[fieldName]}格式不正确，应为16-22位数字`);
        }
        break;
      case 'commissionRate':
        if (value < 0 || value > 0.5) {
          errors.push('佣金比例应在0-50%之间');
        }
        break;
      case 'settleThreshold':
        if (value < 0) {
          errors.push('起付金额不能为负数');
        }
        break;
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static validateSettlementBinding(fields) {
    const errors = [];
    if (fields.settleBankAccount && !fields.settleBankName) {
      errors.push('修改银行账号必须同时提供开户银行');
    }
    if (fields.settleBankName && !fields.settleBankAccount) {
      errors.push('修改开户银行必须同时提供银行账号');
    }
    if (fields.settleAlipayAccount && fields.settleAlipayAccount === fields.phone) {
      errors.push('支付宝账号与联系电话相同，请确认是否本人账户');
    }
    if (fields.commissionRate && fields.merchantLevel) {
      const levelRateMap = { 1: 0.05, 2: 0.045, 3: 0.03, 4: 0.02, 5: 0.015 };
      const maxAllowedRate = levelRateMap[fields.merchantLevel] || 0.05;
      if (fields.commissionRate > maxAllowedRate) {
        errors.push(`【${fields.merchantLevel}星】商家最高佣金比例为${maxAllowedRate * 100}%`);
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static detectViolations(merchant, fields) {
    const violations = [];
    const warnings = [];
    if (fields.unifiedCreditCode && merchant.unifiedCreditCode && fields.unifiedCreditCode !== merchant.unifiedCreditCode) {
      violations.push('统一社会信用代码不允许随意变更，请走特殊审批流程');
    }
    if (fields.legalPersonIdCard && merchant.legalPersonIdCard && fields.legalPersonIdCard !== merchant.legalPersonIdCard) {
      warnings.push('法人身份证号变更，建议核验新法人授权证明');
    }
    if (fields.settleBankAccount && merchant.settleBankAccount && fields.settleBankAccount !== merchant.settleBankAccount) {
      warnings.push('银行账号变更，建议核验变更申请函');
    }
    if (fields.businessType && merchant.businessType && fields.businessType !== merchant.businessType) {
      warnings.push('主营品类变更，建议同步检查资质材料');
    }
    if (fields.businessTermEnd) {
      const endDate = new Date(fields.businessTermEnd);
      const now = new Date();
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        violations.push('营业期限已过期，请更新营业执照');
      } else if (diffDays < 30) {
        warnings.push(`营业期限将在${diffDays}天后到期，请及时续期`);
      }
    }
    if (fields.cooperationEndDate) {
      const endDate = new Date(fields.cooperationEndDate);
      const now = new Date();
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        violations.push('合作期限已过期，请续签合同');
      } else if (diffDays < 60) {
        warnings.push(`合作期限将在${diffDays}天后到期，请及时续签`);
      }
    }
    return { violations, warnings, riskLevel: violations.length > 0 ? 3 : warnings.length > 1 ? 2 : warnings.length === 1 ? 1 : 0 };
  }

  static async detectDuplicateInfo(fields, excludeMerchantId = null) {
    const duplicates = [];
    if (fields.unifiedCreditCode) {
      const count = await Merchant.count({
        where: { unifiedCreditCode: fields.unifiedCreditCode, id: { [Op.ne]: excludeMerchantId } },
        paranoid: false
      });
      if (count > 0) duplicates.push('统一社会信用代码重复，疑似重复入驻');
    }
    if (fields.phone) {
      const count = await Merchant.count({
        where: { phone: fields.phone, id: { [Op.ne]: excludeMerchantId } },
        paranoid: false
      });
      if (count > 0) duplicates.push('联系电话已被其他商家使用');
    }
    if (fields.settleBankAccount) {
      const count = await Merchant.count({
        where: { settleBankAccount: fields.settleBankAccount, id: { [Op.ne]: excludeMerchantId } },
        paranoid: false
      });
      if (count > 0) duplicates.push('银行账号已被其他商家使用');
    }
    return duplicates;
  }

  static async validateBasicInfo(merchantId, fields, operator) {
    const errors = [];
    for (const [key, value] of Object.entries(fields)) {
      try {
        this.checkFieldEditPermission(operator, key, 'BASIC');
        this.validateFieldFormat(key, value);
        if (['name', 'unifiedCreditCode'].includes(key)) {
          await this.validateFieldUniqueness(key, value, merchantId);
        }
      } catch (e) {
        errors.push(e.message);
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static async validateBusinessInfo(merchantId, fields, operator) {
    const errors = [];
    for (const [key, value] of Object.entries(fields)) {
      try {
        this.checkFieldEditPermission(operator, key, 'BUSINESS');
      } catch (e) {
        errors.push(e.message);
      }
    }
    if (fields.businessType && !['flight', 'hotel', 'tourism', 'car'].includes(fields.businessType)) {
      errors.push('主营品类不合法');
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static async validateContactInfo(merchantId, fields, operator) {
    const errors = [];
    for (const [key, value] of Object.entries(fields)) {
      try {
        this.checkFieldEditPermission(operator, key, 'CONTACT');
        this.validateFieldFormat(key, value);
        if (['phone'].includes(key)) {
          await this.validateFieldUniqueness(key, value, merchantId);
        }
      } catch (e) {
        errors.push(e.message);
      }
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static async validateSettlementInfo(merchantId, fields, merchant, operator) {
    const errors = [];
    for (const [key, value] of Object.entries(fields)) {
      try {
        this.checkFieldEditPermission(operator, key, 'SETTLEMENT');
        this.validateFieldFormat(key, value);
        if (['settleBankAccount'].includes(key)) {
          await this.validateFieldUniqueness(key, value, merchantId);
        }
      } catch (e) {
        errors.push(e.message);
      }
    }
    try {
      const allFields = { ...merchant.toJSON(), ...fields };
      this.validateSettlementBinding(allFields);
    } catch (e) {
      errors.push(e.message);
    }
    if (errors.length > 0) {
      throw new ValidationError(errors.join('；'));
    }
    return true;
  }

  static async createChangeLog(merchantId, changeType, fields, oldData, operator, ip = '', reason = '', remark = '') {
    const typeConfig = CHANGE_TYPE_MAP[changeType] || { type: 0, name: '未知' };
    const changeContent = {};
    for (const [key, newValue] of Object.entries(fields)) {
      const oldValue = oldData[key];
      const oldStr = typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue);
      const newStr = typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue);
      if (oldStr !== newStr) {
        changeContent[key] = {
          oldValue,
          newValue,
          label: FIELD_LABEL_MAP[key] || key,
          changed: true
        };
      }
    }
    const { violations, warnings, riskLevel } = this.detectViolations(oldData, fields);
    const duplicates = await this.detectDuplicateInfo(fields, merchantId);
    const detectInfo = { violations, warnings, duplicates };
    const log = await MerchantInfoChangeLog.create({
      merchantId,
      changeType: typeConfig.type,
      changeTypeName: typeConfig.name,
      changeContent,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      changeReason: reason,
      changeRemark: remark,
      ipAddress: ip,
      riskLevel,
      verifyStatus: violations.length > 0 || duplicates.length > 0 ? 0 : 1,
      verifyRemark: [...violations, ...duplicates].join('；') || null,
      detectInfo
    });
    return log;
  }

  static async updateMerchantInfo(merchantId, changeType, fields, operator, ip = '', reason = '', remark = '') {
    const t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ });
    try {
      const permissionMap = {
        BASIC: 'BASIC_INFO_EDIT',
        BUSINESS: 'BASIC_INFO_EDIT',
        CONTACT: 'CONTACT_EDIT',
        SETTLEMENT: 'SETTLEMENT_EDIT'
      };
      this.checkOperatorPermission(operator, permissionMap[changeType] || 'BASIC_INFO_EDIT');
      const merchant = await Merchant.findByPk(merchantId, { transaction: t });
      if (!merchant) throw new ValidationError('商家不存在');
      this.checkBusinessStatusEditable(merchant, changeType);
      const oldData = merchant.toJSON();
      const validateMap = {
        BASIC: this.validateBasicInfo.bind(this),
        BUSINESS: this.validateBusinessInfo.bind(this),
        CONTACT: this.validateContactInfo.bind(this),
        SETTLEMENT: this.validateSettlementInfo.bind(this)
      };
      const validateFn = validateMap[changeType];
      if (validateFn) await validateFn(merchantId, fields, merchant, operator);
      const updateFields = { ...fields, operatorId: operator.id, operatorName: operator.name, infoUpdateTime: new Date() };
      await merchant.update(updateFields, { transaction: t });
      await this.createChangeLog(merchantId, changeType, fields, oldData, operator, ip, reason, remark);
      await this.handleStatusChange(merchantId, fields, merchant, operator, t);
      await t.commit();
      return { success: true, merchant: await Merchant.findByPk(merchantId) };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async handleStatusChange(merchantId, fields, merchant, operator, transaction) {
    const changes = {};
    if (fields.operationStatus !== undefined && fields.operationStatus !== merchant.operationStatus) {
      if (fields.operationStatus === 2 || fields.operationStatus === 3) {
        changes.listingPermission = 0;
        changes.lockTime = new Date();
        await sequelize.query(
          `UPDATE products SET status = 0 WHERE merchantId = ?`,
          { replacements: [merchantId], transaction }
        );
        await sequelize.query(
          `UPDATE orders SET canFulfill = 0 WHERE merchantId = ? AND status IN (0, 1)`,
          { replacements: [merchantId], transaction }
        );
      } else if (fields.operationStatus === 1 && merchant.operationStatus !== 1) {
        changes.listingPermission = 1;
        changes.unlockTime = null;
      }
    }
    if (fields.businessStatus !== undefined && fields.businessStatus !== merchant.businessStatus) {
      if (fields.businessStatus === 0 || fields.businessStatus === 4) {
        changes.listingPermission = 0;
      }
    }
    if (Object.keys(changes).length > 0) {
      await Merchant.update(changes, { where: { id: merchantId }, transaction });
    }
    return true;
  }

  static async updateBusinessStatus(merchantId, status, reason, operator, ip = '') {
    const t = await sequelize.transaction();
    try {
      this.checkOperatorPermission(operator, 'STATUS_EDIT');
      const merchant = await Merchant.findByPk(merchantId, { transaction: t });
      if (!merchant) throw new ValidationError('商家不存在');
      if (![0, 1, 2, 3, 4].includes(status)) {
        throw new ValidationError('经营状态不合法');
      }
      const oldData = merchant.toJSON();
      const fields = { businessStatus: status, lockReason: reason || undefined };
      if (status === 2 || status === 3) {
        fields.lockReason = reason;
        fields.lockTime = new Date();
      } else if (status === 1) {
        fields.unlockTime = null;
      }
      await merchant.update(fields, { transaction: t });
      await this.handleStatusChange(merchantId, fields, merchant, operator, t);
      await this.createChangeLog(merchantId, 'BUSINESS_STATUS', fields, oldData, operator, ip, reason);
      await t.commit();
      return { success: true };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async updateOperationStatus(merchantId, status, reason, unlockTime, operator, ip = '') {
    const t = await sequelize.transaction();
    try {
      this.checkOperatorPermission(operator, 'STATUS_EDIT');
      const merchant = await Merchant.findByPk(merchantId, { transaction: t });
      if (!merchant) throw new ValidationError('商家不存在');
      if (merchant.merchantCategory === 2 && operator.role !== 'admin') {
        throw new PermissionError('高危商家运营状态变更需管理员操作');
      }
      if (![0, 1, 2, 3].includes(status)) {
        throw new ValidationError('运营状态不合法');
      }
      const oldData = merchant.toJSON();
      const fields = { operationStatus: status, lockReason: reason, unlockTime: unlockTime || undefined };
      if (status === 2 || status === 3) {
        fields.lockReason = reason;
        fields.lockTime = new Date();
      } else if (status === 1) {
        fields.unlockTime = null;
      }
      await merchant.update(fields, { transaction: t });
      await this.handleStatusChange(merchantId, fields, merchant, operator, t);
      await this.createChangeLog(merchantId, 'OPERATION_STATUS', fields, oldData, operator, ip, reason);
      await t.commit();
      return { success: true };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async batchUpdateTags(merchantIds, tags, operator, ip = '') {
    const t = await sequelize.transaction();
    const batchNo = `BATCH${Date.now()}`;
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };
    try {
      this.checkOperatorPermission(operator, 'BATCH_OPERATION');
      const highRiskMerchants = await Merchant.findAll({
        where: { id: { [Op.in]: merchantIds }, merchantCategory: 2 },
        transaction: t
      });
      if (highRiskMerchants.length > 0) {
        throw new BusinessError(`高危商家【${highRiskMerchants.map(m => m.name).join('、')}】禁止批量操作，请人工处理`);
      }
      const merchants = await Merchant.findAll({
        where: { id: { [Op.in]: merchantIds }, operationStatus: { [Op.ne]: 3 } },
        transaction: t
      });
      const lowLevelCount = merchants.filter(m => m.merchantLevel <= 2).length;
      if (lowLevelCount > 0 && operator.role !== 'admin') {
        results.skipped = lowLevelCount;
        results.errors.push(`${lowLevelCount}个低星级商家需管理员授权，已跳过`);
      }
      for (const merchant of merchants) {
        try {
          if (merchant.merchantLevel <= 2 && operator.role !== 'admin') continue;
          const oldData = merchant.toJSON();
          const fields = { merchantTags: tags };
          await merchant.update(fields, { transaction: t });
          await this.createChangeLog(merchant.id, 'TAGS', fields, oldData, operator, ip, '批量更新标签');
          await MerchantInfoChangeLog.update({ batchNo }, { where: { merchantId: merchant.id }, transaction: t });
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${merchant.name}: ${e.message}`);
        }
      }
      await t.commit();
      return { ...results, batchNo };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async batchUpdateNotice(merchantIds, notice, operator, ip = '') {
    const t = await sequelize.transaction();
    const batchNo = `BATCH${Date.now()}`;
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };
    try {
      this.checkOperatorPermission(operator, 'BATCH_OPERATION');
      const highRiskMerchants = await Merchant.findAll({
        where: { id: { [Op.in]: merchantIds }, merchantCategory: 2 },
        transaction: t
      });
      if (highRiskMerchants.length > 0) {
        throw new BusinessError(`高危商家【${highRiskMerchants.map(m => m.name).join('、')}】禁止批量操作`);
      }
      const merchants = await Merchant.findAll({
        where: { id: { [Op.in]: merchantIds }, operationStatus: { [Op.ne]: 3 } },
        transaction: t
      });
      for (const merchant of merchants) {
        try {
          const oldData = merchant.toJSON();
          const fields = { publicNotice: notice };
          await merchant.update(fields, { transaction: t });
          await this.createChangeLog(merchant.id, 'NOTICE', fields, oldData, operator, ip, '批量修正公示信息');
          await MerchantInfoChangeLog.update({ batchNo }, { where: { merchantId: merchant.id }, transaction: t });
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${merchant.name}: ${e.message}`);
        }
      }
      await t.commit();
      return { ...results, batchNo };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async batchLockAccounts(merchantIds, reason, operator, ip = '') {
    const t = await sequelize.transaction();
    const batchNo = `BATCH${Date.now()}`;
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };
    try {
      this.checkOperatorPermission(operator, 'BATCH_OPERATION');
      if (operator.role !== 'admin') {
        throw new PermissionError('批量锁定账号仅管理员可操作');
      }
      const merchants = await Merchant.findAll({
        where: { id: { [Op.in]: merchantIds }, operationStatus: { [Op.ne]: 3 } },
        transaction: t
      });
      for (const merchant of merchants) {
        try {
          if (merchant.merchantCategory === 2) {
            results.skipped++;
            results.errors.push(`${merchant.name}: 高危商家请人工专项核验锁定`);
            continue;
          }
          const oldData = merchant.toJSON();
          const fields = { operationStatus: 2, lockReason: reason, lockTime: new Date() };
          await merchant.update(fields, { transaction: t });
          await this.handleStatusChange(merchant.id, fields, merchant, operator, t);
          await this.createChangeLog(merchant.id, 'OPERATION_STATUS', fields, oldData, operator, ip, reason);
          await MerchantInfoChangeLog.update({ batchNo }, { where: { merchantId: merchant.id }, transaction: t });
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`${merchant.name}: ${e.message}`);
        }
      }
      await t.commit();
      return { ...results, batchNo };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  static async getChangeLogs(merchantId, params = {}) {
    const { page = 1, pageSize = 20, changeType, startDate, endDate, operatorId, riskLevel } = params;
    const where = { merchantId };
    if (changeType) where.changeType = changeType;
    if (operatorId) where.operatorId = operatorId;
    if (riskLevel !== undefined) where.riskLevel = riskLevel;
    if (startDate) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };
    const { count, rows } = await MerchantInfoChangeLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    return {
      total: count,
      list: rows,
      page: Number(page),
      pageSize: Number(pageSize)
    };
  }

  static async getCompleteTrace(merchantId) {
    const merchant = await Merchant.findByPk(merchantId, {
      include: [
        { association: 'infoChangeLogs', order: [['createdAt', 'DESC']], limit: 100 },
        { association: 'auditLogs', order: [['createdAt', 'DESC']], limit: 50 }
      ]
    });
    if (!merchant) throw new ValidationError('商家不存在');
    const infoCompleteness = this.calculateInfoCompleteness(merchant);
    const infoTimeliness = this.calculateInfoTimeliness(merchant);
    const infoCompliance = this.calculateInfoCompliance(merchant);
    return {
      merchant: merchant.toJSON(),
      infoCompleteness,
      infoTimeliness,
      infoCompliance,
      changeLogs: merchant.infoChangeLogs,
      auditLogs: merchant.auditLogs
    };
  }

  static calculateInfoCompleteness(merchant) {
    const requiredFields = [
      'name', 'unifiedCreditCode', 'legalPersonName', 'legalPersonIdCard',
      'businessType', 'contact', 'phone', 'address',
      'settleAccountName', 'settleBankName', 'settleBankAccount'
    ];
    const optionalFields = [
      'shortName', 'brandName', 'email', 'province', 'city', 'district', 'addressDetail',
      'logoUrl', 'publicIntroduction', 'scope', 'registeredCapital',
      'establishDate', 'businessTermStart', 'businessTermEnd'
    ];
    let score = 0;
    let total = requiredFields.length + optionalFields.length * 0.5;
    for (const field of requiredFields) {
      if (merchant[field]) score += 1;
    }
    for (const field of optionalFields) {
      if (merchant[field]) score += 0.5;
    }
    return {
      score: Math.round((score / total) * 100),
      requiredFilled: requiredFields.filter(f => merchant[f]).length,
      requiredTotal: requiredFields.length,
      optionalFilled: optionalFields.filter(f => merchant[f]).length,
      optionalTotal: optionalFields.length
    };
  }

  static calculateInfoTimeliness(merchant) {
    const issues = [];
    const now = new Date();
    if (merchant.businessTermEnd) {
      const endDate = new Date(merchant.businessTermEnd);
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) issues.push({ type: 'expired', field: 'businessTermEnd', message: '营业执照已过期', days: Math.abs(diffDays) });
      else if (diffDays < 30) issues.push({ type: 'warning', field: 'businessTermEnd', message: '营业执照即将到期', days: diffDays });
    }
    if (merchant.cooperationEndDate) {
      const endDate = new Date(merchant.cooperationEndDate);
      const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) issues.push({ type: 'expired', field: 'cooperationEndDate', message: '合作协议已过期', days: Math.abs(diffDays) });
      else if (diffDays < 60) issues.push({ type: 'warning', field: 'cooperationEndDate', message: '合作协议即将到期', days: diffDays });
    }
    if (merchant.infoUpdateTime) {
      const updateDate = new Date(merchant.infoUpdateTime);
      const diffDays = Math.ceil((now - updateDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 180) issues.push({ type: 'warning', field: 'infoUpdateTime', message: '信息超过180天未更新', days: diffDays });
    }
    return {
      score: Math.max(0, 100 - issues.filter(i => i.type === 'expired').length * 50 - issues.filter(i => i.type === 'warning').length * 10),
      issues
    };
  }

  static calculateInfoCompliance(merchant) {
    const issues = [];
    if (merchant.unifiedCreditCode && !CREDIT_CODE_REGEX.test(merchant.unifiedCreditCode)) {
      issues.push({ type: 'error', field: 'unifiedCreditCode', message: '统一社会信用代码格式不合法' });
    }
    if (merchant.legalPersonIdCard && !ID_CARD_REGEX.test(merchant.legalPersonIdCard)) {
      issues.push({ type: 'error', field: 'legalPersonIdCard', message: '法人身份证号格式不合法' });
    }
    if (merchant.phone && !PHONE_REGEX.test(merchant.phone)) {
      issues.push({ type: 'error', field: 'phone', message: '联系电话格式不合法' });
    }
    if (merchant.email && !EMAIL_REGEX.test(merchant.email)) {
      issues.push({ type: 'warning', field: 'email', message: '邮箱格式不合法' });
    }
    if (merchant.settleBankAccount && !BANK_ACCOUNT_REGEX.test(merchant.settleBankAccount)) {
      issues.push({ type: 'error', field: 'settleBankAccount', message: '银行账号格式不合法' });
    }
    return {
      score: Math.max(0, 100 - issues.filter(i => i.type === 'error').length * 30 - issues.filter(i => i.type === 'warning').length * 10),
      issues
    };
  }

  static async getOpsStats(params = {}) {
    const { businessType, merchantLevel, operationStatus } = params;
    const where = {};
    if (businessType) where.businessType = businessType;
    if (merchantLevel) where.merchantLevel = merchantLevel;
    if (operationStatus !== undefined) where.operationStatus = operationStatus;
    const stats = {
      total: await Merchant.count({ where }),
      normal: await Merchant.count({ where: { ...where, operationStatus: 1 } }),
      tempLocked: await Merchant.count({ where: { ...where, operationStatus: 2 } }),
      permanentlyLocked: await Merchant.count({ where: { ...where, operationStatus: 3 } }),
      abnormal: await Merchant.count({ where: { ...where, operationStatus: 0 } }),
      highRisk: await Merchant.count({ where: { ...where, merchantCategory: 2 } }),
      level5: await Merchant.count({ where: { ...where, merchantLevel: 5 } }),
      level4: await Merchant.count({ where: { ...where, merchantLevel: 4 } }),
      level3: await Merchant.count({ where: { ...where, merchantLevel: 3 } }),
      level2: await Merchant.count({ where: { ...where, merchantLevel: 2 } }),
      level1: await Merchant.count({ where: { ...where, merchantLevel: 1 } }),
      todayChanges: await MerchantInfoChangeLog.count({
        where: { createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),
      pendingVerify: await MerchantInfoChangeLog.count({ where: { verifyStatus: 2 } })
    };
    return stats;
  }
}

module.exports = MerchantOpsService;
