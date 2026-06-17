import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { DepositService } from '../services';
import {
  DepositPreCheckRequest,
  CreateDepositRequest,
  DepositQueryParams,
  BatchDepositRequest,
  BatchDepositReviewRequest,
  DepositTraceRequest
} from '../types';

export class DepositController {
  private depositService: DepositService;

  constructor() {
    this.depositService = new DepositService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.depositService.getDepositConfig();
      sendSuccess(res, result, '获取存款配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DepositPreCheckRequest = req.body;
      const result = await this.depositService.preCheckDeposit(request, req.userId);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: DepositQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        deposit_no: req.query.deposit_no as string,
        account_no: req.query.account_no as string,
        customer_no: req.query.customer_no as string,
        deposit_type: req.query.deposit_type ? Number(req.query.deposit_type) as any : undefined,
        product_id: req.query.product_id as string,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        operator_id: req.query.operator_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
        term: req.query.term ? Number(req.query.term) as any : undefined
      };
      const result = await this.depositService.getDepositList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取存款列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.depositService.getDepositById(req.params.id);
      sendSuccess(res, result, '获取存款详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateDepositRequest = req.body;
      const result = await this.depositService.createDeposit(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '存款办理成功');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.depositService.cancelDeposit(req.params.id, req.userId!);
      sendSuccess(res, result, '存款撤销成功，账户数据已恢复');
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.depositService.confirmDeposit(req.params.id, req.userId!);
      sendSuccess(res, result, '存款入账成功，账户余额已更新');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchDepositRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.depositService.batchDeposit(request, req.userId!, userRoles);
      sendSuccess(res, result, `批量存款处理完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async batchReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchDepositReviewRequest = req.body;
      const result = await this.depositService.batchReview(request, req.userId!);
      sendSuccess(res, result, `批量审核完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DepositTraceRequest = req.body;
      const result = await this.depositService.traceDeposit(request);
      sendSuccess(res, result, '存款溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
