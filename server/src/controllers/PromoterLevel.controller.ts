import { Request, Response } from 'express';
import { promoterLevelService } from '../services';
import ResponseUtils from '../utils/response';

class PromoterLevelController {
  public async getAllRules(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterLevelService.getAllEffectiveRules();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async saveLevelRule(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const result = await promoterLevelService.saveLevelRule(req.body, operatorId);
      ResponseUtils.success(res, result, '规则保存成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async validateThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { level } = req.params;
      const result = await promoterLevelService.validateThresholds(level, req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchReEvaluate(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const result = await promoterLevelService.batchReEvaluateAllLevels(operatorId);
      ResponseUtils.success(res, result, '批量重评完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async requestManualAdjust(req: Request, res: Response): Promise<void> {
    try {
      const applicantId = (req as any).user?.id || '';
      const { promoterId, targetLevel, adjustReason } = req.body;
      const result = await promoterLevelService.requestManualAdjust(
        promoterId,
        applicantId,
        targetLevel,
        adjustReason
      );
      ResponseUtils.success(res, result, result.autoApproved ? '业绩达标，已自动升级' : '调整申请已提交');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async reviewAdjust(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const approverId = (req as any).user?.id || '';
      const { approved, approveRemark } = req.body;
      await promoterLevelService.reviewManualAdjust(id, approverId, approved, approveRemark);
      ResponseUtils.success(res, null, approved ? '审核通过成功' : '审核驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getAdjustRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = {
        page,
        pageSize,
        promoterId: req.query.promoterId as string,
        approveStatus: req.query.approveStatus as string,
        applicantId: req.query.applicantId as string,
      };
      const result = await promoterLevelService.getAdjustRequests(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchResetLevels(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { ids, resetTo } = req.body;
      const result = await promoterLevelService.batchResetLevels(ids, operatorId, resetTo);
      ResponseUtils.success(res, result, '批量重置完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getChangeLogs(req: Request, res: Response): Promise<void> {
    try {
      const { promoterId } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const result = await promoterLevelService.getChangeLogs(promoterId, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getIterationStats(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await promoterLevelService.getIterationStatistics(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }
}

export default new PromoterLevelController();
