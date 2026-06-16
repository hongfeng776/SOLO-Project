const { Violation, Resource, Appeal } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')
const notificationService = require('./notificationService')

class ViolationService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['resourceTitle', 'description']))
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.violationType) {
      where.violationType = params.violationType
    }

    if (params.violationLevel) {
      where.violationLevel = params.violationLevel
    }

    const { count, rows } = await Violation.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async getDetail(id) {
    const violation = await Violation.findByPk(id, {
      include: [
        { model: Resource, as: 'resource', attributes: ['id', 'title', 'status', 'fileType'] },
        { model: Appeal, as: 'appeal' }
      ]
    })

    if (!violation) {
      throw ApiError.notFound('违规记录不存在')
    }

    return violation
  }

  async create(data, handler) {
    const violation = await Violation.create({
      ...data,
      handlerId: handler.id,
      handlerName: handler.username,
      status: 'pending'
    })

    await Resource.increment('violationCount', {
      where: { id: data.resourceId }
    })

    if (data.action === 'removed') {
      await Resource.update({ status: 'offline' }, {
        where: { id: data.resourceId }
      })
    }

    if (violation.authorId) {
      await this.createNotification(
        violation.authorId,
        '资源违规通知',
        `您的资源"${violation.resourceTitle}"被标记为违规，违规类型：${violation.violationType}`,
        'violation',
        violation.id
      )
    }

    return violation
  }

  async handleViolation(id, action, handler) {
    const violation = await Violation.findByPk(id)

    if (!violation) {
      throw ApiError.notFound('违规记录不存在')
    }

    if (violation.status === 'processed') {
      throw ApiError.badRequest('该违规记录已处理')
    }

    await violation.update({
      action,
      handlerId: handler.id,
      handlerName: handler.username,
      actionTime: new Date(),
      status: 'processed'
    })

    if (action === 'removed') {
      await Resource.update({ status: 'offline' }, {
        where: { id: violation.resourceId }
      })
    }

    if (action === 'banned') {
      await Resource.update({ status: 'offline', isBlocked: true, blockReason: '违规被封禁' }, {
        where: { id: violation.resourceId }
      })
    }

    if (violation.authorId) {
      const actionMap = {
        warning: '警告',
        removed: '下架',
        banned: '封禁',
        appeal_allowed: '允许申诉'
      }
      await this.createNotification(
        violation.authorId,
        '违规处置通知',
        `您的资源"${violation.resourceTitle}"违规处置结果：${actionMap[action] || action}`,
        'violation',
        violation.id
      )
    }

    return violation
  }

  async batchHandle(ids, action, handler) {
    const violations = await Violation.findAll({
      where: {
        id: { [Op.in]: ids },
        status: { [Op.ne]: 'processed' }
      }
    })

    if (violations.length === 0) {
      throw ApiError.badRequest('没有可处理的违规记录')
    }

    const updateData = {
      action,
      handlerId: handler.id,
      handlerName: handler.username,
      actionTime: new Date(),
      status: 'processed'
    }

    await Violation.update(updateData, {
      where: {
        id: { [Op.in]: violations.map((v) => v.id) }
      }
    })

    const resourceIds = [...new Set(violations.map((v) => v.resourceId))]

    if (action === 'removed') {
      await Resource.update({ status: 'offline' }, {
        where: { id: { [Op.in]: resourceIds } }
      })
    }

    if (action === 'banned') {
      await Resource.update({ status: 'offline', isBlocked: true, blockReason: '违规被封禁' }, {
        where: { id: { [Op.in]: resourceIds } }
      })
    }

    for (const violation of violations) {
      if (violation.authorId) {
        await this.createNotification(
          violation.authorId,
          '违规处置通知',
          `您的资源"${violation.resourceTitle}"已被批量处置`,
          'violation',
          violation.id
        )
      }
    }

    return violations.length
  }

  async getStats() {
    const typeStats = await Violation.findAll({
      attributes: ['violationType', [Violation.sequelize.fn('COUNT', '*'), 'count']],
      group: ['violationType']
    })

    const levelStats = await Violation.findAll({
      attributes: ['violationLevel', [Violation.sequelize.fn('COUNT', '*'), 'count']],
      group: ['violationLevel']
    })

    const statusStats = await Violation.findAll({
      attributes: ['status', [Violation.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status']
    })

    return {
      byType: typeStats.map((s) => ({ type: s.violationType, count: parseInt(s.getDataValue('count')) })),
      byLevel: levelStats.map((s) => ({ level: s.violationLevel, count: parseInt(s.getDataValue('count')) })),
      byStatus: statusStats.map((s) => ({ status: s.status, count: parseInt(s.getDataValue('count')) }))
    }
  }

  async createNotification(userId, title, content, type, relatedId) {
    await notificationService.create({
      userId,
      title,
      content,
      type,
      relatedId,
      relatedType: 'violation'
    })
  }
}

module.exports = new ViolationService()
