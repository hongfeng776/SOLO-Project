import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { TransactionService } from '../services';
import { TransactionQueryParams, CreateTransactionRequest, UpdateTransactionRequest, TransactionType, TransactionStatus, AuditStatus } from '../types';

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
        type: req.query.type ? Number(req.query.type) as TransactionType : undefined,
        status: req.query.status ? Number(req.query.status) as TransactionStatus : undefined,
        audit_status: req.query.audit_status ? Number(req.query.audit_status) as AuditStatus : undefined,
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
}
