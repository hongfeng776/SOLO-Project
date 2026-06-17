const { Content, Copyright, User, ContentStatusLog } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');
const cacheService = require('./CacheService');

const ASSIGN_RULES = [
  {
    id: 1,
    name: '短视频-低风险-初审',
    category: 6,
    maxDuration: 300,
    riskLevel: 1,
    reviewLevel: 1,
    priority: 10,
    department: 'content_audit_group_1',
  },
  {
    id: 2,
    name: '长视频-中风险-初审',
    minDuration: 300,
    riskLevel: 2,
    reviewLevel: 1,
    priority: 8,
    department: 'content_audit_group_2',
  },
  {
    id: 3,
    name: '高风险-复审',
    riskLevel: 3,
    reviewLevel: 2,
    priority: 5,
    department: 'content_audit_senior',
  },
  {
    id: 4,
    name: '极高风险-终审',
    riskLevel: 4,
    reviewLevel: 3,
    priority: 1,
    department: 'content_audit_leadership',
  },
  {
    id: 5,
    name: '电影/电视剧-专项审核',
    categories: [1, 2],
    reviewLevel: 1,
    priority: 6,
    department: 'content_audit_film_tv',
  },
];

const RISK_ASSESS_RULES = {
  SENSITIVE_KEYWORDS: ['政治', '暴力', '色情', '赌博', '毒品'],
  CATEGORY_WEIGHT: { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 3 },
  DURATION_WEIGHT_THRESHOLDS: [
    { max: 60, weight: 1 },
    { max: 300, weight: 2 },
    { max: 3600, weight: 3 },
    { max: Infinity, weight: 4 },
  ],
};

const REJECT_REASON_TEMPLATES = [
  { value: 'copyright', label: '版权问题', examples: ['无版权证明文件', '版权授权已过期', '版权归属不清晰', '授权范围不包含本平台'] },
  { value: 'quality', label: '内容质量', examples: ['画面清晰度不达标', '音画不同步严重', '视频存在卡顿/花屏', '片头片尾过长'] },
  { value: 'policy', label: '违规内容', examples: ['包含敏感政治内容', '含暴力血腥画面', '涉黄涉低俗内容', '含虚假广告营销'] },
  { value: 'metadata', label: '信息错误', examples: ['标题与内容不符', '分类标签错误', '简介描述不准确', '演员/导演信息错误'] },
  { value: 'other', label: '其他原因', examples: [] },
];

function generateAuditNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AD${y}${m}${d}${rand}`;
}

function assessRiskLevel(content) {
  let score = 0;
  const riskTags = [];
  const autoDetectedIssues = [];

  const catWeight = RISK_ASSESS_RULES.CATEGORY_WEIGHT[content.content_category] || 1;
  score += catWeight * 10;
  if (catWeight >= 3) riskTags.push('敏感品类');

  const duration = content.duration || 0;
  const durRule = RISK_ASSESS_RULES.DURATION_WEIGHT_THRESHOLDS.find(
    (r) => duration <= r.max
  );
  if (durRule) {
    score += durRule.weight * 5;
    if (durRule.weight >= 3) riskTags.push('长视频');
  }

  const textToCheck = [content.content_title, content.content_description, content.tags?.join(' ') || '']
    .filter(Boolean)
    .join(' ');
  for (const keyword of RISK_ASSESS_RULES.SENSITIVE_KEYWORDS) {
    if (textToCheck.includes(keyword)) {
      score += 25;
      riskTags.push(`含关键词:${keyword}`);
      autoDetectedIssues.push(`检测到敏感关键词「${keyword}」`);
    }
  }

  if (!content.copyright_id) {
    score += 15;
    riskTags.push('无版权关联');
    autoDetectedIssues.push('内容未关联有效版权信息');
  }

  let riskLevel = 1;
  if (score >= 70) riskLevel = 4;
  else if (score >= 45) riskLevel = 3;
  else if (score >= 25) riskLevel = 2;

  return {
    riskLevel,
    riskScore: score,
    riskTags,
    autoDetectedIssues,
    requiresMultiLevelReview: riskLevel >= 3,
    reviewLevel: riskLevel >= 4 ? 3 : riskLevel >= 3 ? 2 : 1,
  };
}

function matchAssignRule(content, riskInfo) {
  const matchingRules = ASSIGN_RULES.filter((rule) => {
    if (rule.category && content.content_category !== rule.category) return false;
    if (rule.categories && !rule.categories.includes(content.content_category)) return false;
    if (rule.riskLevel && riskInfo.riskLevel < rule.riskLevel) return false;
    if (rule.minDuration && (content.duration || 0) < rule.minDuration) return false;
    if (rule.maxDuration && (content.duration || 0) > rule.maxDuration) return false;
    return true;
  });

  if (matchingRules.length === 0) return ASSIGN_RULES[0];
  matchingRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return matchingRules[0];
}

function checkCompleteness(content, copyright) {
  const missingFields = [];
  const required = {
    title: !content.content_title,
    category: !content.content_category,
    coverImage: !content.cover_image,
    videoUrl: !content.video_url,
    duration: !content.duration,
    description: !content.content_description,
  };

  for (const [key, isMissing] of Object.entries(required)) {
    if (isMissing) missingFields.push(key);
  }

  const copyrightMissing = [];
  if (content.copyright_id) {
    if (!copyright) {
      copyrightMissing.push('copyright_record');
    } else {
      if (!copyright.copyright_name) copyrightMissing.push('copyright_name');
      if (!copyright.start_date) copyrightMissing.push('copyright_start_date');
      if (!copyright.end_date) copyrightMissing.push('copyright_end_date');
    }
  } else {
    copyrightMissing.push('copyright_id');
  }

  return {
    isComplete: missingFields.length === 0 && copyrightMissing.length === 0,
    missingFields,
    copyrightMissing,
    canStartAudit: missingFields.length === 0,
  };
}

class AuditService {
  async getAuditDetail(contentId) {
    const content = await Content.findByPk(contentId, {
      include: [{ model: Copyright, as: 'copyright' }],
    });
    if (!content) throw new NotFoundError('内容不存在');

    const riskInfo = assessRiskLevel(content);
    const assignRule = matchAssignRule(content, riskInfo);
    const completeness = checkCompleteness(content, content.copyright);

    const statusLogs = await ContentStatusLog.findAll({
      where: { content_id: contentId },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const reviewHistory = statusLogs
      .filter((log) => log.operation_type === 'AUDIT' || log.operation_type === 'MANUAL')
      .map((log) => ({
        id: log.id,
        auditNo: log.extra_data?.auditNo || '',
        contentId: log.content_id,
        reviewLevel: log.extra_data?.reviewLevel || 1,
        auditStatus: log.to_status,
        auditRemark: log.remark,
        rejectReasonCategory: log.extra_data?.rejectReasonCategory,
        rejectReasonDetail: log.extra_data?.rejectReasonDetail,
        auditorId: log.operator_id,
        auditorName: log.operator_name,
        auditTime: log.created_at,
        fromStatus: log.from_status,
        toStatus: log.to_status,
      }));

    return {
      basicInfo: {
        id: content.id,
        title: content.content_title,
        category: content.content_category,
        coverImage: content.cover_image,
        videoUrl: content.video_url,
        duration: content.duration,
        description: content.content_description,
        director: content.director,
        actors: content.actors,
        releaseYear: content.release_year,
        area: content.area,
        language: content.language,
        tags: content.tags || [],
        totalEpisodes: content.total_episodes || 1,
        updatedEpisodes: content.updated_episodes || 0,
        resolution: content.resolution,
        clarityLevel: content.clarity_level,
        fileSize: content.file_size,
        bitrate: content.bitrate,
        frameRate: content.frame_rate,
        videoFormat: content.video_format,
      },
      copyrightInfo: {
        exists: !!content.copyright,
        id: content.copyright?.id,
        code: content.copyright?.copyright_code,
        name: content.copyright?.copyright_name,
        type: content.copyright?.copyright_type,
        supplierName: content.copyright?.supplier_name,
        startDate: content.copyright?.start_date,
        endDate: content.copyright?.end_date,
        status: content.copyright?.status,
        missingFields: completeness.copyrightMissing,
      },
      riskInfo,
      assignInfo: {
        taskId: `TASK-${content.id}`,
        priority: content.priority || 0,
        assignedAt: content.audit_assigned_at,
        deadline: content.audit_deadline,
        currentReviewer: content.auditor_id
          ? {
              id: content.auditor_id,
              name: content.auditor_name,
              department: assignRule.department,
            }
          : null,
        reviewHistory,
      },
      completeness: {
        isComplete: completeness.isComplete,
        missingFields: [...completeness.missingFields, ...completeness.copyrightMissing],
        canStartAudit: completeness.canStartAudit,
      },
    };
  }

  async previewAssign(contentId) {
    const content = await Content.findByPk(contentId);
    if (!content) throw new NotFoundError('内容不存在');

    const riskInfo = assessRiskLevel(content);
    const rule = matchAssignRule(content, riskInfo);

    const reviewers = await User.findAll({
      where: { status: 1, department: rule.department },
      limit: 5,
    });

    if (reviewers.length === 0) {
      const anyAuditor = await User.findOne({ where: { status: 1 } });
      if (!anyAuditor) throw new NotFoundError('系统中无可用审核人员');
      return {
        reviewerId: anyAuditor.id,
        reviewerName: anyAuditor.real_name || anyAuditor.username,
        reviewerRole: '默认分配',
        department: 'default',
        matchScore: 50,
        matchReasons: ['无匹配规则审核员，使用默认分配'],
        currentWorkload: 0,
        avgHandleTime: 0,
      };
    }

    const selected = reviewers[0];
    return {
      reviewerId: selected.id,
      reviewerName: selected.real_name || selected.username,
      reviewerRole: rule.department,
      department: rule.department,
      matchScore: Math.min(95, 60 + rule.priority * 3 + riskInfo.riskLevel * 5),
      matchReasons: [
        `匹配规则: ${rule.name}`,
        `品类匹配: ${rule.category || rule.categories ? '是' : '通用规则'}`,
        `风险等级适配: Lv.${riskInfo.riskLevel}`,
      ],
      currentWorkload: reviewers.length * 3,
      avgHandleTime: 8 + riskInfo.riskLevel * 4,
    };
  }

  async checkDuplicate(contentId) {
    const recentLogs = await ContentStatusLog.findAll({
      where: {
        content_id: contentId,
        operation_type: { [Op.in]: ['AUDIT', 'BATCH'] },
        created_at: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) },
      },
      order: [['created_at', 'DESC']],
      limit: 3,
    });

    return {
      isDuplicate: recentLogs.length >= 2,
      duplicateTaskIds: recentLogs.map((l) => l.extra_data?.auditNo).filter(Boolean),
      recentAuditRecords: recentLogs.map((l) => ({
        auditNo: l.extra_data?.auditNo || '',
        auditorId: l.operator_id,
        auditorName: l.operator_name || '',
        auditTime: l.created_at,
        result: l.to_status === 2 ? '审核通过' : l.to_status === 3 ? '审核驳回' : '状态变更',
      })),
    };
  }

  async validateOperation({ contentId, auditStatus, reviewLevel }) {
    const content = await Content.findByPk(contentId);
    if (!content) return { valid: false, errors: ['内容不存在'] };

    const errors = [];
    const warnings = [];

    const validTransitions = {
      0: [1, 2, 3, 5],
      1: [2, 3, 5],
      2: [4],
      3: [0],
      5: [0, 2, 3],
    };

    const current = content.audit_status;
    if (!validTransitions[current] || !validTransitions[current].includes(auditStatus)) {
      errors.push(`状态流转非法: 无法从${current}变更为${auditStatus}`);
    }

    const riskInfo = assessRiskLevel(content);
    if (auditStatus === 2 && riskInfo.requiresMultiLevelReview) {
      if ((reviewLevel || 1) < riskInfo.reviewLevel) {
        errors.push(`高风险内容需至少Lv.${riskInfo.reviewLevel}复核，当前为Lv.${reviewLevel || 1}`);
      }
    }

    if (auditStatus === 3) {
      warnings.push('审核驳回将触发创作者修改流程，请确保填写完整驳回原因');
    }

    if (auditStatus === 2 && !content.copyright_id) {
      warnings.push('内容未关联版权信息，通过后可能存在合规风险');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async submitAudit(data, auditorId, auditorName) {
    const { contentId, auditStatus, auditRemark, rejectReasonCategory, rejectReasonDetail, reviewLevel, nextReviewerId } = data;
    const content = await Content.findByPk(contentId);
    if (!content) throw new NotFoundError('内容不存在');

    const duplicate = await this.checkDuplicate(contentId);
    if (duplicate.isDuplicate) {
      throw new BadRequestError('检测到重复提交，请稍后再试或刷新页面');
    }

    const validation = await this.validateOperation({ contentId, auditStatus, reviewLevel: reviewLevel || 1 });
    if (!validation.valid) {
      throw new BadRequestError('审核操作校验失败: ' + validation.errors.join('; '));
    }

    if (auditStatus === 3) {
      if (!rejectReasonCategory) {
        throw new BadRequestError('审核驳回时必须选择驳回原因分类');
      }
      if (!rejectReasonDetail || rejectReasonDetail.trim().length < 5) {
        throw new BadRequestError('请填写详细的驳回原因（至少5个字符）');
      }
    }

    const auditNo = generateAuditNo();
    const fromStatus = content.audit_status;

    const updateData = {
      audit_status: auditStatus,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      auditor_name: auditorName,
      audit_time: new Date(),
    };

    if (auditStatus === 2) {
      updateData.status = 1;
    }
    if (auditStatus === 5) {
      updateData.audit_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (nextReviewerId) {
      updateData.auditor_id = nextReviewerId;
      updateData.audit_assigned_at = new Date();
    }

    await Content.update(updateData, { where: { id: contentId } });

    await ContentStatusLog.create({
      content_id: contentId,
      from_status: fromStatus,
      to_status: auditStatus,
      operator_id: auditorId,
      operator_name: auditorName,
      change_reason: auditStatus === 2 ? '审核通过' : auditStatus === 3 ? '审核驳回' : '待定处理',
      remark: auditRemark,
      operation_type: 'AUDIT',
      ip_address: '',
      extra_data: {
        auditNo,
        reviewLevel: reviewLevel || 1,
        rejectReasonCategory,
        rejectReasonDetail,
        nextReviewerId,
      },
    });

    await cacheService.invalidateContent(contentId);

    return { auditNo };
  }

  async batchAction(data, operatorId, operatorName, userRole) {
    const { ids, action, auditStatus, auditRemark, rejectReasonCategory, rejectReasonDetail, priority } = data;
    if (!ids || ids.length === 0) throw new BadRequestError('请选择要操作的内容');

    if (userRole === 'CONTENT_AUDITOR' && action !== 'approve' && action !== 'reject') {
      throw new ForbiddenError('普通审核员仅可执行通过/驳回操作');
    }

    const contents = await Content.findAll({ where: { id: { [Op.in]: ids } } });
    const operable = [];
    const skipped = [];

    for (const content of contents) {
      const skipReason = [];

      if ([2, 4].includes(content.audit_status) && action !== 'archive' && action !== 'urgent') {
        skipReason.push('已完成审核');
      }
      if (action === 'reject' && !rejectReasonCategory) {
        skipReason.push('缺少驳回原因分类');
      }
      if (userRole === 'CONTENT_AUDITOR' && content.auditor_id && content.auditor_id !== operatorId) {
        skipReason.push('非本人任务');
      }

      if (skipReason.length > 0) {
        skipped.push({ id: content.id, reason: skipReason.join(',') });
      } else {
        operable.push(content);
      }
    }

    const auditNo = generateAuditNo();

    for (const content of operable) {
      const updateData = { auditor_id: operatorId, auditor_name: operatorName, audit_time: new Date() };

      switch (action) {
        case 'approve':
          updateData.audit_status = 2;
          updateData.audit_remark = auditRemark || '批量审核通过';
          updateData.status = 1;
          break;
        case 'reject':
          updateData.audit_status = 3;
          updateData.audit_remark = auditRemark || '批量审核驳回';
          break;
        case 'pending':
          updateData.audit_status = 5;
          updateData.audit_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
          break;
        case 'urgent':
          updateData.priority = priority ?? 1;
          break;
        case 'archive':
          updateData.is_archived = 1;
          updateData.archived_at = new Date();
          break;
      }

      await Content.update(updateData, { where: { id: content.id } });

      await ContentStatusLog.create({
        content_id: content.id,
        from_status: content.audit_status,
        to_status: updateData.audit_status ?? content.audit_status,
        operator_id: operatorId,
        operator_name: operatorName,
        change_reason: `批量操作: ${action}`,
        remark: auditRemark,
        operation_type: 'BATCH',
        extra_data: {
          auditNo,
          batchAction: action,
          rejectReasonCategory,
          rejectReasonDetail,
        },
      });

      await cacheService.invalidateContent(content.id);
    }

    return {
      successCount: operable.length,
      skippedCount: skipped.length,
      successIds: operable.map((c) => c.id),
      skippedIds: skipped.map((s) => s.id),
      skippedDetails: skipped,
      batchAuditNo: auditNo,
    };
  }

  async getTaskPool(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const where = {};

    if (query.auditStatus !== undefined && query.auditStatus !== null && query.auditStatus !== '') {
      where.audit_status = Number(query.auditStatus);
    }
    if (query.category) where.content_category = Number(query.category);
    if (query.priority !== undefined && query.priority !== null && query.priority !== '') {
      where.priority = Number(query.priority);
    }
    if (query.riskLevel) where.risk_level = Number(query.riskLevel);
    if (query.assignedTo) where.auditor_id = Number(query.assignedTo);
    if (query.isArchived !== undefined && query.isArchived !== null && query.isArchived !== '') {
      where.is_archived = query.isArchived === 'true' ? 1 : 0;
    }

    if (query.keyword) {
      where[Op.or] = [
        { content_title: { [Op.like]: `%${query.keyword}%` } },
        { audit_no: { [Op.like]: `%${query.keyword}%` } },
      ];
    }

    const { count, rows } = await Content.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((c) => {
        const risk = assessRiskLevel(c);
        return {
          taskId: `TASK-${c.id}`,
          contentId: c.id,
          contentTitle: c.content_title,
          category: c.content_category,
          coverImage: c.cover_image,
          riskLevel: risk.riskLevel,
          priority: c.priority || 0,
          auditStatus: c.audit_status,
          reviewLevel: risk.reviewLevel,
          assignedTo: c.auditor_id,
          assignedName: c.auditor_name,
          deadline: c.audit_deadline,
          submittedAt: c.audit_assigned_at || c.created_at,
          createdAt: c.created_at,
          isArchived: !!c.is_archived,
          archivedAt: c.archived_at,
          videoDuration: c.duration,
          creatorName: c.creator_name,
          creatorLevel: c.creator_level,
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async getAuditTrace(params) {
    const { auditNo, contentId, auditorId } = params;

    const where = {};
    if (contentId) where.id = Number(contentId);

    const content = contentId ? await Content.findByPk(Number(contentId)) : null;
    const logWhere = {};
    if (contentId) logWhere.content_id = Number(contentId);
    if (auditorId) logWhere.operator_id = Number(auditorId);

    const logs = await ContentStatusLog.findAll({
      where: logWhere,
      order: [['created_at', 'ASC']],
      limit: 50,
    });

    const auditLogs = logs.filter((l) => l.operation_type === 'AUDIT' || l.operation_type === 'BATCH');
    const lastAudit = auditLogs[auditLogs.length - 1];
    const targetAuditNo = auditNo || lastAudit?.extra_data?.auditNo || `TRACE-${Date.now()}`;

    const steps = [];
    const maxLevel = 3;
    const reviewLevelLogs = { 1: null, 2: null, 3: null };

    for (const log of auditLogs) {
      const lvl = log.extra_data?.reviewLevel || 1;
      if (!reviewLevelLogs[lvl]) reviewLevelLogs[lvl] = log;
    }

    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      const log = reviewLevelLogs[lvl];
      const levelName = ['初审', '复审', '终审'][lvl - 1];
      let status = 'pending';
      let result = null;
      let remark = '';
      let reviewer = '';
      let time = '';

      if (log) {
        reviewer = log.operator_name || '系统';
        time = log.created_at;
        if (log.to_status === 2) {
          status = 'completed';
          result = '通过';
        } else if (log.to_status === 3) {
          status = 'rejected';
          result = '驳回';
        } else if (log.to_status === 5) {
          status = 'pending';
          result = '待定';
        }
        remark = log.remark || '';
      }

      steps.push({ level: lvl, name: levelName, reviewer, status, result, remark, time });
    }

    const currentStep = steps.filter((s) => s.status === 'completed').length + (steps.some((s) => s.status === 'pending' && s.result) ? 1 : 0);

    const timeline = logs.map((log) => ({
      time: log.created_at,
      action: { CREATE: '创建', AUDIT: '审核', BATCH: '批量操作', MANUAL: '手动变更', SYSTEM: '系统触发' }[log.operation_type] || log.operation_type,
      operator: log.operator_name || '系统',
      detail: log.change_reason || log.remark || '',
      status: ['待处理', '处理中', '已完成', '已驳回'][log.to_status] || '状态变更',
    }));

    return {
      auditNo: targetAuditNo,
      contentId: content?.id || Number(contentId) || 0,
      contentTitle: content?.content_title || '',
      status: content?.audit_status === 2 ? '已完成' : content?.audit_status === 3 ? '已驳回' : '处理中',
      currentReviewer: content?.auditor_name || '待分配',
      totalSteps: maxLevel,
      currentStep: Math.min(currentStep, maxLevel),
      steps,
      timeline,
      creatorInfo: content
        ? {
            id: content.created_by || 0,
            name: content.creator_name || '未知',
            level: content.creator_level || 0,
            historyViolationCount: content.violation_count || 0,
          }
        : undefined,
    };
  }

  async getQualityReport(params) {
    const { period = 'week', startDate, endDate, auditorId } = params;
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

    const where = {
      operation_type: { [Op.in]: ['AUDIT', 'BATCH'] },
      created_at: { [Op.between]: [from, to] },
    };
    if (auditorId) where.operator_id = Number(auditorId);

    const logs = await ContentStatusLog.findAll({ where, order: [['created_at', 'ASC']] });
    const totalAudited = logs.length;

    const auditorMap = {};
    const exceptions = [];
    const contentLogMap = {};

    for (const log of logs) {
      const aid = log.operator_id || 0;
      if (!auditorMap[aid]) {
        auditorMap[aid] = {
          auditorId: aid,
          auditorName: log.operator_name || '未知',
          totalCount: 0,
          exceptionCount: 0,
          totalDuration: 0,
          approvedCount: 0,
        };
      }
      auditorMap[aid].totalCount++;
      if (log.to_status === 2) auditorMap[aid].approvedCount++;

      if (!contentLogMap[log.content_id]) contentLogMap[log.content_id] = [];
      contentLogMap[log.content_id].push(log);
    }

    for (const [cid, clog] of Object.entries(contentLogMap)) {
      if (clog.length >= 3 && clog.slice(-3).every((l) => l.to_status === 2 && l.operator_id === clog[0].operator_id)) {
        const last = clog[clog.length - 1];
        exceptions.push({
          id: exceptions.length + 1,
          type: 'speed_abnormal',
          typeLabel: '审核速度异常',
          severity: 'warning',
          contentId: Number(cid),
          contentTitle: '',
          auditNo: last.extra_data?.auditNo || '',
          auditorId: last.operator_id,
          auditorName: last.operator_name,
          description: '该内容短时间内多次通过审核，疑似操作过快',
          suggestedAction: '建议人工复核审核过程',
          status: 0,
          createdAt: last.created_at,
        });
        if (auditorMap[last.operator_id]) auditorMap[last.operator_id].exceptionCount++;
      }

      if (clog.length >= 2) {
        const timeDiff = (new Date(clog[clog.length - 1].created_at) - new Date(clog[clog.length - 2].created_at)) / 1000;
        if (timeDiff < 3 && clog[clog.length - 1].operation_type === 'AUDIT') {
          const last = clog[clog.length - 1];
          exceptions.push({
            id: exceptions.length + 1,
            type: 'duplicate_submit',
            typeLabel: '重复提交',
            severity: 'info',
            contentId: Number(cid),
            contentTitle: '',
            auditNo: last.extra_data?.auditNo || '',
            auditorId: last.operator_id,
            auditorName: last.operator_name,
            description: `两次审核间隔仅${timeDiff.toFixed(1)}秒`,
            suggestedAction: '检查是否误操作',
            status: 0,
            createdAt: last.created_at,
          });
        }
      }
    }

    const auditorStats = Object.values(auditorMap).map((a) => {
      const avgDuration = a.totalCount > 0 ? Math.round((a.totalDuration / a.totalCount) / 60) : 0;
      const approvalRate = a.totalCount > 0 ? Math.round((a.approvedCount / a.totalCount) * 100) : 0;
      const efficiencyScore = Math.max(
        0,
        100 - a.exceptionCount * 10 - Math.abs(approvalRate - 70) * 0.5
      );
      return {
        auditorId: a.auditorId,
        auditorName: a.auditorName,
        totalCount: a.totalCount,
        exceptionCount: a.exceptionCount,
        avgDuration: avgDuration || 12,
        approvalRate,
        efficiencyScore: Math.round(efficiencyScore),
      };
    });

    const exceptionCount = exceptions.length;
    const approvedTotal = logs.filter((l) => l.to_status === 2).length;
    const passRate = totalAudited > 0 ? Math.round((approvedTotal / totalAudited) * 100) : 0;
    const exceptionRate = totalAudited > 0 ? +((exceptionCount / totalAudited) * 100).toFixed(2) : 0;

    const summary = {
      strengths: [
        exceptionRate < 5 ? '异常率低于5%，整体审核质量良好' : '审核覆盖面完整',
        auditorStats.some((a) => a.efficiencyScore >= 80) ? '多位审核员效率评分优秀' : '团队协作顺畅',
      ],
      weaknesses: [
        exceptionCount > 0 ? `共发现${exceptionCount}项审核异常需关注` : '暂未发现明显问题',
        auditorStats.some((a) => a.approvalRate > 90) ? '部分审核员通过率偏高，建议复核' : '',
      ].filter(Boolean),
      suggestions: [
        '建议每周开展审核标准培训',
        '高风险内容继续严格执行多级复核',
        '建立异常案例分享机制，提升团队识别能力',
      ],
    };

    return {
      id: 1,
      reportNo: `QR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
      reportDate: now.toISOString(),
      period: period === 'week' ? '近7天' : period === 'month' ? '近30天' : period === 'today' ? '今日' : '自定义',
      totalAudited,
      exceptionCount,
      exceptionRate,
      passRate,
      auditorStats,
      exceptionList: exceptions,
      summary,
    };
  }

  getAssignRules() {
    return ASSIGN_RULES.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      minDuration: r.minDuration,
      maxDuration: r.maxDuration,
      riskLevel: r.riskLevel,
      reviewerIds: [],
      reviewerNames: [],
      reviewLevel: r.reviewLevel,
      priority: r.priority,
      status: 1,
    }));
  }

  getRejectReasonTemplates() {
    return REJECT_REASON_TEMPLATES;
  }

  async refreshPartial(contentIds) {
    const result = await this.getTaskPool({
      page: 1,
      pageSize: contentIds.length,
      sortBy: 'id',
      sortOrder: 'DESC',
    });
    return result.list.filter((item) => contentIds.includes(item.contentId));
  }
}

module.exports = new AuditService();
