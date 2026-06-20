import { daos } from '../dao';
import { Goods } from '../models/Goods';
import { Merchant } from '../models/Merchant';
import { Marketing } from '../models/Marketing';
import { MarketingProduct } from '../models/MarketingProduct';
import { MarketingAdmissionRule } from '../models/MarketingAdmissionRule';
import { Op } from 'sequelize';

const {
  goodsDao,
  merchantDao,
  marketingDao,
  marketingProductDao,
  marketingAdmissionRuleDao,
  marketingProductAdmissionLogDao,
} = daos;

export interface AdmissionValidateError {
  field: string;
  message: string;
  ruleType: string;
  level: 'error' | 'warning';
}

export interface AdmissionValidateResult {
  passed: boolean;
  errors: AdmissionValidateError[];
  warnings: AdmissionValidateError[];
  matchedRules: number[];
  ruleMatchDetails: any[];
}

export interface ApplyGoodsParams {
  marketingId: number;
  goodsIds: number[];
  activityPrice?: number;
  stock?: number;
  sortOrder?: number;
}

export class MarketingProductAdmissionService {
  async validateApply(marketingId: number, goodsId: number): Promise<AdmissionValidateResult> {
    const result: AdmissionValidateResult = {
      passed: true,
      errors: [],
      warnings: [],
      matchedRules: [],
      ruleMatchDetails: [],
    };

    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      result.errors.push({
        field: 'marketingId',
        message: '营销活动不存在',
        ruleType: 'base',
        level: 'error',
      });
      result.passed = false;
      return result;
    }

    if (marketing.status !== 0 && marketing.status !== 1) {
      result.errors.push({
        field: 'marketingId',
        message: '营销活动状态不允许报名',
        ruleType: 'base',
        level: 'error',
      });
      result.passed = false;
      return result;
    }

    const goods = await goodsDao.findById(goodsId);
    if (!goods) {
      result.errors.push({
        field: 'goodsId',
        message: '商品不存在',
        ruleType: 'base',
        level: 'error',
      });
      result.passed = false;
      return result;
    }

    if (goods.status !== 1) {
      result.errors.push({
        field: 'goodsId',
        message: '商品已下架，不能报名活动',
        ruleType: 'base',
        level: 'error',
      });
      result.passed = false;
      return result;
    }

    const existingProduct = await marketingProductDao.findOne({
      where: {
        marketing_id: marketingId,
        goods_id: goodsId,
      },
    });
    if (existingProduct && existingProduct.admission_status !== 2) {
      result.errors.push({
        field: 'goodsId',
        message: '该商品已报名本次活动，无需重复报名',
        ruleType: 'duplicate',
        level: 'error',
      });
      result.passed = false;
      return result;
    }

    const merchant = goods.merchant_id ? await merchantDao.findById(goods.merchant_id) : null;

    const rules = await marketingAdmissionRuleDao.findEnabledRules(marketingId, marketing.type);

    for (const rule of rules) {
      const matchResult = this.matchRule(rule, goods, merchant, marketing);
      result.ruleMatchDetails.push({
        ruleId: rule.id,
        ruleName: rule.rule_name,
        ruleType: rule.rule_type,
        passed: matchResult.passed,
        message: matchResult.message,
      });

      if (matchResult.passed) {
        result.matchedRules.push(rule.id);
      } else {
        result.errors.push({
          field: this.getErrorField(rule.rule_type),
          message: matchResult.message,
          ruleType: rule.rule_type,
          level: 'error',
        });
        result.passed = false;
      }
    }

    if (marketing.category_ids && marketing.category_ids.length > 0) {
      const categoryPassed = this.validateCategoryMatch(marketing, goods);
      if (!categoryPassed) {
        result.errors.push({
          field: 'categoryId',
          message: '商品类目不符合活动类目范围',
          ruleType: 'category',
          level: 'error',
        });
        result.passed = false;
      }
    }

    if (merchant && marketing.merchant_ids && marketing.merchant_ids.length > 0) {
      const merchantPassed = this.validateMerchantMatch(marketing, merchant);
      if (!merchantPassed) {
        result.errors.push({
          field: 'merchantId',
          message: '商家不在活动参与商家范围内',
          ruleType: 'merchant',
          level: 'error',
        });
        result.passed = false;
      }
    }

    return result;
  }

  private matchRule(
    rule: MarketingAdmissionRule,
    goods: Goods,
    merchant: Merchant | null,
    marketing: Marketing
  ): { passed: boolean; message: string } {
    switch (rule.rule_type) {
      case 'compliance_rating':
        return this.validateComplianceRating(rule, goods);
      case 'stock':
        return this.validateStock(rule, goods);
      case 'violation':
        return this.validateViolation(rule, goods);
      case 'merchant_credit':
        return this.validateMerchantCredit(rule, merchant);
      case 'category_match':
        return this.validateCategoryRule(rule, goods, marketing);
      case 'price_range':
        return this.validatePriceRange(rule, goods);
      default:
        return { passed: true, message: '规则匹配通过' };
    }
  }

  private validateComplianceRating(
    rule: MarketingAdmissionRule,
    goods: Goods
  ): { passed: boolean; message: string } {
    if (!rule.min_compliance_rating) {
      return { passed: true, message: '未设置最低评级要求' };
    }

    const rating = goods.compliance_rating || 4;
    if (rating <= rule.min_compliance_rating) {
      return { passed: true, message: `商品合规评级${this.getRatingLabel(rating)}符合要求` };
    } else {
      return {
        passed: false,
        message: `商品合规评级${this.getRatingLabel(rating)}低于要求${this.getRatingLabel(rule.min_compliance_rating)}，无法报名`,
      };
    }
  }

  private getRatingLabel(rating: number): string {
    const labels: Record<number, string> = { 1: 'A级', 2: 'B级', 3: 'C级', 4: 'D级' };
    return labels[rating] || '未知';
  }

  private validateStock(
    rule: MarketingAdmissionRule,
    goods: Goods
  ): { passed: boolean; message: string } {
    if (!rule.min_stock) {
      return { passed: true, message: '未设置最低库存要求' };
    }

    const stock = goods.stock || 0;
    if (stock >= rule.min_stock) {
      return { passed: true, message: `商品库存${stock}件符合要求` };
    } else {
      return {
        passed: false,
        message: `商品库存${stock}件不足，最低要求${rule.min_stock}件，无法报名`,
      };
    }
  }

  private validateViolation(
    rule: MarketingAdmissionRule,
    _goods: Goods
  ): { passed: boolean; message: string } {
    const violationCount = 0;
    const maxCount = rule.max_violation_count ?? 0;

    if (violationCount <= maxCount) {
      return { passed: true, message: `商品违规记录${violationCount}条符合要求` };
    } else {
      return {
        passed: false,
        message: `商品违规记录${violationCount}条超过最大允许${maxCount}条，无法报名`,
      };
    }
  }

  private validateMerchantCredit(
    rule: MarketingAdmissionRule,
    merchant: Merchant | null
  ): { passed: boolean; message: string } {
    if (!merchant) {
      return { passed: false, message: '商品无关联商家，无法校验信用等级' };
    }

    if (!rule.min_merchant_credit && !rule.min_shop_level) {
      return { passed: true, message: '未设置商家信用要求' };
    }

    let creditPassed = true;
    let levelPassed = true;
    let messages: string[] = [];

    if (rule.min_merchant_credit) {
      const creditScore = merchant.credit_score || 0;
      if (creditScore >= rule.min_merchant_credit) {
        messages.push(`商家信用分${creditScore}符合要求`);
      } else {
        creditPassed = false;
        messages.push(`商家信用分${creditScore}低于要求${rule.min_merchant_credit}分`);
      }
    }

    if (rule.min_shop_level) {
      const shopLevel = merchant.shop_level || 1;
      if (shopLevel >= rule.min_shop_level) {
        messages.push(`店铺等级${this.getShopLevelLabel(shopLevel)}符合要求`);
      } else {
        levelPassed = false;
        messages.push(`店铺等级${this.getShopLevelLabel(shopLevel)}低于要求${this.getShopLevelLabel(rule.min_shop_level)}`);
      }
    }

    if (creditPassed && levelPassed) {
      return { passed: true, message: messages.join('，') };
    } else {
      return { passed: false, message: messages.join('，') + '，无法报名' };
    }
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

  private validateCategoryRule(
    rule: MarketingAdmissionRule,
    goods: Goods,
    marketing: Marketing
  ): { passed: boolean; message: string } {
    if (!rule.block_cross_category) {
      return { passed: true, message: '允许跨类目报名' };
    }

    if (!marketing.category_ids || marketing.category_ids === '0') {
      return { passed: true, message: '活动无类目限制' };
    }

    if (!goods.category_id) {
      return { passed: false, message: '商品未设置类目' };
    }

    const marketingCategoryIds = marketing.category_ids.split(',').map(Number);
    if (marketingCategoryIds.includes(0) || marketingCategoryIds.includes(goods.category_id)) {
      return { passed: true, message: '商品类目与活动类目匹配' };
    } else {
      return { passed: false, message: '商品类目与活动类目不匹配，禁止跨类目报名' };
    }
  }

  private validatePriceRange(
    rule: MarketingAdmissionRule,
    goods: Goods
  ): { passed: boolean; message: string } {
    if (!rule.min_price && !rule.max_price) {
      return { passed: true, message: '未设置价格区间要求' };
    }

    const price = Number(goods.price) || 0;
    let messages: string[] = [];
    let passed = true;

    if (rule.min_price && price < Number(rule.min_price)) {
      passed = false;
      messages.push(`商品价格¥${price}低于最低价格¥${rule.min_price}`);
    }

    if (rule.max_price && price > Number(rule.max_price)) {
      passed = false;
      messages.push(`商品价格¥${price}高于最高价格¥${rule.max_price}`);
    }

    if (passed) {
      return { passed: true, message: `商品价格¥${price}在允许区间内` };
    } else {
      return { passed: false, message: messages.join('，') + '，无法报名' };
    }
  }

  private validateCategoryMatch(marketing: Marketing, goods: Goods): boolean {
    if (!marketing.category_ids || marketing.category_ids === '0' || marketing.category_ids === '') {
      return true;
    }
    if (!goods.category_id) {
      return false;
    }

    const categoryIds = marketing.category_ids.split(',').map(Number);
    return categoryIds.includes(0) || categoryIds.includes(goods.category_id);
  }

  private validateMerchantMatch(marketing: Marketing, merchant: Merchant): boolean {
    if (!marketing.merchant_ids || marketing.merchant_ids === '0' || marketing.merchant_ids === '') {
      return true;
    }

    const merchantIds = marketing.merchant_ids.split(',').map(Number);
    return merchantIds.includes(0) || merchantIds.includes(merchant.id);
  }

  private getErrorField(ruleType: string): string {
    const fieldMap: Record<string, string> = {
      compliance_rating: 'complianceRating',
      stock: 'stock',
      violation: 'violationCount',
      merchant_credit: 'merchantCredit',
      category_match: 'categoryId',
      price_range: 'price',
      category: 'categoryId',
      merchant: 'merchantId',
    };
    return fieldMap[ruleType] || 'base';
  }

  async applyGoods(params: ApplyGoodsParams, operatorId: number, operatorName: string): Promise<{
    success: number;
    failed: number;
    results: { goodsId: number; passed: boolean; message: string }[];
  }> {
    const { marketingId, goodsIds, activityPrice, stock, sortOrder } = params;
    const results: { goodsId: number; passed: boolean; message: string }[] = [];
    let success = 0;
    let failed = 0;

    const marketing = await marketingDao.findById(marketingId);
    if (!marketing) {
      throw new Error('营销活动不存在');
    }

    for (const goodsId of goodsIds) {
      try {
        const validateResult = await this.validateApply(marketingId, goodsId);

        if (!validateResult.passed) {
          failed++;
          results.push({
            goodsId,
            passed: false,
            message: validateResult.errors[0]?.message || '校验未通过',
          });
          continue;
        }

        const goods = await goodsDao.findById(goodsId);
        if (!goods) {
          failed++;
          results.push({ goodsId, passed: false, message: '商品不存在' });
          continue;
        }

        const existingProduct = await marketingProductDao.findOne({
          where: { marketing_id: marketingId, goods_id: goodsId },
        });

        let marketingProduct: MarketingProduct;

        if (existingProduct) {
          marketingProduct = await existingProduct.update({
            admission_status: 0,
            audit_user_id: undefined,
            audit_time: undefined,
            audit_remark: undefined,
            apply_time: new Date(),
            activity_price: activityPrice ?? existingProduct.activity_price,
            stock: stock ?? existingProduct.stock,
            sort_order: sortOrder ?? existingProduct.sort_order,
            status: 0,
            compliance_rating: goods.compliance_rating,
            merchant_credit_score: goods.merchant_id ? undefined : undefined,
          });
        } else {
          const merchant = goods.merchant_id ? await merchantDao.findById(goods.merchant_id) : null;
          marketingProduct = await marketingProductDao.create({
            marketing_id: marketingId,
            goods_id: goodsId,
            goods_name: goods.name,
            category_id: goods.category_id,
            merchant_id: goods.merchant_id,
            original_price: goods.price,
            activity_price: activityPrice ?? goods.price,
            stock: stock ?? goods.stock ?? 0,
            sold_count: 0,
            sort_order: sortOrder ?? 0,
            status: 0,
            admission_status: 0,
            apply_time: new Date(),
            compliance_rating: goods.compliance_rating,
            merchant_credit_score: merchant?.credit_score,
          } as any);
        }

        await marketingProductAdmissionLogDao.create({
          marketing_product_id: marketingProduct.id,
          marketing_id: marketingId,
          goods_id: goodsId,
          operator_id: operatorId,
          operator_type: 3,
          operator_name: operatorName,
          action: 'apply',
          old_status: existingProduct?.admission_status ?? null,
          new_status: 0,
          remark: '商品报名活动',
          rule_match_detail: validateResult.ruleMatchDetails,
        } as any);

        success++;
        results.push({ goodsId, passed: true, message: '报名成功，等待审核' });
      } catch (err) {
        failed++;
        results.push({ goodsId, passed: false, message: (err as Error).message });
      }
    }

    return { success, failed, results };
  }

  async auditPass(
    marketingProductId: number,
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<MarketingProduct> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    if (marketingProduct.admission_status !== 0) {
      throw new Error('当前状态不允许审核通过');
    }

    const updated = await marketingProduct.update({
      admission_status: 1,
      status: 1,
      audit_user_id: operatorId,
      audit_time: new Date(),
      audit_remark: remark || '审核通过',
    });

    await marketingProductAdmissionLogDao.create({
      marketing_product_id: marketingProductId,
      marketing_id: marketingProduct.marketing_id,
      goods_id: marketingProduct.goods_id,
      operator_id: operatorId,
      operator_type: 2,
      operator_name: operatorName,
      action: 'audit_pass',
      old_status: 0,
      new_status: 1,
      remark: remark || '审核通过',
    } as any);

    return updated;
  }

  async auditReject(
    marketingProductId: number,
    operatorId: number,
    operatorName: string,
    remark: string
  ): Promise<MarketingProduct> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    if (marketingProduct.admission_status !== 0) {
      throw new Error('当前状态不允许审核驳回');
    }

    const updated = await marketingProduct.update({
      admission_status: 2,
      status: 0,
      audit_user_id: operatorId,
      audit_time: new Date(),
      audit_remark: remark,
    });

    await marketingProductAdmissionLogDao.create({
      marketing_product_id: marketingProductId,
      marketing_id: marketingProduct.marketing_id,
      goods_id: marketingProduct.goods_id,
      operator_id: operatorId,
      operator_type: 2,
      operator_name: operatorName,
      action: 'audit_reject',
      old_status: 0,
      new_status: 2,
      remark,
    } as any);

    return updated;
  }

  async offlineProduct(
    marketingProductId: number,
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<MarketingProduct> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    if (marketingProduct.admission_status !== 1) {
      throw new Error('仅准入通过的商品可下架');
    }

    const updated = await marketingProduct.update({
      admission_status: 3,
      status: 0,
    });

    await marketingProductAdmissionLogDao.create({
      marketing_product_id: marketingProductId,
      marketing_id: marketingProduct.marketing_id,
      goods_id: marketingProduct.goods_id,
      operator_id: operatorId,
      operator_type: 2,
      operator_name: operatorName,
      action: 'offline',
      old_status: 1,
      new_status: 3,
      remark: remark || '商品下架',
    } as any);

    return updated;
  }

  async onlineProduct(
    marketingProductId: number,
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<MarketingProduct> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    if (marketingProduct.admission_status !== 3) {
      throw new Error('仅下架的商品可重新上架');
    }

    const updated = await marketingProduct.update({
      admission_status: 1,
      status: 1,
    });

    await marketingProductAdmissionLogDao.create({
      marketing_product_id: marketingProductId,
      marketing_id: marketingProduct.marketing_id,
      goods_id: marketingProduct.goods_id,
      operator_id: operatorId,
      operator_type: 2,
      operator_name: operatorName,
      action: 'online',
      old_status: 3,
      new_status: 1,
      remark: remark || '商品上架',
    } as any);

    return updated;
  }

  async removeProduct(
    marketingProductId: number,
    operatorId: number,
    operatorName: string,
    remark?: string
  ): Promise<void> {
    const marketingProduct = await marketingProductDao.findById(marketingProductId);
    if (!marketingProduct) {
      throw new Error('活动商品不存在');
    }

    await marketingProductAdmissionLogDao.create({
      marketing_product_id: marketingProductId,
      marketing_id: marketingProduct.marketing_id,
      goods_id: marketingProduct.goods_id,
      operator_id: operatorId,
      operator_type: 2,
      operator_name: operatorName,
      action: 'remove',
      old_status: marketingProduct.admission_status,
      new_status: null,
      remark: remark || '移除活动商品',
    } as any);

    await marketingProductDao.delete(marketingProductId);
  }

  async checkDuplicateApply(marketingId: number, goodsIds: number[]): Promise<{
    duplicateGoodsIds: number[];
    message: string;
  }> {
    const existingProducts = await marketingProductDao.findAll({
      where: {
        marketing_id: marketingId,
        goods_id: { [Op.in]: goodsIds },
        admission_status: { [Op.ne]: 2 },
      },
    });

    const duplicateGoodsIds = existingProducts.map(p => p.goods_id);

    return {
      duplicateGoodsIds,
      message: duplicateGoodsIds.length > 0
        ? `有${duplicateGoodsIds.length}个商品已报名本次活动`
        : '无重复报名商品',
    };
  }
}

export const marketingProductAdmissionService = new MarketingProductAdmissionService();

export default MarketingProductAdmissionService;
