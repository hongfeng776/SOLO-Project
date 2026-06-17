import { daos } from '../dao';
import { Op, WhereOptions } from 'sequelize';
import { GoodsAuditMain } from '../models/GoodsAuditMain';
import { PageResult } from '../dao/BaseDao';

export interface BatchFilterParams {
  page?: number;
  pageSize?: number;
  status?: number;
  risk_level?: number;
  merchant_id?: number;
  submit_at_start?: string;
  submit_at_end?: string;
  timeout_flag?: number;
  category_id?: number;
}

export interface AbilityResult {
  can_approve: boolean;
  can_reject: boolean;
  can_supplement: boolean;
  can_freeze: boolean;
  reason?: string;
}

class GoodsAuditBatchService {
  private readonly goodsAuditMainDao = daos.goodsAuditMainDao;
  private readonly goodsDao = daos.goodsDao;

  async batchFilter(params: BatchFilterParams): Promise<PageResult<GoodsAuditMain>> {
    const {
      page = 1,
      pageSize = 10,
      status,
      risk_level,
      merchant_id,
      submit_at_start,
      submit_at_end,
      timeout_flag,
      category_id,
    } = params;

    const where: WhereOptions<GoodsAuditMain> = {};

    if (status !== undefined) {
      (where as any).status = status;
    }
    if (risk_level !== undefined) {
      (where as any).risk_level = risk_level;
    }
    if (merchant_id !== undefined) {
      (where as any).merchant_id = merchant_id;
    }
    if (timeout_flag !== undefined) {
      (where as any).timeout_flag = timeout_flag;
    }
    if (submit_at_start || submit_at_end) {
      (where as any).submit_at = {};
      if (submit_at_start) {
        (where as any).submit_at[Op.gte] = new Date(submit_at_start);
      }
      if (submit_at_end) {
        (where as any).submit_at[Op.lte] = new Date(submit_at_end);
      }
    }
    if (category_id !== undefined) {
      const goodsList = await this.goodsDao.findAll({
        where: { category_id } as WhereOptions,
        attributes: ['id'],
      });
      const goodsIds = goodsList.map((g: any) => (g as any).id || (g as any).dataValues?.id);
      if (goodsIds.length > 0) {
        (where as any).goods_id = { [Op.in]: goodsIds };
      } else {
        (where as any).goods_id = -1;
      }
    }

    return this.goodsAuditMainDao.findPage({
      page,
      pageSize,
      where,
      order: [['submit_at', 'DESC']],
    });
  }

  async batchApprove(
    auditIds: number[],
    reviewerId: number,
    operatorRole: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const auditId of auditIds) {
      try {
        const audit = await this.goodsAuditMainDao.findById(auditId);
        if (!audit) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '审核记录不存在' });
          continue;
        }

        const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;

        if (operatorRole !== 'senior' && (auditData.risk_level ?? 1) > 2) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '普通审核员不可操作高风险商品' });
          continue;
        }

        if (auditData.status !== 1) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '当前状态不允许复审通过' });
          continue;
        }

        const { goodsAuditReviewService } = await import('./GoodsAuditReviewService');
        await goodsAuditReviewService.executeFinalReview(auditId, reviewerId, 1, '批量复审通过');
        success++;
        results.push({ audit_id: auditId, success: true });
      } catch (error: any) {
        failed++;
        results.push({ audit_id: auditId, success: false, message: error.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchReject(
    auditIds: number[],
    reviewerId: number,
    reason: string,
    operatorRole: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const auditId of auditIds) {
      try {
        const audit = await this.goodsAuditMainDao.findById(auditId);
        if (!audit) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '审核记录不存在' });
          continue;
        }

        const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;

        if (operatorRole !== 'senior' && (auditData.risk_level ?? 1) > 2) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '普通审核员不可操作高风险商品' });
          continue;
        }

        if (auditData.status !== 1) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '当前状态不允许复审驳回' });
          continue;
        }

        const { goodsAuditReviewService } = await import('./GoodsAuditReviewService');
        await goodsAuditReviewService.executeFinalReview(auditId, reviewerId, 2, reason);
        success++;
        results.push({ audit_id: auditId, success: true });
      } catch (error: any) {
        failed++;
        results.push({ audit_id: auditId, success: false, message: error.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchRequestSupplement(
    auditIds: number[],
    deadline: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;
    const supplementDeadline = new Date(deadline);

    for (const auditId of auditIds) {
      try {
        const audit = await this.goodsAuditMainDao.findById(auditId);
        if (!audit) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '审核记录不存在' });
          continue;
        }

        const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;

        if (![0, 1, 2, 4].includes(auditData.status)) {
          failed++;
          results.push({ audit_id: auditId, success: false, message: '当前状态不允许要求补充材料' });
          continue;
        }

        await this.goodsAuditMainDao.update(auditId, {
          status: 5,
          supplement_deadline: supplementDeadline,
          supplement_count: (auditData.supplement_count ?? 0) + 1,
        } as any);

        success++;
        results.push({ audit_id: auditId, success: true });
      } catch (error: any) {
        failed++;
        results.push({ audit_id: auditId, success: false, message: error.message });
      }
    }

    return { success, failed, details: results };
  }

  getBatchScope(_operatorId: number, operatorRole: string): { max_risk_level: number; description: string } {
    if (operatorRole === 'senior') {
      return { max_risk_level: 3, description: '高级审核员可操作全部风险等级' };
    }
    return { max_risk_level: 2, description: '普通审核员仅可操作低风险和中风险商品' };
  }

  abilityMap(auditList: any[], operatorRole: string): AbilityResult[] {
    return auditList.map((audit) => {
      const status = audit.status ?? audit.dataValues?.status;
      const riskLevel = audit.risk_level ?? audit.dataValues?.risk_level ?? 1;
      const isSenior = operatorRole === 'senior';
      const canOperateHighRisk = isSenior || riskLevel <= 2;

      const result: AbilityResult = {
        can_approve: false,
        can_reject: false,
        can_supplement: false,
        can_freeze: false,
      };

      if (!canOperateHighRisk) {
        result.reason = '普通审核员不可操作高风险商品';
        return result;
      }

      if (status === 1) {
        result.can_approve = true;
        result.can_reject = true;
      }

      if ([0, 1, 2, 4].includes(status)) {
        result.can_supplement = true;
      }

      if ([0, 1, 5].includes(status)) {
        result.can_freeze = true;
      }

      return result;
    });
  }
}

export const goodsAuditBatchService = new GoodsAuditBatchService();
export default GoodsAuditBatchService;
