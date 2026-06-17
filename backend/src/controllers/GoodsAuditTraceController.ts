import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { goodsAuditTraceService } from '../services/GoodsAuditTraceService';

export const getAuditFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  const result = await goodsAuditTraceService.getAuditFullTrace(parseInt(id, 10));
  ok(res, result, '获取审核溯源成功');
});

export const checkDuplicateSubmit = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.query;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsAuditTraceService.checkDuplicateSubmit(parseInt(goods_id as string, 10));
  ok(res, result, '重复提交检查完成');
});

export const checkAuditTimeliness = asyncHandler(async (req: Request, res: Response) => {
  const { audit_id } = req.query;

  if (!audit_id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  const result = await goodsAuditTraceService.checkAuditTimeliness(parseInt(audit_id as string, 10));
  ok(res, result, '审核时效校验完成');
});

export const getTimeoutAlerts = asyncHandler(async (_req: Request, res: Response) => {
  const result = await goodsAuditTraceService.getTimeoutAlerts();
  ok(res, result, '获取超时预警成功');
});

export const getAuditStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await goodsAuditTraceService.getAuditStats();
  ok(res, result, '获取审核统计成功');
});

export default {
  getAuditFullTrace,
  checkDuplicateSubmit,
  checkAuditTimeliness,
  getTimeoutAlerts,
  getAuditStats,
};
