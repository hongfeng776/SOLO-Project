import { Request, Response } from 'express';
import permissionChangeLogService from '../services/PermissionChangeLog.service';
import ResponseUtils from '../utils/response';
import { AccountLevel } from '../constants/enum';

class PermissionChangeLogController {
  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page, pageSize,
        operatorId: req.query.operatorId as string,
        operatorName: req.query.operatorName as string,
        targetType: req.query.targetType as any,
        targetId: req.query.targetId as string,
        action: req.query.action as any,
        module: req.query.module as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
        keyword: req.query.keyword as string,
      };
      const result = await permissionChangeLogService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const detail = await permissionChangeLogService.getDetail(id);
      ResponseUtils.success(res, detail);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async exportLogs(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (user.positionLevel > AccountLevel.MANAGER) {
        ResponseUtils.error(res, '无导出权限', 403);
        return;
      }

      const { fields, sortBy, sortOrder, ...queryParams } = req.body;
      const exportFields = Array.isArray(fields) && fields.length > 0
        ? fields
        : ['operatorName', 'targetType', 'targetName', 'action', 'module', 'reason', 'affectedUserCount', 'ip', 'createdAt'];

      const buffer = await permissionChangeLogService.exportLogs(
        queryParams,
        exportFields,
        sortBy || 'createdAt',
        sortOrder || 'desc'
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `permission_change_logs_${timestamp}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.end(buffer);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        userId: req.query.userId as string,
        timeWindowMinutes: req.query.timeWindowMinutes ? parseInt(req.query.timeWindowMinutes as string, 10) : undefined,
        frequencyThreshold: req.query.frequencyThreshold ? parseInt(req.query.frequencyThreshold as string, 10) : undefined,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await permissionChangeLogService.detectAnomalies(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PermissionChangeLogController();
