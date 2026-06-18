import { Op } from 'sequelize';
import customerAssetDAO from '@dao/CustomerAssetDAO';
import customerHoldingDAO from '@dao/CustomerHoldingDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';
import { Transaction } from 'sequelize';
import Trade from '@models/Trade';
import {
  CustomerType,
  FilingStatus,
  AccountStatus,
  ArchiveStatus,
} from '@enums/index';
import operationLogService from '@services/OperationLogService';

export interface IValidationError {
  field: string;
  message: string;
}

export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
}

export interface IBatchImportResult {
  total: number;
  success: number;
  failed: number;
  duplicate: number;
  successList: any[];
  errorList: Array<{ row: number; data: any; errors: IValidationError[]; type: string }>;
  duplicateList: any[];
}

const INDIVIDUAL_REQUIRED_FIELDS = ['customer_name', 'id_card', 'phone', 'customer_type'];
const INSTITUTION_REQUIRED_FIELDS = [
  'customer_name',
  'id_card',
  'institution_name',
  'unified_social_credit',
  'legal_representative',
  'legal_rep_id_card',
  'customer_type',
];
const FORMAL_ARCHIVE_REQUIRED_FIELDS_COMMON = [
  'risk_level',
  'initial_deposit',
  'trade_account_no',
];

function isValidIdCard(idCard: string): boolean {
  return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard);
}

function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

function isValidEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUnifiedSocialCredit(code: string): boolean {
  if (!code) return true;
  return /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(code);
}

function isValidMoney(amount: any): boolean {
  if (amount === undefined || amount === null) return true;
  const num = Number(amount);
  return !isNaN(num) && num >= 0;
}

function generateAssetAccountNo(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(100000 + Math.random() * 900000).toString();
  return `AST${dateStr}${random}`;
}

function generateTradeAccountNo(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(100000 + Math.random() * 900000).toString();
  return `TRD${dateStr}${random}`;
}

class CustomerAssetService {
  validateCustomerData(data: any, forFormalArchive: boolean = false): IValidationResult {
    const errors: IValidationError[] = [];
    const customerType = data.customer_type;

    if (!customerType) {
      errors.push({ field: 'customer_type', message: '客户类型不能为空' });
    } else if (![CustomerType.INDIVIDUAL, CustomerType.INSTITUTION].includes(customerType)) {
      errors.push({ field: 'customer_type', message: '客户类型无效' });
    }

    const requiredFields = customerType === CustomerType.INSTITUTION
      ? INSTITUTION_REQUIRED_FIELDS
      : INDIVIDUAL_REQUIRED_FIELDS;

    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === '') {
        errors.push({ field, message: '该字段为必填项' });
      }
    }

    if (forFormalArchive) {
      for (const field of FORMAL_ARCHIVE_REQUIRED_FIELDS_COMMON) {
        if (!data[field] && data[field] !== 0) {
          errors.push({ field, message: '正式建档必须填写该字段' });
        }
      }
    }

    if (data.id_card && !isValidIdCard(data.id_card)) {
      errors.push({ field: 'id_card', message: '身份证号码格式不正确' });
    }

    if (data.phone && !isValidPhone(data.phone)) {
      errors.push({ field: 'phone', message: '手机号码格式不正确' });
    }

    if (data.email && !isValidEmail(data.email)) {
      errors.push({ field: 'email', message: '邮箱格式不正确' });
    }

    if (customerType === CustomerType.INSTITUTION) {
      if (data.unified_social_credit && !isValidUnifiedSocialCredit(data.unified_social_credit)) {
        errors.push({ field: 'unified_social_credit', message: '统一社会信用代码格式不正确' });
      }
      if (data.legal_rep_id_card && !isValidIdCard(data.legal_rep_id_card)) {
        errors.push({ field: 'legal_rep_id_card', message: '法人身份证号码格式不正确' });
      }
    }

    if (!isValidMoney(data.initial_deposit)) {
      errors.push({ field: 'initial_deposit', message: '初始存款金额格式不正确' });
    }
    if (!isValidMoney(data.total_asset)) {
      errors.push({ field: 'total_asset', message: '总资产金额格式不正确' });
    }
    if (!isValidMoney(data.available_amount)) {
      errors.push({ field: 'available_amount', message: '可用金额格式不正确' });
    }

    return { valid: errors.length === 0, errors };
  }

  checkPreconditions(data: any): IValidationResult {
    const errors: IValidationError[] = [];

    if (data.filing_status && data.filing_status !== FilingStatus.FILED) {
      errors.push({ field: 'filing_status', message: '客户身份尚未完成备案，无法建档' });
    }

    if (data.account_status && data.account_status !== AccountStatus.OPENED) {
      errors.push({ field: 'account_status', message: '客户账户尚未开通，无法建档' });
    }

    return { valid: errors.length === 0, errors };
  }

  async getCustomerList(params: {
    page: number;
    pageSize: number;
    riskLevel?: string;
    customerType?: string;
    status?: string;
    archiveStatus?: string;
    filingStatus?: string;
    accountStatus?: string;
    keyword?: string;
  }) {
    const { page, pageSize, riskLevel, customerType, status, archiveStatus, filingStatus, accountStatus, keyword } = params;
    const where: any = {};

    if (riskLevel) where.risk_level = riskLevel;
    if (customerType) where.customer_type = customerType;
    if (status) where.status = status;
    if (archiveStatus) where.archive_status = archiveStatus;
    if (filingStatus) where.filing_status = filingStatus;
    if (accountStatus) where.account_status = accountStatus;

    if (keyword) {
      where[Op.or] = [
        { customer_name: { [Op.like]: `%${keyword}%` } },
        { id_card: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { asset_account_no: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await db.CustomerAsset.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getCustomerById(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    return customer;
  }

  async getByAssetAccountNo(assetAccountNo: string) {
    const customer = await db.CustomerAsset.findOne({ where: { asset_account_no: assetAccountNo } });
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    return customer;
  }

  async createCustomer(data: any, user?: { userId: number; username: string }) {
    const existing = await customerAssetDAO.findByIdCard(data.id_card);
    if (existing) {
      throw new AppError(409, '该身份证号已存在，重复建档');
    }

    const validation = this.validateCustomerData(data);
    if (!validation.valid) {
      throw new AppError(400, JSON.stringify(validation.errors));
    }

    const isFormal = data.archive_status === ArchiveStatus.FORMAL;
    if (isFormal) {
      const preconditionCheck = this.validateCustomerData(data, true);
      if (!preconditionCheck.valid) {
        throw new AppError(400, JSON.stringify(preconditionCheck.errors));
      }
    }

    let assetAccountNo = data.asset_account_no;
    if (!assetAccountNo) {
      while (true) {
        assetAccountNo = generateAssetAccountNo();
        const exists = await db.CustomerAsset.findOne({ where: { asset_account_no: assetAccountNo } });
        if (!exists) break;
      }
    }

    let tradeAccountNo = data.trade_account_no;
    if (!tradeAccountNo) {
      while (true) {
        tradeAccountNo = generateTradeAccountNo();
        const exists = await db.CustomerAsset.findOne({ where: { trade_account_no: tradeAccountNo } });
        if (!exists) break;
      }
    }

    const now = new Date();
    const createData: any = {
      ...data,
      asset_account_no: assetAccountNo,
      trade_account_no: tradeAccountNo,
      archive_status: isFormal ? ArchiveStatus.FORMAL : ArchiveStatus.TEMPORARY,
      filing_status: data.filing_status || FilingStatus.NOT_FILED,
      account_status: data.account_status || AccountStatus.NOT_OPENED,
      archive_time: isFormal ? now : null,
      temporary_expire_at: isFormal ? null : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      created_by: user?.userId,
      created_by_name: user?.username,
      last_modified_by: user?.userId,
      last_modified_by_name: user?.username,
      account_open_date: data.account_open_date || now.toISOString().split('T')[0],
    };

    const customer = await db.CustomerAsset.create(createData);

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '客户资产管理',
      operation: `创建客户${isFormal ? '正式' : '临时'}建档: ${customer.customer_name}`,
      operation_type: 'create',
      target_type: 'customer',
      target_id: customer.id,
      request_params: createData,
      operation_status: 'success',
      remark: `资产账户编号: ${assetAccountNo}`,
    });

    return customer;
  }

  async updateCustomer(id: number, data: any, user?: { userId: number; username: string }) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }

    if (data.id_card && data.id_card !== customer.id_card) {
      const existing = await customerAssetDAO.findByIdCard(data.id_card);
      if (existing && existing.id !== id) {
        throw new AppError(409, '该身份证号已被其他客户使用');
      }
    }

    const mergeData = { ...customer.toJSON(), ...data };
    const validation = this.validateCustomerData(mergeData);
    if (!validation.valid) {
      throw new AppError(400, JSON.stringify(validation.errors));
    }

    const now = new Date();
    const updateData: any = {
      ...data,
      last_modified_by: user?.userId,
      last_modified_by_name: user?.username,
    };

    const wasTemporary = customer.archive_status === ArchiveStatus.TEMPORARY;
    const becomeFormal = data.archive_status === ArchiveStatus.FORMAL && wasTemporary;

    if (becomeFormal) {
      const formalValidation = this.validateCustomerData(mergeData, true);
      if (!formalValidation.valid) {
        throw new AppError(400, JSON.stringify(formalValidation.errors));
      }
      updateData.archive_time = now;
      updateData.temporary_expire_at = null;
    }

    await db.CustomerAsset.update(updateData, { where: { id } });
    const updated = await db.CustomerAsset.findByPk(id);

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '客户资产管理',
      operation: `更新客户建档信息: ${customer.customer_name}${becomeFormal ? ' (转为正式建档)' : ''}`,
      operation_type: 'update',
      target_type: 'customer',
      target_id: id,
      request_params: updateData,
      operation_status: 'success',
    });

    return updated;
  }

  async convertToFormal(id: number, user?: { userId: number; username: string }) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    if (customer.archive_status === ArchiveStatus.FORMAL) {
      throw new AppError(400, '该客户已为正式建档状态');
    }

    return this.updateCustomer(id, { archive_status: ArchiveStatus.FORMAL }, user);
  }

  async expireTemporaryCustomers() {
    const now = new Date();
    const expired = await db.CustomerAsset.findAll({
      where: {
        archive_status: ArchiveStatus.TEMPORARY,
        temporary_expire_at: { [Op.lte]: now },
      },
    });

    const ids = expired.map((c) => c.id);
    if (ids.length > 0) {
      await db.CustomerAsset.update(
        { archive_status: ArchiveStatus.EXPIRED, status: 'closed' },
        { where: { id: { [Op.in]: ids } } },
      );
    }

    return { count: ids.length, ids };
  }

  async deleteCustomer(id: number, user?: { userId: number; username: string }) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    await db.CustomerAsset.destroy({ where: { id } });

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '客户资产管理',
      operation: `删除客户建档: ${customer.customer_name}`,
      operation_type: 'delete',
      target_type: 'customer',
      target_id: id,
      operation_status: 'success',
    });
  }

  async batchFreeze(ids: number[], user?: { userId: number; username: string }) {
    const customers = await db.CustomerAsset.findAll({ where: { id: { [Op.in]: ids } } });
    if (customers.length === 0) {
      throw new AppError(404, '未找到客户');
    }
    await db.CustomerAsset.update({ status: 'frozen' }, { where: { id: { [Op.in]: ids } } });

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '客户资产管理',
      operation: `批量冻结${customers.length}个客户`,
      operation_type: 'update',
      target_type: 'customer',
      request_params: { ids },
      operation_status: 'success',
    });
  }

  async batchImport(dataList: any[], user?: { userId: number; username: string }): Promise<IBatchImportResult> {
    const result: IBatchImportResult = {
      total: dataList.length,
      success: 0,
      failed: 0,
      duplicate: 0,
      successList: [],
      errorList: [],
      duplicateList: [],
    };

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      const rowNum = i + 1;

      try {
        const existing = await customerAssetDAO.findByIdCard(data.id_card);
        if (existing) {
          result.duplicate++;
          result.duplicateList.push({ row: rowNum, ...data, reason: '身份证号已存在' });
          continue;
        }

        const validation = this.validateCustomerData(data);
        if (!validation.valid) {
          result.failed++;
          result.errorList.push({ row: rowNum, data, errors: validation.errors, type: 'validation' });
          continue;
        }

        const customer = await this.createCustomer(data, user);
        result.success++;
        result.successList.push(customer);
      } catch (err: any) {
        result.failed++;
        result.errorList.push({
          row: rowNum,
          data,
          errors: [{ field: 'system', message: err.message || '系统错误' }],
          type: 'system',
        });
      }
    }

    await operationLogService.createLog({
      user_id: user?.userId,
      username: user?.username,
      module: '客户资产管理',
      operation: `批量导入客户建档: 共${result.total}条，成功${result.success}条，失败${result.failed}条，重复${result.duplicate}条`,
      operation_type: 'import',
      target_type: 'customer',
      request_params: { total: result.total, success: result.success, failed: result.failed, duplicate: result.duplicate },
      operation_status: 'success',
    });

    return result;
  }

  async getAuditTrail(id: number) {
    const customer = await db.CustomerAsset.findByPk(id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }

    const logs = await db.OperationLog.findAll({
      where: {
        target_type: 'customer',
        target_id: id,
      },
      order: [['created_at', 'DESC']],
    });

    return {
      customer,
      auditTrail: logs,
      sourceInfo: {
        createdBy: customer.created_by_name,
        createdAt: customer.created_at,
        archiveTime: customer.archive_time,
        lastModifiedBy: customer.last_modified_by_name,
        lastModifiedAt: customer.updated_at,
        sourceMaterials: customer.source_materials,
      },
    };
  }

  async freezeAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    const availableAmount = Number(customer.available_amount || 0);
    if (availableAmount < amount) {
      throw new AppError(400, '可用余额不足');
    }
    await db.CustomerAsset.update(
      {
        available_amount: Number((availableAmount - amount).toFixed(2)),
        frozen_amount: Number((Number(customer.frozen_amount || 0) + amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async unfreezeAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    const frozenAmount = Number(customer.frozen_amount || 0);
    if (frozenAmount < amount) {
      throw new AppError(400, '冻结金额不足');
    }
    await db.CustomerAsset.update(
      {
        available_amount: Number((Number(customer.available_amount || 0) + amount).toFixed(2)),
        frozen_amount: Number((frozenAmount - amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async deductFrozenAmount(customerId: number, amount: number, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }
    const frozenAmount = Number(customer.frozen_amount || 0);
    if (frozenAmount < amount) {
      throw new AppError(400, '冻结金额不足');
    }
    await db.CustomerAsset.update(
      {
        frozen_amount: Number((frozenAmount - amount).toFixed(2)),
      },
      { where: { id: customerId }, transaction: t },
    );
  }

  async updateAfterTrade(trade: Trade, t?: Transaction) {
    const customer = await db.CustomerAsset.findByPk(trade.customer_id);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }

    const holdings = await customerHoldingDAO.findByCustomerId(trade.customer_id);
    const totalMarketValue = holdings.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
    const totalFrozenAmount = Number(customer.frozen_amount || 0);
    const totalAvailableAmount = Number(customer.available_amount || 0);
    const totalCost = holdings.reduce((sum, h) => sum + Number(h.total_cost || 0), 0);

    const newTotalAsset = Number((totalMarketValue + totalFrozenAmount + totalAvailableAmount).toFixed(2));
    const newTotalProfit = Number((newTotalAsset - totalCost).toFixed(2));

    await db.CustomerAsset.update(
      {
        total_asset: newTotalAsset,
        total_profit: newTotalProfit,
        total_cost: Number(totalCost.toFixed(2)),
      },
      { where: { id: trade.customer_id }, transaction: t },
    );
  }

  async calculateRiskLevel(customerId: number) {
    const customer = await db.CustomerAsset.findByPk(customerId);
    if (!customer) {
      throw new AppError(404, '客户不存在');
    }

    let score = 0;

    const totalAsset = Number(customer.total_asset || 0);
    if (totalAsset >= 1000000) score += 30;
    else if (totalAsset >= 500000) score += 25;
    else if (totalAsset >= 100000) score += 20;
    else if (totalAsset >= 50000) score += 15;
    else score += 10;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTrades = await db.Trade.findAndCountAll({
      where: {
        customer_id: customerId,
        created_at: { [Op.gte]: thirtyDaysAgo },
        trade_status: 'success',
      },
    });
    const tradeCount = recentTrades.count;
    if (tradeCount >= 50) score += 30;
    else if (tradeCount >= 30) score += 25;
    else if (tradeCount >= 15) score += 20;
    else if (tradeCount >= 5) score += 15;
    else score += 10;

    const holdings = await customerHoldingDAO.findByCustomerId(customerId);
    let concentrationScore = 10;
    if (totalAsset > 0) {
      const top3 = holdings.slice(0, 3);
      const top3MarketValue = top3.reduce((sum, h) => sum + Number(h.market_value || 0), 0);
      const top3Ratio = top3MarketValue / totalAsset;
      if (top3Ratio <= 0.3) concentrationScore = 30;
      else if (top3Ratio <= 0.5) concentrationScore = 25;
      else if (top3Ratio <= 0.7) concentrationScore = 20;
      else concentrationScore = 10;
    }
    score += concentrationScore;

    let riskLevel = 'R1';
    if (score >= 80) riskLevel = 'R5';
    else if (score >= 65) riskLevel = 'R4';
    else if (score >= 50) riskLevel = 'R3';
    else if (score >= 35) riskLevel = 'R2';

    await db.CustomerAsset.update({ risk_level: riskLevel }, { where: { id: customerId } });

    return { riskLevel, score };
  }
}

export default new CustomerAssetService();
