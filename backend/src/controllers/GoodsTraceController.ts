import { Request, Response } from 'express';
import { goodsTraceService } from '../services/GoodsTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getGoodsFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsTraceService.getGoodsFullTrace(parseInt(id, 10));
  ok(res, result, '获取商品溯源信息成功');
});

export const checkDataConsistency = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsTraceService.checkDataConsistency(parseInt(id, 10));
  ok(res, result, result.consistent ? '数据一致性校验通过' : '数据存在异常');
});

export const getRepeatSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsTraceService.getRepeatSuggestions(parseInt(id, 10));
  ok(res, result, '获取重复商品推荐成功');
});

export default {
  getGoodsFullTrace,
  checkDataConsistency,
  getRepeatSuggestions,
};
