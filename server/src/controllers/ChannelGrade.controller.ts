import { Request, Response } from 'express';
import { channelGradeService } from '../services';
import ResponseUtils from '../utils/response';

class ChannelGradeController {
  public async getAllRules(req: Request, res: Response): Promise<void> {
    try {
      const result = await channelGradeService.getAllEffectiveRules();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async saveLevelRule(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const result = await channelGradeService.saveLevelRule(req.body, operatorId);
      ResponseUtils.success(res, result, '规则保存成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async validateRuleParams(req: Request, res: Response): Promise<void> {
    try {
      const result = await channelGradeService.validateRuleParams(req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async validateThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { level } = req.params;
      const result = await channelGradeService.validateThresholds(level, req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async requestManualAdjust(req: Request, res: Response): Promise<void> {
    try {
      const applicantId = (req as any).user?.id || '';
      const { channelId, targetLevel, adjustReason } = req.body;
      const result = await channelGradeService.requestManualAdjust(
        channelId,
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
      await channelGradeService.reviewManualAdjust(id, approverId, approved, approveRemark);
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
        channelId: req.query.channelId as string,
        approveStatus: req.query.approveStatus ? parseInt(req.query.approveStatus as string, 10) : undefined,
        applicantId: req.query.applicantId as string,
      };
      const result = await channelGradeService.getAdjustRequests(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchAdjustLevels(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { ids, targetLevel } = req.body;
      const result = await channelGradeService.batchAdjustLevels(ids, targetLevel, operatorId);
      ResponseUtils.success(res, result, '批量等级调整完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async batchAdjustResources(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || '';
      const { ids, resourceLevel } = req.body;
      const result = await channelGradeService.batchAdjustResources(ids, resourceLevel, operatorId);
      ResponseUtils.success(res, result, '批量资源调整完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getChangeLogs(req: Request, res: Response): Promise<void> {
    try {
      const { channelId } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const result = await channelGradeService.getChangeLogs(channelId, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await channelGradeService.getStatistics();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }
}

export default new ChannelGradeController();
