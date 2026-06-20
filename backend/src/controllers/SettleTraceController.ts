import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import { settleTraceService } from '../services/SettleTraceService';

export const fullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { applyId } = req.params;

  if (!applyId) {
    badRequest(res, '缺少申请单ID');
    return;
  }

  const result = await settleTraceService.getFullTrace(parseInt(applyId, 10));

  success(res, result, result.applyOrder ? '获取完整溯源信息成功' : '申请单不存在');
});

export const checkConsistency = asyncHandler(async (req: Request, res: Response) => {
  const { applyId } = req.params;

  if (!applyId) {
    badRequest(res, '缺少申请单ID');
    return;
  }

  const result = await settleTraceService.checkConsistency(parseInt(applyId, 10));

  success(res, result, result.pass ? '一致性校验通过' : '一致性校验未通过');
});

export const interceptDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodType, start, end } = req.body;

  if (!merchantId || periodType === undefined || !start || !end) {
    badRequest(res, '缺少必要参数：merchantId, periodType, start, end');
    return;
  }

  const result = await settleTraceService.interceptDuplicateSettle(
    parseInt(merchantId, 10),
    parseInt(periodType, 10),
    start,
    end
  );

  success(res, result, !result.hasDuplicate ? '无重复周期申请' : '存在重复周期申请');
});

export const interceptOverSettle = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, applyAmount } = req.body;

  if (!merchantId || applyAmount === undefined) {
    badRequest(res, '缺少必要参数：merchantId, applyAmount');
    return;
  }

  const result = await settleTraceService.interceptOverSettle(
    parseInt(merchantId, 10),
    Number(applyAmount)
  );

  success(res, result, !result.isOver ? '未超额结算' : '超额结算拦截');
});

export default {
  fullTrace,
  checkConsistency,
  interceptDuplicate,
  interceptOverSettle,
};
