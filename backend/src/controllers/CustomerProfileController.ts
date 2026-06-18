import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { CustomerProfileService } from '../services';
import {
  CustomerProfileQueryParams,
  CreateCustomerProfileRequest,
  UpdateCustomerProfileRequest,
  CustomerProfileTraceRequest,
  BatchImportRequest,
  ProfileBatchQueryParams,
  BatchItemQueryParams,
  ReviewAbnormalRequest
} from '../types';

const customerProfileService = new CustomerProfileService();

export class CustomerProfileController {
  async precheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerProfileService.preCheckProfile(req.body as CreateCustomerProfileRequest);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CustomerProfileQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        profile_no: req.query.profile_no as string,
        customer_name: req.query.customer_name as string,
        id_card_no: req.query.id_card_no as string,
        mobile: req.query.mobile as string,
        customer_level: req.query.customer_level !== undefined ? Number(req.query.customer_level) as any : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        need_complete: req.query.need_complete !== undefined ? Number(req.query.need_complete) : undefined,
        is_abnormal: req.query.is_abnormal !== undefined ? Number(req.query.is_abnormal) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerProfileService.getProfileList(params);
      sendSuccessPage(res, result, '获取客户档案列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await customerProfileService.getProfileById(req.params.id);
      sendSuccess(res, profile, '获取客户档案详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operator = {
        id: (req as any).user?.id,
        name: (req as any).user?.name,
        org_id: (req as any).user?.org_id,
        org_name: (req as any).user?.org_name
      };
      const profile = await customerProfileService.createProfile(req.body as CreateCustomerProfileRequest, operator);
      sendSuccess(res, profile, '客户建档成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operator = {
        id: (req as any).user?.id,
        name: (req as any).user?.name,
        org_id: (req as any).user?.org_id,
        org_name: (req as any).user?.org_name
      };
      const profile = await customerProfileService.updateProfile(req.params.id, req.body as UpdateCustomerProfileRequest, operator);
      sendSuccess(res, profile, '更新客户档案成功');
    } catch (error) {
      next(error);
    }
  }

  async logs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await customerProfileService.getProfileLogs(req.params.id);
      sendSuccess(res, logs, '获取变更日志成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerProfileService.traceProfile(req.body as CustomerProfileTraceRequest);
      sendSuccess(res, result, '溯源查询完成');
    } catch (error) {
      next(error);
    }
  }

  async batchImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operator = {
        id: (req as any).user?.id,
        name: (req as any).user?.name,
        org_id: (req as any).user?.org_id,
        org_name: (req as any).user?.org_name
      };
      const result = await customerProfileService.batchImportProfiles(req.body as BatchImportRequest, operator);
      sendSuccess(res, result, '批量建档完成');
    } catch (error) {
      next(error);
    }
  }

  async batchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: ProfileBatchQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_no: req.query.batch_no as string,
        batch_name: req.query.batch_name as string,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerProfileService.getBatchList(params);
      sendSuccessPage(res, result, '获取批量列表成功');
    } catch (error) {
      next(error);
    }
  }

  async batchItemList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: BatchItemQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_id: req.query.batch_id as string,
        process_result: req.query.process_result !== undefined ? Number(req.query.process_result) as any : undefined,
        keyword: req.query.keyword as string
      };
      const result = await customerProfileService.getBatchItemList(params);
      sendSuccessPage(res, result, '获取批量明细成功');
    } catch (error) {
      next(error);
    }
  }

  async reviewAbnormal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operator = {
        id: (req as any).user?.id,
        name: (req as any).user?.name,
        org_id: (req as any).user?.org_id,
        org_name: (req as any).user?.org_name
      };
      const result = await customerProfileService.reviewAbnormalProfile(req.body as ReviewAbnormalRequest, operator);
      sendSuccess(res, result, '复核完成');
    } catch (error) {
      next(error);
    }
  }
}
