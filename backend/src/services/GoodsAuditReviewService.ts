import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { Goods } from '../models/Goods';

class GoodsAuditReviewService {
  private readonly goodsAuditMainDao = daos.goodsAuditMainDao;
  private readonly goodsAuditItemDao = daos.goodsAuditItemDao;
  private readonly goodsAuditTimeoutDao = daos.goodsAuditTimeoutDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly merchantDao = daos.merchantDao;

  async getRiskLevel(goodsId: number): Promise<number> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    const goodsData = (goods as any).toJSON ? (goods as any).toJSON() : goods;
    const merchantId = goodsData.merchant_id;

    if (!merchantId) {
      return 2;
    }

    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      return 3;
    }

    const merchantData = (merchant as any).toJSON ? (merchant as any).toJSON() : merchant;
    const creditScore = merchantData.credit_score ?? 100;

    const rejectCount = await this.goodsAuditMainDao.countRejectedByGoodsId(goodsId);
    if (rejectCount >= 3) {
      return 3;
    }

    if (creditScore >= 90) {
      return 1;
    }
    if (creditScore >= 60) {
      return 2;
    }
    return 3;
  }

  async executeInitialReview(
    auditId: number,
    reviewerId: number,
    result: number,
    remark?: string
  ): Promise<void> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    if (auditData.status !== 0) {
      throw new AppError('当前状态不允许初审', 400);
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      if (result === 1) {
        await this.goodsAuditMainDao.update(
          auditId,
          {
            initial_reviewer_id: reviewerId,
            initial_result: 1,
            initial_remark: remark || '初审通过',
            initial_reviewed_at: new Date(),
            status: 1,
          } as any,
          { transaction }
        );
        await this.syncGoodsDisplayPermission(auditData.goods_id, 1, transaction);
      } else if (result === 2) {
        const rejectReasons = await this.buildRejectReasons(auditId);
        await this.goodsAuditMainDao.update(
          auditId,
          {
            initial_reviewer_id: reviewerId,
            initial_result: 2,
            initial_remark: remark || '初审驳回',
            initial_reviewed_at: new Date(),
            status: 2,
            reject_reasons_json: rejectReasons,
          } as any,
          { transaction }
        );
        await this.syncMerchantCreditScore(auditData.merchant_id, -5, '初审驳回扣分', transaction);
      } else if (result === 3) {
        await this.goodsAuditMainDao.update(
          auditId,
          {
            initial_reviewer_id: reviewerId,
            initial_result: 3,
            initial_remark: remark || '转人工审核',
          } as any,
          { transaction }
        );
      } else {
        throw new AppError('无效的初审结果', 400);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async executeFinalReview(
    auditId: number,
    reviewerId: number,
    result: number,
    remark?: string
  ): Promise<void> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    if (auditData.status !== 1) {
      throw new AppError('当前状态不允许复审，仅初审通过待复审可操作', 400);
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      if (result === 1) {
        await this.goodsAuditMainDao.update(
          auditId,
          {
            final_reviewer_id: reviewerId,
            final_result: 1,
            final_remark: remark || '复审通过',
            final_reviewed_at: new Date(),
            status: 3,
          } as any,
          { transaction }
        );
        await this.syncGoodsDisplayPermission(auditData.goods_id, 3, transaction);
        await this.syncMerchantCreditScore(auditData.merchant_id, 2, '复审通过加分', transaction);
      } else if (result === 2) {
        const rejectReasons = await this.buildRejectReasons(auditId);
        await this.goodsAuditMainDao.update(
          auditId,
          {
            final_reviewer_id: reviewerId,
            final_result: 2,
            final_remark: remark || '复审驳回',
            final_reviewed_at: new Date(),
            status: 4,
            reject_reasons_json: rejectReasons,
          } as any,
          { transaction }
        );
        await this.syncGoodsDisplayPermission(auditData.goods_id, 4, transaction);
        await this.syncMerchantCreditScore(auditData.merchant_id, -10, '复审驳回扣分', transaction);
      } else {
        throw new AppError('无效的复审结果', 400);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async syncGoodsDisplayPermission(
    goodsId: number,
    auditStatus: number,
    transaction?: Transaction
  ): Promise<void> {
    const displayStatus = auditStatus === 3 ? 1 : 0;
    await (Goods as any).update(
      { status: displayStatus },
      {
        where: { id: goodsId },
        transaction,
      }
    );
  }

  async syncMerchantCreditScore(
    merchantId: number | undefined,
    delta: number,
    _reason: string,
    transaction?: Transaction
  ): Promise<void> {
    if (!merchantId) return;

    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) return;

    const merchantData = (merchant as any).toJSON ? (merchant as any).toJSON() : merchant;
    const currentScore = merchantData.credit_score ?? 100;
    const newScore = Math.max(0, Math.min(100, currentScore + delta));

    await this.merchantDao.update(merchantId, { credit_score: newScore } as any, { transaction });
  }

  async freezeAudit(auditId: number, reason: string): Promise<void> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    if (![0, 1, 5].includes(auditData.status)) {
      throw new AppError('当前状态不允许冻结', 400);
    }

    await this.goodsAuditMainDao.update(auditId, {
      status: 6,
      initial_remark: reason,
    } as any);
  }

  async unfreezeAudit(auditId: number): Promise<void> {
    const audit = await this.goodsAuditMainDao.findById(auditId);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }

    const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
    if (auditData.status !== 6) {
      throw new AppError('当前状态非冻结，无需解冻', 400);
    }

    const previousResult = auditData.initial_result;
    let newStatus = 0;
    if (previousResult === 1) {
      newStatus = 1;
    } else if (previousResult === 3 || !previousResult) {
      newStatus = 0;
    }

    await this.goodsAuditMainDao.update(auditId, {
      status: newStatus,
    } as any);
  }

  async checkTimeout(): Promise<number> {
    const candidates = await this.goodsAuditMainDao.findTimeoutCandidates();
    let count = 0;

    for (const audit of candidates) {
      const auditData = (audit as any).toJSON ? (audit as any).toJSON() : audit;
      const submitAt = auditData.submit_at ? new Date(auditData.submit_at) : null;
      if (!submitAt) continue;

      const timeoutMs = (auditData.timeout_hours ?? 48) * 60 * 60 * 1000;
      const deadline = new Date(submitAt.getTime() + timeoutMs);
      const now = new Date();

      if (now > deadline) {
        await this.goodsAuditMainDao.update(auditData.id, { timeout_flag: 1 } as any);

        let timeoutType = 1;
        if (auditData.status === 1) {
          timeoutType = 2;
        } else if (auditData.status === 5) {
          timeoutType = 3;
        }

        const existingTimeouts = await this.goodsAuditTimeoutDao.findByAuditId(auditData.id);
        const alreadyRecorded = existingTimeouts.some((t: any) => t.timeout_type === timeoutType && t.status === 0);
        if (!alreadyRecorded) {
          await daos.goodsAuditTimeoutDao.create({
            audit_id: auditData.id,
            goods_id: auditData.goods_id,
            merchant_id: auditData.merchant_id,
            timeout_type: timeoutType,
            deadline,
            status: 0,
          } as any);
        }

        count++;
      }
    }

    return count;
  }

  private async buildRejectReasons(auditId: number): Promise<object[]> {
    const items = await this.goodsAuditItemDao.findByAuditId(auditId);
    return items
      .filter((item: any) => item.check_result === 2)
      .map((item: any) => ({
        field: item.item_code,
        reason: item.detail || item.item_name,
        suggestion: item.suggestion || '',
      }));
  }
}

export const goodsAuditReviewService = new GoodsAuditReviewService();
export default GoodsAuditReviewService;
