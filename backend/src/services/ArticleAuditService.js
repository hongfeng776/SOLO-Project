const { Content, ContentStatusLog, User } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString } = require('../utils/helpers');
const cacheService = require('./CacheService');
const crypto = require('crypto');

const ARTICLE_CATEGORY = 7;

const AUDIT_STATUS = {
  PENDING: 0,
  REVIEWING: 1,
  APPROVED: 2,
  REJECTED: 3,
  SUSPECTED: 6,
};

const RISK_LEVEL = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
};

const AI_RESULT = {
  PASSED: 'passed',
  WARNING: 'warning',
  FAILED: 'failed',
};

const validTransitions = {
  0: [1, 2, 3, 6],
  1: [2, 3, 6],
  6: [1, 2, 3],
  2: [],
  3: [0, 6],
};

const AI_SENSITIVE_WORDS = {
  political: {
    severity: 'high',
    words: ['台独', '港独', '藏独', '法轮功', '邪教', '反党', '反动', '颠覆国家', '敏感政治'],
    score: 12,
  },
  violence: {
    severity: 'high',
    words: ['血腥', '暴力', '凶杀', '自残', '自杀', '虐杀', '恐怖', '枪支', '炸弹', '极端'],
    score: 10,
  },
  pornographic: {
    severity: 'high',
    words: ['色情', '淫荡', '裸体', '性交', '嫖娼', '卖淫', '裸聊', '成人电影', '三级片'],
    score: 12,
  },
  advertisement: {
    severity: 'medium',
    words: ['加微信', '加QQ', '私聊', '代购', '刷单', '兼职日结', '点击链接', '免费领取', '限时优惠', '爆款'],
    score: 6,
  },
  exaggeration: {
    severity: 'low',
    words: ['震惊', '吓尿', '惊呆', '不看后悔', '99%的人', '必看', '绝密', '速看', '删前速看'],
    score: 3,
  },
  contraband: {
    severity: 'high',
    words: ['毒品', '冰毒', '海洛因', '大麻', '赌博', '博彩', '六合彩', '高利贷', '催债', '枪支弹药'],
    score: 12,
  },
};

const FAKE_INFO_PATTERNS = [
  {
    id: 1,
    name: '夸张标题党',
    pattern: /(震惊|重磅|突发|紧急|惊呆|吓傻|炸锅|狂转|疯传|必看)[^，。！？]{0,10}[！!。.]/g,
    score: 4,
    level: 'low',
  },
  {
    id: 2,
    name: '绝对化用语',
    pattern: /(第一|唯一|最好|最优|最强|最大|最小|顶级|极致|完美|100%|绝对|肯定|一定|必然|包治百病|永不复发|根治|药到病除)/g,
    score: 5,
    level: 'medium',
  },
  {
    id: 3,
    name: '谣言式句式',
    pattern: /(专家说|央视曝光|内部消息|绝密文件|不转不是|中国人都在看|刚刚发生|速看即将删除|家人必看|赶紧转发)/g,
    score: 6,
    level: 'medium',
  },
  {
    id: 4,
    name: '伪科学健康',
    pattern: /(喝.*水.*病|吃.*治.*病|按摩穴位.*|一招根治|三分钟治好|七天见效|不用吃药|替代化疗|替代手术|某某某秘方)/g,
    score: 8,
    level: 'high',
  },
  {
    id: 5,
    name: '数据无来源',
    pattern: /(据统计|数据显示|研究表明|调查发现|报告称)[^，。]{0,20}(99%|80%|70%|上亿|千万人|百万)/g,
    score: 5,
    level: 'low',
  },
  {
    id: 6,
    name: '虚假历史',
    pattern: /(你不知道的历史|历史真相|被隐瞒的|鲜为人知的秘密|颠覆你的认知|教科书没说)/g,
    score: 6,
    level: 'medium',
  },
  {
    id: 7,
    name: '恐慌煽动',
    pattern: /(即将|马上|立刻|赶紧|再不.*就.*了|马上要|危机来临|崩盘|暴跌|全面爆发)/g,
    score: 7,
    level: 'high',
  },
  {
    id: 8,
    name: '虚构权威背书',
    pattern: /(院士推荐|教授说|主任提醒|院长建议|中央批准|国务院下发|国家机密|内部文件)/g,
    score: 8,
    level: 'high',
  },
];

const IMAGE_VIOLATION_PATTERNS = {
  keywords: [
    { word: '性感', score: 5, category: 'suggestive' },
    { word: '裸', score: 10, category: 'nudity' },
    { word: '比基尼', score: 4, category: 'suggestive' },
    { word: '内衣', score: 3, category: 'suggestive' },
    { word: '暴', score: 6, category: 'violence' },
    { word: '血', score: 6, category: 'violence' },
    { word: '尸', score: 8, category: 'violence' },
    { word: '赌', score: 8, category: 'gambling' },
    { word: '博彩', score: 8, category: 'gambling' },
    { word: '广告banner', score: 4, category: 'advertisement' },
    { word: '广告', score: 3, category: 'advertisement' },
    { word: '推广', score: 3, category: 'advertisement' },
    { word: '二维码', score: 4, category: 'advertisement' },
    { word: '微信', score: 4, category: 'advertisement' },
    { word: '联系方式', score: 3, category: 'advertisement' },
    { word: 'drug', score: 10, category: 'drugs' },
    { word: 'weed', score: 10, category: 'drugs' },
    { word: 'coke', score: 10, category: 'drugs' },
  ],
  suspiciousExtensions: ['.scr', '.exe', '.bat', '.cmd', '.vbs'],
  suspiciousUrlPatterns: [
    { pattern: /shorturl|bit\.ly|t\.cn|url\.cn/i, score: 2, reason: '短链接需核实' },
    { pattern: /ip[_\-]?addr|server|proxy|vpn/i, score: 3, reason: '疑似代理/VPN推广' },
  ],
};

const QUALITY_CHECK_RULES = {
  minWordCount: 100,
  maxTitleLength: 50,
  minTitleLength: 5,
  requiredFields: ['content_title', 'content_description', 'content_category'],
};

function generateAuditNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ART_AUD${y}${m}${d}${rand}`;
}

function generateLedgerNo() {
  const ts = Date.now().toString();
  const rand = Math.floor(100000 + Math.random() * 900000).toString();
  return `LED${ts}${rand}`;
}

function hashImageUrl(url) {
  return crypto.createHash('md5').update(url || '').digest('hex');
}

function splitIntoParagraphs(text) {
  if (!text) return [];
  return text.split(/[。！？.!?\n]/).filter((p) => p.trim().length > 0);
}

function detectSensitiveWords(title, body, summary) {
  const detected = [];
  let totalScore = 0;
  const categoryHits = {};

  const texts = [
    { field: 'title', text: title || '' },
    { field: 'summary', text: summary || '' },
  ];

  const paragraphs = splitIntoParagraphs(body || '');
  paragraphs.forEach((p, idx) => {
    texts.push({ field: 'body', text: p, paragraphIndex: idx });
  });

  for (const [category, config] of Object.entries(AI_SENSITIVE_WORDS)) {
    for (const word of config.words) {
      for (const textItem of texts) {
        const text = textItem.text;
        let startIndex = 0;
        while (startIndex < text.length) {
          const idx = text.indexOf(word, startIndex);
          if (idx === -1) break;
          detected.push({
            word,
            category,
            severity: config.severity,
            field: textItem.field,
            paragraphIndex: textItem.paragraphIndex ?? 0,
            offset: idx,
            length: word.length,
            context: text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + word.length + 10)),
            scorePerHit: config.score,
          });
          totalScore += config.score;
          categoryHits[category] = (categoryHits[category] || 0) + 1;
          startIndex = idx + word.length;
        }
      }
    }
  }

  const severityBreakdown = { high: 0, medium: 0, low: 0 };
  detected.forEach((d) => {
    severityBreakdown[d.severity] = (severityBreakdown[d.severity] || 0) + 1;
  });

  return {
    detected,
    totalScore,
    count: detected.length,
    categoryHits,
    severityBreakdown,
    positions: detected.map((d) => ({
      field: d.field,
      paragraphIndex: d.paragraphIndex,
      start: d.offset,
      end: d.offset + d.length,
      word: d.word,
      severity: d.severity,
    })),
  };
}

function detectFakeInfo(title, content) {
  const detected = [];
  let totalScore = 0;
  const fullText = `${title || ''} ${content || ''}`;

  for (const pattern of FAKE_INFO_PATTERNS) {
    const matches = fullText.match(new RegExp(pattern.pattern.source, pattern.pattern.flags));
    if (matches && matches.length > 0) {
      matches.forEach((match, idx) => {
        const offset = fullText.indexOf(match, idx * 10);
        detected.push({
          patternId: pattern.id,
          patternName: pattern.name,
          matchText: match,
          level: pattern.level,
          scorePerHit: pattern.score,
          offset: offset >= 0 ? offset : 0,
        });
        totalScore += pattern.score;
      });
    }
  }

  const levelBreakdown = { high: 0, medium: 0, low: 0 };
  detected.forEach((d) => {
    levelBreakdown[d.level] = (levelBreakdown[d.level] || 0) + 1;
  });

  return {
    detected,
    totalScore,
    count: detected.length,
    levelBreakdown,
    patternsHit: [...new Set(detected.map((d) => d.patternName))],
  };
}

function detectInappropriateImages(coverImages, bodyImages, altTexts) {
  const detected = [];
  let totalScore = 0;
  const allImages = [];

  (coverImages || []).forEach((img, idx) => {
    allImages.push({
      url: typeof img === 'string' ? img : img.url || '',
      source: 'cover',
      index: idx,
      alt: (altTexts && altTexts[`cover_${idx}`]) || '',
    });
  });

  (bodyImages || []).forEach((img, idx) => {
    allImages.push({
      url: typeof img === 'string' ? img : img.url || '',
      source: 'body',
      index: idx,
      alt: (altTexts && altTexts[`body_${idx}`]) || (typeof img === 'object' ? img.alt : '') || '',
    });
  });

  const hashMap = {};

  for (const img of allImages) {
    const hash = hashImageUrl(img.url);
    if (hashMap[hash]) {
      detected.push({
        type: 'duplicate',
        severity: 'low',
        score: 2,
        source: img.source,
        index: img.index,
        url: img.url,
        description: `与${hashMap[hash].source}第${hashMap[hash].index + 1}张图片重复`,
      });
      totalScore += 2;
    } else {
      hashMap[hash] = img;
    }

    const urlLower = (img.url || '').toLowerCase();
    const altLower = (img.alt || '').toLowerCase();
    const searchText = `${urlLower} ${altLower}`;

    for (const kwConfig of IMAGE_VIOLATION_PATTERNS.keywords) {
      if (searchText.includes(kwConfig.word.toLowerCase())) {
        detected.push({
          type: 'keyword_match',
          severity: kwConfig.score >= 8 ? 'high' : kwConfig.score >= 5 ? 'medium' : 'low',
          score: kwConfig.score,
          category: kwConfig.category,
          keyword: kwConfig.word,
          source: img.source,
          index: img.index,
          url: img.url,
          matchedIn: urlLower.includes(kwConfig.word.toLowerCase()) ? 'url' : 'alt',
        });
        totalScore += kwConfig.score;
      }
    }

    for (const susp of IMAGE_VIOLATION_PATTERNS.suspiciousUrlPatterns) {
      if (susp.pattern.test(img.url)) {
        detected.push({
          type: 'suspicious_url',
          severity: 'low',
          score: susp.score,
          reason: susp.reason,
          source: img.source,
          index: img.index,
          url: img.url,
        });
        totalScore += susp.score;
      }
    }

    const extMatch = (img.url || '').match(/\.[a-zA-Z0-9]+(\?|$)/);
    if (extMatch) {
      const ext = extMatch[0].split('?')[0].toLowerCase();
      if (IMAGE_VIOLATION_PATTERNS.suspiciousExtensions.includes(ext)) {
        detected.push({
          type: 'suspicious_extension',
          severity: 'high',
          score: 8,
          extension: ext,
          source: img.source,
          index: img.index,
          url: img.url,
        });
        totalScore += 8;
      }
    }
  }

  const categoryHits = {};
  detected.forEach((d) => {
    if (d.category) {
      categoryHits[d.category] = (categoryHits[d.category] || 0) + 1;
    }
  });

  return {
    detected,
    totalScore,
    count: detected.length,
    categoryHits,
    totalImages: allImages.length,
    duplicateCount: detected.filter((d) => d.type === 'duplicate').length,
  };
}

function calculateOverallScore(sensitiveResult, fakeInfoResult, imageResult) {
  const rawScore = (sensitiveResult?.totalScore || 0) + (fakeInfoResult?.totalScore || 0) + (imageResult?.totalScore || 0);
  const score = Math.min(rawScore, 100);
  let result = AI_RESULT.PASSED;
  let requiresManualAudit = false;

  if (score < 15) {
    result = AI_RESULT.PASSED;
    requiresManualAudit = false;
  } else if (score <= 40) {
    result = AI_RESULT.WARNING;
    requiresManualAudit = true;
  } else {
    result = AI_RESULT.FAILED;
    requiresManualAudit = true;
  }

  const hasHighSeveritySensitive = (sensitiveResult?.severityBreakdown?.high || 0) > 0;
  const hasHighLevelFake = (fakeInfoResult?.levelBreakdown?.high || 0) > 0;
  const hasHighImageViolation = (imageResult?.detected || []).some((d) => d.severity === 'high');

  if (hasHighSeveritySensitive || hasHighLevelFake || hasHighImageViolation) {
    result = Math.max(score, 41) > 40 ? AI_RESULT.FAILED : AI_RESULT.WARNING;
    requiresManualAudit = true;
  }

  return {
    score,
    result,
    requiresManualAudit,
    components: {
      sensitiveWords: sensitiveResult?.totalScore || 0,
      fakeInfo: fakeInfoResult?.totalScore || 0,
      imageViolation: imageResult?.totalScore || 0,
    },
  };
}

function calculateRiskLevel(aiScore, aiResult, tagCount) {
  let baseScore = aiScore || 0;
  if (tagCount && tagCount > 10) baseScore += 3;
  if (tagCount && tagCount > 20) baseScore += 5;

  let riskLevel = RISK_LEVEL.LOW;
  if (baseScore >= 70) riskLevel = RISK_LEVEL.EXTREME;
  else if (baseScore >= 45) riskLevel = RISK_LEVEL.HIGH;
  else if (baseScore >= 25) riskLevel = RISK_LEVEL.MEDIUM;

  if (aiResult === AI_RESULT.FAILED && riskLevel < RISK_LEVEL.HIGH) {
    riskLevel = RISK_LEVEL.HIGH;
  }
  if (aiResult === AI_RESULT.WARNING && riskLevel < RISK_LEVEL.MEDIUM) {
    riskLevel = RISK_LEVEL.MEDIUM;
  }

  return riskLevel;
}

class ArticleAuditService {
  async runAiPreScreen(article) {
    const title = article.content_title || '';
    const body = article.content_description || '';
    const summary = article.summary || '';
    const coverImages = article.cover_images || [];
    const bodyImages = article.content_images || [];
    const altTexts = article.image_alt_texts || {};

    const sensitiveResult = detectSensitiveWords(title, body, summary);
    const fakeInfoResult = detectFakeInfo(title, body);
    const imageResult = detectInappropriateImages(coverImages, bodyImages, altTexts);
    const overall = calculateOverallScore(sensitiveResult, fakeInfoResult, imageResult);

    const tagCount = (article.tags || []).length;
    const riskLevel = calculateRiskLevel(overall.score, overall.result, tagCount);

    const suggestions = [];
    if (sensitiveResult.count > 0) {
      suggestions.push(`检测到${sensitiveResult.count}处敏感词，请重点核查`);
    }
    if (fakeInfoResult.count > 0) {
      suggestions.push(`发现${fakeInfoResult.count}处虚假信息模式: ${fakeInfoResult.patternsHit.join('、')}`);
    }
    if (imageResult.duplicateCount > 0) {
      suggestions.push(`存在${imageResult.duplicateCount}张重复图片`);
    }
    if (imageResult.count > 0) {
      suggestions.push(`图片检测发现${imageResult.count}项潜在问题`);
    }
    if (suggestions.length === 0) {
      suggestions.push('AI初审未发现明显问题，建议人工复核确认');
    }

    return {
      articleCode: article.article_code || '',
      articleId: article.id || 0,
      screenTime: new Date(),
      aiScore: overall.score,
      aiResult: overall.result,
      requiresManualAudit: overall.requiresManualAudit,
      riskLevel,
      scoreBreakdown: overall.components,
      sensitiveWords: {
        count: sensitiveResult.count,
        totalScore: sensitiveResult.totalScore,
        severityBreakdown: sensitiveResult.severityBreakdown,
        details: sensitiveResult.detected.slice(0, 50),
        positions: sensitiveResult.positions,
      },
      fakeInfo: {
        count: fakeInfoResult.count,
        totalScore: fakeInfoResult.totalScore,
        levelBreakdown: fakeInfoResult.levelBreakdown,
        patternsHit: fakeInfoResult.patternsHit,
        details: fakeInfoResult.detected.slice(0, 30),
      },
      images: {
        totalImages: imageResult.totalImages,
        count: imageResult.count,
        totalScore: imageResult.totalScore,
        duplicateCount: imageResult.duplicateCount,
        categoryHits: imageResult.categoryHits,
        details: imageResult.detected.slice(0, 50),
      },
      suggestions,
      autoAuditRecommendation: overall.score < 15 ? '建议自动通过' : overall.score <= 40 ? '建议人工复审' : '建议驳回/打回',
    };
  }

  async getAuditPool(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const where = { content_category: ARTICLE_CATEGORY };

    if (query.auditStatus !== undefined && query.auditStatus !== null && query.auditStatus !== '') {
      where.audit_status = Number(query.auditStatus);
    }
    if (query.articleType !== undefined && query.articleType !== null && query.articleType !== '') {
      where.article_type = Number(query.articleType);
    }
    if (query.domainCategory) where.domain_category = query.domainCategory;
    if (query.riskLevel !== undefined && query.riskLevel !== null && query.riskLevel !== '') {
      where.risk_level = Number(query.riskLevel);
    }
    if (query.assignedTo) where.auditor_id = Number(query.assignedTo);
    if (query.articleQuality !== undefined && query.articleQuality !== null && query.articleQuality !== '') {
      where.article_quality = Number(query.articleQuality);
    }
    if (query.isExpired !== undefined && query.isExpired !== null && query.isExpired !== '') {
      where.is_expired = query.isExpired === 'true' ? 1 : 0;
    }
    if (query.publishChannel) where.publish_channel = Number(query.publishChannel);

    if (query.keyword) {
      where[Op.or] = [
        { content_title: { [Op.like]: `%${query.keyword}%` } },
        { article_code: { [Op.like]: `%${query.keyword}%` } },
        { summary: { [Op.like]: `%${query.keyword}%` } },
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
        return {
          taskId: `ART_TASK-${c.id}`,
          articleId: c.id,
          articleCode: c.article_code || '',
          title: c.content_title,
          articleType: c.article_type,
          domainCategory: c.domain_category,
          coverImages: c.cover_images,
          summary: c.summary,
          wordCount: c.word_count,
          auditStatus: c.audit_status,
          auditorId: c.auditor_id,
          auditorName: c.auditor_name,
          auditTime: c.audit_time,
          auditRemark: c.audit_remark,
          priority: c.priority || 0,
          deadline: c.audit_deadline,
          publishChannel: c.publish_channel,
          articleQuality: c.article_quality,
          riskLevel: c.risk_level,
          aiScore: c.ai_score,
          aiResult: c.ai_result,
          creatorId: c.creator_id,
          creatorName: c.creator_name,
          creatorLevel: c.creator_level,
          submittedAt: c.audit_assigned_at || c.created_at,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async getDetail(articleId) {
    const article = await Content.findByPk(articleId);
    if (!article) throw new NotFoundError('图文不存在');

    const aiPreScreen = await this.runAiPreScreen(article);

    const statusLogs = await ContentStatusLog.findAll({
      where: { content_id: articleId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    const reviewHistory = statusLogs
      .filter((log) => log.operation_type === 'AUDIT' || log.operation_type === 'BATCH' || log.operation_type === 'MANUAL')
      .map((log) => ({
        id: log.id,
        auditNo: log.extra_data?.auditNo || '',
        articleId: log.content_id,
        reviewLevel: log.extra_data?.reviewLevel || 1,
        requiredReviewLevel: log.extra_data?.requiredReviewLevel,
        auditStatus: log.to_status,
        auditRemark: log.remark,
        rejectReasonCategory: log.extra_data?.rejectReasonCategory,
        rejectReasonDetail: log.extra_data?.rejectReasonDetail,
        auditorId: log.operator_id,
        auditorName: log.operator_name,
        auditTime: log.created_at,
        fromStatus: log.from_status,
        toStatus: log.to_status,
        riskMatchAnalysis: log.extra_data?.riskMatchAnalysis,
      }));

    const consistency = this.checkContentConsistency(article);

    return {
      basicInfo: {
        id: article.id,
        articleCode: article.article_code,
        title: article.content_title,
        subtitle: article.content_subtitle,
        articleType: article.article_type,
        category: article.content_category,
        domainCategory: article.domain_category,
        summary: article.summary,
        content: article.content_description,
        wordCount: article.word_count,
        coverImages: article.cover_images || [],
        contentImages: article.content_images || [],
        tags: article.tags || [],
        topicId: article.topic_id,
        topicTitle: article.topic_title,
        publishChannel: article.publish_channel,
        publishPermission: article.publish_permission,
        layoutTemplate: article.layout_template,
        isTop: article.is_top,
        topExpireAt: article.top_expire_at,
        weightScore: article.weight_score,
        articleQuality: article.article_quality,
      },
      statusInfo: {
        auditStatus: article.audit_status,
        auditRemark: article.audit_remark,
        auditorId: article.auditor_id,
        auditorName: article.auditor_name,
        auditTime: article.audit_time,
        deadline: article.audit_deadline,
        priority: article.priority || 0,
        statusLogs,
      },
      aiPreScreen,
      consistency,
      reviewHistory,
      creatorInfo: {
        id: article.creator_id || 0,
        uid: article.creator_uid || '',
        name: article.creator_name || '未知',
        level: article.creator_level || 0,
        violationCount: article.violation_count || 0,
        lastViolationType: article.last_violation_type,
        lastViolationAt: article.last_violation_at,
      },
      metrics: {
        viewCount: article.view_count || 0,
        likeCount: article.like_count_article || 0,
        favoriteCount: article.favorite_count || 0,
        commentCount: article.comment_count_article || 0,
        shareCount: article.share_count_article || 0,
      },
    };
  }

  checkContentConsistency(article) {
    const issues = [];
    const warnings = [];

    if (!article.content_title || article.content_title.length < QUALITY_CHECK_RULES.minTitleLength) {
      issues.push(`标题长度不足${QUALITY_CHECK_RULES.minTitleLength}字`);
    }
    if (article.content_title && article.content_title.length > QUALITY_CHECK_RULES.maxTitleLength) {
      warnings.push(`标题长度超过${QUALITY_CHECK_RULES.maxTitleLength}字，建议精简`);
    }
    if (!article.content_description || (article.word_count || 0) < QUALITY_CHECK_RULES.minWordCount) {
      issues.push(`正文内容不足${QUALITY_CHECK_RULES.minWordCount}字`);
    }
    if (!article.summary || article.summary.length < 20) {
      warnings.push('摘要内容过短，建议补充到20字以上');
    }
    if ((article.cover_images || []).length === 0) {
      issues.push('缺少封面图');
    }
    if (!article.content_category) {
      issues.push('未设置内容分类');
    }
    if (!article.domain_category) {
      warnings.push('未设置领域分类，可能影响推荐效果');
    }
    if ((article.tags || []).length === 0) {
      warnings.push('未设置标签，建议添加3-5个相关标签');
    }
    if ((article.tags || []).length > 10) {
      warnings.push('标签数量过多（超过10个），建议精简');
    }

    const titleKeywords = (article.content_title || '').substring(0, 10);
    if (article.content_description && titleKeywords && !article.content_description.includes(titleKeywords)) {
      warnings.push('正文内容未包含标题核心关键词，建议检查一致性');
    }

    const hasInvalidLinks = article.links_valid === 0;
    if (hasInvalidLinks) {
      issues.push(`检测到${(article.invalid_links || []).length}个无效链接`);
    }

    if (article.content_hash) {
      const computedHash = this.computeContentHash(article);
      if (computedHash !== article.content_hash) {
        warnings.push('内容哈希不一致，可能存在未保存的修改');
      }
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      warnings,
      canStartAudit: issues.length === 0,
    };
  }

  computeContentHash(article) {
    const content = [
      article.content_title,
      article.content_description,
      article.summary,
      (article.tags || []).join(','),
      (article.cover_images || []).join('|'),
      (article.content_images || []).join('|'),
    ].join('|||');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async checkDuplicate(articleId) {
    const recentLogs = await ContentStatusLog.findAll({
      where: {
        content_id: articleId,
        operation_type: { [Op.in]: ['AUDIT', 'BATCH'] },
        created_at: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) },
      },
      order: [['created_at', 'DESC']],
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
        result: l.to_status === 2 ? '审核通过' : l.to_status === 3 ? '审核驳回' : l.to_status === 6 ? '疑似违规' : '状态变更',
        action: l.operation_type,
      })),
    };
  }

  validateOperation({ articleId, auditStatus, reviewLevel, aiResult, aiScore, riskLevel }) {
    const errors = [];
    const warnings = [];

    if (auditStatus === AUDIT_STATUS.SUSPECTED) {
      if (!aiResult || aiResult === AI_RESULT.PASSED) {
        warnings.push('标记为疑似违规但AI结果为通过，建议确认判定依据');
      }
      if (riskLevel && riskLevel < RISK_LEVEL.MEDIUM) {
        warnings.push('风险等级低于中风险，标记疑似违规需谨慎');
      }
    }

    if (auditStatus === AUDIT_STATUS.APPROVED) {
      if (aiResult === AI_RESULT.FAILED) {
        warnings.push('AI结果为未通过，人工通过需记录详细原因');
      }
      if (aiScore && aiScore > 40) {
        errors.push(`AI评分${aiScore}超过40分，不可直接通过，需先降级或备注说明`);
      }
    }

    if (auditStatus === AUDIT_STATUS.REJECTED) {
      if (aiResult === AI_RESULT.PASSED && (!riskLevel || riskLevel === RISK_LEVEL.LOW)) {
        warnings.push('AI结果为通过且风险等级低，驳回需填写详细原因');
      }
    }

    if (reviewLevel && riskLevel) {
      const requiredLevel = riskLevel >= RISK_LEVEL.EXTREME ? 3 : riskLevel >= RISK_LEVEL.HIGH ? 2 : 1;
      if (reviewLevel < requiredLevel) {
        warnings.push(`建议由Lv.${requiredLevel}级审核员复核，当前为Lv.${reviewLevel}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateStateTransition(currentStatus, targetStatus) {
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        message: `状态流转非法: 无法从${currentStatus}变更为${targetStatus}，允许流转: ${allowed.join(',')}`,
        allowedTransitions: allowed,
      };
    }
    return { valid: true, allowedTransitions: allowed };
  }

  async handleAiRisk(articleId) {
    const article = await Content.findByPk(articleId);
    if (!article) throw new NotFoundError('图文不存在');

    const aiResult = await this.runAiPreScreen(article);

    const updateData = {
      ai_score: aiResult.aiScore,
      ai_result: aiResult.aiResult,
      risk_level: aiResult.riskLevel,
      sensitive_word_check: aiResult.sensitiveWords.count > 0 ? 2 : 1,
      sensitive_words: aiResult.sensitiveWords.details.map((d) => d.word),
      check_report: {
        aiPreScreenTime: aiResult.screenTime,
        suggestions: aiResult.suggestions,
        scoreBreakdown: aiResult.scoreBreakdown,
      },
    };

    let recommendedStatus = null;
    let recommendedRemark = '';

    if (aiResult.requiresManualAudit) {
      if (aiResult.aiResult === AI_RESULT.FAILED) {
        recommendedStatus = AUDIT_STATUS.SUSPECTED;
        recommendedRemark = `AI检测评分${aiResult.aiScore}分，触发疑似违规，需人工重点复核`;
      } else if (aiResult.aiResult === AI_RESULT.WARNING) {
        recommendedStatus = AUDIT_STATUS.REVIEWING;
        recommendedRemark = `AI检测评分${aiResult.aiScore}分，建议人工复审`;
      }
    }

    await Content.update(updateData, { where: { id: articleId } });
    await cacheService.invalidateContent(articleId);

    return {
      aiResult,
      recommendedStatus,
      recommendedRemark,
      appliedUpdates: Object.keys(updateData),
    };
  }

  async submitAudit(data, auditorId, auditorName) {
    const {
      articleId,
      auditStatus,
      auditRemark,
      rejectReasonCategory,
      rejectReasonDetail,
      reviewLevel,
      requiredReviewLevel,
      nextReviewerId,
      aiScore,
      aiResult,
      riskLevel,
      publishPermission,
      distributionQualification,
    } = data;

    const article = await Content.findByPk(articleId);
    if (!article) throw new NotFoundError('图文不存在');

    const duplicate = await this.checkDuplicate(articleId);
    if (duplicate.isDuplicate) {
      throw new BadRequestError('检测到重复提交（5分钟内多次审核），请稍后再试或刷新页面');
    }

    const stateCheck = this.validateStateTransition(article.audit_status, auditStatus);
    if (!stateCheck.valid) {
      throw new BadRequestError(stateCheck.message);
    }

    if (auditStatus === AUDIT_STATUS.APPROVED) {
      if (article.audit_status === AUDIT_STATUS.APPROVED) {
        throw new BadRequestError('已通过内容禁止修改状态机');
      }
    }

    const consistency = this.checkContentConsistency(article);
    if (!consistency.canStartAudit && auditStatus === AUDIT_STATUS.APPROVED) {
      throw new BadRequestError('内容一致性校验未通过，不可审核通过: ' + consistency.issues.join('; '));
    }

    const operationValidation = this.validateOperation({
      articleId,
      auditStatus,
      reviewLevel: reviewLevel || 1,
      aiResult: aiResult || article.ai_result,
      aiScore: aiScore || article.ai_score,
      riskLevel: riskLevel || article.risk_level,
    });
    if (!operationValidation.valid) {
      throw new BadRequestError('审核操作校验失败: ' + operationValidation.errors.join('; '));
    }

    if (auditStatus === AUDIT_STATUS.SUSPECTED) {
      if (!reviewLevel || reviewLevel < 2) {
        throw new BadRequestError('疑似违规状态需由至少Lv.2级审核员判定');
      }
    }

    if (auditStatus === AUDIT_STATUS.REJECTED) {
      if (!rejectReasonCategory) {
        throw new BadRequestError('审核驳回时必须选择驳回原因分类');
      }
      if (!rejectReasonDetail || rejectReasonDetail.trim().length < 5) {
        throw new BadRequestError('请填写详细的驳回原因（至少5个字符）');
      }
    }

    const auditNo = generateAuditNo();
    const fromStatus = article.audit_status;

    const actualRiskLevel = riskLevel || article.risk_level || 1;
    const actualAiScore = aiScore !== undefined ? aiScore : article.ai_score;
    const actualAiResult = aiResult || article.ai_result;

    const riskMatchAnalysis = this.calculateRiskMatchAnalysis(
      actualAiScore,
      actualAiResult,
      actualRiskLevel,
      auditStatus
    );

    const updateData = {
      audit_status: auditStatus,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      auditor_name: auditorName,
      audit_time: new Date(),
    };

    if (auditStatus === AUDIT_STATUS.APPROVED) {
      updateData.status = 1;
      updateData.latest_published_version = article.version_no || 1;
      if (publishPermission !== undefined) {
        updateData.publish_permission = publishPermission;
      }
      if (distributionQualification !== undefined) {
        updateData.distribution_qualification = distributionQualification;
      }
      if (article.audit_deadline) {
        updateData.audit_completed_at = new Date();
      }
    } else if (auditStatus === AUDIT_STATUS.REJECTED) {
      updateData.status = 0;
      updateData.violation_count = (article.violation_count || 0) + 1;
      if (rejectReasonCategory) {
        updateData.last_violation_type = rejectReasonCategory;
        updateData.last_violation_at = new Date();
      }
    } else if (auditStatus === AUDIT_STATUS.SUSPECTED) {
      updateData.required_review_level = requiredReviewLevel || 2;
    } else if (auditStatus === AUDIT_STATUS.REVIEWING) {
      updateData.audit_assigned_at = new Date();
      if (nextReviewerId) {
        updateData.auditor_id = nextReviewerId;
      }
    }

    await Content.update(updateData, { where: { id: articleId } });

    await ContentStatusLog.create({
      content_id: articleId,
      from_status: fromStatus,
      to_status: auditStatus,
      operator_id: auditorId,
      operator_name: auditorName,
      change_reason: auditStatus === AUDIT_STATUS.APPROVED ? '图文审核通过' :
                      auditStatus === AUDIT_STATUS.REJECTED ? '图文审核驳回' :
                      auditStatus === AUDIT_STATUS.SUSPECTED ? '疑似违规标记' :
                      '进入审核中',
      remark: auditRemark,
      operation_type: 'AUDIT',
      ip_address: '',
      extra_data: {
        auditNo,
        reviewLevel: reviewLevel || 1,
        requiredReviewLevel,
        rejectReasonCategory,
        rejectReasonDetail,
        nextReviewerId,
        aiScore: actualAiScore,
        aiResult: actualAiResult,
        riskLevel: actualRiskLevel,
        publishPermission,
        distributionQualification,
        riskMatchAnalysis,
        warnings: operationValidation.warnings,
      },
    });

    await cacheService.invalidateContent(articleId);
    await cacheService.invalidateDashboard();

    return {
      auditNo,
      articleId,
      fromStatus,
      toStatus: auditStatus,
      riskMatchAnalysis,
      warnings: operationValidation.warnings,
    };
  }

  calculateRiskMatchAnalysis(aiScore, aiResult, riskLevel, finalAuditStatus) {
    const analysis = {
      aiScore,
      aiResult,
      riskLevel,
      finalAuditStatus,
      matchLevel: 'consistent',
      deviationDegree: 0,
      reasons: [],
    };

    if (finalAuditStatus === AUDIT_STATUS.APPROVED) {
      if (aiResult === AI_RESULT.FAILED) {
        analysis.matchLevel = 'high_deviation';
        analysis.deviationDegree = 3;
        analysis.reasons.push('AI判定为未通过但人工通过，存在较大偏差');
      } else if (aiResult === AI_RESULT.WARNING) {
        analysis.matchLevel = 'slight_deviation';
        analysis.deviationDegree = 1;
        analysis.reasons.push('AI警告但人工通过');
      }
      if (riskLevel >= RISK_LEVEL.HIGH) {
        analysis.deviationDegree = Math.max(analysis.deviationDegree, 2);
        analysis.matchLevel = analysis.deviationDegree >= 3 ? 'high_deviation' : 'moderate_deviation';
        analysis.reasons.push(`风险等级Lv.${riskLevel}却审核通过`);
      }
    } else if (finalAuditStatus === AUDIT_STATUS.REJECTED) {
      if (aiResult === AI_RESULT.PASSED && riskLevel === RISK_LEVEL.LOW) {
        analysis.matchLevel = 'slight_deviation';
        analysis.deviationDegree = 1;
        analysis.reasons.push('AI通过且低风险但人工驳回');
      } else if (aiResult === AI_RESULT.FAILED || riskLevel >= RISK_LEVEL.HIGH) {
        analysis.reasons.push('AI结果与人工驳回一致');
      }
    } else if (finalAuditStatus === AUDIT_STATUS.SUSPECTED) {
      if (aiResult === AI_RESULT.PASSED) {
        analysis.matchLevel = 'moderate_deviation';
        analysis.deviationDegree = 2;
        analysis.reasons.push('AI通过但人工标记疑似违规');
      } else {
        analysis.reasons.push('AI结果与疑似违规标记方向一致');
      }
    }

    return analysis;
  }

  async batchAction(params, operatorId, operatorName) {
    const { ids, action, auditRemark, rejectReasonCategory, rejectReasonDetail } = params;
    if (!ids || ids.length === 0) throw new BadRequestError('请选择要操作的图文');

    const VALID_ACTIONS = ['approve_low_risk', 'mark_overdue', 'review_suspected', 'reject'];
    if (!VALID_ACTIONS.includes(action)) {
      throw new BadRequestError(`不支持的批量操作类型，支持: ${VALID_ACTIONS.join(',')}`);
    }

    const articles = await Content.findAll({ where: { id: { [Op.in]: ids }, content_category: ARTICLE_CATEGORY } });
    const operable = [];
    const skipped = [];

    for (const article of articles) {
      const skipReason = [];

      switch (action) {
        case 'approve_low_risk':
          if ((article.ai_score || 0) >= 15) skipReason.push('AI评分≥15分，不符合低风险快速通过');
          if (article.ai_result !== AI_RESULT.PASSED) skipReason.push('AI结果非passed，不可低风险通过');
          if (article.audit_status === AUDIT_STATUS.APPROVED) skipReason.push('已通过');
          if (article.audit_status === AUDIT_STATUS.REJECTED) skipReason.push('已驳回');
          const consistency = this.checkContentConsistency(article);
          if (!consistency.canStartAudit) skipReason.push('内容不完整: ' + consistency.issues.join(','));
          break;
        case 'mark_overdue':
          if (!article.audit_deadline) skipReason.push('未设置审核截止时间');
          if (new Date(article.audit_deadline) >= new Date()) skipReason.push('未到截止时间');
          if (article.audit_status !== AUDIT_STATUS.PENDING && article.audit_status !== AUDIT_STATUS.REVIEWING) {
            skipReason.push('仅待审核/审核中状态可标记超时');
          }
          break;
        case 'review_suspected':
          if (article.audit_status !== AUDIT_STATUS.SUSPECTED) skipReason.push('非疑似违规状态');
          break;
        case 'reject':
          if (!rejectReasonCategory) skipReason.push('缺少驳回原因分类');
          if (article.audit_status === AUDIT_STATUS.REJECTED) skipReason.push('已驳回');
          if (article.audit_status === AUDIT_STATUS.APPROVED) skipReason.push('已通过不可驳回');
          break;
      }

      const stateCheck = skipReason.length === 0 ? this.getBatchTargetStatus(action, article.audit_status) : null;
      if (stateCheck && !stateCheck.allowed) {
        skipReason.push(stateCheck.reason);
      }

      if (skipReason.length > 0) {
        skipped.push({ id: article.id, articleCode: article.article_code, reason: skipReason.join('; ') });
      } else {
        operable.push({ article, targetStatus: stateCheck.status });
      }
    }

    const batchAuditNo = generateAuditNo();

    for (const { article, targetStatus } of operable) {
      const fromStatus = article.audit_status;
      const updateData = { auditor_id: operatorId, auditor_name: operatorName, audit_time: new Date() };
      let changeReason = '';
      const extraData = { batchAuditNo, batchAction: action };

      switch (action) {
        case 'approve_low_risk':
          updateData.audit_status = AUDIT_STATUS.APPROVED;
          updateData.status = 1;
          updateData.audit_remark = auditRemark || '批量低风险快速通过';
          updateData.latest_published_version = article.version_no || 1;
          changeReason = '批量低风险通过';
          extraData.reviewLevel = 1;
          extraData.autoApproved = true;
          extraData.aiScore = article.ai_score;
          extraData.aiResult = article.ai_result;
          break;
        case 'mark_overdue':
          updateData.audit_status = targetStatus;
          updateData.audit_remark = (auditRemark ? auditRemark + '；' : '') + `超时标记：截止时间${article.audit_deadline}`;
          changeReason = '审核超时标记';
          extraData.overdueAt = new Date();
          extraData.originalDeadline = article.audit_deadline;
          break;
        case 'review_suspected':
          updateData.audit_status = AUDIT_STATUS.REVIEWING;
          updateData.required_review_level = 2;
          updateData.audit_remark = auditRemark || '疑似违规发起复核，转入二级审核';
          updateData.audit_assigned_at = new Date();
          changeReason = '疑似违规发起复核';
          extraData.requiredReviewLevel = 2;
          break;
        case 'reject':
          updateData.audit_status = AUDIT_STATUS.REJECTED;
          updateData.status = 0;
          updateData.audit_remark = auditRemark || '批量审核驳回';
          updateData.violation_count = (article.violation_count || 0) + 1;
          updateData.last_violation_type = rejectReasonCategory;
          updateData.last_violation_at = new Date();
          changeReason = '批量审核驳回';
          extraData.rejectReasonCategory = rejectReasonCategory;
          extraData.rejectReasonDetail = rejectReasonDetail;
          break;
      }

      await Content.update(updateData, { where: { id: article.id } });

      await ContentStatusLog.create({
        content_id: article.id,
        from_status: fromStatus,
        to_status: updateData.audit_status ?? fromStatus,
        operator_id: operatorId,
        operator_name: operatorName,
        change_reason: changeReason,
        remark: updateData.audit_remark,
        operation_type: 'BATCH',
        extra_data: extraData,
      });

      await cacheService.invalidateContent(article.id);
    }

    await cacheService.invalidateDashboard();

    return {
      action,
      successCount: operable.length,
      skippedCount: skipped.length,
      successIds: operable.map((o) => o.article.id),
      skippedIds: skipped.map((s) => s.id),
      skippedDetails: skipped,
      batchAuditNo,
    };
  }

  getBatchTargetStatus(action, currentStatus) {
    switch (action) {
      case 'approve_low_risk':
        return { status: AUDIT_STATUS.APPROVED, allowed: true };
      case 'mark_overdue':
        return { status: AUDIT_STATUS.PENDING, allowed: true };
      case 'review_suspected':
        return { status: AUDIT_STATUS.REVIEWING, allowed: true };
      case 'reject':
        return { status: AUDIT_STATUS.REJECTED, allowed: true };
      default:
        return { status: currentStatus, allowed: false, reason: '未知操作类型' };
    }
  }

  async exportLedger(params) {
    const {
      startDate,
      endDate,
      auditStatus,
      auditorId,
      articleType,
      domainCategory,
      riskLevel,
      page = 1,
      pageSize = 100,
    } = params;

    const where = { content_category: ARTICLE_CATEGORY };

    if (startDate && endDate) {
      where.audit_time = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (auditStatus !== undefined && auditStatus !== null && auditStatus !== '') {
      where.audit_status = Number(auditStatus);
    } else {
      where.audit_status = { [Op.in]: [AUDIT_STATUS.APPROVED, AUDIT_STATUS.REJECTED, AUDIT_STATUS.SUSPECTED] };
    }
    if (auditorId) where.auditor_id = Number(auditorId);
    if (articleType !== undefined && articleType !== null && articleType !== '') {
      where.article_type = Number(articleType);
    }
    if (domainCategory) where.domain_category = domainCategory;
    if (riskLevel !== undefined && riskLevel !== null && riskLevel !== '') {
      where.risk_level = Number(riskLevel);
    }

    const offset = (page - 1) * pageSize;

    const { count, rows } = await Content.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['audit_time', 'DESC']],
    });

    const ledgerItems = [];
    for (const article of rows) {
      const logs = await ContentStatusLog.findAll({
        where: {
          content_id: article.id,
          operation_type: { [Op.in]: ['AUDIT', 'BATCH'] },
        },
        order: [['created_at', 'ASC']],
      });

      const lastAuditLog = logs[logs.length - 1];
      const firstAuditLog = logs[0];

      const statusLabel = {
        0: '待审核', 1: '审核中', 2: '审核通过', 3: '审核驳回', 6: '疑似违规',
      }[article.audit_status] || '未知';

      const riskLabel = { 1: '低风险', 2: '中风险', 3: '高风险', 4: '极高风险' }[article.risk_level] || '-';
      const qualityLabel = { 0: '低质', 1: '普通', 2: '优质', 3: '精品' }[article.article_quality] || '-';

      const processDuration = firstAuditLog && lastAuditLog
        ? Math.round((new Date(lastAuditLog.created_at) - new Date(firstAuditLog.created_at)) / 60000)
        : 0;

      ledgerItems.push({
        ledgerNo: generateLedgerNo(),
        articleCode: article.article_code || `ART-${article.id}`,
        articleId: article.id,
        title: article.content_title,
        articleType: article.article_type,
        domainCategory: article.domain_category,
        auditAction: article.audit_status === 2 ? '通过' : article.audit_status === 3 ? '驳回' : article.audit_status === 6 ? '疑似违规' : '其他',
        auditStatus,
        auditStatusLabel: statusLabel,
        auditNo: lastAuditLog?.extra_data?.auditNo || '',
        auditTime: article.audit_time,
        auditorId: article.auditor_id,
        auditorName: article.auditor_name || '系统',
        reviewLevel: lastAuditLog?.extra_data?.reviewLevel || 1,
        rejectReasonCategory: lastAuditLog?.extra_data?.rejectReasonCategory || '',
        rejectReasonDetail: lastAuditLog?.extra_data?.rejectReasonDetail || '',
        riskLevel: article.risk_level,
        riskLevelLabel: riskLabel,
        aiScore: article.ai_score || 0,
        aiResult: article.ai_result || '-',
        articleQuality: article.article_quality,
        articleQualityLabel: qualityLabel,
        publishPermission: article.publish_permission,
        publishChannel: article.publish_channel,
        creatorName: article.creator_name || '-',
        creatorLevel: article.creator_level,
        processDurationMinutes: processDuration,
        auditRemark: article.audit_remark || '',
        submissionTime: article.created_at,
        completedTime: article.audit_status === 2 || article.audit_status === 3 ? article.audit_time : null,
        wordCount: article.word_count || 0,
        tagCount: (article.tags || []).length,
        imageCount: (article.content_images || []).length + (article.cover_images || []).length,
      });
    }

    const stats = {
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      approved: ledgerItems.filter((i) => i.auditStatus === 2).length,
      rejected: ledgerItems.filter((i) => i.auditStatus === 3).length,
      suspected: ledgerItems.filter((i) => i.auditStatus === 6).length,
      avgProcessDuration: ledgerItems.length > 0
        ? Math.round(ledgerItems.reduce((s, i) => s + i.processDurationMinutes, 0) / ledgerItems.length)
        : 0,
      avgAiScore: ledgerItems.length > 0
        ? Math.round(ledgerItems.reduce((s, i) => s + i.aiScore, 0) / ledgerItems.length)
        : 0,
    };

    const exportId = `EXPORT_ART_AUD_${Date.now()}`;
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : 'all';
    const fileName = `article_audit_ledger_${dateRange}_${exportId}.csv`;

    const csvHeader = [
      '台账编号', '图文编码', '标题', '分类', '领域',
      '审核动作', '审核状态', '审核单号', '审核时间',
      '审核人ID', '审核人', '审核级别',
      '驳回原因分类', '驳回原因详情',
      '风险等级', 'AI评分', 'AI结果',
      '内容质量', '发布权限', '发布渠道',
      '创作者', '创作者等级',
      '处理时长(分钟)', '字数', '标签数', '图片数',
      '审核备注', '提交时间', '完成时间',
    ];

    const csvRows = ledgerItems.map((item) => [
      item.ledgerNo, item.articleCode, `"${(item.title || '').replace(/"/g, '""')}"`,
      item.articleType, item.domainCategory,
      item.auditAction, item.auditStatusLabel, item.auditNo, item.auditTime,
      item.auditorId, item.auditorName, `Lv.${item.reviewLevel}`,
      item.rejectReasonCategory, `"${(item.rejectReasonDetail || '').replace(/"/g, '""')}"`,
      item.riskLevelLabel, item.aiScore, item.aiResult,
      item.articleQualityLabel, item.publishPermission, item.publishChannel,
      item.creatorName, item.creatorLevel,
      item.processDurationMinutes, item.wordCount, item.tagCount, item.imageCount,
      `"${(item.auditRemark || '').replace(/"/g, '""')}"`, item.submissionTime, item.completedTime,
    ]);

    return {
      exportId,
      fileName,
      generatedAt: new Date(),
      stats,
      ledgerItems,
      csv: {
        header: csvHeader,
        rows: csvRows,
        content: [csvHeader.join(','), ...csvRows.map((r) => r.join(','))].join('\n'),
      },
      filters: { startDate, endDate, auditStatus, auditorId, articleType, domainCategory, riskLevel },
    };
  }

  async getTraceRecord(articleCode, options = {}) {
    const where = {};
    if (articleCode) {
      where.article_code = articleCode;
    } else if (options.articleId) {
      where.id = Number(options.articleId);
    } else {
      throw new BadRequestError('请提供articleCode或articleId');
    }

    const article = await Content.findOne({ where });
    if (!article) throw new NotFoundError('图文不存在');

    const allLogs = await ContentStatusLog.findAll({
      where: { content_id: article.id },
      order: [['created_at', 'ASC']],
      limit: 100,
    });

    const auditLogs = allLogs.filter(
      (l) => l.operation_type === 'AUDIT' || l.operation_type === 'BATCH' || l.operation_type === 'MANUAL'
    );

    const currentHash = this.computeContentHash(article);
    const hashHistory = [];
    const hashChanges = [];
    let lastHash = null;
    for (const log of allLogs) {
      const logHash = log.extra_data?.contentHash;
      if (logHash && logHash !== lastHash) {
        hashHistory.push({ time: log.created_at, hash: logHash, source: 'log' });
        if (lastHash) {
          hashChanges.push({
            changedAt: log.created_at,
            fromHash: lastHash,
            toHash: logHash,
            changedBy: log.operator_name,
            operation: log.operation_type,
          });
        }
        lastHash = logHash;
      }
    }
    if (currentHash !== lastHash) {
      hashHistory.push({ time: new Date(), hash: currentHash, source: 'current' });
      if (lastHash) {
        hashChanges.push({
          changedAt: new Date(),
          fromHash: lastHash,
          toHash: currentHash,
          changedBy: 'current_state',
          operation: 'content_update',
        });
      }
    }

    const timeline = allLogs.map((log) => {
      const actionLabels = {
        CREATE: '创建',
        AUDIT: '审核',
        BATCH: '批量操作',
        MANUAL: '手动变更',
        SYSTEM: '系统触发',
        UPDATE: '内容更新',
      };
      const statusLabels = {
        0: '待审核', 1: '审核中', 2: '审核通过', 3: '审核驳回', 6: '疑似违规',
      };
      return {
        time: log.created_at,
        action: actionLabels[log.operation_type] || log.operation_type,
        operator: log.operator_name || '系统',
        operatorId: log.operator_id,
        detail: log.change_reason || log.remark || '',
        fromStatus: statusLabels[log.from_status] || `状态${log.from_status}`,
        toStatus: statusLabels[log.to_status] || `状态${log.to_status}`,
        auditNo: log.extra_data?.auditNo,
        reviewLevel: log.extra_data?.reviewLevel,
      };
    });

    const lastAudit = auditLogs[auditLogs.length - 1];
    const riskMatchAnalysisList = auditLogs
      .filter((l) => l.extra_data?.riskMatchAnalysis)
      .map((l) => ({
        auditNo: l.extra_data.auditNo || '',
        auditTime: l.created_at,
        auditor: l.operator_name,
        ...l.extra_data.riskMatchAnalysis,
      }));

    const highRiskApproved = auditLogs.filter(
      (l) =>
        l.to_status === AUDIT_STATUS.APPROVED &&
        (l.extra_data?.riskLevel >= RISK_LEVEL.HIGH || l.extra_data?.aiResult === AI_RESULT.FAILED)
    );

    const fiveMinDuplicates = [];
    for (let i = 0; i < auditLogs.length; i++) {
      for (let j = i + 1; j < auditLogs.length; j++) {
        const diff = (new Date(auditLogs[j].created_at) - new Date(auditLogs[i].created_at)) / 60000;
        if (diff <= 5 && diff > 0) {
          fiveMinDuplicates.push({
            firstAudit: {
              auditNo: auditLogs[i].extra_data?.auditNo,
              time: auditLogs[i].created_at,
              auditor: auditLogs[i].operator_name,
              status: auditLogs[i].to_status,
            },
            secondAudit: {
              auditNo: auditLogs[j].extra_data?.auditNo,
              time: auditLogs[j].created_at,
              auditor: auditLogs[j].operator_name,
              status: auditLogs[j].to_status,
            },
            intervalMinutes: Math.round(diff * 10) / 10,
          });
        }
      }
    }

    const anomalies = [];
    if (fiveMinDuplicates.length > 0) {
      anomalies.push({
        type: 'duplicate_audit',
        severity: 'warning',
        count: fiveMinDuplicates.length,
        description: `检测到${fiveMinDuplicates.length}次5分钟内重复审核`,
        details: fiveMinDuplicates,
      });
    }
    if (hashChanges.length > 1) {
      anomalies.push({
        type: 'hash_inconsistency',
        severity: hashChanges.some((h) => h.operation === 'AUDIT') ? 'high' : 'info',
        count: hashChanges.length,
        description: `内容哈希经历${hashChanges.length}次变更，需确认审核期间是否被修改`,
        details: hashChanges,
      });
    }
    if (highRiskApproved.length > 0) {
      anomalies.push({
        type: 'high_risk_passed',
        severity: 'high',
        count: highRiskApproved.length,
        description: `${highRiskApproved.length}次高风险内容被通过，建议重点复核`,
        details: highRiskApproved.map((l) => ({
          auditNo: l.extra_data?.auditNo,
          time: l.created_at,
          auditor: l.operator_name,
          riskLevel: l.extra_data?.riskLevel,
          aiResult: l.extra_data?.aiResult,
          aiScore: l.extra_data?.aiScore,
        })),
      });
    }

    const reviewSteps = [];
    const reviewLevelLogs = { 1: null, 2: null, 3: null };
    for (const log of auditLogs) {
      const lvl = log.extra_data?.reviewLevel || 1;
      if (!reviewLevelLogs[lvl]) reviewLevelLogs[lvl] = log;
    }
    for (let lvl = 1; lvl <= 3; lvl++) {
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
        if (log.to_status === AUDIT_STATUS.APPROVED) {
          status = 'completed';
          result = '通过';
        } else if (log.to_status === AUDIT_STATUS.REJECTED) {
          status = 'rejected';
          result = '驳回';
        } else if (log.to_status === AUDIT_STATUS.SUSPECTED) {
          status = 'warning';
          result = '疑似违规';
        } else if (log.to_status === AUDIT_STATUS.REVIEWING) {
          status = 'in_progress';
          result = '审核中';
        }
        remark = log.remark || '';
      }

      reviewSteps.push({ level: lvl, name: levelName, reviewer, status, result, remark, time });
    }

    const currentStep = stepsFilter(reviewSteps);

    return {
      articleCode: article.article_code || `ART-${article.id}`,
      articleId: article.id,
      title: article.content_title,
      currentStatus: article.audit_status,
      currentStatusLabel: { 0: '待审核', 1: '审核中', 2: '审核通过', 3: '审核驳回', 6: '疑似违规' }[article.audit_status] || '未知',
      currentReviewer: article.auditor_name || '待分配',
      totalSteps: 3,
      currentStep,
      reviewSteps,
      hashHistory,
      hashChangesCount: hashChanges.length,
      timeline,
      auditCount: auditLogs.length,
      riskMatchAnalysis: riskMatchAnalysisList,
      anomalies,
      creatorInfo: {
        id: article.creator_id || 0,
        name: article.creator_name || '未知',
        level: article.creator_level || 0,
        violationCount: article.violation_count || 0,
      },
    };
  }

  async getQCReport(params) {
    const { period = 'week', startDate, endDate, auditorId, articleType, domainCategory } = params;
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

    const logWhere = {
      operation_type: { [Op.in]: ['AUDIT', 'BATCH'] },
      created_at: { [Op.between]: [from, to] },
    };
    if (auditorId) logWhere.operator_id = Number(auditorId);

    const logs = await ContentStatusLog.findAll({ where: logWhere, order: [['created_at', 'ASC']] });

    const contentIds = [...new Set(logs.map((l) => l.content_id))];
    const articleLogs = [];
    for (const log of logs) {
      const content = await Content.findByPk(log.content_id);
      if (content && content.content_category === ARTICLE_CATEGORY) {
        const typeMatch = articleType === undefined || articleType === null || articleType === '' || Number(articleType) === content.article_type;
        if (typeMatch) {
          if (!domainCategory || content.domain_category === domainCategory) {
            articleLogs.push({ log, content });
          }
        }
      }
    }

    const totalAudited = articleLogs.length;
    const approved = articleLogs.filter((x) => x.log.to_status === AUDIT_STATUS.APPROVED).length;
    const rejected = articleLogs.filter((x) => x.log.to_status === AUDIT_STATUS.REJECTED).length;
    const suspected = articleLogs.filter((x) => x.log.to_status === AUDIT_STATUS.SUSPECTED).length;
    const reviewing = articleLogs.filter((x) => x.log.to_status === AUDIT_STATUS.REVIEWING).length;

    const passRate = totalAudited > 0 ? Math.round((approved / totalAudited) * 100) : 0;

    const auditorMap = {};
    const exceptions = [];
    const contentLogMap = {};

    for (const { log, content } of articleLogs) {
      const aid = log.operator_id || 0;
      if (!auditorMap[aid]) {
        auditorMap[aid] = {
          auditorId: aid,
          auditorName: log.operator_name || '未知',
          totalCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          suspectedCount: 0,
          exceptionCount: 0,
        };
      }
      auditorMap[aid].totalCount++;
      if (log.to_status === AUDIT_STATUS.APPROVED) auditorMap[aid].approvedCount++;
      if (log.to_status === AUDIT_STATUS.REJECTED) auditorMap[aid].rejectedCount++;
      if (log.to_status === AUDIT_STATUS.SUSPECTED) auditorMap[aid].suspectedCount++;

      if (!contentLogMap[log.content_id]) contentLogMap[log.content_id] = [];
      contentLogMap[log.content_id].push({ log, content });
    }

    for (const [cid, clogList] of Object.entries(contentLogMap)) {
      if (clogList.length >= 3) {
        const lastThree = clogList.slice(-3);
        if (lastThree.every((x) => x.log.to_status === AUDIT_STATUS.APPROVED && x.log.operator_id === clogList[0].log.operator_id)) {
          const last = lastThree[lastThree.length - 1];
          exceptions.push({
            id: exceptions.length + 1,
            type: 'repeat_approval',
            typeLabel: '重复通过异常',
            severity: 'warning',
            articleId: Number(cid),
            articleCode: last.content.article_code || '',
            title: last.content.content_title || '',
            auditNo: last.log.extra_data?.auditNo || '',
            auditorId: last.log.operator_id,
            auditorName: last.log.operator_name,
            description: '该图文短时间内多次通过审核，疑似操作过快',
            suggestedAction: '建议人工复核',
            status: 0,
            createdAt: last.log.created_at,
          });
          if (auditorMap[last.log.operator_id]) auditorMap[last.log.operator_id].exceptionCount++;
        }
      }

      for (let i = 1; i < clogList.length; i++) {
        const prev = clogList[i - 1];
        const curr = clogList[i];
        const timeDiff = (new Date(curr.log.created_at) - new Date(prev.log.created_at)) / 1000;
        if (timeDiff < 3 && curr.log.operation_type === 'AUDIT') {
          exceptions.push({
            id: exceptions.length + 1,
            type: 'duplicate_submit',
            typeLabel: '重复提交',
            severity: 'info',
            articleId: Number(cid),
            articleCode: curr.content.article_code || '',
            title: curr.content.content_title || '',
            auditNo: curr.log.extra_data?.auditNo || '',
            auditorId: curr.log.operator_id,
            auditorName: curr.log.operator_name,
            description: `两次审核间隔仅${timeDiff.toFixed(1)}秒`,
            suggestedAction: '检查是否误操作',
            status: 0,
            createdAt: curr.log.created_at,
          });
          if (auditorMap[curr.log.operator_id]) auditorMap[curr.log.operator_id].exceptionCount++;
        }
      }

      const highRiskPassed = clogList.filter(
        (x) =>
          x.log.to_status === AUDIT_STATUS.APPROVED &&
          (x.content.risk_level >= RISK_LEVEL.HIGH || x.log.extra_data?.aiResult === AI_RESULT.FAILED)
      );
      for (const hrp of highRiskPassed) {
        exceptions.push({
          id: exceptions.length + 1,
          type: 'high_risk_passed',
          typeLabel: '高风险通过',
          severity: 'high',
          articleId: Number(cid),
          articleCode: hrp.content.article_code || '',
          title: hrp.content.content_title || '',
          auditNo: hrp.log.extra_data?.auditNo || '',
          auditorId: hrp.log.operator_id,
          auditorName: hrp.log.operator_name,
          description: `风险等级Lv.${hrp.content.risk_level || hrp.log.extra_data?.riskLevel}的内容被通过`,
          suggestedAction: '必须人工重点复核',
          status: 0,
          createdAt: hrp.log.created_at,
        });
        if (auditorMap[hrp.log.operator_id]) auditorMap[hrp.log.operator_id].exceptionCount++;
      }
    }

    const auditorStats = Object.values(auditorMap).map((a) => {
      const approvalRate = a.totalCount > 0 ? Math.round((a.approvedCount / a.totalCount) * 100) : 0;
      const efficiencyScore = Math.max(0, 100 - a.exceptionCount * 8 - Math.abs(approvalRate - 70) * 0.5);
      return {
        auditorId: a.auditorId,
        auditorName: a.auditorName,
        totalCount: a.totalCount,
        approvedCount: a.approvedCount,
        rejectedCount: a.rejectedCount,
        suspectedCount: a.suspectedCount,
        exceptionCount: a.exceptionCount,
        approvalRate,
        efficiencyScore: Math.round(efficiencyScore),
      };
    });

    const riskDistribution = { low: 0, medium: 0, high: 0, extreme: 0 };
    const aiResultDist = { passed: 0, warning: 0, failed: 0 };
    for (const { content } of articleLogs) {
      const rl = content.risk_level || 1;
      if (rl === 1) riskDistribution.low++;
      else if (rl === 2) riskDistribution.medium++;
      else if (rl === 3) riskDistribution.high++;
      else riskDistribution.extreme++;
      const ar = content.ai_result;
      if (ar === 'passed') aiResultDist.passed++;
      else if (ar === 'warning') aiResultDist.warning++;
      else if (ar === 'failed') aiResultDist.failed++;
    }

    const exceptionCount = exceptions.length;
    const exceptionRate = totalAudited > 0 ? +((exceptionCount / totalAudited) * 100).toFixed(2) : 0;

    const highRiskApproveList = exceptions.filter((e) => e.type === 'high_risk_passed').map((e) => ({ ...e }));
    const summary = {
      strengths: [
        exceptionRate < 5 ? '异常率低于5%，整体审核质量良好' : '审核覆盖面完整',
        auditorStats.some((a) => a.efficiencyScore >= 80) ? '多位审核员效率评分优秀' : '团队协作顺畅',
      ].filter(Boolean),
      weaknesses: [
        exceptionCount > 0 ? `共发现${exceptionCount}项审核异常需关注` : '暂未发现明显问题',
        highRiskApproveList.length > 0 ? `${highRiskApproveList.length}项高风险内容被通过` : '',
      ].filter(Boolean),
      suggestions: [
        '建议每周开展图文审核标准培训',
        '高风险内容严格执行多级复核机制',
        '对AI预警内容重点关注，降低误判率',
      ],
    };

    return {
      id: 1,
      reportNo: `QR-ART-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`,
      reportDate: now.toISOString(),
      period: period === 'week' ? '近7天' : period === 'month' ? '近30天' : period === 'today' ? '今日' : '自定义',
      dateRange: { start: from, end: to },
      filters: { auditorId, articleType, domainCategory },
      totalAudited,
      approved,
      rejected,
      suspected,
      reviewing,
      passRate,
      exceptionCount,
      exceptionRate,
      riskDistribution,
      aiResultDistribution: aiResultDist,
      auditorStats,
      exceptionList: exceptions,
      summary,
    };
  }
}

function stepsFilter(steps) {
  const completed = steps.filter((s) => s.status === 'completed').length;
  const inProgress = steps.some((s) => s.status === 'in_progress' || s.status === 'warning');
  return Math.min(completed + (inProgress ? 1 : 0), steps.length);
}

module.exports = new ArticleAuditService();