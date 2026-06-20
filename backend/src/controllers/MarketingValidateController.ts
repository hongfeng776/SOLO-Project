import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingValidateService, type MarketingValidateParams } from '../services/MarketingValidateService';

export const validateCreate = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, startTime, endTime, discountValue, discountType, minAmount, maxDiscount, categoryIds, merchantIds, totalCount } = req.body;

  const params: MarketingValidateParams = {
    name,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    startTime,
    endTime,
    discountValue: discountValue !== undefined ? parseFloat(discountValue as string) : undefined,
    discountType: discountType !== undefined ? parseInt(discountType as string, 10) : undefined,
    minAmount: minAmount !== undefined ? parseFloat(minAmount as string) : undefined,
    maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount as string) : undefined,
    categoryIds,
    merchantIds,
    totalCount: totalCount !== undefined ? parseInt(totalCount as string, 10) : undefined,
  };

  const result = await marketingValidateService.validateCreate(params);
  ok(res, result, '校验完成');
});

export const validateEdit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, startTime, endTime, discountValue, discountType, minAmount, maxDiscount, categoryIds, merchantIds, totalCount } = req.body;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id as string, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const params: MarketingValidateParams = {
    id: marketingId,
    name,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    startTime,
    endTime,
    discountValue: discountValue !== undefined ? parseFloat(discountValue as string) : undefined,
    discountType: discountType !== undefined ? parseInt(discountType as string, 10) : undefined,
    minAmount: minAmount !== undefined ? parseFloat(minAmount as string) : undefined,
    maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount as string) : undefined,
    categoryIds,
    merchantIds,
    totalCount: totalCount !== undefined ? parseInt(totalCount as string, 10) : undefined,
  };

  const result = await marketingValidateService.validateEdit(marketingId, params);
  ok(res, result, '校验完成');
});

export const getEditPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const statusValue = parseInt(status as string, 10);
  if (isNaN(statusValue)) {
    badRequest(res, '状态值格式无效');
    return;
  }

  const permissions = await marketingValidateService.getEditPermissions(statusValue);
  ok(res, permissions, '获取编辑权限成功');
});

export default {
  validateCreate,
  validateEdit,
  getEditPermissions,
};
