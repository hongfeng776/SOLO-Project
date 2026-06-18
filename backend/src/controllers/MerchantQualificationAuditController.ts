import { Request, Response } from 'express';
import { merchantQualificationAuditService } from '../services/MerchantQualificationAuditService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest, notFound } from '../utils/response';

export const getSettleMerchantList = asyncHandler(async (req: Request, res: Response) => {
  const {
    page, pageSize, name, phone, settle_status, settle_status_list,
    credit_code, license_expire_start, license_expire_end,
    industry_type, startDate, endDate
  } = req.query;

  let settleStatusList: number[] | undefined;
  if (settle_status_list) {
    settleStatusList = (settle_status_list as string).split(',').map(s => parseInt(s, 10));
  }

  const result = await merchantQualificationAuditService.getSettleMerchantList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    name: name as string,
    phone: phone as string,
    settle_status: settle_status !== undefined ? parseInt(settle_status as string, 10) : undefined,
    settle_status_list: settleStatusList,
    credit_code: credit_code as string,
    license_expire_start: license_expire_start as string,
    license_expire_end: license_expire_end as string,
    industry_type: industry_type as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });
  ok(res, result, '获取商家入驻列表成功');
});

export const getAuditDetail = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id } = req.params;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationAuditService.getAuditDetail(parseInt(merchant_id, 10));
    ok(res, result, '获取审核详情成功');
  } catch (error) {
    if (error instanceof Error && error.message === '商家不存在') {
      notFound(res, error.message);
      return;
    }
    throw error;
  }
});

export const approveAudit = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, reason, qualification_opinions } = req.body;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationAuditService.approve({
      merchant_id: parseInt(merchant_id, 10),
      auditor_id: req.user?.id,
      auditor_name: (req.user as any)?.username,
      reason,
      qualification_opinions,
    });
    ok(res, result, result.message);
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const rejectAudit = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, reason, missing_materials, violation_points, need_resubmit, resubmit_deadline, qualification_opinions } = req.body;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  if (!reason) {
    badRequest(res, '驳回原因不能为空');
    return;
  }
  try {
    const result = await merchantQualificationAuditService.reject({
      merchant_id: parseInt(merchant_id, 10),
      auditor_id: req.user?.id,
      auditor_name: (req.user as any)?.username,
      reason,
      missing_materials,
      violation_points,
      need_resubmit,
      resubmit_deadline,
      qualification_opinions,
    });
    ok(res, result, result.message);
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const reviewQualification = asyncHandler(async (req: Request, res: Response) => {
  const { merchant_id, reason } = req.body;
  if (!merchant_id) {
    badRequest(res, '缺少商家ID');
    return;
  }
  try {
    const result = await merchantQualificationAuditService.review({
      merchant_id: parseInt(merchant_id, 10),
      auditor_id: req.user?.id,
      auditor_name: (req.user as any)?.username,
      reason,
    });
    ok(res, result, result.message);
  } catch (error) {
    if (error instanceof Error) {
      badRequest(res, error.message);
      return;
    }
    throw error;
  }
});

export const processExpiredQualifications = asyncHandler(async (_req: Request, res: Response) => {
  const result = await merchantQualificationAuditService.processExpiredQualifications();
  ok(res, result, `已自动处理 ${result.updated} 条过期资质`);
});

export default {
  getSettleMerchantList,
  getAuditDetail,
  approveAudit,
  rejectAudit,
  reviewQualification,
  processExpiredQualifications,
};
