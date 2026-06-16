import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import operationLogDao from '../dao/operation-log.dao';

class OperationLogController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const { module, username, status, ...rest } = req.query as any;
      const where: any = {};

      if (module) {
        where.module = module;
      }
      if (username) {
        where.username = { [Symbol.for('like')]: `%${username}%` };
      }
      if (status !== undefined) {
        where.status = status;
      }

      const result = await operationLogDao.paginate(rest, {
        where,
        order: [['id', 'DESC']],
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await operationLogDao.findById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new OperationLogController();
