import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingDiscountRuleTraceService } from '../services/MarketingDiscountRuleTraceService';

export const getTraceData = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  try {
    const data = await marketingDiscountRuleTraceService.getTraceData(id);
    ok(res, data, '查询成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const getConfigLogs = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const { pageNum = 1, pageSize = 20 } = req.query;
  const logs = await marketingDiscountRuleTraceService.getConfigLogs(id, {
    page: parseInt(pageNum as string, 10),
    pageSize: parseInt(pageSize as string, 10),
  });

  ok(res, logs, '查询成功');
});

export const getUsageRecords = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const { pageNum = 1, pageSize = 20 } = req.query;
  const records = await marketingDiscountRuleTraceService.getUsageRecords(id, {
    page: parseInt(pageNum as string, 10),
    pageSize: parseInt(pageSize as string, 10),
  });

  ok(res, records, '查询成功');
});

export const getStackConflicts = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const conflicts = await marketingDiscountRuleTraceService.getStackConflicts(id);
  ok(res, conflicts, '查询成功');
});

export const getBudgetLedger = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const { pageNum = 1, pageSize = 20 } = req.query;
  const ledger = await marketingDiscountRuleTraceService.getBudgetLedger(id, {
    page: parseInt(pageNum as string, 10),
    pageSize: parseInt(pageSize as string, 10),
  });

  ok(res, ledger, '查询成功');
});

export const checkIllegalStacking = asyncHandler(async (req: Request, res: Response) => {
  const { ruleIds } = req.body;
  if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length < 2) {
    badRequest(res, '请至少选择2个优惠规则');
    return;
  }

  const ids = ruleIds.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
  const result = await marketingDiscountRuleTraceService.checkIllegalStacking(ids);
  ok(res, result, '检测完成');
});

export const checkOverLimit = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId } = req.query;
  if (!marketingId) {
    badRequest(res, '请选择营销活动');
    return;
  }

  const result = await marketingDiscountRuleTraceService.checkOverLimit(parseInt(marketingId as string, 10));
  ok(res, result, '检测完成');
});

export const getMarketingBudgetLedger = asyncHandler(async (req: Request, res: Response) => {
  const marketingId = parseInt(req.params.marketingId, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const { pageNum = 1, pageSize = 20 } = req.query;
  const ledger = await marketingDiscountRuleTraceService.getBudgetLedgerByMarketing(marketingId, {
    page: parseInt(pageNum as string, 10),
    pageSize: parseInt(pageSize as string, 10),
  });

  ok(res, ledger, '查询成功');
});

export default {
  getTraceData,
  getConfigLogs,
  getUsageRecords,
  getStackConflicts,
  getBudgetLedger,
  checkIllegalStacking,
  checkOverLimit,
  getMarketingBudgetLedger,
};
