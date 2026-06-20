const { MemberPrivilege, MemberPrivilegeLog, MemberPrivilegeRedemption,
  MemberLevel, EndUser, sequelize, PRIVILEGE_TYPE_PERMISSION_MAP, generatePrivilegeCode,
} = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

const MODIFY_TYPE_MAP = {
  CREATE: '创建权益',
  EDIT: '编辑权益',
  STATUS_ACTIVATE: '生效权益',
  STATUS_PAUSE: '暂停权益',
  STATUS_OFFLINE: '下线权益',
  BATCH_ONLINE: '批量上线',
  BATCH_PAUSE: '批量暂停',
  BATCH_LIMIT_CHANGE: '批量修改上限',
};

const generateBatchNo = () => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MPB${dateStr}${random}`;
};

const formatPrivilege = (p) => ({
  id: p.id,
  privilegeCode: p.privilegeCode,
  privilegeName: p.privilegeName,
  privilegeType: p.privilegeType,
  applicableLevels: p.applicableLevels || [],
  effectiveStartTime: p.effectiveStartTime,
  effectiveEndTime: p.effectiveEndTime,
  usageLimit: p.usageLimit,
  dailyLimit: p.dailyLimit,
  monthlyLimit: p.monthlyLimit,
  permissionSwitches: p.permissionSwitches,
  usageRules: p.usageRules,
  status: p.status,
  scopeType: p.scopeType,
  configBatch: p.configBatch,
  sortOrder: p.sortOrder,
  description: p.description,
  remark: p.remark,
  version: p.version,
  redemptionCount: p.redemptionCount ?? 0,
  createdBy: p.createdBy,
  createdByName: p.createdByName,
  updatedBy: p.updatedBy,
  updatedByName: p.updatedByName,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

class MemberPrivilegeService {
  async getPrivilegeList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query) || [['sortOrder', 'ASC'], ['createdAt', 'DESC']];
    const search = parseSearch(query, ['privilegeCode', 'privilegeName']);

    const where = { ...search };

    if (query.privilegeType) where.privilegeType = query.privilegeType;
    if (query.status !== undefined && query.status !== null && query.status !== '') {
      where.status = Number(query.status);
    }
    if (query.scopeType) where.scopeType = query.scopeType;
    if (query.configBatch) where.configBatch = query.configBatch;
    if (query.applicableLevel) {
      where.applicableLevels = { [Op.like]: `%${query.applicableLevel}%` };
    }
    if (query.startTime) {
      where.effectiveStartTime = { [Op.gte]: new Date(query.startTime) };
    }
    if (query.endTime) {
      where.effectiveEndTime = { [Op.lte]: new Date(query.endTime) };
    }

    const { count, rows } = await MemberPrivilege.findAndCountAll({
      where, offset, limit: pageSize, order,
    });

    const privilegeIds = rows.map(r => r.id);
    const redemptionCounts = privilegeIds.length > 0 ? await MemberPrivilegeRedemption.findAll({
      attributes: ['privilegeId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { privilegeId: { [Op.in]: privilegeIds } },
      group: ['privilegeId'],
      raw: true,
    }) : [];
    const countMap = new Map(redemptionCounts.map(r => [r.privilegeId, Number(r.count)]));

    const list = rows.map(r => {
      const obj = formatPrivilege(r);
      obj.redemptionCount = countMap.get(r.id) || 0;
      return obj;
    });

    return { list, total: count, page, pageSize };
  }

  async getPrivilegeDetail(id) {
    const privilege = await MemberPrivilege.findByPk(id);
    if (!privilege) throw new NotFoundError('权益配置不存在');
    return formatPrivilege(privilege);
  }

  async getPrivilegeStats() {
    const totalCount = await MemberPrivilege.count();
    const activeCount = await MemberPrivilege.count({ where: { status: 1 } });
    const pausedCount = await MemberPrivilege.count({ where: { status: 2 } });
    const offlineCount = await MemberPrivilege.count({ where: { status: 3 } });

    const byType = await MemberPrivilege.findAll({
      attributes: ['privilegeType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['privilegeType'],
      raw: true,
    });

    const now = new Date();
    const expiringSoon = await MemberPrivilege.count({
      where: {
        status: 1,
        effectiveEndTime: { [Op.between]: [now, new Date(now.getTime() + 7 * 24 * 3600 * 1000)] },
      },
    });

    const totalRedemptions = await MemberPrivilegeRedemption.count();

    return {
      totalCount,
      activeCount,
      pausedCount,
      offlineCount,
      expiringSoon,
      totalRedemptions,
      byType: byType.map(b => ({ type: b.privilegeType, count: Number(b.count) })),
    };
  }

  async checkConflicts(data, excludeId) {
    const conflicts = [];
    const where = { [Op.and]: [] };
    if (excludeId) where[Op.and].push({ id: { [Op.ne]: excludeId } });

    if (data.privilegeName) {
      const nameWhere = { privilegeName: data.privilegeName };
      if (excludeId) nameWhere.id = { [Op.ne]: excludeId };
      const nameExists = await MemberPrivilege.findOne({ where: nameWhere });
      if (nameExists) {
        conflicts.push({
          type: 'duplicate_name',
          level: 'high',
          message: `权益名称「${data.privilegeName}」已存在`,
          field: 'privilegeName',
          suggestion: '请使用不同的权益名称',
        });
      }
    }

    if (data.privilegeType && data.applicableLevels && data.applicableLevels.length > 0 &&
        data.effectiveStartTime && data.effectiveEndTime) {
      const overlapWhere = {
        privilegeType: data.privilegeType,
        status: { [Op.ne]: 3 },
        effectiveStartTime: { [Op.lt]: new Date(data.effectiveEndTime) },
        effectiveEndTime: { [Op.gt]: new Date(data.effectiveStartTime) },
      };
      if (excludeId) overlapWhere.id = { [Op.ne]: excludeId };
      const overlapping = await MemberPrivilege.findAll({ where: overlapWhere });

      for (const ol of overlapping) {
        const olLevels = ol.applicableLevels || [];
        const hasOverlap = data.applicableLevels.some(l => olLevels.includes(l));
        if (hasOverlap) {
          conflicts.push({
            type: 'period_overlap',
            level: 'high',
            message: `与权益「${ol.privilegeName}」(${ol.privilegeCode})在相同时段和等级上存在重叠`,
            field: 'effectiveStartTime',
            relatedPrivilegeId: ol.id,
            relatedPrivilegeCode: ol.privilegeCode,
            relatedPrivilegeName: ol.privilegeName,
            suggestion: '调整生效时段或适配等级以避免重叠',
          });
        }
      }

      const duplicateWhere = {
        privilegeType: data.privilegeType,
        status: { [Op.ne]: 3 },
      };
      if (excludeId) duplicateWhere.id = { [Op.ne]: excludeId };
      const sameTypeActive = await MemberPrivilege.findAll({ where: duplicateWhere });
      for (const st of sameTypeActive) {
        const stLevels = st.applicableLevels || [];
        const hasCommon = data.applicableLevels.some(l => stLevels.includes(l));
        if (hasCommon) {
          const alreadyDup = conflicts.find(c => c.type === 'privilege_duplicate' && c.relatedPrivilegeId === st.id);
          if (!alreadyDup) {
            conflicts.push({
              type: 'privilege_duplicate',
              level: 'medium',
              message: `等级适配与「${st.privilegeName}」存在同类型重叠，可能导致权益重复`,
              field: 'applicableLevels',
              relatedPrivilegeId: st.id,
              relatedPrivilegeCode: st.privilegeCode,
              suggestion: '确认是否为不同等级提供差异化权益',
            });
          }
        }
      }
    }

    if (data.permissionSwitches && data.privilegeType) {
      const defaultPerms = PRIVILEGE_TYPE_PERMISSION_MAP[data.privilegeType];
      if (defaultPerms) {
        const extraKeys = Object.keys(data.permissionSwitches).filter(k => !(k in defaultPerms));
        if (extraKeys.length > 0) {
          conflicts.push({
            type: 'permission_mismatch',
            level: 'low',
            message: `权限开关包含类型「${data.privilegeType}」不具备的配置项: ${extraKeys.join(', ')}`,
            field: 'permissionSwitches',
            suggestion: '请根据权益类型选择匹配的权限开关',
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      canSubmit: !conflicts.some(c => c.level === 'high'),
      conflicts,
    };
  }

  async createPrivilege(data, operator) {
    if (new Date(data.effectiveStartTime) >= new Date(data.effectiveEndTime)) {
      throw new BadRequestError('生效开始时间必须早于结束时间');
    }

    const conflictResult = await this.checkConflicts(data, null);
    if (!conflictResult.canSubmit) {
      throw new ConflictError('权益配置冲突: ' + conflictResult.conflicts.filter(c => c.level === 'high').map(c => c.message).join('; '));
    }

    const privilegeCode = generatePrivilegeCode(data.privilegeType);
    const configBatch = generateBatchNo();

    let permissionSwitches = data.permissionSwitches || null;
    if (!permissionSwitches && data.privilegeType && PRIVILEGE_TYPE_PERMISSION_MAP[data.privilegeType]) {
      permissionSwitches = { ...PRIVILEGE_TYPE_PERMISSION_MAP[data.privilegeType] };
    }

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      const privilege = await MemberPrivilege.create({
        privilegeCode,
        privilegeName: data.privilegeName,
        privilegeType: data.privilegeType,
        applicableLevels: data.applicableLevels || [],
        effectiveStartTime: data.effectiveStartTime,
        effectiveEndTime: data.effectiveEndTime,
        usageLimit: data.usageLimit ?? -1,
        dailyLimit: data.dailyLimit ?? -1,
        monthlyLimit: data.monthlyLimit ?? -1,
        permissionSwitches,
        usageRules: data.usageRules || null,
        status: 1,
        scopeType: data.scopeType || 'ALL',
        configBatch,
        sortOrder: data.sortOrder || 0,
        description: data.description || null,
        remark: data.remark || null,
        createdBy: operator.userId,
        createdByName: operator.userName,
        updatedBy: operator.userId,
        updatedByName: operator.userName,
      }, { transaction });

      await MemberPrivilegeLog.create({
        privilegeId: privilege.id,
        privilegeCode: privilege.privilegeCode,
        modifyType: 'CREATE',
        modifyTypeLabel: MODIFY_TYPE_MAP.CREATE,
        configBatch,
        afterSnapshot: formatPrivilege(privilege),
        changedFields: ['all'],
        affectUserCount: 0,
        operatorId: operator.userId,
        operatorName: operator.userName,
      }, { transaction });

      await transaction.commit();
      return formatPrivilege(privilege);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updatePrivilege(id, data, operator) {
    const privilege = await MemberPrivilege.findByPk(id);
    if (!privilege) throw new NotFoundError('权益配置不存在');

    if (privilege.status === 3) {
      throw new ForbiddenError('已下线的权益不可编辑，请重新创建');
    }

    if (data.effectiveStartTime && data.effectiveEndTime) {
      if (new Date(data.effectiveStartTime) >= new Date(data.effectiveEndTime)) {
        throw new BadRequestError('生效开始时间必须早于结束时间');
      }
    }

    const beforeSnapshot = formatPrivilege(privilege);
    const changedFields = [];

    if (data.privilegeName !== undefined && data.privilegeName !== privilege.privilegeName) changedFields.push('privilegeName');
    if (data.privilegeType !== undefined && data.privilegeType !== privilege.privilegeType) changedFields.push('privilegeType');
    if (data.applicableLevels !== undefined && JSON.stringify(data.applicableLevels) !== JSON.stringify(privilege.applicableLevels)) changedFields.push('applicableLevels');
    if (data.effectiveStartTime !== undefined && new Date(data.effectiveStartTime).getTime() !== new Date(privilege.effectiveStartTime).getTime()) changedFields.push('effectiveStartTime');
    if (data.effectiveEndTime !== undefined && new Date(data.effectiveEndTime).getTime() !== new Date(privilege.effectiveEndTime).getTime()) changedFields.push('effectiveEndTime');
    if (data.usageLimit !== undefined && data.usageLimit !== privilege.usageLimit) changedFields.push('usageLimit');
    if (data.dailyLimit !== undefined && data.dailyLimit !== privilege.dailyLimit) changedFields.push('dailyLimit');
    if (data.monthlyLimit !== undefined && data.monthlyLimit !== privilege.monthlyLimit) changedFields.push('monthlyLimit');
    if (data.permissionSwitches !== undefined) changedFields.push('permissionSwitches');
    if (data.usageRules !== undefined) changedFields.push('usageRules');
    if (data.scopeType !== undefined && data.scopeType !== privilege.scopeType) changedFields.push('scopeType');
    if (data.sortOrder !== undefined && data.sortOrder !== privilege.sortOrder) changedFields.push('sortOrder');
    if (data.description !== undefined) changedFields.push('description');
    if (data.remark !== undefined) changedFields.push('remark');

    if (changedFields.length === 0) {
      return { ...formatPrivilege(privilege), message: '无变更内容' };
    }

    const mergedData = { ...data };
    if (data.privilegeType && !data.permissionSwitches && data.privilegeType !== privilege.privilegeType) {
      mergedData.permissionSwitches = PRIVILEGE_TYPE_PERMISSION_MAP[data.privilegeType] ? { ...PRIVILEGE_TYPE_PERMISSION_MAP[data.privilegeType] } : null;
      if (!changedFields.includes('permissionSwitches')) changedFields.push('permissionSwitches');
    }

    const conflictResult = await this.checkConflicts({
      privilegeName: mergedData.privilegeName || privilege.privilegeName,
      privilegeType: mergedData.privilegeType || privilege.privilegeType,
      applicableLevels: mergedData.applicableLevels || privilege.applicableLevels,
      effectiveStartTime: mergedData.effectiveStartTime || privilege.effectiveStartTime,
      effectiveEndTime: mergedData.effectiveEndTime || privilege.effectiveEndTime,
      permissionSwitches: mergedData.permissionSwitches,
    }, id);
    if (!conflictResult.canSubmit) {
      throw new ConflictError('权益配置冲突: ' + conflictResult.conflicts.filter(c => c.level === 'high').map(c => c.message).join('; '));
    }

    const configBatch = generateBatchNo();
    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await privilege.update({
        ...mergedData,
        configBatch,
        updatedBy: operator.userId,
        updatedByName: operator.userName,
        version: privilege.version + 1,
      }, { transaction });

      const affectUserCount = await this._countAffectedUsers(privilege.applicableLevels, privilege.scopeType);

      await MemberPrivilegeLog.create({
        privilegeId: privilege.id,
        privilegeCode: privilege.privilegeCode,
        modifyType: 'EDIT',
        modifyTypeLabel: MODIFY_TYPE_MAP.EDIT,
        configBatch,
        beforeSnapshot,
        afterSnapshot: formatPrivilege(privilege),
        changedFields,
        affectUserCount,
        operatorId: operator.userId,
        operatorName: operator.userName,
      }, { transaction });

      await transaction.commit();
      return formatPrivilege(privilege);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changeStatus(id, newStatus, operator) {
    const privilege = await MemberPrivilege.findByPk(id);
    if (!privilege) throw new NotFoundError('权益配置不存在');
    if (privilege.status === newStatus) throw new BadRequestError('状态未变化');

    const statusFlow = { 1: [2, 3], 2: [1, 3], 3: [] };
    if (!statusFlow[privilege.status].includes(newStatus)) {
      throw new BadRequestError(`不允许从状态${privilege.status}变更为${newStatus}`);
    }
    if (privilege.status === 3) {
      throw new ForbiddenError('已下线权益不可变更状态');
    }

    const beforeSnapshot = formatPrivilege(privilege);
    const configBatch = generateBatchNo();
    const modifyTypeMap = { 1: 'STATUS_ACTIVATE', 2: 'STATUS_PAUSE', 3: 'STATUS_OFFLINE' };

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      await privilege.update({
        status: newStatus,
        configBatch,
        updatedBy: operator.userId,
        updatedByName: operator.userName,
        version: privilege.version + 1,
      }, { transaction });

      const affectUserCount = await this._countAffectedUsers(privilege.applicableLevels, privilege.scopeType);

      await MemberPrivilegeLog.create({
        privilegeId: privilege.id,
        privilegeCode: privilege.privilegeCode,
        modifyType: modifyTypeMap[newStatus],
        modifyTypeLabel: MODIFY_TYPE_MAP[modifyTypeMap[newStatus]],
        configBatch,
        beforeSnapshot,
        afterSnapshot: formatPrivilege(privilege),
        changedFields: ['status'],
        affectUserCount,
        operatorId: operator.userId,
        operatorName: operator.userName,
      }, { transaction });

      await transaction.commit();
      return formatPrivilege(privilege);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async batchAction(action, ids, operator, options = {}) {
    if (!ids || ids.length === 0) throw new BadRequestError('请选择权益配置');

    const privileges = await MemberPrivilege.findAll({ where: { id: { [Op.in]: ids } } });
    if (privileges.length === 0) throw new NotFoundError('未找到指定权益配置');

    const configBatch = generateBatchNo();
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const successIds = [];
    const failItems = [];
    const skippedItems = [];

    const modifyTypeMap = {
      batch_online: { modifyType: 'BATCH_ONLINE', targetStatus: 1, label: '批量上线' },
      batch_pause: { modifyType: 'BATCH_PAUSE', targetStatus: 2, label: '批量暂停' },
      batch_limit_change: { modifyType: 'BATCH_LIMIT_CHANGE', targetStatus: null, label: '批量修改上限' },
    };
    const cfg = modifyTypeMap[action];
    if (!cfg) throw new BadRequestError('不支持的批量操作');

    const transaction = await sequelize.transaction({ isolationLevel: 'READ COMMITTED' });
    try {
      for (const p of privileges) {
        try {
          if (action === 'batch_online') {
            if (p.status === 1) { skippedCount++; skippedItems.push({ id: p.id, reason: '已生效' }); continue; }
            if (p.status === 3) { failCount++; failItems.push({ id: p.id, reason: '已下线不可直接上线' }); continue; }
            await p.update({ status: 1, configBatch, updatedBy: operator.userId, updatedByName: operator.userName, version: p.version + 1 }, { transaction });
          } else if (action === 'batch_pause') {
            if (p.status === 2) { skippedCount++; skippedItems.push({ id: p.id, reason: '已暂停' }); continue; }
            if (p.status === 3) { skippedCount++; skippedItems.push({ id: p.id, reason: '已下线' }); continue; }
            await p.update({ status: 2, configBatch, updatedBy: operator.userId, updatedByName: operator.userName, version: p.version + 1 }, { transaction });
          } else if (action === 'batch_limit_change') {
            const updateData = { configBatch, updatedBy: operator.userId, updatedByName: operator.userName, version: p.version + 1 };
            if (options.usageLimit !== undefined) updateData.usageLimit = options.usageLimit;
            if (options.dailyLimit !== undefined) updateData.dailyLimit = options.dailyLimit;
            if (options.monthlyLimit !== undefined) updateData.monthlyLimit = options.monthlyLimit;
            if (options.scopeType) updateData.scopeType = options.scopeType;
            await p.update(updateData, { transaction });
          }

          await MemberPrivilegeLog.create({
            privilegeId: p.id,
            privilegeCode: p.privilegeCode,
            modifyType: cfg.modifyType,
            modifyTypeLabel: cfg.label,
            configBatch,
            changedFields: action === 'batch_limit_change' ? ['usageLimit', 'dailyLimit', 'monthlyLimit'].filter(f => options[f] !== undefined) : ['status'],
            affectUserCount: 0,
            operatorId: operator.userId,
            operatorName: operator.userName,
          }, { transaction });

          successCount++;
          successIds.push(p.id);
        } catch (e) {
          failCount++;
          failItems.push({ id: p.id, reason: e.message });
        }
      }

      await transaction.commit();
      return { successCount, failCount, skippedCount, successIds, failItems, skippedItems, configBatch };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getModifyHistory(privilegeId, query) {
    const privilege = await MemberPrivilege.findByPk(privilegeId);
    if (!privilege) throw new NotFoundError('权益配置不存在');

    const { page, pageSize, offset } = parsePagination(query);
    const where = { privilegeId };
    if (query.modifyType) where.modifyType = query.modifyType;

    const { count, rows } = await MemberPrivilegeLog.findAndCountAll({
      where, offset, limit: pageSize, order: [['createdAt', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getRedemptionRecords(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const where = {};

    if (query.privilegeId) where.privilegeId = query.privilegeId;
    if (query.privilegeCode) where.privilegeCode = query.privilegeCode;
    if (query.userId) where.userId = query.userId;
    if (query.uid) where.uid = query.uid;
    if (query.redemptionType) where.redemptionType = query.redemptionType;
    if (query.redemptionBatch) where.redemptionBatch = query.redemptionBatch;
    if (query.configBatch) where.configBatch = query.configBatch;
    if (query.privilegeType) where.privilegeType = query.privilegeType;
    if (query.startTime) where.createdAt = { [Op.gte]: new Date(query.startTime) };
    if (query.endTime) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = new Date(query.endTime);
    }

    const { count, rows } = await MemberPrivilegeRedemption.findAndCountAll({
      where, offset, limit: pageSize, order: [['createdAt', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getTraceInfo(traceType, traceValue) {
    if (traceType === 'privilegeCode') {
      const privilege = await MemberPrivilege.findOne({ where: { privilegeCode: traceValue } });
      if (!privilege) return { found: false, traceType, traceValue };

      const [recentLogs, recentRedemptions] = await Promise.all([
        MemberPrivilegeLog.findAll({ where: { privilegeId: privilege.id }, order: [['createdAt', 'DESC']], limit: 50 }),
        MemberPrivilegeRedemption.findAll({ where: { privilegeId: privilege.id }, order: [['createdAt', 'DESC']], limit: 100 }),
      ]);

      return {
        found: true,
        traceType,
        traceValue,
        privilege: formatPrivilege(privilege),
        recentLogs,
        recentRedemptions,
        summary: {
          totalChanges: recentLogs.length,
          totalRedemptions: recentRedemptions.length,
          affectedUsers: new Set(recentRedemptions.map(r => r.userId)).size,
        },
      };
    }

    if (traceType === 'configBatch') {
      const [privileges, logs] = await Promise.all([
        MemberPrivilege.findAll({ where: { configBatch: traceValue } }),
        MemberPrivilegeLog.findAll({ where: { configBatch: traceValue }, order: [['createdAt', 'DESC']], limit: 50 }),
      ]);

      const privilegeIds = privileges.map(p => p.id);
      const redemptions = privilegeIds.length > 0
        ? await MemberPrivilegeRedemption.findAll({ where: { privilegeId: { [Op.in]: privilegeIds } }, order: [['createdAt', 'DESC']], limit: 100 })
        : [];

      return {
        found: privileges.length > 0 || logs.length > 0,
        traceType,
        traceValue,
        relatedPrivileges: privileges.map(formatPrivilege),
        recentLogs: logs,
        recentRedemptions: redemptions,
        summary: {
          totalPrivileges: privileges.length,
          totalChanges: logs.length,
          totalRedemptions: redemptions.length,
        },
      };
    }

    if (traceType === 'redemptionRecord') {
      const redemption = await MemberPrivilegeRedemption.findByPk(parseInt(traceValue));
      if (!redemption) return { found: false, traceType, traceValue };

      const privilege = await MemberPrivilege.findByPk(redemption.privilegeId);

      return {
        found: true,
        traceType,
        traceValue,
        redemption,
        privilege: privilege ? formatPrivilege(privilege) : null,
      };
    }

    throw new BadRequestError('不支持的溯源类型');
  }

  async _countAffectedUsers(levelTiers, scopeType) {
    if (!levelTiers || levelTiers.length === 0) return 0;
    const where = { memberLevel: { [Op.in]: levelTiers } };
    if (scopeType === 'NEW_USER') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      where.createdAt = { [Op.gte]: sevenDaysAgo };
    }
    return EndUser.count({ where });
  }
}

module.exports = new MemberPrivilegeService();
