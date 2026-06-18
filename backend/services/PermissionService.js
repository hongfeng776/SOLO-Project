const BaseService = require('./BaseService');
const PermissionConfig = require('../models/PermissionConfig');
const PermissionLog = require('../models/PermissionLog');
const User = require('../models/User');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/error');
const { Op } = require('sequelize');

const PERMISSION_TREE = {
  base: {
    label: '基础权限',
    icon: 'User',
    permissions: [
      { key: 'place_order', name: '下单权限', defaultValue: true },
      { key: 'view_order', name: '查看订单', defaultValue: true },
      { key: 'refund', name: '退款权限', defaultValue: true },
      { key: 'modify_info', name: '修改个人信息', defaultValue: true },
      { key: 'use_coupon', name: '使用优惠券', defaultValue: true }
    ]
  },
  travel: {
    label: '出行特权',
    icon: 'Van',
    permissions: [
      { key: 'priority_board', name: '优先登机/入住', defaultValue: false },
      { key: 'free_lounge', name: '贵宾厅休息室', defaultValue: false },
      { key: 'free_baggage', name: '额外行李额度', defaultValue: false },
      { key: 'free_change', name: '免费改签', defaultValue: false },
      { key: 'insurance_gift', name: '出行保险赠送', defaultValue: false }
    ]
  },
  marketing: {
    label: '营销权益',
    icon: 'Present',
    permissions: [
      { key: 'join_marketing', name: '参与营销活动', defaultValue: true },
      { key: 'birthday_coupon', name: '生日优惠券', defaultValue: false },
      { key: 'member_discount', name: '会员折扣', defaultValue: false, valueType: 'number', defaultConfig: { rate: 1 } },
      { key: 'points_rate', name: '积分倍率', defaultValue: false, valueType: 'number', defaultConfig: { rate: 1 } },
      { key: 'exclusive_deals', name: '专属特惠', defaultValue: false }
    ]
  },
  business: {
    label: '商旅专属权限',
    icon: 'Suitcase',
    permissions: [
      { key: 'business_travel_booking', name: '商旅预订', defaultValue: false },
      { key: 'enterprise_discount', name: '企业协议价', defaultValue: false },
      { key: 'dedicated_manager', name: '专属客户经理', defaultValue: false },
      { key: 'invoice_service', name: '快速开票服务', defaultValue: false },
      { key: 'travel_report', name: '差旅报表', defaultValue: false }
    ]
  }
};

const MUTEX_RULES = [
  { type: 'mutex', permissions: ['free_change', 'insurance_gift'], reason: '免费改签与赠送保险互斥，二者仅可享有其一' },
  { type: 'level_require', permission: 'business_travel_booking', minLevel: 2, reason: '商旅预订功能仅对商旅用户及以上开放' },
  { type: 'level_require', permission: 'dedicated_manager', minLevel: 3, reason: '专属客户经理仅对VIP用户开放' },
  { type: 'level_require', permission: 'free_lounge', minLevel: 3, reason: '贵宾厅休息室仅对VIP用户开放' },
  { type: 'role_require', permission: 'enterprise_discount', requiredRole: 'business', reason: '企业协议价需企业认证身份' }
];

const PERMISSION_TEMPLATES = {
  normal_default: {
    name: '普通用户默认模板',
    userLevel: 1,
    description: '适用于所有普通注册用户的基础权限配置',
    permissions: {
      base: { place_order: true, view_order: true, refund: true, modify_info: true, use_coupon: true },
      travel: {},
      marketing: { join_marketing: true },
      business: {}
    }
  },
  business_standard: {
    name: '商旅用户标准模板',
    userLevel: 2,
    description: '商旅用户标准配置，包含基础商旅特权',
    permissions: {
      base: { place_order: true, view_order: true, refund: true, modify_info: true, use_coupon: true },
      travel: { free_baggage: true, insurance_gift: true },
      marketing: { join_marketing: true, member_discount: true, points_rate: true },
      business: { business_travel_booking: true, invoice_service: true }
    }
  },
  vip_premium: {
    name: 'VIP尊享模板',
    userLevel: 3,
    description: 'VIP用户尊享配置，全部特权开放',
    permissions: {
      base: { place_order: true, view_order: true, refund: true, modify_info: true, use_coupon: true },
      travel: { priority_board: true, free_lounge: true, free_baggage: true, free_change: true },
      marketing: { join_marketing: true, birthday_coupon: true, member_discount: true, points_rate: true, exclusive_deals: true },
      business: { business_travel_booking: true, enterprise_discount: true, dedicated_manager: true, invoice_service: true, travel_report: true }
    }
  },
  restricted: {
    name: '受限用户模板',
    userLevel: 1,
    description: '存在违规行为的受限用户，仅保留基础查看权限',
    permissions: {
      base: { view_order: true, modify_info: true },
      travel: {},
      marketing: {},
      business: {}
    }
  }
};

class PermissionService extends BaseService {
  constructor() {
    super(PermissionConfig);
  }

  getPermissionTree() {
    return PERMISSION_TREE;
  }

  getTemplates() {
    return PERMISSION_TEMPLATES;
  }

  getMutexRules() {
    return MUTEX_RULES;
  }

  validatePermissions(userId, permissionMap, user = null) {
    const conflicts = [];
    const enabledKeys = [];

    for (const type in permissionMap) {
      const perms = permissionMap[type];
      for (const key in perms) {
        if (perms[key]) {
          enabledKeys.push(key);
        }
      }
    }

    for (const rule of MUTEX_RULES) {
      if (rule.type === 'mutex') {
        const allEnabled = rule.permissions.every(p => enabledKeys.includes(p));
        if (allEnabled) {
          conflicts.push({
            type: 'mutex',
            permissions: rule.permissions,
            reason: rule.reason
          });
        }
      }
    }

    if (user) {
      for (const rule of MUTEX_RULES) {
        if (rule.type === 'level_require') {
          if (enabledKeys.includes(rule.permission) && user.userLevel < rule.minLevel) {
            conflicts.push({
              type: 'level_require',
              permission: rule.permission,
              minLevel: rule.minLevel,
              reason: rule.reason
            });
          }
        }
      }
    }

    return { valid: conflicts.length === 0, conflicts };
  }

  checkOperatorPermission(operator, targetUserLevel, operation = 'grant') {
    if (!operator) return false;
    if (operator.roleCode === 'admin') return true;

    if (targetUserLevel >= 3) {
      throw new UnauthorizedError('VIP用户权限配置需管理员权限');
    }
    if (targetUserLevel >= 2 && operation === 'grant') {
      throw new UnauthorizedError('商旅用户高级权限配置需管理员权限');
    }
    return true;
  }

  async getUserPermissions(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('用户不存在');

    const configs = await PermissionConfig.findAll({
      where: { userId, status: 1 },
      order: [['permissionType', 'ASC'], ['permissionKey', 'ASC']]
    });

    const result = {};
    for (const type in PERMISSION_TREE) {
      result[type] = { label: PERMISSION_TREE[type].label, permissions: {} };
      for (const perm of PERMISSION_TREE[type].permissions) {
        result[type].permissions[perm.key] = {
          key: perm.key,
          name: perm.name,
          enabled: false,
          configValue: perm.defaultConfig || null,
          source: 'default',
          validFrom: null,
          validTo: null
        };
      }
    }

    for (const config of configs) {
      const now = new Date();
      const isExpired = config.validTo && new Date(config.validTo) < now;

      if (result[config.permissionType]?.permissions[config.permissionKey]) {
        result[config.permissionType].permissions[config.permissionKey] = {
          key: config.permissionKey,
          name: config.permissionName,
          enabled: config.isEnabled === 1 && !isExpired,
          configValue: config.configValue ? JSON.parse(config.configValue) : null,
          source: config.source,
          validFrom: config.validFrom,
          validTo: config.validTo,
          status: isExpired ? 'expired' : (config.isEnabled ? 'active' : 'disabled'),
          remark: config.remark
        };
      }
    }

    return { userId, userLevel: user.userLevel, permissions: result };
  }

  async savePermission(userId, permissionData, operator = null) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('用户不存在');

    if (operator) {
      this.checkOperatorPermission(operator, user.userLevel, 'grant');
    }

    const permMap = {};
    for (const type in permissionData) {
      permMap[type] = {};
      for (const key in permissionData[type]) {
        permMap[type][key] = permissionData[type][key]?.enabled || false;
      }
    }

    const validation = this.validatePermissions(userId, permMap, user);
    if (!validation.valid) {
      const reasons = validation.conflicts.map(c => c.reason).join('; ');
      throw new ValidationError(`权限配置冲突：${reasons}`);
    }

    const logs = [];
    const results = [];

    for (const type in permissionData) {
      const perms = permissionData[type];
      for (const key in perms) {
        const data = perms[key];
        const existing = await PermissionConfig.findOne({
          where: { userId, permissionType: type, permissionKey: key }
        });

        const treePerm = PERMISSION_TREE[type]?.permissions?.find(p => p.key === key);
        const permName = treePerm?.name || key;

        let beforeValue = null;
        let afterValue = JSON.stringify({ enabled: data.enabled, config: data.configValue || null });

        if (existing) {
          beforeValue = JSON.stringify({ enabled: existing.isEnabled === 1, config: existing.configValue ? JSON.parse(existing.configValue) : null });
          await existing.update({
            isEnabled: data.enabled ? 1 : 0,
            configValue: data.configValue ? JSON.stringify(data.configValue) : null,
            validFrom: data.validFrom || null,
            validTo: data.validTo || null,
            status: 1,
            remark: data.remark || null
          });
          results.push(existing);
        } else {
          const created = await PermissionConfig.create({
            userId,
            permissionType: type,
            permissionKey: key,
            permissionName: permName,
            isEnabled: data.enabled ? 1 : 0,
            configValue: data.configValue ? JSON.stringify(data.configValue) : null,
            validFrom: data.validFrom || null,
            validTo: data.validTo || null,
            status: 1,
            source: 'manual',
            remark: data.remark || null
          });
          results.push(created);
        }

        logs.push({
          userId,
          username: user.username,
          operatorId: operator?.id || null,
          operatorName: operator?.username || 'system',
          operatorRole: operator?.roleCode || '',
          action: existing ? 'update' : 'grant',
          permissionType: type,
          permissionKey: key,
          permissionName: permName,
          beforeValue,
          afterValue,
          validFrom: data.validFrom || null,
          validTo: data.validTo || null,
          reason: data.remark || '手动配置',
          source: 'manual'
        });
      }
    }

    for (const log of logs) {
      await PermissionLog.create(log);
    }

    await this.syncUserPermissions(userId);

    return { success: true, count: results.length, results };
  }

  async syncUserPermissions(userId) {
    const user = await User.findByPk(userId);
    if (!user) return;

    const perms = await this.getUserPermissions(userId);
    const permissionObj = {};

    for (const type in perms.permissions) {
      const typePerms = perms.permissions[type];
      for (const key in typePerms.permissions) {
        const perm = typePerms.permissions[key];
        permissionObj[key] = perm.enabled;
        if (perm.configValue) {
          permissionObj[`${key}_config`] = perm.configValue;
        }
      }
    }

    await user.update({ permissions: JSON.stringify(permissionObj) });
  }

  async batchApplyTemplate(userIds, templateKey, operator = null, reason = '') {
    const template = PERMISSION_TEMPLATES[templateKey];
    if (!template) throw new ValidationError('权限模板不存在');

    const users = await User.findAll({ where: { id: { [Op.in]: userIds } } });
    if (users.length === 0) throw new NotFoundError('未找到目标用户');

    if (operator && operator.roleCode !== 'admin') {
      for (const user of users) {
        if (user.userLevel >= 3) {
          throw new UnauthorizedError('VIP用户批量权限配置需管理员权限');
        }
      }
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const user of users) {
      try {
        const permissionData = {};
        for (const type in template.permissions) {
          permissionData[type] = {};
          const typePerms = template.permissions[type];
          const treePerms = PERMISSION_TREE[type]?.permissions || [];

          for (const perm of treePerms) {
            const enabled = typePerms[perm.key] || false;
            permissionData[type][perm.key] = {
              enabled,
              configValue: perm.defaultConfig || null,
              remark: reason || `批量应用模板:${template.name}`
            };
          }
        }

        await this.savePermission(user.id, permissionData, operator);

        await PermissionLog.create({
          userId: user.id,
          username: user.username,
          operatorId: operator?.id || null,
          operatorName: operator?.username || 'system',
          operatorRole: operator?.roleCode || '',
          action: 'batch_grant',
          permissionType: 'all',
          permissionKey: templateKey,
          permissionName: template.name,
          beforeValue: null,
          afterValue: JSON.stringify(template.permissions),
          reason: reason || '批量配置',
          source: 'batch'
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId: user.id, message: error.message });
      }
    }

    return results;
  }

  async batchTogglePermissions(userIds, permissionKeys, enable, operator = null, reason = '') {
    if (!userIds || userIds.length === 0) {
      throw new ValidationError('请选择目标用户');
    }

    const users = await User.findAll({ where: { id: { [Op.in]: userIds } } });
    const results = { success: 0, failed: 0, errors: [] };

    for (const user of users) {
      try {
        for (const permKey of permissionKeys) {
          let foundType = null;
          let foundPerm = null;
          for (const type in PERMISSION_TREE) {
            const p = PERMISSION_TREE[type].permissions.find(p => p.key === permKey);
            if (p) { foundType = type; foundPerm = p; break; }
          }
          if (!foundType) continue;

          const existing = await PermissionConfig.findOne({
            where: { userId: user.id, permissionType: foundType, permissionKey: permKey }
          });

          const beforeValue = existing
            ? JSON.stringify({ enabled: existing.isEnabled === 1 })
            : null;
          const afterValue = JSON.stringify({ enabled: enable });

          if (existing) {
            await existing.update({ isEnabled: enable ? 1 : 0, status: enable ? 1 : 2 });
          } else {
            await PermissionConfig.create({
              userId: user.id,
              permissionType: foundType,
              permissionKey: permKey,
              permissionName: foundPerm.name,
              isEnabled: enable ? 1 : 0,
              status: enable ? 1 : 2,
              source: 'batch',
              remark: reason
            });
          }

          await PermissionLog.create({
            userId: user.id,
            username: user.username,
            operatorId: operator?.id || null,
            operatorName: operator?.username || 'system',
            operatorRole: operator?.roleCode || '',
            action: enable ? 'batch_grant' : 'batch_revoke',
            permissionType: foundType,
            permissionKey: permKey,
            permissionName: foundPerm.name,
            beforeValue,
            afterValue,
            reason: reason || (enable ? '批量开通' : '批量关闭'),
            source: 'batch'
          });
        }

        await this.syncUserPermissions(user.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId: user.id, message: error.message });
      }
    }

    return results;
  }

  async batchResetPermissions(userIds, operator = null, reason = '') {
    const users = await User.findAll({ where: { id: { [Op.in]: userIds } } });
    const results = { success: 0, failed: 0, errors: [] };

    for (const user of users) {
      try {
        const templateKey = user.userLevel === 3 ? 'vip_premium' : user.userLevel === 2 ? 'business_standard' : 'normal_default';
        await this.batchApplyTemplate([user.id], templateKey, operator, reason || '重置为默认权限');
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId: user.id, message: error.message });
      }
    }

    return results;
  }

  async getPermissionLogs(params = {}) {
    const { userId, action, permissionType, isAbnormal, startTime, endTime, ...rest } = params;
    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (permissionType) where.permissionType = permissionType;
    if (isAbnormal !== undefined && isAbnormal !== '') where.isAbnormal = isAbnormal;
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    return super.getList(rest, {
      searchFields: ['permissionName', 'operatorName', 'reason'],
      fieldMap: { dateField: 'createdAt' },
      customWhere: where,
      defaultOrder: [['id', 'DESC']]
    });
  }

  async detectPermissionAbnormal(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('用户不存在');

    const perms = await this.getUserPermissions(userId);
    const abnormals = [];

    const validation = this.validatePermissions(userId,
      Object.keys(perms.permissions).reduce((acc, type) => {
        acc[type] = {};
        for (const key in perms.permissions[type].permissions) {
          acc[type][key] = perms.permissions[type].permissions[key].enabled;
        }
        return acc;
      }, {}),
      user
    );

    for (const conflict of validation.conflicts) {
      abnormals.push({
        type: conflict.type,
        level: 'high',
        description: conflict.reason,
        permissions: conflict.permissions || [conflict.permission]
      });
    }

    let enabledCount = 0;
    for (const type in perms.permissions) {
      for (const key in perms.permissions[type].permissions) {
        if (perms.permissions[type].permissions[key].enabled) enabledCount++;
      }
    }

    if (user.userLevel === 1 && enabledCount > 8) {
      abnormals.push({
        type: 'over_range',
        level: 'medium',
        description: '普通用户拥有超出其等级的权限数量，可能存在错配',
        enabledCount
      });
    }

    return {
      userId,
      username: user.username,
      userLevel: user.userLevel,
      totalEnabled: enabledCount,
      abnormals,
      isAbnormal: abnormals.length > 0
    };
  }

  async checkExpiredPermissions() {
    const now = new Date();
    const expired = await PermissionConfig.findAll({
      where: {
        status: 1,
        validTo: { [Op.lt]: now }
      }
    });

    for (const config of expired) {
      await config.update({ status: 0 });

      const user = await User.findByPk(config.userId);
      await PermissionLog.create({
        userId: config.userId,
        username: user?.username || '',
        operatorId: null,
        operatorName: 'system',
        operatorRole: 'system',
        action: 'expire',
        permissionType: config.permissionType,
        permissionKey: config.permissionKey,
        permissionName: config.permissionName,
        beforeValue: JSON.stringify({ enabled: true }),
        afterValue: JSON.stringify({ enabled: false }),
        reason: '权限到期自动失效',
        source: 'system'
      });

      await this.syncUserPermissions(config.userId);
    }

    return { expiredCount: expired.length };
  }
}

module.exports = new PermissionService();
