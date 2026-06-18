import { Request, Response } from 'express';
import { channelAuditService } from '../services';
import ResponseUtils from '../utils/response';

class ChannelAuditController {
  public async preCheck(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const result = await channelAuditService.preCheckApplyData(data);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async submitApply(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const result = await channelAuditService.submitApply(data);
      ResponseUtils.created(res, result, '渠道入驻申请提交成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        keyword: req.query.keyword as string,
        auditStageList: req.query.auditStageList ? JSON.parse(req.query.auditStageList as string) : undefined,
        auditStatusList: req.query.auditStatusList ? JSON.parse(req.query.auditStatusList as string) : undefined,
        priority: req.query.priority ? parseInt(req.query.priority as string, 10) : undefined,
        riskFlagged: req.query.riskFlagged ? req.query.riskFlagged === 'true' : undefined,
        contactPhone: req.query.contactPhone as string,
        creditCode: req.query.creditCode as string,
        companyName: req.query.companyName as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isKeyChannel: req.query.isKeyChannel ? req.query.isKeyChannel === 'true' : undefined,
      };
      const result = await channelAuditService.getAuditList(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await channelAuditService.getAuditDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async dataReviewPass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.dataReviewPass(id, userId, remark);
      ResponseUtils.success(res, null, '资料初审通过');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async dataReviewReject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.dataReviewReject(id, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, null, '资料初审驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async qualificationVerifyPass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.qualificationVerifyPass(id, userId, remark);
      ResponseUtils.success(res, null, '资质核验通过');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async qualificationVerifyReject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.qualificationVerifyReject(id, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, null, '资质核验驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async permissionActivatePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.permissionActivatePass(id, userId, remark);
      ResponseUtils.success(res, null, '权限开通成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async permissionActivateReject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      await channelAuditService.permissionActivateReject(id, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, null, '权限开通驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchDataPass(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchDataPass(ids, userId);
      ResponseUtils.success(res, result, '批量资料初审通过完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchQualificationPass(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchQualificationPass(ids, userId);
      ResponseUtils.success(res, result, '批量资质核验通过完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchPermissionPass(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchPermissionPass(ids, userId);
      ResponseUtils.success(res, result, '批量权限开通完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchDataReject(req: Request, res: Response): Promise<void> {
    try {
      const { ids, issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchDataReject(ids, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, result, '批量资料初审驳回完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchQualificationReject(req: Request, res: Response): Promise<void> {
    try {
      const { ids, issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchQualificationReject(ids, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, result, '批量资质核验驳回完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchPermissionReject(req: Request, res: Response): Promise<void> {
    try {
      const { ids, issueTypes, customRemark, lockDays } = req.body;
      const userId = (req as any).userId;
      const result = await channelAuditService.batchPermissionReject(ids, userId, { issueTypes, customRemark, lockDays });
      ResponseUtils.success(res, result, '批量权限开通驳回完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        channelAuditId: req.query.channelAuditId as string,
        operatorId: req.query.operatorId as string,
        action: req.query.action as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await channelAuditService.searchAuditLogs(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await channelAuditService.getStatistics();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new ChannelAuditController();
