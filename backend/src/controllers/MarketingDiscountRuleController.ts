import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { marketingDiscountRuleService } from '../services/MarketingDiscountRuleService';
import { daos } from '../dao';

const { marketingDiscountRuleDao } = daos;

export const getRuleList = asyncHandler(async (req: Request, res: Response) => {
  const {
    marketingId,
    discountType,
    effectiveStatus,
    keyword,
    minAmountMin,
    minAmountMax,
    pageNum = 1,
    pageSize = 20,
  } = req.query;

  const result = await marketingDiscountRuleDao.findPageByConditions({
    page: parseInt(pageNum as string, 10),
    pageSize: parseInt(pageSize as string, 10),
    marketingId: marketingId ? parseInt(marketingId as string, 10) : undefined,
    discountType: discountType ? parseInt(discountType as string, 10) : undefined,
    effectiveStatus: effectiveStatus !== undefined ? parseInt(effectiveStatus as string, 10) : undefined,
    keyword: keyword as string,
    minAmountMin: minAmountMin ? parseFloat(minAmountMin as string) : undefined,
    minAmountMax: minAmountMax ? parseFloat(minAmountMax as string) : undefined,
  });

  ok(res, result, '查询成功');
});

export const getRuleDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const rule = await marketingDiscountRuleDao.findById(id);
  if (!rule) {
    badRequest(res, '优惠规则不存在');
    return;
  }

  ok(res, rule, '查询成功');
});

export const validateCreate = asyncHandler(async (req: Request, res: Response) => {
  const { originalAmount, ...params } = req.body;
  const result = await marketingDiscountRuleService.validateCreate(params, parseFloat(originalAmount || 0));
  ok(res, result, '校验完成');
});

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body;
  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  try {
    const rule = await marketingDiscountRuleService.createRule(params, operatorId, operatorName);
    ok(res, rule, '创建成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  try {
    const rule = await marketingDiscountRuleService.updateRule(id, req.body, operatorId, operatorName);
    ok(res, rule, '更新成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const enableRule = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  try {
    const rule = await marketingDiscountRuleService.enableRule(id, operatorId, operatorName);
    ok(res, rule, '启用成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const disableRule = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  try {
    const rule = await marketingDiscountRuleService.disableRule(id, operatorId, operatorName);
    ok(res, rule, '禁用成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const adjustThreshold = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { field, value } = req.body;

  if (isNaN(id)) {
    badRequest(res, '参数格式无效');
    return;
  }
  if (!field || value === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const operatorId = (req as any).user?.id || 1;
  const operatorName = (req as any).user?.username || '管理员';

  try {
    const rule = await marketingDiscountRuleService.adjustThreshold(id, field, parseFloat(value), operatorId, operatorName);
    ok(res, rule, '调整成功');
  } catch (err) {
    badRequest(res, (err as Error).message);
  }
});

export const checkIllegalStacking = asyncHandler(async (req: Request, res: Response) => {
  const { ruleIds } = req.body;
  if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length < 2) {
    badRequest(res, '请至少选择2个优惠规则');
    return;
  }

  const ids = ruleIds.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
  const result = await marketingDiscountRuleService.checkIllegalStacking(ids);
  ok(res, result, '检测完成');
});

export const calculateOptimalCombination = asyncHandler(async (req: Request, res: Response) => {
  const { marketingId, originalAmount } = req.body;
  if (!marketingId || !originalAmount) {
    badRequest(res, '缺少营销活动ID或订单金额');
    return;
  }

  const result = await marketingDiscountRuleService.calculateOptimalCombination(
    parseInt(marketingId as string, 10),
    parseFloat(originalAmount as string)
  );
  ok(res, result || null, '计算完成');
});

export default {
  getRuleList,
  getRuleDetail,
  validateCreate,
  createRule,
  updateRule,
  enableRule,
  disableRule,
  adjustThreshold,
  checkIllegalStacking,
  calculateOptimalCombination,
};
