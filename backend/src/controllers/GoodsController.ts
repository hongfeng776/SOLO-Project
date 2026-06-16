import { Request, Response } from 'express';
import { goodsService, GoodsCreateData, GoodsUpdateData } from '../services/GoodsService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getGoodsList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, name, category_id, status, merchant_id } = req.query;

  const result = await goodsService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    name: name as string,
    category_id: category_id ? parseInt(category_id as string, 10) : undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
  });

  ok(res, result, '获取商品列表成功');
});

export const getGoodsDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const goods = await goodsService.getById(parseInt(id, 10));
  ok(res, goods, '获取商品详情成功');
});

export const createGoods = asyncHandler(async (req: Request, res: Response) => {
  const { name, price, category_id, original_price, stock, cover_image, description, merchant_id } = req.body;

  if (!name || price === undefined) {
    badRequest(res, '缺少必要参数：商品名称和价格');
    return;
  }

  const data: GoodsCreateData = {
    name,
    price: parseFloat(price),
    category_id: category_id ? parseInt(category_id, 10) : undefined,
    original_price: original_price ? parseFloat(original_price) : undefined,
    stock: stock !== undefined ? parseInt(stock, 10) : undefined,
    cover_image,
    description,
    merchant_id: merchant_id ? parseInt(merchant_id, 10) : undefined,
  };

  const goods = await goodsService.create(data);
  ok(res, goods, '创建商品成功');
});

export const updateGoods = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, category_id, original_price, stock, cover_image, description, merchant_id } = req.body;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const data: GoodsUpdateData = {};

  if (name !== undefined) data.name = name;
  if (price !== undefined) data.price = parseFloat(price);
  if (category_id !== undefined) data.category_id = parseInt(category_id, 10);
  if (original_price !== undefined) data.original_price = parseFloat(original_price);
  if (stock !== undefined) data.stock = parseInt(stock, 10);
  if (cover_image !== undefined) data.cover_image = cover_image;
  if (description !== undefined) data.description = description;
  if (merchant_id !== undefined) data.merchant_id = parseInt(merchant_id, 10);

  const goods = await goodsService.update(parseInt(id, 10), data);
  ok(res, goods, '更新商品成功');
});

export const deleteGoods = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  await goodsService.delete(parseInt(id, 10));
  ok(res, null, '删除商品成功');
});

export const batchDeleteGoods = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的商品');
    return;
  }

  const count = await goodsService.batchDelete(ids.map((id: string | number) => parseInt(String(id), 10)));
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export const updateGoodsStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const goods = await goodsService.updateStatus(parseInt(id, 10), parseInt(status, 10));
  ok(res, goods, '更新商品状态成功');
});

export default {
  getGoodsList,
  getGoodsDetail,
  createGoods,
  updateGoods,
  deleteGoods,
  batchDeleteGoods,
  updateGoodsStatus,
};
