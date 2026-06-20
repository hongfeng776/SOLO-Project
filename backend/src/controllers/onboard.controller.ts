import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Result, ErrorCode } from '../utils/result';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/app-error';
import { UserRole, OnboardStatus, OnboardOperationAction, JOB_LEVEL_SALARY_RANGE, InterviewResult, ResumeStatus } from '../constants/recruitment.enum';
import onboardDao from '../dao/onboard.dao';
import { Onboard, OnboardOperationLog, OnboardLedger, Resume, Job, User, Interview } from '../models';
import { IPaginationResult } from '../dao/base.dao';

class OnboardController {
  private extractOperator(req: Request) {
    const user = req.user || {} as any;
    return {
      operatorId: user.id,
      operatorName: user.username || user.name,
      operatorRole: user.role,
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || (req.socket as any)?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  private isAdmin(req: Request): boolean {
    return req.user?.role === UserRole.ADMIN;
  }

  private async createOperationLog(
    onboardId: number,
    action: OnboardOperationAction,
    ctx: any,
    beforeData?: any,
    afterData?: any,
    changedFields?: string[],
    remark?: string
  ) {
    return OnboardOperationLog.create({
      onboardId,
      action,
      operatorId: ctx.operatorId,
      operatorName: ctx.operatorName,
      operatorRole: ctx.operatorRole,
      beforeData: beforeData ? JSON.stringify(beforeData) : undefined,
      afterData: afterData ? JSON.stringify(afterData) : undefined,
      changedFields: changedFields ? JSON.stringify(changedFields) : undefined,
      remark,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        status,
        resumeId,
        jobId,
        expectOnboardDateStart,
        expectOnboardDateEnd,
        onboardDate,
        department,
        hrOperatorId,
        name,
        phone,
        page,
        pageSize,
      } = req.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }
      if (resumeId) {
        where.resumeId = Number(resumeId);
      }
      if (jobId) {
        where.jobId = Number(jobId);
      }
      if (expectOnboardDateStart || expectOnboardDateEnd) {
        where.expectOnboardDate = {};
        if (expectOnboardDateStart) {
          where.expectOnboardDate[Op.gte] = new Date(expectOnboardDateStart as string);
        }
        if (expectOnboardDateEnd) {
          where.expectOnboardDate[Op.lte] = new Date(expectOnboardDateEnd as string);
        }
      }
      if (onboardDate) {
        where.onboardDate = onboardDate;
      }
      if (department) {
        where.department = { [Op.like]: `%${department}%` };
      }
      if (hrOperatorId) {
        where.hrOperatorId = Number(hrOperatorId);
      }
      if (name) {
        where.name = { [Op.like]: `%${name}%` };
      }
      if (phone) {
        where.phone = { [Op.like]: `%${phone}%` };
      }

      const result: IPaginationResult<any> = await onboardDao.paginate(
        { page, pageSize } as any,
        {
          where,
          include: [
            { model: Resume, as: 'resume' },
            { model: Job, as: 'job' },
            { model: User, as: 'hrOperator' },
            { model: User, as: 'auditUser' },
            { model: OnboardLedger, as: 'ledger' },
          ],
          order: [['created_at', 'DESC']],
        }
      );

      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const onboard = await Onboard.findByPk(Number(id), {
        include: [
          { model: Resume, as: 'resume' },
          { model: Job, as: 'job' },
          { model: User, as: 'hrOperator' },
          { model: User, as: 'auditUser' },
          { model: OnboardLedger, as: 'ledger' },
          {
            model: OnboardOperationLog,
            as: 'operationLogs',
            include: [{ model: User, as: 'operator' }],
            order: [['created_at', 'DESC']],
          },
        ],
      });

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      res.json(Result.success(onboard));
    } catch (error) {
      next(error);
    }
  }

  async getOperationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const onboard = await Onboard.findByPk(Number(id));
      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      const logs = await OnboardOperationLog.findAll({
        where: { onboardId: Number(id) },
        include: [{ model: User, as: 'operator' }],
        order: [['created_at', 'DESC']],
      });

      res.json(Result.success(logs));
    } catch (error) {
      next(error);
    }
  }

  async checkPrerequisites(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeId } = req.params;
      const resume = await Resume.findByPk(Number(resumeId), {
        include: [
          { model: Job, as: 'job' },
          {
            model: Interview,
            as: 'interviews',
            order: [['created_at', 'DESC']],
          },
        ],
      });

      if (!resume) {
        throw new NotFoundError('简历不存在');
      }

      const reasons: string[] = [];
      let canRegister = true;

      const interviews = (resume as any).interviews || [];
      const hasPassedInterview = interviews.some(
        (i: any) => i.result === InterviewResult.PASS
      );

      if (!hasPassedInterview) {
        canRegister = false;
        reasons.push('面试未通过');
      }

      const existingOnboard = await Onboard.findOne({
        where: { resumeId: Number(resumeId) },
      });

      if (existingOnboard) {
        canRegister = false;
        reasons.push('已存在入职登记');
      }

      res.json(
        Result.success({
          canRegister,
          reasons,
          resume,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async validateSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobLevel, salaryMin, salaryMax } = req.query;

      if (!jobLevel) {
        throw new BadRequestError('缺少职级参数');
      }

      const range = JOB_LEVEL_SALARY_RANGE[jobLevel as string];
      const sm = Number(salaryMin);
      const sx = Number(salaryMax);

      if (!range) {
        res.json(
          Result.success({
            matched: true,
            reason: '未配置该职级薪资范围',
            range: null,
            salaryMin: sm,
            salaryMax: sx,
          })
        );
        return;
      }

      let matched = true;
      const reasons: string[] = [];

      if (salaryMin !== undefined) {
        if (sm < range.min) {
          matched = false;
          reasons.push(`薪资下限${sm}K低于职级最低要求${range.min}K`);
        }
        if (sm > range.max) {
          matched = false;
          reasons.push(`薪资下限${sm}K高于职级最高要求${range.max}K`);
        }
      }

      if (salaryMax !== undefined) {
        if (sx < range.min) {
          matched = false;
          reasons.push(`薪资上限${sx}K低于职级最低要求${range.min}K`);
        }
        if (sx > range.max) {
          matched = false;
          reasons.push(`薪资上限${sx}K高于职级最高要求${range.max}K`);
        }
      }

      if (salaryMin !== undefined && salaryMax !== undefined && sm > sx) {
        matched = false;
        reasons.push('薪资下限不能高于上限');
      }

      res.json(
        Result.success({
          matched,
          reasons,
          range,
          salaryMin: sm,
          salaryMax: sx,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const data = {
        ...req.body,
        hrOperatorId: req.body.hrOperatorId ?? ctx.operatorId,
        hrOperatorName: req.body.hrOperatorName ?? ctx.operatorName,
        status: OnboardStatus.PENDING_AUDIT,
      };

      const onboard = await Onboard.create(data);

      await this.createOperationLog(
        onboard.id,
        OnboardOperationAction.CREATE,
        ctx,
        null,
        onboard.toJSON(),
        null,
        '创建入职登记'
      );

      res.json(Result.success(onboard, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (
        onboard.status === OnboardStatus.AUDIT_PASSED ||
        onboard.status === OnboardStatus.ONBOARDED
      ) {
        throw new BadRequestError('当前状态不允许修改');
      }

      const beforeData = onboard.toJSON();
      const changedFields = Object.keys(req.body);

      await onboard.update(req.body);

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.UPDATE,
        ctx,
        beforeData,
        onboard.toJSON(),
        changedFields,
        '修改入职信息'
      );

      res.json(Result.success(onboard, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (onboard.status !== OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError('只有待审核状态可以提交审核');
      }

      const beforeData = onboard.toJSON();

      await onboard.update({
        status: OnboardStatus.PENDING_AUDIT,
        submitTime: new Date(),
      });

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.SUBMIT,
        ctx,
        beforeData,
        onboard.toJSON(),
        ['status', 'submitTime'],
        '提交审核'
      );

      res.json(Result.success(onboard, '提交审核成功'));
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      if (!this.isAdmin(req)) {
        throw new ForbiddenError('无权限操作，需要管理员角色');
      }

      const { id } = req.params;
      const { remark } = req.body;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (onboard.status !== OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError('只有待审核状态可以审核通过');
      }

      const beforeData = onboard.toJSON();

      await onboard.update({
        status: OnboardStatus.AUDIT_PASSED,
        auditTime: new Date(),
        auditUserId: ctx.operatorId,
        auditUserName: ctx.operatorName,
        auditRemark: remark,
      });

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.APPROVE,
        ctx,
        beforeData,
        onboard.toJSON(),
        ['status', 'auditTime', 'auditUserId', 'auditUserName', 'auditRemark'],
        remark || '审核通过'
      );

      res.json(Result.success(onboard, '审核通过'));
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      if (!this.isAdmin(req)) {
        throw new ForbiddenError('无权限操作，需要管理员角色');
      }

      const { id } = req.params;
      const { rejectReason, remark } = req.body;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (onboard.status !== OnboardStatus.PENDING_AUDIT) {
        throw new BadRequestError('只有待审核状态可以审核驳回');
      }

      const beforeData = onboard.toJSON();

      await onboard.update({
        status: OnboardStatus.AUDIT_REJECTED,
        auditTime: new Date(),
        auditUserId: ctx.operatorId,
        auditUserName: ctx.operatorName,
        auditRemark: remark,
        rejectReason,
      });

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.REJECT,
        ctx,
        beforeData,
        onboard.toJSON(),
        ['status', 'auditTime', 'auditUserId', 'auditUserName', 'auditRemark', 'rejectReason'],
        rejectReason || remark || '审核驳回'
      );

      res.json(Result.success(onboard, '审核驳回'));
    } catch (error) {
      next(error);
    }
  }

  async resubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (onboard.status !== OnboardStatus.AUDIT_REJECTED) {
        throw new BadRequestError('只有审核驳回状态可以重新提交');
      }

      const beforeData = onboard.toJSON();
      const changedFields = Object.keys(req.body);

      await onboard.update({
        ...req.body,
        status: OnboardStatus.PENDING_AUDIT,
        submitTime: new Date(),
        rejectReason: null,
      });

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.RESUBMIT,
        ctx,
        beforeData,
        onboard.toJSON(),
        ['status', 'submitTime', 'rejectReason', ...changedFields],
        '重新提交审核'
      );

      res.json(Result.success(onboard, '重新提交成功'));
    } catch (error) {
      next(error);
    }
  }

  async markOnboarded(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { actualOnboardDate } = req.body;
      const ctx = this.extractOperator(req);
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (onboard.status !== OnboardStatus.AUDIT_PASSED) {
        throw new BadRequestError('只有审核通过状态可以标记已入职');
      }

      const beforeData = onboard.toJSON();

      await onboard.update({
        status: OnboardStatus.ONBOARDED,
        actualOnboardDate: actualOnboardDate ? new Date(actualOnboardDate) : new Date(),
        onboardDate: actualOnboardDate ? new Date(actualOnboardDate) : new Date(),
      });

      const ledgerData = {
        onboardId: onboard.id,
        ledgerNo: `LDG${Date.now()}`,
        employeeNo: `EMP${Date.now()}`,
        name: onboard.name,
        gender: onboard.gender,
        phone: onboard.phone,
        email: onboard.email,
        idCard: onboard.idCard,
        department: onboard.department,
        position: onboard.position,
        jobLevel: onboard.jobLevel,
        onboardDate: onboard.onboardDate,
        workType: onboard.workType,
        workLocation: onboard.workLocation,
        offerSalary: onboard.offerSalary,
        salaryBase: onboard.salaryBase,
        salaryPerformance: onboard.salaryPerformance,
        salaryUnit: onboard.salaryUnit,
        probationPeriod: onboard.probationPeriod,
        probationSalary: onboard.probationSalary,
        contractType: onboard.contractType,
        contractTerm: onboard.contractTerm,
        reportTo: onboard.reportTo,
        contractSigned: onboard.contractSigned,
        materialsComplete: onboard.materialsComplete,
        socialSecurityAccount: onboard.socialSecurityAccount,
        providentFundAccount: onboard.providentFundAccount,
        generatedBy: ctx.operatorId,
        generatedByName: ctx.operatorName,
        originalData: JSON.stringify(onboard.toJSON()),
      };

      const existingLedger = await OnboardLedger.findOne({
        where: { onboardId: Number(id) },
      });

      if (!existingLedger) {
        await OnboardLedger.create(ledgerData);
      }

      await Resume.update(
        { status: ResumeStatus.HIRED },
        { where: { id: onboard.resumeId } }
      );

      await this.createOperationLog(
        Number(id),
        OnboardOperationAction.MARK_ONBOARDED,
        ctx,
        beforeData,
        onboard.toJSON(),
        ['status', 'actualOnboardDate', 'onboardDate'],
        '标记已入职'
      );

      res.json(Result.success(onboard, '已标记入职'));
    } catch (error) {
      next(error);
    }
  }

  async batchCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const { list, normalizeBy } = req.body;

      if (!Array.isArray(list) || list.length === 0) {
        throw new BadRequestError('批量数据不能为空');
      }

      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const item of list) {
        try {
          const data = {
            ...item,
            hrOperatorId: item.hrOperatorId ?? ctx.operatorId,
            hrOperatorName: item.hrOperatorName ?? ctx.operatorName,
            status: OnboardStatus.PENDING_AUDIT,
          };

          if (normalizeBy === 'date' || normalizeBy === 'both') {
            if (data.expectOnboardDate) {
              const d = new Date(data.expectOnboardDate);
              d.setHours(0, 0, 0, 0);
              data.expectOnboardDate = d;
            }
          }

          if (normalizeBy === 'job' || normalizeBy === 'both') {
            if (data.jobId) {
              const job = await Job.findByPk(data.jobId);
              if (job) {
                data.department = data.department || (job as any).department;
                data.position = data.position || (job as any).title;
              }
            }
          }

          const onboard = await Onboard.create(data);
          successCount++;
          results.push({ id: onboard.id, success: true, data: onboard });
        } catch (err: any) {
          failCount++;
          results.push({ success: false, error: err.message, data: item });
        }
      }

      await this.createOperationLog(
        0,
        OnboardOperationAction.BATCH_CREATE,
        ctx,
        null,
        { total: list.length, successCount, failCount },
        null,
        `批量录入：成功${successCount}条，失败${failCount}条`
      );

      res.json(
        Result.success(
          { total: list.length, successCount, failCount, results },
          `批量录入完成：成功${successCount}条，失败${failCount}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchSubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = this.extractOperator(req);
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('ID列表不能为空');
      }

      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const onboard = await Onboard.findByPk(Number(id));
          if (!onboard) {
            failCount++;
            results.push({ id, success: false, error: '入职记录不存在' });
            continue;
          }

          if (onboard.status !== OnboardStatus.PENDING_AUDIT) {
            failCount++;
            results.push({ id, success: false, error: '状态不允许提交' });
            continue;
          }

          const beforeData = onboard.toJSON();
          await onboard.update({
            status: OnboardStatus.PENDING_AUDIT,
            submitTime: new Date(),
          });

          await this.createOperationLog(
            Number(id),
            OnboardOperationAction.SUBMIT,
            ctx,
            beforeData,
            onboard.toJSON(),
            ['status', 'submitTime'],
            '批量提交审核'
          );

          successCount++;
          results.push({ id, success: true });
        } catch (err: any) {
          failCount++;
          results.push({ id, success: false, error: err.message });
        }
      }

      await this.createOperationLog(
        0,
        OnboardOperationAction.BATCH_SUBMIT,
        ctx,
        null,
        { total: ids.length, successCount, failCount },
        null,
        `批量提交：成功${successCount}条，失败${failCount}条`
      );

      res.json(
        Result.success(
          { total: ids.length, successCount, failCount, results },
          `批量提交完成：成功${successCount}条，失败${failCount}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async batchApprove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!this.isAdmin(req)) {
        throw new ForbiddenError('无权限操作，需要管理员角色');
      }

      const ctx = this.extractOperator(req);
      const { ids, remark } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('ID列表不能为空');
      }

      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const onboard = await Onboard.findByPk(Number(id));
          if (!onboard) {
            failCount++;
            results.push({ id, success: false, error: '入职记录不存在' });
            continue;
          }

          if (onboard.status !== OnboardStatus.PENDING_AUDIT) {
            failCount++;
            results.push({ id, success: false, error: '状态不允许审核' });
            continue;
          }

          const beforeData = onboard.toJSON();
          await onboard.update({
            status: OnboardStatus.AUDIT_PASSED,
            auditTime: new Date(),
            auditUserId: ctx.operatorId,
            auditUserName: ctx.operatorName,
            auditRemark: remark,
          });

          await this.createOperationLog(
            Number(id),
            OnboardOperationAction.APPROVE,
            ctx,
            beforeData,
            onboard.toJSON(),
            ['status', 'auditTime', 'auditUserId', 'auditUserName', 'auditRemark'],
            remark || '批量审核通过'
          );

          successCount++;
          results.push({ id, success: true });
        } catch (err: any) {
          failCount++;
          results.push({ id, success: false, error: err.message });
        }
      }

      await this.createOperationLog(
        0,
        OnboardOperationAction.BATCH_APPROVE,
        ctx,
        null,
        { total: ids.length, successCount, failCount },
        null,
        `批量审核：成功${successCount}条，失败${failCount}条`
      );

      res.json(
        Result.success(
          { total: ids.length, successCount, failCount, results },
          `批量审核完成：成功${successCount}条，失败${failCount}条`
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const onboard = await Onboard.findByPk(Number(id));

      if (!onboard) {
        throw new NotFoundError('入职记录不存在');
      }

      if (
        onboard.status === OnboardStatus.AUDIT_PASSED ||
        onboard.status === OnboardStatus.ONBOARDED
      ) {
        throw new BadRequestError('当前状态不允许删除');
      }

      await OnboardOperationLog.destroy({ where: { onboardId: Number(id) } });
      await OnboardLedger.destroy({ where: { onboardId: Number(id) } });
      await onboard.destroy();

      res.json(Result.success(null, '删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

export default new OnboardController();
