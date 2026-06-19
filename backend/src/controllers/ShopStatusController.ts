import { Request, Response } from 'express';
import { shopStatusService } from '../services/ShopStatusService';
import { ok, badRequest } from '../utils/response';

export const changeStatus = async (req: Request, res: Response) => {
  const { merchant_id, target_status, change_source, change_reason } = req.body;
  if (!merchant_id) return badRequest(res, '商家ID不能为空');
  if (target_status === undefined) return badRequest(res, '目标状态不能为空');
  if (!change_source) return badRequest(res, '变更来源不能为空');
  if (!change_reason) return badRequest(res, '变更原因不能为空');
  const result = await shopStatusService.changeStatus(req.body);
  return ok(res, result);
};

export const getStatusLogs = async (req: Request, res: Response) => {
  const merchantId = Number(req.params.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const logs = await shopStatusService.getStatusChangeLogs(merchantId);
  return ok(res, logs);
};
