import { Request, Response } from 'express';
import { shopTraceService } from '../services/ShopTraceService';
import { ok, badRequest } from '../utils/response';

export const getFullTrace = async (req: Request, res: Response) => {
  const merchantId = Number(req.params.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const result = await shopTraceService.getFullTrace(merchantId);
  return ok(res, result);
};

export const getInfoChangeLogs = async (req: Request, res: Response) => {
  const merchantId = Number(req.params.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const { daos } = require('../dao');
  const logs = await daos.shopInfoChangeLogDao.findByMerchantId(merchantId);
  return ok(res, logs);
};

export const getOperationLedgers = async (req: Request, res: Response) => {
  const merchantId = Number(req.params.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const { daos } = require('../dao');
  const ledgers = await daos.shopOperationLedgerDao.findByMerchantId(merchantId);
  return ok(res, ledgers);
};

export const checkCompliance = async (req: Request, res: Response) => {
  const merchantId = Number(req.body.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const { shopInfoService } = require('../services/ShopInfoService');
  const info = await shopInfoService.getShopInfo(merchantId);
  const result = await shopTraceService.checkCompliance(info);
  return ok(res, result);
};

export const checkUniqueness = async (req: Request, res: Response) => {
  const { shop_name, customer_service_phone, exclude_id } = req.body || req.query;
  const result = await shopTraceService.checkShopUniqueness(shop_name as string, customer_service_phone as string, exclude_id as number | undefined);
  return ok(res, result);
};

export const checkCrossCategory = async (req: Request, res: Response) => {
  const merchantId = Number(req.body.merchant_id || req.query.merchant_id);
  if (!merchantId) return badRequest(res, '商家ID不能为空');
  const result = await shopTraceService.checkCrossCategoryViolation(merchantId);
  return ok(res, result);
};
