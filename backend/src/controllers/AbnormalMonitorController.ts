import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { AbnormalMonitorService } from '../services/AbnormalMonitorService';
import { throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';

const abnormalMonitorService = new AbnormalMonitorService();

export class AbnormalMonitorController {
  async realTimeMonitor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transaction_id } = req.body;
      if (!isValidId(transaction_id)) throwValidationError('无效的交易ID');
      const result = await abnormalMonitorService.realTimeMonitor(transaction_id);
      sendSuccess(res, result, '实时监控检测完成');
    } catch (error) {
      next(error);
    }
  }

  async getAlertList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        alert_no: req.query.alert_no as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        alert_type: req.query.alert_type !== undefined ? Number(req.query.alert_type) : undefined,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        intercept_status: req.query.intercept_status !== undefined ? Number(req.query.intercept_status) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        batch_id: req.query.batch_id as string,
        is_false_positive: req.query.is_false_positive !== undefined ? Number(req.query.is_false_positive) : undefined,
        min_amount: req.query.min_amount !== undefined ? Number(req.query.min_amount) : undefined,
        max_amount: req.query.max_amount !== undefined ? Number(req.query.max_amount) : undefined
      };
      const result = await abnormalMonitorService.getAlertList(params);
      sendSuccessPage(res, result, '获取异常交易列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getAlertDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.getAlertDetail(req.params.id);
      sendSuccess(res, result, '获取异常交易详情成功');
    } catch (error) {
      next(error);
    }
  }

  async handleAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const handlerId = req.userId!;
      const result = await abnormalMonitorService.handleAlert(req.params.id, handlerId, req.body);
      sendSuccess(res, result, '处理异常交易成功');
    } catch (error) {
      next(error);
    }
  }

  async checkCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.checkCompliance(req.params.id, req.body);
      sendSuccess(res, result, '合规校验完成');
    } catch (error) {
      next(error);
    }
  }

  async createBatchHandle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = req.userId!;
      const orgId = req.user?.org_id!;
      const result = await abnormalMonitorService.createBatchHandle(req.body, creatorId, orgId);
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
        batch_type: req.query.batch_type !== undefined ? Number(req.query.batch_type) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await abnormalMonitorService.getBatchList(params);
      sendSuccessPage(res, result, '获取批量处理列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getBatchDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.getBatchDetail(req.params.id);
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
        alert_id: req.query.alert_id as string,
        trace_type: req.query.trace_type !== undefined ? Number(req.query.trace_type) : undefined,
        operator_id: req.query.operator_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await abnormalMonitorService.getTraceList(params);
      sendSuccessPage(res, result, '获取溯源记录成功');
    } catch (error) {
      next(error);
    }
  }

  async getAlertTrace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.getAlertTrace(req.params.alertId);
      sendSuccess(res, result, '获取异常交易溯源成功');
    } catch (error) {
      next(error);
    }
  }

  async getRuleList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        rule_type: req.query.rule_type !== undefined ? Number(req.query.rule_type) : undefined,
        dimension: req.query.dimension !== undefined ? Number(req.query.dimension) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        is_enabled: req.query.is_enabled !== undefined ? Number(req.query.is_enabled) : undefined
      };
      const result = await abnormalMonitorService.getRuleList(params);
      sendSuccessPage(res, result, '获取监控规则列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getRuleDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.getRuleDetail(req.params.id);
      sendSuccess(res, result, '获取监控规则详情成功');
    } catch (error) {
      next(error);
    }
  }

  async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.createRule(req.body);
      sendSuccess(res, result, '创建监控规则成功');
    } catch (error) {
      next(error);
    }
  }

  async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.updateRule(req.params.id, req.body);
      sendSuccess(res, result, '更新监控规则成功');
    } catch (error) {
      next(error);
    }
  }

  async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await abnormalMonitorService.deleteRule(req.params.id);
      sendSuccess(res, null, '删除监控规则成功');
    } catch (error) {
      next(error);
    }
  }

  async validateRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.validateRules();
      sendSuccess(res, result, '规则校验完成');
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = req.query.start_time as string;
      const endTime = req.query.end_time as string;
      const orgId = req.query.org_id as string;
      const result = await abnormalMonitorService.getAlertStatistics(startTime, endTime, orgId);
      sendSuccess(res, result, '获取异常交易统计成功');
    } catch (error) {
      next(error);
    }
  }

  async getMonitorConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await abnormalMonitorService.getMonitorConfig();
      sendSuccess(res, result, '获取监控配置成功');
    } catch (error) {
      next(error);
    }
  }
}
