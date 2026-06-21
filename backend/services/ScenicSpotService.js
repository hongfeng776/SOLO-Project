const BaseService = require('./BaseService');
const ScenicSpot = require('../models/ScenicSpot');
const ScenicSpotLog = require('../models/ScenicSpotLog');
const Merchant = require('../models/Merchant');
const { Op } = require('sequelize');
const { AppError } = require('../utils/error');

const PERMISSION_SPOT_OPS = ['admin', 'scenic_operator', 'senior_scenic_operator'];
const PERMISSION_PERFORMANCE = ['admin', 'senior_scenic_operator', 'performance_auditor'];
const PERMISSION_QUALIFICATION_AUDIT = ['admin', 'senior_scenic_operator', 'scenic_auditor'];

const SPOT_TYPES = ['natural', 'cultural', 'theme', 'performance'];
const BUSINESS_STATUSES = ['operating', 'closed', 'suspended', 'rectification', 'maintenance'];
const TICKET_FREEZING_STATUSES = ['closed', 'suspended', 'rectification', 'maintenance'];

class ScenicSpotService extends BaseService {
  constructor() {
    super(ScenicSpot);
  }

  checkPermission(userRoles, requiredPermissions) {
    if (!userRoles || userRoles.length === 0) return false;
    return userRoles.some(role => requiredPermissions.includes(role));
  }

  checkAddressValidity(address, city, province, country = '中国') {
    const warnings = [];
    const errors = [];
    if (!address || address.length < 5) {
      errors.push('详细地址不能少于5个字符');
    }
    if (!city) {
      errors.push('城市不能为空');
    }
    if (!province) {
      warnings.push('建议填写省份信息，便于区域批量操作');
    }
    if (!country) {
      errors.push('国家不能为空');
    }
    if (address && !/[\u4e00-\u9fa5a-zA-Z0-9]/.test(address)) {
      warnings.push('地址格式可能异常，请确认');
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkOpeningHoursValidity(openingHours, closingDays) {
    const warnings = [];
    const errors = [];
    if (!openingHours) {
      errors.push('开放时间不能为空');
    } else if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(openingHours)) {
      errors.push('开放时间格式应为 HH:mm-HH:mm');
    } else {
      const [start, end] = openingHours.split('-');
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        errors.push('开放结束时间必须晚于开始时间');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkLimitRuleValidity(currentLimit, maxDailyCapacity, limitRule) {
    const warnings = [];
    const errors = [];
    if (maxDailyCapacity !== null && maxDailyCapacity !== undefined) {
      if (maxDailyCapacity < 0) {
        errors.push('日最大承载量不能为负数');
      }
    }
    if (currentLimit !== null && currentLimit !== undefined) {
      if (currentLimit < 0) {
        errors.push('限流人数不能为负数');
      }
      if (maxDailyCapacity && currentLimit > maxDailyCapacity) {
        errors.push('限流人数不能超过日最大承载量');
      }
      if (currentLimit > 0 && !limitRule) {
        warnings.push('建议填写限流规则说明');
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkBusinessStatusValidity(businessStatus, oldData = {}) {
    const warnings = [];
    const errors = [];
    if (!BUSINESS_STATUSES.includes(businessStatus)) {
      errors.push('经营状态无效');
    }
    if (oldData.businessStatus === 'closed' && businessStatus === 'operating') {
      warnings.push('已闭园景点重新开放需重新审核资质');
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkQualificationValidity(data) {
    const warnings = [];
    const errors = [];
    const now = new Date();

    const checkLicense = (no, expire, name) => {
      if (!no) {
        errors.push(`${name}编号不能为空`);
      }
      if (expire) {
        const expireDate = new Date(expire);
        const diffDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          errors.push(`${name}已过期`);
        } else if (diffDays < 30) {
          warnings.push(`${name}将在${diffDays}天后过期`);
        }
      } else {
        errors.push(`${name}有效期不能为空`);
      }
    };

    checkLicense(data.businessLicenseNo, data.businessLicenseExpire, '营业执照');
    checkLicense(data.tourismLicenseNo, data.tourismLicenseExpire, '文旅经营许可证');
    checkLicense(data.safetyLicenseNo, data.safetyLicenseExpire, '安全检查合格证');
    checkLicense(data.fireSafetyLicenseNo, data.fireSafetyLicenseExpire, '消防安全合格证');

    if (data.spotType === 'performance') {
      checkLicense(data.performanceLicenseNo, data.performanceLicenseExpire, '演出经营许可证');
    }

    let status = 'compliant';
    if (errors.length > 0) status = 'invalid';
    else if (warnings.length > 0) status = 'expired';

    return { valid: errors.length === 0, errors, warnings, status };
  }

  checkPerformanceScheduleValidity(schedule) {
    const warnings = [];
    const errors = [];
    if (!schedule) {
      errors.push('展演类景点必须设置场次安排');
      return { valid: false, errors, warnings };
    }
    let scheduleArr = [];
    try {
      scheduleArr = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    } catch (e) {
      errors.push('场次安排格式错误');
      return { valid: false, errors, warnings };
    }
    if (!Array.isArray(scheduleArr) || scheduleArr.length === 0) {
      errors.push('展演类景点至少需要配置一个场次');
    }
    scheduleArr.forEach((item, idx) => {
      if (!item.startTime || !item.endTime) {
        errors.push(`第${idx + 1}个场次缺少时间配置`);
      }
      if (item.capacity && item.capacity <= 0) {
        errors.push(`第${idx + 1}个场次容量无效`);
      }
    });
    return { valid: errors.length === 0, errors, warnings };
  }

  checkDuplicateSpot(name, address, excludeId = null) {
    const where = {
      [Op.or]: [
        { name },
        { address }
      ]
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.model.findOne({ where });
  }

  checkFakeSpotIndicators(data) {
    const warnings = [];
    const errors = [];
    if (data.basePrice && data.basePrice < 0) {
      errors.push('价格不能为负数');
    }
    if (data.basePrice && data.basePrice > 10000) {
      warnings.push('价格异常高，请确认是否虚假景点');
    }
    if (data.maxDailyCapacity && data.maxDailyCapacity <= 0) {
      warnings.push('日最大承载量信息异常');
    }
    if (!data.phone || data.phone.length < 6) {
      warnings.push('联系电话信息不完整');
    }
    if (!data.description || data.description.length < 20) {
      warnings.push('景点描述过于简短');
    }
    return { isFake: errors.some(e => e.includes('虚假')) || warnings.length >= 3, warnings, errors };
  }

  async writeOperationLog(params) {
    return ScenicSpotLog.create({
      scenicSpotId: params.scenicSpotId,
      operationType: params.operationType,
      operationModule: params.operationModule,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      changeFields: params.changeFields,
      operationReason: params.operationReason,
      operatorId: params.operatorId,
      operatorName: params.operatorName || 'system',
      operatorRole: params.operatorRole,
      operationIp: params.operationIp,
      isBatch: params.isBatch || false,
      batchId: params.batchId,
      verifyResult: params.verifyResult,
      verifyMessages: params.verifyMessages ? JSON.stringify(params.verifyMessages) : null,
      ticketFreezeFlag: params.ticketFreezeFlag || false,
      notificationSent: params.notificationSent || false
    });
  }

  calculateDisplayWeight(data) {
    let weight = 50;
    const statusWeightMap = {
      operating: 15,
      closed: -80,
      suspended: -40,
      rectification: -30,
      maintenance: -20
    };
    weight += (statusWeightMap[data.businessStatus] || 0);

    const qualWeightMap = {
      compliant: 20,
      expired: -10,
      pending: 0,
      invalid: -60
    };
    weight += (qualWeightMap[data.qualificationStatus] || 0);

    const levelWeightMap = { 'A': 2, 'AA': 5, 'AAA': 8, 'AAAA': 12, 'AAAAA': 18 };
    if (data.level) weight += (levelWeightMap[data.level] || 0);

    if (data.isFake) weight -= 60;
    if (data.isDuplicate) weight -= 60;
    if (data.openStatus === 0) weight -= 30;

    weight = Math.max(0, Math.min(100, weight));
    return weight;
  }

  getTicketFreezeFlag(businessStatus, openStatus) {
    return TICKET_FREEZING_STATUSES.includes(businessStatus) || openStatus === 0;
  }

  async getList(params = {}, userRoles = []) {
    const { spotType, businessStatus, city, province, level, qualificationStatus, keyword, ...rest } = params;

    if (!this.checkPermission(userRoles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权访问景区资源管控模块', 403);
    }

    const where = {};
    if (spotType) where.spotType = spotType;
    if (businessStatus) where.businessStatus = businessStatus;
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (province) where.province = { [Op.like]: `%${province}%` };
    if (level) where.level = level;
    if (qualificationStatus) where.qualificationStatus = qualificationStatus;

    return super.getList({ ...rest, ...where }, {
      searchFields: keyword ? ['name', 'address', 'businessLicenseNo'] : undefined,
      keyword,
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }],
      order: [['displayWeight', 'DESC'], ['updatedAt', 'DESC']]
    });
  }

  async getById(id, userRoles = []) {
    if (!this.checkPermission(userRoles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权访问景点详情', 403);
    }
    return super.getById(id, {
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }

  async create(data, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权限创建景点资源', 403);
    }
    if (!SPOT_TYPES.includes(data.spotType)) {
      throw new AppError('景点类型无效', 400);
    }
    if (data.spotType === 'performance' && !this.checkPermission(operator.roles, PERMISSION_PERFORMANCE)) {
      throw new AppError('无展演类景点运营权限，无法创建特色展演', 403);
    }

    const allErrors = [];
    const allWarnings = [];
    let verifyResult = 'pass';

    const addrCheck = this.checkAddressValidity(data.address, data.city, data.province, data.country);
    allErrors.push(...addrCheck.errors);
    allWarnings.push(...addrCheck.warnings);

    const timeCheck = this.checkOpeningHoursValidity(data.openingHours, data.closingDays);
    allErrors.push(...timeCheck.errors);
    allWarnings.push(...timeCheck.warnings);

    const limitCheck = this.checkLimitRuleValidity(data.currentLimit, data.maxDailyCapacity, data.limitRule);
    allErrors.push(...limitCheck.errors);
    allWarnings.push(...limitCheck.warnings);

    const qualCheck = this.checkQualificationValidity(data);
    allErrors.push(...qualCheck.errors);
    allWarnings.push(...qualCheck.warnings);
    data.qualificationStatus = qualCheck.status;

    if (data.spotType === 'performance') {
      const perfCheck = this.checkPerformanceScheduleValidity(data.performanceSchedule);
      allErrors.push(...perfCheck.errors);
      allWarnings.push(...perfCheck.warnings);
    }

    const fakeCheck = this.checkFakeSpotIndicators(data);
    allErrors.push(...fakeCheck.errors);
    allWarnings.push(...fakeCheck.warnings);
    if (fakeCheck.isFake) {
      data.isFake = true;
      allErrors.push('景点被标记为可疑虚假景点');
    }

    const duplicate = await this.checkDuplicateSpot(data.name, data.address);
    if (duplicate) {
      data.isDuplicate = true;
      allErrors.push('检测到重复景点（名称或地址相同）');
    }

    if (allErrors.length > 0) {
      verifyResult = 'block';
      throw new AppError(`景点创建被拦截：${allErrors.join('；')}`, 400);
    }
    if (allWarnings.length > 0) {
      verifyResult = 'warning';
    }

    data.warningFlags = allWarnings.length > 0 ? JSON.stringify(allWarnings) : null;
    data.displayWeight = this.calculateDisplayWeight(data);
    data.ticketSaleStatus = this.getTicketFreezeFlag(data.businessStatus, data.openStatus) ? 0 : 1;
    data.createdBy = operator.username;
    data.updatedBy = operator.username;

    const spot = await super.create(data);

    await this.writeOperationLog({
      scenicSpotId: spot.id,
      operationType: 'create',
      operationModule: 'basic_info',
      newValue: spot,
      operatorId: operator.id,
      operatorName: operator.username,
      operatorRole: operator.roles?.[0],
      verifyResult,
      verifyMessages: allWarnings.length > 0 ? allWarnings : null,
      ticketFreezeFlag: this.getTicketFreezeFlag(data.businessStatus, data.openStatus)
    });

    return spot;
  }

  async update(id, data, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权限编辑景点资源', 403);
    }
    const oldSpot = await this.getById(id, operator.roles);
    if (!oldSpot) throw new AppError('景点不存在', 404);

    if ((data.spotType === 'performance' || oldSpot.spotType === 'performance')
        && !this.checkPermission(operator.roles, PERMISSION_PERFORMANCE)) {
      throw new AppError('无展演类景点运营权限', 403);
    }

    const allErrors = [];
    const allWarnings = [];
    let verifyResult = 'pass';
    const changedFields = [];

    const addrCheck = this.checkAddressValidity(
      data.address || oldSpot.address, data.city || oldSpot.city,
      data.province || oldSpot.province, data.country || oldSpot.country
    );
    allErrors.push(...addrCheck.errors);
    allWarnings.push(...addrCheck.warnings);

    const timeCheck = this.checkOpeningHoursValidity(
      data.openingHours !== undefined ? data.openingHours : oldSpot.openingHours,
      data.closingDays || oldSpot.closingDays
    );
    allErrors.push(...timeCheck.errors);
    allWarnings.push(...timeCheck.warnings);

    const limitCheck = this.checkLimitRuleValidity(
      data.currentLimit !== undefined ? data.currentLimit : oldSpot.currentLimit,
      data.maxDailyCapacity !== undefined ? data.maxDailyCapacity : oldSpot.maxDailyCapacity,
      data.limitRule || oldSpot.limitRule
    );
    allErrors.push(...limitCheck.errors);
    allWarnings.push(...limitCheck.warnings);

    if (data.businessStatus) {
      const statusCheck = this.checkBusinessStatusValidity(data.businessStatus, oldSpot);
      allErrors.push(...statusCheck.errors);
      allWarnings.push(...statusCheck.warnings);
    }

    const mergedData = { ...oldSpot, ...data };
    const qualCheck = this.checkQualificationValidity(mergedData);
    allErrors.push(...qualCheck.errors);
    allWarnings.push(...qualCheck.warnings);
    data.qualificationStatus = qualCheck.status;

    const perfSpotType = data.spotType || oldSpot.spotType;
    if (perfSpotType === 'performance' && (data.performanceSchedule !== undefined || oldSpot.performanceSchedule)) {
      const perfCheck = this.checkPerformanceScheduleValidity(
        data.performanceSchedule !== undefined ? data.performanceSchedule : oldSpot.performanceSchedule
      );
      allErrors.push(...perfCheck.errors);
      allWarnings.push(...perfCheck.warnings);
    }

    const fakeCheck = this.checkFakeSpotIndicators(mergedData);
    allErrors.push(...fakeCheck.errors);
    allWarnings.push(...fakeCheck.warnings);
    if (fakeCheck.isFake) data.isFake = true;

    if (data.name || data.address) {
      const duplicate = await this.checkDuplicateSpot(
        data.name || oldSpot.name, data.address || oldSpot.address, id
      );
      if (duplicate) {
        data.isDuplicate = true;
        allErrors.push('检测到与其他景点重复（名称或地址相同）');
      }
    }

    if (allErrors.length > 0) {
      verifyResult = 'block';
      throw new AppError(`保存被拦截：${allErrors.join('；')}`, 400);
    }
    if (allWarnings.length > 0) verifyResult = 'warning';

    Object.keys(data).forEach(key => {
      if (oldSpot[key] !== data[key] && key !== 'updatedBy') changedFields.push(key);
    });

    if (changedFields.some(f => ['businessStatus','qualificationStatus','level','isFake','isDuplicate','openStatus'].includes(f))) {
      const finalData = { ...oldSpot, ...data };
      data.displayWeight = this.calculateDisplayWeight(finalData);
      changedFields.push('displayWeight');
    }

    const finalBusinessStatus = data.businessStatus || oldSpot.businessStatus;
    const finalOpenStatus = data.openStatus !== undefined ? data.openStatus : oldSpot.openStatus;
    const freezeTicket = this.getTicketFreezeFlag(finalBusinessStatus, finalOpenStatus);
    if (freezeTicket && oldSpot.ticketSaleStatus === 1) {
      data.ticketSaleStatus = 0;
      changedFields.push('ticketSaleStatus');
    } else if (!freezeTicket && oldSpot.ticketSaleStatus === 0 && qualCheck.status === 'compliant') {
      data.ticketSaleStatus = 1;
      changedFields.push('ticketSaleStatus');
    }

    if (data.status === undefined && (TICKET_FREEZING_STATUSES.includes(finalBusinessStatus) || finalOpenStatus === 0)) {
      data.status = 0;
      changedFields.push('status');
    } else if (data.status === undefined && finalBusinessStatus === 'operating' && finalOpenStatus === 1 && qualCheck.status === 'compliant') {
      data.status = 1;
      changedFields.push('status');
    }

    data.warningFlags = allWarnings.length > 0 ? JSON.stringify(allWarnings) : null;
    data.updatedBy = operator.username;

    const spot = await super.update(id, data);
    const newSpot = await this.getById(id, operator.roles);

    await this.writeAllLogs(id, oldSpot, newSpot, changedFields, data, operator, verifyResult, allWarnings, freezeTicket);

    return newSpot;
  }

  async writeAllLogs(id, oldSpot, newSpot, changedFields, data, operator, verifyResult, allWarnings, freezeTicket) {
    if (changedFields.includes('businessStatus')) {
      await this.writeOperationLog({
        scenicSpotId: id, operationType: 'status_change', operationModule: 'status',
        oldValue: { businessStatus: oldSpot.businessStatus },
        newValue: { businessStatus: data.businessStatus },
        changeFields: 'businessStatus', operationReason: data.statusReason,
        operatorId: operator.id, operatorName: operator.username,
        operatorRole: operator.roles?.[0], verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null,
        ticketFreezeFlag: freezeTicket, notificationSent: freezeTicket
      });
    }

    const basicFields = ['name','address','city','province','country','level','phone','email','description','basePrice','maxDailyCapacity','currentLimit','limitRule','openingHours','closingDays'];
    const hasBasicChanges = changedFields.some(f => basicFields.includes(f));
    if (hasBasicChanges) {
      const oldBasic = {}, newBasic = {};
      basicFields.forEach(f => { if (changedFields.includes(f)) { oldBasic[f] = oldSpot[f]; newBasic[f] = newSpot[f]; } });
      await this.writeOperationLog({
        scenicSpotId: id, operationType: 'update', operationModule: 'basic_info',
        oldValue: oldBasic, newValue: newBasic,
        changeFields: basicFields.filter(f => changedFields.includes(f)).join(','),
        operatorId: operator.id, operatorName: operator.username,
        operatorRole: operator.roles?.[0], verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null
      });
    }

    const qualFields = ['businessLicenseNo','businessLicenseExpire','tourismLicenseNo','tourismLicenseExpire','safetyLicenseNo','safetyLicenseExpire','fireSafetyLicenseNo','fireSafetyLicenseExpire','performanceLicenseNo','performanceLicenseExpire','qualificationStatus'];
    const hasQualChanges = changedFields.some(f => qualFields.includes(f));
    if (hasQualChanges) {
      const oldQual = {}, newQual = {};
      qualFields.forEach(f => { if (changedFields.includes(f)) { oldQual[f] = oldSpot[f]; newQual[f] = newSpot[f]; } });
      await this.writeOperationLog({
        scenicSpotId: id, operationType: 'qualification_audit', operationModule: 'qualification',
        oldValue: oldQual, newValue: newQual,
        changeFields: qualFields.filter(f => changedFields.includes(f)).join(','),
        operatorId: operator.id, operatorName: operator.username,
        operatorRole: operator.roles?.[0], verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null
      });
    }

    if (changedFields.includes('displayWeight')) {
      await this.writeOperationLog({
        scenicSpotId: id, operationType: 'weight_adjust', operationModule: 'weight',
        oldValue: { displayWeight: oldSpot.displayWeight },
        newValue: { displayWeight: newSpot.displayWeight },
        changeFields: 'displayWeight', operatorId: operator.id,
        operatorName: operator.username, operatorRole: operator.roles?.[0], verifyResult: 'pass'
      });
    }

    if (data.status !== undefined && oldSpot.status !== data.status) {
      await this.writeOperationLog({
        scenicSpotId: id, operationType: data.status === 1 ? 'on_shelf' : 'off_shelf',
        operationModule: 'status',
        oldValue: { status: oldSpot.status }, newValue: { status: data.status },
        changeFields: 'status', operationReason: data.statusReason,
        operatorId: operator.id, operatorName: operator.username,
        operatorRole: operator.roles?.[0], verifyResult,
        ticketFreezeFlag: data.status === 0, notificationSent: data.status === 0
      });
    }

    if (changedFields.includes('performanceSchedule') || changedFields.includes('currentLimit')) {
      await this.writeOperationLog({
        scenicSpotId: id, operationType: 'update',
        operationModule: changedFields.includes('performanceSchedule') ? 'performance' : 'limit',
        oldValue: {
          performanceSchedule: oldSpot.performanceSchedule,
          currentLimit: oldSpot.currentLimit,
          limitRule: oldSpot.limitRule
        },
        newValue: {
          performanceSchedule: newSpot.performanceSchedule,
          currentLimit: newSpot.currentLimit,
          limitRule: newSpot.limitRule
        },
        changeFields: changedFields.filter(f => ['performanceSchedule','currentLimit','limitRule'].includes(f)).join(','),
        operatorId: operator.id, operatorName: operator.username,
        operatorRole: operator.roles?.[0], verifyResult
      });
    }
  }

  async changeStatus(id, status, reason, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权限变更景点状态', 403);
    }
    const spot = await this.getById(id, operator.roles);
    if (!spot) throw new AppError('景点不存在', 404);

    if (spot.spotType === 'performance' && !this.checkPermission(operator.roles, PERMISSION_PERFORMANCE)) {
      throw new AppError('无展演类景点运营权限', 403);
    }

    const freezeTicket = this.getTicketFreezeFlag(status, spot.openStatus);
    const updateData = { businessStatus: status, statusReason: reason };

    if (TICKET_FREEZING_STATUSES.includes(status)) {
      updateData.status = 0;
      updateData.ticketSaleStatus = 0;
      updateData.openStatus = 0;
    } else if (status === 'operating') {
      const qualCheck = this.checkQualificationValidity(spot);
      if (qualCheck.status !== 'compliant') {
        throw new AppError(`资质${qualCheck.status === 'invalid' ? '无效' : '过期'}，无法恢复开放`, 400);
      }
      updateData.status = 1;
      updateData.ticketSaleStatus = 1;
      updateData.openStatus = 1;
    }

    return this.update(id, updateData, operator);
  }

  async batchOperation(params, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权限批量操作', 403);
    }
    const { ids, operation, data, region } = params;
    if (!ids || ids.length === 0) throw new AppError('请选择要操作的景点', 400);

    let spots = await this.model.findAll({ where: { id: ids } });
    if (region) {
      spots = spots.filter(s => s.region === region || s.city === region || s.province === region);
      if (spots.length === 0) throw new AppError('选定区域内无匹配的景点', 400);
    }
    if (spots.length === 0) throw new AppError('未找到指定景点', 404);

    const hasPerformance = spots.some(s => s.spotType === 'performance');
    if (hasPerformance && !this.checkPermission(operator.roles, PERMISSION_PERFORMANCE)) {
      if (operation === 'update_performance') {
        throw new AppError('无展演类景点运营权限，无法批量配置展演场次', 403);
      }
    }

    const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const results = { success: 0, failed: 0, failures: [] };

    for (const spot of spots) {
      try {
        switch (operation) {
          case 'update_info':
            await this.update(spot.id, data, { ...operator, __batchId: batchId });
            break;
          case 'adjust_weight': {
            const newWeight = Math.max(0, Math.min(100, parseInt(data.displayWeight)));
            const oldWeight = spot.displayWeight;
            await this.model.update({ displayWeight: newWeight, updatedBy: operator.username }, { where: { id: spot.id } });
            await this.writeOperationLog({
              scenicSpotId: spot.id, operationType: 'weight_adjust', operationModule: 'weight',
              oldValue: { displayWeight: oldWeight }, newValue: { displayWeight: newWeight },
              changeFields: 'displayWeight', operationReason: data.reason,
              operatorId: operator.id, operatorName: operator.username,
              operatorRole: operator.roles?.[0], isBatch: true, batchId, verifyResult: 'pass'
            });
            break;
          }
          case 'off_shelf':
            await this.changeStatus(spot.id, 'closed', data.reason || '批量下架闭园', operator);
            break;
          case 'on_shelf':
            await this.changeStatus(spot.id, 'operating', data.reason || '批量开放', operator);
            break;
          case 'update_opening':
            await this.update(spot.id, { openingHours: data.openingHours, closingDays: data.closingDays }, { ...operator, __batchId: batchId });
            break;
          case 'update_performance':
            if (spot.spotType !== 'performance') {
              throw new AppError(`ID ${spot.id}: 非展演类景点，跳过场次配置`);
            }
            await this.update(spot.id, { performanceSchedule: data.performanceSchedule }, { ...operator, __batchId: batchId });
            break;
          default:
            throw new AppError('未知的批量操作类型');
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.failures.push({ id: spot.id, name: spot.name, reason: err.message });
      }
    }
    return results;
  }

  async getLogs(scenicSpotId, params = {}, userRoles = []) {
    if (!this.checkPermission(userRoles, PERMISSION_SPOT_OPS)) {
      throw new AppError('无权访问操作日志', 403);
    }
    const where = {};
    if (scenicSpotId) where.scenicSpotId = scenicSpotId;
    if (params.operationType) where.operationType = params.operationType;
    if (params.startTime && params.endTime) {
      where.createdAt = { [Op.between]: [params.startTime, params.endTime] };
    }
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await ScenicSpotLog.findAndCountAll({
      where,
      include: [{ model: ScenicSpot, as: 'scenicSpot', attributes: ['id', 'name', 'spotType'] }],
      order: [['createdAt', 'DESC']],
      limit: pageSize, offset
    });
    return { list: rows, total: count, page, pageSize };
  }

  async verifySpot(id, verifyType, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_QUALIFICATION_AUDIT)) {
      throw new AppError('无资质审核权限', 403);
    }
    const spot = await this.getById(id, operator.roles);
    if (!spot) throw new AppError('景点不存在', 404);

    const updateData = {
      qualificationStatus: verifyType === 'pass' ? 'compliant' : verifyType,
      qualificationAuditTime: new Date(),
      qualificationAuditor: operator.username
    };
    if (verifyType === 'fake') updateData.isFake = true;
    if (verifyType === 'duplicate') updateData.isDuplicate = true;
    if (['invalid', 'fake', 'duplicate'].includes(verifyType)) {
      updateData.status = 0;
      updateData.businessStatus = 'closed';
      updateData.ticketSaleStatus = 0;
      updateData.openStatus = 0;
    }
    return this.update(id, updateData, operator);
  }

  async checkPermissionForUser(userRoles, permissionType) {
    const permissions = {
      ops: PERMISSION_SPOT_OPS,
      performance: PERMISSION_PERFORMANCE,
      audit: PERMISSION_QUALIFICATION_AUDIT
    };
    return { allowed: this.checkPermission(userRoles, permissions[permissionType] || []) };
  }
}

module.exports = new ScenicSpotService();
