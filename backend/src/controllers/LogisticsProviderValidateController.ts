import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, success } from '../utils/response';
import {
  logisticsProviderValidateService,
} from '../services/LogisticsProviderValidateService';

export const validateProviderCode = asyncHandler(async (req: Request, res: Response) => {
  const { code, exclude_id } = req.body;
  if (!code) {
    badRequest(res, '缺少服务商编码');
    return;
  }

  const formatResult = logisticsProviderValidateService.validateProviderCode(code as string);
  if (!formatResult.valid) {
    ok(res, { ...formatResult, checked: 'format' }, '编码格式校验');
    return;
  }

  const uniqueResult = await logisticsProviderValidateService.checkProviderCodeUnique(
    code as string,
    exclude_id ? parseInt(exclude_id as string, 10) : undefined
  );

  const combined = {
    valid: formatResult.valid && uniqueResult.valid,
    message: uniqueResult.message || formatResult.message,
    errorCode: uniqueResult.errorCode || formatResult.errorCode,
    suggestions: formatResult.suggestions,
    checked: 'all',
  };

  ok(res, combined, combined.valid ? '编码校验通过' : '编码校验失败');
});

export const validateCreditCode = asyncHandler(async (req: Request, res: Response) => {
  const { credit_code, exclude_id } = req.body;
  if (!credit_code) {
    badRequest(res, '缺少统一社会信用代码');
    return;
  }

  const formatResult = logisticsProviderValidateService.validateCreditCode(credit_code as string);
  if (!formatResult.valid) {
    ok(res, formatResult, '信用代码格式校验');
    return;
  }

  const uniqueResult = await logisticsProviderValidateService.checkCreditCodeUnique(
    credit_code as string,
    exclude_id ? parseInt(exclude_id as string, 10) : undefined
  );

  ok(res, uniqueResult, uniqueResult.valid ? '信用代码校验通过' : '信用代码校验失败');
});

export const validateBusinessLicense = asyncHandler(async (req: Request, res: Response) => {
  const { license_no, exclude_id } = req.body;
  if (!license_no) {
    badRequest(res, '缺少营业执照注册号');
    return;
  }

  const formatResult = logisticsProviderValidateService.validateBusinessLicenseNo(license_no as string);
  if (!formatResult.valid) {
    ok(res, formatResult, '营业执照格式校验');
    return;
  }

  const uniqueResult = await logisticsProviderValidateService.checkBusinessLicenseUnique(
    license_no as string,
    exclude_id ? parseInt(exclude_id as string, 10) : undefined
  );

  ok(res, uniqueResult, uniqueResult.valid ? '营业执照校验通过' : '营业执照校验失败');
});

export const validatePhone = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const result = logisticsProviderValidateService.validatePhone(phone as string);
  ok(res, result, result.valid ? '手机号校验通过' : '手机号校验失败');
});

export const validateEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = logisticsProviderValidateService.validateEmail(email as string);
  ok(res, result, result.valid ? '邮箱校验通过' : '邮箱校验失败');
});

export const validateIdCard = asyncHandler(async (req: Request, res: Response) => {
  const { id_card } = req.body;
  const result = logisticsProviderValidateService.validateIdCard(id_card as string);
  ok(res, result, result.valid ? '身份证校验通过' : '身份证校验失败');
});

export const validateDateRange = asyncHandler(async (req: Request, res: Response) => {
  const { valid_from, expire_date } = req.body;
  const result = logisticsProviderValidateService.validateDateRange(
    valid_from as string,
    expire_date as string
  );
  ok(res, result, result.valid ? '日期范围校验通过' : '日期范围校验失败');
});

export const runProviderPreCheck = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderValidateService.runProviderPreCheck(parseInt(id, 10));
  success(res, result, result.passed ? '前置校验通过' : '前置校验存在拦截项');
});

export const validateEnterpriseQualification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderValidateService.validateEnterpriseQualification(parseInt(id, 10));
  success(res, result, result.valid ? '企业资质校验通过' : '企业资质校验失败');
});

export const validateCoverage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderValidateService.validateCoverage(parseInt(id, 10));
  success(res, result, result.valid ? '网点覆盖校验通过' : '网点覆盖校验失败');
});

export const validateTimeliness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderValidateService.validateTimeliness(parseInt(id, 10));
  success(res, result, result.valid ? '时效承诺校验通过' : '时效承诺校验失败');
});

export const validatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const result = await logisticsProviderValidateService.validatePermissions(parseInt(id, 10));
  success(res, result, result.valid ? '合作权限校验通过' : '合作权限校验失败');
});

export const checkFeeCompliance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    badRequest(res, '缺少服务商ID');
    return;
  }
  const feeData = req.body;
  const result = await logisticsProviderValidateService.checkFeeCompliance(parseInt(id, 10), feeData);
  success(res, result, result.valid ? '资费合规性校验通过' : '资费合规性校验失败');
});

export const checkFieldEditPermission = asyncHandler(async (req: Request, res: Response) => {
  const { cooperation_status, field } = req.body;
  if (cooperation_status === undefined || !field) {
    badRequest(res, '缺少校验参数');
    return;
  }
  const result = logisticsProviderValidateService.canEditByCooperationStatus(
    parseInt(cooperation_status as string, 10),
    field as string
  );
  success(res, result, '字段编辑权限校验完成');
});

export const checkDuplicateProvider = asyncHandler(async (req: Request, res: Response) => {
  const { credit_code, license_no, provider_name, exclude_id } = req.body;
  const result = await logisticsProviderValidateService.checkDuplicateProvider(
    credit_code as string,
    license_no as string,
    provider_name as string,
    exclude_id ? parseInt(exclude_id as string, 10) : undefined
  );
  success(res, result, result.valid ? '唯一性校验通过，无重复记录' : '存在重复服务商记录');
});

export default {
  validateProviderCode,
  validateCreditCode,
  validateBusinessLicense,
  validatePhone,
  validateEmail,
  validateIdCard,
  validateDateRange,
  runProviderPreCheck,
  validateEnterpriseQualification,
  validateCoverage,
  validateTimeliness,
  validatePermissions,
  checkFeeCompliance,
  checkFieldEditPermission,
  checkDuplicateProvider,
};
