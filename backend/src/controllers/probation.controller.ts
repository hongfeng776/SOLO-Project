import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import probationService, { IUserContext } from '../services/probation.service';
import { UserRole, JobCategory } from '../constants/recruitment.enum';
import { ForbiddenError, ParamError } from '../utils/app-error';

class ProbationController {
  private extractUser(req: Request): IUserContext {
    const user = req.user || {} as any;
    return {
      id: user.id || 0,
      username: user.username,
      realName: user.realName || user.name || user.username,
      role: (user.role as UserRole) || UserRole.HR,
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || (req.socket as any)?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  private isAdmin(req: Request): boolean {
    return req.user?.role === UserRole.ADMIN;
  }

  private assertAdmin(req: Request) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenError('无权限操作，需要管理员角色');
    }
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await probationService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const result = await probationService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const result = await probationService.getDetail(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkPrerequisites(req: Request, res: Response, next: NextFunction) {
    try {
      const { onboardId } = req.query;
      if (!onboardId || isNaN(Number(onboardId))) {
        throw new ParamError('onboardId参数无效');
      }
      const onboard = await probationService.checkPrerequisites(Number(onboardId));
      res.json(Result.success({
        canCreate: true,
        onboard: {
          id: onboard.id,
          name: (onboard as any).name,
          status: onboard.status,
          jobId: onboard.jobId,
          resumeId: onboard.resumeId,
        },
      }, '前置条件校验通过'));
    } catch (error) {
      next(error);
    }
  }

  async getDefaultMatching(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.query;
      if (!jobId || isNaN(Number(jobId))) {
        throw new ParamError('jobId参数无效');
      }
      const durationMatch = await probationService.matchDurationByJobCategory(Number(jobId));
      const indicators = await probationService.generateIndicatorsFromJob(Number(jobId));
      res.json(Result.success({
        ...durationMatch,
        indicators,
        indicatorsCount: indicators.length,
        totalWeight: indicators.reduce((s, i) => s + Number(i.weight), 0),
      }));
    } catch (error) {
      next(error);
    }
  }

  async validateDuration(req: Request, res: Response, next: NextFunction) {
    try {
      const { proposedMonths, jobCategory } = req.body;
      if (proposedMonths === undefined || proposedMonths === null) {
        throw new ParamError('proposedMonths参数必填');
      }
      if (!jobCategory) {
        throw new ParamError('jobCategory参数必填');
      }
      const result = probationService.validateDurationAdjust(
        Number(proposedMonths),
        jobCategory as string
      );
      res.json(Result.success({
        ...result,
        proposedMonths: Number(proposedMonths),
        jobCategory,
      }, '时长校验通过'));
    } catch (error) {
      next(error);
    }
  }

  async createProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { onboardId, duration, reason } = req.body;
      if (!onboardId || isNaN(Number(onboardId))) {
        throw new ParamError('onboardId参数无效');
      }
      const user = this.extractUser(req);
      const result = await probationService.createProbation(
        Number(onboardId),
        duration !== undefined ? Number(duration) : undefined,
        reason as string | undefined,
        user
      );
      res.json(Result.success(result, '试用期创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async updateDuration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { newDuration, reason } = req.body;
      if (newDuration === undefined || newDuration === null) {
        throw new ParamError('newDuration参数必填');
      }
      if (!reason || String(reason).trim() === '') {
        throw new ParamError('请填写调整原因(reason)');
      }
      const user = this.extractUser(req);
      const result = await probationService.updateDuration(
        Number(id),
        Number(newDuration),
        reason as string,
        user
      );
      res.json(Result.success(result, '试用期时长调整成功'));
    } catch (error) {
      next(error);
    }
  }

  async setAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { indicators } = req.body;
      if (!indicators || !Array.isArray(indicators)) {
        throw new ParamError('indicators参数必须为数组');
      }
      const user = this.extractUser(req);
      const result = await probationService.setAssessments(
        Number(id),
        indicators,
        user
      );
      res.json(Result.success(result, '考核指标设置成功'));
    } catch (error) {
      next(error);
    }
  }

  async passProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { finalScore, comment } = req.body;
      const user = this.extractUser(req);
      const result = await probationService.passProbation(
        Number(id),
        finalScore !== undefined ? Number(finalScore) : undefined,
        comment as string | undefined,
        user
      );
      res.json(Result.success(result, '转正通过操作成功'));
    } catch (error) {
      next(error);
    }
  }

  async failProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { finalScore, comment } = req.body;
      const user = this.extractUser(req);
      const result = await probationService.failProbation(
        Number(id),
        finalScore !== undefined ? Number(finalScore) : undefined,
        comment as string | undefined,
        user
      );
      res.json(Result.success(result, '转正不通过操作成功'));
    } catch (error) {
      next(error);
    }
  }

  async extendProbation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { extendDays, reason } = req.body;
      if (extendDays === undefined || extendDays === null) {
        throw new ParamError('extendDays参数必填');
      }
      if (!reason || String(reason).trim() === '') {
        throw new ParamError('请填写延长原因(reason)');
      }
      const user = this.extractUser(req);
      const result = await probationService.extendProbation(
        Number(id),
        Number(extendDays),
        reason as string,
        user
      );
      res.json(Result.success(result, '试用期延长成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchSetAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertAdmin(req);
      const { list, normalizeBy } = req.body;
      if (!list || !Array.isArray(list)) {
        throw new ParamError('list参数必须为数组');
      }
      if (normalizeBy !== undefined && !['onboardBatch', 'jobCategory'].includes(normalizeBy)) {
        throw new ParamError('normalizeBy仅支持 onboardBatch 或 jobCategory');
      }
      const user = this.extractUser(req);
      const result = await probationService.batchSetAssessments(
        list,
        normalizeBy as 'onboardBatch' | 'jobCategory' | undefined,
        user
      );
      res.json(
        Result.success(
          result,
          `批量设置考核：成功${result.success}条，失败${result.failed}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertAdmin(req);
      const { ids, action, params } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new ParamError('ids参数必须为数组');
      }
      if (!action || !['pass', 'fail', 'extend'].includes(action)) {
        throw new ParamError('action必须为 pass | fail | extend');
      }
      const user = this.extractUser(req);
      const result = await probationService.batchUpdateStatus(
        ids,
        action as 'pass' | 'fail' | 'extend',
        params,
        user
      );
      const actionLabel: Record<string, string> = {
        pass: '转正通过',
        fail: '转正不通过',
        extend: '延长试用期',
      };
      res.json(
        Result.success(
          result,
          `批量${actionLabel[action]}：成功${result.success}条，失败${result.failed}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async syncExpiringStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await probationService.syncExpiringStatus();
      res.json(
        Result.success(
          result,
          `同步完成：更新${result.updated}条，预警${result.warnings}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getPassRateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { department, jobCategory, onboardBatch, startDate, endDate } = req.query;
      const result = await probationService.getPassRateReport({
        department: department as string | undefined,
        jobCategory: jobCategory as string | undefined,
        onboardBatch: onboardBatch as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getExpiringList(req: Request, res: Response, next: NextFunction) {
    try {
      const { days, includeOverdue } = req.query;
      const result = await probationService.getExpiringList(
        days !== undefined ? Number(days) : 7,
        includeOverdue === undefined ? true : String(includeOverdue) === 'true'
      );
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new ProbationController();
