const BaseService = require('./BaseService');
const UserBenefit = require('../models/UserBenefit');
const BenefitLog = require('../models/BenefitLog');
const User = require('../models/User');
const UserRisk = require('../models/UserRisk');
const SystemLogService = require('./SystemLogService');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/error');
const { Op, fn, col } = require('sequelize');

const BENEFIT_RULES = {
  type_1: {
    label: '出行优惠券',
    maxPerUser: 20,
    perTypeMax: 5,
    allowedLevels: [1, 2, 3]
  },
  type_2: {
    label: '积分权益',
    maxPerUser: 1,
    minLevel: 1,
    allowedLevels: [1, 2, 3]
  },
  type_3: {
    label: '贵宾权益',
    maxPerUser: 10,
    minLevel: 3,
    allowedLevels: [3]
  },
  type_4: {
    label: '商旅专属',
    maxPerUser: 15,
    minLevel: 2,
    allowedLevels: [2, 3]
  }
};

const SCENE_LIST = ['flight', 'hotel', 'car', 'ticket', 'business'];

const ACTION_NAME = {
  grant: '发放',
  reissue: '补发',
  void: '作废',
  use: '使用',
  return: '退回',
  extend: '延期',
  recycle: '回收',
  expire: '过期',
  block: '拦截'
};

class BenefitService extends BaseService {
  constructor() {
    super(UserBenefit);
  }

  _buildDateRange(params) {
    if (params.startTime || params.endTime) {
      return {
        startTime: params.startTime,
        endTime: params.endTime,
        dateField: params.dateField || 'createdAt'
      };
    }
    return null;
  }

  async getBenefitList(params) {
    const { keyword, status, userLevel, source, benefitType, dateField = 'createdAt', ...others } = params;
    const options = {
      searchFields: ['benefitName', 'benefitKey', 'batchNo'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'phone', 'userLevel', 'username']
      }],
      exclude: [],
      defaultOrder: [['id', 'DESC']]
    };
    if (userLevel) {
      options.include[0].where = { userLevel };
    }
    const listParams = {
      ...others,
      keyword,
      dateRange: this._buildDateRange({ ...params, dateField })
    };
    if (status !== undefined && status !== '' && status !== null) listParams.status = status;
    if (source) listParams.source = source;
    if (benefitType) listParams.benefitType = benefitType;
    return this.getList(listParams, options);
  }

  async validateGrantRules(params, user, operator) {
    const issues = [];
    const {
      userId, benefitType, benefitKey, totalQuantity, amountValue,
      minAmount, levelRequired, validFrom, validTo, source = 'manual'
    } = params;

    if (!userId) issues.push({ field: 'userId', message: '用户ID必填' });
    if (!benefitType || ![1, 2, 3, 4].includes(Number(benefitType))) {
      issues.push({ field: 'benefitType', message: '权益类型无效（1-4）' });
    }
    if (!benefitKey) issues.push({ field: 'benefitKey', message: '权益编码必填' });
    if (!totalQuantity || totalQuantity <= 0 || totalQuantity > 1000000) {
      issues.push({ field: 'totalQuantity', message: '数量范围1-1,000,000' });
    }

    const targetUser = user || await User.findByPk(userId);
    if (!targetUser) issues.push({ field: 'userId', message: '用户不存在' });

    if (targetUser) {
      if (targetUser.status !== 1) issues.push({ field: 'userId', message: `用户状态异常（状态：${targetUser.status}）` });
      const typeRule = BENEFIT_RULES[`type_${benefitType}`];
      if (typeRule && !typeRule.allowedLevels.includes(targetUser.userLevel)) {
        issues.push({ field: 'benefitType', message: `当前用户等级(${targetUser.userLevel})不适用该权益，需等级${typeRule.minLevel}+` });
      }
      if (levelRequired && Number(levelRequired) > targetUser.userLevel) {
        issues.push({ field: 'levelRequired', message: `等级要求${levelRequired}高于用户等级${targetUser.userLevel}` });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const countToday = await UserBenefit.count({
        where: {
          userId: targetUser.id,
          benefitType,
          source,
          createdAt: { [Op.between]: [today, tomorrow] }
        }
      });
      const typeRuleMax = BENEFIT_RULES[`type_${benefitType}`]?.maxPerUser || 20;
      if (countToday + Number(totalQuantity) > typeRuleMax) {
        issues.push({ field: 'totalQuantity', message: `今日已发放${countToday}个，加上本次${totalQuantity}个超过上限${typeRuleMax}个` });
      }
    }

    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      issues.push({ field: 'validTo', message: '失效时间不能早于生效时间' });
    }
    if (minAmount && Number(minAmount) < 0) {
      issues.push({ field: 'minAmount', message: '使用门槛不能为负数' });
    }
    if (amountValue && Number(amountValue) < 0) {
      issues.push({ field: 'amountValue', message: '面值不能为负数' });
    }

    const existing = await UserBenefit.findOne({
      where: {
        userId,
        benefitType,
        benefitKey,
        status: { [Op.in]: [1, 2] }
      }
    });
    if (existing && source === 'manual') {
      issues.push({ field: 'benefitKey', message: `该用户已持有相同权益，如需补发请选择"补发"操作` });
    }

    const risk = await UserRisk.findOne({ where: { userId, riskLevel: { [Op.gte]: 3 } } });
    if (risk && source === 'manual') {
      issues.push({ field: 'userId', message: '用户为高危风险用户，禁止发放权益（需风险人工确认）' });
    }

    return { valid: issues.length === 0, issues };
  }

  async grantBenefit(params, operator) {
    const validation = await this.validateGrantRules(params, null, operator);
    if (!validation.valid) {
      throw new ValidationError(validation.issues.map(i => i.message).join('；'));
    }
    const {
      userId, benefitType, benefitKey, benefitName, benefitDesc = '',
      totalQuantity = 1, amountValue = 0, unitType = 'count',
      minAmount = 0, applyScenes = '', levelRequired = 1,
      validFrom, validTo, source = 'manual', relatedId = '', remark = ''
    } = params;

    const remainQuantity = Number(totalQuantity);
    const data = {
      userId,
      benefitType: Number(benefitType),
      benefitKey,
      benefitName,
      benefitDesc,
      totalQuantity: Number(totalQuantity),
      usedQuantity: 0,
      remainQuantity,
      amountValue: Number(amountValue),
      unitType,
      minAmount: Number(minAmount),
      applyScenes,
      status: 1,
      source,
      relatedId,
      levelRequired: Number(levelRequired),
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
      remark,
      operatorId: operator?.id || 1
    };

    if (validFrom) data.status = new Date() < new Date(validFrom) ? 1 : 1;
    if (validTo && new Date() > new Date(validTo)) {
      data.status = 4;
    }

    const benefit = await UserBenefit.create(data);

    await BenefitLog.create({
      benefitId: benefit.id,
      userId,
      actionType: 'grant',
      actionName: ACTION_NAME.grant,
      beforeValue: '0',
      afterValue: String(totalQuantity),
      quantityChange: Number(totalQuantity),
      amountChange: Number(amountValue) * Number(totalQuantity),
      batchNo: data.batchNo || '',
      relatedType: source,
      relatedOrderNo: relatedId,
      operatorId: operator?.id,
      operatorRole: operator?.roleCode || 'admin',
      operatorName: operator?.nickname || operator?.username || 'system',
      remark: remark
    });

    await SystemLogService.recordLog(operator, {
      action: 'grant',
      module: 'Benefit',
      target: `user_${userId}:${benefit.id}`,
      detail: `发放权益：${benefitName}，数量：${totalQuantity}，面值：${amountValue}`
    });

    return benefit;
  }

  async reissueBenefit(id, params, operator) {
    const original = await UserBenefit.findByPk(id);
    if (!original) throw new NotFoundError('原权益不存在');
    if (original.status === 0) throw new ValidationError('已作废权益不能补发');

    const reissueQty = Number(params.totalQuantity) || 1;
    const userId = original.userId;
    const validation = await this.validateGrantRules(
      {
        userId,
        benefitType: original.benefitType,
        benefitKey: original.benefitKey,
        totalQuantity: reissueQty,
        levelRequired: original.levelRequired,
        validFrom: params.validFrom || original.validFrom,
        validTo: params.validTo || original.validTo,
        source: 'manual'
      },
      null,
      operator
    );
    if (!validation.valid) {
      throw new ValidationError(validation.issues.map(i => i.message).join('；'));
    }

    original.totalQuantity = Number(original.totalQuantity) + reissueQty;
    original.remainQuantity = Number(original.remainQuantity) + reissueQty;
    if (params.validFrom) original.validFrom = new Date(params.validFrom);
    if (params.validTo) original.validTo = new Date(params.validTo);
    if (params.remark) original.remark = (original.remark ? original.remark + '\n' : '') + params.remark;
    original.status = original.status === 3 ? 2 : original.status;
    if (original.status === 4 && !(params.validTo && new Date(params.validTo) > new Date())) {
      original.status = 4;
    } else if (original.status === 4) {
      original.status = original.remainQuantity > 0 ? 2 : 3;
    }
    original.operatorId = operator?.id;
    await original.save();

    await BenefitLog.create({
      benefitId: original.id,
      userId,
      actionType: 'reissue',
      actionName: ACTION_NAME.reissue,
      beforeValue: `${original.totalQuantity - reissueQty}`,
      afterValue: `${original.totalQuantity}`,
      quantityChange: reissueQty,
      operatorId: operator?.id,
      operatorRole: operator?.roleCode || 'admin',
      operatorName: operator?.nickname || operator?.username || 'system',
      remark: params.remark || ''
    });

    await SystemLogService.recordLog(operator, {
      action: 'reissue',
      module: 'Benefit',
      target: `benefit_${original.id}`,
      detail: `补发权益：${original.benefitName} +${reissueQty}个`
    });
    return original;
  }

  async voidBenefit(id, params, operator) {
    const benefit = await UserBenefit.findByPk(id);
    if (!benefit) throw new NotFoundError('权益不存在');
    if (benefit.status === 0) throw new ValidationError('权益已作废，无需重复操作');
    if (benefit.status === 3 && benefit.remainQuantity <= 0) {
      throw new ValidationError('权益已用完，不能作废');
    }
    const beforeStatus = benefit.status;
    const beforeRemain = benefit.remainQuantity;
    benefit.status = 0;
    benefit.remainQuantity = 0;
    benefit.remark = (benefit.remark ? benefit.remark + '\n' : '') + `作废：${params.reason || '人工作废'}，${params.reason}`;
    benefit.operatorId = operator?.id;
    await benefit.save();

    await BenefitLog.create({
      benefitId: benefit.id,
      userId: benefit.userId,
      actionType: 'void',
      actionName: ACTION_NAME.void,
      beforeValue: `status=${beforeStatus},remain=${beforeRemain}`,
      afterValue: `status=0,remain=0`,
      quantityChange: -Number(beforeRemain),
      operatorId: operator?.id,
      operatorRole: operator?.roleCode || 'admin',
      operatorName: operator?.nickname || operator?.username || 'system',
      remark: params.reason || ''
    });
    await SystemLogService.recordLog(operator, {
      action: 'void',
      module: 'Benefit',
      target: `benefit_${benefit.id}`,
      detail: `作废：${benefit.benefitName}，回收${beforeRemain}个`
    });
    return benefit;
  }

  async extendBenefit(id, params, operator) {
    const benefit = await UserBenefit.findByPk(id);
    if (!benefit) throw new NotFoundError('权益不存在');
    if (![1, 2].includes(benefit.status)) {
      throw new ValidationError('只有未使用或部分使用状态的权益才能延期');
    }
    if (!params.validTo) throw new ValidationError('必须指定新的失效时间');
    const oldValidTo = benefit.validTo;
    if (params.validFrom) benefit.validFrom = new Date(params.validFrom);
    benefit.validTo = new Date(params.validTo);
    if (benefit.status === 4) benefit.status = benefit.remainQuantity > 0 ? 2 : 3;
    await benefit.save();

    await BenefitLog.create({
      benefitId: benefit.id,
      userId: benefit.userId,
      actionType: 'extend',
      actionName: ACTION_NAME.extend,
      beforeValue: oldValidTo ? String(oldValidTo) : '无限制',
      afterValue: String(benefit.validTo),
      operatorId: operator?.id,
      operatorRole: operator?.roleCode || 'admin',
      operatorName: operator?.nickname || operator?.username || 'system',
      remark: params.reason || ''
    });
    return benefit;
  }

  async recycleBenefit(id, params, operator) {
    const benefit = await UserBenefit.findByPk(id);
    if (!benefit) throw new NotFoundError('权益不存在');
    if (benefit.status !== 1 && benefit.status !== 2) {
      throw new ValidationError('仅未使用/部分使用权益可回收');
    }
    const recycleQty = Math.min(Number(params.quantity || benefit.remainQuantity), Number(benefit.remainQuantity));
    if (recycleQty <= 0) throw new ValidationError('无可回收数量');
    const beforeRemain = benefit.remainQuantity;
    benefit.remainQuantity = Number(benefit.remainQuantity) - recycleQty;
    benefit.usedQuantity = Number(benefit.usedQuantity) + 0;
    benefit.status = benefit.remainQuantity <= 0 ? 3 : 2;
    await benefit.save();

    await BenefitLog.create({
      benefitId: benefit.id,
      userId: benefit.userId,
      actionType: 'recycle',
      actionName: ACTION_NAME.recycle,
      beforeValue: `remain=${beforeRemain}`,
      afterValue: `remain=${benefit.remainQuantity}`,
      quantityChange: -recycleQty,
      operatorId: operator?.id,
      operatorRole: operator?.roleCode || 'admin',
      operatorName: operator?.nickname || operator?.username || 'system',
      remark: params.reason || ''
    });
    return benefit;
  }

  async batchGrant(params, operator) {
    const {
      userIds, userConditions = {}, benefitType, benefitKey, benefitName,
      totalQuantity = 1, amountValue = 0, unitType = 'count',
      minAmount = 0, levelRequired = 1, validFrom, validTo,
      mode = 'strict', remark = '', source = 'batch'
    } = params;

    const batchNo = 'BEN' + Date.now() + Math.floor(Math.random() * 1000);
    let realUserIds = userIds || [];
    if (!realUserIds || realUserIds.length === 0) {
      const where = { status: 1 };
      if (userConditions.userLevel) where.userLevel = userConditions.userLevel;
      if (userConditions.registerChannel) where.registerChannel = userConditions.registerChannel;
      if (userConditions.minTotalAmount) where.totalAmount = { [Op.gte]: userConditions.minTotalAmount };
      if (userConditions.minOrderCount) where.orderCount = { [Op.gte]: userConditions.minOrderCount };
      const users = await User.findAll({ where, attributes: ['id', 'userLevel', 'riskLevel'] });
      realUserIds = users.map(u => u.id);
    }
    if (!realUserIds || realUserIds.length === 0) {
      throw new ValidationError('无匹配用户可发放');
    }

    let success = 0;
    let failed = 0;
    const errors = [];
    const results = [];
    let idx = 0;
    for (const uid of realUserIds) {
      idx++;
      try {
        const user = await User.findByPk(uid);
        const risk = await UserRisk.findOne({ where: { userId: uid } });
        if (risk && risk.riskLevel >= 3) {
          failed++;
          errors.push({ userId: uid, reason: '高危风险用户，禁止发放' });
          continue;
        }
        const result = await this.grantBenefit(
          {
            userId: uid, benefitType, benefitKey: `${benefitKey}_${uid}`, benefitName,
            totalQuantity, amountValue, unitType, minAmount,
            levelRequired, validFrom, validTo, source, batchNo, remark
          },
          operator
        );
        success++;
        results.push({ userId: uid, benefitId: result.id });
      } catch (e) {
        failed++;
        errors.push({ userId: uid, reason: e.message });
        if (mode === 'strict' && failed > realUserIds.length * 0.5) {
          break;
        }
      }
      results.push({ _progress: Math.round((idx / realUserIds.length) * 100) });
    }
    return { success, failed, batchNo, total: realUserIds.length, errors };
  }

  async batchExtend(params, operator) {
    const { ids, userLevel = null, validTo, reason = '', days = 30 } = params;
    const where = { status: { [Op.in]: [1, 2] } };
    if (ids && ids.length > 0) {
      where.id = { [Op.in]: ids };
    }
    if (userLevel) {
      const levelUsers = await User.findAll({ where: { userLevel }, attributes: ['id'] });
      where.userId = { [Op.in]: levelUsers.map(u => u.id) };
    }
    const benefits = await UserBenefit.findAll({ where });
    let success = 0, failed = 0;
    const errors = [];
    for (const b of benefits) {
      try {
        const targetDate = validTo ? new Date(validTo) : new Date((b.validTo ? new Date(b.validTo) : new Date()).getTime() + days * 24 * 60 * 60 * 1000);
        b.validTo = targetDate;
        if (b.status === 4) b.status = b.remainQuantity > 0 ? 2 : 3;
        await b.save();
        await BenefitLog.create({
          benefitId: b.id, userId: b.userId, actionType: 'extend', actionName: ACTION_NAME.extend,
          beforeValue: String(b.validTo), afterValue: String(targetDate),
          operatorId: operator?.id, operatorRole: operator?.roleCode, operatorName: operator?.nickname || operator?.username,
          remark: reason
        });
        success++;
      } catch (e) {
        failed++;
        errors.push({ benefitId: b.id, reason: e.message });
      }
    }
    return { success, failed, total: benefits.length, errors };
  }

  async batchRecycle(params, operator) {
    const { ids, recycleReason = '批量回收', source = 'batch' } = params;
    if (!ids || ids.length === 0) throw new ValidationError('请选择要回收的权益');
    let success = 0, failed = 0;
    const errors = [];
    for (const id of ids) {
      try {
        await this.recycleBenefit(id, { reason: recycleReason }, operator);
        success++;
      } catch (e) {
        failed++;
        errors.push({ benefitId: id, reason: e.message });
      }
    }
    return { success, failed, total: ids.length, errors };
  }

  async getBenefitTrace(userId, params) {
    const user = await User.findByPk(userId, { attributes: ['id', 'nickname', 'phone', 'userLevel', 'username'] });
    if (!user) throw new NotFoundError('用户不存在');

    const benefits = await UserBenefit.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: []
    });

    const where = { userId };
    if (params.startTime) where.createdAt = where.createdAt || {};
    if (params.endTime) where.createdAt = where.createdAt || {};
    if (params.startTime) where.createdAt[Op.gte] = new Date(params.startTime);
    if (params.endTime) where.createdAt[Op.lte] = new Date(params.endTime);

    const logs = await BenefitLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: params.limit || 200
    });

    const abnormalItems = [];
    const grantCount = logs.filter(l => l.actionType === 'grant').length;
    const useCount = logs.filter(l => l.actionType === 'use').length;
    if (grantCount > 50) {
      abnormalItems.push({ type: 'over_count', level: 2, desc: `累计发放次数${grantCount}，异常偏高` });
    }
    const recentGrant = logs.filter(l => l.actionType === 'grant' && Date.now() - new Date(l.createdAt) < 60 * 60 * 1000);
    if (recentGrant.length > 10) {
      abnormalItems.push({ type: 'over_frequency', level: 3, desc: `近1小时发放${recentGrant.length}次，疑似超额` });
    }
    const totalGranted = logs.filter(l => ['grant', 'reissue'].includes(l.actionType))
      .reduce((sum, l) => sum + Number(l.quantityChange || 0), 0);
    const totalUsed = logs.filter(l => ['use'].includes(l.actionType))
      .reduce((sum, l) => sum - Number(l.quantityChange || 0), 0);
    const currentTotal = benefits.reduce((s, b) => s + Number(b.totalQuantity || 0), 0);
    if (Math.abs(currentTotal - (totalGranted - totalUsed)) > 1) {
      abnormalItems.push({ type: 'mismatch', level: 3, desc: `数据不一致：台账累计${totalGranted - totalUsed} vs 当前库存${currentTotal}` });
    }

    return {
      userInfo: user,
      benefits,
      logs,
      summary: {
        totalCount: benefits.length,
        validCount: benefits.filter(b => [1, 2].includes(b.status)).length,
        usedCount: benefits.filter(b => b.status === 3).length,
        expiredCount: benefits.filter(b => b.status === 4).length,
        voidCount: benefits.filter(b => b.status === 0).length,
        grantCount,
        useCount,
        totalGrantedAmount: logs.reduce((s, l) => s + Number(l.amountChange || 0), 0)
      },
      abnormalItems
    };
  }

  async getBenefitStats(params) {
    const where = {};
    if (params.benefitType) where.benefitType = params.benefitType;
    if (params.status !== undefined && params.status !== null && params.status !== '') where.status = params.status;
    if (params.startTime) where.createdAt = { [Op.gte]: new Date(params.startTime) };
    if (params.endTime) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(params.endTime) };

    const [byType, byStatus, totalRemain, totalAmount, todayNew] = await Promise.all([
      UserBenefit.findAll({
        where,
        group: ['benefitType'],
        attributes: ['benefitType', [fn('COUNT', col('id')), 'cnt'], [fn('SUM', col('remain_quantity')), 'sum']]
      }),
      UserBenefit.findAll({
        where,
        group: ['status'],
        attributes: ['status', [fn('COUNT', col('id')), 'cnt']]
      }),
      UserBenefit.sum('remainQuantity', { where }),
      UserBenefit.sum('amountValue', { where: { ...where, status: { [Op.in]: [1, 2] } } }),
      UserBenefit.count({
        where: {
          ...where,
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const byTypeMap = {};
    byType.forEach(t => { byTypeMap[t.benefitType] = { count: t.dataValues.cnt, remain: t.dataValues.sum }; });
    const byStatusMap = {};
    byStatus.forEach(s => { byStatusMap[s.status] = s.dataValues.cnt; });

    return {
      totalCount: Object.values(byStatusMap).reduce((s, v) => s + v, 0),
      validCount: (byStatusMap[1] || 0) + (byStatusMap[2] || 0),
      usedCount: byStatusMap[3] || 0,
      expiredCount: byStatusMap[4] || 0,
      voidCount: byStatusMap[0] || 0,
      totalRemain: Number(totalRemain || 0),
      totalAmount: Number(totalAmount || 0),
      todayNew,
      byType: byTypeMap,
      byStatus: byStatusMap
    };
  }

  async checkExpiredBenefits(operator) {
    const now = new Date();
    const expired = await UserBenefit.findAll({
      where: {
        status: { [Op.in]: [1, 2] },
        validTo: { [Op.lte]: now },
        validTo: { [Op.not]: null }
      }
    });
    let count = 0;
    for (const b of expired) {
      const beforeRemain = b.remainQuantity;
      b.status = 4;
      b.remainQuantity = 0;
      await b.save();
      await BenefitLog.create({
        benefitId: b.id,
        userId: b.userId,
        actionType: 'expire',
        actionName: ACTION_NAME.expire,
        beforeValue: `status=${b.status},remain=${beforeRemain}`,
        afterValue: 'status=4,remain=0',
        quantityChange: -Number(beforeRemain),
        operatorId: operator?.id || 1,
        operatorRole: 'system',
        operatorName: 'system',
        remark: `系统自动过期：${now.toISOString()}`
      });
      count++;
    }
    return { count, ids: expired.map(e => e.id) };
  }
}

module.exports = new BenefitService();
