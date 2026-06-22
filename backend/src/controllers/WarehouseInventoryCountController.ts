import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import warehouseInventoryCountService from '../services/WarehouseInventoryCountService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const executeCount = asyncHandler(async (req: Request, res: Response) => {
  const { inventory_ids, actual_quantities, count_type, remark } = req.body;
  if (!inventory_ids || !Array.isArray(inventory_ids) || !actual_quantities || !Array.isArray(actual_quantities)) {
    badRequest(res, '参数不完整');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await warehouseInventoryCountService.executeCount({
    inventory_ids,
    actual_quantities,
    operator_id: adminId,
    operator_name: adminName,
    count_type: count_type || 'partial',
    remark,
  });
  success(res, result, '盘点执行完成');
});

export const executeCorrection = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await warehouseInventoryCountService.executeCorrection({
    ...req.body,
    operator_id: adminId,
    operator_name: adminName,
  });
  success(res, result, '修正操作完成');
});

export const confirmCount = asyncHandler(async (req: Request, res: Response) => {
  const { inventory_id } = req.params;
  if (!inventory_id) {
    badRequest(res, '缺少库存ID');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await warehouseInventoryCountService.confirmCount(
    parseInt(inventory_id as string, 10),
    adminId,
    adminName
  );
  success(res, result, '盘点确认完成');
});

export const syncInventory = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id, quantity } = req.body;
  if (!goods_id || quantity === undefined) {
    badRequest(res, '参数不完整');
    return;
  }
  const result = await warehouseInventoryCountService.syncMultiPartyInventory(goods_id, quantity);
  success(res, result, '多方同步完成');
});

export default { executeCount, executeCorrection, confirmCount, syncInventory };
