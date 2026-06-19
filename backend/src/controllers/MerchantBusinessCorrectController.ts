import { Request, Response } from 'express';
import { merchantBusinessCorrectService } from '../services/MerchantBusinessCorrectService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const correctBusinessData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { corrections, correct_reason, operator_id, operator_name } = req.body;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  if (!corrections || Object.keys(corrections).length === 0) {
    badRequest(res, '缺少修正数据：corrections');
    return;
  }

  if (!correct_reason) {
    badRequest(res, '缺少修正原因：correct_reason');
    return;
  }

  try {
    const result = await merchantBusinessCorrectService.correctBusinessData(
      parseInt(id, 10),
      corrections,
      correct_reason,
      operator_id ? parseInt(operator_id, 10) : undefined,
      operator_name
    );
    ok(res, result, '经营数据修正成功');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '经营数据不存在') {
        notFound(res, error.message);
        return;
      }
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const recalcLevelAndRank = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, assess_reason, operator_id, operator_name } = req.body;

  if (!merchant_id) {
    badRequest(res, '缺少参数：merchant_id');
    return;
  }

  try {
    const result = await merchantBusinessCorrectService.recalcLevelAndRank(
      parseInt(merchant_id, 10),
      assess_reason || '手动重新计算',
      operator_id ? parseInt(operator_id, 10) : undefined,
      operator_name
    );
    ok(res, result, '等级排名重新计算成功');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '商家不存在') {
        notFound(res, error.message);
        return;
      }
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const getCorrectLogs = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  const { page, pageSize } = req.query;

  if (!merchant_id) {
    badRequest(res, '缺少参数：merchant_id');
    return;
  }

  const result = await merchantBusinessCorrectService.getCorrectLogsByMerchant(
    parseInt(merchant_id, 10),
    page ? parseInt(page as string, 10) : 1,
    pageSize ? parseInt(pageSize as string, 10) : 20
  );

  ok(res, result, '获取修正日志成功');
});

export const validateCorrectDiff = asyncHandler(async (req: Request, res: Response) => {
  const { field, before_value, after_value } = req.body;

  if (!field || before_value === undefined || after_value === undefined) {
    badRequest(res, '缺少必要参数：field, before_value, after_value');
    return;
  }

  const result = merchantBusinessCorrectService.validateCorrectDiff(
    field,
    parseFloat(before_value),
    parseFloat(after_value)
  );

  ok(res, result, '修正差异校验完成');
});

export default {
  correctBusinessData,
  recalcLevelAndRank,
  getCorrectLogs,
  validateCorrectDiff,
};
