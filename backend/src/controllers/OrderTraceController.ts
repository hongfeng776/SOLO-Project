import { Request, Response } from 'express';
import { orderService } from '../services/OrderService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getOrderTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const traceData = await orderService.getOrderTrace(parseInt(id, 10));
  ok(res, traceData, '获取订单溯源信息成功');
});

export const validateOrderData = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const report = await orderService.validateOrderData(parseInt(id, 10));
  ok(res, report, report.overall.passed ? '订单数据校验通过' : '订单数据存在异常');
});

export const getOrderStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const statistics = await orderService.getOrderStatistics(parseInt(id, 10));
  ok(res, statistics, '获取订单统计信息成功');
});

export const getUserOrderHistory = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit } = req.query;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const history = await orderService.getUserOrderHistory(
    parseInt(userId, 10),
    limit ? parseInt(limit as string, 10) : undefined
  );

  ok(res, history, '获取用户下单记录成功');
});

export const getPaymentFlows = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const { daos } = await import('../dao');
  const flows = await daos.paymentFlowDao.findAll({
    where: { order_id: parseInt(orderId, 10) },
    order: [['created_at', 'DESC']],
  });

  ok(res, flows, '获取支付流水成功');
});

export const getGoodsSnapshots = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const { daos } = await import('../dao');
  const snapshots = await daos.goodsSnapshotDao.findAll({
    where: { order_id: parseInt(orderId, 10) },
    order: [['id', 'ASC']],
  });

  ok(res, snapshots, '获取商品快照成功');
});

export const getMerchantOrderRecords = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const { daos } = await import('../dao');
  const records = await daos.merchantOrderRecordDao.findAll({
    where: { order_id: parseInt(orderId, 10) },
    order: [['created_at', 'DESC']],
  });

  ok(res, records, '获取商家接单记录成功');
});

export const getOrderLogs = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const { daos } = await import('../dao');
  const logs = await daos.orderLogDao.findAll({
    where: { order_id: parseInt(orderId, 10) },
    order: [['created_at', 'DESC']],
  });

  ok(res, logs, '获取订单操作日志成功');
});

export default {
  getOrderTrace,
  validateOrderData,
  getOrderStatistics,
  getUserOrderHistory,
  getPaymentFlows,
  getGoodsSnapshots,
  getMerchantOrderRecords,
  getOrderLogs,
};
