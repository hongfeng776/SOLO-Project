const HotelFulfillment = require('../models/HotelFulfillment');
const HotelFulfillmentLog = require('../models/HotelFulfillmentLog');
const HotelRoom = require('../models/HotelRoom');
const { Op } = require('sequelize');

const PERMISSION_FULFILL_OPS = ['admin', 'hotel_operator', 'senior_hotel_operator', 'fulfillment_auditor'];
const PERMISSION_FULFILL_SENIOR = ['admin', 'senior_hotel_operator', 'fulfillment_auditor'];

const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

const parseJSON = (str, defaultVal = null) => {
  if (!str) return defaultVal;
  try { return JSON.parse(str); } catch (e) { return defaultVal; }
};
const stringifyJSON = (obj) => {
  try { return JSON.stringify(obj); } catch (e) { return null; }
};

const checkFulfillPermission = (user) => user && PERMISSION_FULFILL_OPS.includes(user.role);
const checkFulfillSeniorPermission = (user) => user && PERMISSION_FULFILL_SENIOR.includes(user.role);

const validateIdCard = (idCard) => {
  if (!idCard) return { valid: false, message: '身份证号不能为空' };
  if (!ID_CARD_REGEX.test(idCard)) return { valid: false, message: '身份证号格式不合规' };
  return { valid: true };
};

const validatePhone = (phone) => {
  if (!phone) return { valid: true };
  if (!PHONE_REGEX.test(phone)) return { valid: false, message: '手机号格式不合规' };
  return { valid: true };
};

const checkTimeliness = (checkInDate, actualTime) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planned = new Date(checkInDate);
  planned.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - planned) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return { valid: false, message: `入住已超时${diffDays}天，属于延迟入住` };
  if (diffDays < -1) return { valid: false, message: '入住日期未到，不可提前核验' };
  return { valid: true, isDelayed: diffDays > 0 };
};

const checkRoomMatch = async (roomId, roomTypeName) => {
  if (!roomId) return { valid: false, message: '未关联房型' };
  const room = await HotelRoom.findByPk(roomId);
  if (!room) return { valid: false, message: '房型不存在' };
  if (roomTypeName && room.roomName !== roomTypeName) {
    return { valid: false, message: `房型不匹配：订单${roomTypeName} vs 实际${room.roomName}` };
  }
  return { valid: true, room };
};

const checkOrderStatus = (status) => {
  const ALLOWED = ['pending_checkin', 'paid'];
  if (!ALLOWED.includes(status)) {
    return { valid: false, message: `订单状态${status}不允许入住核验` };
  }
  return { valid: true };
};

const checkFakeCheckIn = (data) => {
  const warnings = [];
  let score = 0;
  if (!data.guestName || data.guestName.length < 2) { warnings.push('入住人姓名异常'); score++; }
  if (!data.guestIdCard || !ID_CARD_REGEX.test(data.guestIdCard)) { warnings.push('身份证号异常'); score++; }
  if (data.guestCount > 6) { warnings.push('入住人数过多'); score++; }
  if (parseFloat(data.totalAmount) <= 0) { warnings.push('订单金额异常'); score++; }
  if (!data.checkInDate || !data.checkOutDate) { warnings.push('日期不完整'); score++; }
  return { isFake: score >= 4, score, warnings };
};

const checkDuplicateVerify = async (fulfillmentId, guestIdCard, hotelId) => {
  const existing = await HotelFulfillment.findOne({
    where: {
      id: { [Op.ne]: fulfillmentId },
      guestIdCard,
      hotelId,
      status: { [Op.in]: ['checked_in', 'delayed'] },
      verifyStatus: 'verified'
    }
  });
  return !!existing;
};

const checkIllegalCheckout = (fulfillment) => {
  if (fulfillment.status !== 'checked_in' && fulfillment.status !== 'delayed') {
    return { illegal: true, message: '非入住状态不可退房' };
  }
  return { illegal: false };
};

const calcSettlement = (fulfillment, action, extraData = {}) => {
  const basePrice = parseFloat(fulfillment.roomPrice) || 0;
  let actualNights = fulfillment.nights || 1;
  let extraCharge = 0;
  let refundAmount = 0;
  const paid = parseFloat(fulfillment.paidAmount) || 0;

  if (action === 'early_checkout') {
    const checkIn = new Date(fulfillment.actualCheckInTime || fulfillment.checkInDate);
    const checkOut = new Date(extraData.checkOutTime || Date.now());
    actualNights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const plannedNights = fulfillment.nights || 1;
    if (actualNights < plannedNights) {
      refundAmount = (plannedNights - actualNights) * basePrice * 0.5;
    }
  } else if (action === 'delayed') {
    const plannedCheckout = new Date(fulfillment.checkOutDate);
    const actualCheckout = new Date(extraData.checkOutTime || Date.now());
    const extraDays = Math.max(0, Math.ceil((actualCheckout - plannedCheckout) / (1000 * 60 * 60 * 24)));
    actualNights = (fulfillment.nights || 1) + extraDays;
    extraCharge = extraDays * basePrice;
  } else if (action === 'extend') {
    const extendNights = extraData.extendNights || 1;
    actualNights = (fulfillment.nights || 1) + extendNights;
    extraCharge = extendNights * basePrice;
  }

  const settlementAmount = paid + extraCharge - refundAmount;
  return { actualNights, extraCharge, refundAmount, settlementAmount: Math.max(0, settlementAmount) };
};

const writeFulfillLog = async (fulfillmentId, orderId, hotelId, operationType, operator, extra = {}) => {
  await HotelFulfillmentLog.create({
    fulfillmentId, orderId, hotelId, operationType,
    oldValue: extra.oldValue ? stringifyJSON(extra.oldValue) : null,
    newValue: extra.newValue ? stringifyJSON(extra.newValue) : null,
    changeFields: extra.changeFields?.join(',') || null,
    operationReason: extra.reason || null,
    operatorId: operator?.id || null,
    operatorName: operator?.name || operator?.username || 'system',
    operatorRole: operator?.role || null,
    operationIp: extra.ip || null,
    isBatch: extra.isBatch || false,
    batchId: extra.batchId || null,
    verifyResult: extra.verifyResult || null,
    verifyMessages: extra.verifyMessages ? stringifyJSON(extra.verifyMessages) : null,
    roomOccupancyUpdated: extra.roomOccupancyUpdated || false,
    orderProgressUpdated: extra.orderProgressUpdated || false,
    voucherUpdated: extra.voucherUpdated || false,
    ledgerUpdated: extra.ledgerUpdated || false,
    settlementChanged: extra.settlementChanged || false
  });
};

const HotelFulfillmentService = {
  async checkPermission(user) {
    return {
      canOps: checkFulfillPermission(user),
      canSenior: checkFulfillSeniorPermission(user)
    };
  },

  async list(params = {}) {
    const { page = 1, pageSize = 20, hotelId, orderId, fulfillmentType, status, verifyStatus, keyword, startDate, endDate } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (orderId) where.orderId = orderId;
    if (fulfillmentType) where.fulfillmentType = fulfillmentType;
    if (status) where.status = status;
    if (verifyStatus) where.verifyStatus = verifyStatus;
    if (keyword) where[Op.or] = [
      { guestName: { [Op.like]: `%${keyword}%` } },
      { guestIdCard: { [Op.like]: `%${keyword}%` } },
      { roomNo: { [Op.like]: `%${keyword}%` } }
    ];
    if (startDate) where.checkInDate = { [Op.gte]: startDate };
    if (endDate) where.checkOutDate = { [Op.lte]: endDate };

    const { count, rows } = await HotelFulfillment.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: parseInt(pageSize),
      order: [['id', 'DESC']],
      include: [
        { model: HotelRoom, as: 'room', attributes: ['id', 'roomName', 'roomType', 'basePrice'] }
      ]
    });
    return { total: count, list: rows.map(r => r.toJSON()) };
  },

  async get(id) {
    const f = await HotelFulfillment.findByPk(id, {
      include: [{ model: HotelRoom, as: 'room', attributes: ['id', 'roomName', 'roomType', 'basePrice'] }]
    });
    if (!f) return null;
    const data = f.toJSON();
    data.warningFlags = parseJSON(data.warningFlags, []);
    return data;
  },

  async verifyCheckIn(id, operator, verifyData = {}) {
    if (!checkFulfillPermission(operator)) throw new Error('权限不足');
    const f = await HotelFulfillment.findByPk(id);
    if (!f) throw new Error('履约记录不存在');
    if (f.verifyStatus === 'verified') throw new Error('已核验，不可重复核验');
    if (f.status === 'cancelled') throw new Error('已取消订单不可核验');

    const errors = [];
    const warnings = [];

    const idResult = validateIdCard(verifyData.guestIdCard || f.guestIdCard);
    if (!idResult.valid) errors.push(idResult.message);

    const phoneResult = validatePhone(verifyData.guestPhone || f.guestPhone);
    if (!phoneResult.valid) warnings.push(phoneResult.message);

    const timeResult = checkTimeliness(f.checkInDate, Date.now());
    if (!timeResult.valid) errors.push(timeResult.message);
    else if (timeResult.isDelayed) warnings.push('入住时间已延迟');

    const roomResult = await checkRoomMatch(f.roomId, f.roomTypeName);
    if (!roomResult.valid) errors.push(roomResult.message);

    const orderResult = checkOrderStatus(f.status);
    if (!orderResult.valid) errors.push(orderResult.message);

    const dup = await checkDuplicateVerify(f.id, f.guestIdCard, f.hotelId);
    if (dup) errors.push('同一入住人已有进行中的核验记录');

    const fake = checkFakeCheckIn(f.toJSON());
    if (fake.isFake) errors.push(...fake.warnings);
    warnings.push(...fake.warnings);

    if (errors.length > 0) {
      await HotelFulfillment.update({
        verifyStatus: 'rejected',
        idCardValid: idResult.valid,
        timelinessValid: timeResult.valid,
        roomMatchValid: roomResult.valid,
        orderStatusValid: orderResult.valid,
        isFakeCheckIn: fake.isFake,
        isDuplicateVerify: dup,
        warningFlags: stringifyJSON(warnings)
      }, { where: { id } });
      await writeFulfillLog(id, f.orderId, f.hotelId, 'verify', operator, {
        reason: verifyData.remark, verifyResult: 'rejected', verifyMessages: errors,
        oldValue: f.toJSON()
      });
      throw new Error(errors.join('; '));
    }

    const isDelayed = timeResult.isDelayed;
    const newStatus = isDelayed ? 'delayed' : 'checked_in';
    const newType = isDelayed ? 'delayed' : 'normal';
    const updatePayload = {
      status: newStatus,
      fulfillmentType: newType,
      verifyStatus: 'verified',
      verifyTime: new Date(),
      verifyOperator: operator?.name || operator?.username,
      verifyRemark: verifyData.remark || null,
      actualCheckInTime: new Date(),
      idCardValid: true,
      timelinessValid: true,
      roomMatchValid: true,
      orderStatusValid: true,
      isFakeCheckIn: false,
      isDuplicateVerify: false,
      roomOccupancySynced: true,
      orderProgressSynced: true,
      voucherGenerated: true,
      warningFlags: stringifyJSON(warnings),
      updatedBy: operator?.name || operator?.username
    };

    await HotelFulfillment.update(updatePayload, { where: { id } });
    await writeFulfillLog(id, f.orderId, f.hotelId, 'verify', operator, {
      oldValue: f.toJSON(), newValue: { ...f.toJSON(), ...updatePayload },
      changeFields: ['status', 'fulfillmentType', 'verifyStatus', 'actualCheckInTime'],
      reason: verifyData.remark,
      verifyResult: warnings.length ? 'warning' : 'pass',
      verifyMessages: warnings,
      roomOccupancyUpdated: true,
      orderProgressUpdated: true,
      voucherUpdated: true
    });
    return { verified: true, status: newStatus, warnings };
  },

  async checkout(id, checkoutData, operator) {
    if (!checkFulfillPermission(operator)) throw new Error('权限不足');
    const f = await HotelFulfillment.findByPk(id);
    if (!f) throw new Error('履约记录不存在');

    const ilResult = checkIllegalCheckout(f);
    if (ilResult.illegal) throw new Error(ilResult.message);

    const isEarly = checkoutData.earlyCheckout;
    const action = isEarly ? 'early_checkout' : 'checkout';
    const settlement = calcSettlement(f, action, checkoutData);

    const oldVal = f.toJSON();
    const updatePayload = {
      status: isEarly ? 'early_checkout' : 'checked_out',
      fulfillmentType: isEarly ? 'cancelled' : f.fulfillmentType,
      actualCheckOutTime: new Date(),
      actualNights: settlement.actualNights,
      extraCharge: settlement.extraCharge,
      refundAmount: settlement.refundAmount,
      settlementAmount: settlement.settlementAmount,
      earlyCheckoutReason: isEarly ? checkoutData.reason : null,
      roomOccupancySynced: true,
      orderProgressSynced: true,
      ledgerSynced: true,
      ledgerSyncTime: new Date(),
      updatedBy: operator?.name || operator?.username
    };

    await HotelFulfillment.update(updatePayload, { where: { id } });
    await writeFulfillLog(id, f.orderId, f.hotelId, action, operator, {
      oldValue: oldVal, newValue: { ...oldVal, ...updatePayload },
      changeFields: ['status', 'actualCheckOutTime', 'actualNights', 'settlementAmount', 'ledgerSynced'],
      reason: checkoutData.reason,
      settlementChanged: true,
      roomOccupancyUpdated: true,
      orderProgressUpdated: true,
      voucherUpdated: true,
      ledgerUpdated: true
    });
    return { checkedOut: true, settlement };
  },

  async extendStay(id, extendData, operator) {
    if (!checkFulfillPermission(operator)) throw new Error('权限不足');
    const f = await HotelFulfillment.findByPk(id);
    if (!f) throw new Error('履约记录不存在');
    if (f.status !== 'checked_in' && f.status !== 'delayed') throw new Error('仅入住状态可续住');

    const settlement = calcSettlement(f, 'extend', extendData);
    const oldVal = f.toJSON();
    const newCheckOut = new Date(f.checkOutDate);
    newCheckOut.setDate(newCheckOut.getDate() + (extendData.extendNights || 1));

    const updatePayload = {
      checkOutDate: newCheckOut.toISOString().slice(0, 10),
      nights: settlement.actualNights,
      extraCharge: settlement.extraCharge,
      settlementAmount: settlement.settlementAmount,
      updatedBy: operator?.name || operator?.username
    };

    await HotelFulfillment.update(updatePayload, { where: { id } });
    await writeFulfillLog(id, f.orderId, f.hotelId, 'extend', operator, {
      oldValue: oldVal, newValue: { ...oldVal, ...updatePayload },
      changeFields: ['checkOutDate', 'nights', 'extraCharge', 'settlementAmount'],
      reason: extendData.reason,
      settlementChanged: true,
      roomOccupancyUpdated: true,
      orderProgressUpdated: true
    });
    return true;
  },

  async markNoShow(id, reason, operator) {
    if (!checkFulfillPermission(operator)) throw new Error('权限不足');
    const f = await HotelFulfillment.findByPk(id);
    if (!f) throw new Error('履约记录不存在');
    const oldVal = f.toJSON();
    await HotelFulfillment.update({
      status: 'no_show',
      fulfillmentType: 'cancelled',
      cancelReason: reason,
      updatedBy: operator?.name || operator?.username,
      ledgerSynced: true,
      ledgerSyncTime: new Date()
    }, { where: { id } });
    await writeFulfillLog(id, f.orderId, f.hotelId, 'no_show', operator, {
      oldValue: oldVal, newValue: { ...oldVal, status: 'no_show', fulfillmentType: 'cancelled' },
      changeFields: ['status', 'fulfillmentType'],
      reason,
      roomOccupancyUpdated: true,
      orderProgressUpdated: true,
      ledgerUpdated: true
    });
    return true;
  },

  async batchOperation(operation, params, operator) {
    if (!checkFulfillPermission(operator)) throw new Error('权限不足');
    const { ids, ...rest } = params;
    if (!ids || ids.length === 0) throw new Error('请选择需要操作的履约记录');

    const results = { success: 0, failed: 0, failures: [] };
    const batchId = `BF${Date.now()}`;

    for (const fid of ids) {
      try {
        const f = await HotelFulfillment.findByPk(fid);
        if (!f) { results.failed++; results.failures.push({ id: fid, message: '记录不存在' }); continue; }

        if (f.isSuite && operation === 'batch_verify') {
          if (!checkFulfillSeniorPermission(operator)) {
            results.failed++;
            results.failures.push({ id: fid, name: f.guestName, message: '高端套房需人工专项确认' });
            continue;
          }
        }

        if (operation === 'batch_verify') {
          try {
            await this.verifyCheckIn(fid, operator, { remark: rest.reason });
            results.success++;
          } catch (e) {
            results.failed++;
            results.failures.push({ id: fid, name: f.guestName, message: e.message });
          }
        } else if (operation === 'batch_noshow') {
          await this.markNoShow(fid, rest.reason, operator);
          results.success++;
        } else if (operation === 'batch_delay') {
          const oldVal = f.toJSON();
          await HotelFulfillment.update({
            status: 'delayed',
            fulfillmentType: 'delayed',
            delayReason: rest.reason,
            updatedBy: operator?.name || operator?.username
          }, { where: { id: fid } });
          await writeFulfillLog(fid, f.orderId, f.hotelId, 'delay', operator, {
            oldValue: oldVal, newValue: { ...oldVal, status: 'delayed', fulfillmentType: 'delayed' },
            changeFields: ['status', 'fulfillmentType'],
            reason: rest.reason, isBatch: true, batchId,
            roomOccupancyUpdated: true, orderProgressUpdated: true
          });
          results.success++;
        }
      } catch (e) {
        results.failed++;
        results.failures.push({ id: fid, message: e.message });
      }
    }
    results.batchId = batchId;
    return results;
  },

  async getLogs(fulfillmentId, params = {}) {
    const { page = 1, pageSize = 20 } = params;
    const { count, rows } = await HotelFulfillmentLog.findAndCountAll({
      where: { fulfillmentId },
      offset: (page - 1) * pageSize, limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  },

  async getAllLogs(params = {}) {
    const { page = 1, pageSize = 20, hotelId, operationType } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (operationType) where.operationType = operationType;
    const { count, rows } = await HotelFulfillmentLog.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  }
};

module.exports = HotelFulfillmentService;
