import { Request, Response } from 'express';
import { orderService } from '../services/OrderService';
import { orderValidateService, CreateOrderData } from '../services/OrderValidateService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, success } from '../utils/response';

export const createOrderWithValidation = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateOrderData;

  const result = await orderService.createOrder(data);

  if (!result.success && result.validationErrors) {
    success(res, result, '订单校验失败，已自动终止', 422);
    return;
  }

  ok(res, result, result.success ? '订单创建成功' : '订单创建失败');
});

export const validateOrderBeforeCreate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateOrderData;

  const validationResults = await orderValidateService.validateAll(data);

  ok(res, {
    valid: validationResults.length === 0,
    errors: validationResults,
  }, validationResults.length === 0 ? '校验通过' : '校验不通过');
});

export const validatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const result = await orderValidateService.validatePaymentStatus(parseInt(userId, 10));
  ok(res, result, result.valid ? '用户支付状态正常' : '用户支付状态异常');
});

export const validateStock = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    badRequest(res, '缺少商品列表');
    return;
  }

  const result = await orderValidateService.validateStock(items);
  ok(res, result, result.valid ? '库存充足' : '库存不足');
});

export const validateMerchantPermission = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  if (!merchantId) {
    badRequest(res, '缺少商家ID');
    return;
  }

  const result = await orderValidateService.validateMerchantPermission(parseInt(merchantId, 10));
  ok(res, result, result.valid ? '商家接单权限正常' : '商家无接单权限');
});

export const validateLogisticsArea = asyncHandler(async (req: Request, res: Response) => {
  const { province } = req.body;

  if (!province) {
    badRequest(res, '缺少省份信息');
    return;
  }

  const result = orderValidateService.validateLogisticsArea(province);
  ok(res, result, result.valid ? '该地区支持物流配送' : '该地区暂不支持物流配送');
});

export const validateDuplicateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderNo } = req.params;

  if (!orderNo) {
    badRequest(res, '缺少订单号');
    return;
  }

  const result = await orderValidateService.validateDuplicateOrder(orderNo);
  ok(res, result, result.valid ? '订单号可用' : '订单号已存在');
});

export const validateAmount = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateOrderData;

  const result = orderValidateService.validateAmount(data);
  ok(res, result, result.valid ? '金额校验通过' : '金额校验不通过');
});

export const getExceptionList = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, status, type, startTime, endTime } = req.query;

  const { Op } = await import('sequelize');
  const { daos } = await import('../dao');

  const where: any = {};

  if (status !== undefined) {
    where.status = parseInt(status as string, 10);
  }
  if (type !== undefined) {
    where.type = parseInt(type as string, 10);
  }
  if (startTime || endTime) {
    where.created_at = {};
    if (startTime) {
      where.created_at[Op.gte] = new Date(startTime as string);
    }
    if (endTime) {
      where.created_at[Op.lte] = new Date(endTime as string);
    }
  }

  const result = await daos.orderExceptionDao.findPage({
    page: parseInt(page as string, 10),
    pageSize: parseInt(pageSize as string, 10),
    where,
    order: [['created_at', 'DESC']],
  });

  ok(res, result, '获取异常工单列表成功');
});

export const handleException = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, handleRemark, handlerId } = req.body;

  if (!id) {
    badRequest(res, '缺少异常工单ID');
    return;
  }

  const { daos } = await import('../dao');

  await daos.orderExceptionDao.update(parseInt(id, 10), {
    status: parseInt(status, 10),
    handler_id: handlerId,
    handle_time: new Date(),
    handle_remark: handleRemark,
  });

  const exception = await daos.orderExceptionDao.findById(parseInt(id, 10));

  ok(res, exception, '异常工单处理成功');
});

export default {
  createOrderWithValidation,
  validateOrderBeforeCreate,
  validatePaymentStatus,
  validateStock,
  validateMerchantPermission,
  validateLogisticsArea,
  validateDuplicateOrder,
  validateAmount,
  getExceptionList,
  handleException,
};
