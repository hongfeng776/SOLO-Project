import { Request, Response, NextFunction } from 'express';
import dashboardService from '@services/DashboardService';
import { success } from '@utils/response';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getStats();
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getRecentFlows(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit) || 10;
    const result = await dashboardService.getRecentFlows(limit);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getRecentAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit) || 10;
    const result = await dashboardService.getRecentAlerts(limit);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getAssetTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days) || 7;
    const result = await dashboardService.getAssetTrend(days);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
