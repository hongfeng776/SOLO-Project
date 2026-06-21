import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, notFound, ok } from '../utils/response';
import {
  logisticsProviderService,
  LogisticsProviderQueryParams,
  ProviderCreateData,
  ProviderUpdateData,
} from '../services/LogisticsProviderService';

const extractAdminInfo = (req: Request) => {
  const adminId = (req as any).adminId || 1;
  const adminName = (req as any).adminName || '系统管理员';
  return { adminId, adminName };
};

export const getProviderList = asyncHandler(async (req: Request, res: Response) => {
  const params = req.query as unknown as LogisticsProviderQueryParams;
  const result = await logisticsProviderService.getProviderList(params);
  success(res, result, '获取物流服务商列表成功');
});

export const getProviderDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderService.getProviderDetail(parseInt(id, 10));
  if (!result) {
    notFound(res, '物流服务商不存在');
    return;
  }
  success(res, result, '获取服务商详情成功');
});

export const getProviderFullInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderService.getProviderFullInfo(parseInt(id, 10));
  if (!result) {
    notFound(res, '物流服务商不存在');
    return;
  }
  success(res, result, '获取服务商完整信息成功');
});

export const validateBeforeCreate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ProviderCreateData;
  const result = await logisticsProviderService.validateBeforeCreate(data);
  ok(res, result, result.valid ? '准入校验通过' : '准入校验失败');
});

export const createProvider = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ProviderCreateData;
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    const result = await logisticsProviderService.createProvider(data, adminId, adminName);
    success(res, result, '物流服务商准入成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const getEditPermission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderService.getEditPermission(parseInt(id, 10));
  success(res, result, '获取编辑权限成功');
});

export const updateProvider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const data = req.body as ProviderUpdateData & { confirmed?: boolean };
  const { confirmed, ...updateData } = data;
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    const result = await logisticsProviderService.updateProvider(
      parseInt(id, 10),
      updateData,
      adminId,
      adminName,
      confirmed
    );
    success(res, result, '更新服务商信息成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const deleteProvider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    await logisticsProviderService.deleteProvider(parseInt(id, 10), adminId, adminName);
    success(res, null, '删除物流服务商成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const archiveProvider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    const result = await logisticsProviderService.archiveProvider(parseInt(id, 10), adminId, adminName);
    success(res, result, '服务商归档成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { status, reason } = req.body;
  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    const result = await logisticsProviderService.updateStatus(
      parseInt(id, 10),
      parseInt(status, 10),
      reason,
      adminId,
      adminName
    );
    success(res, result, '状态更新成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const updateCooperationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { cooperation_status, reason, effective_date } = req.body;
  if (cooperation_status === undefined) {
    badRequest(res, '缺少合作状态参数');
    return;
  }
  const { adminId, adminName } = extractAdminInfo(req);

  try {
    const result = await logisticsProviderService.updateCooperationStatus(
      parseInt(id, 10),
      parseInt(cooperation_status, 10),
      reason,
      effective_date,
      adminId,
      adminName
    );
    success(res, result, '合作状态更新成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const result = await logisticsProviderService.getStatistics();
  success(res, result, '获取统计数据成功');
});

export const generateProviderCode = asyncHandler(async (_req: Request, res: Response) => {
  const timestamp = Date.now().toString().slice(-6);
  const code = `WL${timestamp}`;
  success(res, { providerCode: code }, '生成服务商编码成功');
});

export default {
  getProviderList,
  getProviderDetail,
  getProviderFullInfo,
  validateBeforeCreate,
  createProvider,
  getEditPermission,
  updateProvider,
  deleteProvider,
  archiveProvider,
  updateStatus,
  updateCooperationStatus,
  getStatistics,
  generateProviderCode,
};
