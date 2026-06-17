import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import companyService from '../services/company.service';
import { UserRole } from '../constants/recruitment.enum';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    companyId?: number;
  };
}

class CompanyController {
  async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await companyService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await companyService.getDetailWithLogs(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkQualificationApproved(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await companyService.checkQualificationApproved(Number(id));
      res.json(Result.success({ approved: result }));
    } catch (error) {
      next(error);
    }
  }

  async getMatchingJobCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { industry } = req.query;
      const result = await companyService.getMatchingJobCategories(String(industry));
      res.json(Result.success({ categories: result }));
    } catch (error) {
      next(error);
    }
  }

  async getMatchingRecruitRange(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { scale } = req.query;
      const result = await companyService.getMatchingRecruitRange(String(scale));
      res.json(Result.success({ range: result }));
    } catch (error) {
      next(error);
    }
  }

  async validateData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await companyService.validateData(req.body, id ? Number(id) : undefined);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await companyService.create(req.body, currentUser);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await companyService.update(Number(id), req.body, currentUser);
      const message = result.needAudit ? '提交审核成功' : '更新成功';
      res.json(Result.success(result, message));
    } catch (error) {
      next(error);
    }
  }

  async approveChange(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { auditRemark } = req.body;
      const currentUser = req.user!;
      const result = await companyService.approveChange(Number(id), auditRemark || '', currentUser);
      res.json(Result.success(result, '审核通过'));
    } catch (error) {
      next(error);
    }
  }

  async rejectChange(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const currentUser = req.user!;
      await companyService.rejectChange(Number(id), rejectReason || '', currentUser);
      res.json(Result.success(null, '已驳回'));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, updateData, effectiveMode } = req.body;
      const currentUser = req.user!;
      const result = await companyService.batchUpdate(
        ids,
        updateData,
        currentUser,
        effectiveMode || 'global'
      );
      res.json(Result.success(result, '批量操作完成'));
    } catch (error) {
      next(error);
    }
  }

  async getChangeLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await companyService.getChangeLogs(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await companyService.remove(Number(id));
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await companyService.batchRemove(ids);
      res.json(Result.success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

export default new CompanyController();
