import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import resumeService from '../services/resume.service';
import resumeScreenService from '../services/resume-screen.service';
import { JwtPayload } from '../middleware/auth.middleware';

interface CustomRequest extends Request {
  user?: JwtPayload;
}

class ResumeController {
  async getList(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.getList(req.query, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.getById(Number(id), req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.create(req.body, req.user);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.update(Number(id), req.body, req.user);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await resumeService.remove(Number(id), req.user);
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await resumeService.batchRemove(ids, req.user);
      res.json(Result.success(null, '批量删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await resumeService.updateStatus(Number(id), status, req.user);
      res.json(Result.success(result, '状态更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async uploadAndParse(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { fileInfo, jobId, content } = req.body;
      const result = await resumeService.uploadAndParse(fileInfo, jobId, content, req.user);
      res.json(Result.success(result, '上传解析完成'));
    } catch (error) {
      next(error);
    }
  }

  async retryParse(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const result = await resumeService.retryParse(Number(id), content, req.user);
      res.json(Result.success(result, '重试解析完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchUploadAndParse(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { fileList, jobId, contents } = req.body;
      const result = await resumeService.batchUploadAndParse(fileList, jobId, contents, req.user);
      res.json(Result.success(result, '批量上传解析完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchRetryParse(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const result = await resumeService.batchRetryParse(ids, req.user);
      res.json(Result.success(result, '批量重试解析完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchTriggerParse(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const result = await resumeService.batchTriggerParse(ids, req.user);
      res.json(Result.success(result, '批量触发解析完成'));
    } catch (error) {
      next(error);
    }
  }

  async getParseLogs(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.getParseLogs(Number(id), req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getFailedList(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.getFailedResumeList(req.query, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async exportExceptionList(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await resumeService.exportExceptionList(req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async completeInfo(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeService.completeResumeInfo(Number(id), req.body, req.user);
      res.json(Result.success(result, '补全信息成功'));
    } catch (error) {
      next(error);
    }
  }

  async unlockResume(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await resumeService.unlockResume(Number(id), reason, req.user);
      res.json(Result.success(result, '解锁成功'));
    } catch (error) {
      next(error);
    }
  }

  async validateFile(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { fileName, fileSize } = req.body;
      const result = resumeService.validateFile(fileName, fileSize);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkDuplicate(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, excludeId } = req.body;
      const result = await resumeService.checkDuplicate(name, phone, excludeId);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async screenResumes(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { jobId, conditions } = req.body;
      const result = await resumeScreenService.screenResumes(jobId, conditions, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchScreenResumes(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { jobId, conditions } = req.body;
      const result = await resumeScreenService.batchScreenResumes(jobId, conditions, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async updateMatchLevel(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeScreenService.updateMatchLevel(Number(id), req.user);
      res.json(Result.success(result, '匹配等级更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async refreshJobMatchLevels(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.body;
      const result = await resumeScreenService.refreshJobMatchLevels(jobId, req.user);
      res.json(Result.success(result, '岗位关联简历匹配等级刷新完成'));
    } catch (error) {
      next(error);
    }
  }

  async tagResume(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tag } = req.body;
      const result = await resumeScreenService.tagResume(Number(id), tag, req.user);
      res.json(Result.success(result, '标记成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchTagResumes(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { ids, tag } = req.body;
      const result = await resumeScreenService.batchTagResumes(ids, tag, req.user);
      res.json(Result.success(result, '批量标记完成'));
    } catch (error) {
      next(error);
    }
  }

  async saveScreenTemplate(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const result = await resumeScreenService.saveScreenTemplate(req.body, req.user);
      res.json(Result.success(result, '模板保存成功'));
    } catch (error) {
      next(error);
    }
  }

  async getScreenTemplates(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const jobId = req.query.jobId ? Number(req.query.jobId) : undefined;
      const result = await resumeScreenService.getScreenTemplates(jobId, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async deleteScreenTemplate(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await resumeScreenService.deleteScreenTemplate(Number(id), req.user);
      res.json(Result.success(null, '模板删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async useScreenTemplate(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { jobId } = req.body;
      const result = await resumeScreenService.useScreenTemplate(Number(id), jobId, req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getScreenLogs(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await resumeScreenService.getScreenLogs(Number(id), req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getMatchOptimizationData(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.query;
      const result = await resumeScreenService.getMatchOptimizationData(Number(jobId), req.user);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkScreenPreconditions(req: CustomRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.query;
      const result = await resumeScreenService.checkPreconditions(Number(jobId));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new ResumeController();
