import { Request, Response } from 'express';
import { goodsBatchService, AdvancedQueryParams } from '../services/GoodsBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { daos } from '../dao';

const parseArrayParam = (value: unknown): number[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map((v) => parseInt(String(v), 10));
  const str = String(value);
  if (str.includes(',')) {
    return str.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : [num];
};

export const advancedQuery = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, category_id, merchant_level, status, compliance_rating,
    keyword, merchant_id, brand_id, top_flag, in_activity, sort_field, sort_order,
  } = req.query;

  const params: AdvancedQueryParams = {
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    category_id: parseArrayParam(category_id),
    merchant_level: parseArrayParam(merchant_level),
    status: parseArrayParam(status),
    compliance_rating: parseArrayParam(compliance_rating),
    keyword: keyword as string,
    merchant_id: parseArrayParam(merchant_id),
    brand_id: parseArrayParam(brand_id),
    top_flag: top_flag !== undefined ? parseInt(top_flag as string, 10) : undefined,
    in_activity: in_activity !== undefined ? parseInt(in_activity as string, 10) : undefined,
    sort_field: sort_field as string,
    sort_order: (sort_order as 'ASC' | 'DESC') || undefined,
  };

  const result = await goodsBatchService.advancedQuery(params);
  ok(res, result, '高级查询成功');
});

export const batchOffline = asyncHandler(async (req: Request, res: Response) => {
  const { ids, operator_id, reason } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要下架的商品');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const operatorType = req.body.operator_type ? parseInt(req.body.operator_type, 10) : 2;

  const result = await goodsBatchService.batchOffline(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    parseInt(operator_id, 10),
    reason || '',
    operatorType
  );

  ok(res, result, `批量下架完成：成功${result.success}条，失败${result.failed}条`);
});

export const batchTop = asyncHandler(async (req: Request, res: Response) => {
  const { ids, operator_id } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要置顶的商品');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const operatorType = req.body.operator_type ? parseInt(req.body.operator_type, 10) : 2;

  const result = await goodsBatchService.batchTop(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    parseInt(operator_id, 10),
    operatorType
  );

  ok(res, result, `批量置顶完成：成功${result.success}条，失败${result.failed}条`);
});

export const batchUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { ids, update_data, operator_id, allowed_fields } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要编辑的商品');
    return;
  }

  if (!update_data || typeof update_data !== 'object') {
    badRequest(res, '缺少更新数据');
    return;
  }

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  const operatorType = req.body.operator_type ? parseInt(req.body.operator_type, 10) : 2;
  const remark = req.body.remark;

  const parsedIds = ids.map((id: string | number) => parseInt(String(id), 10));
  const parsedAllowedFields = allowed_fields && Array.isArray(allowed_fields)
    ? allowed_fields.map((f: unknown) => String(f))
    : undefined;

  const result = await goodsBatchService.batchUpdate(
    parsedIds,
    update_data,
    parseInt(operator_id, 10),
    parsedAllowedFields,
    operatorType,
    remark
  );

  ok(res, result, `批量更新完成：成功${result.success}条，失败${result.failed}条`);
});

export const getBatchAbility = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择商品');
    return;
  }

  const parsedIds = ids.map((id: string | number) => parseInt(String(id), 10));
  const goodsList = await daos.goodsDao.findAll({
    where: { id: parsedIds },
  });

  const result = await goodsBatchService.getBatchAbility(goodsList);
  ok(res, result, '获取批量操作权限成功');
});

export default {
  advancedQuery,
  batchOffline,
  batchTop,
  batchUpdate,
  getBatchAbility,
};
