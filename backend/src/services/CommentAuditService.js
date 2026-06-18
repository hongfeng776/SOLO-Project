const { Comment, Content, User, ContentStatusLog } = require('../models');
const { Op, sequelize } = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString } = require('../utils/helpers');
const cacheService = require('./CacheService');

const AUDIT_STATUS = {
  PENDING: 0,
  NORMAL: 1,
  HIDDEN: 2,
  DELETED: 3,
  LOCKED: 4,
};

const AUDIT_SOURCE = {
  NEW_PUBLISHED: 'new_published',
  USER_REPORTED: 'user_reported',
  HISTORY_VIOLATION: 'history_violation',
  HIGH_RISK_AUTO: 'high_risk_auto',
};

const SENSITIVE_KEYWORDS = {
  political: {
    level: 'high',
    words: [
      { word: '台独', weight: 5 },
      { word: '港独', weight: 5 },
      { word: '藏独', weight: 5 },
      { word: '法轮功', weight: 5 },
      { word: '邪教', weight: 4 },
      { word: '反党', weight: 5 },
      { word: '反动', weight: 4 },
      { word: '颠覆国家', weight: 5 },
    ],
  },
  pornographic: {
    level: 'high',
    words: [
      { word: '色情', weight: 4 },
      { word: '淫荡', weight: 4 },
      { word: '裸体', weight: 5 },
      { word: '性交', weight: 5 },
      { word: '嫖娼', weight: 5 },
      { word: '卖淫', weight: 5 },
      { word: '裸聊', weight: 4 },
      { word: '三级片', weight: 4 },
    ],
  },
  violence: {
    level: 'high',
    words: [
      { word: '血腥', weight: 4 },
      { word: '暴力', weight: 3 },
      { word: '凶杀', weight: 5 },
      { word: '自残', weight: 4 },
      { word: '自杀', weight: 4 },
      { word: '虐杀', weight: 5 },
      { word: '恐怖', weight: 3 },
      { word: '枪支', weight: 5 },
      { word: '炸弹', weight: 5 },
      { word: '毒品', weight: 5 },
      { word: '冰毒', weight: 5 },
      { word: '海洛因', weight: 5 },
      { word: '赌博', weight: 4 },
      { word: '博彩', weight: 4 },
    ],
  },
  abuse: {
    level: 'medium',
    words: [
      { word: '傻逼', weight: 3 },
      { word: '草泥马', weight: 3 },
      { word: '滚蛋', weight: 2 },
      { word: '垃圾', weight: 2 },
      { word: '废物', weight: 2 },
    ],
  },
  advertisement: {
    level: 'medium',
    words: [
      { word: '加微信', weight: 3 },
      { word: '加QQ', weight: 3 },
      { word: '私聊', weight: 2 },
      { word: '代购', weight: 3 },
      { word: '刷单', weight: 3 },
      { word: '兼职日结', weight: 3 },
      { word: '点击链接', weight: 2 },
      { word: '免费领取', weight: 2 },
    ],
  },
};

const VIOLATION_TYPE_CONFIG = {
  political_sensitive: { label: '政治敏感', level: 'extreme', muteDays: 30, flowLimit: true },
  pornographic_content: { label: '色情内容', level: 'severe', muteDays: 15, flowLimit: true },
  violent_content: { label: '暴力血腥', level: 'severe', muteDays: 15, flowLimit: true },
  drug_contraband: { label: '毒品违禁', level: 'extreme', muteDays: 30, flowLimit: true },
  gambling_content: { label: '赌博博彩', level: 'severe', muteDays: 15, flowLimit: true },
  personal_attack: { label: '人身攻击', level: 'medium', muteDays: 7, flowLimit: false },
  abuse_insult: { label: '辱骂侮辱', level: 'medium', muteDays: 7, flowLimit: false },
  spam_advertisement: { label: '垃圾广告', level: 'medium', muteDays: 7, flowLimit: true },
  fraud_scam: { label: '诈骗欺诈', level: 'severe', muteDays: 15, flowLimit: true },
  false_information: { label: '虚假信息', level: 'medium', muteDays: 3, flowLimit: false },
  copyright_infringement: { label: '版权侵权', level: 'medium', muteDays: 3, flowLimit: false },
  other_violation: { label: '其他违规', level: 'low', muteDays: 1, flowLimit: false },
};

const PUNISHMENT_THRESHOLD = {
  MUTE: 3,
  LIMIT_FLOW: 5,
  BAN: 10,
};

const COMMENT_ACTION_LOG_TYPE = {
  AUDIT_SUBMIT: 'audit_submit',
  AUDIT_APPROVE: 'audit_approve',
  AUDIT_HIDE: 'audit_hide',
  AUDIT_DELETE: 'audit_delete',
  AUDIT_MUTE: 'audit_mute',
  BATCH_CLEAN: 'batch_clean',
  BATCH_APPROVE: 'batch_approve',
  BATCH_MARK: 'batch_mark',
  AUTO_MUTE_TRIGGER: 'auto_mute_trigger',
  AUTO_FLOW_LIMIT: 'auto_flow_limit',
};

function generateBatchId() {
  const ts = Math.floor(Date.now() / 1000);
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CB_${ts}${rand}`;
}

function generateAuditNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CMT_AUD${y}${m}${d}${rand}`;
}

function scanSensitiveKeywords(text) {
  const detected = [];
  let totalScore = 0;
  const categoryHits = {};

  if (!text) return { detected, totalScore, categoryHits };

  for (const [category, config] of Object.entries(SENSITIVE_KEYWORDS)) {
    for (const { word, weight } of config.words) {
      let startIndex = 0;
      while (startIndex < text.length) {
        const idx = text.indexOf(word, startIndex);
        if (idx === -1) break;
        detected.push({
          word,
          category,
          level: config.level,
          weight,
          offset: idx,
          context: text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + word.length + 10)),
        });
        totalScore += weight;
        categoryHits[category] = (categoryHits[category] || 0) + 1;
        startIndex = idx + word.length;
      }
    }
  }

  return { detected, totalScore, categoryHits };
}

function detectSource(comment) {
  const sources = [];

  if (comment.audit_status === AUDIT_STATUS.PENDING) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (new Date(comment.created_at) >= twoHoursAgo) {
      sources.push(AUDIT_SOURCE.NEW_PUBLISHED);
    }
  }

  if ((comment.reported_count || 0) > 0) {
    sources.push(AUDIT_SOURCE.USER_REPORTED);
  }

  if (comment.violation_level === 3) {
    sources.push(AUDIT_SOURCE.HIGH_RISK_AUTO);
  }

  return sources;
}

const batchProgressStore = new Map();

class CommentAuditService {
  async getAuditPool(queryParams, userId, userRole) {
    const { page, pageSize, offset } = parsePagination(queryParams);
    const order = parseSort(queryParams);
    const where = {};

    if (queryParams.auditStatus !== undefined && queryParams.auditStatus !== null && queryParams.auditStatus !== '') {
      where.audit_status = Number(queryParams.auditStatus);
    } else {
      where.audit_status = { [Op.in]: [AUDIT_STATUS.PENDING] };
    }

    if (queryParams.contentId) where.content_id = Number(queryParams.contentId);
    if (queryParams.userId) where.user_id = Number(queryParams.userId);
    if (queryParams.violationLevel !== undefined && queryParams.violationLevel !== null && queryParams.violationLevel !== '') {
      where.violation_level = Number(queryParams.violationLevel);
    }
    if (queryParams.violationType) where.violation_type = queryParams.violationType;
    if (queryParams.source) where.audit_source = queryParams.source;

    if (queryParams.keyword) {
      where.comment_content = { [Op.like]: `%${queryParams.keyword}%` };
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const sourceFilter = [];
    if (!queryParams.source) {
      sourceFilter.push({ audit_status: AUDIT_STATUS.PENDING, created_at: { [Op.gte]: twoHoursAgo } });
      sourceFilter.push({ reported_count: { [Op.gt]: 0 } });
      sourceFilter.push({ violation_level: 3 });
    }

    if (sourceFilter.length > 0 && !queryParams.auditStatus) {
      where[Op.or] = sourceFilter;
    }

    if (userRole === 'CONTENT_AUDITOR') {
      where.auditor_id = userId;
    }

    if (queryParams.startDate && queryParams.endDate) {
      where.created_at = {
        [Op.between]: [new Date(queryParams.startDate), new Date(queryParams.endDate)],
      };
    }

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        { model: Content, as: 'content', attributes: ['id', 'content_title', 'content_category'] },
        { model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar', 'status', 'violation_count'] },
      ],
      offset,
      limit: pageSize,
      order,
    });

    const historyViolationUserIds = new Set();
    for (const comment of rows) {
      if (comment.commentUser && (comment.commentUser.violation_count || 0) >= PUNISHMENT_THRESHOLD.MUTE) {
        historyViolationUserIds.add(comment.user_id);
      }
    }

    return {
      list: rows.map((c) => {
        const sources = detectSource(c);
        if (historyViolationUserIds.has(c.user_id) && !sources.includes(AUDIT_SOURCE.HISTORY_VIOLATION)) {
          sources.push(AUDIT_SOURCE.HISTORY_VIOLATION);
        }
        const scan = scanSensitiveKeywords(c.comment_content);
        return {
          taskId: `CMT_TASK-${c.id}`,
          commentId: c.id,
          contentId: c.content_id,
          userId: c.user_id,
          parentId: c.parent_id,
          content: c.comment_content,
          images: c.comment_images,
          likeCount: c.like_count,
          replyCount: c.reply_count,
          isTop: c.is_top,
          isHot: c.is_hot,
          commentStatus: c.comment_status,
          auditStatus: c.audit_status,
          violationLevel: c.violation_level,
          violationType: c.violation_type,
          reportedCount: c.reported_count || 0,
          sources,
          riskScore: scan.totalScore,
          hasSensitive: scan.detected.length > 0,
          auditorId: c.auditor_id,
          auditorName: c.auditor_name,
          auditTime: c.audit_time,
          ipAddress: c.ip_address,
          source: c.source,
          createdAt: c.created_at,
          contentInfo: c.content ? {
            id: c.content.id,
            title: c.content.content_title,
            category: c.content.content_category,
          } : null,
          commentUser: c.commentUser ? {
            id: c.commentUser.id,
            username: c.commentUser.username,
            realName: c.commentUser.real_name,
            avatar: c.commentUser.avatar,
            status: c.commentUser.status,
            violationCount: c.commentUser.violation_count || 0,
          } : null,
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async getDetail(commentId) {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: Content, as: 'content' },
        { model: User, as: 'commentUser' },
      ],
    });
    if (!comment) throw new NotFoundError('评论不存在');

    if (comment.parent_id) {
      const parent = await Comment.findByPk(comment.parent_id, {
        include: [{ model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] }],
      });
      comment.parent = parent;
    }

    let beforeComments = [];
    let afterComments = [];

    if (comment.content_id) {
      beforeComments = await Comment.findAll({
        where: {
          content_id: comment.content_id,
          id: { [Op.lt]: comment.id },
          parent_id: comment.parent_id ? comment.parent_id : { [Op.is]: null },
        },
        include: [{ model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] }],
        order: [['id', 'DESC']],
        limit: 3,
      });
      beforeComments = beforeComments.reverse();

      afterComments = await Comment.findAll({
        where: {
          content_id: comment.content_id,
          id: { [Op.gt]: comment.id },
          parent_id: comment.parent_id ? comment.parent_id : { [Op.is]: null },
        },
        include: [{ model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] }],
        order: [['id', 'ASC']],
        limit: 3,
      });
    }

    const hasContext = beforeComments.length > 0 || afterComments.length > 0;

    const autoScan = scanSensitiveKeywords(comment.comment_content);
    const imageScan = (comment.comment_images || []).length > 0
      ? scanSensitiveKeywords((comment.comment_images || []).join(' '))
      : { detected: [], totalScore: 0, categoryHits: {} };

    const riskDetails = {
      autoDetected: [
        ...autoScan.detected,
        ...imageScan.detected,
      ],
      totalRiskScore: autoScan.totalScore + imageScan.totalScore,
      categoryHits: { ...autoScan.categoryHits, ...imageScan.categoryHits },
      aiViolationLevel: comment.violation_level,
      reportedCount: comment.reported_count || 0,
    };

    return {
      basicInfo: {
        id: comment.id,
        contentId: comment.content_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        replyToUserId: comment.reply_to_user_id,
        content: comment.comment_content,
        images: comment.comment_images,
        likeCount: comment.like_count,
        replyCount: comment.reply_count,
        isTop: comment.is_top,
        isHot: comment.is_hot,
        commentStatus: comment.comment_status,
        auditStatus: comment.audit_status,
        auditRemark: comment.audit_remark,
        auditorId: comment.auditor_id,
        auditTime: comment.audit_time,
        violationLevel: comment.violation_level,
        violationType: comment.violation_type,
        ipAddress: comment.ip_address,
        source: comment.source,
        createdAt: comment.created_at,
      },
      hasContext,
      context: {
        parentComment: comment.parent ? {
          id: comment.parent.id,
          content: comment.parent.comment_content,
          userId: comment.parent.user_id,
          createdAt: comment.parent.created_at,
          commentUser: comment.parent.commentUser ? {
            id: comment.parent.commentUser.id,
            username: comment.parent.commentUser.username,
            realName: comment.parent.commentUser.real_name,
            avatar: comment.parent.commentUser.avatar,
          } : null,
        } : null,
        beforeComments: beforeComments.map((c) => ({
          id: c.id,
          content: c.comment_content,
          userId: c.user_id,
          createdAt: c.created_at,
          commentUser: c.commentUser ? {
            id: c.commentUser.id,
            username: c.commentUser.username,
            realName: c.commentUser.real_name,
            avatar: c.commentUser.avatar,
          } : null,
        })),
        afterComments: afterComments.map((c) => ({
          id: c.id,
          content: c.comment_content,
          userId: c.user_id,
          createdAt: c.created_at,
          commentUser: c.commentUser ? {
            id: c.commentUser.id,
            username: c.commentUser.username,
            realName: c.commentUser.real_name,
            avatar: c.commentUser.avatar,
          } : null,
        })),
      },
      contentInfo: comment.content ? {
        id: comment.content.id,
        title: comment.content.content_title,
        category: comment.content.content_category,
        description: comment.content.content_description,
        coverImage: comment.content.cover_image,
        status: comment.content.status,
      } : null,
      userInfo: comment.commentUser ? {
        id: comment.commentUser.id,
        username: comment.commentUser.username,
        realName: comment.commentUser.real_name,
        avatar: comment.commentUser.avatar,
        status: comment.commentUser.status,
        muted: comment.commentUser.muted || 0,
        muteExpire: comment.commentUser.mute_expire,
        violationCount: comment.commentUser.violation_count || 0,
        flowLimited: comment.commentUser.flow_limited || 0,
        banned: comment.commentUser.status === 0 ? 1 : 0,
        lastViolationType: comment.commentUser.last_violation_type,
        lastViolationAt: comment.commentUser.last_violation_at,
        registerTime: comment.commentUser.created_at,
      } : null,
      riskDetails,
    };
  }

  async checkDuplicate(commentId) {
    const recentLogs = await this.findCommentActionLogs(commentId, {
      operationType: { [Op.in]: [COMMENT_ACTION_LOG_TYPE.AUDIT_SUBMIT, COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE, COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE, COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE] },
      createdAt: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) },
      limit: 5,
    });

    return {
      isDuplicate: recentLogs.length >= 2,
      duplicateCount: recentLogs.length,
      windowMinutes: 5,
      duplicateTaskIds: recentLogs.map((l) => l.extra_data?.auditNo).filter(Boolean),
      recentAuditRecords: recentLogs.map((l) => ({
        auditNo: l.extra_data?.auditNo || '',
        auditorId: l.operator_id,
        auditorName: l.operator_name || '',
        auditTime: l.created_at,
        result: l.extra_data?.actionResult || l.operation_type,
      })),
    };
  }

  async submitAudit(data, auditorId, auditorName) {
    const { commentId, action, violationType, violationRemark, muteDays } = data;
    const comment = await Comment.findByPk(commentId);
    if (!comment) throw new NotFoundError('评论不存在');

    const duplicate = await this.checkDuplicate(commentId);
    if (duplicate.isDuplicate) {
      throw new BadRequestError('检测到重复提交（5分钟内多次审核），请稍后再试或刷新页面');
    }

    const user = await User.findByPk(comment.user_id);
    if (!user) throw new NotFoundError('评论用户不存在');

    let commentStatus = comment.comment_status;
    let auditStatus = comment.audit_status;
    let actionResult = '';
    const now = new Date();
    const auditNo = generateAuditNo();

    const userUpdate = {};
    const punishInfo = {};
    let userViolationCount = user.violation_count || 0;
    let limitFlowTriggered = false;

    switch (action) {
      case 'approve':
        commentStatus = AUDIT_STATUS.NORMAL;
        auditStatus = AUDIT_STATUS.NORMAL;
        actionResult = '审核通过';
        break;

      case 'hide':
        if (!violationType) {
          throw new BadRequestError('屏蔽操作必须选择违规类型');
        }
        if (!violationRemark || violationRemark.trim().length < 5) {
          throw new BadRequestError('请填写违规备注（至少5个字符）');
        }
        if (!VIOLATION_TYPE_CONFIG[violationType]) {
          throw new BadRequestError('无效的违规类型');
        }
        commentStatus = AUDIT_STATUS.HIDDEN;
        auditStatus = AUDIT_STATUS.HIDDEN;
        userViolationCount++;
        userUpdate.violation_count = userViolationCount;
        userUpdate.last_violation_type = violationType;
        userUpdate.last_violation_at = now;
        actionResult = '审核屏蔽';
        break;

      case 'delete':
        if (!violationType) {
          throw new BadRequestError('删除操作必须选择违规类型');
        }
        if (!VIOLATION_TYPE_CONFIG[violationType]) {
          throw new BadRequestError('无效的违规类型');
        }
        commentStatus = AUDIT_STATUS.DELETED;
        auditStatus = AUDIT_STATUS.DELETED;
        userViolationCount++;
        userUpdate.violation_count = userViolationCount;
        userUpdate.last_violation_type = violationType;
        userUpdate.last_violation_at = now;
        actionResult = '审核删除';
        break;

      case 'mute':
        if (!violationType) {
          throw new BadRequestError('禁言操作必须选择违规类型');
        }
        if (!VIOLATION_TYPE_CONFIG[violationType]) {
          throw new BadRequestError('无效的违规类型');
        }
        const config = VIOLATION_TYPE_CONFIG[violationType];
        const actualMuteDays = muteDays !== undefined ? Number(muteDays) : config.muteDays;
        commentStatus = AUDIT_STATUS.DELETED;
        auditStatus = AUDIT_STATUS.DELETED;
        userViolationCount++;
        userUpdate.violation_count = userViolationCount;
        userUpdate.last_violation_type = violationType;
        userUpdate.last_violation_at = now;
        userUpdate.muted = 1;
        userUpdate.mute_expire = new Date(Date.now() + actualMuteDays * 24 * 60 * 60 * 1000);
        punishInfo.muteResult = {
          muteDays: actualMuteDays,
          muteExpire: userUpdate.mute_expire,
          violationType,
          violationTypeLabel: config.label,
        };
        actionResult = `禁言${actualMuteDays}天`;
        break;

      default:
        throw new BadRequestError(`不支持的操作类型: ${action}`);
    }

    if (userViolationCount >= PUNISHMENT_THRESHOLD.MUTE && action !== 'mute' && action !== 'approve') {
      if (!userUpdate.muted) {
        const config = violationType ? VIOLATION_TYPE_CONFIG[violationType] : { muteDays: 7, label: '累计违规' };
        userUpdate.muted = 1;
        userUpdate.mute_expire = new Date(Date.now() + config.muteDays * 24 * 60 * 60 * 1000);
        punishInfo.autoMuteResult = {
          triggerThreshold: PUNISHMENT_THRESHOLD.MUTE,
          currentViolationCount: userViolationCount,
          muteDays: config.muteDays,
          muteExpire: userUpdate.mute_expire,
          reason: `累计违规${userViolationCount}次自动触发禁言`,
        };
      }
    }

    if (userViolationCount >= PUNISHMENT_THRESHOLD.LIMIT_FLOW) {
      userUpdate.flow_limited = 1;
      limitFlowTriggered = true;
      punishInfo.autoFlowLimit = {
        triggerThreshold: PUNISHMENT_THRESHOLD.LIMIT_FLOW,
        currentViolationCount: userViolationCount,
        triggeredAt: now,
      };
    }

    if (userViolationCount >= PUNISHMENT_THRESHOLD.BAN) {
      userUpdate.status = 0;
      punishInfo.banResult = {
        triggerThreshold: PUNISHMENT_THRESHOLD.BAN,
        currentViolationCount: userViolationCount,
        bannedAt: now,
        reason: `累计违规${userViolationCount}次自动封号`,
      };
    }

    const commentUpdate = {
      comment_status: commentStatus,
      audit_status: auditStatus,
      audit_remark: violationRemark || (action === 'approve' ? '审核通过' : ''),
      auditor_id: auditorId,
      auditor_name: auditorName,
      audit_time: now,
      violation_type: violationType || comment.violation_type,
    };

    await Comment.update(commentUpdate, { where: { id: commentId } });

    if (Object.keys(userUpdate).length > 0) {
      await User.update(userUpdate, { where: { id: comment.user_id } });
    }

    await this.createCommentActionLog({
      commentId,
      userId: comment.user_id,
      operatorId: auditorId,
      operatorName: auditorName,
      operationType: action === 'approve' ? COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE
        : action === 'hide' ? COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE
        : action === 'delete' ? COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE
        : COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE,
      operationResult: actionResult,
      ipAddress: '',
      extraData: {
        auditNo,
        action,
        violationType,
        violationRemark,
        muteDays: muteDays !== undefined ? Number(muteDays) : undefined,
        previousCommentStatus: comment.comment_status,
        previousAuditStatus: comment.audit_status,
        actionResult,
        userViolationCount,
        punishInfo,
      },
    });

    if (punishInfo.autoMuteResult) {
      await this.createCommentActionLog({
        commentId,
        userId: comment.user_id,
        operatorId: 0,
        operatorName: 'SYSTEM',
        operationType: COMMENT_ACTION_LOG_TYPE.AUTO_MUTE_TRIGGER,
        operationResult: `自动禁言${punishInfo.autoMuteResult.muteDays}天`,
        extraData: punishInfo.autoMuteResult,
      });
    }

    if (punishInfo.autoFlowLimit) {
      await this.createCommentActionLog({
        commentId,
        userId: comment.user_id,
        operatorId: 0,
        operatorName: 'SYSTEM',
        operationType: COMMENT_ACTION_LOG_TYPE.AUTO_FLOW_LIMIT,
        operationResult: '自动触发流量限流',
        extraData: punishInfo.autoFlowLimit,
      });
    }

    await cacheService.invalidatePattern(`comment:*`);
    await cacheService.invalidateContent(comment.content_id);

    return {
      auditNo,
      commentId,
      action,
      actionResult,
      commentStatus,
      auditStatus,
      userViolationCount,
      limitFlowTriggered,
      punishInfo,
    };
  }

  async batchAction(params, operatorId, operatorName) {
    const { action, violationType, startDate, endDate, contentIds, commentIds, timeRange } = params;
    const batchId = generateBatchId();

    const VALID_ACTIONS = ['clean_history', 'approve_compliant', 'mark_suspected'];
    if (!VALID_ACTIONS.includes(action)) {
      throw new BadRequestError(`不支持的批量操作类型，支持: ${VALID_ACTIONS.join(',')}`);
    }

    const where = {};

    if (commentIds && commentIds.length > 0) {
      where.id = { [Op.in]: commentIds.map(Number) };
    }

    if (contentIds && contentIds.length > 0) {
      where.content_id = { [Op.in]: contentIds.map(Number) };
    }

    const actualStart = startDate || (timeRange ? timeRange[0] : null);
    const actualEnd = endDate || (timeRange ? timeRange[1] : null);
    if (actualStart && actualEnd) {
      where.created_at = { [Op.between]: [new Date(actualStart), new Date(actualEnd)] };
    }

    const now = new Date();
    let totalProcessed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    const failedDetails = [];
    const skippedDetails = [];

    batchProgressStore.set(batchId, {
      batchId,
      action,
      status: 'processing',
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      createdAt: now,
      startedAt: now,
    });

    const comments = await Comment.findAll({ where });
    const total = comments.length;
    batchProgressStore.get(batchId).total = total;

    for (const comment of comments) {
      try {
        const commentUpdate = {
          auditor_id: operatorId,
          auditor_name: operatorName,
          audit_time: now,
        };
        let logType = '';
        let logResult = '';
        let extraData = { batchId, action };
        let skipThis = false;

        switch (action) {
          case 'clean_history':
            if (!violationType) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: '缺少违规类型筛选条件' });
              skipThis = true;
              break;
            }
            if (comment.violation_type !== violationType) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: `违规类型不匹配: ${comment.violation_type}` });
              skipThis = true;
              break;
            }
            if (comment.comment_status === AUDIT_STATUS.DELETED) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: '已删除' });
              skipThis = true;
              break;
            }
            commentUpdate.comment_status = AUDIT_STATUS.DELETED;
            commentUpdate.audit_status = AUDIT_STATUS.DELETED;
            commentUpdate.violation_type = violationType;
            commentUpdate.audit_remark = `批量清理(${violationType})`;
            logType = COMMENT_ACTION_LOG_TYPE.BATCH_CLEAN;
            logResult = `批量清理: ${violationType}`;
            extraData.violationType = violationType;
            break;

          case 'approve_compliant':
            if (comment.violation_level && comment.violation_level >= 3) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: '高危违规评论，不可快速通过' });
              skipThis = true;
              break;
            }
            if (comment.audit_status === AUDIT_STATUS.NORMAL || comment.audit_status === AUDIT_STATUS.DELETED) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: '非待审核状态' });
              skipThis = true;
              break;
            }
            commentUpdate.comment_status = AUDIT_STATUS.NORMAL;
            commentUpdate.audit_status = AUDIT_STATUS.NORMAL;
            commentUpdate.audit_remark = '批量合规审核通过';
            logType = COMMENT_ACTION_LOG_TYPE.BATCH_APPROVE;
            logResult = '批量审核通过';
            break;

          case 'mark_suspected':
            if (!comment.violation_level || comment.violation_level !== 1) {
              skipped++;
              skippedDetails.push({ id: comment.id, reason: `违规等级非1级: ${comment.violation_level}` });
              skipThis = true;
              break;
            }
            commentUpdate.violation_level = 2;
            commentUpdate.audit_remark = comment.audit_remark || '批量标记疑似违规(升级为2级)';
            logType = COMMENT_ACTION_LOG_TYPE.BATCH_MARK;
            logResult = '标记疑似违规等级2';
            break;
        }

        if (skipThis) {
          totalProcessed++;
          batchProgressStore.get(batchId).processed = totalProcessed;
          batchProgressStore.get(batchId).skipped = skipped;
          continue;
        }

        await Comment.update(commentUpdate, { where: { id: comment.id } });

        await this.createCommentActionLog({
          commentId: comment.id,
          userId: comment.user_id,
          operatorId,
          operatorName,
          operationType: logType,
          operationResult: logResult,
          extraData,
        });

        await cacheService.invalidatePattern(`comment:${comment.id}`);
        success++;
        totalProcessed++;
        batchProgressStore.get(batchId).processed = totalProcessed;
        batchProgressStore.get(batchId).success = success;
      } catch (err) {
        failed++;
        totalProcessed++;
        failedDetails.push({ id: comment.id, error: err.message });
        batchProgressStore.get(batchId).processed = totalProcessed;
        batchProgressStore.get(batchId).failed = failed;
      }
    }

    const progress = batchProgressStore.get(batchId);
    progress.status = 'completed';
    progress.completedAt = new Date();
    progress.failedDetails = failedDetails;
    progress.skippedDetails = skippedDetails;

    return {
      batchId,
      action,
      totalProcessed,
      success,
      failed,
      skipped,
      failedDetails: failedDetails.slice(0, 50),
      skippedDetails: skippedDetails.slice(0, 50),
    };
  }

  async getBatchProgress(batchId) {
    const progress = batchProgressStore.get(batchId);
    if (!progress) {
      throw new NotFoundError('批量任务不存在或已过期');
    }
    return { ...progress };
  }

  async refreshPartial(commentIds) {
    if (!commentIds || commentIds.length === 0) {
      throw new BadRequestError('请指定要刷新的评论ID列表');
    }
    const ids = commentIds.map(Number);
    const comments = await Comment.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        { model: Content, as: 'content', attributes: ['id', 'content_title', 'content_category'] },
        { model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar', 'status', 'violation_count'] },
      ],
    });
    return comments.map((c) => {
      const sources = detectSource(c);
      const scan = scanSensitiveKeywords(c.comment_content);
      return {
        taskId: `CMT_TASK-${c.id}`,
        commentId: c.id,
        contentId: c.content_id,
        userId: c.user_id,
        content: c.comment_content,
        likeCount: c.like_count,
        replyCount: c.reply_count,
        commentStatus: c.comment_status,
        auditStatus: c.audit_status,
        violationLevel: c.violation_level,
        violationType: c.violation_type,
        reportedCount: c.reported_count || 0,
        sources,
        riskScore: scan.totalScore,
        hasSensitive: scan.detected.length > 0,
        auditorId: c.auditor_id,
        auditorName: c.auditor_name,
        auditTime: c.audit_time,
        createdAt: c.created_at,
        contentInfo: c.content ? {
          id: c.content.id,
          title: c.content.content_title,
          category: c.content.content_category,
        } : null,
        commentUser: c.commentUser ? {
          id: c.commentUser.id,
          username: c.commentUser.username,
          realName: c.commentUser.real_name,
          avatar: c.commentUser.avatar,
          status: c.commentUser.status,
          violationCount: c.commentUser.violation_count || 0,
        } : null,
      };
    });
  }

  async getTraceRecord(commentId) {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: User, as: 'commentUser' },
      ],
    });
    if (!comment) throw new NotFoundError('评论不存在');

    const actionLogs = await this.findCommentActionLogs(commentId, {
      order: [['created_at', 'ASC']],
      limit: 100,
    });

    const userPunishmentChain = [];
    if (comment.user_id) {
      const allUserLogs = await this.findAllCommentActionLogsByUser(comment.user_id, {
        operationType: {
          [Op.in]: [COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE, COMMENT_ACTION_LOG_TYPE.AUTO_MUTE_TRIGGER, COMMENT_ACTION_LOG_TYPE.AUTO_FLOW_LIMIT],
        },
        order: [['created_at', 'DESC']],
        limit: 20,
      });
      for (const log of allUserLogs) {
        userPunishmentChain.push({
          id: log.id,
          time: log.created_at,
          type: log.operation_type,
          result: log.operation_result,
          commentId: log.comment_id,
          operator: log.operator_name,
          detail: log.extra_data,
        });
      }
    }

    const auditConsistency = await this.calculateAuditConsistency(comment.violation_type, actionLogs);

    const exceptions = [];
    const fiveMinDuplicates = [];
    for (let i = 0; i < actionLogs.length; i++) {
      for (let j = i + 1; j < actionLogs.length; j++) {
        const diff = (new Date(actionLogs[j].created_at) - new Date(actionLogs[i].created_at)) / 60000;
        if (diff <= 5 && diff > 0) {
          fiveMinDuplicates.push({
            first: {
              time: actionLogs[i].created_at,
              operator: actionLogs[i].operator_name,
              type: actionLogs[i].operation_type,
              result: actionLogs[i].operation_result,
            },
            second: {
              time: actionLogs[j].created_at,
              operator: actionLogs[j].operator_name,
              type: actionLogs[j].operation_type,
              result: actionLogs[j].operation_result,
            },
            intervalMinutes: Math.round(diff * 10) / 10,
          });
        }
      }
    }
    if (fiveMinDuplicates.length > 0) {
      exceptions.push({
        type: 'duplicate_audit',
        typeLabel: '重复审核',
        severity: 'warning',
        count: fiveMinDuplicates.length,
        description: `检测到${fiveMinDuplicates.length}次5分钟内重复审核`,
        details: fiveMinDuplicates,
      });
    }

    const highRiskPassed = actionLogs.filter(
      (l) =>
        l.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE &&
        comment.violation_level >= 3
    );
    if (highRiskPassed.length > 0) {
      exceptions.push({
        type: 'high_risk_passed',
        typeLabel: '高风险放行',
        severity: 'high',
        count: highRiskPassed.length,
        description: `${highRiskPassed.length}次高风险评论被放行，建议重点复核`,
        details: highRiskPassed.map((l) => ({
          time: l.created_at,
          operator: l.operator_name,
          riskLevel: comment.violation_level,
        })),
      });
    }

    const statusMismatches = [];
    for (const log of actionLogs) {
      const et = log.extra_data || {};
      if (et.previousAuditStatus !== undefined && et.previousAuditStatus === comment.audit_status) {
        if (comment.audit_status === AUDIT_STATUS.NORMAL && log.operation_type !== COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE) {
          statusMismatches.push({
            time: log.created_at,
            operator: log.operator_name,
            logType: log.operation_type,
            expectedStatus: '已通过',
            actualStatus: comment.audit_status,
          });
        }
      }
    }
    if (statusMismatches.length > 0) {
      exceptions.push({
        type: 'status_mismatch',
        typeLabel: '结果不匹配',
        severity: 'warning',
        count: statusMismatches.length,
        description: `审核日志与最终状态不一致`,
        details: statusMismatches,
      });
    }

    return {
      commentId: comment.id,
      contentId: comment.content_id,
      userId: comment.user_id,
      content: comment.comment_content,
      currentCommentStatus: comment.comment_status,
      currentAuditStatus: comment.audit_status,
      currentViolationLevel: comment.violation_level,
      currentViolationType: comment.violation_type,
      actionLogs: actionLogs.map((l) => ({
        id: l.id,
        time: l.created_at,
        type: l.operation_type,
        result: l.operation_result,
        operatorId: l.operator_id,
        operatorName: l.operator_name,
        detail: l.extra_data,
      })),
      userPunishmentChain,
      auditConsistency,
      exceptions,
      userInfo: comment.commentUser ? {
        id: comment.commentUser.id,
        username: comment.commentUser.username,
        realName: comment.commentUser.real_name,
        violationCount: comment.commentUser.violation_count || 0,
        muted: comment.commentUser.muted || 0,
        muteExpire: comment.commentUser.mute_expire,
      } : null,
    };
  }

  async calculateAuditConsistency(violationType, actionLogs) {
    if (!violationType) {
      return {
        hasData: false,
        message: '未设置违规类型，无法对比一致性',
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sameTypeLogs = await this.findAllCommentActionLogs({
      operation_type: { [Op.in]: [COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE, COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE, COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE, COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE] },
      created_at: { [Op.gte]: thirtyDaysAgo },
    });

    const sameViolationTypeLogs = sameTypeLogs.filter((l) => l.extra_data?.violationType === violationType);

    if (sameViolationTypeLogs.length === 0) {
      return {
        hasData: false,
        message: '近30天无同类型违规审核记录',
      };
    }

    const actionCounts = {};
    const auditorDist = {};
    for (const l of sameViolationTypeLogs) {
      const action = l.operation_type;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
      const auditor = l.operator_name || '未知';
      auditorDist[auditor] = auditorDist[auditor] || { total: 0, approve: 0, punish: 0 };
      auditorDist[auditor].total++;
      if (action === COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE) auditorDist[auditor].approve++;
      else auditorDist[auditor].punish++;
    }

    const total = sameViolationTypeLogs.length;
    const approveCount = actionCounts[COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE] || 0;
    const punishCount = total - approveCount;
    const overallPunishRate = total > 0 ? (punishCount / total) * 100 : 0;

    const anomalousAuditors = [];
    for (const [name, dist] of Object.entries(auditorDist)) {
      if (dist.total >= 5) {
        const auditorPunishRate = (dist.punish / dist.total) * 100;
        const diff = Math.abs(auditorPunishRate - overallPunishRate);
        if (diff > 15) {
          anomalousAuditors.push({
            auditor: name,
            total: dist.total,
            punishRate: Math.round(auditorPunishRate * 100) / 100,
            overallRate: Math.round(overallPunishRate * 100) / 100,
            deviation: Math.round(diff * 100) / 100,
            direction: auditorPunishRate > overallPunishRate ? '偏严' : '偏松',
          });
        }
      }
    }

    const currentAuditorDeviation = {};
    for (const l of actionLogs) {
      if (l.operator_name && auditorDist[l.operator_name]) {
        const dist = auditorDist[l.operator_name];
        if (dist.total >= 5) {
          const auditorPunishRate = (dist.punish / dist.total) * 100;
          const diff = Math.abs(auditorPunishRate - overallPunishRate);
          currentAuditorDeviation[l.operator_name] = {
            punishRate: Math.round(auditorPunishRate * 100) / 100,
            overallRate: Math.round(overallPunishRate * 100) / 100,
            deviation: Math.round(diff * 100) / 100,
            anomalous: diff > 15,
          };
        }
      }
    }

    return {
      hasData: true,
      violationType,
      sampleSize: total,
      overallPunishRate: Math.round(overallPunishRate * 100) / 100,
      approveCount,
      punishCount,
      anomalousAuditors,
      currentAuditorDeviation,
      threshold: 15,
      isAnomalous: anomalousAuditors.length > 0,
    };
  }

  async checkPunishmentConsistency(violationType, action, muteDays) {
    if (!violationType) {
      throw new BadRequestError('请提供违规类型');
    }
    const config = VIOLATION_TYPE_CONFIG[violationType];
    if (!config) {
      throw new BadRequestError('无效的违规类型');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const allLogs = await this.findAllCommentActionLogs({
      operation_type: { [Op.in]: [COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE, COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE, COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE] },
      created_at: { [Op.gte]: thirtyDaysAgo },
    });

    const sameTypeLogs = allLogs.filter((l) => l.extra_data?.violationType === violationType);

    if (sameTypeLogs.length === 0) {
      return {
        hasData: false,
        violationType,
        violationTypeLabel: config.label,
        standardAction: config.level === 'extreme' || config.level === 'severe' ? 'mute' : action || 'delete',
        standardMuteDays: config.muteDays,
        deviation: 0,
        reasons: ['近30天无同类型违规审核历史，使用默认标准'],
        suggestions: [`建议按标准处理：${config.level === 'extreme' || config.level === 'severe' ? `禁言${config.muteDays}天` : '删除并记录违规'}`],
      };
    }

    const actionMap = {
      [COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE]: 'hide',
      [COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE]: 'delete',
      [COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE]: 'mute',
    };

    const actionDist = {};
    const muteDaysList = [];
    for (const l of sameTypeLogs) {
      const act = actionMap[l.operation_type];
      if (act) {
        actionDist[act] = (actionDist[act] || 0) + 1;
        if (act === 'mute' && l.extra_data?.muteDays) {
          muteDaysList.push(Number(l.extra_data.muteDays));
        }
      }
    }

    const total = sameTypeLogs.length;
    let standardAction = 'delete';
    let maxCount = 0;
    for (const [act, count] of Object.entries(actionDist)) {
      if (count > maxCount) {
        maxCount = count;
        standardAction = act;
      }
    }

    const standardMuteDays = muteDaysList.length > 0
      ? Math.round(muteDaysList.reduce((a, b) => a + b, 0) / muteDaysList.length)
      : config.muteDays;

    const reasons = [];
    const suggestions = [];
    let deviation = 0;

    if (action) {
      const currentActionPct = total > 0 ? ((actionDist[action] || 0) / total) * 100 : 0;
      const standardActionPct = total > 0 ? (maxCount / total) * 100 : 0;
      if (action !== standardAction) {
        deviation = Math.round(Math.abs(standardActionPct - currentActionPct) * 100) / 100;
        reasons.push(`当前选择「${action}」与近30天主流处理「${standardAction}」不一致，偏离率约${deviation}%`);
        suggestions.push(`建议采用主流处理方式：${standardAction}`);
      }
    }

    if (action === 'mute' && muteDays !== undefined) {
      const actualMuteDays = Number(muteDays);
      const diff = Math.abs(actualMuteDays - standardMuteDays);
      if (diff > 0) {
        const dev2 = standardMuteDays > 0 ? Math.round((diff / standardMuteDays) * 10000) / 100 : 0;
        deviation = Math.max(deviation, dev2);
        reasons.push(`当前禁言天数${actualMuteDays}与近30天平均值${standardMuteDays}天偏差${dev2}%`);
        suggestions.push(`建议禁言天数：${standardMuteDays}天（参考违规类型标准：${config.muteDays}天）`);
      }
    }

    return {
      hasData: true,
      violationType,
      violationTypeLabel: config.label,
      standardLevel: config.level,
      standardAction,
      standardMuteDays,
      defaultMuteDays: config.muteDays,
      defaultFlowLimit: config.flowLimit,
      sampleSize: total,
      actionDistribution: actionDist,
      muteDaysAverage: standardMuteDays,
      muteDaysMin: muteDaysList.length > 0 ? Math.min(...muteDaysList) : config.muteDays,
      muteDaysMax: muteDaysList.length > 0 ? Math.max(...muteDaysList) : config.muteDays,
      deviation,
      deviationReasons: reasons,
      suggestions,
    };
  }

  async getQCReport(params) {
    const { period = 'week', startDate, endDate, auditorId, violationType } = params;
    const now = new Date();
    let from, to;

    if (startDate && endDate) {
      from = new Date(startDate);
      to = new Date(endDate);
    } else if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = now;
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = now;
    } else {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = now;
    }

    const logs = await this.findAllCommentActionLogs({
      operation_type: {
        [Op.in]: [
          COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE,
          COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE,
          COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE,
          COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE,
          COMMENT_ACTION_LOG_TYPE.BATCH_APPROVE,
          COMMENT_ACTION_LOG_TYPE.BATCH_CLEAN,
          COMMENT_ACTION_LOG_TYPE.BATCH_MARK,
        ],
      },
      created_at: { [Op.between]: [from, to] },
    });

    let filteredLogs = logs;
    if (auditorId) {
      filteredLogs = logs.filter((l) => l.operator_id === Number(auditorId));
    }
    if (violationType) {
      filteredLogs = filteredLogs.filter((l) => l.extra_data?.violationType === violationType);
    }

    const totalAudited = filteredLogs.length;
    const approved = filteredLogs.filter((l) =>
      l.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE || l.operation_type === COMMENT_ACTION_LOG_TYPE.BATCH_APPROVE
    ).length;
    const punished = filteredLogs.filter((l) =>
      [COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE, COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE, COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE, COMMENT_ACTION_LOG_TYPE.BATCH_CLEAN].includes(l.operation_type)
    ).length;
    const muted = filteredLogs.filter((l) => l.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE).length;
    const passRate = totalAudited > 0 ? Math.round((approved / totalAudited) * 100) : 0;

    const auditorMap = {};
    const exceptions = [];
    const commentLogMap = {};

    for (const log of filteredLogs) {
      const aid = log.operator_id || 0;
      if (!auditorMap[aid]) {
        auditorMap[aid] = {
          auditorId: aid,
          auditorName: log.operator_name || '未知',
          totalCount: 0,
          approvedCount: 0,
          punishedCount: 0,
          mutedCount: 0,
          exceptionCount: 0,
        };
      }
      auditorMap[aid].totalCount++;
      if (log.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE || log.operation_type === COMMENT_ACTION_LOG_TYPE.BATCH_APPROVE) {
        auditorMap[aid].approvedCount++;
      }
      if ([COMMENT_ACTION_LOG_TYPE.AUDIT_HIDE, COMMENT_ACTION_LOG_TYPE.AUDIT_DELETE, COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE, COMMENT_ACTION_LOG_TYPE.BATCH_CLEAN].includes(log.operation_type)) {
        auditorMap[aid].punishedCount++;
      }
      if (log.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_MUTE) {
        auditorMap[aid].mutedCount++;
      }

      if (!commentLogMap[log.comment_id]) commentLogMap[log.comment_id] = [];
      commentLogMap[log.comment_id].push(log);
    }

    for (const [cid, clog] of Object.entries(commentLogMap)) {
      if (clog.length >= 3) {
        const lastThree = clog.slice(-3);
        if (lastThree.every((x) => x.operation_type === COMMENT_ACTION_LOG_TYPE.AUDIT_APPROVE && x.operator_id === clog[0].operator_id)) {
          const last = lastThree[lastThree.length - 1];
          exceptions.push({
            id: exceptions.length + 1,
            type: 'repeat_approval',
            typeLabel: '重复通过异常',
            severity: 'warning',
            commentId: Number(cid),
            auditNo: last.extra_data?.auditNo || '',
            auditorId: last.operator_id,
            auditorName: last.operator_name,
            description: '该评论短时间内多次通过审核，疑似操作过快',
            suggestedAction: '建议人工复核',
            status: 0,
            createdAt: last.created_at,
          });
          if (auditorMap[last.operator_id]) auditorMap[last.operator_id].exceptionCount++;
        }
      }

      for (let i = 1; i < clog.length; i++) {
        const prev = clog[i - 1];
        const curr = clog[i];
        const timeDiff = (new Date(curr.created_at) - new Date(prev.created_at)) / 1000;
        if (timeDiff < 3 && curr.operation_type !== COMMENT_ACTION_LOG_TYPE.BATCH_APPROVE) {
          exceptions.push({
            id: exceptions.length + 1,
            type: 'duplicate_submit',
            typeLabel: '重复提交',
            severity: 'info',
            commentId: Number(cid),
            auditNo: curr.extra_data?.auditNo || '',
            auditorId: curr.operator_id,
            auditorName: curr.operator_name,
            description: `两次审核间隔仅${timeDiff.toFixed(1)}秒`,
            suggestedAction: '检查是否误操作',
            status: 0,
            createdAt: curr.created_at,
          });
          if (auditorMap[curr.operator_id]) auditorMap[curr.operator_id].exceptionCount++;
        }
      }
    }

    const auditorStats = Object.values(auditorMap).map((a) => {
      const approvalRate = a.totalCount > 0 ? Math.round((a.approvedCount / a.totalCount) * 100) : 0;
      const efficiencyScore = Math.max(0, 100 - a.exceptionCount * 8 - Math.abs(approvalRate - 60) * 0.5);
      return {
        auditorId: a.auditorId,
        auditorName: a.auditorName,
        totalCount: a.totalCount,
        approvedCount: a.approvedCount,
        punishedCount: a.punishedCount,
        mutedCount: a.mutedCount,
        exceptionCount: a.exceptionCount,
        approvalRate,
        efficiencyScore: Math.round(efficiencyScore),
      };
    });

    const violationTypeDist = {};
    for (const log of filteredLogs) {
      const vt = log.extra_data?.violationType;
      if (vt) {
        violationTypeDist[vt] = (violationTypeDist[vt] || 0) + 1;
      }
    }

    const exceptionCount = exceptions.length;
    const exceptionRate = totalAudited > 0 ? +((exceptionCount / totalAudited) * 100).toFixed(2) : 0;

    const summary = {
      strengths: [
        exceptionRate < 5 ? '异常率低于5%，整体审核质量良好' : '审核覆盖面完整',
        auditorStats.some((a) => a.efficiencyScore >= 80) ? '多位审核员效率评分优秀' : '团队协作顺畅',
      ].filter(Boolean),
      weaknesses: [
        exceptionCount > 0 ? `共发现${exceptionCount}项审核异常需关注` : '暂未发现明显问题',
      ].filter(Boolean),
      suggestions: [
        '建议每周开展评论审核标准培训',
        '高风险违规评论执行重点复核机制',
        '建立典型违规案例库，提升团队识别能力',
      ],
    };

    return {
      id: 1,
      reportNo: `QR-CMT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
      reportDate: now.toISOString(),
      period: period === 'week' ? '近7天' : period === 'month' ? '近30天' : period === 'today' ? '今日' : '自定义',
      dateRange: { start: from, end: to },
      filters: { auditorId, violationType },
      totalAudited,
      approved,
      punished,
      muted,
      passRate,
      exceptionCount,
      exceptionRate,
      violationTypeDistribution: violationTypeDist,
      auditorStats,
      exceptionList: exceptions,
      summary,
    };
  }

  async createCommentActionLog(data) {
    try {
      if (!ContentStatusLog || typeof ContentStatusLog.create !== 'function') {
        return { id: Date.now(), ...data };
      }
      const log = await ContentStatusLog.create({
        content_id: data.commentId || 0,
        from_status: 0,
        to_status: 0,
        operator_id: data.operatorId,
        operator_name: data.operatorName || 'SYSTEM',
        change_reason: data.operationResult || '',
        remark: '',
        operation_type: data.operationType || 'COMMENT_AUDIT',
        ip_address: data.ipAddress || '',
        extra_data: {
          module: 'comment_audit',
          commentId: data.commentId,
          userId: data.userId,
          ...data.extraData,
        },
      });
      return log;
    } catch (e) {
      return { id: Date.now(), error: e.message };
    }
  }

  async findCommentActionLogs(commentId, options = {}) {
    try {
      if (!ContentStatusLog || typeof ContentStatusLog.findAll !== 'function') {
        return [];
      }
      const where = {
        content_id: commentId,
        ...(options.operationType ? { operation_type: options.operationType } : {}),
        ...(options.createdAt ? { created_at: options.createdAt } : {}),
      };
      where['extra_data.module'] = { [Op.eq]: null };
      const logs = await ContentStatusLog.findAll({
        where,
        order: options.order || [['created_at', 'DESC']],
        limit: options.limit || 50,
      });
      return logs
        .filter((l) => l.extra_data?.module === 'comment_audit')
        .map((l) => ({
          id: l.id,
          comment_id: l.extra_data?.commentId || l.content_id,
          user_id: l.extra_data?.userId,
          operator_id: l.operator_id,
          operator_name: l.operator_name,
          operation_type: l.operation_type,
          operation_result: l.change_reason,
          created_at: l.created_at,
          extra_data: l.extra_data || {},
        }));
    } catch (e) {
      return [];
    }
  }

  async findAllCommentActionLogs(where = {}) {
    try {
      if (!ContentStatusLog || typeof ContentStatusLog.findAll !== 'function') {
        return [];
      }
      const logs = await ContentStatusLog.findAll({
        where: {
          ...where,
        },
        order: [['created_at', 'ASC']],
        limit: 1000,
      });
      return logs
        .filter((l) => l.extra_data?.module === 'comment_audit')
        .map((l) => ({
          id: l.id,
          comment_id: l.extra_data?.commentId || l.content_id,
          user_id: l.extra_data?.userId,
          operator_id: l.operator_id,
          operator_name: l.operator_name,
          operation_type: l.operation_type,
          operation_result: l.change_reason,
          created_at: l.created_at,
          extra_data: l.extra_data || {},
        }));
    } catch (e) {
      return [];
    }
  }

  async findAllCommentActionLogsByUser(userId, options = {}) {
    try {
      if (!ContentStatusLog || typeof ContentStatusLog.findAll !== 'function') {
        return [];
      }
      const logs = await ContentStatusLog.findAll({
        where: {
          ...(options.operationType ? { operation_type: options.operationType } : {}),
          ...(options.createdAt ? { created_at: options.createdAt } : {}),
        },
        order: options.order || [['created_at', 'DESC']],
        limit: options.limit || 100,
      });
      return logs
        .filter((l) => l.extra_data?.module === 'comment_audit' && l.extra_data?.userId === userId)
        .map((l) => ({
          id: l.id,
          comment_id: l.extra_data?.commentId || l.content_id,
          user_id: l.extra_data?.userId,
          operator_id: l.operator_id,
          operator_name: l.operator_name,
          operation_type: l.operation_type,
          operation_result: l.change_reason,
          created_at: l.created_at,
          extra_data: l.extra_data || {},
        }));
    } catch (e) {
      return [];
    }
  }

  getAuditConstants() {
    return {
      AUDIT_STATUS,
      AUDIT_SOURCE,
      SENSITIVE_KEYWORDS: Object.keys(SENSITIVE_KEYWORDS).reduce((acc, key) => {
        acc[key] = { level: SENSITIVE_KEYWORDS[key].level, words: SENSITIVE_KEYWORDS[key].words.map(w => ({ word: w.word, weight: w.weight })) };
        return acc;
      }, {}),
      VIOLATION_TYPE_CONFIG,
      PUNISHMENT_THRESHOLD,
    };
  }
}

module.exports = new CommentAuditService();