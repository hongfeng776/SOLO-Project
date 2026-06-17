import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { goodsAuditReviewService } from '../services/GoodsAuditReviewService';

export const getRiskLevel = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.query;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsAuditReviewService.getRiskLevel(parseInt(goods_id as string, 10));
  ok(res, { risk_level: result }, '获取风险等级成功');
});

export const executeInitialReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { result, remark } = req.body;

  if (!id || result === undefined) {
    badRequest(res, '缺少审核ID或初审结果');
    return;
  }

  await goodsAuditReviewService.executeInitialReview(
    parseInt(id, 10),
    req.user?.id ?? 0,
    result,
    remark
  );
  ok(res, null, '初审完成');
});

export const executeFinalReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { result, remark } = req.body;

  if (!id || result === undefined) {
    badRequest(res, '缺少审核ID或复审结果');
    return;
  }

  await goodsAuditReviewService.executeFinalReview(
    parseInt(id, 10),
    req.user?.id ?? 0,
    result,
    remark
  );
  ok(res, null, '复审完成');
});

export const freezeAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id || !reason) {
    badRequest(res, '缺少审核ID或冻结原因');
    return;
  }

  await goodsAuditReviewService.freezeAudit(parseInt(id, 10), reason);
  ok(res, null, '冻结成功');
});

export const unfreezeAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  await goodsAuditReviewService.unfreezeAudit(parseInt(id, 10));
  ok(res, null, '解冻成功');
});

export const checkTimeout = asyncHandler(async (_req: Request, res: Response) => {
  const count = await goodsAuditReviewService.checkTimeout();
  ok(res, { timeout_count: count }, '超时检查完成');
});

export default {
  getRiskLevel,
  executeInitialReview,
  executeFinalReview,
  freezeAudit,
  unfreezeAudit,
  checkTimeout,
};
