const { AuditRule, AuditRuleModifyLog } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString } = require('../utils/helpers');
const cacheService = require('./CacheService');

const RULE_STATUS = {
  DRAFT: 0,
  ENABLED: 1,
  DISABLED: 2,
  EXPIRED: 3,
  PENDING_REVIEW: 4,
};

const RULE_STATUS_LABEL = {
  0: '草稿',
  1: '已启用',
  2: '已停用',
  3: '已过期',
  4: '待审核',
};

const MODIFY_TYPE = {
  CREATE: 'create',
  UPDATE: 'update',
  ENABLE: 'enable',
  DISABLE: 'disable',
  DELETE: 'delete',
  PUBLISH: 'publish',
  ROLLBACK: 'rollback',
  BATCH_SYNC: 'batch_sync',
};

const MODIFY_TYPE_LABEL = {
  create: '创建',
  update: '修改',
  enable: '启用',
  disable: '停用',
  delete: '删除',
  publish: '发布',
  rollback: '回滚',
  batch_sync: '批量同步',
};

const RULE_TYPE_ABBR = {
  content: 'CON',
  comment: 'CMT',
  image: 'IMG',
  video: 'VID',
  user: 'USR',
  keyword: 'KEY',
  score: 'SCR',
};

const CORE_DEFAULT_RULES = [
  {
    ruleCode: 'RULE_CON_CORE_001',
    ruleName: '核心内容敏感词检测',
    ruleType: 'content',
    ruleCategory: 'sensitive',
    ruleDescription: '检测内容中包含的政治敏感、色情、暴力等违规关键词',
    applicableCategory: ['article', 'comment', 'shortVideo'],
    applicableRiskLevels: [2, 3, 4],
    priority: 95,
    isCoreDefault: true,
    isSystemDefault: true,
    triggerConditions: {
      type: 'keyword_match',
      categories: ['political', 'pornographic', 'violence', 'contraband'],
      minMatchCount: 1,
    },
    actions: [
      { type: 'auto_reject', severity: 'high' },
      { type: 'notify_admin', channel: 'system' },
    ],
    ruleParams: {
      keywordLibrary: 'default',
      fuzzyMatch: true,
      caseSensitive: false,
    },
    sortOrder: 1,
  },
  {
    ruleCode: 'RULE_CON_CORE_002',
    ruleName: '核心虚假信息识别',
    ruleType: 'content',
    ruleCategory: 'fake',
    ruleDescription: '识别夸张标题党、谣言式句式、伪科学等虚假信息模式',
    applicableCategory: ['article'],
    applicableRiskLevels: [2, 3],
    priority: 85,
    isCoreDefault: true,
    isSystemDefault: true,
    triggerConditions: {
      type: 'pattern_match',
      patterns: ['exaggeration_title', 'rumor_style', 'pseudoscience'],
      minScore: 15,
    },
    actions: [
      { type: 'manual_review', level: 2 },
      { type: 'reduce_visibility', factor: 0.5 },
    ],
    ruleParams: {
      patternVersion: 'v2.1',
      scoreThreshold: 15,
    },
    sortOrder: 2,
  },
  {
    ruleCode: 'RULE_IMG_CORE_001',
    ruleName: '核心图片违规检测',
    ruleType: 'image',
    ruleCategory: 'sensitive',
    ruleDescription: '检测封面图和正文中的违规图片内容',
    applicableCategory: ['article', 'shortVideo'],
    applicableRiskLevels: [2, 3, 4],
    priority: 90,
    isCoreDefault: true,
    isSystemDefault: true,
    triggerConditions: {
      type: 'image_classification',
      categories: ['nudity', 'violence', 'gambling', 'drugs'],
      minConfidence: 0.8,
    },
    actions: [
      { type: 'image_blur', categories: ['nudity'] },
      { type: 'auto_reject', severity: 'high' },
    ],
    ruleParams: {
      model: 'default_vision_v3',
      batchSize: 5,
    },
    sortOrder: 3,
  },
  {
    ruleCode: 'RULE_USR_CORE_001',
    ruleName: '核心用户行为风控',
    ruleType: 'user',
    ruleCategory: 'risk',
    ruleDescription: '对高风险用户发布的内容进行额外审核',
    applicableCategory: ['article', 'comment', 'shortVideo'],
    applicableRiskLevels: [2, 3, 4],
    priority: 80,
    isCoreDefault: true,
    isSystemDefault: true,
    triggerConditions: {
      type: 'user_risk',
      minViolationCount: 3,
      userLevels: [0, 1],
    },
    actions: [
      { type: 'manual_review', level: 2 },
      { type: 'delay_publish', minutes: 30 },
    ],
    ruleParams: {
      riskWindowDays: 30,
      escalationThreshold: 5,
    },
    sortOrder: 4,
  },
  {
    ruleCode: 'RULE_SCR_CORE_001',
    ruleName: '核心质量评分规则',
    ruleType: 'score',
    ruleCategory: 'quality',
    ruleDescription: '对内容质量进行综合评分，低质内容触发人工审核',
    applicableCategory: ['article'],
    applicableRiskLevels: [1, 2],
    priority: 70,
    isCoreDefault: true,
    isSystemDefault: true,
    triggerConditions: {
      type: 'quality_score',
      minWordCount: 100,
      maxTitleLength: 50,
      minTitleLength: 5,
      requiredFields: ['content_title', 'content_description', 'cover_images'],
    },
    actions: [
      { type: 'quality_tag', level: 'low' },
      { type: 'reduce_visibility', factor: 0.3 },
    ],
    ruleParams: {
      scoringModel: 'v1.0',
      lowQualityThreshold: 40,
    },
    sortOrder: 5,
  },
];

const DEFAULT_DYNAMIC_FIELDS = {
  content: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['keyword_match', 'pattern_match', 'length_check', 'format_check'], required: true },
      { key: 'categories', label: '检测分类', type: 'multiselect', options: ['political', 'pornographic', 'violence', 'contraband', 'advertisement', 'exaggeration'], required: false },
      { key: 'minMatchCount', label: '最小匹配数', type: 'number', min: 1, max: 100, required: false },
      { key: 'minScore', label: '最低分数', type: 'number', min: 0, max: 100, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['auto_pass', 'auto_reject', 'manual_review', 'reduce_visibility', 'notify_admin', 'quality_tag'], required: true },
      { key: 'severity', label: '严重程度', type: 'select', options: ['low', 'medium', 'high'], required: false },
      { key: 'level', label: '审核级别', type: 'number', min: 1, max: 3, required: false },
      { key: 'factor', label: '可见度系数', type: 'number', min: 0, max: 1, step: 0.1, required: false },
    ],
    ruleParams: [
      { key: 'fuzzyMatch', label: '模糊匹配', type: 'boolean', required: false },
      { key: 'caseSensitive', label: '区分大小写', type: 'boolean', required: false },
      { key: 'keywordLibrary', label: '关键词库', type: 'select', options: ['default', 'entertainment', 'news', 'sports'], required: false },
    ],
  },
  comment: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['keyword_match', 'spam_detect', 'toxicity_detect', 'length_check'], required: true },
      { key: 'categories', label: '检测分类', type: 'multiselect', options: ['spam', 'toxic', 'insult', 'threat', 'hate_speech'], required: false },
      { key: 'minScore', label: '最低分数', type: 'number', min: 0, max: 100, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['auto_pass', 'auto_reject', 'manual_review', 'shadow_ban', 'notify_admin'], required: true },
      { key: 'severity', label: '严重程度', type: 'select', options: ['low', 'medium', 'high'], required: false },
      { key: 'level', label: '审核级别', type: 'number', min: 1, max: 3, required: false },
    ],
    ruleParams: [
      { key: 'spamThreshold', label: '垃圾评分阈值', type: 'number', min: 0, max: 100, required: false },
      { key: 'autoDelete', label: '自动删除', type: 'boolean', required: false },
    ],
  },
  image: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['image_classification', 'ocr_text', 'face_detect', 'duplicate_detect'], required: true },
      { key: 'categories', label: '检测分类', type: 'multiselect', options: ['nudity', 'violence', 'gambling', 'drugs', 'suggestive', 'advertisement'], required: false },
      { key: 'minConfidence', label: '最低置信度', type: 'number', min: 0, max: 1, step: 0.01, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['image_blur', 'image_remove', 'auto_reject', 'manual_review', 'notify_admin'], required: true },
      { key: 'categories', label: '处理分类', type: 'multiselect', options: ['nudity', 'violence', 'gambling', 'drugs'], required: false },
      { key: 'severity', label: '严重程度', type: 'select', options: ['low', 'medium', 'high'], required: false },
    ],
    ruleParams: [
      { key: 'model', label: '模型版本', type: 'select', options: ['default_vision_v1', 'default_vision_v2', 'default_vision_v3'], required: false },
      { key: 'batchSize', label: '批处理大小', type: 'number', min: 1, max: 20, required: false },
    ],
  },
  video: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['video_classification', 'frame_analysis', 'audio_detect', 'duration_check'], required: true },
      { key: 'categories', label: '检测分类', type: 'multiselect', options: ['nudity', 'violence', 'gambling', 'drugs', 'copyright'], required: false },
      { key: 'minConfidence', label: '最低置信度', type: 'number', min: 0, max: 1, step: 0.01, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['video_blur', 'video_reject', 'auto_reject', 'manual_review', 'notify_admin'], required: true },
      { key: 'severity', label: '严重程度', type: 'select', options: ['low', 'medium', 'high'], required: false },
      { key: 'level', label: '审核级别', type: 'number', min: 1, max: 3, required: false },
    ],
    ruleParams: [
      { key: 'sampleInterval', label: '采样间隔(秒)', type: 'number', min: 1, max: 60, required: false },
      { key: 'enableAudio', label: '启用音频检测', type: 'boolean', required: false },
    ],
  },
  user: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['user_risk', 'violation_count', 'user_level', 'behavior_pattern'], required: true },
      { key: 'minViolationCount', label: '最小违规次数', type: 'number', min: 1, max: 100, required: false },
      { key: 'userLevels', label: '用户等级', type: 'multiselect', options: [0, 1, 2, 3, 4], required: false },
      { key: 'riskWindowDays', label: '风险窗口(天)', type: 'number', min: 1, max: 365, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['manual_review', 'delay_publish', 'reduce_visibility', 'notify_admin', 'user_warn'], required: true },
      { key: 'level', label: '审核级别', type: 'number', min: 1, max: 3, required: false },
      { key: 'minutes', label: '延迟分钟数', type: 'number', min: 1, max: 1440, required: false },
      { key: 'factor', label: '可见度系数', type: 'number', min: 0, max: 1, step: 0.1, required: false },
    ],
    ruleParams: [
      { key: 'escalationThreshold', label: '升级阈值', type: 'number', min: 1, max: 100, required: false },
      { key: 'autoMute', label: '自动禁言', type: 'boolean', required: false },
    ],
  },
  keyword: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['exact_match', 'fuzzy_match', 'regex_match', 'semantic_match'], required: true },
      { key: 'keywords', label: '关键词列表', type: 'textarea', required: true },
      { key: 'minMatchCount', label: '最小匹配数', type: 'number', min: 1, max: 100, required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['auto_reject', 'manual_review', 'replace_word', 'notify_admin'], required: true },
      { key: 'severity', label: '严重程度', type: 'select', options: ['low', 'medium', 'high'], required: false },
      { key: 'replaceWith', label: '替换文本', type: 'text', required: false },
    ],
    ruleParams: [
      { key: 'caseSensitive', label: '区分大小写', type: 'boolean', required: false },
      { key: 'wholeWord', label: '整词匹配', type: 'boolean', required: false },
    ],
  },
  score: {
    triggerConditions: [
      { key: 'type', label: '触发类型', type: 'select', options: ['quality_score', 'risk_score', 'composite_score'], required: true },
      { key: 'minWordCount', label: '最小字数', type: 'number', min: 0, max: 10000, required: false },
      { key: 'maxTitleLength', label: '标题最大长度', type: 'number', min: 10, max: 200, required: false },
      { key: 'minTitleLength', label: '标题最小长度', type: 'number', min: 1, max: 50, required: false },
      { key: 'requiredFields', label: '必填字段', type: 'multiselect', options: ['content_title', 'content_description', 'cover_images', 'summary', 'tags'], required: false },
    ],
    actions: [
      { key: 'type', label: '动作类型', type: 'select', options: ['quality_tag', 'reduce_visibility', 'manual_review', 'notify_admin'], required: true },
      { key: 'level', label: '质量等级', type: 'select', options: ['low', 'medium', 'high', 'premium'], required: false },
      { key: 'factor', label: '可见度系数', type: 'number', min: 0, max: 1, step: 0.1, required: false },
    ],
    ruleParams: [
      { key: 'scoringModel', label: '评分模型', type: 'select', options: ['v1.0', 'v2.0', 'v3.0'], required: false },
      { key: 'lowQualityThreshold', label: '低质阈值', type: 'number', min: 0, max: 100, required: false },
    ],
  },
};

function generateRuleCode(ruleType) {
  const abbr = RULE_TYPE_ABBR[ruleType] || 'DEF';
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RULE_${abbr}${y}${m}${d}${rand}`;
}

function generateBatchNo() {
  const date = new Date();
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BATCH_${y}${M}${d}${h}${m}${s}${rand}`;
}

function calculateEffectStatus(rule) {
  const now = new Date();
  const status = rule.rule_status;
  const startTime = rule.effective_start_time ? new Date(rule.effective_start_time) : null;
  const endTime = rule.effective_end_time ? new Date(rule.effective_end_time) : null;

  if (status === RULE_STATUS.DRAFT) return { code: 'draft', label: '草稿', active: false };
  if (status === RULE_STATUS.DISABLED) return { code: 'disabled', label: '已停用', active: false };
  if (status === RULE_STATUS.PENDING_REVIEW) return { code: 'pending', label: '待审核', active: false };
  if (status === RULE_STATUS.EXPIRED) return { code: 'expired', label: '已过期', active: false };

  if (status === RULE_STATUS.ENABLED) {
    if (endTime && now > endTime) {
      return { code: 'expired', label: '已过期', active: false };
    }
    if (startTime && now < startTime) {
      return { code: 'scheduled', label: '待生效', active: false };
    }
    return { code: 'active', label: '生效中', active: true };
  }

  return { code: 'unknown', label: '未知', active: false };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function compareObjects(before, after) {
  const changedFields = [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    const beforeVal = before?.[key];
    const afterVal = after?.[key];
    const beforeStr = typeof beforeVal === 'object' ? JSON.stringify(beforeVal) : String(beforeVal ?? '');
    const afterStr = typeof afterVal === 'object' ? JSON.stringify(afterVal) : String(afterVal ?? '');
    if (beforeStr !== afterStr) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

class AuditRuleService {
  async getList(params) {
    const { page, pageSize, offset } = parsePagination(params);
    const order = parseSort(params);
    const where = {};

    if (params.ruleType) where.rule_type = params.ruleType;
    if (params.ruleCategory) where.rule_category = params.ruleCategory;
    if (params.ruleStatus !== undefined && params.ruleStatus !== null && params.ruleStatus !== '') {
      where.rule_status = Number(params.ruleStatus);
    }
    if (params.isCoreDefault !== undefined && params.isCoreDefault !== null && params.isCoreDefault !== '') {
      where.is_core_default = params.isCoreDefault === 'true' ? 1 : 0;
    }
    if (params.priorityMin !== undefined) where.priority = { [Op.gte]: Number(params.priorityMin) };
    if (params.priorityMax !== undefined) where.priority = { ...where.priority, [Op.lte]: Number(params.priorityMax) };
    if (params.keyword) {
      where[Op.or] = [
        { rule_name: { [Op.like]: `%${params.keyword}%` } },
        { rule_code: { [Op.like]: `%${params.keyword}%` } },
        { rule_description: { [Op.like]: `%${params.keyword}%` } },
      ];
    }

    const { count, rows } = await AuditRule.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    const list = rows.map((rule) => {
      const effectStatus = calculateEffectStatus(rule);
      return {
        id: rule.id,
        ruleCode: rule.rule_code,
        ruleName: rule.rule_name,
        ruleType: rule.rule_type,
        ruleCategory: rule.rule_category,
        ruleDescription: rule.rule_description,
        applicableCategory: rule.applicable_category,
        applicableRiskLevels: rule.applicable_risk_levels,
        effectiveStartTime: rule.effective_start_time,
        effectiveEndTime: rule.effective_end_time,
        priority: rule.priority,
        ruleStatus: rule.rule_status,
        ruleStatusLabel: RULE_STATUS_LABEL[rule.rule_status],
        isCoreDefault: rule.is_core_default === 1,
        isSystemDefault: rule.is_system_default === 1,
        version: rule.version,
        effectBatch: rule.effect_batch,
        sortOrder: rule.sort_order,
        createdBy: rule.created_by,
        createdByName: rule.created_by_name,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
        effectStatus: effectStatus.code,
        effectStatusLabel: effectStatus.label,
        isActive: effectStatus.active,
        conflictCount: 0,
        affectedTaskCount: 0,
      };
    });

    return {
      list,
      total: count,
      page,
      pageSize,
    };
  }

  async getDetail(id) {
    const rule = await AuditRule.findByPk(id);
    if (!rule) throw new NotFoundError('审核规则不存在');

    return {
      id: rule.id,
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      ruleCategory: rule.rule_category,
      ruleDescription: rule.rule_description,
      applicableCategory: rule.applicable_category,
      applicableRiskLevels: rule.applicable_risk_levels,
      effectiveStartTime: rule.effective_start_time,
      effectiveEndTime: rule.effective_end_time,
      priority: rule.priority,
      ruleStatus: rule.rule_status,
      ruleStatusLabel: RULE_STATUS_LABEL[rule.rule_status],
      isCoreDefault: rule.is_core_default === 1,
      isSystemDefault: rule.is_system_default === 1,
      version: rule.version,
      effectBatch: rule.effect_batch,
      triggerConditions: rule.trigger_conditions,
      actions: rule.actions,
      ruleParams: rule.rule_params,
      sortOrder: rule.sort_order,
      remark: rule.remark,
      createdBy: rule.created_by,
      createdByName: rule.created_by_name,
      updatedBy: rule.updated_by,
      updatedByName: rule.updated_by_name,
      publishedAt: rule.published_at,
      lastEnabledAt: rule.last_enabled_at,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
      effectStatus: calculateEffectStatus(rule),
    };
  }

  async createRule(data, creatorId, creatorName) {
    const {
      ruleName,
      ruleType,
      ruleCategory,
      ruleDescription,
      applicableCategory = [],
      applicableRiskLevels = [],
      effectiveStartTime,
      effectiveEndTime,
      priority = 50,
      triggerConditions,
      actions,
      ruleParams,
      sortOrder = 0,
      remark,
    } = data;

    if (!ruleName) throw new BadRequestError('规则名称不能为空');
    if (!ruleType) throw new BadRequestError('规则类型不能为空');
    if (!DEFAULT_DYNAMIC_FIELDS[ruleType]) {
      throw new BadRequestError(`不支持的规则类型: ${ruleType}`);
    }

    const ruleCode = generateRuleCode(ruleType);

    if (effectiveStartTime && effectiveEndTime) {
      if (new Date(effectiveStartTime) >= new Date(effectiveEndTime)) {
        throw new BadRequestError('生效开始时间必须早于结束时间');
      }
    }

    const conflictResult = await this.checkConflicts({
      ruleType,
      ruleCategory,
      applicableCategory,
      applicableRiskLevels,
      effectiveStartTime,
      effectiveEndTime,
      triggerConditions,
      actions,
      ruleParams,
    }, null);

    const highConflicts = conflictResult.conflicts.filter((c) => c.severity === 'high');
    if (highConflicts.length > 0) {
      throw new BadRequestError(`规则冲突检测未通过: ${highConflicts.map((c) => c.description).join('; ')}`);
    }

    const rule = await AuditRule.create({
      rule_code: ruleCode,
      rule_name: ruleName,
      rule_type: ruleType,
      rule_category: ruleCategory || null,
      rule_description: ruleDescription || null,
      applicable_category: applicableCategory,
      applicable_risk_levels: applicableRiskLevels,
      effective_start_time: effectiveStartTime || null,
      effective_end_time: effectiveEndTime || null,
      priority: priority,
      rule_status: RULE_STATUS.DRAFT,
      is_core_default: 0,
      is_system_default: 0,
      version: 1,
      effect_batch: null,
      trigger_conditions: triggerConditions || null,
      actions: actions || null,
      rule_params: ruleParams || null,
      sort_order: sortOrder,
      remark: remark || null,
      created_by: creatorId,
      created_by_name: creatorName,
      updated_by: creatorId,
      updated_by_name: creatorName,
      published_at: null,
      last_enabled_at: null,
    });

    await AuditRuleModifyLog.create({
      rule_id: rule.id,
      rule_code: rule.rule_code,
      version: 1,
      effect_batch: null,
      modify_type: MODIFY_TYPE.CREATE,
      modify_type_label: MODIFY_TYPE_LABEL[MODIFY_TYPE.CREATE],
      modifier_id: creatorId,
      modifier_name: creatorName,
      modify_time: new Date(),
      change_summary: `创建规则: ${ruleName}`,
      before_snapshot: null,
      after_snapshot: {
        ruleName,
        ruleType,
        ruleCategory,
        applicableCategory,
        applicableRiskLevels,
        priority,
      },
      changed_fields: ['rule_name', 'rule_type', 'rule_category', 'applicable_category', 'priority'],
      remark: remark || null,
    });

    await cacheService.delByPattern('audit:rule:*');

    return this.getDetail(rule.id);
  }

  async updateRule(id, data, operatorId, operatorName) {
    const rule = await AuditRule.findByPk(id);
    if (!rule) throw new NotFoundError('审核规则不存在');

    if (rule.is_core_default === 1) {
      const statusOnly = Object.keys(data).every(
        (k) => ['ruleStatus', 'rule_status', 'remark'].includes(k)
      );
      if (!statusOnly) {
        throw new ForbiddenError('核心默认规则仅可修改状态和备注');
      }
    }

    const beforeSnapshot = {
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      ruleCategory: rule.rule_category,
      ruleDescription: rule.rule_description,
      applicableCategory: rule.applicable_category,
      applicableRiskLevels: rule.applicable_risk_levels,
      effectiveStartTime: rule.effective_start_time,
      effectiveEndTime: rule.effective_end_time,
      priority: rule.priority,
      triggerConditions: rule.trigger_conditions,
      actions: rule.actions,
      ruleParams: rule.rule_params,
      sortOrder: rule.sort_order,
      ruleStatus: rule.rule_status,
      remark: rule.remark,
    };

    const updateData = {};
    if (data.ruleName !== undefined) updateData.rule_name = data.ruleName;
    if (data.ruleCategory !== undefined) updateData.rule_category = data.ruleCategory;
    if (data.ruleDescription !== undefined) updateData.rule_description = data.ruleDescription;
    if (data.applicableCategory !== undefined) updateData.applicable_category = data.applicableCategory;
    if (data.applicableRiskLevels !== undefined) updateData.applicable_risk_levels = data.applicableRiskLevels;
    if (data.effectiveStartTime !== undefined) updateData.effective_start_time = data.effectiveStartTime;
    if (data.effectiveEndTime !== undefined) updateData.effective_end_time = data.effectiveEndTime;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.triggerConditions !== undefined) updateData.trigger_conditions = data.triggerConditions;
    if (data.actions !== undefined) updateData.actions = data.actions;
    if (data.ruleParams !== undefined) updateData.rule_params = data.ruleParams;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.ruleStatus !== undefined) updateData.rule_status = data.ruleStatus;
    if (data.remark !== undefined) updateData.remark = data.remark;

    if (Object.keys(updateData).length === 0) {
      return this.getDetail(id);
    }

    if (rule.rule_status === RULE_STATUS.ENABLED && data.ruleStatus === undefined) {
      throw new BadRequestError('已启用规则需先停用后再修改');
    }

    if (data.effectiveStartTime && data.effectiveEndTime) {
      if (new Date(data.effectiveStartTime) >= new Date(data.effectiveEndTime)) {
        throw new BadRequestError('生效开始时间必须早于结束时间');
      }
    }

    if (data.triggerConditions || data.actions || data.applicableCategory || data.applicableRiskLevels) {
      const conflictResult = await this.checkConflicts({
        ruleType: rule.rule_type,
        ruleCategory: data.ruleCategory || rule.rule_category,
        applicableCategory: data.applicableCategory || rule.applicable_category,
        applicableRiskLevels: data.applicableRiskLevels || rule.applicable_risk_levels,
        effectiveStartTime: data.effectiveStartTime !== undefined ? data.effectiveStartTime : rule.effective_start_time,
        effectiveEndTime: data.effectiveEndTime !== undefined ? data.effectiveEndTime : rule.effective_end_time,
        triggerConditions: data.triggerConditions !== undefined ? data.triggerConditions : rule.trigger_conditions,
        actions: data.actions !== undefined ? data.actions : rule.actions,
        ruleParams: data.ruleParams !== undefined ? data.ruleParams : rule.rule_params,
      }, id);

      const highConflicts = conflictResult.conflicts.filter((c) => c.severity === 'high');
      if (highConflicts.length > 0) {
        throw new BadRequestError(`规则冲突检测未通过: ${highConflicts.map((c) => c.description).join('; ')}`);
      }
    }

    const newVersion = rule.version + 1;
    updateData.version = newVersion;
    updateData.updated_by = operatorId;
    updateData.updated_by_name = operatorName;

    await AuditRule.update(updateData, { where: { id } });

    const afterSnapshot = { ...beforeSnapshot };
    for (const key of Object.keys(updateData)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      afterSnapshot[camelKey] = updateData[key];
    }

    const changedFields = compareObjects(beforeSnapshot, afterSnapshot);

    await AuditRuleModifyLog.create({
      rule_id: rule.id,
      rule_code: rule.rule_code,
      version: newVersion,
      effect_batch: rule.effect_batch,
      modify_type: MODIFY_TYPE.UPDATE,
      modify_type_label: MODIFY_TYPE_LABEL[MODIFY_TYPE.UPDATE],
      modifier_id: operatorId,
      modifier_name: operatorName,
      modify_time: new Date(),
      change_summary: `修改规则，变更${changedFields.length}个字段: ${changedFields.join(', ')}`,
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      changed_fields: changedFields,
      remark: data.remark || null,
    });

    await cacheService.delByPattern('audit:rule:*');

    return this.getDetail(id);
  }

  async enableRule(id, options = {}) {
    const rule = await AuditRule.findByPk(id);
    if (!rule) throw new NotFoundError('审核规则不存在');

    if (rule.rule_status === RULE_STATUS.ENABLED) {
      throw new BadRequestError('规则已处于启用状态');
    }

    const { resetEffectiveTime = false } = options;
    const now = new Date();
    const effectBatch = generateBatchNo();

    const updateData = {
      rule_status: RULE_STATUS.ENABLED,
      last_enabled_at: now,
      effect_batch: effectBatch,
      version: rule.version + 1,
    };

    if (resetEffectiveTime) {
      updateData.effective_start_time = now;
      updateData.effective_end_time = null;
    }

    const beforeSnapshot = {
      ruleStatus: rule.rule_status,
      lastEnabledAt: rule.last_enabled_at,
      effectBatch: rule.effect_batch,
      version: rule.version,
    };

    await AuditRule.update(updateData, { where: { id } });

    const afterSnapshot = { ...beforeSnapshot, ...updateData };

    await AuditRuleModifyLog.create({
      rule_id: rule.id,
      rule_code: rule.rule_code,
      version: updateData.version,
      effect_batch: effectBatch,
      modify_type: MODIFY_TYPE.ENABLE,
      modify_type_label: MODIFY_TYPE_LABEL[MODIFY_TYPE.ENABLE],
      modifier_id: null,
      modifier_name: 'system',
      modify_time: now,
      change_summary: `启用规则，批次号: ${effectBatch}`,
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      changed_fields: ['rule_status', 'last_enabled_at', 'effect_batch', 'version'],
      remark: resetEffectiveTime ? '重置生效时间' : null,
    });

    await cacheService.delByPattern('audit:rule:*');

    return this.getDetail(id);
  }

  async disableRule(id) {
    const rule = await AuditRule.findByPk(id);
    if (!rule) throw new NotFoundError('审核规则不存在');

    if (rule.rule_status !== RULE_STATUS.ENABLED && rule.rule_status !== RULE_STATUS.PENDING_REVIEW) {
      throw new BadRequestError('仅已启用或待审核状态的规则可停用');
    }

    const beforeSnapshot = {
      ruleStatus: rule.rule_status,
      version: rule.version,
    };

    const updateData = {
      rule_status: RULE_STATUS.DISABLED,
      version: rule.version + 1,
    };

    await AuditRule.update(updateData, { where: { id } });

    const afterSnapshot = { ...beforeSnapshot, ...updateData };

    await AuditRuleModifyLog.create({
      rule_id: rule.id,
      rule_code: rule.rule_code,
      version: updateData.version,
      effect_batch: rule.effect_batch,
      modify_type: MODIFY_TYPE.DISABLE,
      modify_type_label: MODIFY_TYPE_LABEL[MODIFY_TYPE.DISABLE],
      modifier_id: null,
      modifier_name: 'system',
      modify_time: new Date(),
      change_summary: '停用规则',
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      changed_fields: ['rule_status', 'version'],
      remark: null,
    });

    await cacheService.delByPattern('audit:rule:*');

    return this.getDetail(id);
  }

  async deleteRule(id) {
    const rule = await AuditRule.findByPk(id);
    if (!rule) throw new NotFoundError('审核规则不存在');

    if (rule.is_core_default === 1) {
      throw new ForbiddenError('核心规则禁止删除，仅可修改状态');
    }

    const beforeSnapshot = {
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      ruleStatus: rule.rule_status,
    };

    await AuditRule.destroy({ where: { id } });

    await AuditRuleModifyLog.create({
      rule_id: id,
      rule_code: rule.rule_code,
      version: rule.version,
      effect_batch: rule.effect_batch,
      modify_type: MODIFY_TYPE.DELETE,
      modify_type_label: MODIFY_TYPE_LABEL[MODIFY_TYPE.DELETE],
      modifier_id: null,
      modifier_name: 'system',
      modify_time: new Date(),
      change_summary: `删除规则: ${rule.rule_name}`,
      before_snapshot: beforeSnapshot,
      after_snapshot: null,
      changed_fields: ['*'],
      remark: null,
    });

    await cacheService.delByPattern('audit:rule:*');

    return { success: true, id, ruleCode: rule.rule_code };
  }

  async checkConflicts(data, excludeId = null) {
    const {
      ruleType,
      ruleCategory,
      applicableCategory = [],
      applicableRiskLevels = [],
      effectiveStartTime,
      effectiveEndTime,
      triggerConditions,
      actions,
      ruleParams,
    } = data;

    const conflicts = [];

    const where = {
      rule_type: ruleType,
      rule_status: { [Op.in]: [RULE_STATUS.ENABLED, RULE_STATUS.DRAFT, RULE_STATUS.PENDING_REVIEW] },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const similarRules = await AuditRule.findAll({ where });

    for (const other of similarRules) {
      const otherCats = other.applicable_category || [];
      const otherLevels = other.applicable_risk_levels || [];
      const catOverlap = applicableCategory.some((c) => otherCats.includes(c));
      const levelOverlap = applicableRiskLevels.some((l) => otherLevels.includes(l));

      if (!catOverlap && applicableCategory.length > 0 && otherCats.length > 0) continue;

      const otherStart = other.effective_start_time ? new Date(other.effective_start_time) : null;
      const otherEnd = other.effective_end_time ? new Date(other.effective_end_time) : null;
      const thisStart = effectiveStartTime ? new Date(effectiveStartTime) : null;
      const thisEnd = effectiveEndTime ? new Date(effectiveEndTime) : null;

      let timeOverlap = true;
      if (thisStart && otherEnd && thisStart >= otherEnd) timeOverlap = false;
      if (thisEnd && otherStart && thisEnd <= otherStart) timeOverlap = false;

      if (timeOverlap && (catOverlap || applicableCategory.length === 0 || otherCats.length === 0)) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'high',
          ruleId: other.id,
          ruleCode: other.rule_code,
          ruleName: other.rule_name,
          description: `与规则"${other.rule_name}"(${other.rule_code})生效时段重叠`,
        });
      }

      const otherConditions = other.trigger_conditions || {};
      const thisConditions = triggerConditions || {};
      const conditionsSame = JSON.stringify(otherConditions) === JSON.stringify(thisConditions);

      if (conditionsSame && thisConditions && Object.keys(thisConditions).length > 0) {
        if (catOverlap || applicableCategory.length === 0 || otherCats.length === 0) {
          conflicts.push({
            type: 'condition_duplicate',
            severity: 'high',
            ruleId: other.id,
            ruleCode: other.rule_code,
            ruleName: other.rule_name,
            description: `与规则"${other.rule_name}"(${other.rule_code})触发条件完全重复`,
          });
        }
      }

      const otherActions = other.actions || [];
      const thisActions = actions || [];

      let hasContradiction = false;
      for (const thisAct of thisActions) {
        for (const otherAct of otherActions) {
          if ((thisAct.type === 'auto_pass' && otherAct.type === 'auto_reject') ||
              (thisAct.type === 'auto_reject' && otherAct.type === 'auto_pass')) {
            if (catOverlap || applicableCategory.length === 0 || otherCats.length === 0) {
              hasContradiction = true;
              break;
            }
          }
        }
        if (hasContradiction) break;
      }

      if (hasContradiction) {
        conflicts.push({
          type: 'logic_contradict',
          severity: 'medium',
          ruleId: other.id,
          ruleCode: other.rule_code,
          ruleName: other.rule_name,
          description: `与规则"${other.rule_name}"(${other.rule_code})动作逻辑相反`,
        });
      }

      const otherParams = other.rule_params || {};
      const thisParams = ruleParams || {};
      const paramKeys = Object.keys(thisParams);
      const sameParams = paramKeys.filter(
        (k) => otherParams[k] !== undefined &&
               JSON.stringify(otherParams[k]) === JSON.stringify(thisParams[k])
      );

      if (sameParams.length >= 3 && catOverlap) {
        conflicts.push({
          type: 'param_duplicate',
          severity: 'low',
          ruleId: other.id,
          ruleCode: other.rule_code,
          ruleName: other.rule_name,
          description: `与规则"${other.rule_name}"(${other.rule_code})有${sameParams.length}个参数重复`,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      totalCount: conflicts.length,
      highCount: conflicts.filter((c) => c.severity === 'high').length,
      mediumCount: conflicts.filter((c) => c.severity === 'medium').length,
      lowCount: conflicts.filter((c) => c.severity === 'low').length,
      conflicts,
    };
  }

  async checkConsistency(ruleType, ruleCategory) {
    const where = { rule_status: RULE_STATUS.ENABLED };
    if (ruleType) where.rule_type = ruleType;
    if (ruleCategory) where.rule_category = ruleCategory;

    const rules = await AuditRule.findAll({ where });

    const categories = new Set();
    let conflictCount = 0;
    let contradictCount = 0;
    let gapCount = 0;

    for (const rule of rules) {
      (rule.applicable_category || []).forEach((c) => categories.add(c));
    }

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const r1 = rules[i];
        const r2 = rules[j];
        const cats1 = r1.applicable_category || [];
        const cats2 = r2.applicable_category || [];
        const catOverlap = cats1.some((c) => cats2.includes(c));
        if (catOverlap) {
          const cond1 = JSON.stringify(r1.trigger_conditions || {});
          const cond2 = JSON.stringify(r2.trigger_conditions || {});
          if (cond1 === cond2 && cond1 !== '{}') conflictCount++;

          const actions1 = r1.actions || [];
          const actions2 = r2.actions || [];
          for (const a1 of actions1) {
            for (const a2 of actions2) {
              if ((a1.type === 'auto_pass' && a2.type === 'auto_reject') ||
                  (a1.type === 'auto_reject' && a2.type === 'auto_pass')) {
                contradictCount++;
              }
            }
          }
        }
      }
    }

    const allCategories = ['article', 'comment', 'shortVideo', 'image', 'video', 'user'];
    const uncoveredCats = allCategories.filter((c) => !categories.has(c));
    gapCount = uncoveredCats.length;

    const totalRules = rules.length;
    const maxScore = 100;
    let score = maxScore;

    score -= conflictCount * 10;
    score -= contradictCount * 8;
    score -= gapCount * 5;
    score = Math.max(0, Math.min(100, score));

    let grade = 'A';
    if (score < 60) grade = 'D';
    else if (score < 75) grade = 'C';
    else if (score < 90) grade = 'B';

    return {
      totalRules,
      coverageCategories: Array.from(categories),
      coverageCount: categories.size,
      uncoveredCategories: uncoveredCats,
      conflictCount,
      contradictCount,
      gapCount,
      consistencyScore: score,
      grade,
      issues: [
        ...(conflictCount > 0 ? [`存在${conflictCount}处条件冲突`] : []),
        ...(contradictCount > 0 ? [`存在${contradictCount}处逻辑矛盾`] : []),
        ...(gapCount > 0 ? [`存在${gapCount}个品类未覆盖: ${uncoveredCats.join(',')}`] : []),
      ],
    };
  }

  async batchAction(params, operatorId, operatorName) {
    const { ids, action, ...options } = params;
    if (!ids || ids.length === 0) throw new BadRequestError('请选择要操作的规则');

    const VALID_ACTIONS = ['enable', 'disable', 'sync', 'delete', 'export'];
    if (!VALID_ACTIONS.includes(action)) {
      throw new BadRequestError(`不支持的批量操作类型，支持: ${VALID_ACTIONS.join(',')}`);
    }

    const rules = await AuditRule.findAll({ where: { id: { [Op.in]: ids } } });
    const operable = [];
    const skipped = [];

    for (const rule of rules) {
      const skipReasons = [];

      switch (action) {
        case 'enable':
          if (rule.rule_status === RULE_STATUS.ENABLED) skipReasons.push('已启用');
          if (rule.is_core_default === 1) {
          }
          break;
        case 'disable':
          if (rule.rule_status !== RULE_STATUS.ENABLED && rule.rule_status !== RULE_STATUS.PENDING_REVIEW) {
            skipReasons.push('非启用/待审核状态');
          }
          break;
        case 'delete':
          if (rule.is_core_default === 1) skipReasons.push('核心规则禁止删除');
          break;
        case 'sync':
          if (!options.targetCategories || options.targetCategories.length === 0) {
            skipReasons.push('缺少目标品类');
          }
          break;
      }

      if (skipReasons.length > 0) {
        skipped.push({ id: rule.id, ruleCode: rule.rule_code, reason: skipReasons.join('; ') });
      } else {
        operable.push(rule);
      }
    }

    const results = [];

    for (const rule of operable) {
      try {
        let result;
        switch (action) {
          case 'enable':
            result = await this.enableRule(rule.id, options);
            break;
          case 'disable':
            result = await this.disableRule(rule.id);
            break;
          case 'delete':
            result = await this.deleteRule(rule.id);
            break;
          case 'sync':
            result = await this.syncRuleToCategories(rule.id, options.targetCategories, operatorId, operatorName);
            break;
        }
        results.push({ id: rule.id, success: true, data: result });
      } catch (err) {
        results.push({ id: rule.id, success: false, error: err.message });
        skipped.push({ id: rule.id, ruleCode: rule.rule_code, reason: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      action,
      totalCount: ids.length,
      successCount,
      failCount,
      skippedCount: skipped.length,
      successIds: results.filter((r) => r.success).map((r) => r.id),
      failIds: results.filter((r) => !r.success).map((r) => r.id),
      skippedDetails: skipped,
    };
  }

  async syncRuleToCategories(ruleId, targetCategories, operatorId, operatorName) {
    const sourceRule = await AuditRule.findByPk(ruleId);
    if (!sourceRule) throw new NotFoundError('源规则不存在');

    const createdRules = [];

    for (const category of targetCategories) {
      const newRuleData = {
        ruleName: `${sourceRule.rule_name}-${category}`,
        ruleType: sourceRule.rule_type,
        ruleCategory: sourceRule.rule_category,
        ruleDescription: sourceRule.rule_description,
        applicableCategory: [category],
        applicableRiskLevels: sourceRule.applicable_risk_levels,
        effectiveStartTime: sourceRule.effective_start_time,
        effectiveEndTime: sourceRule.effective_end_time,
        priority: sourceRule.priority,
        triggerConditions: sourceRule.trigger_conditions,
        actions: sourceRule.actions,
        ruleParams: sourceRule.rule_params,
        sortOrder: sourceRule.sort_order,
        remark: `从${sourceRule.rule_code}同步到${category}品类`,
      };

      const newRule = await this.createRule(newRuleData, operatorId, operatorName);
      createdRules.push(newRule);
    }

    return {
      sourceRuleId: ruleId,
      sourceRuleCode: sourceRule.rule_code,
      targetCategories,
      createdCount: createdRules.length,
      createdRules: createdRules.map((r) => ({ id: r.id, ruleCode: r.ruleCode, ruleName: r.ruleName })),
    };
  }

  async getTraceRecord(ruleCode) {
    const rule = await AuditRule.findOne({ where: { rule_code: ruleCode } });
    if (!rule) throw new NotFoundError('规则不存在');

    const versionHistory = await AuditRuleModifyLog.findAll({
      where: { rule_code: ruleCode },
      order: [['version', 'DESC']],
      limit: 50,
    });

    const versions = {};
    const modifyRecords = [];

    for (const log of versionHistory) {
      if (!versions[log.version]) {
        versions[log.version] = {
          version: log.version,
          effectBatch: log.effect_batch,
          snapshots: { before: log.before_snapshot, after: log.after_snapshot },
          createdAt: log.modify_time,
        };
      }

      modifyRecords.push({
        id: log.id,
        version: log.version,
        modifyType: log.modify_type,
        modifyTypeLabel: log.modify_type_label,
        modifierId: log.modifier_id,
        modifierName: log.modifier_name,
        modifyTime: log.modify_time,
        changeSummary: log.change_summary,
        changedFields: log.changed_fields,
        remark: log.remark,
      });
    }

    const conflictHistory = [];
    const conflictCheck = await this.checkConflicts({
      ruleType: rule.rule_type,
      ruleCategory: rule.rule_category,
      applicableCategory: rule.applicable_category,
      applicableRiskLevels: rule.applicable_risk_levels,
      effectiveStartTime: rule.effective_start_time,
      effectiveEndTime: rule.effective_end_time,
      triggerConditions: rule.trigger_conditions,
      actions: rule.actions,
      ruleParams: rule.rule_params,
    }, rule.id);

    return {
      ruleId: rule.id,
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      currentVersion: rule.version,
      currentStatus: rule.rule_status,
      currentStatusLabel: RULE_STATUS_LABEL[rule.rule_status],
      versionList: Object.values(versions).sort((a, b) => b.version - a.version),
      modifyRecords,
      conflictHistory: conflictCheck.conflicts,
      conflictCount: conflictCheck.totalCount,
    };
  }

  async getModifyHistory(ruleId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await AuditRuleModifyLog.findAndCountAll({
      where: { rule_id: ruleId },
      offset,
      limit: pageSize,
      order: [['modify_time', 'DESC']],
    });

    return {
      list: rows.map((log) => ({
        id: log.id,
        ruleId: log.rule_id,
        ruleCode: log.rule_code,
        version: log.version,
        effectBatch: log.effect_batch,
        modifyType: log.modify_type,
        modifyTypeLabel: log.modify_type_label,
        modifierId: log.modifier_id,
        modifierName: log.modifier_name,
        modifyTime: log.modify_time,
        changeSummary: log.change_summary,
        changedFields: log.changed_fields,
        remark: log.remark,
        beforeSnapshot: log.before_snapshot,
        afterSnapshot: log.after_snapshot,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  getDynamicFields(ruleType, ruleCategory = null) {
    const fields = DEFAULT_DYNAMIC_FIELDS[ruleType];
    if (!fields) {
      throw new BadRequestError(`不支持的规则类型: ${ruleType}`);
    }

    return {
      ruleType,
      ruleCategory,
      triggerConditions: fields.triggerConditions,
      actions: fields.actions,
      ruleParams: fields.ruleParams,
    };
  }

  async exportRules(ruleIds) {
    const where = {};
    if (ruleIds && ruleIds.length > 0) {
      where.id = { [Op.in]: ruleIds };
    }

    const rules = await AuditRule.findAll({ where, order: [['id', 'ASC']] });

    const exportData = rules.map((rule) => ({
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      ruleCategory: rule.rule_category,
      ruleDescription: rule.rule_description,
      applicableCategory: rule.applicable_category,
      applicableRiskLevels: rule.applicable_risk_levels,
      effectiveStartTime: rule.effective_start_time,
      effectiveEndTime: rule.effective_end_time,
      priority: rule.priority,
      ruleStatus: rule.rule_status,
      ruleStatusLabel: RULE_STATUS_LABEL[rule.rule_status],
      isCoreDefault: rule.is_core_default === 1,
      isSystemDefault: rule.is_system_default === 1,
      version: rule.version,
      effectBatch: rule.effect_batch,
      triggerConditions: rule.trigger_conditions,
      actions: rule.actions,
      ruleParams: rule.rule_params,
      sortOrder: rule.sort_order,
      remark: rule.remark,
      createdByName: rule.created_by_name,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    }));

    const csvHeader = [
      '规则编码', '规则名称', '规则类型', '规则分类', '规则描述',
      '适用品类', '适用风险等级', '生效开始时间', '生效结束时间',
      '优先级', '状态', '是否核心', '版本号', '生效批次',
      '触发条件', '执行动作', '规则参数', '排序', '备注',
      '创建人', '创建时间', '更新时间',
    ];

    const csvRows = exportData.map((item) => [
      item.ruleCode,
      `"${(item.ruleName || '').replace(/"/g, '""')}"`,
      item.ruleType,
      item.ruleCategory || '',
      `"${(item.ruleDescription || '').replace(/"/g, '""')}"`,
      (item.applicableCategory || []).join('|'),
      (item.applicableRiskLevels || []).join('|'),
      item.effectiveStartTime || '',
      item.effectiveEndTime || '',
      item.priority,
      item.ruleStatusLabel,
      item.isCoreDefault ? '是' : '否',
      item.version,
      item.effectBatch || '',
      `"${JSON.stringify(item.triggerConditions || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(item.actions || []).replace(/"/g, '""')}"`,
      `"${JSON.stringify(item.ruleParams || {}).replace(/"/g, '""')}"`,
      item.sortOrder,
      `"${(item.remark || '').replace(/"/g, '""')}"`,
      item.createdByName || '',
      item.createdAt,
      item.updatedAt,
    ]);

    const exportId = `EXPORT_AUDIT_RULE_${Date.now()}`;

    return {
      exportId,
      totalCount: exportData.length,
      generatedAt: new Date(),
      jsonData: exportData,
      csv: {
        header: csvHeader,
        rows: csvRows,
        content: [csvHeader.join(','), ...csvRows.map((r) => r.join(','))].join('\n'),
        fileName: `audit_rules_${exportId}.csv`,
      },
    };
  }

  async getCoreDefaultRules() {
    return CORE_DEFAULT_RULES;
  }
}

module.exports = new AuditRuleService();
