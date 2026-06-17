import { Request, Response } from 'express';
import { orderService, OrderQueryParams, OrderUpdateData } from '../services/OrderService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, success } from '../utils/response';

const getOperatorInfo = (req: Request) => {
  const user = (req as any).user || { id: 1, username: 'admin' };
  return {
    operatorId: user.id || 1,
    operatorName: user.username || 'admin',
  };
};

export const getOrderList = asyncHandler(async (req: Request, res: Response) => {
  const params: OrderQueryParams = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
    order_no: req.query.order_no as string,
    user_id: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
    status: req.query.status !== undefined ? parseInt(req.query.status as string, 10) : undefined,
    start_time: req.query.start_time as string,
    end_time: req.query.end_time as string,
    pay_type: req.query.pay_type !== undefined ? parseInt(req.query.pay_type as string, 10) : undefined,
    min_amount: req.query.min_amount !== undefined ? parseFloat(req.query.min_amount as string) : undefined,
    max_amount: req.query.max_amount !== undefined ? parseFloat(req.query.max_amount as string) : undefined,
    is_exception: req.query.is_exception !== undefined ? parseInt(req.query.is_exception as string, 10) : undefined,
    is_archived: req.query.is_archived !== undefined ? parseInt(req.query.is_archived as string, 10) : undefined,
    merchant_id: req.query.merchant_id !== undefined ? parseInt(req.query.merchant_id as string, 10) : undefined,
  };

  const result = await orderService.getList(params);
  ok(res, result, '获取订单列表成功');
});

export const getOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await orderService.getById(parseInt(id, 10));
  ok(res, order, '获取订单详情成功');
});

export const getOrderDetailWithItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await orderService.getDetailWithItems(parseInt(id, 10));
  ok(res, result, '获取订单详情成功');
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(req.body);

  if (!result.success && result.validationErrors) {
    success(res, result, '订单校验失败，已自动终止', 422);
    return;
  }

  ok(res, result, result.success ? '订单创建成功' : '订单创建失败');
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const data: OrderUpdateData = {
    remark: req.body.remark,
    receiver_name: req.body.receiver_name,
    receiver_phone: req.body.receiver_phone,
    receiver_province: req.body.receiver_province,
    receiver_city: req.body.receiver_city,
    receiver_district: req.body.receiver_district,
    receiver_address: req.body.receiver_address,
    logistics_company: req.body.logistics_company,
    logistics_no: req.body.logistics_no,
  };

  const result = await orderService.editOrder(parseInt(id, 10), data, operatorId, operatorName);

  if (!result.success) {
    success(res, result, result.error || '编辑失败', 400);
    return;
  }

  ok(res, result, '更新订单成功');
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const result = await orderService.updateOrderStatus(
    parseInt(id, 10),
    parseInt(status, 10),
    operatorId,
    operatorName
  );

  if (!result.success) {
    success(res, result, result.error || '状态变更失败', 400);
    return;
  }

  ok(res, result, '更新订单状态成功');
});

export const shipOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { logisticsCompany, logisticsNo } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  if (!logisticsCompany || !logisticsNo) {
    badRequest(res, '缺少物流公司或物流单号');
    return;
  }

  const result = await orderService.shipOrder(
    parseInt(id, 10),
    logisticsCompany,
    logisticsNo,
    operatorId,
    operatorName
  );

  if (!result.success) {
    success(res, result, result.error || '发货失败', 400);
    return;
  }

  ok(res, result, '发货成功');
});

export const completeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await orderService.completeOrder(parseInt(id, 10), operatorId, operatorName);

  if (!result.success) {
    success(res, result, result.error || '完成订单失败', 400);
    return;
  }

  ok(res, result, '订单已完成');
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { operatorId, operatorName } = getOperatorInfo(req);

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await orderService.cancelOrder(
    parseInt(id, 10),
    operatorId,
    operatorName,
    reason
  );

  if (!result.success) {
    success(res, result, result.error || '取消订单失败', 400);
    return;
  }

  ok(res, result, '订单已取消');
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  await orderService.delete(parseInt(id, 10));
  ok(res, null, '删除订单成功');
});

export const batchDeleteOrders = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的订单');
    return;
  }

  const count = await orderService.batchDelete(ids.map((id: string | number) => parseInt(String(id), 10)));
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export default {
  getOrderList,
  getOrderDetail,
  getOrderDetailWithItems,
  createOrder,
  updateOrder,
  updateOrderStatus,
  shipOrder,
  completeOrder,
  cancelOrder,
  deleteOrder,
  batchDeleteOrders,
};
