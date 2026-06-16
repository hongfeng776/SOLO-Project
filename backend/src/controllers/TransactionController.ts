import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { TransactionService } from '../services';
import { TransactionQueryParams, CreateTransactionRequest, UpdateTransactionRequest, TransactionType, TransactionStatus, AuditStatus, BatchOperationRequest } from '../types';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: TransactionQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        transaction_no: req.query.transaction_no as string,
        channel_code: req.query.channel_code as string,
        business_line: req.query.business_line as string,
        customer_id: req.query.customer_id as string,
        customer_no: req.query.customer_no as string,
        type: req.query.type ? Number(req.query.type) as TransactionType : undefined,
        status: req.query.status ? Number(req.query.status) as TransactionStatus : undefined,
        audit_status: req.query.audit_status ? Number(req.query.audit_status) as AuditStatus : undefined,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) as any : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
        max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined
      };
      const result = await this.transactionService.getTransactionList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取交易流水列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.getTransactionById(req.params.id);
      sendSuccess(res, result, '获取交易详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateTransactionRequest = req.body;
      const result = await this.transactionService.createTransaction(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '创建交易成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UpdateTransactionRequest = req.body;
      const result = await this.transactionService.updateTransaction(req.params.id, request);
      sendSuccess(res, result, '更新交易成功');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.cancelTransaction(req.params.id, req.userId!);
      sendSuccess(res, result, '撤销交易成功');
    } catch (error) {
      next(error);
    }
  }

  async freeze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.freezeTransaction(req.params.id, req.userId!, req.body?.remark);
      sendSuccess(res, result, '冻结交易成功');
    } catch (error) {
      next(error);
    }
  }

  async reverse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.reverseTransaction(req.params.id, req.userId!, req.body?.remark);
      sendSuccess(res, result, '冲正交易成功');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchOperationRequest = req.body;
      const result = await this.transactionService.batchOperation(request, req.userId!);
      sendSuccess(res, result, `批量操作完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.syncChannelTransaction(req.body);
      sendSuccess(res, result, '渠道交易同步成功');
    } catch (error) {
      next(error);
    }
  }

  async statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.transactionService.getTransactionStatistics(
        req.query.start_time as string,
        req.query.end_time as string,
        req.user?.org_id
      );
      sendSuccess(res, result, '获取交易统计成功');
    } catch (error) {
      next(error);
    }
  }
}
