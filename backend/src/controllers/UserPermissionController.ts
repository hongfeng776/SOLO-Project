import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { userPermissionService } from '../services/UserPermissionService';
import { userPermissionValidateService } from '../services/UserPermissionValidateService';
import { userPermissionBatchService } from '../services/UserPermissionBatchService';
import { userPermissionTraceService } from '../services/UserPermissionTraceService';
import { daos } from '../dao';

const getOperatorPayload = (req: Request) => ({
  operator_id: (req as any).admin?.id || 1,
  operator_name: (req as any).admin?.username || 'system',
  operate_ip: req.ip || req.socket.remoteAddress || '',
});

const isSuperAdmin = (req: Request): boolean => {
  return (req as any).admin?.role === 'super_admin' || (req as any).admin?.id === 1;
};

const getAdminId = (req: Request): number => {
  return (req as any).admin?.id || 0;
};

export const getSystemPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { permission_group, status } = req.query;
  const where: any = {};
  if (permission_group) where.permission_group = permission_group as string;
  if (status !== undefined) where.status = parseInt(status as string, 10);

  const list = await daos.systemPermissionDao.findAll({
    where,
    order: [['permission_group', 'ASC'], ['sort_order', 'ASC']],
  });
  ok(res, list, '获取系统权限列表成功');
});

export const getFilteredPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { user_level, user_status, risk_level, permission_group } = req.query;

  if (user_level === undefined || user_status === undefined || risk_level === undefined) {
    badRequest(res, '缺少用户等级、状态或风险等级参数');
    return;
  }

  const result = await userPermissionValidateService.getFilteredPermissions(
    parseInt(user_level as string, 10),
    parseInt(user_status as string, 10),
    parseInt(risk_level as string, 10),
    permission_group as string | undefined
  );
  ok(res, result, '获取可选权限列表成功');
});

export const validatePermissionGrant = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissionCodes } = req.body;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }
  if (!permissionCodes || !Array.isArray(permissionCodes)) {
    badRequest(res, '权限编码列表无效');
    return;
  }

  const result = await userPermissionValidateService.validatePermissionGrant(
    parseInt(userId, 10),
    permissionCodes
  );
  ok(res, result, '权限校验完成');
});

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }

  const result = await userPermissionService.getUserPermissions(parseInt(userId, 10));
  ok(res, result, '获取用户权限成功');
});

export const grantPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissionCodes, grantType, expireTime } = req.body;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }
  if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    badRequest(res, '请选择要授予的权限');
    return;
  }

  const result = await userPermissionService.grantPermissions(
    parseInt(userId, 10),
    permissionCodes,
    grantType || 2,
    expireTime,
    getOperatorPayload(req)
  );
  ok(res, result, '权限授予成功');
});

export const revokePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissionCodes, reason } = req.body;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }
  if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    badRequest(res, '请选择要回收的权限');
    return;
  }

  const result = await userPermissionService.revokePermissions(
    parseInt(userId, 10),
    permissionCodes,
    reason || '管理员回收',
    getOperatorPayload(req)
  );
  ok(res, result, '权限回收成功');
});

export const resetPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }

  const payload = { ...getOperatorPayload(req), reason: reason || '管理员重置' };
  const result = await userPermissionService.resetToDefaultPermissions(
    parseInt(userId, 10),
    payload
  );
  ok(res, result, '权限重置成功');
});

export const changeUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status, freezeType, cancelType, reason } = req.body;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }
  if (status === undefined || isNaN(parseInt(status as string, 10))) {
    badRequest(res, '状态值无效');
    return;
  }

  const result = await userPermissionService.changeStatusWithPermission(
    parseInt(userId, 10),
    parseInt(status as string, 10),
    freezeType ? parseInt(freezeType as string, 10) : undefined,
    cancelType ? parseInt(cancelType as string, 10) : undefined,
    reason,
    getOperatorPayload(req)
  );
  ok(res, result, '用户状态变更成功');
});

export const batchGrantPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { ids, permissionCodes, scope } = req.body;
  const isSuper = isSuperAdmin(req);
  const adminId = getAdminId(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }
  if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    badRequest(res, '请选择要授予的权限');
    return;
  }
  if (scope === 'global' && !isSuper) {
    badRequest(res, '仅超级管理员可执行全局批量操作');
    return;
  }

  const result = await userPermissionBatchService.batchGrantPermissions(
    ids,
    permissionCodes,
    scope || 'partial',
    isSuper,
    adminId,
    getOperatorPayload(req)
  );
  ok(res, result, `批量授予权限完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchRevokePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { ids, permissionCodes, reason, scope } = req.body;
  const isSuper = isSuperAdmin(req);
  const adminId = getAdminId(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }
  if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    badRequest(res, '请选择要回收的权限');
    return;
  }
  if (scope === 'global' && !isSuper) {
    badRequest(res, '仅超级管理员可执行全局批量操作');
    return;
  }

  const result = await userPermissionBatchService.batchRevokePermissions(
    ids,
    permissionCodes,
    reason || '违规回收',
    scope || 'partial',
    isSuper,
    adminId,
    getOperatorPayload(req)
  );
  ok(res, result, `批量回收权限完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchResetPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { ids, scope } = req.body;
  const isSuper = isSuperAdmin(req);
  const adminId = getAdminId(req);

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }
  if (scope === 'global' && !isSuper) {
    badRequest(res, '仅超级管理员可执行全局批量操作');
    return;
  }

  const result = await userPermissionBatchService.batchResetPermissions(
    ids,
    scope || 'partial',
    isSuper,
    adminId,
    getOperatorPayload(req)
  );
  ok(res, result, `批量重置权限完成，成功${result.successCount}条，失败${result.failCount}条`);
});

export const getPermissionTrace = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }

  const result = await userPermissionTraceService.getPermissionTrace(parseInt(userId, 10));
  ok(res, result, '获取权限溯源成功');
});

export const getPermissionLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, pageSize } = req.query;

  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }

  const result = await userPermissionTraceService.getPermissionLogs(
    parseInt(userId, 10),
    page ? parseInt(page as string, 10) : 1,
    pageSize ? parseInt(pageSize as string, 10) : 20
  );
  ok(res, result, '获取权限变更日志成功');
});

export const checkPermissionCompliance = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId || isNaN(parseInt(userId, 10))) {
    badRequest(res, '用户ID无效');
    return;
  }

  const result = await userPermissionTraceService.checkPermissionCompliance(parseInt(userId, 10));
  ok(res, result, '权限合规性检测完成');
});
