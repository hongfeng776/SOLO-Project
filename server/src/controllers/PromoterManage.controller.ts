import { Request, Response } from 'express';
import { promoterManageService } from '../services';
import ResponseUtils from '../utils/response';

class PromoterManageController {
  public async getLevelConfigs(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterManageService.getLevelConfigs();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkEditPermission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { editFields } = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.checkEditPermission(operatorId, editFields);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateField(req: Request, res: Response): Promise<void> {
    try {
      const { field, value } = req.body;
      const result = await promoterManageService.validateField(field, value);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkUniqueness(req: Request, res: Response): Promise<void> {
    try {
      const { phone, wechatId, idCard, excludePromoterId } = req.body;
      const result = await promoterManageService.checkUniqueness(
        { phone, wechatId, idCard },
        excludePromoterId
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updatePromoterInfo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.updatePromoterInfo(id, operatorId, data);
      ResponseUtils.success(res, result, '推客信息更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateQualification(req: Request, res: Response): Promise<void> {
    try {
      const result = await promoterManageService.validateQualification(req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async submitQualification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const qualificationData = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.submitQualification(id, operatorId, qualificationData);
      ResponseUtils.created(res, result, '资质提交成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async reviewQualification(req: Request, res: Response): Promise<void> {
    try {
      const { qualificationId } = req.params;
      const { passed, remark } = req.body;
      const reviewerId = (req as any).user?.id || '';
      await promoterManageService.reviewQualification(qualificationId, reviewerId, passed, remark);
      ResponseUtils.success(res, null, passed ? '资质审核通过成功' : '资质审核驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchUpdateLevel(req: Request, res: Response): Promise<void> {
    try {
      const { ids, targetLevel } = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.batchUpdateLevel(ids, targetLevel, operatorId);
      ResponseUtils.success(res, result, '批量修改等级完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchUpdatePromoteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ids, status, remark } = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.batchUpdatePromoteStatus(ids, status, operatorId, remark);
      ResponseUtils.success(res, result, '批量修改推广状态完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchUpdateSettleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ids, status, remark } = req.body;
      const operatorId = (req as any).user?.id || '';
      const result = await promoterManageService.batchUpdateSettleStatus(ids, status, operatorId, remark);
      ResponseUtils.success(res, result, '批量修改结算状态完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getChangeLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await promoterManageService.getChangeLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getChangeDiff(req: Request, res: Response): Promise<void> {
    try {
      const { id, logId } = req.params;
      const result = await promoterManageService.getChangeDiff(id, logId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getPromoterDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await promoterManageService.getPromoterDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PromoterManageController();
