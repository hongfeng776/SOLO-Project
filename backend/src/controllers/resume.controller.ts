import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import resumeService from '../services/resume.service';

class ResumeController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.create(req.body);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.update(Number(id), req.body);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await resumeService.remove(Number(id));
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await resumeService.batchRemove(ids);
      res.json(Result.success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await resumeService.updateStatus(Number(id), status);
      res.json(Result.success(result, '状态更新成功'));
    } catch (error) {
      next(error);
    }
  }
}

export default new ResumeController();
