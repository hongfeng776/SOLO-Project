import { daos } from '../dao';
import { InventoryType, InventoryCountStatus } from '../models/WarehouseInventoryRecord';
import { TransferStatus } from '../models/WarehouseTransferRecord';
import sequelize from '../config/sequelize';
import { Op } from 'sequelize';

const {
  warehouseInventoryRecordDao,
  warehouseInboundRecordDao,
  warehouseOutboundRecordDao,
  warehouseTransferRecordDao,
  goodsDao,
  userPermissionDao,
} = daos;

export interface BatchPermission {
  can_count: boolean;
  can_transfer: boolean;
  can_alert: boolean;
  can_import: boolean;
}

export interface InventoryQueryParams {
  batch_no?: string;
  warehouse_location?: string;
  inventory_type?: number;
  count_status?: number;
  goods_code?: string;
  goods_name?: string;
  is_low_stock_alert?: number;
  page?: number;
  page_size?: number;
}

export class WarehouseInventoryBatchService {
  async getUserPermissions(adminId: number): Promise<BatchPermission> {
    return {
      can_count: true,
      can_transfer: true,
      can_alert: true,
      can_import: true,
    };
  }

  async queryInventory(params: InventoryQueryParams): Promise<any> {
    const {
      batch_no,
      warehouse_location,
      inventory_type,
      count_status,
      goods_code,
      goods_name,
      is_low_stock_alert,
      page = 1,
      page_size = 20,
    } = params;

    const where: any = {};
    if (batch_no) where.batch_no = { [Op.like]: `%${batch_no}%` };
    if (warehouse_location) where.warehouse_location = warehouse_location;
    if (inventory_type !== undefined) where.inventory_type = inventory_type;
    if (count_status !== undefined) where.count_status = count_status;
    if (goods_code) where.goods_code = { [Op.like]: `%${goods_code}%` };
    if (goods_name) where.goods_name = { [Op.like]: `%${goods_name}%` };
    if (is_low_stock_alert !== undefined) where.is_low_stock_alert = is_low_stock_alert;

    const result = await warehouseInventoryRecordDao.findPage({
      page,
      pageSize: page_size,
      where,
      order: [['created_at', 'DESC']],
    });

    return result;
  }

  async batchCount(
    inventoryIds: number[],
    operatorId: number,
    operatorName: string
  ): Promise<any> {
    const results: any[] = [];
    const t = await sequelize.transaction();

    try {
      for (const id of inventoryIds) {
        try {
          await warehouseInventoryRecordDao.update(id, {
            count_status: InventoryCountStatus.COUNTING,
            last_count_operator_id: operatorId,
            last_count_operator_name: operatorName,
            last_count_time: new Date(),
          }, { transaction: t });

          results.push({ inventory_id: id, success: true });
        } catch (error: any) {
          results.push({ inventory_id: id, success: false, error: error.message });
        }
      }

      await t.commit();
      return {
        total: inventoryIds.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async batchTransfer(
    inventoryIds: number[],
    targetLocation: string,
    targetZone: string,
    operatorId: number,
    operatorName: string,
    reason?: string
  ): Promise<any> {
    const results: any[] = [];
    const t = await sequelize.transaction();

    try {
      for (const id of inventoryIds) {
        try {
          const inventory = await warehouseInventoryRecordDao.findById(id, { transaction: t });
          if (!inventory) {
            results.push({ inventory_id: id, success: false, error: '库存记录不存在' });
            continue;
          }

          if ((inventory.system_quantity || 0) <= 0) {
            results.push({ inventory_id: id, success: false, error: '库存不足，无法调拨' });
            continue;
          }

          const transferNo = `TF${Date.now()}${Math.floor(Math.random() * 10000)}`;

          await warehouseTransferRecordDao.create({
            transfer_no: transferNo,
            goods_id: inventory.goods_id,
            goods_code: inventory.goods_code,
            goods_name: inventory.goods_name,
            goods_spec: inventory.goods_spec,
            batch_no: inventory.batch_no,
            quantity: inventory.system_quantity,
            from_location: inventory.warehouse_location,
            from_zone: inventory.warehouse_zone,
            to_location: targetLocation,
            to_zone: targetZone,
            status: TransferStatus.PENDING,
            reason: reason || '批量调拨',
            operator_id: operatorId,
            operator_name: operatorName,
          }, { transaction: t });

          results.push({ inventory_id: id, success: true, transfer_no: transferNo });
        } catch (error: any) {
          results.push({ inventory_id: id, success: false, error: error.message });
        }
      }

      await t.commit();
      return {
        total: inventoryIds.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async batchLowStockAlert(
    inventoryIds: number[],
    threshold: number,
    operatorId: number,
    operatorName: string
  ): Promise<any> {
    const results: any[] = [];
    const t = await sequelize.transaction();

    try {
      for (const id of inventoryIds) {
        try {
          const inventory = await warehouseInventoryRecordDao.findById(id, { transaction: t });
          if (!inventory) {
            results.push({ inventory_id: id, success: false, error: '库存记录不存在' });
            continue;
          }

          const isLow = (inventory.system_quantity || 0) <= threshold;

          await warehouseInventoryRecordDao.update(id, {
            low_stock_threshold: threshold,
            is_low_stock_alert: isLow,
          }, { transaction: t });

          results.push({
            inventory_id: id,
            success: true,
            current_quantity: inventory.system_quantity,
            threshold,
            is_low_stock: isLow,
          });
        } catch (error: any) {
          results.push({ inventory_id: id, success: false, error: error.message });
        }
      }

      await t.commit();
      return {
        total: inventoryIds.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        alert_count: results.filter(r => r.success && r.is_low_stock).length,
        results,
      };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async batchImportCountData(
    dataList: Array<{
      goods_code: string;
      batch_no: string;
      warehouse_location: string;
      actual_quantity: number;
    }>,
    operatorId: number,
    operatorName: string,
    toleranceRate: number = 0.1
  ): Promise<any> {
    const results: any[] = [];
    const t = await sequelize.transaction();

    try {
      for (const item of dataList) {
        try {
          const inventories = await warehouseInventoryRecordDao.findByCondition({
            goods_code: { [Op.like]: `%${item.goods_code}%` },
            batch_no: { [Op.like]: `%${item.batch_no}%` },
            warehouse_location: item.warehouse_location,
          });

          if (inventories.length === 0) {
            if (toleranceRate > 0) {
              const fuzzyResults = await warehouseInventoryRecordDao.findByCondition({
                goods_code: { [Op.like]: `%${item.goods_code.substring(0, Math.ceil(item.goods_code.length * (1 - toleranceRate)))}%` },
              });

              if (fuzzyResults.length > 0) {
                const target = fuzzyResults[0];
                const diffQuantity = item.actual_quantity - (target.system_quantity || 0);
                await warehouseInventoryRecordDao.update(target.id, {
                  actual_quantity: item.actual_quantity,
                  diff_quantity: diffQuantity,
                  count_status: InventoryCountStatus.COMPLETED,
                  last_count_operator_id: operatorId,
                  last_count_operator_name: operatorName,
                  last_count_time: new Date(),
                }, { transaction: t });

                results.push({
                  goods_code: item.goods_code,
                  success: true,
                  matched_by: 'fuzzy',
                  inventory_id: target.id,
                });
                continue;
              }
            }

            results.push({
              goods_code: item.goods_code,
              success: false,
              error: '未找到匹配的库存记录',
            });
            continue;
          }

          const target = inventories[0];
          const diffQuantity = item.actual_quantity - (target.system_quantity || 0);

          await warehouseInventoryRecordDao.update(target.id, {
            actual_quantity: item.actual_quantity,
            diff_quantity: diffQuantity,
            count_status: InventoryCountStatus.COMPLETED,
            last_count_operator_id: operatorId,
            last_count_operator_name: operatorName,
            last_count_time: new Date(),
          }, { transaction: t });

          results.push({
            goods_code: item.goods_code,
            success: true,
            matched_by: 'exact',
            inventory_id: target.id,
            diff_quantity: diffQuantity,
          });
        } catch (error: any) {
          results.push({
            goods_code: item.goods_code,
            success: false,
            error: error.message,
          });
        }
      }

      await t.commit();
      return {
        total: dataList.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        fuzzy_matched: results.filter(r => r.matched_by === 'fuzzy').length,
        results,
      };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  async getRefreshListData(inventoryIds: number[]): Promise<any[]> {
    const inventories = await warehouseInventoryRecordDao.findByIds(inventoryIds);
    return inventories;
  }
}

export default new WarehouseInventoryBatchService();
