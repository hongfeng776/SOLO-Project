import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import interviewService from '../services/interview.service';

class InterviewController {
  private extractOperator(req: Request) {
    const user = (req as any).user || {};
    return {
      operatorId: user.id,
      operatorName: user.username || user.name,
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  private extractRole(req: Request): string | undefined {
    return (req as any).user?.role;
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getList(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await interviewService.getById(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getOperationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await interviewService.getOperationLogs(Number(id));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getStats(req.query);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const result = await interviewService.create(req.body, ctx);
      res.json(Result.success(result, result.message || '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const result = await interviewService.update(Number(id), req.body, ctx);
      res.json(Result.success(result, result.message || '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async confirmAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const result = await interviewService.confirmAppointment(Number(id), ctx);
      res.json(Result.success(result, result.message || '预约成功'));
    } catch (error) {
      next(error);
    }
  }

  async confirmByInterviewer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const result = await interviewService.confirmByInterviewer(Number(id), ctx);
      res.json(Result.success(result, result.message || '确认成功'));
    } catch (error) {
      next(error);
    }
  }

  async completeInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const result = await interviewService.completeInterview(Number(id), req.body, ctx);
      res.json(Result.success(result, result.message || '操作成功'));
    } catch (error) {
      next(error);
    }
  }

  async cancelInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const result = await interviewService.cancelInterview(Number(id), req.body, ctx);
      res.json(Result.success(result, result.message || '取消成功'));
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      await interviewService.remove(Number(id), ctx);
      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchRemove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const ctx = this.extractOperator(req);
      const results = [];
      for (const id of ids) {
        try {
          await interviewService.remove(id, ctx);
          results.push({ id, success: true });
        } catch (err: any) {
          results.push({ id, success: false, error: err.message });
        }
      }
      const successCount = results.filter((r) => r.success).length;
      res.json(Result.success({ total: ids.length, successCount, results }, `批量删除完成：成功${successCount}条`));
    } catch (error) {
      next(error);
    }
  }

  async validateTimeConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.validateTimeConflict(req.body);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchAppoint(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchAppoint(req.body.items, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchCancelOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchCancelOverdue(ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchSort(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const { ids, sortType } = req.body;
      const result = await interviewService.batchSort(ids, sortType, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchSupplementOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchSupplementOverdue(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchUpdatePendingResults(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchUpdatePendingResults(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async validateInterviewRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await interviewService.validateInterviewRecordApi(Number(id), req.body);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getRecordStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.query;
      const result = await interviewService.getRecordStats(jobId ? Number(jobId) : undefined);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async allocateInterviewer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const { targetInterviewerId, crossDomainConfirmed } = req.body;
      const result = await interviewService.allocateInterviewer(Number(id), targetInterviewerId, crossDomainConfirmed, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async updateInterviewerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const { interviewerId, newStatus } = req.body;
      const result = await interviewService.updateInterviewerStatus(interviewerId, newStatus, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async getAvailableInterviewers(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobCategory, date, domain } = req.query;
      const result = await interviewService.getAvailableInterviewers(jobCategory as string, date as string, domain as any);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async batchReplaceInterviewer(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchReplaceInterviewer(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchScheduleOptimize(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchScheduleOptimize(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async getInterviewerWorkload(req: Request, res: Response, next: NextFunction) {
    try {
      const { interviewerId } = req.params;
      const result = await interviewService.getInterviewerWorkload(Number(interviewerId));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getAllocationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { interviewId, interviewerId, operatorId, limit } = req.query;
      const result = await interviewService.getAllocationLogs({
        interviewId: interviewId ? Number(interviewId) : undefined,
        interviewerId: interviewerId ? Number(interviewerId) : undefined,
        operatorId: operatorId ? Number(operatorId) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkWarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.checkAndTriggerWarnings();
      res.json(Result.success(result, `预警检查完成：触发${result.triggered}条，更新${result.updated}条`));
    } catch (error) {
      next(error);
    }
  }

  async getWarningList(req: Request, res: Response, next: NextFunction) {
    try {
      const { warningStatus, warningLevel, sortBy, sortOrder, page, pageSize } = req.query;
      const result = await interviewService.getWarningList({
        warningStatus: warningStatus as any,
        warningLevel: warningLevel as any,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getWarningStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getWarningStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async handleOverdueInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.handleOverdueInterview(Number(id), req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchHandleOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchHandleOverdue(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async batchPostponeInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.batchPostponeInterviews(req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async dismissWarning(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.dismissWarning(Number(id), ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async markFalseAlarm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const result = await interviewService.markFalseAlarm(Number(id), req.body, ctx, role);
      res.json(Result.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  async getWarningLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { interviewId, handlerId, operatorId, limit } = req.query;
      const result = await interviewService.getWarningLogs({
        interviewId: interviewId ? Number(interviewId) : undefined,
        handlerId: handlerId ? Number(handlerId) : undefined,
        operatorId: operatorId ? Number(operatorId) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getOverdueRateStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await interviewService.getOverdueRateStats();
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async sortWarningList(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const role = this.extractRole(req);
      const { ids, strategy } = req.body;
      const result = await interviewService.sortWarningList(ids, strategy, ctx, role);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new InterviewController();
