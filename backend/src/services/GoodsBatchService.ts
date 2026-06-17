import { Op, FindOptions, WhereOptions } from 'sequelize';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import { Goods } from '../models/Goods';
import { PageResult } from '../types';
import { Merchant } from '../models/Merchant';

export interface AdvancedQueryParams {
  page?: number;
  pageSize?: number;
  category_id?: number | number[];
  merchant_level?: number | number[];
  status?: number | number[];
  compliance_rating?: number | number[];
  keyword?: string;
  merchant_id?: number | number[];
  brand_id?: number | number[];
  top_flag?: number;
  in_activity?: number;
  sort_field?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  failedItems?: Array<{ id: number; reason: string }>;
}

export interface GoodsBatchAbility {
  id: number;
  canOffline: boolean;
  canTop: boolean;
  canEdit: boolean;
  canDelete: boolean;
  reasons?: string[];
}

const DEFAULT_ALLOWED_BATCH_FIELDS: string[] = [
  'status', 'sort_weight', 'top_flag', 'compliance_rating',
  'sale_start_time', 'sale_end_time',
];

class GoodsBatchService {
  private readonly goodsDao = daos.goodsDao;
  private readonly goodsEditLogDao = daos.goodsEditLogDao;
  private readonly merchantDao = daos.merchantDao;

  async advancedQuery(params: AdvancedQueryParams): Promise<PageResult<Goods>> {
    const {
      page = 1,
      pageSize = 10,
      category_id,
      merchant_level,
      status,
      compliance_rating,
      keyword,
      merchant_id,
      brand_id,
      top_flag,
      in_activity,
      sort_field = 'sort_weight',
      sort_order = 'DESC',
    } = params;

    const where: Record<string, unknown> = {} as Record<string, unknown>;
    const include: FindOptions['include'] = [];

    if (category_id !== undefined) {
      where.category_id = Array.isArray(category_id)
        ? { [Op.in]: category_id }
        : category_id;
    }

    if (status !== undefined) {
      where.status = Array.isArray(status)
        ? { [Op.in]: status }
        : status;
    }

    if (compliance_rating !== undefined) {
      where.compliance_rating = Array.isArray(compliance_rating)
        ? { [Op.in]: compliance_rating }
        : compliance_rating;
    }

    if (merchant_id !== undefined) {
      where.merchant_id = Array.isArray(merchant_id)
        ? { [Op.in]: merchant_id }
        : merchant_id;
    }

    if (brand_id !== undefined) {
      where.brand_id = Array.isArray(brand_id)
        ? { [Op.in]: brand_id }
        : brand_id;
    }

    if (top_flag !== undefined) {
      where.top_flag = top_flag;
    }

    if (in_activity !== undefined) {
      where.in_activity = in_activity;
    }

    if (keyword) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { sku_code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (merchant_level !== undefined) {
      include.push({
        model: Merchant,
        as: 'merchant',
        attributes: [],
        where: {
          status: Array.isArray(merchant_level)
            ? { [Op.in]: merchant_level }
            : merchant_level,
        } as WhereOptions,
        required: true,
      });
    }

    const order = [[sort_field, sort_order], ['created_at', 'DESC']] as unknown as undefined;

    return this.goodsDao.findPage({
      page,
      pageSize,
      where: where as WhereOptions,
      order,
      include,
    });
  }

  async batchOffline(
    ids: number[],
    operatorId: number,
    reason: string,
    operatorType: number = 2
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要下架的商品', 400);
    }

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failedItems: [],
    };

    for (const id of ids) {
      try {
        const goods = await this.goodsDao.findById(id);
        if (!goods) {
          result.failed++;
          result.failedItems!.push({ id, reason: '商品不存在' });
          continue;
        }

        if (goods.status === 0) {
          result.failed++;
          result.failedItems!.push({ id, reason: '商品已下架' });
          continue;
        }

        const beforeData = { status: goods.status };
        await this.goodsDao.update(id, { status: 0 });
        await this.goodsEditLogDao.create({
          goods_id: id,
          editor_id: operatorId,
          editor_type: operatorType,
          before_data: beforeData,
          after_data: { status: 0 },
          remark: reason || '批量下架',
        } as any);

        result.success++;
      } catch (error) {
        result.failed++;
        result.failedItems!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async batchTop(
    ids: number[],
    operatorId: number,
    operatorType: number = 2
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要置顶的商品', 400);
    }

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failedItems: [],
    };

    let currentWeight = 999999;

    for (const id of ids) {
      try {
        const goods = await this.goodsDao.findById(id);
        if (!goods) {
          result.failed++;
          result.failedItems!.push({ id, reason: '商品不存在' });
          continue;
        }

        const beforeData = { top_flag: goods.top_flag, sort_weight: goods.sort_weight };
        await this.goodsDao.update(id, {
          top_flag: 1,
          sort_weight: currentWeight,
        });
        await this.goodsEditLogDao.create({
          goods_id: id,
          editor_id: operatorId,
          editor_type: operatorType,
          before_data: beforeData,
          after_data: { top_flag: 1, sort_weight: currentWeight },
          remark: '批量置顶',
        } as any);

        currentWeight--;
        result.success++;
      } catch (error) {
        result.failed++;
        result.failedItems!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async batchUpdate(
    ids: number[],
    updateData: Record<string, unknown>,
    operatorId: number,
    allowedFields?: string[],
    operatorType: number = 2,
    remark?: string
  ): Promise<BatchOperationResult> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要编辑的商品', 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppError('缺少更新数据', 400);
    }

    const allowed = allowedFields || DEFAULT_ALLOWED_BATCH_FIELDS;
    const filteredData: Record<string, unknown> = {};

    for (const key of Object.keys(updateData)) {
      if (allowed.includes(key)) {
        filteredData[key] = updateData[key];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new AppError('没有可批量更新的字段', 400);
    }

    const result: BatchOperationResult = {
      success: 0,
      failed: 0,
      total: ids.length,
      failedItems: [],
    };

    for (const id of ids) {
      try {
        const goods = await this.goodsDao.findById(id);
        if (!goods) {
          result.failed++;
          result.failedItems!.push({ id, reason: '商品不存在' });
          continue;
        }

        const beforeData: Record<string, unknown> = {};
        const afterData: Record<string, unknown> = {};

        for (const key of Object.keys(filteredData)) {
          const goodsKey = key as keyof typeof goods;
          const originalValue = goods[goodsKey];
          if (originalValue !== filteredData[key]) {
            beforeData[key] = originalValue ?? null;
            afterData[key] = filteredData[key];
          }
        }

        if (Object.keys(beforeData).length === 0) {
          result.success++;
          continue;
        }

        await this.goodsDao.update(id, filteredData);
        await this.goodsEditLogDao.create({
          goods_id: id,
          editor_id: operatorId,
          editor_type: operatorType,
          before_data: beforeData,
          after_data: afterData,
          remark: remark || '批量更新',
        } as any);

        result.success++;
      } catch (error) {
        result.failed++;
        result.failedItems!.push({
          id,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  async getBatchAbility(goodsList: Goods[]): Promise<GoodsBatchAbility[]> {
    const merchantIds = [...new Set(goodsList.map((g) => g.merchant_id).filter(Boolean) as number[])];
    const merchants = merchantIds.length > 0
      ? await this.merchantDao.findAll({ where: { id: { [Op.in]: merchantIds } } })
      : [];
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));

    return goodsList.map((goods) => {
      const reasons: string[] = [];
      let canOffline = true;
      let canTop = true;
      let canEdit = true;
      let canDelete = true;

      if (goods.status === 0) {
        canOffline = false;
        reasons.push('商品已下架');
      }

      if (goods.in_activity === 1) {
        canEdit = false;
        canOffline = false;
        canDelete = false;
        reasons.push('商品在营销活动中');
      }

      if ((goods.sales ?? 0) > 0) {
        canDelete = false;
        reasons.push('商品已产生销售记录');
      }

      if (goods.top_flag === 1) {
        canTop = false;
        reasons.push('商品已置顶');
      }

      const merchant = goods.merchant_id ? merchantMap.get(goods.merchant_id) : undefined;
      if (merchant && merchant.status !== 1) {
        canEdit = false;
        canTop = false;
        reasons.push('商家状态异常');
      }

      return {
        id: goods.id,
        canOffline,
        canTop,
        canEdit,
        canDelete,
        reasons: reasons.length > 0 ? reasons : undefined,
      };
    });
  }
}

export const goodsBatchService = new GoodsBatchService();
export default GoodsBatchService;
