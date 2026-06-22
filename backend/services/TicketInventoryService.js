const BaseService = require('./BaseService');
const TicketInventory = require('../models/TicketInventory');
const TicketInventoryLog = require('../models/TicketInventoryLog');
const ScenicSpot = require('../models/ScenicSpot');
const TicketType = require('../models/TicketType');
const { Op, QueryTypes, fn, col } = require('sequelize');
const { AppError } = require('../utils/error');

const PERM_INV_OPS = ['admin', 'ticket_operator', 'senior_ticket_operator', 'inventory_operator'];
const PERM_BATCH = ['admin', 'senior_ticket_operator'];
const PERM_REVIEW = ['admin', 'senior_ticket_operator', 'inventory_auditor'];
const PERM_INV_AUDIT = ['admin', 'senior_ticket_operator', 'inventory_auditor'];

const SESSION_TYPES = ['daily', 'weekend', 'holiday', 'performance'];

const SPOT_TYPE_INVENTORY_RULES = {
  natural: {
    allowedSessionTypes: ['daily', 'weekend', 'holiday'],
    maxQuotaPerSession: 2000,
    minIntervalMinutes: 60,
    requireReservation: false,
    autoCloseMinutes: 30
  },
  cultural: {
    allowedSessionTypes: ['daily', 'weekend', 'holiday'],
    maxQuotaPerSession: 1500,
    minIntervalMinutes: 60,
    requireReservation: false,
    autoCloseMinutes: 30
  },
  theme: {
    allowedSessionTypes: ['daily', 'weekend', 'holiday', 'performance'],
    maxQuotaPerSession: 5000,
    minIntervalMinutes: 30,
    requireReservation: true,
    autoCloseMinutes: 60
  },
  performance: {
    allowedSessionTypes: ['performance', 'holiday'],
    maxQuotaPerSession: 1000,
    minIntervalMinutes: 120,
    requireReservation: true,
    autoCloseMinutes: 120,
    requiresReview: true
  }
};

const TRACKABLE_FIELDS = [
  'totalQuota', 'lockedCount', 'perOrderLimit', 'minAdvanceHours',
  'maxAdvanceDays', 'autoCloseMinutes', 'status', 'requiresReview', 'remark'
];

class TicketInventoryService extends BaseService {
  constructor() {
    super(TicketInventory);
  }

  checkPermission(userRoles, requiredRoles) {
    if (!userRoles || !userRoles.length) return false;
    return userRoles.some(r => requiredRoles.includes(r));
  }

  async getScenicSpot(spotId) {
    return ScenicSpot.findByPk(spotId);
  }

  async getTicketType(typeId) {
    return TicketType.findByPk(typeId);
  }

  checkSessionTypeRule(sessionType, spotType) {
    const errors = [];
    const warnings = [];
    const rule = SPOT_TYPE_INVENTORY_RULES[spotType] || SPOT_TYPE_INVENTORY_RULES.natural;

    if (!rule.allowedSessionTypes.includes(sessionType)) {
      errors.push(`该景点类型不支持${this.getSessionTypeLabel(sessionType)}`);
    }

    if (sessionType === 'performance' && spotType !== 'performance' && spotType !== 'theme') {
      warnings.push('专属展演场次建议仅用于主题乐园或特色展演类景点');
    }

    if (sessionType === 'weekend') {
      warnings.push('周末场次将自动匹配周六周日，请确保日期正确');
    }

    if (sessionType === 'holiday') {
      warnings.push('节假日场次优先级最高，将覆盖同日期的日常/周末场次');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkTimeRule(startTime, endTime, sessionType, spotType, existingSessions = []) {
    const errors = [];
    const warnings = [];
    const rule = SPOT_TYPE_INVENTORY_RULES[spotType] || SPOT_TYPE_INVENTORY_RULES.natural;

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(startTime)) errors.push('开始时间格式必须为 HH:mm');
    if (!timePattern.test(endTime)) errors.push('结束时间格式必须为 HH:mm');

    if (errors.length) return { valid: false, errors, warnings };

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startMin = toMin(startTime);
    const endMin = toMin(endTime);

    if (startMin >= endMin) {
      errors.push('场次结束时间必须晚于开始时间');
    }

    const duration = endMin - startMin;
    if (duration < 30) {
      warnings.push('场次时长小于30分钟，建议适当延长');
    }

    if (startMin < 6 * 60 || endMin > 23 * 60) {
      warnings.push('场次时间超出常规营业时间 06:00-23:00，请确认');
    }

    if (existingSessions.length) {
      for (const sess of existingSessions) {
        const sMin = toMin(sess.startTime);
        const eMin = toMin(sess.endTime);
        if (!(endMin + rule.minIntervalMinutes <= sMin || startMin >= eMin + rule.minIntervalMinutes)) {
          errors.push(`与 ${sess.startTime}-${sess.endTime} 场次时间间隔不足${rule.minIntervalMinutes}分钟`);
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkQuotaRule(totalQuota, lockedCount, reservedCount, usedCount, spotType, ticketType) {
    const errors = [];
    const warnings = [];
    const rule = SPOT_TYPE_INVENTORY_RULES[spotType] || SPOT_TYPE_INVENTORY_RULES.natural;

    if (totalQuota < 0) {
      errors.push('库存配额不能为负数');
    }
    if (lockedCount < 0) {
      errors.push('锁定数量不能为负数');
    }

    const available = totalQuota - reservedCount - usedCount - lockedCount;
    if (available < 0) {
      errors.push('可用库存不足，总配额小于已占用+锁定数量');
    }

    if (totalQuota > rule.maxQuotaPerSession) {
      errors.push(`单场次最大配额不能超过${rule.maxQuotaPerSession}`);
    }

    if (ticketType) {
      const dailyQuota = ticketType.dailyQuota || 0;
      if (dailyQuota > 0 && totalQuota > dailyQuota) {
        warnings.push(`单场次配额超过票种日配额 ${dailyQuota}，请确认`);
      }
    }

    if (totalQuota > 0 && totalQuota <= 50) {
      warnings.push('库存配额较小，建议关注库存不足情况');
    }

    if (lockedCount > totalQuota * 0.3) {
      warnings.push('锁定数量超过总配额30%，建议释放部分库存');
    }

    const isOverQuota = totalQuota > rule.maxQuotaPerSession * 0.9;

    return { valid: errors.length === 0, errors, warnings, isOverQuota };
  }

  checkAdvanceRule(minAdvanceHours, maxAdvanceDays, autoCloseMinutes, spotType) {
    const errors = [];
    const warnings = [];
    const rule = SPOT_TYPE_INVENTORY_RULES[spotType] || SPOT_TYPE_INVENTORY_RULES.natural;

    if (minAdvanceHours < 0) errors.push('最少提前预约小时数不能为负');
    if (maxAdvanceDays < 0) errors.push('最多可预约天数不能为负');
    if (autoCloseMinutes < 0) errors.push('自动关闭分钟数不能为负');

    if (minAdvanceHours > maxAdvanceDays * 24) {
      errors.push('最少提前小时数不能超过最大可预约天数');
    }

    if (rule.requireReservation && minAdvanceHours === 0) {
      warnings.push('该景点类型建议设置提前预约时间');
    }

    if (autoCloseMinutes === 0 && rule.autoCloseMinutes > 0) {
      warnings.push(`建议设置开场前${rule.autoCloseMinutes}分钟自动关闭预约`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async checkConflicts(data, excludeId = null) {
    const errors = [];
    const conflictRules = [];

    const where = {
      scenicSpotId: data.scenicSpotId,
      ticketTypeId: data.ticketTypeId,
      sessionDate: data.sessionDate
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const existing = await TicketInventory.findAll({ where });
    if (!existing.length) return { valid: true, errors: [], conflictRules: [] };

    for (const sess of existing) {
      if (sess.sessionType === 'holiday' && data.sessionType !== 'holiday') {
        warnings.push('该日期已存在节假日场次，将覆盖当前场次');
        conflictRules.push({
          field: 'sessionDate',
          message: '同日期已存在节假日场次，节假日场次优先级最高',
          conflictingId: sess.id
        });
      }

      const toMin = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const sMin = toMin(sess.startTime);
      const eMin = toMin(sess.endTime);
      const nsMin = toMin(data.startTime);
      const neMin = toMin(data.endTime);

      if (!(neMin <= sMin || nsMin >= eMin)) {
        if (sess.sessionType === data.sessionType) {
          errors.push(`与同类型场次 ${sess.sessionName || sess.startTime} 时间重叠`);
          conflictRules.push({
            field: 'startTime',
            message: `与场次ID ${sess.id} 时间重叠`,
            conflictingId: sess.id
          });
        }
      }

      if (sess.sessionName && data.sessionName && sess.sessionName === data.sessionName) {
        errors.push(`同日期已存在名称为 "${data.sessionName}" 的场次`);
        conflictRules.push({
          field: 'sessionName',
          message: `场次名称重复`,
          conflictingId: sess.id
        });
      }
    }

    return { valid: errors.length === 0, errors, conflictRules };
  }

  checkFakeIndicators(data, scenicSpot) {
    const errors = [];
    const warnings = [];
    let isFake = 0;

    if (data.totalQuota < 0) {
      isFake = 1;
      errors.push('库存配额不能为负，疑似虚假库存');
    }

    if (scenicSpot && scenicSpot.dailyMaxVisitors) {
      if (data.totalQuota > scenicSpot.dailyMaxVisitors * 2) {
        isFake = 1;
        errors.push(`库存超过景点日限流${scenicSpot.dailyMaxVisitors}人的2倍，疑似虚假库存`);
      }
    }

    if (data.totalQuota > 0 && data.totalQuota < data.reservedCount + data.usedCount) {
      isFake = 1;
      errors.push('总库存小于已占用数量，数据异常');
    }

    if (data.sessionType === 'performance' && !data.requiresReview) {
      warnings.push('专属展演场次建议开启人工复核');
    }

    return { valid: errors.length === 0, errors, warnings, isFake };
  }

  computeStatus(inventory) {
    const now = new Date();
    const sessionDateTime = new Date(`${inventory.sessionDate}T${inventory.startTime}`);

    if (inventory.status === 'closed' || inventory.status === 'expired') {
      return inventory.status;
    }

    if (sessionDateTime < now) {
      return 'expired';
    }

    const autoCloseMs = (inventory.autoCloseMinutes || 0) * 60 * 1000;
    if (autoCloseMs > 0 && new Date(sessionDateTime.getTime() - autoCloseMs) < now) {
      return 'closed';
    }

    const available = inventory.totalQuota - inventory.reservedCount - inventory.usedCount - inventory.lockedCount;
    if (available <= 0) {
      return 'sold_out';
    }

    if (inventory.status === 'locked') {
      return 'locked';
    }

    return 'active';
  }

  computeDisplayOrder(data, scenicSpot) {
    let weight = 0;
    const typeOrder = { holiday: 4, performance: 3, weekend: 2, daily: 1 };
    weight += (typeOrder[data.sessionType] || 0) * 1000;

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    weight += 1440 - toMin(data.startTime);

    if (data.totalQuota > 0) {
      const ratio = (data.totalQuota - data.reservedCount - data.usedCount - data.lockedCount) / data.totalQuota;
      weight += Math.floor(ratio * 100);
    }

    if (scenicSpot && scenicSpot.status === 'normal') weight += 50;

    return weight;
  }

  buildChangeList(oldData, newData) {
    const changes = [];
    const FIELD_LABELS = {
      totalQuota: '总配额',
      lockedCount: '锁定数量',
      perOrderLimit: '单次限购',
      minAdvanceHours: '最少提前小时',
      maxAdvanceDays: '最大预约天数',
      autoCloseMinutes: '自动关闭分钟',
      status: '状态',
      requiresReview: '需人工复核',
      remark: '备注'
    };

    for (const field of TRACKABLE_FIELDS) {
      const oldVal = oldData[field];
      const newVal = newData[field];
      if (oldVal !== newVal) {
        changes.push({
          field,
          fieldLabel: FIELD_LABELS[field] || field,
          oldValue: oldVal,
          newValue: newVal
        });
      }
    }
    return changes;
  }

  async writeLog(inventory, operationType, params, user, operator, verifyResult = 'pass', conflictRules = []) {
    const changeList = params.changes || [];
    let changeType = params.changeType || null;
    let oldValue = params.oldValue ?? null;
    let newValue = params.newValue ?? null;
    let diffValue = params.diffValue ?? null;

    if (changeList.length === 1) {
      changeType = changeList[0].field;
      oldValue = changeList[0].oldValue;
      newValue = changeList[0].newValue;
      diffValue = Number(newValue) - Number(oldValue);
    }

    const reviewRequired = inventory.requiresReview === 1 && operationType !== 'verify';

    await TicketInventoryLog.create({
      inventoryId: inventory.id,
      operationType,
      changeType,
      oldValue,
      newValue,
      diffValue,
      orderId: params.orderId || null,
      userId: params.userId || null,
      operatorId: operator?.id || null,
      operatorName: operator?.name || null,
      operatorRole: operator?.roles?.[0] || null,
      sessionTypeCache: inventory.sessionType,
      scenicSpotNameCache: params.scenicSpotName || null,
      sessionDateCache: inventory.sessionDate,
      sessionNameCache: inventory.sessionName,
      verifyResult,
      verifyMessage: params.verifyMessage || null,
      conflictRules,
      reason: params.reason || null,
      batchId: params.batchId || null,
      isOverQuota: inventory.isOverQuota,
      reviewRequired,
      reviewStatus: reviewRequired ? 'pending' : null,
      ip: operator?.ip || null,
      userAgent: operator?.ua || null
    });
  }

  async list(params) {
    const {
      keyword, scenicSpotId, ticketTypeId, sessionType, sessionDate,
      sessionDateFrom, sessionDateTo, status, page = 1, pageSize = 20,
      sortBy = 'sessionDate', sortOrder = 'DESC'
    } = params;

    const where = {};
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (ticketTypeId) where.ticketTypeId = ticketTypeId;
    if (sessionType) where.sessionType = sessionType;
    if (sessionDate) where.sessionDate = sessionDate;
    if (sessionDateFrom) where.sessionDate = { ...where.sessionDate, [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: sessionDateTo };
    if (status) where.status = status;

    const include = [
      { model: ScenicSpot, as: 'scenicSpot', attributes: ['id', 'name', 'spotType', 'city', 'dailyMaxVisitors'] },
      { model: TicketType, as: 'ticketType', attributes: ['id', 'name', 'ticketCategory', 'price'] }
    ];

    const { count, rows } = await TicketInventory.findAndCountAll({
      where,
      include,
      order: [[sortBy, sortOrder], ['startTime', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    const list = rows.map(r => {
      const obj = r.toJSON();
      obj.availableCount = obj.totalQuota - obj.reservedCount - obj.usedCount - obj.lockedCount;
      obj.sellRate = obj.totalQuota > 0 ? Math.round((obj.reservedCount / obj.totalQuota) * 100) : 0;
      return obj;
    });

    return { list, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getStats(params) {
    const { scenicSpotId, sessionDateFrom, sessionDateTo } = params;
    const where = {};
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (sessionDateFrom) where.sessionDate = { [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: sessionDateTo };

    const stats = await TicketInventory.findAll({
      where,
      attributes: [
        'sessionType',
        [fn('SUM', col('totalQuota')), 'totalQuota'],
        [fn('SUM', col('reservedCount')), 'reservedCount'],
        [fn('SUM', col('usedCount')), 'usedCount'],
        [fn('SUM', col('lockedCount')), 'lockedCount'],
        [fn('COUNT', col('id')), 'sessionCount']
      ],
      group: ['sessionType']
    });

    return stats.map(s => s.toJSON());
  }

  async create(params, user) {
    if (!this.checkPermission(user.roles, PERM_INV_OPS)) {
      throw new AppError('无库存配置权限', 403);
    }

    const scenicSpot = await this.getScenicSpot(params.scenicSpotId);
    if (!scenicSpot) {
      throw new AppError('景点不存在', 404);
    }
    if (scenicSpot.status !== 'normal') {
      throw new AppError('景点未开放或已停业，无法配置库存');
    }

    const ticketType = await this.getTicketType(params.ticketTypeId);
    if (!ticketType) {
      throw new AppError('票种不存在', 404);
    }
    if (ticketType.status !== 'online' || !ticketType.enabled) {
      throw new AppError('票种未上架或已停用，无法配置库存');
    }

    const allErrors = [];
    const allWarnings = [];
    const conflictRules = [];
    let verifyResult = 'pass';

    const sessionTypeCheck = this.checkSessionTypeRule(params.sessionType, scenicSpot.spotType);
    allErrors.push(...sessionTypeCheck.errors);
    allWarnings.push(...sessionTypeCheck.warnings);

    const rule = SPOT_TYPE_INVENTORY_RULES[scenicSpot.spotType] || SPOT_TYPE_INVENTORY_RULES.natural;
    if (params.autoCloseMinutes === undefined) params.autoCloseMinutes = rule.autoCloseMinutes;
    if (params.requiresReview === undefined) params.requiresReview = rule.requiresReview ? 1 : 0;

    const existing = await TicketInventory.findAll({
      where: {
        scenicSpotId: params.scenicSpotId,
        ticketTypeId: params.ticketTypeId,
        sessionDate: params.sessionDate
      }
    });

    const timeCheck = this.checkTimeRule(
      params.startTime, params.endTime, params.sessionType, scenicSpot.spotType, existing
    );
    allErrors.push(...timeCheck.errors);
    allWarnings.push(...timeCheck.warnings);

    const quotaCheck = this.checkQuotaRule(
      params.totalQuota, params.lockedCount || 0, 0, 0, scenicSpot.spotType, ticketType
    );
    allErrors.push(...quotaCheck.errors);
    allWarnings.push(...quotaCheck.warnings);

    const advanceCheck = this.checkAdvanceRule(
      params.minAdvanceHours || 0,
      params.maxAdvanceDays || 30,
      params.autoCloseMinutes,
      scenicSpot.spotType
    );
    allErrors.push(...advanceCheck.errors);
    allWarnings.push(...advanceCheck.warnings);

    const conflictCheck = await this.checkConflicts(params);
    allErrors.push(...conflictCheck.errors);
    conflictRules.push(...conflictCheck.conflictRules);

    const fakeCheck = this.checkFakeIndicators(params, scenicSpot);
    allErrors.push(...fakeCheck.errors);
    allWarnings.push(...fakeCheck.warnings);

    if (allErrors.length) {
      verifyResult = 'block';
      params.status = 'locked';
      params.isOverQuota = quotaCheck.isOverQuota ? 1 : 0;
      params.fakeIndicator = fakeCheck.isFake;
      params.warningMessage = allWarnings.join('；') || null;
      params.displayOrder = this.computeDisplayOrder(params, scenicSpot);

      const inventory = await TicketInventory.create(params);
      await this.writeLog(inventory, 'create', {
        changes: [{ field: 'status', fieldLabel: '状态', oldValue: null, newValue: 'locked' }],
        verifyMessage: allErrors.join('；'),
        scenicSpotName: scenicSpot.name,
        reason: params.reason
      }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua }, verifyResult, conflictRules);

      return {
        ...inventory.toJSON(),
        verifyResult,
        errors: allErrors,
        warnings: allWarnings,
        conflictRules,
        blocked: true
      };
    }

    if (allWarnings.length) verifyResult = 'warning';
    params.isOverQuota = quotaCheck.isOverQuota ? 1 : 0;
    params.fakeIndicator = fakeCheck.isFake;
    params.warningMessage = allWarnings.join('；') || null;
    params.displayOrder = this.computeDisplayOrder(params, scenicSpot);
    params.status = this.computeStatus(params);

    const inventory = await TicketInventory.create(params);
    await this.writeLog(inventory, 'create', {
      changes: [],
      verifyMessage: allWarnings.join('；') || null,
      scenicSpotName: scenicSpot.name,
      reason: params.reason
    }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua }, verifyResult, conflictRules);

    return {
      ...inventory.toJSON(),
      verifyResult,
      warnings: allWarnings
    };
  }

  async update(id, params, user) {
    if (!this.checkPermission(user.roles, PERM_INV_OPS)) {
      throw new AppError('无库存配置权限', 403);
    }

    const inventory = await TicketInventory.findByPk(id, {
      include: [
        { model: ScenicSpot, as: 'scenicSpot' },
        { model: TicketType, as: 'ticketType' }
      ]
    });
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    const scenicSpot = inventory.scenicSpot;
    const ticketType = inventory.ticketType;
    const oldData = inventory.toJSON();

    const allErrors = [];
    const allWarnings = [];
    const conflictRules = [];
    let verifyResult = 'pass';

    const newData = { ...oldData, ...params };

    if (params.sessionType || params.startTime || params.endTime) {
      const sessionTypeCheck = this.checkSessionTypeRule(newData.sessionType, scenicSpot.spotType);
      allErrors.push(...sessionTypeCheck.errors);
      allWarnings.push(...sessionTypeCheck.warnings);

      const existing = await TicketInventory.findAll({
        where: {
          scenicSpotId: inventory.scenicSpotId,
          ticketTypeId: inventory.ticketTypeId,
          sessionDate: inventory.sessionDate,
          id: { [Op.ne]: id }
        }
      });

      const timeCheck = this.checkTimeRule(
        newData.startTime, newData.endTime, newData.sessionType, scenicSpot.spotType, existing
      );
      allErrors.push(...timeCheck.errors);
      allWarnings.push(...timeCheck.warnings);
    }

    if (params.totalQuota !== undefined || params.lockedCount !== undefined) {
      const quotaCheck = this.checkQuotaRule(
        params.totalQuota ?? inventory.totalQuota,
        params.lockedCount ?? inventory.lockedCount,
        inventory.reservedCount,
        inventory.usedCount,
        scenicSpot.spotType,
        ticketType
      );
      allErrors.push(...quotaCheck.errors);
      allWarnings.push(...quotaCheck.warnings);
      newData.isOverQuota = quotaCheck.isOverQuota ? 1 : 0;

      const fakeCheck = this.checkFakeIndicators(newData, scenicSpot);
      allErrors.push(...fakeCheck.errors);
      allWarnings.push(...fakeCheck.warnings);
      newData.fakeIndicator = fakeCheck.isFake;
    }

    if (params.minAdvanceHours !== undefined || params.maxAdvanceDays !== undefined || params.autoCloseMinutes !== undefined) {
      const advanceCheck = this.checkAdvanceRule(
        params.minAdvanceHours ?? inventory.minAdvanceHours,
        params.maxAdvanceDays ?? inventory.maxAdvanceDays,
        params.autoCloseMinutes ?? inventory.autoCloseMinutes,
        scenicSpot.spotType
      );
      allErrors.push(...advanceCheck.errors);
      allWarnings.push(...advanceCheck.warnings);
    }

    if (allErrors.length) {
      verifyResult = 'block';
      const fakeCheck = this.checkFakeIndicators(newData, scenicSpot);
      newData.fakeIndicator = fakeCheck.isFake;
      newData.warningMessage = allWarnings.join('；') || null;
      newData.displayOrder = this.computeDisplayOrder(newData, scenicSpot);
      newData.status = 'locked';

      const changes = this.buildChangeList(oldData, newData);
      await inventory.update(newData);
      await this.writeLog(inventory, 'adjust', {
        changes,
        changeType: 'status',
        oldValue: oldData.status,
        newValue: 'locked',
        diffValue: 0,
        verifyMessage: allErrors.join('；'),
        scenicSpotName: scenicSpot.name,
        reason: params.reason
      }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua }, verifyResult, conflictRules);

      return {
        ...inventory.toJSON(),
        verifyResult,
        errors: allErrors,
        warnings: allWarnings,
        conflictRules,
        blocked: true,
        changes
      };
    }

    if (allWarnings.length) verifyResult = 'warning';
    newData.warningMessage = allWarnings.join('；') || null;
    newData.displayOrder = this.computeDisplayOrder(newData, scenicSpot);
    newData.status = this.computeStatus(newData);

    const changes = this.buildChangeList(oldData, newData);
    await inventory.update(newData);
    await this.writeLog(inventory, 'adjust', {
      changes,
      verifyMessage: allWarnings.join('；') || null,
      scenicSpotName: scenicSpot.name,
      reason: params.reason
    }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua }, verifyResult, conflictRules);

    return {
      ...inventory.toJSON(),
      verifyResult,
      warnings: allWarnings,
      changes
    };
  }

  async setStatus(id, status, reason, user) {
    if (!this.checkPermission(user.roles, PERM_INV_OPS)) {
      throw new AppError('无权限操作', 403);
    }

    const inventory = await TicketInventory.findByPk(id, {
      include: [{ model: ScenicSpot, as: 'scenicSpot' }]
    });
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    const oldStatus = inventory.status;
    inventory.status = status;
    await inventory.save();

    await this.writeLog(inventory, status === 'locked' ? 'lock' : status === 'active' ? 'unlock' : 'close', {
      changes: [{ field: 'status', fieldLabel: '状态', oldValue: oldStatus, newValue: status }],
      changeType: 'status',
      oldValue: oldStatus,
      newValue: status,
      scenicSpotName: inventory.scenicSpot?.name,
      reason
    }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua });

    return inventory;
  }

  async occupy(inventoryId, count, orderId, userId, operator) {
    const inventory = await TicketInventory.findByPk(inventoryId);
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    if (inventory.status !== 'active') {
      throw new AppError(`库存状态为${inventory.status}，不可占用`, 400);
    }

    const available = inventory.totalQuota - inventory.reservedCount - inventory.usedCount - inventory.lockedCount;
    if (available < count) {
      throw new AppError('可用库存不足', 400);
    }

    inventory.reservedCount += count;
    inventory.status = this.computeStatus(inventory);
    await inventory.save();

    await this.writeLog(inventory, 'occupy', {
      changeType: 'total',
      oldValue: inventory.reservedCount - count,
      newValue: inventory.reservedCount,
      diffValue: count,
      orderId,
      userId
    }, null, operator || {});

    return inventory;
  }

  async release(inventoryId, count, orderId, userId, operator) {
    const inventory = await TicketInventory.findByPk(inventoryId);
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    if (inventory.reservedCount < count) {
      throw new AppError('释放数量超过已占用数量', 400);
    }

    inventory.reservedCount -= count;
    inventory.cancelledCount += count;
    inventory.status = this.computeStatus(inventory);
    await inventory.save();

    await this.writeLog(inventory, 'release', {
      changeType: 'total',
      oldValue: inventory.reservedCount + count,
      newValue: inventory.reservedCount,
      diffValue: -count,
      orderId,
      userId
    }, null, operator || {});

    return inventory;
  }

  async use(inventoryId, count, orderId, userId, operator) {
    const inventory = await TicketInventory.findByPk(inventoryId);
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    if (inventory.reservedCount < count) {
      throw new AppError('核销数量超过已预约数量', 400);
    }

    inventory.reservedCount -= count;
    inventory.usedCount += count;
    inventory.status = this.computeStatus(inventory);
    await inventory.save();

    await this.writeLog(inventory, 'use', {
      changeType: 'total',
      oldValue: inventory.reservedCount + count,
      newValue: inventory.reservedCount,
      diffValue: -count,
      orderId,
      userId
    }, null, operator || {});

    return inventory;
  }

  async batchOperation(data, user) {
    if (!this.checkPermission(user.roles, PERM_BATCH)) {
      throw new AppError('无批量操作权限', 403);
    }

    const { ids, operation, reason, scope = 'global', applyTo = {}, updateFields = {} } = data;

    const where = {};
    if (scope === 'local' && ids && ids.length) {
      where.id = { [Op.in]: ids };
    }
    if (applyTo.scenicSpotId) where.scenicSpotId = applyTo.scenicSpotId;
    if (applyTo.sessionType) where.sessionType = applyTo.sessionType;
    if (applyTo.sessionDateFrom) where.sessionDate = { [Op.gte]: applyTo.sessionDateFrom };
    if (applyTo.sessionDateTo) where.sessionDate = { ...where.sessionDate, [Op.lte]: applyTo.sessionDateTo };
    if (applyTo.status) where.status = applyTo.status;

    const inventories = await TicketInventory.findAll({
      where,
      include: [{ model: ScenicSpot, as: 'scenicSpot' }]
    });

    if (!inventories.length) {
      throw new AppError('没有匹配的库存记录', 400);
    }

    const needsReview = inventories.some(inv => inv.requiresReview === 1);
    if (needsReview && !this.checkPermission(user.roles, PERM_REVIEW)) {
      throw new AppError('包含需人工复核的场次，当前账号无复核权限', 403);
    }

    const batchId = 'B' + Date.now();
    const results = [];
    const operator = { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua };

    for (const inv of inventories) {
      try {
        let changes = [];
        let changeType = null;
        let oldVal = null;
        let newVal = null;
        let diffVal = null;
        let opType = 'batch';

        switch (operation) {
          case 'increase_holiday': {
            const add = Number(updateFields.addQuota) || 0;
            if (add > 0) {
              const rule = SPOT_TYPE_INVENTORY_RULES[inv.scenicSpot?.spotType] || SPOT_TYPE_INVENTORY_RULES.natural;
              const newQuota = inv.totalQuota + add;
              if (newQuota > rule.maxQuotaPerSession) {
                throw new Error(`单场次最大配额不能超过${rule.maxQuotaPerSession}`);
              }
              oldVal = inv.totalQuota;
              newVal = newQuota;
              diffVal = add;
              inv.totalQuota = newQuota;
              inv.status = this.computeStatus(inv);
              changeType = 'total';
              changes = [{ field: 'totalQuota', fieldLabel: '总配额', oldValue: oldVal, newValue: newVal }];
            }
            break;
          }
          case 'lock_full': {
            if (inv.status === 'active') {
              const available = inv.totalQuota - inv.reservedCount - inv.usedCount - inv.lockedCount;
              if (available > 0) {
                oldVal = inv.lockedCount;
                newVal = inv.lockedCount + available;
                diffVal = available;
                inv.lockedCount = newVal;
                inv.status = 'locked';
                changeType = 'locked';
                changes = [{ field: 'lockedCount', fieldLabel: '锁定数量', oldValue: oldVal, newValue: newVal }];
                opType = 'lock';
              }
            }
            break;
          }
          case 'clear_expired': {
            const sessionTime = new Date(`${inv.sessionDate}T${inv.endTime}`);
            if (sessionTime < new Date() && inv.status !== 'expired') {
              oldVal = inv.status;
              newVal = 'expired';
              inv.status = 'expired';
              changeType = 'status';
              changes = [{ field: 'status', fieldLabel: '状态', oldValue: oldVal, newValue: newVal }];
              opType = 'expire';
            }
            break;
          }
          case 'set_status': {
            oldVal = inv.status;
            newVal = updateFields.status;
            inv.status = newVal;
            changeType = 'status';
            changes = [{ field: 'status', fieldLabel: '状态', oldValue, newValue: newVal }];
            opType = newVal === 'locked' ? 'lock' : (newVal === 'active' ? 'unlock' : 'close');
            break;
          }
          case 'adjust_quota': {
            oldVal = inv.totalQuota;
            newVal = Number(updateFields.totalQuota);
            const rule = SPOT_TYPE_INVENTORY_RULES[inv.scenicSpot?.spotType] || SPOT_TYPE_INVENTORY_RULES.natural;
            if (newVal > rule.maxQuotaPerSession) {
              throw new Error(`单场次最大配额不能超过${rule.maxQuotaPerSession}`);
            }
            inv.totalQuota = newVal;
            inv.status = this.computeStatus(inv);
            changeType = 'total';
            diffVal = newVal - oldVal;
            changes = [{ field: 'totalQuota', fieldLabel: '总配额', oldValue, newValue: newVal }];
            break;
          }
          case 'adjust_limit': {
            oldVal = inv.perOrderLimit;
            newVal = Number(updateFields.perOrderLimit);
            inv.perOrderLimit = newVal;
            changeType = 'per_order';
            changes = [{ field: 'perOrderLimit', fieldLabel: '单次限购', oldValue, newValue: newVal }];
            break;
          }
          case 'adjust_advance': {
            if (updateFields.minAdvanceHours !== undefined) {
              inv.minAdvanceHours = Number(updateFields.minAdvanceHours);
              changes.push({ field: 'minAdvanceHours', fieldLabel: '最少提前小时', oldValue: null, newValue: inv.minAdvanceHours });
            }
            if (updateFields.maxAdvanceDays !== undefined) {
              inv.maxAdvanceDays = Number(updateFields.maxAdvanceDays);
              changes.push({ field: 'maxAdvanceDays', fieldLabel: '最大预约天数', oldValue: null, newValue: inv.maxAdvanceDays });
            }
            if (updateFields.autoCloseMinutes !== undefined) {
              inv.autoCloseMinutes = Number(updateFields.autoCloseMinutes);
              changes.push({ field: 'autoCloseMinutes', fieldLabel: '自动关闭分钟', oldValue: null, newValue: inv.autoCloseMinutes });
            }
            changeType = 'advance';
            break;
          }
          default:
            continue;
        }

        if (changes.length) {
          await inv.save();
          await this.writeLog(inv, opType, {
            changes,
            changeType,
            oldValue: oldVal,
            newValue: newVal,
            diffValue: diffVal,
            batchId,
            scenicSpotName: inv.scenicSpot?.name,
            reason
          }, user, operator, 'pass', []);

          results.push({ id: inv.id, success: true, changes });
        } else {
          results.push({ id: inv.id, success: false, message: '无变更内容' });
        }
      } catch (err) {
        results.push({ id: inv.id, success: false, message: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return { batchId, total: results.length, success: successCount, failed: results.length - successCount, results };
  }

  async verifyInventory(id, verifyType, reason, user) {
    if (!this.checkPermission(user.roles, PERM_INV_AUDIT)) {
      throw new AppError('无审核权限', 403);
    }

    const inventory = await TicketInventory.findByPk(id, {
      include: [{ model: ScenicSpot, as: 'scenicSpot' }]
    });
    if (!inventory) {
      throw new AppError('库存记录不存在', 404);
    }

    const pendingLog = await TicketInventoryLog.findOne({
      where: { inventoryId: id, reviewStatus: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    if (pendingLog) {
      pendingLog.reviewStatus = verifyType === 'pass' ? 'approved' : 'rejected';
      pendingLog.reviewerId = user.id;
      pendingLog.reviewerName = user.name;
      pendingLog.reviewedAt = new Date();
      pendingLog.verifyMessage = reason || null;
      await pendingLog.save();
    }

    if (verifyType === 'pass') {
      if (inventory.status === 'locked') {
        inventory.status = this.computeStatus(inventory);
        await inventory.save();
      }
    } else if (verifyType === 'block') {
      inventory.status = 'locked';
      inventory.fakeIndicator = 1;
      await inventory.save();
    }

    await this.writeLog(inventory, 'verify', {
      changes: [{ field: 'reviewStatus', fieldLabel: '复核状态', oldValue: 'pending', newValue: verifyType === 'pass' ? 'approved' : 'rejected' }],
      reason
    }, user, { id: user.id, name: user.name, roles: user.roles, ip: user.ip, ua: user.ua });

    return inventory;
  }

  async checkExpired() {
    const now = new Date();
    const where = {
      status: { [Op.in]: ['active', 'locked', 'sold_out'] }
    };

    const inventories = await TicketInventory.findAll({ where });
    const updated = [];

    for (const inv of inventories) {
      const newStatus = this.computeStatus(inv);
      if (newStatus !== inv.status && (newStatus === 'expired' || newStatus === 'closed')) {
        const oldStatus = inv.status;
        inv.status = newStatus;
        await inv.save();
        await this.writeLog(inv, newStatus === 'expired' ? 'expire' : 'close', {
          changes: [{ field: 'status', fieldLabel: '状态', oldValue: oldStatus, newValue: newStatus }],
          changeType: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
          reason: '系统自动处理'
        }, null, { ip: 'system', ua: 'system' });
        updated.push(inv.id);
      }
    }

    return { updatedCount: updated.length, updatedIds: updated };
  }

  async getLogs(id, params) {
    const { page = 1, pageSize = 20, operationType } = params;
    const where = { inventoryId: id };
    if (operationType) where.operationType = operationType;

    const { count, rows } = await TicketInventoryLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  async getAllLogs(params) {
    const {
      page = 1, pageSize = 20, operationType, sessionType,
      operatorName, scenicSpotName, sessionDateFrom, sessionDateTo
    } = params;

    const where = {};
    if (operationType) where.operationType = operationType;
    if (sessionType) where.sessionTypeCache = sessionType;
    if (operatorName) where.operatorName = { [Op.like]: `%${operatorName}%` };
    if (scenicSpotName) where.scenicSpotNameCache = { [Op.like]: `%${scenicSpotName}%` };
    if (sessionDateFrom) where.sessionDateCache = { [Op.gte]: sessionDateFrom };
    if (sessionDateTo) where.sessionDateCache = { ...where.sessionDateCache, [Op.lte]: sessionDateTo };

    const { count, rows } = await TicketInventoryLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  getSessionTypeLabel(type) {
    const labels = { daily: '日常场次', weekend: '周末场次', holiday: '节假日场次', performance: '专属展演场次' };
    return labels[type] || type;
  }

  checkPermissionEndpoint(type, user) {
    let required = [];
    switch (type) {
      case 'create':
      case 'update':
      case 'status':
        required = PERM_INV_OPS;
        break;
      case 'batch':
        required = PERM_BATCH;
        break;
      case 'verify':
        required = PERM_INV_AUDIT;
        break;
      case 'review':
        required = PERM_REVIEW;
        break;
      default:
        required = ['admin'];
    }
    return { allowed: this.checkPermission(user.roles, required), roles: required };
  }
}

module.exports = new TicketInventoryService();
