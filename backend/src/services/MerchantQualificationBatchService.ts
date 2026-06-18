import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { MerchantSettleStatus } from '../models/Merchant';
import { LedgerOperationType } from '../models/MerchantQualificationLedger';
import { MerchantSettleQueryParams } from './MerchantQualificationAuditService';

export interface BatchOperationResult {
  success: number;
  failed: number;
  details: Array<{
    merchant_id: number;
    success: boolean;
    message?: string;
  }>;
}

export interface BatchReminderParams {
  merchant_ids: number[];
  reminder_type: 'expire' | 'resubmit' | 'review';
  message?: string;
}

export interface BatchFreezeParams {
  merchant_ids: number[];
  reason?: string;
  freeze_permissions: Array<'shop' | 'goods' | 'all'>;
}

export interface BatchReviewParams {
  merchant_ids: number[];
  reason?: string;
  auditor_id?: number;
  auditor_name?: string;
}

class MerchantQualificationBatchService {
  private readonly merchantDao = daos.merchantDao;
  private readonly merchantAuditDao = daos.merchantAuditDao;
  private readonly merchantQualificationDao = daos.merchantQualificationDao;
  private readonly merchantQualificationLedgerDao = daos.merchantQualificationLedgerDao;
  private readonly messageDao = daos.messageDao;

  async batchReview(params: BatchReviewParams, operatorId?: number, operatorName?: string): Promise<BatchOperationResult> {
    const results: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of params.merchant_ids) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) {
          throw new AppError('商家不存在');
        }
        const oldSettle = merchant.settle_status;

        await this.merchantDao.update(merchantId, {
          settle_status: MerchantSettleStatus.PENDING_AUDIT,
          audit_reason: params.reason || '批量发起资质复核',
          last_audit_time: new Date(),
        }, { transaction });

        await this.merchantAuditDao.create({
          merchant_id: merchantId,
          auditor_id: params.auditor_id || operatorId || 0,
          status: 0,
          reason: params.reason || '批量发起资质复核',
          audit_step: 'review',
          operation_type: 'review',
        }, { transaction });

        await this.merchantQualificationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: LedgerOperationType.CHANGE,
          settle_status_before: oldSettle,
          settle_status_after: MerchantSettleStatus.PENDING_AUDIT,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_remark: params.reason || '批量发起资质复核',
        }, { transaction });

        await transaction.commit();
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (err: any) {
        await transaction.rollback();
        failed++;
        results.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchRemind(params: BatchReminderParams, _operatorId?: number, _operatorName?: string): Promise<BatchOperationResult> {
    const results: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    const msgTemplates: Record<string, string> = {
      expire: '您的资质即将过期，请及时更新资质材料',
      resubmit: '您的资质审核未通过，请及时补传缺失材料',
      review: '您的资质已被发起复核，请配合审核',
    };
    const msgTypeMap: Record<string, number> = {
      expire: 1,
      resubmit: 2,
      review: 3,
    };

    for (const merchantId of params.merchant_ids) {
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) {
          throw new AppError('商家不存在');
        }

        const msgContent = params.message || msgTemplates[params.reminder_type] || '资质提醒';

        try {
          await this.messageDao.create({
            user_id: merchantId,
            user_type: 2,
            title: '资质提醒通知',
            content: msgContent,
            type: msgTypeMap[params.reminder_type] || 1,
            is_read: 0,
          });
        } catch (_e) {}

        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (err: any) {
        failed++;
        results.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchFreeze(params: BatchFreezeParams, operatorId?: number, operatorName?: string): Promise<BatchOperationResult> {
    const results: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of params.merchant_ids) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) {
          throw new AppError('商家不存在');
        }
        const oldSettle = merchant.settle_status;

        const updateData: any = {
          settle_status: MerchantSettleStatus.QUALIFICATION_ABNORMAL,
        };
        if (params.freeze_permissions.includes('shop') || params.freeze_permissions.includes('all')) {
          updateData.shop_open_status = 0;
        }
        if (params.freeze_permissions.includes('goods') || params.freeze_permissions.includes('all')) {
          updateData.goods_publish_permission = 0;
        }
        updateData.audit_reason = params.reason || '批量冻结商家权限';

        await this.merchantDao.update(merchantId, updateData, { transaction });

        await this.merchantQualificationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: LedgerOperationType.FREEZE,
          settle_status_before: oldSettle,
          settle_status_after: MerchantSettleStatus.QUALIFICATION_ABNORMAL,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_remark: `批量冻结：${params.reason || '资质异常'}，冻结权限：${params.freeze_permissions.join('、')}`,
        }, { transaction });

        await transaction.commit();
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (err: any) {
        await transaction.rollback();
        failed++;
        results.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchApprove(merchantIds: number[], reason?: string, operatorId?: number, operatorName?: string): Promise<BatchOperationResult> {
    const results: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of merchantIds) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) {
          throw new AppError('商家不存在');
        }
        if (merchant.settle_status !== MerchantSettleStatus.PENDING_AUDIT) {
          throw new AppError('商家非待审核状态');
        }
        const oldSettle = merchant.settle_status;

        await this.merchantDao.update(merchantId, {
          settle_status: MerchantSettleStatus.AUDIT_APPROVED,
          shop_open_status: 1,
          goods_publish_permission: 1,
          audit_reason: reason || '批量审核通过',
          last_audit_time: new Date(),
        }, { transaction });

        const allQuals = await this.merchantQualificationDao.findAll({
          where: { merchant_id: merchantId } as any,
        } as any);
        for (const q of allQuals) {
          await this.merchantQualificationDao.update(q.id, {
            status: 1,
            missing_flag: 0,
            violation_flag: 0,
            audit_opinion: reason || '批量审核通过',
          }, { transaction });
        }

        await this.merchantAuditDao.create({
          merchant_id: merchantId,
          auditor_id: operatorId || 0,
          status: 1,
          reason: reason || '批量审核通过',
          audit_step: 'approve',
          operation_type: 'initial',
        }, { transaction });

        await this.merchantQualificationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: LedgerOperationType.APPROVE,
          settle_status_before: oldSettle,
          settle_status_after: MerchantSettleStatus.AUDIT_APPROVED,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_remark: reason || '批量审核通过',
        }, { transaction });

        await transaction.commit();
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (err: any) {
        await transaction.rollback();
        failed++;
        results.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }

    return { success, failed, details: results };
  }

  async batchReject(
    merchantIds: number[],
    reason: string,
    missingMaterials?: string[],
    violationPoints?: string[],
    operatorId?: number,
    operatorName?: string
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['details'] = [];
    let success = 0;
    let failed = 0;

    for (const merchantId of merchantIds) {
      const transaction: Transaction = await sequelize.transaction();
      try {
        const merchant = await this.merchantDao.findById(merchantId);
        if (!merchant) {
          throw new AppError('商家不存在');
        }
        const oldSettle = merchant.settle_status;

        await this.merchantDao.update(merchantId, {
          settle_status: MerchantSettleStatus.AUDIT_REJECTED,
          shop_open_status: 0,
          goods_publish_permission: 0,
          audit_reason: reason,
          last_audit_time: new Date(),
        }, { transaction });

        await this.merchantAuditDao.create({
          merchant_id: merchantId,
          auditor_id: operatorId || 0,
          status: 2,
          reason: reason,
          audit_step: 'reject',
          missing_materials: missingMaterials || [],
          violation_points: violationPoints || [],
          need_resubmit: 1,
          operation_type: 'initial',
        }, { transaction });

        await this.merchantQualificationLedgerDao.create({
          merchant_id: merchantId,
          operation_type: LedgerOperationType.REJECT,
          settle_status_before: oldSettle,
          settle_status_after: MerchantSettleStatus.AUDIT_REJECTED,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_remark: `批量驳回：${reason}`,
        }, { transaction });

        await transaction.commit();
        success++;
        results.push({ merchant_id: merchantId, success: true });
      } catch (err: any) {
        await transaction.rollback();
        failed++;
        results.push({ merchant_id: merchantId, success: false, message: err.message });
      }
    }

    return { success, failed, details: results };
  }

  async getBatchScopeByPermission(permissionLevel: number, _params: MerchantSettleQueryParams): Promise<{ can_batch: boolean; allowed_statuses: number[]; max_count: number }> {
    const configs: Record<number, { can_batch: boolean; allowed_statuses: number[]; max_count: number }> = {
      1: { can_batch: true, allowed_statuses: [0, 1, 2, 3, 4, 5, 6], max_count: 200 },
      2: { can_batch: true, allowed_statuses: [0, 1, 2, 3], max_count: 100 },
      3: { can_batch: true, allowed_statuses: [0], max_count: 50 },
    };
    return configs[permissionLevel] || { can_batch: false, allowed_statuses: [], max_count: 0 };
  }
}

export const merchantQualificationBatchService = new MerchantQualificationBatchService();
export default MerchantQualificationBatchService;
