import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, internalError } from '../utils/response';
import { settleBatchService, BatchApplyParams, BatchAuditParams, SettleListParams } from '../services/SettleBatchService';

export const checkPermission = asyncHandler(async (req: Request, res: Response) => {
  const { userId, permissionCode } = req.body;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const result = await settleBatchService.checkFinancePermission(
    parseInt(userId, 10),
    permissionCode
  );

  success(res, result, result.hasPermission ? '权限校验通过' : '无财务结算权限');
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const { merchantIds, periodType, startDate, endDate, operatorId, operatorName } = req.body as BatchApplyParams;

  if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
    badRequest(res, '缺少商家ID列表');
    return;
  }
  if (periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：periodType, startDate, endDate');
    return;
  }

  const result = await settleBatchService.batchApplySettle({
    merchantIds,
    periodType,
    startDate,
    endDate,
    operatorId,
    operatorName,
  });

  success(res, result, result.success ? '批量申请结算成功' : '批量申请存在失败');
});

export const batchApply = asyncHandler(async (req: Request, res: Response) => {
  const { merchantIds, periodType, startDate, endDate, operatorId, operatorName } = req.body as BatchApplyParams;

  if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
    badRequest(res, '缺少商家ID列表');
    return;
  }
  if (periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：periodType, startDate, endDate');
    return;
  }

  const result = await settleBatchService.batchApplySettle({
    merchantIds,
    periodType,
    startDate,
    endDate,
    operatorId,
    operatorName,
  });

  success(res, result, result.success ? '批量申请结算成功' : '批量申请存在失败');
});

export const batchAudit = asyncHandler(async (req: Request, res: Response) => {
  const { applyIds, auditPass, rejectReason, operatorId, operatorName } = req.body as BatchAuditParams;

  if (!applyIds || !Array.isArray(applyIds) || applyIds.length === 0) {
    badRequest(res, '缺少申请单ID列表');
    return;
  }
  if (auditPass === undefined) {
    badRequest(res, '缺少审核结果参数 auditPass');
    return;
  }

  const result = await settleBatchService.batchAuditSettle({
    applyIds,
    auditPass,
    rejectReason,
    operatorId,
    operatorName,
  });

  success(res, result, result.success ? '批量审核成功' : '批量审核存在失败');
});

export const batchExport = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body;

  try {
    const result = await settleBatchService.batchExportLedger(params);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.csv);
  } catch (error) {
    internalError(res, error instanceof Error ? error.message : '导出失败');
  }
});

export const getList = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as SettleListParams;

  const result = await settleBatchService.getSettleList(params);

  success(res, result, '查询结算列表成功');
});

export default {
  checkPermission,
  apply,
  batchApply,
  batchAudit,
  batchExport,
  getList,
};
