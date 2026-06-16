import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessPage } from '../utils/response';
import { AuditQueryParams, AuditRequest, AuditApprovalRequest, AuditRuleRequest, AuditType, AuditRecordStatus } from '../types';
import { AuditService } from '../services';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async pendingList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: AuditQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        biz_type: req.query.biz_type as string,
        type: req.query.type ? Number(req.query.type) as AuditType : undefined,
        level: req.query.level ? Number(req.query.level) as 1 | 2 | 3 : undefined,
        auditor_id: req.query.auditor_id as string,
        submitter_id: req.query.submitter_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        status: 0 as AuditRecordStatus
      };
      const result = await this.auditService.getAuditList(params, req.userId);
      sendSuccessPage(res, result, '获取待审核列表成功');
    } catch (error) {
      next(error);
    }
  }

  async historyList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: AuditQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        biz_type: req.query.biz_type as string,
        type: req.query.type ? Number(req.query.type) as AuditType : undefined,
        level: req.query.level ? Number(req.query.level) as 1 | 2 | 3 : undefined,
        auditor_id: req.query.auditor_id as string,
        submitter_id: req.query.submitter_id as string,
        start_time: req.query.start_time as string,
        end_time: req.query.end_time as string,
        status: req.query.status ? Number(req.query.status) as AuditRecordStatus : undefined
      };
      const result = await this.auditService.getAuditList(params, req.userId);
      sendSuccessPage(res, result, '获取审核历史列表成功');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.auditService.getAuditById(req.params.id);
      sendSuccess(res, result, '获取审核详情成功');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: AuditApprovalRequest = {
        id: req.params.id,
        result: 1,
        audit_remark: req.body.audit_remark
      };
      const result = await this.auditService.approveAudit(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '审核通过成功');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: AuditApprovalRequest = {
        id: req.params.id,
        result: 2,
        audit_remark: req.body.audit_remark
      };
      const result = await this.auditService.approveAudit(request, req.userId!, req.user?.org_id);
      sendSuccess(res, result, '审核驳回成功');
    } catch (error) {
      next(error);
    }
  }

  async batchAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action } = req.body;
      const results = [];
      for (const id of ids) {
        const request: AuditApprovalRequest = {
          id,
          result: action,
          audit_remark: req.body.audit_remark
        };
        const result = await this.auditService.approveAudit(request, req.userId!, req.user?.org_id);
        results.push(result);
      }
      sendSuccess(res, { count: results.length, action }, '批量审核成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 10,
        keyword: req.query.keyword as string,
        biz_type: req.query.biz_type as string,
        rule_type: req.query.rule_type as string,
        status: req.query.status as unknown as number,
        audit_level: req.query.audit_level as string
      };
      const result = await this.auditService.getAuditRuleList(params);
      sendSuccessPage(res, result, '获取审核规则列表成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.auditService.getAuditRuleById(req.params.id);
      sendSuccess(res, result, '获取审核规则详情成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.auditService.createAuditRule(req.body as AuditRuleRequest);
      sendSuccess(res, result, '创建审核规则成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.auditService.updateAuditRule(req.params.id, req.body);
      sendSuccess(res, result, '更新审核规则成功');
    } catch (error) {
      next(error);
    }
  }

  async ruleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.auditService.deleteAuditRule(req.params.id);
      sendSuccess(res, null, '删除审核规则成功');
    } catch (error) {
      next(error);
    }
  }
}
