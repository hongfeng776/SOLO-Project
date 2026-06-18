import { Request, Response } from 'express';
import { promoterRiskService } from '../services';
import { promoterRiskRecordDao, promoterRiskReleaseDao, promoterRiskWarningDao } from '../dao';
import ResponseUtils from '../utils/response';

class PromoterRiskController {
  public async getRiskList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = {
        page,
        pageSize,
        riskLevel: req.query.riskLevel as string,
        riskType: req.query.riskType as string,
        controlStatus: req.query.controlStatus !== undefined ? Number(req.query.controlStatus) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };
      const result = await promoterRiskService.getRiskList(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getRiskDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await promoterRiskRecordDao.findByPk(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getRiskProfile(req: Request, res: Response): Promise<void> {
    try {
      const { promoterId } = req.params;
      const result = await promoterRiskService.getRiskProfile(promoterId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getRiskAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { promoterId } = req.params;
      const result = await promoterRiskService.getPromoterRiskAnalysis(promoterId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async markRisk(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { promoterId, ...data } = req.body;
      const result = await promoterRiskService.markRisk(promoterId, operatorId, data);
      ResponseUtils.success(res, result, '风控标记成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async cancelRisk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = (req as any).user?.id || '';
      await promoterRiskService.cancelRisk(id, operatorId);
      ResponseUtils.success(res, null, '风控解除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getReleaseList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = {
        page,
        pageSize,
        verifyStatus: req.query.verifyStatus !== undefined ? Number(req.query.verifyStatus) : undefined,
        promoterId: req.query.promoterId as string,
      };
      const result = await promoterRiskReleaseDao.findAllPaged(params);
      ResponseUtils.paginated(res, result.rows, result.count, page, pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async submitRelease(req: Request, res: Response): Promise<void> {
    try {
      const applicantId = (req as any).user?.id || '';
      const { promoterId, ...data } = req.body;
      const result = await promoterRiskService.submitRelease(promoterId, applicantId, data);
      ResponseUtils.success(res, result, '解除申请提交成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async reviewRelease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reviewerId = (req as any).user?.id || '';
      const { passed, verifyRemark, restoreStage } = req.body;
      await promoterRiskService.reviewRelease(id, reviewerId, { passed, verifyRemark, restoreStage });
      ResponseUtils.success(res, null, passed ? '审核通过成功' : '审核驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchMarkRisk(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { ids, ...data } = req.body;
      const result = await promoterRiskService.batchMarkRisk(ids, operatorId, data);
      ResponseUtils.success(res, result, '批量风控标记完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchCancelRisk(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { ids } = req.body;
      const result = await promoterRiskService.batchCancelRisk(ids, operatorId);
      ResponseUtils.success(res, result, '批量风控解除完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getBehaviorTrace(req: Request, res: Response): Promise<void> {
    try {
      const { promoterId } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = {
        page,
        pageSize,
        behaviorType: req.query.behaviorType as string,
        riskFlagged: req.query.riskFlagged !== undefined ? req.query.riskFlagged === 'true' : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await promoterRiskService.getBehaviorTrace(promoterId, params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getWarningList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = {
        page,
        pageSize,
        warningLevel: req.query.warningLevel as string,
        isHandled: req.query.isHandled !== undefined ? req.query.isHandled === 'true' : undefined,
        promoterId: req.query.promoterId as string,
      };
      const result = await promoterRiskWarningDao.findAllPaged(params);
      ResponseUtils.paginated(res, result.rows, result.count, page, pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async handleWarning(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { handleRemark } = req.body;
      await promoterRiskWarningDao.update(id, {
        isHandled: true,
        handleRemark,
        handledAt: new Date(),
      } as any);
      ResponseUtils.success(res, null, '预警处理成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await promoterRiskService.getStatistics(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }
}

export default new PromoterRiskController();
