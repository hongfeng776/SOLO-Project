import { Request, Response } from 'express';
import { promoterAuditService } from '../services';
import ResponseUtils from '../utils/response';
import { AuditStage, AuditStatus } from '../constants/enum';

class PromoterAuditController {
  public async preCheck(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterAuditService.preCheckApplyData(req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async submitApply(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterAuditService.submitApply(req.body);
      ResponseUtils.created(res, result, '申请提交成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code, err.details);
    }
  }

  public async getAuditList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const auditStageList = req.query.auditStageList
        ? (req.query.auditStageList as string).split(',').map(Number)
        : undefined;
      const auditStatusList = (req.query.auditStatusList
        ? (req.query.auditStatusList as string).split(',')
        : undefined) as any;
      const params = {
        page,
        pageSize,
        keyword: req.query.keyword as string,
        auditStageList,
        auditStatusList,
        channelId: req.query.channelId as string,
        level: req.query.level as string,
        phone: req.query.phone as string,
        idCard: req.query.idCard as string,
        riskFlagged: req.query.riskFlagged === 'true' ? true : req.query.riskFlagged === 'false' ? false : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await promoterAuditService.getAuditList(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getAuditDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await promoterAuditService.getAuditDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async firstAuditPass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditUserId = (req as any).user?.id || '';
      const { remark } = req.body || {};
      await promoterAuditService.firstAuditPass(id, auditUserId, remark);
      ResponseUtils.success(res, null, '初审通过成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async firstAuditReject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditUserId = (req as any).user?.id || '';
      const { reasonCode, customRemark, lockDays } = req.body;
      await promoterAuditService.firstAuditReject(id, auditUserId, {
        reasonCode,
        customRemark,
        lockDays,
      });
      ResponseUtils.success(res, null, '初审驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async secondAuditPass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditUserId = (req as any).user?.id || '';
      const { remark } = req.body || {};
      await promoterAuditService.secondAuditPass(id, auditUserId, remark);
      ResponseUtils.success(res, null, '复审通过成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async secondAuditReject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditUserId = (req as any).user?.id || '';
      const { reasonCode, customRemark, lockDays } = req.body;
      await promoterAuditService.secondAuditReject(id, auditUserId, {
        reasonCode,
        customRemark,
        lockDays,
      });
      ResponseUtils.success(res, null, '复审驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchFirstPass(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const auditUserId = (req as any).user?.id || '';
      const result = await promoterAuditService.batchFirstPass(ids, auditUserId);
      ResponseUtils.success(res, result, '批量初审通过完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchSecondPass(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const auditUserId = (req as any).user?.id || '';
      const result = await promoterAuditService.batchSecondPass(ids, auditUserId);
      ResponseUtils.success(res, result, '批量复审通过完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchFirstReject(req: Request, res: Response): Promise<void> {
    try {
      const { ids, reasonCode, customRemark, lockDays } = req.body;
      const auditUserId = (req as any).user?.id || '';
      const result = await promoterAuditService.batchFirstReject(ids, auditUserId, {
        reasonCode,
        customRemark,
        lockDays,
      });
      ResponseUtils.success(res, result, '批量初审驳回完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchSecondReject(req: Request, res: Response): Promise<void> {
    try {
      const { ids, reasonCode, customRemark, lockDays } = req.body;
      const auditUserId = (req as any).user?.id || '';
      const result = await promoterAuditService.batchSecondReject(ids, auditUserId, {
        reasonCode,
        customRemark,
        lockDays,
      });
      ResponseUtils.success(res, result, '批量复审驳回完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async searchAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        phone: req.query.phone as string,
        idCard: req.query.idCard as string,
        promoterId: req.query.promoterId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await promoterAuditService.searchAuditLogs(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterAuditService.getStatistics();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRejectReasons(req: Request, res: Response): Promise<void> {
    try {
      const { REJECT_REASONS } = require('../constants/enum');
      ResponseUtils.success(res, REJECT_REASONS);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PromoterAuditController();
