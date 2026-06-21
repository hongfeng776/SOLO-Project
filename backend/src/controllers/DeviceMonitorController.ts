import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { DeviceMonitorService } from '../services';
import {
  DeviceDataCheckRequest,
  DeviceMonitorQueryParams,
  DeviceMonitorUpdateRequest,
  DeviceFaultQueryParams,
  DeviceMonitorLogQueryParams,
  DeviceMonitorTraceRequest,
  BatchMonitorUpdateRequest,
  FaultStatus
} from '../types';

export class DeviceMonitorController {
  private deviceMonitorService: DeviceMonitorService;

  constructor() {
    this.deviceMonitorService = new DeviceMonitorService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceMonitorService.getMonitorConfig();
      sendSuccess(res, result, '获取设备监控配置成功');
    } catch (error) {
      next(error);
    }
  }

  async checkData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DeviceDataCheckRequest = req.body;
      const result = await this.deviceMonitorService.checkDeviceData(request);
      sendSuccess(res, result, '数据校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: DeviceMonitorQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        archive_no: req.query.archive_no as string,
        sn_code: req.query.sn_code as string,
        device_type: req.query.device_type ? Number(req.query.device_type) as any : undefined,
        monitor_status: req.query.monitor_status ? Number(req.query.monitor_status) as any : undefined,
        fault_level: req.query.fault_level ? Number(req.query.fault_level) as any : undefined,
        connect_status: req.query.connect_status ? Number(req.query.connect_status) as any : undefined,
        monitor_strategy: req.query.monitor_strategy ? Number(req.query.monitor_strategy) as any : undefined,
        org_id: req.query.org_id as string,
        is_key_device: req.query.is_key_device !== undefined ? (req.query.is_key_device === 'true' ? 1 : 0) as any : undefined,
        has_fault: req.query.has_fault !== undefined ? (req.query.has_fault === 'true' ? 1 : 0) as any : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceMonitorService.getMonitorList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取设备监控列表成功');
    } catch (error) {
      next(error);
    }
  }

  async statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: any = {
        org_id: req.query.org_id as string
      };
      const result = await this.deviceMonitorService.getMonitorStatistics(params);
      sendSuccess(res, result, '获取设备监控统计成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceMonitorService.getMonitorById(req.params.id);
      sendSuccess(res, result, '获取设备监控详情成功');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DeviceMonitorUpdateRequest = req.body;
      const result = await this.deviceMonitorService.updateMonitorStatus(request, req.userId!);
      sendSuccess(res, result, '设备监控状态更新成功');
    } catch (error) {
      next(error);
    }
  }

  async batchUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchMonitorUpdateRequest = req.body;
      const result = await this.deviceMonitorService.batchUpdateMonitor(request, req.userId!);
      sendSuccess(res, result, `批量设备监控状态更新完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async faultList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: DeviceFaultQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        fault_no: req.query.fault_no as string,
        archive_no: req.query.archive_no as string,
        sn_code: req.query.sn_code as string,
        device_type: req.query.device_type ? Number(req.query.device_type) as any : undefined,
        fault_level: req.query.fault_level ? Number(req.query.fault_level) as any : undefined,
        fault_status: req.query.fault_status ? Number(req.query.fault_status) as any : undefined,
        fault_code: req.query.fault_code as string,
        org_id: req.query.org_id as string,
        is_false_alarm: req.query.is_false_alarm !== undefined ? (req.query.is_false_alarm === 'true' ? 1 : 0) as any : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceMonitorService.getFaultList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取设备故障列表成功');
    } catch (error) {
      next(error);
    }
  }

  async faultDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceMonitorService.getFaultById(req.params.id);
      sendSuccess(res, result, '获取设备故障详情成功');
    } catch (error) {
      next(error);
    }
  }

  async handleFault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fault_status, handle_remark } = req.body;
      const result = await this.deviceMonitorService.handleFault(
        req.params.id,
        fault_status as FaultStatus,
        handle_remark,
        req.userId!
      );
      sendSuccess(res, result, '故障处理成功');
    } catch (error) {
      next(error);
    }
  }

  async logList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: DeviceMonitorLogQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        device_id: req.query.device_id as string,
        archive_no: req.query.archive_no as string,
        log_type: req.query.log_type ? Number(req.query.log_type) as any : undefined,
        is_alert: req.query.is_alert !== undefined ? (req.query.is_alert === 'true' ? 1 : 0) as any : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceMonitorService.getMonitorLogList(params);
      sendSuccessPage(res, result, '获取设备监控日志列表成功');
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DeviceMonitorTraceRequest = req.body;
      const result = await this.deviceMonitorService.traceDeviceMonitor(request);
      sendSuccess(res, result, '设备监控溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
