const { MemberLevel, MemberLevelLog, MemberLevelUpgradeRecord, EndUser, sequelize } = require('../models');
const { Op, Transaction } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

const MODIFY_TYPE = {
  CREATE: { value: 'CREATE', label: '创建等级' },
  EDIT: { value: 'EDIT', label: '编辑等级' },
  ENABLE: { value: 'ENABLE', label: '启用等级' },
  DISABLE: { value: 'DISABLE', label: '停用等级' },
  SCORE_ADJUST: { value: 'SCORE_ADJUST', label: '分值调整' },
  BATCH_SYNC: { value: 'BATCH_SYNC', label: '批量同步权益' },
};

const generateBatchNo = () => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MLB${dateStr}${random}`;
};

const generateLevelCode = (tier) => {
  return `LV${String(tier).padStart(3, '0')}`;
};

const formatLevel = (level) => ({
  id: level.id,
  levelCode: level.levelCode,
  levelName: level.levelName,
  levelTier: level.levelTier,
  minScore: level.minScore,
  maxScore: level.maxScore,
  iconUrl: level.iconUrl,
  badgeColor: level.badgeColor,
  cardBgColor: level.cardBgColor,
  privileges: level.privileges || [],
  upgradeConditions: level.upgradeConditions,
  configBatch: level.configBatch,
  isEnabled: level.isEnabled,
  isCoreHighest: level.isCoreHighest,
  sortOrder: level.sortOrder,
  description: level.description,
  remark: level.remark,
  version: level.version,
  createdBy: level.createdBy,
  createdByName: level.createdByName,
  updatedBy: level.updatedBy,
  updatedByName: level.updatedByName,
  createdAt: level.createdAt,
  updatedAt: level.updatedAt,
});

class MemberLevelService {
  async getLevelList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query) || [['levelTier', 'ASC']];
    const search = parseSearch(query, ['levelCode', 'levelName']);

    const where = { ...search };

    if (query.levelTier !== undefined && query.levelTier !== null && query.levelTier !== '') {
      where.levelTier = Number(query.levelTier);
    }
    if (query.isEnabled !== undefined && query.isEnabled !== null && query.isEnabled !== '') {
      where.isEnabled = Number(query.isEnabled);
    }
    if (query.isCoreHighest !== undefined && query.isCoreHighest !== null && query.isCoreHighest !== '') {
      where.isCoreHighest = Number(query.isCoreHighest);
    }
    if (query.configBatch) {
      where.configBatch = query.configBatch;
    }
    if (query.startDate) {
      where.createdAt = { [Op.gte]: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = new Date(query.endDate + ' 23:59:59');
    }

    const { count, rows } = await MemberLevel.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    const enabledLevels = await MemberLevel.findAll({
      where: { isEnabled: 1 },
      attributes: ['levelTier', [sequelize.fn('COUNT', sequelize.col('end_user.id')), 'userCount']],
      include: [{
        model: EndUser,
        as: 'users',
        attributes: [],
        required: false,
        where: sequelize.where(
          sequelize.col('end_user.member_level'),
          '=',
          sequelize.col('member_level.level_tier')
        ),
      }],
      group: ['member_level.levelTier'],
      raw: true,
    });

    const userCountMap = {};
    enabledLevels.forEach(item => {
      userCountMap[item.levelTier] = Number(item.userCount);
    });

    return {
      list: rows.map(level => ({
        ...formatLevel(level),
        userCount: userCountMap[level.levelTier] || 0,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getLevelDetail(id) {
    const level = await MemberLevel.findByPk(id);
    if (!level) {
      throw new NotFoundError('会员等级不存在');
    }
    const result = formatLevel(level);

    const userCount = await EndUser.count({
      where: { memberLevel: level.levelTier },
    });
    result.userCount = userCount;

    return result;
  }

  async validateScoreContinuity(newTier, newMin, newMax, excludeId = null) {
    const allLevels = await MemberLevel.findAll({
      where: excludeId ? { id: { [Op.ne]: excludeId } } : {},
      attributes: ['id', 'levelTier', 'minScore', 'maxScore', 'levelName'],
      order: [['levelTier', 'ASC']],
      raw: true,
    });

    if (newMin >= newMax) {
      return {
        valid: false,
        reason: '最低分值必须小于最高分值',
      };
    }

    for (const level of allLevels) {
      if (level.id === excludeId) continue;
      const overlap = (newMin < level.maxScore && newMax > level.minScore);
      if (overlap) {
        return {
          valid: false,
          reason: `分值区间与现有等级"${level.name}"(层级${level.levelTier})重叠`,
          conflictLevel: level,
        };
      }
    }

    const allSorted = [...allLevels, { levelTier: newTier, minScore: newMin, maxScore: newMax, id: 'new' }]
      .sort((a, b) => a.levelTier - b.levelTier);

    for (let i = 0; i < allSorted.length - 1; i++) {
      const curr = allSorted[i];
      const next = allSorted[i + 1];
      if (curr.maxScore !== next.minScore) {
        if (curr.maxScore > next.minScore) {
          return {
            valid: false,
            reason: `层级${curr.levelTier}的最高分值(${curr.maxScore})大于层级${next.levelTier}的最低分值(${next.minScore})，存在重叠`,
          };
        } else {
          return {
            valid: false,
            reason: `层级${curr.levelTier}(${curr.maxScore}分)与层级${next.levelTier}(${next.minScore}分)之间存在断层，分值区间应连续`,
            gap: { from: curr.maxScore, to: next.minScore },
          };
        }
      }
    }

    return { valid: true };
  }

  async validateDuplicate(levelCode, levelName, levelTier, excludeId = null) {
    const where = {
      [Op.or]: [
        { levelCode },
        { levelName },
        { levelTier },
      ],
    };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const exist = await MemberLevel.findOne({ where });
    if (!exist) {
      return { valid: true };
    }

    let reason = '';
    if (exist.levelCode === levelCode) reason = `等级编码"${levelCode}"已存在`;
    else if (exist.levelName === levelName) reason = `等级名称"${levelName}"已存在`;
    else if (exist.levelTier === levelTier) reason = `层级编号"${levelTier}"已被占用`;

    return {
      valid: false,
      reason,
      conflictLevel: { id: exist.id, levelCode: exist.levelCode, levelName: exist.levelName, levelTier: exist.levelTier },
    };
  }

  async validateUpgradeLogic() {
    const levels = await MemberLevel.findAll({
      where: { isEnabled: 1 },
      attributes: ['id', 'levelTier', 'minScore', 'maxScore', 'levelName'],
      order: [['levelTier', 'ASC']],
      raw: true,
    });

    if (levels.length === 0) {
      return { valid: true };
    }

    const issues = [];

    if (levels[0].minScore !== 0) {
      issues.push(`最低层级(${levels[0].levelName})的起始分值应为0`);
    }

    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i].maxScore !== levels[i + 1].minScore) {
        issues.push(`层级${levels[i].levelTier}与${levels[i + 1].levelTier}的分值区间不连续`);
      }
    }

    const privilegeCodes = {};
    const levelsWithPriv = await MemberLevel.findAll({
      where: { isEnabled: 1 },
      attributes: ['id', 'levelTier', 'levelName', 'privileges'],
      raw: true,
    });

    for (const level of levelsWithPriv) {
      const privs = JSON.parse(level.privileges || '[]');
      const unique = new Set();
      for (const p of privs) {
        const code = p.code || p.key || p.name;
        if (unique.has(code)) {
          issues.push(`等级"${level.levelName}"的权益存在重复: ${code}`);
        }
        unique.add(code);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  async createLevel(data, operator = {}) {
    const {
      levelName,
      levelTier,
      minScore,
      maxScore,
      iconUrl,
      badgeColor,
      cardBgColor,
      privileges,
      upgradeConditions,
      sortOrder,
      description,
      remark,
    } = data;

    if (!levelName || !levelName.trim()) {
      throw new BadRequestError('等级名称不能为空');
    }
    if (levelTier === undefined || levelTier === null || levelTier < 1) {
      throw new BadRequestError('等级层级必须大于等于1');
    }
    if (minScore === undefined || minScore < 0) {
      throw new BadRequestError('升级最低分值不能为负数');
    }
    if (maxScore === undefined || maxScore <= 0) {
      throw new BadRequestError('升级最高分值必须大于0');
    }

    const dupCheck = await this.validateDuplicate(
      generateLevelCode(levelTier),
      levelName.trim(),
      levelTier,
    );
    if (!dupCheck.valid) {
      throw new ConflictError(dupCheck.reason);
    }

    const continuity = await this.validateScoreContinuity(levelTier, minScore, maxScore);
    if (!continuity.valid) {
      throw new ConflictError(continuity.reason);
    }

    const batchNo = generateBatchNo();

    const t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });

    try {
      const highestLevel = await MemberLevel.findOne({
        order: [['levelTier', 'DESC']],
        transaction: t,
      });
      const isCoreHighest = !highestLevel ? 1 : 0;

      if (isCoreHighest === 0 && highestLevel) {
        await MemberLevel.update(
          { isCoreHighest: 0 },
          { where: { id: highestLevel.id }, transaction: t }
        );
      }

      const newHighest = await MemberLevel.max('levelTier', { transaction: t });
      const finalIsCoreHighest = (levelTier > (newHighest || 0)) ? 1 : 0;

      const level = await MemberLevel.create({
        levelCode: generateLevelCode(levelTier),
        levelName: levelName.trim(),
        levelTier,
        minScore,
        maxScore,
        iconUrl,
        badgeColor,
        cardBgColor,
        privileges: privileges || [],
        upgradeConditions,
        configBatch: batchNo,
        isEnabled: 1,
        isCoreHighest: finalIsCoreHighest,
        sortOrder: sortOrder || levelTier,
        description,
        remark,
        version: 1,
        createdBy: operator.id,
        createdByName: operator.name,
        updatedBy: operator.id,
        updatedByName: operator.name,
      }, { transaction: t });

      if (finalIsCoreHighest === 1) {
        const allOthers = await MemberLevel.findAll({
          where: { id: { [Op.ne]: level.id }, isCoreHighest: 1 },
          transaction: t,
        });
        for (const lv of allOthers) {
          await lv.update({ isCoreHighest: 0 }, { transaction: t });
        }
      }

      await MemberLevelLog.create({
        levelId: level.id,
        levelCode: level.levelCode,
        modifyType: MODIFY_TYPE.CREATE.value,
        modifyTypeLabel: MODIFY_TYPE.CREATE.label,
        configBatch: batchNo,
        beforeSnapshot: null,
        afterSnapshot: formatLevel(level),
        changedFields: ['*'],
        affectUserCount: 0,
        needRecalc: 0,
        recalcStatus: 0,
        operatorId: operator.id,
        operatorName: operator.name,
      }, { transaction: t });

      await t.commit();
      return { id: level.id, configBatch: batchNo, levelCode: level.levelCode };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateLevel(id, data, operator = {}) {
    const level = await MemberLevel.findByPk(id);
    if (!level) {
      throw new NotFoundError('会员等级不存在');
    }

    const beforeSnapshot = formatLevel(level);
    const changedFields = [];
    const updateData = {};

    const basicFields = ['levelName', 'iconUrl', 'badgeColor', 'cardBgColor', 'description', 'remark', 'sortOrder'];
    for (const field of basicFields) {
      if (data[field] !== undefined) {
        if (field === 'levelName') {
          const trimmed = data[field].trim();
          if (trimmed !== level[field]) {
            const dupCheck = await this.validateDuplicate(level.levelCode, trimmed, level.levelTier, id);
            if (!dupCheck.valid) {
              throw new ConflictError(dupCheck.reason);
            }
            updateData.levelName = trimmed;
            changedFields.push('levelName');
          }
        } else if (data[field] !== level[field]) {
          updateData[field] = data[field];
          changedFields.push(field);
        }
      }
    }

    if (data.privileges !== undefined) {
      const oldStr = JSON.stringify(level.privileges || []);
      const newStr = JSON.stringify(data.privileges || []);
      if (oldStr !== newStr) {
        updateData.privileges = data.privileges;
        changedFields.push('privileges');
      }
    }

    if (data.upgradeConditions !== undefined) {
      const oldStr = JSON.stringify(level.upgradeConditions || null);
      const newStr = JSON.stringify(data.upgradeConditions);
      if (oldStr !== newStr) {
        updateData.upgradeConditions = data.upgradeConditions;
        changedFields.push('upgradeConditions');
      }
    }

    let needRecalc = false;
    let modifyType = MODIFY_TYPE.EDIT;

    if (data.levelTier !== undefined || data.minScore !== undefined || data.maxScore !== undefined) {
      if (level.isCoreHighest === 1 && (data.levelTier !== undefined || data.maxScore !== undefined)) {
        throw new ForbiddenError('核心最高等级禁止修改层级和最高分值');
      }

      const newTier = data.levelTier !== undefined ? Number(data.levelTier) : level.levelTier;
      const newMin = data.minScore !== undefined ? Number(data.minScore) : level.minScore;
      const newMax = data.maxScore !== undefined ? Number(data.maxScore) : level.maxScore;

      if (newTier !== level.levelTier) {
        const dupCheck = await this.validateDuplicate(level.levelCode, level.levelName, newTier, id);
        if (!dupCheck.valid) {
          throw new ConflictError(dupCheck.reason);
        }
        updateData.levelTier = newTier;
        updateData.levelCode = generateLevelCode(newTier);
        changedFields.push('levelTier', 'levelCode');
      }

      if (newMin !== level.minScore) {
        updateData.minScore = newMin;
        changedFields.push('minScore');
      }
      if (newMax !== level.maxScore) {
        updateData.maxScore = newMax;
        changedFields.push('maxScore');
      }

      const continuity = await this.validateScoreContinuity(newTier, newMin, newMax, id);
      if (!continuity.valid) {
        throw new ConflictError(continuity.reason);
      }

      modifyType = MODIFY_TYPE.SCORE_ADJUST;
      needRecalc = true;
    }

    if (changedFields.length === 0) {
      return { id, message: '没有需要更新的内容' };
    }

    updateData.updatedBy = operator.id;
    updateData.updatedByName = operator.name;
    updateData.version = level.version + 1;

    const t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const batchNo = generateBatchNo();

    try {
      if (needRecalc && modifyType.value === 'SCORE_ADJUST') {
        const currMax = await MemberLevel.max('levelTier', { transaction: t });
        const allHighest = await MemberLevel.findAll({
          where: { isCoreHighest: 1 },
          transaction: t,
        });
        for (const lv of allHighest) {
          await lv.update({ isCoreHighest: 0 }, { transaction: t });
        }
        const actualMax = updateData.levelTier ? Math.max(currMax || 0, updateData.levelTier) : (currMax || 0);
        if (updateData.levelTier === actualMax || (!updateData.levelTier && level.levelTier === actualMax)) {
          updateData.isCoreHighest = 1;
          changedFields.push('isCoreHighest');
        } else {
          const realHighest = await MemberLevel.findOne({
            where: { levelTier: actualMax },
            transaction: t,
          });
          if (realHighest && realHighest.id !== id) {
            await realHighest.update({ isCoreHighest: 1 }, { transaction: t });
          }
        }
      }

      await MemberLevel.update(updateData, {
        where: { id, version: level.version },
        transaction: t,
      });

      const updatedLevel = await MemberLevel.findByPk(id, { transaction: t });
      const afterSnapshot = formatLevel(updatedLevel);

      let affectUserCount = 0;
      if (needRecalc) {
        affectUserCount = await EndUser.count({
          where: {
            activityScore: {
              [Op.gte]: updatedLevel.minScore,
              [Op.lt]: updatedLevel.maxScore,
            },
          },
          transaction: t,
        });
      }

      const log = await MemberLevelLog.create({
        levelId: id,
        levelCode: updatedLevel.levelCode,
        modifyType: modifyType.value,
        modifyTypeLabel: modifyType.label,
        configBatch: batchNo,
        beforeSnapshot,
        afterSnapshot,
        changedFields,
        affectUserCount,
        needRecalc: needRecalc ? 1 : 0,
        recalcStatus: needRecalc ? 1 : 0,
        recalcStartTime: needRecalc ? new Date() : null,
        operatorId: operator.id,
        operatorName: operator.name,
      }, { transaction: t });

      await t.commit();

      if (needRecalc) {
        this.recalcUserLevels(id, log.id, batchNo).catch(err => {
          console.error('[MemberLevel] 用户等级重算失败:', err);
          MemberLevelLog.update(
            { recalcStatus: 4 },
            { where: { id: log.id } }
          );
        });
      }

      return {
        id,
        configBatch: batchNo,
        needRecalc,
        affectUserCount,
        changedFields,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async recalcUserLevels(levelId, logId, configBatch) {
    const level = await MemberLevel.findByPk(levelId);
    if (!level) return;

    const allLevels = await MemberLevel.findAll({
      where: { isEnabled: 1 },
      order: [['levelTier', 'ASC']],
    });

    const levelMap = new Map();
    for (const lv of allLevels) {
      levelMap.set(lv.levelTier, { id: lv.id, code: lv.levelCode, min: lv.minScore, max: lv.maxScore });
    }

    await MemberLevelLog.update(
      { recalcStatus: 2 },
      { where: { id: logId } }
    );

    const BATCH_SIZE = 500;
    let offset = 0;
    let hasMore = true;
    let updatedCount = 0;

    while (hasMore) {
      const users = await EndUser.findAll({
        attributes: ['id', 'uid', 'activityScore', 'memberLevel'],
        limit: BATCH_SIZE,
        offset,
        raw: true,
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        let newTier = 0;
        for (const lv of allLevels) {
          if (user.activityScore >= lv.minScore && user.activityScore < lv.maxScore) {
            newTier = lv.levelTier;
            break;
          }
        }

        if (user.activityScore >= allLevels[allLevels.length - 1]?.maxScore) {
          newTier = allLevels[allLevels.length - 1].levelTier;
        }

        if (newTier !== user.memberLevel && newTier > 0) {
          const targetLv = levelMap.get(newTier);
          const fromLv = levelMap.get(user.memberLevel);

          await EndUser.update(
            { memberLevel: newTier },
            { where: { id: user.id } }
          );

          await MemberLevelUpgradeRecord.create({
            userId: user.id,
            uid: user.uid,
            fromLevelId: fromLv?.id,
            fromLevelTier: user.memberLevel || null,
            fromLevelCode: fromLv?.code,
            toLevelId: targetLv.id,
            toLevelTier: newTier,
            toLevelCode: targetLv.code,
            triggerScore: user.activityScore,
            upgradeReason: '等级配置分值调整触发重算',
            upgradeType: 'SCORE_ADJUST',
            configBatch,
          });

          updatedCount++;
        }
      }

      offset += BATCH_SIZE;
    }

    await MemberLevelLog.update(
      {
        recalcStatus: 3,
        recalcEndTime: new Date(),
        affectUserCount: updatedCount,
      },
      { where: { id: logId } }
    );
  }

  async enableLevel(id, operator = {}) {
    const level = await MemberLevel.findByPk(id);
    if (!level) {
      throw new NotFoundError('会员等级不存在');
    }
    if (level.isEnabled === 1) {
      throw new BadRequestError('该等级已处于启用状态');
    }

    const batchNo = generateBatchNo();
    const beforeSnapshot = formatLevel(level);

    await MemberLevel.update({ isEnabled: 1, updatedBy: operator.id, updatedByName: operator.name }, { where: { id } });

    const updated = await MemberLevel.findByPk(id);
    const afterSnapshot = formatLevel(updated);

    await MemberLevelLog.create({
      levelId: id,
      levelCode: level.levelCode,
      modifyType: MODIFY_TYPE.ENABLE.value,
      modifyTypeLabel: MODIFY_TYPE.ENABLE.label,
      configBatch: batchNo,
      beforeSnapshot,
      afterSnapshot,
      changedFields: ['isEnabled'],
      affectUserCount: 0,
      needRecalc: 0,
      operatorId: operator.id,
      operatorName: operator.name,
    });

    return { id, configBatch: batchNo };
  }

  async disableLevel(id, operator = {}) {
    const level = await MemberLevel.findByPk(id);
    if (!level) {
      throw new NotFoundError('会员等级不存在');
    }
    if (level.isCoreHighest === 1) {
      throw new ForbiddenError('核心最高等级禁止停用');
    }
    if (level.isEnabled === 0) {
      throw new BadRequestError('该等级已处于停用状态');
    }

    const userCount = await EndUser.count({ where: { memberLevel: level.levelTier } });
    if (userCount > 0) {
      throw new BadRequestError(`该等级下仍有${userCount}名用户，无法停用，请先调整用户等级`);
    }

    const batchNo = generateBatchNo();
    const beforeSnapshot = formatLevel(level);

    await MemberLevel.update({ isEnabled: 0, updatedBy: operator.id, updatedByName: operator.name }, { where: { id } });

    const updated = await MemberLevel.findByPk(id);
    const afterSnapshot = formatLevel(updated);

    await MemberLevelLog.create({
      levelId: id,
      levelCode: level.levelCode,
      modifyType: MODIFY_TYPE.DISABLE.value,
      modifyTypeLabel: MODIFY_TYPE.DISABLE.label,
      configBatch: batchNo,
      beforeSnapshot,
      afterSnapshot,
      changedFields: ['isEnabled'],
      affectUserCount: 0,
      needRecalc: 0,
      operatorId: operator.id,
      operatorName: operator.name,
    });

    return { id, configBatch: batchNo };
  }

  async batchAction(action, ids, operator = {}) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择需要操作的等级');
    }

    const levels = await MemberLevel.findAll({ where: { id: { [Op.in]: ids } } });
    if (levels.length !== ids.length) {
      const foundIds = levels.map(l => l.id);
      const missing = ids.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`等级ID不存在: ${missing.join(', ')}`);
    }

    const t = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED });
    const batchNo = generateBatchNo();
    let successCount = 0;
    const skipped = [];

    try {
      for (const level of levels) {
        const beforeSnapshot = formatLevel(level);
        const lvl = await MemberLevel.findByPk(level.id, { transaction: t, lock: true });

        if (action === 'batch_enable') {
          if (lvl.isEnabled === 1) {
            skipped.push({ id: lvl.id, reason: '已处于启用状态' });
            continue;
          }
          await lvl.update(
            { isEnabled: 1, updatedBy: operator.id, updatedByName: operator.name },
            { transaction: t }
          );
          const after = formatLevel(lvl);
          await MemberLevelLog.create({
            levelId: lvl.id,
            levelCode: lvl.levelCode,
            modifyType: MODIFY_TYPE.ENABLE.value,
            modifyTypeLabel: MODIFY_TYPE.ENABLE.label,
            configBatch: batchNo,
            beforeSnapshot,
            afterSnapshot: after,
            changedFields: ['isEnabled'],
            affectUserCount: 0,
            needRecalc: 0,
            operatorId: operator.id,
            operatorName: operator.name,
          }, { transaction: t });
          successCount++;
        } else if (action === 'batch_disable') {
          if (lvl.isCoreHighest === 1) {
            skipped.push({ id: lvl.id, reason: '核心最高等级禁止停用' });
            continue;
          }
          if (lvl.isEnabled === 0) {
            skipped.push({ id: lvl.id, reason: '已处于停用状态' });
            continue;
          }
          const userCount = await EndUser.count({
            where: { memberLevel: lvl.levelTier },
            transaction: t,
          });
          if (userCount > 0) {
            skipped.push({ id: lvl.id, reason: `等级下有${userCount}名用户` });
            continue;
          }
          await lvl.update(
            { isEnabled: 0, updatedBy: operator.id, updatedByName: operator.name },
            { transaction: t }
          );
          const after = formatLevel(lvl);
          await MemberLevelLog.create({
            levelId: lvl.id,
            levelCode: lvl.levelCode,
            modifyType: MODIFY_TYPE.DISABLE.value,
            modifyTypeLabel: MODIFY_TYPE.DISABLE.label,
            configBatch: batchNo,
            beforeSnapshot,
            afterSnapshot: after,
            changedFields: ['isEnabled'],
            affectUserCount: 0,
            needRecalc: 0,
            operatorId: operator.id,
            operatorName: operator.name,
          }, { transaction: t });
          successCount++;
        } else if (action === 'batch_sync_privileges') {
          if (!levels[0] || !levels[0].privileges) {
            throw new BadRequestError('请选择一个等级作为权益同步源');
          }
          const sourceLevel = levels[0];
          const sourcePrivileges = sourceLevel.privileges || [];
          const targets = levels.slice(1);

          let targetSuccess = 0;
          for (const targetLv of targets) {
            if (targetLv.isCoreHighest === 1) {
              skipped.push({ id: targetLv.id, reason: '核心最高等级跳过权益同步' });
              continue;
            }
            const tlv = await MemberLevel.findByPk(targetLv.id, { transaction: t, lock: true });
            const oldPriv = JSON.stringify(tlv.privileges || []);
            const newPriv = JSON.stringify(sourcePrivileges);
            if (oldPriv === newPriv) {
              skipped.push({ id: tlv.id, reason: '权益配置一致' });
              continue;
            }
            await tlv.update(
              {
                privileges: sourcePrivileges,
                updatedBy: operator.id,
                updatedByName: operator.name,
              },
              { transaction: t }
            );
            const after = formatLevel(tlv);
            await MemberLevelLog.create({
              levelId: tlv.id,
              levelCode: tlv.levelCode,
              modifyType: MODIFY_TYPE.BATCH_SYNC.value,
              modifyTypeLabel: MODIFY_TYPE.BATCH_SYNC.label,
              configBatch: batchNo,
              beforeSnapshot,
              afterSnapshot: after,
              changedFields: ['privileges'],
              affectUserCount: 0,
              needRecalc: 0,
              operatorId: operator.id,
              operatorName: operator.name,
            }, { transaction: t });
            targetSuccess++;
          }
          successCount = targetSuccess;
          break;
        }
      }

      await t.commit();
      return {
        configBatch: batchNo,
        action,
        totalCount: ids.length,
        successCount,
        skippedCount: skipped.length,
        skipped,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async checkConflicts(data, excludeId = null) {
    const result = {
      hasConflict: false,
      canSubmit: true,
      conflicts: [],
      missingFields: [],
      totalIssues: 0,
    };

    if (!data.levelName) { result.missingFields.push('levelName'); result.totalIssues++; }
    if (data.levelTier === undefined || data.levelTier === null) { result.missingFields.push('levelTier'); result.totalIssues++; }
    if (data.minScore === undefined || data.minScore === null) { result.missingFields.push('minScore'); result.totalIssues++; }
    if (data.maxScore === undefined || data.maxScore === null) { result.missingFields.push('maxScore'); result.totalIssues++; }

    if (data.levelTier !== undefined && data.levelName && data.minScore !== undefined && data.maxScore !== undefined) {
      const dup = await this.validateDuplicate(
        generateLevelCode(data.levelTier),
        String(data.levelName).trim(),
        Number(data.levelTier),
        excludeId,
      );
      if (!dup.valid) {
        result.hasConflict = true;
        result.canSubmit = false;
        result.conflicts.push({
          type: 'duplicate',
          severity: 'high',
          description: dup.reason,
          conflictLevel: dup.conflictLevel,
        });
        result.totalIssues++;
      }

      const cont = await this.validateScoreContinuity(
        Number(data.levelTier),
        Number(data.minScore),
        Number(data.maxScore),
        excludeId,
      );
      if (!cont.valid) {
        result.hasConflict = true;
        result.canSubmit = false;
        result.conflicts.push({
          type: cont.gap ? 'score_gap' : 'score_overlap',
          severity: 'high',
          description: cont.reason,
          gap: cont.gap,
        });
        result.totalIssues++;
      }
    }

    return result;
  }

  async getModifyHistory(levelId, query) {
    const { page, pageSize, offset } = parsePagination(query);

    const { count, rows } = await MemberLevelLog.findAndCountAll({
      where: { levelId },
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });

    return {
      list: rows.map(log => ({
        id: log.id,
        levelId: log.levelId,
        levelCode: log.levelCode,
        modifyType: log.modifyType,
        modifyTypeLabel: log.modifyTypeLabel,
        configBatch: log.configBatch,
        changedFields: log.changedFields || [],
        affectUserCount: log.affectUserCount,
        needRecalc: log.needRecalc,
        recalcStatus: log.recalcStatus,
        recalcStartTime: log.recalcStartTime,
        recalcEndTime: log.recalcEndTime,
        operatorId: log.operatorId,
        operatorName: log.operatorName,
        operatorRemark: log.operatorRemark,
        beforeSnapshot: log.beforeSnapshot,
        afterSnapshot: log.afterSnapshot,
        createdAt: log.createdAt,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getUpgradeRecords(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query) || [['createdAt', 'DESC']];

    const where = {};

    if (query.levelCode) {
      where[Op.or] = [
        { fromLevelCode: query.levelCode },
        { toLevelCode: query.levelCode },
      ];
    }
    if (query.configBatch) {
      where.configBatch = query.configBatch;
    }
    if (query.operationBatch) {
      where.operationBatch = query.operationBatch;
    }
    if (query.upgradeType) {
      where.upgradeType = query.upgradeType;
    }
    if (query.toLevelTier) {
      where.toLevelTier = Number(query.toLevelTier);
    }
    if (query.uid) {
      where.uid = query.uid;
    }

    const { count, rows } = await MemberLevelUpgradeRecord.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
      include: [
        {
          model: EndUser,
          as: 'user',
          attributes: ['id', 'uid', 'username', 'nickname', 'avatar'],
          required: false,
        },
      ],
    });

    return {
      list: rows.map(rec => ({
        id: rec.id,
        userId: rec.userId,
        uid: rec.uid,
        fromLevelTier: rec.fromLevelTier,
        fromLevelCode: rec.fromLevelCode,
        toLevelTier: rec.toLevelTier,
        toLevelCode: rec.toLevelCode,
        triggerScore: rec.triggerScore,
        upgradeReason: rec.upgradeReason,
        upgradeType: rec.upgradeType,
        configBatch: rec.configBatch,
        operationBatch: rec.operationBatch,
        isReverted: rec.isReverted,
        operatorId: rec.operatorId,
        operatorName: rec.operatorName,
        user: rec.user ? {
          id: rec.user.id,
          uid: rec.user.uid,
          username: rec.user.username,
          nickname: rec.user.nickname,
          avatar: rec.user.avatar,
        } : null,
        createdAt: rec.createdAt,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getLevelStats() {
    const totalLevels = await MemberLevel.count();
    const enabledCount = await MemberLevel.count({ where: { isEnabled: 1 } });
    const disabledCount = totalLevels - enabledCount;

    const levelStats = await MemberLevel.findAll({
      attributes: [
        'levelTier',
        'levelName',
        'levelCode',
        'minScore',
        'maxScore',
        'isEnabled',
        'isCoreHighest',
        'badgeColor',
      ],
      order: [['levelTier', 'ASC']],
      raw: true,
    });

    const allEnabledLevels = levelStats.filter(l => l.isEnabled === 1);
    let totalCoverage = 0;
    if (allEnabledLevels.length > 0) {
      const maxTier = Math.max(...allEnabledLevels.map(l => l.levelTier));
      const maxScoreLevel = allEnabledLevels.find(l => l.levelTier === maxTier);
      if (maxScoreLevel) totalCoverage = maxScoreLevel.maxScore;
    }

    const userByLevel = await EndUser.findAll({
      attributes: ['memberLevel', [sequelize.fn('COUNT', '*'), 'cnt']],
      group: ['memberLevel'],
      raw: true,
    });
    const userCountMap = {};
    userByLevel.forEach(item => { userCountMap[item.memberLevel] = Number(item.cnt); });

    let totalLevelUsers = 0;
    const levelsWithCount = levelStats.map(lv => {
      const cnt = userCountMap[lv.levelTier] || 0;
      totalLevelUsers += cnt;
      return { ...lv, userCount: cnt };
    });

    const logicCheck = await this.validateUpgradeLogic();

    return {
      totalLevels,
      enabledCount,
      disabledCount,
      totalLevelUsers,
      totalCoverage,
      levelList: levelsWithCount,
      logicValid: logicCheck.valid,
      logicIssues: logicCheck.issues || [],
    };
  }

  async getTraceInfo(traceType, traceValue) {
    const result = {
      traceType,
      traceValue,
      found: false,
      levels: [],
      logs: [],
      upgradeRecords: [],
      summary: {},
    };

    if (traceType === 'levelCode') {
      const level = await MemberLevel.findOne({ where: { levelCode: traceValue } });
      if (level) {
        result.found = true;
        result.levels.push(formatLevel(level));

        const logs = await MemberLevelLog.findAll({
          where: { levelCode: traceValue },
          order: [['createdAt', 'DESC']],
          limit: 50,
        });
        result.logs = logs.map(l => ({
          id: l.id,
          modifyType: l.modifyType,
          modifyTypeLabel: l.modifyTypeLabel,
          configBatch: l.configBatch,
          operatorName: l.operatorName,
          createdAt: l.createdAt,
        }));

        const records = await MemberLevelUpgradeRecord.findAll({
          where: {
            [Op.or]: [{ fromLevelCode: traceValue }, { toLevelCode: traceValue }],
          },
          order: [['createdAt', 'DESC']],
          limit: 100,
        });
        result.upgradeRecords = records.map(r => ({
          id: r.id,
          uid: r.uid,
          fromLevelCode: r.fromLevelCode,
          toLevelCode: r.toLevelCode,
          triggerScore: r.triggerScore,
          upgradeType: r.upgradeType,
          configBatch: r.configBatch,
          createdAt: r.createdAt,
        }));

        result.summary = {
          logCount: result.logs.length,
          upgradeCount: result.upgradeRecords.length,
        };
      }
    } else if (traceType === 'configBatch') {
      const levels = await MemberLevel.findAll({ where: { configBatch: traceValue } });
      result.levels = levels.map(formatLevel);

      const logs = await MemberLevelLog.findAll({
        where: { configBatch: traceValue },
        order: [['createdAt', 'DESC']],
      });
      result.logs = logs.map(l => ({
        id: l.id,
        levelCode: l.levelCode,
        modifyType: l.modifyType,
        modifyTypeLabel: l.modifyTypeLabel,
        operatorName: l.operatorName,
        createdAt: l.createdAt,
      }));

      const records = await MemberLevelUpgradeRecord.findAll({
        where: { configBatch: traceValue },
        order: [['createdAt', 'DESC']],
        limit: 200,
      });
      result.upgradeRecords = records.map(r => ({
        id: r.id,
        uid: r.uid,
        fromLevelCode: r.fromLevelCode,
        toLevelCode: r.toLevelCode,
        triggerScore: r.triggerScore,
        upgradeType: r.upgradeType,
        createdAt: r.createdAt,
      }));

      result.found = levels.length > 0 || logs.length > 0 || records.length > 0;
      result.summary = {
        affectedLevelCount: levels.length,
        logCount: logs.length,
        upgradeCount: records.length,
      };
    } else if (traceType === 'upgradeRecord') {
      const recordId = Number(traceValue);
      const rec = await MemberLevelUpgradeRecord.findByPk(recordId, {
        include: [
          { model: MemberLevel, as: 'fromLevel', attributes: ['id', 'levelCode', 'levelName', 'levelTier'] },
          { model: MemberLevel, as: 'toLevel', attributes: ['id', 'levelCode', 'levelName', 'levelTier'] },
        ],
      });
      if (rec) {
        result.found = true;
        result.upgradeRecords = [{
          id: rec.id,
          uid: rec.uid,
          fromLevel: rec.fromLevel,
          toLevel: rec.toLevel,
          triggerScore: rec.triggerScore,
          upgradeType: rec.upgradeType,
          upgradeReason: rec.upgradeReason,
          configBatch: rec.configBatch,
          createdAt: rec.createdAt,
        }];

        if (rec.toLevelId) {
          const toLvl = await MemberLevel.findByPk(rec.toLevelId);
          if (toLvl) result.levels.push(formatLevel(toLvl));
        }
        result.summary = { upgradeCount: 1 };
      }
    }

    return result;
  }
}

module.exports = new MemberLevelService();
