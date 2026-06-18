import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import {
  paymentTraceService,
} from '../services/PaymentTraceService';
import { daos } from '../dao';

export const getPaymentTrace = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = req.params;

  if (!flowId) {
    badRequest(res, '缺少支付流水ID');
    return;
  }

  const trace = await paymentTraceService.getPaymentTrace(parseInt(flowId, 10));

  if (!trace.paymentFlow) {
    badRequest(res, '支付流水不存在');
    return;
  }

  ok(res, trace, '获取支付溯源数据成功');
});

export const getPaymentTraceByOrderId = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const trace = await paymentTraceService.getPaymentTraceByOrderId(parseInt(orderId, 10));

  if (!trace) {
    badRequest(res, '该订单无支付记录');
    return;
  }

  ok(res, trace, '获取支付溯源数据成功');
});

export const getPaymentTraceByFlowNo = asyncHandler(async (req: Request, res: Response) => {
  const { flowNo } = req.params;

  if (!flowNo) {
    badRequest(res, '缺少流水号');
    return;
  }

  const trace = await paymentTraceService.getPaymentTraceByFlowNo(flowNo);

  if (!trace) {
    badRequest(res, '支付流水不存在');
    return;
  }

  ok(res, trace, '获取支付溯源数据成功');
});

export const getPaymentTraceByTransactionId = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    badRequest(res, '缺少交易号');
    return;
  }

  const traces = await paymentTraceService.getPaymentTraceByTransactionId(transactionId);

  ok(res, traces, `找到${traces.length}条相关支付记录`);
});

export const validatePaymentData = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = req.params;

  if (!flowId) {
    badRequest(res, '缺少支付流水ID');
    return;
  }

  const report = await paymentTraceService.validatePaymentData(parseInt(flowId, 10));

  ok(res, report, report.overallScore >= 80 ? '支付数据校验通过' : '支付数据存在异常');
});

export const getReconcileList = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;

  if (!flowId) {
    badRequest(res, '缺少支付流水ID');
    return;
  }

  const result = await daos.paymentReconcileDao.findAndCountAll({
    where: { flow_id: parseInt(flowId, 10) },
    offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10),
    limit: parseInt(pageSize as string, 10),
    order: [['created_at', 'DESC']],
  });

  ok(res, result, '获取对账记录成功');
});

export const getSettlementList = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;

  if (!flowId) {
    badRequest(res, '缺少支付流水ID');
    return;
  }

  const result = await daos.fundSettlementDao.findAndCountAll({
    where: { flow_id: parseInt(flowId, 10) },
    offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10),
    limit: parseInt(pageSize as string, 10),
    order: [['created_at', 'DESC']],
  });

  ok(res, result, '获取结算记录成功');
});

export const getRiskAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await daos.riskAlertDao.findAndCountAll({
    where: {
      type: 2,
      target_id: parseInt(orderId, 10),
    },
    offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10),
    limit: parseInt(pageSize as string, 10),
    order: [['created_at', 'DESC']],
  });

  ok(res, result, '获取风控预警记录成功');
});

export const getEnumNames = asyncHandler(async (req: Request, res: Response) => {
  const { payStatus, payScenario, reconcileStatus, settleStatus, riskFlag } = req.query;

  const result: any = {};

  if (payStatus !== undefined) {
    result.payStatusName = paymentTraceService.getPayStatusName(parseInt(payStatus as string, 10));
  }
  if (payScenario !== undefined) {
    result.payScenarioName = paymentTraceService.getPayScenarioName(parseInt(payScenario as string, 10));
  }
  if (reconcileStatus !== undefined) {
    result.reconcileStatusName = paymentTraceService.getReconcileStatusName(parseInt(reconcileStatus as string, 10));
  }
  if (settleStatus !== undefined) {
    result.settleStatusName = paymentTraceService.getSettleStatusName(parseInt(settleStatus as string, 10));
  }
  if (riskFlag !== undefined) {
    result.riskFlagName = paymentTraceService.getRiskFlagName(parseInt(riskFlag as string, 10));
  }

  ok(res, result, '获取枚举名称成功');
});

export default {
  getPaymentTrace,
  getPaymentTraceByOrderId,
  getPaymentTraceByFlowNo,
  getPaymentTraceByTransactionId,
  validatePaymentData,
  getReconcileList,
  getSettlementList,
  getRiskAlerts,
  getEnumNames,
};
