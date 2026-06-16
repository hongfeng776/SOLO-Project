import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { OperationLogQueryParams, CreateOperationLogRequest, OperationType, LogType } from '../types';
import { LogService } from '../services';

export class LogController {
  private logService: LogService;

  constructor() {
    this.logService = new LogService();
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: OperationLogQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        module: req.query.module as string,
        operation: req.query.operation as OperationType,
        user_id: req.query.user_id as string,
        org_id: req.query.org_id as string,
        status: req.query.status !== undefined ? Number(req.query.status) as 0 | 1 : undefined,
        log_type: req.query.log_type !== undefined ? Number(req.query.log_type) as LogType : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
      };
      const result = await this.logService.getOperationLogList(params);
      sendSuccessPage(res, result, '获取操作日志列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.logService.getLogById(id);
      sendSuccess(res, result, '获取日志详情成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.logService.deleteLog(id);
      sendSuccess(res, null, '删除日志成功');
    } catch (error) {
      next(error);
    }
  }

  async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.body?.days ?? 30;
      const count = await this.logService.cleanLogs(days);
      sendSuccess(res, { cleared: days, count }, '清空日志成功');
    } catch (error) {
      next(error);
    }
  }

  async export(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: OperationLogQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        module: req.query.module as string,
        operation: req.query.operation as OperationType,
        user_id: req.query.user_id as string,
        org_id: req.query.org_id as string,
        status: req.query.status !== undefined ? Number(req.query.status) as 0 | 1 : undefined,
        log_type: req.query.log_type !== undefined ? Number(req.query.log_type) as LogType : undefined,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
      };
      const result = await this.logService.exportLogs(params);
      sendSuccess(res, result, '导出日志成功');
    } catch (error) {
      next(error);
    }
  }
}
