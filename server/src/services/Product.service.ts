import {
  productDao,
  productAuditLogDao,
  userDao,
  orderDao,
  productEditApprovalDao,
} from '../dao';
import { ProductAttributes } from '../models/Product.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import {
  ProductStatus,
  ProductAuditStage,
  ProductAuditAction,
  ProductCategory,
  PRODUCT_CATEGORY_COMMISSION_RANGES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_QUALIFICATION_REQUIRED,
  DEFAULT_PRODUCT_MATERIALS,
  PRODUCT_AUDIT_STAGES,
  PRODUCT_REJECT_ISSUE_LABELS,
  PRODUCT_IMPORT_TEMPLATE_FIELDS,
  ProductRejectIssueType,
  ProductEditApprovalStatus,
  PRODUCT_EDIT_APPROVAL_STATUS_LABELS,
  PRODUCT_CORE_FIELDS,
  PRODUCT_CORE_FIELD_LABELS,
  PRODUCT_NON_CORE_FIELDS,
  PRODUCT_BATCH_EDIT_FIELDS,
  PRODUCT_BATCH_EDIT_FIELD_LABELS,
  PRODUCT_CATEGORY_PROMOTION_WEIGHT_DEFAULTS,
} from '../constants/enum';
import CacheUtils, { CacheKey, CacheTTL } from '../utils/cache';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const FIELD_LABEL_MAP: Record<string, string> = {
  name: '商品名称',
  sku: '商品SKU',
  category: '商品分类',
  brand: '品牌',
  description: '商品描述',
  mainImage: '主图',
  images: '商品图片',
  originalPrice: '原价',
  salePrice: '销售价',
  costPrice: '成本价',
  stock: '库存数量',
  commissionRate: '佣金比例',
  minCommission: '最低佣金',
  maxCommission: '最高佣金',
  status: '商品状态',
  qualificationImgs: '资质文件',
  qualificationExpireAt: '资质有效期',
  limitedPromotion: '限时推广',
  promotionStartTime: '推广开始时间',
  promotionEndTime: '推广结束时间',
  isHot: '热销标记',
  isRecommended: '推荐标记',
  sort: '展示排序',
  promotionWeight: '推广权重',
  tags: '商品标签',
  remark: '备注',
  promotionMaterials: '推广素材',
};

interface ProductValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  commissionWarning?: {
    field: string;
    current: number;
    min: number;
    max: number;
    warning: number;
  };
}

interface DuplicateCheckResult {
  duplicate: boolean;
  duplicates: Array<{ id: string; name: string; sku: string }>;
}

interface BatchImportResult {
  total: number;
  success: number;
  failed: number;
  details: Array<{
    index: number;
    data?: any;
    status: 'success' | 'failed';
    reason?: string;
    errors?: string[];
  }>;
}

interface BatchListResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: Array<{
    id: string;
    name: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

interface TraceabilityRecord {
  stage: string;
  stageLabel: string;
  operatorId?: string;
  operatorName?: string;
  operateAt?: Date;
  remark?: string;
}

interface FieldDiff {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  isCore: boolean;
}

interface EditProductResult {
  updated: any;
  changedFields: FieldDiff[];
  needApproval: boolean;
  approvalId?: string;
}

interface AdjustCommissionResult {
  product: any;
  oldCommissionRate: number;
  newCommissionRate: number;
  affectedOrderCount: number;
  effectiveTime: Date;
  preservedCommissionForExisting: boolean;
}

interface BatchEditResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: Array<{
    id: string;
    name: string;
    status: 'success' | 'failed' | 'skipped';
    reason?: string;
    changes?: FieldDiff[];
  }>;
}

interface EditApprovalSubmitResult {
  approvalId: string;
  product: any;
  coreFields: FieldDiff[];
  nonCoreFields: FieldDiff[];
  affectedOrderCount: number;
}

const SUBMIT_LOCK_TTL = 1;

function getFieldLabel(field: string): string {
  return FIELD_LABEL_MAP[field] || field;
}

function validatePrice(originalPrice: number, salePrice: number, costPrice?: number): boolean {
  if (originalPrice <= 0 || salePrice <= 0) return false;
  if (salePrice > originalPrice) return false;
  if (costPrice !== undefined && costPrice > salePrice) return false;
  return true;
}

function validateStock(stock: number): boolean {
  return Number.isInteger(stock) && stock >= 0;
}

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function compareFieldDiff(
  oldData: any,
  newData: any,
  fields: string[]
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of fields) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (normalizeValue(oldVal) !== normalizeValue(newVal)) {
      diffs.push({
        field,
        fieldLabel: getFieldLabel(field),
        oldValue: oldVal,
        newValue: newVal,
        isCore: PRODUCT_CORE_FIELDS.includes(field),
      });
    }
  }
  return diffs;
}

function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'number' && value < 1) return (value * 100).toFixed(2) + '%';
  if (Array.isArray(value)) return '[' + value.join(', ') + ']';
  return String(value);
}

function generateDiffSummary(diffs: FieldDiff[]): string {
  return diffs
    .map(
      (d) =>
        d.fieldLabel +
        ': ' +
        formatValueForDisplay(d.oldValue) +
        ' → ' +
        formatValueForDisplay(d.newValue)
    )
    .join('; ');
}

function isCoreField(field: string): boolean {
  return PRODUCT_CORE_FIELDS.includes(field);
}

function isBatchEditAllowedField(field: string): boolean {
  return PRODUCT_BATCH_EDIT_FIELDS.includes(field);
}

async function checkProductHasOrders(productId: string, sku?: string): Promise<{ hasOrders: boolean; count: number }> {
  const where: any = {};
  if (productId) {
    where.productSku = { [Op.like]: '%' + sku + '%' } as any;
  }
  const count = await orderDao.count({ where });
  return { hasOrders: count > 0, count };
}

async function countProductOrders(productId: string, sku?: string, beforeTime?: Date): Promise<number> {
  const where: any = {};
  if (sku) {
    where.productSku = { [Op.like]: '%' + sku + '%' } as any;
  }
  if (beforeTime) {
    where.createdAt = { [Op.lt]: beforeTime } as any;
  }
  return orderDao.count({ where });
}

class ProductService {
  public async validateProduct(
    data: Partial<ProductAttributes> & { [key: string]: any },
    excludeProductId?: string
  ): Promise<ProductValidateResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let commissionWarning: ProductValidateResult['commissionWarning'];

    if (!data.name) {
      errors.push('商品名称不能为空');
    } else if (data.name.length > 200) {
      errors.push('商品名称不能超过200个字符');
    }

    if (!data.sku) {
      errors.push('商品SKU不能为空');
    } else if (data.sku.length > 100) {
      errors.push('商品SKU不能超过100个字符');
    }

    if (!data.category) {
      errors.push('商品分类不能为空');
    } else {
      const categories = Object.values(ProductCategory);
      if (!categories.includes(data.category as ProductCategory)) {
        errors.push('商品分类无效');
      }
    }

    if (data.originalPrice === undefined || data.originalPrice === null) {
      errors.push('原价不能为空');
    }
    if (data.salePrice === undefined || data.salePrice === null) {
      errors.push('销售价不能为空');
    }
    if (data.stock === undefined || data.stock === null) {
      errors.push('库存数量不能为空');
    }

    if (data.originalPrice !== undefined && data.salePrice !== undefined) {
      const op = Number(data.originalPrice);
      const sp = Number(data.salePrice);
      const cp = data.costPrice !== undefined ? Number(data.costPrice) : undefined;
      if (!validatePrice(op, sp, cp)) {
        errors.push('价格体系不合法：销售价必须大于0且不超过原价，成本价不能高于销售价');
      } else {
        const profitRate = (sp - (cp || op * 0.5)) / sp;
        if (profitRate < 0.05) {
          warnings.push('利润率过低，请确认价格设置是否合理');
        }
        if (profitRate > 0.8) {
          warnings.push('利润率过高，存在暴利嫌疑，请核实');
        }
      }
    }

    if (data.stock !== undefined && data.stock !== null) {
      if (!validateStock(Number(data.stock))) {
        errors.push('库存数量必须是非负整数');
      } else if (Number(data.stock) === 0) {
        warnings.push('当前库存为0，提交后将无法正常推广销售');
      }
    }

    if (data.commissionRate === undefined || data.commissionRate === null) {
      errors.push('佣金比例不能为空');
    } else {
      const rate = Number(data.commissionRate);
      if (isNaN(rate) || rate <= 0 || rate > 1) {
        errors.push('佣金比例必须在0到1之间');
      } else if (data.category) {
        const range = PRODUCT_CATEGORY_COMMISSION_RANGES[data.category as ProductCategory];
        if (range) {
          if (rate < range.min || rate > range.max) {
            errors.push(
              '佣金比例超出' + data.category + '类商品佣金区间[' + (range.min * 100) + '%, ' + (range.max * 100) + '%]'
            );
          } else if (rate >= range.warning) {
            commissionWarning = {
              field: 'commissionRate',
              current: rate,
              min: range.min,
              max: range.max,
              warning: range.warning,
            };
            warnings.push(
              '佣金比例(' + (rate * 100) + '%)已接近行业阈值上限(' + (range.warning * 100) + '%)，请审慎设置'
            );
          }
        }
      }
    }

    if (data.category && PRODUCT_QUALIFICATION_REQUIRED.includes(data.category as ProductCategory)) {
      if (!data.qualificationImgs || (Array.isArray(data.qualificationImgs) && data.qualificationImgs.length === 0)) {
        errors.push(data.category + '类商品必须上传资质文件');
      }
      if (data.qualificationExpireAt) {
        const expireDate = dayjs(data.qualificationExpireAt);
        if (!expireDate.isValid()) {
          errors.push('资质有效期格式不正确');
        } else if (expireDate.isBefore(dayjs())) {
          errors.push('资质已过期');
        } else if (expireDate.diff(dayjs(), 'day') < 30) {
          warnings.push('资质将在' + expireDate.diff(dayjs(), 'day') + '天后过期');
        }
      }
    }

    if (data.limitedPromotion) {
      if (!data.promotionStartTime || !data.promotionEndTime) {
        errors.push('限时推广必须设置开始和结束时间');
      } else {
        const start = dayjs(data.promotionStartTime);
        const end = dayjs(data.promotionEndTime);
        if (!start.isValid() || !end.isValid()) {
          errors.push('推广时间格式不正确');
        } else if (end.isBefore(start)) {
          errors.push('推广结束时间不能早于开始时间');
        } else if (start.isBefore(dayjs())) {
          warnings.push('推广开始时间已过去');
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings, commissionWarning };
  }

  public async checkDuplicate(
    data: { sku?: string; name?: string },
    excludeProductId?: string
  ): Promise<DuplicateCheckResult> {
    const duplicates: DuplicateCheckResult['duplicates'] = [];

    if (data.sku) {
      const bySku = await productDao.findBySku(data.sku);
      if (bySku && bySku.id !== excludeProductId) {
        duplicates.push({
          id: bySku.id,
          name: bySku.name,
          sku: bySku.sku,
        });
      }
    }

    if (data.name) {
      const byName = await productDao.checkDuplicate(data.name, excludeProductId);
      byName.forEach((p) => {
        if (!duplicates.find((d) => d.id === p.id)) {
          duplicates.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
          });
        }
      });
    }

    return { duplicate: duplicates.length > 0, duplicates };
  }

  public async checkFakeProduct(
    data: Partial<ProductAttributes>
  ): Promise<{ isFake: boolean; reason?: string }> {
    const name = (data.name || '').toLowerCase();
    const description = (data.description || '').toLowerCase();
    const suspiciousKeywords = ['测试', 'test', 'fake', '虚假', '仿冒'];

    for (const keyword of suspiciousKeywords) {
      if (name.includes(keyword) || description.includes(keyword)) {
        return { isFake: true, reason: '商品名称或描述包含违禁关键词：' + keyword };
      }
    }

    const op = Number(data.originalPrice || 0);
    const sp = Number(data.salePrice || 0);
    if (op > 0 && sp > 0) {
      const discountRate = sp / op;
      if (discountRate < 0.1) {
        return {
          isFake: true,
          reason: '折扣力度异常（' + (discountRate * 100).toFixed(1) + '%），疑似虚假商品',
        };
      }
    }

    return { isFake: false };
  }

  private async recordAuditLog(params: {
    productId: string;
    operatorId: string;
    operatorName: string;
    action: ProductAuditAction;
    fromStage?: ProductAuditStage;
    toStage: ProductAuditStage;
    fromStatus?: ProductStatus;
    toStatus: ProductStatus;
    fieldName?: string;
    fieldLabel?: string;
    oldValue?: string;
    newValue?: string;
    remark?: string;
    metadata?: any;
    ipAddress?: string;
  }): Promise<void> {
    await productAuditLogDao.create({
      ...params,
    });
  }

  public async createProduct(
    data: Partial<ProductAttributes> & { [key: string]: any },
    operatorId: string,
    ipAddress?: string
  ): Promise<any> {
    const lockKey = CacheKey.PRODUCT_SUBMIT_LOCK + 'create:' + operatorId + ':' + (data.sku || 'new');
    const locked = await CacheUtils.exists(lockKey);
    if (locked) {
      throw new AppError('操作过于频繁，请稍后再试', BusinessCode.ERROR);
    }
    await CacheUtils.set(lockKey, '1', SUBMIT_LOCK_TTL);

    try {
      const validation = await this.validateProduct(data);
      if (!validation.valid) {
        throw new AppError(validation.errors.join('；'), BusinessCode.PARAM_ERROR);
      }

      const fakeCheck = await this.checkFakeProduct(data);
      if (fakeCheck.isFake) {
        throw new AppError('疑似虚假商品：' + fakeCheck.reason, BusinessCode.PARAM_ERROR);
      }

      const dupCheck = await this.checkDuplicate({ sku: data.sku, name: data.name });
      if (dupCheck.duplicate) {
        const dupMsgs = dupCheck.duplicates.map((d) => 'SKU「' + d.sku + '」- ' + d.name);
        throw new AppError('检测到重复商品：' + dupMsgs.join('；'), BusinessCode.ERROR);
      }

      const operator = await userDao.findById(operatorId);
      const operatorName = (operator as any)?.nickname || operator?.username || '系统';

      const category = data.category as ProductCategory;
      const defaultMaterials = DEFAULT_PRODUCT_MATERIALS[category] || [];
      const materials = data.promotionMaterials || defaultMaterials;

      const product = await productDao.create({
        ...data,
        status: ProductStatus.DRAFT,
        auditStage: ProductAuditStage.PENDING_SUBMIT,
        promotionMaterials: materials,
        promoteEnabled: false,
        submitterId: operatorId,
        fakeProductFlag: false,
        complianceScore: 100,
      } as any);

      await this.recordAuditLog({
        productId: product.id,
        operatorId,
        operatorName,
        action: ProductAuditAction.SUBMIT,
        fromStage: ProductAuditStage.PENDING_SUBMIT,
        toStage: ProductAuditStage.PENDING_SUBMIT,
        fromStatus: ProductStatus.DRAFT,
        toStatus: ProductStatus.DRAFT,
        remark: '创建商品草稿',
        metadata: { warnings: validation.warnings },
        ipAddress,
      });

      await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

      return {
        product,
        warnings: validation.warnings,
        commissionWarning: validation.commissionWarning,
      };
    } finally {
      setTimeout(() => {
        CacheUtils.del(lockKey);
      }, 300);
    }
  }

  public async submitForAudit(
    productId: string,
    operatorId: string,
    ipAddress?: string
  ): Promise<any> {
    const lockKey = CacheKey.PRODUCT_SUBMIT_LOCK + 'submit:' + productId;
    const locked = await CacheUtils.exists(lockKey);
    if (locked) {
      throw new AppError('操作过于频繁，请稍后再试', BusinessCode.ERROR);
    }
    await CacheUtils.set(lockKey, '1', SUBMIT_LOCK_TTL);

    try {
      const product = await productDao.findById(productId);
      if (!product) {
        throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
      }
      if (
        (product as any).status !== ProductStatus.DRAFT &&
        (product as any).status !== ProductStatus.AUDIT_REJECTED
      ) {
        throw new AppError('只有草稿或审核驳回状态的商品才能提交审核', BusinessCode.ERROR);
      }

      const plain = product.get({ plain: true });
      const validation = await this.validateProduct(plain as any);
      if (!validation.valid) {
        throw new AppError(validation.errors.join('；'), BusinessCode.PARAM_ERROR);
      }

      const operator = await userDao.findById(operatorId);
      const operatorName = (operator as any)?.nickname || operator?.username || '系统';

      const oldStatus = (product as any).status;
      const oldStage = (product as any).auditStage;

      await productDao.update(
        {
          status: ProductStatus.PENDING_AUDIT,
          auditStage: ProductAuditStage.QUALIFICATION_AUDIT,
          submitterId: operatorId,
          submitAt: new Date(),
        } as any,
        { where: { id: productId } }
      );

      await this.recordAuditLog({
        productId,
        operatorId,
        operatorName,
        action: ProductAuditAction.SUBMIT,
        fromStage: oldStage,
        toStage: ProductAuditStage.QUALIFICATION_AUDIT,
        fromStatus: oldStatus,
        toStatus: ProductStatus.PENDING_AUDIT,
        remark: '提交商品审核',
        metadata: { warnings: validation.warnings },
        ipAddress,
      });

      await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
      await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

      return { warnings: validation.warnings };
    } finally {
      setTimeout(() => {
        CacheUtils.del(lockKey);
      }, 300);
    }
  }

  public async auditProduct(
    productId: string,
    reviewerId: string,
    stage: ProductAuditStage,
    passed: boolean,
    remark?: string,
    rejectIssueType?: ProductRejectIssueType,
    rejectCustomRemark?: string,
    ipAddress?: string
  ): Promise<void> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }
    if ((product as any).status !== ProductStatus.PENDING_AUDIT) {
      throw new AppError('只有待审核状态的商品才能进行审核操作', BusinessCode.ERROR);
    }
    if ((product as any).auditStage !== stage) {
      throw new AppError('当前审核阶段不匹配', BusinessCode.ERROR);
    }

    const reviewer = await userDao.findById(reviewerId);
    const reviewerName = (reviewer as any)?.nickname || reviewer?.username || '系统';

    const oldStage = (product as any).auditStage;
    const oldStatus = (product as any).status;

    if (passed) {
      let nextStage = stage;
      let nextStatus = ProductStatus.PENDING_AUDIT;
      let action: ProductAuditAction;

      switch (stage) {
        case ProductAuditStage.QUALIFICATION_AUDIT:
          nextStage = ProductAuditStage.PRICE_AUDIT;
          action = ProductAuditAction.QUALIFICATION_PASS;
          break;
        case ProductAuditStage.PRICE_AUDIT:
          nextStage = ProductAuditStage.COMMISSION_AUDIT;
          action = ProductAuditAction.PRICE_PASS;
          break;
        case ProductAuditStage.COMMISSION_AUDIT:
          nextStage = ProductAuditStage.COMPLETED;
          nextStatus = ProductStatus.AUDIT_PASSED;
          action = ProductAuditAction.COMMISSION_PASS;
          break;
        default:
          throw new AppError('无效的审核阶段', BusinessCode.PARAM_ERROR);
      }

      const stageConfig = PRODUCT_AUDIT_STAGES.find((s) => s.key === stage);
      const stageLabel = stageConfig ? stageConfig.label : '';

      await productDao.update(
        {
          auditStage: nextStage,
          status: nextStatus,
          auditorId: reviewerId,
          auditAt: new Date(),
          auditRemark: remark,
          qualificationVerified:
            stage === ProductAuditStage.QUALIFICATION_AUDIT ? true : (product as any).qualificationVerified,
        } as any,
        { where: { id: productId } }
      );

      await this.recordAuditLog({
        productId,
        operatorId: reviewerId,
        operatorName: reviewerName,
        action,
        fromStage: oldStage,
        toStage: nextStage,
        fromStatus: oldStatus,
        toStatus: nextStatus,
        remark: remark || stageLabel + '审核通过',
        ipAddress,
      });
    } else {
      await productDao.update(
        {
          status: ProductStatus.AUDIT_REJECTED,
          auditStage: ProductAuditStage.REJECTED,
          auditorId: reviewerId,
          auditAt: new Date(),
          auditRemark: remark,
          rejectIssueType,
          rejectCustomRemark,
          rejectedAt: new Date(),
        } as any,
        { where: { id: productId } }
      );

      let action: ProductAuditAction;
      switch (stage) {
        case ProductAuditStage.QUALIFICATION_AUDIT:
          action = ProductAuditAction.QUALIFICATION_REJECT;
          break;
        case ProductAuditStage.PRICE_AUDIT:
          action = ProductAuditAction.PRICE_REJECT;
          break;
        case ProductAuditStage.COMMISSION_AUDIT:
          action = ProductAuditAction.COMMISSION_REJECT;
          break;
        default:
          action = ProductAuditAction.COMMISSION_REJECT;
      }

      const issueLabel = rejectIssueType ? PRODUCT_REJECT_ISSUE_LABELS[rejectIssueType] : '';

      await this.recordAuditLog({
        productId,
        operatorId: reviewerId,
        operatorName: reviewerName,
        action,
        fromStage: oldStage,
        toStage: ProductAuditStage.REJECTED,
        fromStatus: oldStatus,
        toStatus: ProductStatus.AUDIT_REJECTED,
        fieldName: 'rejectIssueType',
        fieldLabel: '驳回原因',
        oldValue: '',
        newValue: issueLabel,
        remark: remark || rejectCustomRemark || '审核驳回',
        metadata: { rejectIssueType, rejectCustomRemark },
        ipAddress,
      });
    }

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async listProduct(
    productId: string,
    operatorId: string,
    listStartTime?: string,
    listEndTime?: string,
    limitedPromotion?: boolean,
    promotionStartTime?: string,
    promotionEndTime?: string,
    ipAddress?: string
  ): Promise<void> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }
    if (
      (product as any).status !== ProductStatus.AUDIT_PASSED &&
      (product as any).status !== ProductStatus.DELISTED
    ) {
      throw new AppError('只有审核通过或已下架状态的商品才能上架', BusinessCode.ERROR);
    }

    const plain = product.get({ plain: true });
    if (Number(plain.stock) <= 0) {
      throw new AppError('商品库存为0，无法上架', BusinessCode.ERROR);
    }
    if (
      !(plain as any).qualificationVerified &&
      PRODUCT_QUALIFICATION_REQUIRED.includes(plain.category as ProductCategory)
    ) {
      throw new AppError('商品资质未通过审核，无法上架', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const category = plain.category as ProductCategory;
    const materials = (plain as any).promotionMaterials || DEFAULT_PRODUCT_MATERIALS[category] || [];

    const oldStatus = (product as any).status;
    const oldStage = (product as any).auditStage;

    const updateData: any = {
      status: ProductStatus.LISTED,
      promoteEnabled: true,
      listerId: operatorId,
      listAt: new Date(),
      promotionMaterials: materials,
    };

    if (listStartTime) updateData.listStartTime = new Date(listStartTime);
    if (listEndTime) updateData.listEndTime = new Date(listEndTime);
    if (limitedPromotion !== undefined) updateData.limitedPromotion = limitedPromotion;
    if (promotionStartTime) updateData.promotionStartTime = new Date(promotionStartTime);
    if (promotionEndTime) updateData.promotionEndTime = new Date(promotionEndTime);

    await productDao.update(updateData, { where: { id: productId } });

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.LIST,
      fromStage: oldStage,
      toStage: ProductAuditStage.COMPLETED,
      fromStatus: oldStatus,
      toStatus: ProductStatus.LISTED,
      remark: '商品上架',
      metadata: { listStartTime, listEndTime, limitedPromotion, promotionStartTime, promotionEndTime },
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async delistProduct(
    productId: string,
    operatorId: string,
    remark?: string,
    ipAddress?: string
  ): Promise<void> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }
    if ((product as any).status !== ProductStatus.LISTED) {
      throw new AppError('只有已上架状态的商品才能下架', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const oldStatus = (product as any).status;
    const oldStage = (product as any).auditStage;

    await productDao.update(
      {
        status: ProductStatus.DELISTED,
        promoteEnabled: false,
        delisterId: operatorId,
        delistAt: new Date() as any,
      } as any,
      { where: { id: productId } }
    );

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.DELIST,
      fromStage: oldStage,
      toStage: oldStage,
      fromStatus: oldStatus,
      toStatus: ProductStatus.DELISTED,
      remark: remark || '商品下架',
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async offlineProduct(
    productId: string,
    operatorId: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const oldStatus = (product as any).status;
    const oldStage = (product as any).auditStage;

    await productDao.update(
      {
        status: ProductStatus.OFFLINE,
        promoteEnabled: false,
        fakeProductFlag: true,
        fakeProductReason: reason,
      } as any,
      { where: { id: productId } }
    );

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.OFFLINE,
      fromStage: oldStage,
      toStage: ProductAuditStage.REJECTED,
      fromStatus: oldStatus,
      toStatus: ProductStatus.OFFLINE,
      remark: reason || '商品强制下线',
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async batchImport(
    products: Array<Partial<ProductAttributes> & { [key: string]: any }>,
    operatorId: string
  ): Promise<BatchImportResult> {
    if (!products || products.length === 0) {
      throw new AppError('请选择要导入的商品数据', BusinessCode.PARAM_ERROR);
    }
    if (products.length > 500) {
      throw new AppError('单次导入商品数量不能超过500条', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchImportResult['details'] = [];
    let success = 0;
    let failed = 0;
    const createPromises: Promise<any>[] = [];

    products.forEach((item, index) => {
      createPromises.push(
        (async () => {
          try {
            const validation = await this.validateProduct(item);
            if (!validation.valid) {
              failed++;
              details.push({
                index: index + 1,
                data: item,
                status: 'failed',
                errors: validation.errors,
              });
              return;
            }

            const fakeCheck = await this.checkFakeProduct(item);
            if (fakeCheck.isFake) {
              failed++;
              details.push({
                index: index + 1,
                data: item,
                status: 'failed',
                errors: ['疑似虚假商品：' + fakeCheck.reason],
              });
              return;
            }

            const dupCheck = await this.checkDuplicate({ sku: item.sku, name: item.name });
            if (dupCheck.duplicate) {
              failed++;
              details.push({
                index: index + 1,
                data: item,
                status: 'failed',
                errors: ['重复商品'],
              });
              return;
            }

            const category = item.category as ProductCategory;
            const defaultMaterials = DEFAULT_PRODUCT_MATERIALS[category] || [];

            const product = await productDao.create({
              ...item,
              status: ProductStatus.DRAFT,
              auditStage: ProductAuditStage.PENDING_SUBMIT,
              promotionMaterials: item.promotionMaterials || defaultMaterials,
              promoteEnabled: false,
              submitterId: operatorId,
              fakeProductFlag: false,
              complianceScore: 100,
            } as any);

            await this.recordAuditLog({
              productId: product.id,
              operatorId,
              operatorName,
              action: ProductAuditAction.SUBMIT,
              fromStage: ProductAuditStage.PENDING_SUBMIT,
              toStage: ProductAuditStage.PENDING_SUBMIT,
              fromStatus: ProductStatus.DRAFT,
              toStatus: ProductStatus.DRAFT,
              remark: '批量导入创建商品',
              metadata: { batch: true, index: index + 1 },
            });

            success++;
            details.push({
              index: index + 1,
              data: { id: product.id, sku: product.sku, name: product.name },
              status: 'success',
            });
          } catch (err: any) {
            failed++;
            details.push({
              index: index + 1,
              data: item,
              status: 'failed',
              errors: [err.message || '导入失败'],
            });
          }
        })()
      );
    });

    await Promise.all(createPromises);

    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    return {
      total: products.length,
      success,
      failed,
      details,
    };
  }

  public async batchList(
    productIds: string[],
    operatorId: string,
    ipAddress?: string
  ): Promise<BatchListResult> {
    if (!productIds || productIds.length === 0) {
      throw new AppError('请选择要上架的商品', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchListResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of productIds) {
      try {
        const product = await productDao.findById(id);
        if (!product) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '商品不存在' });
          continue;
        }

        const plain = product.get({ plain: true });
        const status = (product as any).status;
        const name = product.name;

        if (status !== ProductStatus.AUDIT_PASSED && status !== ProductStatus.DELISTED) {
          skipped++;
          const statusLabel = PRODUCT_STATUS_LABELS[status as ProductStatus]?.label || String(status);
          details.push({
            id,
            name,
            status: 'skipped',
            reason: '当前状态「' + statusLabel + '」不支持上架操作',
          });
          continue;
        }

        if (Number(plain.stock) <= 0) {
          skipped++;
          details.push({
            id,
            name,
            status: 'skipped',
            reason: '库存不足',
          });
          continue;
        }

        if (
          !(plain as any).qualificationVerified &&
          PRODUCT_QUALIFICATION_REQUIRED.includes(plain.category as ProductCategory)
        ) {
          skipped++;
          details.push({
            id,
            name,
            status: 'skipped',
            reason: '资质未审核通过',
          });
          continue;
        }

        const category = plain.category as ProductCategory;
        const materials = (plain as any).promotionMaterials || DEFAULT_PRODUCT_MATERIALS[category] || [];

        await productDao.update(
          {
            status: ProductStatus.LISTED,
            promoteEnabled: true,
            promotionMaterials: materials,
            listerId: operatorId,
            listAt: new Date(),
          } as any,
          { where: { id } }
        );

        await this.recordAuditLog({
          productId: id,
          operatorId,
          operatorName,
          action: ProductAuditAction.LIST,
          fromStage: (product as any).auditStage,
          toStage: ProductAuditStage.COMPLETED,
          fromStatus: status,
          toStatus: ProductStatus.LISTED,
          remark: '批量上架商品',
          metadata: { batch: true },
          ipAddress,
        });

        success++;
        details.push({ id, name, status: 'success' });
      } catch (err: any) {
        failed++;
        const product = await productDao.findById(id);
        details.push({
          id,
          name: product?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    return {
      total: productIds.length,
      success,
      failed,
      skipped,
      details,
    };
  }

  public async getProductList(
    params: PaginationParams & { [key: string]: any }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize, ...query } = params;
    const cacheKey = CacheKey.PRODUCT_LIST + JSON.stringify(params);
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const { rows, count } = await productDao.findAllPaged({
      page,
      pageSize,
      ...query,
    });

    const list = rows.map((row: any) => {
      const plain = row.get({ plain: true });
      return {
        ...plain,
        statusLabel: PRODUCT_STATUS_LABELS[plain.status as ProductStatus]?.label,
      };
    });

    const result: PaginationResult<any> = {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.SHORT);
    return result;
  }

  public async getProductDetail(productId: string): Promise<any> {
    const cacheKey = CacheKey.PRODUCT_DETAIL + productId;
    const cached = await CacheUtils.get(cacheKey);
    if (cached) return cached;

    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });

    const result = {
      ...plain,
      statusLabel: PRODUCT_STATUS_LABELS[plain.status]?.label,
    };

    await CacheUtils.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  }

  public async getAuditLogs(
    productId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await productAuditLogDao.findAllPaged({
      productId,
      page,
      pageSize,
    });

    const logs = rows.map((log: any) => ({
      ...log.get({ plain: true }),
    }));

    return {
      list: logs,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getTraceability(productId: string): Promise<TraceabilityRecord[]> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });
    const logs = await productAuditLogDao.findByProductId(productId);

    const records: TraceabilityRecord[] = [];

    records.push({
      stage: 'create',
      stageLabel: '商品创建',
      operatorId: (plain as any).submitterId,
      operateAt: plain.createdAt,
    });

    if ((plain as any).submitAt) {
      records.push({
        stage: 'submit',
        stageLabel: '提交审核',
        operatorId: (plain as any).submitterId,
        operateAt: (plain as any).submitAt,
      });
    }

    if ((plain as any).auditAt) {
      records.push({
        stage: 'audit',
        stageLabel:
          (plain as any).status === ProductStatus.AUDIT_REJECTED ? '审核驳回' : '审核通过',
        operatorId: (plain as any).auditorId,
        operateAt: (plain as any).auditAt,
        remark: (plain as any).auditRemark,
      });
    }

    if ((plain as any).listAt) {
      records.push({
        stage: 'list',
        stageLabel: '商品上架',
        operatorId: (plain as any).listerId,
        operateAt: (plain as any).listAt,
      });
    }

    if ((plain as any).delistAt) {
      records.push({
        stage: 'delist',
        stageLabel: '商品下架',
        operatorId: (plain as any).delisterId,
        operateAt: new Date((plain as any).delistAt),
      });
    }

    logs.forEach((log) => {
      const logPlain = log.get({ plain: true });
      if (!records.find((r) => r.stage === logPlain.action)) {
        records.push({
          stage: logPlain.action,
          stageLabel: logPlain.remark || logPlain.action,
          operatorId: logPlain.operatorId,
          operatorName: logPlain.operatorName,
          operateAt: logPlain.createdAt,
          remark: logPlain.remark,
        });
      }
    });

    return records.sort((a, b) => {
      if (!a.operateAt) return 1;
      if (!b.operateAt) return -1;
      return new Date(a.operateAt).getTime() - new Date(b.operateAt).getTime();
    });
  }

  public async getImportTemplate() {
    return PRODUCT_IMPORT_TEMPLATE_FIELDS;
  }

  public async getCategoryConfigs() {
    return {
      categories: Object.values(ProductCategory).map((c) => ({
        key: c,
        label: PRODUCT_CATEGORY_LABELS[c],
        commissionRange: PRODUCT_CATEGORY_COMMISSION_RANGES[c],
        needQualification: PRODUCT_QUALIFICATION_REQUIRED.includes(c),
      })),
      auditStages: PRODUCT_AUDIT_STAGES,
      rejectReasons: Object.entries(PRODUCT_REJECT_ISSUE_LABELS).map(([code, label]) => ({ code, label })),
    };
  }

  public async processExpiredProducts(): Promise<{ delisted: number }> {
    const expiredPromotion = await productDao.findExpiredPromotionProducts();
    const expiredList = await productDao.findExpiredListProducts();
    const allExpired = [...expiredPromotion, ...expiredList];
    const uniqueIds = [...new Set(allExpired.map((p) => p.id))];

    let delisted = 0;
    for (const id of uniqueIds) {
      try {
        const product = allExpired.find((p) => p.id === id);
        if (product) {
          await productDao.update(
            {
              status: ProductStatus.DELISTED,
              promoteEnabled: false,
            } as any,
            { where: { id } }
          );
          delisted++;
          await CacheUtils.del(CacheKey.PRODUCT_DETAIL + id);
        }
      } catch (err) {
        console.error('自动下架商品失败:', id, err);
      }
    }

    if (delisted > 0) {
      await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
    }

    return { delisted };
  }

  public async updateProductInfo(
    productId: string,
    operatorId: string,
    data: Partial<ProductAttributes> & { [key: string]: any },
    applyReason?: string,
    ipAddress?: string
  ): Promise<EditProductResult> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });
    const editFields = Object.keys(data);

    const pendingApproval = await productEditApprovalDao.findPendingApproval(productId);
    if (pendingApproval) {
      throw new AppError('该商品已有待审批的修改申请，请先处理', BusinessCode.ERROR);
    }

    const orderInfo = await checkProductHasOrders(productId, plain.sku);
    const allFields = [...new Set([...PRODUCT_CORE_FIELDS, ...PRODUCT_NON_CORE_FIELDS, ...editFields])];
    const allDiffs = compareFieldDiff(plain, data, allFields);
    const coreDiffs = allDiffs.filter((d) => d.isCore);
    const nonCoreDiffs = allDiffs.filter((d) => !d.isCore);

    if (allDiffs.length === 0) {
      return {
        updated: plain,
        changedFields: [],
        needApproval: false,
      };
    }

    if (orderInfo.hasOrders && coreDiffs.length > 0) {
      const coreFieldNames = coreDiffs.map((d) => d.fieldLabel).join('、');
      throw new AppError(
        '该商品已产生' + orderInfo.count + '笔推广订单，禁止修改核心字段：' + coreFieldNames + '。如需修改请提交特殊审批',
        BusinessCode.ERROR
      );
    }

    const coreEditConflicts = coreDiffs.filter((d) => {
      const oldVal = Number((plain as any)[d.field] || 0);
      const newVal = Number((data as any)[d.field] || 0);
      if (d.field === 'commissionRate') {
        const range = PRODUCT_CATEGORY_COMMISSION_RANGES[plain.category as ProductCategory];
        return range && (newVal < range.min || newVal > range.max);
      }
      if (d.field.includes('Price')) {
        return newVal <= 0 || (d.field === 'salePrice' && newVal > Number(plain.originalPrice));
      }
      return false;
    });

    if (coreEditConflicts.length > 0) {
      const conflictMsgs = coreEditConflicts.map((d) => d.fieldLabel + '参数设置冲突');
      throw new AppError('参数修改冲突：' + conflictMsgs.join('；'), BusinessCode.PARAM_ERROR);
    }

    const validation = await this.validateProduct({ ...plain, ...data }, productId);
    if (!validation.valid) {
      throw new AppError(validation.errors.join('；'), BusinessCode.PARAM_ERROR);
    }

    if (data.sku || data.name) {
      const dupCheck = await this.checkDuplicate({ sku: data.sku, name: data.name }, productId);
      if (dupCheck.duplicate) {
        const dupMsgs = dupCheck.duplicates.map((d) => 'SKU「' + d.sku + '」- ' + d.name);
        throw new AppError('检测到重复商品：' + dupMsgs.join('；'), BusinessCode.ERROR);
      }
    }

    const fakeCheck = await this.checkFakeProduct({ ...plain, ...data });
    if (fakeCheck.isFake) {
      throw new AppError('疑似虚假商品：' + fakeCheck.reason, BusinessCode.PARAM_ERROR);
    }

    if (coreDiffs.length > 0) {
      if (!applyReason || applyReason.trim().length < 5) {
        throw new AppError('修改核心字段必须填写修改原因（至少5个字符）', BusinessCode.PARAM_ERROR);
      }

      const operator = await userDao.findById(operatorId);
      const operatorName = (operator as any)?.nickname || operator?.username || '系统';

      const approval = await productEditApprovalDao.create({
        productId,
        applicantId: operatorId,
        applicantName: operatorName,
        applyReason: applyReason.trim(),
        editFields: allDiffs.map((d) => d.field),
        oldValues: allDiffs.reduce((acc, d) => {
          acc[d.field] = d.oldValue;
          return acc;
        }, {} as any),
        newValues: allDiffs.reduce((acc, d) => {
          acc[d.field] = d.newValue;
          return acc;
        }, {} as any),
        diffSummary: generateDiffSummary(allDiffs),
        affectedOrderCount: orderInfo.count,
      });

      await this.recordAuditLog({
        productId,
        operatorId,
        operatorName,
        action: ProductAuditAction.EDIT_CORE,
        fromStage: (product as any).auditStage,
        toStage: (product as any).auditStage,
        fromStatus: (product as any).status,
        toStatus: (product as any).status,
        remark: '提交核心字段修改审批，申请编号：' + approval.id,
        metadata: {
          approvalId: approval.id,
          changes: allDiffs,
          orderCount: orderInfo.count,
        },
        ipAddress,
      });

      return {
        updated: plain,
        changedFields: allDiffs,
        needApproval: true,
        approvalId: approval.id,
      };
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const updateData: any = {};
    for (const diff of nonCoreDiffs) {
      updateData[diff.field] = diff.newValue;
      await this.recordAuditLog({
        productId,
        operatorId,
        operatorName,
        action: ProductAuditAction.EDIT,
        fromStage: (product as any).auditStage,
        toStage: (product as any).auditStage,
        fromStatus: (product as any).status,
        toStatus: (product as any).status,
        fieldName: diff.field,
        fieldLabel: diff.fieldLabel,
        oldValue: diff.oldValue !== undefined && diff.oldValue !== null ? String(diff.oldValue) : undefined,
        newValue: diff.newValue !== undefined && diff.newValue !== null ? String(diff.newValue) : undefined,
        remark: '修改商品非核心信息',
        ipAddress,
      });
    }

    if (Object.keys(updateData).length > 0) {
      await productDao.update(updateData, { where: { id: productId } });
    }

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    const updated = await this.getProductDetail(productId);

    return {
      updated,
      changedFields: nonCoreDiffs,
      needApproval: false,
    };
  }

  public async adjustCommission(
    productId: string,
    operatorId: string,
    newCommissionRate: number,
    applyReason: string,
    ipAddress?: string
  ): Promise<AdjustCommissionResult> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });
    const oldCommissionRate = Number(plain.commissionRate);

    if (newCommissionRate <= 0 || newCommissionRate > 1) {
      throw new AppError('佣金比例必须在0到1之间', BusinessCode.PARAM_ERROR);
    }

    const range = PRODUCT_CATEGORY_COMMISSION_RANGES[plain.category as ProductCategory];
    if (range && (newCommissionRate < range.min || newCommissionRate > range.max)) {
      throw new AppError(
        '佣金比例超出' + plain.category + '类商品佣金区间[' + (range.min * 100) + '%, ' + (range.max * 100) + '%]',
        BusinessCode.PARAM_ERROR
      );
    }

    if (oldCommissionRate === newCommissionRate) {
      throw new AppError('新佣金比例与当前值相同，无需调整', BusinessCode.PARAM_ERROR);
    }

    const pendingApproval = await productEditApprovalDao.findPendingApproval(productId);
    if (pendingApproval) {
      throw new AppError('该商品已有待审批的修改申请，请先处理', BusinessCode.ERROR);
    }

    const effectiveTime = new Date();
    const affectedOrderCount = await countProductOrders(productId, plain.sku, effectiveTime);

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const approval = await productEditApprovalDao.create({
      productId,
      applicantId: operatorId,
      applicantName: operatorName,
      applyReason,
      editFields: ['commissionRate'],
      oldValues: { commissionRate: oldCommissionRate },
      newValues: { commissionRate: newCommissionRate },
      diffSummary:
        '佣金比例: ' +
        (oldCommissionRate * 100).toFixed(2) +
        '% → ' +
        (newCommissionRate * 100).toFixed(2) +
        '%',
      affectedOrderCount,
      effectiveTime,
    });

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.COMMISSION_ADJUST,
      fromStage: (product as any).auditStage,
      toStage: (product as any).auditStage,
      fromStatus: (product as any).status,
      toStatus: (product as any).status,
      fieldName: 'commissionRate',
      fieldLabel: '佣金比例',
      oldValue: String(oldCommissionRate),
      newValue: String(newCommissionRate),
      remark:
        '调整佣金比例，生效时间：' +
        effectiveTime.toLocaleString() +
        '，存量订单数：' +
        affectedOrderCount +
        '笔',
      metadata: {
        approvalId: approval.id,
        oldCommissionRate,
        newCommissionRate,
        effectiveTime,
        affectedOrderCount,
      },
      ipAddress,
    });

    await productDao.update(
      { commissionRate: newCommissionRate } as any,
      { where: { id: productId } }
    );

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    const updated = await this.getProductDetail(productId);

    return {
      product: updated,
      oldCommissionRate,
      newCommissionRate,
      affectedOrderCount,
      effectiveTime,
      preservedCommissionForExisting: true,
    };
  }

  public async batchEdit(
    productIds: string[],
    operatorId: string,
    data: Partial<ProductAttributes> & { [key: string]: any },
    ipAddress?: string
  ): Promise<BatchEditResult> {
    if (!productIds || productIds.length === 0) {
      throw new AppError('请选择要批量修改的商品', BusinessCode.PARAM_ERROR);
    }

    const editFields = Object.keys(data);
    const invalidFields = editFields.filter((f) => !isBatchEditAllowedField(f));
    if (invalidFields.length > 0) {
      const invalidNames = invalidFields.map((f) => getFieldLabel(f)).join('、');
      throw new AppError('禁止批量修改核心结算参数：' + invalidNames, BusinessCode.PARAM_ERROR);
    }

    if (editFields.length === 0) {
      throw new AppError('请指定要修改的字段', BusinessCode.PARAM_ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const details: BatchEditResult['details'] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const id of productIds) {
      try {
        const product = await productDao.findById(id);
        if (!product) {
          skipped++;
          details.push({ id, name: '-', status: 'skipped', reason: '商品不存在' });
          continue;
        }

        const plain = product.get({ plain: true });
        const pendingApproval = await productEditApprovalDao.findPendingApproval(id);
        if (pendingApproval) {
          skipped++;
          details.push({
            id,
            name: plain.name,
            status: 'skipped',
            reason: '商品有待审批的修改申请',
          });
          continue;
        }

        const finalData: any = { ...data };
        if (data.promotionWeight === undefined || data.promotionWeight === null) {
          if (!data.promotionWeight && data.promotionWeight !== 0) {
            const defaultWeight = PRODUCT_CATEGORY_PROMOTION_WEIGHT_DEFAULTS[plain.category as ProductCategory];
            if (defaultWeight !== undefined) {
              finalData.promotionWeight = defaultWeight;
            }
          }
        }

        if (data.isHot !== undefined && Number(plain.salesCount || 0) < 100) {
          if ((plain as any).isHot && !data.isHot) {
          } else if (!data.isHot) {
          } else {
            finalData.isHot = false;
          }
        }

        const diffs = compareFieldDiff(plain, finalData, editFields);
        if (diffs.length === 0) {
          skipped++;
          details.push({ id, name: plain.name, status: 'skipped', reason: '字段值未变化' });
          continue;
        }

        const updateData: any = {};
        for (const diff of diffs) {
          updateData[diff.field] = diff.newValue;
          await this.recordAuditLog({
            productId: id,
            operatorId,
            operatorName,
            action: ProductAuditAction.BATCH_EDIT,
            fromStage: (product as any).auditStage,
            toStage: (product as any).auditStage,
            fromStatus: (product as any).status,
            toStatus: (product as any).status,
            fieldName: diff.field,
            fieldLabel: diff.fieldLabel,
            oldValue: diff.oldValue !== undefined && diff.oldValue !== null ? String(diff.oldValue) : undefined,
            newValue: diff.newValue !== undefined && diff.newValue !== null ? String(diff.newValue) : undefined,
            remark: '批量修改商品信息',
            metadata: { batch: true },
            ipAddress,
          });
        }

        await productDao.update(updateData, { where: { id } });

        success++;
        details.push({ id, name: plain.name, status: 'success', changes: diffs });
      } catch (err: any) {
        failed++;
        const product = await productDao.findById(id);
        details.push({
          id,
          name: product?.name || '-',
          status: 'failed',
          reason: err.message || '操作失败',
        });
      }
    }

    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
    for (const id of productIds) {
      await CacheUtils.del(CacheKey.PRODUCT_DETAIL + id);
    }

    return {
      total: productIds.length,
      success,
      failed,
      skipped,
      details,
    };
  }

  public async getEditApprovalList(
    params: PaginationParams & {
      productId?: string;
      applicantId?: string;
      approverId?: string;
      status?: ProductEditApprovalStatus;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<PaginationResult<any>> {
    const { page, pageSize, ...query } = params;
    const { rows, count } = await productEditApprovalDao.findAllPaged({
      page,
      pageSize,
      ...query,
    });

    const list = rows.map((row: any) => {
      const plain = row.get({ plain: true });
      const status = plain.status as ProductEditApprovalStatus;
      return {
        ...plain,
        statusLabel: PRODUCT_EDIT_APPROVAL_STATUS_LABELS[status]?.label,
        statusType: PRODUCT_EDIT_APPROVAL_STATUS_LABELS[status]?.type,
      };
    });

    return {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getEditApprovalDetail(approvalId: string): Promise<any> {
    const approval = await productEditApprovalDao.findById(approvalId);
    if (!approval) {
      throw new AppError('审批记录不存在', BusinessCode.NOT_FOUND);
    }

    const plain = approval.get({ plain: true });
    const product = await productDao.findById(plain.productId);

    const allDiffs: FieldDiff[] = plain.editFields.map((field: string) => ({
      field,
      fieldLabel: getFieldLabel(field),
      oldValue: plain.oldValues[field],
      newValue: plain.newValues[field],
      isCore: isCoreField(field),
    }));

    return {
      ...plain,
      statusLabel: PRODUCT_EDIT_APPROVAL_STATUS_LABELS[plain.status]?.label,
      statusType: PRODUCT_EDIT_APPROVAL_STATUS_LABELS[plain.status]?.type,
      productName: product?.name,
      productSku: product?.sku,
      fieldDiffs: allDiffs,
    };
  }

  public async approveEdit(
    approvalId: string,
    approverId: string,
    remark?: string,
    ipAddress?: string
  ): Promise<void> {
    const approval = await productEditApprovalDao.findById(approvalId);
    if (!approval) {
      throw new AppError('审批记录不存在', BusinessCode.NOT_FOUND);
    }
    if ((approval as any).status !== ProductEditApprovalStatus.PENDING) {
      throw new AppError('该申请已处理，无法重复审批', BusinessCode.ERROR);
    }

    const approver = await userDao.findById(approverId);
    const approverName = (approver as any)?.nickname || approver?.username || '系统';

    const plain = approval.get({ plain: true });
    const product = await productDao.findById(plain.productId);
    if (!product) {
      throw new AppError('关联商品不存在', BusinessCode.NOT_FOUND);
    }

    const productPlain = product.get({ plain: true });
    const updateData: any = { ...plain.newValues };
    const effectiveTime = new Date();

    await productDao.update(updateData, { where: { id: plain.productId } });

    await productEditApprovalDao.update(
      {
        status: ProductEditApprovalStatus.APPROVED,
        approverId,
        approverName,
        approveRemark: remark,
        approveAt: effectiveTime,
        effectiveTime,
      } as any,
      { where: { id: approvalId } }
    );

    for (const field of plain.editFields) {
      const oldValue = plain.oldValues[field];
      const newValue = plain.newValues[field];
      await this.recordAuditLog({
        productId: plain.productId,
        operatorId: approverId,
        operatorName: approverName,
        action: ProductAuditAction.EDIT_APPROVE,
        fromStage: (product as any).auditStage,
        toStage: (product as any).auditStage,
        fromStatus: (product as any).status,
        toStatus: (product as any).status,
        fieldName: field,
        fieldLabel: getFieldLabel(field),
        oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : undefined,
        newValue: newValue !== undefined && newValue !== null ? String(newValue) : undefined,
        remark: '审批通过，修改已生效。' + (remark || ''),
        metadata: { approvalId, effectiveTime },
        ipAddress,
      });
    }

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + plain.productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async rejectEdit(
    approvalId: string,
    approverId: string,
    remark: string,
    ipAddress?: string
  ): Promise<void> {
    const approval = await productEditApprovalDao.findById(approvalId);
    if (!approval) {
      throw new AppError('审批记录不存在', BusinessCode.NOT_FOUND);
    }
    if ((approval as any).status !== ProductEditApprovalStatus.PENDING) {
      throw new AppError('该申请已处理，无法重复审批', BusinessCode.ERROR);
    }

    if (!remark || remark.trim().length < 5) {
      throw new AppError('驳回原因至少需要5个字符', BusinessCode.PARAM_ERROR);
    }

    const approver = await userDao.findById(approverId);
    const approverName = (approver as any)?.nickname || approver?.username || '系统';

    const plain = approval.get({ plain: true });
    const product = await productDao.findById(plain.productId);

    await productEditApprovalDao.update(
      {
        status: ProductEditApprovalStatus.REJECTED,
        approverId,
        approverName,
        approveRemark: remark,
        approveAt: new Date(),
      } as any,
      { where: { id: approvalId } }
    );

    await this.recordAuditLog({
      productId: plain.productId,
      operatorId: approverId,
      operatorName: approverName,
      action: ProductAuditAction.EDIT_REJECT,
      fromStage: product ? (product as any).auditStage : ProductAuditStage.PENDING_SUBMIT,
      toStage: product ? (product as any).auditStage : ProductAuditStage.PENDING_SUBMIT,
      fromStatus: product ? (product as any).status : ProductStatus.DRAFT,
      toStatus: product ? (product as any).status : ProductStatus.DRAFT,
      remark: '驳回修改申请：' + remark,
      metadata: { approvalId },
      ipAddress,
    });
  }

  public async getEditHistory(
    productId: string,
    params: PaginationParams
  ): Promise<PaginationResult<any>> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const { page, pageSize } = params;
    const { rows, count } = await productAuditLogDao.findAllPaged({
      productId,
      page,
      pageSize,
    });

    const editActions = [
      ProductAuditAction.EDIT,
      ProductAuditAction.EDIT_CORE,
      ProductAuditAction.EDIT_APPROVE,
      ProductAuditAction.EDIT_REJECT,
      ProductAuditAction.BATCH_EDIT,
      ProductAuditAction.COMMISSION_ADJUST,
    ];

    const editLogs = rows.filter((log: any) => {
      const plain = log.get({ plain: true });
      return editActions.includes(plain.action);
    });

    const list = editLogs.map((log: any) => {
      const plain = log.get({ plain: true });
      let diff: FieldDiff | null = null;
      if (plain.fieldName) {
        diff = {
          field: plain.fieldName,
          fieldLabel: plain.fieldLabel || getFieldLabel(plain.fieldName),
          oldValue: plain.oldValue,
          newValue: plain.newValue,
          isCore: isCoreField(plain.fieldName),
        };
      }
      return {
        id: plain.id,
        action: plain.action,
        operatorId: plain.operatorId,
        operatorName: plain.operatorName,
        operateAt: plain.createdAt,
        remark: plain.remark,
        ipAddress: plain.ipAddress,
        diff,
        metadata: plain.metadata,
      };
    });

    return {
      list,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async getFieldDiff(
    productId: string,
    newData: Partial<ProductAttributes> & { [key: string]: any }
  ): Promise<{
    allDiffs: FieldDiff[];
    coreDiffs: FieldDiff[];
    nonCoreDiffs: FieldDiff[];
    hasOrders: boolean;
    orderCount: number;
    needApproval: boolean;
  }> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });
    const editFields = Object.keys(newData);
    const allFields = [...new Set([...PRODUCT_CORE_FIELDS, ...PRODUCT_NON_CORE_FIELDS, ...editFields])];
    const allDiffs = compareFieldDiff(plain, newData, allFields);
    const coreDiffs = allDiffs.filter((d) => d.isCore);
    const nonCoreDiffs = allDiffs.filter((d) => !d.isCore);

    const orderInfo = await checkProductHasOrders(productId, plain.sku);
    const needApproval = coreDiffs.length > 0;

    return {
      allDiffs,
      coreDiffs,
      nonCoreDiffs,
      hasOrders: orderInfo.hasOrders,
      orderCount: orderInfo.count,
      needApproval,
    };
  }

  public async getEditFieldConfig(): Promise<{
    coreFields: Array<{ field: string; label: string }>;
    nonCoreFields: Array<{ field: string; label: string }>;
    batchEditFields: Array<{ field: string; label: string }>;
  }> {
    return {
      coreFields: PRODUCT_CORE_FIELDS.map((f) => ({
        field: f,
        label: PRODUCT_CORE_FIELD_LABELS[f] || f,
      })),
      nonCoreFields: PRODUCT_NON_CORE_FIELDS.map((f) => ({
        field: f,
        label: FIELD_LABEL_MAP[f] || f,
      })),
      batchEditFields: PRODUCT_BATCH_EDIT_FIELDS.map((f) => ({
        field: f,
        label: PRODUCT_BATCH_EDIT_FIELD_LABELS[f] || f,
      })),
    };
  }
}

export default new ProductService();
