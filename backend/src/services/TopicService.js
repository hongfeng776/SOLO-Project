const { Topic, TopicContent, Content, User } = require('../models');
const { Op } = require('../config/database');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateRandomString } = require('../utils/helpers');

const STATUS_TRANSITIONS = {
  0: [1],
  1: [0, 2],
  2: [3, 4],
  3: [2, 4],
};

const TOPIC_TYPE_COVER_TEMPLATE = {
  0: 'festival-default',
  1: 'hot-style',
  2: 'category-banner',
  3: 'people-feature',
  4: 'activity-special',
};

const TOPIC_TYPE_SORT_RULE = {
  0: 2,
  1: 1,
  2: 3,
  3: 4,
  4: 0,
};

const SORT_RULE_MANUAL = 0;

class TopicService {
  async getTopicList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    let order = parseSort(query, [
      ['weight_score', 'DESC'],
      ['hot_score', 'DESC'],
    ]);
    const search = parseSearch(query, ['title', 'description']);

    const where = { ...search };

    if (query.topicType !== undefined && query.topicType !== '') {
      where.topic_type = query.topicType;
    }
    if (query.status !== undefined && query.status !== '') {
      where.status = query.status;
    }
    if (query.isCore !== undefined && query.isCore !== '') {
      where.is_core = query.isCore;
    }
    if (query.operationBatch) {
      where.operation_batch = query.operationBatch;
    }
    if (query.creatorId) {
      where.creator_id = query.creatorId;
    }
    if (query.hotScoreMin !== undefined && query.hotScoreMin !== '') {
      where.hot_score = {
        ...(where.hot_score || {}),
        [Op.gte]: parseFloat(query.hotScoreMin),
      };
    }
    if (query.dateRange && Array.isArray(query.dateRange) && query.dateRange.length === 2) {
      where.created_at = {
        [Op.between]: [query.dateRange[0], query.dateRange[1]],
      };
    }

    const { count, rows } = await Topic.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      offset,
      limit: pageSize,
      order,
    });

    const totalCount = await Topic.count();
    const onlineCount = await Topic.count({ where: { status: 2 } });
    const allContentCount = await Topic.sum('content_count') || 0;

    return {
      list: rows.map((topic) => this._formatTopic(topic)),
      total: count,
      page,
      pageSize,
      stats: {
        totalTopics: totalCount,
        onlineTopics: onlineCount,
        totalContents: allContentCount,
      },
    };
  }

  async getTopicDetail(id) {
    const topic = await Topic.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    const topicContents = await TopicContent.findAll({
      where: { topic_id: id },
      include: [
        { model: Content, as: 'content' },
      ],
      order: [['sort_order', 'ASC']],
    });

    const result = this._formatTopic(topic);
    result.contents = topicContents.map((tc) => this._formatTopicContent(tc));
    result.statusLogs = (topic.status_logs || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    return result;
  }

  async createTopic(data, operatorId, operatorName, ip) {
    const titleUnique = await this.checkTopicTitleUnique(data.title, data.topicType);
    if (!titleUnique.isUnique) {
      throw new ConflictError('同类型下已存在同名专题');
    }

    if (data.operationStartTime && data.operationEndTime) {
      const timeOverlap = await this.checkTimeOverlap(
        data.topicType,
        data.operationStartTime,
        data.operationEndTime
      );
      if (timeOverlap.hasOverlap) {
        throw new ConflictError('同类型下存在运营时段重叠的专题');
      }
    }

    const topicCode = `TOP${Date.now()}${generateRandomString(4)}`;
    const topicType = parseInt(data.topicType, 10) || 0;
    const coverTemplate = data.coverTemplate || TOPIC_TYPE_COVER_TEMPLATE[topicType] || 'default';
    const sortRule = data.sortRule !== undefined ? data.sortRule : (TOPIC_TYPE_SORT_RULE[topicType] || 0);
    const resourceLink = `/topic/${topicCode}`;

    const now = new Date();
    const statusLogs = [{
      type: 'CREATE',
      status: 0,
      time: now.toISOString(),
      operator: operatorId,
      operatorName: operatorName || '',
      ip: ip || '',
      remark: '创建专题',
    }];

    const trafficStats = {
      viewCount: 0,
      clickCount: 0,
      shareCount: 0,
      todayViewCount: 0,
      weekViewCount: 0,
      monthViewCount: 0,
    };

    const topic = await Topic.create({
      topic_code: topicCode,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      topic_type: topicType,
      cover_image: data.coverImage,
      cover_template: coverTemplate,
      banner_image: data.bannerImage,
      icon_image: data.iconImage,
      background_color: data.backgroundColor,
      sort_rule: sortRule,
      weight_score: data.weightScore ?? 0,
      hot_score: data.hotScore ?? 0,
      content_count: 0,
      resource_link: resourceLink,
      status: 0,
      is_core: data.isCore ?? 0,
      operation_batch: data.operationBatch,
      operation_start_time: data.operationStartTime,
      operation_end_time: data.operationEndTime,
      creator_id: operatorId,
      creator_name: operatorName,
      operator_ip: ip,
      status_logs: statusLogs,
      traffic_stats: trafficStats,
      tags: data.tags,
      remark: data.remark,
      created_by: operatorId,
      updated_by: operatorId,
    });

    return {
      id: topic.id,
      topicCode: topic.topic_code,
      resourceLink: topic.resource_link,
    };
  }

  async updateTopic(id, data, operatorId, operatorName, ip) {
    const topic = await Topic.findByPk(id);
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    const isOnline = topic.status === 2;
    let needConfirmLog = false;
    if (isOnline) {
      needConfirmLog = true;
    }

    if (data.title !== undefined && data.topicType !== undefined) {
      const titleUnique = await this.checkTopicTitleUnique(data.title, data.topicType, id);
      if (!titleUnique.isUnique) {
        throw new ConflictError('同类型下已存在同名专题');
      }
    } else if (data.title !== undefined) {
      const titleUnique = await this.checkTopicTitleUnique(data.title, topic.topic_type, id);
      if (!titleUnique.isUnique) {
        throw new ConflictError('同类型下已存在同名专题');
      }
    }

    const startTime = data.operationStartTime !== undefined ? data.operationStartTime : topic.operation_start_time;
    const endTime = data.operationEndTime !== undefined ? data.operationEndTime : topic.operation_end_time;
    const topicType = data.topicType !== undefined ? data.topicType : topic.topic_type;

    if (startTime && endTime) {
      const timeOverlap = await this.checkTimeOverlap(topicType, startTime, endTime, id);
      if (timeOverlap.hasOverlap) {
        throw new ConflictError('同类型下存在运营时段重叠的专题');
      }
    }

    const updateData = this._mapToDbFields(data);

    let finalStatus = updateData.status !== undefined ? updateData.status : topic.status;
    const now = new Date();
    if (endTime && new Date(endTime) < now && finalStatus !== 4) {
      finalStatus = 4;
    }
    updateData.status = finalStatus;

    const statusLogs = topic.status_logs || [];
    if (needConfirmLog) {
      statusLogs.push({
        type: 'ONLINE_EDIT',
        fromStatus: topic.status,
        toStatus: finalStatus,
        confirmed: true,
        time: now.toISOString(),
        operator: operatorId,
        operatorName: operatorName || '',
        ip: ip || '',
        remark: '已上线专题修改（二次确认）',
      });
    }
    if (finalStatus !== topic.status) {
      statusLogs.push({
        type: 'STATUS_CHANGE',
        fromStatus: topic.status,
        toStatus: finalStatus,
        time: now.toISOString(),
        operator: operatorId,
        operatorName: operatorName || '',
        ip: ip || '',
        remark: data.remark || '状态变更',
      });
    }
    updateData.status_logs = statusLogs;
    updateData.updated_by = operatorId;

    await Topic.update(updateData, { where: { id } });

    const result = { updated: true };
    if (needConfirmLog) {
      result.warning = '已上线专题修改需二次确认，已记录确认日志';
    }
    if (finalStatus === 4 && topic.status !== 4) {
      result.info = '运营结束时间已过期，专题已自动标记为已过期';
    }
    return result;
  }

  async changeTopicStatus(id, toStatus, reason, operatorId, operatorName, ip) {
    const topic = await Topic.findByPk(id);
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    const fromStatus = topic.status;
    if (fromStatus === toStatus) {
      return true;
    }

    const validTransitions = STATUS_TRANSITIONS[fromStatus] || [];
    if (!validTransitions.includes(toStatus) && toStatus !== 4) {
      throw new BadRequestError(`状态不能从${fromStatus}转换为${toStatus}`);
    }

    if (fromStatus === 2 && toStatus === 3 && !reason) {
      throw new BadRequestError('已上线专题下线必须提供原因');
    }

    const statusLogs = topic.status_logs || [];
    const now = new Date();
    statusLogs.push({
      type: 'STATUS_CHANGE',
      fromStatus,
      toStatus,
      reason: reason || '',
      time: now.toISOString(),
      operator: operatorId,
      operatorName: operatorName || '',
      ip: ip || '',
      remark: reason || '状态变更',
    });

    if (toStatus === 2) {
      await this._syncContentResourcePosition(id, topic.topic_code);
    } else if (toStatus === 3) {
      await this._clearContentResourcePosition(id);
    }

    const trafficStats = topic.traffic_stats || {};
    if (toStatus === 2) {
      trafficStats.onlineTime = now.toISOString();
      trafficStats.lastOnlineAt = now.toISOString();
    } else if (toStatus === 3) {
      trafficStats.offlineTime = now.toISOString();
      trafficStats.totalOnlineDuration = (trafficStats.totalOnlineDuration || 0) +
        (now - new Date(trafficStats.lastOnlineAt || now));
    }

    await Topic.update({
      status: toStatus,
      status_logs: statusLogs,
      traffic_stats: trafficStats,
      updated_by: operatorId,
    }, { where: { id } });

    return true;
  }

  async mountContent(topicId, contentList, operatorId, operatorName) {
    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    if (!contentList || !Array.isArray(contentList) || contentList.length === 0) {
      throw new BadRequestError('请提供要挂载的内容列表');
    }

    const contentIds = contentList.map((c) => c.contentId);
    const mountedCheck = await this.checkContentMounted(topicId, contentIds);
    if (mountedCheck.mounted.length > 0) {
      const mountedIds = mountedCheck.mounted.map((m) => m.contentId);
      throw new ConflictError(`内容已挂载于该专题: ${mountedIds.join(', ')}`);
    }

    const now = new Date();
    const records = contentList.map((item) => ({
      topic_id: topicId,
      content_id: item.contentId,
      sort_order: item.sortOrder ?? 0,
      weight_score: item.weightScore ?? 0,
      is_recommended: item.isRecommended ?? 0,
      mount_time: now,
      operator_id: operatorId,
      operator_name: operatorName,
      created_by: operatorId,
      updated_by: operatorId,
    }));

    await TopicContent.bulkCreate(records);
    const newCount = await TopicContent.count({ where: { topic_id: topicId } });
    await Topic.update({ content_count: newCount, updated_by: operatorId }, { where: { id: topicId } });

    if (topic.status === 2) {
      await this._syncContentResourcePosition(topicId, topic.topic_code);
    }

    return { mountedCount: records.length, totalCount: newCount };
  }

  async unmountContent(topicId, contentIds, operatorId, operatorName) {
    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      throw new BadRequestError('请提供要卸载的内容ID列表');
    }

    const where = {
      topic_id: topicId,
      content_id: { [Op.in]: contentIds },
    };

    if (topic.status === 2) {
      const contents = await Content.findAll({ where: { id: { [Op.in]: contentIds } } });
      for (const content of contents) {
        if (content.resource_position && content.resource_position.startsWith(`topic:${topic.topic_code}`)) {
          await Content.update({ resource_position: null }, { where: { id: content.id } });
        }
      }
    }

    const deletedCount = await TopicContent.destroy({ where });
    const newCount = await TopicContent.count({ where: { topic_id: topicId } });
    await Topic.update({ content_count: newCount, updated_by: operatorId }, { where: { id: topicId } });

    return { unmountedCount: deletedCount, totalCount: newCount };
  }

  async reorderContents(topicId, orderList, operatorId) {
    const topic = await Topic.findByPk(topicId);
    if (!topic) {
      throw new NotFoundError('专题不存在');
    }

    if (topic.sort_rule !== SORT_RULE_MANUAL) {
      throw new BadRequestError('当前专题排序规则非手动排序，不允许调整内容顺序');
    }

    if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
      throw new BadRequestError('请提供排序数据');
    }

    for (const item of orderList) {
      await TopicContent.update(
        { sort_order: item.sortOrder, updated_by: operatorId },
        { where: { id: item.id, topic_id: topicId } }
      );
    }

    return { reorderedCount: orderList.length };
  }

  async batchEnableTopics(ids, operatorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要操作的专题');
    }

    const now = new Date();
    const topics = await Topic.findAll({ where: { id: { [Op.in]: ids } } });

    const details = [];
    let successCount = 0;
    let skippedCount = 0;

    for (const topic of topics) {
      if (topic.is_core === 1 && topic.status === 2) {
        skippedCount++;
        details.push({ id: topic.id, title: topic.title, status: 'skipped', reason: '核心专题已上线，自动跳过' });
        continue;
      }

      const canEnable = topic.status === 1 &&
        (!topic.operation_end_time || new Date(topic.operation_end_time) >= now);

      if (!canEnable) {
        skippedCount++;
        details.push({ id: topic.id, title: topic.title, status: 'skipped', reason: '状态或运营时段不符合要求' });
        continue;
      }

      const statusLogs = topic.status_logs || [];
      statusLogs.push({
        type: 'STATUS_CHANGE',
        fromStatus: topic.status,
        toStatus: 2,
        time: now.toISOString(),
        operator: operatorId,
        remark: '批量上线',
      });

      await Topic.update(
        { status: 2, status_logs: statusLogs, updated_by: operatorId },
        { where: { id: topic.id } }
      );
      await this._syncContentResourcePosition(topic.id, topic.topic_code);
      successCount++;
      details.push({ id: topic.id, title: topic.title, status: 'success' });
    }

    return { successCount, skippedCount, details };
  }

  async batchDisableTopics(ids, reason, operatorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要操作的专题');
    }

    if (!reason) {
      throw new BadRequestError('批量停用必须提供原因');
    }

    const now = new Date();
    const topics = await Topic.findAll({ where: { id: { [Op.in]: ids } } });

    const details = [];
    let successCount = 0;
    let skippedCount = 0;

    for (const topic of topics) {
      if (topic.is_core === 1) {
        skippedCount++;
        details.push({ id: topic.id, title: topic.title, status: 'skipped', reason: '核心专题需单独处理，批量操作不可停用' });
        continue;
      }

      if (topic.status !== 2) {
        skippedCount++;
        details.push({ id: topic.id, title: topic.title, status: 'skipped', reason: '仅已上线专题可停用' });
        continue;
      }

      const statusLogs = topic.status_logs || [];
      statusLogs.push({
        type: 'STATUS_CHANGE',
        fromStatus: topic.status,
        toStatus: 3,
        reason,
        time: now.toISOString(),
        operator: operatorId,
        remark: '批量停用',
      });

      await Topic.update(
        { status: 3, status_logs: statusLogs, updated_by: operatorId },
        { where: { id: topic.id } }
      );
      await this._clearContentResourcePosition(topic.id);
      successCount++;
      details.push({ id: topic.id, title: topic.title, status: 'success' });
    }

    return { successCount, skippedCount, details };
  }

  async batchSupplementContents(ids, contentIds, operatorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要补充内容的专题');
    }
    if (!contentIds || contentIds.length === 0) {
      throw new BadRequestError('请提供要补充的内容ID');
    }

    const details = [];
    let totalAdded = 0;
    let totalSkipped = 0;

    for (const topicId of ids) {
      const topic = await Topic.findByPk(topicId);
      if (!topic) {
        details.push({ topicId, status: 'skipped', reason: '专题不存在' });
        totalSkipped++;
        continue;
      }

      const mountedCheck = await this.checkContentMounted(topicId, contentIds);
      const notMountedIds = mountedCheck.notMounted;

      if (notMountedIds.length === 0) {
        details.push({ topicId, status: 'skipped', reason: '所有内容已挂载', skippedCount: contentIds.length });
        totalSkipped += contentIds.length;
        continue;
      }

      const now = new Date();
      const records = notMountedIds.map((contentId, idx) => ({
        topic_id: topicId,
        content_id: contentId,
        sort_order: idx,
        weight_score: 0,
        is_recommended: 0,
        mount_time: now,
        operator_id: operatorId,
        created_by: operatorId,
        updated_by: operatorId,
      }));

      await TopicContent.bulkCreate(records);
      const newCount = await TopicContent.count({ where: { topic_id: topicId } });
      await Topic.update({ content_count: newCount, updated_by: operatorId }, { where: { id: topicId } });

      if (topic.status === 2) {
        await this._syncContentResourcePosition(topicId, topic.topic_code);
      }

      totalAdded += notMountedIds.length;
      totalSkipped += (contentIds.length - notMountedIds.length);
      details.push({
        topicId,
        title: topic.title,
        status: 'success',
        addedCount: notMountedIds.length,
        skippedCount: contentIds.length - notMountedIds.length,
      });
    }

    return { totalAdded, totalSkipped, details };
  }

  async batchUpdateTopicWeight(ids, weightScore, operatorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要操作的专题');
    }
    if (weightScore === undefined || weightScore === null || weightScore < 0 || weightScore > 100) {
      throw new BadRequestError('权重分值必须在0-100之间');
    }

    const topics = await Topic.findAll({ where: { id: { [Op.in]: ids } } });

    const details = [];
    let successCount = 0;
    let skippedCount = 0;

    for (const topic of topics) {
      if (topic.is_core === 1) {
        skippedCount++;
        details.push({ id: topic.id, title: topic.title, status: 'skipped', reason: '核心专题权重不允许批量修改' });
        continue;
      }

      await Topic.update(
        { weight_score: weightScore, updated_by: operatorId },
        { where: { id: topic.id } }
      );
      successCount++;
      details.push({ id: topic.id, title: topic.title, status: 'success' });
    }

    return { successCount, skippedCount, details };
  }

  async checkTopicTitleUnique(title, topicType, excludeId) {
    if (!title) {
      return { isUnique: true, duplicateTopic: null };
    }

    const where = {
      title,
      topic_type: topicType,
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const duplicate = await Topic.findOne({
      where,
      attributes: ['id', 'title', 'topic_type', 'status'],
    });

    if (duplicate) {
      return {
        isUnique: false,
        duplicateTopic: {
          id: duplicate.id,
          title: duplicate.title,
          topicType: duplicate.topic_type,
          status: duplicate.status,
        },
      };
    }

    return { isUnique: true, duplicateTopic: null };
  }

  async checkTimeOverlap(topicType, startTime, endTime, excludeId) {
    if (!startTime || !endTime) {
      return { hasOverlap: false, overlappingTopics: [] };
    }

    const where = {
      topic_type: topicType,
      operation_start_time: { [Op.lt]: endTime },
      operation_end_time: { [Op.gt]: startTime },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const overlapping = await Topic.findAll({
      where,
      attributes: ['id', 'title', 'operation_start_time', 'operation_end_time'],
    });

    return {
      hasOverlap: overlapping.length > 0,
      overlappingTopics: overlapping.map((t) => ({
        id: t.id,
        title: t.title,
        startTime: t.operation_start_time,
        endTime: t.operation_end_time,
      })),
    };
  }

  async checkContentMounted(topicId, contentIds) {
    if (!contentIds || contentIds.length === 0) {
      return { mounted: [], notMounted: [] };
    }

    const existing = await TopicContent.findAll({
      where: {
        topic_id: topicId,
        content_id: { [Op.in]: contentIds },
      },
      attributes: ['id', 'content_id'],
    });

    const mountedIds = existing.map((e) => e.content_id);
    const mounted = existing.map((e) => ({ contentId: e.content_id, topicContentId: e.id }));
    const notMounted = contentIds.filter((cid) => !mountedIds.includes(cid));

    return { mounted, notMounted };
  }

  async _syncContentResourcePosition(topicId, topicCode) {
    const topicContents = await TopicContent.findAll({
      where: { topic_id: topicId },
      attributes: ['content_id', 'sort_order'],
      order: [['sort_order', 'ASC']],
    });

    for (const tc of topicContents) {
      await Content.update(
        { resource_position: `topic:${topicCode}:${tc.sort_order}` },
        { where: { id: tc.content_id } }
      );
    }
  }

  async _clearContentResourcePosition(topicId) {
    const topicContents = await TopicContent.findAll({
      where: { topic_id: topicId },
      attributes: ['content_id'],
    });

    const contentIds = topicContents.map((tc) => tc.content_id);
    if (contentIds.length === 0) return;

    const contents = await Content.findAll({ where: { id: { [Op.in]: contentIds } } });
    for (const content of contents) {
      if (content.resource_position && content.resource_position.startsWith(`topic:`)) {
        await Content.update({ resource_position: null }, { where: { id: content.id } });
      }
    }
  }

  _formatTopic(topic) {
    return {
      id: topic.id,
      topicCode: topic.topic_code,
      title: topic.title,
      subtitle: topic.subtitle,
      description: topic.description,
      topicType: topic.topic_type,
      coverImage: topic.cover_image,
      coverTemplate: topic.cover_template,
      bannerImage: topic.banner_image,
      iconImage: topic.icon_image,
      backgroundColor: topic.background_color,
      sortRule: topic.sort_rule,
      weightScore: topic.weight_score,
      hotScore: topic.hot_score,
      contentCount: topic.content_count,
      resourceLink: topic.resource_link,
      status: topic.status,
      isCore: topic.is_core,
      operationBatch: topic.operation_batch,
      operationStartTime: topic.operation_start_time,
      operationEndTime: topic.operation_end_time,
      creatorId: topic.creator_id,
      creatorName: topic.creator_name,
      tags: topic.tags,
      remark: topic.remark,
      trafficStats: topic.traffic_stats,
      creator: topic.creator ? {
        id: topic.creator.id,
        username: topic.creator.username,
        nickname: topic.creator.nickname,
        avatar: topic.creator.avatar,
      } : null,
      createdAt: topic.created_at,
      updatedAt: topic.updated_at,
    };
  }

  _formatTopicContent(topicContent) {
    return {
      id: topicContent.id,
      topicId: topicContent.topic_id,
      contentId: topicContent.content_id,
      sortOrder: topicContent.sort_order,
      weightScore: topicContent.weight_score,
      isRecommended: topicContent.is_recommended,
      mountTime: topicContent.mount_time,
      operatorId: topicContent.operator_id,
      operatorName: topicContent.operator_name,
      content: topicContent.content ? {
        id: topicContent.content.id,
        title: topicContent.content.content_title,
        coverImage: topicContent.content.cover_image,
        category: topicContent.content.content_category,
        status: topicContent.content.status,
        auditStatus: topicContent.content.audit_status,
      } : null,
    };
  }

  _mapToDbFields(data) {
    const fieldMap = {
      title: 'title',
      subtitle: 'subtitle',
      description: 'description',
      topicType: 'topic_type',
      coverImage: 'cover_image',
      coverTemplate: 'cover_template',
      bannerImage: 'banner_image',
      iconImage: 'icon_image',
      backgroundColor: 'background_color',
      sortRule: 'sort_rule',
      weightScore: 'weight_score',
      hotScore: 'hot_score',
      isCore: 'is_core',
      operationBatch: 'operation_batch',
      operationStartTime: 'operation_start_time',
      operationEndTime: 'operation_end_time',
      tags: 'tags',
      remark: 'remark',
      status: 'status',
    };

    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField) {
        result[dbField] = value;
      } else if (key !== 'remark') {
        result[key] = value;
      }
    }
    return result;
  }
}

module.exports = new TopicService();
