import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingTraceService } from '../services/MarketingTraceService';

export const getTraceData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id as string, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const traceData = await marketingTraceService.getTraceData(marketingId);
  ok(res, traceData, '获取溯源数据成功');
});

export const getOperationLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pageNum, pageSize } = req.query;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id as string, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const page = pageNum ? parseInt(pageNum as string, 10) : 1;
  const size = pageSize ? parseInt(pageSize as string, 10) : 20;

  const result = await marketingTraceService.getOperationLogs(marketingId, page, size);
  ok(res, result, '获取操作日志成功');
});

export const getProductLedger = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pageNum, pageSize } = req.query;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id as string, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const page = pageNum ? parseInt(pageNum as string, 10) : 1;
  const size = pageSize ? parseInt(pageSize as string, 10) : 20;

  const result = await marketingTraceService.getProductLedger(marketingId, page, size);
  ok(res, result, '获取参与商品台账成功');
});

export const getCreateInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id as string, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const result = await marketingTraceService.getCreateInfo(marketingId);
  ok(res, result, '获取创建溯源信息成功');
});

export const checkDuplicateConfig = asyncHandler(async (req: Request, res: Response) => {
  const { type, startTime, endTime, categoryIds, merchantIds, discountValue, excludeId } = req.body;

  const result = await marketingTraceService.checkDuplicateConfig({
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    startTime,
    endTime,
    categoryIds,
    merchantIds,
    discountValue: discountValue !== undefined ? parseFloat(discountValue as string) : undefined,
    excludeId: excludeId !== undefined ? parseInt(excludeId as string, 10) : undefined,
  });

  ok(res, result, '重复配置检查完成');
});

export default {
  getTraceData,
  getOperationLogs,
  getProductLedger,
  getCreateInfo,
  checkDuplicateConfig,
};
