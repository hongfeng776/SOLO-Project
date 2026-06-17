const BaseService = require('./BaseService');
const User = require('../models/User');
const Role = require('../models/Role');
const SystemLogService = require('./SystemLogService');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/error');
const { Op } = require('sequelize');

const USER_LEVEL_CONFIG = {
  1: {
    label: '普通用户',
    benefits: JSON.stringify({
      discount: 1,
      prioritySupport: false,
      exclusiveService: false,
      freeShipping: false,
      pointsRate: 1
    }),
    permissions: JSON.stringify({
      canPlaceOrder: true,
      canRefund: true,
      canJoinMarketing: true,
      canUseCoupon: true
    })
  },
  2: {
    label: '商旅用户',
    benefits: JSON.stringify({
      discount: 0.95,
      prioritySupport: true,
      exclusiveService: false,
      freeShipping: true,
      pointsRate: 1.5
    }),
    permissions: JSON.stringify({
      canPlaceOrder: true,
      canRefund: true,
      canJoinMarketing: true,
      canUseCoupon: true,
      businessTravelBooking: true
    })
  },
  3: {
    label: 'VIP用户',
    benefits: JSON.stringify({
      discount: 0.88,
      prioritySupport: true,
      exclusiveService: true,
      freeShipping: true,
      pointsRate: 2,
      vipLounge: true,
      dedicatedManager: true
    }),
    permissions: JSON.stringify({
      canPlaceOrder: true,
      canRefund: true,
      canJoinMarketing: true,
      canUseCoupon: true,
      businessTravelBooking: true,
      vipExclusive: true
    })
  }
};

const FROZEN_PERMISSIONS = JSON.stringify({
  canPlaceOrder: false,
  canRefund: false,
  canJoinMarketing: false,
  canUseCoupon: false
});

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  validateIdCard(idCard) {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
  }

  validateEmail(email) {
    return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email);
  }

  async checkFieldUniqueness(field, value, excludeId = null) {
    const where = { [field]: value };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await User.count({ where });
    return count === 0;
  }

  async validateUserFields(data, excludeId = null, isCreate = false) {
    const errors = [];

    if (isCreate || data.username !== undefined) {
      if (!data.username || data.username.trim().length < 4) {
        errors.push('用户名至少4个字符');
      } else if (!await this.checkFieldUniqueness('username', data.username, excludeId)) {
        errors.push('用户名已存在');
      }
    }

    if (data.phone !== undefined) {
      if (data.phone && !this.validatePhone(data.phone)) {
        errors.push('手机号格式不正确');
      } else if (data.phone && !await this.checkFieldUniqueness('phone', data.phone, excludeId)) {
        errors.push('手机号已被其他用户绑定');
      }
    }

    if (data.idCard !== undefined) {
      if (data.idCard && !this.validateIdCard(data.idCard)) {
        errors.push('身份证号格式不正确');
      } else if (data.idCard && !await this.checkFieldUniqueness('idCard', data.idCard, excludeId)) {
        errors.push('身份证号已被其他用户绑定');
      }
    }

    if (data.email !== undefined && data.email) {
      if (!this.validateEmail(data.email)) {
        errors.push('邮箱格式不正确');
      }
    }

    if (data.userLevel !== undefined && ![1, 2, 3].includes(parseInt(data.userLevel))) {
      errors.push('用户等级不合法');
    }

    if (data.status !== undefined && ![0, 1, 2].includes(parseInt(data.status))) {
      errors.push('用户状态不合法');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    return true;
  }

  detectAbnormalUser(userData) {
    const issues = [];

    if (!userData.phone && !userData.email) {
      issues.push('联系方式缺失');
    }
    if (!userData.realName) {
      issues.push('真实姓名缺失');
    }
    if (!userData.idCard && userData.userLevel >= 2) {
      issues.push('中高级用户未实名认证');
    }

    return {
      isAbnormal: issues.length > 0,
      abnormalType: issues.length > 0 ? 'info_missing' : null,
      abnormalRemark: issues.length > 0 ? issues.join('; ') : null
    };
  }

  async getList(params = {}) {
    const { userLevel, registerChannel, isAbnormal, startTime, endTime, ...rest } = params;
    const where = {};

    if (userLevel) {
      where.userLevel = userLevel;
    }
    if (registerChannel) {
      where.registerChannel = registerChannel;
    }
    if (isAbnormal !== undefined && isAbnormal !== '') {
      where.isAbnormal = isAbnormal;
    }
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    return super.getList(rest, {
      searchFields: ['username', 'nickname', 'phone', 'realName', 'idCard'],
      fieldMap: { dateField: 'createdAt' },
      customWhere: where,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      exclude: ['password']
    });
  }

  async getById(id) {
    const user = await super.getById(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      exclude: ['password']
    });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    return user;
  }

  async getByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  async traceUser(params) {
    const { userId, phone, idCard, registerChannel } = params;
    const where = {};

    if (userId) {
      where.id = userId;
    }
    if (phone) {
      where.phone = phone;
    }
    if (idCard) {
      where.idCard = idCard;
    }
    if (registerChannel) {
      where.registerChannel = registerChannel;
    }

    if (Object.keys(where).length === 0) {
      throw new ValidationError('请至少提供一个查询条件');
    }

    const users = await User.findAll({
      where,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      exclude: ['password'],
      order: [['id', 'DESC']]
    });

    return users.map(user => {
      const abnormal = this.detectAbnormalUser(user);
      return {
        ...user.toJSON(),
        detectedAbnormal: abnormal
      };
    });
  }

  async validateUniqueness(params) {
    const { field, value, excludeId } = params;
    if (!field || !value) {
      throw new ValidationError('参数不完整');
    }
    const validFields = ['username', 'phone', 'idCard', 'email'];
    if (!validFields.includes(field)) {
      throw new ValidationError('不支持校验的字段');
    }
    const isUnique = await this.checkFieldUniqueness(field, value, excludeId);
    return {
      field,
      value,
      isUnique,
      message: isUnique ? '可用' : `${field === 'username' ? '用户名' : field === 'phone' ? '手机号' : field === 'idCard' ? '身份证号' : '邮箱'}已存在`
    };
  }

  async create(data, operator = null) {
    await this.validateUserFields(data, null, true);

    const abnormal = this.detectAbnormalUser(data);
    data.isAbnormal = abnormal.isAbnormal ? 1 : 0;
    data.abnormalType = abnormal.abnormalType;
    data.abnormalRemark = abnormal.abnormalRemark;

    const level = data.userLevel || 1;
    const levelConfig = USER_LEVEL_CONFIG[level];
    if (levelConfig) {
      data.benefits = levelConfig.benefits;
      data.permissions = levelConfig.permissions;
    }

    if (data.tags && Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }

    const user = await super.create(data);

    await SystemLogService.recordLog({
      userId: operator?.id || null,
      username: operator?.username || 'system',
      action: 'create',
      module: 'user',
      target: `user:${user.id}`,
      detail: JSON.stringify({ username: user.username, userLevel: user.userLevel })
    });

    return this.getById(user.id);
  }

  async update(id, data, operator = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    await this.validateUserFields(data, id, false);

    const changes = {};
    const coreFields = ['phone', 'idCard', 'userLevel', 'status'];
    for (const field of coreFields) {
      if (data[field] !== undefined && data[field] !== user[field]) {
        changes[field] = { from: user[field], to: data[field] };
      }
    }

    if (data.userLevel !== undefined && data.userLevel !== user.userLevel) {
      const levelConfig = USER_LEVEL_CONFIG[data.userLevel];
      if (levelConfig) {
        data.benefits = levelConfig.benefits;
        if (user.status !== 2) {
          data.permissions = levelConfig.permissions;
        }
        changes.benefitsUpdated = true;
        changes.permissionsUpdated = true;
      }
    }

    if (data.status !== undefined) {
      if (parseInt(data.status) === 2 && parseInt(user.status) !== 2) {
        data.permissions = FROZEN_PERMISSIONS;
        data.freezeTime = new Date();
        changes.frozen = true;
      } else if (parseInt(user.status) === 2 && parseInt(data.status) !== 2) {
        const levelConfig = USER_LEVEL_CONFIG[user.userLevel || 1];
        if (levelConfig) {
          data.permissions = levelConfig.permissions;
        }
        data.freezeReason = null;
        data.freezeTime = null;
        changes.unfrozen = true;
      }
    }

    const abnormalCheck = { ...user.toJSON(), ...data };
    const abnormal = this.detectAbnormalUser(abnormalCheck);
    data.isAbnormal = abnormal.isAbnormal ? 1 : 0;
    data.abnormalType = abnormal.abnormalType;
    data.abnormalRemark = abnormal.abnormalRemark;

    if (data.tags) {
      if (Array.isArray(data.tags)) {
        data.tags = JSON.stringify(data.tags);
      }
    }

    await super.update(id, data);

    if (Object.keys(changes).length > 0) {
      await SystemLogService.recordLog({
        userId: operator?.id || null,
        username: operator?.username || 'system',
        action: 'update',
        module: 'user',
        target: `user:${id}`,
        detail: JSON.stringify(changes)
      });
    }

    return this.getById(id);
  }

  async updateStatus(id, status, reason = null, operator = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    if (![0, 1, 2].includes(parseInt(status))) {
      throw new ValidationError('状态值不合法');
    }

    const data = { status };
    if (parseInt(status) === 2) {
      data.permissions = FROZEN_PERMISSIONS;
      data.freezeReason = reason;
      data.freezeTime = new Date();
    } else if (parseInt(user.status) === 2) {
      const levelConfig = USER_LEVEL_CONFIG[user.userLevel || 1];
      if (levelConfig) {
        data.permissions = levelConfig.permissions;
      }
      data.freezeReason = null;
      data.freezeTime = null;
    }

    await user.update(data);

    await SystemLogService.recordLog({
      userId: operator?.id || null,
      username: operator?.username || 'system',
      action: parseInt(status) === 2 ? 'freeze' : parseInt(status) === 0 ? 'disable' : 'enable',
      module: 'user',
      target: `user:${id}`,
      detail: JSON.stringify({
        fromStatus: user.status,
        toStatus: status,
        reason
      })
    });

    return this.getById(id);
  }

  async batchUpdateStatus(ids, status, reason = null, operator = null) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的用户');
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        await this.updateStatus(id, status, reason, operator);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, message: error.message });
      }
    }

    await SystemLogService.recordLog({
      userId: operator?.id || null,
      username: operator?.username || 'system',
      action: 'batch_status_update',
      module: 'user',
      target: `users:${ids.join(',')}`,
      detail: JSON.stringify({ toStatus: status, count: ids.length, results })
    });

    return results;
  }

  async batchUpdateInfo(ids, updateData, operator = null) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的用户');
    }

    const { tags, userLevel, ...restData } = updateData;
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        const data = { ...restData };
        if (userLevel !== undefined) {
          data.userLevel = userLevel;
        }
        if (tags !== undefined) {
          data.tags = tags;
        }
        await this.update(id, data, operator);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, message: error.message });
      }
    }

    await SystemLogService.recordLog({
      userId: operator?.id || null,
      username: operator?.username || 'system',
      action: 'batch_update',
      module: 'user',
      target: `users:${ids.join(',')}`,
      detail: JSON.stringify({ updateData: restData, count: ids.length, results })
    });

    return results;
  }

  async batchFreeze(ids, reason = null, operator = null) {
    return this.batchUpdateStatus(ids, 2, reason, operator);
  }

  async batchUnfreeze(ids, operator = null) {
    return this.batchUpdateStatus(ids, 1, null, operator);
  }

  async checkEditPermission(operator, targetUser) {
    if (!operator || operator.roleCode !== 'admin') {
      if (targetUser.userLevel === 3) {
        throw new UnauthorizedError('普通操作员无权编辑VIP用户信息');
      }
    }
    return true;
  }

  async checkBatchPermission(operator, targetUsers) {
    if (!operator || operator.roleCode !== 'admin') {
      const hasVIP = targetUsers.some(u => u.userLevel === 3);
      if (hasVIP) {
        throw new UnauthorizedError('普通操作员无权批量操作VIP用户');
      }
    }
    return true;
  }
}

module.exports = new UserService();
