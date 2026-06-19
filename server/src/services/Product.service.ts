import {
  productDao,
  productAuditLogDao,
  userDao,
  orderDao,
  productEditApprovalDao,
  productScheduleRuleDao,
  productListingLogDao,
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
  ProductScheduleRuleStatus,
  ProductScheduleRuleAction,
  ProductScheduleRepeatCycle,
  PRODUCT_SCHEDULE_RULE_STATUS_LABELS,
  PRODUCT_SCHEDULE_RULE_ACTION_LABELS,
  PRODUCT_SCHEDULE_REPEAT_CYCLE_LABELS,
  ProductListingAction,
  ProductListingTrigger,
  PRODUCT_LISTING_ACTION_LABELS,
  PRODUCT_LISTING_TRIGGER_LABELS,
  PRODUCT_FREQUENT_LISTING_THRESHOLD,
  PRODUCT_FREQUENT_LISTING_WINDOW_DAYS,
  PRODUCT_HOT_SALES_THRESHOLD,
  OrderStatus,
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

  public async manualDelist(
    productId: string,
    operatorId: string,
    forceDelist: boolean,
    reason?: string,
    ipAddress?: string
  ): Promise<{
    delisted: boolean;
    activeOrderCount: number;
    autoDelistScheduled: boolean;
    message: string;
  }> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }
    if ((product as any).status !== ProductStatus.LISTED) {
      throw new AppError('只有已上架状态的商品才能下架', BusinessCode.ERROR);
    }

    const plain = product.get({ plain: true });
    const activeOrderCount = await orderDao.count({
      where: {
        productName: plain.name,
        status: {
          [Op.in]: [
            OrderStatus.PENDING_PAY,
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
          ],
        },
      },
    } as any);

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    if (activeOrderCount > 0 && !forceDelist) {
      return {
        delisted: false,
        activeOrderCount,
        autoDelistScheduled: false,
        message: `商品存在${activeOrderCount}个未完结在售订单，请选择强制下架或等待订单完结后自动下架`,
      };
    }

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

    const listingAction = forceDelist
      ? ProductListingAction.FORCE_DELIST
      : ProductListingAction.DELIST;
    const auditAction = forceDelist
      ? ProductAuditAction.FORCE_DELIST
      : ProductAuditAction.DELIST;

    await productListingLogDao.create({
      productId,
      action: listingAction,
      trigger: ProductListingTrigger.MANUAL,
      fromStatus: oldStatus,
      toStatus: ProductStatus.DELISTED,
      operatorId,
      operatorName,
      reason: reason || (forceDelist ? '强制下架' : '手动下架'),
      activeOrderCount,
      forceDelist,
      ipAddress,
      metadata: { forceDelist, activeOrderCount },
    });

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: auditAction,
      fromStage: oldStage,
      toStage: oldStage,
      fromStatus: oldStatus,
      toStatus: ProductStatus.DELISTED,
      remark: reason || (forceDelist ? '强制下架，停止新增推广订单，存量订单正常履约' : '手动下架'),
      metadata: { forceDelist, activeOrderCount },
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    return {
      delisted: true,
      activeOrderCount,
      autoDelistScheduled: false,
      message: forceDelist
        ? `已强制下架，存在${activeOrderCount}个存量订单将正常履约结算，已停止新增推广订单`
        : '商品已下架',
    };
  }

  public async manualList(
    productId: string,
    operatorId: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }
    const currentStatus = (product as any).status;
    if (
      currentStatus !== ProductStatus.AUDIT_PASSED &&
      currentStatus !== ProductStatus.DELISTED
    ) {
      throw new AppError('只有审核通过或已下架状态的商品才能上架', BusinessCode.ERROR);
    }

    const frequentCount = await productListingLogDao.countByProductIdInDays(
      productId,
      PRODUCT_FREQUENT_LISTING_WINDOW_DAYS
    );
    if (frequentCount >= PRODUCT_FREQUENT_LISTING_THRESHOLD) {
      throw new AppError(
        `该商品在${PRODUCT_FREQUENT_LISTING_WINDOW_DAYS}天内上下架操作已达${PRODUCT_FREQUENT_LISTING_THRESHOLD}次，涉嫌频繁上下架操作，已被拦截`,
        BusinessCode.ERROR
      );
    }

    const plain = product.get({ plain: true });
    if (Number(plain.stock) <= 0) {
      throw new AppError('商品库存为0，无法上架', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const oldStatus = currentStatus;
    const oldStage = (product as any).auditStage;

    const category = plain.category as ProductCategory;
    const materials = (plain as any).promotionMaterials || DEFAULT_PRODUCT_MATERIALS[category] || [];

    await productDao.update(
      {
        status: ProductStatus.LISTED,
        promoteEnabled: true,
        listerId: operatorId,
        listAt: new Date(),
        promotionMaterials: materials,
      } as any,
      { where: { id: productId } }
    );

    await productListingLogDao.create({
      productId,
      action: ProductListingAction.LIST,
      trigger: ProductListingTrigger.MANUAL,
      fromStatus: oldStatus,
      toStatus: ProductStatus.LISTED,
      operatorId,
      operatorName,
      reason: reason || '手动上架',
      ipAddress,
    });

    await this.recordAuditLog({
      productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.LIST,
      fromStage: oldStage,
      toStage: ProductAuditStage.COMPLETED,
      fromStatus: oldStatus,
      toStatus: ProductStatus.LISTED,
      remark: reason || '手动上架',
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + productId);
    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');
  }

  public async createScheduleRule(
    data: {
      productId: string;
      ruleName: string;
      action: ProductScheduleRuleAction;
      startTime: string;
      endTime?: string;
      repeatCycle?: ProductScheduleRepeatCycle;
      repeatConfig?: any;
      notifyOperators?: string[];
      remark?: string;
    },
    operatorId: string,
    ipAddress?: string
  ): Promise<any> {
    const product = await productDao.findById(data.productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const start = new Date(data.startTime);
    if (start <= new Date()) {
      throw new AppError('定时规则的开始时间必须晚于当前时间', BusinessCode.PARAM_ERROR);
    }

    if (data.action === ProductScheduleRuleAction.LIST) {
      if (
        (product as any).status !== ProductStatus.AUDIT_PASSED &&
        (product as any).status !== ProductStatus.DELISTED
      ) {
        throw new AppError('只有审核通过或已下架状态的商品才能设置定时上架', BusinessCode.ERROR);
      }
    } else if (data.action === ProductScheduleRuleAction.DELIST) {
      if ((product as any).status !== ProductStatus.LISTED) {
        throw new AppError('只有已上架状态的商品才能设置定时下架', BusinessCode.ERROR);
      }
    }

    const activeRules = await productScheduleRuleDao.findActiveByProductId(data.productId);
    const conflictingRules = activeRules.filter(
      (r: any) => (r as any).action === data.action && (r as any).status !== ProductScheduleRuleStatus.EXECUTED
    );
    if (conflictingRules.length > 0) {
      throw new AppError('该商品已存在相同操作的待执行定时规则，请先取消现有规则', BusinessCode.ERROR);
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    const repeatCycle = data.repeatCycle || ProductScheduleRepeatCycle.NONE;
    let nextExecuteTime = start;

    const rule = await productScheduleRuleDao.create({
      productId: data.productId,
      ruleName: data.ruleName,
      action: data.action,
      startTime: start,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      repeatCycle,
      repeatConfig: data.repeatConfig,
      status: ProductScheduleRuleStatus.PENDING,
      creatorId: operatorId,
      creatorName: operatorName,
      nextExecuteTime,
      executeCount: 0,
      notifyOperators: data.notifyOperators || [],
      remark: data.remark,
    });

    await this.recordAuditLog({
      productId: data.productId,
      operatorId,
      operatorName,
      action: data.action === ProductScheduleRuleAction.LIST
        ? ProductAuditAction.SCHEDULE_LIST
        : ProductAuditAction.SCHEDULE_DELIST,
      fromStage: (product as any).auditStage,
      toStage: (product as any).auditStage,
      fromStatus: (product as any).status,
      toStatus: (product as any).status,
      remark: `创建定时${data.action === ProductScheduleRuleAction.LIST ? '上架' : '下架'}规则：${data.ruleName}`,
      metadata: { ruleId: (rule as any).id, startTime: data.startTime, repeatCycle },
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + data.productId);

    return rule;
  }

  public async updateScheduleRule(
    ruleId: string,
    data: {
      ruleName?: string;
      startTime?: string;
      endTime?: string;
      repeatCycle?: ProductScheduleRepeatCycle;
      repeatConfig?: any;
      notifyOperators?: string[];
      remark?: string;
    },
    operatorId: string,
    ipAddress?: string
  ): Promise<void> {
    const rule = await productScheduleRuleDao.findById(ruleId);
    if (!rule) {
      throw new AppError('定时规则不存在', BusinessCode.NOT_FOUND);
    }

    const plainRule = (rule as any).get ? (rule as any).get({ plain: true }) : rule;
    if (plainRule.status !== ProductScheduleRuleStatus.PENDING) {
      throw new AppError('只有待生效状态的定时规则才能编辑', BusinessCode.ERROR);
    }

    const updateData: any = {};
    if (data.ruleName) updateData.ruleName = data.ruleName;
    if (data.startTime) {
      const start = new Date(data.startTime);
      if (start <= new Date()) {
        throw new AppError('定时规则的开始时间必须晚于当前时间', BusinessCode.PARAM_ERROR);
      }
      updateData.startTime = start;
      updateData.nextExecuteTime = start;
    }
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    }
    if (data.repeatCycle) updateData.repeatCycle = data.repeatCycle;
    if (data.repeatConfig !== undefined) updateData.repeatConfig = data.repeatConfig;
    if (data.notifyOperators) updateData.notifyOperators = data.notifyOperators;
    if (data.remark !== undefined) updateData.remark = data.remark;

    await productScheduleRuleDao.update(updateData, { where: { id: ruleId } });

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    await this.recordAuditLog({
      productId: plainRule.productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.SCHEDULE_LIST,
      fromStage: ProductAuditStage.COMPLETED,
      toStage: ProductAuditStage.COMPLETED,
      fromStatus: ProductStatus.LISTED,
      toStatus: ProductStatus.LISTED,
      remark: `编辑定时规则：${plainRule.ruleName}`,
      metadata: { ruleId, updatedFields: Object.keys(updateData) },
      ipAddress,
    });
  }

  public async cancelScheduleRule(
    ruleId: string,
    operatorId: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    const rule = await productScheduleRuleDao.findById(ruleId);
    if (!rule) {
      throw new AppError('定时规则不存在', BusinessCode.NOT_FOUND);
    }

    const plainRule = (rule as any).get ? (rule as any).get({ plain: true }) : rule;
    if (
      plainRule.status !== ProductScheduleRuleStatus.PENDING &&
      plainRule.status !== ProductScheduleRuleStatus.ACTIVE
    ) {
      throw new AppError('只有待生效或生效中的定时规则才能取消', BusinessCode.ERROR);
    }

    await productScheduleRuleDao.update(
      {
        status: ProductScheduleRuleStatus.CANCELLED,
        cancelReason: reason || '手动取消',
      },
      { where: { id: ruleId } }
    );

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';

    await this.recordAuditLog({
      productId: plainRule.productId,
      operatorId,
      operatorName,
      action: ProductAuditAction.SCHEDULE_DELIST,
      fromStage: ProductAuditStage.COMPLETED,
      toStage: ProductAuditStage.COMPLETED,
      fromStatus: ProductStatus.LISTED,
      toStatus: ProductStatus.LISTED,
      remark: `取消定时规则：${plainRule.ruleName}，原因：${reason || '手动取消'}`,
      metadata: { ruleId },
      ipAddress,
    });

    await CacheUtils.del(CacheKey.PRODUCT_DETAIL + plainRule.productId);
  }

  public async getScheduleRuleList(
    params: {
      page: number;
      pageSize: number;
      productId?: string;
      action?: string;
      status?: ProductScheduleRuleStatus;
      creatorId?: string;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<PaginationResult<any>> {
    const { rows, count } = await productScheduleRuleDao.findAllPaged(params);

    const list = rows.map((row: any) => {
      const plain = row.get ? row.get({ plain: true }) : row;
      const status = plain.status as ProductScheduleRuleStatus;
      return {
        ...plain,
        statusLabel: PRODUCT_SCHEDULE_RULE_STATUS_LABELS[status]?.label || '未知',
        statusType: PRODUCT_SCHEDULE_RULE_STATUS_LABELS[status]?.type || 'info',
        actionLabel: PRODUCT_SCHEDULE_RULE_ACTION_LABELS[plain.action as ProductScheduleRuleAction] || plain.action,
        repeatCycleLabel: PRODUCT_SCHEDULE_REPEAT_CYCLE_LABELS[plain.repeatCycle as ProductScheduleRepeatCycle] || plain.repeatCycle,
      };
    });

    return {
      list,
      total: count,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(count / params.pageSize),
    };
  }

  public async getScheduleRuleDetail(ruleId: string): Promise<any> {
    const rule = await productScheduleRuleDao.findById(ruleId);
    if (!rule) {
      throw new AppError('定时规则不存在', BusinessCode.NOT_FOUND);
    }

    const plain = (rule as any).get ? (rule as any).get({ plain: true }) : rule;
    const status = plain.status as ProductScheduleRuleStatus;

    const product = await productDao.findById(plain.productId);
    let productInfo = null;
    if (product) {
      const productPlain = product.get({ plain: true });
      productInfo = {
        id: productPlain.id,
        name: productPlain.name,
        sku: productPlain.sku,
        status: productPlain.status,
        statusLabel: PRODUCT_STATUS_LABELS[productPlain.status as ProductStatus]?.label || '未知',
      };
    }

    return {
      ...plain,
      statusLabel: PRODUCT_SCHEDULE_RULE_STATUS_LABELS[status]?.label || '未知',
      statusType: PRODUCT_SCHEDULE_RULE_STATUS_LABELS[status]?.type || 'info',
      actionLabel: PRODUCT_SCHEDULE_RULE_ACTION_LABELS[plain.action as ProductScheduleRuleAction] || plain.action,
      repeatCycleLabel: PRODUCT_SCHEDULE_REPEAT_CYCLE_LABELS[plain.repeatCycle as ProductScheduleRepeatCycle] || plain.repeatCycle,
      productInfo,
    };
  }

  public async processScheduleRules(): Promise<{ executed: number; failed: number }> {
    const pendingRules = await productScheduleRuleDao.findPendingToExecute();

    let executed = 0;
    let failed = 0;

    for (const ruleRow of pendingRules) {
      const rule = (ruleRow as any).get ? (ruleRow as any).get({ plain: true }) : ruleRow;
      try {
        const product = await productDao.findById(rule.productId);
        if (!product) {
          await productScheduleRuleDao.update(
            { status: ProductScheduleRuleStatus.EXPIRED },
            { where: { id: rule.id } }
          );
          failed++;
          continue;
        }

        const currentStatus = (product as any).status;

        if (rule.action === ProductScheduleRuleAction.LIST) {
          if (
            currentStatus !== ProductStatus.AUDIT_PASSED &&
            currentStatus !== ProductStatus.DELISTED
          ) {
            await productScheduleRuleDao.update(
              { status: ProductScheduleRuleStatus.EXPIRED },
              { where: { id: rule.id } }
            );
            failed++;
            continue;
          }

          await productDao.update(
            {
              status: ProductStatus.LISTED,
              promoteEnabled: true,
              listerId: 'system',
              listAt: new Date(),
            } as any,
            { where: { id: rule.productId } }
          );

          await productListingLogDao.create({
            productId: rule.productId,
            action: ProductListingAction.LIST,
            trigger: ProductListingTrigger.SCHEDULED,
            fromStatus: currentStatus,
            toStatus: ProductStatus.LISTED,
            operatorId: rule.creatorId,
            operatorName: rule.creatorName || '系统',
            reason: `定时上架规则执行：${rule.ruleName}`,
            scheduleRuleId: rule.id,
            scheduleRuleName: rule.ruleName,
          });
        } else if (rule.action === ProductScheduleRuleAction.DELIST) {
          if (currentStatus !== ProductStatus.LISTED) {
            await productScheduleRuleDao.update(
              { status: ProductScheduleRuleStatus.EXPIRED },
              { where: { id: rule.id } }
            );
            failed++;
            continue;
          }

          await productDao.update(
            {
              status: ProductStatus.DELISTED,
              promoteEnabled: false,
              delisterId: 'system',
              delistAt: new Date() as any,
            } as any,
            { where: { id: rule.productId } }
          );

          await productListingLogDao.create({
            productId: rule.productId,
            action: ProductListingAction.DELIST,
            trigger: ProductListingTrigger.SCHEDULED,
            fromStatus: currentStatus,
            toStatus: ProductStatus.DELISTED,
            operatorId: rule.creatorId,
            operatorName: rule.creatorName || '系统',
            reason: `定时下架规则执行：${rule.ruleName}`,
            scheduleRuleId: rule.id,
            scheduleRuleName: rule.ruleName,
          });
        }

        const newExecuteCount = (rule.executeCount || 0) + 1;
        let nextExecuteTime: Date | undefined = undefined;
        let newStatus = ProductScheduleRuleStatus.EXECUTED;

        if (rule.repeatCycle !== ProductScheduleRepeatCycle.NONE && (!rule.endTime || new Date() < new Date(rule.endTime))) {
          nextExecuteTime = this.calculateNextExecuteTime(
            rule.repeatCycle,
            rule.startTime,
            rule.repeatConfig
          );
          newStatus = ProductScheduleRuleStatus.ACTIVE;
        }

        await productScheduleRuleDao.update(
          {
            status: newStatus,
            executorId: 'system',
            executorName: '系统自动',
            executedAt: new Date(),
            lastExecuteTime: new Date(),
            nextExecuteTime,
            executeCount: newExecuteCount,
          },
          { where: { id: rule.id } }
        );

        await CacheUtils.del(CacheKey.PRODUCT_DETAIL + rule.productId);
        await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

        executed++;
      } catch (err) {
        failed++;
      }
    }

    return { executed, failed };
  }

  private calculateNextExecuteTime(
    cycle: ProductScheduleRepeatCycle,
    baseTime: Date | string,
    config?: any
  ): Date {
    const base = new Date(baseTime);
    switch (cycle) {
      case ProductScheduleRepeatCycle.DAILY:
        base.setDate(base.getDate() + 1);
        return base;
      case ProductScheduleRepeatCycle.WEEKLY:
        base.setDate(base.getDate() + 7);
        return base;
      case ProductScheduleRepeatCycle.MONTHLY:
        base.setMonth(base.getMonth() + 1);
        return base;
      default:
        return base;
    }
  }

  public async batchDelist(
    params: {
      type: 'slow_selling' | 'violation' | 'expired';
      productIds?: string[];
      excludeHotSales?: boolean;
      reason?: string;
    },
    operatorId: string,
    ipAddress?: string
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    details: Array<{
      productId: string;
      productName: string;
      status: 'success' | 'failed' | 'skipped';
      reason?: string;
    }>;
  }> {
    const { type, productIds, excludeHotSales = true, reason } = params;

    let products: any[] = [];

    if (productIds && productIds.length > 0) {
      for (const id of productIds) {
        const product = await productDao.findById(id);
        if (product) {
          products.push(product);
        }
      }
    } else {
      const where: any = { status: ProductStatus.LISTED };

      if (type === 'slow_selling') {
        where.salesCount = { [Op.lt]: 10 };
      } else if (type === 'violation') {
        where.fakeProductFlag = true;
      } else if (type === 'expired') {
        where.listEndTime = { [Op.lt]: new Date() };
      }

      const result = await productDao.findAndCountAll({ where });
      products = result.rows;
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const batchId = `batch_delist_${Date.now()}`;

    const details: Array<{
      productId: string;
      productName: string;
      status: 'success' | 'failed' | 'skipped';
      reason?: string;
    }> = [];

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const productRow of products) {
      const plain = productRow.get ? productRow.get({ plain: true }) : productRow;

      if (excludeHotSales && (plain as any).isHot && (plain as any).salesCount >= PRODUCT_HOT_SALES_THRESHOLD) {
        skipped++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'skipped',
          reason: '热销商品，已自动规避',
        });
        continue;
      }

      if ((plain as any).status !== ProductStatus.LISTED) {
        skipped++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'skipped',
          reason: '商品不在已上架状态',
        });
        continue;
      }

      try {
        await productDao.update(
          {
            status: ProductStatus.DELISTED,
            promoteEnabled: false,
            delisterId: operatorId,
            delistAt: new Date() as any,
          } as any,
          { where: { id: plain.id } }
        );

        await productListingLogDao.create({
          productId: plain.id,
          action: ProductListingAction.DELIST,
          trigger: ProductListingTrigger.BATCH,
          fromStatus: ProductStatus.LISTED,
          toStatus: ProductStatus.DELISTED,
          operatorId,
          operatorName,
          reason: reason || `批量下架(${type === 'slow_selling' ? '滞销' : type === 'violation' ? '违规' : '过期'})`,
          batchId,
          ipAddress,
          metadata: { batchType: type },
        });

        await this.recordAuditLog({
          productId: plain.id,
          operatorId,
          operatorName,
          action: ProductAuditAction.BATCH_DELIST,
          fromStage: ProductAuditStage.COMPLETED,
          toStage: ProductAuditStage.COMPLETED,
          fromStatus: ProductStatus.LISTED,
          toStatus: ProductStatus.DELISTED,
          remark: reason || `批量下架(${type === 'slow_selling' ? '滞销' : type === 'violation' ? '违规' : '过期'})`,
          metadata: { batchId, batchType: type },
          ipAddress,
        });

        await CacheUtils.del(CacheKey.PRODUCT_DETAIL + plain.id);

        success++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'success',
        });
      } catch (err: any) {
        failed++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'failed',
          reason: err.message || '下架失败',
        });
      }
    }

    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    return {
      total: products.length,
      success,
      failed,
      skipped,
      details,
    };
  }

  public async batchList(
    params: {
      productIds?: string[];
      autoFilter?: boolean;
      reason?: string;
    },
    operatorId: string,
    ipAddress?: string
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    details: Array<{
      productId: string;
      productName: string;
      status: 'success' | 'failed' | 'skipped';
      reason?: string;
    }>;
  }> {
    const { productIds, autoFilter = false, reason } = params;

    let products: any[] = [];

    if (productIds && productIds.length > 0) {
      for (const id of productIds) {
        const product = await productDao.findById(id);
        if (product) {
          products.push(product);
        }
      }
    } else if (autoFilter) {
      const result = await productDao.findAndCountAll({
        where: {
          status: {
            [Op.in]: [ProductStatus.AUDIT_PASSED, ProductStatus.DELISTED],
          },
        },
      });
      products = result.rows;
    }

    const operator = await userDao.findById(operatorId);
    const operatorName = (operator as any)?.nickname || operator?.username || '系统';
    const batchId = `batch_list_${Date.now()}`;

    const details: Array<{
      productId: string;
      productName: string;
      status: 'success' | 'failed' | 'skipped';
      reason?: string;
    }> = [];

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const productRow of products) {
      const plain = productRow.get ? productRow.get({ plain: true }) : productRow;
      const currentStatus = (plain as any).status;

      if (
        currentStatus !== ProductStatus.AUDIT_PASSED &&
        currentStatus !== ProductStatus.DELISTED
      ) {
        skipped++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'skipped',
          reason: '商品状态不允许上架',
        });
        continue;
      }

      if (Number(plain.stock) <= 0) {
        skipped++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'skipped',
          reason: '商品库存为0',
        });
        continue;
      }

      if (
        !(plain as any).qualificationVerified &&
        PRODUCT_QUALIFICATION_REQUIRED.includes(plain.category as ProductCategory)
      ) {
        skipped++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'skipped',
          reason: '商品资质未通过审核',
        });
        continue;
      }

      try {
        const category = plain.category as ProductCategory;
        const materials = (plain as any).promotionMaterials || DEFAULT_PRODUCT_MATERIALS[category] || [];

        await productDao.update(
          {
            status: ProductStatus.LISTED,
            promoteEnabled: true,
            listerId: operatorId,
            listAt: new Date(),
            promotionMaterials: materials,
          } as any,
          { where: { id: plain.id } }
        );

        await productListingLogDao.create({
          productId: plain.id,
          action: ProductListingAction.LIST,
          trigger: ProductListingTrigger.BATCH,
          fromStatus: currentStatus,
          toStatus: ProductStatus.LISTED,
          operatorId,
          operatorName,
          reason: reason || '批量上架',
          batchId,
          ipAddress,
        });

        await this.recordAuditLog({
          productId: plain.id,
          operatorId,
          operatorName,
          action: ProductAuditAction.BATCH_LIST,
          fromStage: ProductAuditStage.COMPLETED,
          toStage: ProductAuditStage.COMPLETED,
          fromStatus: currentStatus,
          toStatus: ProductStatus.LISTED,
          remark: reason || '批量上架',
          metadata: { batchId },
          ipAddress,
        });

        await CacheUtils.del(CacheKey.PRODUCT_DETAIL + plain.id);

        success++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'success',
        });
      } catch (err: any) {
        failed++;
        details.push({
          productId: plain.id,
          productName: plain.name,
          status: 'failed',
          reason: err.message || '上架失败',
        });
      }
    }

    await CacheUtils.delPattern(CacheKey.PRODUCT_LIST + '*');

    return {
      total: products.length,
      success,
      failed,
      skipped,
      details,
    };
  }

  public async getListingHistory(
    params: {
      page: number;
      pageSize: number;
      productId?: string;
      action?: ProductListingAction;
      trigger?: ProductListingTrigger;
      operatorId?: string;
      batchId?: string;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<PaginationResult<any>> {
    const { rows, count } = await productListingLogDao.findAllPaged(params);

    const list = rows.map((row: any) => {
      const plain = row.get ? row.get({ plain: true }) : row;
      return {
        ...plain,
        actionLabel: PRODUCT_LISTING_ACTION_LABELS[plain.action as ProductListingAction] || plain.action,
        triggerLabel: PRODUCT_LISTING_TRIGGER_LABELS[plain.trigger as ProductListingTrigger] || plain.trigger,
        fromStatusLabel: PRODUCT_STATUS_LABELS[plain.fromStatus as ProductStatus]?.label || '未知',
        toStatusLabel: PRODUCT_STATUS_LABELS[plain.toStatus as ProductStatus]?.label || '未知',
      };
    });

    return {
      list,
      total: count,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(count / params.pageSize),
    };
  }

  public async getListingStats(
    productId: string
  ): Promise<{
    totalListCount: number;
    totalDelistCount: number;
    frequentListing: boolean;
    frequentCount: number;
    threshold: number;
    windowDays: number;
    recentOperations: Array<{
      action: string;
      actionLabel: string;
      trigger: string;
      triggerLabel: string;
      operateAt: Date;
      operatorName: string;
    }>;
  }> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const recentLogs = await productListingLogDao.findAll({
      where: { productId },
      limit: 10,
      order: [['createdAt', 'DESC']],
    });

    const frequentCount = await productListingLogDao.countByProductIdInDays(
      productId,
      PRODUCT_FREQUENT_LISTING_WINDOW_DAYS
    );

    let totalListCount = 0;
    let totalDelistCount = 0;
    const allLogs = await productListingLogDao.findAll({
      where: { productId },
    });
    for (const log of allLogs) {
      const plain = (log as any).get ? (log as any).get({ plain: true }) : log;
      if (plain.action === ProductListingAction.LIST) totalListCount++;
      else totalDelistCount++;
    }

    const recentOperations = recentLogs.map((log: any) => {
      const plain = log.get ? log.get({ plain: true }) : log;
      return {
        action: plain.action,
        actionLabel: PRODUCT_LISTING_ACTION_LABELS[plain.action as ProductListingAction] || plain.action,
        trigger: plain.trigger,
        triggerLabel: PRODUCT_LISTING_TRIGGER_LABELS[plain.trigger as ProductListingTrigger] || plain.trigger,
        operateAt: plain.createdAt,
        operatorName: plain.operatorName || '系统',
      };
    });

    return {
      totalListCount,
      totalDelistCount,
      frequentListing: frequentCount >= PRODUCT_FREQUENT_LISTING_THRESHOLD,
      frequentCount,
      threshold: PRODUCT_FREQUENT_LISTING_THRESHOLD,
      windowDays: PRODUCT_FREQUENT_LISTING_WINDOW_DAYS,
      recentOperations,
    };
  }

  public async checkDelistPrecondition(
    productId: string
  ): Promise<{
    canDelist: boolean;
    productStatus: ProductStatus;
    productStatusLabel: string;
    activeOrderCount: number;
    hasScheduleRule: boolean;
    scheduleRules: Array<{
      id: string;
      ruleName: string;
      action: string;
      actionLabel: string;
      startTime: Date;
      status: number;
    }>;
    message: string;
  }> {
    const product = await productDao.findById(productId);
    if (!product) {
      throw new AppError('商品不存在', BusinessCode.NOT_FOUND);
    }

    const plain = product.get({ plain: true });
    const currentStatus = (product as any).status as ProductStatus;

    if (currentStatus !== ProductStatus.LISTED) {
      return {
        canDelist: false,
        productStatus: currentStatus,
        productStatusLabel: PRODUCT_STATUS_LABELS[currentStatus]?.label || '未知',
        activeOrderCount: 0,
        hasScheduleRule: false,
        scheduleRules: [],
        message: `商品当前状态为${PRODUCT_STATUS_LABELS[currentStatus]?.label || '未知'}，只有已上架状态的商品才能下架`,
      };
    }

    const activeOrderCount = await orderDao.count({
      where: {
        productName: plain.name,
        status: {
          [Op.in]: [
            OrderStatus.PENDING_PAY,
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
          ],
        },
      },
    } as any);

    const scheduleRules = await productScheduleRuleDao.findActiveByProductId(productId);
    const formattedRules = scheduleRules.map((r: any) => {
      const p = r.get ? r.get({ plain: true }) : r;
      return {
        id: p.id,
        ruleName: p.ruleName,
        action: p.action,
        actionLabel: PRODUCT_SCHEDULE_RULE_ACTION_LABELS[p.action as ProductScheduleRuleAction] || p.action,
        startTime: p.startTime,
        status: p.status,
      };
    });

    return {
      canDelist: true,
      productStatus: currentStatus,
      productStatusLabel: PRODUCT_STATUS_LABELS[currentStatus]?.label || '已上架',
      activeOrderCount,
      hasScheduleRule: scheduleRules.length > 0,
      scheduleRules: formattedRules,
      message: activeOrderCount > 0
        ? `商品存在${activeOrderCount}个未完结在售订单，可选择强制下架或等待订单完结`
        : '商品可以正常下架',
    };
  }
}

export default new ProductService();
