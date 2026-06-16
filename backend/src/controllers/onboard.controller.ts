import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import onboardService from '../services/onboard.service';

class OnboardController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await onboardService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardService.create(req.body);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await onboardService.update(Number(id), req.body);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await onboardService.remove(Number(id));
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await onboardService.confirm(Number(id));
      res.json(Result.success(result, '确认成功'));
    } catch (error) {
      next(error);
    }
  }

  async markOnboarded(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await onboardService.markOnboarded(Number(id));
      res.json(Result.success(result, '已标记入职'));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await onboardService.cancel(Number(id));
      res.json(Result.success(result, '已取消'));
    } catch (error) {
      next(error);
    }
  }
}

export default new OnboardController();
