import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { goodsAuditValidateService } from '../services/GoodsAuditValidateService';

export const validatePreSubmit = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.query;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsAuditValidateService.validatePreSubmit(parseInt(goods_id as string, 10));
  ok(res, result, '前置校验完成');
});

export const getMissingFields = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.query;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsAuditValidateService.getMissingFields(parseInt(goods_id as string, 10));
  ok(res, result, '获取缺失字段成功');
});

export const canResubmit = asyncHandler(async (req: Request, res: Response) => {
  const { audit_id } = req.query;

  if (!audit_id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  const result = await goodsAuditValidateService.canResubmit(parseInt(audit_id as string, 10));
  ok(res, result, '查询可重提状态成功');
});

export const autoInitialReview = asyncHandler(async (req: Request, res: Response) => {
  const { audit_id } = req.body;

  if (!audit_id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  await goodsAuditValidateService.autoInitialReview(audit_id);
  ok(res, null, '自动初审完成');
});

export const checkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.query;

  if (!goods_id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsAuditValidateService.canResubmit(parseInt(goods_id as string, 10));
  ok(res, result, '查重完成');
});

export default {
  validatePreSubmit,
  getMissingFields,
  canResubmit,
  autoInitialReview,
  checkDuplicate,
};
