import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import {
  logisticsBatchService,
  LogisticsQueryParams,
} from '../services/LogisticsBatchService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  const _adminRole = (req as any).adminRole || 1;
  return { adminId, adminName, adminRole: _adminRole };
};

export const getShipmentList = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as LogisticsQueryParams;
  const result = await logisticsBatchService.getShipmentList(params);
  success(res, result, '获取发货记录列表成功');
});

export const getFilteredIds = asyncHandler(async (req: Request, res: Response) => {
  const params = req.body as LogisticsQueryParams;
  const result = await logisticsBatchService.getIdsByQuery(params);
  success(res, result, '获取筛选结果成功');
});

export const batchShip = asyncHandler(async (req: Request, res: Response) => {
  const { items, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const shipItems = items || (params || rest).ids || [];

  if (!shipItems || shipItems.length === 0) {
    badRequest(res, '缺少发货数据');
    return;
  }

  const result = await logisticsBatchService.batchShip(
    shipItems,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量发货失败');
    return;
  }

  success(res, result, `批量发货完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchUpdateAbnormal = asyncHandler(async (req: Request, res: Response) => {
  const { ids, abnormalFlag, reason, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const targetIds = ids || (params || rest).ids || [];

  if (!targetIds || targetIds.length === 0) {
    badRequest(res, '缺少发货记录ID');
    return;
  }

  if (abnormalFlag === undefined) {
    badRequest(res, '缺少异常状态');
    return;
  }

  const result = await logisticsBatchService.batchUpdateAbnormalStatus(
    targetIds,
    parseInt(abnormalFlag, 10),
    adminId,
    adminName,
    reason
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量更新异常状态失败');
    return;
  }

  success(res, result, `批量更新异常状态完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchResendNotification = asyncHandler(async (req: Request, res: Response) => {
  const { ids, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const targetIds = ids || (params || rest).ids || [];

  if (!targetIds || targetIds.length === 0) {
    badRequest(res, '缺少发货记录ID');
    return;
  }

  const result = await logisticsBatchService.batchResendNotification(
    targetIds,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量补发通知失败');
    return;
  }

  success(res, result, `批量补发通知完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchImport = asyncHandler(async (req: Request, res: Response) => {
  const { data, params, ...rest } = req.body;
  const { adminId, adminName } = extractAdminInfo(req);

  const importData = data || (params || rest).data || [];

  if (!importData || importData.length === 0) {
    badRequest(res, '缺少导入数据');
    return;
  }

  const result = await logisticsBatchService.batchImportShipment(
    importData,
    adminId,
    adminName
  );

  if (!result.success) {
    badRequest(res, result.messages?.[0] || '批量导入失败');
    return;
  }

  success(res, result, `批量导入完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export default {
  getShipmentList,
  getFilteredIds,
  batchShip,
  batchUpdateAbnormal,
  batchResendNotification,
  batchImport,
};
