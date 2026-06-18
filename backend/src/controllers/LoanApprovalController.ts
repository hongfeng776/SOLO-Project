import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { LoanApprovalService } from '../services/LoanApprovalService';
import {
  ApprovalPreCheckRequest,
  GetApprovalDetailRequest,
  DoApprovalRequest,
  BatchApprovalQueryParams,
  BatchApprovalRequest,
  ApprovalTraceRequest,
  GenerateContractRequest
} from '../types/loanApproval';

export class LoanApprovalController {
  private approvalService: LoanApprovalService;

  constructor() {
    this.approvalService = new LoanApprovalService();
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { loan_id } = req.body as ApprovalPreCheckRequest;
      const result = await this.approvalService.preCheckApproval(loan_id, req.userId);
      sendSuccess(res, result, '审批前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loanId = req.params.id;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.approvalService.getApprovalDetail(loanId, req.userId, userRoles);
      sendSuccess(res, result, '获取审批详情成功');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DoApprovalRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.approvalService.doApproval(
        request,
        req.userId!,
        req.user?.real_name || req.user?.username || '未知用户',
        userRoles,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, result, result.message || '审批操作成功');
    } catch (error) {
      next(error);
    }
  }

  async pendingList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: BatchApprovalQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        loan_no: req.query.loan_no as string,
        customer_name: req.query.customer_name as string,
        id_card_no: req.query.id_card_no as string,
        loan_type: req.query.loan_type ? Number(req.query.loan_type) : undefined,
        approval_status: req.query.approval_status ? Number(req.query.approval_status) : undefined,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        risk_level: req.query.risk_level ? Number(req.query.risk_level) : undefined,
        current_level: req.query.current_level ? Number(req.query.current_level) : undefined,
        is_high_risk: req.query.is_high_risk ? req.query.is_high_risk === 'true' : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.approvalService.getPendingApprovalList(
        params,
        req.userId,
        userRoles,
        req.user?.org_id
      );
      sendSuccessPage(res, result, '获取待审批列表成功');
    } catch (error) {
      next(error);
    }
  }

  async batchApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchApprovalRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.approvalService.batchApproval(
        request,
        req.userId!,
        req.user?.real_name || req.user?.username || '未知用户',
        userRoles,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(
        res,
        result,
        `批量审批完成：成功${result.success_count}笔，失败${result.fail_count}笔`
      );
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ApprovalTraceRequest = req.body;
      const result = await this.approvalService.traceApproval(request, req.userId);
      sendSuccess(res, result, '审批溯源查询完成');
    } catch (error) {
      next(error);
    }
  }

  async generateContract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { loan_id } = req.body as GenerateContractRequest;
      const result = await this.approvalService.generateContract(loan_id);
      sendSuccess(res, result, '贷款合同生成成功');
    } catch (error) {
      next(error);
    }
  }
}
