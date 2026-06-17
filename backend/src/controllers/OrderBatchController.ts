import { Request, Response } from 'express';
import { orderService } from '../services/OrderService';
import { BatchQueryParams } from '../services/OrderBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

const getOperatorInfo = (req: Request) => {
  const user = (req as any).user || { id: 1, username: 'admin' };
  return {
    operatorId: user.id || 1,
    operatorName: user.username || 'admin',
  };
};

export const getBatchOrderList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, orderNo, payType, status,
    startTime, endTime, minAmount, maxAmount,
    isException, isArchived, merchantId, userId,
  } = req.query;

  const params: BatchQueryParams = {
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    orderNo: orderNo as string,
    payType: payType !== undefined ? parseInt(payType as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startTime: startTime as string,
    endTime: endTime as string,
    minAmount: minAmount !== undefined ? parseFloat(minAmount as string) : undefined,
    maxAmount: maxAmount !== undefined ? parseFloat(maxAmount as string) : undefined,
    isException: isException !== undefined ? parseInt(isException as string, 10) : undefined,
    isArchived: isArchived !== undefined ? parseInt(isArchived as string, 10) : undefined,
    merchantId: merchantId !== undefined ? parseInt(merchantId as string, 10) : undefined,
    userId: userId !== undefined ? parseInt(userId as string, 10) : undefined,
  };

  const result = await orderService.getBatchList(params);
  ok(res, result, '获取订单列表成功');
});

export const batchRemind = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要提醒的订单');
    return;
  }

  const result = await orderService.batchRemind(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    operatorId,
    operatorName
  );

  ok(res, result, `批量提醒完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchMarkException = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要标记的订单');
    return;
  }

  const result = await orderService.batchMarkException(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    operatorId,
    operatorName
  );

  ok(res, result, `批量标记完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchArchive = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要归档的订单');
    return;
  }

  const result = await orderService.batchArchive(
    ids.map((id: string | number) => parseInt(String(id), 10)),
    operatorId,
    operatorName
  );

  ok(res, result, `批量归档完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchRemindByQuery = asyncHandler(async (req: Request, res: Response) => {
  const { operatorId, operatorName } = getOperatorInfo(req);
  const params = req.body as BatchQueryParams;

  const result = await orderService.batchRemindByQuery(params, operatorId, operatorName);
  ok(res, result, `按条件批量提醒完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchMarkExceptionByQuery = asyncHandler(async (req: Request, res: Response) => {
  const { operatorId, operatorName } = getOperatorInfo(req);
  const params = req.body as BatchQueryParams;

  const result = await orderService.batchMarkExceptionByQuery(params, operatorId, operatorName);
  ok(res, result, `按条件批量标记完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchArchiveByQuery = asyncHandler(async (req: Request, res: Response) => {
  const { operatorId, operatorName } = getOperatorInfo(req);
  const params = req.body as BatchQueryParams;

  const result = await orderService.batchArchiveByQuery(params, operatorId, operatorName);
  ok(res, result, `按条件批量归档完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export default {
  getBatchOrderList,
  batchRemind,
  batchMarkException,
  batchArchive,
  batchRemindByQuery,
  batchMarkExceptionByQuery,
  batchArchiveByQuery,
};
