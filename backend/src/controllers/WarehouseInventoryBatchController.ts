import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok, forbidden } from '../utils/response';
import warehouseInventoryBatchService from '../services/WarehouseInventoryBatchService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = extractAdminInfo(req);
  const permissions = await warehouseInventoryBatchService.getUserPermissions(adminId);
  success(res, permissions, '获取权限成功');
});

export const queryInventory = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as any;
  const result = await warehouseInventoryBatchService.queryInventory({
    ...params,
    page: params.page ? parseInt(params.page as string, 10) : 1,
    page_size: params.page_size ? parseInt(params.page_size as string, 10) : 20,
    inventory_type: params.inventory_type !== undefined ? parseInt(params.inventory_type as string, 10) : undefined,
    count_status: params.count_status !== undefined ? parseInt(params.count_status as string, 10) : undefined,
    is_low_stock_alert: params.is_low_stock_alert !== undefined ? parseInt(params.is_low_stock_alert as string, 10) : undefined,
  });
  success(res, result, '查询成功');
});

export const batchCount = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const permissions = await warehouseInventoryBatchService.getUserPermissions(adminId);
  if (!permissions.can_count) {
    forbidden(res, '无批量盘点权限');
    return;
  }
  const { inventory_ids } = req.body;
  if (!inventory_ids || !Array.isArray(inventory_ids) || inventory_ids.length === 0) {
    badRequest(res, '请选择要盘点的记录');
    return;
  }
  const ids = (inventory_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await warehouseInventoryBatchService.batchCount(ids, adminId, adminName);
  success(res, result, '批量盘点完成');
});

export const batchTransfer = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const permissions = await warehouseInventoryBatchService.getUserPermissions(adminId);
  if (!permissions.can_transfer) {
    forbidden(res, '无批量调拨权限');
    return;
  }
  const { inventory_ids, target_location, target_zone, reason } = req.body;
  if (!inventory_ids || !Array.isArray(inventory_ids) || inventory_ids.length === 0) {
    badRequest(res, '请选择要调拨的记录');
    return;
  }
  if (!target_location) {
    badRequest(res, '请指定目标仓储位置');
    return;
  }
  const ids = (inventory_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await warehouseInventoryBatchService.batchTransfer(ids, target_location, target_zone || '', adminId, adminName, reason);
  success(res, result, '批量调拨完成');
});

export const batchLowStockAlert = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const { inventory_ids, threshold } = req.body;
  if (!inventory_ids || !Array.isArray(inventory_ids) || inventory_ids.length === 0) {
    badRequest(res, '请选择要预警的记录');
    return;
  }
  const ids = (inventory_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await warehouseInventoryBatchService.batchLowStockAlert(ids, threshold || 10, adminId, adminName);
  success(res, result, '批量预警设置完成');
});

export const batchImportCount = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const { data_list, tolerance_rate } = req.body;
  if (!data_list || !Array.isArray(data_list) || data_list.length === 0) {
    badRequest(res, '请提供盘点数据');
    return;
  }
  const result = await warehouseInventoryBatchService.batchImportCountData(data_list, adminId, adminName, tolerance_rate || 0.1);
  success(res, result, '批量导入完成');
});

export const getRefreshData = asyncHandler(async (req: Request, res: Response) => {
  const { inventory_ids } = req.body;
  if (!inventory_ids || !Array.isArray(inventory_ids)) {
    badRequest(res, '请选择要刷新的记录');
    return;
  }
  const ids = (inventory_ids as number[]).map(id => parseInt(id as unknown as string, 10));
  const result = await warehouseInventoryBatchService.getRefreshListData(ids);
  success(res, result, '获取刷新数据成功');
});

export default { getUserPermissions, queryInventory, batchCount, batchTransfer, batchLowStockAlert, batchImportCount, getRefreshData };
