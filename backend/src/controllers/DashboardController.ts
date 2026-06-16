import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { DashboardService } from '../services';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async overview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startTime, endTime, orgId } = req.query;
      const result = await this.dashboardService.getOverviewStatistics(
        startTime as string,
        endTime as string,
        orgId as string
      );
      sendSuccess(res, result, '获取概览统计成功');
    } catch (error) {
      next(error);
    }
  }

  async channel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startTime, endTime, orgId } = req.query;
      const result = await this.dashboardService.getChannelStatistics(
        startTime as string,
        endTime as string,
        orgId as string
      );
      sendSuccess(res, result, '获取渠道统计成功');
    } catch (error) {
      next(error);
    }
  }

  async trend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days, orgId } = req.query;
      const daysNum = days ? parseInt(days as string) : 7;
      const result = await this.dashboardService.getBusinessTrend(daysNum, orgId as string);
      sendSuccess(res, result, '获取业务趋势成功');
    } catch (error) {
      next(error);
    }
  }

  async audit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startTime, endTime, orgId } = req.query;
      const result = await this.dashboardService.getAuditStatistics(
        startTime as string,
        endTime as string,
        orgId as string
      );
      sendSuccess(res, result, '获取审核统计成功');
    } catch (error) {
      next(error);
    }
  }

  async risk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startTime, endTime, orgId } = req.query;
      const result = await this.dashboardService.getRiskStatistics(
        startTime as string,
        endTime as string,
        orgId as string
      );
      sendSuccess(res, result, '获取风险统计成功');
    } catch (error) {
      next(error);
    }
  }

  async org(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orgId } = req.query;
      const result = await this.dashboardService.getOrgStatistics(orgId as string);
      sendSuccess(res, result, '获取机构统计成功');
    } catch (error) {
      next(error);
    }
  }

  async customer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startTime, endTime } = req.query;
      const result = await this.dashboardService.getCustomerStatistics(
        startTime as string,
        endTime as string
      );
      sendSuccess(res, result, '获取客户统计成功');
    } catch (error) {
      next(error);
    }
  }
}
