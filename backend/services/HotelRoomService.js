const HotelRoom = require('../models/HotelRoom');
const HotelRoomLog = require('../models/HotelRoomLog');
const Hotel = require('../models/Hotel');
const { Op } = require('sequelize');

const PERMISSION_ROOM_OPS = ['admin', 'hotel_operator', 'senior_hotel_operator'];
const PERMISSION_ROOM_SENIOR = ['admin', 'senior_hotel_operator'];
const LOCKED_MAINTAIN_STATUSES = ['maintenance', 'closed', 'cleaning'];
const ROOM_TYPES = {
  standard: { label: '标准客房', minArea: 15, maxArea: 40, priceRange: [100, 500], capacity: [1, 3] },
  deluxe: { label: '豪华客房', minArea: 30, maxArea: 80, priceRange: [300, 1500], capacity: [2, 4] },
  suite: { label: '套房', minArea: 50, maxArea: 200, priceRange: [800, 5000], capacity: [2, 6] },
  featured: { label: '特色房型', minArea: 20, maxArea: 300, priceRange: [200, 10000], capacity: [1, 10] }
};

const parseJSON = (str, defaultVal = null) => {
  if (!str) return defaultVal;
  try { return JSON.parse(str); } catch (e) { return defaultVal; }
};

const stringifyJSON = (obj) => {
  try { return JSON.stringify(obj); } catch (e) { return null; }
};

const checkRoomOpsPermission = (user) => {
  return user && PERMISSION_ROOM_OPS.includes(user.role);
};

const checkRoomSeniorPermission = (user) => {
  return user && PERMISSION_ROOM_SENIOR.includes(user.role);
};

const checkHotelAvailableForRoom = async (hotelId) => {
  const hotel = await Hotel.findByPk(hotelId);
  if (!hotel) return { valid: false, message: '酒店门店不存在' };
  const ALLOWED_BUSINESS = ['operating'];
  if (!ALLOWED_BUSINESS.includes(hotel.businessStatus)) {
    return { valid: false, message: `酒店当前状态(${hotel.businessStatus})不允许新增/修改客房资源` };
  }
  if (hotel.isFake || hotel.isDuplicate) {
    return { valid: false, message: '酒店存在风控标记，禁止客房操作' };
  }
  return { valid: true, hotel };
};

const checkRoomTypeValidity = (roomType, area, capacity, basePrice) => {
  const warnings = [];
  const errors = [];
  if (!ROOM_TYPES[roomType]) {
    errors.push(`未知的房型分类: ${roomType}`);
    return { valid: false, errors, warnings };
  }
  const def = ROOM_TYPES[roomType];
  if (area < def.minArea) errors.push(`${def.label}最小面积应≥${def.minArea}㎡`);
  if (area > def.maxArea) warnings.push(`${def.label}面积${area}㎡超出常规上限${def.maxArea}㎡，请确认`);
  if (capacity < def.capacity[0]) errors.push(`${def.label}标准容纳人数应≥${def.capacity[0]}`);
  if (capacity > def.capacity[1]) warnings.push(`${def.label}容纳人数${capacity}超出常规上限${def.capacity[1]}，请确认`);
  if (basePrice < def.priceRange[0]) errors.push(`${def.label}基准价应≥¥${def.priceRange[0]}`);
  if (basePrice > def.priceRange[1]) warnings.push(`${def.label}基准价¥${basePrice}超出常规上限¥${def.priceRange[1]}，请确认`);
  return { valid: errors.length === 0, errors, warnings };
};

const checkFacilityMatch = (roomType, facilities) => {
  const warnings = [];
  const fac = parseJSON(facilities, []);
  if (!fac || fac.length === 0) warnings.push('建议至少配置1个设施标签');
  if (roomType === 'suite' && !fac.includes('独立客厅')) warnings.push('套房通常应配置独立客厅');
  if (roomType === 'deluxe' && !fac.includes('大床') && !fac.includes('特大床')) warnings.push('豪华客房建议配置大床或特大床');
  return warnings;
};

const checkTargetGuestMatch = (roomType, capacity, targetGuest) => {
  const warnings = [];
  if (capacity >= 4 && targetGuest && !targetGuest.includes('家庭') && !targetGuest.includes('朋友')) {
    warnings.push('容纳人数≥4人的房型，适配人群建议包含家庭或朋友聚会');
  }
  return warnings;
};

const checkDuplicateRoom = async (hotelId, roomName, excludeId = null) => {
  const where = { hotelId, roomName };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const dup = await HotelRoom.findOne({ where });
  return !!dup;
};

const checkFakeRoomIndicators = (data) => {
  const warnings = [];
  let score = 0;
  if (parseFloat(data.basePrice) <= 0) { warnings.push('基准价异常'); score++; }
  if (parseFloat(data.area) <= 5) { warnings.push('面积异常'); score++; }
  if (!data.roomName || data.roomName.length < 2) { warnings.push('房型名称不完整'); score++; }
  if (!parseJSON(data.facilities, [])?.length) { warnings.push('无任何设施配置'); score++; }
  if (parseInt(data.capacity) <= 0) { warnings.push('容纳人数异常'); score++; }
  return { isFake: score >= 4, score, warnings };
};

const recalcBookable = (maintainStatus, status, availableCount) => {
  if (LOCKED_MAINTAIN_STATUSES.includes(maintainStatus)) return false;
  if (status === 'off_sale' || status === 'sold_out') return false;
  return parseInt(availableCount) > 0;
};

const writeRoomLog = async (roomId, hotelId, operationType, operator, extra = {}) => {
  await HotelRoomLog.create({
    roomId,
    hotelId,
    operationType,
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
    bookingLocked: extra.bookingLocked || false,
    ledgerSynced: extra.ledgerSynced ?? true
  });
};

const HotelRoomService = {
  async checkPermission(user) {
    return {
      canOps: checkRoomOpsPermission(user),
      canSenior: checkRoomSeniorPermission(user)
    };
  },

  async list(params = {}, user) {
    const { page = 1, pageSize = 20, hotelId, roomType, status, maintainStatus, keyword } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (roomType) where.roomType = roomType;
    if (status) where.status = status;
    if (maintainStatus) where.maintainStatus = maintainStatus;
    if (keyword) {
      where[Op.or] = [
        { roomName: { [Op.like]: `%${keyword}%` } },
        { roomNo: { [Op.like]: `%${keyword}%` } },
        { facilityText: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await HotelRoom.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['roomType', 'ASC'], ['displayOrder', 'ASC'], ['id', 'DESC']],
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name', 'hotelType', 'city', 'businessStatus'] }]
    });
    return { total: count, list: rows.map(r => r.toJSON()) };
  },

  async get(id) {
    const room = await HotelRoom.findByPk(id, {
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name', 'hotelType', 'city', 'businessStatus'] }]
    });
    if (!room) return null;
    const data = room.toJSON();
    data.facilities = parseJSON(data.facilities, []);
    data.images = parseJSON(data.images, []);
    data.warningFlags = parseJSON(data.warningFlags, []);
    return data;
  },

  async verifyRoomParams(data, excludeId = null) {
    const errors = [];
    const warnings = [];
    const { hotelId, roomType, area, capacity, basePrice, facilities, targetGuest, roomName } = data;

    if (!hotelId) errors.push('必须指定所属酒店');
    else {
      const hr = await checkHotelAvailableForRoom(hotelId);
      if (!hr.valid) errors.push(hr.message);
    }
    if (!roomName || !roomName.trim()) errors.push('客房名称不能为空');

    const vt = checkRoomTypeValidity(roomType, parseFloat(area), parseInt(capacity), parseFloat(basePrice));
    errors.push(...vt.errors);
    warnings.push(...vt.warnings);

    if (data.maxCapacity && parseInt(data.maxCapacity) < parseInt(capacity)) {
      errors.push('最大容纳人数不得小于标准容纳人数');
    }
    if (data.weekendPrice && parseFloat(data.weekendPrice) < parseFloat(basePrice) * 0.5) {
      warnings.push('周末价低于基准价50%，请确认');
    }
    warnings.push(...checkFacilityMatch(roomType, facilities));
    warnings.push(...checkTargetGuestMatch(roomType, parseInt(capacity), targetGuest));

    if (roomName && hotelId) {
      const dup = await checkDuplicateRoom(hotelId, roomName.trim(), excludeId);
      if (dup) errors.push('同一酒店下已存在相同名称的房型');
    }

    const fake = checkFakeRoomIndicators(data);
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      isFake: fake.isFake,
      isDuplicate: errors.some(e => e.includes('已存在相同名称')),
      fakeWarnings: fake.warnings
    };
  },

  async create(data, operator) {
    if (!checkRoomOpsPermission(operator)) {
      throw new Error('权限不足，无法执行客房运维操作');
    }
    const verify = await this.verifyRoomParams(data);
    if (!verify.valid) {
      throw new Error(verify.errors.join('; '));
    }
    const payload = { ...data };
    payload.facilities = typeof payload.facilities === 'string' ? payload.facilities : stringifyJSON(payload.facilities || []);
    payload.images = typeof payload.images === 'string' ? payload.images : stringifyJSON(payload.images || []);
    payload.warningFlags = stringifyJSON([...verify.warnings, ...verify.fakeWarnings]);
    payload.isFake = verify.isFake;
    payload.isDuplicate = verify.isDuplicate;
    payload.isBookable = recalcBookable(payload.maintainStatus || 'normal', payload.status || 'on_sale', payload.availableCount || payload.totalCount || 1);
    payload.createdBy = operator?.name || operator?.username;
    payload.updatedBy = payload.createdBy;
    payload.lastSyncTime = new Date();

    const room = await HotelRoom.create(payload);
    await writeRoomLog(room.id, room.hotelId, 'create', operator, {
      newValue: payload,
      changeFields: Object.keys(payload),
      verifyResult: verify.warnings.length ? 'warning' : 'pass',
      verifyMessages: verify.warnings,
      bookingLocked: !payload.isBookable
    });
    return room;
  },

  async update(id, data, operator) {
    if (!checkRoomOpsPermission(operator)) {
      throw new Error('权限不足，无法执行客房运维操作');
    }
    const room = await HotelRoom.findByPk(id);
    if (!room) throw new Error('客房不存在');

    const combined = { ...room.toJSON(), ...data };
    const verify = await this.verifyRoomParams(combined, id);
    if (!verify.valid) throw new Error(verify.errors.join('; '));

    const oldVal = room.toJSON();
    const changedFields = [];
    const payload = {};
    Object.keys(data).forEach(k => {
      if (k === 'id' || k === 'createdAt') return;
      if (k === 'facilities' || k === 'images') {
        const v = typeof data[k] === 'string' ? data[k] : stringifyJSON(data[k] || []);
        if (v !== oldVal[k]) { payload[k] = v; changedFields.push(k); }
      } else if (JSON.stringify(data[k]) !== JSON.stringify(oldVal[k])) {
        payload[k] = data[k];
        changedFields.push(k);
      }
    });
    if (verify.warnings.length || verify.fakeWarnings.length) {
      payload.warningFlags = stringifyJSON([...verify.warnings, ...verify.fakeWarnings]);
      changedFields.push('warningFlags');
    }
    payload.isFake = verify.isFake;
    payload.isDuplicate = verify.isDuplicate;

    const ms = data.maintainStatus || oldVal.maintainStatus;
    const st = data.status || oldVal.status;
    const ac = data.availableCount ?? oldVal.availableCount;
    const newBookable = recalcBookable(ms, st, ac);
    if (newBookable !== oldVal.isBookable) {
      payload.isBookable = newBookable;
      changedFields.push('isBookable');
    }
    payload.updatedBy = operator?.name || operator?.username;
    payload.lastSyncTime = new Date();

    await HotelRoom.update(payload, { where: { id } });

    let operationType = 'update';
    if (changedFields.includes('status')) operationType = data.status === 'on_sale' ? 'on_shelf' : data.status === 'off_sale' ? 'off_shelf' : data.status === 'sold_out' ? 'sold_out' : 'update';
    if (changedFields.includes('maintainStatus')) operationType = ['maintenance', 'closed', 'cleaning'].includes(data.maintainStatus) ? 'maintenance' : data.maintainStatus === 'normal' ? 'resume' : operationType;
    if (changedFields.includes('basePrice') || changedFields.includes('weekendPrice') || changedFields.includes('holidayPrice')) operationType = 'price_adjust';
    if (changedFields.includes('facilities') || changedFields.includes('facilityText')) operationType = 'facility_change';

    await writeRoomLog(id, oldVal.hotelId, operationType, operator, {
      oldValue: oldVal,
      newValue: { ...oldVal, ...payload },
      changeFields,
      reason: data.operationReason,
      verifyResult: verify.warnings.length ? 'warning' : 'pass',
      verifyMessages: verify.warnings,
      bookingLocked: newBookable === false && oldVal.isBookable === true
    });
    return true;
  },

  async changeMaintainStatus(id, maintainStatus, operator, reason = '') {
    if (!checkRoomOpsPermission(operator)) throw new Error('权限不足');
    const room = await HotelRoom.findByPk(id);
    if (!room) throw new Error('客房不存在');
    const oldVal = room.toJSON();
    const newBookable = recalcBookable(maintainStatus, oldVal.status, oldVal.availableCount);
    await HotelRoom.update({
      maintainStatus,
      isBookable: newBookable,
      updatedBy: operator?.name || operator?.username,
      lastSyncTime: new Date()
    }, { where: { id } });
    await writeRoomLog(id, oldVal.hotelId, ['maintenance', 'closed', 'cleaning'].includes(maintainStatus) ? 'maintenance' : 'resume', operator, {
      oldValue: oldVal,
      newValue: { ...oldVal, maintainStatus, isBookable: newBookable },
      changeFields: ['maintainStatus', 'isBookable'],
      reason,
      bookingLocked: !newBookable && oldVal.isBookable
    });
    return true;
  },

  async batchOperation(operation, params, operator) {
    if (!checkRoomOpsPermission(operator)) throw new Error('权限不足');
    const { ids, hotelId, ...rest } = params;
    if (!ids || ids.length === 0) throw new Error('请选择需要操作的客房');
    if (!hotelId) throw new Error('批量操作必须指定所属门店');

    const rooms = await HotelRoom.findAll({ where: { id: { [Op.in]: ids }, hotelId } });
    if (rooms.length === 0) throw new Error('未找到匹配的客房资源');

    const results = { success: 0, failed: 0, failures: [] };
    const batchId = `BR${Date.now()}`;
    const excludedTypes = [];

    for (const room of rooms) {
      try {
        if (operation !== 'update_info' && operation !== 'off_shelf_maintenance' && room.roomType === 'suite') {
          excludedTypes.push(room.id);
          results.failed++;
          results.failures.push({ id: room.id, name: room.roomName, message: '高端套房需单独运维，不支持批量操作' });
          continue;
        }
        const oldVal = room.toJSON();
        const updatePayload = { updatedBy: operator?.name || operator?.username, lastSyncTime: new Date() };
        let opType = 'batch_update';
        const changeFields = [];

        switch (operation) {
          case 'update_facilities': {
            const newFac = rest.facilities ? (typeof rest.facilities === 'string' ? rest.facilities : stringifyJSON(rest.facilities)) : oldVal.facilities;
            updatePayload.facilities = newFac;
            if (rest.facilityText) { updatePayload.facilityText = rest.facilityText; changeFields.push('facilityText'); }
            changeFields.push('facilities');
            opType = 'facility_change';
            break;
          }
          case 'adjust_display_status': {
            if (rest.displayOnHome !== undefined) { updatePayload.displayOnHome = rest.displayOnHome; changeFields.push('displayOnHome'); }
            if (rest.displayOrder !== undefined) { updatePayload.displayOrder = rest.displayOrder; changeFields.push('displayOrder'); }
            break;
          }
          case 'off_shelf_maintenance': {
            updatePayload.maintainStatus = 'maintenance';
            updatePayload.status = 'off_sale';
            updatePayload.isBookable = false;
            changeFields.push('maintainStatus', 'status', 'isBookable');
            opType = 'maintenance';
            break;
          }
          case 'on_shelf_batch': {
            updatePayload.status = 'on_sale';
            updatePayload.maintainStatus = 'normal';
            updatePayload.isBookable = recalcBookable('normal', 'on_sale', oldVal.availableCount);
            changeFields.push('status', 'maintainStatus', 'isBookable');
            opType = 'on_shelf';
            break;
          }
          case 'update_info': {
            if (rest.description !== undefined) { updatePayload.description = rest.description; changeFields.push('description'); }
            if (rest.targetGuest !== undefined) { updatePayload.targetGuest = rest.targetGuest; changeFields.push('targetGuest'); }
            if (rest.breakfast !== undefined) { updatePayload.breakfast = rest.breakfast; changeFields.push('breakfast'); }
            if (rest.cancelPolicy !== undefined) { updatePayload.cancelPolicy = rest.cancelPolicy; changeFields.push('cancelPolicy'); }
            break;
          }
          default:
            throw new Error('未知批量操作类型');
        }

        await HotelRoom.update(updatePayload, { where: { id: room.id } });
        await writeRoomLog(room.id, room.hotelId, opType, operator, {
          oldValue: oldVal,
          newValue: { ...oldVal, ...updatePayload },
          changeFields,
          reason: rest.reason,
          isBatch: true,
          batchId,
          bookingLocked: updatePayload.isBookable === false && oldVal.isBookable === true
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.failures.push({ id: room.id, name: room.roomName, message: e.message });
      }
    }
    results.batchId = batchId;
    results.excludedSuites = excludedTypes;
    return results;
  },

  async getLogs(roomId, params = {}) {
    const { page = 1, pageSize = 20 } = params;
    const { count, rows } = await HotelRoomLog.findAndCountAll({
      where: { roomId },
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  },

  async getAllLogs(params = {}) {
    const { page = 1, pageSize = 20, hotelId, operationType, startTime, endTime } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (operationType) where.operationType = operationType;
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) where.createdAt[Op.gte] = startTime;
      if (endTime) where.createdAt[Op.lte] = endTime;
    }
    const { count, rows } = await HotelRoomLog.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  }
};

module.exports = HotelRoomService;
