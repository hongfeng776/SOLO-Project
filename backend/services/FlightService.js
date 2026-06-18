const BaseService = require('./BaseService');
const Flight = require('../models/Flight');
const FlightLog = require('../models/FlightLog');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const { Op } = require('sequelize');
const { ValidationError, ForbiddenError } = require('../utils/error');
const notificationService = require('./NotificationService');

const OPERATION_TYPE = {
  CREATE: 1,
  UPDATE: 2,
  ONLINE: 3,
  OFFLINE: 4,
  STATUS_CHANGE: 5,
  BATCH: 6,
  DELETE: 7,
  QUALIFICATION: 8,
  INVENTORY: 9
};

const FLIGHT_TYPE = {
  DOMESTIC: 1,
  INTERNATIONAL: 2,
  TRANSFER: 3,
  CHARTER: 4
};

class FlightService extends BaseService {
  constructor() {
    super(Flight);
  }

  async getList(params = {}) {
    return super.getList(params, {
      searchFields: ['flightNo', 'airline', 'departure', 'arrival', 'routeCode', 'departureAirportCode', 'arrivalAirportCode'],
      defaultOrder: [['departureTime', 'DESC']]
    });
  }

  _validateFlightData(data, excludeId = null) {
    const errors = [];

    if (!data.flightNo || !data.flightNo.trim()) {
      errors.push({ field: 'flightNo', message: '航班号不能为空' });
    } else if (!/^[A-Z0-9]{2,20}$/.test(data.flightNo)) {
      errors.push({ field: 'flightNo', message: '航班号格式不正确，应为2-20位字母数字组合' });
    }

    if (!data.airline || !data.airline.trim()) {
      errors.push({ field: 'airline', message: '航空公司不能为空' });
    }

    if (!data.routeCode || !data.routeCode.trim()) {
      errors.push({ field: 'routeCode', message: '航线编码不能为空' });
    }

    if (!data.departure || !data.departure.trim()) {
      errors.push({ field: 'departure', message: '出发地不能为空' });
    }

    if (!data.departureAirportCode || !data.departureAirportCode.trim()) {
      errors.push({ field: 'departureAirportCode', message: '出发机场三字码不能为空' });
    } else if (!/^[A-Z]{3}$/.test(data.departureAirportCode)) {
      errors.push({ field: 'departureAirportCode', message: '出发机场三字码格式不正确' });
    }

    if (!data.arrival || !data.arrival.trim()) {
      errors.push({ field: 'arrival', message: '目的地不能为空' });
    }

    if (!data.arrivalAirportCode || !data.arrivalAirportCode.trim()) {
      errors.push({ field: 'arrivalAirportCode', message: '到达机场三字码不能为空' });
    } else if (!/^[A-Z]{3}$/.test(data.arrivalAirportCode)) {
      errors.push({ field: 'arrivalAirportCode', message: '到达机场三字码格式不正确' });
    }

    if (data.departureAirportCode === data.arrivalAirportCode) {
      errors.push({ field: 'arrivalAirportCode', message: '出发机场和到达机场不能相同' });
    }

    if (!data.departureTime) {
      errors.push({ field: 'departureTime', message: '出发时间不能为空' });
    }

    if (!data.arrivalTime) {
      errors.push({ field: 'arrivalTime', message: '到达时间不能为空' });
    }

    if (data.departureTime && data.arrivalTime) {
      const depTime = new Date(data.departureTime).getTime();
      const arrTime = new Date(data.arrivalTime).getTime();
      if (isNaN(depTime) || isNaN(arrTime)) {
        errors.push({ field: 'departureTime', message: '时间格式不正确' });
      } else if (arrTime <= depTime) {
        errors.push({ field: 'arrivalTime', message: '到达时间必须晚于出发时间' });
      }
    }

    if (!data.aircraftType || !data.aircraftType.trim()) {
      errors.push({ field: 'aircraftType', message: '机型不能为空' });
    }

    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: '价格不能为空' });
    } else if (Number(data.price) < 0) {
      errors.push({ field: 'price', message: '价格不能为负数' });
    }

    if (data.seats !== undefined && Number(data.seats) < 0) {
      errors.push({ field: 'seats', message: '剩余座位数不能为负数' });
    }

    if (data.seatCount !== undefined && Number(data.seatCount) < 0) {
      errors.push({ field: 'seatCount', message: '总座位数不能为负数' });
    }

    if (data.seats !== undefined && data.seatCount !== undefined && Number(data.seats) > Number(data.seatCount)) {
      errors.push({ field: 'seats', message: '剩余座位数不能大于总座位数' });
    }

    const flightType = Number(data.flightType) || FLIGHT_TYPE.DOMESTIC;

    if (flightType === FLIGHT_TYPE.INTERNATIONAL || Number(data.isInternational) === 1) {
      if (!data.departureCountry || !data.departureCountry.trim()) {
        errors.push({ field: 'departureCountry', message: '国际航班必须填写出发国家' });
      }
      if (!data.arrivalCountry || !data.arrivalCountry.trim()) {
        errors.push({ field: 'arrivalCountry', message: '国际航班必须填写到达国家' });
      }
    }

    if (flightType === FLIGHT_TYPE.TRANSFER || Number(data.isTransfer) === 1) {
      if (!data.transferCity || !data.transferCity.trim()) {
        errors.push({ field: 'transferCity', message: '中转航班必须填写中转城市' });
      }
      if (!data.transferAirportCode || !data.transferAirportCode.trim()) {
        errors.push({ field: 'transferAirportCode', message: '中转航班必须填写中转机场三字码' });
      } else if (!/^[A-Z]{3}$/.test(data.transferAirportCode)) {
        errors.push({ field: 'transferAirportCode', message: '中转机场三字码格式不正确' });
      }
    }

    if (flightType === FLIGHT_TYPE.CHARTER || Number(data.isCharter) === 1) {
      if (!data.charterContractNo || !data.charterContractNo.trim()) {
        errors.push({ field: 'charterContractNo', message: '包机航班必须填写包机合同编号' });
      }
    }

    return errors;
  }

  async _checkDuplicateFlight(data, excludeId = null) {
    const where = {
      flightNo: data.flightNo,
      departureAirportCode: data.departureAirportCode,
      arrivalAirportCode: data.arrivalAirportCode
    };

    if (data.departureTime) {
      const depDate = new Date(data.departureTime);
      depDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(depDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureTime = {
        [Op.between]: [depDate, nextDay]
      };
    }

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const count = await Flight.count({ where });
    return count > 0;
  }

  async _createFlightLog(flightId, flightNo, operationType, operationName, beforeData, afterData, changedFields, operator, remark = '') {
    const logData = {
      flightId,
      flightNo,
      operationType,
      operationName,
      operationRemark: remark,
      operationStatus: 1,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      changedFields: changedFields ? JSON.stringify(changedFields) : null
    };

    if (operator) {
      logData.operatorId = operator.id || null;
      logData.operatorName = operator.name || operator.username || null;
      logData.operatorRole = operator.roles ? operator.roles.join(',') : null;
    }

    return await FlightLog.create(logData);
  }

  _getChangedFields(beforeData, afterData) {
    const changed = [];
    const keys = new Set([...Object.keys(beforeData || {}), ...Object.keys(afterData || {})]);
    keys.forEach(key => {
      if (['updatedAt', 'createdAt', 'operatorId', 'operatorName'].includes(key)) return;
      const before = beforeData ? beforeData[key] : undefined;
      const after = afterData ? afterData[key] : undefined;
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed.push(key);
      }
    });
    return changed;
  }

  async _syncRelatedData(flight, changedFields, operator) {
    const needSyncInventory = changedFields.some(f => ['seatCount', 'seats', 'price', 'cabinClass'].includes(f));
    const needSyncDisplay = changedFields.some(f => ['displayStatus', 'saleStatus', 'operationStatus', 'status'].includes(f));

    if (needSyncInventory) {
      if (flight.seats <= 0) {
        flight.saleStatus = 0;
      } else if (flight.seats > 0 && flight.operationStatus === 1) {
        flight.saleStatus = 1;
      }
      await flight.save({ silent: true });
    }

    if (needSyncDisplay && (flight.operationStatus === 2 || flight.operationStatus === 3)) {
      await this._notifyAffectedUsers(flight, operator);
    }

    return true;
  }

  async _notifyAffectedUsers(flight, operator) {
    try {
      const affectedOrders = await Order.findAll({
        where: {
          productId: flight.id,
          productType: 'flight',
          status: { [Op.in]: [1, 2] }
        },
        attributes: ['userId']
      });

      const userIds = [...new Set(affectedOrders.map(o => o.userId).filter(Boolean))];

      if (userIds.length === 0) return true;

      let title = '';
      let content = '';

      if (flight.operationStatus === 2) {
        title = `航班延误通知：${flight.flightNo}`;
        content = `尊敬的旅客，您预订的${flight.flightNo}航班（${flight.departure}→${flight.arrival}）已延误，延误时长约${flight.delayMinutes || 0}分钟。请您关注航班动态，合理安排出行。`;
      } else if (flight.operationStatus === 3) {
        title = `航班取消通知：${flight.flightNo}`;
        content = `尊敬的旅客，很抱歉通知您，您预订的${flight.flightNo}航班（${flight.departure}→${flight.arrival}）已取消。${flight.cancelReason ? '取消原因：' + flight.cancelReason : ''}请您及时办理改签或退票。`;
      }

      const notifications = userIds.map(userId => ({
        userId,
        type: 'order',
        title,
        content,
        relatedId: flight.id,
        isRead: 0
      }));

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }

      return true;
    } catch (e) {
      console.error('通知用户失败:', e);
      return false;
    }
  }

  async validateFlightData(data, excludeId = null) {
    const fieldErrors = this._validateFlightData(data, excludeId);

    if (fieldErrors.length > 0) {
      return {
        valid: false,
        errors: fieldErrors
      };
    }

    if (data.flightNo && data.departureAirportCode && data.arrivalAirportCode) {
      const isDuplicate = await this._checkDuplicateFlight(data, excludeId);
      if (isDuplicate) {
        return {
          valid: false,
          errors: [{ field: 'flightNo', message: '同日期同航线的航班已存在，请检查航班号和起降机场' }]
        };
      }
    }

    return {
      valid: true,
      errors: []
    };
  }

  async validateFieldUniqueness(field, value, excludeId = null) {
    const where = { [field]: value };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await Flight.count({ where });
    return { unique: count === 0 };
  }

  async createFlight(data, operator) {
    const validation = await this.validateFlightData(data);
    if (!validation.valid) {
      throw new ValidationError('航班数据校验失败', validation.errors);
    }

    const flightType = Number(data.flightType) || FLIGHT_TYPE.DOMESTIC;
    data.isInternational = flightType === FLIGHT_TYPE.INTERNATIONAL ? 1 : (data.isInternational || 0);
    data.isTransfer = flightType === FLIGHT_TYPE.TRANSFER ? 1 : (data.isTransfer || 0);
    data.isCharter = flightType === FLIGHT_TYPE.CHARTER ? 1 : (data.isCharter || 0);

    if (data.departureTime && data.arrivalTime) {
      const duration = Math.round((new Date(data.arrivalTime).getTime() - new Date(data.departureTime).getTime()) / 60000);
      data.flightDuration = duration;
    }

    if (operator) {
      data.operatorId = operator.id;
      data.operatorName = operator.name || operator.username;
    }

    const flight = await this.create(data);

    await this._createFlightLog(
      flight.id,
      flight.flightNo,
      OPERATION_TYPE.CREATE,
      '创建航班',
      null,
      flight.toJSON(),
      Object.keys(data),
      operator
    );

    return flight;
  }

  async updateFlight(id, data, operator) {
    const flight = await this.getById(id);
    const beforeData = flight.toJSON();

    const validation = await this.validateFlightData({ ...beforeData, ...data }, id);
    if (!validation.valid) {
      throw new ValidationError('航班数据校验失败', validation.errors);
    }

    const flightType = Number(data.flightType) || beforeData.flightType || FLIGHT_TYPE.DOMESTIC;
    if (data.flightType !== undefined) {
      data.isInternational = flightType === FLIGHT_TYPE.INTERNATIONAL ? 1 : 0;
      data.isTransfer = flightType === FLIGHT_TYPE.TRANSFER ? 1 : 0;
      data.isCharter = flightType === FLIGHT_TYPE.CHARTER ? 1 : 0;
    }

    if (data.departureTime || data.arrivalTime) {
      const depTime = data.departureTime ? new Date(data.departureTime) : new Date(beforeData.departureTime);
      const arrTime = data.arrivalTime ? new Date(data.arrivalTime) : new Date(beforeData.arrivalTime);
      data.flightDuration = Math.round((arrTime.getTime() - depTime.getTime()) / 60000);
    }

    if (operator) {
      data.operatorId = operator.id;
      data.operatorName = operator.name || operator.username;
    }

    await this.update(id, data);

    const updatedFlight = await this.getById(id);
    const afterData = updatedFlight.toJSON();
    const changedFields = this._getChangedFields(beforeData, afterData);

    if (changedFields.length > 0) {
      await this._createFlightLog(
        id,
        updatedFlight.flightNo,
        OPERATION_TYPE.UPDATE,
        '修改航班',
        beforeData,
        afterData,
        changedFields,
        operator
      );

      await this._syncRelatedData(updatedFlight, changedFields, operator);
    }

    return updatedFlight;
  }

  async updateOperationStatus(id, operationStatus, extraData = {}, operator) {
    const flight = await this.getById(id);
    const beforeData = flight.toJSON();

    const validStatuses = [1, 2, 3, 4, 5];
    if (!validStatuses.includes(Number(operationStatus))) {
      throw new ValidationError('无效的运营状态');
    }

    const updateData = {
      operationStatus: Number(operationStatus)
    };

    if (Number(operationStatus) === 2 && extraData.delayMinutes !== undefined) {
      updateData.delayMinutes = Number(extraData.delayMinutes);
    }
    if (Number(operationStatus) === 3 && extraData.cancelReason) {
      updateData.cancelReason = extraData.cancelReason;
    }

    if (Number(operationStatus) === 3 || Number(operationStatus) === 4 || Number(operationStatus) === 5) {
      updateData.saleStatus = 0;
    } else if (Number(operationStatus) === 1 && flight.seats > 0) {
      updateData.saleStatus = 1;
    }

    if (operator) {
      updateData.operatorId = operator.id;
      updateData.operatorName = operator.name || operator.username;
    }

    await this.update(id, updateData);

    const updatedFlight = await this.getById(id);
    const afterData = updatedFlight.toJSON();
    const changedFields = this._getChangedFields(beforeData, afterData);

    const statusNames = { 1: '正常', 2: '延误', 3: '取消', 4: '备降', 5: '返航' };

    await this._createFlightLog(
      id,
      updatedFlight.flightNo,
      OPERATION_TYPE.STATUS_CHANGE,
      `状态变更为${statusNames[operationStatus] || '未知'}`,
      beforeData,
      afterData,
      changedFields,
      operator,
      extraData.cancelReason || extraData.remark || ''
    );

    if (changedFields.includes('operationStatus')) {
      await this._syncRelatedData(updatedFlight, changedFields, operator);
    }

    return updatedFlight;
  }

  async updateDisplayStatus(id, displayStatus, operator) {
    const flight = await this.getById(id);
    const beforeData = flight.toJSON();

    const status = Number(displayStatus);
    if (status !== 0 && status !== 1) {
      throw new ValidationError('无效的展示状态');
    }

    const updateData = {
      displayStatus: status,
      status: status
    };

    if (status === 0) {
      updateData.saleStatus = 0;
    } else if (flight.operationStatus === 1 && flight.seats > 0) {
      updateData.saleStatus = 1;
    }

    if (operator) {
      updateData.operatorId = operator.id;
      updateData.operatorName = operator.name || operator.username;
    }

    await this.update(id, updateData);

    const updatedFlight = await this.getById(id);
    const afterData = updatedFlight.toJSON();
    const changedFields = this._getChangedFields(beforeData, afterData);

    await this._createFlightLog(
      id,
      updatedFlight.flightNo,
      status === 1 ? OPERATION_TYPE.ONLINE : OPERATION_TYPE.OFFLINE,
      status === 1 ? '上架航班' : '下架航班',
      beforeData,
      afterData,
      changedFields,
      operator
    );

    return updatedFlight;
  }

  async batchUpdateTime(ids, timeData, operator) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的航班');
    }

    const results = { success: [], failed: [] };

    for (const id of ids) {
      try {
        const updateData = {};
        if (timeData.departureTimeOffset !== undefined) {
          const flight = await this.getById(id);
          const newDepTime = new Date(flight.departureTime.getTime() + Number(timeData.departureTimeOffset) * 60000);
          const newArrTime = new Date(flight.arrivalTime.getTime() + Number(timeData.departureTimeOffset) * 60000);
          updateData.departureTime = newDepTime;
          updateData.arrivalTime = newArrTime;
        }
        if (timeData.departureTime) updateData.departureTime = timeData.departureTime;
        if (timeData.arrivalTime) updateData.arrivalTime = timeData.arrivalTime;

        await this.updateFlight(id, updateData, operator);
        results.success.push(id);
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    await this._createFlightLog(
      ids[0],
      '',
      OPERATION_TYPE.BATCH,
      `批量调整航班时刻(成功${results.success.length}条)`,
      null,
      { ids, timeData },
      ['departureTime', 'arrivalTime'],
      operator
    );

    return results;
  }

  async batchUpdateDisplayStatus(ids, displayStatus, operator) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的航班');
    }

    const status = Number(displayStatus);
    if (status !== 0 && status !== 1) {
      throw new ValidationError('无效的展示状态');
    }

    const results = { success: [], failed: [] };

    for (const id of ids) {
      try {
        await this.updateDisplayStatus(id, status, operator);
        results.success.push(id);
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    await this._createFlightLog(
      ids[0],
      '',
      OPERATION_TYPE.BATCH,
      `${status === 1 ? '批量上架' : '批量下架'}航班(成功${results.success.length}条)`,
      null,
      { ids, displayStatus: status },
      ['displayStatus', 'saleStatus', 'status'],
      operator
    );

    return results;
  }

  async batchOfflineAbnormal(ids, operator, checkInternationalPermission = false) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的航班');
    }

    const flights = await Flight.findAll({ where: { id: ids } });
    const internationalFlights = flights.filter(f => Number(f.flightType) === FLIGHT_TYPE.INTERNATIONAL);

    if (internationalFlights.length > 0 && checkInternationalPermission) {
      if (!operator || !operator.roles || !operator.roles.includes('admin') && !operator.roles.includes('international_operator')) {
        throw new ForbiddenError('您没有出入境合规操作权限，请联系管理员');
      }
    }

    const results = { success: [], failed: [] };

    for (const id of ids) {
      try {
        await this.updateDisplayStatus(id, 0, operator);
        results.success.push(id);
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    await this._createFlightLog(
      ids[0],
      '',
      OPERATION_TYPE.BATCH,
      `批量下架异常航班(成功${results.success.length}条)`,
      null,
      { ids },
      ['displayStatus', 'saleStatus', 'status'],
      operator
    );

    return results;
  }

  async getFlightLogs(flightId, params = {}) {
    const { pageNum = 1, pageSize = 20, operationType } = params;
    const offset = (pageNum - 1) * pageSize;
    const limit = Math.min(pageSize, 100);

    const where = { flightId };
    if (operationType) {
      where.operationType = operationType;
    }

    const { count, rows } = await FlightLog.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      pageNum,
      pageSize
    };
  }

  async getFlightStats() {
    const total = await Flight.count();
    const online = await Flight.count({ where: { displayStatus: 1 } });
    const onSale = await Flight.count({ where: { saleStatus: 1 } });
    const delayed = await Flight.count({ where: { operationStatus: 2 } });
    const cancelled = await Flight.count({ where: { operationStatus: 3 } });
    const domestic = await Flight.count({ where: { flightType: FLIGHT_TYPE.DOMESTIC } });
    const international = await Flight.count({ where: { flightType: FLIGHT_TYPE.INTERNATIONAL } });
    const transfer = await Flight.count({ where: { flightType: FLIGHT_TYPE.TRANSFER } });
    const charter = await Flight.count({ where: { flightType: FLIGHT_TYPE.CHARTER } });

    return {
      total,
      online,
      offline: total - online,
      onSale,
      notOnSale: total - onSale,
      delayed,
      cancelled,
      typeStats: { domestic, international, transfer, charter }
    };
  }

  async deleteFlight(id, operator) {
    const flight = await this.getById(id);
    const beforeData = flight.toJSON();

    await this.remove(id);

    await this._createFlightLog(
      id,
      flight.flightNo,
      OPERATION_TYPE.DELETE,
      '删除航班',
      beforeData,
      null,
      ['all'],
      operator
    );

    return true;
  }

  async batchDeleteFlights(ids, operator) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要删除的航班');
    }

    const results = { success: [], failed: [] };

    for (const id of ids) {
      try {
        await this.deleteFlight(id, operator);
        results.success.push(id);
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    return results;
  }
}

module.exports = new FlightService();
