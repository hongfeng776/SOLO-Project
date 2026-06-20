import { Request, Response } from 'express';
import { productService } from '../services';
import ResponseUtils from '../utils/response';

class ProductController {
  public async getCategoryConfigs(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getCategoryConfigs();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getImportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getImportTemplate();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async validateProduct(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.validateProduct(req.body);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const { sku, name, excludeProductId } = req.body;
      const result = await productService.checkDuplicate({ sku, name }, excludeProductId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getProductList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const { keyword, category, status, auditStage, channelId, submitterId, isHot, isRecommended, fakeProductFlag } = req.query;
      const result = await productService.getProductList({
        page,
        pageSize,
        keyword,
        category,
        status: status !== undefined ? parseInt(status as string, 10) : undefined,
        auditStage: auditStage !== undefined ? parseInt(auditStage as string, 10) : undefined,
        channelId,
        submitterId,
        isHot: isHot !== undefined ? isHot === 'true' : undefined,
        isRecommended: isRecommended !== undefined ? isRecommended === 'true' : undefined,
        fakeProductFlag: fakeProductFlag !== undefined ? fakeProductFlag === 'true' : undefined,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getProductDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await productService.getProductDetail(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.createProduct(req.body, operatorId, ipAddress);
      ResponseUtils.created(res, result, '商品创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }



  public async submitForAudit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.submitForAudit(id, operatorId, ipAddress);
      ResponseUtils.success(res, result, '商品提交审核成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async auditProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stage, passed, remark, rejectIssueType, rejectCustomRemark } = req.body;
      const reviewerId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.auditProduct(
        id,
        reviewerId,
        parseInt(stage, 10),
        passed,
        remark,
        rejectIssueType,
        rejectCustomRemark,
        ipAddress
      );
      ResponseUtils.success(res, null, passed ? '审核通过成功' : '审核驳回成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async listProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { listStartTime, listEndTime, limitedPromotion, promotionStartTime, promotionEndTime } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.listProduct(
        id,
        operatorId,
        listStartTime,
        listEndTime,
        limitedPromotion,
        promotionStartTime,
        promotionEndTime,
        ipAddress
      );
      ResponseUtils.success(res, null, '商品上架成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async delistProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.delistProduct(id, operatorId, remark, ipAddress);
      ResponseUtils.success(res, null, '商品下架成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async offlineProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.offlineProduct(id, operatorId, reason, ipAddress);
      ResponseUtils.success(res, null, '商品强制下线成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchImport(req: Request, res: Response): Promise<void> {
    try {
      const { products } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const result = await productService.batchImport(products, operatorId);
      ResponseUtils.success(res, result, '批量导入完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchListOld(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.batchList({ productIds: ids }, operatorId, ipAddress);
      ResponseUtils.success(res, result, '批量上架完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const result = await productService.getAuditLogs(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getTraceability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await productService.getTraceability(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async processExpiredProducts(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.processExpiredProducts();
      ResponseUtils.success(res, result, `处理完成，自动下架${result.delisted}件商品`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateProductInfo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { data, applyReason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.updateProductInfo(id, operatorId, data, applyReason, ipAddress);
      if (result.needApproval) {
        ResponseUtils.success(res, result, '核心字段修改已提交审批，请等待审核');
      } else {
        ResponseUtils.success(res, result, '商品信息更新成功');
      }
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async adjustCommission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newCommissionRate, applyReason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.adjustCommission(
        id,
        operatorId,
        Number(newCommissionRate),
        applyReason,
        ipAddress
      );
      ResponseUtils.success(
        res,
        result,
        '佣金比例调整成功，已自动区分存量与新增订单，存量订单保持原有佣金规则'
      );
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchEdit(req: Request, res: Response): Promise<void> {
    try {
      const { ids, data } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.batchEdit(ids, operatorId, data, ipAddress);
      ResponseUtils.success(res, result, '批量修改完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getFieldDiff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newData } = req.body;
      const result = await productService.getFieldDiff(id, newData);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getEditFieldConfig(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getEditFieldConfig();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getEditApprovalList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const { productId, applicantId, approverId, status, startTime, endTime } = req.query;
      const result = await productService.getEditApprovalList({
        page,
        pageSize,
        productId: productId as string,
        applicantId: applicantId as string,
        approverId: approverId as string,
        status: status ? parseInt(status as string, 10) : undefined,
        startTime: startTime as string,
        endTime: endTime as string,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getEditApprovalDetail(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId } = req.params;
      const result = await productService.getEditApprovalDetail(approvalId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async approveEdit(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId } = req.params;
      const { remark } = req.body;
      const approverId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.approveEdit(approvalId, approverId, remark, ipAddress);
      ResponseUtils.success(res, null, '审批通过，修改已生效');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async rejectEdit(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId } = req.params;
      const { remark } = req.body;
      const approverId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.rejectEdit(approvalId, approverId, remark, ipAddress);
      ResponseUtils.success(res, null, '已驳回修改申请');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getEditHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const result = await productService.getEditHistory(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async manualDelist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { forceDelist, reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.manualDelist(id, operatorId, forceDelist, reason, ipAddress);
      if (result.delisted) {
        ResponseUtils.success(res, result, result.message);
      } else {
        ResponseUtils.success(res, result, result.message);
      }
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async manualList(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.manualList(id, operatorId, reason, ipAddress);
      ResponseUtils.success(res, null, '商品上架成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkDelistPrecondition(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await productService.checkDelistPrecondition(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async createScheduleRule(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.createScheduleRule(req.body, operatorId, ipAddress);
      ResponseUtils.success(res, result, '定时上下架规则创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateScheduleRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.updateScheduleRule(ruleId, req.body, operatorId, ipAddress);
      ResponseUtils.success(res, null, '定时规则更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async cancelScheduleRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const { reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      await productService.cancelScheduleRule(ruleId, operatorId, reason, ipAddress);
      ResponseUtils.success(res, null, '定时规则已取消');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getScheduleRuleList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const { productId, action, status, creatorId, startTime, endTime } = req.query;
      const result = await productService.getScheduleRuleList({
        page,
        pageSize,
        productId: productId as string,
        action: action as string,
        status: status ? parseInt(status as string, 10) : undefined,
        creatorId: creatorId as string,
        startTime: startTime as string,
        endTime: endTime as string,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getScheduleRuleDetail(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const result = await productService.getScheduleRuleDetail(ruleId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async processScheduleRules(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.processScheduleRules();
      ResponseUtils.success(res, result, `定时任务执行完成，成功${result.executed}条，失败${result.failed}条`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchDelist(req: Request, res: Response): Promise<void> {
    try {
      const { type, productIds, excludeHotSales, reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.batchDelist(
        { type, productIds, excludeHotSales, reason },
        operatorId,
        ipAddress
      );
      ResponseUtils.success(res, result, '批量下架完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchList(req: Request, res: Response): Promise<void> {
    try {
      const { productIds, autoFilter, reason } = req.body;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '';
      const result = await productService.batchList(
        { productIds, autoFilter, reason },
        operatorId,
        ipAddress
      );
      ResponseUtils.success(res, result, '批量上架完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getListingHistory(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const { productId, action, trigger, operatorId, batchId, startTime, endTime } = req.query;
      const result = await productService.getListingHistory({
        page,
        pageSize,
        productId: productId as string,
        action: action as any,
        trigger: trigger as any,
        operatorId: operatorId as string,
        batchId: batchId as string,
        startTime: startTime as string,
        endTime: endTime as string,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getListingStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await productService.getListingStats(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskRuleList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const { ruleType, severity, enabled, keyword } = req.query;
      const result = await productService.getRiskRuleList({
        page,
        pageSize,
        ruleType: ruleType as any,
        severity: severity as any,
        enabled: enabled !== undefined ? enabled === 'true' : undefined,
        keyword: keyword as string,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskRuleDetail(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const result = await productService.getRiskRuleDetail(ruleId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async createRiskRule(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const result = await productService.createRiskRule(req.body, operatorId);
      ResponseUtils.success(res, result, '风控规则创建成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async updateRiskRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      await productService.updateRiskRule(ruleId, req.body, operatorId);
      ResponseUtils.success(res, null, '风控规则更新成功');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async toggleRiskRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const { enabled } = req.body;
      await productService.toggleRiskRule(ruleId, enabled);
      ResponseUtils.success(res, null, enabled ? '风控规则已启用' : '风控规则已禁用');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async deleteRiskRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      await productService.deleteRiskRule(ruleId);
      ResponseUtils.success(res, null, '风控规则已删除');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getDefaultRiskRules(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getDefaultRiskRules();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async checkAndTriggerRisk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await productService.checkAndTriggerRisk(id);
      ResponseUtils.success(res, null, '风控检查完成');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async markProductRisk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const result = await productService.markProductRisk(id, operatorId, req.body);
      ResponseUtils.success(res, result, '风控标记成功，已限制商品新增推广并启动订单复核');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async resolveProductRisk(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      await productService.resolveProductRisk(recordId, operatorId, req.body);
      ResponseUtils.success(res, null, '风控处理完成，已恢复正常推广权限');
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getProductRiskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await productService.getProductRiskStatus(id);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getProductRiskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const result = await productService.getProductRiskHistory(id, { page, pageSize });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchScanRiskProducts(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.batchScanRiskProducts(req.body);
      ResponseUtils.success(res, result, `风险筛查完成，发现${result.abnormal}个异常商品`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchResolveRisk(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const result = await productService.batchResolveRisk(req.body, operatorId);
      ResponseUtils.success(res, result, `批量解除完成，成功${result.success}条`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async batchBanProducts(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = (req as any).user?.id || (req as any).user?.userId || '';
      const result = await productService.batchBanProducts(req.body, operatorId);
      ResponseUtils.success(res, result, `批量封禁完成，成功${result.success}个商品`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskRecordList(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const { productId, riskType, riskStatus, riskSeverity, riskTrigger, resolved, isFalseAlarm, startTime, endTime, keyword } = req.query;
      const result = await productService.getRiskRecordList({
        page,
        pageSize,
        productId: productId as string,
        riskType: riskType as any,
        riskStatus: riskStatus ? parseInt(riskStatus as string, 10) as any : undefined,
        riskSeverity: riskSeverity as any,
        riskTrigger: riskTrigger as any,
        resolved: resolved !== undefined ? resolved === 'true' : undefined,
        isFalseAlarm: isFalseAlarm !== undefined ? isFalseAlarm === 'true' : undefined,
        startTime: startTime as string,
        endTime: endTime as string,
        keyword: keyword as string,
      });
      ResponseUtils.paginated(res, result.list, result.total, result.page, result.pageSize);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskRecordDetail(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const result = await productService.getRiskRecordDetail(recordId);
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getRiskStatistics();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async resetDailyRiskData(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.resetDailyRiskData();
      ResponseUtils.success(res, result, `每日风控数据重置完成，共重置${result.resetCount}个商品`);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }

  public async getRiskConfig(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getRiskConfig();
      ResponseUtils.success(res, result);
    } catch (err: any) {
      ResponseUtils.error(res, err.message, err.code);
    }
  }
}

export default new ProductController();
