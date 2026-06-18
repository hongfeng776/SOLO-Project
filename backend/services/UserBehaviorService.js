const BaseService = require('./BaseService');
const UserBehavior = require('../models/UserBehavior');
const UserRisk = require('../models/UserRisk');
const User = require('../models/User');
const SystemLogService = require('./SystemLogService');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/error');
const { Op, Sequelize, fn, col } = require('sequelize');

class UserBehaviorService extends BaseService {
  constructor() {
    super(UserBehavior);
  }

  validateQueryParams(params) {
    const { startTime, endTime, behaviorType, userLevel } = params;
    const errors = [];

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (isNaN(start) || isNaN(end)) {
        errors.push('时间格式不正确');
      } else if (start > end) {
        errors.push('开始时间不能晚于结束时间');
      } else {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
          errors.push('查询周期不能超过90天');
        }
      }
    }

    if (behaviorType) {
      const validTypes = ['browse', 'order', 'aftersale', 'marketing'];
      if (!validTypes.includes(behaviorType)) {
        errors.push('行为类型不合法');
      }
    }

    if (userLevel && ![1, 2, 3].includes(parseInt(userLevel))) {
      errors.push('用户等级不合法');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
    return true;
  }

  async getBehaviorList(params = {}) {
    this.validateQueryParams(params);
    const { behaviorType, behaviorKey, riskLevel, isAbnormal, userLevel, registerChannel, startTime, endTime, ...rest } = params;
    const where = {};

    if (behaviorType) where.behaviorType = behaviorType;
    if (behaviorKey) where.behaviorKey = behaviorKey;
    if (isAbnormal !== undefined && isAbnormal !== '') where.isAbnormal = isAbnormal;

    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    const userWhere = {};
    if (userLevel) userWhere.userLevel = userLevel;
    if (registerChannel) userWhere.registerChannel = registerChannel;
    if (riskLevel !== undefined && riskLevel !== '') {
      return this.getRiskFilteredList(params, rest, where, riskLevel, userWhere);
    }

    const include = [
      { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'userLevel', 'phone'], where: userWhere }
    ];

    return super.getList(rest, {
      searchFields: ['username', 'behaviorName', 'targetName', 'ip'],
      fieldMap: { dateField: 'createdAt' },
      customWhere: where,
      include,
      defaultOrder: [['id', 'DESC']]
    });
  }

  async getRiskFilteredList(params, rest, behaviorWhere, riskLevel, userWhere) {
    const riskUsers = await UserRisk.findAll({
      where: { riskLevel },
      attributes: ['userId']
    });
    const userIds = riskUsers.map(r => r.userId);
    if (userIds.length === 0) {
      return { list: [], total: 0 };
    }
    behaviorWhere.userId = { [Op.in]: userIds };
    const { pageNum, pageSize, keyword } = rest;
    const offset = (pageNum - 1) * pageSize;
    const { count, rows } = await UserBehavior.findAndCountAll({
      where: behaviorWhere,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'userLevel', 'phone'] }
      ],
      limit: pageSize,
      offset,
      order: [['id', 'DESC']]
    });
    return { list: rows, total: count };
  }

  async getAggregatedStats(params = {}) {
    this.validateQueryParams(params);
    const { startTime, endTime, behaviorType, userLevel, registerChannel } = params;

    const behaviorWhere = {};
    if (behaviorType) behaviorWhere.behaviorType = behaviorType;
    if (startTime && endTime) {
      behaviorWhere.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }

    const userWhere = {};
    if (userLevel) userWhere.userLevel = userLevel;
    if (registerChannel) userWhere.registerChannel = registerChannel;

    const userIds = (await User.findAll({
      where: userWhere,
      attributes: ['id']
    })).map(u => u.id);

    if (userIds.length > 0) {
      behaviorWhere.userId = { [Op.in]: userIds };
    }

    const behaviorCounts = await UserBehavior.findAll({
      where: behaviorWhere,
      attributes: [
        'behaviorType',
        [fn('COUNT', '*'), 'count']
      ],
      group: ['behaviorType']
    });

    const byType = {};
    for (const r of behaviorCounts) {
      byType[r.behaviorType] = parseInt(r.dataValues.count) || 0;
    }

    const activeDays = behaviorWhere.createdAt
      ? Math.max(1, Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60 * 24)))
      : 30;

    const activeUserCount = (await UserBehavior.findAll({
      where: behaviorWhere,
      attributes: [[fn('COUNT', fn('DISTINCT', col('userId'))), 'count']]
    }))[0]?.dataValues?.count || 0;

    const abnormalCount = await UserBehavior.count({
      where: { ...behaviorWhere, isAbnormal: 1 }
    });

    const abnormalByType = await UserBehavior.findAll({
      where: { ...behaviorWhere, isAbnormal: 1 },
      attributes: ['abnormalType', [fn('COUNT', '*'), 'count']],
      group: ['abnormalType']
    });

    const abnormalMap = {};
    for (const r of abnormalByType) {
      abnormalMap[r.abnormalType] = parseInt(r.dataValues.count) || 0;
    }

    const orderUsers = new Set();
    const repeatOrderUsers = new Set();
    const orderBehaviors = await UserBehavior.findAll({
      where: { ...behaviorWhere, behaviorType: 'order', behaviorKey: 'order_create' },
      attributes: ['userId']
    });
    const userOrderMap = {};
    for (const b of orderBehaviors) {
      orderUsers.add(b.userId);
      userOrderMap[b.userId] = (userOrderMap[b.userId] || 0) + 1;
      if (userOrderMap[b.userId] >= 2) repeatOrderUsers.add(b.userId);
    }

    const repurchaseRate = orderUsers.size > 0
      ? Math.round((repeatOrderUsers.size / orderUsers.size) * 100)
      : 0;

    const avgDailyActive = Math.round(activeUserCount / activeDays);

    const categoryData = await UserBehavior.findAll({
      where: { ...behaviorWhere, behaviorKey: { [Op.in]: ['product_view', 'order_create'] } },
      attributes: ['targetName', [fn('COUNT', '*'), 'count']],
      group: ['targetName'],
      order: [[fn('COUNT', '*'), 'DESC']],
      limit: 5
    });

    const preferences = categoryData.map(c => ({
      category: c.targetName || '其他',
      count: parseInt(c.dataValues.count) || 0
    }));

    const riskCounts = await UserRisk.findAll({
      attributes: ['riskLevel', [fn('COUNT', '*'), 'count']],
      group: ['riskLevel']
    });
    const riskDist = {};
    for (const r of riskCounts) {
      riskDist[r.riskLevel] = parseInt(r.dataValues.count) || 0;
    }

    return {
      totalBehaviors: Object.values(byType).reduce((a, b) => a + b, 0),
      byBehaviorType: byType,
      activeUserCount,
      avgDailyActive,
      abnormalCount,
      abnormalByType: abnormalMap,
      repurchaseRate,
      preferences,
      riskDistribution: riskDist,
      periodDays: activeDays
    };
  }

  async getUserBehaviorTrace(userId, params = {}) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('用户不存在');

    const { startTime, endTime, behaviorType } = params;
    const where = { userId };
    if (startTime && endTime) {
      where.createdAt = { [Op.between]: [new Date(startTime), new Date(endTime)] };
    }
    if (behaviorType) where.behaviorType = behaviorType;

    const behaviors = await UserBehavior.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 500
    });

    const grouped = { browse: [], order: [], aftersale: [], marketing: [] };
    for (const b of behaviors) {
      if (grouped[b.behaviorType]) {
        grouped[b.behaviorType].push(b);
      }
    }

    const sessions = {};
    for (const b of behaviors) {
      const sid = b.sessionId || 'default';
      if (!sessions[sid]) sessions[sid] = [];
      sessions[sid].push(b);
    }

    const issues = [];
    const byIp = {};
    for (const b of behaviors) {
      if (b.ip) {
        byIp[b.ip] = (byIp[b.ip] || 0) + 1;
      }
    }

    for (const ip in byIp) {
      if (byIp[ip] > 100) {
        issues.push({
          type: 'ip_frequent',
          level: 2,
          desc: `IP ${ip} 在统计周期内操作${byIp[ip]}次，疑似刷单`
        });
      }
    }

    const shortTimeOrders = behaviors.filter(b =>
      b.behaviorKey === 'order_create').sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt));
    for (let i = 1; i < shortTimeOrders.length; i++) {
      const diff = new Date(shortTimeOrders[i].createdAt) - new Date(shortTimeOrders[i - 1].createdAt);
      if (diff < 1000 * 10) {
        issues.push({ type: 'rapid_orders', level: 3, desc: '存在间隔小于10秒的连续下单，疑似刷单' });
        break;
      }
    }

    const refundRate = behaviors.filter(b => b.behaviorKey === 'refund_apply').length /
      Math.max(1, behaviors.filter(b => b.behaviorKey === 'order_create').length);
    if (refundRate > 0.5) {
      issues.push({ type: 'high_refund', level: 3, desc: `售后申请率${Math.round(refundRate * 100)}%，疑似恶意售后` });
    }

    const couponReceive = behaviors.filter(b => b.behaviorKey === 'coupon_receive').length;
    const couponUse = behaviors.filter(b => b.behaviorKey === 'coupon_use').length;
    if (couponReceive >= 10 && couponUse === 0) {
      issues.push({ type: 'wool', level: 2, desc: `领取${couponReceive}张优惠券未使用，疑似薅羊毛` });
    }

    const fakeCount = behaviors.filter(b => b.isAbnormal === 1).length;
    if (fakeCount > 0) {
      issues.push({ type: 'fake_count', level: 1, desc: `检测到${fakeCount}条异常行为记录` });
    }

    return {
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        userLevel: user.userLevel,
        phone: user.phone,
        registerChannel: user.registerChannel,
        createdAt: user.createdAt
      },
      totalCount: behaviors.length,
      grouped,
      sessions: Object.keys(sessions).map(sid => ({
        sessionId: sid,
        count: sessions[sid].length,
        startTime: sessions[sid][sessions[sid].length - 1]?.createdAt,
        endTime: sessions[sid][0]?.createdAt
      })),
      detectedIssues: issues,
      riskLevel: issues.length > 0
        ? Math.max(...issues.map(i => i.level))
        : 0,
      abnormalCount,
      ipDistribution: byIp
    };
  }

  async detectUserRisk(userId) {
    const trace = await this.getUserBehaviorTrace(userId);
    const riskLevel = trace.riskLevel || 0;

    let userRisk = await UserRisk.findOne({ where: { userId } });

    const tags = [];
    for (const issue of trace.detectedIssues) {
      if (issue.type === 'ip_frequent' && !tags.includes('IP异常')) tags.push('IP异常');
      if (issue.type === 'rapid_orders' && !tags.includes('刷单嫌疑')) tags.push('刷单嫌疑');
      if (issue.type === 'high_refund' && !tags.includes('恶意售后')) tags.push('恶意售后');
      if (issue.type === 'wool' && !tags.includes('薅权益')) tags.push('薅权益');
    }

    const data = {
      userId,
      username: trace.userInfo.username,
      riskLevel,
      riskScore: riskLevel * 25,
      riskTags: JSON.stringify(tags),
      abnormalCount: trace.abnormalCount,
      lastAbnormalTime: new Date()
    };

    if (userRisk) {
      await userRisk.update(data);
    } else {
      userRisk = await UserRisk.create(data);
    }

    return userRisk;
  }

  async getRiskUsers(params = {}) {
    const { riskLevel, isMarked, isRestricted, ...rest } = params;
    const where = {};
    if (riskLevel !== undefined && riskLevel !== '') where.riskLevel = riskLevel;
    if (isMarked !== undefined && isMarked !== '') where.isMarked = isMarked;
    if (isRestricted !== undefined && isRestricted !== '') where.isRestricted = isRestricted;

    const include = [
      { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'userLevel', 'phone', 'registerChannel'] }
    ];

    return super.getListCustom(rest, {
      searchFields: ['username'],
      customWhere: where,
      include,
      defaultOrder: [['riskScore', 'DESC']]
    );
  }

  async getListCustom(params, options) {
    const pageNum = parseInt(params.pageNum) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const offset = (pageNum - 1) * pageSize;
    const where = options.customWhere || {};
    if (params.keyword) {
      where.username = { [Op.like]: `%${params.keyword}%` };
    }
    const { count, rows } = await UserRisk.findAndCountAll({
      where,
      include: options.include,
      limit: pageSize,
      offset,
      order: options.defaultOrder || [['id', 'DESC']]
    });
    return { list: rows, total: count };
  }

  async batchMarkRisk(userIds, riskLevel, operator = null, remark = '') {
    const results = { success: 0, failed: 0, errors: [], progress: [] };
    const total = userIds.length;

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        const user = await User.findByPk(userId);
        if (!user) { results.failed++; continue; }
        const tags = ['人工标记'];
        let risk = await UserRisk.findOne({ where: { userId } });
        const data = {
          userId,
          username: user.username,
          riskLevel,
          isMarked: 1,
          riskScore: riskLevel * 30,
          riskTags: JSON.stringify(tags),
          operatorId: operator?.id || null,
          operatorName: operator?.username || null,
          remark
        };
        if (risk) {
          await risk.update(data);
        } else {
          risk = await UserRisk.create(data);
        }
        results.success++;

        await SystemLogService.recordLog({
          userId: operator?.id || null,
          username: operator?.username || 'system',
          action: 'risk_mark',
          module: 'user_behavior',
          target: `user:${userId}`,
          detail: JSON.stringify({ riskLevel, remark })
        });
      } catch (e) {
        results.failed++;
        results.errors.push({ userId, message: e.message });
      }
      results.progress.push({ done: i + 1, total, percent: Math.round(((i + 1) / total) * 100) });
    }
    return results;
  }

  async batchSendWarning(userIds, operator = null, content = '') {
    const results = { success: 0, failed: 0, errors: [] };
    for (const userId of userIds) {
      try {
        let risk = await UserRisk.findOne({ where: { userId } });
        if (!risk) {
          const user = await User.findByPk(userId);
          risk = await UserRisk.create({ userId, username: user?.username });
        }
        await risk.increment('warningSent', { by: 1 });
        await risk.update({ lastWarningTime: new Date() });
        results.success++;

        await SystemLogService.recordLog({
          userId: operator?.id || null,
          username: operator?.username || 'system',
          action: 'warning_send',
          module: 'user_behavior',
          target: `user:${userId}`,
          detail: JSON.stringify({ content })
        });
      } catch (e) {
        results.failed++;
        results.errors.push({ userId, message: e.message });
      }
    }
    return results;
  }

  async batchRestrict(userIds, restrictType, operator = null, reason = '') {
    const results = { success: 0, failed: 0, errors: [] };
    const typeMap = { order: 1, aftersale: 2, all: 3 };
    const type = typeMap[restrictType] || 1;
    for (const userId of userIds) {
      try {
        let risk = await UserRisk.findOne({ where: { userId } });
        if (!risk) {
          const user = await User.findByPk(userId);
          risk = await UserRisk.create({ userId, username: user?.username });
        }
        await risk.update({ isRestricted: type });

        const user = await User.findByPk(userId);
        await user?.update({ status: 1 });
        results.success++;

        await SystemLogService.recordLog({
          userId: operator?.id || null,
          username: operator?.username || 'system',
          action: 'restrict_' + restrictType,
          module: 'user_behavior',
          target: `user:${userId}`,
          detail: JSON.stringify({ restrictType, reason })
        });
      } catch (e) {
        results.failed++;
        results.errors.push({ userId, message: e.message });
      }
    }
    return results;
  }
}

module.exports = new UserBehaviorService();
