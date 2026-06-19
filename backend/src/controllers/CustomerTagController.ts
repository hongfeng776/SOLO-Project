import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { CustomerTagService } from '../services/CustomerTagService';
import {
  CreateCustomerTagRequest,
  UpdateCustomerTagRequest,
  AdjustTagRequest,
  CustomerTagQueryParams,
  TagTraceRequest,
  TagBatchRequest,
  TagBatchQueryParams,
  TagBatchItemQueryParams
} from '../types';

const customerTagService = new CustomerTagService();

export class CustomerTagController {
  async precheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerTagService.preCheckTag(req.body as CreateCustomerTagRequest);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async adaptTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tag_code, asset_amount, transaction_count, retention_days, risk_level } = req.body;
      const result = customerTagService.adaptTag(
        tag_code || '',
        Number(asset_amount) || 0,
        Number(transaction_count) || 0,
        Number(retention_days) || 0,
        Number(risk_level) || 1
      );
      sendSuccess(res, result, '标签适配完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CustomerTagQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        customer_id: req.query.customer_id as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        customer_level: req.query.customer_level !== undefined ? Number(req.query.customer_level) as any : undefined,
        tag_code: req.query.tag_code as string,
        tag_type: req.query.tag_type !== undefined ? Number(req.query.tag_type) as any : undefined,
        tag_source: req.query.tag_source !== undefined ? Number(req.query.tag_source) as any : undefined,
        tag_status: req.query.tag_status !== undefined ? Number(req.query.tag_status) as any : undefined,
        data_ready: req.query.data_ready !== undefined ? Number(req.query.data_ready) : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerTagService.getTagList(params);
      sendSuccessPage(res, result, '获取客户标签列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await customerTagService.getTagDetail(req.params.id);
      sendSuccess(res, tag, '获取标签详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const tag = await customerTagService.createTag(
        req.body as CreateCustomerTagRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, tag, '标签创建成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const tag = await customerTagService.updateTag(
        req.params.id, req.body as UpdateCustomerTagRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, tag, '更新标签成功');
    } catch (error) {
      next(error);
    }
  }

  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const tag = await customerTagService.adjustTag(
        req.body as AdjustTagRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, tag, '标签调整成功');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const orgId = (req as any).user?.org_id;
      const tag = await customerTagService.removeTag(
        req.params.id, operatorId, operatorName, orgId
      );
      sendSuccess(res, tag, '标签移除成功');
    } catch (error) {
      next(error);
    }
  }

  async logs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await customerTagService.getTagLogs(req.params.id);
      sendSuccess(res, logs, '获取变更日志成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerTagService.traceTag(req.body as TagTraceRequest);
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
      const result = await customerTagService.batchUpdateTags(
        req.body as TagBatchRequest, operatorId, operatorName, orgId
      );
      sendSuccess(res, result, '批量操作完成');
    } catch (error) {
      next(error);
    }
  }

  async batchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: TagBatchQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_no: req.query.batch_no as string,
        batch_name: req.query.batch_name as string,
        operation_type: req.query.operation_type !== undefined ? Number(req.query.operation_type) as any : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerTagService.getBatchList(params);
      sendSuccessPage(res, result, '获取批量操作列表成功');
    } catch (error) {
      next(error);
    }
  }

  async batchItemList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: TagBatchItemQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        batch_id: req.query.batch_id as string,
        process_result: req.query.process_result !== undefined ? Number(req.query.process_result) as any : undefined,
        keyword: req.query.keyword as string
      };
      const result = await customerTagService.getBatchItems(params);
      sendSuccessPage(res, result, '获取批量操作明细成功');
    } catch (error) {
      next(error);
    }
  }
}
