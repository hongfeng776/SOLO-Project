import { daos } from '../dao';
import { InboundStatus, InboundType } from '../models/WarehouseInboundRecord';
import { OutboundStatus, OutboundType } from '../models/WarehouseOutboundRecord';
import { InventoryType } from '../models/WarehouseInventoryRecord';
import { Op } from 'sequelize';
import sequelize from '../config/sequelize';

const {
  warehouseInboundRecordDao,
  warehouseOutboundRecordDao,
  warehouseInventoryRecordDao,
  warehouseTransferRecordDao,
  goodsDao,
  orderDao,
  orderItemDao,
  userPermissionDao,
} = daos;

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
  warnings: string[];
}

interface InboundParams {
  goods_id: number;
  goods_code: string;
  goods_name: string;
  goods_spec?: string;
  batch_no: string;
  production_date?: string;
  expiry_date?: string;
  type: number;
  quantity: number;
  unit_cost?: number;
  warehouse_location: string;
  warehouse_zone?: string;
  shelf_no?: string;
  operator_id: number;
  operator_name: string;
  remark?: string;
}

interface OutboundParams {
  goods_id: number;
  goods_code: string;
  goods_name: string;
  goods_spec?: string;
  batch_no: string;
  type: number;
  quantity: number;
  warehouse_location: string;
  order_id?: number;
  order_no?: string;
  transfer_target_location?: number;
  transfer_target_name?: string;
  operator_id: number;
  operator_name: string;
  remark?: string;
}

export class WarehouseStockValidateService {
  async validateInbound(params: InboundParams): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: string[] = [];

    const goods = await goodsDao.findById(params.goods_id);
    if (!goods) {
      errors.push({ field: 'goods_id', message: '商品不存在', severity: 'error' });
      return { valid: false, errors, warnings };
    }

    if (goods.sku_code !== params.goods_code) {
      errors.push({ field: 'goods_code', message: '商品编码与系统记录不一致', severity: 'error' });
    }

    if (goods.name !== params.goods_name) {
      errors.push({ field: 'goods_name', message: '商品名称与系统记录不一致', severity: 'error' });
    }

    if (params.goods_spec && goods.spec && goods.spec !== params.goods_spec) {
      errors.push({ field: 'goods_spec', message: '商品规格与系统记录不一致', severity: 'error' });
    }

    const existingBatch = await warehouseInventoryRecordDao.findByCondition({
      batch_no: params.batch_no,
      goods_id: params.goods_id,
    });
    if (existingBatch.length > 0) {
      const hasExactDuplicate = existingBatch.some(
        (r: any) => r.warehouse_location === params.warehouse_location && r.inventory_type === InventoryType.NORMAL
      );
      if (hasExactDuplicate) {
        errors.push({ field: 'batch_no', message: '同批次同位置已有库存记录，禁止重复录入', severity: 'error' });
      } else {
        warnings.push('同批次在不同位置已存在库存记录');
      }
    }

    if (params.expiry_date) {
      const expiryDate = new Date(params.expiry_date);
      const now = new Date();
      if (expiryDate <= now) {
        errors.push({ field: 'expiry_date', message: '商品已过期，禁止入库', severity: 'error' });
      } else {
        const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 30) {
          warnings.push(`商品即将过期，距到期日仅剩${Math.floor(daysUntilExpiry)}天`);
        }
      }
    }

    const hasPermission = await this.checkOperatorPermission(params.operator_id, 'warehouse:inbound');
    if (!hasPermission) {
      errors.push({ field: 'operator_id', message: '操作人员无入库权限', severity: 'error' });
    }

    if (params.quantity <= 0) {
      errors.push({ field: 'quantity', message: '入库数量必须大于0', severity: 'error' });
    }

    if (!params.warehouse_location) {
      errors.push({ field: 'warehouse_location', message: '请指定仓储位置', severity: 'error' });
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  async validateOutbound(params: OutboundParams): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: string[] = [];

    const goods = await goodsDao.findById(params.goods_id);
    if (!goods) {
      errors.push({ field: 'goods_id', message: '商品不存在', severity: 'error' });
      return { valid: false, errors, warnings };
    }

    if (goods.sku_code !== params.goods_code) {
      errors.push({ field: 'goods_code', message: '商品编码与系统记录不一致', severity: 'error' });
    }

    const inventoryRecords = await warehouseInventoryRecordDao.findByCondition({
      goods_id: params.goods_id,
      batch_no: params.batch_no,
      warehouse_location: params.warehouse_location,
      inventory_type: InventoryType.NORMAL,
    });

    if (inventoryRecords.length === 0) {
      errors.push({ field: 'batch_no', message: '该批次在指定仓储位置无库存记录', severity: 'error' });
    } else {
      const currentStock = inventoryRecords.reduce((sum: number, r: any) => sum + (r.system_quantity || 0), 0);
      if (currentStock < params.quantity) {
        errors.push({
          field: 'quantity',
          message: `超量出库拦截：当前库存${currentStock}，申请出库${params.quantity}，不足${params.quantity - currentStock}`,
          severity: 'error',
        });
      }
    }

    const hasPermission = await this.checkOperatorPermission(params.operator_id, 'warehouse:outbound');
    if (!hasPermission) {
      errors.push({ field: 'operator_id', message: '操作人员无出库权限', severity: 'error' });
    }

    if (params.quantity <= 0) {
      errors.push({ field: 'quantity', message: '出库数量必须大于0', severity: 'error' });
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  private async checkOperatorPermission(operatorId: number, permissionCode: string): Promise<boolean> {
    try {
      const permissions = await userPermissionDao.findByCondition({
        admin_id: operatorId,
        permission_value: permissionCode,
      });
      return permissions.length > 0;
    } catch {
      return true;
    }
  }

  async createInbound(params: InboundParams): Promise<any> {
    const validation = await this.validateInbound(params);
    if (!validation.valid) {
      return {
        success: false,
        validation_result: validation,
        message: validation.errors.map(e => e.message).join('；'),
      };
    }

    const inboundNo = `IN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const t = await sequelize.transaction();

    try {
      const record = await warehouseInboundRecordDao.create({
        inbound_no: inboundNo,
        ...params,
        production_date: params.production_date ? new Date(params.production_date) : undefined,
        expiry_date: params.expiry_date ? new Date(params.expiry_date) : undefined,
        status: InboundStatus.PENDING,
        validation_result: validation,
        total_cost: params.unit_cost ? params.unit_cost * params.quantity : undefined,
      }, { transaction: t });

      await this.syncInventoryAfterInbound(params, t);
      await t.commit();

      return { success: true, record, validation_result: validation };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  private async syncInventoryAfterInbound(params: InboundParams, t: any): Promise<void> {
    const existingInventory = await warehouseInventoryRecordDao.findByCondition({
      goods_id: params.goods_id,
      batch_no: params.batch_no,
      warehouse_location: params.warehouse_location,
      inventory_type: InventoryType.NORMAL,
    });

    if (existingInventory.length > 0) {
      const inventory = existingInventory[0];
      await warehouseInventoryRecordDao.update(inventory.id, {
        system_quantity: (inventory.system_quantity || 0) + params.quantity,
        normal_quantity: (inventory.normal_quantity || 0) + params.quantity,
        last_count_operator_id: params.operator_id,
        last_count_operator_name: params.operator_name,
        last_count_time: new Date(),
      }, { transaction: t });
    } else {
      const inventoryNo = `WH${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await warehouseInventoryRecordDao.create({
        inventory_no: inventoryNo,
        goods_id: params.goods_id,
        goods_code: params.goods_code,
        goods_name: params.goods_name,
        goods_spec: params.goods_spec,
        batch_no: params.batch_no,
        production_date: params.production_date ? new Date(params.production_date) : undefined,
        expiry_date: params.expiry_date ? new Date(params.expiry_date) : undefined,
        warehouse_location: params.warehouse_location,
        warehouse_zone: params.warehouse_zone,
        shelf_no: params.shelf_no,
        system_quantity: params.quantity,
        actual_quantity: params.quantity,
        diff_quantity: 0,
        inventory_type: InventoryType.NORMAL,
        count_status: 0,
        normal_quantity: params.quantity,
        loss_quantity: 0,
        abnormal_quantity: 0,
        unit_price: params.unit_cost,
        total_amount: params.unit_cost ? params.unit_cost * params.quantity : 0,
        is_synced_front: false,
        is_synced_merchant: false,
        is_synced_logistics: false,
        operator_id: params.operator_id,
        operator_name: params.operator_name,
      }, { transaction: t });
    }

    const goods = await goodsDao.findById(params.goods_id);
    if (goods) {
      await goodsDao.update(params.goods_id, {
        stock: (goods.stock || 0) + params.quantity,
      }, { transaction: t });
    }
  }

  async createOutbound(params: OutboundParams): Promise<any> {
    const validation = await this.validateOutbound(params);
    if (!validation.valid) {
      return {
        success: false,
        validation_result: validation,
        message: validation.errors.map(e => e.message).join('；'),
      };
    }

    const outboundNo = `OUT${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const t = await sequelize.transaction();

    try {
      const isOverQuantity = validation.errors.some(e => e.field === 'quantity');
      const record = await warehouseOutboundRecordDao.create({
        outbound_no: outboundNo,
        ...params,
        status: InboundStatus.PENDING,
        validation_result: validation,
        is_over_quantity_intercepted: isOverQuantity,
        intercept_reason: isOverQuantity ? '超量出库已被拦截' : undefined,
      }, { transaction: t });

      if (!isOverQuantity) {
        await this.syncInventoryAfterOutbound(params, t);
      }

      await t.commit();
      return { success: true, record, validation_result: validation };
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  }

  private async syncInventoryAfterOutbound(params: OutboundParams, t: any): Promise<void> {
    const inventoryRecords = await warehouseInventoryRecordDao.findByCondition({
      goods_id: params.goods_id,
      batch_no: params.batch_no,
      warehouse_location: params.warehouse_location,
      inventory_type: InventoryType.NORMAL,
    });

    for (const inventory of inventoryRecords) {
      const newQuantity = Math.max(0, (inventory.system_quantity || 0) - params.quantity);
      await warehouseInventoryRecordDao.update(inventory.id, {
        system_quantity: newQuantity,
        normal_quantity: newQuantity,
        last_count_operator_id: params.operator_id,
        last_count_operator_name: params.operator_name,
        last_count_time: new Date(),
        is_low_stock_alert: newQuantity <= (inventory.low_stock_threshold || 10),
      }, { transaction: t });
    }

    const goods = await goodsDao.findById(params.goods_id);
    if (goods) {
      await goodsDao.update(params.goods_id, {
        stock: Math.max(0, (goods.stock || 0) - params.quantity),
      }, { transaction: t });
    }
  }
}

export default new WarehouseStockValidateService();
