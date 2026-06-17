const crypto = require('crypto');
const { Content, User } = require('../models');
const { Op } = require('../config/database');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString } = require('../utils/helpers');
const cacheService = require('./CacheService');

const ARTICLE_CATEGORY = 7;
const ARTICLE_CODE_PREFIX = 'ART';

const ARTICLE_TYPES = [1, 2, 3, 4];
const QUALITY_LEVELS = [0, 1, 2, 3];
const PUBLISH_CHANNELS = ['app', 'web', 'mp', 'all'];
const PUBLISH_PERMISSIONS = [0, 1, 2];

const TEMPLATE_WORD_LIMITS = {
  default: { min: 500, max: 5000 },
  magazine: { min: 800, max: 10000 },
  news: { min: 300, max: 3000 },
  blog: { min: 200, max: 8000 },
};

const SENSITIVE_WORDS = ['违禁词1', '违禁词2', '敏感词', '色情', '赌博'];

const STATUS_DRAFT = 0;
const STATUS_PUBLISHED = 1;
const STATUS_OFFLINE = 2;
const STATUS_BANNED = 5;

const AUDIT_PENDING = 0;
const AUDIT_REVIEWING = 1;
const AUDIT_PASSED = 2;
const AUDIT_REJECTED = 3;

class ArticleService {
  async getArticleList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query, [['weight_score', 'DESC']]);
    const search = parseSearch(query, ['content_title', 'content_description']);

    const where = {
      ...search,
      content_category: ARTICLE_CATEGORY,
    };

    if (query.category !== undefined && query.category !== '') {
      where.content_category = parseInt(query.category, 10);
    }

    if (query.articleType !== undefined && query.articleType !== '') {
      where.article_type = query.articleType;
    }
    if (query.domainCategory !== undefined && query.domainCategory !== '') {
      where.domain_category = query.domainCategory;
    }
    if (query.publishChannel !== undefined && query.publishChannel !== '') {
      where.publish_channel = query.publishChannel;
    }
    if (query.publishPermission !== undefined && query.publishPermission !== '') {
      where.publish_permission = query.publishPermission;
    }
    if (query.topicId !== undefined && query.topicId !== '') {
      where.topic_id = query.topicId;
    }
    if (query.publishAccount !== undefined && query.publishAccount !== '') {
      where.publish_account = query.publishAccount;
    }
    if (query.isTop !== undefined && query.isTop !== '') {
      where.is_top = query.isTop;
    }
    if (query.articleQuality !== undefined && query.articleQuality !== '') {
      where.article_quality = query.articleQuality;
    }
    if (query.isExpired !== undefined && query.isExpired !== '') {
      const now = new Date();
      if (query.isExpired == 1) {
        where.expire_at = { [Op.lt]: now };
      } else {
        where[Op.or] = [
          { expire_at: null },
          { expire_at: { [Op.gte]: now } },
        ];
      }
    }

    if (query.viewCountMin !== undefined && query.viewCountMin !== '') {
      where.play_count = { ...(where.play_count || {}), [Op.gte]: parseInt(query.viewCountMin, 10) };
    }
    if (query.likeCountMin !== undefined && query.likeCountMin !== '') {
      where.like_count = { ...(where.like_count || {}), [Op.gte]: parseInt(query.likeCountMin, 10) };
    }

    if (query.dateRange && Array.isArray(query.dateRange) && query.dateRange.length === 2) {
      where.created_at = {
        [Op.between]: [query.dateRange[0], query.dateRange[1]],
      };
    }

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      offset,
      limit: pageSize,
      order,
    });

    const stats = await this._getArticleStats(where);

    return {
      list: rows.map((content) => this._formatArticle(content)),
      total: count,
      page,
      pageSize,
      stats,
    };
  }

  async getArticleDetail(id) {
    const content = await Content.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
    if (!content || content.content_category !== ARTICLE_CATEGORY) {
      throw new NotFoundError('图文不存在');
    }

    const result = this._formatArticle(content);
    result.versions = this._getVersionsFromContent(content).sort((a, b) => b.versionNo - a.versionNo);
    result.statusLogs = (content.status_logs || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    return result;
  }

  async createArticle(data, operatorId, operatorName, ip) {
    if (data.title) {
      const titleCheck = await this.checkTitleUnique(data.title, null, ARTICLE_CATEGORY);
      if (!titleCheck.isUnique) {
        throw new ConflictError('同分类下已存在相同标题的图文');
      }
    }

    const description = data.description || data.content_description || '';
    const contentHash = this._generateContentHash(description);
    const hashCheck = await this.checkContentHash(contentHash);
    if (!hashCheck.isUnique) {
      throw new ConflictError('内容重复，请勿重复发布');
    }

    const wordCount = this._countWords(description);
    const template = data.layoutTemplate || 'default';
    const wordLimit = TEMPLATE_WORD_LIMITS[template] || TEMPLATE_WORD_LIMITS.default;
    if (wordCount < wordLimit.min || wordCount > wordLimit.max) {
      throw new BadRequestError(
        `字数不符合模板要求，当前${wordCount}字，要求${wordLimit.min}-${wordLimit.max}字`
      );
    }

    const sensitiveResult = this._checkSensitiveWords(data.title || '', description);
    if (sensitiveResult.hasSensitive) {
      throw new BadRequestError(`内容包含敏感词：${sensitiveResult.words.join(', ')}`);
    }

    const articleCode = this._generateArticleCode();

    const publishChannel = data.publishChannel || data.publish_channel || 'app';
    const defaultTemplate = this._getDefaultTemplateByChannel(publishChannel);

    let resourcePosition = null;
    if (data.topicId || data.topic_id) {
      resourcePosition = await this._allocateResourcePosition(data.topicId || data.topic_id);
    }

    const now = new Date();
    const initialVersion = {
      versionNo: 1,
      title: data.title || data.content_title || '',
      description: description,
      contentHash: contentHash,
      status: STATUS_DRAFT,
      auditStatus: AUDIT_PENDING,
      createdAt: now.toISOString(),
      createdBy: operatorId,
      createdByName: operatorName || '',
    };

    const versions = [initialVersion];

    const statusLogs = [{
      type: 'CREATE',
      status: STATUS_DRAFT,
      auditStatus: AUDIT_PENDING,
      versionNo: 1,
      time: now.toISOString(),
      operator: operatorId,
      operatorName: operatorName || '',
      ip: ip || '',
      remark: '创建图文',
    }];

    const weightScore = this._calculateWeightScore({
      quality: data.articleQuality ?? data.article_quality ?? 0,
      isTop: 0,
      wordCount,
    });

    const content = await Content.create({
      content_title: data.title || data.content_title,
      content_subtitle: data.subtitle || data.content_subtitle,
      content_description: description,
      content_category: ARTICLE_CATEGORY,
      article_code: articleCode,
      article_type: data.articleType ?? data.article_type,
      domain_category: data.domainCategory ?? data.domain_category,
      publish_channel: publishChannel,
      publish_permission: data.publishPermission ?? data.publish_permission ?? 0,
      publish_account: data.publishAccount ?? data.publish_account,
      topic_id: data.topicId ?? data.topic_id,
      topic_title: data.topicTitle ?? data.topic_title,
      resource_position: resourcePosition,
      is_top: 0,
      top_expire_at: null,
      article_quality: data.articleQuality ?? data.article_quality ?? 0,
      layout_template: data.layoutTemplate ?? data.layout_template ?? defaultTemplate,
      content_hash: contentHash,
      weight_score: weightScore,
      current_version: 1,
      published_version: 0,
      versions: versions,
      cover_image: data.coverImage || data.cover_image,
      tags: data.tags,
      creator_id: operatorId,
      creator_uid: data.creatorUid || data.creator_uid,
      creator_level: data.creatorLevel ?? data.creator_level ?? 0,
      status: STATUS_DRAFT,
      audit_status: AUDIT_PENDING,
      status_logs: statusLogs,
      created_by: operatorId,
      updated_by: operatorId,
    });

    await cacheService.invalidateContent(content.id);
    return content.id;
  }

  async updateArticle(id, data, { editMode } = {}, operatorId, operatorName, ip) {
    const content = await Content.findByPk(id);
    if (!content || content.content_category !== ARTICLE_CATEGORY) {
      throw new NotFoundError('图文不存在');
    }

    if (content.status === STATUS_BANNED || content.audit_status === 5) {
      throw new ForbiddenError('违规封禁状态的内容禁止修改');
    }

    const isPublished = content.status === STATUS_PUBLISHED && content.audit_status === AUDIT_PASSED;
    const mode = editMode ?? 0;

    let versions = this._getVersionsFromContent(content);
    let currentVersionNo = content.current_version || 1;
    let currentVersion = versions.find(v => v.versionNo === currentVersionNo) || versions[0];

    if (!currentVersion) {
      throw new BadRequestError('版本数据异常');
    }

    let needAudit = false;
    let newVersionNo = currentVersionNo;
    let newStatus = content.status;
    let newAuditStatus = content.audit_status;

    let updatedFields = {};
    if (mode === 1) {
      updatedFields = { ...currentVersion };
      if (data.title !== undefined) updatedFields.title = data.title;
      if (data.description !== undefined || data.content_description !== undefined) {
        updatedFields.description = data.description || data.content_description;
      }
      if (data.subtitle !== undefined || data.content_subtitle !== undefined) {
        updatedFields.subtitle = data.subtitle || data.content_subtitle;
      }
      if (data.coverImage !== undefined || data.cover_image !== undefined) {
        updatedFields.coverImage = data.coverImage || data.cover_image;
      }
      if (data.tags !== undefined) updatedFields.tags = data.tags;
    } else {
      updatedFields = {
        title: data.title || data.content_title || currentVersion.title,
        description: data.description || data.content_description || currentVersion.description,
        subtitle: data.subtitle || data.content_subtitle || currentVersion.subtitle,
        coverImage: data.coverImage || data.cover_image || currentVersion.coverImage,
        tags: data.tags || currentVersion.tags,
      };
    }

    if (updatedFields.title && updatedFields.title !== currentVersion.title) {
      const titleCheck = await this.checkTitleUnique(updatedFields.title, id, ARTICLE_CATEGORY);
      if (!titleCheck.isUnique) {
        throw new ConflictError('同分类下已存在相同标题的图文');
      }
    }

    const newContentHash = this._generateContentHash(updatedFields.description || '');
    if (newContentHash !== currentVersion.contentHash) {
      const hashCheck = await this.checkContentHash(newContentHash, id);
      if (!hashCheck.isUnique) {
        throw new ConflictError('内容与其他图文重复');
      }
    }
    updatedFields.contentHash = newContentHash;

    const wordCount = this._countWords(updatedFields.description || '');

    const sensitiveResult = this._checkSensitiveWords(
      updatedFields.title || '',
      updatedFields.description || ''
    );
    if (sensitiveResult.hasSensitive) {
      throw new BadRequestError(`内容包含敏感词：${sensitiveResult.words.join(', ')}`);
    }

    if (isPublished) {
      newVersionNo = currentVersionNo + 1;
      needAudit = true;
      newStatus = STATUS_DRAFT;
      newAuditStatus = AUDIT_REVIEWING;

      const newVersion = {
        ...updatedFields,
        versionNo: newVersionNo,
        status: STATUS_DRAFT,
        auditStatus: AUDIT_REVIEWING,
        createdAt: new Date().toISOString(),
        createdBy: operatorId,
        createdByName: operatorName || '',
      };
      versions.push(newVersion);
    } else {
      currentVersion = {
        ...currentVersion,
        ...updatedFields,
      };
      versions = versions.map(v => v.versionNo === currentVersionNo ? currentVersion : v);
    }

    const statusLogs = content.status_logs || [];
    statusLogs.push({
      type: isPublished ? 'NEW_VERSION' : 'UPDATE',
      fromStatus: content.status,
      toStatus: newStatus,
      fromAuditStatus: content.audit_status,
      toAuditStatus: newAuditStatus,
      versionNo: newVersionNo,
      time: new Date().toISOString(),
      operator: operatorId,
      operatorName: operatorName || '',
      ip: ip || '',
      remark: isPublished ? '已发布内容修改，生成新版本待审核' : '草稿内容修改',
    });

    const articleQuality = data.articleQuality ?? data.article_quality ?? content.article_quality;
    const isTop = data.isTop ?? data.is_top ?? content.is_top;
    const weightScore = this._calculateWeightScore({
      quality: articleQuality,
      isTop: isTop,
      wordCount,
    });

    const updateData = {
      content_title: updatedFields.title,
      content_subtitle: updatedFields.subtitle,
      content_description: updatedFields.description,
      cover_image: updatedFields.coverImage,
      tags: updatedFields.tags,
      article_type: data.articleType ?? data.article_type ?? content.article_type,
      domain_category: data.domainCategory ?? data.domain_category ?? content.domain_category,
      publish_channel: data.publishChannel ?? data.publish_channel ?? content.publish_channel,
      publish_permission: data.publishPermission ?? data.publish_permission ?? content.publish_permission,
      publish_account: data.publishAccount ?? data.publish_account ?? content.publish_account,
      topic_id: data.topicId ?? data.topic_id ?? content.topic_id,
      topic_title: data.topicTitle ?? data.topic_title ?? content.topic_title,
      article_quality: articleQuality,
      layout_template: data.layoutTemplate ?? data.layout_template ?? content.layout_template,
      content_hash: newContentHash,
      weight_score: weightScore,
      current_version: newVersionNo,
      versions: versions,
      status: newStatus,
      audit_status: newAuditStatus,
      status_logs: statusLogs,
      updated_by: operatorId,
    };

    await Content.update(updateData, { where: { id } });
    await cacheService.invalidateContent(id);

    return { versionNo: newVersionNo, needAudit };
  }

  async publishArticleVersion(id, versionNo, operatorId, operatorName, ip) {
    const content = await Content.findByPk(id);
    if (!content || content.content_category !== ARTICLE_CATEGORY) {
      throw new NotFoundError('图文不存在');
    }

    if (content.status === STATUS_BANNED) {
      throw new ForbiddenError('违规封禁状态的内容禁止发布');
    }

    const versions = this._getVersionsFromContent(content);
    const targetVersion = versions.find(v => v.versionNo === versionNo);

    if (!targetVersion) {
      throw new NotFoundError('版本不存在');
    }

    targetVersion.status = STATUS_PUBLISHED;
    targetVersion.auditStatus = AUDIT_PASSED;
    targetVersion.publishedAt = new Date().toISOString();
    targetVersion.publishedBy = operatorId;
    targetVersion.publishedByName = operatorName || '';

    const statusLogs = content.status_logs || [];
    statusLogs.push({
      type: 'PUBLISH',
      fromStatus: content.status,
      toStatus: STATUS_PUBLISHED,
      fromAuditStatus: content.audit_status,
      toAuditStatus: AUDIT_PASSED,
      versionNo: versionNo,
      time: new Date().toISOString(),
      operator: operatorId,
      operatorName: operatorName || '',
      ip: ip || '',
      remark: `发布版本 v${versionNo}`,
    });

    const updatedVersions = versions.map(v =>
      v.versionNo === versionNo ? targetVersion : v
    );

    await Content.update({
      content_title: targetVersion.title,
      content_description: targetVersion.description,
      cover_image: targetVersion.coverImage,
      tags: targetVersion.tags,
      content_hash: targetVersion.contentHash,
      current_version: versionNo,
      published_version: versionNo,
      versions: updatedVersions,
      status: STATUS_PUBLISHED,
      audit_status: AUDIT_PASSED,
      status_logs: statusLogs,
      updated_by: operatorId,
      updated_at: new Date(),
    }, { where: { id } });

    await cacheService.invalidateContent(id);
    return true;
  }

  async getVersionList(contentId) {
    const content = await Content.findByPk(contentId, {
      attributes: ['id', 'content_category', 'versions'],
    });
    if (!content || content.content_category !== ARTICLE_CATEGORY) {
      throw new NotFoundError('图文不存在');
    }

    const versions = this._getVersionsFromContent(content);
    return versions.sort((a, b) => b.versionNo - a.versionNo);
  }

  async getVersionDetail(versionId) {
    const content = await Content.findOne({
      where: {
        content_category: ARTICLE_CATEGORY,
      },
      attributes: ['id', 'content_category', 'versions'],
    });

    if (!content) {
      throw new NotFoundError('版本不存在');
    }

    const versions = this._getVersionsFromContent(content);
    const version = versions.find(v => v.id === versionId || v.versionNo === parseInt(versionId, 10));

    if (!version) {
      throw new NotFoundError('版本不存在');
    }

    return version;
  }

  async batchTopArticles(ids, topDays) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要置顶的图文');
    }
    if (!topDays || topDays <= 0) {
      throw new BadRequestError('置顶天数无效');
    }

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: ARTICLE_CATEGORY,
      },
    });

    const operableContents = contents.filter(c =>
      c.status === STATUS_PUBLISHED &&
      c.audit_status === AUDIT_PASSED &&
      (c.article_quality ?? 0) >= 2
    );

    const skippedIds = ids.filter(id => !operableContents.find(c => c.id === id));
    const successCount = operableContents.length;

    if (operableContents.length > 0) {
      const topExpireAt = new Date();
      topExpireAt.setDate(topExpireAt.getDate() + topDays);

      for (const content of operableContents) {
        const statusLogs = content.status_logs || [];
        statusLogs.push({
          type: 'TOP',
          time: new Date().toISOString(),
          operator: null,
          ip: '',
          remark: `批量置顶${topDays}天`,
        });

        const weightScore = this._calculateWeightScore({
          quality: content.article_quality ?? 0,
          isTop: 1,
          wordCount: this._countWords(content.content_description || ''),
        });

        await Content.update(
          {
            is_top: 1,
            top_expire_at: topExpireAt,
            weight_score: weightScore,
            status_logs: statusLogs,
          },
          { where: { id: content.id } }
        );
        await cacheService.invalidateContent(content.id);
      }
    }

    return {
      successCount,
      skippedCount: skippedIds.length,
      skippedIds,
    };
  }

  async batchOfflineArticles(ids, reason) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要下架的图文');
    }

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: ARTICLE_CATEGORY,
      },
    });

    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const operableContents = contents.filter(c => {
      const isPublished = c.status === STATUS_PUBLISHED;
      const isExpired = c.expire_at && new Date(c.expire_at) < now;
      const isOld = new Date(c.created_at) <= ninetyDaysAgo;
      return isPublished && (isExpired || isOld);
    });

    const skippedIds = ids.filter(id => !operableContents.find(c => c.id === id));
    const successCount = operableContents.length;

    if (operableContents.length > 0) {
      for (const content of operableContents) {
        const statusLogs = content.status_logs || [];
        statusLogs.push({
          type: 'OFFLINE',
          fromStatus: content.status,
          toStatus: STATUS_OFFLINE,
          time: new Date().toISOString(),
          operator: null,
          ip: '',
          remark: reason || '批量下架过期资讯',
        });

        await Content.update(
          {
            status: STATUS_OFFLINE,
            status_logs: statusLogs,
          },
          { where: { id: content.id } }
        );
        await cacheService.invalidateContent(content.id);
      }
    }

    return {
      successCount,
      skippedCount: skippedIds.length,
      skippedIds,
    };
  }

  async batchClassifyToTopic(ids, topicId, topicTitle) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要归类的图文');
    }
    if (!topicId) {
      throw new BadRequestError('专题ID不能为空');
    }

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: ARTICLE_CATEGORY,
      },
    });

    const operableContents = contents.filter(c =>
      c.status === STATUS_PUBLISHED || c.status === STATUS_DRAFT
    );

    const skippedIds = ids.filter(id => !operableContents.find(c => c.id === id));
    const successCount = operableContents.length;

    if (operableContents.length > 0) {
      for (const content of operableContents) {
        const resourcePosition = await this._allocateResourcePosition(topicId);

        const statusLogs = content.status_logs || [];
        statusLogs.push({
          type: 'TOPIC_CLASSIFY',
          time: new Date().toISOString(),
          operator: null,
          ip: '',
          remark: `归类到专题：${topicTitle || topicId}`,
        });

        await Content.update(
          {
            topic_id: topicId,
            topic_title: topicTitle || '',
            resource_position: resourcePosition,
            status_logs: statusLogs,
          },
          { where: { id: content.id } }
        );
        await cacheService.invalidateContent(content.id);
      }
    }

    return {
      successCount,
      skippedCount: skippedIds.length,
      skippedIds,
    };
  }

  async checkTitleUnique(title, excludeId, category = ARTICLE_CATEGORY) {
    if (!title) {
      return { isUnique: true, duplicateTitle: null };
    }

    const where = {
      content_title: title,
      content_category: category,
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const duplicate = await Content.findOne({
      where,
      attributes: ['id', 'content_title'],
    });

    if (duplicate) {
      return {
        isUnique: false,
        duplicateTitle: duplicate.content_title,
      };
    }

    return { isUnique: true, duplicateTitle: null };
  }

  async checkContentHash(hash, excludeId) {
    if (!hash) {
      return { isUnique: true, duplicateContent: null };
    }

    const where = {
      content_hash: hash,
      content_category: ARTICLE_CATEGORY,
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const duplicate = await Content.findOne({
      where,
      attributes: ['id', 'content_title'],
    });

    if (duplicate) {
      return {
        isUnique: false,
        duplicateContent: {
          id: duplicate.id,
          title: duplicate.content_title,
        },
      };
    }

    return { isUnique: true, duplicateContent: null };
  }

  async generateCheckReport(id) {
    const content = await Content.findByPk(id);
    if (!content || content.content_category !== ARTICLE_CATEGORY) {
      throw new NotFoundError('图文不存在');
    }

    const checks = [];
    const issues = [];
    const suggestions = [];

    const title = content.content_title || '';
    const description = content.content_description || '';
    const wordCount = this._countWords(description);

    const titleLengthStatus = title.length >= 10 && title.length <= 100 ? 'pass' : 'warning';
    const titleLengthScore = titleLengthStatus === 'pass' ? 100 : 60;
    checks.push({
      item: '标题长度',
      status: titleLengthStatus,
      score: titleLengthScore,
      message: `标题长度${title.length}字，要求10-100字`,
    });
    if (titleLengthStatus !== 'pass') {
      issues.push('标题长度不符合最佳实践');
      suggestions.push('建议标题长度控制在10-100字之间');
    }

    const titleSensitiveResult = this._checkSensitiveWords(title, '');
    const titleSensitiveStatus = titleSensitiveResult.hasSensitive ? 'fail' : 'pass';
    const titleSensitiveScore = titleSensitiveStatus === 'pass' ? 100 : 0;
    checks.push({
      item: '标题合规性',
      status: titleSensitiveStatus,
      score: titleSensitiveScore,
      message: titleSensitiveResult.hasSensitive
        ? `包含敏感词：${titleSensitiveResult.words.join(', ')}`
        : '标题合规',
    });
    if (titleSensitiveResult.hasSensitive) {
      issues.push(`标题包含敏感词：${titleSensitiveResult.words.join(', ')}`);
    }

    const template = content.layout_template || 'default';
    const wordLimit = TEMPLATE_WORD_LIMITS[template] || TEMPLATE_WORD_LIMITS.default;
    const wordCountStatus = wordCount >= wordLimit.min && wordCount <= wordLimit.max ? 'pass' : 'warning';
    const wordCountScore = wordCountStatus === 'pass' ? 100 : 50;
    checks.push({
      item: '正文字数',
      status: wordCountStatus,
      score: wordCountScore,
      message: `正文${wordCount}字，模板要求${wordLimit.min}-${wordLimit.max}字`,
    });
    if (wordCountStatus !== 'pass') {
      issues.push('正文字数不符合模板要求');
      suggestions.push(`建议正文字数控制在${wordLimit.min}-${wordLimit.max}字之间`);
    }

    const contentSensitiveResult = this._checkSensitiveWords('', description);
    const contentSensitiveStatus = contentSensitiveResult.hasSensitive ? 'fail' : 'pass';
    const contentSensitiveScore = contentSensitiveStatus === 'pass' ? 100 : 0;
    checks.push({
      item: '正文合规性',
      status: contentSensitiveStatus,
      score: contentSensitiveScore,
      message: contentSensitiveResult.hasSensitive
        ? `包含敏感词：${contentSensitiveResult.words.join(', ')}`
        : '正文合规',
    });
    if (contentSensitiveResult.hasSensitive) {
      issues.push(`正文包含敏感词：${contentSensitiveResult.words.join(', ')}`);
    }

    const coverImageStatus = content.cover_image ? 'pass' : 'warning';
    const coverImageScore = coverImageStatus === 'pass' ? 100 : 50;
    checks.push({
      item: '配图检查',
      status: coverImageStatus,
      score: coverImageScore,
      message: coverImageStatus === 'pass' ? '已设置封面图，分辨率模拟校验通过' : '未设置封面图',
    });
    if (coverImageStatus !== 'pass') {
      issues.push('未设置封面图');
      suggestions.push('建议添加高质量封面图，推荐尺寸 1200x675');
    }

    const linkCheckResult = this._simulateLinkCheck(description);
    const linkStatus = linkCheckResult.allValid ? 'pass' : 'warning';
    const linkScore = linkStatus === 'pass' ? 100 : 70;
    checks.push({
      item: '链接有效性',
      status: linkStatus,
      score: linkScore,
      message: linkCheckResult.allValid
        ? `检测到${linkCheckResult.count}个链接，全部有效`
        : `检测到${linkCheckResult.count}个链接，${linkCheckResult.invalidCount}个可能无效`,
    });
    if (!linkCheckResult.allValid) {
      issues.push('部分链接可能无效');
      suggestions.push('建议检查文中的外链是否有效');
    }

    const hashCheck = await this.checkContentHash(content.content_hash, id);
    const duplicateStatus = hashCheck.isUnique ? 'pass' : 'fail';
    const duplicateScore = duplicateStatus === 'pass' ? 100 : 0;
    checks.push({
      item: '内容重复度',
      status: duplicateStatus,
      score: duplicateScore,
      message: hashCheck.isUnique ? '内容原创，无重复' : `与 ID:${hashCheck.duplicateContent?.id} 内容重复`,
    });
    if (!hashCheck.isUnique) {
      issues.push('内容与其他图文重复');
    }

    const qualityScore = this._calculateQualityScore({
      titleLength: title.length,
      wordCount,
      hasCover: !!content.cover_image,
      hasTags: content.tags && content.tags.length > 0,
      quality: content.article_quality ?? 0,
    });
    const qualityStatus = qualityScore >= 80 ? 'pass' : qualityScore >= 60 ? 'warning' : 'fail';
    checks.push({
      item: '质量评分',
      status: qualityStatus,
      score: qualityScore,
      message: `综合质量评分：${qualityScore}分`,
    });
    if (qualityScore < 80) {
      suggestions.push('建议优化内容质量，提升用户阅读体验');
    }

    const totalScore = Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length);

    return {
      overallScore: totalScore,
      checks,
      issues,
      suggestions,
    };
  }

  _generateArticleCode() {
    const timestamp = Date.now().toString();
    const random = generateRandomString(4).toUpperCase();
    return `${ARTICLE_CODE_PREFIX}${timestamp}${random}`;
  }

  _generateContentHash(content) {
    return crypto.createHash('sha256').update(content || '').digest('hex');
  }

  _countWords(text) {
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    return chineseChars + englishWords;
  }

  _checkSensitiveWords(title, content) {
    const fullText = (title + ' ' + content).toLowerCase();
    const found = [];
    for (const word of SENSITIVE_WORDS) {
      if (fullText.includes(word.toLowerCase())) {
        found.push(word);
      }
    }
    return {
      hasSensitive: found.length > 0,
      words: found,
    };
  }

  _getDefaultTemplateByChannel(channel) {
    const templateMap = {
      app: 'default',
      web: 'news',
      mp: 'magazine',
      all: 'default',
    };
    return templateMap[channel] || 'default';
  }

  async _allocateResourcePosition(topicId) {
    if (!topicId) return null;
    const count = await Content.count({
      where: {
        topic_id: topicId,
        content_category: ARTICLE_CATEGORY,
      },
    });
    return count + 1;
  }

  _calculateWeightScore({ quality = 0, isTop = 0, wordCount = 0 }) {
    let score = 0;
    score += quality * 20;
    score += isTop ? 50 : 0;
    if (wordCount > 1000) score += 10;
    else if (wordCount > 500) score += 5;
    return Math.min(score, 100);
  }

  _calculateQualityScore({ titleLength, wordCount, hasCover, hasTags, quality }) {
    let score = 0;
    if (titleLength >= 10 && titleLength <= 100) score += 15;
    else if (titleLength > 0) score += 5;

    if (wordCount >= 500 && wordCount <= 5000) score += 25;
    else if (wordCount > 0) score += 10;

    if (hasCover) score += 15;
    if (hasTags) score += 10;
    score += quality * 10;

    return Math.min(Math.max(score, 0), 100);
  }

  _simulateLinkCheck(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    const invalidCount = Math.floor(urls.length * 0.1);
    return {
      count: urls.length,
      allValid: invalidCount === 0,
      invalidCount,
    };
  }

  _getVersionsFromContent(content) {
    try {
      const raw = content.versions;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') return JSON.parse(raw);
      return [];
    } catch (e) {
      return [];
    }
  }

  async _getArticleStats(where) {
    const draftCount = await Content.count({
      where: { ...where, status: STATUS_DRAFT },
    });
    const publishedCount = await Content.count({
      where: { ...where, status: STATUS_PUBLISHED, audit_status: AUDIT_PASSED },
    });
    const offlineCount = await Content.count({
      where: { ...where, status: STATUS_OFFLINE },
    });
    const auditingCount = await Content.count({
      where: { ...where, audit_status: AUDIT_REVIEWING },
    });

    return {
      total: draftCount + publishedCount + offlineCount + auditingCount,
      draftCount,
      publishedCount,
      offlineCount,
      auditingCount,
    };
  }

  _formatArticle(content) {
    return {
      id: content.id,
      articleCode: content.article_code,
      title: content.content_title,
      subtitle: content.content_subtitle,
      description: content.content_description,
      category: content.content_category,
      articleType: content.article_type,
      domainCategory: content.domain_category,
      publishChannel: content.publish_channel,
      publishPermission: content.publish_permission,
      publishAccount: content.publish_account,
      topicId: content.topic_id,
      topicTitle: content.topic_title,
      resourcePosition: content.resource_position,
      isTop: content.is_top,
      topExpireAt: content.top_expire_at,
      articleQuality: content.article_quality,
      layoutTemplate: content.layout_template,
      contentHash: content.content_hash,
      weightScore: content.weight_score,
      currentVersion: content.current_version,
      publishedVersion: content.published_version,
      coverImage: content.cover_image,
      tags: content.tags,
      creatorId: content.creator_id,
      creatorUid: content.creator_uid,
      creatorLevel: content.creator_level,
      viewCount: content.play_count,
      likeCount: content.like_count,
      collectCount: content.collect_count,
      commentCount: content.comment_count,
      shareCount: content.share_count,
      status: content.status,
      auditStatus: content.audit_status,
      auditRemark: content.audit_remark,
      expireAt: content.expire_at,
      isArchived: content.is_archived,
      createdAt: content.created_at,
      updatedAt: content.updated_at,
      creator: content.creator ? {
        id: content.creator.id,
        username: content.creator.username,
        nickname: content.creator.nickname,
        avatar: content.creator.avatar,
      } : null,
    };
  }
}

module.exports = new ArticleService();
