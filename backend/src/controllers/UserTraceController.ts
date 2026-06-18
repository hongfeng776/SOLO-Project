import { Request, Response } from 'express';
import { userTraceService } from '../services/UserTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getUserTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const trace = await userTraceService.getUserTrace(userId);
  ok(res, trace, '获取用户溯源信息成功');
});

export const getRegisterLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const log = await userTraceService.getRegisterLog(userId);
  ok(res, log, '获取注册日志成功');
});

export const getProfileLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const limitNum = limit ? parseInt(limit as string, 10) : 50;

  const logs = await userTraceService.getProfileLogs(userId, limitNum);
  ok(res, logs, '获取资料修改记录成功');
});

export const getLoginTraces = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const limitNum = limit ? parseInt(limit as string, 10) : 50;

  const traces = await userTraceService.getLoginTraces(userId, limitNum);
  ok(res, traces, '获取登录轨迹成功');
});

export const getConsumptionLedgers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const limitNum = limit ? parseInt(limit as string, 10) : 50;

  const ledgers = await userTraceService.getConsumptionLedgers(userId, limitNum);
  ok(res, ledgers, '获取消费台账成功');
});

export const checkCompliance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const result = await userTraceService.checkCompliance(userId);
  ok(res, result, '合规性检查完成');
});

export const getDuplicateUsers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const users = await userTraceService.getDuplicateUsers(userId);
  ok(res, users, '获取重复账号成功');
});

export default {
  getUserTrace,
  getRegisterLog,
  getProfileLogs,
  getLoginTraces,
  getConsumptionLedgers,
  checkCompliance,
  getDuplicateUsers,
};
