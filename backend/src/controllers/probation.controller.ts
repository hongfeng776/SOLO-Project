import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import probationService from '../services/probation.service';

class ProbationController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await probationService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await probationService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await probationService.create(req.body);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await probationService.update(Number(id), req.body);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await probationService.remove(Number(id));
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async startReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await probationService.startReview(Number(id));
      res.json(Result.success(result, '已开始考核'));
    } catch (error) {
      next(error);
    }
  }

  async passProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewComment } = req.body;
      const result = await probationService.passProbation(Number(id), reviewComment);
      res.json(Result.success(result, '已通过转正'));
    } catch (error) {
      next(error);
    }
  }

  async failProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewComment } = req.body;
      const result = await probationService.failProbation(Number(id), reviewComment);
      res.json(Result.success(result, '已标记未通过'));
    } catch (error) {
      next(error);
    }
  }

  async extendProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { extendDays, reason } = req.body;
      const result = await probationService.extendProbation(Number(id), extendDays, reason);
      res.json(Result.success(result, '已延长试用期'));
    } catch (error) {
      next(error);
    }
  }

  async getExpiringSoon(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const result = await probationService.getExpiringSoon(Number(days) || 7);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new ProbationController();
