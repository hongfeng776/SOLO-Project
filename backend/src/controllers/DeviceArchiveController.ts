import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { DeviceArchiveService } from '../services';
import {
  DevicePreCheckRequest,
  CreateDeviceArchiveRequest,
  DeviceArchiveQueryParams,
  BatchDeviceArchiveRequest,
  DeviceTraceRequest
} from '../types';

export class DeviceArchiveController {
  private deviceArchiveService: DeviceArchiveService;

  constructor() {
    this.deviceArchiveService = new DeviceArchiveService();
  }

  async config(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceArchiveService.getDeviceArchiveConfig();
      sendSuccess(res, result, '获取设备档案配置成功');
    } catch (error) {
      next(error);
    }
  }

  async preCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DevicePreCheckRequest = req.body;
      const result = await this.deviceArchiveService.preCheckDevice(request);
      sendSuccess(res, result, '前置校验完成');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: DeviceArchiveQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        archive_no: req.query.archive_no as string,
        sn_code: req.query.sn_code as string,
        device_type: req.query.device_type ? Number(req.query.device_type) as any : undefined,
        device_model: req.query.device_model as string,
        manufacturer: req.query.manufacturer as string,
        status: req.query.status ? Number(req.query.status) as any : undefined,
        control_level: req.query.control_level ? Number(req.query.control_level) as any : undefined,
        qualification_status: req.query.qualification_status ? Number(req.query.qualification_status) as any : undefined,
        org_id: req.query.org_id as string,
        purchase_batch: req.query.purchase_batch as string,
        is_old_device: req.query.is_old_device !== undefined ? (req.query.is_old_device === 'true' ? 1 : 0) as any : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string
      };
      const result = await this.deviceArchiveService.getDeviceArchiveList(params, req.userId, req.user?.org_id);
      sendSuccessPage(res, result, '获取设备档案列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.deviceArchiveService.getDeviceArchiveById(req.params.id);
      sendSuccess(res, result, '获取设备档案详情成功');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateDeviceArchiveRequest = req.body;
      const result = await this.deviceArchiveService.createDeviceArchive(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '设备档案创建成功');
    } catch (error) {
      next(error);
    }
  }

  async batch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: BatchDeviceArchiveRequest = req.body;
      const userRoles = (req.user?.roles || []).map((r: any) => r.code || r);
      const result = await this.deviceArchiveService.batchDeviceArchive(request, req.userId!, userRoles);
      sendSuccess(res, result, `批量设备档案处理完成：成功${result.success_count}条，失败${result.fail_count}条`);
    } catch (error) {
      next(error);
    }
  }

  async trace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DeviceTraceRequest = req.body;
      const result = await this.deviceArchiveService.traceDeviceArchive(request);
      sendSuccess(res, result, '设备溯源查询完成');
    } catch (error) {
      next(error);
    }
  }
}
