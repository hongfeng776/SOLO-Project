import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import { settleCalcService, ChangeStatusOptions } from '../services/SettleCalcService';

export const calcAmount = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodType, startDate, endDate } = req.body;

  if (!merchantId || periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：merchantId, periodType, startDate, endDate');
    return;
  }

  try {
    const result = await settleCalcService.calcSettleAmount(
      parseInt(merchantId, 10),
      parseInt(periodType, 10),
      startDate,
      endDate
    );

    success(res, result, '结算金额核算完成');
  } catch (error) {
    badRequest(res, error instanceof Error ? error.message : '核算失败');
  }
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { applyId, targetStatus, operatorId, operatorName, rejectReason, remark } = req.body;

  if (!applyId || targetStatus === undefined) {
    badRequest(res, '缺少必要参数：applyId, targetStatus');
    return;
  }

  const options: ChangeStatusOptions = {};
  if (rejectReason) options.rejectReason = rejectReason;
  if (remark) options.remark = remark;

  const result = await settleCalcService.changeApplyStatus(
    parseInt(applyId, 10),
    parseInt(targetStatus, 10),
    operatorId ? parseInt(operatorId, 10) : undefined,
    operatorName,
    options
  );

  if (result.success) {
    success(res, result, result.message || '状态变更成功');
  } else {
    badRequest(res, result.message || '状态变更失败');
  }
});

export const createApply = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodType, startDate, endDate, operatorId, operatorName } = req.body;

  if (!merchantId || periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：merchantId, periodType, startDate, endDate');
    return;
  }

  const result = await settleCalcService.createApplyOrder(
    parseInt(merchantId, 10),
    parseInt(periodType, 10),
    startDate,
    endDate,
    operatorId ? parseInt(operatorId, 10) : undefined,
    operatorName
  );

  if (result.success) {
    success(res, result, result.message || '创建结算申请成功');
  } else {
    badRequest(res, result.message || '创建结算申请失败');
  }
});

export const batchCalc = asyncHandler(async (req: Request, res: Response) => {
  const { merchantIds, periodType, startDate, endDate } = req.body;

  if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
    badRequest(res, '缺少商家ID列表');
    return;
  }
  if (periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：periodType, startDate, endDate');
    return;
  }

  const result = await settleCalcService.batchCalcSettle(
    merchantIds.map((id: any) => parseInt(id, 10)),
    parseInt(periodType, 10),
    startDate,
    endDate
  );

  success(res, { results: result }, '批量核算完成');
});

export default {
  calcAmount,
  changeStatus,
  createApply,
  batchCalc,
};
