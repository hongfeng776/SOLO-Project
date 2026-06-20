import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingBatchService, type BatchFilterParams } from '../services/MarketingBatchService';

export const batchOnline = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要上线的营销活动');
    return;
  }

  const marketingIds = ids.map((id: any) => {
    const parsed = parseInt(id as string, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的营销活动ID');
    }
    return parsed;
  });

  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.batchOnline(marketingIds, operatorId, operatorName);
  ok(res, result, `批量上线完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchOffline = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要下架的营销活动');
    return;
  }

  const marketingIds = ids.map((id: any) => {
    const parsed = parseInt(id as string, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的营销活动ID');
    }
    return parsed;
  });

  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.batchOffline(marketingIds, operatorId, operatorName);
  ok(res, result, `批量下架完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchPause = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要暂停的营销活动');
    return;
  }

  const marketingIds = ids.map((id: any) => {
    const parsed = parseInt(id as string, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的营销活动ID');
    }
    return parsed;
  });

  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.batchPause(marketingIds, operatorId, operatorName);
  ok(res, result, `批量暂停完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const filterAndOperate = asyncHandler(async (req: Request, res: Response) => {
  const { operation, type, status, startTimeStart, startTimeEnd, endTimeStart, endTimeEnd, minDiscount, maxDiscount, discountType } = req.body;

  if (!operation || !['online', 'offline', 'pause'].includes(operation)) {
    badRequest(res, '请选择有效的操作类型');
    return;
  }

  const filterParams: BatchFilterParams = {
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startTimeStart,
    startTimeEnd,
    endTimeStart,
    endTimeEnd,
    minDiscount: minDiscount !== undefined ? parseFloat(minDiscount as string) : undefined,
    maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount as string) : undefined,
    discountType: discountType !== undefined ? parseInt(discountType as string, 10) : undefined,
  };

  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.filterAndOperate(
    filterParams,
    operation as 'online' | 'offline' | 'pause',
    operatorId,
    operatorName
  );
  ok(res, result, `筛选批量操作完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchOfflineExpired = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.batchOfflineExpired(operatorId, operatorName);
  ok(res, result, `批量下架过期活动完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchOnlinePending = asyncHandler(async (req: Request, res: Response) => {
  const operatorId = (req as any).user?.id ?? 0;
  const operatorName = (req as any).user?.nickname ?? '管理员';

  const result = await marketingBatchService.batchOnlinePending(operatorId, operatorName);
  ok(res, result, `批量上线待启动活动完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export default {
  batchOnline,
  batchOffline,
  batchPause,
  filterAndOperate,
  batchOfflineExpired,
  batchOnlinePending,
};
