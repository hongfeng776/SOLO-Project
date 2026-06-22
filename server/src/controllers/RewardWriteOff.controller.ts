import { Request, Response } from 'express';
import { rewardWriteOffService } from '../services';
import ResponseUtils from '../utils/response';
import { RewardWriteOffStatus, RewardWriteOffType } from '../constants/enum';

class RewardWriteOffController {
  public async getWriteOffList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params: any = {
        page,
        pageSize,
        marketingId: req.query.marketingId as string,
        userId: req.query.userId as string,
        userType: req.query.userType as string,
        type: req.query.type as RewardWriteOffType,
        status: req.query.status !== undefined ? Number(req.query.status) as RewardWriteOffStatus : undefined,
        writeOffNo: req.query.writeOffNo as string,
      };
      if (req.query.startTime) params.startTime = new Date(req.query.startTime as string);
      if (req.query.endTime) params.endTime = new Date(req.query.endTime as string);
      const result = await rewardWriteOffService.getWriteOffList(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getWriteOffDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await rewardWriteOffService.getWriteOffDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async createWriteOff(req: Request, res: Response): Promise<void> {
    try {
      const data = {
        ...req.body,
        operatorId: (req as any).user?.id,
      };
      const result = await rewardWriteOffService.createWriteOff(data);
      ResponseUtils.success(res, result, '核销单创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async verifyWriteOff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await rewardWriteOffService.verifyWriteOff(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async settleWriteOff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await rewardWriteOffService.settleWriteOff(id, (req as any).user?.id);
      ResponseUtils.success(res, result, '核销发放成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async settleWriteOffBatch(req: Request, res: Response): Promise<void> {
    try {
      const { writeOffIds } = req.body;
      const result = await rewardWriteOffService.settleWriteOffBatch(writeOffIds, (req as any).user?.id);
      ResponseUtils.success(res, result, '批量核销完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchVerify(req: Request, res: Response): Promise<void> {
    try {
      const { writeOffIds } = req.body;
      const result = await rewardWriteOffService.batchVerify(writeOffIds, (req as any).user?.id);
      ResponseUtils.success(res, result, '批量复核完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchCancel(req: Request, res: Response): Promise<void> {
    try {
      const { writeOffIds, reason } = req.body;
      const result = await rewardWriteOffService.batchCancel(writeOffIds, (req as any).user?.id, reason);
      ResponseUtils.success(res, result, '批量作废完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchOverride(req: Request, res: Response): Promise<void> {
    try {
      const { writeOffIds, reason } = req.body;
      const result = await rewardWriteOffService.batchOverride(writeOffIds, (req as any).user?.id, reason);
      ResponseUtils.success(res, result, '批量冲正完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getWriteOffLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await rewardWriteOffService.getWriteOffLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await rewardWriteOffService.checkWriteOffCompliance(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async blockNonCompliant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await rewardWriteOffService.blockNonCompliantWriteOff(
        id,
        (req as any).user?.id,
        reason
      );
      ResponseUtils.success(res, result, '违规核销已拦截');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { marketingId } = req.query;
      const result = await rewardWriteOffService.getWriteOffStats(marketingId as string);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, marketingId } = req.query;
      const result = await rewardWriteOffService.generateWriteOffReport(
        new Date(startTime as string),
        new Date(endTime as string),
        marketingId as string
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new RewardWriteOffController();
