import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingProductTraceService } from '../services/MarketingProductTraceService';

export const getTraceData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const result = await marketingProductTraceService.getTraceData(idNum);
  ok(res, result, '获取溯源数据成功');
});

export const getAdmissionLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);

  const result = await marketingProductTraceService.getAdmissionLogs(idNum, {
    page: pageNum,
    pageSize: pageSizeNum,
  });

  ok(res, result, '获取准入日志成功');
});

export const getAdmissionLogsByMarketing = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  if (isNaN(marketingIdNum)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const pageNum = parseInt(page as string, 10);
  const pageSizeNum = parseInt(pageSize as string, 10);

  const result = await marketingProductTraceService.getAdmissionLogsByMarketing(marketingIdNum, {
    page: pageNum,
    pageSize: pageSizeNum,
  });

  ok(res, result, '获取活动准入日志成功');
});

export const getApplyInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const result = await marketingProductTraceService.getApplyInfo(idNum);
  ok(res, result, '获取报名信息成功');
});

export const getAuditInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少活动商品ID');
    return;
  }

  const idNum = parseInt(id as string, 10);
  if (isNaN(idNum)) {
    badRequest(res, 'ID格式无效');
    return;
  }

  const result = await marketingProductTraceService.getAuditInfo(idNum);
  ok(res, result, '获取审核信息成功');
});

export const checkDuplicateApply = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsIds } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsIds || !Array.isArray(goodsIds)) {
    badRequest(res, '请选择商品');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  const goodsIdNums = goodsIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (isNaN(marketingIdNum) || goodsIdNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const result = await marketingProductTraceService.checkDuplicateApply(marketingIdNum, goodsIdNums);
  ok(res, result, '检查完成');
});

export const checkCrossCategoryViolation = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, goodsIds } = req.body;

  if (!marketingId) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  if (!goodsIds || !Array.isArray(goodsIds)) {
    badRequest(res, '请选择商品');
    return;
  }

  const marketingIdNum = parseInt(marketingId as string, 10);
  const goodsIdNums = goodsIds.map((id: any) => parseInt(id as string, 10)).filter(id => !isNaN(id));

  if (isNaN(marketingIdNum) || goodsIdNums.length === 0) {
    badRequest(res, '参数格式无效');
    return;
  }

  const result = await marketingProductTraceService.checkCrossCategoryViolation(
    marketingIdNum,
    goodsIdNums
  );

  ok(res, result, '检查完成');
});

export const getAdmissionRules = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, marketingType } = req.query;

  const marketingIdNum = marketingId ? parseInt(marketingId as string, 10) : undefined;
  const marketingTypeNum = marketingType ? parseInt(marketingType as string, 10) : undefined;

  const result = await marketingProductTraceService.getAdmissionRules(
    marketingIdNum,
    marketingTypeNum
  );

  ok(res, result, '获取准入规则成功');
});

export default {
  getTraceData,
  getAdmissionLogs,
  getAdmissionLogsByMarketing,
  getApplyInfo,
  getAuditInfo,
  checkDuplicateApply,
  checkCrossCategoryViolation,
  getAdmissionRules,
};
