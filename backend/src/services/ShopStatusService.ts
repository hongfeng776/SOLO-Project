import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';
import sequelize from '../config/database';
import { Transaction, Op } from 'sequelize';
import {
  ShopStatus, SHOP_STATUS_MAP, ShopStatusSource, SHOP_STATUS_SOURCE_MAP,
} from '../models/ShopStatusChangeLog';
import {
  ShopOperationType,
} from '../models/ShopOperationLedger';
import { MerchantSettleStatus } from '../models/Merchant';

export interface ShopStatusChangePayload {
  merchant_id: number;
  target_status: number;
  change_source: string;
  change_reason: string;
  effective_time?: string;
  remark?: string;
  operator_id?: number;
  operator_name?: string;
}

export interface ShopStatusBranchConfig {
  goods_status: number;
  order_permission: number;
  marketing_permission: number;
  settlement_permission: number;
  settle_status: number;
}

export const STATUS_BRANCH_CONFIG: Record<number, Record<string, ShopStatusBranchConfig>> = {
  [ShopStatus.NORMAL]: {
    default: {
      goods_status: 1, order_permission: 1, marketing_permission: 1, settlement_permission: 1, settle_status: MerchantSettleStatus.AUDIT_APPROVED,
    },
  },
  [ShopStatus.CLOSED]: {
    merchant: {
      goods_status: 0, order_permission: 0, marketing_permission: 0, settlement_permission: 1, settle_status: MerchantSettleStatus.AUDIT_APPROVED,
    },
    system: {
      goods_status: 0, order_permission: 0, marketing_permission: 0, settlement_permission: 1, settle_status: MerchantSettleStatus.AUDIT_APPROVED,
    },
  },
  [ShopStatus.RECTIFY]: {
    platform: {
      goods_status: 0, order_permission: 0, marketing_permission: 0, settlement_permission: 1, settle_status: MerchantSettleStatus.QUALIFICATION_ABNORMAL,
    },
  },
  [ShopStatus.BANNED]: {
    platform: {
      goods_status: 0, order_permission: 0, marketing_permission: 0, settlement_permission: 0, settle_status: MerchantSettleStatus.QUALIFICATION_ABNORMAL,
    },
    system: {
      goods_status: 0, order_permission: 0, marketing_permission: 0, settlement_permission: 0, settle_status: MerchantSettleStatus.QUALIFICATION_ABNORMAL,
    },
  },
};

class ShopStatusService {
  private readonly merchantDao = daos.merchantDao;
  private readonly goodsDao = daos.goodsDao;
  private readonly shopStatusChangeLogDao = daos.shopStatusChangeLogDao;
  private readonly shopOperationLedgerDao = daos.shopOperationLedgerDao;

  getBranchConfig(targetStatus: number, source: string): ShopStatusBranchConfig | null {
    const statusConfig = STATUS_BRANCH_CONFIG[targetStatus];
    if (!statusConfig) return null;
    if (statusConfig[source]) return statusConfig[source];
    if (statusConfig.default) return statusConfig.default;
    return Object.values(statusConfig)[0] || null;
  }

  validateStatusTransition(currentStatus: number, targetStatus: number, source: string): { valid: boolean; message?: string } {
    if (currentStatus === targetStatus) {
      return { valid: false, message: '目标状态与当前状态相同，无需变更' };
    }
    if (targetStatus === ShopStatus.BANNED && source !== 'platform' && source !== 'system') {
      return { valid: false, message: '仅平台或系统可执行封禁操作' };
    }
    if (targetStatus === ShopStatus.RECTIFY && source !== 'platform') {
      return { valid: false, message: '仅平台可发起违规整改' };
    }
    if (targetStatus === ShopStatus.CLOSED && source === ShopStatusSource.PLATFORM) {
      return { valid: false, message: '停业状态需商家主动申请或系统自动触发' };
    }
    return { valid: true };
  }

  async changeStatus(payload: ShopStatusChangePayload): Promise<any> {
    const merchant = await this.merchantDao.findById(payload.merchant_id);
    if (!merchant) throw new AppError('商家不存在', 404);
    if (!payload.change_reason || payload.change_reason.trim().length < 2) {
      throw new AppError('请填写详细的状态变更原因（不少于2个字符）', 400);
    }

    const currentStatus = (merchant as any).shop_status ?? 1;
    const validation = this.validateStatusTransition(currentStatus, payload.target_status, payload.change_source);
    if (!validation.valid) throw new AppError(validation.message!, 400);

    const branch = this.getBranchConfig(payload.target_status, payload.change_source);
    if (!branch) throw new AppError('不支持的状态变更分支', 400);

    const transaction: Transaction = await sequelize.transaction();
    try {
      const affectedGoods = await this.goodsDao.findAll({
        where: { merchant_id: payload.merchant_id, status: { [Op.ne]: 0 } } as any,
      });
      const affectedGoodsCount = affectedGoods.length;

      if (branch.goods_status === 0) {
        await (this.goodsDao.getModel() as any).update(
          { status: 0 },
          { where: { merchant_id: payload.merchant_id, status: { [Op.ne]: 0 } }, transaction }
        );
      } else if (branch.goods_status === 1 && currentStatus !== ShopStatus.NORMAL) {
        await (this.goodsDao.getModel() as any).update(
          { status: 1 },
          { where: { merchant_id: payload.merchant_id, status: 0 }, transaction }
        );
      }

      const oldOrderPerm = (merchant as any).order_accept_permission;
      const oldMarketingPerm = (merchant as any).marketing_participate_permission;
      const oldSettlementPerm = (merchant as any).settlement_permission;

      await this.merchantDao.update(payload.merchant_id, {
        shop_status: payload.target_status,
        shop_status_reason: payload.change_reason,
        shop_status_source: payload.change_source,
        order_accept_permission: branch.order_permission,
        marketing_participate_permission: branch.marketing_permission,
        settlement_permission: branch.settlement_permission,
        settle_status: branch.settle_status,
      }, { transaction });

      await this.shopStatusChangeLogDao.create({
        merchant_id: payload.merchant_id,
        status_before: currentStatus,
        status_after: payload.target_status,
        status_source: payload.change_source,
        change_reason: payload.change_reason,
        order_permission_before: oldOrderPerm,
        order_permission_after: branch.order_permission,
        marketing_permission_before: oldMarketingPerm,
        marketing_permission_after: branch.marketing_permission,
        settlement_permission_before: oldSettlementPerm,
        settlement_permission_after: branch.settlement_permission,
        affected_goods_count: affectedGoodsCount,
        operator_id: payload.operator_id,
        operator_name: payload.operator_name,
        effective_time: payload.effective_time ? new Date(payload.effective_time) : new Date(),
        remark: payload.remark,
      }, { transaction });

      await this.shopOperationLedgerDao.create({
        merchant_id: payload.merchant_id,
        operation_type: ShopOperationType.STATUS_CHANGE,
        operation_title: `店铺状态变更：${SHOP_STATUS_MAP[currentStatus]} → ${SHOP_STATUS_MAP[payload.target_status]}`,
        operation_detail: `变更来源：${SHOP_STATUS_SOURCE_MAP[payload.change_source] || payload.change_source}；变更原因：${payload.change_reason}；联动：商品上下架(${branch.goods_status === 1 ? '上架' : '下架'})、接单权限(${branch.order_permission === 1 ? '允许' : '禁止'})、营销资格(${branch.marketing_permission === 1 ? '有' : '无'})、结算功能(${branch.settlement_permission === 1 ? '开启' : '关闭'})`,
        goods_count: affectedGoodsCount,
        operator_id: payload.operator_id,
        operator_name: payload.operator_name || '系统',
        operator_role: payload.operator_id ? 'admin' : 'system',
        permission_snapshot: {
          order: branch.order_permission,
          marketing: branch.marketing_permission,
          settlement: branch.settlement_permission,
        },
        status_snapshot: {
          before: currentStatus,
          after: payload.target_status,
        },
      }, { transaction });

      await transaction.commit();
      return {
        success: true,
        message: `店铺状态已变更为「${SHOP_STATUS_MAP[payload.target_status]}」，已同步联动${branch.goods_status === 0 ? affectedGoodsCount + '件商品下架' : '商品上架恢复'}、订单权限、营销资格、结算功能`,
        affected_goods_count: affectedGoodsCount,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getStatusChangeLogs(merchantId: number): Promise<any[]> {
    return this.shopStatusChangeLogDao.findByMerchantId(merchantId);
  }
}

export const shopStatusService = new ShopStatusService();
export default ShopStatusService;
