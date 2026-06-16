import { Request, Response } from 'express';
import { promoterService } from '../services';
import ResponseUtils from '../utils/response';
import { PromoterCreationAttributes, PromoterAttributes } from '../models/Promoter.model';

class PromoterController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: PromoterCreationAttributes = req.body;
      const result = await promoterService.create(data);
      ResponseUtils.created(res, result, '推客创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await promoterService.findById(id);
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
        channelId: req.query.channelId as string,
        level: req.query.level as string,
        status: req.query.status ? parseInt(req.query.status as string, 10) : undefined,
      };
      const result = await promoterService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<PromoterAttributes> = req.body;
      const result = await promoterService.update(id, data);
      ResponseUtils.success(res, result, '推客更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await promoterService.delete(id);
      ResponseUtils.success(res, null, '推客删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await promoterService.bulkDelete(ids);
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await promoterService.updateStatus(id, status);
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new PromoterController();
