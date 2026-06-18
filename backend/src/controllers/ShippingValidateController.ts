import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  shippingValidateService,
  ShippingVerifyData,
} from '../services/ShippingValidateService';
import { shippingSyncService, ShipOrderData, UpdateLogisticsStatusData } from '../services/ShippingSyncService';
import { daos } from '../dao';

export const verifyShipping = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ShippingVerifyData;

  if (!data.orderId || !data.logisticsProviderId || !data.logisticsNo) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await shippingValidateService.verifyShipping(data);

  success(res, { results: result }, '发货核验完成');
});

export const validatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const order = await daos.orderDao.findById(parseInt(orderId, 10));
  const result = await shippingValidateService.validatePaymentStatus(order);

  success(res, result, result.valid ? '支付状态校验通过' : '支付状态校验不通过');
});

export const validateStock = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await shippingValidateService.validateStock(parseInt(orderId, 10));

  success(res, result, result.valid ? '库存校验通过' : '库存校验不通过');
});

export const validateProvider = asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;

  if (!providerId) {
    badRequest(res, '缺少物流服务商ID');
    return;
  }

  const result = await shippingValidateService.validateLogisticsProvider(parseInt(providerId, 10));

  success(res, result, result.valid ? '物流服务商校验通过' : '物流服务商校验不通过');
});

export const validateAddress = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  const result = shippingValidateService.validateAddress(data);

  success(res, result, result.valid ? '收货地址校验通过' : '收货地址校验不通过');
});

export const validateLogisticsNo = asyncHandler(async (req: Request, res: Response) => {
  const { logisticsNo, providerId } = req.body;

  if (!logisticsNo) {
    badRequest(res, '缺少物流单号');
    return;
  }

  const result = shippingValidateService.validateLogisticsNoFormat(
    logisticsNo,
    providerId ? parseInt(providerId, 10) : undefined
  );

  success(res, result, result.valid ? '物流单号格式校验通过' : '物流单号格式校验不通过');
});

export const checkDuplicateNo = asyncHandler(async (req: Request, res: Response) => {
  const { logisticsNo, orderId } = req.body;

  if (!logisticsNo) {
    badRequest(res, '缺少物流单号');
    return;
  }

  const result = await shippingValidateService.checkDuplicateLogisticsNo(
    logisticsNo,
    orderId ? parseInt(orderId, 10) : undefined
  );

  success(res, result, result.valid ? '物流单号无重复' : '物流单号已存在');
});

export const shipOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ShipOrderData;

  if (!data.orderId || !data.logisticsProviderId || !data.logisticsNo) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await shippingSyncService.shipOrder(data);

  if (!result.success) {
    badRequest(res, result.errorMessage || '发货失败');
    return;
  }

  success(res, result, '发货成功');
});

export const updateLogisticsStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateLogisticsStatusData;

  if (!data.orderId || data.logisticsStatus === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await shippingSyncService.updateLogisticsStatus(data);

  if (!result.success) {
    badRequest(res, result.errorMessage || '物流状态更新失败');
    return;
  }

  success(res, result, '物流状态更新成功');
});

export const getProviderList = asyncHandler(async (_req: Request, res: Response) => {
  const providers = await daos.logisticsProviderDao.findAll();

  success(res, providers, '获取物流服务商列表成功');
});

export default {
  verifyShipping,
  validatePayment,
  validateStock,
  validateProvider,
  validateAddress,
  validateLogisticsNo,
  checkDuplicateNo,
  shipOrder,
  updateLogisticsStatus,
  getProviderList,
};
