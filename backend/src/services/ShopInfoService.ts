import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op } from 'sequelize';
import { MerchantSettleStatus } from '../models/Merchant';
import { SHOP_STATUS_MAP } from '../models/ShopStatusChangeLog';
import { ShopOperationType } from '../models/ShopOperationLedger';
import { PageResult } from '../dao/BaseDao';

export interface ShopInfoUpdatePayload {
  merchant_id: number;
  shop_name?: string;
  shop_logo?: string;
  shop_banner?: string;
  shop_intro?: string;
  shop_category?: string;
  shop_sub_category?: string;
  shop_tags?: string;
  shop_province?: string;
  shop_city?: string;
  shop_district?: string;
  shop_address?: string;
  customer_service_phone?: string;
  customer_service_hours?: string;
}

export interface ShopInfoQueryParams {
  page?: number;
  pageSize?: number;
  shop_name?: string;
  shop_status?: number;
  shop_status_list?: number[];
  shop_level?: number;
  shop_level_list?: number[];
  shop_category?: string;
  open_duration_min?: number;
  open_duration_max?: number;
  settle_status?: number;
  startDate?: string;
  endDate?: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  sensitive_words?: string[];
  risk_level?: number;
}

const SHOP_NAME_REGEX = /^[\u4e00-\u9fa5A-Za-z0-9\-_·]{2,30}$/;
const CUSTOMER_SERVICE_PHONE_REGEX = /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/;
const SHOP_CATEGORY_ALLOWED = ['食品餐饮', '服装鞋帽', '数码电器', '美妆个护', '家居用品', '母婴用品', '医疗健康', '图书文娱', '运动户外', '其他'];

export const SHOP_FIELD_LABEL_MAP: Record<string, string> = {
  shop_name: '店铺名称',
  shop_logo: '店铺Logo',
  shop_banner: '店铺Banner',
  shop_intro: '店铺简介',
  shop_category: '店铺主营类目',
  shop_sub_category: '店铺二级类目',
  shop_tags: '店铺标签',
  shop_province: '店铺省份',
  shop_city: '店铺城市',
  shop_district: '店铺区县',
  shop_address: '详细地址',
  customer_service_phone: '客服电话',
  customer_service_hours: '客服工作时间',
};

export const CORE_SHOP_FIELDS = ['shop_name', 'shop_category', 'shop_sub_category', 'shop_intro'];

class ShopInfoService {
  private readonly merchantDao = daos.merchantDao;
  private readonly sensitiveWordDao = daos.sensitiveWordDao;
  private readonly shopInfoChangeLogDao = daos.shopInfoChangeLogDao;
  private readonly shopOperationLedgerDao = daos.shopOperationLedgerDao;

  validateShopName(name?: string): ValidationResult {
    if (!name) return { valid: false, message: '店铺名称不能为空' };
    if (name.length < 2 || name.length > 30) {
      return { valid: false, message: '店铺名称长度应为2-30个字符' };
    }
    if (!SHOP_NAME_REGEX.test(name)) {
      return { valid: false, message: '店铺名称只允许中文、英文、数字、横线(-)、下划线(_)和中点(·)' };
    }
    return { valid: true };
  }

  validateCustomerServicePhone(phone?: string): ValidationResult {
    if (!phone) return { valid: true };
    if (!CUSTOMER_SERVICE_PHONE_REGEX.test(phone)) {
      return { valid: false, message: '客服电话格式不正确（支持手机号或固定电话）' };
    }
    return { valid: true };
  }

  validateShopCategory(category?: string, _subCategory?: string): ValidationResult {
    if (!category) return { valid: false, message: '店铺主营类目不能为空' };
    if (!SHOP_CATEGORY_ALLOWED.includes(category)) {
      return { valid: false, message: `主营类目不合法，允许值：${SHOP_CATEGORY_ALLOWED.join('、')}` };
    }
    return { valid: true };
  }

  async detectSensitiveWords(text?: string): Promise<{ words: string[]; risk_level: number }> {
    if (!text) return { words: [], risk_level: 0 };
    const words = await this.sensitiveWordDao.findAll({ where: { status: 1 } as any });
    const hitWords: string[] = [];
    let maxRisk = 0;
    for (const w of words) {
      const word = (w as any).word;
      if (text.includes(word)) {
        hitWords.push(word);
        const lvl = (w as any).level || 1;
        if (lvl > maxRisk) maxRisk = lvl;
      }
    }
    return { words: hitWords, risk_level: maxRisk };
  }

  async checkShopNameUnique(shopName: string, excludeMerchantId?: number): Promise<ValidationResult> {
    const where: any = { shop_name: shopName };
    if (excludeMerchantId) where.id = { [Op.ne]: excludeMerchantId };
    const existing = await this.merchantDao.findOne(where);
    if (existing) {
      return { valid: false, message: `店铺名称 "${shopName}" 已被占用，请更换` };
    }
    return { valid: true };
  }

  checkCanModifyCoreInfo(merchant: any): ValidationResult {
    const settleStatus = merchant.settle_status;
    if (settleStatus !== MerchantSettleStatus.AUDIT_APPROVED) {
      return {
        valid: false,
        message: '您尚未通过资质审核，暂不支持修改店铺核心信息（店铺名称、类目、简介），请先完成资质审核',
      };
    }
    if (merchant.shop_status !== 1 && merchant.shop_status !== 2) {
      return {
        valid: false,
        message: `当前店铺状态为「${SHOP_STATUS_MAP[merchant.shop_status ?? 0] || '未知'}」，不允许修改店铺信息`,
      };
    }
    return { valid: true };
  }

  async validateAll(payload: ShopInfoUpdatePayload): Promise<{
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string; sensitive_words?: string[] }>;
  }> {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string; sensitive_words?: string[] }> = [];

    if (payload.shop_name) {
      const r1 = this.validateShopName(payload.shop_name);
      if (!r1.valid) errors.push({ field: 'shop_name', message: r1.message! });
      else {
        const r2 = await this.checkShopNameUnique(payload.shop_name, payload.merchant_id);
        if (!r2.valid) errors.push({ field: 'shop_name', message: r2.message! });
      }
      const sw = await this.detectSensitiveWords(payload.shop_name);
      if (sw.words.length > 0) {
        warnings.push({ field: 'shop_name', message: `店铺名称包含敏感词：${sw.words.join('、')}`, sensitive_words: sw.words });
      }
    }

    if (payload.customer_service_phone) {
      const r = this.validateCustomerServicePhone(payload.customer_service_phone);
      if (!r.valid) errors.push({ field: 'customer_service_phone', message: r.message! });
    }

    if (payload.shop_category) {
      const r = this.validateShopCategory(payload.shop_category, payload.shop_sub_category);
      if (!r.valid) errors.push({ field: 'shop_category', message: r.message! });
    }

    if (payload.shop_intro) {
      const sw = await this.detectSensitiveWords(payload.shop_intro);
      if (sw.words.length > 0) {
        warnings.push({ field: 'shop_intro', message: `店铺简介包含敏感词：${sw.words.join('、')}`, sensitive_words: sw.words });
      }
      if (payload.shop_intro.length > 500) {
        errors.push({ field: 'shop_intro', message: '店铺简介不能超过500个字符' });
      }
    }

    if (payload.shop_tags) {
      const sw = await this.detectSensitiveWords(payload.shop_tags);
      if (sw.words.length > 0) {
        warnings.push({ field: 'shop_tags', message: `店铺标签包含敏感词：${sw.words.join('、')}`, sensitive_words: sw.words });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async getShopInfo(merchantId: number): Promise<any> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) throw new AppError('商家不存在', 404);
    const m = (merchant as any).toJSON ? (merchant as any).toJSON() : { ...merchant };
    if (m.shop_open_date) {
      const diff = Math.floor((Date.now() - new Date(m.shop_open_date).getTime()) / (24 * 3600 * 1000));
      m.shop_operation_duration_days = Math.max(0, diff);
    }
    return m;
  }

  async getShopList(params: ShopInfoQueryParams): Promise<PageResult<any>> {
    const {
      page = 1, pageSize = 10, shop_name, shop_status, shop_status_list,
      shop_level, shop_level_list, shop_category, open_duration_min,
      open_duration_max, settle_status, startDate, endDate
    } = params;
    const where: any = {};
    if (shop_name) where.shop_name = { [Op.like]: `%${shop_name}%` };
    if (shop_status !== undefined) where.shop_status = shop_status;
    if (shop_status_list && shop_status_list.length > 0) where.shop_status = { [Op.in]: shop_status_list };
    if (shop_level !== undefined) where.shop_level = shop_level;
    if (shop_level_list && shop_level_list.length > 0) where.shop_level = { [Op.in]: shop_level_list };
    if (shop_category) where.shop_category = shop_category;
    if (settle_status !== undefined) where.settle_status = settle_status;
    if (startDate && endDate) {
      where.shop_open_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const result = await this.merchantDao.findPage({
      page, pageSize, where, order: [['shop_operation_duration_days', 'DESC']],
    });

    const list = result.list.map((m: any) => {
      const obj = (m as any).toJSON ? (m as any).toJSON() : { ...m };
      if (obj.shop_open_date) {
        obj.shop_operation_duration_days = Math.max(0, Math.floor((Date.now() - new Date(obj.shop_open_date).getTime()) / (24 * 3600 * 1000)));
      }
      if (open_duration_min !== undefined && obj.shop_operation_duration_days < open_duration_min) return null;
      if (open_duration_max !== undefined && obj.shop_operation_duration_days > open_duration_max) return null;
      return obj;
    }).filter(Boolean);

    return { ...result, list };
  }

  async updateShopInfo(payload: ShopInfoUpdatePayload, operatorId?: number, operatorName?: string): Promise<any> {
    const merchant = await this.merchantDao.findById(payload.merchant_id);
    if (!merchant) throw new AppError('商家不存在', 404);

    const canModify = this.checkCanModifyCoreInfo(merchant);
    if (!canModify.valid) {
      const hasCoreField = CORE_SHOP_FIELDS.some(f => (payload as any)[f] !== undefined && (payload as any)[f] !== (merchant as any)[f]);
      if (hasCoreField) throw new AppError(canModify.message || '不允许修改核心信息', 400);
    }

    const validateRes = await this.validateAll(payload);
    if (!validateRes.valid) {
      const first = validateRes.errors[0];
      throw new AppError(`${SHOP_FIELD_LABEL_MAP[first.field] || first.field}：${first.message}`, 400);
    }

    const transaction: Transaction = await sequelize.transaction();
    try {
      const updateData: any = {};
      const changeLogs: any[] = [];
      const warningsByField: Record<string, string[]> = {};
      for (const w of validateRes.warnings) {
        warningsByField[w.field] = w.sensitive_words || [];
      }

      for (const field of Object.keys(SHOP_FIELD_LABEL_MAP)) {
        const newValue = (payload as any)[field];
        if (newValue === undefined) continue;
        const oldValue = (merchant as any)[field];
        if (String(newValue) === String(oldValue ?? '')) continue;
        updateData[field] = newValue;
        changeLogs.push({
          merchant_id: payload.merchant_id,
          change_field: field,
          field_label: SHOP_FIELD_LABEL_MAP[field],
          value_before: oldValue,
          value_after: newValue,
          sensitive_words: warningsByField[field] || [],
          risk_level: warningsByField[field]?.length > 0 ? 2 : 0,
          change_source: operatorId ? 'platform' : 'merchant',
          operator_id: operatorId,
          operator_name: operatorName,
          change_reason: '店铺信息修改',
        });
      }

      if (Object.keys(updateData).length === 0) {
        return { changed: false, message: '没有需要更新的内容' };
      }

      await this.merchantDao.update(payload.merchant_id, updateData, { transaction });

      for (const log of changeLogs) {
        await this.shopInfoChangeLogDao.create(log, { transaction });
      }

      await this.shopOperationLedgerDao.create({
        merchant_id: payload.merchant_id,
        operation_type: ShopOperationType.UPDATE,
        operation_title: '店铺信息修改',
        operation_detail: `修改字段：${changeLogs.map(l => l.field_label).join('、')}`,
        operator_id: operatorId || 0,
        operator_name: operatorName || (merchant as any).name,
        operator_role: operatorId ? 'admin' : 'merchant',
        status_snapshot: {
          shop_status: (merchant as any).shop_status,
          shop_level: (merchant as any).shop_level,
        },
      }, { transaction });

      await transaction.commit();
      return {
        changed: true,
        change_count: changeLogs.length,
        warnings: validateRes.warnings,
        message: `店铺信息已更新，共修改${changeLogs.length}项${validateRes.warnings.length > 0 ? `，检测到${validateRes.warnings.length}个风险提示` : ''}`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const shopInfoService = new ShopInfoService();
export default ShopInfoService;
