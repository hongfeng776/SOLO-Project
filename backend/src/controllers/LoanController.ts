import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { LoanService } from '../services';
import {
  LoanPreCheckRequest,
  CreateLoanRequest,
  LoanQueryParams,
  BatchLoanRequest,
  BatchLoanReviewRequest,
  LoanTraceRequest
} from '../types';

export class LoanController {
  private loanService: LoanService;

  constructor() {
    this.loanService = new LoanService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.loanService.getLoanConfig();
      sendSuccess(res, result, '获取贷款配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: LoanPreCheckRequest = req.body;
      const result = await this.loanService.preCheckLoan(request);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: LoanQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        loan_no: req.query.loan_no as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        id_card_no: req.query.id_card_no as string,
        loan_type: req.query.loan_type ? Number(req.query.loan_type) as any : undefined,
        product_id: req.query.product_id as string,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        operator_id: req.query.operator_id as string,
        reviewer_id: req.query.reviewer_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        is_pre_approved: req.query.is_pre_approved ? req.query.is_pre_approved === 'true' : undefined,
        is_final_approved: req.query.is_final_approved ? req.query.is_final_approved === 'true' : undefined
      };
      const result = await this.loanService.getLoanList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取贷款列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.loanService.getLoanById(req.params.id);
      sendSuccess(res, result, '获取贷款详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateLoanRequest = req.body;
      const result = await this.loanService.createLoan(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '贷款申请提交成功');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const result = await this.loanService.cancelLoan(req.params.id, req.userId!, reason);
      sendSuccess(res, result, '贷款申请已撤销，流程数据已清空');
    } catch (error) {
      next(error);
    }
  }

  async preApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { approved, opinion } = req.body;
      const result = await this.loanService.preApproveLoan(req.params.id, req.userId!, approved, opinion);
      sendSuccess(res, result, `预审${approved ? '通过' : '拒绝'}成功`);
    } catch (error) {
      next(error);
    }
  }

  async finalApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { approved, opinion } = req.body;
      const result = await this.loanService.finalApproveLoan(req.params.id, req.userId!, approved, opinion);
      sendSuccess(res, result, `终审${approved ? '通过' : '拒绝'}成功`);
    } catch (error) {
      next(error);
    }
  }

  async batchPreCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchLoanRequest = req.body;
      const result = await this.loanService.batchPreCheckLoan(request);
      sendSuccess(res, result, '批量预审校验完成');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchLoanRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.loanService.batchLoan(request, req.userId!, userRoles);
      sendSuccess(res, result, `批量贷款申请处理完成：成功${result.success_count}条，失败${result.fail_count}条，待复核${result.review_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async batchReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchLoanReviewRequest = req.body;
      const result = await this.loanService.batchReview(request, req.userId!);
      sendSuccess(res, result, `批量复核完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: LoanTraceRequest = req.body;
      const result = await this.loanService.traceLoan(request);
      sendSuccess(res, result, '贷款溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
