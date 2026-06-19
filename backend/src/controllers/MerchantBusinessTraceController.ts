import { Request, Response } from 'express';
import { merchantBusinessTraceService } from '../services/MerchantBusinessTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantBusinessTraceService.getFullTrace(parseInt(id, 10));
    ok(res, result, '获取全链路溯源成功');
  } catch (error) {
    if (error instanceof Error && error.message === '经营数据不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const checkDataAccuracy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantBusinessTraceService.checkDataAccuracy(parseInt(id, 10));
    ok(res, result, '数据准确性校验完成');
  } catch (error) {
    if (error instanceof Error && error.message === '经营数据不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, pageSize } = req.query;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantBusinessTraceService.getOrderDetailsByBusinessData(
      parseInt(id, 10),
      page ? parseInt(page as string, 10) : 1,
      pageSize ? parseInt(pageSize as string, 10) : 20
    );
    ok(res, result, '获取关联订单明细成功');
  } catch (error) {
    if (error instanceof Error && error.message === '经营数据不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const getSettlementRecords = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, pageSize } = req.query;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantBusinessTraceService.getSettlementRecordsByBusinessData(
      parseInt(id, 10),
      page ? parseInt(page as string, 10) : 1,
      pageSize ? parseInt(pageSize as string, 10) : 20
    );
    ok(res, result, '获取关联结算记录成功');
  } catch (error) {
    if (error instanceof Error && error.message === '经营数据不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const getAbnormalLogs = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  const { page, pageSize } = req.query;

  if (!merchant_id) {
    badRequest(res, '缺少参数：merchant_id');
    return;
  }

  const result = await merchantBusinessTraceService.getAbnormalLogsByMerchant(
    parseInt(merchant_id, 10),
    page ? parseInt(page as string, 10) : 1,
    pageSize ? parseInt(pageSize as string, 10) : 20
  );

  ok(res, result, '获取异常日志成功');
});

export default {
  getFullTrace,
  checkDataAccuracy,
  getOrderDetails,
  getSettlementRecords,
  getAbnormalLogs,
};
