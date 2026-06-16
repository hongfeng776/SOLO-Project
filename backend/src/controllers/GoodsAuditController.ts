import { Request, Response } from 'express';
import { goodsAuditService } from '../services/GoodsAuditService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const submitAudit = asyncHandler(async (req: Request, res: Response) => {
  const { goods_id } = req.body;

  if (goods_id === undefined) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const audit = await goodsAuditService.submitForAudit(
    parseInt(goods_id, 10),
    req.user?.id
  );
  ok(res, audit, '提交审核成功');
});

export const approveAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  const audit = await goodsAuditService.approve({
    goods_id: parseInt(id, 10),
    auditor_id: req.user?.id ?? 0,
    status: 1,
    reason,
  });
  ok(res, audit, '审核通过成功');
});

export const rejectAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!id) {
    badRequest(res, '缺少审核ID');
    return;
  }

  if (!reason) {
    badRequest(res, '审核拒绝时必须填写拒绝原因');
    return;
  }

  const audit = await goodsAuditService.reject({
    goods_id: parseInt(id, 10),
    auditor_id: req.user?.id ?? 0,
    status: 2,
    reason,
  });
  ok(res, audit, '审核拒绝成功');
});

export const batchApprove = asyncHandler(async (req: Request, res: Response) => {
  const { goods_ids, reason } = req.body;

  if (!goods_ids || !Array.isArray(goods_ids) || goods_ids.length === 0) {
    badRequest(res, '请选择要审核的商品');
    return;
  }

  const result = await goodsAuditService.batchApprove(
    goods_ids.map((id: string | number) => parseInt(String(id), 10)),
    req.user?.id ?? 0,
    reason
  );
  ok(res, result, `批量审核通过完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const batchReject = asyncHandler(async (req: Request, res: Response) => {
  const { goods_ids, reason } = req.body;

  if (!goods_ids || !Array.isArray(goods_ids) || goods_ids.length === 0) {
    badRequest(res, '请选择要审核的商品');
    return;
  }

  if (!reason) {
    badRequest(res, '审核拒绝时必须填写拒绝原因');
    return;
  }

  const result = await goodsAuditService.batchReject(
    goods_ids.map((id: string | number) => parseInt(String(id), 10)),
    req.user?.id ?? 0,
    reason
  );
  ok(res, result, `批量审核拒绝完成，成功 ${result.success} 条，失败 ${result.failed} 条`);
});

export const getAuditList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, goods_id, auditor_id, status, start_time, end_time } = req.query;

  const result = await goodsAuditService.getAuditList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    goods_id: goods_id ? parseInt(goods_id as string, 10) : undefined,
    auditor_id: auditor_id ? parseInt(auditor_id as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    start_time: start_time as string,
    end_time: end_time as string,
  });

  ok(res, result, '获取审核列表成功');
});

export default {
  submitAudit,
  approveAudit,
  rejectAudit,
  batchApprove,
  batchReject,
  getAuditList,
};
