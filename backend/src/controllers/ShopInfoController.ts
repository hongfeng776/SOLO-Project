import { Request, Response } from 'express';
import { shopInfoService } from '../services/ShopInfoService';
import { ok, badRequest } from '../utils/response';

export const validateShopName = async (req: Request, res: Response) => {
  const { shop_name, exclude_merchant_id } = req.body || req.query;
  if (!shop_name) return badRequest(res, '店铺名称不能为空');
  const format = shopInfoService.validateShopName(shop_name as string);
  if (!format.valid) return badRequest(res, format.message!);
  const unique = await shopInfoService.checkShopNameUnique(shop_name as string, exclude_merchant_id as number | undefined);
  if (!unique.valid) return badRequest(res, unique.message!);
  return ok(res, { valid: true, message: '店铺名称合规' });
};

export const validateCustomerServicePhone = async (req: Request, res: Response) => {
  const { phone } = req.body || req.query;
  const r = shopInfoService.validateCustomerServicePhone(phone as string);
  return ok(res, { valid: r.valid, message: r.message });
};

export const validateShopCategory = async (req: Request, res: Response) => {
  const { category, sub_category } = req.body || req.query;
  const r = shopInfoService.validateShopCategory(category as string, sub_category as string);
  return ok(res, { valid: r.valid, message: r.message });
};

export const detectSensitiveWords = async (req: Request, res: Response) => {
  const { text } = req.body || req.query;
  const result = await shopInfoService.detectSensitiveWords(text as string);
  return ok(res, result);
};

export const checkDuplicate = async (req: Request, res: Response) => {
  const { shop_name, customer_service_phone, exclude_id } = req.body || req.query;
  if (!shop_name && !customer_service_phone) return badRequest(res, '请输入店铺名称或客服电话');
  const { shopTraceService } = require('../services/ShopTraceService');
  const r = await shopTraceService.checkShopUniqueness(shop_name as string, customer_service_phone as string, exclude_id as number | undefined);
  return ok(res, r);
};

export const validateAll = async (req: Request, res: Response) => {
  const result = await shopInfoService.validateAll(req.body);
  return ok(res, result);
};

export const getShopInfo = async (req: Request, res: Response) => {
  const merchantId = Number(req.params.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const info = await shopInfoService.getShopInfo(merchantId);
  return ok(res, info);
};

export const getShopList = async (req: Request, res: Response) => {
  const result = await shopInfoService.getShopList(req.query as any);
  return ok(res, result);
};

export const updateShopInfo = async (req: Request, res: Response) => {
  const { merchant_id } = req.body;
  if (!merchant_id) return badRequest(res, '商家ID不能为空');
  const result = await shopInfoService.updateShopInfo(req.body);
  return ok(res, result);
};
