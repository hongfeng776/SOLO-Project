import { Op } from 'sequelize';
import { daos } from '../dao';

export interface ValidateError {
  field: string;
  message: string;
  code: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: ValidateError[];
}

export interface GoodsCreateValidateData {
  merchant_id: number;
  category_id: number;
  brand_id?: number;
  sku_code: string;
  name: string;
  price: number;
  stock?: number;
}

export interface CategoryRequiredField {
  field: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'image' | 'text';
  rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  compliance_rules?: string[];
}

const CATEGORY_FIELDS_MAP: Record<number, CategoryRequiredField[]> = {
  1: [
    { field: 'name', label: '商品名称', required: true, type: 'string', rules: { min: 2, max: 255 }, compliance_rules: ['禁止敏感词', '不得使用极限词'] },
    { field: 'price', label: '售价', required: true, type: 'number', rules: { min: 0.01 } },
    { field: 'original_price', label: '原价', required: false, type: 'number', rules: { min: 0.01 } },
    { field: 'stock', label: '库存', required: true, type: 'number', rules: { min: 0 } },
    { field: 'cover_image', label: '封面图', required: true, type: 'image' },
    { field: 'description', label: '商品描述', required: true, type: 'text', rules: { min: 10 }, compliance_rules: ['详情需包含材质说明', '需提供售后保障信息'] },
    { field: 'sku_code', label: '商品编码', required: true, type: 'string', rules: { min: 4, max: 100 } },
  ],
  2: [
    { field: 'name', label: '商品名称', required: true, type: 'string', rules: { min: 2, max: 255 }, compliance_rules: ['禁止医疗宣传用语'] },
    { field: 'price', label: '售价', required: true, type: 'number', rules: { min: 0.01 } },
    { field: 'stock', label: '库存', required: true, type: 'number', rules: { min: 0 } },
    { field: 'cover_image', label: '封面图', required: true, type: 'image' },
    { field: 'description', label: '商品描述', required: true, type: 'text', compliance_rules: ['需标注成分含量', '需提供生产许可证信息'] },
    { field: 'sku_code', label: '商品编码', required: true, type: 'string', rules: { min: 4, max: 100 } },
  ],
  3: [
    { field: 'name', label: '商品名称', required: true, type: 'string', rules: { min: 2, max: 255 } },
    { field: 'price', label: '售价', required: true, type: 'number', rules: { min: 0.01 } },
    { field: 'stock', label: '库存', required: true, type: 'number', rules: { min: 0 } },
    { field: 'cover_image', label: '封面图', required: true, type: 'image' },
    { field: 'brand_id', label: '品牌ID', required: true, type: 'number' },
    { field: 'sku_code', label: '商品编码', required: true, type: 'string', rules: { min: 4, max: 100 } },
  ],
};

const DEFAULT_CATEGORY_FIELDS: CategoryRequiredField[] = [
  { field: 'name', label: '商品名称', required: true, type: 'string', rules: { min: 2, max: 255 } },
  { field: 'price', label: '售价', required: true, type: 'number', rules: { min: 0.01 } },
  { field: 'stock', label: '库存', required: false, type: 'number', rules: { min: 0 }, compliance_rules: ['已售出商品库存不得低于已售数量'] },
  { field: 'cover_image', label: '封面图', required: false, type: 'image' },
  { field: 'description', label: '商品描述', required: false, type: 'text' },
  { field: 'sku_code', label: '商品编码', required: true, type: 'string', rules: { min: 4, max: 100 } },
];

class GoodsValidateService {
  private readonly goodsDao = daos.goodsDao;
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly brandAuthorizationDao = daos.brandAuthorizationDao;

  async validateCreate(data: GoodsCreateValidateData): Promise<ValidateResult> {
    const errors: ValidateError[] = [];
    const { merchant_id, category_id, brand_id, sku_code } = data;

    if (!merchant_id) {
      errors.push({ field: 'merchant_id', message: '缺少商家ID', code: 'MERCHANT_ID_REQUIRED' });
    } else {
      const merchant = await this.merchantDao.findById(merchant_id);
      if (!merchant) {
        errors.push({ field: 'merchant_id', message: '商家不存在', code: 'MERCHANT_NOT_FOUND' });
      } else if (merchant.status !== 1) {
        errors.push({ field: 'merchant_id', message: '商家未入驻或已被禁用', code: 'MERCHANT_NOT_ACTIVE' });
      }
    }

    if (!category_id) {
      errors.push({ field: 'category_id', message: '缺少类目ID', code: 'CATEGORY_ID_REQUIRED' });
    } else if (merchant_id) {
      const qualifications = await this.merchantQualificationDao.findValidByMerchantAndCategory(
        merchant_id,
        category_id
      );
      if (qualifications.length === 0) {
        errors.push({ field: 'category_id', message: '商家无该类目经营资质', code: 'CATEGORY_QUALIFICATION_MISSING' });
      }
    }

    if (brand_id && merchant_id) {
      const authorizations = await this.brandAuthorizationDao.findValidByMerchantAndBrand(
        merchant_id,
        brand_id
      );
      if (authorizations.length === 0) {
        errors.push({ field: 'brand_id', message: '品牌授权无效或已过期', code: 'BRAND_AUTHORIZATION_INVALID' });
      }
    }

    if (sku_code) {
      const skuResult = await this.validateSkuUniqueness(sku_code);
      if (!skuResult.valid) {
        errors.push(...skuResult.errors);
      }
    }

    if (brand_id && category_id && merchant_id) {
      const comboResult = await this.validateBrandCategoryCombo(brand_id, category_id, merchant_id);
      if (!comboResult.valid) {
        errors.push(...comboResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getCategoryRequiredFields(categoryId: number): CategoryRequiredField[] {
    return CATEGORY_FIELDS_MAP[categoryId] || DEFAULT_CATEGORY_FIELDS;
  }

  async validateSkuUniqueness(sku: string, goodsId?: number): Promise<ValidateResult> {
    const errors: ValidateError[] = [];

    if (!sku || sku.trim().length === 0) {
      errors.push({ field: 'sku_code', message: '商品编码不能为空', code: 'SKU_EMPTY' });
      return { valid: false, errors };
    }

    const where: Record<string, unknown> = { sku_code: sku };
    if (goodsId !== undefined) {
      where.id = { [Op.ne]: goodsId };
    }

    const existingGoods = await this.goodsDao.findAll({ where, limit: 1 });

    if (existingGoods.length > 0) {
      errors.push({ field: 'sku_code', message: `商品编码已存在：${sku}`, code: 'SKU_DUPLICATE' });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateBrandCategoryCombo(
    brandId: number,
    categoryId: number,
    merchantId: number,
    goodsId?: number
  ): Promise<ValidateResult> {
    const errors: ValidateError[] = [];

    const where: Record<string, unknown> = {
      brand_id: brandId,
      category_id: categoryId,
      merchant_id: merchantId,
    };
    if (goodsId !== undefined) {
      where.id = { [Op.ne]: goodsId };
    }

    const existingGoods = await this.goodsDao.findAll({ where, limit: 1 });

    if (existingGoods.length > 0) {
      errors.push({
        field: 'brand_id',
        message: '该商家的品牌+类目组合已存在同款商品',
        code: 'BRAND_CATEGORY_COMBO_DUPLICATE',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const goodsValidateService = new GoodsValidateService();
export default GoodsValidateService;
