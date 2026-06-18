import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  afterSaleBatchService,
  AfterSaleQueryParams,
} from '../services/AfterSaleBatchService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  const _adminRole = (req as any).adminRole || 1;
  return { adminId, adminName, adminRole: _adminRole };
};

export const getAfterSaleList = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as AfterSaleQueryParams;
  const result = await afterSaleBatchService.getAfterSaleList(params);
  success(res, result, '获取售后列表成功');
});

export const getFilteredIds = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body as AfterSaleQueryParams;
  const result = await afterSaleBatchService.getIdsByQuery(params);
  success(res, result, '获取筛选结果成功');
});

export const batchAudit = asyncHandler(async (req: Request, res: Response) => {
  const { ids, action, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const targetIds = ids || (params || rest).ids || [];

  if (!targetIds || targetIds.length === 0) {
    badRequest(res, '缺少售后ID');
    return;
  }

  if (!action) {
    badRequest(res, '缺少审核操作');
    return;
  }

  const result = await afterSaleBatchService.batchAuditApply(
    targetIds,
    action,
    '',
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量审核失败');
    return;
  }

  success(res, result, `批量审核完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchCloseInvalid = asyncHandler(async (req: Request, res: Response) => {
  const { ids, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const targetIds = ids || (params || rest).ids || [];

  if (!targetIds || targetIds.length === 0) {
    badRequest(res, '缺少售后ID');
    return;
  }

  const result = await afterSaleBatchService.batchCloseInvalid(
    targetIds,
    '批量关闭无效工单',
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量关闭无效工单失败');
    return;
  }

  success(res, result, `批量关闭无效工单完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchArchiveTerminated = asyncHandler(async (req: Request, res: Response) => {
  const { ids, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const targetIds = ids || (params || rest).ids || [];

  if (!targetIds || targetIds.length === 0) {
    badRequest(res, '缺少订单ID');
    return;
  }

  const result = await afterSaleBatchService.batchArchiveTerminated(
    targetIds,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量归档终止订单失败');
    return;
  }

  success(res, result, `批量归档终止订单完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export default {
  getAfterSaleList,
  getFilteredIds,
  batchAudit,
  batchCloseInvalid,
  batchArchiveTerminated,
};
