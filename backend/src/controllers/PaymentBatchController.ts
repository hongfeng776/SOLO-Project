import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, forbidden } from '../utils/response';
import {
  paymentBatchService,
  PaymentQueryParams,
} from '../services/PaymentBatchService';
import { ReconcileStatus, RiskFlag } from '../services/PaymentValidateService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  const _adminRole = (req as any).adminRole || 1;
  return { adminId, adminName, adminRole: _adminRole };
};

export const getPaymentList = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as PaymentQueryParams;
  const result = await paymentBatchService.getPaymentList(params);
  ok(res, result, '获取支付流水列表成功');
});

export const getFilteredIds = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body as PaymentQueryParams;
  const ids = await paymentBatchService.getIdsByQuery(params);
  ok(res, { ids, count: ids.length }, '获取筛选结果成功');
});

export const batchVerifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const result = await paymentBatchService.batchVerifyPayment(
    params || rest,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量核验失败');
    return;
  }

  ok(res, result, `批量核验完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchResetExpireTime = asyncHandler(async (req: Request, res: Response) => {
  const { params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const result = await paymentBatchService.batchResetExpireTime(
    params || rest,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量重置失败');
    return;
  }

  ok(res, result, `批量重置完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchMarkReconcile = asyncHandler(async (req: Request, res: Response) => {
  const { params, reconcileStatus, remark, ...rest } = req.body;
  const { adminId, adminName, adminRole: _adminRole } = extractAdminInfo(req);

  const hasPermission = await paymentBatchService.checkFinancePermission(adminId);
  if (!hasPermission) {
    forbidden(res, '无财务权限，无法执行对账操作');
    return;
  }

  if (reconcileStatus === undefined) {
    badRequest(res, '缺少对账状态');
    return;
  }

  const result = await paymentBatchService.batchMarkReconcileStatus(
    params || rest,
    parseInt(reconcileStatus, 10) as ReconcileStatus,
    adminId,
    adminName,
    remark
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量对账失败');
    return;
  }

  ok(res, result, `批量对账完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchHandleRisk = asyncHandler(async (req: Request, res: Response) => {
  const { params, riskFlag, reason, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  if (riskFlag === undefined) {
    badRequest(res, '缺少风控标记');
    return;
  }

  const result = await paymentBatchService.batchHandleRisk(
    params || rest,
    parseInt(riskFlag, 10) as RiskFlag,
    adminId,
    adminName,
    reason
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量风控处理失败');
    return;
  }

  ok(res, result, `批量风控处理完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const checkFinancePermission = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = extractAdminInfo(req);
  const hasPermission = await paymentBatchService.checkFinancePermission(adminId);
  ok(res, { hasPermission }, hasPermission ? '拥有财务权限' : '无财务权限');
});

export default {
  getPaymentList,
  getFilteredIds,
  batchVerifyPayment,
  batchResetExpireTime,
  batchMarkReconcile,
  batchHandleRisk,
  checkFinancePermission,
};
