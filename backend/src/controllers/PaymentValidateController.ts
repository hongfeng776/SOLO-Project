import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, success } from '../utils/response';
import {
  paymentValidateService,
  PaymentVerifyData,
  PayStatus,
  PayScenario,
} from '../services/PaymentValidateService';
import { daos } from '../dao';

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as PaymentVerifyData;

  if (!data.orderId || !data.payAmount || !data.payType || !data.userId) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await paymentValidateService.verifyPayment(data);

  if (!result.valid) {
    if (result.riskFlag && result.riskFlag >= 3) {
      await paymentValidateService.triggerRiskAlert(
        0,
        data.userId,
        data.orderId,
        result.riskFlag,
        result.riskReason || result.errorMessage || '支付异常'
      );
    }

    success(res, {
      valid: false,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      riskFlag: result.riskFlag,
    }, result.errorMessage || '支付核验失败', 422);
    return;
  }

  ok(res, { valid: true }, '支付核验通过');
});

export const validateAmount = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, payAmount } = req.body;

  if (!orderId || payAmount === undefined) {
    badRequest(res, '缺少订单ID或支付金额');
    return;
  }

  const result = await paymentValidateService.validatePaymentAmount(
    parseInt(orderId, 10),
    Number(payAmount)
  );

  ok(res, result, result.valid ? '金额校验通过' : '金额校验不通过');
});

export const validateChannel = asyncHandler(async (req: Request, res: Response) => {
  const { payType } = req.body;

  if (payType === undefined) {
    badRequest(res, '缺少支付方式');
    return;
  }

  const result = await paymentValidateService.validatePayChannel(parseInt(payType, 10));

  ok(res, result, result.valid ? '支付渠道合法' : '支付渠道不合法');
});

export const validateTimeliness = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await paymentValidateService.validatePaymentTimeliness(parseInt(orderId, 10));

  ok(res, result, result.valid ? '支付时效有效' : '支付已超时');
});

export const validateUserAccount = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const result = await paymentValidateService.validateUserAccount(parseInt(userId, 10));

  ok(res, result, result.valid ? '用户账户正常' : '用户账户异常');
});

export const syncPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { flowId } = req.params;
  const { payStatus, payScenario } = req.body;

  if (!flowId || payStatus === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const status = parseInt(payStatus, 10);
  const scenario = payScenario ? parseInt(payScenario, 10) : PayScenario.FULL;

  const result = await paymentValidateService.syncPaymentStatus(
    parseInt(flowId, 10),
    status as PayStatus,
    scenario
  );

  if (!result.success) {
    badRequest(res, result.errorMessage || '状态同步失败');
    return;
  }

  ok(res, result, '支付状态同步成功');
});

export const closeExpiredChannels = asyncHandler(async (_req: Request, res: Response) => {
  const count = await paymentValidateService.closeExpiredPaymentChannel();

  ok(res, { count }, `已关闭${count}个超时支付通道`);
});

export const createPaymentFlow = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, orderNo, userId, amount, payType } = req.body;

  if (!orderId || !orderNo || !userId || !amount || !payType) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const flowNo = paymentValidateService.generateFlowNo();
  const expireTime = paymentValidateService.generateExpireTime();

  const order = await daos.orderDao.findById(parseInt(orderId, 10));
  const orderAmount = order ? Number(order.pay_amount || 0) : Number(amount);

  const flow = await daos.paymentFlowDao.create({
    flow_no: flowNo,
    order_id: parseInt(orderId, 10),
    order_no: orderNo,
    user_id: parseInt(userId, 10),
    amount: Number(amount),
    order_amount: orderAmount,
    pay_type: parseInt(payType, 10),
    pay_status: PayStatus.PENDING,
    expire_time: expireTime,
    channel_status: 0,
    risk_flag: 0,
  });

  ok(res, flow, '支付流水创建成功');
});

export const getPaymentFlow = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少流水ID');
    return;
  }

  const flow = await daos.paymentFlowDao.findById(parseInt(id, 10));

  if (!flow) {
    badRequest(res, '支付流水不存在');
    return;
  }

  ok(res, flow, '获取支付流水成功');
});

export default {
  verifyPayment,
  validateAmount,
  validateChannel,
  validateTimeliness,
  validateUserAccount,
  syncPaymentStatus,
  closeExpiredChannels,
  createPaymentFlow,
  getPaymentFlow,
};
