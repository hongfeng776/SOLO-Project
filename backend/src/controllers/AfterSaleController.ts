import { Request, Response } from 'express';
import { afterSaleService } from '../services/AfterSaleService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getAfterSaleList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, order_id, user_id, type, status, startDate, endDate } = req.query;

  const result = await afterSaleService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    order_id: order_id ? parseInt(order_id as string, 10) : undefined,
    user_id: user_id ? parseInt(user_id as string, 10) : undefined,
    type: type ? parseInt(type as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });

  ok(res, result, '获取售后列表成功');
});

export const getAfterSaleDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await afterSaleService.getDetail(parseInt(id, 10));
    ok(res, result, '获取售后详情成功');
  } catch (error) {
    if (error instanceof Error && error.message === '售后记录不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const createAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const { order_id, user_id, type, reason, amount } = req.body;

  if (!order_id || !user_id || !type) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await afterSaleService.create({
    order_id: parseInt(order_id, 10),
    user_id: parseInt(user_id, 10),
    type: parseInt(type, 10),
    reason,
    amount: amount ? parseFloat(amount) : undefined,
  });

  ok(res, result, '创建售后记录成功');
});

export const updateAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, reason, amount } = req.body;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await afterSaleService.update(parseInt(id, 10), {
      type: type ? parseInt(type, 10) : undefined,
      reason,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
    });
    ok(res, { affectedRows: result }, '更新售后记录成功');
  } catch (error) {
    if (error instanceof Error && error.message === '售后记录不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const deleteAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await afterSaleService.delete(parseInt(id, 10));
    ok(res, { affectedRows: result }, '删除售后记录成功');
  } catch (error) {
    if (error instanceof Error && error.message === '售后记录不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const batchDeleteAfterSale = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的记录');
    return;
  }

  const result = await afterSaleService.batchDelete(ids.map((id: string | number) => parseInt(id as string, 10)));
  ok(res, { affectedRows: result }, '批量删除售后记录成功');
});

export const updateAfterSaleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || status === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }

  try {
    const result = await afterSaleService.updateStatus(
      parseInt(id, 10),
      parseInt(status as string, 10)
    );
    ok(res, { affectedRows: result }, '更新售后状态成功');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '售后记录不存在') {
        notFound(res, error.message);
        return;
      }
      if (error.message === '无效的状态值') {
        badRequest(res, error.message);
        return;
      }
    }
    throw error;
  }
});

export default {
  getAfterSaleList,
  getAfterSaleDetail,
  createAfterSale,
  updateAfterSale,
  deleteAfterSale,
  batchDeleteAfterSale,
  updateAfterSaleStatus,
};
