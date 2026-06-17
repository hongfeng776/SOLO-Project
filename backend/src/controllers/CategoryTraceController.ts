import { Request, Response } from 'express';
import { categoryTraceService } from '../services/CategoryTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getCategoryFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const result = await categoryTraceService.getCategoryFullTrace(parseInt(id, 10));
  ok(res, result, '获取类目溯源信息成功');
});

export const checkConstraints = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, id, parent_id } = req.query;

  if (!code && !name) {
    badRequest(res, '请提供至少一个校验参数：code 或 name');
    return;
  }

  const result = await categoryTraceService.checkConstraints(
    (code as string) || '',
    (name as string) || '',
    id ? parseInt(id as string, 10) : undefined,
    parent_id !== undefined ? parseInt(parent_id as string, 10) : 0
  );
  ok(res, result, result.valid ? '约束校验通过' : '约束校验不通过');
});

export const getTreeWithStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await categoryTraceService.getTreeWithStats();
  ok(res, result, '获取类目树成功');
});

export const getFlatListWithStats = asyncHandler(async (req: Request, res: Response) => {
  const { level, status, parent_id, keyword } = req.query;

  const result = await categoryTraceService.getFlatListWithStats({
    level: level !== undefined ? parseInt(level as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    parent_id: parent_id !== undefined ? parseInt(parent_id as string, 10) : undefined,
    keyword: keyword as string,
  });
  ok(res, result, '获取类目列表成功');
});

export default {
  getCategoryFullTrace,
  checkConstraints,
  getTreeWithStats,
  getFlatListWithStats,
};
