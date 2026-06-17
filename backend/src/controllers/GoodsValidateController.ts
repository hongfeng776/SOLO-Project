import { Request, Response } from 'express';
import { goodsValidateService, GoodsCreateValidateData } from '../services/GoodsValidateService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const validateCreate = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, category_id, brand_id, sku_code, name, price, stock } = req.body;

  if (!merchant_id || !category_id || !sku_code || !name || price === undefined) {
    badRequest(res, '缺少必要参数：merchant_id, category_id, sku_code, name, price');
    return;
  }

  const data: GoodsCreateValidateData = {
    merchant_id: parseInt(merchant_id, 10),
    category_id: parseInt(category_id, 10),
    brand_id: brand_id ? parseInt(brand_id, 10) : undefined,
    sku_code,
    name,
    price: parseFloat(price),
    stock: stock !== undefined ? parseInt(stock, 10) : undefined,
  };

  const result = await goodsValidateService.validateCreate(data);
  ok(res, result, result.valid ? '校验通过' : '校验不通过');
});

export const getCategoryRequiredFields = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    badRequest(res, '缺少类目ID');
    return;
  }

  const fields = goodsValidateService.getCategoryRequiredFields(parseInt(categoryId, 10));
  ok(res, fields, '获取类目必填字段成功');
});

export const validateSkuUniqueness = asyncHandler(async (req: Request, res: Response) => {
  const { sku, goodsId } = req.query;

  if (!sku) {
    badRequest(res, '缺少商品编码');
    return;
  }

  const result = await goodsValidateService.validateSkuUniqueness(
    sku as string,
    goodsId ? parseInt(goodsId as string, 10) : undefined
  );
  ok(res, result, result.valid ? '商品编码可用' : '商品编码已存在');
});

export const validateBrandCategoryCombo = asyncHandler(async (req: Request, res: Response) => {
  const { brandId, categoryId, merchantId, goodsId } = req.query;

  if (!brandId || !categoryId || !merchantId) {
    badRequest(res, '缺少必要参数：brandId, categoryId, merchantId');
    return;
  }

  const result = await goodsValidateService.validateBrandCategoryCombo(
    parseInt(brandId as string, 10),
    parseInt(categoryId as string, 10),
    parseInt(merchantId as string, 10),
    goodsId ? parseInt(goodsId as string, 10) : undefined
  );
  ok(res, result, result.valid ? '品牌类目组合可用' : '品牌类目组合已存在');
});

export default {
  validateCreate,
  getCategoryRequiredFields,
  validateSkuUniqueness,
  validateBrandCategoryCombo,
};
