const { EndUser, AccountStatusLog } = require('../models');
const { Op, sequelize } = require('../config/database');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateBatchNo } = require('../utils/helpers');
const { hashPassword } = require('../utils/auth');

const ACCOUNT_STATUS = {
  NORMAL: 1,
  FLOW_LIMITED: 2,
  MUTED: 3,
  TEMP_BANNED: 4,
  PERMANENT_BANNED: 5,
};

const USER_TYPE = {
  NORMAL: 1,
  CREATOR: 2,
  MEMBER: 3,
};

const BANNED_STATUSES = [ACCOUNT_STATUS.TEMP_BANNED, ACCOUNT_STATUS.PERMANENT_BANNED];

const getPermissionsByStatus = (status) => {
  const base = { canWatch: true, canComment: true, canPublish: true, canDistribute: true };
  switch (status) {
    case ACCOUNT_STATUS.NORMAL:
      return base;
    case ACCOUNT_STATUS.FLOW_LIMITED:
      return { ...base, canDistribute: false };
    case ACCOUNT_STATUS.MUTED:
      return { ...base, canComment: false };
    case ACCOUNT_STATUS.TEMP_BANNED:
    case ACCOUNT_STATUS.PERMANENT_BANNED:
      return { canWatch: false, canComment: false, canPublish: false, canDistribute: false };
    default:
      return base;
  }
};

class EndUserService {
  async getUserList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['uid', 'username', 'nickname', 'phone', 'email', 'realName']);

    const where = { ...search };

    if (query.userType) where.userType = query.userType;
    if (query.accountStatus) where.accountStatus = query.accountStatus;
    if (query.creatorLevel !== undefined && query.creatorLevel !== null && query.creatorLevel !== '') where.creatorLevel = query.creatorLevel;
    if (query.memberLevel !== undefined && query.memberLevel !== null && query.memberLevel !== '') where.memberLevel = query.memberLevel;
    if (query.activityLevel !== undefined && query.activityLevel !== null && query.activityLevel !== '') where.activityLevel = query.activityLevel;
    if (query.isVerified !== undefined && query.isVerified !== null && query.isVerified !== '') where.isVerified = query.isVerified;
    if (query.minViolationCount) where.violationCount = { [Op.gte]: Number(query.minViolationCount) };
    if (query.maxViolationCount) where.violationCount = { ...(where.violationCount || {}), [Op.lte]: Number(query.maxViolationCount) };
    if (query.registerStartDate) where.created_at = { [Op.gte]: query.registerStartDate };
    if (query.registerEndDate) where.created_at = { ...(where.created_at || {}), [Op.lte]: query.registerEndDate + ' 23:59:59' };
    if (query.operationBatch) where.operationBatch = query.operationBatch;
    if (query.userTag) where.userTags = { [Op.like]: `%${query.userTag}%` };

    const { count, rows } = await EndUser.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
      attributes: { exclude: ['password'] },
    });

    return {
      list: rows.map((u) => this.serializeUser(u)),
      total: count,
      page,
      pageSize,
    };
  }

  async getUserById(id) {
    const user = await EndUser.findByPk(id, {
      include: [{ model: AccountStatusLog, as: 'statusLogs', limit: 50, order: [['created_at', 'DESC']] }],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundError('用户不存在');
    const data = this.serializeUser(user);
    data.statusLogs = user.statusLogs?.map((log) => this.serializeStatusLog(log)) || [];
    return data;
  }

  async getUserByUid(uid) {
    const user = await EndUser.findOne({
      where: { uid },
      include: [{ model: AccountStatusLog, as: 'statusLogs', limit: 100, order: [['created_at', 'DESC']] }],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundError('用户不存在');
    const data = this.serializeUser(user);
    data.statusLogs = user.statusLogs?.map((log) => this.serializeStatusLog(log)) || [];
    return data;
  }

  async createUser(data, operatorId) {
    if (data.username) {
      const exist = await EndUser.findOne({ where: { username: data.username } });
      if (exist) throw new ConflictError('用户名已存在');
    }
    if (data.phone) {
      const exist = await EndUser.findOne({ where: { phone: data.phone } });
      if (exist) throw new ConflictError('手机号已被使用');
    }

    const uid = 'U' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

    const user = await EndUser.create({
      uid,
      username: data.username || ('user_' + Date.now()),
      nickname: data.nickname || data.username,
      password: await hashPassword(data.password || 'Abc@123456'),
      realName: data.realName,
      idCardNo: data.idCardNo,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      birthday: data.birthday,
      region: data.region,
      signature: data.signature,
      userType: data.userType || 1,
      creatorLevel: data.creatorLevel || 0,
      memberLevel: data.memberLevel || 0,
      accountStatus: data.accountStatus || 1,
      isVerified: data.realName && data.idCardNo ? 1 : (data.isVerified || 0),
      userTags: data.userTags || [],
      riskTags: data.riskTags || [],
      remark: data.remark,
      createdBy: operatorId,
    });

    return { id: user.id, uid: user.uid };
  }

  async updateUser(id, data, operator) {
    const user = await EndUser.findByPk(id);
    if (!user) throw new NotFoundError('用户不存在');

    if (BANNED_STATUSES.includes(user.accountStatus) && !operator?.isSuperAdmin) {
      const editableFields = ['accountStatus', 'banReason', 'banEndTime', 'remark', 'riskTags'];
      const fieldKeys = Object.keys(data);
      const hasIllegalEdit = fieldKeys.some((k) => !editableFields.includes(k));
      if (hasIllegalEdit) {
        throw new ForbiddenError('封禁状态账号禁止修改基础信息，仅允许调整状态和备注');
      }
    }

    if (data.phone && data.phone !== user.phone) {
      const exist = await EndUser.findOne({ where: { phone: data.phone, id: { [Op.ne]: id } } });
      if (exist) throw new ConflictError('手机号已被其他账号使用');
    }

    if (data.username && data.username !== user.username) {
      const exist = await EndUser.findOne({ where: { username: data.username, id: { [Op.ne]: id } } });
      if (exist) throw new ConflictError('用户名已存在');
    }

    const updateData = {
      nickname: data.nickname,
      realName: data.realName,
      idCardNo: data.idCardNo,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      birthday: data.birthday,
      region: data.region,
      signature: data.signature,
      userType: data.userType,
      creatorLevel: data.creatorLevel,
      memberLevel: data.memberLevel,
      userTags: data.userTags,
      riskTags: data.riskTags,
      remark: data.remark,
      updatedBy: operator?.userId,
    };

    if (data.realName && data.idCardNo) {
      updateData.isVerified = 1;
    }

    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    await EndUser.update(updateData, { where: { id } });
    return true;
  }

  async changeAccountStatus(id, params, operator) {
    const user = await EndUser.findByPk(id);
    if (!user) throw new NotFoundError('用户不存在');

    const { toStatus, reason, remark, durationDays, flowLimitLevel } = params;
    const fromStatus = user.accountStatus;

    if (fromStatus === toStatus) {
      throw new BadRequestError('目标状态与当前状态相同，无需变更');
    }

    if (toStatus === ACCOUNT_STATUS.PERMANENT_BANNED && fromStatus === ACCOUNT_STATUS.PERMANENT_BANNED) {
      throw new BadRequestError('账号已为永久封禁状态');
    }

    if (!operator?.isSuperAdmin && toStatus === ACCOUNT_STATUS.PERMANENT_BANNED) {
      throw new ForbiddenError('仅超级管理员可执行永久封禁操作');
    }

    const affectedPermissions = getPermissionsByStatus(toStatus);

    const updateData = {
      accountStatus: toStatus,
      updatedBy: operator?.userId,
    };

    const now = new Date();
    if (toStatus === ACCOUNT_STATUS.FLOW_LIMITED) {
      updateData.flowLimitLevel = flowLimitLevel || 1;
      updateData.banReason = reason;
    } else if (toStatus === ACCOUNT_STATUS.MUTED) {
      updateData.muteEndTime = durationDays ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000) : null;
      updateData.banReason = reason;
    } else if (toStatus === ACCOUNT_STATUS.TEMP_BANNED) {
      if (!durationDays) throw new BadRequestError('临时封禁需指定封禁天数');
      updateData.banStartTime = now;
      updateData.banEndTime = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      updateData.banReason = reason;
      updateData.flowLimitLevel = flowLimitLevel || 0;
    } else if (toStatus === ACCOUNT_STATUS.PERMANENT_BANNED) {
      updateData.banStartTime = now;
      updateData.banReason = reason;
      updateData.flowLimitLevel = flowLimitLevel || 3;
    } else if (toStatus === ACCOUNT_STATUS.NORMAL) {
      updateData.banReason = null;
      updateData.banStartTime = null;
      updateData.banEndTime = null;
      updateData.muteEndTime = null;
      updateData.flowLimitLevel = 0;
    }

    await sequelize.transaction(async (t) => {
      await EndUser.update(updateData, { where: { id }, transaction: t });
      await AccountStatusLog.create({
        userId: id,
        uid: user.uid,
        fromStatus,
        toStatus,
        changeReason: reason,
        changeRemark: remark,
        durationDays,
        flowLimitLevel: updateData.flowLimitLevel || 0,
        operationType: params.operationType || 'MANUAL',
        operationBatch: params.operationBatch,
        operatorId: operator?.userId,
        operatorName: operator?.realName || operator?.username,
        affectedPermissions,
        extraData: params.extraData,
        ipAddress: operator?.ipAddress,
      }, { transaction: t });
    });

    return { affectedPermissions };
  }

  async batchOperation(params, operator) {
    const { ids, action, reason, remark, ...extra } = params;
    if (!ids || ids.length === 0) throw new BadRequestError('请选择要操作的用户');
    if (!action) throw new BadRequestError('请指定操作类型');

    const batchNo = generateBatchNo();
    const results = { successCount: 0, failedCount: 0, skippedCount: 0, successIds: [], failedItems: [], skippedItems: [] };

    await sequelize.transaction(async (t) => {
      for (const id of ids) {
        try {
          const user = await EndUser.findByPk(id, { transaction: t });
          if (!user) {
            results.failedCount++;
            results.failedItems.push({ id, reason: '用户不存在' });
            continue;
          }

          let toStatus = null;
          let flowLimitLevel = 0;
          let durationDays = null;
          let skipReason = null;

          switch (action) {
            case 'UNBAN_LOW_VIOLATION':
              if (user.violationCount <= 1 && BANNED_STATUSES.includes(user.accountStatus)) {
                toStatus = ACCOUNT_STATUS.NORMAL;
              } else if (user.accountStatus === ACCOUNT_STATUS.NORMAL) {
                skipReason = '账号状态正常';
              } else {
                skipReason = '违规次数超过阈值，不满足批量解封条件';
              }
              break;
            case 'FLOW_LIMIT_LOW_QUALITY':
              if (user.userType === USER_TYPE.CREATOR && user.creatorLevel <= 1 && user.accountStatus === ACCOUNT_STATUS.NORMAL) {
                toStatus = ACCOUNT_STATUS.FLOW_LIMITED;
                flowLimitLevel = extra.flowLimitLevel || 1;
              } else if (user.userType !== USER_TYPE.CREATOR) {
                skipReason = '非创作者账号，跳过限流';
              } else if (user.accountStatus !== ACCOUNT_STATUS.NORMAL) {
                skipReason = '账号状态异常，跳过限流';
              } else {
                skipReason = '创作者等级较高，跳过限流';
              }
              break;
            case 'ACTIVATE_DORMANT':
              if (user.activityLevel === 0 && user.accountStatus === ACCOUNT_STATUS.NORMAL) {
                await EndUser.update(
                  { activityLevel: 1, operationBatch: batchNo, updatedBy: operator?.userId },
                  { where: { id }, transaction: t }
                );
                results.successCount++;
                results.successIds.push(id);
                continue;
              } else if (user.activityLevel > 0) {
                skipReason = '非沉睡用户，跳过激活';
              } else {
                skipReason = '账号状态异常，跳过激活';
              }
              break;
            case 'BATCH_UNBAN':
              if (BANNED_STATUSES.includes(user.accountStatus)) {
                toStatus = ACCOUNT_STATUS.NORMAL;
              } else {
                skipReason = '非封禁状态，跳过';
              }
              break;
            case 'BATCH_FLOW_LIMIT':
              if (user.accountStatus === ACCOUNT_STATUS.NORMAL) {
                toStatus = ACCOUNT_STATUS.FLOW_LIMITED;
                flowLimitLevel = extra.flowLimitLevel || 2;
              } else {
                skipReason = '非正常状态，跳过限流';
              }
              break;
            case 'BATCH_TEMP_BAN':
              if (user.accountStatus === ACCOUNT_STATUS.NORMAL || user.accountStatus === ACCOUNT_STATUS.FLOW_LIMITED) {
                toStatus = ACCOUNT_STATUS.TEMP_BANNED;
                durationDays = extra.durationDays || 7;
              } else {
                skipReason = '当前状态不支持临时封禁';
              }
              break;
            default:
              skipReason = '未知操作类型';
          }

          if (skipReason) {
            results.skippedCount++;
            results.skippedItems.push({ id, uid: user.uid, reason: skipReason });
            continue;
          }

          if (toStatus !== null) {
            const updateData = {
              accountStatus: toStatus,
              operationBatch: batchNo,
              updatedBy: operator?.userId,
            };
            const now = new Date();
            if (toStatus === ACCOUNT_STATUS.NORMAL) {
              updateData.banReason = null;
              updateData.banStartTime = null;
              updateData.banEndTime = null;
              updateData.muteEndTime = null;
              updateData.flowLimitLevel = 0;
            } else if (toStatus === ACCOUNT_STATUS.FLOW_LIMITED) {
              updateData.flowLimitLevel = flowLimitLevel;
              updateData.banReason = reason;
            } else if (toStatus === ACCOUNT_STATUS.TEMP_BANNED) {
              updateData.banStartTime = now;
              updateData.banEndTime = durationDays ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000) : null;
              updateData.banReason = reason;
            }

            await EndUser.update(updateData, { where: { id }, transaction: t });
            await AccountStatusLog.create({
              userId: id,
              uid: user.uid,
              fromStatus: user.accountStatus,
              toStatus,
              changeReason: reason,
              changeRemark: remark,
              durationDays,
              flowLimitLevel,
              operationType: 'BATCH',
              operationBatch: batchNo,
              operatorId: operator?.userId,
              operatorName: operator?.realName || operator?.username,
              affectedPermissions: getPermissionsByStatus(toStatus),
              extraData: { batchAction: action, ...extra },
              ipAddress: operator?.ipAddress,
            }, { transaction: t });

            results.successCount++;
            results.successIds.push(id);
          }
        } catch (err) {
          results.failedCount++;
          results.failedItems.push({ id, reason: err.message });
        }
      }
    });

    return { batchNo, ...results };
  }

  async getStatusLogs(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const where = {};

    if (query.userId) where.userId = query.userId;
    if (query.uid) where.uid = query.uid;
    if (query.operationBatch) where.operationBatch = query.operationBatch;
    if (query.operatorId) where.operatorId = query.operatorId;
    if (query.operationType) where.operationType = query.operationType;
    if (query.toStatus) where.toStatus = query.toStatus;

    const { count, rows } = await AccountStatusLog.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((log) => this.serializeStatusLog(log)),
      total: count,
      page,
      pageSize,
    };
  }

  async getStatusStats() {
    const statusCounts = await EndUser.findAll({
      attributes: ['accountStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['accountStatus'],
      raw: true,
    });
    const typeCounts = await EndUser.findAll({
      attributes: ['userType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['userType'],
      raw: true,
    });
    const unverifiedCount = await EndUser.count({ where: { isVerified: 0 } });
    const dormantCount = await EndUser.count({ where: { activityLevel: 0 } });
    const total = await EndUser.count();

    return {
      total,
      unverifiedCount,
      dormantCount,
      byStatus: statusCounts.map((s) => ({ status: s.accountStatus, count: Number(s.count) })),
      byType: typeCounts.map((t) => ({ type: t.userType, count: Number(t.count) })),
    };
  }

  async validateDuplicate(params) {
    const { username, phone, uid, checkType } = params;
    const result = { isDuplicate: false, type: null, existingUser: null };

    if (checkType === 'CREATE' || checkType === 'ALL') {
      if (username) {
        const exist = await EndUser.findOne({ where: { username }, attributes: ['id', 'uid', 'username', 'accountStatus'] });
        if (exist) {
          result.isDuplicate = true;
          result.type = 'USERNAME';
          result.existingUser = { id: exist.id, uid: exist.uid, username: exist.username, accountStatus: exist.accountStatus };
          return result;
        }
      }
      if (phone) {
        const exist = await EndUser.findOne({ where: { phone }, attributes: ['id', 'uid', 'username', 'phone', 'accountStatus'] });
        if (exist) {
          result.isDuplicate = true;
          result.type = 'PHONE';
          result.existingUser = { id: exist.id, uid: exist.uid, username: exist.username, phone: exist.phone, accountStatus: exist.accountStatus };
          return result;
        }
      }
    }

    if (uid) {
      const exist = await EndUser.findOne({ where: { uid }, attributes: ['id', 'uid', 'username', 'accountStatus'] });
      if (exist) {
        result.isDuplicate = true;
        result.type = 'UID';
        result.existingUser = { id: exist.id, uid: exist.uid, username: exist.username, accountStatus: exist.accountStatus };
        return result;
      }
    }

    return result;
  }

  async validateStatusChange(id, toStatus, operator) {
    const user = await EndUser.findByPk(id, { attributes: ['id', 'uid', 'accountStatus', 'violationCount', 'userType'] });
    if (!user) throw new NotFoundError('用户不存在');

    const result = {
      canChange: true,
      reasons: [],
      warnings: [],
      info: [],
      suggestedAction: null,
    };

    if (user.accountStatus === toStatus) {
      result.canChange = false;
      result.reasons.push('目标状态与当前状态相同');
      return result;
    }

    if (toStatus === ACCOUNT_STATUS.PERMANENT_BANNED && !operator?.isSuperAdmin) {
      result.canChange = false;
      result.reasons.push('仅超级管理员可执行永久封禁');
    }

    if (user.accountStatus === ACCOUNT_STATUS.PERMANENT_BANNED && toStatus !== ACCOUNT_STATUS.NORMAL) {
      result.canChange = false;
      result.reasons.push('永久封禁账号仅支持解封（恢复正常）操作');
    }

    if (toStatus === ACCOUNT_STATUS.TEMP_BANNED && user.violationCount < 3) {
      result.warnings.push(`用户违规次数(${user.violationCount})较低，建议谨慎封禁`);
    }

    if (toStatus === ACCOUNT_STATUS.NORMAL && user.accountStatus === ACCOUNT_STATUS.TEMP_BANNED) {
      result.info.push('提前解封临时封禁账号，请确认已完成整改');
    }

    if (toStatus === ACCOUNT_STATUS.FLOW_LIMITED && user.userType !== USER_TYPE.CREATOR) {
      result.warnings.push('非创作者账号，限流仅影响内容分发，对用户体验影响有限');
    }

    result.suggestedAction = result.canChange ? 'PROCEED' : result.reasons.length ? 'BLOCK' : 'WARN';

    return result;
  }

  serializeUser(u) {
    return {
      id: u.id,
      uid: u.uid,
      username: u.username,
      nickname: u.nickname,
      realName: u.realName,
      idCardNo: u.idCardNo,
      avatar: u.avatar,
      email: u.email,
      phone: u.phone,
      gender: u.gender,
      birthday: u.birthday,
      region: u.region,
      signature: u.signature,
      userType: u.userType,
      creatorLevel: u.creatorLevel,
      memberLevel: u.memberLevel,
      accountStatus: u.accountStatus,
      isVerified: u.isVerified,
      banReason: u.banReason,
      banStartTime: u.banStartTime,
      banEndTime: u.banEndTime,
      flowLimitLevel: u.flowLimitLevel,
      muteEndTime: u.muteEndTime,
      violationCount: u.violationCount,
      activityScore: u.activityScore,
      activityLevel: u.activityLevel,
      registerSource: u.registerSource,
      registerIp: u.registerIp,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      loginCount: u.loginCount,
      watchCount: u.watchCount,
      publishCount: u.publishCount,
      commentCount: u.commentCount,
      followerCount: u.followerCount,
      followingCount: u.followingCount,
      userTags: u.userTags || [],
      riskTags: u.riskTags || [],
      operationBatch: u.operationBatch,
      remark: u.remark,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  }

  serializeStatusLog(log) {
    return {
      id: log.id,
      userId: log.userId,
      uid: log.uid,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      changeReason: log.changeReason,
      changeRemark: log.changeRemark,
      durationDays: log.durationDays,
      flowLimitLevel: log.flowLimitLevel,
      operationType: log.operationType,
      operationBatch: log.operationBatch,
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      affectedPermissions: log.affectedPermissions,
      extraData: log.extraData,
      ipAddress: log.ipAddress,
      isReverted: log.isReverted,
      revertedAt: log.revertedAt,
      revertLogId: log.revertLogId,
      createdAt: log.created_at,
    };
  }
}

module.exports = new EndUserService();
