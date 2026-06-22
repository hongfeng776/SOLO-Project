import { daos } from '../dao';
import { InventoryType } from '../models/WarehouseInventoryRecord';
import { InboundStatus } from '../models/WarehouseInboundRecord';
import { OutboundStatus } from '../models/WarehouseOutboundRecord';
import { TransferStatus } from '../models/WarehouseTransferRecord';
import { Op } from 'sequelize';

const {
  warehouseInventoryRecordDao,
  warehouseInboundRecordDao,
  warehouseOutboundRecordDao,
  warehouseTransferRecordDao,
  goodsDao,
} = daos;

interface ConsistencyReport {
  total_items: number;
  consistent_items: number;
  inconsistent_items: number;
  fake_data_detected: number;
  over_quantity_detected: number;
  duplicate_batch_detected: number;
  consistency_score: number;
  issues: string[];
  recommendations: string[];
}

interface FullInventoryTrace {
  inventory_info: any;
  goods_info: any;
  inbound_records: any[];
  outbound_records: any[];
  transfer_records: any[];
  count_history: any[];
  correction_history: any[];
  consistency_report: ConsistencyReport;
}

export class WarehouseInventoryTraceService {
  async getFullInventoryTrace(inventoryId: number): Promise<FullInventoryTrace> {
    const inventory = await warehouseInventoryRecordDao.findById(inventoryId);
    if (!inventory) {
      throw new Error('库存记录不存在');
    }

    const goods = await goodsDao.findById(inventory.goods_id);

    const inboundRecords = await warehouseInboundRecordDao.findByCondition({
      goods_id: inventory.goods_id,
      batch_no: inventory.batch_no,
    }, { order: [['created_at', 'DESC']] });

    const outboundRecords = await warehouseOutboundRecordDao.findByCondition({
      goods_id: inventory.goods_id,
      batch_no: inventory.batch_no,
    }, { order: [['created_at', 'DESC']] });

    const transferRecords = await warehouseTransferRecordDao.findByCondition({
      goods_id: inventory.goods_id,
      batch_no: inventory.batch_no,
    }, { order: [['created_at', 'DESC']] });

    const consistencyReport = await this.calculateConsistencyReport(
      inventory,
      inboundRecords,
      outboundRecords,
      transferRecords,
      goods
    );

    return {
      inventory_info: inventory,
      goods_info: goods ? {
        id: goods.id,
        sku_code: goods.sku_code,
        name: goods.name,
        stock: goods.stock,
        status: goods.status,
      } : null,
      inbound_records: inboundRecords,
      outbound_records: outboundRecords,
      transfer_records: transferRecords,
      count_history: [],
      correction_history: [],
      consistency_report: consistencyReport,
    };
  }

  private async calculateConsistencyReport(
    inventory: any,
    inboundRecords: any[],
    outboundRecords: any[],
    transferRecords: any[],
    goods: any
  ): Promise<ConsistencyReport> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const totalInbound = inboundRecords
      .filter((r: any) => r.status === InboundStatus.COMPLETED)
      .reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);

    const totalOutbound = outboundRecords
      .filter((r: any) => r.status === OutboundStatus.COMPLETED)
      .reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);

    const calculatedStock = totalInbound - totalOutbound;
    const systemStock = inventory.system_quantity || 0;

    let consistencyScore = 100;

    if (calculatedStock !== systemStock) {
      issues.push(`库存计算不一致：入库合计${totalInbound} - 出库合计${totalOutbound} = ${calculatedStock}，系统库存为${systemStock}`);
      consistencyScore -= 20;
      recommendations.push('建议重新盘点并修正库存数据');
    }

    if (goods && goods.stock !== systemStock) {
      issues.push(`商品库存不同步：商品表库存${goods.stock}，台账库存${systemStock}`);
      consistencyScore -= 15;
      recommendations.push('同步商品库存与台账库存');
    }

    const duplicateBatches = await warehouseInventoryRecordDao.findByCondition({
      batch_no: inventory.batch_no,
      goods_id: inventory.goods_id,
      id: { [Op.ne]: inventory.id },
    });

    let duplicateBatchDetected = 0;
    if (duplicateBatches.length > 0) {
      duplicateBatchDetected = duplicateBatches.length;
      issues.push(`检测到${duplicateBatches.length}条重复批次记录`);
      consistencyScore -= 10;
      recommendations.push('清理重复的批次记录');
    }

    let fakeDataDetected = 0;
    if (inventory.actual_quantity !== undefined && inventory.system_quantity !== undefined) {
      const diff = Math.abs((inventory.actual_quantity || 0) - (inventory.system_quantity || 0));
      const diffRate = inventory.system_quantity > 0 ? diff / inventory.system_quantity : 0;
      if (diffRate > 0.5 && inventory.count_status >= 2) {
        fakeDataDetected = 1;
        issues.push(`疑似虚假库存：盘点差异率${(diffRate * 100).toFixed(2)}%，超过50%阈值`);
        consistencyScore -= 25;
        recommendations.push('核实库存数据真实性');
      }
    }

    let overQuantityDetected = 0;
    const overQuantityOutbound = outboundRecords.filter((r: any) => r.is_over_quantity_intercepted);
    if (overQuantityOutbound.length > 0) {
      overQuantityDetected = overQuantityOutbound.length;
      issues.push(`检测到${overQuantityOutbound.length}次超量出库拦截`);
      consistencyScore -= 10;
      recommendations.push('核实超量出库拦截记录');
    }

    if (inventory.inventory_type === InventoryType.ABNORMAL) {
      issues.push('当前库存为异常库存');
      consistencyScore -= 10;
      recommendations.push('排查异常库存原因并处理');
    }

    if (!inventory.is_synced_front) {
      issues.push('前台商品库存未同步');
      consistencyScore -= 5;
      recommendations.push('同步前台商品库存');
    }

    consistencyScore = Math.max(0, consistencyScore);

    return {
      total_items: 1,
      consistent_items: consistencyScore >= 80 ? 1 : 0,
      inconsistent_items: consistencyScore < 80 ? 1 : 0,
      fake_data_detected: fakeDataDetected,
      over_quantity_detected: overQuantityDetected,
      duplicate_batch_detected: duplicateBatchDetected,
      consistency_score: consistencyScore,
      issues,
      recommendations,
    };
  }

  async checkOverQuantityOutbound(
    goodsId: number,
    batchNo: string,
    warehouseLocation: string,
    requestQuantity: number
  ): Promise<{ is_over: boolean; current_stock: number; message?: string }> {
    const inventories = await warehouseInventoryRecordDao.findByCondition({
      goods_id: goodsId,
      batch_no: batchNo,
      warehouse_location: warehouseLocation,
      inventory_type: InventoryType.NORMAL,
    });

    const currentStock = inventories.reduce((sum: number, r: any) => sum + (r.system_quantity || 0), 0);

    if (requestQuantity > currentStock) {
      return {
        is_over: true,
        current_stock: currentStock,
        message: `超量出库拦截：当前库存${currentStock}，申请出库${requestQuantity}，不足${requestQuantity - currentStock}`,
      };
    }

    return { is_over: false, current_stock: currentStock };
  }

  async checkDuplicateBatch(
    goodsId: number,
    batchNo: string,
    warehouseLocation: string,
    excludeId?: number
  ): Promise<{ is_duplicate: boolean; existing_records: any[] }> {
    const where: any = {
      goods_id: goodsId,
      batch_no: batchNo,
      warehouse_location: warehouseLocation,
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await warehouseInventoryRecordDao.findByCondition(where);

    return {
      is_duplicate: existing.length > 0,
      existing_records: existing,
    };
  }

  async checkFakeInventory(inventoryId: number): Promise<{ is_fake: boolean; fake_type?: string; fake_reason?: string }> {
    const inventory = await warehouseInventoryRecordDao.findById(inventoryId);
    if (!inventory) {
      throw new Error('库存记录不存在');
    }

    if (inventory.system_quantity !== undefined && inventory.system_quantity < 0) {
      return {
        is_fake: true,
        fake_type: 'negative_stock',
        fake_reason: '库存数量为负数，数据异常',
      };
    }

    if (inventory.actual_quantity !== undefined && inventory.system_quantity !== undefined) {
      const diff = Math.abs(inventory.actual_quantity - inventory.system_quantity);
      const diffRate = inventory.system_quantity > 0 ? diff / inventory.system_quantity : 0;
      if (diffRate > 1.0 && inventory.count_status >= 2) {
        return {
          is_fake: true,
          fake_type: 'large_discrepancy',
          fake_reason: `盘点差异率${(diffRate * 100).toFixed(2)}%，超过100%阈值`,
        };
      }
    }

    const goods = await goodsDao.findById(inventory.goods_id);
    if (goods && goods.stock !== undefined && inventory.system_quantity !== undefined) {
      const allInventoryForGoods = await warehouseInventoryRecordDao.findByCondition({
        goods_id: inventory.goods_id,
        inventory_type: InventoryType.NORMAL,
      });

      const totalWarehouseStock = allInventoryForGoods.reduce((sum: number, r: any) => sum + (r.system_quantity || 0), 0);
      if (totalWarehouseStock > 0 && goods.stock === 0) {
        return {
          is_fake: true,
          fake_type: 'stock_mismatch',
          fake_reason: '仓库有库存但商品表库存为0，数据不同步',
        };
      }
    }

    return { is_fake: false };
  }

  formatThousandSeparator(value: number): string {
    return value.toLocaleString('zh-CN');
  }
}

export default new WarehouseInventoryTraceService();
