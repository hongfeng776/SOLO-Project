const { Op, Sequelize, sequelize } = require('../models/_db');
const {
  FeedbackRecord, FeedbackLog, FeedbackArchive,
  FEEDBACK_TYPE, FEEDBACK_STATUS, FEEDBACK_PRIORITY, FEEDBACK_SOURCE,
  FEEDBACK_TIMELINESS, PRIORITY_TIMEOUT_HOURS,
} = require('../models');
const helpers = require('../utils/helpers');

const ValidationError = require('../errors/ValidationError');
const ForbiddenError = require('../errors/ForbiddenError');

class UserFeedbackService {

  // ============ 功能点1：反馈接单 ============

  static async createFeedback(data, operator) {
    const existing = await FeedbackRecord.findOne({
      where: { userId: data.userId, title: data.title, status: { [Op.in]: [1, 2] } },
    });
    if (existing) {
      throw new ValidationError('该用户存在相同标题的未完成反馈，禁止重复提交');
    }
    const typeConfig = Object.values(FEEDBACK_TYPE).find(t => t.value === data.feedbackType);
    const record = await FeedbackRecord.create({
      ...data,
      handlerGroup: typeConfig ? typeConfig.handler : null,
      status: 1,
      priority: data.priority || 2,
    });
    await FeedbackLog.create({
      feedbackId: record.id,
      feedbackNo: record.feedbackNo,
      action: 'CREATED',
      toStatus: 1,
      toPriority: record.priority,
      operatorId: operator.id,
      operatorName: operator.name,
      remark: '反馈创建',
    });
    return record;
  }

  static async assignFeedback(feedbackId, operator) {
    const record = await FeedbackRecord.findByPk(feedbackId);
    if (!record) throw new ValidationError('反馈记录不存在');
    if (record.status !== 1) throw new ValidationError('仅待处理状态可接单，已接单反馈禁止重复接单');
    await record.update({
      status: 2,
      handlerId: operator.id,
      handlerName: operator.name,
      assignedAt: new Date(),
    });
    await FeedbackLog.create({
      feedbackId: record.id,
      feedbackNo: record.feedbackNo,
      action: 'ASSIGNED',
      fromStatus: 1,
      toStatus: 2,
      operatorId: operator.id,
      operatorName: operator.name,
      remark: `${operator.name} 接单处理`,
    });
    return record;
  }

  static async checkAndUpgradePriority() {
    const now = new Date();
    const pending = await FeedbackRecord.findAll({
      where: { status: { [Op.in]: [1, 2] }, deadlineAt: { [Op.lt]: now } },
    });
    const upgraded = [];
    for (const record of pending) {
      if (record.priority < 4) {
        const newPriority = Math.min(record.priority + 1, 4);
        await record.update({ priority: newPriority });
        const hours = PRIORITY_TIMEOUT_HOURS[newPriority] || 4;
        await record.update({ deadlineAt: new Date(Date.now() + hours * 3600000), timeliness: 3 });
        await FeedbackLog.create({
          feedbackId: record.id,
          feedbackNo: record.feedbackNo,
          action: 'PRIORITY_UPGRADED',
          fromPriority: record.priority,
          toPriority: newPriority,
          remark: `超时未处理，优先级自动升级至${FEEDBACK_PRIORITY[newPriority === 4 ? 'URGENT' : newPriority === 3 ? 'HIGH' : 'MEDIUM'].label}`,
        });
        upgraded.push({ id: record.id, feedbackNo: record.feedbackNo, newPriority });
      }
    }
    return upgraded;
  }

  // ============ 功能点2：反馈处理四分支 ============

  static async resolveFeedback(feedbackId, data, operator) {
    const record = await FeedbackRecord.findByPk(feedbackId);
    if (!record) throw new ValidationError('反馈记录不存在');
    if (record.status !== 2) throw new ValidationError('仅处理中状态可标记已解决');
    if (!data.resolution || data.resolution.length < 10) throw new ValidationError('处理方案至少10字');
    if (!data.result) throw new ValidationError('请填写处理结果');
    await record.update({
      status: 3,
      resolution: data.resolution,
      result: data.result,
      resolvedAt: new Date(),
    });
    await FeedbackLog.create({
      feedbackId: record.id,
      feedbackNo: record.feedbackNo,
      action: 'RESOLVED',
      fromStatus: 2,
      toStatus: 3,
      operatorId: operator.id,
      operatorName: operator.name,
      remark: `处理方案: ${data.resolution.slice(0, 200)}`,
    });
    return record;
  }

  static async rejectFeedback(feedbackId, data, operator) {
    const record = await FeedbackRecord.findByPk(feedbackId);
    if (!record) throw new ValidationError('反馈记录不存在');
    if (record.status !== 2) throw new ValidationError('仅处理中状态可驳回');
    if (!data.rejectReason || data.rejectReason.length < 5) throw new ValidationError('驳回原因至少5字');
    await record.update({
      status: 4,
      rejectReason: data.rejectReason,
      resolvedAt: new Date(),
    });
    await FeedbackLog.create({
      feedbackId: record.id,
      feedbackNo: record.feedbackNo,
      action: 'REJECTED',
      fromStatus: 2,
      toStatus: 4,
      operatorId: operator.id,
      operatorName: operator.name,
      remark: `驳回原因: ${data.rejectReason}`,
    });
    return record;
  }

  static async startProcessing(feedbackId, operator) {
    const record = await FeedbackRecord.findByPk(feedbackId);
    if (!record) throw new ValidationError('反馈记录不存在');
    if (record.status === 2) return record;
    if (record.status !== 1) throw new ValidationError('仅待处理状态可开始处理');
    return this.assignFeedback(feedbackId, operator);
  }

  // ============ 功能点3：批量处理 ============

  static async batchAction(data, operator) {
    const { action, ids, filters } = data;
    if (!ids || !ids.length) throw new ValidationError('请选择要操作的反馈');
    if (!['ARCHIVE', 'URGENT', 'CLOSE'].includes(action)) {
      throw new ValidationError('无效的批量操作类型');
    }
    const where = { id: { [Op.in]: ids } };
    if (filters) {
      if (filters.feedbackType) where.feedbackType = filters.feedbackType;
      if (filters.status) where.status = filters.status;
    }
    const records = await FeedbackRecord.findAll({ where });
    if (!records.length) throw new ValidationError('未找到符合条件的反馈');
    const batchNo = `BAT_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const results = { success: [], failed: [] };

    for (const record of records) {
      try {
        if (action === 'ARCHIVE') {
          if (record.status !== 3) {
            results.failed.push({ id: record.id, feedbackNo: record.feedbackNo, reason: '仅已解决状态可归档' });
            continue;
          }
          const processingHours = record.resolvedAt && record.assignedAt
            ? Math.round((new Date(record.resolvedAt) - new Date(record.assignedAt)) / 3600000 * 100) / 100
            : null;
          await FeedbackArchive.create({
            feedbackId: record.id,
            feedbackNo: record.feedbackNo,
            userId: record.userId,
            uid: record.uid,
            feedbackType: record.feedbackType,
            title: record.title,
            content: record.content,
            source: record.source,
            priority: record.priority,
            originalPriority: record.originalPriority,
            handlerId: record.handlerId,
            handlerName: record.handlerName,
            resolution: record.resolution,
            result: record.result,
            rejectReason: record.rejectReason,
            assignedAt: record.assignedAt,
            resolvedAt: record.resolvedAt,
            archiveBatch: batchNo,
            processingHours,
            tags: record.tags,
          });
          await record.update({ isArchived: 1, archivedAt: new Date(), operationBatch: batchNo });
          await FeedbackLog.create({
            feedbackId: record.id, feedbackNo: record.feedbackNo, action: 'ARCHIVED',
            fromStatus: 3, toStatus: 3, operatorId: operator.id, operatorName: operator.name,
            remark: `批量归档 批次号:${batchNo}`, operationBatch: batchNo,
          });
          results.success.push({ id: record.id, feedbackNo: record.feedbackNo });
        } else if (action === 'URGENT') {
          if (record.status !== 1 && record.status !== 2) {
            results.failed.push({ id: record.id, feedbackNo: record.feedbackNo, reason: '仅待处理/处理中可加急' });
            continue;
          }
          const oldPriority = record.priority;
          await record.update({ priority: 4, deadlineAt: new Date(Date.now() + 4 * 3600000), timeliness: 1 });
          await FeedbackLog.create({
            feedbackId: record.id, feedbackNo: record.feedbackNo, action: 'URGENT',
            fromPriority: oldPriority, toPriority: 4,
            operatorId: operator.id, operatorName: operator.name,
            remark: `批量加急 批次号:${batchNo}`, operationBatch: batchNo,
          });
          results.success.push({ id: record.id, feedbackNo: record.feedbackNo });
        } else if (action === 'CLOSE') {
          if (record.status !== 1) {
            results.failed.push({ id: record.id, feedbackNo: record.feedbackNo, reason: '仅待处理状态可批量关闭' });
            continue;
          }
          await record.update({ status: 4, rejectReason: '批量关闭-无效反馈', resolvedAt: new Date(), operationBatch: batchNo });
          await FeedbackLog.create({
            feedbackId: record.id, feedbackNo: record.feedbackNo, action: 'BATCH_CLOSED',
            fromStatus: 1, toStatus: 4, operatorId: operator.id, operatorName: operator.name,
            remark: `批量关闭无效反馈 批次号:${batchNo}`, operationBatch: batchNo,
          });
          results.success.push({ id: record.id, feedbackNo: record.feedbackNo });
        }
      } catch (err) {
        results.failed.push({ id: record.id, feedbackNo: record.feedbackNo, reason: err.message });
      }
    }
    return { batchNo, total: records.length, ...results };
  }

  // ============ 功能点4：溯源与校验 ============

  static async traceFeedback(query) {
    const { feedbackNo, uid, userId, batchNo } = query;
    const where = {};
    if (feedbackNo) where.feedbackNo = feedbackNo;
    if (uid) where.uid = uid;
    if (userId) where.userId = userId;
    if (batchNo) where.operationBatch = batchNo;
    if (!Object.keys(where).length) throw new ValidationError('请至少提供一个溯源条件');
    const record = await FeedbackRecord.findOne({
      where,
      include: [{ model: FeedbackLog, as: 'logs', order: [['createdAt', 'ASC']] }],
      order: [['createdAt', 'DESC']],
    });
    if (!record) return null;
    const archive = await FeedbackArchive.findOne({ where: { feedbackId: record.id } });
    return { record, archive };
  }

  static async validateFeedbackIntegrity(feedbackId) {
    const record = await FeedbackRecord.findByPk(feedbackId, {
      include: [{ model: FeedbackLog, as: 'logs', order: [['createdAt', 'ASC']] }],
    });
    if (!record) throw new ValidationError('反馈记录不存在');
    const issues = [];
    const logs = record.logs || [];

    const statusTransitions = logs.filter(l => l.toStatus).map(l => l.toStatus);
    for (let i = 1; i < statusTransitions.length; i++) {
      if (statusTransitions[i] < statusTransitions[i - 1]) {
        issues.push({ type: 'STATUS_REGRESSION', message: `状态回退: ${statusTransitions[i - 1]} → ${statusTransitions[i]}` });
      }
    }

    const duplicateActions = logs.filter(l => l.action === 'ASSIGNED');
    if (duplicateActions.length > 1) {
      issues.push({ type: 'DUPLICATE_ASSIGN', message: `多次接单操作: ${duplicateActions.length} 次` });
    }

    if (record.status === 3 && record.resolvedAt && record.assignedAt) {
      const hours = (new Date(record.resolvedAt) - new Date(record.assignedAt)) / 3600000;
      const maxHours = PRIORITY_TIMEOUT_HOURS[record.priority] || 72;
      if (hours > maxHours) {
        issues.push({ type: 'TIMEOUT_PROCESSED', message: `处理超时: ${hours.toFixed(1)}h > 限${maxHours}h` });
      }
    }

    if (record.status === 3 && record.resolution) {
      const contentLen = record.content ? record.content.length : 0;
      const resolutionLen = record.resolution.length;
      if (resolutionLen < 10) {
        issues.push({ type: 'PERFUNCTORY', message: '处理方案过短，疑似敷衍处理' });
      }
    }

    if (record.status === 4 && (!record.rejectReason || record.rejectReason.length < 5)) {
      issues.push({ type: 'INCOMPLETE_REJECTION', message: '驳回原因不完整' });
    }

    if (record.status === 1 && record.createdAt) {
      const hours = (Date.now() - new Date(record.createdAt)) / 3600000;
      if (hours > 168) {
        issues.push({ type: 'LONG_PENDING', message: `待处理超过168小时（${hours.toFixed(0)}h），可能漏处理` });
      }
    }

    return { record, issues, isValid: issues.length === 0 };
  }

  static async checkDuplicateSubmission(userId, title, feedbackType) {
    const existing = await FeedbackRecord.findOne({
      where: { userId, title, feedbackType, status: { [Op.in]: [1, 2] } },
    });
    return { isDuplicate: !!existing, existingId: existing ? existing.id : null };
  }

  // ============ 查询统计 ============

  static async getFeedbackList(params) {
    const { page = 1, pageSize = 10, keyword, feedbackType, status, priority, source,
      isArchived, handlerId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
    const where = { isArchived: isArchived || 0 };
    if (feedbackType) where.feedbackType = feedbackType;
    if (status !== undefined && status !== null && status !== '') where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;
    if (handlerId) where.handlerId = handlerId;
    if (keyword) {
      where[Op.or] = [
        { feedbackNo: { [Op.like]: `%${keyword}%` } },
        { title: { [Op.like]: `%${keyword}%` } },
        { uid: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    const { count, rows } = await FeedbackRecord.findAndCountAll({
      where,
      include: [{ model: FeedbackLog, as: 'logs', attributes: ['id', 'action', 'createdAt'], limit: 1, order: [['createdAt', 'DESC']] }],
      order: [[sortBy, sortOrder]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      distinct: true,
    });
    return { list: rows, pagination: { page, pageSize, total: count } };
  }

  static async getFeedbackStats() {
    const total = await FeedbackRecord.count();
    const byStatus = await FeedbackRecord.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const byType = await FeedbackRecord.findAll({
      attributes: ['feedbackType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['feedbackType'],
      raw: true,
    });
    const overdue = await FeedbackRecord.count({
      where: { status: { [Op.in]: [1, 2] }, deadlineAt: { [Op.lt]: new Date() } },
    });
    const todayResolved = await FeedbackRecord.count({
      where: { status: 3, resolvedAt: { [Op.gte]: new Date(new Date().toISOString().slice(0, 10)) } },
    });
    return {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: Number(s.count) })),
      byType: byType.map(t => ({ type: t.feedbackType, count: Number(t.count) })),
      overdue,
      todayResolved,
    };
  }

  static async getFeedbackDetail(feedbackId) {
    const record = await FeedbackRecord.findByPk(feedbackId, {
      include: [{ model: FeedbackLog, as: 'logs', order: [['createdAt', 'ASC']] }],
    });
    if (!record) throw new ValidationError('反馈记录不存在');
    return record;
  }

  static async updateTimeliness() {
    const now = new Date();
    const nearDeadline = new Date(now.getTime() + 4 * 3600000);
    await FeedbackRecord.update(
      { timeliness: 3 },
      { where: { status: { [Op.in]: [1, 2] }, deadlineAt: { [Op.lt]: now }, timeliness: { [Op.ne]: 3 } } }
    );
    await FeedbackRecord.update(
      { timeliness: 2 },
      { where: { status: { [Op.in]: [1, 2] }, deadlineAt: { [Op.between]: [now, nearDeadline] }, timeliness: 1 } }
    );
    return { updated: true };
  }
}

module.exports = UserFeedbackService;
