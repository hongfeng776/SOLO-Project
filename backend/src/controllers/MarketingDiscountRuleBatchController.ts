import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingDiscountRuleBatchService } from '../services/MarketingDiscountRuleBatchService';

export const batchEnable = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要启用的规则');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingDiscountRuleBatchService.batchEnable(idNums, operatorId, operatorName);
  ok(res, result, '批量操作完成');
});

export const batchDisable = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要禁用的规则');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingDiscountRuleBatchService.batchDisable(idNums, operatorId, operatorName);
  ok(res, result, '批量操作完成');
});

export const batchAdjustThreshold = asyncHandler(async (req: Request, res: Response) => {
  const { ids, field, value } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要调整的规则');
    return;
  }
  if (!field || value === undefined) {
    badRequest(res, '请设置调整字段和值');
    return;
  }

  const idNums = ids.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingDiscountRuleBatchService.batchAdjustThreshold(
    idNums,
    field as string,
    parseFloat(value),
    operatorId,
    operatorName
  );
  ok(res, result, '批量调整完成');
});

export const batchClearExpiredQuota = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId } = req.body;
  if (!marketingId) {
    badRequest(res, '请选择营销活动');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const result = await marketingDiscountRuleBatchService.batchClearExpiredQuota(
    parseInt(marketingId as string, 10),
    operatorId,
    operatorName
  );
  ok(res, result, '批量清零完成');
});

export const batchFilterOperate = asyncHandler(async (req: Request, res: Response) => {
  const { operation, ...params } = req.body;
  if (!operation) {
    badRequest(res, '请选择操作类型');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  const filterParams: any = {};
  if (params.marketingId) filterParams.marketingId = parseInt(params.marketingId, 10);
  if (params.discountType) filterParams.discountType = parseInt(params.discountType, 10);
  if (params.effectiveStatus !== undefined) filterParams.effectiveStatus = parseInt(params.effectiveStatus, 10);
  if (params.keyword) filterParams.keyword = params.keyword;
  if (params.minAmountMin) filterParams.minAmountMin = parseFloat(params.minAmountMin);
  if (params.minAmountMax) filterParams.minAmountMax = parseFloat(params.minAmountMax);

  const result = await marketingDiscountRuleBatchService.filterAndOperate(
    operation as any,
    filterParams,
    operatorId,
    operatorName
  );
  ok(res, result, '批量操作完成');
});

export default {
  batchEnable,
  batchDisable,
  batchAdjustThreshold,
  batchClearExpiredQuota,
  batchFilterOperate,
};
