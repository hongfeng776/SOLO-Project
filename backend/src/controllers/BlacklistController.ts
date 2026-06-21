import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { BlacklistService } from '../services/BlacklistService';
import { throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';

const blacklistService = new BlacklistService();

export class BlacklistController {
  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_id } = req.query;
      if (!customer_id || !isValidId(customer_id as string)) throwValidationError('无效的客户ID');
      const result = await blacklistService.preCheck(customer_id as string);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async getBlacklistList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        blacklist_no: req.query.blacklist_no as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        id_card_no: req.query.id_card_no as string,
        grade: req.query.grade !== undefined ? Number(req.query.grade) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        violation_type: req.query.violation_type !== undefined ? Number(req.query.violation_type) : undefined,
        is_auto_remind: req.query.is_auto_remind !== undefined ? Number(req.query.is_auto_remind) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        expire_start_date: req.query.expire_start_date as string,
        expire_end_date: req.query.expire_end_date as string,
        org_id: req.query.org_id as string
      };
      const result = await blacklistService.getBlacklistList(params);
      sendSuccessPage(res, result, '获取黑名单列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getBlacklistDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await blacklistService.getBlacklistDetail(req.params.id);
      sendSuccess(res, result, '获取黑名单详情成功');
    } catch (error) {
      next(error);
    }
  }

  async createBlacklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = req.userId!;
      const orgId = req.user?.org_id!;
      const result = await blacklistService.createBlacklist(req.body, creatorId, orgId);
      sendSuccess(res, result, '创建黑名单记录成功');
    } catch (error) {
      next(error);
    }
  }

  async reviewBlacklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = req.userId!;
      const result = await blacklistService.reviewBlacklist(req.params.id, req.body, reviewerId);
      sendSuccess(res, result, '审核黑名单成功');
    } catch (error) {
      next(error);
    }
  }

  async removeBlacklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const removerId = req.userId!;
      const result = await blacklistService.removeBlacklist(req.params.id, req.body, removerId);
      sendSuccess(res, result, '移除黑名单成功');
    } catch (error) {
      next(error);
    }
  }

  async extendBlacklist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.userId!;
      const result = await blacklistService.extendBlacklist(req.params.id, req.body, operatorId);
      sendSuccess(res, result, '延期黑名单成功');
    } catch (error) {
      next(error);
    }
  }

  async changeGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.userId!;
      const result = await blacklistService.changeGrade(req.params.id, req.body, operatorId);
      sendSuccess(res, result, '变更黑名单等级成功');
    } catch (error) {
      next(error);
    }
  }

  async checkCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { check_type } = req.body;
      if (check_type === undefined) throwValidationError('校验类型不能为空');
      const result = await blacklistService.checkCompliance(req.params.id, Number(check_type));
      sendSuccess(res, result, '合规校验完成');
    } catch (error) {
      next(error);
    }
  }

  async createBatchHandle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = req.userId!;
      const orgId = req.user?.org_id!;
      const result = await blacklistService.createBatchHandle(req.body, creatorId, orgId);
      sendSuccess(res, result, '创建批量处理成功');
    } catch (error) {
      next(error);
    }
  }

  async getBatchList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        batch_no: req.query.batch_no as string,
        batch_type: req.query.batch_type !== undefined ? Number(req.query.batch_type) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        creator_id: req.query.creator_id as string
      };
      const result = await blacklistService.getBatchList(params);
      sendSuccessPage(res, result, '获取批量处理列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getBatchDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await blacklistService.getBatchDetail(req.params.id);
      sendSuccess(res, result, '获取批量处理详情成功');
    } catch (error) {
      next(error);
    }
  }

  async getTraceList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        blacklist_id: req.query.blacklist_id as string,
        trace_type: req.query.trace_type !== undefined ? Number(req.query.trace_type) : undefined,
        operator_id: req.query.operator_id as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      };
      const result = await blacklistService.getTraceList(params);
      sendSuccessPage(res, result, '获取溯源日志列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getBlacklistTraces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await blacklistService.getBlacklistTraces(req.params.id);
      sendSuccess(res, result, '获取黑名单溯源记录成功');
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await blacklistService.getStatistics();
      sendSuccess(res, result, '获取统计数据成功');
    } catch (error) {
      next(error);
    }
  }

  async getGradeConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = blacklistService.getGradeConfigs();
      sendSuccess(res, result, '获取等级配置成功');
    } catch (error) {
      next(error);
    }
  }

  async getBlacklistConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = blacklistService.getGradeConfigs();
      sendSuccess(res, {
        grade_configs: result
      }, '获取黑名单配置成功');
    } catch (error) {
      next(error);
    }
  }
}
