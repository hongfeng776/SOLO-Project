import { Request, Response } from 'express';
import { channelService } from '../services';
import ResponseUtils from '../utils/response';
import { ChannelCreationAttributes, ChannelAttributes } from '../models/Channel.model';

class ChannelController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data: ChannelCreationAttributes = req.body;
      const result = await channelService.create(data);
      ResponseUtils.created(res, result, '渠道创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await channelService.findById(id);
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
      const result = await channelService.findAll(params);
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<ChannelAttributes> = req.body;
      const result = await channelService.update(id, data);
      ResponseUtils.success(res, result, '渠道更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await channelService.delete(id);
      ResponseUtils.success(res, null, '渠道删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      await channelService.bulkDelete(ids);
      ResponseUtils.success(res, null, '批量删除成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await channelService.updateStatus(id, status);
      ResponseUtils.success(res, null, '状态更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new ChannelController();
