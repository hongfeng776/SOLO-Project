import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import regularizationService, { IUserContext } from '../services/regularization.service';
import { UserRole } from '../constants/recruitment.enum';
import { ForbiddenError, ParamError } from '../utils/app-error';

class RegularizationController {
  private extractUser(req: Request): IUserContext {
    const user = req.user || ({} as any);
    return {
      id: user.id || 0,
      username: user.username,
      realName: user.realName || user.name || user.username,
      role: (user.role as UserRole) || UserRole.HR,
      department: (user as any).department,
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

  private isHrOrAdmin(req: Request): boolean {
    return req.user?.role === UserRole.HR || req.user?.role === UserRole.ADMIN;
  }

  private assertHrOrAdmin(req: Request) {
    if (!this.isHrOrAdmin(req)) {
      throw new ForbiddenError('无权限操作，需要HR或管理员角色');
    }
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regularizationService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regularizationService.getPendingList(req.query);
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
      const result = await regularizationService.getById(Number(id));
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
      const result = await regularizationService.getDetail(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkPrerequisites(req: Request, res: Response, next: NextFunction) {
    try {
      const { probationId } = req.query;
      if (!probationId || isNaN(Number(probationId))) {
        throw new ParamError('probationId参数无效');
      }
      const probation = await regularizationService.checkPrerequisites(Number(probationId));
      res.json(
        Result.success(
          {
            canApply: true,
            probation: {
              id: probation.id,
              name: probation.name,
              status: probation.status,
              department: probation.department,
              position: probation.position,
              endDate: probation.endDate,
              assessmentFinalScore: probation.assessmentFinalScore,
            },
          },
          '前置条件校验通过'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getApprovalFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobLevel, department } = req.query;
      const result = regularizationService.generateApprovalFlow(
        jobLevel as string | undefined,
        department as string | undefined
      );
      res.json(
        Result.success({
          nodes: result,
          totalNodes: result.length,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const result = await regularizationService.getApprovalFlowProgress(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getPassRateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { department, jobCategory, onboardBatch, recruiterHrId, startDate, endDate } =
        req.query;
      const result = await regularizationService.getPassRateReport({
        department: department as string | undefined,
        jobCategory: jobCategory as string | undefined,
        onboardBatch: onboardBatch as string | undefined,
        recruiterHrId: recruiterHrId ? Number(recruiterHrId) : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async createApply(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertHrOrAdmin(req);
      const { probationId, applyRemark, applyAttachments, finalScore, newSalaryBase, newSalaryPerformance, newSalaryTotal } =
        req.body;
      if (!probationId || isNaN(Number(probationId))) {
        throw new ParamError('probationId参数无效');
      }
      const user = this.extractUser(req);
      const result = await regularizationService.createApply(
        Number(probationId),
        {
          applyRemark: applyRemark as string | undefined,
          applyAttachments,
          finalScore: finalScore !== undefined ? Number(finalScore) : undefined,
          newSalaryBase: newSalaryBase as string | undefined,
          newSalaryPerformance: newSalaryPerformance as string | undefined,
          newSalaryTotal: newSalaryTotal as string | undefined,
        },
        user
      );
      res.json(Result.success(result, '转正申请创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async validateCompliance(req: Request, res: Response, next: NextFunction) {
    try {
      const { probationId, finalScore } = req.body;
      if (!probationId || isNaN(Number(probationId))) {
        throw new ParamError('probationId参数无效');
      }
      const probation = await regularizationService.checkPrerequisites(Number(probationId));
      const result = regularizationService.checkCompliance(
        probation.toJSON() as any,
        finalScore !== undefined ? { finalScore: Number(finalScore) } : undefined
      );
      const fitResult = regularizationService.calcRecruitmentFitScore(
        probation.toJSON() as any,
        finalScore !== undefined ? { finalScore: Number(finalScore) } : undefined
      );
      res.json(
        Result.success({
          compliance: result,
          recruitmentFit: fitResult,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async batchFilter(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertHrOrAdmin(req);
      const { onboardBatch, jobCategory, department, assessmentMinCount, includeNoAssessment } =
        req.body;
      const result = await regularizationService.batchFilterEligible({
        onboardBatch: onboardBatch as string | undefined,
        jobCategory: jobCategory as string | undefined,
        department: department as string | undefined,
        assessmentMinCount:
          assessmentMinCount !== undefined ? Number(assessmentMinCount) : undefined,
        includeNoAssessment: includeNoAssessment === true,
      });
      res.json(
        Result.success(
          result,
          `批量筛选完成：共${result.total}人，符合条件${result.eligible}人，不符合${result.ineligible}人`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchApply(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertHrOrAdmin(req);
      const { ids, applyRemark } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new ParamError('ids参数必须为数组');
      }
      const user = this.extractUser(req);
      const result = await regularizationService.batchApply(
        ids.map((id: any) => Number(id)),
        (applyRemark as string) || '',
        user
      );
      res.json(
        Result.success(
          result,
          `批量发起转正：成功${result.success}条，失败${result.failed}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchApprove(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertAdmin(req);
      const { ids, opinion } = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new ParamError('ids参数必须为数组');
      }
      const user = this.extractUser(req);
      const result = await regularizationService.batchApprove(
        ids.map((id: any) => Number(id)),
        (opinion as string) || '',
        user
      );
      res.json(
        Result.success(
          result,
          `批量审批通过：成功${result.success}条，失败${result.failed}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async syncPending(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertHrOrAdmin(req);
      const result = await regularizationService.syncPendingStatus();
      res.json(
        Result.success(
          result,
          `同步完成：处理${result.synced}条，新建${result.created}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async approveNode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { opinion, attachments } = req.body;
      const user = this.extractUser(req);
      const result = await regularizationService.approveNode(
        Number(id),
        (opinion as string) || '',
        attachments,
        user
      );
      res.json(Result.success(result, '节点审批通过'));
    } catch (error) {
      next(error);
    }
  }

  async rejectNode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { opinion } = req.body;
      if (!opinion || String(opinion).trim() === '') {
        throw new ParamError('请填写驳回原因(opinion)');
      }
      const user = this.extractUser(req);
      const result = await regularizationService.rejectNode(
        Number(id),
        opinion as string,
        user
      );
      res.json(Result.success(result, '节点审批驳回'));
    } catch (error) {
      next(error);
    }
  }

  async resubmit(req: Request, res: Response, next: NextFunction) {
    try {
      this.assertHrOrAdmin(req);
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        throw new ParamError('ID参数无效');
      }
      const { applyRemark, applyAttachments } = req.body;
      const user = this.extractUser(req);
      const result = await regularizationService.resubmit(
        Number(id),
        {
          applyRemark: applyRemark as string | undefined,
          applyAttachments,
        },
        user
      );
      res.json(Result.success(result, '重新提交成功'));
    } catch (error) {
      next(error);
    }
  }
}

export default new RegularizationController();
