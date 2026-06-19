import { Request, Response } from 'express';
import { merchantBusinessService } from '../services/MerchantBusinessService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getBusinessDataList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, merchant_id, stat_period_type, stat_start_date, stat_end_date,
    data_status, risk_level, shop_category, shop_level, sales_amount_min, sales_amount_max,
    sortField, sortOrder,
  } = req.query;

  const result = await merchantBusinessService.getBusinessDataList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    merchant_id: merchant_id !== undefined ? parseInt(merchant_id as string, 10) : undefined,
    stat_period_type: stat_period_type !== undefined ? parseInt(stat_period_type as string, 10) : undefined,
    stat_start_date: stat_start_date as string | undefined,
    stat_end_date: stat_end_date as string | undefined,
    data_status: data_status !== undefined ? parseInt(data_status as string, 10) : undefined,
    risk_level: risk_level !== undefined ? parseInt(risk_level as string, 10) : undefined,
    shop_category: shop_category as string | undefined,
    shop_level: shop_level !== undefined ? parseInt(shop_level as string, 10) : undefined,
    sales_amount_min: sales_amount_min !== undefined ? parseFloat(sales_amount_min as string) : undefined,
    sales_amount_max: sales_amount_max !== undefined ? parseFloat(sales_amount_max as string) : undefined,
    sortField: sortField as string | undefined,
    sortOrder: sortOrder as string | undefined,
  });

  ok(res, result, '获取经营数据列表成功');
});

export const getBusinessDataDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少ID参数');
    return;
  }

  try {
    const result = await merchantBusinessService.getBusinessDataDetail(parseInt(id, 10));
    ok(res, result, '获取经营数据详情成功');
  } catch (error) {
    if (error instanceof Error && error.message === '经营数据不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const autoCalculateBusinessData = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, period_type, start_date, end_date, operator_id, operator_name } = req.body;

  if (!merchant_id || !period_type || !start_date || !end_date) {
    badRequest(res, '缺少必要参数：merchant_id, period_type, start_date, end_date');
    return;
  }

  try {
    const result = await merchantBusinessService.autoCalculateBusinessData(
      parseInt(merchant_id, 10),
      parseInt(period_type, 10),
      start_date,
      end_date,
      operator_id ? parseInt(operator_id, 10) : undefined,
      operator_name
    );
    ok(res, result, '经营数据自动计算成功');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === '商家不存在') {
        notFound(res, error.message);
        return;
      }
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const manualCreateBusinessData = asyncHandler(async (req: Request, res: Response) => {
  const { payload, operator_id, operator_name } = req.body;

  if (!payload) {
    badRequest(res, '缺少参数：payload');
    return;
  }

  try {
    const result = await merchantBusinessService.manualCreateBusinessData(
      payload,
      operator_id ? parseInt(operator_id, 10) : undefined,
      operator_name
    );
    ok(res, result, '经营数据手动录入成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const validateStatPeriod = asyncHandler(async (req: Request, res: Response) => {
  const { period_type, start_date, end_date } = req.query;

  if (!period_type || !start_date || !end_date) {
    badRequest(res, '缺少必要参数：period_type, start_date, end_date');
    return;
  }

  const result = merchantBusinessService.validateStatPeriod(
    parseInt(period_type as string, 10),
    start_date as string,
    end_date as string
  );

  ok(res, result, '统计周期校验完成');
});

export const validateDataConsistency = asyncHandler(async (req: Request, res: Response) => {
  const result = merchantBusinessService.validateDataConsistency(req.body);
  ok(res, result, '数据一致性校验完成');
});

export const validateAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await merchantBusinessService.validateAll(req.body);
  ok(res, result, '综合校验完成');
});

export const checkDuplicateStat = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, period_type, start_date, end_date } = req.query;

  if (!merchant_id || !period_type || !start_date || !end_date) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const isDuplicate = await merchantBusinessService.detectDuplicateStat(
    parseInt(merchant_id as string, 10),
    parseInt(period_type as string, 10),
    start_date as string,
    end_date as string
  );

  ok(res, { isDuplicate }, '重复统计检测完成');
});

export default {
  getBusinessDataList,
  getBusinessDataDetail,
  autoCalculateBusinessData,
  manualCreateBusinessData,
  validateStatPeriod,
  validateDataConsistency,
  validateAll,
  checkDuplicateStat,
};
