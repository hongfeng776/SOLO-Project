import { Request, Response } from 'express';
import { userBatchService, BatchUpdateTagsPayload, BatchFreezePayload, BatchResetPermissionsPayload } from '../services/UserBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const batchUpdateTags = asyncHandler(async (req: Request, res: Response) => {
  const { ids, tags, mode, scope } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }

  if (!tags) {
    badRequest(res, '请输入标签内容');
    return;
  }

  if (!mode || !['append', 'replace', 'remove'].includes(mode)) {
    badRequest(res, '请选择正确的操作模式');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const payload: BatchUpdateTagsPayload = {
    ids: ids.map((id: any) => parseInt(id, 10)),
    tags,
    mode,
    scope: scope || 'partial',
    operator_id: req.user?.id,
    operator_name: req.user?.username,
    operate_ip: operatorIp,
  };

  const result = await userBatchService.batchUpdateTags(payload);
  ok(res, result, `批量${mode === 'append' ? '追加' : mode === 'replace' ? '替换' : '移除'}标签成功，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchFreeze = asyncHandler(async (req: Request, res: Response) => {
  const { ids, reason, scope } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要冻结的用户');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const payload: BatchFreezePayload = {
    ids: ids.map((id: any) => parseInt(id, 10)),
    reason: reason || '批量冻结',
    scope: scope || 'partial',
    operator_id: req.user?.id,
    operator_name: req.user?.username,
    operate_ip: operatorIp,
  };

  const result = await userBatchService.batchFreeze(payload);
  ok(res, result, `批量冻结成功，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchUnfreeze = asyncHandler(async (req: Request, res: Response) => {
  const { ids, scope } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要解冻的用户');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const result = await userBatchService.batchUnfreeze(
    ids.map((id: any) => parseInt(id, 10)),
    scope || 'partial',
    {
      operator_id: req.user?.id,
      operator_name: req.user?.username,
      operate_ip: operatorIp,
    }
  );
  ok(res, result, `批量解冻成功，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchResetPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { ids, permissions, scope } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const payload: BatchResetPermissionsPayload = {
    ids: ids.map((id: any) => parseInt(id, 10)),
    permissions: permissions || [],
    scope: scope || 'partial',
    operator_id: req.user?.id,
    operator_name: req.user?.username,
    operate_ip: operatorIp,
  };

  const result = await userBatchService.batchResetPermissions(payload);
  ok(res, result, `批量重置权限成功，成功${result.successCount}条，失败${result.failCount}条`);
});

export const batchUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ids, status, scope } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要操作的用户');
    return;
  }

  if (status === undefined) {
    badRequest(res, '请选择状态');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const result = await userBatchService.batchUpdateStatus(
    ids.map((id: any) => parseInt(id, 10)),
    parseInt(status, 10),
    scope || 'partial',
    {
      operator_id: req.user?.id,
      operator_name: req.user?.username,
      operate_ip: operatorIp,
    }
  );
  ok(res, result, `批量更新状态成功，成功${result.successCount}条，失败${result.failCount}条`);
});

export default {
  batchUpdateTags,
  batchFreeze,
  batchUnfreeze,
  batchResetPermissions,
  batchUpdateStatus,
};
