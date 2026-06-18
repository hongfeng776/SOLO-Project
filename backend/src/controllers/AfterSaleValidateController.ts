import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  afterSaleValidateService,
  AfterSaleApplyData,
  OrderTerminateData,
} from '../services/AfterSaleValidateService';
import { afterSaleSyncService } from '../services/AfterSaleSyncService';
import { daos } from '../dao';

export const applyAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as AfterSaleApplyData;

  if (!data.orderId || !data.userId || !data.type) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const validateResults = await afterSaleValidateService.verifyAfterSaleApply(data);

  const allValid = validateResults.every((r) => r.valid);
  if (!allValid) {
    const errors = validateResults.filter((r) => !r.valid).map((r) => r.errorMessage);
    badRequest(res, errors.join('; '));
    return;
  }

  const order = await daos.orderDao.findById(data.orderId);
  const result = await afterSaleSyncService.applyAfterSale({
    ...data,
    orderNo: order?.order_no || '',
    merchantId: order?.merchant_id || 0,
    merchantName: '',
  });

  success(res, result, '申请售后成功');
});

export const verifyApply = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as AfterSaleApplyData;

  if (!data.orderId || !data.userId || !data.type) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const results = await afterSaleValidateService.verifyAfterSaleApply(data);

  success(res, results, '售后申请核验完成');
});

export const verifyTerminate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as OrderTerminateData;

  if (!data.orderId || !data.terminateType) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const results = await afterSaleValidateService.verifyOrderTerminate(data);

  success(res, results, '订单终止核验完成');
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, cancelScene, reason, operatorId, operatorName } = req.body;

  if (!orderId || !cancelScene) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await afterSaleSyncService.cancelOrder({
    orderId,
    cancelScene,
    reason,
    operatorId: operatorId || 0,
    operatorName: operatorName || '系统',
  });

  success(res, result, '取消订单成功');
});

export const processAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const { afterSaleId, action, status, handleRemark, operatorId, operatorName } = req.body;

  if (!afterSaleId || !action) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await afterSaleSyncService.processAfterSale({
    afterSaleId,
    action,
    status: status || 0,
    handleRemark,
    operatorId: operatorId || 0,
    operatorName: operatorName || '系统',
  });

  success(res, result, '处理售后成功');
});

export const validateDeadline = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await daos.orderDao.findById(parseInt(orderId, 10));
  const result = afterSaleValidateService.validateAfterSaleDeadline(order);

  success(res, result, result.valid ? '售后时效校验通过' : '售后时效校验不通过');
});

export const validateCredit = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const result = await afterSaleValidateService.validateUserCredit(parseInt(userId, 10));

  success(res, result, result.valid ? '用户信用校验通过' : '用户信用校验不通过');
});

export default {
  applyAfterSale,
  verifyApply,
  verifyTerminate,
  cancelOrder,
  processAfterSale,
  validateDeadline,
  validateCredit,
};
