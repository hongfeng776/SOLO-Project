const { Comment, Content, User } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');
const riskControlService = require('./RiskControlService');

class CommentService {
  async getCommentList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['comment_content']);

    const where = { ...search };

    if (query.contentId) where.content_id = query.contentId;
    if (query.userId) where.user_id = query.userId;
    if (query.commentStatus !== undefined) where.comment_status = query.commentStatus;
    if (query.violationLevel !== undefined) where.violation_level = query.violationLevel;

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        { model: Content, as: 'content', attributes: ['id', 'content_title', 'content_category'] },
        { model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] },
      ],
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((comment) => ({
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
        violationLevel: comment.violation_level,
        violationType: comment.violation_type,
        filterResult: comment.filter_result,
        auditStatus: comment.audit_status,
        ipAddress: comment.ip_address,
        source: comment.source,
        createdAt: comment.created_at,
        contentInfo: comment.content ? {
          id: comment.content.id,
          title: comment.content.content_title,
          category: comment.content.content_category,
        } : null,
        commentUser: comment.commentUser ? {
          id: comment.commentUser.id,
          username: comment.commentUser.username,
          realName: comment.commentUser.real_name,
          avatar: comment.commentUser.avatar,
        } : null,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getCommentById(id) {
    const comment = await Comment.findByPk(id, {
      include: [
        { model: Comment, as: 'replies', include: [{ model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] }] },
        { model: User, as: 'commentUser', attributes: ['id', 'username', 'real_name', 'avatar'] },
      ],
    });
    if (!comment) {
      throw new NotFoundError('评论不存在');
    }
    return {
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
      violationLevel: comment.violation_level,
      violationType: comment.violation_type,
      filterResult: comment.filter_result,
      auditStatus: comment.audit_status,
      auditRemark: comment.audit_remark,
      auditorId: comment.auditor_id,
      auditTime: comment.audit_time,
      ipAddress: comment.ip_address,
      source: comment.source,
      createdAt: comment.created_at,
      commentUser: comment.commentUser ? {
        id: comment.commentUser.id,
        username: comment.commentUser.username,
        realName: comment.commentUser.real_name,
        avatar: comment.commentUser.avatar,
      } : null,
      replies: (comment.replies || []).map((reply) => ({
        id: reply.id,
        userId: reply.user_id,
        content: reply.comment_content,
        likeCount: reply.like_count,
        commentStatus: reply.comment_status,
        createdAt: reply.created_at,
        commentUser: reply.commentUser ? {
          id: reply.commentUser.id,
          username: reply.commentUser.username,
          realName: reply.commentUser.real_name,
          avatar: reply.commentUser.avatar,
        } : null,
      })),
    };
  }

  async createComment(data, ip) {
    const filterResult = await riskControlService.filterComment(data.content, data.userId, ip);

    const commentStatus = filterResult.isSafe ? 1 : 0;

    const comment = await Comment.create({
      content_id: data.contentId,
      user_id: data.userId,
      parent_id: data.parentId || null,
      reply_to_user_id: data.replyToUserId || null,
      comment_content: data.content,
      comment_images: data.images || [],
      ip_address: ip,
      source: data.source || 'web',
      comment_status: commentStatus,
      violation_level: filterResult.violationLevel,
      violation_type: filterResult.violationType,
      filter_result: filterResult.filterResult,
      audit_status: filterResult.isSafe ? 0 : 0,
    });

    return comment.id;
  }

  async updateComment(id, data) {
    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new NotFoundError('评论不存在');
    }

    const updateData = {};
    if (data.commentStatus !== undefined) updateData.comment_status = data.commentStatus;
    if (data.isTop !== undefined) updateData.is_top = data.isTop;
    if (data.isHot !== undefined) updateData.is_hot = data.isHot;

    await Comment.update(updateData, { where: { id } });
    return true;
  }

  async deleteComment(id) {
    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new NotFoundError('评论不存在');
    }
    await comment.destroy();
    return true;
  }

  async batchDeleteComments(ids) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要删除的评论');
    }
    await Comment.destroy({ where: { id: { [Op.in]: ids } } });
    return true;
  }

  async auditComment(id, { commentStatus, auditRemark }, auditorId) {
    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new NotFoundError('评论不存在');
    }
    await Comment.update({
      comment_status: commentStatus,
      audit_status: commentStatus === 1 ? 1 : 2,
      audit_remark: auditRemark,
      auditor_id: auditorId,
      audit_time: new Date(),
    }, { where: { id } });
    return true;
  }

  async batchAuditComments(ids, data, auditorId) {
    if (!ids || ids.length === 0) {
      throw new BadRequestError('请选择要审核的评论');
    }
    await Comment.update({
      comment_status: data.commentStatus,
      audit_status: data.commentStatus === 1 ? 1 : 2,
      audit_remark: data.auditRemark,
      auditor_id: auditorId,
      audit_time: new Date(),
    }, { where: { id: { [Op.in]: ids } } });
    return true;
  }

  async getCommentStats(contentId) {
    const where = {};
    if (contentId) where.content_id = contentId;

    const total = await Comment.count({ where });

    const statusStats = await Comment.findAll({
      where,
      attributes: ['comment_status', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['comment_status'],
      raw: true,
    });

    const violationCount = await Comment.count({
      where: { ...where, violation_level: { [Op.gt]: 0 } },
    });

    const statusMap = {};
    for (const item of statusStats) {
      statusMap[item.comment_status] = Number(item.count);
    }

    return {
      total,
      statusStats: statusMap,
      violationCount,
    };
  }
}

module.exports = new CommentService();
