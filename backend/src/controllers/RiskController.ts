import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { RiskControlService, AnomalyQueryParams, CreateViolationRequest, HandleViolationRequest } from '../services/RiskControlService';
import { throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';
import {
  RiskAssessmentQueryParams,
  RiskAssessmentBatchQueryParams,
  RiskIndicatorQueryParams,
  CreateRiskAssessmentRequest,
  ReviewRiskAssessmentRequest,
  BatchRiskAssessmentRequest,
  CreateRiskIndicatorRequest,
  UpdateRiskIndicatorRequest
} from '../types';

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

  async checkDataSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_id } = req.params;
      if (!isValidId(customer_id)) {
        throwValidationError('无效的客户ID');
      }
      const result = await riskControlService.checkDataSyncStatus(customer_id);
      sendSuccess(res, result, '数据同步状态检查成功');
    } catch (error) {
      next(error);
    }
  }

  async getMultiDimensionalData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_id } = req.params;
      if (!isValidId(customer_id)) {
        throwValidationError('无效的客户ID');
      }
      const result = await riskControlService.collectMultiDimensionalData(customer_id);
      sendSuccess(res, result, '获取多维度数据成功');
    } catch (error) {
      next(error);
    }
  }

  async validateWeights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await riskControlService.validateIndicatorWeights();
      sendSuccess(res, result, '指标权重校验成功');
    } catch (error) {
      next(error);
    }
  }

  async checkIllegalDowngrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_id } = req.params;
      const { requested_risk_level, current_risk_level } = req.body;

      if (!isValidId(customer_id)) {
        throwValidationError('无效的客户ID');
      }
      if (requested_risk_level === undefined || ![1, 2, 3, 4].includes(requested_risk_level)) {
        throwValidationError('无效的风险等级');
      }

      const result = await riskControlService.checkIllegalDowngrade(
        customer_id,
        requested_risk_level,
        current_risk_level
      );
      sendSuccess(res, result, '违规调低检查成功');
    } catch (error) {
      next(error);
    }
  }

  async createRiskAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.userId!;
      const orgId = req.user?.org_id!;
      const result = await riskControlService.createRiskAssessment(
        req.body as CreateRiskAssessmentRequest,
        operatorId,
        orgId
      );
      sendSuccess(res, result, '创建风险评定成功');
    } catch (error) {
      next(error);
    }
  }

  async getRiskAssessmentList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: RiskAssessmentQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        customer_no: req.query.customer_no as string,
        customer_name: req.query.customer_name as string,
        risk_level: req.query.risk_level !== undefined ? Number(req.query.risk_level) : undefined,
        assessment_type: req.query.assessment_type !== undefined ? Number(req.query.assessment_type) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        batch_id: req.query.batch_id as string,
        data_sync_status: req.query.data_sync_status !== undefined ? Number(req.query.data_sync_status) : undefined,
        is_illegal_downgrade: req.query.is_illegal_downgrade !== undefined ? Number(req.query.is_illegal_downgrade) : undefined
      };
      const result = await riskControlService.getRiskAssessmentList(params);
      sendSuccessPage(res, result, '获取风险评定列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getRiskAssessmentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await riskControlService.getRiskAssessmentById(id);
      sendSuccess(res, result, '获取风险评定详情成功');
    } catch (error) {
      next(error);
    }
  }

  async reviewRiskAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = req.userId!;
      const result = await riskControlService.reviewRiskAssessment(
        id,
        operatorId,
        req.body as ReviewRiskAssessmentRequest
      );
      sendSuccess(res, result, '复核风险评定成功');
    } catch (error) {
      next(error);
    }
  }

  async createBatchAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorId = req.userId!;
      const orgId = req.user?.org_id!;
      const result = await riskControlService.createBatchAssessment(
        req.body as BatchRiskAssessmentRequest,
        creatorId,
        orgId
      );
      sendSuccess(res, result, '创建批量评定成功');
    } catch (error) {
      next(error);
    }
  }

  async getBatchAssessmentList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: RiskAssessmentBatchQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        batch_type: req.query.batch_type !== undefined ? Number(req.query.batch_type) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await riskControlService.getRiskAssessmentBatchList(params);
      sendSuccessPage(res, result, '获取批量评定列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getBatchAssessmentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await riskControlService.getRiskAssessmentBatchById(id);
      sendSuccess(res, result, '获取批量评定详情成功');
    } catch (error) {
      next(error);
    }
  }

  async getCustomerRiskTrace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customer_id } = req.params;
      const result = await riskControlService.getCustomerRiskTrace(customer_id);
      sendSuccess(res, result, '获取客户风险溯源成功');
    } catch (error) {
      next(error);
    }
  }

  async getRiskIndicatorList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: RiskIndicatorQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        category: req.query.category !== undefined ? Number(req.query.category) : undefined,
        status: req.query.status !== undefined ? Number(req.query.status) : undefined,
        indicator_code: req.query.indicator_code as string
      };
      const result = await riskControlService.getRiskIndicatorList(params);
      sendSuccessPage(res, result, '获取风险指标列表成功');
    } catch (error) {
      next(error);
    }
  }

  async getRiskIndicatorDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await riskControlService.getRiskIndicatorById(id);
      sendSuccess(res, result, '获取风险指标详情成功');
    } catch (error) {
      next(error);
    }
  }

  async createRiskIndicator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await riskControlService.createRiskIndicator(
        req.body as CreateRiskIndicatorRequest
      );
      sendSuccess(res, result, '创建风险指标成功');
    } catch (error) {
      next(error);
    }
  }

  async updateRiskIndicator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await riskControlService.updateRiskIndicator(
        id,
        req.body as UpdateRiskIndicatorRequest
      );
      sendSuccess(res, result, '更新风险指标成功');
    } catch (error) {
      next(error);
    }
  }

  async deleteRiskIndicator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await riskControlService.deleteRiskIndicator(id);
      sendSuccess(res, null, '删除风险指标成功');
    } catch (error) {
      next(error);
    }
  }

  async getRiskLevelConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = {
        risk_levels: [
          { value: 1, text: '低风险', color: 'success' },
          { value: 2, text: '中风险', color: 'warning' },
          { value: 3, text: '较高风险', color: 'danger' },
          { value: 4, text: '高风险', color: 'danger' }
        ],
        assessment_types: [
          { value: 1, text: '初评' },
          { value: 2, text: '复评' },
          { value: 3, text: '人工调整' }
        ],
        assessment_statuses: [
          { value: 0, text: '待评定' },
          { value: 1, text: '评定中' },
          { value: 2, text: '已完成' },
          { value: 3, text: '已驳回' },
          { value: 4, text: '已取消' }
        ],
        data_sync_statuses: [
          { value: 0, text: '未同步' },
          { value: 1, text: '同步中' },
          { value: 2, text: '同步完成' },
          { value: 3, text: '同步失败' }
        ],
        indicator_categories: [
          { value: 1, text: '征信类' },
          { value: 2, text: '交易类' },
          { value: 3, text: '负债类' },
          { value: 4, text: '涉诉类' },
          { value: 5, text: '开户行为类' }
        ],
        batch_types: [
          { value: 1, text: '新增客户初评' },
          { value: 2, text: '存量客户复评' },
          { value: 3, text: '高风险客户复评' },
          { value: 4, text: '自定义' }
        ],
        batch_statuses: [
          { value: 0, text: '待执行' },
          { value: 1, text: '执行中' },
          { value: 2, text: '已完成' },
          { value: 3, text: '部分失败' },
          { value: 4, text: '执行失败' }
        ],
        review_frequency_strategies: [
          { value: 0, text: '无' },
          { value: 1, text: '按月' },
          { value: 2, text: '按季' },
          { value: 3, text: '按半年' },
          { value: 4, text: '按年' },
          { value: 5, text: '按活跃度' },
          { value: 6, text: '按风险异动' }
        ]
      };
      sendSuccess(res, config, '获取风险等级配置成功');
    } catch (error) {
      next(error);
    }
  }
}
