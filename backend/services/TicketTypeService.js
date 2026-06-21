const BaseService = require('./BaseService');
const TicketType = require('../models/TicketType');
const TicketTypeLog = require('../models/TicketTypeLog');
const ScenicSpot = require('../models/ScenicSpot');
const { Op } = require('sequelize');
const { AppError } = require('../utils/error');

const PERM_TICKET_OPS = ['admin', 'ticket_operator', 'senior_ticket_operator'];
const PERM_PACKAGE = ['admin', 'senior_ticket_operator', 'package_auditor'];
const PERM_TICKET_AUDIT = ['admin', 'senior_ticket_operator', 'ticket_auditor'];
const PERM_BATCH = ['admin', 'senior_ticket_operator'];

const TICKET_CATEGORIES = ['adult', 'child', 'student', 'package'];
const SPOT_TYPE_TICKET_RULES = {
  natural: { allowedCategories: ['adult', 'child', 'student', 'package'], minChildAge: 3, maxChildAge: 12, requireReservation: false },
  cultural: { allowedCategories: ['adult', 'child', 'student', 'package'], minChildAge: 3, maxChildAge: 14, requireReservation: false },
  theme: { allowedCategories: ['adult', 'child', 'student', 'package'], minChildAge: 1, maxChildAge: 12, requireReservation: true },
  performance: { allowedCategories: ['adult', 'child', 'student', 'package'], minChildAge: 0, maxChildAge: 16, requireReservation: true }
};

class TicketTypeService extends BaseService {
  constructor() {
    super(TicketType);
  }

  checkPermission(userRoles, requiredRoles) {
    if (!userRoles || !userRoles.length) return false;
    return userRoles.some(r => requiredRoles.includes(r));
  }

  async getScenicSpot(spotId) {
    return ScenicSpot.findByPk(spotId);
  }

  checkAudienceRule(audience, category, spotType) {
    const errors = [];
    const warnings = [];
    const spotRule = SPOT_TYPE_TICKET_RULES[spotType] || SPOT_TYPE_TICKET_RULES.natural;

    if (!audience) {
      if (category === 'child' || category === 'student') {
        errors.push(`${category === 'child' ? '儿童票' : '学生票'}必须配置适用人群规则`);
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    if (category === 'child') {
      if (!audience.ageRange || !Array.isArray(audience.ageRange) || audience.ageRange.length !== 2) {
        errors.push('儿童票必须配置年龄范围 [min, max]');
      } else {
        const [minA, maxA] = audience.ageRange;
        if (minA < spotRule.minChildAge || maxA > spotRule.maxChildAge) {
          errors.push(`该景点类型儿童票年龄范围应在 ${spotRule.minChildAge}-${spotRule.maxChildAge} 岁`);
        }
        if (minA >= maxA) {
          errors.push('儿童票年龄上限必须大于下限');
        }
      }
    }

    if (category === 'student') {
      if (!audience.certType || !Array.isArray(audience.certType) || !audience.certType.includes('student')) {
        warnings.push('学生票建议校验学生证，建议 certType 包含 student');
      }
    }

    if (category === 'adult') {
      if (audience.ageRange && audience.ageRange[0] < 18) {
        warnings.push('成人票年龄下限建议不低于18岁');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkUseTimeRule(timeRule, scenicSpot) {
    const errors = [];
    const warnings = [];
    if (!timeRule) return { valid: true, errors, warnings };

    if (timeRule.timeRange && Array.isArray(timeRule.timeRange)) {
      if (timeRule.timeRange.length !== 2) {
        errors.push('使用时段 timeRange 应为 [开始时间, 结束时间]');
      } else {
        const timeRE = /^\d{2}:\d{2}$/;
        if (!timeRE.test(timeRule.timeRange[0]) || !timeRE.test(timeRule.timeRange[1])) {
          errors.push('时间格式应为 HH:mm');
        } else if (timeRule.timeRange[0] >= timeRule.timeRange[1]) {
          errors.push('使用结束时间必须晚于开始时间');
        }
      }
    }

    if (timeRule.weekdays && Array.isArray(timeRule.weekdays)) {
      for (const d of timeRule.weekdays) {
        if (d < 1 || d > 7) {
          errors.push('weekdays 取值应为 1-7（1=周一）');
          break;
        }
      }
    }

    if (timeRule.advanceDays !== undefined && timeRule.advanceDays < 0) {
      errors.push('提前购票天数 advanceDays 不能为负数');
    }

    if (scenicSpot && SPOT_TYPE_TICKET_RULES[scenicSpot.spotType]?.requireReservation) {
      if (!timeRule.advanceDays && timeRule.advanceDays !== 0) {
        warnings.push('该景点类型建议配置提前购票天数');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  checkReservationRule(resRule, scenicSpot) {
    const errors = [];
    const warnings = [];
    if (!resRule) return { valid: true, errors, warnings };

    if (resRule.advanceHours !== undefined && resRule.advanceHours < 0) {
      errors.push('预约提前小时数不能为负数');
    }
    if (resRule.maxPerOrder !== undefined) {
      if (resRule.maxPerOrder <= 0) {
        errors.push('每单最大数量必须大于0');
      } else if (resRule.maxPerOrder > 50) {
        warnings.push('每单最大数量过大，建议不超过50');
      }
    }

    if (scenicSpot && SPOT_TYPE_TICKET_RULES[scenicSpot.spotType]?.requireReservation) {
      if (!resRule.realNameRequired) {
        warnings.push('该景点类型建议启用实名认证预约');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkRefundPolicy(refund, category) {
    const errors = [];
    const warnings = [];
    if (!refund) return { valid: true, errors, warnings };

    if (refund.refundable === false && refund.changeable) {
      warnings.push('不可退款票种同时允许改签，需确认是否符合规范');
    }
    if (refund.beforeMinutes !== undefined && refund.beforeMinutes < 0) {
      errors.push('退票提前分钟数不能为负数');
    }
    if (refund.deductRate !== undefined) {
      if (refund.deductRate < 0 || refund.deductRate > 100) {
        errors.push('退票扣费比例应为 0-100（百分比）');
      } else if (refund.deductRate === 100 && refund.refundable) {
        warnings.push('扣费100%等同于不可退，建议确认配置意图');
      }
    }
    if (category === 'package') {
      if (refund.refundable === false) {
        warnings.push('特惠套票设置为不可退款，请确保符合当地消费法规');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  async checkRuleConflicts(data, excludeId = null) {
    const conflicts = [];
    const scenicSpot = await this.getScenicSpot(data.scenicSpotId);
    if (!scenicSpot) return { conflicts, spotValid: false };

    const where = {
      scenicSpotId: data.scenicSpotId,
      ticketCategory: data.ticketCategory,
      enabled: 1,
      status: 1
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const sameCategoryList = await TicketType.findAll({ where });

    for (const other of sameCategoryList) {
      const othAud = other.applicableAudience || {};
      const newAud = data.applicableAudience || {};
      const overlapping = this.isAudienceOverlap(othAud, newAud, data.ticketCategory);
      const timeOverlap = this.isTimeOverlap(other.useTimeRule, data.useTimeRule);
      if (overlapping && timeOverlap) {
        conflicts.push({
          field: 'applicableAudience+useTimeRule',
          message: `与同景点同品类票种「${other.name}」(ID:${other.id}) 适用人群与时间均重叠`,
          conflictingTicketId: other.id
        });
      }
      if (data.name && other.name === data.name) {
        conflicts.push({
          field: 'name',
          message: `票种名称「${data.name}」已存在于该景点下`,
          conflictingTicketId: other.id
        });
      }
    }
    return { conflicts, spotValid: true, scenicSpot };
  }

  isAudienceOverlap(a, b, category) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (category === 'child' && a.ageRange && b.ageRange) {
      const [aMin, aMax] = a.ageRange;
      const [bMin, bMax] = b.ageRange;
      return !(aMax < bMin || bMax < aMin);
    }
    return true;
  }

  isTimeOverlap(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return true;
    if (a.weekdays && b.weekdays) {
      const hasCommonDay = a.weekdays.some(d => b.weekdays.includes(d));
      if (!hasCommonDay) return false;
    }
    if (a.timeRange && b.timeRange) {
      const aStart = a.timeRange[0];
      const aEnd = a.timeRange[1];
      const bStart = b.timeRange[0];
      const bEnd = b.timeRange[1];
      if (aStart && aEnd && bStart && bEnd) {
        if (aEnd <= bStart || bEnd <= aStart) return false;
      }
    }
    return true;
  }

  checkFakeIndicators(data, scenicSpot) {
    const flags = [];
    if (data.price < 0) flags.push({ type: 'fake_price', field: 'price', reason: '票价为负数，疑似虚假配置' });
    if (scenicSpot && data.price > (scenicSpot.basePrice * 10)) {
      flags.push({ type: 'overpriced', field: 'price', reason: `票价超过景点基础票价10倍（¥${scenicSpot.basePrice}），请确认` });
    }
    if (data.ticketCategory === 'package') {
      if (data.originalPrice && data.price > data.originalPrice) {
        flags.push({ type: 'fake_package_discount', field: 'originalPrice', reason: '特惠套票售价高于原价，虚假折扣嫌疑' });
      }
      if (!data.includeItems || !Array.isArray(data.includeItems) || data.includeItems.length === 0) {
        flags.push({ type: 'empty_package', field: 'includeItems', reason: '特惠套票未配置包含项目' });
      }
    }
    if (data.name && /免费|赠送|0元/.test(data.name) && Number(data.price) > 0) {
      flags.push({ type: 'misleading_name', field: 'name', reason: `票种名称包含"免费/赠送/0元"但实际售价 ¥${data.price}` });
    }
    if (!scenicSpot) {
      flags.push({ type: 'invalid_scenic_spot', field: 'scenicSpotId', reason: '所属景点不存在，可能是违规超范围配置' });
    }
    return flags;
  }

  async checkScenicSpotCompliance(spotId, category) {
    const scenicSpot = await this.getScenicSpot(spotId);
    const warnings = [];
    if (!scenicSpot) throw new AppError('所属景点不存在', 400);
    const spotRule = SPOT_TYPE_TICKET_RULES[scenicSpot.spotType] || SPOT_TYPE_TICKET_RULES.natural;
    if (!spotRule.allowedCategories.includes(category)) {
      throw new AppError(`该景点类型(${scenicSpot.spotType})不允许配置此票种`, 400);
    }
    if (scenicSpot.status !== 1 || scenicSpot.enabled === 0) {
      warnings.push('当前景点处于下架/停用状态，票种配置生效后将暂不对客展示');
    }
    if (['closed', 'suspended', 'rectification'].includes(scenicSpot.businessStatus)) {
      warnings.push('当前景点非营业状态，票种售卖将被自动暂停');
    }
    if (scenicSpot.qualificationStatus === 'invalid') {
      warnings.push('景点资质无效，票种可能被拦截上线');
    }
    return { scenicSpot, warnings };
  }

  computeDisplayOrder(data, scenicSpot) {
    let weight = Number(data.displayOrder) || 0;
    if (Number(data.price) > 0) weight += 10;
    if (data.ticketCategory === 'adult') weight += 30;
    if (data.ticketCategory === 'package') weight += 5;
    if (data.status === 1) weight += 20;
    if (scenicSpot?.qualificationStatus === 'compliant') weight += 15;
    return weight;
  }

  async writeLog(params) {
    return TicketTypeLog.create({
      ticketTypeId: params.ticketTypeId,
      ticketNameCache: params.ticketNameCache,
      ticketCategory: params.ticketCategory,
      operationType: params.operationType,
      module: 'ticket_type',
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      operatorRole: params.operatorRole,
      reason: params.reason,
      changes: params.changes,
      verifyResult: params.verifyResult,
      verifyMessage: params.verifyMessage,
      conflictRules: params.conflictRules,
      orderSyncStatus: params.orderSyncStatus,
      orderSyncCount: params.orderSyncCount,
      batchId: params.batchId,
      ip: params.ip,
      userAgent: params.userAgent,
      createdAt: new Date()
    });
  }

  buildChangeList(oldData, newData) {
    const tracked = [
      'name', 'ticketCategory', 'price', 'originalPrice', 'applicableAudience',
      'audienceDescription', 'useTimeRule', 'timeDescription', 'reservationRequired',
      'reservationRule', 'refundPolicy', 'refundDescription', 'dailyQuota',
      'perOrderLimit', 'validityDays', 'status', 'enabled', 'displayOrder',
      'includeItems', 'exclusionNotes', 'purchaseInstructions'
    ];
    const labelMap = {
      name: '票种名称', ticketCategory: '票种品类', price: '售价', originalPrice: '原价',
      applicableAudience: '适用人群规则', audienceDescription: '适用人群说明',
      useTimeRule: '使用时段规则', timeDescription: '使用时段说明',
      reservationRequired: '是否需预约', reservationRule: '预约规则',
      refundPolicy: '退改规则', refundDescription: '退改说明', dailyQuota: '每日配额',
      perOrderLimit: '单次限购', validityDays: '使用有效期',
      status: '上架状态', enabled: '启用状态', displayOrder: '展示排序',
      includeItems: '套票包含项目', exclusionNotes: '费用不含说明',
      purchaseInstructions: '购买须知'
    };
    const changes = [];
    for (const f of tracked) {
      const ov = typeof oldData[f] === 'object' ? JSON.stringify(oldData[f]) : oldData[f];
      const nv = typeof newData[f] === 'object' ? JSON.stringify(newData[f]) : newData[f];
      if (ov !== nv) {
        changes.push({ field: f, fieldLabel: labelMap[f] || f, oldValue: ov, newValue: nv });
      }
    }
    return changes;
  }

  async list(params = {}) {
    const { page = 1, pageSize = 20, ticketCategory, scenicSpotId, scenicSpotName, status, enabled, keyword, city, province } = params;
    const where = {};
    if (ticketCategory) where.ticketCategory = ticketCategory;
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (status !== undefined && status !== '') where.status = Number(status);
    if (enabled !== undefined && enabled !== '') where.enabled = Number(enabled);

    const include = [{ model: ScenicSpot, as: 'scenicSpot', attributes: ['id', 'name', 'spotType', 'city', 'province', 'businessStatus', 'status', 'qualificationStatus'] }];

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { audienceDescription: { [Op.like]: `%${keyword}%` } },
        { refundDescription: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (scenicSpotName) {
      include[0].where = { name: { [Op.like]: `%${scenicSpotName}%` } };
    }
    if (city || province) {
      const spotWhere = {};
      if (city) spotWhere.city = { [Op.like]: `%${city}%` };
      if (province) spotWhere.province = { [Op.like]: `%${province}%` };
      include[0].where = { ...(include[0].where || {}), ...spotWhere };
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    const { count, rows } = await TicketType.findAndCountAll({
      where, include, limit: Number(pageSize), offset,
      order: [['displayOrder', 'DESC'], ['id', 'DESC']]
    });

    const list = rows.map(r => {
      const obj = r.get({ plain: true });
      obj.spotName = obj.scenicSpot?.name;
      obj.spotCity = obj.scenicSpot?.city;
      obj.spotProvince = obj.scenicSpot?.province;
      obj.spotStatus = obj.scenicSpot?.status;
      obj.spotBusinessStatus = obj.scenicSpot?.businessStatus;
      return obj;
    });
    return { total: count, list, page: Number(page), pageSize: Number(pageSize) };
  }

  async create(params, user) {
    if (!this.checkPermission(user?.roles, PERM_TICKET_OPS)) {
      throw new AppError('无权限创建票种配置', 403);
    }
    if (params.ticketCategory === 'package' && !this.checkPermission(user?.roles, PERM_PACKAGE)) {
      throw new AppError('特惠套票配置需专项权限', 403);
    }
    if (!TICKET_CATEGORIES.includes(params.ticketCategory)) {
      throw new AppError('无效的票种品类', 400);
    }
    const scenicSpot = await this.getScenicSpot(params.scenicSpotId);
    if (!scenicSpot) throw new AppError('所属景点不存在', 400);

    const spotCheck = await this.checkScenicSpotCompliance(params.scenicSpotId, params.ticketCategory);
    const allWarnings = [...(spotCheck.warnings || [])];

    const audCheck = this.checkAudienceRule(params.applicableAudience, params.ticketCategory, scenicSpot.spotType);
    const timeCheck = this.checkUseTimeRule(params.useTimeRule, scenicSpot);
    const resCheck = this.checkReservationRule(params.reservationRule, scenicSpot);
    const refundCheck = this.checkRefundPolicy(params.refundPolicy, params.ticketCategory);

    const allErrors = [...audCheck.errors, ...timeCheck.errors, ...resCheck.errors, ...refundCheck.errors];
    allWarnings.push(...audCheck.warnings, ...timeCheck.warnings, ...resCheck.warnings, ...refundCheck.warnings);

    const { conflicts } = await this.checkRuleConflicts(params);
    if (conflicts.length) {
      allErrors.push(...conflicts.map(c => c.message));
    }

    const fakeFlags = this.checkFakeIndicators(params, scenicSpot);

    if (allErrors.length) {
      await this.writeLog({
        ticketTypeId: null, ticketNameCache: params.name, ticketCategory: params.ticketCategory,
        operationType: 'create_attempt',
        operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
        verifyResult: 'block', verifyMessage: allErrors.join('；'), conflictRules: conflicts,
        ip: user?.ip, userAgent: user?.ua
      });
      throw new AppError('票种规则校验未通过：' + allErrors.join('；'), 400);
    }

    const createData = {
      ...params,
      scenicSpotNameCache: scenicSpot.name,
      merchantId: scenicSpot.merchantId,
      isFake: fakeFlags.length > 0 ? 1 : 0,
      violationFlags: fakeFlags.length ? fakeFlags : null,
      displayOrder: this.computeDisplayOrder(params, scenicSpot),
      createdBy: user?.name,
      updatedBy: user?.name
    };
    if (createData.reservationRequired === undefined) {
      createData.reservationRequired = SPOT_TYPE_TICKET_RULES[scenicSpot.spotType]?.requireReservation ? 1 : 0;
    }

    const created = await TicketType.create(createData);

    await this.writeLog({
      ticketTypeId: created.id, ticketNameCache: created.name, ticketCategory: created.ticketCategory,
      operationType: 'create',
      operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
      verifyResult: fakeFlags.length ? 'warning' : 'pass',
      verifyMessage: fakeFlags.map(f => f.reason).join('；') || null,
      orderSyncStatus: 'pending',
      ip: user?.ip, userAgent: user?.ua
    });

    return created;
  }

  async update(id, params, user) {
    if (!this.checkPermission(user?.roles, PERM_TICKET_OPS)) {
      throw new AppError('无权限修改票种配置', 403);
    }
    const old = await TicketType.findByPk(id);
    if (!old) throw new AppError('票种不存在', 404);
    if (params.ticketCategory && params.ticketCategory !== old.ticketCategory) {
      throw new AppError('票种品类不允许修改，请重新创建', 400);
    }
    if (params.ticketCategory === 'package' || old.ticketCategory === 'package') {
      if (!this.checkPermission(user?.roles, PERM_PACKAGE)) {
        throw new AppError('特惠套票修改需专项权限', 403);
      }
    }

    const merged = { ...old.get({ plain: true }), ...params };
    const scenicSpot = await this.getScenicSpot(merged.scenicSpotId);

    const audCheck = this.checkAudienceRule(merged.applicableAudience, merged.ticketCategory, scenicSpot?.spotType);
    const timeCheck = this.checkUseTimeRule(merged.useTimeRule, scenicSpot);
    const resCheck = this.checkReservationRule(merged.reservationRule, scenicSpot);
    const refundCheck = this.checkRefundPolicy(merged.refundPolicy, merged.ticketCategory);

    const allErrors = [...audCheck.errors, ...timeCheck.errors, ...resCheck.errors, ...refundCheck.errors];
    const allWarnings = [...audCheck.warnings, ...timeCheck.warnings, ...resCheck.warnings, ...refundCheck.warnings];

    const { conflicts } = await this.checkRuleConflicts(merged, id);
    if (conflicts.length) allErrors.push(...conflicts.map(c => c.message));

    const fakeFlags = this.checkFakeIndicators(merged, scenicSpot);

    if (allErrors.length) {
      await this.writeLog({
        ticketTypeId: id, ticketNameCache: merged.name, ticketCategory: merged.ticketCategory,
        operationType: 'update_attempt',
        operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
        verifyResult: 'block', verifyMessage: allErrors.join('；'), conflictRules: conflicts,
        ip: user?.ip, userAgent: user?.ua
      });
      throw new AppError('票种规则校验未通过：' + allErrors.join('；'), 400);
    }

    const changes = this.buildChangeList(old.get({ plain: true }), merged);
    if (!changes.length) {
      return old;
    }

    const updateData = { ...params };
    if (params.price !== undefined || params.status !== undefined || params.ticketCategory !== undefined) {
      updateData.displayOrder = this.computeDisplayOrder(merged, scenicSpot);
    }
    updateData.isFake = fakeFlags.length ? 1 : 0;
    updateData.violationFlags = fakeFlags.length ? fakeFlags : null;
    updateData.updatedBy = user?.name;

    await TicketType.update(updateData, { where: { id } });
    const updated = await TicketType.findByPk(id);

    await this.writeLog({
      ticketTypeId: id, ticketNameCache: updated.name, ticketCategory: updated.ticketCategory,
      operationType: 'update',
      operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
      changes,
      verifyResult: fakeFlags.length ? 'warning' : 'pass',
      verifyMessage: (allWarnings.length ? allWarnings.join('；') : null) || (fakeFlags.length ? fakeFlags.map(f => f.reason).join('；') : null),
      orderSyncStatus: changes.some(c => ['refundPolicy', 'refundDescription', 'useTimeRule', 'validityDays', 'purchaseInstructions'].includes(c.field)) ? 'processing' : 'no_need',
      orderSyncCount: changes.some(c => ['refundPolicy', 'refundDescription', 'useTimeRule', 'validityDays', 'purchaseInstructions'].includes(c.field)) ? 0 : 0,
      ip: user?.ip, userAgent: user?.ua
    });
    return updated;
  }

  async changeStatus(id, newStatus, reason, user) {
    if (!this.checkPermission(user?.roles, PERM_TICKET_OPS)) {
      throw new AppError('无权限变更票种状态', 403);
    }
    const ticket = await TicketType.findByPk(id);
    if (!ticket) throw new AppError('票种不存在', 404);
    const oldStatus = ticket.status;
    await TicketType.update({ status: newStatus, enabled: newStatus === 1 ? 1 : ticket.enabled, updatedBy: user?.name }, { where: { id } });
    await this.writeLog({
      ticketTypeId: id, ticketNameCache: ticket.name, ticketCategory: ticket.ticketCategory,
      operationType: newStatus === 1 ? 'on_shelf' : 'off_shelf',
      operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
      reason,
      changes: [{ field: 'status', fieldLabel: '上架状态', oldValue: oldStatus, newValue: newStatus }],
      verifyResult: 'pass',
      orderSyncStatus: newStatus === 0 ? 'processing' : 'no_need',
      ip: user?.ip, userAgent: user?.ua
    });
    return TicketType.findByPk(id);
  }

  async setEnabled(id, enabled, reason, user) {
    if (!this.checkPermission(user?.roles, PERM_TICKET_OPS)) throw new AppError('无权限', 403);
    const ticket = await TicketType.findByPk(id);
    if (!ticket) throw new AppError('票种不存在', 404);
    const old = ticket.enabled;
    await TicketType.update({ enabled, updatedBy: user?.name }, { where: { id } });
    await this.writeLog({
      ticketTypeId: id, ticketNameCache: ticket.name, ticketCategory: ticket.ticketCategory,
      operationType: enabled ? 'enable' : 'disable',
      operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
      reason,
      changes: [{ field: 'enabled', fieldLabel: '启用状态', oldValue: old, newValue: enabled }],
      verifyResult: 'pass',
      ip: user?.ip, userAgent: user?.ua
    });
    return TicketType.findByPk(id);
  }

  async batchOperation(data, user) {
    if (!this.checkPermission(user?.roles, PERM_BATCH)) throw new AppError('批量操作需管理员或高级票务运营权限', 403);
    const { ids, operation, reason = '', scope = 'global', applyTo = {}, updateFields = {} } = data;
    if (!ids || !ids.length) throw new AppError('请选择要操作的票种', 400);

    const needPackagePerm = ids.some(async (id) => {
      const t = await TicketType.findByPk(id);
      return t && t.ticketCategory === 'package';
    });
    if (needPackagePerm && operation !== 'on_shelf' && operation !== 'off_shelf') {
      if (!this.checkPermission(user?.roles, PERM_PACKAGE)) {
        throw new AppError('选中包含特惠套票，批量修改其规则需专项权限', 403);
      }
    }

    let filterIds = ids;
    if (scope === 'local' && applyTo.scenicSpotId) {
      const list = await TicketType.findAll({ where: { id: { [Op.in]: ids }, scenicSpotId: applyTo.scenicSpotId } });
      filterIds = list.map(t => t.id);
    }
    if (scope === 'local' && applyTo.ticketCategory) {
      const list = await TicketType.findAll({ where: { id: { [Op.in]: filterIds }, ticketCategory: applyTo.ticketCategory } });
      filterIds = list.map(t => t.id);
    }
    if (!filterIds.length) throw new AppError('按作用域过滤后无可操作票种', 400);

    const batchId = 'BATCH_' + Date.now();
    let updated = 0;
    let skipped = 0;
    const total = filterIds.length;

    for (const id of filterIds) {
      try {
        const ticket = await TicketType.findByPk(id);
        if (!ticket) { skipped++; continue; }
        if (ticket.ticketCategory === 'package' && !this.checkPermission(user?.roles, PERM_PACKAGE) && ['adjust_refund', 'adjust_audience'].includes(operation)) {
          skipped++;
          continue;
        }
        let toUpdate = {};
        let opType = 'batch_update';
        const oldPlain = ticket.get({ plain: true });
        switch (operation) {
          case 'enable':
            toUpdate = { enabled: 1 };
            opType = 'enable';
            break;
          case 'disable':
            toUpdate = { enabled: 0 };
            opType = 'disable';
            break;
          case 'on_shelf':
            toUpdate = { status: 1 };
            opType = 'on_shelf';
            break;
          case 'off_shelf':
            toUpdate = { status: 0 };
            opType = 'off_shelf';
            break;
          case 'adjust_refund':
            if (!updateFields.refundPolicy && updateFields.refundPolicy !== null) throw new AppError('缺少 refundPolicy 参数');
            toUpdate = { refundPolicy: updateFields.refundPolicy, refundDescription: updateFields.refundDescription || ticket.refundDescription };
            opType = 'update';
            break;
          case 'adjust_audience':
            if (!updateFields.applicableAudience) throw new AppError('缺少 applicableAudience 参数');
            toUpdate = { applicableAudience: updateFields.applicableAudience, audienceDescription: updateFields.audienceDescription || ticket.audienceDescription };
            opType = 'update';
            break;
          case 'adjust_time':
            toUpdate = { useTimeRule: updateFields.useTimeRule || ticket.useTimeRule, timeDescription: updateFields.timeDescription || ticket.timeDescription };
            opType = 'update';
            break;
          default:
            throw new AppError(`未知批量操作：${operation}`);
        }
        toUpdate.updatedBy = user?.name;
        await TicketType.update(toUpdate, { where: { id } });
        const changes = this.buildChangeList(oldPlain, { ...oldPlain, ...toUpdate });
        await this.writeLog({
          ticketTypeId: id, ticketNameCache: ticket.name, ticketCategory: ticket.ticketCategory,
          operationType: opType,
          operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
          reason: `批量操作(${operation}) ${reason}`,
          changes,
          batchId,
          verifyResult: 'pass',
          ip: user?.ip, userAgent: user?.ua
        });
        updated++;
      } catch (e) {
        skipped++;
      }
    }
    return { batchId, total, updated, skipped };
  }

  async verifyTicket(id, verifyType, reason, user) {
    if (!this.checkPermission(user?.roles, PERM_TICKET_AUDIT)) throw new AppError('无审核权限', 403);
    const ticket = await TicketType.findByPk(id);
    if (!ticket) throw new AppError('票种不存在', 404);
    let update = {};
    let opType = 'verify_pass';
    if (verifyType === 'pass') {
      update = { isFake: 0, violationFlags: null, status: ticket.status === 0 ? 1 : ticket.status };
      opType = 'verify_pass';
    } else if (verifyType === 'warning') {
      update = { isFake: 1 };
      opType = 'verify_warning';
    } else if (verifyType === 'block') {
      update = { isFake: 1, status: 0, enabled: 0 };
      opType = 'verify_block';
    } else {
      throw new AppError('无效的审核类型', 400);
    }
    update.updatedBy = user?.name;
    await TicketType.update(update, { where: { id } });
    await this.writeLog({
      ticketTypeId: id, ticketNameCache: ticket.name, ticketCategory: ticket.ticketCategory,
      operationType: opType,
      operatorId: user?.id, operatorName: user?.name, operatorRole: user?.roles?.[0],
      reason,
      verifyResult: verifyType === 'pass' ? 'pass' : (verifyType === 'block' ? 'block' : 'warning'),
      ip: user?.ip, userAgent: user?.ua
    });
    return TicketType.findByPk(id);
  }

  async getLogs(id, params = {}) {
    const { page = 1, pageSize = 20, logType } = params;
    const where = { ticketTypeId: id };
    if (logType) where.operationType = logType;
    const offset = (Number(page) - 1) * Number(pageSize);
    const { count, rows } = await TicketTypeLog.findAndCountAll({
      where, limit: Number(pageSize), offset,
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows, page: Number(page), pageSize: Number(pageSize) };
  }

  async getAllLogs(params = {}) {
    const { page = 1, pageSize = 20, operationType, ticketCategory, operatorName } = params;
    const where = {};
    if (operationType) where.operationType = operationType;
    if (ticketCategory) where.ticketCategory = ticketCategory;
    if (operatorName) where.operatorName = { [Op.like]: `%${operatorName}%` };
    const offset = (Number(page) - 1) * Number(pageSize);
    const include = [{ model: TicketType, as: 'ticketType', attributes: ['id', 'name', 'price', 'status', 'enabled'] }];
    const { count, rows } = await TicketTypeLog.findAndCountAll({
      where, include, limit: Number(pageSize), offset,
      order: [['createdAt', 'DESC']]
    });
    return { total: count, list: rows, page: Number(page), pageSize: Number(pageSize) };
  }

  async checkPermissionEndpoint(type, user) {
    switch (type) {
      case 'ticket_ops':
        return { canCreate: this.checkPermission(user?.roles, PERM_TICKET_OPS), canDelete: this.checkPermission(user?.roles, PERM_BATCH) };
      case 'package':
        return { canCreate: this.checkPermission(user?.roles, PERM_PACKAGE), canEdit: this.checkPermission(user?.roles, PERM_PACKAGE) };
      case 'batch':
        return { allowed: this.checkPermission(user?.roles, PERM_BATCH) };
      default:
        return { allowed: this.checkPermission(user?.roles, PERM_TICKET_OPS) };
    }
  }
}

module.exports = new TicketTypeService();
