import { Request, Response } from 'express';
import { goodsEditorService, GoodsEditExecuteData } from '../services/GoodsEditorService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getEditableFields = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsEditorService.getEditableFields(parseInt(id, 10));
  ok(res, result, '获取可编辑字段成功');
});

export const getEditFieldConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  const result = await goodsEditorService.getEditFieldConfig(parseInt(id, 10));
  ok(res, result, '获取字段编辑配置成功');
});

export const executeEdit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, category_id, brand_id, price, original_price, stock,
    cover_image, description, sku_code, sort_weight, top_flag,
    sale_start_time, sale_end_time, compliance_rating, status,
    editor_id, editor_type, remark,
  } = req.body;

  if (!id) {
    badRequest(res, '缺少商品ID');
    return;
  }

  if (editor_id === undefined || editor_type === undefined) {
    badRequest(res, '缺少编辑人信息：editor_id, editor_type');
    return;
  }

  const data: GoodsEditExecuteData = {};

  if (name !== undefined) data.name = name;
  if (category_id !== undefined) data.category_id = parseInt(category_id, 10);
  if (brand_id !== undefined) data.brand_id = parseInt(brand_id, 10);
  if (price !== undefined) data.price = parseFloat(price);
  if (original_price !== undefined) data.original_price = parseFloat(original_price);
  if (stock !== undefined) data.stock = parseInt(stock, 10);
  if (cover_image !== undefined) data.cover_image = cover_image;
  if (description !== undefined) data.description = description;
  if (sku_code !== undefined) data.sku_code = sku_code;
  if (sort_weight !== undefined) data.sort_weight = parseInt(sort_weight, 10);
  if (top_flag !== undefined) data.top_flag = parseInt(top_flag, 10);
  if (sale_start_time !== undefined) data.sale_start_time = new Date(sale_start_time);
  if (sale_end_time !== undefined) data.sale_end_time = new Date(sale_end_time);
  if (compliance_rating !== undefined) data.compliance_rating = parseInt(compliance_rating, 10);
  if (status !== undefined) data.status = parseInt(status, 10);

  const ip = (req.headers['x-forwarded-for'] as string) ||
    (req.connection.remoteAddress as string) ||
    req.ip ||
    '';

  const goods = await goodsEditorService.executeEdit(
    parseInt(id, 10),
    data,
    parseInt(editor_id, 10),
    parseInt(editor_type, 10),
    ip,
    remark
  );

  ok(res, goods, '商品编辑成功');
});

export default {
  getEditableFields,
  getEditFieldConfig,
  executeEdit,
};
