import { Request, Response } from 'express';
import { merchantQualificationService } from '../services/MerchantQualificationService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const validateDocumentFormat = asyncHandler(async (req: Request, res: Response) => {
  const { type, value } = req.body;
  if (!type || !value) {
    badRequest(res, '缺少校验参数');
    return;
  }
  let result;
  switch (type) {
    case 'id_card':
      result = merchantQualificationService.validateIdCard(value as string);
      break;
    case 'credit_code':
      result = merchantQualificationService.validateCreditCode(value as string);
      break;
    case 'business_license':
      result = merchantQualificationService.validateBusinessLicenseNo(value as string);
      break;
    case 'phone':
      result = merchantQualificationService.validatePhone(value as string);
      break;
    default:
      badRequest(res, '不支持的证件类型');
      return;
  }
  ok(res, result, result.valid ? '格式校验通过' : '格式校验失败');
});

export const validateDateRange = asyncHandler(async (req: Request, res: Response) => {
  const { valid_from, expire_date } = req.body;
  const result = merchantQualificationService.validateDateRange(valid_from as string, expire_date as string);
  ok(res, result, result.valid ? '日期校验通过' : '日期校验失败');
});

export const checkDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const { credit_code, business_license_no, exclude_id } = req.body;
  const result = await merchantQualificationService.checkDuplicateMerchant(
    credit_code as string,
    business_license_no as string,
    exclude_id ? parseInt(exclude_id as string, 10) : undefined
  );
  ok(res, result, result.valid ? '唯一性校验通过' : '唯一性校验失败');
});

export const verifyWithIndustry = asyncHandler(async (req: Request, res: Response) => {
  const { qualification_type, certificate_no } = req.body;
  if (!qualification_type || !certificate_no) {
    badRequest(res, '缺少参数');
    return;
  }
  const result = await merchantQualificationService.verifyWithIndustryData(
    qualification_type as string,
    certificate_no as string
  );
  ok(res, result, result.verified ? '工商数据核验通过' : '工商数据核验不通过');
});

export const checkMaterialCompleteness = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  const result = await merchantQualificationService.checkMaterialCompleteness(payload);
  ok(res, result, result.complete ? '材料完整性校验通过' : '材料完整性校验失败');
});

export const submitQualification = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationService.submitQualification(
      payload,
      req.user?.id,
      (req.user as any)?.username
    );
    ok(res, result, '资质提交成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const resubmitQualification = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationService.resubmitQualification(
      payload,
      req.user?.id,
      (req.user as any)?.username
    );
    ok(res, result, '材料补传成功');
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const getQualificationList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, merchant_id, qualification_type, status, verification_status, expire_start, expire_end } = req.query;
  const result = await merchantQualificationService.getQualificationList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    merchant_id: merchant_id ? parseInt(merchant_id as string, 10) : undefined,
    qualification_type: qualification_type as string,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    verification_status: verification_status !== undefined ? parseInt(verification_status as string, 10) : undefined,
    expire_start: expire_start as string,
    expire_end: expire_end as string,
  });
  ok(res, result, '获取资质列表成功');
});

export const getQualificationByMerchant = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  const result = await merchantQualificationService.getQualificationByMerchant(parseInt(merchant_id, 10));
  ok(res, result, '获取商家资质成功');
});

export default {
  validateDocumentFormat,
  validateDateRange,
  checkDuplicate,
  verifyWithIndustry,
  checkMaterialCompleteness,
  submitQualification,
  resubmitQualification,
  getQualificationList,
  getQualificationByMerchant,
};
