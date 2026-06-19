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
      fixed: { name: '固定库存', minStock: 0, maxStock: 500, defaultTotal: 100, color: '#1890ff' },
      dynamic: { name: '动态库存', minStock: 0, maxStock: 1000, defaultTotal: 200, color: '#52c41a' },
      reserved: { name: '预留库存', minStock: 0, maxStock: 200, defaultTotal: 50, color: '#faad14' },
      supplement: { name: '补录库存', minStock: 0, maxStock: 300, defaultTotal: 100, color: '#722ed1' }
    };

    this.cabinClassStockLimits = {
      economy: { minStock: 0, maxStock: 300, defaultMinWarning: 10 },
      business: { minStock: 0, maxStock: 100, defaultMinWarning: 5 },
      first: { minStock: 0, maxStock: 50, defaultMinWarning: 2 },
      special: { minStock: 0, maxStock: 200, defaultMinWarning: 8 }
    };

    this.operationTypeMap = {
      1: '创建库存',
      2: '库存调整',
      3: '库存占用',
      4: '库存释放',
      5: '库存锁定',
      6: '库存解锁',
      7: '预留库存',
      8: '释放预留',
      9: '库存补录',
      10: '批量操作',
      11: '状态变更',
      12: '删除库存'
    };
  }

  _getInventoryTypeConfig(inventoryType) {
    return this.inventoryTypeConfig[inventoryType] || this.inventoryTypeConfig.fixed;
  }

  _getCabinStockLimit(cabinClass) {
    return this.cabinClassStockLimits[cabinClass] || this.cabinClassStockLimits.economy;
  }

  _checkInventoryPermission(inventoryType, cabinClass, userRoles) {
    if (inventoryType === 'reserved' || cabinClass === 'special') {
      if (!userRoles.includes('admin') && !userRoles.includes('inventory_manager')) {
        return { valid: false, message: '无权限操作该类型库存，请联系库存管理员' };
      }
    }
    return { valid: true };
  }

  _checkBatchHolidayPermission(userRoles) {
    if (!userRoles.includes('admin') && !userRoles.includes('inventory_manager') && !userRoles.includes('holiday_operator')) {
      return { valid: false, message: '节假日库存批量调整需要专项权限，请联系管理员' };
    }
    return { valid: true };
  }

  _validateInventoryData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate && !data.flightId) {
      errors.push({ field: 'flightId', message: '请选择航班' });
    }

    if (!isUpdate && !data.cabinClass) {
      errors.push({ field: 'cabinClass', message: '请选择舱位类型' });
    }

    if (!isUpdate && !data.inventoryType) {
      errors.push({ field: 'inventoryType', message: '请选择库存类型' });
    }

    if (!this.inventoryTypeConfig[data.inventoryType]) {
      errors.push({ field: 'inventoryType', message: '无效的库存类型' });
    }

    const cabinLimit = this._getCabinStockLimit(data.cabinClass);
    const typeConfig = this._getInventoryTypeConfig(data.inventoryType);
    const maxStock = Math.min(cabinLimit.maxStock, typeConfig.maxStock);

    if (data.totalStock !== undefined && data.totalStock !== null) {
      const totalStock = parseInt(data.totalStock);
      if (isNaN(totalStock) || totalStock < 0) {
        errors.push({ field: 'totalStock', message: '总库存必须为非负整数' });
      } else if (totalStock > maxStock) {
        errors.push({ field: 'totalStock', message: `总库存不能超过${maxStock}张` });
      }
    }

    if (data.reservedStock !== undefined && data.reservedStock !== null) {
      const reservedStock = parseInt(data.reservedStock);
      const totalStock = parseInt(data.totalStock || 0);
      if (isNaN(reservedStock) || reservedStock < 0) {
        errors.push({ field: 'reservedStock', message: '预留库存必须为非负整数' });
      } else if (totalStock > 0 && reservedStock > totalStock * 0.5) {
        errors.push({ field: 'reservedStock', message: '预留库存不能超过总库存的50%' });
      }
    }

    if (data.reservedRatio !== undefined && data.reservedRatio !== null) {
      const ratio = parseFloat(data.reservedRatio);
      if (isNaN(ratio) || ratio < 0 || ratio > 50) {
        errors.push({ field: 'reservedRatio', message: '预留比例必须在0%-50%之间' });
      }
    }

    if (data.minStockWarning !== undefined && data.minStockWarning !== null) {
      const warning = parseInt(data.minStockWarning);
      if (isNaN(warning) || warning < 0) {
        errors.push({ field: 'minStockWarning', message: '库存预警值必须为非负整数' });
      }
    }

    if (data.lockedStock !== undefined && data.lockedStock !== null) {
      const locked = parseInt(data.lockedStock);
      const total = parseInt(data.totalStock || 0);
      if (isNaN(locked) || locked < 0) {
        errors.push({ field: 'lockedStock', message: '锁定库存必须为非负整数' });
      } else if (data.soldStock !== undefined) {
        const sold = parseInt(data.soldStock || 0);
        const reserved = parseInt(data.reservedStock || 0);
        if (locked + sold + reserved > total) {
          errors.push({ field: 'lockedStock', message: '锁定库存不能超过可分配库存' });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  _calculateAvailableStock(totalStock, soldStock, reservedStock, lockedStock) {
    total = parseInt(totalStock || 0);
    sold = parseInt(soldStock || 0);
    reserved = parseInt(reservedStock || 0);
    locked = parseInt(lockedStock || 0);
    const available = total - sold - reserved - locked;
    return Math.max(0, available);
  }

  _calculateStatus(availableStock, minStockWarning) {
    available = parseInt(availableStock || 0);
    warning = parseInt(minStockWarning || 10);
    if (available <= 0) return 3;
    if (available <= warning) return 2;
    return 1;
  }

  async _checkInventoryDuplicate(flightId, cabinClass, inventoryType, excludeId = null) {
    const where = { flightId, cabinClass, inventoryType };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await FlightInventory.findOne({ where });
    return existing !== null;
  }

  _createLog(inventory, operationType, data = {}) {
    return FlightInventoryLog.create({
      inventoryId: inventory.id,
      flightId: inventory.flightId,
      flightNo: inventory.flightNo,
      cabinClass: inventory.cabinClass,
      inventoryType: inventory.inventoryType,
      operationType,
      operationName: this.operationTypeMap[operationType] || '未知操作',
      beforeTotalStock: data.beforeTotalStock,
      afterTotalStock: data.afterTotalStock !== undefined ? data.afterTotalStock : inventory.totalStock,
      beforeSoldStock: data.beforeSoldStock,
      afterSoldStock: data.afterSoldStock !== undefined ? data.afterSoldStock : inventory.soldStock,
      beforeReservedStock: data.beforeReservedStock,
      afterReservedStock: data.afterReservedStock !== undefined ? data.afterReservedStock : inventory.reservedStock,
      beforeLockedStock: data.beforeLockedStock,
      afterLockedStock: data.afterLockedStock !== undefined ? data.afterLockedStock : inventory.lockedStock,
      beforeAvailableStock: data.beforeAvailableStock,
      afterAvailableStock: data.afterAvailableStock !== undefined ? data.afterAvailableStock : inventory.availableStock,
      changeQuantity: data.changeQuantity || 0,
      changeType: data.changeType || 'unchanged',
      changeFields: data.changeFields || null,
      relatedOrderId: data.relatedOrderId || null,
      relatedOrderNo: data.relatedOrderNo || null,
      effectScope: data.effectScope || 'single',
      affectedInventoryCount: data.affectedInventoryCount || 1,
      operationReason: data.operationReason || '',
      operationRemark: data.operationRemark || '',
      operatorId: data.operatorId || null,
      operatorName: data.operatorName || '',
      operatorRole: data.operatorRole || '',
      operationIp: data.operationIp || '',
      operationStatus: data.operationStatus !== undefined ? data.operationStatus : 1,
      failReason: data.failReason || ''
    });
  }

  async _notifyStockChange(inventory, changeType, changeQuantity) {
    try {
      const users = await this._getAffectedUsers(inventory.flightId);
      if (users.length === 0) return;

      const notifications = users.map(userId => ({
        userId,
        type: 'stock',
        title: `航班${inventory.flightNo}库存变动提醒`,
        content: `${this._getCabinName(inventory.cabinClass)}库存${changeType === 'increase' ? '增加' : '减少'}${Math.abs(changeQuantity)}张`,
        relatedId: inventory.flightId,
        relatedType: 'flight'
      }));

      await Notification.bulkCreate(notifications);
    } catch (err) {
      console.error('发送库存变动通知失败:', err);
    }
  }

  async _getAffectedUsers(flightId) {
    const orders = await Order.findAll({
      where: { flightId, status: { [Op.in]: [0, 1] } },
      attributes: ['userId']
    });
    return [...new Set(orders.map(o => o.userId))];
  }

  _getCabinName(cabinClass) {
    const map = { economy: '经济舱', business: '商务舱', first: '头等舱', special: '特惠舱' };
    return map[cabinClass] || cabinClass;
  }

  async getInventoryList(params = {}) {
    const { page = 1, pageSize = 10, flightNo, cabinClass, inventoryType, status, flightId } = params;
    const where = {};

    if (flightNo) where.flightNo = { [Op.like]: `%${flightNo}%` };
    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (inventoryType) where.inventoryType = inventoryType;
    if (status !== undefined && status !== null) where.status = status;
    if (flightId) where.flightId = flightId;

    const { count, rows } = await FlightInventory.findAndCountAll({
      where,
      include: [{ model: Flight, as: 'flight', attributes: ['id', 'flightNo', 'departureAirportCode', 'arrivalAirportCode', 'departureTime', 'arrivalTime'] }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  async getInventoryById(id) {
    return await FlightInventory.findByPk(id, {
      include: [{ model: Flight, as: 'flight', attributes: ['id', 'flightNo', 'departureAirportCode', 'arrivalAirportCode'] }]
    });
  }

  async validateInventory(data, userRoles = []) {
    const permissionCheck = this._checkInventoryPermission(data.inventoryType, data.cabinClass, userRoles);
    if (!permissionCheck.valid) {
      return { valid: false, errors: [{ field: 'permission', message: permissionCheck.message }] };
    }

    const validation = this._validateInventoryData(data);
    if (!validation.valid) {
      return validation;
    }

    if (data.flightId && data.cabinClass && data.inventoryType) {
      const isDuplicate = await this._checkInventoryDuplicate(data.flightId, data.cabinClass, data.inventoryType);
      if (isDuplicate) {
        return { valid: false, errors: [{ field: 'inventoryType', message: '该航班该舱位此类型库存已存在' }] };
      }
    }

    return { valid: true };
  }

  async validateField(field, value, data = {}, userRoles = []) {
    const errors = [];

    switch (field) {
      case 'totalStock':
        const cabinLimit = this._getCabinStockLimit(data.cabinClass);
        const typeConfig = this._getInventoryTypeConfig(data.inventoryType);
        const maxStock = Math.min(cabinLimit.maxStock, typeConfig.maxStock);
        const stock = parseInt(value);
        if (isNaN(stock) || stock < 0) {
          errors.push('总库存必须为非负整数');
        } else if (stock > maxStock) {
          errors.push(`总库存不能超过${maxStock}张`);
        }
        break;
      case 'reservedStock':
        const reserved = parseInt(value);
        const total = parseInt(data.totalStock || 0);
        if (isNaN(reserved) || reserved < 0) {
          errors.push('预留库存必须为非负整数');
        } else if (total > 0 && reserved > total * 0.5) {
          errors.push('预留库存不能超过总库存的50%');
        }
        break;
      case 'reservedRatio':
        const ratio = parseFloat(value);
        if (isNaN(ratio) || ratio < 0 || ratio > 50) {
          errors.push('预留比例必须在0%-50%之间');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  async createInventory(data, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const permissionCheck = this._checkInventoryPermission(data.inventoryType, data.cabinClass, operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const validation = this._validateInventoryData(data);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      const isDuplicate = await this._checkInventoryDuplicate(data.flightId, data.cabinClass, data.inventoryType);
      if (isDuplicate) {
        throw new Error('该航班该舱位此类型库存已存在');
      }

      const flight = await Flight.findByPk(data.flightId);
      if (!flight) {
        throw new Error('航班不存在');
      }

      const totalStock = parseInt(data.totalStock || 0);
      const soldStock = parseInt(data.soldStock || 0);
      const reservedStock = parseInt(data.reservedStock || 0);
      const lockedStock = parseInt(data.lockedStock || 0);
      const availableStock = this._calculateAvailableStock(totalStock, soldStock, reservedStock, lockedStock);
      const status = this._calculateStatus(availableStock, data.minStockWarning);

      const inventory = await FlightInventory.create({
        flightId: data.flightId,
        flightNo: flight.flightNo,
        cabinClass: data.cabinClass,
        inventoryType: data.inventoryType,
        totalStock,
        soldStock,
        reservedStock,
        lockedStock,
        availableStock,
        reservedRatio: data.reservedRatio || 0,
        minStockWarning: data.minStockWarning || this._getCabinStockLimit(data.cabinClass).defaultMinWarning,
        maxStockLimit: data.maxStockLimit || this.cabinClassStockLimits[data.cabinClass]?.maxStock || 500,
        reserveExpireTime: data.reserveExpireTime || null,
        isAutoRelease: data.isAutoRelease !== undefined ? data.isAutoRelease : 1,
        status,
        inventorySource: data.inventorySource || 'manual',
        remark: data.remark || '',
        operatorId: operator.id || null,
        operatorName: operator.name || ''
      }, { transaction });

      await this._createLog(inventory, 1, {
        beforeTotalStock: 0,
        beforeSoldStock: 0,
        beforeReservedStock: 0,
        beforeLockedStock: 0,
        beforeAvailableStock: 0,
        afterTotalStock: totalStock,
        afterSoldStock: soldStock,
        afterReservedStock: reservedStock,
        afterLockedStock: lockedStock,
        afterAvailableStock: availableStock,
        changeQuantity: totalStock,
        changeType: 'increase',
        operationReason: '创建库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      await transaction.commit();
      return inventory;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateInventory(id, data, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      const permissionCheck = this._checkInventoryPermission(inventory.inventoryType, inventory.cabinClass, operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      const beforeData = { ...inventory.get() };

      const updateData = {};
      const changeFields = [];

      if (data.totalStock !== undefined) {
        const newTotal = parseInt(data.totalStock);
        const oldTotal = parseInt(inventory.totalStock);
        if (newTotal < inventory.soldStock + inventory.reservedStock + inventory.lockedStock) {
          throw new Error('调整后的总库存不能小于已占用+预留+锁定库存');
        }
        updateData.totalStock = newTotal;
        changeFields.push('totalStock');
      }

      if (data.reservedStock !== undefined) {
        updateData.reservedStock = parseInt(data.reservedStock);
        changeFields.push('reservedStock');
      }

      if (data.reservedRatio !== undefined) {
        updateData.reservedRatio = parseFloat(data.reservedRatio);
        changeFields.push('reservedRatio');
      }

      if (data.minStockWarning !== undefined) {
        updateData.minStockWarning = parseInt(data.minStockWarning);
        changeFields.push('minStockWarning');
      }

      if (data.reserveExpireTime !== undefined) {
        updateData.reserveExpireTime = data.reserveExpireTime;
        changeFields.push('reserveExpireTime');
      }

      if (data.isAutoRelease !== undefined) {
        updateData.isAutoRelease = data.isAutoRelease;
        changeFields.push('isAutoRelease');
      }

      if (data.remark !== undefined) {
        updateData.remark = data.remark;
        changeFields.push('remark');
      }

      if (changeFields.length === 0) {
        return inventory;
      }

      const totalStock = updateData.totalStock !== undefined ? updateData.totalStock : inventory.totalStock;
      const reservedStock = updateData.reservedStock !== undefined ? updateData.reservedStock : inventory.reservedStock;
      const availableStock = this._calculateAvailableStock(totalStock, inventory.soldStock, reservedStock, inventory.lockedStock);
      const minWarning = updateData.minStockWarning !== undefined ? updateData.minStockWarning : inventory.minStockWarning;
      const status = this._calculateStatus(availableStock, minWarning);

      updateData.availableStock = availableStock;
      updateData.status = status;
      updateData.operatorId = operator.id || null;
      updateData.operatorName = operator.name || '';

      await inventory.update(updateData, { transaction });

      const changeQuantity = (updateData.totalStock !== undefined ? updateData.totalStock : inventory.totalStock) - beforeData.totalStock;
      const changeType = changeQuantity > 0 ? 'increase' : (changeQuantity < 0 ? 'decrease' : 'unchanged');

      await this._createLog(inventory, 2, {
        beforeTotalStock: beforeData.totalStock,
        beforeSoldStock: beforeData.soldStock,
        beforeReservedStock: beforeData.reservedStock,
        beforeLockedStock: beforeData.lockedStock,
        beforeAvailableStock: beforeData.availableStock,
        afterTotalStock: inventory.totalStock,
        afterSoldStock: inventory.soldStock,
        afterReservedStock: inventory.reservedStock,
        afterLockedStock: inventory.lockedStock,
        afterAvailableStock: inventory.availableStock,
        changeQuantity,
        changeType,
        changeFields,
        operationReason: data.operationReason || '调整库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      if (changeType !== 'unchanged') {
        this._notifyStockChange(inventory, changeType, changeQuantity);
      }

      await transaction.commit();
      return inventory;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async deleteInventory(id, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      if (inventory.soldStock > 0) {
        throw new Error('存在已售库存，无法删除');
      }

      const permissionCheck = this._checkInventoryPermission(inventory.inventoryType, inventory.cabinClass, operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }

      await this._createLog(inventory, 12, {
        beforeTotalStock: inventory.totalStock,
        beforeSoldStock: inventory.soldStock,
        beforeReservedStock: inventory.reservedStock,
        beforeLockedStock: inventory.lockedStock,
        beforeAvailableStock: inventory.availableStock,
        afterTotalStock: 0,
        afterSoldStock: 0,
        afterReservedStock: 0,
        afterLockedStock: 0,
        afterAvailableStock: 0,
        changeQuantity: -inventory.totalStock,
        changeType: 'decrease',
        operationReason: '删除库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      await inventory.destroy({ transaction });
      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async lockStock(id, lockQuantity, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      lockQuantity = parseInt(lockQuantity);
      if (lockQuantity <= 0) {
        throw new Error('锁定数量必须大于0');
      }

      if (lockQuantity > inventory.availableStock) {
        throw new Error(`可锁定库存不足，当前可售库存: ${inventory.availableStock}`);
      }

      const beforeData = { ...inventory.get() };

      const newLockedStock = inventory.lockedStock + lockQuantity;
      const newAvailableStock = inventory.availableStock - lockQuantity;
      const status = this._calculateStatus(newAvailableStock, inventory.minStockWarning);

      await inventory.update({
        lockedStock: newLockedStock,
        availableStock: newAvailableStock,
        status,
        operatorId: operator.id || null,
        operatorName: operator.name || ''
      }, { transaction });

      await this._createLog(inventory, 5, {
        beforeTotalStock: beforeData.totalStock,
        beforeSoldStock: beforeData.soldStock,
        beforeReservedStock: beforeData.reservedStock,
        beforeLockedStock: beforeData.lockedStock,
        beforeAvailableStock: beforeData.availableStock,
        afterTotalStock: inventory.totalStock,
        afterSoldStock: inventory.soldStock,
        afterReservedStock: inventory.reservedStock,
        afterLockedStock: inventory.lockedStock,
        afterAvailableStock: inventory.availableStock,
        changeQuantity: -lockQuantity,
        changeType: 'decrease',
        operationReason: '锁定库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      await transaction.commit();
      return inventory;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async unlockStock(id, unlockQuantity, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      unlockQuantity = parseInt(unlockQuantity);
      if (unlockQuantity <= 0) {
        throw new Error('解锁数量必须大于0');
      }

      if (unlockQuantity > inventory.lockedStock) {
        throw new Error(`解锁数量不能超过锁定库存，当前锁定: ${inventory.lockedStock}`);
      }

      const beforeData = { ...inventory.get() };

      const newLockedStock = inventory.lockedStock - unlockQuantity;
      const newAvailableStock = inventory.availableStock + unlockQuantity;
      const status = this._calculateStatus(newAvailableStock, inventory.minStockWarning);

      await inventory.update({
        lockedStock: newLockedStock,
        availableStock: newAvailableStock,
        status,
        operatorId: operator.id || null,
        operatorName: operator.name || ''
      }, { transaction });

      await this._createLog(inventory, 6, {
        beforeTotalStock: beforeData.totalStock,
        beforeSoldStock: beforeData.soldStock,
        beforeReservedStock: beforeData.reservedStock,
        beforeLockedStock: beforeData.lockedStock,
        beforeAvailableStock: beforeData.availableStock,
        afterTotalStock: inventory.totalStock,
        afterSoldStock: inventory.soldStock,
        afterReservedStock: inventory.reservedStock,
        afterLockedStock: inventory.lockedStock,
        afterAvailableStock: inventory.availableStock,
        changeQuantity: unlockQuantity,
        changeType: 'increase',
        operationReason: '解锁库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      this._notifyStockChange(inventory, 'increase', unlockQuantity);

      await transaction.commit();
      return inventory;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async releaseExpiredReservations() {
    const now = new Date();
    const expiredInventories = await FlightInventory.findAll({
      where: {
        inventoryType: 'reserved',
        isAutoRelease: 1,
        reserveExpireTime: { [Op.lte]: now },
        reservedStock: { [Op.gt]: 0 }
      }
    });

    const results = [];
    for (const inventory of expiredInventories) {
      try {
        const result = await this.releaseReservation(inventory.id, inventory.reservedStock, {
          name: 'system',
          role: 'system'
        });
        results.push(result);
      } catch (err) {
        console.error(`释放过期预留库存失败 ${inventory.id}:`, err);
      }
    }

    return results;
  }

  async releaseReservation(id, releaseQuantity, operator = {}) {
    const transaction = await sequelize.transaction();

    try {
      const inventory = await FlightInventory.findByPk(id, { transaction });
      if (!inventory) {
        throw new Error('库存记录不存在');
      }

      releaseQuantity = parseInt(releaseQuantity);
      if (releaseQuantity <= 0) {
        throw new Error('释放数量必须大于0');
      }

      if (releaseQuantity > inventory.reservedStock) {
        throw new Error(`释放数量不能超过预留库存，当前预留: ${inventory.reservedStock}`);
      }

      const beforeData = { ...inventory.get() };

      const newReservedStock = inventory.reservedStock - releaseQuantity;
      const newAvailableStock = inventory.availableStock + releaseQuantity;
      const status = this._calculateStatus(newAvailableStock, inventory.minStockWarning);

      await inventory.update({
        reservedStock: newReservedStock,
        availableStock: newAvailableStock,
        status,
        operatorId: operator.id || null,
        operatorName: operator.name || ''
      }, { transaction });

      await this._createLog(inventory, 8, {
        beforeTotalStock: beforeData.totalStock,
        beforeSoldStock: beforeData.soldStock,
        beforeReservedStock: beforeData.reservedStock,
        beforeLockedStock: beforeData.lockedStock,
        beforeAvailableStock: beforeData.availableStock,
        afterTotalStock: inventory.totalStock,
        afterSoldStock: inventory.soldStock,
        afterReservedStock: inventory.reservedStock,
        afterLockedStock: inventory.lockedStock,
        afterAvailableStock: inventory.availableStock,
        changeQuantity: releaseQuantity,
        changeType: 'increase',
        operationReason: operator.name === 'system' ? '预留库存到期自动释放' : '手动释放预留库存',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        operationIp: operator.ip
      });

      if (operator.name !== 'system') {
        this._notifyStockChange(inventory, 'increase', releaseQuantity);
      }

      await transaction.commit();
      return inventory;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async batchLockInventories(ids, lockQuantity, operator = {}) {
    const results = { success: 0, failed: 0, items: [] };

    for (const id of ids) {
      try {
        const inventory = await this.lockStock(id, lockQuantity, operator);
        results.success++;
        results.items.push({ id, success: true, inventory });
      } catch (err) {
        results.failed++;
        results.items.push({ id, success: false, error: err.message });
      }
    }

    return results;
  }

  async batchUnlockInventories(ids, unlockQuantity, operator = {}) {
    const results = { success: 0, failed: 0, items: [] };

    for (const id of ids) {
      try {
        const inventory = await this.unlockStock(id, unlockQuantity, operator);
        results.success++;
        results.items.push({ id, success: true, inventory });
      } catch (err) {
        results.failed++;
        results.items.push({ id, success: false, error: err.message });
      }
    }

    return results;
  }

  async batchSupplementInventories(ids, supplementQuantity, operator = {}, isHolidayBatch = false) {
    if (isHolidayBatch) {
      const permissionCheck = this._checkBatchHolidayPermission(operator.roles || []);
      if (!permissionCheck.valid) {
        throw new Error(permissionCheck.message);
      }
    }

    const results = { success: 0, failed: 0, items: [] };

    for (const id of ids) {
      try {
        const inventory = await FlightInventory.findByPk(id);
        if (!inventory) continue;

        const newTotal = inventory.totalStock + parseInt(supplementQuantity);
        const result = await this.updateInventory(id, {
          totalStock: newTotal,
          operationReason: isHolidayBatch ? '节假日库存补录' : '批量补录库存'
        }, operator);

        results.success++;
        results.items.push({ id, success: true, inventory: result });
      } catch (err) {
        results.failed++;
        results.items.push({ id, success: false, error: err.message });
      }
    }

    return results;
  }

  async batchReleaseExpiredReservations(operator = {}) {
    const now = new Date();
    const expiredInventories = await FlightInventory.findAll({
      where: {
        inventoryType: 'reserved',
        isAutoRelease: 1,
        reserveExpireTime: { [Op.lte]: now },
        reservedStock: { [Op.gt]: 0 }
      }
    });

    const ids = expiredInventories.map(i => i.id);
    const results = { success: 0, failed: 0, total: ids.length };

    for (const inventory of expiredInventories) {
      try {
        await this.releaseReservation(inventory.id, inventory.reservedStock, operator);
        results.success++;
      } catch (err) {
        results.failed++;
      }
    }

    return results;
  }

  async getInventoryLogs(params = {}) {
    const { page = 1, pageSize = 10, inventoryId, flightId, operationType, cabinClass, inventoryType, startDate, endDate } = params;
    const where = {};

    if (inventoryId) where.inventoryId = inventoryId;
    if (flightId) where.flightId = flightId;
    if (operationType) where.operationType = operationType;
    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (inventoryType && inventoryType !== 'all') where.inventoryType = inventoryType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate + ' 23:59:59');
    }

    const { count, rows } = await FlightInventoryLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return { items: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  async getInventoryStats(params = {}) {
    const { cabinClass, inventoryType } = params;
    const where = {};

    if (cabinClass && cabinClass !== 'all') where.cabinClass = cabinClass;
    if (inventoryType) where.inventoryType = inventoryType;

    const inventories = await FlightInventory.findAll({ where });

    const stats = {
      total: inventories.length,
      totalStock: 0,
      soldStock: 0,
      reservedStock: 0,
      lockedStock: 0,
      availableStock: 0,
      warningCount: 0,
      soldOutCount: 0,
      byCabinClass: {},
      byType: {}
    };

    for (const inv of inventories) {
      stats.totalStock += parseInt(inv.totalStock);
      stats.soldStock += parseInt(inv.soldStock);
      stats.reservedStock += parseInt(inv.reservedStock);
      stats.lockedStock += parseInt(inv.lockedStock);
      stats.availableStock += parseInt(inv.availableStock);

      if (inv.status === 2) stats.warningCount++;
      if (inv.status === 3) stats.soldOutCount++;

      if (!stats.byCabinClass[inv.cabinClass]) {
        stats.byCabinClass[inv.cabinClass] = { count: 0, totalStock: 0, availableStock: 0 };
      }
      stats.byCabinClass[inv.cabinClass].count++;
      stats.byCabinClass[inv.cabinClass].totalStock += parseInt(inv.totalStock);
      stats.byCabinClass[inv.cabinClass].availableStock += parseInt(inv.availableStock);

      if (!stats.byType[inv.inventoryType]) {
        stats.byType[inv.inventoryType] = { count: 0, totalStock: 0, availableStock: 0 };
      }
      stats.byType[inv.inventoryType].count++;
      stats.byType[inv.inventoryType].totalStock += parseInt(inv.totalStock);
      stats.byType[inv.inventoryType].availableStock += parseInt(inv.availableStock);
    }

    return stats;
  }
}

module.exports = new FlightInventoryService();
