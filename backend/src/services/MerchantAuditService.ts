import { daos } from '../dao';
import { MerchantAudit } from '../models/MerchantAudit';
import { Merchant } from '../models/Merchant';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op, WhereOptions } from 'sequelize';
import { PageResult } from '../dao/BaseDao';

export enum MerchantAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export const MERCHANT_AUDIT_STATUS_MAP: Record<number, string> = {
  [MerchantAuditStatus.PENDING]: '待审核',
  [MerchantAuditStatus.APPROVED]: '审核通过',
  [MerchantAuditStatus.REJECTED]: '审核拒绝',
};

export enum MerchantStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export interface MerchantAuditQueryParams {
  page?: number;
  pageSize?: number;
  merchant_id?: number;
  auditor_id?: number;
  status?: MerchantAuditStatus;
  start_time?: string;
  end_time?: string;
}

export interface MerchantAuditCreateParams {
  merchant_id: number;
  auditor_id: number;
  status: MerchantAuditStatus;
  reason?: string;
}

class MerchantAuditService {
  private readonly merchantAuditDao = daos.merchantAuditDao;
  private readonly merchantDao = daos.merchantDao;

  async getAuditList(params: MerchantAuditQueryParams): Promise<PageResult<MerchantAudit>> {
    const {
      page = 1,
      pageSize = 10,
      merchant_id,
      auditor_id,
      status,
      start_time,
      end_time,
    } = params;

    const where: WhereOptions<MerchantAudit> = {};

    if (merchant_id !== undefined) {
      (where as any).merchant_id = merchant_id;
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

    return this.merchantAuditDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getAuditDetail(id: number): Promise<MerchantAudit> {
    const audit = await this.merchantAuditDao.findById(id);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }
    return audit;
  }

  async getAuditHistoryByMerchantId(merchantId: number): Promise<any[]> {
    const audits = await this.merchantAuditDao.findByMerchantId(merchantId);
    return audits.map((audit) => ({
      ...(audit as any).toJSON(),
      status_text: MERCHANT_AUDIT_STATUS_MAP[audit.status ?? 0],
    }));
  }

  async submitForAudit(merchantId: number, auditorId?: number): Promise<MerchantAudit> {
    const merchant = await this.merchantDao.findById(merchantId);
    if (!merchant) {
      throw new AppError('商家不存在', 404);
    }

    return this.merchantAuditDao.create({
      merchant_id: merchantId,
      auditor_id: auditorId ?? 0,
      status: MerchantAuditStatus.PENDING,
      reason: '提交入驻审核',
    });
  }

  async approve(params: MerchantAuditCreateParams): Promise<MerchantAudit> {
    if (!params.reason) {
      params.reason = '审核通过，商家资质符合要求';
    }
    return this.executeAudit({
      ...params,
      status: MerchantAuditStatus.APPROVED,
    });
  }

  async reject(params: MerchantAuditCreateParams): Promise<MerchantAudit> {
    if (!params.reason) {
      throw new AppError('审核拒绝时必须填写拒绝原因', 400);
    }
    return this.executeAudit({
      ...params,
      status: MerchantAuditStatus.REJECTED,
    });
  }

  private async executeAudit(params: MerchantAuditCreateParams): Promise<MerchantAudit> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const merchant = await this.merchantDao.findById(params.merchant_id);
      if (!merchant) {
        throw new AppError('商家不存在', 404);
      }

      const latestAudit = await this.merchantAuditDao.findLatestByMerchantId(params.merchant_id);
      if (latestAudit && latestAudit.status === MerchantAuditStatus.PENDING) {
        throw new AppError('该商家已有待审核的记录，请先处理', 400);
      }

      const audit = await this.merchantAuditDao.create(
        {
          merchant_id: params.merchant_id,
          auditor_id: params.auditor_id,
          status: params.status,
          reason: params.reason,
        },
        { transaction }
      );

      const merchantStatus =
        params.status === MerchantAuditStatus.APPROVED
          ? MerchantStatus.ENABLED
          : MerchantStatus.DISABLED;
      await (Merchant as any).update(
        {
          status: merchantStatus,
        },
        {
          where: { id: params.merchant_id },
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

  async batchApprove(
    merchantIds: number[],
    auditorId: number,
    reason?: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of merchantIds) {
      try {
        await this.approve({
          merchant_id: merchantId,
          auditor_id: auditorId,
          status: MerchantAuditStatus.APPROVED,
          reason,
        });
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (error: any) {
        failed++;
        results.push({
          merchant_id: merchantId,
          success: false,
          message: error.message,
        });
      }
    }

    return { success, failed, details: results };
  }

  async batchReject(
    merchantIds: number[],
    auditorId: number,
    reason: string
  ): Promise<{ success: number; failed: number; details: any[] }> {
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of merchantIds) {
      try {
        await this.reject({
          merchant_id: merchantId,
          auditor_id: auditorId,
          status: MerchantAuditStatus.REJECTED,
          reason,
        });
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (error: any) {
        failed++;
        results.push({
          merchant_id: merchantId,
          success: false,
          message: error.message,
        });
      }
    }

    return { success, failed, details: results };
  }

  async deleteAudit(id: number): Promise<void> {
    const audit = await this.merchantAuditDao.findById(id);
    if (!audit) {
      throw new AppError('审核记录不存在', 404);
    }
    await this.merchantAuditDao.delete(id);
  }
}

export const merchantAuditService = new MerchantAuditService();
export default MerchantAuditService;
