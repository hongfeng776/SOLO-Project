import { Request, Response } from 'express';
import { activityLifecycleService } from '../services';
import ResponseUtils from '../utils/response';
import { MarketingStatus } from '../constants/enum';

class ActivityLifecycleController {
  public async validateTransition(req: Request, res: Response): Promise<void> {
    try {
      const { currentStatus, targetStatus } = req.body;
      const result = activityLifecycleService.validateStatusTransition(
        Number(currentStatus) as MarketingStatus,
        Number(targetStatus) as MarketingStatus
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkEditPermission(req: Request, res: Response): Promise<void> {
    try {
      const { status, fields } = req.body;
      const result = activityLifecycleService.checkEditPermission(
        Number(status) as MarketingStatus,
        fields
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await activityLifecycleService.getActivityParticipationData(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkPausePreconditions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await activityLifecycleService.checkPausePreconditions(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkResumePreconditions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await activityLifecycleService.checkResumePreconditions(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async pauseActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await activityLifecycleService.pauseActivity(id, (req as any).user?.id, reason);
      ResponseUtils.success(res, result, '活动已暂停');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async resumeActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await activityLifecycleService.resumeActivity(id, (req as any).user?.id);
      ResponseUtils.success(res, result, '活动已恢复');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchPauseExpired(req: Request, res: Response): Promise<void> {
    try {
      const result = await activityLifecycleService.batchPauseExpiredActivities((req as any).user?.id);
      ResponseUtils.success(res, result, '批量暂停过期活动完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchCancelNotStarted(req: Request, res: Response): Promise<void> {
    try {
      const { ids, reason } = req.body;
      const result = await activityLifecycleService.batchCancelNotStartedActivities(
        ids,
        (req as any).user?.id,
        reason
      );
      ResponseUtils.success(res, result, '批量作废未生效活动完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchEndExpired(req: Request, res: Response): Promise<void> {
    try {
      const result = await activityLifecycleService.batchEndExpiredActivities((req as any).user?.id);
      ResponseUtils.success(res, result, '批量结束过期活动完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime } = req.query;
      const result = await activityLifecycleService.generateStatusChangeReport(
        new Date(startTime as string),
        new Date(endTime as string)
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStatusChangeLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await activityLifecycleService.getStatusChangeLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { currentStatus, targetStatus } = req.body;
      const result = activityLifecycleService.validateStatusChangeCompliance(
        Number(currentStatus) as MarketingStatus,
        Number(targetStatus) as MarketingStatus
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new ActivityLifecycleController();
