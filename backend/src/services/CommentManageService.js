const { Comment, Content, CommentManageLog, EndUser } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch, generateBatchNo } = require('../utils/helpers');

const VALID_OPERATION_TYPES = ['PIN', 'CANCEL_PIN', 'ESSENCE', 'CANCEL_ESSENCE', 'BLOCK', 'DELETE'];
const BATCH_OPERATION_TYPES = ['BATCH_PIN', 'BATCH_BLOCK', 'BATCH_DELETE', 'BATCH_CLEAN'];
const ALL_OPERATION_TYPES = [...VALID_OPERATION_TYPES, ...BATCH_OPERATION_TYPES];

const OPERATION_DESC_MAP = {
  PIN: '置顶评论',
  CANCEL_PIN: '取消置顶',
  ESSENCE: '标记精华',
  CANCEL_ESSENCE: '取消精华',
  BLOCK: '隐藏评论',
  DELETE: '删除评论',
  BATCH_PIN: '批量置顶',
  BATCH_BLOCK: '批量隐藏',
  BATCH_DELETE: '批量删除',
  BATCH_CLEAN: '批量清理',
};

class CommentManageService {
  async getCommentManageList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);

    const where = {};
    const contentWhere = {};
    const endUserWhere = {};
    let useContentInclude = false;
    let useEndUserInclude = false;
    let filterCount = 0;

    if (query.contentCategory !== undefined && query.contentCategory !== null && query.contentCategory !== '') {
      contentWhere.content_category = Number(query.contentCategory);
      useContentInclude = true;
      filterCount++;
    }

    if (query.startDate && query.endDate) {
      where.created_at = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
      filterCount++;
    }

    if (query.userLevel !== undefined && query.userLevel !== null && query.userLevel !== '') {
      endUserWhere.member_level = Number(query.userLevel);
      useEndUserInclude = true;
      filterCount++;
    }

    if (query.violationStatus !== undefined && query.violationStatus !== null && query.violationStatus !== '') {
      where.violation_level = Number(query.violationStatus);
      filterCount++;
    }

    if (query.auditStatus !== undefined && query.auditStatus !== null && query.auditStatus !== '') {
      where.audit_status = Number(query.auditStatus);
      filterCount++;
    }

    if (query.commentStatus !== undefined && query.commentStatus !== null && query.commentStatus !== '') {
      where.comment_status = Number(query.commentStatus);
      filterCount++;
    }

    if (query.isTop !== undefined && query.isTop !== null && query.isTop !== '') {
      where.is_top = Number(query.isTop);
      filterCount++;
    }

    if (query.isEssence !== undefined && query.isEssence !== null && query.isEssence !== '') {
      where.is_essence = Number(query.isEssence);
      filterCount++;
    }

    if (query.isHot !== undefined && query.isHot !== null && query.isHot !== '') {
      where.is_hot = Number(query.isHot);
      filterCount++;
    }

    if (query.minReportCount !== undefined && query.minReportCount !== null && query.minReportCount !== '') {
      where.report_count = where.report_count || {};
      where.report_count[Op.gte] = Number(query.minReportCount);
      filterCount++;
    }

    if (query.maxReportCount !== undefined && query.maxReportCount !== null && query.maxReportCount !== '') {
      where.report_count = where.report_count || {};
      where.report_count[Op.lte] = Number(query.maxReportCount);
      filterCount++;
    }

    if (query.minLikeCount !== undefined && query.minLikeCount !== null && query.minLikeCount !== '') {
      where.like_count = where.like_count || {};
      where.like_count[Op.gte] = Number(query.minLikeCount);
      filterCount++;
    }

    if (query.maxLikeCount !== undefined && query.maxLikeCount !== null && query.maxLikeCount !== '') {
      where.like_count = where.like_count || {};
      where.like_count[Op.lte] = Number(query.maxLikeCount);
      filterCount++;
    }

    if (query.keyword) {
      where.comment_content = { [Op.like]: `%${query.keyword}%` };
      filterCount++;
    }

    const include = [];

    include.push({
      model: Content,
      as: 'content',
      attributes: ['id', 'content_title', 'content_category'],
      where: Object.keys(contentWhere).length > 0 ? contentWhere : undefined,
      required: Object.keys(contentWhere).length > 0,
    });

    include.push({
      model: EndUser,
      as: 'endUser',
      attributes: ['id', 'uid', 'nickname', 'member_level', 'activity_level', 'account_status'],
      where: Object.keys(endUserWhere).length > 0 ? endUserWhere : undefined,
      required: Object.keys(endUserWhere).length > 0,
    });

    include.push({
      model: CommentManageLog,
      as: 'manageLogs',
      attributes: ['id', 'operation_type', 'operation_desc', 'operator_name', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 1,
      separate: true,
    });

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include,
      offset,
      limit: pageSize,
      order,
      distinct: true,
    });

    if (filterCount >= 6 && rows.length === 0) {
      throw new BadRequestError('筛选条件超限，请缩小查询范围');
    }

    return {
      list: rows.map((c) => {
        const lastLog = c.manageLogs && c.manageLogs.length > 0 ? c.manageLogs[0] : null;
        return {
          id: c.id,
          contentId: c.content_id,
          userId: c.user_id,
          parentId: c.parent_id,
          content: c.comment_content,
          images: c.comment_images,
          likeCount: c.like_count,
          replyCount: c.reply_count,
          isTop: c.is_top,
          isEssence: c.is_essence,
          isHot: c.is_hot,
          topTime: c.top_time,
          essenceTime: c.essence_time,
          reportCount: c.report_count,
          commentStatus: c.comment_status,
          auditStatus: c.audit_status,
          violationLevel: c.violation_level,
          violationType: c.violation_type,
          ipAddress: c.ip_address,
          source: c.source,
          createdAt: c.created_at,
          contentInfo: c.content ? {
            id: c.content.id,
            title: c.content.content_title,
            category: c.content.content_category,
          } : null,
          userInfo: c.endUser ? {
            id: c.endUser.id,
            uid: c.endUser.uid,
            nickname: c.endUser.nickname,
            memberLevel: c.endUser.member_level,
            activityLevel: c.endUser.activity_level,
            accountStatus: c.endUser.account_status,
          } : null,
          lastOperation: lastLog ? {
            id: lastLog.id,
            operationType: lastLog.operation_type,
            operationDesc: lastLog.operation_desc,
            operatorName: lastLog.operator_name,
            createdAt: lastLog.created_at,
          } : null,
        };
      }),
      total: count,
      page,
      pageSize,
    };
  }

  async operateComment(id, operationType, operatorId, operatorName, ip, remark) {
    if (!VALID_OPERATION_TYPES.includes(operationType)) {
      throw new BadRequestError(`不支持的操作类型: ${operationType}`);
    }

    const comment = await Comment.findByPk(id);
    if (!comment) throw new NotFoundError('评论不存在');

    const beforeData = {
      is_top: comment.is_top,
      is_essence: comment.is_essence,
      comment_status: comment.comment_status,
      top_time: comment.top_time,
      essence_time: comment.essence_time,
    };

    const updateData = {};
    const now = new Date();

    switch (operationType) {
      case 'PIN':
        updateData.is_top = 1;
        updateData.top_time = now;
        break;
      case 'CANCEL_PIN':
        updateData.is_top = 0;
        updateData.top_time = null;
        break;
      case 'ESSENCE':
        updateData.is_essence = 1;
        updateData.essence_time = now;
        break;
      case 'CANCEL_ESSENCE':
        updateData.is_essence = 0;
        updateData.essence_time = null;
        break;
      case 'BLOCK':
        updateData.comment_status = 2;
        break;
      case 'DELETE':
        updateData.comment_status = 3;
        break;
    }

    await Comment.update(updateData, { where: { id } });

    const afterData = { ...beforeData, ...updateData };

    await CommentManageLog.create({
      comment_id: id,
      content_id: comment.content_id,
      user_id: comment.user_id,
      operation_type: operationType,
      operation_desc: OPERATION_DESC_MAP[operationType] || operationType,
      before_data: beforeData,
      after_data: afterData,
      operator_id: operatorId,
      operator_name: operatorName,
      ip_address: ip,
      remark: remark || null,
    });

    const updatedComment = await Comment.findByPk(id);

    return {
      success: true,
      commentStatus: updatedComment.comment_status,
      isTop: updatedComment.is_top,
      isEssence: updatedComment.is_essence,
    };
  }

  async batchOperateComments(ids, operationType, operatorId, operatorName, ip, remark) {
    if (!BATCH_OPERATION_TYPES.includes(operationType)) {
      throw new BadRequestError(`不支持的批量操作类型: ${operationType}`);
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('请选择要操作的评论');
    }

    const batchNo = generateBatchNo('CM');

    const actualOpType = operationType === 'BATCH_CLEAN' ? 'DELETE' : operationType.replace('BATCH_', '');

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const successIds = [];
    const skippedIds = [];

    const comments = await Comment.findAll({
      where: { id: { [Op.in]: ids.map(Number) } },
    });

    for (const comment of comments) {
      try {
        let shouldSkip = false;
        let skipReason = '';

        if (actualOpType === 'PIN') {
          if (comment.is_top === 1) {
            shouldSkip = true;
            skipReason = '已置顶';
          }
        } else if (actualOpType === 'ESSENCE') {
          if (comment.is_essence === 1) {
            shouldSkip = true;
            skipReason = '已标记精华';
          }
        } else if (actualOpType === 'BLOCK') {
          if (comment.comment_status === 2 || comment.comment_status === 3) {
            shouldSkip = true;
            skipReason = '已隐藏或已删除';
          }
        }

        if (shouldSkip) {
          skippedCount++;
          skippedIds.push(comment.id);
          continue;
        }

        const beforeData = {
          is_top: comment.is_top,
          is_essence: comment.is_essence,
          comment_status: comment.comment_status,
          top_time: comment.top_time,
          essence_time: comment.essence_time,
        };

        const updateData = {};
        const now = new Date();

        switch (actualOpType) {
          case 'PIN':
            updateData.is_top = 1;
            updateData.top_time = now;
            break;
          case 'ESSENCE':
            updateData.is_essence = 1;
            updateData.essence_time = now;
            break;
          case 'BLOCK':
            updateData.comment_status = 2;
            break;
          case 'DELETE':
            updateData.comment_status = 3;
            break;
        }

        await Comment.update(updateData, { where: { id: comment.id } });

        const afterData = { ...beforeData, ...updateData };

        await CommentManageLog.create({
          comment_id: comment.id,
          content_id: comment.content_id,
          user_id: comment.user_id,
          operation_type: operationType,
          operation_desc: OPERATION_DESC_MAP[operationType] || operationType,
          before_data: beforeData,
          after_data: afterData,
          operator_id: operatorId,
          operator_name: operatorName,
          operation_batch: batchNo,
          is_hot_comment: comment.is_hot,
          ip_address: ip,
          remark: remark || null,
        });

        successCount++;
        successIds.push(comment.id);
      } catch (err) {
        failedCount++;
      }
    }

    return {
      batchId: batchNo,
      total: ids.length,
      successCount,
      failedCount,
      skippedCount,
      successIds,
      skippedIds,
    };
  }

  async traceComment(query) {
    const { commentId, contentId, userUid } = query;

    let commentIds = [];

    if (commentId) {
      const comment = await Comment.findByPk(Number(commentId));
      if (!comment) throw new NotFoundError('评论不存在');
      commentIds = [comment.id];
    } else if (contentId) {
      const comments = await Comment.findAll({
        where: { content_id: Number(contentId) },
      });
      if (comments.length === 0) throw new NotFoundError('该内容下无评论');
      commentIds = comments.map((c) => c.id);
    } else if (userUid) {
      const user = await EndUser.findOne({ where: { uid: userUid } });
      if (!user) throw new NotFoundError('用户不存在');
      const comments = await Comment.findAll({
        where: { user_id: user.id },
      });
      if (comments.length === 0) throw new NotFoundError('该用户无评论');
      commentIds = comments.map((c) => c.id);
    } else {
      throw new BadRequestError('请提供commentId、contentId或userUid');
    }

    const comments = await Comment.findAll({
      where: { id: { [Op.in]: commentIds } },
      include: [
        { model: Content, as: 'content', attributes: ['id', 'content_title', 'content_category'] },
        { model: EndUser, as: 'endUser', attributes: ['id', 'uid', 'nickname', 'member_level', 'account_status'] },
      ],
    });

    const allLogs = await CommentManageLog.findAll({
      where: { comment_id: { [Op.in]: commentIds } },
      order: [['created_at', 'ASC']],
    });

    const logMap = {};
    for (const log of allLogs) {
      if (!logMap[log.comment_id]) logMap[log.comment_id] = [];
      logMap[log.comment_id].push(log);
    }

    const duplicateOperations = [];
    const abnormalOperations = [];
    const misjudgedComments = [];

    for (const [cId, logs] of Object.entries(logMap)) {
      for (let i = 0; i < logs.length; i++) {
        for (let j = i + 1; j < logs.length; j++) {
          const diff = (new Date(logs[j].created_at) - new Date(logs[i].created_at)) / 60000;
          if (diff <= 5 && diff > 0 && logs[i].operation_type === logs[j].operation_type) {
            duplicateOperations.push({
              commentId: Number(cId),
              operationType: logs[i].operation_type,
              firstTime: logs[i].created_at,
              secondTime: logs[j].created_at,
              intervalMinutes: Math.round(diff * 10) / 10,
            });
          }
        }
      }
    }

    for (const comment of comments) {
      const logs = logMap[comment.id] || [];

      for (const log of logs) {
        if ((log.operation_type === 'PIN' || log.operation_type === 'BATCH_PIN') && comment.comment_status === 2) {
          abnormalOperations.push({
            commentId: comment.id,
            operationType: log.operation_type,
            reason: '对已隐藏评论执行置顶操作',
            operationTime: log.created_at,
          });
        }
        if ((log.operation_type === 'ESSENCE' || log.operation_type === 'BATCH_ESSENCE') && comment.comment_status === 3) {
          abnormalOperations.push({
            commentId: comment.id,
            operationType: log.operation_type,
            reason: '对已删除评论执行精华操作',
            operationTime: log.created_at,
          });
        }
      }

      if (comment.violation_level >= 2 && (comment.is_essence === 1 || comment.is_top === 1)) {
        misjudgedComments.push({
          commentId: comment.id,
          violationLevel: comment.violation_level,
          isTop: comment.is_top,
          isEssence: comment.is_essence,
          reason: `违规等级${comment.violation_level}的评论被标记为${comment.is_top === 1 ? '置顶' : ''}${comment.is_essence === 1 ? '精华' : ''}`,
        });
      }

      if (comment.violation_level === 0 && comment.comment_status === 3) {
        misjudgedComments.push({
          commentId: comment.id,
          violationLevel: comment.violation_level,
          commentStatus: comment.comment_status,
          reason: '无违规记录的评论被删除',
        });
      }
    }

    return {
      comments: comments.map((c) => ({
        id: c.id,
        contentId: c.content_id,
        userId: c.user_id,
        content: c.comment_content,
        isTop: c.is_top,
        isEssence: c.is_essence,
        isHot: c.is_hot,
        reportCount: c.report_count,
        commentStatus: c.comment_status,
        violationLevel: c.violation_level,
        violationType: c.violation_type,
        createdAt: c.created_at,
        contentInfo: c.content ? {
          id: c.content.id,
          title: c.content.content_title,
          category: c.content.content_category,
        } : null,
        userInfo: c.endUser ? {
          id: c.endUser.id,
          uid: c.endUser.uid,
          nickname: c.endUser.nickname,
          memberLevel: c.endUser.member_level,
          accountStatus: c.endUser.account_status,
        } : null,
        timeline: (logMap[c.id] || []).map((l) => ({
          id: l.id,
          operationType: l.operation_type,
          operationDesc: l.operation_desc,
          operatorName: l.operator_name,
          isHotComment: l.is_hot_comment,
          createdAt: l.created_at,
        })),
      })),
      duplicateOperations,
      abnormalOperations,
      misjudgedComments,
    };
  }

  async checkDuplicateOperation(commentId, operationType) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const lastOperation = await CommentManageLog.findOne({
      where: {
        comment_id: Number(commentId),
        operation_type: operationType,
        created_at: { [Op.gte]: fiveMinutesAgo },
      },
      order: [['created_at', 'DESC']],
    });

    return {
      isDuplicate: !!lastOperation,
      lastOperation: lastOperation ? {
        id: lastOperation.id,
        operationType: lastOperation.operation_type,
        operationDesc: lastOperation.operation_desc,
        operatorName: lastOperation.operator_name,
        createdAt: lastOperation.created_at,
      } : null,
    };
  }

  async validateOperation(commentId, operationType) {
    const comment = await Comment.findByPk(Number(commentId));
    if (!comment) throw new NotFoundError('评论不存在');

    const reasons = [];
    let valid = true;

    switch (operationType) {
      case 'PIN':
        if (comment.is_top === 1) {
          valid = false;
          reasons.push('评论已置顶');
        }
        if (comment.comment_status === 2) {
          valid = false;
          reasons.push('不能置顶已隐藏的评论');
        }
        if (comment.comment_status === 3) {
          valid = false;
          reasons.push('不能置顶已删除的评论');
        }
        break;
      case 'CANCEL_PIN':
        if (comment.is_top === 0) {
          valid = false;
          reasons.push('评论未置顶');
        }
        break;
      case 'ESSENCE':
        if (comment.is_essence === 1) {
          valid = false;
          reasons.push('评论已标记精华');
        }
        if (comment.comment_status === 2) {
          valid = false;
          reasons.push('不能对已隐藏评论标记精华');
        }
        if (comment.comment_status === 3) {
          valid = false;
          reasons.push('不能对已删除评论标记精华');
        }
        break;
      case 'CANCEL_ESSENCE':
        if (comment.is_essence === 0) {
          valid = false;
          reasons.push('评论未标记精华');
        }
        break;
      case 'BLOCK':
        if (comment.comment_status === 2) {
          valid = false;
          reasons.push('评论已隐藏');
        }
        if (comment.comment_status === 3) {
          valid = false;
          reasons.push('评论已删除，无需隐藏');
        }
        break;
      case 'DELETE':
        if (comment.comment_status === 3) {
          valid = false;
          reasons.push('评论已删除');
        }
        break;
    }

    return { valid, reasons };
  }
}

module.exports = new CommentManageService();
