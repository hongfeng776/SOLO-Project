import { Request, Response, NextFunction } from 'express';
import riskAlertService from '@services/RiskAlertService';
import { success, paginated } from '@utils/response';

export async function getAlertList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const alertType = req.query.alertType as string | undefined;
    const alertLevel = req.query.alertLevel as string | undefined;
    const alertStatus = req.query.alertStatus as string | undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await riskAlertService.getAlertList({ page, pageSize, alertType, alertLevel, alertStatus, customerId, startDate, endDate });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getAlertById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await riskAlertService.getAlertById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function createAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await riskAlertService.createAlert(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function confirmAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { handlerId, opinion } = req.body;
    const result = await riskAlertService.confirmAlert(id, handlerId || (req as any).user?.id, opinion || '');
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function resolveAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { handlerId, opinion } = req.body;
    const result = await riskAlertService.resolveAlert(id, handlerId || (req as any).user?.id, opinion || '');
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function ignoreAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { handlerId, opinion } = req.body;
    const result = await riskAlertService.ignoreAlert(id, handlerId || (req as any).user?.id, opinion || '');
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
