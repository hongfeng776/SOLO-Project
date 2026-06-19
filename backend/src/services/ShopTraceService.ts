import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Op } from 'sequelize';
import {
  ShopStatus, SHOP_STATUS_MAP, SHOP_STATUS_SOURCE_MAP,
} from '../models/ShopStatusChangeLog';
import {
  SHOP_OPERATION_TYPE_MAP,
} from '../models/ShopOperationLedger';
import { MERCHANT_SETTLE_STATUS_MAP, MerchantSettleStatus } from '../models/Merchant';
import { SHOP_FIELD_LABEL_MAP } from './ShopInfoService';

export interface ShopFullTraceResult {
  merchant: any;
  info_change_logs: any[];
  status_change_logs: any[];
  operation_ledgers: any[];
  timeline: any[];
  compliance_check: {
    is_compliant: boolean;
    issues: Array<{ level: 'low' | 'medium' | 'high'; field: string; message: string }>;
  };
}

export interface ShopUniquenessCheckResult {
  is_unique: boolean;
  duplicates: Array<{ field: string; value: string; merchant_ids: number[]; merchant_names: string[] }>;
}

class ShopTraceService {
  private readonly merchantDao = daos.merchantDao;
  private readonly shopInfoChangeLogDao = daos.shopInfoChangeLogDao;
  private readonly shopStatusChangeLogDao = daos.shopStatusChangeLogDao;
  private readonly shopOperationLedgerDao = daos.shopOperationLedgerDao;
  private readonly sensitiveWordDao = daos.sensitiveWordDao;

  async getFullTrace(merchantId: number): Promise<ShopFullTraceResult> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) throw new AppError('商家不存在', 404);

    const m = (merchant as any).toJSON ? (merchant as any).toJSON() : { ...merchant };
    m.shop_status_text = SHOP_STATUS_MAP[m.shop_status ?? 1] || '';
    m.settle_status_text = MERCHANT_SETTLE_STATUS_MAP[m.settle_status ?? 0] || '';
    if (m.shop_open_date) {
      m.shop_operation_duration_days = Math.max(0, Math.floor((Date.now() - new Date(m.shop_open_date).getTime()) / (24 * 3600 * 1000)));
    }

    const infoLogs = await this.shopInfoChangeLogDao.findByMerchantId(merchantId);
    const statusLogs = await this.shopStatusChangeLogDao.findByMerchantId(merchantId);
    const ledgers = await this.shopOperationLedgerDao.findByMerchantId(merchantId);

    const infoLogsFormatted = infoLogs.map(l => ({
      ...(l as any).toJSON ? (l as any).toJSON() : { ...l },
      field_label_text: SHOP_FIELD_LABEL_MAP[(l as any).change_field] || (l as any).change_field,
    }));

    const statusLogsFormatted = statusLogs.map(l => ({
      ...(l as any).toJSON ? (l as any).toJSON() : { ...l },
      status_before_text: SHOP_STATUS_MAP[(l as any).status_before ?? 1],
      status_after_text: SHOP_STATUS_MAP[(l as any).status_after ?? 1],
      status_source_text: SHOP_STATUS_SOURCE_MAP[(l as any).status_source] || (l as any).status_source,
    }));

    const ledgersFormatted = ledgers.map(l => ({
      ...(l as any).toJSON ? (l as any).toJSON() : { ...l },
      operation_type_text: SHOP_OPERATION_TYPE_MAP[(l as any).operation_type] || (l as any).operation_type,
    }));

    const compliance = await this.checkCompliance(m);

    const timeline = this.buildTimeline(infoLogsFormatted, statusLogsFormatted, ledgersFormatted);

    return {
      merchant: m,
      info_change_logs: infoLogsFormatted,
      status_change_logs: statusLogsFormatted,
      operation_ledgers: ledgersFormatted,
      timeline,
      compliance_check: compliance,
    };
  }

  private buildTimeline(infoLogs: any[], statusLogs: any[], ledgers: any[]): any[] {
    const events: any[] = [];
    for (const log of infoLogs) {
      events.push({
        time: log.created_at,
        type: 'info_change',
        title: `修改信息：${log.field_label_text || log.change_field}`,
        detail: log,
        level: (log.risk_level && log.risk_level >= 2) ? 'warning' : 'primary',
      });
    }
    for (const log of statusLogs) {
      events.push({
        time: log.created_at,
        type: 'status_change',
        title: `状态变更：${log.status_before_text} → ${log.status_after_text}`,
        detail: log,
        level: log.status_after === ShopStatus.NORMAL ? 'success' : log.status_after === ShopStatus.BANNED ? 'danger' : 'warning',
      });
    }
    for (const ledger of ledgers) {
      events.push({
        time: ledger.created_at,
        type: 'operation',
        title: ledger.operation_title,
        detail: ledger,
        level: 'info',
      });
    }
    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return events;
  }

  async checkCompliance(merchant: any): Promise<{ is_compliant: boolean; issues: Array<{ level: 'low' | 'medium' | 'high'; field: string; message: string }> }> {
    const issues: Array<{ level: 'low' | 'medium' | 'high'; field: string; message: string }> = [];

    if (!merchant.shop_name) issues.push({ level: 'high', field: 'shop_name', message: '未设置店铺名称' });
    if (!merchant.shop_category) issues.push({ level: 'high', field: 'shop_category', message: '未设置店铺主营类目' });
    if (!merchant.shop_logo) issues.push({ level: 'medium', field: 'shop_logo', message: '未上传店铺Logo' });
    if (!merchant.shop_intro || merchant.shop_intro.length < 20) issues.push({ level: 'low', field: 'shop_intro', message: '店铺简介内容较少，建议完善以提高店铺可信度' });
    if (!merchant.customer_service_phone) issues.push({ level: 'medium', field: 'customer_service_phone', message: '未设置客服电话' });

    if (merchant.shop_open_date) {
      const dur = Math.floor((Date.now() - new Date(merchant.shop_open_date).getTime()) / (24 * 3600 * 1000));
      if (dur < 7 && merchant.shop_level && merchant.shop_level > 2) {
        issues.push({ level: 'high', field: 'shop_level', message: '开店时长不足7天但店铺等级偏高，疑似异常配置' });
      }
    }

    if (merchant.shop_status !== ShopStatus.NORMAL && merchant.settle_status === MerchantSettleStatus.AUDIT_APPROVED) {
      issues.push({ level: 'medium', field: 'shop_status', message: `当前店铺状态为「${SHOP_STATUS_MAP[merchant.shop_status]}」，但资质审核已通过` });
    }

    const fieldsToCheck = ['shop_name', 'shop_intro', 'shop_tags'];
    const sensitiveWords = await this.sensitiveWordDao.findAll({ where: { status: 1 } as any });
    for (const field of fieldsToCheck) {
      const text = merchant[field];
      if (!text) continue;
      for (const w of sensitiveWords) {
        const word = (w as any).word;
        if (String(text).includes(word)) {
          issues.push({
            level: (w as any).level >= 3 ? 'high' : 'medium',
            field,
            message: `${SHOP_FIELD_LABEL_MAP[field]}包含敏感词：${word}`,
          });
        }
      }
    }

    return { is_compliant: issues.length === 0, issues };
  }

  async checkShopUniqueness(shopName?: string, customerServicePhone?: string, excludeId?: number): Promise<ShopUniquenessCheckResult> {
    const duplicates: ShopUniquenessCheckResult['duplicates'] = [];
    if (shopName) {
      const where: any = { shop_name: shopName };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found.length > 0) {
        duplicates.push({
          field: 'shop_name',
          value: shopName,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
        });
      }
    }
    if (customerServicePhone) {
      const where: any = { customer_service_phone: customerServicePhone };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const found = await this.merchantDao.findAll({ where } as any);
      if (found.length > 1) {
        duplicates.push({
          field: 'customer_service_phone',
          value: customerServicePhone,
          merchant_ids: found.map(m => (m as any).id),
          merchant_names: found.map(m => (m as any).name),
        });
      }
    }
    return { is_unique: duplicates.length === 0, duplicates };
  }

  async checkCrossCategoryViolation(merchantId: number): Promise<{ violation: boolean; message?: string; matched_goods?: any[] }> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) throw new AppError('商家不存在', 404);
    const category = (merchant as any).shop_category;
    if (!category) return { violation: false };
    const matched: any[] = [];
    return { violation: matched.length > 0, matched_goods: matched, message: matched.length > 0 ? `检测到${matched.length}件商品跨类目经营` : undefined };
  }
}

export const shopTraceService = new ShopTraceService();
export default ShopTraceService;
