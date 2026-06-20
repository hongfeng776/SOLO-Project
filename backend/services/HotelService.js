const BaseService = require('./BaseService');
const Hotel = require('../models/Hotel');
const HotelLog = require('../models/HotelLog');
const Merchant = require('../models/Merchant');
const { Op } = require('sequelize');
const { AppError } = require('../utils/error');

const PERMISSION_HOTEL_OPS = ['admin', 'hotel_operator', 'senior_hotel_operator'];
const PERMISSION_CROSS_BORDER = ['admin', 'senior_hotel_operator', 'cross_border_auditor'];
const PERMISSION_QUALIFICATION_AUDIT = ['admin', 'senior_hotel_operator', 'hotel_auditor'];

const HOTEL_TYPES = ['domestic', 'overseas', 'apartment', 'featured'];
const BUSINESS_STATUSES = ['operating', 'suspended', 'rectification', 'closed'];
const FREEZING_STATUSES = ['suspended', 'rectification', 'closed'];

class HotelService extends BaseService {
  constructor() {
    super(Hotel);
  }

  checkPermission(userRoles, requiredPermissions) {
    if (!userRoles || userRoles.length === 0) return false;
    return userRoles.some(role => requiredPermissions.includes(role));
  }

  checkAddressValidity(address, city, country = '中国') {
    const warnings = [];
    const errors = [];
    if (!address || address.length < 5) {
      errors.push('详细地址不能少于5个字符');
    }
    if (!city) {
      errors.push('城市不能为空');
    }
    if (!country) {
      errors.push('国家不能为空');
    }
    if (address && !/[\u4e00-\u9fa5a-zA-Z0-9]/.test(address)) {
      warnings.push('地址格式可能异常，请确认');
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  checkStarValidity(star, starLevel) {
    const warnings = [];
    const errors = [];
    if (star !== null && star !== undefined) {
      if (star < 1 || star > 5) {
        errors.push('星级必须在1-5之间');
      }
    }
    const validLevels = ['national', 'chain', 'user'];
    if (starLevel && !validLevels.includes(starLevel)) {
      errors.push('星级评级类型无效');
    }
    if ((star === 4 || star === 5) && starLevel && starLevel === 'user') {
      warnings.push('四星级以上酒店建议提供国家评定或连锁品牌评级');
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
      warnings.push('已关闭门店重新营业需重新审核资质');
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
    checkLicense(data.specialLicenseNo, data.specialLicenseExpire, '特种行业许可证');
    checkLicense(data.hygieneLicenseNo, data.hygieneLicenseExpire, '卫生许可证');
    checkLicense(data.fireSafetyLicenseNo, data.fireSafetyLicenseExpire, '消防安全检查合格证');

    if (data.hotelType === 'overseas') {
      checkLicense(data.crossBorderLicense, data.crossBorderLicenseExpire, '跨境经营许可证');
    }

    let status = 'compliant';
    if (errors.length > 0) status = 'invalid';
    else if (warnings.length > 0) status = 'expired';

    return { valid: errors.length === 0, errors, warnings, status };
  }

  checkDuplicateHotel(name, address, excludeId = null) {
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

  checkFakeHotelIndicators(data) {
    const warnings = [];
    const errors = [];

    if (data.price && data.price <= 0) {
      errors.push('价格不能为零或负数');
    }
    if (data.price && data.price > 100000) {
      warnings.push('价格异常高，请确认是否虚假门店');
    }
    if (data.rooms && data.rooms <= 0 && data.hotelType !== 'apartment') {
      errors.push('房间数不能为零（民宿公寓除外）');
    }
    if (!data.phone || data.phone.length < 6) {
      warnings.push('联系电话信息不完整');
    }
    if (!data.description || data.description.length < 20) {
      warnings.push('酒店描述过于简短');
    }

    return { isFake: errors.some(e => e.includes('虚假')) || warnings.length >= 3, warnings, errors };
  }

  async writeOperationLog(params) {
    return HotelLog.create({
      hotelId: params.hotelId,
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
      orderFreezeFlag: params.orderFreezeFlag || false
    });
  }

  calculateDisplayWeight(data) {
    let weight = 50;

    const statusWeightMap = {
      operating: 15,
      suspended: -50,
      rectification: -30,
      closed: -100
    };
    weight += (statusWeightMap[data.businessStatus] || 0);

    const qualWeightMap = {
      compliant: 20,
      expired: -10,
      pending: 0,
      invalid: -50
    };
    weight += (qualWeightMap[data.qualificationStatus] || 0);

    if (data.star) weight += data.star * 3;
    if (data.isFake) weight -= 50;
    if (data.isDuplicate) weight -= 50;

    weight = Math.max(0, Math.min(100, weight));
    return weight;
  }

  getOrderFreezeFlag(businessStatus) {
    return FREEZING_STATUSES.includes(businessStatus);
  }

  async getList(params = {}, userRoles = []) {
    const { hotelType, businessStatus, city, star, qualificationStatus, ...rest } = params;

    if (!this.checkPermission(userRoles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权访问酒店门店资源运维', 403);
    }

    const where = {};
    if (hotelType) where.hotelType = hotelType;
    if (businessStatus) where.businessStatus = businessStatus;
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (star) where.star = star;
    if (qualificationStatus) where.qualificationStatus = qualificationStatus;

    return super.getList({ ...rest, ...where }, {
      searchFields: ['name', 'address', 'businessLicenseNo'],
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }],
      order: [['displayWeight', 'DESC'], ['updatedAt', 'DESC']]
    });
  }

  async getById(id, userRoles = []) {
    if (!this.checkPermission(userRoles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权访问酒店门店详情', 403);
    }
    return super.getById(id, {
      include: [{ model: Merchant, as: 'merchant', attributes: ['id', 'name'] }]
    });
  }

  async create(data, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权限创建酒店门店', 403);
    }

    if (!HOTEL_TYPES.includes(data.hotelType)) {
      throw new AppError('酒店类型无效', 400);
    }
    if (data.hotelType === 'overseas' && !this.checkPermission(operator.roles, PERMISSION_CROSS_BORDER)) {
      throw new AppError('无跨境酒店运营权限，无法创建海外酒店', 403);
    }

    const allErrors = [];
    const allWarnings = [];
    let verifyResult = 'pass';

    const addrCheck = this.checkAddressValidity(data.address, data.city, data.country);
    allErrors.push(...addrCheck.errors);
    allWarnings.push(...addrCheck.warnings);

    const starCheck = this.checkStarValidity(data.star, data.starLevel);
    allErrors.push(...starCheck.errors);
    allWarnings.push(...starCheck.warnings);

    const qualCheck = this.checkQualificationValidity(data);
    allErrors.push(...qualCheck.errors);
    allWarnings.push(...qualCheck.warnings);
    data.qualificationStatus = qualCheck.status;

    const fakeCheck = this.checkFakeHotelIndicators(data);
    allErrors.push(...fakeCheck.errors);
    allWarnings.push(...fakeCheck.warnings);
    if (fakeCheck.isFake) {
      data.isFake = true;
      allErrors.push('门店被标记为可疑虚假门店');
    }

    const duplicate = await this.checkDuplicateHotel(data.name, data.address);
    if (duplicate) {
      data.isDuplicate = true;
      allErrors.push('检测到重复门店（名称或地址相同）');
    }

    if (allErrors.length > 0) {
      verifyResult = 'block';
      throw new AppError(`门店创建被拦截：${allErrors.join('；')}`, 400);
    }
    if (allWarnings.length > 0) {
      verifyResult = 'warning';
    }

    data.warningFlags = allWarnings.length > 0 ? JSON.stringify(allWarnings) : null;
    data.displayWeight = this.calculateDisplayWeight(data);
    data.createdBy = operator.username;
    data.updatedBy = operator.username;

    const hotel = await super.create(data);

    await this.writeOperationLog({
      hotelId: hotel.id,
      operationType: 'create',
      operationModule: 'basic_info',
      newValue: hotel,
      operatorId: operator.id,
      operatorName: operator.username,
      operatorRole: operator.roles?.[0],
      verifyResult,
      verifyMessages: allWarnings.length > 0 ? allWarnings : null,
      orderFreezeFlag: this.getOrderFreezeFlag(data.businessStatus)
    });

    return hotel;
  }

  async update(id, data, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权限编辑酒店门店', 403);
    }

    const oldHotel = await this.getById(id, operator.roles);
    if (!oldHotel) {
      throw new AppError('酒店门店不存在', 404);
    }

    if (data.hotelType === 'overseas' || oldHotel.hotelType === 'overseas') {
      if (!this.checkPermission(operator.roles, PERMISSION_CROSS_BORDER)) {
        throw new AppError('无跨境酒店运营权限，无法操作海外酒店', 403);
      }
    }

    const allErrors = [];
    const allWarnings = [];
    let verifyResult = 'pass';
    const changedFields = [];

    const addrCheck = this.checkAddressValidity(
      data.address || oldHotel.address,
      data.city || oldHotel.city,
      data.country || oldHotel.country
    );
    allErrors.push(...addrCheck.errors);
    allWarnings.push(...addrCheck.warnings);

    const starCheck = this.checkStarValidity(
      data.star !== undefined ? data.star : oldHotel.star,
      data.starLevel || oldHotel.starLevel
    );
    allErrors.push(...starCheck.errors);
    allWarnings.push(...starCheck.warnings);

    if (data.businessStatus) {
      const statusCheck = this.checkBusinessStatusValidity(data.businessStatus, oldHotel);
      allErrors.push(...statusCheck.errors);
      allWarnings.push(...statusCheck.warnings);
    }

    const mergedData = { ...oldHotel, ...data };
    const qualCheck = this.checkQualificationValidity(mergedData);
    allErrors.push(...qualCheck.errors);
    allWarnings.push(...qualCheck.warnings);
    data.qualificationStatus = qualCheck.status;

    const fakeCheck = this.checkFakeHotelIndicators(mergedData);
    allErrors.push(...fakeCheck.errors);
    allWarnings.push(...fakeCheck.warnings);
    if (fakeCheck.isFake) {
      data.isFake = true;
    }

    if (data.name || data.address) {
      const duplicate = await this.checkDuplicateHotel(
        data.name || oldHotel.name,
        data.address || oldHotel.address,
        id
      );
      if (duplicate) {
        data.isDuplicate = true;
        allErrors.push('检测到与其他门店重复（名称或地址相同）');
      }
    }

    if (allErrors.length > 0) {
      verifyResult = 'block';
      throw new AppError(`保存被拦截：${allErrors.join('；')}`, 400);
    }
    if (allWarnings.length > 0) {
      verifyResult = 'warning';
    }

    Object.keys(data).forEach(key => {
      if (oldHotel[key] !== data[key] && key !== 'updatedBy') {
        changedFields.push(key);
      }
    });

    if (data.businessStatus || data.qualificationStatus || data.star || data.isFake || data.isDuplicate) {
      const finalData = { ...oldHotel, ...data };
      data.displayWeight = this.calculateDisplayWeight(finalData);
      changedFields.push('displayWeight');
    }

    if (data.status === undefined && data.businessStatus) {
      if (FREEZING_STATUSES.includes(data.businessStatus)) {
        data.status = 0;
        changedFields.push('status');
      } else if (data.businessStatus === 'operating' && qualCheck.status === 'compliant') {
        data.status = 1;
        changedFields.push('status');
      }
    }

    data.warningFlags = allWarnings.length > 0 ? JSON.stringify(allWarnings) : null;
    data.updatedBy = operator.username;

    const hotel = await super.update(id, data);
    const newHotel = await this.getById(id, operator.roles);

    const orderFreeze = data.businessStatus ? this.getOrderFreezeFlag(data.businessStatus) : this.getOrderFreezeFlag(oldHotel.businessStatus);

    if (changedFields.includes('businessStatus')) {
      await this.writeOperationLog({
        hotelId: id,
        operationType: 'update',
        operationModule: 'status',
        oldValue: { businessStatus: oldHotel.businessStatus },
        newValue: { businessStatus: data.businessStatus },
        changeFields: 'businessStatus',
        operationReason: data.statusReason,
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: operator.roles?.[0],
        verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null,
        orderFreezeFlag: orderFreeze
      });
    }

    const basicFields = ['name', 'address', 'city', 'country', 'star', 'starLevel', 'phone', 'email', 'description', 'price', 'rooms', 'roomTypeRange'];
    const hasBasicChanges = changedFields.some(f => basicFields.includes(f));
    if (hasBasicChanges) {
      const oldBasic = {};
      const newBasic = {};
      basicFields.forEach(f => {
        if (changedFields.includes(f)) {
          oldBasic[f] = oldHotel[f];
          newBasic[f] = newHotel[f];
        }
      });
      await this.writeOperationLog({
        hotelId: id,
        operationType: 'update',
        operationModule: 'basic_info',
        oldValue: oldBasic,
        newValue: newBasic,
        changeFields: basicFields.filter(f => changedFields.includes(f)).join(','),
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: operator.roles?.[0],
        verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null
      });
    }

    const qualFields = ['businessLicenseNo', 'businessLicenseExpire', 'specialLicenseNo', 'specialLicenseExpire', 'hygieneLicenseNo', 'hygieneLicenseExpire', 'fireSafetyLicenseNo', 'fireSafetyLicenseExpire', 'crossBorderLicense', 'crossBorderLicenseExpire', 'qualificationStatus'];
    const hasQualChanges = changedFields.some(f => qualFields.includes(f));
    if (hasQualChanges) {
      const oldQual = {};
      const newQual = {};
      qualFields.forEach(f => {
        if (changedFields.includes(f)) {
          oldQual[f] = oldHotel[f];
          newQual[f] = newHotel[f];
        }
      });
      await this.writeOperationLog({
        hotelId: id,
        operationType: 'qualification_audit',
        operationModule: 'qualification',
        oldValue: oldQual,
        newValue: newQual,
        changeFields: qualFields.filter(f => changedFields.includes(f)).join(','),
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: operator.roles?.[0],
        verifyResult,
        verifyMessages: allWarnings.length > 0 ? allWarnings : null
      });
    }

    if (changedFields.includes('displayWeight')) {
      await this.writeOperationLog({
        hotelId: id,
        operationType: 'weight_adjust',
        operationModule: 'weight',
        oldValue: { displayWeight: oldHotel.displayWeight },
        newValue: { displayWeight: newHotel.displayWeight },
        changeFields: 'displayWeight',
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: operator.roles?.[0],
        verifyResult: 'pass'
      });
    }

    if (data.status !== undefined && oldHotel.status !== data.status) {
      await this.writeOperationLog({
        hotelId: id,
        operationType: data.status === 1 ? 'on_shelf' : 'off_shelf',
        operationModule: 'status',
        oldValue: { status: oldHotel.status },
        newValue: { status: data.status },
        changeFields: 'status',
        operationReason: data.statusReason,
        operatorId: operator.id,
        operatorName: operator.username,
        operatorRole: operator.roles?.[0],
        verifyResult,
        orderFreezeFlag: data.status === 0
      });
    }

    return newHotel;
  }

  async changeStatus(id, status, reason, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权限变更门店状态', 403);
    }

    const hotel = await this.getById(id, operator.roles);
    if (!hotel) throw new AppError('酒店不存在', 404);

    if (hotel.hotelType === 'overseas' && !this.checkPermission(operator.roles, PERMISSION_CROSS_BORDER)) {
      throw new AppError('无跨境酒店运营权限', 403);
    }

    let opType = '';
    switch (status) {
      case 'operating': opType = 'resume_operation'; break;
      case 'suspended': opType = 'suspend'; break;
      case 'rectification': opType = 'rectification'; break;
      case 'closed': opType = 'off_shelf'; break;
    }

    const orderFreeze = this.getOrderFreezeFlag(status);
    const updateData = { businessStatus: status, statusReason: reason };
    if (FREEZING_STATUSES.includes(status)) {
      updateData.status = 0;
    } else if (status === 'operating') {
      const qualCheck = this.checkQualificationValidity(hotel);
      if (qualCheck.status !== 'compliant') {
        throw new AppError(`资质${qualCheck.status === 'invalid' ? '无效' : '过期'}，无法恢复营业`, 400);
      }
      updateData.status = 1;
    }

    return this.update(id, updateData, operator);
  }

  async batchOperation(params, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权限批量操作', 403);
    }

    const { ids, operation, data } = params;
    if (!ids || ids.length === 0) throw new AppError('请选择要操作的门店', 400);

    const hotels = await this.model.findAll({ where: { id: ids } });
    if (hotels.length === 0) throw new AppError('未找到指定门店', 404);

    const hasOverseas = hotels.some(h => h.hotelType === 'overseas');
    if (hasOverseas && !this.checkPermission(operator.roles, PERMISSION_CROSS_BORDER)) {
      throw new AppError('无跨境酒店运营权限，无法批量操作包含海外酒店的记录', 403);
    }

    const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const results = { success: 0, failed: 0, failures: [] };

    for (const hotel of hotels) {
      try {
        switch (operation) {
          case 'update_info': {
            await this.update(hotel.id, data, { ...operator, __batchId: batchId });
            break;
          }
          case 'adjust_weight': {
            if (!this.checkPermission(operator.roles, PERMISSION_HOTEL_OPS)) {
              throw new AppError(`ID ${hotel.id}: 无权限调整权重`);
            }
            const newWeight = Math.max(0, Math.min(100, parseInt(data.displayWeight)));
            const oldWeight = hotel.displayWeight;
            await this.model.update({ displayWeight: newWeight, updatedBy: operator.username }, { where: { id: hotel.id } });
            await this.writeOperationLog({
              hotelId: hotel.id,
              operationType: 'weight_adjust',
              operationModule: 'weight',
              oldValue: { displayWeight: oldWeight },
              newValue: { displayWeight: newWeight },
              changeFields: 'displayWeight',
              operationReason: data.reason,
              operatorId: operator.id,
              operatorName: operator.username,
              operatorRole: operator.roles?.[0],
              isBatch: true,
              batchId,
              verifyResult: 'pass'
            });
            break;
          }
          case 'off_shelf': {
            await this.changeStatus(hotel.id, 'closed', data.reason || '批量下架', operator);
            break;
          }
          case 'on_shelf': {
            await this.changeStatus(hotel.id, 'operating', data.reason || '批量上架', operator);
            break;
          }
          case 'rectification': {
            await this.changeStatus(hotel.id, 'rectification', data.reason || '批量整改', operator);
            break;
          }
          default:
            throw new AppError('未知的批量操作类型');
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.failures.push({ id: hotel.id, name: hotel.name, reason: err.message });
      }
    }

    return results;
  }

  async getLogs(hotelId, params = {}, userRoles = []) {
    if (!this.checkPermission(userRoles, PERMISSION_HOTEL_OPS)) {
      throw new AppError('无权访问操作日志', 403);
    }

    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (params.operationType) where.operationType = params.operationType;
    if (params.startTime && params.endTime) {
      where.createdAt = { [Op.between]: [params.startTime, params.endTime] };
    }

    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await HotelLog.findAndCountAll({
      where,
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    return {
      list: rows,
      total: count,
      page,
      pageSize
    };
  }

  async verifyHotel(id, verifyType, operator = {}) {
    if (!this.checkPermission(operator.roles, PERMISSION_QUALIFICATION_AUDIT)) {
      throw new AppError('无资质审核权限', 403);
    }

    const hotel = await this.getById(id, operator.roles);
    if (!hotel) throw new AppError('酒店不存在', 404);

    const updateData = {
      qualificationStatus: verifyType === 'pass' ? 'compliant' : verifyType,
      qualificationAuditTime: new Date(),
      qualificationAuditor: operator.username
    };

    if (verifyType === 'fake') updateData.isFake = true;
    if (verifyType === 'duplicate') updateData.isDuplicate = true;
    if (verifyType === 'invalid' || verifyType === 'fake' || verifyType === 'duplicate') {
      updateData.status = 0;
      updateData.businessStatus = 'closed';
    }

    const newHotel = await this.update(id, updateData, operator);

    await this.writeOperationLog({
      hotelId: id,
      operationType: 'qualification_audit',
      operationModule: 'qualification',
      oldValue: { qualificationStatus: hotel.qualificationStatus },
      newValue: { qualificationStatus: verifyType === 'pass' ? 'compliant' : verifyType },
      changeFields: 'qualificationStatus,qualificationAuditTime,qualificationAuditor',
      operationReason: '资质审核',
      operatorId: operator.id,
      operatorName: operator.username,
      operatorRole: operator.roles?.[0],
      verifyResult: 'pass'
    });

    return newHotel;
  }

  async checkPermissionForUser(userRoles, permissionType) {
    const permissions = {
      ops: PERMISSION_HOTEL_OPS,
      cross_border: PERMISSION_CROSS_BORDER,
      audit: PERMISSION_QUALIFICATION_AUDIT
    };
    return {
      allowed: this.checkPermission(userRoles, permissions[permissionType] || [])
    };
  }
}

module.exports = new HotelService();
