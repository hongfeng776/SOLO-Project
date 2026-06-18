import { Request, Response } from 'express';
import { merchantQualificationBatchService } from '../services/MerchantQualificationBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const batchReview = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reason } = req.body;
  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要复核的商家');
    return;
  }
  const result = await merchantQualificationBatchService.batchReview(
    {
      merchant_ids: merchant_ids.map((id: string | number) => parseInt(String(id), 10)),
      reason,
      auditor_id: req.user?.id,
      auditor_name: (req.user as any)?.username,
    },
    req.user?.id,
    (req.user as any)?.username
  );
  ok(res, result, `批量复核完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchRemind = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reminder_type, message } = req.body;
  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要提醒的商家');
    return;
  }
  if (!reminder_type) {
    badRequest(res, '缺少提醒类型');
    return;
  }
  const result = await merchantQualificationBatchService.batchRemind(
    {
      merchant_ids: merchant_ids.map((id: string | number) => parseInt(String(id), 10)),
      reminder_type,
      message,
    },
    req.user?.id,
    (req.user as any)?.username
  );
  ok(res, result, `批量提醒完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchFreeze = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reason, freeze_permissions } = req.body;
  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要冻结的商家');
    return;
  }
  if (!freeze_permissions || !Array.isArray(freeze_permissions) || freeze_permissions.length === 0) {
    badRequest(res, '请选择要冻结的权限');
    return;
  }
  const result = await merchantQualificationBatchService.batchFreeze(
    {
      merchant_ids: merchant_ids.map((id: string | number) => parseInt(String(id), 10)),
      reason,
      freeze_permissions,
    },
    req.user?.id,
    (req.user as any)?.username
  );
  ok(res, result, `批量冻结完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchApprove = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reason } = req.body;
  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要审核通过的商家');
    return;
  }
  const result = await merchantQualificationBatchService.batchApprove(
    merchant_ids.map((id: string | number) => parseInt(String(id), 10)),
    reason,
    req.user?.id,
    (req.user as any)?.username
  );
  ok(res, result, `批量审核通过完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchReject = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reason, missing_materials, violation_points } = req.body;
  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要驳回的商家');
    return;
  }
  if (!reason) {
    badRequest(res, '驳回原因不能为空');
    return;
  }
  const result = await merchantQualificationBatchService.batchReject(
    merchant_ids.map((id: string | number) => parseInt(String(id), 10)),
    reason,
    missing_materials,
    violation_points,
    req.user?.id,
    (req.user as any)?.username
  );
  ok(res, result, `批量驳回完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const getBatchScope = asyncHandler(async (req: Request, res: Response) => {
  const { permission_level = 2 } = req.query;
  const result = await merchantQualificationBatchService.getBatchScopeByPermission(
    parseInt(permission_level as string, 10),
    {}
  );
  ok(res, result, '获取批量操作范围成功');
});

export default {
  batchReview,
  batchRemind,
  batchFreeze,
  batchApprove,
  batchReject,
  getBatchScope,
};
