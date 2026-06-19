import { Request, Response } from 'express';
import { merchantBusinessBatchService } from '../services/MerchantBusinessBatchService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const batchExport = asyncHandler(async (req: Request, res: Response) => {
  const result = await merchantBusinessBatchService.batchExport(req.body);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.csvContent);
});

export const batchCalibrate = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, reason, operator_id, operator_name } = req.body;

  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要校准的商家：merchant_ids');
    return;
  }

  if (!reason) {
    badRequest(res, '请填写校准原因：reason');
    return;
  }

  const result = await merchantBusinessBatchService.batchCalibrate(
    merchant_ids.map((id: string | number) => parseInt(id as string, 10)),
    reason,
    operator_id ? parseInt(operator_id, 10) : undefined,
    operator_name
  );

  ok(res, result, '批量校准完成');
});

export const batchMarkQuality = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_ids, quality_level, reason, operator_id, operator_name } = req.body;

  if (!merchant_ids || !Array.isArray(merchant_ids) || merchant_ids.length === 0) {
    badRequest(res, '请选择要标记的商家：merchant_ids');
    return;
  }

  if (quality_level === undefined) {
    badRequest(res, '请选择质量等级：quality_level');
    return;
  }

  if (!reason) {
    badRequest(res, '请填写标记原因：reason');
    return;
  }

  const result = await merchantBusinessBatchService.batchMarkQuality(
    merchant_ids.map((id: string | number) => parseInt(id as string, 10)),
    parseInt(quality_level, 10),
    reason,
    operator_id ? parseInt(operator_id, 10) : undefined,
    operator_name
  );

  ok(res, result, '批量标记完成');
});

export const getBatchScope = asyncHandler(async (req: Request, res: Response) => {
  const { permission_level } = req.query;

  const level = permission_level ? parseInt(permission_level as string, 10) : 1;
  const maxCount = merchantBusinessBatchService.getBatchScope(level);

  ok(res, { permission_level: level, max_count: maxCount }, '获取批量操作范围成功');
});

export default {
  batchExport,
  batchCalibrate,
  batchMarkQuality,
  getBatchScope,
};
