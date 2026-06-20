import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { CustomerPrivacyService } from '../services/CustomerPrivacyService';
import {
  CreatePrivacyRuleRequest,
  UpdatePrivacyRuleRequest,
  PrivacyRuleQueryParams,
  PrivacyLogQueryParams,
  PrivacyTraceRequest,
  PrivacyBatchConfigRequest,
  PrivacyViewRequest,
  PrivacyExportRequest
} from '../types';

const customerPrivacyService = new CustomerPrivacyService();

export class CustomerPrivacyController {
  async precheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const operatorPosition = (req as any).user?.position || 1;
      const operatorOrgId = (req as any).user?.org_id;
      const operatorOrgName = (req as any).user?.org_name;

      const result = await customerPrivacyService.preCheckPrivacy(
        req.body as PrivacyViewRequest,
        operatorId,
        operatorName,
        operatorPosition,
        operatorOrgId,
        operatorOrgName
      );
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async adaptScene(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scene_type, customer_level, operator_position } = req.body;
      const result = await customerPrivacyService.adaptScene(
        Number(scene_type) as any,
        Number(customer_level) || 1,
        Number(operator_position) || 1
      );
      sendSuccess(res, result, '场景适配完成');
    } catch (error) {
      next(error);
    }
  }

  async viewCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const operatorPosition = (req as any).user?.position || 1;
      const operatorOrgId = (req as any).user?.org_id;
      const operatorOrgName = (req as any).user?.org_name;

      const result = await customerPrivacyService.viewCustomerInfo(
        req.body as PrivacyViewRequest,
        operatorId,
        operatorName,
        operatorPosition,
        operatorOrgId,
        operatorOrgName
      );
      sendSuccess(res, result, result.allowed ? '获取客户信息成功' : '操作已被拦截');
    } catch (error) {
      next(error);
    }
  }

  async exportCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const operatorPosition = (req as any).user?.position || 1;
      const operatorOrgId = (req as any).user?.org_id;
      const operatorOrgName = (req as any).user?.org_name;

      const result = await customerPrivacyService.exportCustomerInfo(
        req.body as PrivacyExportRequest,
        operatorId,
        operatorName,
        operatorPosition,
        operatorOrgId,
        operatorOrgName
      );
      sendSuccess(res, result, result.allowed ? '导出申请已受理' : '导出操作已被拦截');
    } catch (error) {
      next(error);
    }
  }

  async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const rule = await customerPrivacyService.createRule(
        req.body as CreatePrivacyRuleRequest,
        operatorId,
        operatorName
      );
      sendSuccess(res, rule, '规则创建成功');
    } catch (error) {
      next(error);
    }
  }

  async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const rule = await customerPrivacyService.updateRule(
        req.params.id,
        req.body as UpdatePrivacyRuleRequest,
        operatorId,
        operatorName
      );
      sendSuccess(res, rule, '规则更新成功');
    } catch (error) {
      next(error);
    }
  }

  async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerPrivacyService.deleteRule(req.params.id);
      sendSuccess(res, null, '规则删除成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: PrivacyRuleQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        rule_code: req.query.rule_code as string,
        rule_name: req.query.rule_name as string,
        customer_level: req.query.customer_level !== undefined ? Number(req.query.customer_level) : undefined,
        sensitivity_level: req.query.sensitivity_level !== undefined ? Number(req.query.sensitivity_level) as any : undefined,
        operator_position: req.query.operator_position !== undefined ? Number(req.query.operator_position) : undefined,
        scene_type: req.query.scene_type !== undefined ? Number(req.query.scene_type) as any : undefined,
        is_global: req.query.is_global !== undefined ? Number(req.query.is_global) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) as any : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerPrivacyService.getRuleList(params);
      sendSuccessPage(res, result, '获取规则列表成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await customerPrivacyService.getRuleDetail(req.params.id);
      sendSuccess(res, rule, '获取规则详情成功');
    } catch (error) {
      next(error);
    }
  }

  async logList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: PrivacyLogQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        log_no: req.query.log_no as string,
        customer_id: req.query.customer_id as string,
        corporate_id: req.query.corporate_id as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        customer_type: req.query.customer_type !== undefined ? Number(req.query.customer_type) as any : undefined,
        customer_level: req.query.customer_level !== undefined ? Number(req.query.customer_level) : undefined,
        operator_id: req.query.operator_id as string,
        operator_name: req.query.operator_name as string,
        operator_position: req.query.operator_position !== undefined ? Number(req.query.operator_position) as any : undefined,
        scene_type: req.query.scene_type !== undefined ? Number(req.query.scene_type) as any : undefined,
        operation_type: req.query.operation_type !== undefined ? Number(req.query.operation_type) as any : undefined,
        is_blocked: req.query.is_blocked !== undefined ? Number(req.query.is_blocked) : undefined,
        block_type: req.query.block_type !== undefined ? Number(req.query.block_type) as any : undefined,
        is_unauthorized: req.query.is_unauthorized !== undefined ? Number(req.query.is_unauthorized) : undefined,
        is_violation: req.query.is_violation !== undefined ? Number(req.query.is_violation) : undefined,
        is_risk_alert: req.query.is_risk_alert !== undefined ? Number(req.query.is_risk_alert) : undefined,
        rule_id: req.query.rule_id as string,
        rule_code: req.query.rule_code as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await customerPrivacyService.getLogList(params);
      sendSuccessPage(res, result, '获取操作日志列表成功');
    } catch (error) {
      next(error);
    }
  }

  async logDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await customerPrivacyService.getLogDetail(req.params.id);
      sendSuccess(res, log, '获取日志详情成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await customerPrivacyService.tracePrivacy(req.body as PrivacyTraceRequest);
      sendSuccess(res, result, '溯源查询完成');
    } catch (error) {
      next(error);
    }
  }

  async batchConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = (req as any).user?.id;
      const operatorName = (req as any).user?.name;
      const result = await customerPrivacyService.batchConfigRules(
        req.body as PrivacyBatchConfigRequest,
        operatorId,
        operatorName
      );
      sendSuccess(res, result, '批量配置完成');
    } catch (error) {
      next(error);
    }
  }
}
