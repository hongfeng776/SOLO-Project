import { Request, Response, NextFunction } from 'express';
import complianceAuditService from '@services/ComplianceAuditService';
import { success, paginated } from '@utils/response';

export async function getAuditById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await complianceAuditService.getAuditById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getAuditList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const auditType = req.query.auditType as string | undefined;
    const auditStatus = req.query.auditStatus as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const result = await complianceAuditService.getAuditList({ page, pageSize, auditType, auditStatus, targetType, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getAuditByNo(req: Request, res: Response, next: NextFunction) {
  try {
    const auditNo = req.params.auditNo;
    const result = await complianceAuditService.getAuditByNo(auditNo);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await complianceAuditService.createAudit(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function approveAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { auditorId, opinion } = req.body;
    const result = await complianceAuditService.approveAudit(id, auditorId, opinion);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function rejectAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { auditorId, opinion } = req.body;
    const result = await complianceAuditService.rejectAudit(id, auditorId, opinion);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function updateAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await complianceAuditService.updateAudit(id, req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await complianceAuditService.deleteAudit(id);
    res.json(success(null));
  } catch (err) {
    next(err);
  }
}
