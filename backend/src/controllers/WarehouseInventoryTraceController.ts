import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import warehouseInventoryTraceService from '../services/WarehouseInventoryTraceService';

export const getFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { inventory_id } = req.params;
  if (!inventory_id) {
    badRequest(res, '缺少库存ID');
    return;
  }
  const result = await warehouseInventoryTraceService.getFullInventoryTrace(parseInt(inventory_id as string, 10));
  success(res, result, '获取库存溯源成功');
});

export const checkOverQuantity = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id, batch_no, warehouse_location, quantity } = req.body;
  if (!goods_id || !batch_no || !warehouse_location || !quantity) {
    badRequest(res, '参数不完整');
    return;
  }
  const result = await warehouseInventoryTraceService.checkOverQuantityOutbound(goods_id, batch_no, warehouse_location, quantity);
  success(res, result, result.is_over ? '超量出库拦截' : '出库数量正常');
});

export const checkDuplicateBatch = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id, batch_no, warehouse_location, exclude_id } = req.body;
  if (!goods_id || !batch_no || !warehouse_location) {
    badRequest(res, '参数不完整');
    return;
  }
  const result = await warehouseInventoryTraceService.checkDuplicateBatch(goods_id, batch_no, warehouse_location, exclude_id);
  success(res, result, result.is_duplicate ? '检测到重复批次' : '无重复批次');
});

export const checkFakeInventory = asyncHandler(async (req: Request, res: Response) => {
  const { inventory_id } = req.body;
  if (!inventory_id) {
    badRequest(res, '缺少库存ID');
    return;
  }
  const result = await warehouseInventoryTraceService.checkFakeInventory(parseInt(inventory_id as string, 10));
  success(res, result, result.is_fake ? '检测到虚假库存' : '库存数据正常');
});

export default { getFullTrace, checkOverQuantity, checkDuplicateBatch, checkFakeInventory };
