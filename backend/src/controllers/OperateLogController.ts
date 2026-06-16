import { Request, Response } from 'express';
import { operateLogService, OperateLogQueryParams } from '../services/OperateLogService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getLogList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    pageSize,
    operator_id,
    operator_type,
    module,
    action,
    method,
    status,
    start_time,
    end_time,
    keyword,
    ip,
  } = req.query;

  const params: OperateLogQueryParams = {
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    operator_id: operator_id ? parseInt(operator_id as string, 10) : undefined,
    operator_type: operator_type !== undefined ? parseInt(operator_type as string, 10) : undefined,
    module: module as string,
    action: action as string,
    method: method as string,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    start_time: start_time as string,
    end_time: end_time as string,
    keyword: keyword as string,
    ip: ip as string,
  };

  const result = await operateLogService.getLogList(params);
  ok(res, result, '获取操作日志列表成功');
});

export const getLogStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await operateLogService.getStats(
    startDate as string,
    endDate as string
  );
  ok(res, result, '获取日志统计成功');
});

export const traceUserOperations = asyncHandler(async (req: Request, res: Response) => {
  const { operator_id, operator_type, start_time, end_time, limit } = req.query;

  if (operator_id === undefined) {
    badRequest(res, '缺少操作人ID');
    return;
  }

  if (operator_type === undefined) {
    badRequest(res, '缺少操作人类型');
    return;
  }

  const result = await operateLogService.traceUserOperations(
    parseInt(operator_id as string, 10),
    parseInt(operator_type as string, 10),
    start_time as string,
    end_time as string,
    limit ? parseInt(limit as string, 10) : undefined
  );
  ok(res, result, '用户操作溯源完成');
});

export const traceByIp = asyncHandler(async (req: Request, res: Response) => {
  const { ip, days } = req.query;

  if (!ip) {
    badRequest(res, '缺少IP地址');
    return;
  }

  const result = await operateLogService.searchByIp(
    ip as string,
    days ? parseInt(days as string, 10) : undefined
  );
  ok(res, result, 'IP溯源完成');
});

export const getErrorLogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query;

  const result = await operateLogService.getRecentErrors(
    limit ? parseInt(limit as string, 10) : undefined
  );
  ok(res, result, '获取错误日志成功');
});

export const exportLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    operator_id,
    operator_type,
    module,
    action,
    method,
    status,
    start_time,
    end_time,
    keyword,
    ip,
  } = req.query;

  const params: OperateLogQueryParams = {
    operator_id: operator_id ? parseInt(operator_id as string, 10) : undefined,
    operator_type: operator_type !== undefined ? parseInt(operator_type as string, 10) : undefined,
    module: module as string,
    action: action as string,
    method: method as string,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    start_time: start_time as string,
    end_time: end_time as string,
    keyword: keyword as string,
    ip: ip as string,
  };

  const result = await operateLogService.exportLogs(params);
  ok(res, { total: result.length, list: result }, '导出日志成功');
});

export default {
  getLogList,
  getLogStats,
  traceUserOperations,
  traceByIp,
  getErrorLogs,
  exportLogs,
};
