import { daos } from '../dao';
import { MarketingProductAdmissionLog } from '../models/MarketingProductAdmissionLog';
import { MarketingProduct } from '../models/MarketingProduct';
import { PageOptions, PageResult } from '../dao/BaseDao';

const {
  marketingProductDao,
  marketingProductAdmissionLogDao,
  marketingDao,
  goodsDao,
  merchantDao,
  marketingAdmissionRuleDao,
} = daos;

export interface AdmissionTraceData {
  basicInfo: MarketingProduct | null;
  goodsInfo: any;
  marketingInfo: any;
  merchantInfo: any;
  admissionLogs: MarketingProductAdmissionLog[];
  ruleMatchDetails: any[];
  applyInfo: {
    applyTime?: Date;
    applySource?: string;
  };
  auditInfo: {
    auditUserId?: number;
    auditUserName?: string;
    auditTime?: Date;
    auditRemark?: string;
    auditStatus?: number;
  };
  activityRecords: any[];
}

export class MarketingProductTraceService {
  async getTraceData(marketingProductId: number): Promise<AdmissionTraceData> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    const [goods, marketing, merchant, logs] = await Promise.all([
      marketingProduct.goods_id ? goodsDao.findById(marketingProduct.goods_id) : null,
      marketingDao.findById(marketingProduct.marketing_id),
      marketingProduct.merchant_id ? merchantDao.findById(marketingProduct.merchant_id) : null,
      marketingProductAdmissionLogDao.findByMarketingProductId(marketingProductId),
    ]);

    const ruleMatchDetails = this.extractRuleMatchDetails(logs);
    const activityRecords = this.extractActivityRecords(logs);

    return {
      basicInfo: marketingProduct,
      goodsInfo: goods || null,
      marketingInfo: marketing || null,
      merchantInfo: merchant || null,
      admissionLogs: logs,
      ruleMatchDetails,
      applyInfo: {
        applyTime: marketingProduct.apply_time,
        applySource: '商家报名',
      },
      auditInfo: {
        auditUserId: marketingProduct.audit_user_id,
        auditTime: marketingProduct.audit_time,
        auditRemark: marketingProduct.audit_remark,
        auditStatus: marketingProduct.admission_status,
      },
      activityRecords,
    };
  }

  private extractRuleMatchDetails(logs: MarketingProductAdmissionLog[]): any[] {
    const applyLog = logs.find(log => log.action === 'apply');
    if (!applyLog || !applyLog.rule_match_detail) {
      return [];
    }

    try {
      return Array.isArray(applyLog.rule_match_detail)
        ? applyLog.rule_match_detail
        : JSON.parse(applyLog.rule_match_detail as unknown as string);
    } catch {
      return [];
    }
  }

  private extractActivityRecords(logs: MarketingProductAdmissionLog[]): any[] {
    return logs
      .filter(log => ['audit_pass', 'audit_reject', 'offline', 'online', 'remove'].includes(log.action))
      .map(log => ({
        id: log.id,
        action: log.action,
        actionLabel: this.getActionLabel(log.action),
        operatorName: log.operator_name,
        operatorType: log.operator_type,
        oldStatus: log.old_status,
        newStatus: log.new_status,
        remark: log.remark,
        createdAt: log.created_at,
      }));
  }

  private getActionLabel(action: string): string {
    const labelMap: Record<string, string> = {
      apply: '报名',
      audit_pass: '审核通过',
      audit_reject: '审核驳回',
      offline: '下架',
      online: '上架',
      remove: '移除',
      rule_match: '规则匹配',
    };
    return labelMap[action] || action;
  }

  async getAdmissionLogs(
    marketingProductId: number,
    pageOptions: PageOptions
  ): Promise<PageResult<MarketingProductAdmissionLog>> {
    return marketingProductAdmissionLogDao.findPage({
      ...pageOptions,
      where: { marketing_product_id: marketingProductId },
      order: [['created_at', 'DESC']],
    });
  }

  async getAdmissionLogsByMarketing(
    marketingId: number,
    pageOptions: PageOptions
  ): Promise<PageResult<MarketingProductAdmissionLog>> {
    return marketingProductAdmissionLogDao.findPage({
      ...pageOptions,
      where: { marketing_id: marketingId },
      order: [['created_at', 'DESC']],
    });
  }

  async getAdmissionLogsByGoods(
    goodsId: number,
    pageOptions: PageOptions
  ): Promise<PageResult<MarketingProductAdmissionLog>> {
    return marketingProductAdmissionLogDao.findPage({
      ...pageOptions,
      where: { goods_id: goodsId },
      order: [['created_at', 'DESC']],
    });
  }

  async getApplyInfo(marketingProductId: number): Promise<{
    applyTime?: Date;
    applySource?: string;
    applyOperator?: string;
  }> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    const applyLog = await marketingProductAdmissionLogDao.findOne({
      where: {
        marketing_product_id: marketingProductId,
        action: 'apply',
      },
      order: [['created_at', 'ASC']],
    });

    return {
      applyTime: marketingProduct.apply_time,
      applySource: '商家报名',
      applyOperator: applyLog?.operator_name,
    };
  }

  async getAuditInfo(marketingProductId: number): Promise<{
    auditUserId?: number;
    auditUserName?: string;
    auditTime?: Date;
    auditRemark?: string;
    auditStatus?: number;
    auditLogs: MarketingProductAdmissionLog[];
  }> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    const auditLogs = await marketingProductAdmissionLogDao.findAll({
      where: {
        marketing_product_id: marketingProductId,
        action: ['audit_pass', 'audit_reject'],
      },
      order: [['created_at', 'DESC']],
    });

    return {
      auditUserId: marketingProduct.audit_user_id,
      auditTime: marketingProduct.audit_time,
      auditRemark: marketingProduct.audit_remark,
      auditStatus: marketingProduct.admission_status,
      auditLogs,
    };
  }

  async checkDuplicateApply(
    marketingId: number,
    goodsIds: number[]
  ): Promise<{
    isDuplicate: boolean;
    duplicateGoods: { goodsId: number; goodsName: string; admissionStatus: number }[];
    message: string;
  }> {
    const { Op } = await import('sequelize');
    const existingProducts = await marketingProductDao.findAll({
      where: {
        marketing_id: marketingId,
        goods_id: { [Op.in]: goodsIds },
        admission_status: { [Op.ne]: 2 },
      },
    });

    const duplicateGoods = existingProducts.map(p => ({
      goodsId: p.goods_id,
      goodsName: p.goods_name,
      admissionStatus: p.admission_status ?? 0,
    }));

    return {
      isDuplicate: duplicateGoods.length > 0,
      duplicateGoods,
      message:
        duplicateGoods.length > 0
          ? `有${duplicateGoods.length}个商品已报名本次活动，不可重复报名`
          : '无重复报名商品',
    };
  }

  async checkCrossCategoryViolation(
    marketingId: number,
    goodsIds: number[]
  ): Promise<{
    isViolation: boolean;
    violationGoods: { goodsId: number; goodsName: string; categoryId?: number }[];
    message: string;
    marketingCategoryIds?: string;
  }> {
    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new Error('营销活动不存在');
    }

    if (!marketing.category_ids || marketing.category_ids === '0' || marketing.category_ids === '') {
      return {
        isViolation: false,
        violationGoods: [],
        message: '活动无类目限制',
        marketingCategoryIds: marketing.category_ids,
      };
    }

    const marketingCategoryIds = marketing.category_ids.split(',').map(Number);
    if (marketingCategoryIds.includes(0)) {
      return {
        isViolation: false,
        violationGoods: [],
        message: '活动支持全品类',
        marketingCategoryIds: marketing.category_ids,
      };
    }

    const goodsList = await goodsDao.findAll({
      where: { id: goodsIds },
      attributes: ['id', 'name', 'category_id'],
    });

    const violationGoods: { goodsId: number; goodsName: string; categoryId?: number }[] = [];

    for (const goods of goodsList) {
      if (!goods.category_id || !marketingCategoryIds.includes(goods.category_id)) {
        violationGoods.push({
          goodsId: goods.id,
          goodsName: goods.name,
          categoryId: goods.category_id,
        });
      }
    }

    return {
      isViolation: violationGoods.length > 0,
      violationGoods,
      message:
        violationGoods.length > 0
          ? `有${violationGoods.length}个商品类目不符合活动要求，跨类目报名违规`
          : '所有商品类目均符合要求',
      marketingCategoryIds: marketing.category_ids,
    };
  }

  async getAdmissionRules(marketingId?: number, marketingType?: number): Promise<any[]> {
    const rules = await marketingAdmissionRuleDao.findEnabledRules(marketingId, marketingType);
    return rules.map(rule => ({
      id: rule.id,
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      description: this.getRuleDescription(rule),
      sortOrder: rule.sort_order,
    }));
  }

  private getRuleDescription(rule: any): string {
    switch (rule.rule_type) {
      case 'compliance_rating':
        return `最低商品合规评级：${rule.min_compliance_rating ? this.getRatingLabel(rule.min_compliance_rating) : '无限制'}`;
      case 'stock':
        return `最低库存要求：${rule.min_stock ?? '无限制'}件`;
      case 'violation':
        return `最大违规次数：${rule.max_violation_count ?? 0}次`;
      case 'merchant_credit':
        return `最低商家信用分：${rule.min_merchant_credit ?? 60}分，最低店铺等级：${rule.min_shop_level ? this.getShopLevelLabel(rule.min_shop_level) : '无限制'}`;
      case 'category_match':
        return rule.block_cross_category === 1 ? '禁止跨类目报名' : '允许跨类目报名';
      case 'price_range':
        return `价格区间：¥${rule.min_price ?? 0} - ¥${rule.max_price ?? '不限'}`;
      default:
        return rule.rule_name;
    }
  }

  private getRatingLabel(rating: number): string {
    const labels: Record<number, string> = { 1: 'A级', 2: 'B级', 3: 'C级', 4: 'D级' };
    return labels[rating] || '未知';
  }

  private getShopLevelLabel(level: number): string {
    const labels: Record<number, string> = {
      1: '新店',
      2: '铜牌',
      3: '银牌',
      4: '金牌',
      5: '钻石',
    };
    return labels[level] || '未知';
  }
}

export const marketingProductTraceService = new MarketingProductTraceService();

export default MarketingProductTraceService;
