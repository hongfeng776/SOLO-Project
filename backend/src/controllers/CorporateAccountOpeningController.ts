import { Request, Response } from 'express';
import { CorporateAccountOpeningService } from '../services';
import { sendSuccess } from '../utils/response';
import {
  CorporatePrecheckRequest,
  CreateCorporateOpeningRequest,
  UpdateCorporateOpeningRequest,
  CorporateOpeningQueryParams,
  CorporateBatchImportRequest,
  CorporateBatchReviewRequest,
  CorporateTraceCheckRequest
} from '../types/corporate';

const corporateOpeningService = new CorporateAccountOpeningService();

export class CorporateAccountOpeningController {
  async precheck(req: Request, res: Response) {
    const data = req.body as CorporatePrecheckRequest;
    const result = await corporateOpeningService.precheck(data);
    return sendSuccess(res, result);
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateCorporateOpeningRequest;
    const result = await corporateOpeningService.createOpening(data, (req as any).userId, (req as any).orgId);
    return sendSuccess(res, result);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateCorporateOpeningRequest;
    const result = await corporateOpeningService.updateOpening(id, data, (req as any).userId);
    return sendSuccess(res, result);
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { remark } = req.body || {};
    const result = await corporateOpeningService.cancelOpening(id, (req as any).userId, remark);
    return sendSuccess(res, result);
  }

  async review(req: Request, res: Response) {
    const { id } = req.params;
    const { operation, reason } = req.body;
    const result = await corporateOpeningService.reviewOpening(id, operation, (req as any).userId, reason);
    return sendSuccess(res, result);
  }

  async openAccount(req: Request, res: Response) {
    const { id } = req.params;
    const result = await corporateOpeningService.openAccount(id, (req as any).userId, (req as any).orgId);
    return sendSuccess(res, result);
  }

  async list(req: Request, res: Response) {
    const params = req.query as unknown as CorporateOpeningQueryParams;
    const result = await corporateOpeningService.getOpeningList(params, (req as any).userId, (req as any).orgId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async detail(req: Request, res: Response) {
    const { id } = req.params;
    const result = await corporateOpeningService.getOpeningById(id);
    return sendSuccess(res, result);
  }

  async batchImport(req: Request, res: Response) {
    const data = req.body as CorporateBatchImportRequest;
    const result = await corporateOpeningService.batchImport(data, (req as any).userId, (req as any).orgId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async batchReview(req: Request, res: Response) {
    const data = req.body as CorporateBatchReviewRequest;
    const result = await corporateOpeningService.batchReview(data, (req as any).userId, (req as any).userRoles);
    return sendSuccess(res, result);
  }

  async refresh(req: Request, res: Response) {
    const { id } = req.params;
    const result = await corporateOpeningService.refreshOpening(id);
    return sendSuccess(res, result);
  }

  async traceCheck(req: Request, res: Response) {
    const data = req.body as CorporateTraceCheckRequest;
    const result = await corporateOpeningService.traceCheck(data);
    return sendSuccess(res, result);
  }

  async getConfig(req: Request, res: Response) {
    const result = corporateOpeningService.getCorporateAccountConfig();
    return sendSuccess(res, result);
  }
}
