import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { RiskControlService, AnomalyQueryParams, CreateViolationRequest, HandleViolationRequest } from '../services/RiskControlService';
import { throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';

const riskControlService = new RiskControlService();

export class RiskController {
  async evaluateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transaction_id } = req.body;
      if (!isValidId(transaction_id)) {
        throwValidationError('无效的交易ID');
      }
      const result = await riskControlService.evaluateTransactionRisk(transaction_id);
      sendSuccess(res, result, '交易风险评估成功');
    } catch (error) {
      next(error);
    }
  }

  async detectAnomaly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: AnomalyQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        customer_no: req.query.customer_no as string,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) : undefined,
        min_amount: req.query.min_amount !== undefined ? Number(req.query.min_amount) : undefined,
        max_amount: req.query.max_amount !== undefined ? Number(req.query.max_amount) : undefined,
        is_high_frequency: req.query.is_high_frequency === 'true',
        is_large_amount: req.query.is_large_amount === 'true',
        is_night: req.query.is_night === 'true',
        is_cross_border: req.query.is_cross_border === 'true'
      };
      const result = await riskControlService.detectAnomalyTransactions(params);
      sendSuccessPage(res, result, '异常交易检测成功');
    } catch (error) {
      next(error);
    }
  }

  async violationList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        customer_no: req.query.customer_no as string,
        violation_type: req.query.violation_type !== undefined ? Number(req.query.violation_type) : undefined,
        violation_level: req.query.violation_level !== undefined ? Number(req.query.violation_level) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        discoverer_org_id: req.query.discoverer_org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await riskControlService.getViolationList(params);
      sendSuccessPage(res, result, '获取违规台账列表成功');
    } catch (error) {
      next(error);
    }
  }

  async violationDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await riskControlService.getViolationById(req.params.id);
      sendSuccess(res, result, '获取违规台账详情成功');
    } catch (error) {
      next(error);
    }
  }

  async violationCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await riskControlService.createViolationRecord(req.body as CreateViolationRequest);
      sendSuccess(res, result, '创建违规台账成功');
    } catch (error) {
      next(error);
    }
  }

  async violationHandle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.userId!;
      const result = await riskControlService.handleViolation(
        req.params.id,
        operatorId,
        req.body as HandleViolationRequest
      );
      sendSuccess(res, result, '处理违规台账成功');
    } catch (error) {
      next(error);
    }
  }

  async statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = req.query.start_time as string;
      const endTime = req.query.end_time as string;
      const orgId = req.query.org_id as string;
      const result = await riskControlService.getRiskStatistics(startTime, endTime, orgId);
      sendSuccess(res, result, '获取风控统计成功');
    } catch (error) {
      next(error);
    }
  }
}
