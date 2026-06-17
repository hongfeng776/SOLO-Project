import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import recruitmentConfigService from '../services/recruitment-config.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    companyId?: number;
  };
}

class RecruitmentConfigController {
  async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await recruitmentConfigService.getList(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getByCompanyId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.getByCompanyId(Number(companyId), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.getById(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkInfoCompleteness(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const result = await recruitmentConfigService.checkInfoCompleteness(Number(companyId));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchingTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { industry, jobCategory } = req.query;
      const result = await recruitmentConfigService.getMatchingTags(
        String(industry || ''),
        String(jobCategory || '')
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchingWelfareByIndustry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { industry } = req.query;
      const result = await recruitmentConfigService.getMatchingWelfareByIndustry(String(industry || ''));
      res.json(Result.success({ welfareTags: result }));
    } catch (error) {
      next(error);
    }
  }

  async validateConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { industry } = req.query;
      const result = recruitmentConfigService.validateConfig(req.body, String(industry || ''));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkDuplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await recruitmentConfigService.checkDuplicateConfig(
        id ? Number(id) : null,
        req.body
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.create(Number(companyId), req.body, currentUser);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.update(Number(id), req.body, currentUser);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async enable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.toggleStatus(Number(id), 'enabled', currentUser, remark);
      res.json(Result.success(result, '启用成功'));
    } catch (error) {
      next(error);
    }
  }

  async disable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.toggleStatus(Number(id), 'disabled', currentUser, remark);
      res.json(Result.success(result, '停用成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchEnable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.batchToggleStatus(ids, 'enabled', currentUser);
      res.json(Result.success(result, '批量启用完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchDisable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.batchToggleStatus(ids, 'disabled', currentUser);
      res.json(Result.success(result, '批量停用完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchReplaceWelfare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, oldTags, newTags } = req.body;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.batchReplaceWelfare(ids, oldTags, newTags, currentUser);
      res.json(Result.success(result, '批量替换完成'));
    } catch (error) {
      next(error);
    }
  }

  async getConfigLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await recruitmentConfigService.getConfigLogs(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getConfigLogsByConfigId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const currentUser = req.user!;
      const result = await recruitmentConfigService.getConfigLogsByConfigId(Number(configId), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new RecruitmentConfigController();
