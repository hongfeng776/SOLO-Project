import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  logisticsProviderBatchService,
  BatchFeeUpdateData,
} from '../services/LogisticsProviderBatchService';
import { LogisticsProviderQueryParams } from '../services/LogisticsProviderService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

const extractIds = (req: Request): number[] => {
  const body = req.body as any;
  if (body.ids && Array.isArray(body.ids)) {
    return body.ids;
  }
  if (body.params?.ids && Array.isArray(body.params.ids)) {
    return body.params.ids;
  }
  return [];
};

export const getFilteredIds = asyncHandler(async (req: Request, res: Response) => {
  const params = (req.body || req.query) as unknown as LogisticsProviderQueryParams;
  const result = await logisticsProviderBatchService.getIdsByQuery(params);
  success(res, result, '获取筛选结果ID列表成功');
});

export const batchEnable = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  if (!ids || ids.length === 0) {
    badRequest(res, '缺少服务商ID列表');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  const result = await logisticsProviderBatchService.batchEnable(ids, adminId, adminName);
  success(
    res,
    result,
    `批量启用完成，成功${result.successCount}条，失败${result.failCount}条`
  );
});

export const batchDisable = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  const { reason } = req.body as any;
  if (!ids || ids.length === 0) {
    badRequest(res, '缺少服务商ID列表');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  const result = await logisticsProviderBatchService.batchDisable(ids, reason, adminId, adminName);
  success(
    res,
    result,
    `批量禁用完成，成功${result.successCount}条，失败${result.failCount}条`
  );
});

export const batchUpdateFees = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  const body = req.body as any;
  const feeData: BatchFeeUpdateData = {
    first_weight_fee: body.first_weight_fee,
    additional_weight_fee: body.additional_weight_fee,
    base_service_fee: body.base_service_fee,
    reason: body.reason,
  };
  const confirmed = body.confirmed === true;

  if (!ids || ids.length === 0) {
    badRequest(res, '缺少服务商ID列表');
    return;
  }

  const { adminId, adminName } = extractAdminInfo(req);

  const result = await logisticsProviderBatchService.batchUpdateFees(
    ids,
    feeData,
    adminId,
    adminName,
    confirmed
  );
  success(
    res,
    result,
    `批量更新资费完成，成功${result.successCount}条，失败${result.failCount}条`
  );
});

export const batchAdjustPriority = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  const { adjust_type, value } = req.body as any;

  if (!ids || ids.length === 0) {
    badRequest(res, '缺少服务商ID列表');
    return;
  }
  if (!adjust_type || !['increase', 'decrease', 'set'].includes(adjust_type)) {
    badRequest(res, '调整类型参数错误');
    return;
  }
  if (value === undefined || value === null || isNaN(Number(value))) {
    badRequest(res, '调整值参数错误');
    return;
  }

  const { adminId, adminName } = extractAdminInfo(req);

  const result = await logisticsProviderBatchService.batchAdjustPriority(
    ids,
    adjust_type as 'increase' | 'decrease' | 'set',
    Number(value),
    adminId,
    adminName
  );
  success(
    res,
    result,
    `批量调整优先级完成，成功${result.successCount}条，失败${result.failCount}条`
  );
});

export const batchUpdateLevel = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  const { level } = req.body as any;

  if (!ids || ids.length === 0) {
    badRequest(res, '缺少服务商ID列表');
    return;
  }
  if (level === undefined || isNaN(Number(level))) {
    badRequest(res, '等级参数错误');
    return;
  }

  const { adminId, adminName } = extractAdminInfo(req);

  const result = await logisticsProviderBatchService.batchUpdateLevel(
    ids,
    Number(level),
    adminId,
    adminName
  );
  success(
    res,
    result,
    `批量调整等级完成，成功${result.successCount}条，失败${result.failCount}条`
  );
});

export const getRefreshListData = asyncHandler(async (req: Request, res: Response) => {
  const ids = extractIds(req);
  if (!ids || ids.length === 0) {
    success(res, [], '获取刷新数据成功');
    return;
  }
  const result = await logisticsProviderBatchService.getRefreshListData(ids);
  success(res, result, '获取局部刷新数据成功');
});

export default {
  getFilteredIds,
  batchEnable,
  batchDisable,
  batchUpdateFees,
  batchAdjustPriority,
  batchUpdateLevel,
  getRefreshListData,
};
