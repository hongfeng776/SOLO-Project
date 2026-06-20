import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { success, badRequest } from '../utils/response';
import { settleValidateService, SettleApplyPayload } from '../services/SettleValidateService';
import { daos } from '../dao';

export const validateShopStatus = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  if (!merchantId) {
    badRequest(res, '缺少商家ID');
    return;
  }

  const merchant = await daos.merchantDao.findById(parseInt(merchantId, 10));
  const result = settleValidateService.validateShopOperateStatus(merchant as any);

  success(res, result, result.valid ? '店铺状态校验通过' : '店铺状态校验不通过');
});

export const validateOrderFinishAge = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodStart, periodEnd } = req.body;

  if (!merchantId || !periodStart || !periodEnd) {
    badRequest(res, '缺少必要参数：merchantId, periodStart, periodEnd');
    return;
  }

  const result = await settleValidateService.validateOrderFinishAge(
    parseInt(merchantId, 10),
    periodStart,
    periodEnd
  );

  success(res, result, result.valid ? '订单冷静期校验通过' : '订单冷静期校验不通过');
});

export const validateAftersaleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  if (!merchantId) {
    badRequest(res, '缺少商家ID');
    return;
  }

  const result = await settleValidateService.validateAftersaleStatus(parseInt(merchantId, 10));

  success(res, result, result.valid ? '售后状态校验通过' : '售后状态校验不通过');
});

export const validateBankCardInfo = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  if (!merchantId) {
    badRequest(res, '缺少商家ID');
    return;
  }

  const merchant = await daos.merchantDao.findById(parseInt(merchantId, 10));
  const result = settleValidateService.validateBankCardInfo(merchant as any);

  success(res, result, result.valid ? '银行卡信息校验通过' : '银行卡信息校验不通过');
});

export const validateApplyPeriod = asyncHandler(async (req: Request, res: Response) => {
  const { periodType, startDate, endDate } = req.body;

  if (periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：periodType, startDate, endDate');
    return;
  }

  const result = await settleValidateService.validateApplyPeriod(
    parseInt(periodType, 10),
    startDate,
    endDate
  );

  success(res, result, result.valid ? '结算周期校验通过' : '结算周期校验不通过');
});

export const interceptDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodType, startDate, endDate } = req.body;

  if (!merchantId || periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await settleValidateService.interceptDuplicatePeriod(
    parseInt(merchantId, 10),
    parseInt(periodType, 10),
    startDate,
    endDate
  );

  success(res, result, result.valid ? '无重复周期申请' : '存在重复周期申请');
});

export const validateAll = asyncHandler(async (req: Request, res: Response) => {
  const { merchantId, periodType, startDate, endDate } = req.body as {
    merchantId: number;
  } & SettleApplyPayload;

  if (!merchantId || periodType === undefined || !startDate || !endDate) {
    badRequest(res, '缺少必要参数：merchantId, periodType, startDate, endDate');
    return;
  }

  const merchant = await daos.merchantDao.findById(merchantId);
  if (!merchant) {
    badRequest(res, '商家不存在');
    return;
  }

  const payload: SettleApplyPayload = {
    periodType,
    startDate,
    endDate,
  };

  const result = await settleValidateService.validateAll(merchant as any, payload);

  success(res, result, result.valid ? '结算前置校验全部通过' : '结算前置校验存在问题');
});

export default {
  validateShopStatus,
  validateOrderFinishAge,
  validateAftersaleStatus,
  validateBankCardInfo,
  validateApplyPeriod,
  interceptDuplicate,
  validateAll,
};
