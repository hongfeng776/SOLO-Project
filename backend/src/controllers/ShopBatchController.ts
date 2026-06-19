import { Request, Response } from 'express';
import { shopBatchService } from '../services/ShopBatchService';
import { ok, badRequest } from '../utils/response';

export const batchUpdateTags = async (req: Request, res: Response) => {
  const { merchant_ids, tags } = req.body;
  if (!merchant_ids || merchant_ids.length === 0) return badRequest(res, '请选择要操作的商家');
  if (!tags || tags.length === 0) return badRequest(res, '请选择要设置的标签');
  const result = await shopBatchService.batchUpdateTags(req.body);
  return ok(res, result);
};

export const batchSuspend = async (req: Request, res: Response) => {
  const { merchant_ids, reason } = req.body;
  if (!merchant_ids || merchant_ids.length === 0) return badRequest(res, '请选择要操作的商家');
  if (!reason) return badRequest(res, '请填写操作原因');
  const result = await shopBatchService.batchSuspend(req.body);
  return ok(res, result);
};

export const batchResume = async (req: Request, res: Response) => {
  const { merchant_ids, reason } = req.body;
  if (!merchant_ids || merchant_ids.length === 0) return badRequest(res, '请选择要操作的商家');
  if (!reason) return badRequest(res, '请填写操作原因');
  const result = await shopBatchService.batchResume(req.body);
  return ok(res, result);
};

export const batchChangeLevel = async (req: Request, res: Response) => {
  const { merchant_ids, target_level, reason } = req.body;
  if (!merchant_ids || merchant_ids.length === 0) return badRequest(res, '请选择要操作的商家');
  if (target_level === undefined) return badRequest(res, '请选择目标等级');
  const result = await shopBatchService.batchChangeLevel(merchant_ids as number[], target_level as number, reason as string);
  return ok(res, result);
};

export const getBatchScope = async (req: Request, res: Response) => {
  const level = Number(req.query.permission_level || 1);
  const result = await shopBatchService.getBatchScopeByPermission(level);
  return ok(res, result);
};
