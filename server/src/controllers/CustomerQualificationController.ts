import { Request, Response, NextFunction } from 'express';
import customerQualificationService from '@services/CustomerQualificationService';
import { success, paginated } from '@utils/response';

export async function getQualificationById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerQualificationService.getQualificationById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getQualificationList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const params = {
      page,
      pageSize,
      qualificationNo: req.query.qualificationNo as string | undefined,
      customerName: req.query.customerName as string | undefined,
      customerType: req.query.customerType as string | undefined,
      qualificationStatus: req.query.qualificationStatus as string | undefined,
      reviewType: req.query.reviewType as string | undefined,
      qualificationLevel: req.query.qualificationLevel as string | undefined,
      tradingAllowed: req.query.tradingAllowed !== undefined ? req.query.tradingAllowed === 'true' : undefined,
    };
    const result = await customerQualificationService.getQualificationList(params);
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getQualificationLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await customerQualificationService.getQualificationLogs(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function preCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const permissions = (req as any).user?.permissions || [];
    const result = await customerQualificationService.preCheck(id, permissions);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createQualification(req: Request, res: Response, next: NextFunction) {
  try {
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const result = await customerQualificationService.createQualification(req.body, operatorId, operatorName);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function approveQualification(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const permissions = (req as any).user?.permissions || [];
    const result = await customerQualificationService.approveQualification(id, req.body, operatorId, operatorName, permissions);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function rejectQualification(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const result = await customerQualificationService.rejectQualification(id, req.body, operatorId, operatorName);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function initiateRecheck(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const result = await customerQualificationService.initiateRecheck(id, operatorId, operatorName);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const operatorId = (req as any).user?.userId || 0;
    const operatorName = (req as any).user?.username || 'system';
    const result = await customerQualificationService.batchOperation(req.body, operatorId, operatorName);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function batchPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    const result = await customerQualificationService.batchPreview(ids);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function checkExpireWarning(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customerQualificationService.checkExpireWarning();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customerQualificationService.getStats();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
