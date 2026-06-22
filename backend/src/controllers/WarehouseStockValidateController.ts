import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, ok } from '../utils/response';
import warehouseStockValidateService from '../services/WarehouseStockValidateService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const validateInbound = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseStockValidateService.validateInbound(req.body);
  success(res, result, result.valid ? '入库校验通过' : '入库校验失败');
});

export const createInbound = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await warehouseStockValidateService.createInbound({
    ...req.body,
    operator_id: adminId,
    operator_name: adminName,
  });
  if (result.success) {
    success(res, result, '入库操作成功');
  } else {
    badRequest(res, result.message || '入库校验失败');
  }
});

export const validateOutbound = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseStockValidateService.validateOutbound(req.body);
  success(res, result, result.valid ? '出库校验通过' : '出库校验失败');
});

export const createOutbound = asyncHandler(async (req: Request, res: Response) => {
  const { adminId, adminName } = extractAdminInfo(req);
  const result = await warehouseStockValidateService.createOutbound({
    ...req.body,
    operator_id: adminId,
    operator_name: adminName,
  });
  if (result.success) {
    success(res, result, '出库操作成功');
  } else {
    badRequest(res, result.message || '出库校验失败');
  }
});

export default { validateInbound, createInbound, validateOutbound, createOutbound };
