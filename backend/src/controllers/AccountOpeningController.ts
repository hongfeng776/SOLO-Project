import { Request, Response } from 'express';
import { AccountOpeningService, AccountService } from '../services';
import { sendSuccess } from '../utils/response';
import { PrecheckRequest, CreateAccountOpeningRequest, UpdateAccountOpeningRequest, AccountOpeningQueryParams, BatchImportRequest, BatchReviewRequest, TraceCheckRequest } from '../types';

const accountOpeningService = new AccountOpeningService();
const accountService = new AccountService();

export class AccountOpeningController {
  async precheck(req: Request, res: Response) {
    const data = req.body as PrecheckRequest;
    const result = await accountOpeningService.precheck(data);
    return sendSuccess(res, result);
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateAccountOpeningRequest;
    const result = await accountOpeningService.createOpening(data, (req as any).userId, (req as any).orgId);
    return sendSuccess(res, result);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateAccountOpeningRequest;
    const result = await accountOpeningService.updateOpening(id, data, (req as any).userId);
    return sendSuccess(res, result);
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { remark } = req.body || {};
    const result = await accountOpeningService.cancelOpening(id, (req as any).userId, remark);
    return sendSuccess(res, result);
  }

  async review(req: Request, res: Response) {
    const { id } = req.params;
    const { operation, reason } = req.body;
    const result = await accountOpeningService.reviewOpening(id, operation, (req as any).userId, reason);
    return sendSuccess(res, result);
  }

  async openAccount(req: Request, res: Response) {
    const { id } = req.params;
    const result = await accountOpeningService.openAccount(id, (req as any).userId, (req as any).orgId);
    return sendSuccess(res, result);
  }

  async list(req: Request, res: Response) {
    const params = req.query as unknown as AccountOpeningQueryParams;
    const result = await accountOpeningService.getOpeningList(params, (req as any).userId, (req as any).orgId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async detail(req: Request, res: Response) {
    const { id } = req.params;
    const result = await accountOpeningService.getOpeningById(id);
    return sendSuccess(res, result);
  }

  async batchImport(req: Request, res: Response) {
    const data = req.body as BatchImportRequest;
    const result = await accountOpeningService.batchImport(data, (req as any).userId, (req as any).orgId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async batchReview(req: Request, res: Response) {
    const data = req.body as BatchReviewRequest;
    const result = await accountOpeningService.batchReview(data, (req as any).userId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async refresh(req: Request, res: Response) {
    const { id } = req.params;
    const result = await accountOpeningService.refreshOpening(id);
    return sendSuccess(res, result);
  }

  async traceCheck(req: Request, res: Response) {
    const data = req.body as TraceCheckRequest;
    const result = await accountOpeningService.traceCheck(data);
    return sendSuccess(res, result);
  }

  async accountList(req: Request, res: Response) {
    const params = req.query as any;
    const result = await accountService.getAccountList(params, (req as any).userId, (req as any).orgId);
    return sendSuccess(res, result);
  }

  async accountDetail(req: Request, res: Response) {
    const { id } = req.params;
    const result = await accountService.getAccountById(id);
    return sendSuccess(res, result);
  }

  async accountByCustomer(req: Request, res: Response) {
    const { customerId } = req.params;
    const result = await accountService.getAccountsByCustomerId(customerId);
    return sendSuccess(res, result);
  }

  async accountUpdateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, remark } = req.body;
    const result = await accountService.updateAccountStatus(id, Number(status), (req as any).userId, remark);
    return sendSuccess(res, result);
  }
}
