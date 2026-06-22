import { Request, Response } from 'express';
import { participationRiskControlService } from '../services';
import ResponseUtils from '../utils/response';
import { ParticipationEligibilityStatus, ParticipationUserType } from '../constants/enum';

class ParticipationRiskControlController {
  public async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId, userId, userType } = req.body;
      const result = await participationRiskControlService.checkEligibility(
        marketingId,
        userId,
        userType as ParticipationUserType
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async registerParticipation(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId, userId, userType, ipAddress, deviceFingerprint } = req.body;
      const result = await participationRiskControlService.registerParticipation(
        marketingId,
        userId,
        userType as ParticipationUserType,
        ipAddress,
        deviceFingerprint
      );
      ResponseUtils.success(res, result, '参与报名成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async approveParticipation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await participationRiskControlService.approveParticipation(
        id,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result, '参与资格审核通过');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async rejectParticipation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await participationRiskControlService.rejectParticipation(
        id,
        (req as any).user?.id,
        reason
      );
      ResponseUtils.success(res, result, '参与资格已拒绝');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationStats(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId } = req.params;
      const result = await participationRiskControlService.getParticipationStats(marketingId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId } = req.params;
      const result = await participationRiskControlService.detectAnomalies(marketingId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async flagAnomaly(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { anomalyTypes, reason } = req.body;
      const result = await participationRiskControlService.flagAnomaly(
        id,
        anomalyTypes,
        (req as any).user?.id,
        reason
      );
      ResponseUtils.success(res, result, '异常标记成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async restrictUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await participationRiskControlService.restrictUser(id, reason);
      ResponseUtils.success(res, result, '用户已限制');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async resolveAnomaly(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await participationRiskControlService.resolveAnomaly(
        id,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result, '异常已解除');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchApprove(req: Request, res: Response): Promise<void> {
    try {
      const { participationIds } = req.body;
      const result = await participationRiskControlService.batchApproveEligibility(
        participationIds,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result, '批量审核完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchRevoke(req: Request, res: Response): Promise<void> {
    try {
      const { participationIds, reason } = req.body;
      const result = await participationRiskControlService.batchRevokeViolations(
        participationIds,
        (req as any).user?.id,
        reason
      );
      ResponseUtils.success(res, result, '批量剔除完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationList(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const eligibilityStatus = req.query.eligibilityStatus !== undefined
        ? Number(req.query.eligibilityStatus) as ParticipationEligibilityStatus
        : undefined;
      const isAnomaly = req.query.isAnomaly === 'true' ? true : req.query.isAnomaly === 'false' ? false : undefined;
      const result = await participationRiskControlService.getParticipationList(marketingId, {
        page,
        pageSize,
        eligibilityStatus,
        isAnomaly,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await participationRiskControlService.getParticipationDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getParticipationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await participationRiskControlService.getParticipationLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async verifyAuthenticity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await participationRiskControlService.verifyParticipationAuthenticity(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async blockFakeParticipation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await participationRiskControlService.blockFakeParticipation(
        id,
        (req as any).user?.id
      );
      ResponseUtils.success(res, result, '虚假参与已拦截');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new ParticipationRiskControlController();
