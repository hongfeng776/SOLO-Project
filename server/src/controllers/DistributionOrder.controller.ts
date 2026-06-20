import { Request, Response } from 'express';
import { distributionOrderService, orderStatusFlowService } from '../services';
import ResponseUtils from '../utils/response';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';
import { OrderStatus } from '../constants/enum';

class DistributionOrderController {
  public async validateParams(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = this.buildQueryParams(req, page, pageSize);
      const result = distributionOrderService.validateQueryParams(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = this.buildQueryParams(req, page, pageSize);

      const user = (req as any).user;
      if (!user) {
        throw new AppError('用户未登录', BusinessCode.UNAUTHORIZED);
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await distributionOrderService.findAll(
        params,
        user.id,
        user.name || user.username || user.id,
        ip,
        userAgent
      );
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const params = this.buildQueryParams(req, page, pageSize);
      const result = await distributionOrderService.getStatistics(params);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkMark(req: Request, res: Response): Promise<void> {
    try {
      const { ids, remark } = req.body;
      const user = (req as any).user;
      if (!user) {
        throw new AppError('用户未登录', BusinessCode.UNAUTHORIZED);
      }
      const result = await distributionOrderService.bulkMark(
        ids,
        remark,
        user.id,
        user.name || user.username || user.id
      );
      ResponseUtils.success(res, result, '批量标记成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkExportPermission(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userPermissions = user?.permissions || [];
      const hasPermission = await distributionOrderService.checkExportPermission(userPermissions);
      ResponseUtils.success(res, { hasPermission });
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async export(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        throw new AppError('用户未登录', BusinessCode.UNAUTHORIZED);
      }

      const userPermissions = user.permissions || [];
      const hasPermission = await distributionOrderService.checkExportPermission(userPermissions);
      if (!hasPermission) {
        throw new AppError('无导出权限', BusinessCode.EXPORT_NO_PERMISSION);
      }

      const page = 1;
      const pageSize = 99999;
      const params = this.buildQueryParams(req, page, pageSize);

      const fields = req.query.fields ? (req.query.fields as string).split(',') : undefined;
      const sortField = req.query.sortField as string | undefined;
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || undefined;

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await distributionOrderService.export(
        { ...params, fields, sortField, sortOrder },
        user.id,
        user.name || user.username || user.id,
        ip,
        userAgent
      );
      ResponseUtils.success(res, result, '导出成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getBatchStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const result = await distributionOrderService.getBatchStatistics(ids);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getQueryLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const userId = req.query.userId as string | undefined;
      const startTime = req.query.startTime as string | undefined;
      const endTime = req.query.endTime as string | undefined;
      const result = await distributionOrderService.getQueryLogs(
        page,
        pageSize,
        userId,
        startTime,
        endTime
      );
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateStatusTransition(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, fromStatus, toStatus } = req.body;
      const result = orderStatusFlowService.validateTransition(
        parseInt(fromStatus, 10) as OrderStatus,
        parseInt(toStatus, 10) as OrderStatus
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, toStatus, reason } = req.body;
      const user = (req as any).user;
      if (!user) {
        throw new AppError('用户未登录', BusinessCode.UNAUTHORIZED);
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      const result = await orderStatusFlowService.executeStatusChange(
        orderId,
        parseInt(toStatus, 10) as OrderStatus,
        user.id,
        user.name || user.username || user.id,
        reason,
        ip,
        userAgent
      );
      ResponseUtils.success(res, result, result.message);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchVerifyStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const result = await orderStatusFlowService.batchVerifyStatus(ids);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchConfirmAbnormal(req: Request, res: Response): Promise<void> {
    try {
      const { ids, reason } = req.body;
      const user = (req as any).user;
      if (!user) {
        throw new AppError('用户未登录', BusinessCode.UNAUTHORIZED);
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';

      const results = await orderStatusFlowService.batchConfirmAbnormal(
        ids,
        user.id,
        user.name || user.username || user.id,
        reason,
        ip
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      ResponseUtils.success(res, {
        results,
        summary: {
          total: results.length,
          successCount,
          failCount,
        },
      }, `批量确认完成：成功${successCount}条，失败${failCount}条`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getStatusChangeLog(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.query.orderId as string || '';
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '20', 10);
      const result = await orderStatusFlowService.getStatusChangeLog(orderId, page, pageSize);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateChangeCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, fromStatus, toStatus } = req.body;
      const user = (req as any).user;
      const operatorId = user?.id || '';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';

      const result = await orderStatusFlowService.validateChangeCompliance(
        orderId,
        parseInt(fromStatus, 10) as OrderStatus,
        parseInt(toStatus, 10) as OrderStatus,
        operatorId,
        ip
      );
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  private buildQueryParams(req: Request, page: number, pageSize: number): any {
    const statusStr = req.query.status as string | undefined;
    let status: any = undefined;
    if (statusStr !== undefined && statusStr !== '') {
      if (statusStr.includes(',')) {
        status = statusStr.split(',').map((s) => parseInt(s.trim(), 10));
      } else {
        status = parseInt(statusStr, 10);
      }
    }

    return {
      page,
      pageSize,
      orderNo: req.query.orderNo as string | undefined,
      channelId: req.query.channelId as string | undefined,
      promoterId: req.query.promoterId as string | undefined,
      productId: req.query.productId as string | undefined,
      productName: req.query.productName as string | undefined,
      status,
      isAbnormal: req.query.isAbnormal === 'true',
      isPendingReview: req.query.isPendingReview === 'true',
      isUnsettled: req.query.isUnsettled === 'true',
      startTime: req.query.startTime as string | undefined,
      endTime: req.query.endTime as string | undefined,
      sortField: req.query.sortField as string | undefined,
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
    };
  }
}

export default new DistributionOrderController();
