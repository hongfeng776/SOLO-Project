import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest, notFound } from '../utils/response';
import { logisticsProviderTraceService } from '../services/LogisticsProviderTraceService';

export const getFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  try {
    const result = await logisticsProviderTraceService.getProviderFullTrace(parseInt(id, 10));
    success(res, result, '获取服务商溯源数据成功');
  } catch (error) {
    if (error instanceof Error) {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const getTraceSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderTraceService.getTraceSummary(parseInt(id, 10));
  success(res, result, '获取溯源统计摘要成功');
});

export const getQualificationList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderTraceService.getQualificationList(parseInt(id, 10));
  success(res, result, '获取资质列表成功');
});

export const getContractList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderTraceService.getContractList(parseInt(id, 10));
  success(res, result, '获取签约日志成功');
});

export const getFeeChangeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { page, pageSize } = req.query as any;
  const result = await logisticsProviderTraceService.getFeeChangeLogs(
    parseInt(id, 10),
    page ? parseInt(page, 10) : 1,
    pageSize ? parseInt(pageSize, 10) : 20
  );
  success(res, result, '获取资费修改记录成功');
});

export const getEvaluationList = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { evaluation_type, page, pageSize } = req.query as any;
  const result = await logisticsProviderTraceService.getEvaluationList(
    parseInt(id, 10),
    evaluation_type as string,
    page ? parseInt(page, 10) : 1,
    pageSize ? parseInt(pageSize, 10) : 20
  );
  success(res, result, '获取服务评价台账成功');
});

export const getOperationLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const { change_type, page, pageSize } = req.query as any;
  const result = await logisticsProviderTraceService.getOperationLogs(
    parseInt(id, 10),
    change_type as string,
    page ? parseInt(page, 10) : 1,
    pageSize ? parseInt(pageSize, 10) : 20
  );
  success(res, result, '获取操作日志成功');
});

export default {
  getFullTrace,
  getTraceSummary,
  getQualificationList,
  getContractList,
  getFeeChangeLogs,
  getEvaluationList,
  getOperationLogs,
};
