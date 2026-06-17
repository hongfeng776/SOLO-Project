import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import jobService from '../services/job.service';

class JobController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.getList(req.query, (req as any).currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobService.create(req.body, (req as any).currentUser);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.update(Number(id), req.body, (req as any).currentUser);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await jobService.remove(Number(id), (req as any).currentUser);
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await jobService.batchRemove(ids, (req as any).currentUser);
      res.json(Result.success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async submitAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.submitAudit(Number(id), (req as any).currentUser);
      res.json(Result.success(result, '提交审核成功'));
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const result = await jobService.approve(Number(id), (req as any).currentUser, remark);
      res.json(Result.success(result, '审核通过'));
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const result = await jobService.reject(Number(id), rejectReason, (req as any).currentUser);
      res.json(Result.success(result, '已驳回'));
    } catch (error) {
      next(error);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.publish(Number(id), (req as any).currentUser);
      res.json(Result.success(result, '发布成功'));
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.close(Number(id), (req as any).currentUser);
      res.json(Result.success(result, '关闭成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobs } = req.body;
      const result = await jobService.batchCreate(jobs, (req as any).currentUser);
      res.json(Result.success(result, '批量创建完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchSubmitAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const result = await jobService.batchSubmitAudit(ids, (req as any).currentUser);
      res.json(Result.success(result, '批量提交完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, remark } = req.body;
      const result = await jobService.batchApprove(ids, (req as any).currentUser, remark);
      res.json(Result.success(result, '批量审核完成'));
    } catch (error) {
      next(error);
    }
  }

  async getOperationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.getOperationLogs(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateForSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await jobService.validateForSubmit(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getPreCheckInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const result = await jobService.getPreCheckInfo(Number(companyId), (req as any).currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getBatchFillConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, department } = req.query;
      const result = await jobService.batchFillByCategory(
        category as string,
        department as string | undefined
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new JobController();
