import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import qualificationService from '../services/qualification.service';

class QualificationController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await qualificationService.getList(req.query, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await qualificationService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await qualificationService.create(req.body, req.user);
      res.json(Result.success(result, '提交成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await qualificationService.update(Number(id), req.body, req.user);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await qualificationService.remove(Number(id), req.user);
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const count = await qualificationService.batchRemove(ids, req.user);
      res.json(Result.success({ count }, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { auditRemark } = req.body;
      const result = await qualificationService.approve(Number(id), auditRemark, req.user);
      res.json(Result.success(result, '审核通过'));
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const result = await qualificationService.reject(Number(id), rejectReason, req.user);
      res.json(Result.success(result, '已驳回'));
    } catch (error) {
      next(error);
    }
  }

  async invalidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await qualificationService.invalidate(Number(id), req.user);
      res.json(Result.success(result, '已作废'));
    } catch (error) {
      next(error);
    }
  }

  async batchImport(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataList } = req.body;
      const result = await qualificationService.batchImport(dataList, req.user);
      res.json(Result.success(result, '批量导入完成'));
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await qualificationService.getAuditLogs(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkDuplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { unifiedCreditCode, excludeId } = req.query;
      const result = await qualificationService.checkDuplicateForSubmit(
        String(unifiedCreditCode),
        excludeId ? Number(excludeId) : undefined
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateForSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await qualificationService.validateForSubmit(req.body);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateCreditCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const result = qualificationService.validateCreditCode(String(code));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new QualificationController();
