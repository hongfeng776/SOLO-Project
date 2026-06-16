import { Request, Response } from 'express';
import { orderService } from '../services';
import ResponseUtils from '../utils/response';
import { OrderCreationAttributes, OrderAttributes } from '../models/Order.model';

class OrderController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: OrderCreationAttributes = req.body;
      const result = await orderService.create(data);
      ResponseUtils.created(res, result, '订单创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await orderService.findById(id);
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
        keyword: req.query.keyword as string,
        orderNo: req.query.orderNo as string,
        channelId: req.query.channelId as string,
        promoterId: req.query.promoterId as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await orderService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<OrderAttributes> = req.body;
      const result = await orderService.update(id, data);
      ResponseUtils.success(res, result, '订单更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await orderService.delete(id);
      ResponseUtils.success(res, null, '订单删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { ids, data } = req.body;
      await orderService.bulkUpdate(ids, data);
      ResponseUtils.success(res, null, '批量更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async export(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: 1,
        pageSize: 99999,
        keyword: req.query.keyword as string,
        orderNo: req.query.orderNo as string,
        channelId: req.query.channelId as string,
        promoterId: req.query.promoterId as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };
      const result = await orderService.export(params);
      ResponseUtils.success(res, result, '导出成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new OrderController();
