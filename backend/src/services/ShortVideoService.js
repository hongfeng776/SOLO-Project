const { Content, User } = require('../models');
const { Op } = require('../config/database');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');
const redis = require('../config/redis');
const cacheService = require('./CacheService');

const SHORT_VIDEO_CATEGORY = 6;
const MAX_VIDEO_DURATION = 600;
const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov'];
const VIDEO_QUALITY_LEVELS = [0, 1, 2, 3];

const STATUS_TRANSITIONS = {
  0: [1],
  1: [0, 2],
  2: [3, 5],
  3: [2],
  5: [3],
};

class ShortVideoService {
  async getShortVideoList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['content_title', 'creator_uid']);

    const where = {
      ...search,
      content_category: SHORT_VIDEO_CATEGORY,
    };

    if (query.status !== undefined && query.status !== '') where.status = query.status;
    if (query.auditStatus !== undefined && query.auditStatus !== '') where.audit_status = query.auditStatus;
    if (query.creatorId) where.creator_id = query.creatorId;
    if (query.creatorLevel !== undefined && query.creatorLevel !== '') where.creator_level = query.creatorLevel;
    if (query.hotScoreMin !== undefined && query.hotScoreMin !== '') {
      where.hot_score = { ...(where.hot_score || {}), [Op.gte]: parseFloat(query.hotScoreMin) };
    }
    if (query.hotScoreMax !== undefined && query.hotScoreMax !== '') {
      where.hot_score = { ...(where.hot_score || {}), [Op.lte]: parseFloat(query.hotScoreMax) };
    }
    if (query.publishBatch) where.publish_batch = query.publishBatch;
    if (query.violationCount !== undefined && query.violationCount !== '') {
      where.violation_count = { [Op.gte]: parseInt(query.violationCount, 10) };
    }
    if (query.isArchived !== undefined && query.isArchived !== '') where.is_archived = query.isArchived;
    if (query.contentRating !== undefined && query.contentRating !== '') where.content_rating = query.contentRating;
    if (query.videoQuality !== undefined && query.videoQuality !== '') where.video_quality = query.videoQuality;
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

    return {
      list: rows.map((content) => this._formatContent(content)),
      total: count,
      page,
      pageSize,
    };
  }

  async getShortVideoDetail(id) {
    const content = await Content.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
    if (!content || content.content_category !== SHORT_VIDEO_CATEGORY) {
      throw new NotFoundError('短视频不存在');
    }

    const result = this._formatContent(content);
    result.statusLogs = (content.status_logs || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    return result;
  }

  async createShortVideo(data, operatorId, ip) {
    if (data.video_fingerprint || data.videoFingerprint) {
      const fingerprint = data.video_fingerprint || data.videoFingerprint;
      const isUnique = await this.checkVideoFingerprint(fingerprint);
      if (!isUnique.isUnique) {
        throw new ConflictError('视频指纹已存在，请勿重复上传');
      }
    }

    if (data.video_duration !== undefined && data.video_duration > MAX_VIDEO_DURATION) {
      throw new BadRequestError(`视频时长不能超过${MAX_VIDEO_DURATION}秒`);
    }

    if (data.video_format && !ALLOWED_VIDEO_FORMATS.includes(data.video_format.toLowerCase())) {
      throw new BadRequestError(`视频格式不支持，仅支持：${ALLOWED_VIDEO_FORMATS.join(', ')}`);
    }

    if (data.video_quality !== undefined && !VIDEO_QUALITY_LEVELS.includes(parseInt(data.video_quality, 10))) {
      throw new BadRequestError('画质等级无效');
    }

    let contentRating = data.content_rating ?? 0;
    const tags = data.tags || [];
    if (tags.length > 0) {
      const tagStr = Array.isArray(tags) ? tags.join(',') : tags;
      if (/青少年|未成年|儿童|少儿/.test(tagStr)) {
        contentRating = 1;
      } else if (/成人|色情|性感/.test(tagStr)) {
        contentRating = 2;
      }
    }

    const now = new Date();
    const statusLogs = [{
      type: 'CREATE',
      status: 0,
      time: now.toISOString(),
      operator: operatorId,
      ip: ip || '',
      remark: '创建短视频',
    }];

    const trafficStats = {
      playCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      shareCount: 0,
      danmakuCount: 0,
      todayPlayCount: 0,
      weekPlayCount: 0,
      monthPlayCount: 0,
    };

    const content = await Content.create({
      content_title: data.title || data.content_title,
      content_subtitle: data.subtitle || data.content_subtitle,
      content_category: SHORT_VIDEO_CATEGORY,
      cover_image: data.coverImage || data.cover_image,
      poster_image: data.posterImage || data.poster_image,
      video_url: data.videoUrl || data.video_url,
      content_description: data.description || data.content_description,
      tags: data.tags,
      video_fingerprint: data.videoFingerprint || data.video_fingerprint,
      video_duration: data.videoDuration ?? data.video_duration,
      video_format: data.videoFormat || data.video_format,
      video_quality: data.videoQuality ?? data.video_quality,
      file_size: data.fileSize ?? data.file_size,
      bitrate_kbps: data.bitrateKbps ?? data.bitrate_kbps,
      frame_rate: data.frameRate ?? data.frame_rate,
      creator_id: data.creatorId || data.creator_id,
      creator_uid: data.creatorUid || data.creator_uid,
      creator_level: data.creatorLevel ?? data.creator_level,
      hot_score: data.hotScore ?? data.hot_score ?? 0,
      publish_batch: data.publishBatch || data.publish_batch,
      content_rating: contentRating,
      violation_count: 0,
      is_archived: 0,
      status: 0,
      audit_status: 0,
      status_logs: statusLogs,
      traffic_stats: trafficStats,
      created_by: operatorId,
      updated_by: operatorId,
    });

    await cacheService.invalidateContent(content.id);
    return content.id;
  }

  async updateShortVideo(id, data, operatorId, ip) {
    const content = await Content.findByPk(id);
    if (!content || content.content_category !== SHORT_VIDEO_CATEGORY) {
      throw new NotFoundError('短视频不存在');
    }

    if (content.audit_status === 5) {
      throw new ForbiddenError('违规封禁状态的内容禁止修改');
    }

    const isPublished = content.audit_status === 2 && content.status === 1;
    const updateData = {};
    const restrictedFields = ['title', 'content_title', 'video_url', 'videoUrl', 'video_fingerprint', 'videoFingerprint', 'content_category', 'category'];

    for (const key of Object.keys(data)) {
      if (isPublished && restrictedFields.includes(key)) {
        continue;
      }
      updateData[key] = data[key];
    }

    const dbData = this._mapToDbFields(updateData);

    if (dbData.status !== undefined && dbData.status !== content.status) {
      const statusLogs = content.status_logs || [];
      statusLogs.push({
        type: 'STATUS_CHANGE',
        fromStatus: content.status,
        toStatus: dbData.status,
        time: new Date().toISOString(),
        operator: operatorId,
        ip: ip || '',
        remark: data.remark || '状态变更',
      });
      dbData.status_logs = statusLogs;
    }

    dbData.updated_by = operatorId;

    await Content.update(dbData, { where: { id } });
    await cacheService.invalidateContent(id);
    return true;
  }

  async changeStatus(id, { toStatus, reason, remark }, operatorId, ip) {
    const content = await Content.findByPk(id);
    if (!content || content.content_category !== SHORT_VIDEO_CATEGORY) {
      throw new NotFoundError('短视频不存在');
    }

    const fromStatus = content.status;
    if (fromStatus === toStatus) {
      return true;
    }

    if (fromStatus === 5) {
      throw new ForbiddenError('违规封禁状态禁止编辑，请通过恢复流程处理');
    }

    const validTransitions = STATUS_TRANSITIONS[fromStatus] || [];
    if (!validTransitions.includes(toStatus)) {
      throw new BadRequestError(`状态不能从${fromStatus}转换为${toStatus}`);
    }

    const statusLogs = content.status_logs || [];
    const now = new Date();
    statusLogs.push({
      type: 'STATUS_CHANGE',
      fromStatus,
      toStatus,
      reason: reason || '',
      time: now.toISOString(),
      operator: operatorId,
      ip: ip || '',
      remark: remark || '',
    });

    await Content.update({
      status: toStatus,
      status_logs: statusLogs,
      updated_by: operatorId,
    }, { where: { id } });

    await cacheService.invalidateContent(id);
    return true;
  }

  async batchResetTags(ids, newTags) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要操作的内容');
    }

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: SHORT_VIDEO_CATEGORY,
      },
    });

    const operableContents = contents.filter(c => c.status === 0 || c.status === 3 || c.status === 5);
    const operableIds = operableContents.map(c => c.id);
    const skippedCount = ids.length - operableIds.length;

    if (operableIds.length > 0) {
      await Content.update(
        { tags: newTags },
        { where: { id: { [Op.in]: operableIds } } }
      );
      for (const id of operableIds) {
        await cacheService.invalidateContent(id);
      }
    }

    return { successCount: operableIds.length, skippedCount };
  }

  async batchRestoreContents(ids, reason) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要恢复的内容');
    }

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: SHORT_VIDEO_CATEGORY,
      },
    });

    const operableContents = contents.filter(c => c.status === 5 || c.status === 3);
    const skippedCount = ids.length - operableContents.length;

    if (operableContents.length > 0) {
      const now = new Date();
      for (const content of operableContents) {
        const statusLogs = content.status_logs || [];
        statusLogs.push({
          type: 'RESTORE',
          fromStatus: content.status,
          toStatus: 0,
          reason: reason || '',
          time: now.toISOString(),
          operator: null,
          ip: '',
          remark: '批量恢复',
        });
        await Content.update(
          { status: 0, status_logs: statusLogs },
          { where: { id: content.id } }
        );
        await cacheService.invalidateContent(content.id);
      }
    }

    return { successCount: operableContents.length, skippedCount };
  }

  async batchArchiveContents(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要归档的内容');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contents = await Content.findAll({
      where: {
        id: { [Op.in]: ids },
        content_category: SHORT_VIDEO_CATEGORY,
        is_archived: 0,
      },
    });

    const operableContents = contents.filter(c =>
      (c.status === 3 || c.status === 5) && new Date(c.created_at) <= thirtyDaysAgo
    );
    const operableIds = operableContents.map(c => c.id);
    const skippedCount = ids.length - operableIds.length;

    if (operableIds.length > 0) {
      await Content.update(
        { is_archived: 1, archived_at: new Date() },
        { where: { id: { [Op.in]: operableIds } } }
      );
      for (const id of operableIds) {
        await cacheService.invalidateContent(id);
      }
    }

    return { successCount: operableIds.length, skippedCount };
  }

  async checkVideoFingerprint(fingerprint, excludeId) {
    if (!fingerprint) {
      return { isUnique: true, duplicateContent: null };
    }

    const where = {
      video_fingerprint: fingerprint,
      content_category: SHORT_VIDEO_CATEGORY,
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

  async getStatusLogs(contentId) {
    const content = await Content.findByPk(contentId, {
      attributes: ['id', 'content_category', 'status_logs'],
    });
    if (!content || content.content_category !== SHORT_VIDEO_CATEGORY) {
      throw new NotFoundError('短视频不存在');
    }

    const logs = content.status_logs || [];
    return logs.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  _formatContent(content) {
    return {
      id: content.id,
      title: content.content_title,
      subtitle: content.content_subtitle,
      category: content.content_category,
      coverImage: content.cover_image,
      posterImage: content.poster_image,
      videoUrl: content.video_url,
      description: content.content_description,
      tags: content.tags,
      videoFingerprint: content.video_fingerprint,
      videoDuration: content.video_duration,
      videoFormat: content.video_format,
      videoQuality: content.video_quality,
      fileSize: content.file_size,
      bitrateKbps: content.bitrate_kbps,
      frameRate: content.frame_rate,
      creatorId: content.creator_id,
      creatorUid: content.creator_uid,
      creatorLevel: content.creator_level,
      hotScore: content.hot_score,
      hotRanking: content.hot_ranking,
      publishBatch: content.publish_batch,
      contentRating: content.content_rating,
      violationCount: content.violation_count,
      lastViolationType: content.last_violation_type,
      lastViolationAt: content.last_violation_at,
      isArchived: content.is_archived,
      archivedAt: content.archived_at,
      playCount: content.play_count,
      likeCount: content.like_count,
      collectCount: content.collect_count,
      commentCount: content.comment_count,
      shareCount: content.share_count,
      danmakuCount: content.danmaku_count,
      trafficStats: content.traffic_stats,
      auditStatus: content.audit_status,
      auditRemark: content.audit_remark,
      isHot: content.is_hot,
      isRecommend: content.is_recommend,
      isVip: content.is_vip,
      sortOrder: content.sort_order,
      status: content.status,
      remark: content.remark,
      creator: content.creator ? {
        id: content.creator.id,
        username: content.creator.username,
        nickname: content.creator.nickname,
        avatar: content.creator.avatar,
      } : null,
      createdAt: content.created_at,
      updatedAt: content.updated_at,
    };
  }

  _mapToDbFields(data) {
    const fieldMap = {
      title: 'content_title',
      subtitle: 'content_subtitle',
      category: 'content_category',
      coverImage: 'cover_image',
      posterImage: 'poster_image',
      videoUrl: 'video_url',
      description: 'content_description',
      videoFingerprint: 'video_fingerprint',
      videoDuration: 'video_duration',
      videoFormat: 'video_format',
      videoQuality: 'video_quality',
      fileSize: 'file_size',
      bitrateKbps: 'bitrate_kbps',
      frameRate: 'frame_rate',
      creatorId: 'creator_id',
      creatorUid: 'creator_uid',
      creatorLevel: 'creator_level',
      hotScore: 'hot_score',
      publishBatch: 'publish_batch',
      contentRating: 'content_rating',
      isArchived: 'is_archived',
      isHot: 'is_hot',
      isRecommend: 'is_recommend',
      isVip: 'is_vip',
      sortOrder: 'sort_order',
      auditStatus: 'audit_status',
      auditRemark: 'audit_remark',
    };

    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField) {
        result[dbField] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

module.exports = new ShortVideoService();
