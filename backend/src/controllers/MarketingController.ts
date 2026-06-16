import { Request, Response } from 'express';
import { marketingService } from '../services/MarketingService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getMarketingList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, name, type, status, startTime, endTime } = req.query;

  const result = await marketingService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    name: name as string | undefined,
    type: type !== undefined ? parseInt(type as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startTime: startTime as string | undefined,
    endTime: endTime as string | undefined,
  });

  ok(res, result, '获取营销活动列表成功');
});

export const getMarketingDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const marketing = await marketingService.getDetail(marketingId);
  ok(res, marketing, '获取营销活动详情成功');
});

export const createMarketing = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, status, start_time, end_time, discount } = req.body;

  if (!name) {
    badRequest(res, '缺少活动名称');
    return;
  }

  const marketing = await marketingService.create({
    name,
    type,
    status,
    start_time,
    end_time,
    discount,
  });

  ok(res, marketing, '创建营销活动成功');
});

export const updateMarketing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  const { name, type, status, start_time, end_time, discount } = req.body;

  const marketing = await marketingService.update(marketingId, {
    name,
    type,
    status,
    start_time,
    end_time,
    discount,
  });

  ok(res, marketing, '更新营销活动成功');
});

export const deleteMarketing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  await marketingService.delete(marketingId);
  ok(res, null, '删除营销活动成功');
});

export const batchDeleteMarketings = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的营销活动');
    return;
  }

  const marketingIds = ids.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的营销活动ID');
    }
    return parsed;
  });

  const count = await marketingService.batchDelete(marketingIds);
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export const updateMarketingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    badRequest(res, '缺少营销活动ID');
    return;
  }

  const marketingId = parseInt(id, 10);
  if (isNaN(marketingId)) {
    badRequest(res, '营销活动ID格式无效');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const statusValue = parseInt(status, 10);
  if (isNaN(statusValue)) {
    badRequest(res, '状态值格式无效');
    return;
  }

  const marketing = await marketingService.updateStatus(marketingId, statusValue);
  ok(res, marketing, '更新营销活动状态成功');
});

export default {
  getMarketingList,
  getMarketingDetail,
  createMarketing,
  updateMarketing,
  deleteMarketing,
  batchDeleteMarketings,
  updateMarketingStatus,
};
