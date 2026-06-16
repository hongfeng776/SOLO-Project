import { daos } from '../dao';
import { GoodsAudit } from '../models/GoodsAudit';
import { Goods } from '../models/Goods';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op, WhereOptions } from 'sequelize';
import { PageResult } from '../dao/BaseDao';

export enum GoodsAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export const GOODS_AUDIT_STATUS_MAP: Record<number, string> = {
  [GoodsAuditStatus.PENDING]: '待审核',
  [GoodsAuditStatus.APPROVED]: '审核通过',
  [GoodsAuditStatus.REJECTED]: '审核拒绝',
};

export enum GoodsStatus {
  OFFLINE = 0,
  ONLINE = 1,
}

export interface GoodsAuditQueryParams {
  page?: number;
  pageSize?: number;
  goods_id?: number;
  auditor_id?: number;
  status?: GoodsAuditStatus;
  start_time?: string;
  end_time?: string;
}

export interface GoodsAuditCreateParams {
  goods_id: number;
  auditor_id: number;
  status: GoodsAuditStatus;
  reason?: string;
}

export interface PendingGoodsQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  merchant_id?: number;
}

class GoodsAuditService {
  private readonly goodsAuditDao = daos.goodsAuditDao;
  private readonly goodsDao = daos.goodsDao;

  async getAuditList(params: GoodsAuditQueryParams): Promise<PageResult<GoodsAudit>> {
    const {
      page = 1,
      pageSize = 10,
      goods_id,
      auditor_id,
      status,
      start_time,
      end_time,
    } = params;

    const where: WhereOptions<GoodsAudit> = {};

    if (goods_id !== undefined) {
      (where as any).goods_id = goods_id;
    }
    if (auditor_id !== undefined) {
      (where as any).auditor_id = auditor_id;
    }
    if (status !== undefined) {
      (where as any).status = status;
    }
    if (start_time || end_time) {
      (where as any).created_at = {};
      if (start_time) {
        (where as any).created_at[Op.gte] = new Date(start_time);
      }
      if (end_time) {
        (where as any).created_at[Op.lte] = new Date(end_time);
      }
    }

    return this.goodsAuditDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getAuditDetail(id: number): Promise<GoodsAudit> {
    const audit = await this.goodsAuditDao.findById(id);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }
    return audit;
  }

  async getAuditHistoryByGoodsId(goodsId: number): Promise<GoodsAudit[]> {
    const audits = await this.goodsAuditDao.findByGoodsId(goodsId);
    return audits.map((audit) => ({
      ...(audit as any).toJSON(),
      status_text: GOODS_AUDIT_STATUS_MAP[audit.status ?? 0],
    }));
  }

  async submitForAudit(goodsId: number, auditorId?: number): Promise<GoodsAudit> {
    const goods = await this.goodsDao.findById(goodsId);
    if (!goods) {
      throw new AppError('商品不存在', 404);
    }

    return this.goodsAuditDao.create({
      goods_id: goodsId,
      auditor_id: auditorId ?? 0,
      status: GoodsAuditStatus.PENDING,
      reason: '提交审核',
    });
  }

  async approve(params: GoodsAuditCreateParams): Promise<GoodsAudit> {
    if (!params.reason) {
      params.reason = '审核通过，商品符合上架要求';
    }
    return this.executeAudit({
      ...params,
      status: GoodsAuditStatus.APPROVED,
    });
  }

  async reject(params: GoodsAuditCreateParams): Promise<GoodsAudit> {
    if (!params.reason) {
      throw new AppError('审核拒绝时必须填写拒绝原因', 400);
    }
    return this.executeAudit({
      ...params,
      status: GoodsAuditStatus.REJECTED,
    });
  }

  private async executeAudit(params: GoodsAuditCreateParams): Promise<GoodsAudit> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const goods = await this.goodsDao.findById(params.goods_id);
      if (!goods) {
        throw new AppError('商品不存在', 404);
      }

      const latestAudit = await this.goodsAuditDao.findLatestByGoodsId(params.goods_id);
      if (latestAudit && latestAudit.status === GoodsAuditStatus.PENDING) {
        throw new AppError('该商品已有待审核的记录，请先处理', 400);
      }

      const audit = await this.goodsAuditDao.create(
        {
          goods_id: params.goods_id,
          auditor_id: params.auditor_id,
          status: params.status,
          reason: params.reason,
        },
        { transaction }
      );

      const goodsStatus =
        params.status === GoodsAuditStatus.APPROVED ? GoodsStatus.ONLINE : GoodsStatus.OFFLINE;
      await (Goods as any).update(
        {
          status: goodsStatus,
        },
        {
          where: { id: params.goods_id },
          transaction,
        }
      );

      await transaction.commit();
      return audit;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchApprove(goodsIds: number[], auditorId: number, reason?: string): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const goodsId of goodsIds) {
      try {
        await this.approve({
          goods_id: goodsId,
          auditor_id: auditorId,
          status: GoodsAuditStatus.APPROVED,
          reason,
        });
        success++;
        results.push({ goods_id: goodsId, success: true });
      } catch (error: any) {
        failed++;
        results.push({
          goods_id: goodsId,
          success: false,
          message: error.message,
        });
      }
    }

    return { success, failed, details: results };
  }

  async batchReject(
    goodsIds: number[],
    auditorId: number,
    reason: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const goodsId of goodsIds) {
      try {
        await this.reject({
          goods_id: goodsId,
          auditor_id: auditorId,
          status: GoodsAuditStatus.REJECTED,
          reason,
        });
        success++;
        results.push({ goods_id: goodsId, success: true });
      } catch (error: any) {
        failed++;
        results.push({
          goods_id: goodsId,
          success: false,
          message: error.message,
        });
      }
    }

    return { success, failed, details: results };
  }

  async deleteAudit(id: number): Promise<void> {
    const audit = await this.goodsAuditDao.findById(id);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }
    await this.goodsAuditDao.delete(id);
  }
}

export const goodsAuditService = new GoodsAuditService();
export default GoodsAuditService;
