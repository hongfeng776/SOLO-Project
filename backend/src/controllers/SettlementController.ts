import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { SettlementService } from '../services';
import {
  SettlementPreCheckRequest,
  CreateSettlementRequest,
  SettlementQueryParams,
  ReviewSettlementRequest,
  CreateBatchSettlementRequest,
  BatchQueryParams,
  SettlementBatchReviewRequest,
  SettlementTraceRequest
} from '../types';

export class SettlementController {
  private settlementService: SettlementService;

  constructor() {
    this.settlementService = new SettlementService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settlementService.getSettlementConfig();
      sendSuccess(res, result, '获取支付结算配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: SettlementPreCheckRequest = req.body;
      const result = await this.settlementService.preCheckSettlement(request, req.userId);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: SettlementQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        settlement_no: req.query.settlement_no as string,
        payer_account_no: req.query.payer_account_no as string,
        payee_account_no: req.query.payee_account_no as string,
        payee_account_name: req.query.payee_account_name as string,
        transfer_type: req.query.transfer_type ? Number(req.query.transfer_type) as any : undefined,
        transfer_mode: req.query.transfer_mode ? Number(req.query.transfer_mode) as any : undefined,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        audit_status: req.query.audit_status ? Number(req.query.audit_status) as any : undefined,
        risk_level: req.query.risk_level ? Number(req.query.risk_level) as any : undefined,
        need_review: req.query.need_review ? req.query.need_review === 'true' : undefined,
        org_id: req.query.org_id as string,
        operator_id: req.query.operator_id as string,
        reviewer_id: req.query.reviewer_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        batch_id: req.query.batch_id as string
      };
      const result = await this.settlementService.getSettlementList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取结算列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settlementService.getSettlementById(req.params.id);
      sendSuccess(res, result, '获取结算详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateSettlementRequest = req.body;
      const result = await this.settlementService.createSettlement(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '创建转账成功');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cancelReason = req.body?.cancel_reason;
      const result = await this.settlementService.cancelSettlement(req.params.id, req.userId!, cancelReason);
      sendSuccess(res, result, '撤销转账成功');
    } catch (error) {
      next(error);
    }
  }

  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ReviewSettlementRequest = req.body;
      if (!request.settlement_no) request.settlement_no = req.params.id;
      const result = await this.settlementService.reviewSettlement(request, req.userId!);
      sendSuccess(res, result, request.approved ? '复核通过，转账已提交处理' : '复核已拒绝');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateBatchSettlementRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.settlementService.batchCreateSettlement(request, req.userId!, userRoles);
      sendSuccess(res, result, `批量转账创建完成：成功${result.success_count}条，失败${result.fail_count}条，待复核${result.pending_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async batchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: BatchQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        batch_no: req.query.batch_no as string,
        batch_name: req.query.batch_name as string,
        batch_type: req.query.batch_type ? Number(req.query.batch_type) as any : undefined,
        payer_account_no: req.query.payer_account_no as string,
        status: req.query.status ? Number(req.query.status) : undefined,
        audit_status: req.query.audit_status ? Number(req.query.audit_status) : undefined,
        need_review: req.query.need_review ? req.query.need_review === 'true' : undefined,
        org_id: req.query.org_id as string,
        operator_id: req.query.operator_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.settlementService.getBatchList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取批量列表成功');
    } catch (error) {
      next(error);
    }
  }

  async batchDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settlementService.getBatchById(req.params.id);
      sendSuccess(res, result, '获取批量详情成功');
    } catch (error) {
      next(error);
    }
  }

  async batchReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: SettlementBatchReviewRequest = req.body;
      if (!request.batch_id) request.batch_id = req.params.id;
      const result = await this.settlementService.reviewBatch(request, req.userId!);
      sendSuccess(res, result, request.approved ? '批量复核通过' : '批量复核已拒绝');
    } catch (error) {
      next(error);
    }
  }

  async batchProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.settlementService.getBatchProgress(req.params.id);
      sendSuccess(res, result, '获取批量进度成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: SettlementTraceRequest = req.body;
      const result = await this.settlementService.traceSettlement(request);
      sendSuccess(res, result, '溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
