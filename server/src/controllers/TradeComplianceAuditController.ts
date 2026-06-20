import { Request, Response, NextFunction } from 'express';
import tradeComplianceAuditService from '@services/TradeComplianceAuditService';
import { success, paginated } from '@utils/response';

export async function getAuditById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await tradeComplianceAuditService.getAuditById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getAuditList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const params = {
      page,
      pageSize,
      complianceStatus: req.query.complianceStatus as string | undefined,
      riskCategory: req.query.riskCategory as string | undefined,
      reviewType: req.query.reviewType as string | undefined,
      tradeType: req.query.tradeType as string | undefined,
      keyword: req.query.keyword as string | undefined,
      timeoutOnly: req.query.timeoutOnly === 'true',
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      violationType: req.query.violationType as string | undefined,
    };
    const result = await tradeComplianceAuditService.getAuditList(params);
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const auditId = Number(req.params.id);
    const result = await tradeComplianceAuditService.getAuditLogs(auditId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function preCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const reviewerId = (req as any).user?.userId || 0;
    const result = await tradeComplianceAuditService.preCheck(id, reviewerId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeComplianceAuditService.createAudit(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function approveAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const reviewerId = (req as any).user?.userId || 0;
    const { opinion } = req.body;
    const result = await tradeComplianceAuditService.approveAudit(id, reviewerId, opinion);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function rejectAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const reviewerId = (req as any).user?.userId || 0;
    const { opinion, violationTypes, violationReasons } = req.body;
    const result = await tradeComplianceAuditService.rejectAudit(id, reviewerId, opinion, violationTypes, violationReasons);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewerId = (req as any).user?.userId || 0;
    const { ids, auditStatus, opinion, violationTypes, violationReasons } = req.body;
    const result = await tradeComplianceAuditService.batchAudit(ids, reviewerId, auditStatus, opinion, violationTypes, violationReasons);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const result = await tradeComplianceAuditService.batchPreview(ids);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function markTimeout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeComplianceAuditService.markTimeout();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tradeComplianceAuditService.getStats();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
