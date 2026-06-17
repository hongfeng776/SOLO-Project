import { Op } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Goods } from '../models/Goods';
import { Merchant } from '../models/Merchant';
import { GoodsEditLog } from '../models/GoodsEditLog';
import { GoodsAudit } from '../models/GoodsAudit';
import { MerchantQualification } from '../models/MerchantQualification';
import { BrandAuthorization } from '../models/BrandAuthorization';

export interface ConsistencyIssue {
  field: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  code: string;
}

export interface ConsistencyCheckResult {
  consistent: boolean;
  issues: ConsistencyIssue[];
  overallRating: string;
}

export interface RepeatSuggestionItem {
  id: number;
  name: string;
  sku_code: string;
  similarity: number;
  match_reason: string;
  merchant_name?: string;
  price?: number;
}

export interface GoodsFullTraceResult {
  goods: Goods;
  merchant: {
    info: Merchant | null;
    qualifications: MerchantQualification[];
    brandAuthorizations: BrandAuthorization[];
  };
  category: {
    category_id: number | undefined;
    filed_count: number;
    required_filled: boolean;
  };
  editLogs: GoodsEditLog[];
  auditRecords: GoodsAudit[];
}

class GoodsTraceService {
  private readonly goodsDao = daos.goodsDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly brandAuthorizationDao = daos.brandAuthorizationDao;
  private readonly goodsEditLogDao = daos.goodsEditLogDao;
  private readonly goodsAuditDao = daos.goodsAuditDao;

  async getGoodsFullTrace(goodsId: number): Promise<GoodsFullTraceResult> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    let merchantInfo: Merchant | null = null;
    let qualifications: MerchantQualification[] = [];
    let brandAuthorizations: BrandAuthorization[] = [];

    if (goods.merchant_id) {
      merchantInfo = await this.merchantDao.findById(goods.merchant_id);

      if (goods.category_id) {
        qualifications = await this.merchantQualificationDao.findAll({
          where: {
            merchant_id: goods.merchant_id,
            category_id: goods.category_id,
          },
          order: [['created_at', 'DESC']],
        });
      }

      if (goods.brand_id) {
        brandAuthorizations = await this.brandAuthorizationDao.findAll({
          where: {
            merchant_id: goods.merchant_id,
            brand_id: goods.brand_id,
          },
          order: [['created_at', 'DESC']],
        });
      }
    }

    const editLogs = await this.goodsEditLogDao.findAll({
      where: { goods_id: goodsId },
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    const auditRecords = await this.goodsAuditDao.findAll({
      where: { goods_id: goodsId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    let filedCount = 0;
    const requiredFields = ['name', 'sku_code', 'price'];
    const goodsRecord = goods as unknown as Record<string, unknown>;
    for (const field of requiredFields) {
      if (goodsRecord[field] !== undefined &&
          goodsRecord[field] !== null &&
          goodsRecord[field] !== '') {
        filedCount++;
      }
    }

    return {
      goods,
      merchant: {
        info: merchantInfo,
        qualifications,
        brandAuthorizations,
      },
      category: {
        category_id: goods.category_id,
        filed_count: filedCount,
        required_filled: filedCount === requiredFields.length,
      },
      editLogs,
      auditRecords,
    };
  }

  async checkDataConsistency(goodsId: number): Promise<ConsistencyCheckResult> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    const issues: ConsistencyIssue[] = [];

    if (!goods.sku_code || goods.sku_code.trim().length === 0) {
      issues.push({
        field: 'sku_code',
        message: '商品编码为空',
        level: 'error',
        code: 'SKU_CODE_EMPTY',
      });
    } else if (goods.sku_code.length < 4) {
      issues.push({
        field: 'sku_code',
        message: '商品编码长度不足4位',
        level: 'warning',
        code: 'SKU_CODE_SHORT',
      });
    }

    if (!goods.name || goods.name.trim().length === 0) {
      issues.push({
        field: 'name',
        message: '商品名称为空',
        level: 'error',
        code: 'NAME_EMPTY',
      });
    }

    if (goods.price === undefined || goods.price === null) {
      issues.push({
        field: 'price',
        message: '商品价格未设置',
        level: 'error',
        code: 'PRICE_MISSING',
      });
    } else if (goods.price <= 0) {
      issues.push({
        field: 'price',
        message: '商品价格必须大于0',
        level: 'error',
        code: 'PRICE_INVALID',
      });
    }

    if (goods.original_price !== undefined && goods.original_price !== null) {
      if (goods.original_price < goods.price) {
        issues.push({
          field: 'original_price',
          message: '原价不能低于售价',
          level: 'warning',
          code: 'ORIGINAL_PRICE_LOW',
        });
      }
    }

    if ((goods.stock ?? 0) < 0) {
      issues.push({
        field: 'stock',
        message: '库存不能为负数',
        level: 'error',
        code: 'STOCK_NEGATIVE',
      });
    }

    if ((goods.sales ?? 0) < 0) {
      issues.push({
        field: 'sales',
        message: '销量不能为负数',
        level: 'error',
        code: 'SALES_NEGATIVE',
      });
    }

    if ((goods.stock ?? 0) > 0 && goods.status === 1 && (goods.sales ?? 0) > (goods.stock ?? 0)) {
      issues.push({
        field: 'stock',
        message: '库存低于已售数量，存在超卖风险',
        level: 'warning',
        code: 'STOCK_LOW_SALES',
      });
    }

    if (goods.compliance_rating !== undefined && goods.compliance_rating !== null) {
      if (![1, 2, 3, 4].includes(goods.compliance_rating)) {
        issues.push({
          field: 'compliance_rating',
          message: '合规评级值不合法',
          level: 'error',
          code: 'COMPLIANCE_RATING_INVALID',
        });
      }
    }

    if (goods.sale_start_time && goods.sale_end_time) {
      if (new Date(goods.sale_end_time) < new Date(goods.sale_start_time)) {
        issues.push({
          field: 'sale_end_time',
          message: '售卖结束时间早于开始时间',
          level: 'error',
          code: 'SALE_TIME_INVALID',
        });
      }
    }

    if (goods.merchant_id) {
      const merchant = await this.merchantDao.findById(goods.merchant_id);
      if (!merchant) {
        issues.push({
          field: 'merchant_id',
          message: '关联商家不存在',
          level: 'error',
          code: 'MERCHANT_NOT_FOUND',
        });
      } else if (merchant.status !== 1) {
        issues.push({
          field: 'merchant_id',
          message: '关联商家状态异常',
          level: 'warning',
          code: 'MERCHANT_STATUS_ABNORMAL',
        });
      }
    }

    if (goods.brand_id && goods.merchant_id) {
      const auths = await this.brandAuthorizationDao.findValidByMerchantAndBrand(
        goods.merchant_id,
        goods.brand_id
      );
      if (auths.length === 0) {
        issues.push({
          field: 'brand_id',
          message: '品牌授权缺失或已过期',
          level: 'warning',
          code: 'BRAND_AUTH_MISSING',
        });
      }
    }

    if (goods.category_id && goods.merchant_id) {
      const quals = await this.merchantQualificationDao.findValidByMerchantAndCategory(
        goods.merchant_id,
        goods.category_id
      );
      if (quals.length === 0) {
        issues.push({
          field: 'category_id',
          message: '类目经营资质缺失或已过期',
          level: 'warning',
          code: 'CATEGORY_QUAL_MISSING',
        });
      }
    }

    let overallRating = 'A';
    const errorCount = issues.filter((i) => i.level === 'error').length;
    const warningCount = issues.filter((i) => i.level === 'warning').length;

    if (errorCount >= 3) {
      overallRating = 'D';
    } else if (errorCount >= 1) {
      overallRating = 'C';
    } else if (warningCount >= 3) {
      overallRating = 'B';
    } else if (warningCount >= 1) {
      overallRating = 'A-';
    }

    return {
      consistent: errorCount === 0,
      issues,
      overallRating,
    };
  }

  async getRepeatSuggestions(goodsId: number): Promise<RepeatSuggestionItem[]> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    const suggestions: RepeatSuggestionItem[] = [];
    const merchantIdsSet = new Set<number>();

    if (goods.sku_code) {
      const skuMatches = await this.goodsDao.findAll({
        where: {
          sku_code: goods.sku_code,
          id: { [Op.ne]: goodsId },
        },
        limit: 10,
      });
      for (const item of skuMatches) {
        merchantIdsSet.add(item.merchant_id ?? 0);
        suggestions.push({
          id: item.id,
          name: item.name,
          sku_code: item.sku_code,
          similarity: 100,
          match_reason: '商品编码完全相同',
          price: item.price,
        });
      }
    }

    if (goods.brand_id && goods.category_id && suggestions.length < 20) {
      const comboMatches = await this.goodsDao.findAll({
        where: {
          brand_id: goods.brand_id,
          category_id: goods.category_id,
          merchant_id: goods.merchant_id,
          id: { [Op.ne]: goodsId },
        },
        limit: 20 - suggestions.length,
      });
      for (const item of comboMatches) {
        if (suggestions.find((s) => s.id === item.id)) continue;
        merchantIdsSet.add(item.merchant_id ?? 0);
        suggestions.push({
          id: item.id,
          name: item.name,
          sku_code: item.sku_code,
          similarity: 85,
          match_reason: '同商家同品牌同类目',
          price: item.price,
        });
      }
    }

    if (goods.name && goods.name.length >= 4 && suggestions.length < 30) {
      const keywords = this.extractKeywords(goods.name);
      if (keywords.length > 0) {
        const whereClauses = keywords.map((kw) => ({
          name: { [Op.like]: `%${kw}%` },
        }));
        const nameMatches = await this.goodsDao.findAll({
          where: {
            [Op.or]: whereClauses,
            id: { [Op.ne]: goodsId },
          },
          limit: 30 - suggestions.length,
        });
        for (const item of nameMatches) {
          if (suggestions.find((s) => s.id === item.id)) continue;
          merchantIdsSet.add(item.merchant_id ?? 0);
          const sim = this.calculateNameSimilarity(goods.name, item.name);
          suggestions.push({
            id: item.id,
            name: item.name,
            sku_code: item.sku_code,
            similarity: sim,
            match_reason: '商品名称关键词相似',
            price: item.price,
          });
        }
      }
    }

    const merchantIds = [...merchantIdsSet].filter((id) => id > 0);
    if (merchantIds.length > 0) {
      const merchants = await this.merchantDao.findAll({
        where: { id: { [Op.in]: merchantIds } },
      });
      const merchantMap = new Map(merchants.map((m) => [m.id, m.name]));
      for (const item of suggestions) {
        const m = await this.goodsDao.findById(item.id);
        if (m?.merchant_id) {
          item.merchant_name = merchantMap.get(m.merchant_id);
        }
      }
    }

    suggestions.sort((a, b) => b.similarity - a.similarity);

    return suggestions.slice(0, 30);
  }

  private extractKeywords(name: string): string[] {
    const cleaned = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
    const words = cleaned.split(/\s+/).filter((w) => w.length >= 2);
    return words.slice(0, 5);
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    const set1 = new Set(name1.split(''));
    const set2 = new Set(name2.split(''));
    let intersection = 0;
    for (const char of set1) {
      if (set2.has(char)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
  }
}

export const goodsTraceService = new GoodsTraceService();
export default GoodsTraceService;
