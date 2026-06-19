const { sequelize } = require('../config/db');
const FlightInventory = require('../models/FlightInventory');
const FlightInventoryLog = require('../models/FlightInventoryLog');
const Flight = require('../models/Flight');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

class FlightInventoryService {
  constructor() {
    this.inventoryTypeConfig = {
      fixed: { name: '固定库存', minStock: 0, maxStock: 1000, defaultLowStockThreshold: 10, defaultSoldOutThreshold: 3 },
      dynamic: { name: '动态库存', minStock: 0, maxStock: 5000, defaultLowStockThreshold: 20, defaultSoldOutThreshold: 5 },
      reserved: { name: '预留库存', minStock: 0, maxStock: 500, defaultLowStockThreshold: 5, defaultSoldOutThreshold: 2 },
      supplement: { name: '补录库存', minStock: 0, maxStock: 2000, defaultLowStockThreshold: 10, defaultSoldOutThreshold: 3 }
    };

    this.inventoryStatusConfig = {
      1: { name: '充足', color: '#52c41a' },
      2: { name: '紧张', color: '#faad14' },
      3: { name: '即将售罄', color: '#fa8c16' },
      4: { name: '已售罄', color: '#ff4d4f' }
    };

    this.operationTypeConfig = {
      1: { name: '创建库存', category: 'create', color: '#1890ff' },
      2: { name: '调整库存', category: 'adjust', color: '#722ed1' },
      3: { name: '占用库存(下单)', category: 'occupy', color: '#faad14' },
      4: { name: '释放库存(取消)', category: 'release', color: '#52c41a' },
      5: { name: '售出库存(支付)', category: 'occupy', color: '#13c2c2' },
      6: { name: '锁定库存', category: 'lock', color: '#ff4d4f' },
      7: { name: '解锁库存', category: 'unlock', color: '#52c41a' },
      8: { name: '预留库存', category: 'reserve', color: '#eb2f96' },
      9: { name: '释放预留', category: 'release', color: '#52c41a' },
      10: { name: '补录库存', category: 'supplement', color: '#fa8c16' },
      11: { name: '批量调整', category: 'batch', color: '#722ed1' },
      12: { name: '库存预警', category: 'warning', color: '#ff4d4f' }
    };
  }

  _getInventoryTypeConfig(inventoryType) {
    return this.inventoryTypeConfig[inventoryType] || this.inventoryTypeConfig.fixed;
  }

  _getInventoryStatus(availableStock, lowStockThreshold, soldOutThreshold) {
    if (availableStock <= 0) return 4;
    if (availableStock <= soldOutThreshold) return 3;
    if (availableStock <= lowStockThreshold) return 2;
    return 1;
  }

  _calculateAvailableStock(inventory) {
    const total = parseInt(inventory.totalStock) || 0;
    const occupied = parseInt(inventory.occupiedStock) || 0;
    const sold = parseInt(inventory.soldStock) || 0;
    const reserved = parseInt(inventory.reservedStock) || 0;
    const locked = parseInt(inventory.lockedStock) || 0;
    return Math.max(0, total - occupied - sold - reserved - locked);
  }

  _checkInventoryPermission(inventoryType, operationType, userRoles) {
    if (operationType === 'supplement' || inventoryType === 'supplement') {
      if (!userRoles.includes('admin') && !userRoles.includes('inventory_manager') && !userRoles.includes('inventory_supplement')) {
        return { valid: false, message: '无补录库存权限，请联系库存管理员' };
      }
    }

    if (operationType === 'batch_lock' || operationType === 'batch_release') {
      if (!userRoles.includes('admin') && !userRoles.includes('inventory_manager') && !userRoles.includes('holiday_inventory')) {
        return { valid: false, message: '无节假日批量库存调整权限，请联系高级管理员' };
      }
    }

    return { valid: true };
  }

  _validateInventoryData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate && !data.flightId) {
      errors.push({ field: 'flightId', message: '请选择航班' });
    }

    if (!data.inventoryType || !this.inventoryTypeConfig[data.inventoryType]) {
      errors.push({ field: 'inventoryType', message: '请选择有效的库存类型' });
    }

    const typeConfig = this._getInventoryTypeConfig(data.inventoryType);

    if (data.totalStock !== undefined && data.totalStock !== null) {
      const totalStock = parseInt(data.totalStock);
      if (isNaN(totalStock) || totalStock < 0) {
        errors.push({ field: 'totalStock', message: '总库存数必须为非负整数' });
      } else if (totalStock > typeConfig.maxStock) {
        errors.push({ field: 'totalStock', message: `${typeConfig.name}不能超过${typeConfig.maxStock}张` });
      }
    }

    if (data.occupiedStock !== undefined && data.occupiedStock !== null) {
      const occupied = parseInt(data.occupiedStock);
      if (isNaN(occupied) || occupied < 0) {
        errors.push({ field: 'occupiedStock', message: '占用库存数必须为非负整数' });
      }
    }

    if (data.soldStock !== undefined && data.soldStock !== null) {
      const sold = parseInt(data.soldStock);
      if (isNaN(sold) || sold < 0) {
        errors.push({ field: 'soldStock', message: '已售库存数必须为非负整数' });
      }
    }

    if (data.reservedStock !== undefined && data.reservedStock !== null) {
      const reserved = parseInt(data.reservedStock);
      const total = parseInt(data.totalStock) || 0;
      if (isNaN(reserved) || reserved < 0) {
        errors.push({ field: 'reservedStock', message: '预留库存数必须为非负整数' });
      } else if (data.totalStock && reserved > total) {
        errors.push({ field: 'reservedStock', message: '预留库存不能超过总库存' });
      }
    }

    if (data.lockedStock !== undefined && data.lockedStock !== null) {
      const locked = parseInt(data.lockedStock);
      const total = parseInt(data.totalStock) || 0;
      if (isNaN(locked) || locked < 0) {
        errors.push({ field: 'lockedStock', message: '锁定库存数必须为非负整数' });
      } else if (data.totalStock && locked > total) {
        errors.push({ field: 'lockedStock', message: '锁定库存不能超过总库存' });
      }
    }

    if (data.reserveRatio !== undefined && data.reserveRatio !== null) {
      const ratio = parseFloat(data.reserveRatio);
      if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        errors.push({ field: 'reserveRatio', message: '预留比例必须在0-100之间' });
      }
    }

    if (data.inventoryType === 'reserved' && !data.reserveExpireTime) {
      errors.push({ field: 'reserveExpireTime', message: '预留库存必须设置到期时间' });
    }

    if (data.lowStockThreshold !== undefined && data.lowStockThreshold !== null) {
      const threshold = parseInt(data.lowStockThreshold);
      if (isNaN(threshold) || threshold < 0) {
        errors.push({ field: 'lowStockThreshold', message: '低库存预警阈值必须为非负整数' });
      }
    }

    if (data.soldOutThreshold !== undefined && data.soldOutThreshold !== null) {
      const threshold = parseInt(data.soldOutThreshold);
      if (isNaN(threshold) || threshold < 0) {
        errors.push({ field: 'soldOutThreshold', message: '即将售罄阈值必须为非负整数' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  _validateStockConsistency(inventory) {
    const total = parseInt(inventory.totalStock) || 0;
    const occupied = parseInt(inventory.occupiedStock) || 0;
    const sold = parseInt(inventory.soldStock) || 0;
    const reserved = parseInt(inventory.reservedStock) || 0;
    const locked = parseInt(inventory.lockedStock) || 0;
    const available = parseInt(inventory.availableStock) || 0;
    const calculatedAvailable = total - occupied - sold - reserved - locked;

    if (available !== calculatedAvailable) {
      return { valid: false, message: `库存数据不一致：可用库存应为${calculatedAvailable}，当前为${available}` };
    }

    if (occupied + sold > total) {
      return { valid: false, message: '占用库存与已售库存之和不能超过总库存' };
    }

    if (reserved > total - occupied - sold) {
      return { valid: false, message: '预留库存不能超过可用库存' };
    }

    if (locked > total - occupied - sold - reserved) {
      return { valid: false, message: '锁定库存不能超过可锁定库存' };
    }

    return { valid: true };
  }

  async _checkInventoryConflict(flightId, cabinClass, inventoryType, excludeId = null) {
    const where = { flightId, cabinClass, inventoryType };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return FlightInventory.findOne({ where });
  }

  async _createInventoryLog(inventoryId, operationType, beforeData, afterData, options = {}) {
    const operationConfig = this.operationTypeConfig[operationType];
    const changeQuantity = options.changeQuantity !== undefined ? options.changeQuantity : null;
    const changeDirection = options.changeDirection || null;

    const logData = {
      inventoryId,
      flightId: options.flightId || (beforeData?.flightId || afterData?.flightId),
      flightNo: options.flightNo || (beforeData?.flightNo || afterData?.flightNo),
      cabinClass: options.cabinClass || (beforeData?.cabinClass || afterData?.cabinClass),
      inventoryType: options.inventoryType || (beforeData?.inventoryType || afterData?.inventoryType),
      operationType,
      operationName: operationConfig.name,
      operationCategory: operationConfig.category,
      beforeTotalStock: beforeData?.totalStock || null,
      afterTotalStock: afterData?.totalStock || null,
      beforeOccupiedStock: beforeData?.occupiedStock || null,
      afterOccupiedStock: afterData?.occupiedStock || null,
      beforeSoldStock: beforeData?.soldStock || null,
      afterSoldStock: afterData?.soldStock || null,
      beforeReservedStock: beforeData?.reservedStock || null,
      afterReservedStock: afterData?.reservedStock || null,
      beforeLockedStock: beforeData?.lockedStock || null,
      afterLockedStock: afterData?.lockedStock || null,
      beforeAvailableStock: beforeData?.availableStock || null,
      afterAvailableStock: afterData?.availableStock || null,
      changeQuantity,
      changeDirection,
      changeFields: options.changeFields ? JSON.stringify(options.changeFields) : null,
      relatedOrderId: options.orderId || null,
      relatedOrderNo: options.orderNo || null,
      effectScope: options.effectScope || null,
      affectedFlightCount: options.affectedFlightCount || 0,
      isBatchOperation: options.isBatchOperation ? 1 : 0,
      operatorId: options.operatorId || null,
      operatorName: options.operatorName || null,
      operatorRole: options.operatorRole || null,
      operationRemark: options.remark || null,
      operationStatus: options.status !== undefined ? options.status : 1,
      failReason: options.failReason || null,
      operationIp: options.ip || null,
      createdAt: new Date()
    };

    return FlightInventoryLog.create(logData);
  }

  async getInventoryList(params = {}) {
    const { page = 1, pageSize = 10, flightNo, cabinClass, inventoryType, inventoryStatus, isActive, isLocked, flightId } = params;

    const where = {};
    if (flightNo) where.flightNo = { [Op.like]: `%${flightNo}%` };
    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (inventoryType && inventoryType !== 'all') where.inventoryType = inventoryType;
    if (inventoryStatus && inventoryStatus !== 'all') where.inventoryStatus = Number(inventoryStatus);
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = Number(isActive);
    if (isLocked !== undefined && isLocked !== null && isLocked !== '') where.isLocked = Number(isLocked);
    if (flightId) where.flightId = flightId;

    const offset = (page - 1) * pageSize;

    const { count, rows } = await FlightInventory.findAndCountAll({
      where,
      include: [{ model: Flight, as: 'flight', attributes: ['id', 'flightNo', 'departure', 'arrival', 'departureAirportCode', 'arrivalAirportCode'] }],
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return { items: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getInventoryById(id) {
    return FlightInventory.findByPk(id, {
      include: [{ model: Flight, as: 'flight' }]
    });
  }

  async getInventoryByFlightAndCabin(flightId, cabinClass) {
    return FlightInventory.findAll({
      where: { flightId, cabinClass },
      order: [['inventoryType', 'ASC']]
    });
  }

  async validateInventory(data, userRoles = []) {
    const permissionCheck = this._checkInventoryPermission(data.inventoryType, 'create', userRoles);
    if (!permissionCheck.valid) {
      return { valid: false, errors: [{ field: 'inventoryType', message: permissionCheck.message }] };
    }

    return this._validateInventoryData(data, false);
  }

  async validateField(field, value, data = {}, userRoles = []) {
    const errors = [];

    if (field === 'totalStock') {
      const typeConfig = this._getInventoryTypeConfig(data.inventoryType);
      const total = parseInt(value);
      if (isNaN(total) || total < 0) {
        errors.push({ field, message: '总库存数必须为非负整数' });
      } else if (total > typeConfig.maxStock) {
        errors.push({ field, message: `${typeConfig.name}不能超过${typeConfig.maxStock}张` });
      }
    }

    if (field === 'reservedStock') {
      const reserved = parseInt(value);
      const total = parseInt(data.totalStock) || 0;
      if (isNaN(reserved) || reserved < 0) {
        errors.push({ field, message: '预留库存数必须为非负整数' });
      } else if (total && reserved > total) {
        errors.push({ field, message: '预留库存不能超过总库存' });
      }
    }

    if (field === 'reserveRatio') {
      const ratio = parseFloat(value);
      if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        errors.push({ field, message: '预留比例必须在0-100之间' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async createInventory(data, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const permissionCheck = this._checkInventoryPermission(data.inventoryType, 'create', operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const validation = this._validateInventoryData(data, false);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      const conflict = await this._checkInventoryConflict(data.flightId, data.cabinClass, data.inventoryType);
      if (conflict) {
        throw new Error('该航班舱位已存在相同类型的库存配置');
      }

      const flight = await Flight.findByPk(data.flightId);
      if (!flight) {
        throw new Error('航班不存在');
      }

      const typeConfig = this._getInventoryTypeConfig(data.inventoryType);

      const inventoryData = {
        ...data,
        flightNo: flight.flightNo,
        totalStock: parseInt(data.totalStock) || 0,
        occupiedStock: parseInt(data.occupiedStock) || 0,
        soldStock: parseInt(data.soldStock) || 0,
        reservedStock: parseInt(data.reservedStock) || 0,
        lockedStock: parseInt(data.lockedStock) || 0,
        lowStockThreshold: parseInt(data.lowStockThreshold) || typeConfig.defaultLowStockThreshold,
        soldOutThreshold: parseInt(data.soldOutThreshold) || typeConfig.defaultSoldOutThreshold,
        operatorId: operator.id || null,
        operatorName: operator.name || null
      };

      inventoryData.availableStock = this._calculateAvailableStock(inventoryData);
      inventoryData.inventoryStatus = this._getInventoryStatus(
        inventoryData.availableStock,
        inventoryData.lowStockThreshold,
        inventoryData.soldOutThreshold
      );

      const consistencyCheck = this._validateStockConsistency(inventoryData);
      if (!consistencyCheck.valid) {
        throw new Error(consistencyCheck.message);
      }

      const inventory = await FlightInventory.create(inventoryData, { transaction: t });

      await this._createInventoryLog(inventory.id, 1, null, inventoryData, {
        flightId: data.flightId,
        flightNo: flight.flightNo,
        cabinClass: data.cabinClass,
        inventoryType: data.inventoryType,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: data.remark || '创建库存配置',
        ip: operator.ip
      });

      await t.commit();
      return inventory;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateInventory(id, data, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction: t });
      if (!inventory) {
        throw new Error('库存配置不存在');
      }

      const permissionCheck = this._checkInventoryPermission(inventory.inventoryType, 'update', operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const beforeData = { ...inventory.toJSON() };

      const updateData = { ...data };
      if (data.totalStock !== undefined) updateData.totalStock = parseInt(data.totalStock);
      if (data.occupiedStock !== undefined) updateData.occupiedStock = parseInt(data.occupiedStock);
      if (data.soldStock !== undefined) updateData.soldStock = parseInt(data.soldStock);
      if (data.reservedStock !== undefined) updateData.reservedStock = parseInt(data.reservedStock);
      if (data.lockedStock !== undefined) updateData.lockedStock = parseInt(data.lockedStock);

      const mergedData = { ...beforeData, ...updateData };
      updateData.availableStock = this._calculateAvailableStock(mergedData);
      updateData.inventoryStatus = this._getInventoryStatus(
        updateData.availableStock,
        mergedData.lowStockThreshold,
        mergedData.soldOutThreshold
      );

      const consistencyCheck = this._validateStockConsistency({ ...beforeData, ...updateData });
      if (!consistencyCheck.valid) {
        throw new Error(consistencyCheck.message);
      }

      const changeFields = [];
      for (const key of Object.keys(updateData)) {
        if (beforeData[key] !== updateData[key]) {
          changeFields.push(key);
        }
      }

      await inventory.update(updateData, { transaction: t });

      const afterData = { ...beforeData, ...updateData };

      const changeQuantity = updateData.totalStock !== undefined ? (updateData.totalStock - beforeData.totalStock) : null;
      const changeDirection = changeQuantity !== null ? (changeQuantity > 0 ? 'increase' : 'decrease') : null;

      await this._createInventoryLog(id, 2, beforeData, afterData, {
        changeFields,
        changeQuantity,
        changeDirection,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: data.remark || '调整库存配置',
        ip: operator.ip
      });

      await t.commit();
      return inventory;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteInventory(id, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction: t });
      if (!inventory) {
        throw new Error('库存配置不存在');
      }

      if (inventory.occupiedStock > 0 || inventory.soldStock > 0) {
        throw new Error('存在已占用或已售出库存，无法删除');
      }

      const beforeData = { ...inventory.toJSON() };

      await inventory.destroy({ transaction: t });

      await this._createInventoryLog(id, 2, beforeData, null, {
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: '删除库存配置',
        status: 1,
        ip: operator.ip
      });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateActiveStatus(id, isActive, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction: t });
      if (!inventory) {
        throw new Error('库存配置不存在');
      }

      const beforeData = { ...inventory.toJSON() };

      await inventory.update({ isActive: isActive ? 1 : 0 }, { transaction: t });

      const afterData = { ...beforeData, isActive: isActive ? 1 : 0 };

      await this._createInventoryLog(id, 2, beforeData, afterData, {
        changeFields: ['isActive'],
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: isActive ? '启用库存配置' : '停用库存配置',
        ip: operator.ip
      });

      await t.commit();
      return inventory;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async lockInventory(id, lockReason, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction: t });
      if (!inventory) {
        throw new Error('库存配置不存在');
      }

      if (inventory.isLocked) {
        throw new Error('库存已处于锁定状态');
      }

      const beforeData = { ...inventory.toJSON() };

      const availableStock = this._calculateAvailableStock(inventory);
      const lockedStock = availableStock;

      await inventory.update({
        isLocked: 1,
        lockReason,
        lockTime: new Date(),
        lockedStock,
        availableStock: 0,
        inventoryStatus: 1
      }, { transaction: t });

      const afterData = { ...inventory.toJSON() };

      await this._createInventoryLog(id, 6, beforeData, afterData, {
        changeFields: ['isLocked', 'lockReason', 'lockTime', 'lockedStock', 'availableStock'],
        changeQuantity: lockedStock,
        changeDirection: 'decrease',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: lockReason || '锁定库存',
        ip: operator.ip
      });

      await t.commit();
      return inventory;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async unlockInventory(id, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction: t });
      if (!inventory) {
        throw new Error('库存配置不存在');
      }

      if (!inventory.isLocked) {
        throw new Error('库存未处于锁定状态');
      }

      const beforeData = { ...inventory.toJSON() };
      const unlockedStock = inventory.lockedStock;

      const newAvailable = this._calculateAvailableStock({
        ...beforeData,
        lockedStock: 0
      });

      const newStatus = this._getInventoryStatus(newAvailable, inventory.lowStockThreshold, inventory.soldOutThreshold);

      await inventory.update({
        isLocked: 0,
        lockedStock: 0,
        unlockTime: new Date(),
        availableStock: newAvailable,
        inventoryStatus: newStatus
      }, { transaction: t });

      const afterData = { ...inventory.toJSON() };

      await this._createInventoryLog(id, 7, beforeData, afterData, {
        changeFields: ['isLocked', 'unlockTime', 'lockedStock', 'availableStock', 'inventoryStatus'],
        changeQuantity: unlockedStock,
        changeDirection: 'increase',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        remark: '解锁库存',
        ip: operator.ip
      });

      await t.commit();
      return inventory;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async releaseExpiredReservations() {
    const t = await sequelize.transaction();

    try {
      const now = new Date();
      const expiredReservations = await FlightInventory.findAll({
        where: {
          inventoryType: 'reserved',
          reserveExpireTime: { [Op.lt]: now },
          reservedStock: { [Op.gt]: 0 },
          isActive: 1
        },
        transaction: t
      });

      const results = [];

      for (const inventory of expiredReservations) {
        const beforeData = { ...inventory.toJSON() };
        const releasedStock = inventory.reservedStock;

        const newAvailable = this._calculateAvailableStock({
          ...beforeData,
          reservedStock: 0
        });

        const newStatus = this._getInventoryStatus(newAvailable, inventory.lowStockThreshold, inventory.soldOutThreshold);

        await inventory.update({
          reservedStock: 0,
          reserveRatio: 0,
          availableStock: newAvailable,
          inventoryStatus: newStatus
        }, { transaction: t });

        const afterData = { ...inventory.toJSON() };

        await this._createInventoryLog(inventory.id, 9, beforeData, afterData, {
          changeFields: ['reservedStock', 'reserveRatio', 'availableStock', 'inventoryStatus'],
          changeQuantity: releasedStock,
          changeDirection: 'increase',
          remark: '预留库存到期自动释放',
          operatorName: '系统',
          operatorRole: 'system'
        });

        results.push({ inventoryId: inventory.id, releasedStock });
      }

      await t.commit();
      return { releasedCount: results.length, results };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchLockInventory(ids, lockReason, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const permissionCheck = this._checkInventoryPermission(null, 'batch_lock', operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const results = { success: 0, failed: 0, total: ids.length };

      for (const id of ids) {
        try {
          const inventory = await FlightInventory.findByPk(id, { transaction: t });
          if (!inventory || inventory.isLocked) {
            results.failed++;
            continue;
          }

          const beforeData = { ...inventory.toJSON() };
          const availableStock = this._calculateAvailableStock(inventory);

          await inventory.update({
            isLocked: 1,
            lockReason,
            lockTime: new Date(),
            lockedStock: availableStock,
            availableStock: 0,
            inventoryStatus: 1
          }, { transaction: t });

          const afterData = { ...inventory.toJSON() };

          await this._createInventoryLog(id, 6, beforeData, afterData, {
            changeFields: ['isLocked', 'lockReason', 'lockTime', 'lockedStock', 'availableStock'],
            isBatchOperation: true,
            affectedFlightCount: ids.length,
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            remark: lockReason || '批量锁定库存',
            ip: operator.ip
          });

          results.success++;
        } catch (e) {
          results.failed++;
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchUnlockInventory(ids, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const permissionCheck = this._checkInventoryPermission(null, 'batch_lock', operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const results = { success: 0, failed: 0, total: ids.length };

      for (const id of ids) {
        try {
          const inventory = await FlightInventory.findByPk(id, { transaction: t });
          if (!inventory || !inventory.isLocked) {
            results.failed++;
            continue;
          }

          const beforeData = { ...inventory.toJSON() };
          const unlockedStock = inventory.lockedStock;

          const newAvailable = this._calculateAvailableStock({
            ...beforeData,
            lockedStock: 0
          });

          const newStatus = this._getInventoryStatus(newAvailable, inventory.lowStockThreshold, inventory.soldOutThreshold);

          await inventory.update({
            isLocked: 0,
            lockedStock: 0,
            unlockTime: new Date(),
            availableStock: newAvailable,
            inventoryStatus: newStatus
          }, { transaction: t });

          const afterData = { ...inventory.toJSON() };

          await this._createInventoryLog(id, 7, beforeData, afterData, {
            changeFields: ['isLocked', 'unlockTime', 'lockedStock', 'availableStock', 'inventoryStatus'],
            isBatchOperation: true,
            affectedFlightCount: ids.length,
            changeQuantity: unlockedStock,
            changeDirection: 'increase',
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            remark: '批量解锁库存',
            ip: operator.ip
          });

          results.success++;
        } catch (e) {
          results.failed++;
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchReleaseExpiredReservations(ids, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const results = { success: 0, failed: 0, total: ids.length };

      for (const id of ids) {
        try {
          const inventory = await FlightInventory.findByPk(id, { transaction: t });
          if (!inventory || inventory.reservedStock <= 0) {
            results.failed++;
            continue;
          }

          const beforeData = { ...inventory.toJSON() };
          const releasedStock = inventory.reservedStock;

          const newAvailable = this._calculateAvailableStock({
            ...beforeData,
            reservedStock: 0
          });

          const newStatus = this._getInventoryStatus(newAvailable, inventory.lowStockThreshold, inventory.soldOutThreshold);

          await inventory.update({
            reservedStock: 0,
            reserveRatio: 0,
            availableStock: newAvailable,
            inventoryStatus: newStatus
          }, { transaction: t });

          const afterData = { ...inventory.toJSON() };

          await this._createInventoryLog(id, 9, beforeData, afterData, {
            changeFields: ['reservedStock', 'reserveRatio', 'availableStock', 'inventoryStatus'],
            isBatchOperation: true,
            affectedFlightCount: ids.length,
            changeQuantity: releasedStock,
            changeDirection: 'increase',
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            remark: '批量释放过期预留库存',
            ip: operator.ip
          });

          results.success++;
        } catch (e) {
          results.failed++;
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchSupplementInventory(ids, supplementQuantity, supplementSource, supplementRemark, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const permissionCheck = this._checkInventoryPermission(null, 'supplement', operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      if (!supplementQuantity || supplementQuantity <= 0) {
        throw new Error('补录数量必须为正整数');
      }

      const results = { success: 0, failed: 0, total: ids.length };

      for (const id of ids) {
        try {
          const inventory = await FlightInventory.findByPk(id, { transaction: t });
          if (!inventory) {
            results.failed++;
            continue;
          }

          const beforeData = { ...inventory.toJSON() };
          const newTotal = (beforeData.totalStock || 0) + supplementQuantity;
          const newAvailable = this._calculateAvailableStock({
            ...beforeData,
            totalStock: newTotal
          });

          const newStatus = this._getInventoryStatus(newAvailable, inventory.lowStockThreshold, inventory.soldOutThreshold);

          await inventory.update({
            totalStock: newTotal,
            availableStock: newAvailable,
            inventoryStatus: newStatus,
            supplementSource,
            supplementRemark
          }, { transaction: t });

          const afterData = { ...inventory.toJSON() };

          await this._createInventoryLog(id, 10, beforeData, afterData, {
            changeFields: ['totalStock', 'availableStock', 'inventoryStatus', 'supplementSource', 'supplementRemark'],
            isBatchOperation: true,
            affectedFlightCount: ids.length,
            changeQuantity: supplementQuantity,
            changeDirection: 'increase',
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            remark: supplementRemark || `批量补录库存${supplementQuantity}张，来源：${supplementSource}`,
            ip: operator.ip
          });

          results.success++;
        } catch (e) {
          results.failed++;
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async batchUpdateActiveStatus(ids, isActive, operator = {}) {
    const t = await sequelize.transaction();

    try {
      const results = { success: 0, failed: 0, total: ids.length };

      for (const id of ids) {
        try {
          const inventory = await FlightInventory.findByPk(id, { transaction: t });
          if (!inventory) {
            results.failed++;
            continue;
          }

          const beforeData = { ...inventory.toJSON() };

          await inventory.update({ isActive: isActive ? 1 : 0 }, { transaction: t });

          const afterData = { ...inventory.toJSON() };

          await this._createInventoryLog(id, 2, beforeData, afterData, {
            changeFields: ['isActive'],
            isBatchOperation: true,
            affectedFlightCount: ids.length,
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.role,
            remark: isActive ? '批量启用库存' : '批量停用库存',
            ip: operator.ip
          });

          results.success++;
        } catch (e) {
          results.failed++;
        }
      }

      await t.commit();
      return results;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getInventoryLogs(params = {}) {
    const { page = 1, pageSize = 10, inventoryId, flightId, flightNo, cabinClass, operationType, operationCategory, operatorId, startTime, endTime } = params;

    const where = {};
    if (inventoryId) where.inventoryId = inventoryId;
    if (flightId) where.flightId = flightId;
    if (flightNo) where.flightNo = { [Op.like]: `%${flightNo}%` };
    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (operationType && operationType !== 'all') where.operationType = Number(operationType);
    if (operationCategory && operationCategory !== 'all') where.operationCategory = operationCategory;
    if (operatorId) where.operatorId = operatorId;
    if (startTime) where.createdAt = { [Op.gte]: startTime };
    if (endTime) where.createdAt = { ...where.createdAt, [Op.lte]: endTime };

    const offset = (page - 1) * pageSize;

    const { count, rows } = await FlightInventoryLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return { items: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getInventoryStats(params = {}) {
    const { cabinClass, inventoryType, isActive } = params;

    const where = {};
    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (inventoryType && inventoryType !== 'all') where.inventoryType = inventoryType;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = Number(isActive);

    const inventories = await FlightInventory.findAll({ where });

    let totalStock = 0;
    let occupiedStock = 0;
    let soldStock = 0;
    let reservedStock = 0;
    let lockedStock = 0;
    let availableStock = 0;
    let configCount = 0;
    let lowStockCount = 0;
    let soldOutCount = 0;

    const byCabinClass = {};
    const byInventoryType = {};

    for (const inv of inventories) {
      configCount++;
      totalStock += inv.totalStock || 0;
      occupiedStock += inv.occupiedStock || 0;
      soldStock += inv.soldStock || 0;
      reservedStock += inv.reservedStock || 0;
      lockedStock += inv.lockedStock || 0;
      availableStock += inv.availableStock || 0;

      if (inv.inventoryStatus === 2 || inv.inventoryStatus === 3) {
        lowStockCount++;
      }
      if (inv.inventoryStatus === 4) {
        soldOutCount++;
      }

      if (!byCabinClass[inv.cabinClass]) {
        byCabinClass[inv.cabinClass] = { count: 0, totalStock: 0, availableStock: 0 };
      }
      byCabinClass[inv.cabinClass].count++;
      byCabinClass[inv.cabinClass].totalStock += inv.totalStock || 0;
      byCabinClass[inv.cabinClass].availableStock += inv.availableStock || 0;

      if (!byInventoryType[inv.inventoryType]) {
        byInventoryType[inv.inventoryType] = { count: 0, totalStock: 0, availableStock: 0 };
      }
      byInventoryType[inv.inventoryType].count++;
      byInventoryType[inv.inventoryType].totalStock += inv.totalStock || 0;
      byInventoryType[inv.inventoryType].availableStock += inv.availableStock || 0;
    }

    return {
      configCount,
      totalStock,
      occupiedStock,
      soldStock,
      reservedStock,
      lockedStock,
      availableStock,
      lowStockCount,
      soldOutCount,
      sellThroughRate: totalStock > 0 ? ((soldStock / totalStock) * 100).toFixed(2) : '0.00',
      byCabinClass,
      byInventoryType
    };
  }

  async checkLowStockWarning() {
    const lowStockItems = await FlightInventory.findAll({
      where: {
        [Op.or]: [
          { inventoryStatus: 2 },
          { inventoryStatus: 3 },
          { inventoryStatus: 4 }
        ],
        isActive: 1
      },
      include: [{ model: Flight, as: 'flight' }]
    });

    return lowStockItems;
  }
}

module.exports = new FlightInventoryService();
