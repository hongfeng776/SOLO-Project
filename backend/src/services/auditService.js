const { AuditRecord, Resource, User, Violation, Notification } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')
const resourceService = require('./resourceService')
const violationService = require('./violationService')

class AuditService {
  async getPendingList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {
      status: 'pending'
    }

    if (params.resourceType) {
      where.fileType = params.resourceType
    }

    if (params.isBlocked !== undefined) {
      where.isBlocked = params.isBlocked
    }

    if (params.auditLevel) {
      where.auditLevel = params.auditLevel
    }

    const { count, rows } = await Resource.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'ASC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async getRecords(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      where.resourceTitle = {
        [Op.like]: `%${params.keyword}%`
      }
    }

    if (params.auditResult) {
      where.auditResult = params.auditResult
    }

    if (params.resourceType) {
      where.resourceType = params.resourceType
    }

    if (params.auditorId) {
      where.auditorId = params.auditorId
    }

    if (params.auditLevel) {
      where.auditLevel = params.auditLevel
    }

    if (params.startDate || params.endDate) {
      where.auditTime = {}
      if (params.startDate) {
        where.auditTime[Op.gte] = new Date(params.startDate)
      }
      if (params.endDate) {
        where.auditTime[Op.lte] = new Date(params.endDate)
      }
    }

    const { count, rows } = await AuditRecord.findAndCountAll({
      where,
      offset,
      limit,
      order: [['auditTime', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      page,
      pageSize
    }
  }

  async auditResource(resourceId, auditData, auditor) {
    const { result, opinion } = auditData

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.status !== 'pending') {
      throw ApiError.badRequest('该资源不是待审核状态')
    }

    const currentLevel = resource.auditLevel || 1

    let newStatus
    let newAuditLevel = currentLevel

    if (result === 'approved') {
      if (currentLevel < 3) {
        newStatus = 'pending'
        newAuditLevel = currentLevel + 1
      } else {
        newStatus = 'approved'
      }
    } else {
      newStatus = 'rejected'
    }

    if (newStatus !== resource.status) {
      if (!resourceService.validateTransition(resource.status, newStatus)) {
        throw ApiError.badRequest(`资源状态不能从 ${resource.status} 变更为 ${newStatus}`)
      }
    }

    await resource.update({
      status: newStatus,
      auditLevel: newAuditLevel,
      auditOpinion: opinion
    })

    const record = await AuditRecord.create({
      resourceId,
      resourceType: resource.fileType,
      resourceTitle: resource.title,
      auditorId: auditor.id,
      auditorName: auditor.username || auditor.nickname,
      auditLevel: currentLevel,
      auditResult: result,
      auditOpinion: opinion,
      auditTime: new Date()
    })

    if (resource.authorId) {
      let notifyTitle, notifyContent
      if (result === 'approved') {
        if (newStatus === 'approved') {
          notifyTitle = '审核通过通知'
          notifyContent = `您的资源"${resource.title}"已通过全部审核`
        } else {
          notifyTitle = '审核进度通知'
          notifyContent = `您的资源"${resource.title}"已通过第${currentLevel}级审核，等待第${newAuditLevel}级审核`
        }
      } else {
        notifyTitle = '审核拒绝通知'
        notifyContent = `您的资源"${resource.title}"审核未通过${opinion ? '，原因：' + opinion : ''}`
      }

      await Notification.create({
        userId: resource.authorId,
        title: notifyTitle,
        content: notifyContent,
        type: 'audit',
        relatedId: resourceId,
        relatedType: 'resource'
      })
    }

    return record
  }

  async batchAudit(ids, auditData, auditor) {
    const results = []
    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        const record = await this.auditResource(id, auditData, auditor)
        results.push({ id, success: true, record })
        successCount++
      } catch (error) {
        results.push({ id, success: false, message: error.message })
        failCount++
      }
    }

    return {
      results,
      summary: {
        total: ids.length,
        success: successCount,
        failed: failCount
      }
    }
  }

  async getAuditStats() {
    const total = await AuditRecord.count()
    const approved = await AuditRecord.count({ where: { auditResult: 'approved' } })
    const rejected = await AuditRecord.count({ where: { auditResult: 'rejected' } })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount = await AuditRecord.count({
      where: {
        auditTime: { [Op.gte]: todayStart }
      }
    })

    let avgDuration = 0
    const approvedResources = await Resource.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'createdAt']
    })

    if (approvedResources.length > 0) {
      const resourceIds = approvedResources.map((r) => r.id)
      const resourceMap = {}
      approvedResources.forEach((r) => {
        resourceMap[r.id] = new Date(r.createdAt)
      })

      const latestAudits = await AuditRecord.findAll({
        where: {
          resourceId: { [Op.in]: resourceIds },
          auditResult: 'approved'
        },
        attributes: [
          'resourceId',
          [AuditRecord.sequelize.fn('MAX', AuditRecord.sequelize.col('auditTime')), 'lastAuditTime']
        ],
        group: ['resourceId']
      })

      let totalDuration = 0
      let durationCount = 0
      for (const audit of latestAudits) {
        const createdAt = resourceMap[audit.resourceId]
        const lastAuditTime = audit.getDataValue('lastAuditTime')
        if (createdAt && lastAuditTime) {
          totalDuration += new Date(lastAuditTime) - createdAt
          durationCount++
        }
      }

      avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount / 1000 / 60) : 0
    }

    return {
      total,
      approved,
      rejected,
      todayCount,
      avgDuration
    }
  }

  async getViolationStats() {
    return await violationService.getStats()
  }
}

module.exports = new AuditService()
