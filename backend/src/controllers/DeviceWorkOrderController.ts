import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { DeviceWorkOrderService } from '../services';
import {
  WorkOrderPreCheckRequest,
  CreateWorkOrderRequest,
  WorkOrderQueryParams,
  WorkOrderUpdateRequest,
  WorkOrderBatchTaskRequest,
  MaintenanceTaskQueryParams,
  WorkOrderTraceRequest
} from '../types';

export class DeviceWorkOrderController {
  private deviceWorkOrderService: DeviceWorkOrderService;

  constructor() {
    this.deviceWorkOrderService = new DeviceWorkOrderService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceWorkOrderService.getWorkOrderConfig();
      sendSuccess(res, result, '获取运维工单配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: WorkOrderPreCheckRequest = req.body;
      const result = await this.deviceWorkOrderService.preCheckWorkOrder(request);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: WorkOrderQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        order_no: req.query.order_no as string,
        archive_no: req.query.archive_no as string,
        sn_code: req.query.sn_code as string,
        device_type: req.query.device_type ? Number(req.query.device_type) as any : undefined,
        order_type: req.query.order_type ? Number(req.query.order_type) as any : undefined,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        maintenance_level: req.query.maintenance_level ? Number(req.query.maintenance_level) as any : undefined,
        acceptance_status: req.query.acceptance_status ? Number(req.query.acceptance_status) as any : undefined,
        assignee_id: req.query.assignee_id as string,
        org_id: req.query.org_id as string,
        is_overdue: req.query.is_overdue !== undefined ? Number(req.query.is_overdue) as any : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceWorkOrderService.getWorkOrderList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取运维工单列表成功');
    } catch (error) {
      next(error);
    }
  }

  async statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: any = {
        org_id: req.query.org_id as string
      };
      const result = await this.deviceWorkOrderService.getWorkOrderStatistics(params);
      sendSuccess(res, result, '获取运维工单统计成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceWorkOrderService.getWorkOrderById(req.params.id);
      sendSuccess(res, result, '获取运维工单详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateWorkOrderRequest = req.body;
      const operatorName = (req.user?.real_name || req.user?.username || 'unknown') as string;
      const result = await this.deviceWorkOrderService.createWorkOrder(request, req.userId!, operatorName);
      sendSuccess(res, result, '运维工单创建成功');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: WorkOrderUpdateRequest = {
        ...req.body,
        id: req.params.id
      };
      const operatorName = (req.user?.real_name || req.user?.username || 'unknown') as string;
      const result = await this.deviceWorkOrderService.updateWorkOrder(request, req.userId!, operatorName);
      sendSuccess(res, result, '运维工单更新成功');
    } catch (error) {
      next(error);
    }
  }

  async taskList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: MaintenanceTaskQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        task_no: req.query.task_no as string,
        order_type: req.query.order_type ? Number(req.query.order_type) as any : undefined,
        task_status: req.query.task_status ? Number(req.query.task_status) as any : undefined,
        assignee_id: req.query.assignee_id as string,
        org_id: req.query.org_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceWorkOrderService.getMaintenanceTaskList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取运维任务列表成功');
    } catch (error) {
      next(error);
    }
  }

  async taskDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceWorkOrderService.getMaintenanceTaskById(req.params.id);
      sendSuccess(res, result, '获取运维任务详情成功');
    } catch (error) {
      next(error);
    }
  }

  async createBatchTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: WorkOrderBatchTaskRequest = req.body;
      const operatorName = (req.user?.real_name || req.user?.username || 'unknown') as string;
      const result = await this.deviceWorkOrderService.createBatchTask(request, req.userId!, operatorName);
      sendSuccess(res, result, '批量运维任务创建成功');
    } catch (error) {
      next(error);
    }
  }

  async logList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: any = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        order_id: req.query.order_id as string,
        order_no: req.query.order_no as string,
        log_type: req.query.log_type ? Number(req.query.log_type) as any : undefined,
        operator_id: req.query.operator_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceWorkOrderService.getWorkOrderLogList(params);
      sendSuccessPage(res, result, '获取工单操作日志列表成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: WorkOrderTraceRequest = req.body;
      const result = await this.deviceWorkOrderService.traceWorkOrder(request);
      sendSuccess(res, result, '运维溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
