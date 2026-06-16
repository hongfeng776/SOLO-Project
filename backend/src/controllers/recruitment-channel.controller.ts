import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import recruitmentChannelService from '../services/recruitment-channel.service';

class RecruitmentChannelController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentChannelService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await recruitmentChannelService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentChannelService.create(req.body);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await recruitmentChannelService.update(Number(id), req.body);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await recruitmentChannelService.remove(Number(id));
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await recruitmentChannelService.batchRemove(ids);
      res.json(Result.success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async getAllEnabled(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recruitmentChannelService.getAllEnabled();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new RecruitmentChannelController();
