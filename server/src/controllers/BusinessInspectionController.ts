import { Request, Response, NextFunction } from 'express';
import businessInspectionService from '@services/BusinessInspectionService';
import { success, paginated } from '@utils/response';

export async function getInspectionById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await businessInspectionService.getInspectionById(id);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function getInspectionList(req: Request, res: Response, next: NextFunction) {
  try {
    const params = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      inspectionNo: req.query.inspectionNo as string | undefined,
      inspectionCycle: req.query.inspectionCycle as string | undefined,
      inspectionStatus: req.query.inspectionStatus as string | undefined,
      inspectionScope: req.query.inspectionScope as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const result = await businessInspectionService.getInspectionList(params);
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) { next(err); }
}

export async function getIssueList(req: Request, res: Response, next: NextFunction) {
  try {
    const params = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      inspectionId: req.query.inspectionId ? Number(req.query.inspectionId) : undefined,
      violationLevel: req.query.violationLevel as string | undefined,
      issueStatus: req.query.issueStatus as string | undefined,
      scope: req.query.scope as string | undefined,
      businessType: req.query.businessType as string | undefined,
      archived: req.query.archived !== undefined ? req.query.archived === 'true' : undefined,
    };
    const result = await businessInspectionService.getIssueList(params);
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) { next(err); }
}

export async function getInspectionLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await businessInspectionService.getInspectionLogs(id);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function preCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const permissions = (req as any).user?.permissions || [];
    const result = await businessInspectionService.preCheck(req.body, permissions);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function createInspection(req: Request, res: Response, next: NextFunction) {
  try {
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const result = await businessInspectionService.createInspection(req.body, operatorId, operatorName);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function startInspection(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const permissions = (req as any).user?.permissions || [];
    const result = await businessInspectionService.startInspection(id, operatorId, operatorName, permissions);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function batchProcessIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const operatorName = (req as any).user?.username || 'system';
    const result = await businessInspectionService.batchProcessIssues(req.body, operatorName);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function batchPreviewIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const result = await businessInspectionService.batchPreviewIssues(ids);
    res.json(success(result));
  } catch (err) { next(err); }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await businessInspectionService.getStats();
    res.json(success(result));
  } catch (err) { next(err); }
}
