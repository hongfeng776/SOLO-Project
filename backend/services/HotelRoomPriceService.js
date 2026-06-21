const HotelRoomPrice = require('../models/HotelRoomPrice');
const HotelRoomPriceLog = require('../models/HotelRoomPriceLog');
const HotelRoom = require('../models/HotelRoom');
const Hotel = require('../models/Hotel');
const { Op } = require('sequelize');

const PERMISSION_PRICE_OPS = ['admin', 'hotel_operator', 'senior_hotel_operator', 'price_manager'];
const PERMISSION_PRICE_SENIOR = ['admin', 'senior_hotel_operator', 'price_manager'];
const PERMISSION_EXCLUSIVE = ['admin', 'price_manager'];

const INDUSTRY_MIN_DISCOUNT = 3;
const INDUSTRY_MAX_PRICE_MULTIPLIER = 5;

const parseJSON = (str, defaultVal = null) => {
  if (!str) return defaultVal;
  try { return JSON.parse(str); } catch (e) { return defaultVal; }
};

const stringifyJSON = (obj) => {
  try { return JSON.stringify(obj); } catch (e) { return null; }
};

const checkPricePermission = (user) => user && PERMISSION_PRICE_OPS.includes(user.role);
const checkPriceSeniorPermission = (user) => user && PERMISSION_PRICE_SENIOR.includes(user.role);
const checkExclusivePermission = (user) => user && PERMISSION_EXCLUSIVE.includes(user.role);

const checkRoomAvailableForPrice = async (roomId) => {
  const room = await HotelRoom.findByPk(roomId);
  if (!room) return { valid: false, message: '房型不存在' };
  if (room.status !== 'on_sale' || room.maintainStatus !== 'normal') {
    return { valid: false, message: '房型状态不允许配置价格' };
  }
  return { valid: true, room };
};

const checkDiscountValidity = (basePrice, originalPrice, discountRatio, priceType) => {
  const errors = [];
  const warnings = [];
  if (originalPrice && basePrice > originalPrice) errors.push('售价不得高于原价');
  if (discountRatio !== null && discountRatio !== undefined) {
    if (discountRatio <= 0 || discountRatio > 10) errors.push('折扣比例应在0-10之间');
    const expected = parseFloat((originalPrice * discountRatio / 10).toFixed(2));
    if (Math.abs(expected - basePrice) > 1) {
      warnings.push(`折扣${discountRatio}折对应价格应为¥${expected}，与设置的¥${basePrice}存在差异`);
    }
    if (discountRatio < INDUSTRY_MIN_DISCOUNT) {
      errors.push(`折扣不得低于${INDUSTRY_MIN_DISCOUNT}折（行业规范）`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
};

const checkCancelPolicyMatch = (priceType, cancelPolicy, penaltyAmount, penaltyPercent) => {
  const warnings = [];
  if (priceType === 'exclusive' && cancelPolicy === 'non_refundable' && !penaltyAmount && !penaltyPercent) {
    warnings.push('专属套餐设置为不可取消时，建议明确违约金金额或比例');
  }
  if (penaltyAmount && penaltyPercent) warnings.push('违约金金额和比例建议仅设置其中一项');
  if (cancelPolicy === 'flexible' && (penaltyAmount > 0 || penaltyPercent > 0)) {
    warnings.push('灵活取消政策下建议不设置违约金');
  }
  return warnings;
};

const checkIncludedServicesValidity = (includedServices, basePrice) => {
  const warnings = [];
  const services = parseJSON(includedServices, []);
  if (services.length > 10) warnings.push('包含服务建议不超过10项，避免展示冗长');
  const totalValue = services.length * 20;
  if (totalValue > basePrice * 0.5) warnings.push('包含服务估算价值过高，请确认合理性');
  return warnings;
};

const checkDateRangeConflict = async (hotelId, roomId, priceType, startDate, endDate, weekDays, excludeId = null) => {
  const errors = [];
  const where = {
    hotelId, roomId, priceType,
    startDate: { [Op.lte]: endDate },
    endDate: { [Op.gte]: startDate },
    status: { [Op.in]: ['draft', 'active'] }
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const conflicts = await HotelRoomPrice.findAll({ where });
  if (conflicts.length > 0) {
    const wdSet = new Set((weekDays || '1,2,3,4,5,6,7').split(','));
    for (const c of conflicts) {
      const cWd = new Set((c.weekDays || '1,2,3,4,5,6,7').split(','));
      const overlap = [...wdSet].filter(x => cWd.has(x));
      if (overlap.length > 0) {
        errors.push(`与现有套餐「${c.packageName || c.id}」日期重叠（${c.startDate} ~ ${c.endDate}）`);
      }
    }
  }
  return errors;
};

const checkDateRangeReasonable = (startDate, endDate, priceType) => {
  const errors = [];
  const warnings = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end < start) errors.push('结束日期不得早于开始日期');
  if (end < today) errors.push('结束日期不得早于今日');
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (diffDays > 365) warnings.push('价格有效期超过365天，请确认');
  if (priceType === 'exclusive' && diffDays > 90) warnings.push('专属套餐建议有效期不超过90天');
  if (priceType === 'flash_sale' && diffDays > 7) errors.push('闪购套餐有效期不得超过7天');
  return { valid: errors.length === 0, errors, warnings };
};

const checkFakePackageIndicators = (data) => {
  const warnings = [];
  let score = 0;
  if (parseFloat(data.basePrice) <= 0) { warnings.push('价格异常'); score++; }
  if (!data.packageName || data.packageName.length < 3) { warnings.push('套餐名称过短'); score++; }
  const services = parseJSON(data.includedServices, []);
  if (services.length === 0 && data.priceType === 'exclusive') { warnings.push('专属套餐未配置包含服务'); score++; }
  if (parseFloat(data.discountRatio) < 2) { warnings.push('折扣过低'); score++; }
  if (!data.startDate || !data.endDate) { warnings.push('日期不完整'); score++; }
  return { isFake: score >= 4, score, warnings };
};

const checkOverDiscount = (basePrice, originalPrice, roomBasePrice) => {
  if (!originalPrice || !roomBasePrice) return { over: false };
  const roomP = parseFloat(roomBasePrice);
  const ratio = basePrice / roomP;
  if (ratio < 0.4) return { over: true, message: `售价低于房型基准价40%，属于超范围优惠` };
  if (originalPrice && basePrice / originalPrice < 0.3) return { over: true, message: `折扣低于3折，属于超范围优惠` };
  return { over: false };
};

const writePriceLog = async (priceId, hotelId, roomId, operationType, operator, extra = {}) => {
  await HotelRoomPriceLog.create({
    priceId, hotelId, roomId, operationType,
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
    priceChanged: extra.priceChanged || false,
    oldPriceValue: extra.oldPriceValue,
    newPriceValue: extra.newPriceValue,
    orderSyncCount: extra.orderSyncCount || 0,
    purchaseCountSnapshot: extra.purchaseCount || 0
  });
};

const HotelRoomPriceService = {
  async checkPermission(user) {
    return {
      canOps: checkPricePermission(user),
      canSenior: checkPriceSeniorPermission(user),
      canExclusive: checkExclusivePermission(user)
    };
  },

  async list(params = {}) {
    const { page = 1, pageSize = 20, hotelId, roomId, priceType, status, keyword, startDate, endDate } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (roomId) where.roomId = roomId;
    if (priceType) where.priceType = priceType;
    if (status) where.status = status;
    if (keyword) where[Op.or] = [
      { packageName: { [Op.like]: `%${keyword}%` } },
      { packageCode: { [Op.like]: `%${keyword}%` } }
    ];
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };

    const { count, rows } = await HotelRoomPrice.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['displayPriority', 'DESC'], ['id', 'DESC']],
      include: [
        { model: Hotel, as: 'hotel', attributes: ['id', 'name', 'city'] },
        { model: HotelRoom, as: 'room', attributes: ['id', 'roomName', 'roomType', 'basePrice'] }
      ]
    });
    return { total: count, list: rows.map(r => r.toJSON()) };
  },

  async get(id) {
    const price = await HotelRoomPrice.findByPk(id, {
      include: [
        { model: Hotel, as: 'hotel' },
        { model: HotelRoom, as: 'room' }
      ]
    });
    if (!price) return null;
    const data = price.toJSON();
    data.includedServices = parseJSON(data.includedServices, []);
    data.images = parseJSON(data.images, []);
    data.warningFlags = parseJSON(data.warningFlags, []);
    return data;
  },

  async verifyPriceParams(data, excludeId = null) {
    const errors = [];
    const warnings = [];
    const { hotelId, roomId, priceType, basePrice, originalPrice, discountRatio, startDate, endDate, weekDays, cancelPolicy, penaltyAmount, penaltyPercent, includedServices, isFlashSale, flashSaleStartTime, flashSaleEndTime, packageName } = data;

    if (!hotelId) errors.push('必须指定所属酒店');
    if (!roomId) errors.push('必须指定所属房型');
    if (!basePrice || parseFloat(basePrice) <= 0) errors.push('请输入有效的售卖价格');
    if (!startDate || !endDate) errors.push('请选择生效日期范围');
    if (priceType === 'exclusive' && (!packageName || !packageName.trim())) errors.push('专属套餐必须填写套餐名称');

    const rr = await checkRoomAvailableForPrice(roomId);
    if (!rr.valid) errors.push(rr.message);

    const dr = checkDiscountValidity(parseFloat(basePrice), parseFloat(originalPrice), parseFloat(discountRatio), priceType);
    errors.push(...dr.errors);
    warnings.push(...dr.warnings);

    const dtr = checkDateRangeReasonable(startDate, endDate, isFlashSale ? 'flash_sale' : priceType);
    errors.push(...dtr.errors);
    warnings.push(...dtr.warnings);

    if (errors.length === 0) {
      const dc = await checkDateRangeConflict(hotelId, roomId, priceType, startDate, endDate, weekDays, excludeId);
      errors.push(...dc);
    }

    warnings.push(...checkCancelPolicyMatch(priceType, cancelPolicy, parseFloat(penaltyAmount), parseFloat(penaltyPercent)));
    warnings.push(...checkIncludedServicesValidity(includedServices, parseFloat(basePrice)));

    const fp = checkFakePackageIndicators(data);
    if (fp.isFake) errors.push(...fp.warnings);
    warnings.push(...fp.warnings);

    const room = rr.room;
    if (room) {
      const od = checkOverDiscount(parseFloat(basePrice), parseFloat(originalPrice), room.basePrice);
      if (od.over) warnings.push(od.message);
    }

    if (isFlashSale) {
      if (!flashSaleStartTime || !flashSaleEndTime) errors.push('闪购套餐必须设置闪购时间');
    }

    return {
      valid: errors.length === 0,
      errors, warnings,
      isFake: fp.isFake,
      isOverDiscount: warnings.some(w => w.includes('超范围优惠')),
      fakeWarnings: fp.warnings
    };
  },

  async create(data, operator) {
    if (!checkPricePermission(operator)) throw new Error('权限不足');
    const verify = await this.verifyPriceParams(data);
    if (!verify.valid) throw new Error(verify.errors.join('; '));

    const payload = { ...data };
    payload.includedServices = typeof payload.includedServices === 'string' ? payload.includedServices : stringifyJSON(payload.includedServices || []);
    payload.images = typeof payload.images === 'string' ? payload.images : stringifyJSON(payload.images || []);
    payload.warningFlags = stringifyJSON([...verify.warnings, ...verify.fakeWarnings]);
    payload.isFake = verify.isFake;
    payload.isOverDiscount = verify.isOverDiscount;
    payload.isExclusive = payload.priceType === 'exclusive';
    payload.createdBy = payload.updatedBy = operator?.name || operator?.username;

    const price = await HotelRoomPrice.create(payload);
    await writePriceLog(price.id, price.hotelId, price.roomId, 'create', operator, {
      newValue: payload, changeFields: Object.keys(payload),
      verifyResult: verify.warnings.length ? 'warning' : 'pass',
      verifyMessages: verify.warnings
    });
    return price;
  },

  async update(id, data, operator) {
    if (!checkPricePermission(operator)) throw new Error('权限不足');

    const price = await HotelRoomPrice.findByPk(id);
    if (!price) throw new Error('价格套餐不存在');

    if (price.isExclusive && !checkExclusivePermission(operator)) {
      throw new Error('专属特价套餐需专项权限才能修改');
    }

    const combined = { ...price.toJSON(), ...data };
    const verify = await this.verifyPriceParams(combined, id);
    if (!verify.valid) throw new Error(verify.errors.join('; '));

    const oldVal = price.toJSON();
    const changedFields = [];
    const payload = {};
    let priceChanged = false;
    let oldPrice = oldVal.basePrice;
    let newPrice = oldVal.basePrice;

    Object.keys(data).forEach(k => {
      if (k === 'id' || k === 'createdAt') return;
      if (k === 'includedServices' || k === 'images' || k === 'warningFlags') {
        const v = typeof data[k] === 'string' ? data[k] : stringifyJSON(data[k] || []);
        if (v !== oldVal[k]) { payload[k] = v; changedFields.push(k); }
      } else if (JSON.stringify(data[k]) !== JSON.stringify(oldVal[k])) {
        payload[k] = data[k];
        changedFields.push(k);
        if (['basePrice', 'originalPrice', 'discountRatio', 'memberPrice'].includes(k)) priceChanged = true;
        if (k === 'basePrice') newPrice = data[k];
      }
    });

    payload.updatedBy = operator?.name || operator?.username;
    payload.warningFlags = stringifyJSON([...verify.warnings, ...verify.fakeWarnings]);
    changedFields.push('warningFlags');
    payload.isFake = verify.isFake;
    payload.isOverDiscount = verify.isOverDiscount;
    payload.lastSyncTime = new Date();

    await HotelRoomPrice.update(payload, { where: { id } });

    let operationType = 'update';
    if (changedFields.includes('status')) {
      operationType = data.status === 'active' ? 'on_shelf' : data.status === 'inactive' ? 'off_shelf' : 'change_status';
    }
    if (priceChanged) operationType = 'adjust_price';

    await writePriceLog(id, oldVal.hotelId, oldVal.roomId, operationType, operator, {
      oldValue: oldVal, newValue: { ...oldVal, ...payload },
      changeFields, reason: data.operationReason,
      verifyResult: verify.warnings.length ? 'warning' : 'pass',
      verifyMessages: verify.warnings,
      priceChanged, oldPriceValue: oldPrice, newPriceValue: newPrice,
      orderSyncCount: payload.syncToUnpaidOrders ? 0 : undefined
    });
    return true;
  },

  async changeStatus(id, status, operator, reason) {
    if (!checkPricePermission(operator)) throw new Error('权限不足');
    const price = await HotelRoomPrice.findByPk(id);
    if (!price) throw new Error('套餐不存在');
    if (price.isExclusive && !checkExclusivePermission(operator)) throw new Error('专属套餐需专项权限');
    const oldVal = price.toJSON();
    await HotelRoomPrice.update({ status, updatedBy: operator?.name || operator?.username }, { where: { id } });
    await writePriceLog(id, oldVal.hotelId, oldVal.roomId, 'change_status', operator, {
      oldValue: oldVal, newValue: { ...oldVal, status },
      changeFields: ['status'], reason,
      priceChanged: false
    });
    return true;
  },

  async batchOperation(operation, params, operator) {
    if (!checkPricePermission(operator)) throw new Error('权限不足');

    const { ids, hotelId, roomId, ...rest } = params;
    if (!ids || ids.length === 0) throw new Error('请选择需要操作的套餐');

    const prices = await HotelRoomPrice.findAll({ where: { id: { [Op.in]: ids } });
    if (prices.length === 0) throw new Error('未找到匹配套餐');

    const results = { success: 0, failed: 0, failures: [] };
    const batchId = `BP${Date.now()};

    for (const p of prices) {
      try {
        if (p.isExclusive && !['enable_holiday', 'off_shelf_expired'].includes(operation)) {
          if (!checkExclusivePermission(operator)) {
            results.failed++;
            results.failures.push({ id: p.id, name: p.packageName || p.id, message: '专属特价套餐禁止批量操作' });
            continue;
          }
        }
        const oldVal = p.toJSON();
        const updatePayload = { updatedBy: operator?.name || operator?.username };
        let opType = 'batch_adjust';
        const changeFields = [];
        let priceChanged = false;
        let oldP = oldVal.basePrice, newP = oldVal.basePrice;

        switch (operation) {
          case 'adjust_price': {
            if (!rest.adjustType || !rest.adjustValue) throw new Error('请设置调价方式和数值');
            let newPrice = parseFloat(oldVal.basePrice);
            if (rest.adjustType === 'fixed') newPrice = parseFloat(rest.adjustValue);
            else if (rest.adjustType === 'increase') newPrice += parseFloat(rest.adjustValue);
            else if (rest.adjustType === 'decrease') newPrice -= parseFloat(rest.adjustValue);
            else if (rest.adjustType === 'percent') newPrice = newPrice * (1 + parseFloat(rest.adjustValue) / 100);
            newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
            updatePayload.basePrice = newPrice;
            if (rest.applyDiscount && rest.discountRatio) updatePayload.discountRatio = rest.discountRatio;
            if (rest.applyOriginalPrice && rest.originalPrice) updatePayload.originalPrice = rest.originalPrice;
            changeFields.push('basePrice');
            if (updatePayload.discountRatio) changeFields.push('discountRatio');
            if (updatePayload.originalPrice) changeFields.push('originalPrice');
            priceChanged = true; newP = newPrice;
            opType = 'adjust_price';
            break;
          }
          case 'enable_holiday': {
            updatePayload.status = 'active';
            if (rest.startDate) updatePayload.startDate = rest.startDate;
            if (rest.endDate) updatePayload.endDate = rest.endDate;
            changeFields.push('status', 'startDate', 'endDate');
            opType = 'on_shelf';
            break;
          }
          case 'off_shelf_expired': {
            updatePayload.status = 'inactive';
            changeFields.push('status');
            opType = 'off_shelf';
            break;
          }
          default:
            throw new Error('未知批量操作');
        }

        await HotelRoomPrice.update(updatePayload, { where: { id: p.id } });
        await writePriceLog(p.id, p.hotelId, p.roomId, opType, operator, {
          oldValue: oldVal, newValue: { ...oldVal, ...updatePayload },
          changeFields, reason: rest.reason,
          isBatch: true, batchId,
          priceChanged, oldPriceValue: oldP, newPriceValue: newP
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.failures.push({ id: p.id, name: p.packageName || p.id, message: e.message });
      }
    }
    results.batchId = batchId;
    return results;
  },

  async getLogs(priceId, params = {}) {
    const { page = 1, pageSize = 20 } = params;
    const { count, rows } = await HotelRoomPriceLog.findAndCountAll({
      where: { priceId },
      offset: (page - 1) * pageSize, limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  },

  async getAllLogs(params = {}) {
    const { page = 1, pageSize = 20, hotelId, roomId, operationType } = params;
    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (roomId) where.roomId = roomId;
    if (operationType) where.operationType = operationType;
    const { count, rows } = await HotelRoomPriceLog.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: parseInt(pageSize), order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows };
  },

  async getPurchaseDetails(priceId, params = {}) {
    return { total: 0, list: [] };
  }
};

module.exports = HotelRoomPriceService;
