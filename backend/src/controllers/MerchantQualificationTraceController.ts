import { Request, Response } from 'express';
import { merchantQualificationTraceService } from '../services/MerchantQualificationTraceService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getFullTrace = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationTraceService.getFullTrace(parseInt(merchant_id, 10));
    ok(res, result, '获取资质全链路溯源成功');
  } catch (error) {
    if (error instanceof Error && error.message === '商家不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const getQualificationLedger = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, merchant_id, operation_type, start_time, end_time } = req.query;
  const result = await merchantQualificationTraceService.getQualificationValidityLedger({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
    operation_type: operation_type as string,
    start_time: start_time as string,
    end_time: end_time as string,
  });
  ok(res, result, '获取资质有效期台账成功');
});

export const checkUniqueness = asyncHandler(async (req: Request, res: Response) => {
  const { credit_code, business_license_no, legal_id_card, phone, name, exclude_merchant_id } = req.body;
  const result = await merchantQualificationTraceService.checkUniqueness({
    credit_code: credit_code as string,
    business_license_no: business_license_no as string,
    legal_id_card: legal_id_card as string,
    phone: phone as string,
    name: name as string,
    exclude_merchant_id: exclude_merchant_id ? parseInt(exclude_merchant_id as string, 10) : undefined,
  });
  ok(res, result, result.is_unique ? '唯一性校验通过：无重复入驻记录' : '唯一性校验失败：检测到重复入驻记录');
});

export const checkFraud = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, credit_code, business_license_no, certificate_nos } = req.body;
  const result = await merchantQualificationTraceService.checkFraud({
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
    credit_code: credit_code as string,
    business_license_no: business_license_no as string,
    certificate_nos,
  });
  ok(res, result, result.is_fraud ? '检测到高风险，疑似虚假资质材料' : '合规性校验通过');
});

export const getMaterialChangeLogs = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  const { qualification_id } = req.query;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  const result = await merchantQualificationTraceService.getMaterialChangeLogs(
    parseInt(merchant_id as string, 10),
    qualification_id ? parseInt(qualification_id as string, 10) : undefined
  );
  ok(res, result, '获取材料变更记录成功');
});

export default {
  getFullTrace,
  getQualificationLedger,
  checkUniqueness,
  checkFraud,
  getMaterialChangeLogs,
};
