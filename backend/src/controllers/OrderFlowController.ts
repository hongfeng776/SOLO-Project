import { Request, Response } from 'express';
import { orderFlowService, OperatorType } from '../services/OrderFlowService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { order_no, user_id, total_amount, pay_amount, items, remark } = req.body;

  if (!order_no || user_id === undefined || total_amount === undefined || pay_amount === undefined) {
    badRequest(res, '缺少必要参数：订单号、用户ID、订单总金额、实付金额');
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    badRequest(res, '订单明细不能为空');
    return;
  }

  for (const item of items) {
    if (!item.goods_id || !item.goods_name || item.price === undefined || !item.quantity) {
      badRequest(res, '订单明细缺少必要参数：商品ID、商品名称、价格、数量');
      return;
    }
  }

  const result = await orderFlowService.createOrder({
    order_no,
    user_id: parseInt(user_id, 10),
    total_amount: parseFloat(total_amount),
    pay_amount: parseFloat(pay_amount),
    items,
    operator_id: req.user?.id,
    operator_type: OperatorType.USER,
    remark,
  });

  ok(res, result, '创建订单成功');
});

export const payOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderFlowService.pay({
    order_id: parseInt(id, 10),
    operator_id: req.user?.id,
    operator_type: OperatorType.USER,
    remark,
  });

  ok(res, order, '订单支付成功');
});

export const shipOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderFlowService.ship({
    order_id: parseInt(id, 10),
    operator_id: req.user?.id,
    operator_type: OperatorType.ADMIN,
    remark,
  });

  ok(res, order, '订单发货成功');
});

export const receiveOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderFlowService.receive({
    order_id: parseInt(id, 10),
    operator_id: req.user?.id,
    operator_type: OperatorType.USER,
    remark,
  });

  ok(res, order, '订单收货成功');
});

export const completeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderFlowService.complete({
    order_id: parseInt(id, 10),
    operator_id: req.user?.id,
    operator_type: OperatorType.ADMIN,
    remark,
  });

  ok(res, order, '订单完成成功');
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderFlowService.cancel({
    order_id: parseInt(id, 10),
    operator_id: req.user?.id,
    operator_type: OperatorType.USER,
    remark,
  });

  ok(res, order, '订单取消成功');
});

export const getOrderLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const logs = await orderFlowService.getOrderLogs(parseInt(id, 10));
  ok(res, logs, '获取订单日志成功');
});

export const getOrderItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const items = await orderFlowService.getOrderItems(parseInt(id, 10));
  ok(res, items, '获取订单明细成功');
});

export default {
  createOrder,
  payOrder,
  shipOrder,
  receiveOrder,
  completeOrder,
  cancelOrder,
  getOrderLogs,
  getOrderItems,
};
