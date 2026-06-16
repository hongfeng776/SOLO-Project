import { Request, Response } from 'express';
import { orderService, OrderCreateData, OrderUpdateData } from '../services/OrderService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getOrderList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, order_no, user_id, status, start_time, end_time } = req.query;

  const result = await orderService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    order_no: order_no as string,
    user_id: user_id ? parseInt(user_id as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    start_time: start_time as string,
    end_time: end_time as string,
  });

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

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { order_no, user_id, total_amount, pay_amount, status, pay_status, pay_time, shipping_status } = req.body;

  if (!order_no || user_id === undefined || total_amount === undefined || pay_amount === undefined) {
    badRequest(res, '缺少必要参数：订单号、用户ID、订单总金额、实付金额');
    return;
  }

  const data: OrderCreateData = {
    order_no,
    user_id: parseInt(user_id, 10),
    total_amount: parseFloat(total_amount),
    pay_amount: parseFloat(pay_amount),
    status: status !== undefined ? parseInt(status, 10) : undefined,
    pay_status: pay_status !== undefined ? parseInt(pay_status, 10) : undefined,
    pay_time: pay_time ? new Date(pay_time) : undefined,
    shipping_status: shipping_status !== undefined ? parseInt(shipping_status, 10) : undefined,
  };

  const order = await orderService.create(data);
  ok(res, order, '创建订单成功');
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { order_no, user_id, total_amount, pay_amount, status, pay_status, pay_time, shipping_status } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const data: OrderUpdateData = {};

  if (order_no !== undefined) data.order_no = order_no;
  if (user_id !== undefined) data.user_id = parseInt(user_id, 10);
  if (total_amount !== undefined) data.total_amount = parseFloat(total_amount);
  if (pay_amount !== undefined) data.pay_amount = parseFloat(pay_amount);
  if (status !== undefined) data.status = parseInt(status, 10);
  if (pay_status !== undefined) data.pay_status = parseInt(pay_status, 10);
  if (pay_time !== undefined) data.pay_time = new Date(pay_time);
  if (shipping_status !== undefined) data.shipping_status = parseInt(shipping_status, 10);

  const order = await orderService.update(parseInt(id, 10), data);
  ok(res, order, '更新订单成功');
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

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const order = await orderService.updateStatus(parseInt(id, 10), parseInt(status, 10));
  ok(res, order, '更新订单状态成功');
});

export default {
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrder,
  deleteOrder,
  batchDeleteOrders,
  updateOrderStatus,
};
