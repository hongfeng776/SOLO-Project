import { Request, Response } from 'express';
import { distributionActivityService } from '../services';
import ResponseUtils from '../utils/response';
import { ActivityCreateParams, ActivityUpdateParams, RewardPreviewRequest, BatchCopyParams } from '../services/DistributionActivity.service';

class DistributionActivityController {
  public async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const data: ActivityCreateParams = {
        ...req.body,
        operatorId: (req as any).user?.id,
      };
      const result = await distributionActivityService.createDistributionActivity(data);
      ResponseUtils.created(res, result, '分销活动创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getActivityDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await distributionActivityService.getActivityDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ActivityUpdateParams = {
        ...req.body,
        operatorId: (req as any).user?.id,
      };
      const result = await distributionActivityService.updateDistributionActivity(id, data);
      ResponseUtils.success(res, result, '分销活动更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkTimeConflict(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, excludeId, marketingType } = req.query;
      const result = await distributionActivityService.checkTimeConflict(
        new Date(startTime as string),
        new Date(endTime as string),
        excludeId as string,
        marketingType as any
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getSubmitToken(req: Request, res: Response): Promise<void> {
    try {
      const token = await distributionActivityService.getSubmitToken();
      ResponseUtils.success(res, { token }, '防重复提交令牌生成成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateRewardRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleType, ladderConfigs, rankingConfigs, fullAmountConfigs } = req.body;
      const result = distributionActivityService.validateRewardRule(
        ruleType,
        ladderConfigs,
        rankingConfigs,
        fullAmountConfigs
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async previewActivityReward(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId, ...params } = req.body;
      const result = await distributionActivityService.previewActivityReward(
        marketingId || 'preview',
        params,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }



  public async batchCopyTemplates(req: Request, res: Response): Promise<void> {
    try {
      const data: BatchCopyParams = {
        ...req.body,
        operatorId: (req as any).user?.id,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };
      const result = await distributionActivityService.batchCopyTemplates(data);
      ResponseUtils.success(res, result, '批量复制模板成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchCreateSimilar(req: Request, res: Response): Promise<void> {
    try {
      const { sourceActivityId, count, timeOffsetDays } = req.body;
      const result = await distributionActivityService.batchCreateSimilarActivities(
        sourceActivityId,
        count,
        timeOffsetDays,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result, '批量创建同类活动成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchUpdateActivityTimes(req: Request, res: Response): Promise<void> {
    try {
      const { activityIds, startTime, endTime, autoAdjustTime } = req.body;
      const result = await distributionActivityService.batchUpdateActivityTimes(
        activityIds,
        new Date(startTime),
        new Date(endTime),
        autoAdjustTime
      );
      ResponseUtils.success(res, result, '批量更新活动时间成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateActivitySort(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sort } = req.body;
      await distributionActivityService.updateActivitySort(
        [{ id, sort }],
        (req as any).user?.id
      );
      ResponseUtils.success(res, null, '活动排序更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchUpdateSorts(req: Request, res: Response): Promise<void> {
    try {
      const { sorts } = req.body;
      await distributionActivityService.updateActivitySort(
        sorts,
        (req as any).user?.id
      );
      ResponseUtils.success(res, null, '批量更新活动排序成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getTemplateList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        keyword: req.query.keyword as string,
        category: req.query.category as string,
      };
      const result = await distributionActivityService.getTemplateList(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getActivityOperationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await distributionActivityService.getActivityOperationLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await distributionActivityService.getActivityValidation(
        data,
        !!id,
        id
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getMarketingTypeOptions(req: Request, res: Response): Promise<void> {
    try {
      const result = await distributionActivityService.getMarketingTypeOptions();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRewardRuleTypeOptions(req: Request, res: Response): Promise<void> {
    try {
      const result = await distributionActivityService.getRewardRuleTypeOptions();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationThresholdOptions(req: Request, res: Response): Promise<void> {
    try {
      const result = await distributionActivityService.getParticipationThresholdOptions();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new DistributionActivityController();
