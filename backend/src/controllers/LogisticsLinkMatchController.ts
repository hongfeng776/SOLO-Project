import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import logisticsLinkMatchService from '../services/LogisticsLinkMatchService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const startLinkMatch = asyncHandler(async (req: Request, res: Response) => {
  const { order_id } = req.body;
  if (!order_id) {
    badRequest(res, '缺少订单ID');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await logisticsLinkMatchService.runLinkMatch(
    parseInt(order_id as string, 10),
    adminId,
    adminName
  );
  success(res, result, '链路匹配已启动');
});

export const getMatchProgress = asyncHandler(async (req: Request, res: Response) => {
  const { match_no } = req.params;
  if (!match_no) {
    badRequest(res, '缺少匹配单号');
    return;
  }
  const result = await logisticsLinkMatchService.getMatchProgress(match_no as string);
  success(res, result, '获取匹配进度成功');
});

export const getMatchResult = asyncHandler(async (req: Request, res: Response) => {
  const { match_no } = req.params;
  if (!match_no) {
    badRequest(res, '缺少匹配单号');
    return;
  }
  const result = await logisticsLinkMatchService.getMatchResult(match_no as string);
  success(res, result, '获取匹配结果成功');
});

export const selectProvider = asyncHandler(async (req: Request, res: Response) => {
  const { match_no, provider_id } = req.body;
  if (!match_no || !provider_id) {
    badRequest(res, '缺少必要参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  await logisticsLinkMatchService.selectProvider(
    match_no as string,
    parseInt(provider_id as string, 10),
    adminId,
    adminName
  );
  ok(res, null, '服务商选择成功');
});

export default {
  startLinkMatch,
  getMatchProgress,
  getMatchResult,
  selectProvider,
};
