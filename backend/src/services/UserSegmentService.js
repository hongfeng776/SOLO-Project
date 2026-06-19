const { Op, Sequelize, sequelize } = require('../models/_db');
const {
  UserSegmentRule, UserSegmentTag, UserSegmentLog, SegmentStrategy,
  EndUser,
  SEGMENT_LEVEL, SEGMENT_RULE_STATUS, SEGMENT_CHANGE_TYPE,
  STRATEGY_STATUS, STRATEGY_TRIGGER_MODE,
} = require('../models');
const helpers = require('../utils/helpers');

const ForbiddenError = require('../errors/ForbiddenError');
const ValidationError = require('../errors/ValidationError');

class UserSegmentService {
  // ============ 功能点1：规则创建与校验 ============
  static validateThresholds(thresholds) {
    if (!Array.isArray(thresholds) || thresholds.length < 2) {
      throw new ValidationError('分层阈值至少配置2个层级');
    }
    const levels = thresholds.map(t => t.level).sort((a, b) => a - b);
    const validLevels = Object.values(SEGMENT_LEVEL).map(l => l.value);
    for (const level of levels) {
      if (!validLevels.includes(level)) {
        throw new ValidationError(`无效的层级值: ${level}`);
      }
    }
    for (let i = 0; i < thresholds.length - 1; i++) {
      const curr = thresholds.find(t => t.level === levels[i]);
      const next = thresholds.find(t => t.level === levels[i + 1]);
      if (curr == null || next == null) continue;
      if (curr.max == null || next.min == null) continue;
      if (next.min < curr.max) {
        throw new ValidationError(`层级阈值冲突: L${levels[i]}最大值(${curr.max}) > L${levels[i + 1]}最小值(${next.min})`);
      }
      if (next.min - curr.max > 0 && next.min - curr.max < 1) {
        throw new ValidationError(`层级 L${levels[i]} 与 L${levels[i + 1]} 之间存在断层`);
      }
      if (curr.min != null && curr.min < 0) {
        throw new ValidationError(`层级 L${levels[i]} 最小值不能为负数`);
      }
    }
    return true;
  }

  static validateWeights(weights) {
    if (!weights) return true;
    const total = Object.values(weights).reduce((s, v) => s + (Number(v) || 0), 0);
    if (Math.abs(total - 1) > 0.001) {
      throw new ValidationError(`权重总和必须等于1，当前总和: ${total.toFixed(3)}`);
    }
    for (const [key, val] of Object.entries(weights)) {
      if (val < 0 || val > 1) throw new ValidationError(`权重 ${key} 超出0~1范围: ${val}`);
    }
    return true;
  }

  static async checkRuleDuplicate(ruleName, ruleCode, excludeId = null) {
    const where = { [Op.or]: [{ ruleName }, { ruleCode }] };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const exist = await UserSegmentRule.findOne({ where });
    if (exist) {
      if (exist.ruleName === ruleName) throw new ValidationError('规则名称已存在');
      if (exist.ruleCode === ruleCode) throw new ValidationError('规则编码已存在');
    }
    return false;
  }

  static async createRule(data, operator) {
    const { thresholds, weights, ...rest } = data;
    this.validateThresholds(thresholds || []);
    if (weights) this.validateWeights(weights);
    if (rest.ruleName) await this.checkRuleDuplicate(rest.ruleName, rest.ruleCode);

    const tagTemplate = rest.tagTemplate || {};
    for (const thr of thresholds || []) {
      const key = `L${thr.level}`;
      if (!tagTemplate[key]) tagTemplate[key] = [`L${thr.level}`];
    }

    const rule = await UserSegmentRule.create({
      ...rest,
      thresholds,
      weights,
      tagTemplate,
      creatorId: operator?.id,
      creatorName: operator?.name || operator?.username,
    });
    return rule;
  }

  static async updateRule(id, data, operator) {
    const rule = await UserSegmentRule.findByPk(id);
    if (!rule) throw new ValidationError('规则不存在');
    if (rule.status === SEGMENT_RULE_STATUS.ACTIVE.value && !operator?.isSuperAdmin) {
      throw new ForbiddenError('只有超级管理员可修改生效中的规则');
    }
    const { thresholds, weights, status, ...rest } = data;

    if (thresholds) this.validateThresholds(thresholds);
    if (weights) this.validateWeights(weights);
    if (rest.ruleName || rest.ruleCode) {
      await this.checkRuleDuplicate(rest.ruleName || rule.ruleName, rest.ruleCode || rule.ruleCode, id);
    }

    if (status === SEGMENT_RULE_STATUS.ACTIVE.value && rule.status !== SEGMENT_RULE_STATUS.ACTIVE.value) {
      rest.effectiveStartAt = rest.effectiveStartAt || new Date();
      this._scheduleAutoTagUpdate(rule);
    }

    await rule.update({ ...rest, thresholds, weights, status });
    return rule;
  }

  // ============ 功能点1：规则生效后批量更新标签 ============
  static async _scheduleAutoTagUpdate(rule) {
    const batchNo = helpers.generateBatchNo('SEG-UPD');
    setTimeout(async () => {
      try { await this.batchUpdateUserTags(rule.id, { batchNo, operator: { id: rule.creatorId, name: rule.creatorName }, type: 'RULE_CHANGE' }); } catch (e) { console.error('[UserSegment] auto update failed', e.message); }
    }, 1000);
    return batchNo;
  }

  // ============ 行为数据获取（模拟实际业务） ============
  static _getBehaviorValue(endUser, dimension) {
    const mapping = {
      PLAY: () => endUser.watchCount,
      INTERACTION: () => (endUser.commentCount || 0) * 2 + Math.floor((endUser.followerCount || 0) / 10),
      CONSUMPTION: () => Math.floor((endUser.memberLevel || 0) * 100 + (endUser.activityScore || 0) / 10),
      PUBLISH: () => endUser.publishCount,
      COMPOSITE: () => {
        const s1 = Math.min((endUser.watchCount || 0) / 100, 1) * 25;
        const s2 = Math.min(((endUser.commentCount || 0) * 2 + (endUser.followerCount || 0) / 20) / 50, 1) * 30;
        const s3 = Math.min(((endUser.memberLevel || 0) * 100 + (endUser.activityScore || 0) / 10) / 500, 1) * 25;
        const s4 = Math.min((endUser.publishCount || 0) / 10, 1) * 20;
        return Math.floor(s1 + s2 + s3 + s4);
      },
    };
    return (mapping[dimension] || mapping.COMPOSITE)() || 0;
  }

  // ============ 计算用户层级 ============
  static calcLevelByRule(rule, behaviorValue) {
    const thresholds = rule.thresholds || [];
    if (!thresholds.length) return { level: 1, min: 0, max: null, score: behaviorValue };
    thresholds.sort((a, b) => b.level - a.level);
    for (const thr of thresholds) {
      const passMin = thr.min == null || behaviorValue >= thr.min;
      const passMax = thr.max == null || behaviorValue < thr.max;
      if (passMin && (thr.max == null ? behaviorValue >= thr.min : passMax)) {
        return { level: thr.level, min: thr.min, max: thr.max, score: behaviorValue };
      }
    }
    const lowest = thresholds.reduce((a, b) => (a.level < b.level ? a : b));
    if (lowest && behaviorValue < lowest.min) {
      return { level: lowest.level - 1 || 1, min: 0, max: lowest.min, score: behaviorValue };
    }
    return { level: 1, min: 0, max: null, score: behaviorValue };
  }

  // ============ 功能点2：自动/手动层级调整 ============
  static async batchUpdateUserTags(ruleId, opts = {}) {
    const rule = await UserSegmentRule.findByPk(ruleId);
    if (!rule) throw new ValidationError('规则不存在');

    const { batchNo, operator, type = 'AUTO', limit = 500, offset = 0 } = opts;
    const operationBatch = batchNo || helpers.generateBatchNo('SEG-RUN');

    const userWhere = {};
    if (rule.targetUserType?.length) userWhere.userType = { [Op.in]: rule.targetUserType };
    if (rule.targetMinLevel != null) userWhere.activityLevel = { [Op.gte]: rule.targetMinLevel };

    const totalUsers = await EndUser.count({ where: userWhere });
    let processed = 0, changed = 0;

    while (processed < totalUsers) {
      const users = await EndUser.findAll({
        where: userWhere,
        limit: Math.min(limit, totalUsers - processed),
        offset: processed + offset,
        order: [['id', 'ASC']],
      });
      for (const user of users) {
        await this._updateSingleUserTag(rule, user, operationBatch, operator, type);
        changed++;
      }
      processed += users.length;
    }

    await rule.update({ lastCalcAt: new Date() });
    return { total: totalUsers, changed, operationBatch };
  }

  static async _updateSingleUserTag(rule, user, operationBatch, operator, type = 'AUTO') {
    const behaviorValue = this._getBehaviorValue(user, rule.dimension);
    const result = this.calcLevelByRule(rule, behaviorValue);
    const levelKey = `L${result.level}`;

    const [tag, created] = await UserSegmentTag.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id, uid: user.uid, ruleId: rule.id, ruleCode: rule.ruleCode,
        currentLevel: result.level, tags: rule.tagTemplate?.[levelKey] || [levelKey],
        behaviorSnapshot: {
          play: user.watchCount, interaction: user.commentCount,
          consumption: user.memberLevel, publish: user.publishCount, behaviorValue,
        },
        scoreSnapshot: result,
        assignedAt: new Date(),
      },
    });

    const levelChanged = tag.currentLevel !== result.level;
    const now = new Date();
    if (!created) {
      await tag.update({
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        previousLevel: tag.currentLevel,
        currentLevel: result.level,
        tags: rule.tagTemplate?.[levelKey] || [levelKey],
        behaviorSnapshot: {
          play: user.watchCount, interaction: user.commentCount,
          consumption: user.memberLevel, publish: user.publishCount, behaviorValue,
        },
        scoreSnapshot: result,
        changeType: type,
        changedAt: levelChanged ? now : null,
      });
    }

    if (levelChanged || created) {
      await UserSegmentLog.create({
        userId: user.id, uid: user.uid, ruleId: rule.id, ruleCode: rule.ruleCode,
        fromLevel: created ? null : tag.previousLevel,
        toLevel: result.level,
        changeType: type,
        operationBatch,
        operatorId: operator?.id,
        operatorName: operator?.name || operator?.username || 'SYSTEM',
        behaviorSnapshot: tag.behaviorSnapshot,
        adjustReason: type === 'AUTO' ? `规则[${rule.ruleName}]自动计算 - 行为值${behaviorValue}` : undefined,
      });
    }
    return { tag, levelChanged, created, level: result.level };
  }

  static async manualAdjust(userId, toLevel, reason, remark, operator, expireDays = null) {
    if (!toLevel || toLevel < 1 || toLevel > 5) throw new ValidationError('无效的目标层级');
    if (!reason || reason.length < 5) throw new ValidationError('请填写有效的调整原因（至少5字）');

    const user = await EndUser.findByPk(userId);
    if (!user) throw new ValidationError('用户不存在');

    const tag = await UserSegmentTag.findOne({ where: { userId } });
    if (!tag) throw new ValidationError('用户尚未分层，请先执行自动分层');
    if (tag.currentLevel === toLevel) {
      return { skipped: true, message: '目标层级与当前层级相同，无需调整' };
    }

    const operationBatch = helpers.generateBatchNo('SEG-MAN');
    const changeType = toLevel > tag.currentLevel ? 'MANUAL_UP' : 'MANUAL_DOWN';

    const expireAt = expireDays ? new Date(Date.now() + expireDays * 86400000) : null;
    await tag.update({
      previousLevel: tag.currentLevel,
      currentLevel: toLevel,
      changeType,
      changedAt: new Date(),
      expireAt,
      remark: reason,
    });

    const appliedIds = await this._triggerLinkedStrategies(tag.userId, tag.currentLevel, toLevel);

    await UserSegmentLog.create({
      userId: user.id, uid: user.uid, ruleId: tag.ruleId, ruleCode: tag.ruleCode,
      fromLevel: tag.previousLevel, toLevel, changeType, operationBatch,
      operatorId: operator?.id, operatorName: operator?.name || operator?.username,
      adjustReason: reason, adjustRemark: remark, expireAt,
      appliedStrategies: appliedIds,
    });

    return { operationBatch, fromLevel: tag.previousLevel, toLevel, changeType, appliedStrategiesCount: appliedIds.length };
  }

  static async _triggerLinkedStrategies(userId, fromLevel, toLevel) {
    const strategies = await SegmentStrategy.findAll({
      where: {
        status: STRATEGY_STATUS.RUNNING.value,
        triggerMode: { [Op.in]: [STRATEGY_TRIGGER_MODE.INSTANT.value, STRATEGY_TRIGGER_MODE.RECURRING.value] },
        targetLevels: { [Op.contains]: [toLevel] },
      },
    });
    return strategies.map(s => s.id);
  }

  // ============ 功能点3：批量策略配置 ============
  static async createStrategy(data, operator) {
    const { triggerMode, triggerTime, targetLevels, ...rest } = data;
    if (!targetLevels?.length) throw new ValidationError('请选择目标用户层级');
    if (triggerMode === STRATEGY_TRIGGER_MODE.SCHEDULED.value && !triggerTime) {
      throw new ValidationError('定时策略需指定生效时间');
    }
    if (triggerMode === STRATEGY_TRIGGER_MODE.SCHEDULED.value && new Date(triggerTime) <= new Date()) {
      throw new ValidationError('定时生效时间需大于当前时间');
    }

    const strategy = await SegmentStrategy.create({
      ...rest, targetLevels, triggerMode, triggerTime,
      creatorId: operator?.id,
      creatorName: operator?.name || operator?.username,
    });

    if (triggerMode === STRATEGY_TRIGGER_MODE.INSTANT.value) {
      await this._executeStrategy(strategy.id, operator);
    } else if (triggerMode === STRATEGY_TRIGGER_MODE.SCHEDULED.value) {
      const delay = new Date(triggerTime).getTime() - Date.now();
      if (delay > 0 && delay < 2147483647) {
        setTimeout(() => this._executeStrategy(strategy.id, operator).catch(e => console.error('[Strategy] scheduled err', e.message)), delay);
      }
    }

    return strategy;
  }

  static async _executeStrategy(strategyId, operator) {
    const strategy = await SegmentStrategy.findByPk(strategyId);
    if (!strategy || strategy.status === STRATEGY_STATUS.CANCELLED.value) return;

    const tagWhere = { currentLevel: { [Op.in]: strategy.targetLevels || [] } };
    if (strategy.targetUserType?.length) {
      const matchedUserIds = (await EndUser.findAll({ where: { userType: { [Op.in]: strategy.targetUserType } }, attributes: ['id'] })).map(u => u.id);
      tagWhere.userId = { [Op.in]: matchedUserIds };
    }
    if (strategy.targetMinActivity?.length) {
      const matchedUserIds = (await EndUser.findAll({ where: { activityLevel: { [Op.in]: strategy.targetMinActivity } }, attributes: ['id'] })).map(u => u.id);
      tagWhere.userId = { ...(tagWhere.userId || {}), [Op.and || 'and']: { [Op.in]: matchedUserIds } };
    }
    if (strategy.targetMinConsumption != null) {
      const matchedUserIds = (await EndUser.findAll({ where: { memberLevel: { [Op.gte]: strategy.targetMinConsumption } }, attributes: ['id'] })).map(u => u.id);
      tagWhere.userId = { ...(tagWhere.userId || {}), [Op.and || 'and']: { [Op.in]: matchedUserIds } };
    }

    const allTags = await UserSegmentTag.findAll({ where: tagWhere });
    const matchedByLevel = {};
    allTags.forEach(t => { matchedByLevel[t.currentLevel] = (matchedByLevel[t.currentLevel] || 0) + 1; });
    const targetUserCount = allTags.length;
    const executeBatch = helpers.generateBatchNo('SEG-STS');

    await strategy.update({
      status: STRATEGY_STATUS.RUNNING.value,
      executeBatch,
      targetUserCount,
      matchResult: { byLevel: matchedByLevel, estimated: targetUserCount },
    });

    let success = 0, failed = 0;
    for (const tag of allTags) {
      try {
        const log = await UserSegmentLog.findOne({ where: { userId: tag.userId, operationBatch: executeBatch } });
        if (!log) {
          await UserSegmentLog.create({
            userId: tag.userId, uid: tag.uid, ruleId: tag.ruleId, ruleCode: tag.ruleCode,
            fromLevel: tag.currentLevel, toLevel: tag.currentLevel,
            changeType: 'RULE_CHANGE', operationBatch: executeBatch,
            operatorId: operator?.id, operatorName: operator?.name || operator?.username || 'SYSTEM',
            adjustReason: `策略[${strategy.strategyName}]生效`,
          });
        }
        success++;
      } catch { failed++; }
    }

    await strategy.update({
      status: STRATEGY_STATUS.COMPLETED.value,
      successCount: success, failedCount: failed,
      executedAt: new Date(),
    });
    return { targetUserCount, success, failed, executeBatch };
  }

  static async getStrategyMatchPreview(strategyId) {
    const strategy = await SegmentStrategy.findByPk(strategyId);
    if (!strategy) throw new ValidationError('策略不存在');
    const tagWhere = { currentLevel: { [Op.in]: strategy.targetLevels || [] } };
    const count = await UserSegmentTag.count({ where: tagWhere });
    const byLevel = await UserSegmentTag.findAll({
      where: tagWhere,
      attributes: ['currentLevel', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
      group: ['currentLevel'],
      raw: true,
    }).then(r => r.map(x => ({ level: x.currentLevel, count: Number(x.cnt) })));
    return { total: count, byLevel };
  }

  // ============ 功能点4：溯源与合理性校验 ============
  static async traceSegment(userId) {
    const tag = await UserSegmentTag.findOne({ where: { userId } });
    if (!tag) throw new ValidationError('用户尚未进行分层');
    const logs = await UserSegmentLog.findAll({
      where: { userId },
      order: [['id', 'DESC']],
      limit: 100,
    });
    return { tag, logs };
  }

  static async validateSegmentMatch(ruleId) {
    const rule = await UserSegmentRule.findByPk(ruleId);
    if (!rule) throw new ValidationError('规则不存在');
    const tags = await UserSegmentTag.findAll({ where: { ruleId }, limit: 500 });
    const issues = [];
    for (const tag of tags) {
      const behavior = tag.behaviorSnapshot || {};
      const behaviorValue = behavior.behaviorValue || 0;
      const expected = this.calcLevelByRule(rule, behaviorValue);
      if (tag.changeType && tag.changeType.startsWith('MANUAL')) continue;
      if (expected.level !== tag.currentLevel) {
        issues.push({
          userId: tag.userId, uid: tag.uid, expectedLevel: expected.level, actualLevel: tag.currentLevel,
          behaviorValue, reason: '行为值与层级不匹配',
        });
      }
    }
    return { rule, sampleCount: tags.length, mismatchCount: issues.length, issues: issues.slice(0, 50) };
  }

  static async checkBenefitFit(level, config) {
    const levelBenefitMap = {
      1: ['CREDIT', 'BADGE'],
      2: ['CREDIT', 'BADGE', 'COUPON'],
      3: ['CREDIT', 'BADGE', 'COUPON', 'CONTENT'],
      4: ['CREDIT', 'BADGE', 'COUPON', 'CONTENT', 'VIP_DAY'],
      5: ['CREDIT', 'BADGE', 'COUPON', 'CONTENT', 'VIP_DAY', 'PRIORITY'],
    };
    const allowed = levelBenefitMap[level] || [];
    const fit = allowed.includes(config.type);
    return {
      fit,
      allowedTypes: allowed,
      suggestions: fit ? [] : [`L${level}层级推荐权益类型: ${allowed.join(', ')}`],
    };
  }

  // ============ 查询 ============
  static async getRuleList(query) {
    const { page = 1, pageSize = 10, keyword, status, dimension, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const where = {};
    if (keyword) where[Op.or] = [
      { ruleName: { [Op.like]: `%${keyword}%` } },
      { ruleCode: { [Op.like]: `%${keyword}%` } },
    ];
    if (status) where.status = status;
    if (dimension) where.dimension = dimension;

    const { count, rows } = await UserSegmentRule.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: Number(pageSize),
      offset: (page - 1) * pageSize,
    });

    const enrichRows = [];
    for (const r of rows) {
      const tagCount = await UserSegmentTag.count({ where: { ruleId: r.id } });
      const levelStats = await UserSegmentTag.findAll({
        where: { ruleId: r.id },
        attributes: ['currentLevel', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
        group: ['currentLevel'],
        raw: true,
      }).then(arr => arr.map(x => ({ level: x.currentLevel, count: Number(x.cnt) })));
      enrichRows.push({ ...r.toJSON(), userCount: tagCount, levelStats });
    }
    return { list: enrichRows, pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } };
  }

  static async getStrategyList(query) {
    const { page = 1, pageSize = 10, keyword, status, strategyType, triggerMode } = query;
    const where = {};
    if (keyword) where[Op.or] = [
      { strategyName: { [Op.like]: `%${keyword}%` } },
      { strategyCode: { [Op.like]: `%${keyword}%` } },
    ];
    if (status) where.status = status;
    if (strategyType) where.strategyType = strategyType;
    if (triggerMode) where.triggerMode = triggerMode;

    const { count, rows } = await SegmentStrategy.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: Number(pageSize), offset: (page - 1) * pageSize,
    });
    return { list: rows, pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } };
  }

  static async getSegmentTagList(query) {
    const { page = 1, pageSize = 10, currentLevel, ruleId, userId, uid, changeType } = query;
    const where = {};
    if (currentLevel) where.currentLevel = currentLevel;
    if (ruleId) where.ruleId = ruleId;
    if (userId) where.userId = userId;
    if (uid) where.uid = { [Op.like]: `%${uid}%` };
    if (changeType) where.changeType = changeType;

    const { count, rows } = await UserSegmentTag.findAndCountAll({
      where, order: [['updatedAt', 'DESC']],
      limit: Number(pageSize), offset: (page - 1) * pageSize,
    });
    return { list: rows, pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } };
  }

  static async getStats() {
    const ruleCount = await UserSegmentRule.count();
    const activeRuleCount = await UserSegmentRule.count({ where: { status: SEGMENT_RULE_STATUS.ACTIVE.value } });
    const strategyCount = await SegmentStrategy.count();
    const tagCount = await UserSegmentTag.count();
    const levelCounts = await UserSegmentTag.findAll({
      attributes: ['currentLevel', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
      group: ['currentLevel'], raw: true,
    }).then(arr => arr.map(x => ({ level: x.currentLevel, count: Number(x.cnt) })));
    return { ruleCount, activeRuleCount, strategyCount, tagCount, byLevel: levelCounts };
  }
}

module.exports = UserSegmentService;
