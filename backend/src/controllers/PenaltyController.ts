import { Request, Response } from 'express';
import { penaltyService, PenaltyCreatePayload } from '../services/PenaltyService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const executePenalty = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, type, amount, reason, expire_time, auto_offline, auto_block_orders } = req.body;

  if (merchant_id === undefined) {
    badRequest(res, '缺少商家ID');
    return;
  }

  if (type === undefined) {
    badRequest(res, '缺少处罚类型');
    return;
  }

  if (!reason) {
    badRequest(res, '缺少处罚原因');
    return;
  }

  const payload: PenaltyCreatePayload = {
    merchant_id: parseInt(merchant_id, 10),
    type: parseInt(type, 10),
    amount: amount !== undefined ? parseFloat(amount) : undefined,
    reason,
    expire_time,
    auto_offline: auto_offline === true || auto_offline === 'true',
    auto_block_orders: auto_block_orders === true || auto_block_orders === 'true',
  };

  const result = await penaltyService.create(payload);
  ok(res, result, '执行处罚成功');
});

export const revokePenalty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少处罚ID');
    return;
  }

  const result = await penaltyService.revoke(parseInt(id, 10));
  ok(res, result, '解除处罚成功');
});

export const checkViolation = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.body;

  if (merchant_id === undefined) {
    badRequest(res, '缺少商家ID');
    return;
  }

  const result = await penaltyService.checkViolation(parseInt(merchant_id, 10));
  ok(res, result, '违规检测完成');
});

export const autoLiftExpired = asyncHandler(async (_req: Request, res: Response) => {
  const result = await penaltyService.autoLiftExpired();
  ok(res, result, `自动解除过期处罚完成，共解除 ${result.lifted_count} 条`);
});

export const getPenaltyList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, merchant_id, type, status, startDate, endDate } = req.query;

  const result = await penaltyService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  ok(res, result, '获取处罚列表成功');
});

export default {
  executePenalty,
  revokePenalty,
  checkViolation,
  autoLiftExpired,
  getPenaltyList,
};
