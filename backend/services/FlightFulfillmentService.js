const { Op, Sequelize } = require('sequelize');
const FlightFulfillment = require('../models/FlightFulfillment');
const FlightFulfillmentLog = require('../models/FlightFulfillmentLog');
const Order = require('../models/Order');
const Flight = require('../models/Flight');
const FlightInventory = require('../models/FlightInventory');
const { success, failure } = require('../utils/result');

class FlightFulfillmentService {
  async getList(params = {}) {
    const {
      page = 1,
      pageSize = 10,
      orderNo,
      flightNo,
      fulfillmentStage,
      fulfillmentStatus,
      fulfillmentCategory,
      isAbnormal,
      isInternational,
      userId,
      merchantId,
      startTime,
      endTime
    } = params;

    const where = {};

    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` };
    if (flightNo) where.flightNo = { [Op.like]: `%${flightNo}%` };
    if (fulfillmentStage) where.fulfillmentStage = fulfillmentStage;
    if (fulfillmentStatus !== undefined && fulfillmentStatus !== null) {
      where.fulfillmentStatus = fulfillmentStatus;
    }
    if (fulfillmentCategory) where.fulfillmentCategory = fulfillmentCategory;
    if (isAbnormal !== undefined && isAbnormal !== null) {
      where.isAbnormal = isAbnormal;
    }
    if (isInternational !== undefined && isInternational !== null) {
      where.isInternational = isInternational;
    }
    if (userId) where.userId = userId;
    if (merchantId) where.merchantId = merchantId;
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime + ' 23:59:59')] };
    }

    const { count, rows } = await FlightFulfillment.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order', attributes: ['id', 'orderNo', 'status', 'amount'] },
        { model: Flight, as: 'flight', attributes: ['id', 'flightNo', 'departure', 'arrival', 'departureTime', 'arrivalTime', 'operationStatus'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return success({
      items: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  }

  async getById(id) {
    const fulfillment = await FlightFulfillment.findByPk(id, {
      include: [
        { model: Order, as: 'order' },
        { model: Flight, as: 'flight' }
      ]
    });
    if (!fulfillment) {
      return failure('履约记录不存在');
    }
    return success(fulfillment);
  }

  _validateFulfillmentPermission(user, operationType) {
    const allowedRoles = ['admin', 'fulfillment_audit', 'fulfillment_operator'];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error('无履约操作权限');
    }
    if (['batch_issue', 'batch_process'].includes(operationType) && !['admin', 'fulfillment_audit'].includes(user.role)) {
      throw new Error('无批量操作权限');
    }
  }

  _validatePassengerInfo(passengerInfo) {
    if (!passengerInfo || !Array.isArray(passengerInfo) || passengerInfo.length === 0) {
      return { valid: false, reason: '乘机人信息不能为空' };
    }

    const now = new Date();
    for (const passenger of passengerInfo) {
      if (!passenger.name || !passenger.idCard) {
        return { valid: false, reason: `乘机人${passenger.name || ''}姓名或证件号缺失` };
      }
      if (passenger.idExpireDate) {
        const expireDate = new Date(passenger.idExpireDate);
        if (expireDate < now) {
          return { valid: false, reason: `乘机人${passenger.name}证件已过期` };
        }
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        if (expireDate < thirtyDaysLater) {
          return { valid: false, reason: `乘机人${passenger.name}证件即将在30天内过期`, warning: true };
        }
      }
    }
    return { valid: true };
  }

  async _validateFlightStatus(flightId) {
    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return { valid: false, reason: '航班信息不存在' };
    }
    if (flight.operationStatus === 3) {
      return { valid: false, reason: '航班已取消，无法正常出票', needHandle: true };
    }
    if (flight.operationStatus === 5) {
      return { valid: false, reason: '航班已返航，需特殊处理', needHandle: true };
    }
    return { valid: true, flight };
  }

  _validateTicketTiming(fulfillment, operationType) {
    if (operationType === 'issue_ticket') {
      if (fulfillment.ticketExpireTime && new Date(fulfillment.ticketExpireTime) < new Date()) {
        return { valid: false, reason: '已超出票时效，无法出票' };
      }
    }
    if (fulfillment.fulfillmentDeadline && new Date(fulfillment.fulfillmentDeadline) < new Date()) {
      return { valid: false, reason: '已超出履约完成期限' };
    }
    return { valid: true };
  }

  async _validateFulfillmentData(fulfillment, operationType, user) {
    const verificationDetails = {};

    this._validateFulfillmentPermission(user, operationType);

    const passengerCheck = this._validatePassengerInfo(fulfillment.passengerInfo);
    verificationDetails.passengerInfoValid = passengerCheck.valid;
    if (!passengerCheck.valid && !passengerCheck.warning) {
      return { valid: false, reason: passengerCheck.reason, verificationDetails };
    }

    const flightCheck = await this._validateFlightStatus(fulfillment.flightId);
    verificationDetails.flightStatusValid = flightCheck.valid;
    if (!flightCheck.valid && !flightCheck.needHandle) {
      return { valid: false, reason: flightCheck.reason, verificationDetails };
    }

    const timingCheck = this._validateTicketTiming(fulfillment, operationType);
    verificationDetails.ticketTimingValid = timingCheck.valid;
    if (!timingCheck.valid) {
      return { valid: false, reason: timingCheck.reason, verificationDetails };
    }

    verificationDetails.verificationPassed = passengerCheck.valid && flightCheck.valid && timingCheck.valid;
    return { valid: true, verificationDetails, flight: flightCheck.flight };
  }

  async _checkDuplicateTicket(fulfillmentId, ticketNumbers) {
    if (!ticketNumbers || ticketNumbers.length === 0) return false;

    const existingFulfillment = await FlightFulfillment.findOne({
      where: {
        id: { [Op.ne]: fulfillmentId },
        ticketNumbers: {
          [Op.and]: ticketNumbers.map(t => ({
            [Op.like]: `%${t.ticketNo}%`
          }))
        }
      }
    });
    return !!existingFulfillment;
  }

  async _createFulfillmentLog(fulfillment, operationType, params = {}) {
    const {
      operationCategory,
      operationDirection = 'forward',
      operationStatus = 1,
      failReason,
      changeFields = [],
      changeContent,
      isBatchOperation = 0,
      batchId,
      verificationDetails = {},
      operatorId,
      operatorName,
      operatorRole,
      operationRemark,
      effectScope = '本订单'
    } = params;

    await FlightFulfillmentLog.create({
      fulfillmentId: fulfillment.id,
      orderId: fulfillment.orderId,
      orderNo: fulfillment.orderNo,
      operationType,
      operationCategory,
      operationDirection,
      operationStatus,
      failReason,
      beforeFulfillmentStage: fulfillment._previousDataValues?.fulfillmentStage,
      afterFulfillmentStage: fulfillment.fulfillmentStage,
      beforeFulfillmentStatus: fulfillment._previousDataValues?.fulfillmentStatus,
      afterFulfillmentStatus: fulfillment.fulfillmentStatus,
      beforeTicketVoucherStatus: fulfillment._previousDataValues?.ticketVoucherStatus,
      afterTicketVoucherStatus: fulfillment.ticketVoucherStatus,
      ticketNumbers: fulfillment.ticketNumbers,
      changeFields: JSON.stringify(changeFields),
      changeContent,
      isBatchOperation,
      batchId,
      affectedFulfillmentCount: isBatchOperation ? fulfillment.batchCount || 1 : 1,
      verificationDetails: JSON.stringify(verificationDetails),
      verificationPassed: verificationDetails.verificationPassed ? 1 : 0,
      operatorId,
      operatorName,
      operatorRole,
      operationRemark,
      effectScope
    });
  }

  async createFulfillment(orderId, params = {}, user) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return failure('订单不存在');
    }
    if (order.category !== 'flight') {
      return failure('该订单不是机票订单');
    }

    const existingFulfillment = await FlightFulfillment.findOne({ where: { orderId } });
    if (existingFulfillment) {
      return failure('该订单已存在履约记录');
    }

    const { flightId, passengerInfo, ...restParams } = params;

    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return failure('航班信息不存在');
    }

    const fulfillment = await FlightFulfillment.create({
      orderId,
      orderNo: order.orderNo,
      flightId,
      flightNo: flight.flightNo,
      userId: order.userId,
      merchantId: order.merchantId,
      passengerInfo: JSON.stringify(passengerInfo),
      passengerCount: Array.isArray(passengerInfo) ? passengerInfo.length : 1,
      isInternational: flight.isInternational || 0,
      flightOperationStatus: flight.operationStatus || 1,
      fulfillmentStage: 'pending_ticket',
      fulfillmentStatus: 0,
      ...restParams,
      operatorId: user?.id,
      operatorName: user?.name
    });

    await this._createFulfillmentLog(fulfillment, 'create', {
      operationCategory: 'audit',
      operationDirection: 'forward',
      changeContent: '创建机票履约记录',
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role,
      effectScope: '本订单'
    });

    return success(fulfillment);
  }

  async auditFulfillment(id, auditResult, user, remark = '') {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }
    if (fulfillment.fulfillmentStage !== 'pending_ticket') {
      return failure('当前阶段不是待出票，无需审核');
    }

    const validateResult = await this._validateFulfillmentData(fulfillment, 'audit_pass', user);
    if (!validateResult.valid) {
      return failure(validateResult.reason);
    }

    if (auditResult === 'pass') {
      fulfillment.fulfillmentStatus = 1;
      await fulfillment.save();

      await this._createFulfillmentLog(fulfillment, 'audit_pass', {
        operationCategory: 'audit',
        operationDirection: 'forward',
        changeFields: ['fulfillmentStatus'],
        changeContent: `履约审核通过${remark ? '：' + remark : ''}`,
        verificationDetails: validateResult.verificationDetails,
        operatorId: user?.id,
        operatorName: user?.name,
        operatorRole: user?.role,
        operationRemark: remark
      });
    } else {
      fulfillment.fulfillmentStatus = 3;
      fulfillment.isAbnormal = 1;
      fulfillment.abnormalType = 'non_compliance';
      fulfillment.abnormalReason = remark || '审核不通过';
      await fulfillment.save();

      await this._createFulfillmentLog(fulfillment, 'audit_reject', {
        operationCategory: 'audit',
        operationDirection: 'backward',
        operationStatus: 2,
        changeFields: ['fulfillmentStatus', 'isAbnormal', 'abnormalType', 'abnormalReason'],
        changeContent: `履约审核拒绝：${remark}`,
        failReason: remark,
        operatorId: user?.id,
        operatorName: user?.name,
        operatorRole: user?.role
      });
    }

    return success(fulfillment);
  }

  async issueTicket(id, ticketParams, user) {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }
    if (fulfillment.fulfillmentStage === 'ticketed') {
      return failure('该履约订单已出票，请勿重复出票');
    }
    if (fulfillment.fulfillmentStatus === 2 || fulfillment.fulfillmentStatus === 4) {
      return failure('履约已完成或终止，无法出票');
    }

    const validateResult = await this._validateFulfillmentData(fulfillment, 'issue_ticket', user);
    if (!validateResult.valid) {
      return failure(validateResult.reason);
    }

    const { ticketNumbers, pnrCode, fareAmount, taxAmount, fuelSurcharge, airportTax } = ticketParams;

    if (await this._checkDuplicateTicket(id, ticketNumbers)) {
      return failure('存在重复票号，请检查票号是否正确');
    }

    const changeFields = [
      'fulfillmentStage', 'fulfillmentStatus', 'ticketNumbers',
      'pnrCode', 'ticketIssuedTime', 'ticketVoucherStatus'
    ];

    if (fareAmount !== undefined) changeFields.push('fareAmount');
    if (taxAmount !== undefined) changeFields.push('taxAmount');
    if (fuelSurcharge !== undefined) changeFields.push('fuelSurcharge');
    if (airportTax !== undefined) changeFields.push('airportTax');

    fulfillment.fulfillmentStage = 'ticketed';
    fulfillment.fulfillmentStatus = 2;
    fulfillment.ticketNumbers = JSON.stringify(ticketNumbers);
    fulfillment.pnrCode = pnrCode;
    fulfillment.ticketIssuedTime = new Date();
    fulfillment.ticketVoucherStatus = 1;
    if (fareAmount !== undefined) fulfillment.fareAmount = fareAmount;
    if (taxAmount !== undefined) fulfillment.taxAmount = taxAmount;
    if (fuelSurcharge !== undefined) fulfillment.fuelSurcharge = fuelSurcharge;
    if (airportTax !== undefined) fulfillment.airportTax = airportTax;

    await fulfillment.save();

    const order = await Order.findByPk(fulfillment.orderId);
    if (order) {
      order.status = 4;
      await order.save();
    }

    await this._createFulfillmentLog(fulfillment, 'issue_ticket', {
      operationCategory: 'ticket',
      operationDirection: 'forward',
      changeFields,
      changeContent: `出票完成，票号：${ticketNumbers?.map(t => t.ticketNo).join(', ')}`,
      verificationDetails: validateResult.verificationDetails,
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role
    });

    return success(fulfillment);
  }

  async handleFlightChange(id, handleParams, user) {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }

    const { changeType, reason, handlePlan, rebookFlightId, rebookFlightNo, remark } = handleParams;

    const changeFields = [
      'fulfillmentStage', 'flightOperationStatus', 'flightChangeType',
      'flightChangeReason', 'flightChangeHandlePlan', 'flightChangeHandled',
      'flightChangeHandledTime'
    ];

    fulfillment.fulfillmentStage = 'flight_changed';
    fulfillment.flightOperationStatus = 2;
    fulfillment.flightChangeType = changeType;
    fulfillment.flightChangeReason = reason;
    fulfillment.flightChangeHandlePlan = handlePlan;
    fulfillment.flightChangeHandled = 1;
    fulfillment.flightChangeHandledTime = new Date();

    if (handlePlan === 'rebook' && rebookFlightId) {
      const rebookFlight = await Flight.findByPk(rebookFlightId);
      if (rebookFlight) {
        fulfillment.rebookFlightId = rebookFlightId;
        fulfillment.rebookFlightNo = rebookFlightNo || rebookFlight.flightNo;
        fulfillment.rebookTime = new Date();
        fulfillment.fulfillmentStage = 'ticketed';
        changeFields.push('rebookFlightId', 'rebookFlightNo', 'rebookTime', 'fulfillmentStage');
      }
    }

    if (handlePlan === 'refund') {
      fulfillment.fulfillmentStage = 'terminated';
      fulfillment.fulfillmentStatus = 4;
      fulfillment.terminationReason = `航班变动退票：${reason}`;
      fulfillment.terminationTime = new Date();
      changeFields.push('fulfillmentStatus', 'terminationReason', 'terminationTime');
    }

    await fulfillment.save();

    const operationType = handlePlan === 'refund' ? 'cancel_ticket' : (handlePlan === 'rebook' ? 'change_ticket' : 'flight_change');
    const operationDirection = handlePlan === 'refund' ? 'backward' : 'info';

    await this._createFulfillmentLog(fulfillment, operationType, {
      operationCategory: 'flight',
      operationDirection,
      changeFields,
      changeContent: `航班变动处理（${changeType}）：${reason}，方案：${handlePlan}${remark ? '，备注：' + remark : ''}`,
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role,
      operationRemark: remark
    });

    return success(fulfillment);
  }

  async terminateFulfillment(id, reason, user) {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }
    if (fulfillment.fulfillmentStatus === 4) {
      return failure('该履约订单已终止');
    }

    fulfillment.fulfillmentStage = 'terminated';
    fulfillment.fulfillmentStatus = 4;
    fulfillment.terminationReason = reason;
    fulfillment.terminationTime = new Date();
    await fulfillment.save();

    await this._createFulfillmentLog(fulfillment, 'terminate', {
      operationCategory: 'audit',
      operationDirection: 'backward',
      changeFields: ['fulfillmentStage', 'fulfillmentStatus', 'terminationReason', 'terminationTime'],
      changeContent: `行程终止：${reason}`,
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role
    });

    return success(fulfillment);
  }

  async markAbnormal(id, abnormalType, reason, user) {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }

    fulfillment.isAbnormal = 1;
    fulfillment.fulfillmentStatus = 3;
    fulfillment.abnormalType = abnormalType;
    fulfillment.abnormalReason = reason;
    await fulfillment.save();

    await this._createFulfillmentLog(fulfillment, 'mark_abnormal', {
      operationCategory: 'abnormal',
      operationDirection: 'info',
      changeFields: ['isAbnormal', 'fulfillmentStatus', 'abnormalType', 'abnormalReason'],
      changeContent: `标记异常（${abnormalType}）：${reason}`,
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role
    });

    return success(fulfillment);
  }

  async handleAbnormal(id, handleRemark, user) {
    const fulfillment = await FlightFulfillment.findByPk(id);
    if (!fulfillment) {
      return failure('履约记录不存在');
    }
    if (!fulfillment.isAbnormal) {
      return failure('该订单无异常标记');
    }

    fulfillment.abnormalHandled = 1;
    fulfillment.abnormalHandleRemark = handleRemark;
    fulfillment.abnormalHandledTime = new Date();
    fulfillment.fulfillmentStatus = 0;
    fulfillment.isAbnormal = 0;
    await fulfillment.save();

    await this._createFulfillmentLog(fulfillment, 'handle_abnormal', {
      operationCategory: 'abnormal',
      operationDirection: 'forward',
      changeFields: ['abnormalHandled', 'abnormalHandleRemark', 'abnormalHandledTime', 'fulfillmentStatus', 'isAbnormal'],
      changeContent: `异常处理完成：${handleRemark}`,
      operatorId: user?.id,
      operatorName: user?.name,
      operatorRole: user?.role
    });

    return success(fulfillment);
  }

  async batchIssueTickets(ids, ticketDataList, user) {
    this._validateFulfillmentPermission(user, 'batch_issue');

    const batchId = `BATCH_${Date.now()}`;
    const results = { success: 0, failed: 0, details: [] };
    const failures = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const fulfillment = await FlightFulfillment.findByPk(id);
        if (!fulfillment) {
          failures.push({ id, reason: '履约记录不存在' });
          results.failed++;
          continue;
        }
        if (fulfillment.isInternational) {
          failures.push({ id, reason: '国际机票禁止批量处理，需人工逐一核验' });
          results.failed++;
          continue;
        }

        const validateResult = await this._validateFulfillmentData(fulfillment, 'issue_ticket', user);
        if (!validateResult.valid) {
          failures.push({ id, reason: validateResult.reason });
          results.failed++;
          continue;
        }

        const ticketData = ticketDataList[i] || {};
        if (ticketData.ticketNumbers) {
          if (await this._checkDuplicateTicket(id, ticketData.ticketNumbers)) {
            failures.push({ id, reason: '存在重复票号' });
            results.failed++;
            continue;
          }
        }

        fulfillment.batchCount = ids.length;
        await this.issueTicket(id, ticketData, user);
        results.success++;
        results.details.push({ id, success: true });

        await this._createFulfillmentLog(fulfillment, 'batch_issue', {
          operationCategory: 'ticket',
          operationDirection: 'forward',
          isBatchOperation: 1,
          batchId,
          changeContent: '批量出票成功',
          operatorId: user?.id,
          operatorName: user?.name,
          operatorRole: user?.role,
          effectScope: `批量操作共${ids.length}条`
        });
      } catch (e) {
        failures.push({ id, reason: e.message });
        results.failed++;
      }
    }

    results.failures = failures;
    return success(results);
  }

  async batchHandleFlightChanges(ids, user) {
    this._validateFulfillmentPermission(user, 'batch_process');

    const batchId = `BATCH_FLIGHT_${Date.now()}`;
    const results = { success: 0, failed: 0, details: [] };

    for (const id of ids) {
      try {
        const fulfillment = await FlightFulfillment.findByPk(id);
        if (!fulfillment) {
          results.failed++;
          continue;
        }
        if (fulfillment.isInternational) {
          results.failed++;
          continue;
        }

        fulfillment.batchCount = ids.length;
        fulfillment.flightChangeHandled = 1;
        fulfillment.flightChangeHandledTime = new Date();
        await fulfillment.save();

        results.success++;
        results.details.push({ id, success: true });

        await this._createFulfillmentLog(fulfillment, 'batch_process', {
          operationCategory: 'flight',
          operationDirection: 'info',
          isBatchOperation: 1,
          batchId,
          changeContent: '批量处理航班变动订单',
          operatorId: user?.id,
          operatorName: user?.name,
          operatorRole: user?.role,
          effectScope: `批量操作共${ids.length}条`
        });
      } catch (e) {
        results.failed++;
      }
    }

    return success(results);
  }

  async batchMarkAbnormal(ids, abnormalType, reason, user) {
    this._validateFulfillmentPermission(user, 'batch_process');

    const batchId = `BATCH_ABNORMAL_${Date.now()}`;
    const results = { success: 0, failed: 0, details: [] };

    for (const id of ids) {
      try {
        const fulfillment = await FlightFulfillment.findByPk(id);
        if (!fulfillment) {
          results.failed++;
          continue;
        }

        fulfillment.batchCount = ids.length;
        fulfillment.isAbnormal = 1;
        fulfillment.fulfillmentStatus = 3;
        fulfillment.abnormalType = abnormalType;
        fulfillment.abnormalReason = reason;
        await fulfillment.save();

        results.success++;
        results.details.push({ id, success: true });

        await this._createFulfillmentLog(fulfillment, 'mark_abnormal', {
          operationCategory: 'abnormal',
          operationDirection: 'info',
          isBatchOperation: 1,
          batchId,
          changeFields: ['isAbnormal', 'fulfillmentStatus', 'abnormalType', 'abnormalReason'],
          changeContent: `批量标记异常：${reason}`,
          operatorId: user?.id,
          operatorName: user?.name,
          operatorRole: user?.role
        });
      } catch (e) {
        results.failed++;
      }
    }

    return success(results);
  }

  async getLogs(fulfillmentId, params = {}) {
    const {
      page = 1,
      pageSize = 20,
      operationType,
      operationCategory,
      operationStatus,
      startTime,
      endTime
    } = params;

    const where = {};
    if (fulfillmentId) where.fulfillmentId = fulfillmentId;
    if (operationType) where.operationType = operationType;
    if (operationCategory) where.operationCategory = operationCategory;
    if (operationStatus !== undefined && operationStatus !== null) {
      where.operationStatus = operationStatus;
    }
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime + ' 23:59:59')] };
    }

    const { count, rows } = await FlightFulfillmentLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return success({
      items: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  }

  async getStats(params = {}) {
    const { fulfillmentStage, startTime, endTime } = params;

    const where = {};
    if (fulfillmentStage) where.fulfillmentStage = fulfillmentStage;
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime + ' 23:59:59')] };
    }

    const total = await FlightFulfillment.count({ where });
    const pendingCount = await FlightFulfillment.count({ where: { ...where, fulfillmentStage: 'pending_ticket' } });
    const ticketedCount = await FlightFulfillment.count({ where: { ...where, fulfillmentStage: 'ticketed' } });
    const changedCount = await FlightFulfillment.count({ where: { ...where, fulfillmentStage: 'flight_changed' } });
    const terminatedCount = await FlightFulfillment.count({ where: { ...where, fulfillmentStage: 'terminated' } });
    const abnormalCount = await FlightFulfillment.count({ where: { ...where, isAbnormal: 1 } });
    const internationalCount = await FlightFulfillment.count({ where: { ...where, isInternational: 1 } });

    const byCategory = {
      normal: await FlightFulfillment.count({ where: { ...where, fulfillmentCategory: 'normal' } }),
      international: internationalCount,
      group: await FlightFulfillment.count({ where: { ...where, fulfillmentCategory: 'group' } }),
      vip: await FlightFulfillment.count({ where: { ...where, fulfillmentCategory: 'vip' } })
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWhere = { ...where, createdAt: { [Op.gte]: today } };

    const todayIssued = await FlightFulfillment.count({
      where: { ...todayWhere, fulfillmentStage: 'ticketed' }
    });
    const todayNew = await FlightFulfillment.count({ where: todayWhere });

    const avgTicketTime = await FlightFulfillment.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal('TIMESTAMPDIFF(MINUTE, createdAt, ticketIssuedTime)')), 'avgMinutes']
      ],
      where: { ...where, ticketIssuedTime: { [Op.not]: null } }
    });

    return success({
      total,
      pendingCount,
      ticketedCount,
      changedCount,
      terminatedCount,
      abnormalCount,
      internationalCount,
      byCategory,
      todayNew,
      todayIssued,
      avgTicketMinutes: parseFloat(avgTicketTime?.dataValues?.avgMinutes || 0).toFixed(2)
    });
  }

  async validateField(field, value, fulfillmentId) {
    const errors = [];

    switch (field) {
      case 'ticketNumbers':
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors.push('票号列表不能为空');
        } else {
          for (const ticket of value) {
            if (!ticket.ticketNo || ticket.ticketNo.length < 8) {
              errors.push(`票号${ticket.ticketNo || ''}格式不正确`);
            }
          }
          if (fulfillmentId && await this._checkDuplicateTicket(fulfillmentId, value)) {
            errors.push('票号已被其他订单使用');
          }
        }
        break;

      case 'passengerInfo':
        const check = this._validatePassengerInfo(value);
        if (!check.valid) errors.push(check.reason);
        break;

      case 'pnrCode':
        if (value && !/^[A-Z0-9]{6}$/.test(value)) {
          errors.push('PNR编码格式不正确，应为6位大写字母或数字');
        }
        break;

      default:
        break;
    }

    return success({ valid: errors.length === 0, errors });
  }

  async checkTicketTimeout() {
    const now = new Date();
    const timeoutFulfillments = await FlightFulfillment.findAll({
      where: {
        fulfillmentStage: 'pending_ticket',
        ticketExpireTime: { [Op.lt]: now },
        ticketIssueTimeout: 0
      }
    });

    const results = [];
    for (const fulfillment of timeoutFulfillments) {
      fulfillment.ticketIssueTimeout = 1;
      fulfillment.fulfillmentStatus = 3;
      fulfillment.isAbnormal = 1;
      fulfillment.abnormalType = 'timeout';
      fulfillment.abnormalReason = '出票超时';
      await fulfillment.save();

      await this._createFulfillmentLog(fulfillment, 'mark_abnormal', {
        operationCategory: 'abnormal',
        operationDirection: 'info',
        changeFields: ['ticketIssueTimeout', 'fulfillmentStatus', 'isAbnormal', 'abnormalType', 'abnormalReason'],
        changeContent: '系统自动标记：出票超时'
      });

      results.push(fulfillment.id);
    }

    return success({ count: results.length, ids: results });
  }
}

module.exports = new FlightFulfillmentService();
