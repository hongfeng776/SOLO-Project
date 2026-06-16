import { Request, Response, NextFunction } from 'express';
import operationLogService from '@services/OperationLogService';
import { success, paginated } from '@utils/response';

export async function getLogList(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const module = req.query.module as string | undefined;
    const operation = req.query.operation as string | undefined;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const keyword = req.query.keyword as string | undefined;

    const result = await operationLogService.getLogList({ page, pageSize, userId, module, operation, status, startDate, endDate, keyword });
    res.json(paginated(result.list, result.total, result.page, result.pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getLogById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await operationLogService.getLogById(id);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
