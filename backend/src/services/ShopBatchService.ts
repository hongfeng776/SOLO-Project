import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { ShopStatus } from '../models/ShopStatusChangeLog';
import { ShopOperationType } from '../models/ShopOperationLedger';
import { shopStatusService } from './ShopStatusService';

export interface BatchTagPayload {
  merchant_ids: number[];
  tags: string[];
  append_mode?: boolean;
  operator_id?: number;
  operator_name?: string;
}

export interface BatchSuspendPayload {
  merchant_ids: number[];
  reason: string;
  target_status?: number;
  operator_id?: number;
  operator_name?: string;
}

export interface BatchResumePayload {
  merchant_ids: number[];
  reason: string;
  operator_id?: number;
  operator_name?: string;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  details: Array<{
    merchant_id: number;
    merchant_name?: string;
    success: boolean;
    message?: string;
  }>;
}

const BATCH_SCOPE_CONFIG: Record<number, { max_count: number; allowed_statuses: number[] }> = {
  1: { max_count: 200, allowed_statuses: [1, 2, 3, 4] },
  2: { max_count: 100, allowed_statuses: [1, 2, 3] },
  3: { max_count: 50, allowed_statuses: [1, 2] },
};

class ShopBatchService {
  private readonly merchantDao = daos.merchantDao;
  private readonly shopOperationLedgerDao = daos.shopOperationLedgerDao;

  async getBatchScopeByPermission(permissionLevel: number): Promise<{ max_count: number; allowed_statuses: number[] }> {
    return BATCH_SCOPE_CONFIG[permissionLevel] || { max_count: 0, allowed_statuses: [] };
  }

  async batchUpdateTags(payload: BatchTagPayload): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { success: 0, failed: 0, details: [] };
    for (const merchantId of payload.merchant_ids) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) throw new AppError('商家不存在');

        let newTagsArr: string[] = [];
        if (payload.append_mode) {
          const existing = ((merchant as any).shop_tags || '').split(',').filter(Boolean);
          newTagsArr = Array.from(new Set([...existing, ...payload.tags]));
        } else {
          newTagsArr = [...payload.tags];
        }
        const newTagsStr = newTagsArr.join(',');

        await this.merchantDao.update(merchantId, { shop_tags: newTagsStr }, { transaction });

        await this.shopOperationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: ShopOperationType.UPDATE,
          operation_title: '批量修改店铺标签',
          operation_detail: `新标签：${newTagsArr.join('、')}`,
          operator_id: payload.operator_id,
          operator_name: payload.operator_name,
          operator_role: 'admin',
        }, { transaction });

        await transaction.commit();
        result.success++;
        result.details.push({ merchant_id: merchantId, merchant_name: (merchant as any).name, success: true });
      } catch (err: any) {
        await transaction.rollback();
        result.failed++;
        result.details.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }
    return result;
  }

  async batchSuspend(payload: BatchSuspendPayload): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { success: 0, failed: 0, details: [] };
    const target = payload.target_status || ShopStatus.RECTIFY;
    for (const merchantId of payload.merchant_ids) {
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        const res = await shopStatusService.changeStatus({
          merchant_id: merchantId,
          target_status: target,
          change_source: 'platform',
          change_reason: payload.reason,
          operator_id: payload.operator_id,
          operator_name: payload.operator_name,
        });
        result.success++;
        result.details.push({
          merchant_id: merchantId,
          merchant_name: merchant ? (merchant as any).name : '',
          success: true,
          message: res.message,
        });
      } catch (err: any) {
        result.failed++;
        result.details.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }
    return result;
  }

  async batchResume(payload: BatchResumePayload): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { success: 0, failed: 0, details: [] };
    for (const merchantId of payload.merchant_ids) {
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        const res = await shopStatusService.changeStatus({
          merchant_id: merchantId,
          target_status: ShopStatus.NORMAL,
          change_source: 'platform',
          change_reason: payload.reason,
          operator_id: payload.operator_id,
          operator_name: payload.operator_name,
        });
        result.success++;
        result.details.push({
          merchant_id: merchantId,
          merchant_name: merchant ? (merchant as any).name : '',
          success: true,
          message: res.message,
        });
      } catch (err: any) {
        result.failed++;
        result.details.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }
    return result;
  }

  async batchChangeLevel(merchantIds: number[], targetLevel: number, reason: string, operatorId?: number, operatorName?: string): Promise<BatchOperationResult> {
    const result: BatchOperationResult = { success: 0, failed: 0, details: [] };
    for (const merchantId of merchantIds) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) throw new AppError('商家不存在');

        await this.merchantDao.update(merchantId, { shop_level: targetLevel }, { transaction });

        await this.shopOperationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: ShopOperationType.UPDATE,
          operation_title: '批量调整店铺等级',
          operation_detail: `调整为等级${targetLevel}，原因：${reason}`,
          operator_id: operatorId,
          operator_name: operatorName,
          operator_role: 'admin',
        }, { transaction });

        await transaction.commit();
        result.success++;
        result.details.push({ merchant_id: merchantId, merchant_name: (merchant as any).name, success: true });
      } catch (err: any) {
        await transaction.rollback();
        result.failed++;
        result.details.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }
    return result;
  }
}

export const shopBatchService = new ShopBatchService();
export default ShopBatchService;
