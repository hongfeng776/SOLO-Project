import { Request, Response } from 'express';
import { marketingService } from '../services';
import ResponseUtils from '../utils/response';
import { MarketingCreationAttributes, MarketingAttributes } from '../models/Marketing.model';

class MarketingController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: MarketingCreationAttributes = req.body;
      const result = await marketingService.create(data);
      ResponseUtils.created(res, result, '营销活动创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await marketingService.findById(id);
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
        type: req.query.type as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
      };
      const result = await marketingService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<MarketingAttributes> = req.body;
      const result = await marketingService.update(id, data);
      ResponseUtils.success(res, result, '营销活动更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await marketingService.delete(id);
      ResponseUtils.success(res, null, '营销活动删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await marketingService.bulkDelete(ids);
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await marketingService.updateStatus(id, status);
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new MarketingController();
