const BaseService = require('./BaseService');
const TicketFulfillment = require('../models/TicketFulfillment');
const TicketFulfillmentLog = require('../models/TicketFulfillmentLog');
const Order = require('../models/Order');
const ScenicSpot = require('../models/ScenicSpot');
const TicketType = require('../models/TicketType');
const TicketInventory = require('../models/TicketInventory');
const { Op, fn, col } = require('sequelize');
const crypto = require('crypto');
const { AppError } = require('../utils/error');

const PERM_VERIFY = ['admin', 'ticket_operator', 'senior_ticket_operator', 'gate_operator', 'gate_supervisor'];
const PERM_BATCH = ['admin', 'senior_ticket_operator'];
const PERM_AUDIT = ['admin', 'senior_ticket_operator', 'fulfillment_auditor'];
const PERM_HANDLE = ['admin', 'senior_ticket_operator', 'fulfillment_auditor'];

const FULFILL_STAGES = ['pending', 'verified', 'expired', 'refund', 'abnormal'];

class TicketFulfillmentService extends BaseService {
  constructor() {
    super(TicketFulfillment);
  }

  checkPermission(userRoles, requiredRoles) {
    if (!userRoles || !userRoles.length) return false;
    return userRoles.some(r => requiredRoles.includes(r));
  }

  hashTicketCode(code) {
    return crypto.createHash('sha256').update(code + 'TICKET_FULFILL_SALT_V1').digest('hex');
  }

  parseTicketCode(rawCode) {
    try {
      if (!rawCode) return { valid: false, error: '票务编码不能为空' };

      const code = String(rawCode).trim();
      if (code.length < 8 || code.length > 128) {
        return { valid: false, error: '票务编码格式错误' };
      }

      if (code.startsWith('TK')) {
        const parts = code.split('-');
        if (parts.length < 4) return { valid: false, error: '票务编码结构不合法' };
        return {
          valid: true,
          ticketCode: code,
          ticketHash: this.hashTicketCode(code),
          prefix: parts[0],
          orderId: parts[1],
          scenicSpotId: Number(parts[2]) || null,
          ticketTypeId: Number(parts[3]) || null
        };
      }

      return {
        valid: true,
        ticketCode: code,
        ticketHash: this.hashTicketCode(code),
        raw: true
      };
    } catch (e) {
      return { valid: false, error: '票务编码解析失败：' + e.message };
    }
  }

  checkOrderStatus(order) {
    if (!order) return { valid: false, error: '关联订单不存在' };
    const paidStatuses = ['paid', 'confirmed', 'part_used'];
    if (!paidStatuses.includes(order.orderStatus)) {
      return { valid: false, error: `订单状态为「${order.orderStatus}」，不允许核销` };
    }
    return { valid: true };
  }

  checkTimeValid(fulfillment, verifyTime = new Date()) {
    const errors = [];
    const warnings = [];

    if (fulfillment.validFrom && verifyTime < new Date(fulfillment.validFrom)) {
      errors.push(`核销时间过早，该票 ${this.formatTime(fulfillment.validFrom)} 才生效`);
    }

    if (fulfillment.validTo && verifyTime > new Date(fulfillment.validTo)) {
      errors.push(`该票已于 ${this.formatTime(fulfillment.validTo)} 过期`);
    }

    if (fulfillment.sessionDate && fulfillment.sessionStartTime && fulfillment.sessionEndTime) {
      const sessionStart = new Date(`${fulfillment.sessionDate}T${fulfillment.sessionStartTime}`);
      const sessionEnd = new Date(`${fulfillment.sessionDate}T${fulfillment.sessionEndTime}`);

      const formatH = (d) => {
        const p = (n) => String(n).padStart(2, '0');
        return `${p(d.getHours())}:${p(d.getMinutes())}`;
      };

      if (fulfillment.validTo) {
        const fiveMinBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
        if (verifyTime < fiveMinBefore) {
          warnings.push(`场次 ${formatH(sessionStart)}-${formatH(sessionEnd)}，建议开场前5分钟核销`);
        }
      }

      if (verifyTime > sessionEnd) {
        errors.push(`场次已于 ${formatH(sessionEnd)} 结束，无法核销`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkUserInfo(fulfillment, verifyData) {
    const errors = [];
    const warnings = [];

    if (verifyData?.userIdCard) {
      if (fulfillment.userIdCard && verifyData.userIdCard !== fulfillment.userIdCard) {
        const last6 = fulfillment.userIdCard.slice(-6);
        if (verifyData.userIdCard.slice(-6) !== last6) {
          errors.push('身份证信息不符，疑似冒用');
        }
      }
    }

    if (verifyData?.userPhone) {
      if (fulfillment.userPhone && verifyData.userPhone !== fulfillment.userPhone) {
        warnings.push('手机号与下单时不一致');
      }
    }

    if (verifyData?.userName) {
      if (fulfillment.userName && verifyData.userName !== fulfillment.userName) {
        warnings.push('姓名与下单时不一致');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkLocation(fulfillment, verifyData, scenicSpot) {
    const errors = [];
    const warnings = [];
    if (!verifyData?.verifyLocation || !scenicSpot?.longitude) {
      return { valid: true, errors, warnings };
    }

    const { lng: vLng, lat: vLat } = verifyData.verifyLocation;
    const sLng = scenicSpot.longitude;
    const sLat = scenicSpot.latitude;

    if (vLng && vLat && sLng && sLat) {
      const dist = this.getDistance(Number(vLat), Number(vLng), Number(sLat), Number(sLng));
      if (dist > 3000) {
        errors.push(`核销位置距景点${Math.round(dist)}米，超出正常入园范围（3公里）`);
      } else if (dist > 500) {
        warnings.push(`核销位置距景点约${Math.round(dist)}米，请确认`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDistance(lat1, lng1, lat2, lng2) {
    const rad = (d) => d * Math.PI / 180.0;
    const R = 6371000;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(rad(lat1)) * Math.cos(rad(lat2))
      * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  checkFakeCode(rawCode, hash) {
    const validPrefixes = ['TK', 'TP', 'TH', 'TG'];
    if (!/^[A-Z0-9\-]{8,128}$/.test(rawCode)) {
      return { valid: false, fake: true, error: '二维码格式异常，疑似伪造' };
    }
    if (rawCode.length < 16) {
      return { valid: false, fake: true, error: '编码长度异常，疑似伪造' };
    }
    return { valid: true, fake: false };
  }

  async getOrCreateFulfillmentFromCode(rawCode, parsed, scenicSpot) {
    let fulfillment = null;

    if (parsed.orderId) {
      fulfillment = await TicketFulfillment.findOne({
        where: { orderId: parsed.orderId },
        include: [
          { model: Order, as: 'order', attributes: ['orderSn', 'orderStatus', 'payStatus'] },
          { model: ScenicSpot, as: 'scenicSpot' },
          { model: TicketType, as: 'ticketType' },
          { model: TicketInventory, as: 'inventory' }
        ]
      });
    }

    if (!fulfillment) {
      fulfillment = await TicketFulfillment.findOne({
        where: {
          [Op.or]: [
            { ticketCode: parsed.ticketCode },
            { ticketHash: parsed.ticketHash }
          ]
        },
        include: [
          { model: Order, as: 'order' },
          { model: ScenicSpot, as: 'scenicSpot' },
          { model: TicketType, as: 'ticketType' },
          { model: TicketInventory, as: 'inventory' }
        ]
      });
    }

    return fulfillment;
  }

  async verifyTicket(rawCode, verifyData, user) {
    if (!this.checkPermission(user.roles, PERM_VERIFY)) {
      throw new AppError('无核销权限', 403);
    }

    const parsed = this.parseTicketCode(rawCode);
    if (!parsed.valid) {
      throw new AppError(parsed.error, 400);
    }

    const fakeCheck = this.checkFakeCode(parsed.ticketCode, parsed.ticketHash);
    const operator = { id: user.id, name: user.name || user.username, roles: user.roles, ip: user.ip, ua: user.ua };
    const verifyTime = new Date();

    const fulfillment = await this.getOrCreateFulfillmentFromCode(rawCode, parsed);

    if (!fulfillment) {
      await TicketFulfillmentLog.create({
        fulfillmentId: 0,
        operationType: 'verify_fail',
        ticketCode: parsed.ticketCode,
        verifyResult: fakeCheck.fake ? 'fake' : 'expired',
        verifyMessage: fakeCheck.error || '核销记录不存在',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.roles[0],
        fakeIndicator: fakeCheck.fake ? 1 : 0,
        ip: operator.ip,
        userAgent: operator.ua
      });
      return {
        success: false,
        blocked: true,
        verifyResult: fakeCheck.fake ? 'fake' : 'expired',
        message: fakeCheck.error || '票务核销记录不存在，请联系客服',
        fakeIndicator: fakeCheck.fake ? 1 : 0
      };
    }

    const scenicSpot = fulfillment.scenicSpot;
    const order = fulfillment.order;
    const ticketType = fulfillment.ticketType;

    fulfillment.verifyCount = (fulfillment.verifyCount || 0) + 1;

    const allErrors = [];
    const allWarnings = [];
    let verifyResult = 'pass';
    let abnormalType = null;
    let fakeIndicator = fulfillment.fakeIndicator || 0;

    if (fakeCheck.fake) {
      verifyResult = 'fake';
      fakeIndicator = 1;
      abnormalType = 'fake';
      allErrors.push(fakeCheck.error);
    }

    const timeCheck = this.checkTimeValid(fulfillment, verifyTime);
    allErrors.push(...timeCheck.errors);
    allWarnings.push(...timeCheck.warnings);

    if (!timeCheck.valid && timeCheck.errors.some(e => e.includes('过期'))) {
      verifyResult = verifyResult === 'pass' ? 'expired' : verifyResult;
      abnormalType = abnormalType || 'time';
    } else if (!timeCheck.valid) {
      verifyResult = verifyResult === 'pass' ? 'time_mismatch' : verifyResult;
      abnormalType = abnormalType || 'time';
    }

    const userCheck = this.checkUserInfo(fulfillment, verifyData);
    if (!userCheck.valid) {
      verifyResult = verifyResult === 'pass' ? 'user_mismatch' : verifyResult;
      abnormalType = abnormalType || 'user_mismatch';
      allErrors.push(...userCheck.errors);
    }
    allWarnings.push(...userCheck.warnings);

    const locCheck = this.checkLocation(fulfillment, verifyData, scenicSpot);
    if (!locCheck.valid) {
      abnormalType = abnormalType || 'location';
      allErrors.push(...locCheck.errors);
    }
    allWarnings.push(...locCheck.warnings);

    if (fulfillment.fulfillStatus === 'verified') {
      verifyResult = 'repeat';
      abnormalType = 'repeat';
      allErrors.unshift(`该票已于 ${this.formatTime(fulfillment.verifiedAt)} 核销，重复核销拦截`);
    }

    if (fulfillment.fulfillStatus === 'expired' || fulfillment.fulfillStatus === 'refund') {
      verifyResult = fulfillment.fulfillStatus === 'expired' ? 'expired' : 'refund';
      allErrors.unshift(`该票状态为「${fulfillment.fulfillStatus === 'expired' ? '已过期' : '已退票'}」`);
    }

    const orderCheck = this.checkOrderStatus(order);
    if (!orderCheck.valid) {
      allErrors.unshift(orderCheck.error);
      verifyResult = verifyResult === 'pass' ? 'order_invalid' : verifyResult;
    }

    const blocked = allErrors.length > 0;
    const conflictRules = allErrors.map(e => ({ field: 'verify', message: e }))
      .concat(allWarnings.map(w => ({ field: 'verify', message: w, level: 'warning' })));

    if (blocked) {
      fulfillment.fulfillStatus = 'abnormal';
      fulfillment.verifyResult = verifyResult;
      fulfillment.isAbnormal = 1;
      fulfillment.abnormalType = abnormalType;
      fulfillment.abnormalReason = allErrors.join('；');
      fulfillment.fakeIndicator = fakeIndicator;
      fulfillment.verifyMessage = allErrors.join('；');
      await fulfillment.save();

      await this.writeLog(fulfillment, {
        operationType: fulfillment.fulfillStatus === 'abnormal' ? 'verify_fail' : 'abnormal_mark',
        stageFrom: fulfillment.fulfillStatus === 'abnormal' ? null : fulfillment.fulfillStatus,
        stageTo: 'abnormal',
        scenicSpotName: scenicSpot?.name,
        userName: fulfillment.userName,
        sessionDate: fulfillment.sessionDate,
        verifyResult,
        verifyMessage: allErrors.join('；'),
        conflictRules,
        fakeIndicator,
        abnormalType,
        operator,
        verifyData,
        reason: allErrors.join('；')
      });

      return {
        success: false,
        blocked: true,
        verifyResult,
        message: allErrors[0],
        warnings: allWarnings,
        fakeIndicator,
        abnormalType,
        fulfillment: fulfillment.toJSON()
      };
    }

    const prevStage = fulfillment.fulfillStatus;
    fulfillment.fulfillStatus = 'verified';
    fulfillment.verifyResult = 'pass';
    fulfillment.verifiedAt = verifyTime;
    fulfillment.firstVerifyAt = fulfillment.firstVerifyAt || verifyTime;
    fulfillment.verifiedBy = operator.id;
    fulfillment.verifiedByName = operator.name;
    fulfillment.verifyDevice = verifyData?.verifyDevice || user.device || null;
    fulfillment.verifyGateway = verifyData?.verifyGateway || null;
    if (verifyData?.verifyLocation) {
      fulfillment.verifyLocation = verifyData.verifyLocation;
    }
    fulfillment.entryCount = (fulfillment.entryCount || 0) + 1;
    fulfillment.isAbnormal = 0;
    fulfillment.verifyMessage = allWarnings.join('；') || null;
    await fulfillment.save();

    if (fulfillment.inventoryId) {
      try {
        const TicketInventoryService = require('./TicketInventoryService');
        await TicketInventoryService.use(
          fulfillment.inventoryId,
          fulfillment.ticketCount || 1,
          fulfillment.orderId,
          fulfillment.userId,
          operator
        );
      } catch (e) { /* ignore inventory error */ }
    }

    if (scenicSpot && fulfillment.sessionDate) {
      try {
        const spotDateKey = `${scenicSpot.id}_${fulfillment.sessionDate}`;
        global._spotDailyStats = global._spotDailyStats || {};
        if (!global._spotDailyStats[spotDateKey]) {
          global._spotDailyStats[spotDateKey] = { count: 0, lastUpdated: null };
        }
        global._spotDailyStats[spotDateKey].count += 1;
        global._spotDailyStats[spotDateKey].lastUpdated = verifyTime;
      } catch (e) { /* ignore stats error */ }
    }

    await this.writeLog(fulfillment, {
      operationType: 'verify',
      stageFrom: prevStage,
      stageTo: 'verified',
      scenicSpotName: scenicSpot?.name,
      userName: fulfillment.userName,
      sessionDate: fulfillment.sessionDate,
      verifyResult: 'pass',
      verifyMessage: allWarnings.join('；') || null,
      conflictRules,
      fakeIndicator,
      abnormalType,
      operator,
      verifyData,
      reason: allWarnings.join('；') || null
    });

    return {
      success: true,
      blocked: false,
      verifyResult: 'pass',
      warnings: allWarnings,
      fulfillment: fulfillment.toJSON(),
      order: order?.toJSON(),
      scenicSpotName: scenicSpot?.name,
      ticketTypeName: ticketType?.name
    };
  }

  async writeLog(fulfillment, params) {
    const { operationType, stageFrom, stageTo, scenicSpotName, userName, sessionDate,
      verifyResult, verifyMessage, conflictRules, fakeIndicator, abnormalType, operator, verifyData, reason } = params;

    await TicketFulfillmentLog.create({
      fulfillmentId: fulfillment.id,
      operationType,
      stageFrom,
      stageTo,
      orderId: fulfillment.orderId,
      ticketCode: fulfillment.ticketCode,
      scenicSpotNameCache: scenicSpotName,
      userNameCache: userName,
      sessionDateCache: sessionDate || fulfillment.sessionDate,
      verifyResult,
      verifyMessage,
      conflictRules,
      operatorId: operator?.id || null,
      operatorName: operator?.name || null,
      operatorRole: operator?.roles?.[0] || null,
      verifyLocation: verifyData?.verifyLocation || fulfillment.verifyLocation || null,
      verifyDevice: verifyData?.verifyDevice || fulfillment.verifyDevice || null,
      verifyGateway: verifyData?.verifyGateway || fulfillment.verifyGateway || null,
      fakeIndicator,
      abnormalType,
      reason,
      ip: operator?.ip || null,
      userAgent: operator?.ua || null
    });
  }

  async list(params) {
    const {
      keyword, orderId, scenicSpotId, scenicSpotName, ticketCategory, fulfillStatus,
      verifyResult, sessionDate, sessionDateFrom, sessionDateTo, abnormalOnly,
      page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC'
    } = params;

    const where = {};
    if (orderId) where.orderId = { [Op.like]: `%${orderId}%` };
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (ticketCategory) where.ticketCategory = ticketCategory;
    if (fulfillStatus) where.fulfillStatus = fulfillStatus;
    if (verifyResult) where.verifyResult = verifyResult;
    if (abnormalOnly === '1' || abnormalOnly === true) where.isAbnormal = 1;
    if (sessionDate) where.sessionDate = sessionDate;
    if (sessionDateFrom) where.sessionDate = { ...where.sessionDate, [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: sessionDateTo };
    if (keyword) {
      where[Op.or] = [
        { ticketCode: { [Op.like]: `%${keyword}%` } },
        { orderId: { [Op.like]: `%${keyword}%` } },
        { userName: { [Op.like]: `%${keyword}%` } },
        { userPhone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const include = [
      { model: Order, as: 'order', attributes: ['orderSn', 'orderStatus', 'payStatus', 'totalAmount'] },
      { model: ScenicSpot, as: 'scenicSpot', attributes: ['id', 'name', 'spotType', 'city'] },
      { model: TicketType, as: 'ticketType', attributes: ['id', 'name', 'ticketCategory', 'price'] }
    ];

    if (scenicSpotName) {
      include[1].where = { name: { [Op.like]: `%${scenicSpotName}%` } };
    }

    const { count, rows } = await TicketFulfillment.findAndCountAll({
      where,
      include,
      order: [[sortBy, sortOrder]],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      distinct: true
    });

    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getStats(params) {
    const { scenicSpotId, sessionDateFrom, sessionDateTo } = params;
    const where = {};
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (sessionDateFrom) where.sessionDate = { [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: sessionDateTo };

    const result = await TicketFulfillment.findAll({
      where,
      attributes: [
        'fulfillStatus',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('ticketCount')), 'ticketTotal'],
        [fn('SUM', col('actualPrice')), 'amountTotal']
      ],
      group: ['fulfillStatus']
    });

    return result.map(r => r.toJSON());
  }

  async batchOperation(data, user) {
    if (!this.checkPermission(user.roles, PERM_BATCH)) {
      throw new AppError('无批量操作权限', 403);
    }

    const { ids, operation, reason, scope = 'local', applyTo = {}, updateFields = {} } = data;
    const operator = { id: user.id, name: user.name || user.username, roles: user.roles, ip: user.ip, ua: user.ua };

    const where = {};
    if (scope === 'local' && ids && ids.length) {
      where.id = { [Op.in]: ids };
    }
    if (applyTo.scenicSpotId) where.scenicSpotId = applyTo.scenicSpotId;
    if (applyTo.sessionDate) where.sessionDate = applyTo.sessionDate;
    if (applyTo.sessionDateFrom) where.sessionDate = { [Op.gte]: applyTo.sessionDateFrom };
    if (applyTo.sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: applyTo.sessionDateTo };
    if (applyTo.fulfillStatus) where.fulfillStatus = applyTo.fulfillStatus;

    if (operation !== 'handle_abnormal' && applyTo.fulfillStatus !== 'verified') {
      where.fulfillStatus = { [Op.ne]: 'verified' };
    }

    const items = await TicketFulfillment.findAll({ where });
    if (!items.length) throw new AppError('没有匹配的核销记录', 400);

    const batchId = 'B' + Date.now();
    const results = [];

    for (const item of items) {
      try {
        let changes = {};
        const stageFrom = item.fulfillStatus;
        let operationType = 'batch';
        let stageTo = null;

        switch (operation) {
          case 'mark_expired': {
            if (item.fulfillStatus === 'pending' && item.validTo && new Date(item.validTo) < new Date()) {
              item.fulfillStatus = 'expired';
              item.expiredAt = new Date();
              stageTo = 'expired';
              operationType = 'expire';
              changes = { fulfillStatus: 'pending→expired' };
            } else if (item.fulfillStatus === 'pending') {
              changes = { skip: '票未过期' };
            }
            break;
          }
          case 'mark_abnormal': {
            if (item.fulfillStatus !== 'abnormal') {
              item.fulfillStatus = 'abnormal';
              item.isAbnormal = 1;
              item.abnormalType = applyTo.abnormalType || 'other';
              item.abnormalReason = reason;
              stageTo = 'abnormal';
              operationType = 'abnormal_mark';
              changes = { fulfillStatus: `${stageFrom}→abnormal`, abnormalType: applyTo.abnormalType };
            }
            break;
          }
          case 'handle_abnormal': {
            if (item.isAbnormal) {
              item.abnormalHandled = 1;
              item.abnormalHandledAt = new Date();
              item.abnormalHandledBy = operator.id;
              if (updateFields.correctStatus) {
                item.fulfillStatus = updateFields.correctStatus;
                item.isAbnormal = updateFields.correctStatus !== 'abnormal' ? 0 : 1;
                stageTo = updateFields.correctStatus;
              }
              operationType = 'abnormal_handle';
              changes = { abnormalHandled: true, correctStatus: updateFields.correctStatus };
            }
            break;
          }
          case 'sync_fulfillment': {
            const order = await Order.findOne({ where: { orderSn: item.orderId } });
            if (order) {
              let consistent = true;
              if (order.orderStatus === 'paid' && item.fulfillStatus === 'expired') {
                consistent = false;
              }
              if (order.orderStatus === 'refunded' && item.fulfillStatus !== 'refund') {
                item.fulfillStatus = 'refund';
                item.refundAt = new Date();
                item.refundAmount = order.refundAmount || 0;
                item.refundReason = '数据同步';
                consistent = false;
                stageTo = 'refund';
                changes = { fulfillSync: `${item.fulfillStatus}→refund` };
              }
              if (consistent) {
                item.dataConsistency = 'consistent';
                changes = { consistent: true };
              } else {
                item.dataConsistency = 'repaired';
                operationType = 'sync';
              }
            }
            break;
          }
          case 'force_void': {
            if (item.fulfillStatus === 'pending' || item.fulfillStatus === 'abnormal') {
              item.fulfillStatus = 'expired';
              item.expiredAt = new Date();
              item.isAbnormal = 0;
              stageTo = 'expired';
              operationType = 'expire';
              changes = { fulfillStatus: `${stageFrom}→expired`, forced: true };
            }
            break;
          }
          default:
            continue;
        }

        if (Object.keys(changes).length) {
          await item.save();
          await TicketFulfillmentLog.create({
            fulfillmentId: item.id,
            operationType,
            stageFrom,
            stageTo,
            orderId: item.orderId,
            ticketCode: item.ticketCode,
            sessionDateCache: item.sessionDate,
            scenicSpotNameCache: applyTo.scenicSpotName || null,
            userNameCache: item.userName,
            verifyResult: 'pass',
            operatorId: operator.id,
            operatorName: operator.name,
            operatorRole: operator.roles[0],
            batchId,
            reason,
            dataIntegrity: changes,
            ip: operator.ip,
            userAgent: operator.ua
          });

          results.push({ id: item.id, success: true, changes });
        } else {
          results.push({ id: item.id, success: false, message: changes.skip || '无变更' });
        }
      } catch (err) {
        results.push({ id: item.id, success: false, message: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return { batchId, total: results.length, success: successCount, failed: results.length - successCount, results };
  }

  async checkFulfillmentIntegrity(id) {
    const fulfillment = await TicketFulfillment.findByPk(id, {
      include: [
        { model: Order, as: 'order' },
        { model: ScenicSpot, as: 'scenicSpot' },
        { model: TicketType, as: 'ticketType' },
        { model: TicketInventory, as: 'inventory' }
      ]
    });
    if (!fulfillment) throw new AppError('核销记录不存在', 404);

    const result = {
      id,
      orderConsistent: true,
      inventoryConsistent: true,
      spotConsistent: true,
      timeConsistent: true,
      userConsistent: true,
      issues: []
    };

    if (fulfillment.order) {
      const paid = ['paid', 'confirmed', 'part_used', 'used'];
      if (fulfillment.fulfillStatus === 'verified' && !paid.includes(fulfillment.order.orderStatus)) {
        result.orderConsistent = false;
        result.issues.push('订单状态与核销状态不一致（已核销但订单未完成支付）');
      }
      if (fulfillment.fulfillStatus === 'refund' && fulfillment.order.orderStatus !== 'refunded') {
        result.orderConsistent = false;
        result.issues.push('订单状态与退款状态不一致');
      }
    } else {
      result.orderConsistent = false;
      result.issues.push('关联订单不存在');
    }

    if (fulfillment.inventory && fulfillment.fulfillStatus === 'verified') {
      const available = fulfillment.inventory.totalQuota - fulfillment.inventory.reservedCount
        - fulfillment.inventory.usedCount - fulfillment.inventory.lockedCount;
      if (available < 0) {
        result.inventoryConsistent = false;
        result.issues.push('核销后库存数量不一致');
      }
    }

    if (fulfillment.scenicSpot) {
      if (fulfillment.scenicSpot.status !== 'normal') {
        result.spotConsistent = false;
        result.issues.push('景点状态异常（未开放/已停业）');
      }
    } else {
      result.spotConsistent = false;
      result.issues.push('关联景点不存在');
    }

    if (fulfillment.verifiedAt && fulfillment.sessionDate) {
      const verifyDate = new Date(fulfillment.verifiedAt);
      const sessionD = new Date(fulfillment.sessionDate);
      if (verifyDate.toDateString() !== sessionD.toDateString()) {
        if (fulfillment.sessionStartTime) {
          const sessionStart = new Date(`${fulfillment.sessionDate}T${fulfillment.sessionStartTime}`);
          if (verifyDate > new Date(sessionStart.getTime() + 24 * 3600 * 1000)) {
            result.timeConsistent = false;
            result.issues.push('核销时间与会场时间间隔超过24小时');
          }
        }
      }
    }

    result.overall = result.orderConsistent && result.inventoryConsistent && result.spotConsistent && result.timeConsistent;
    return result;
  }

  async checkExpired() {
    const now = new Date();
    const where = {
      fulfillStatus: 'pending',
      validTo: { [Op.lt]: now }
    };

    const items = await TicketFulfillment.findAll({ where });
    const results = [];
    const operator = { id: null, name: 'system', roles: ['system'] };

    for (const item of items) {
      try {
        item.fulfillStatus = 'expired';
        item.expiredAt = now;
        await item.save();

        await TicketFulfillmentLog.create({
          fulfillmentId: item.id,
          operationType: 'expire',
          stageFrom: 'pending',
          stageTo: 'expired',
          orderId: item.orderId,
          ticketCode: item.ticketCode,
          sessionDateCache: item.sessionDate,
          reason: '系统自动过期',
          operatorName: 'system'
        });

        results.push(item.id);
      } catch (e) { /* ignore */ }
    }

    return { expiredCount: results.length, expiredIds: results };
  }

  async getLogs(id, params) {
    const { page = 1, pageSize = 20, operationType } = params;
    const where = { fulfillmentId: id };
    if (operationType) where.operationType = operationType;

    const { count, rows } = await TicketFulfillmentLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getAllLogs(params) {
    const {
      page = 1, pageSize = 20, operationType, scenicSpotName,
      operatorName, sessionDateFrom, sessionDateTo, orderId, ticketCode
    } = params;
    const where = {};
    if (operationType) where.operationType = operationType;
    if (scenicSpotName) where.scenicSpotNameCache = { [Op.like]: `%${scenicSpotName}%` };
    if (operatorName) where.operatorName = { [Op.like]: `%${operatorName}%` };
    if (orderId) where.orderId = { [Op.like]: `%${orderId}%` };
    if (ticketCode) where.ticketCode = { [Op.like]: `%${ticketCode}%` };
    if (sessionDateFrom) where.sessionDateCache = { [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDateCache = { ...where.sessionDateCache, [Op.lte]: sessionDateTo };

    const { count, rows } = await TicketFulfillmentLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  formatTime(t) {
    if (!t) return '-';
    const d = new Date(t);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  checkPermissionEndpoint(type, user) {
    let required = [];
    switch (type) {
      case 'verify':
        required = PERM_VERIFY;
        break;
      case 'batch':
        required = PERM_BATCH;
        break;
      case 'audit':
        required = PERM_AUDIT;
        break;
      case 'handle':
        required = PERM_HANDLE;
        break;
      default:
        required = ['admin'];
    }
    return { allowed: this.checkPermission(user.roles, required), roles: required };
  }
}

module.exports = new TicketFulfillmentService();
