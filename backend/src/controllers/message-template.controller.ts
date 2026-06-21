import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import messageTemplateService from '../services/message-template.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    companyId?: number;
  };
}

class MessageTemplateController {
  async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await messageTemplateService.getList(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await messageTemplateService.getById(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getSceneConfigs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await messageTemplateService.getSceneConfigs();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async validateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = messageTemplateService.validateTemplate(req.body);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkDuplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { templateCode } = req.body;
      const result = await messageTemplateService.checkDuplicate(
        id ? Number(id) : null,
        templateCode
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await messageTemplateService.create(req.body, currentUser);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await messageTemplateService.update(Number(id), req.body, currentUser);
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
      const result = await messageTemplateService.updateStatus(Number(id), 'enabled', currentUser, remark);
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
      const result = await messageTemplateService.updateStatus(Number(id), 'disabled', currentUser, remark);
      res.json(Result.success(result, '停用成功'));
    } catch (error) {
      next(error);
    }
  }

  async setTesting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const currentUser = req.user!;
      const result = await messageTemplateService.updateStatus(Number(id), 'testing', currentUser, remark);
      res.json(Result.success(result, '设置测试状态成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchEnable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await messageTemplateService.batchEnable(ids, currentUser);
      res.json(Result.success(result, '批量启用完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchDisable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await messageTemplateService.batchDisable(ids, currentUser);
      res.json(Result.success(result, '批量停用完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchStandardize(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await messageTemplateService.batchStandardize(ids, currentUser);
      res.json(Result.success(result, '批量标准化完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchAdjustWeight(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, weight } = req.body;
      const currentUser = req.user!;
      const result = await messageTemplateService.batchAdjustWeight(ids, weight, currentUser);
      res.json(Result.success(result, '批量调整权重完成'));
    } catch (error) {
      next(error);
    }
  }

  async testTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await messageTemplateService.testTemplate(Number(id), req.body, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getTemplateLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await messageTemplateService.getTemplateLogs(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getTemplateLogsByTemplateId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params;
      const currentUser = req.user!;
      const result = await messageTemplateService.getTemplateLogsByTemplateId(Number(templateId), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getEnabledByScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { scene } = req.params;
      const result = await messageTemplateService.getEnabledTemplatesByScene(scene);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      await messageTemplateService.delete(Number(id), currentUser);
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageTemplateController();
