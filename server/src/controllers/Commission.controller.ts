import { Request, Response } from 'express';
import { commissionService } from '../services';
import ResponseUtils from '../utils/response';
import { CommissionCreationAttributes, CommissionAttributes } from '../models/Commission.model';

class CommissionController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CommissionCreationAttributes = req.body;
      const result = await commissionService.create(data);
      ResponseUtils.created(res, result, '佣金记录创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await commissionService.findById(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const params = {
        page,
        pageSize,
        promoterId: req.query.promoterId as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
        type: req.query.type ? parseInt(req.query.type as string, 10) : undefined,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await commissionService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<CommissionAttributes> = req.body;
      const result = await commissionService.update(id, data);
      ResponseUtils.success(res, result, '佣金记录更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await commissionService.delete(id);
      ResponseUtils.success(res, null, '佣金记录删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async summary(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        promoterId: req.query.promoterId as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await commissionService.summary(params);
      ResponseUtils.success(res, result, '汇总统计成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async settle(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await commissionService.settle(ids);
      ResponseUtils.success(res, null, '批量结算成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new CommissionController();
