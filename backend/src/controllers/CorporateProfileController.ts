import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { CorporateProfileService } from '../services/CorporateProfileService';
import {
  CorporateProfileQueryParams,
  CreateCorporateProfileRequest,
  UpdateCorporateProfileRequest,
  CorporateTraceRequest,
  CorpBatchUpdateRequest,
  CorpBatchQueryParams,
  CorpBatchItemQueryParams,
  CorpReviewAbnormalRequest,
  BusinessStatus
} from '../types';

const corporateProfileService = new CorporateProfileService();

export class CorporateProfileController {
  async precheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await corporateProfileService.preCheckProfile(req.body as CreateCorporateProfileRequest);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async adaptType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registered_capital, business_years, business_status, industry_type } = req.body;
      const result = corporateProfileService.adaptCustomerType(
        Number(registered_capital) || 0,
        Number(business_years) || 0,
        Number(business_status) as BusinessStatus || 1,
        industry_type || ''
      );
      sendSuccess(res, result, '类型适配完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CorporateProfileQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        profile_no: req.query.profile_no as string,
        enterprise_name: req.query.enterprise_name as string,
        credit_code: req.query.credit_code as string,
        customer_type: req.query.customer_type !== undefined ? Number(req.query.customer_type) as any : undefined,
        business_status: req.query.business_status !== undefined ? Number(req.query.business_status) as any : undefined,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) as any : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        need_complete: req.query.need_complete !== undefined ? Number(req.query.need_complete) : undefined,
        is_abnormal: req.query.is_abnormal !== undefined ? Number(req.query.is_abnormal) : undefined,
        is_dishonest: req.query.is_dishonest !== undefined ? Number(req.query.is_dishonest) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await corporateProfileService.getProfileList(params);
      sendSuccessPage(res, result, '获取对公客户列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await corporateProfileService.getProfileDetail(req.params.id);
      sendSuccess(res, profile, '获取对公客户详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const profile = await corporateProfileService.createProfile(
        req.body as CreateCorporateProfileRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, profile, '对公客户建档成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const profile = await corporateProfileService.updateProfile(
        req.params.id, req.body as UpdateCorporateProfileRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, profile, '更新对公客户信息成功');
    } catch (error) {
      next(error);
    }
  }

  async logs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await corporateProfileService.getProfileLogs(req.params.id);
      sendSuccess(res, logs, '获取变更日志成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await corporateProfileService.traceProfile(req.body as CorporateTraceRequest);
      sendSuccess(res, result, '溯源查询完成');
    } catch (error) {
      next(error);
    }
  }

  async batchUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const result = await corporateProfileService.batchUpdateProfiles(
        req.body as CorpBatchUpdateRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, result, '批量更新完成');
    } catch (error) {
      next(error);
    }
  }

  async batchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CorpBatchQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_no: req.query.batch_no as string,
        batch_name: req.query.batch_name as string,
        update_type: req.query.update_type !== undefined ? Number(req.query.update_type) as any : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await corporateProfileService.getBatchList(params);
      sendSuccessPage(res, result, '获取批量更新列表成功');
    } catch (error) {
      next(error);
    }
  }

  async batchItemList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CorpBatchItemQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_id: req.query.batch_id as string,
        process_result: req.query.process_result !== undefined ? Number(req.query.process_result) as any : undefined,
        keyword: req.query.keyword as string
      };
      const result = await corporateProfileService.getBatchItems(params);
      sendSuccessPage(res, result, '获取批量更新明细成功');
    } catch (error) {
      next(error);
    }
  }

  async reviewAbnormal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = (req as any).user?.id;
      const reviewerName = (req as any).user?.name;
      const result = await corporateProfileService.reviewAbnormalProfile(
        req.body as CorpReviewAbnormalRequest, reviewerId, reviewerName
      );
      sendSuccess(res, result, '复核完成');
    } catch (error) {
      next(error);
    }
  }
}
