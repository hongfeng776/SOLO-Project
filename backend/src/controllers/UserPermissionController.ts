import { Request, Response } from 'express';
import { userPermissionService } from '@/services/UserPermissionService';
import { asyncHandler } from '@/middlewares/errorHandler';
import { ok, badRequest } from '@/utils/response';

export const getPermissionConfigs = asyncHandler(async (_req: Request, res: Response) => {
  const configs = await userPermissionService.getAllPermissionConfigs();
  ok(res, configs, '获取权限配置列表成功');
});

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const permissions = await userPermissionService.getUserPermissions(userIdNum);
  ok(res, permissions, '获取用户权限成功');
});

export const getAvailablePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { userLevel, riskLevel, status } = req.query;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const userLevelNum = userLevel !== undefined ? parseInt(userLevel as string, 10) : 1;
  const riskLevelNum = riskLevel !== undefined ? parseInt(riskLevel as string, 10) : 0;
  const statusNum = status !== undefined ? parseInt(status as string, 10) : 1;

  if (isNaN(userLevelNum)) {
    badRequest(res, '用户等级格式无效');
    return;
  }

  if (isNaN(riskLevelNum)) {
    badRequest(res, '风险等级格式无效');
    return;
  }

  if (isNaN(statusNum)) {
    badRequest(res, '状态格式无效');
    return;
  }

  const permissions = await userPermissionService.getAvailablePermissions(
    userIdNum,
    userLevelNum,
    riskLevelNum,
    statusNum
  );
  ok(res, permissions, '获取可配置权限列表成功');
});

export const grantPermission = asyncHandler(async (req: Request, res: Response) => {
  const { userId, permissionId, grantType, grantSource, reason } = req.body;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (!permissionId) {
    badRequest(res, '缺少权限ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const permissionIdNum = parseInt(permissionId, 10);
  if (isNaN(permissionIdNum)) {
    badRequest(res, '权限ID格式无效');
    return;
  }

  const result = await userPermissionService.grantPermission(userIdNum, permissionIdNum, {
    grantType: grantType !== undefined ? parseInt(grantType, 10) : undefined,
    grantSource,
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    reason,
  });

  ok(res, result, '权限授予成功');
});

export const revokePermission = asyncHandler(async (req: Request, res: Response) => {
  const { userId, permissionId, reason } = req.body;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (!permissionId) {
    badRequest(res, '缺少权限ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const permissionIdNum = parseInt(permissionId, 10);
  if (isNaN(permissionIdNum)) {
    badRequest(res, '权限ID格式无效');
    return;
  }

  await userPermissionService.revokePermission(userIdNum, permissionIdNum, {
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    reason,
  });

  ok(res, null, '权限回收成功');
});

export const resetPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { userId, reason } = req.body;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  await userPermissionService.resetUserPermissions(userIdNum, {
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    reason,
  });

  ok(res, null, '权限重置成功');
});

export const batchGrant = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, permissionIds, scope, reason } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    badRequest(res, '请选择用户');
    return;
  }

  if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
    badRequest(res, '请选择权限');
    return;
  }

  const userIdNums = userIds.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的用户ID');
    }
    return parsed;
  });

  const permissionIdNums = permissionIds.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的权限ID');
    }
    return parsed;
  });

  const result = await userPermissionService.batchGrantPermissions(userIdNums, permissionIdNums, {
    scope,
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    operatorRole: (req.user as any)?.role,
    reason,
  });

  ok(res, result, `批量授予完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchRevoke = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, permissionIds, scope, reason } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    badRequest(res, '请选择用户');
    return;
  }

  if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
    badRequest(res, '请选择权限');
    return;
  }

  const userIdNums = userIds.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的用户ID');
    }
    return parsed;
  });

  const permissionIdNums = permissionIds.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的权限ID');
    }
    return parsed;
  });

  const result = await userPermissionService.batchRevokePermissions(userIdNums, permissionIdNums, {
    scope,
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    operatorRole: (req.user as any)?.role,
    reason,
  });

  ok(res, result, `批量回收完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchReset = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, scope, reason } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    badRequest(res, '请选择用户');
    return;
  }

  const userIdNums = userIds.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的用户ID');
    }
    return parsed;
  });

  const result = await userPermissionService.batchResetPermissions(userIdNums, {
    scope,
    operatorId: req.user?.id,
    operatorName: req.user?.username,
    operatorRole: (req.user as any)?.role,
    reason,
  });

  ok(res, result, `批量重置完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const getPermissionLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, pageSize, operationType } = req.query;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const logs = await userPermissionService.getPermissionLogs(userIdNum, {
    page: page !== undefined ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize !== undefined ? parseInt(pageSize as string, 10) : undefined,
    operationType: operationType as string | undefined,
  });

  ok(res, logs, '获取权限变更日志成功');
});

export const updateUserStatusWithPermission = asyncHandler(async (req: Request, res: Response) => {
  const { userId, oldStatus, newStatus, freezeType } = req.body;

  if (!userId) {
    badRequest(res, '缺少用户ID');
    return;
  }

  if (oldStatus === undefined || oldStatus === null) {
    badRequest(res, '缺少原状态');
    return;
  }

  if (newStatus === undefined || newStatus === null) {
    badRequest(res, '缺少新状态');
    return;
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const oldStatusNum = parseInt(oldStatus, 10);
  if (isNaN(oldStatusNum)) {
    badRequest(res, '原状态格式无效');
    return;
  }

  const newStatusNum = parseInt(newStatus, 10);
  if (isNaN(newStatusNum)) {
    badRequest(res, '新状态格式无效');
    return;
  }

  const freezeTypeNum = freezeType !== undefined ? parseInt(freezeType, 10) : undefined;
  if (freezeType !== undefined && isNaN(freezeTypeNum!)) {
    badRequest(res, '冻结类型格式无效');
    return;
  }

  await userPermissionService.handleStatusChange(userIdNum, oldStatusNum, newStatusNum, freezeTypeNum, {
    operatorId: req.user?.id,
    operatorName: req.user?.username,
  });

  ok(res, null, '状态变更及权限联动处理成功');
});

export default {
  getPermissionConfigs,
  getUserPermissions,
  getAvailablePermissions,
  grantPermission,
  revokePermission,
  resetPermissions,
  batchGrant,
  batchRevoke,
  batchReset,
  getPermissionLogs,
  updateUserStatusWithPermission,
};
