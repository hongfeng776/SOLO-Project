import { Request, Response } from 'express';
import { marketingCalcService, CalcContext } from '../services/MarketingCalcService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const calculate = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, order_items, selected_coupon_ids, marketing_ids } = req.body;

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    badRequest(res, '订单项不能为空');
    return;
  }

  for (const item of order_items) {
    if (item.goods_id === undefined || item.price === undefined || !item.quantity) {
      badRequest(res, '订单项缺少必要参数：商品ID、价格、数量');
      return;
    }
  }

  const ctx: CalcContext = {
    user_id: parseInt(user_id, 10),
    order_items,
    selected_coupon_ids,
    marketing_ids,
  };

  const result = await marketingCalcService.calculate(ctx);
  ok(res, result, '营销核算成功');
});

export const bestCombination = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, order_items, marketing_ids } = req.body;

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    badRequest(res, '订单项不能为空');
    return;
  }

  for (const item of order_items) {
    if (item.goods_id === undefined || item.price === undefined || !item.quantity) {
      badRequest(res, '订单项缺少必要参数：商品ID、价格、数量');
      return;
    }
  }

  const ctx: CalcContext = {
    user_id: parseInt(user_id, 10),
    order_items,
    marketing_ids,
  };

  const result = await marketingCalcService.findBestCombination(ctx);
  ok(res, result, '获取最优组合成功');
});

export const claimCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { marketing_id } = req.body;

  if (marketing_id === undefined) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    badRequest(res, '用户未登录');
    return;
  }

  const result = await marketingCalcService.claimCoupon(userId, parseInt(marketing_id, 10));
  ok(res, result, '领取优惠券成功');
});

export const useCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { coupon_ids } = req.body;

  if (!coupon_ids || !Array.isArray(coupon_ids) || coupon_ids.length === 0) {
    badRequest(res, '请选择要使用的优惠券');
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    badRequest(res, '用户未登录');
    return;
  }

  await marketingCalcService.useCoupons(
    userId,
    coupon_ids.map((id: string | number) => parseInt(String(id), 10))
  );
  ok(res, null, '优惠券使用成功');
});

export const processExpired = asyncHandler(async (_req: Request, res: Response) => {
  const count = await marketingCalcService.processExpiredCoupons();
  ok(res, { count }, `处理过期优惠券完成，共处理 ${count} 张`);
});

export default {
  calculate,
  bestCombination,
  claimCoupon,
  useCoupons,
  processExpired,
};
