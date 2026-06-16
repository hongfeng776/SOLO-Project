import { Request, Response } from 'express';
import { merchantService } from '../services/MerchantService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getMerchantList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, name, phone, status, startDate, endDate } = req.query;

  const result = await merchantService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    name: name as string | undefined,
    phone: phone as string | undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });

  ok(res, result, '获取商家列表成功');
});

export const getMerchantDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantService.getDetail(parseInt(id, 10));
    ok(res, result, '获取商家详情成功');
  } catch (error) {
    if (error instanceof Error && error.message === '商家不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const createMerchant = asyncHandler(async (req: Request, res: Response) => {
  const { name, contact, phone, address, status } = req.body;

  if (!name) {
    badRequest(res, '缺少商家名称');
    return;
  }

  const result = await merchantService.create({
    name,
    contact,
    phone,
    address,
    status: status !== undefined ? parseInt(status, 10) : undefined,
  });

  ok(res, result, '创建商家成功');
});

export const updateMerchant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, contact, phone, address, status } = req.body;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantService.update(parseInt(id, 10), {
      name,
      contact,
      phone,
      address,
      status: status !== undefined ? parseInt(status, 10) : undefined,
    });
    ok(res, { affectedRows: result }, '更新商家成功');
  } catch (error) {
    if (error instanceof Error && error.message === '商家不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const deleteMerchant = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantService.delete(parseInt(id, 10));
    ok(res, { affectedRows: result }, '删除商家成功');
  } catch (error) {
    if (error instanceof Error && error.message === '商家不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const batchDeleteMerchant = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的记录');
    return;
  }

  const result = await merchantService.batchDelete(ids.map((id: string | number) => parseInt(id as string, 10)));
  ok(res, { affectedRows: result }, '批量删除商家成功');
});

export const updateMerchantStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || status === undefined) {
    badRequest(res, '缺少必要参数');
    return;
  }

  try {
    const result = await merchantService.updateStatus(
      parseInt(id, 10),
      parseInt(status as string, 10)
    );
    ok(res, { affectedRows: result }, '更新商家状态成功');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '商家不存在') {
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
  getMerchantList,
  getMerchantDetail,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  batchDeleteMerchant,
  updateMerchantStatus,
};
