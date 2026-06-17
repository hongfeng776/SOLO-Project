import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { WhereOptions } from 'sequelize';

export interface CheckItemResult {
  name: string;
  item_code: string;
  result: number;
  detail?: string;
  suggestion?: string;
}

export interface ConditionResult {
  category: string;
  passed: boolean;
  items: CheckItemResult[];
}

export interface PreSubmitResult {
  can_submit: boolean;
  conditions: ConditionResult[];
}

const EXTREME_WORDS = ['最好', '最优', '最佳', '第一', '唯一', '顶级', '极品', '绝对', '全网最低', '史上最强'];

class GoodsAuditValidateService {
  private readonly goodsDao = daos.goodsDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly brandAuthorizationDao = daos.brandAuthorizationDao;
  private readonly sensitiveWordDao = daos.sensitiveWordDao;
  private readonly goodsAuditMainDao = daos.goodsAuditMainDao;
  private readonly goodsAuditItemDao = daos.goodsAuditItemDao;

  async validatePreSubmit(goodsId: number): Promise<PreSubmitResult> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    const goodsData = (goods as any).toJSON ? (goods as any).toJSON() : goods;
    const conditions: ConditionResult[] = [];

    const infoResult = await this.checkInfoComplete(goodsData);
    conditions.push(infoResult);

    const qualResult = await this.checkQualification(goodsData);
    conditions.push(qualResult);

    const categoryResult = await this.checkCategoryCompliance(goodsData);
    conditions.push(categoryResult);

    const imageTextResult = await this.checkImageTextCompliance(goodsData);
    conditions.push(imageTextResult);

    const canSubmit = conditions.every((c) => c.passed);

    return { can_submit: canSubmit, conditions };
  }

  private async checkInfoComplete(goodsData: any): Promise<ConditionResult> {
    const items: CheckItemResult[] = [];
    const fields = [
      { key: 'name', label: '商品名称' },
      { key: 'category_id', label: '分类' },
      { key: 'price', label: '售价' },
      { key: 'stock', label: '库存' },
      { key: 'description', label: '商品描述' },
    ];

    for (const field of fields) {
      const value = goodsData[field.key];
      const isEmpty = value === null || value === undefined || value === '' || value === 0;
      items.push({
        name: field.label,
        item_code: `info_${field.key}`,
        result: isEmpty ? 2 : 1,
        detail: isEmpty ? `${field.label}不能为空` : undefined,
        suggestion: isEmpty ? `请填写${field.label}` : undefined,
      });
    }

    return {
      category: 'info_complete',
      passed: items.every((i) => i.result !== 2),
      items,
    };
  }

  private async checkQualification(goodsData: any): Promise<ConditionResult> {
    const items: CheckItemResult[] = [];
    const merchantId = goodsData.merchant_id;
    const categoryId = goodsData.category_id;

    if (!merchantId || !categoryId) {
      items.push({
        name: '商家类目资质',
        item_code: 'qual_category',
        result: 2,
        detail: '缺少商家ID或类目ID',
        suggestion: '请确保商品关联了商家和类目',
      });
      return { category: 'qualification', passed: false, items };
    }

    const qualifications = await this.merchantQualificationDao.findValidByMerchantAndCategory(
      merchantId,
      categoryId
    );

    items.push({
      name: '商家类目资质',
      item_code: 'qual_category',
      result: qualifications.length > 0 ? 1 : 2,
      detail: qualifications.length > 0 ? '类目资质有效' : '商家无该类目经营资质',
      suggestion: qualifications.length > 0 ? undefined : '请先申请该类目经营资质',
    });

    const now = new Date();
    const hasExpired = qualifications.some((q: any) => q.expire_date && new Date(q.expire_date) < now);
    if (hasExpired) {
      items.push({
        name: '资质有效期',
        item_code: 'qual_expire',
        result: 3,
        detail: '部分资质已过期或即将过期',
        suggestion: '请及时更新过期资质',
      });
    }

    if (goodsData.brand_id) {
      const authorizations = await this.brandAuthorizationDao.findValidByMerchantAndBrand(
        merchantId,
        goodsData.brand_id
      );
      items.push({
        name: '品牌授权',
        item_code: 'qual_brand',
        result: authorizations.length > 0 ? 1 : 2,
        detail: authorizations.length > 0 ? '品牌授权有效' : '品牌授权无效或已过期',
        suggestion: authorizations.length > 0 ? undefined : '请先获取品牌授权',
      });
    }

    return {
      category: 'qualification',
      passed: items.every((i) => i.result !== 2),
      items,
    };
  }

  private async checkCategoryCompliance(goodsData: any): Promise<ConditionResult> {
    const items: CheckItemResult[] = [];

    if (!goodsData.category_id) {
      items.push({
        name: '类目必填字段',
        item_code: 'cat_required',
        result: 2,
        detail: '缺少类目ID',
        suggestion: '请选择商品类目',
      });
      return { category: 'category_compliance', passed: false, items };
    }

    const requiredFields = [
      { key: 'name', label: '商品名称' },
      { key: 'price', label: '售价' },
      { key: 'stock', label: '库存' },
      { key: 'cover_image', label: '封面图' },
    ];

    for (const field of requiredFields) {
      const value = goodsData[field.key];
      const isEmpty = value === null || value === undefined || value === '';
      items.push({
        name: field.label,
        item_code: `cat_${field.key}`,
        result: isEmpty ? 2 : 1,
        detail: isEmpty ? `类目要求${field.label}必填` : undefined,
        suggestion: isEmpty ? `请填写${field.label}` : undefined,
      });
    }

    if (goodsData.price !== undefined && goodsData.price <= 0) {
      items.push({
        name: '价格合规',
        item_code: 'cat_price_positive',
        result: 2,
        detail: '售价必须大于0',
        suggestion: '请修正商品售价',
      });
    }

    return {
      category: 'category_compliance',
      passed: items.every((i) => i.result !== 2),
      items,
    };
  }

  private async checkImageTextCompliance(goodsData: any): Promise<ConditionResult> {
    const items: CheckItemResult[] = [];

    const coverImage = goodsData.cover_image;
    items.push({
      name: '主图数量',
      item_code: 'img_cover_count',
      result: coverImage ? 1 : 2,
      detail: coverImage ? '主图已上传' : '至少需要1张主图',
      suggestion: coverImage ? undefined : '请上传商品主图',
    });

    if (goodsData.name) {
      const sensitiveResult = await this.checkSensitiveWords(goodsData.name);
      items.push({
        name: '标题敏感词',
        item_code: 'img_title_sensitive',
        result: sensitiveResult.hasSensitive ? 2 : 1,
        detail: sensitiveResult.hasSensitive
          ? `标题包含敏感词：${sensitiveResult.words.join('、')}`
          : '标题无敏感词',
        suggestion: sensitiveResult.hasSensitive ? '请移除标题中的敏感词' : undefined,
      });

      const extremeResult = this.checkExtremeWords(goodsData.name);
      items.push({
        name: '标题极限词',
        item_code: 'img_title_extreme',
        result: extremeResult.hasExtreme ? 2 : 1,
        detail: extremeResult.hasExtreme
          ? `标题包含极限词：${extremeResult.words.join('、')}`
          : '标题无极限词',
        suggestion: extremeResult.hasExtreme ? '请移除标题中的极限词' : undefined,
      });
    }

    if (goodsData.description) {
      const descExtremeResult = this.checkExtremeWords(goodsData.description);
      items.push({
        name: '描述极限词',
        item_code: 'img_desc_extreme',
        result: descExtremeResult.hasExtreme ? 2 : 1,
        detail: descExtremeResult.hasExtreme
          ? `描述包含极限词：${descExtremeResult.words.join('、')}`
          : '描述无极限词',
        suggestion: descExtremeResult.hasExtreme ? '请移除描述中的极限词' : undefined,
      });
    }

    return {
      category: 'image_text_compliance',
      passed: items.every((i) => i.result !== 2),
      items,
    };
  }

  private async checkSensitiveWords(text: string): Promise<{ hasSensitive: boolean; words: string[] }> {
    const allWords = await this.sensitiveWordDao.findAll({
      where: { status: 1 } as WhereOptions,
    });
    const foundWords: string[] = [];
    for (const word of allWords) {
      if (text.includes((word as any).word)) {
        foundWords.push((word as any).word);
      }
    }
    return { hasSensitive: foundWords.length > 0, words: foundWords };
  }

  private checkExtremeWords(text: string): { hasExtreme: boolean; words: string[] } {
    const foundWords = EXTREME_WORDS.filter((w) => text.includes(w));
    return { hasExtreme: foundWords.length > 0, words: foundWords };
  }

  async autoInitialReview(auditId: number): Promise<void> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const items = await this.goodsAuditItemDao.findByAuditId(auditId);
    const failedCount = items.filter((i: any) => i.check_result === 2).length;
    const allPassed = failedCount === 0;

    let riskLevel: number;
    let newStatus: number;
    let initialResult: number;

    if (allPassed) {
      riskLevel = 1;
      newStatus = 1;
      initialResult = 1;
    } else if (failedCount >= 3) {
      riskLevel = 3;
      newStatus = 2;
      initialResult = 2;
    } else {
      riskLevel = 2;
      newStatus = 0;
      initialResult = 3;
    }

    await this.goodsAuditMainDao.update(auditId, {
      risk_level: riskLevel,
      status: newStatus,
      initial_result: initialResult,
      initial_remark: allPassed ? '自动初审通过' : failedCount >= 3 ? '高风险自动驳回' : '需人工审核',
      initial_reviewed_at: newStatus !== 0 ? new Date() : undefined,
    } as any);
  }

  async getMissingFields(goodsId: number): Promise<string[]> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    const goodsData = (goods as any).toJSON ? (goods as any).toJSON() : goods;
    const missing: string[] = [];
    const requiredFields = ['name', 'category_id', 'price', 'stock', 'description', 'cover_image'];

    for (const field of requiredFields) {
      const value = goodsData[field];
      if (value === null || value === undefined || value === '' || value === 0) {
        missing.push(field);
      }
    }

    return missing;
  }

  async canResubmit(auditId: number): Promise<{ can_resubmit: boolean; reason?: string }> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const pendingAudits = await this.goodsAuditMainDao.findPendingByGoodsId(audit.goods_id as number);
    const activeAudits = pendingAudits.filter((a: any) => (a as any).id !== auditId);

    if (activeAudits.length > 0) {
      return {
        can_resubmit: false,
        reason: '该商品存在待审核的记录，不可重复提交',
      };
    }

    return { can_resubmit: true };
  }
}

export const goodsAuditValidateService = new GoodsAuditValidateService();
export default GoodsAuditValidateService;
