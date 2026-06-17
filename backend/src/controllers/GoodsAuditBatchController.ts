import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';
import { goodsAuditBatchService, BatchFilterParams } from '../services/GoodsAuditBatchService';

export const batchFilter = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    pageSize,
    status,
    risk_level,
    merchant_id,
    submit_at_start,
    submit_at_end,
    timeout_flag,
    category_id,
  } = req.query;

  const params: BatchFilterParams = {
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    risk_level: risk_level !== undefined ? parseInt(risk_level as string, 10) : undefined,
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
    submit_at_start: submit_at_start as string,
    submit_at_end: submit_at_end as string,
    timeout_flag: timeout_flag !== undefined ? parseInt(timeout_flag as string, 10) : undefined,
    category_id: category_id ? parseInt(category_id as string, 10) : undefined,
  };

  const result = await goodsAuditBatchService.batchFilter(params);
  ok(res, result, '批量筛选成功');
});

export const batchApprove = asyncHandler(async (req: Request, res: Response) => {
  const { audit_ids, operator_role } = req.body;

  if (!audit_ids || !Array.isArray(audit_ids) || audit_ids.length === 0) {
    badRequest(res, '请选择要审核的记录');
    return;
  }

  const result = await goodsAuditBatchService.batchApprove(
    audit_ids.map((id: string | number) => parseInt(String(id), 10)),
    req.user?.id ?? 0,
    operator_role || 'normal'
  );
  ok(res, result, `批量审核通过完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchReject = asyncHandler(async (req: Request, res: Response) => {
  const { audit_ids, reason, operator_role } = req.body;

  if (!audit_ids || !Array.isArray(audit_ids) || audit_ids.length === 0) {
    badRequest(res, '请选择要审核的记录');
    return;
  }

  if (!reason) {
    badRequest(res, '批量驳回时必须填写原因');
    return;
  }

  const result = await goodsAuditBatchService.batchReject(
    audit_ids.map((id: string | number) => parseInt(String(id), 10)),
    req.user?.id ?? 0,
    reason,
    operator_role || 'normal'
  );
  ok(res, result, `批量审核驳回完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchRequestSupplement = asyncHandler(async (req: Request, res: Response) => {
  const { audit_ids, deadline } = req.body;

  if (!audit_ids || !Array.isArray(audit_ids) || audit_ids.length === 0) {
    badRequest(res, '请选择要操作的记录');
    return;
  }

  if (!deadline) {
    badRequest(res, '请设置补充材料截止时间');
    return;
  }

  const result = await goodsAuditBatchService.batchRequestSupplement(
    audit_ids.map((id: string | number) => parseInt(String(id), 10)),
    deadline
  );
  ok(res, result, `批量要求补充材料完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const getBatchScope = asyncHandler(async (req: Request, res: Response) => {
  const { operator_role } = req.query;

  const result = goodsAuditBatchService.getBatchScope(
    req.user?.id ?? 0,
    (operator_role as string) || 'normal'
  );
  ok(res, result, '获取操作范围成功');
});

export const getAbilityMap = asyncHandler(async (req: Request, res: Response) => {
  const { audit_list, operator_role } = req.body;

  if (!audit_list || !Array.isArray(audit_list)) {
    badRequest(res, '缺少审核列表数据');
    return;
  }

  const result = goodsAuditBatchService.abilityMap(audit_list, operator_role || 'normal');
  ok(res, result, '获取操作权限成功');
});

export default {
  batchFilter,
  batchApprove,
  batchReject,
  batchRequestSupplement,
  getBatchScope,
  getAbilityMap,
};
