import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Goods } from '../models/Goods';

export interface FieldEditConfig {
  editable: boolean;
  readonlyReason?: string;
  rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowed?: unknown[];
  };
}

export interface EditFieldConfigResult {
  [field: string]: FieldEditConfig;
}

export interface EditableFieldsResult {
  fields: string[];
  fieldConfig: EditFieldConfigResult;
}

export interface GoodsEditExecuteData {
  name?: string;
  category_id?: number;
  brand_id?: number;
  price?: number;
  original_price?: number;
  stock?: number;
  cover_image?: string;
  description?: string;
  sku_code?: string;
  sort_weight?: number;
  top_flag?: number;
  sale_start_time?: Date;
  sale_end_time?: Date;
  compliance_rating?: number;
  status?: number;
}

const ALL_FIELDS: string[] = [
  'name', 'category_id', 'brand_id', 'price', 'original_price',
  'stock', 'cover_image', 'description', 'sku_code',
  'sort_weight', 'top_flag', 'sale_start_time', 'sale_end_time',
  'compliance_rating', 'status',
];

const STATUS_ONLINE_FIELDS_BLOCKED: string[] = ['price', 'category_id'];
const ACTIVITY_FIELDS_ALLOWED: string[] = ['stock', 'description'];
const SALES_PARTIAL_FIELDS: string[] = ['stock', 'description', 'cover_image', 'sale_start_time', 'sale_end_time'];

class GoodsEditorService {
  private readonly goodsDao = daos.goodsDao;
  private readonly goodsEditLogDao = daos.goodsEditLogDao;

  async getEditableFields(id: number): Promise<EditableFieldsResult> {
    const goods = await this.getGoodsOrThrow(id);
    const fieldConfig = this.calculateFieldConfig(goods);
    const fields = Object.keys(fieldConfig).filter((f) => fieldConfig[f].editable);
    return { fields, fieldConfig };
  }

  async getEditFieldConfig(id: number): Promise<EditFieldConfigResult> {
    const goods = await this.getGoodsOrThrow(id);
    return this.calculateFieldConfig(goods);
  }

  async executeEdit(
    id: number,
    data: GoodsEditExecuteData,
    editorId: number,
    editorType: number,
    ip?: string,
    remark?: string
  ): Promise<Goods> {
    const goods = await this.getGoodsOrThrow(id);
    const fieldConfig = this.calculateFieldConfig(goods);

    const updateData: Partial<GoodsEditExecuteData> = {};
    const beforeData: Record<string, unknown> = {};
    const afterData: Record<string, unknown> = {};

    for (const key of Object.keys(data) as (keyof GoodsEditExecuteData)[]) {
      const value = data[key];
      if (value === undefined) continue;

      const config = fieldConfig[key as string];
      if (!config || !config.editable) {
        throw new AppError(
          `字段 ${key} 不允许编辑${config?.readonlyReason ? '：' + config.readonlyReason : ''}`,
          400
        );
      }

      if (config.rules) {
        this.validateFieldRules(key as string, value, config.rules);
      }

      const goodsKey = key as keyof typeof goods;
      const originalValue = goods[goodsKey];
      if (originalValue !== value) {
        beforeData[key as string] = originalValue ?? null;
        afterData[key as string] = value;
        (updateData as Record<string, unknown>)[key as string] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return goods;
    }

    await this.goodsDao.update(id, updateData);
    const updatedGoods = await this.getGoodsOrThrow(id);

    await this.goodsEditLogDao.create({
      goods_id: id,
      editor_id: editorId,
      editor_type: editorType,
      before_data: beforeData,
      after_data: afterData,
      remark,
      ip,
    } as any);

    return updatedGoods;
  }

  private async getGoodsOrThrow(id: number): Promise<Goods> {
    const goods = await this.goodsDao.findById(id);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }
    return goods;
  }

  private calculateFieldConfig(goods: Goods): EditFieldConfigResult {
    const result: EditFieldConfigResult = {};
    const isOnline = goods.status === 1;
    const inActivity = goods.in_activity === 1;
    const hasSales = (goods.sales ?? 0) > 0;

    for (const field of ALL_FIELDS) {
      let editable = true;
      let readonlyReason: string | undefined;

      if (isOnline && STATUS_ONLINE_FIELDS_BLOCKED.includes(field)) {
        editable = false;
        readonlyReason = '商品已上架，不允许修改价格和类目';
      }

      if (inActivity && !ACTIVITY_FIELDS_ALLOWED.includes(field)) {
        editable = false;
        readonlyReason = '商品在营销活动中，仅允许修改库存和描述';
      }

      if (hasSales && !SALES_PARTIAL_FIELDS.includes(field) && !inActivity && !isOnline) {
      }

      if (hasSales && !ACTIVITY_FIELDS_ALLOWED.includes(field) &&
          !SALES_PARTIAL_FIELDS.includes(field) &&
          !['original_price', 'name', 'brand_id', 'sku_code'].includes(field)) {
        if (isOnline || inActivity) {
        } else if (field === 'price' || field === 'category_id') {
          if (!isOnline) {
            editable = true;
            readonlyReason = undefined;
          }
        }
      }

      if (hasSales && !SALES_PARTIAL_FIELDS.includes(field) &&
          !['price', 'category_id', 'original_price', 'name', 'brand_id',
            'sku_code', 'status', 'compliance_rating', 'sort_weight', 'top_flag'].includes(field)) {
        if (!isOnline && !inActivity) {
          editable = true;
          readonlyReason = undefined;
        }
      }

      if (goods.sku_code && field === 'sku_code' && hasSales) {
        editable = false;
        readonlyReason = '商品已产生销售记录，商品编码不可修改';
      }

      let rules: FieldEditConfig['rules'];
      switch (field) {
        case 'name':
          rules = { min: 2, max: 255 };
          break;
        case 'price':
        case 'original_price':
          rules = { min: 0.01 };
          break;
        case 'stock':
          rules = { min: 0 };
          break;
        case 'compliance_rating':
          rules = { allowed: [1, 2, 3, 4] };
          break;
        case 'status':
          rules = { allowed: [0, 1] };
          break;
        case 'top_flag':
          rules = { allowed: [0, 1] };
          break;
        case 'sort_weight':
          rules = { min: 0, max: 999999 };
          break;
        case 'sku_code':
          rules = { min: 4, max: 100 };
          break;
      }

      result[field] = {
        editable,
        readonlyReason,
        rules,
      };
    }

    return result;
  }

  private validateFieldRules(
    field: string,
    value: unknown,
    rules: NonNullable<FieldEditConfig['rules']>
  ): void {
    if (rules.allowed && rules.allowed.length > 0) {
      if (!rules.allowed.includes(value)) {
        throw new AppError(`字段 ${field} 的值不合法，允许值：${rules.allowed.join(', ')}`, 400);
      }
    }

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new AppError(`字段 ${field} 的值不能小于 ${rules.min}`, 400);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new AppError(`字段 ${field} 的值不能大于 ${rules.max}`, 400);
      }
    }

    if (typeof value === 'string') {
      if (rules.min !== undefined && value.length < rules.min) {
        throw new AppError(`字段 ${field} 的长度不能小于 ${rules.min}`, 400);
      }
      if (rules.max !== undefined && value.length > rules.max) {
        throw new AppError(`字段 ${field} 的长度不能大于 ${rules.max}`, 400);
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        throw new AppError(`字段 ${field} 的格式不合法`, 400);
      }
    }
  }
}

export const goodsEditorService = new GoodsEditorService();
export default GoodsEditorService;
