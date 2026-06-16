import { Request, Response } from 'express';
import {
  riskControlService,
  RiskControlCreatePayload,
  RiskControlUpdatePayload,
  OrderRiskCheckData,
} from '../services/RiskControlService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, condition_json, action, threshold, status } = req.body;

  if (!name) {
    badRequest(res, '缺少规则名称');
    return;
  }

  if (type === undefined) {
    badRequest(res, '缺少规则类型');
    return;
  }

  if (!condition_json) {
    badRequest(res, '缺少规则条件');
    return;
  }

  if (!action) {
    badRequest(res, '缺少触发动作');
    return;
  }

  const payload: RiskControlCreatePayload = {
    name,
    type: parseInt(type, 10),
    condition_json: typeof condition_json === 'string' ? JSON.parse(condition_json) : condition_json,
    action,
    threshold: threshold !== undefined ? parseFloat(threshold) : undefined,
    status: status !== undefined ? parseInt(status, 10) : undefined,
  };

  const result = await riskControlService.createRule(payload);
  ok(res, result, '创建风控规则成功');
});

export const getRuleList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, name, type, status } = req.query;

  const result = await riskControlService.getRuleList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    name: name as string,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
  });

  ok(res, result, '获取风控规则列表成功');
});

export const getRuleDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少规则ID');
    return;
  }

  const result = await riskControlService.getRuleDetail(parseInt(id, 10));
  ok(res, result, '获取风控规则详情成功');
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, condition_json, action, threshold, status } = req.body;

  if (!id) {
    badRequest(res, '缺少规则ID');
    return;
  }

  const payload: RiskControlUpdatePayload = {};
  if (name !== undefined) payload.name = name;
  if (type !== undefined) payload.type = parseInt(type, 10);
  if (condition_json !== undefined)
    payload.condition_json = typeof condition_json === 'string' ? JSON.parse(condition_json) : condition_json;
  if (action !== undefined) payload.action = action;
  if (threshold !== undefined) payload.threshold = parseFloat(threshold);
  if (status !== undefined) payload.status = parseInt(status, 10);

  const result = await riskControlService.updateRule(parseInt(id, 10), payload);
  ok(res, result, '更新风控规则成功');
});

export const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少规则ID');
    return;
  }

  await riskControlService.deleteRule(parseInt(id, 10));
  ok(res, null, '删除风控规则成功');
});

export const getAlertList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, type, level, status, rule_id, target_id, start_time, end_time } = req.query;

  const result = await riskControlService.getAlertList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    level: level !== undefined ? parseInt(level as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    rule_id: rule_id ? parseInt(rule_id as string, 10) : undefined,
    target_id: target_id ? parseInt(target_id as string, 10) : undefined,
    start_time: start_time as string,
    end_time: end_time as string,
  });

  ok(res, result, '获取预警列表成功');
});

export const handleAlert = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少预警ID');
    return;
  }

  const result = await riskControlService.handleAlert(parseInt(id, 10), req.user?.id ?? 0);
  ok(res, result, '处理预警成功');
});

export const checkOrder = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, total_amount, goods_count, order_no, user_register_days, user_today_order_count } = req.body;

  if (user_id === undefined) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (total_amount === undefined) {
    badRequest(res, '缺少订单总金额');
    return;
  }

  if (goods_count === undefined) {
    badRequest(res, '缺少商品数量');
    return;
  }

  if (!order_no) {
    badRequest(res, '缺少订单号');
    return;
  }

  const data: OrderRiskCheckData = {
    user_id: parseInt(user_id, 10),
    total_amount: parseFloat(total_amount),
    goods_count: parseInt(goods_count, 10),
    order_no,
    user_register_days: user_register_days !== undefined ? parseInt(user_register_days, 10) : undefined,
    user_today_order_count: user_today_order_count !== undefined ? parseInt(user_today_order_count, 10) : undefined,
  };

  const result = await riskControlService.checkOrderRisk(data);
  ok(res, result, '订单风控检测完成');
});

export default {
  createRule,
  getRuleList,
  getRuleDetail,
  updateRule,
  deleteRule,
  getAlertList,
  handleAlert,
  checkOrder,
};
