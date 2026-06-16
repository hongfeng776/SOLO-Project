import { Request, Response } from 'express';
import operationLogService from '../services/OperationLog.service';
import ResponseUtils from '../utils/response';

class OperationLogController {
  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page, pageSize,
        userId: req.query.userId as string,
        module: req.query.module as string,
        action: req.query.action as string,
        targetType: req.query.targetType as string,
        targetId: req.query.targetId as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await operationLogService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new OperationLogController();
