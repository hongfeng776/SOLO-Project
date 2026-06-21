import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok, forbidden } from '../utils/response';
import logisticsLinkBatchService from '../services/LogisticsLinkBatchService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = extractAdminInfo(req);
  const permissions = await logisticsLinkBatchService.getUserPermissions(adminId);
  success(res, permissions, '获取权限成功');
});

export const queryShipments = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as any;
  const result = await logisticsLinkBatchService.batchQueryShipments({
    ...params,
    page: params.page ? parseInt(params.page as string, 10) : 1,
    page_size: params.page_size ? parseInt(params.page_size as string, 10) : 20,
    track_status: params.track_status !== undefined && params.track_status !== null
      ? parseInt(params.track_status as string, 10)
      : undefined,
    provider_id: params.provider_id ? parseInt(params.provider_id as string, 10) : undefined,
    is_abnormal: params.is_abnormal !== undefined && params.is_abnormal !== null
      ? parseInt(params.is_abnormal as string, 10)
      : undefined,
  });
  success(res, result, '查询成功');
});

export const getRefreshData = asyncHandler(async (req: Request, res: Response) => {
  const { shipment_ids } = req.body;
  if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    badRequest(res, '请选择要刷新的记录');
    return;
  }
  const ids = (shipment_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await logisticsLinkBatchService.getRefreshListData(ids);
  success(res, result, '获取刷新数据成功');
});

export const batchMarkAbnormal = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const permissions = await logisticsLinkBatchService.getUserPermissions(adminId);

  if (!permissions.can_mark_abnormal) {
    forbidden(res, '无批量标记异常权限');
    return;
  }

  const { shipment_ids, abnormal_type, abnormal_desc } = req.body;
  if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    badRequest(res, '请选择要标记的记录');
    return;
  }
  if (!abnormal_type || !abnormal_desc) {
    badRequest(res, '请填写异常类型和描述');
    return;
  }

  const ids = (shipment_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await logisticsLinkBatchService.batchMarkAbnormal(
    ids,
    abnormal_type as string,
    abnormal_desc as string,
    adminId,
    adminName
  );
  success(res, result, '批量标记异常完成');
});

export const batchLaunchVerify = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const permissions = await logisticsLinkBatchService.getUserPermissions(adminId);

  if (!permissions.can_launch_verify) {
    forbidden(res, '无批量发起核查权限');
    return;
  }

  const { shipment_ids, verify_reason } = req.body;
  if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    badRequest(res, '请选择要核查的记录');
    return;
  }
  if (!verify_reason) {
    badRequest(res, '请填写核查原因');
    return;
  }

  const ids = (shipment_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await logisticsLinkBatchService.batchLaunchVerify(
    ids,
    verify_reason as string,
    adminId,
    adminName
  );
  success(res, result, '批量发起核查完成');
});

export const batchSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const permissions = await logisticsLinkBatchService.getUserPermissions(adminId);

  if (!permissions.can_sync_status) {
    forbidden(res, '无批量同步状态权限');
    return;
  }

  const { shipment_ids } = req.body;
  if (!shipment_ids || !Array.isArray(shipment_ids) || shipment_ids.length === 0) {
    badRequest(res, '请选择要同步的记录');
    return;
  }

  const ids = (shipment_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await logisticsLinkBatchService.batchSyncLogisticsStatus(
    ids,
    adminId,
    adminName
  );
  success(res, result, '批量同步状态完成');
});

export default {
  getUserPermissions,
  queryShipments,
  getRefreshData,
  batchMarkAbnormal,
  batchLaunchVerify,
  batchSyncStatus,
};
