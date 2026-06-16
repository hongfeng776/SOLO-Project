import { Request, Response } from 'express';
import { statisticsService, TimeRange } from '../services/StatisticsService';
import { hotCacheService } from '../services/HotCacheService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const result = await statisticsService.getDashboardData();
  ok(res, result, '获取概览统计成功');
});

export const getSalesStats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query;
  const validRanges: TimeRange[] = ['day', 'week', 'month'];
  const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : 'day';
  const result = await statisticsService.getSalesStats(timeRange);
  ok(res, result, '获取销售统计成功');
});

export const getGoodsStats = asyncHandler(async (req: Request, res: Response) => {
  const { topN } = req.query;
  const n = topN ? parseInt(topN as string, 10) : 10;
  if (isNaN(n) || n <= 0 || n > 100) {
    badRequest(res, 'topN参数必须是1-100之间的正整数');
    return;
  }
  const result = await statisticsService.getGoodsStats(n);
  ok(res, result, '获取商品统计成功');
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query;
  const validRanges: TimeRange[] = ['day', 'week', 'month'];
  const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : 'day';
  const result = await statisticsService.getUserStats(timeRange);
  ok(res, result, '获取用户统计成功');
});

export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query;
  const validRanges: TimeRange[] = ['day', 'week', 'month'];
  const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : 'day';
  const result = await statisticsService.getOrderStats(timeRange);
  ok(res, result, '获取订单统计成功');
});

export const getMarketingStats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query;
  const validRanges: TimeRange[] = ['day', 'week', 'month'];
  const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : 'day';
  const result = await statisticsService.getMarketingStats(timeRange);
  ok(res, result, '获取营销统计成功');
});

export const getAfterSaleStats = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query;
  const validRanges: TimeRange[] = ['day', 'week', 'month'];
  const timeRange = validRanges.includes(range as TimeRange) ? (range as TimeRange) : 'day';
  const result = await statisticsService.getAfterSaleStats(timeRange);
  ok(res, result, '获取售后统计成功');
});

export const getMerchantStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await statisticsService.getMerchantStats();
  ok(res, result, '获取商家统计成功');
});

export const getHotGoods = asyncHandler(async (req: Request, res: Response) => {
  const { topN, sortBy } = req.query;
  const n = topN ? parseInt(topN as string, 10) : 20;
  if (isNaN(n) || n <= 0 || n > 100) {
    badRequest(res, 'topN参数必须是1-100之间的正整数');
    return;
  }
  const validSortBy = ['sales', 'views'];
  const sort = validSortBy.includes(sortBy as string) ? (sortBy as 'sales' | 'views') : 'sales';
  const result = await hotCacheService.getHotGoods({ topN: n, sortBy: sort });
  ok(res, result, '获取热门商品成功');
});

export const getActiveOrders = asyncHandler(async (req: Request, res: Response) => {
  const { hours } = req.query;
  const h = hours ? parseInt(hours as string, 10) : 24;
  if (isNaN(h) || h <= 0 || h > 720) {
    badRequest(res, 'hours参数必须是1-720之间的正整数');
    return;
  }
  const result = await hotCacheService.getActiveOrders(h);
  ok(res, result, '获取活跃订单成功');
});

export const getCoreUsers = asyncHandler(async (req: Request, res: Response) => {
  const { topN, minSpend } = req.query;
  const n = topN ? parseInt(topN as string, 10) : 100;
  if (isNaN(n) || n <= 0 || n > 500) {
    badRequest(res, 'topN参数必须是1-500之间的正整数');
    return;
  }
  const min = minSpend ? parseFloat(minSpend as string) : 1000;
  if (isNaN(min) || min < 0) {
    badRequest(res, 'minSpend参数必须是非负数');
    return;
  }
  const result = await hotCacheService.getCoreUsers({ topN: n, minSpend: min });
  ok(res, result, '获取核心用户成功');
});

export default {
  getDashboard,
  getSalesStats,
  getGoodsStats,
  getUserStats,
  getOrderStats,
  getMarketingStats,
  getAfterSaleStats,
  getMerchantStats,
  getHotGoods,
  getActiveOrders,
  getCoreUsers,
};
