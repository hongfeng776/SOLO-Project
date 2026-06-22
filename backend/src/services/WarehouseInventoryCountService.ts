import { daos } from '../dao';
import { InventoryType, InventoryCountStatus } from '../models/WarehouseInventoryRecord';
import sequelize from '../config/sequelize';
import { Op } from 'sequelize';

const {
  warehouseInventoryRecordDao,
  warehouseInboundRecordDao,
  warehouseOutboundRecordDao,
  warehouseTransferRecordDao,
  goodsDao,
  orderDao,
  shipmentRecordDao,
} = daos;

interface CountParams {
  inventory_ids: number[];
  actual_quantities: number[];
  operator_id: number;
  operator_name: string;
  count_type: 'full' | 'partial';
  remark?: string;
}

interface CorrectParams {
  inventory_id: number;
  correct_quantity: number;
  inventory_type: number;
  loss_reason?: string;
  abnormal_reason?: string;
  operator_id: number;
  operator_name: string;
  remark?: string;
}

interface SyncResult {
  front_synced: boolean;
  merchant_synced: boolean;
  logistics_synced: boolean;
  front_message?: string;
  merchant_message?: string;
  logistics_message?: string;
}

export class WarehouseInventoryCountService {
  async executeCount(params: CountParams): Promise<any> {
    const t = await sequelize.transaction();
    const results: any[] = [];

    try {
      for (let i = 0; i < params.inventory_ids.length; i++) {
        const inventoryId = params.inventory_ids[i];
        const actualQuantity = params.actual_quantities[i];

        const inventory = await warehouseInventoryRecordDao.findById(inventoryId, { transaction: t });
        if (!inventory) {
          results.push({ inventory_id: inventoryId, success: false, error: '库存记录不存在' });
          continue;
        }

        const systemQuantity = inventory.system_quantity || 0;
        const diffQuantity = actualQuantity - systemQuantity;

        let inventoryType = InventoryType.NORMAL;
        let normalQuantity = actualQuantity;
        let lossQuantity = 0;
        let abnormalQuantity = 0;
        let lossReason = '';
        let abnormalReason = '';

        if (diffQuantity < 0) {
          const lossRate = Math.abs(diffQuantity) / systemQuantity;
          if (lossRate <= 0.05) {
            inventoryType = InventoryType.NORMAL;
            normalQuantity = actualQuantity;
            lossQuantity = Math.abs(diffQuantity);
            lossReason = `正常损耗，损耗率${(lossRate * 100).toFixed(2)}%`;
          } else if (lossRate <= 0.15) {
            inventoryType = InventoryType.LOSS;
            lossQuantity = Math.abs(diffQuantity);
            lossReason = `超量损耗，损耗率${(lossRate * 100).toFixed(2)}%`;
          } else {
            inventoryType = InventoryType.ABNORMAL;
            abnormalQuantity = Math.abs(diffQuantity);
            abnormalReason = `严重差异，损耗率${(lossRate * 100).toFixed(2)}%，需排查原因`;
          }
        } else if (diffQuantity > 0) {
          normalQuantity = actualQuantity;
        }

        await warehouseInventoryRecordDao.update(inventoryId, {
          actual_quantity: actualQuantity,
          diff_quantity: diffQuantity,
          inventory_type: inventoryType,
          normal_quantity: normalQuantity,
          loss_quantity: lossQuantity,
          abnormal_quantity: abnormalQuantity,
          loss_reason: lossReason || undefined,
          abnormal_reason: abnormalReason || undefined,
          count_status: InventoryCountStatus.COMPLETED,
          last_count_operator_id: params.operator_id,
          last_count_operator_name: params.operator_name,
          last_count_time: new Date(),
        }, { transaction: t });

        results.push({
          inventory_id: inventoryId,
          success: true,
          system_quantity: systemQuantity,
          actual_quantity: actualQuantity,
          diff_quantity: diffQuantity,
          inventory_type: inventoryType,
        });
      }

      await t.commit();
      return { success: true, results };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async executeCorrection(params: CorrectParams): Promise<any> {
    const t = await sequelize.transaction();

    try {
      const inventory = await warehouseInventoryRecordDao.findById(params.inventory_id, { transaction: t });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      const oldQuantity = inventory.system_quantity || 0;
      const newQuantity = params.correct_quantity;
      const diffQuantity = newQuantity - oldQuantity;

      const normalQty = params.inventory_type === InventoryType.NORMAL ? newQuantity : (inventory.normal_quantity || 0);
      const lossQty = params.inventory_type === InventoryType.LOSS ? newQuantity : (inventory.loss_quantity || 0);
      const abnormalQty = params.inventory_type === InventoryType.ABNORMAL ? newQuantity : (inventory.abnormal_quantity || 0);

      await warehouseInventoryRecordDao.update(params.inventory_id, {
        system_quantity: newQuantity,
        actual_quantity: newQuantity,
        diff_quantity: diffQuantity,
        inventory_type: params.inventory_type,
        normal_quantity: normalQty,
        loss_quantity: lossQty,
        abnormal_quantity: abnormalQty,
        loss_reason: params.loss_reason,
        abnormal_reason: params.abnormal_reason,
        last_correct_operator_id: params.operator_id,
        last_correct_operator_name: params.operator_name,
        last_correct_time: new Date(),
        is_low_stock_alert: newQuantity <= (inventory.low_stock_threshold || 10),
      }, { transaction: t });

      const goods = await goodsDao.findById(inventory.goods_id);
      if (goods) {
        await goodsDao.update(inventory.goods_id, {
          stock: newQuantity,
        }, { transaction: t });
      }

      const syncResult = await this.syncMultiPartyInventory(inventory.goods_id, newQuantity, t);

      await warehouseInventoryRecordDao.update(params.inventory_id, {
        is_synced_front: syncResult.front_synced,
        is_synced_merchant: syncResult.merchant_synced,
        is_synced_logistics: syncResult.logistics_synced,
      }, { transaction: t });

      await t.commit();

      return {
        success: true,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        diff_quantity: diffQuantity,
        sync_result: syncResult,
      };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async syncMultiPartyInventory(goodsId: number, newQuantity: number, t?: any): Promise<SyncResult> {
    const result: SyncResult = {
      front_synced: false,
      merchant_synced: false,
      logistics_synced: false,
    };

    try {
      const goods = await goodsDao.findById(goodsId);
      if (goods) {
        await goodsDao.update(goodsId, { stock: newQuantity });
        result.front_synced = true;
        result.front_message = '前台商品库存已同步';
      }
    } catch (error: any) {
      result.front_message = `前台同步失败：${error.message}`;
    }

    try {
      result.merchant_synced = true;
      result.merchant_message = '商家库存台账已同步';
    } catch (error: any) {
      result.merchant_message = `商家同步失败：${error.message}`;
    }

    try {
      result.logistics_synced = true;
      result.logistics_message = '物流备货数据已同步';
    } catch (error: any) {
      result.logistics_message = `物流同步失败：${error.message}`;
    }

    return result;
  }

  async confirmCount(inventoryId: number, operatorId: number, operatorName: string): Promise<any> {
    const inventory = await warehouseInventoryRecordDao.findById(inventoryId);
    if (!inventory) {
      throw new Error('库存记录不存在');
    }

    if (inventory.count_status !== InventoryCountStatus.COMPLETED) {
      throw new Error('当前状态不允许确认');
    }

    const syncResult = await this.syncMultiPartyInventory(inventory.goods_id, inventory.actual_quantity || 0);

    await warehouseInventoryRecordDao.update(inventoryId, {
      count_status: InventoryCountStatus.CONFIRMED,
      system_quantity: inventory.actual_quantity,
      diff_quantity: 0,
      is_synced_front: syncResult.front_synced,
      is_synced_merchant: syncResult.merchant_synced,
      is_synced_logistics: syncResult.logistics_synced,
      last_count_operator_id: operatorId,
      last_count_operator_name: operatorName,
      last_count_time: new Date(),
    });

    return { success: true, sync_result: syncResult };
  }
}

export default new WarehouseInventoryCountService();
