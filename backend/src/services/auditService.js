const { AuditRecord, Resource, User } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')

class AuditService {
  async getPendingList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {
      status: 'pending'
    }

    if (params.resourceType) {
      where.fileType = params.resourceType
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
    const { result, opinion, level } = auditData

    const resource = await Resource.findByPk(resourceId)
    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.status !== 'pending') {
      throw ApiError.badRequest('该资源不是待审核状态')
    }

    const newStatus = result === 'approved' ? 'approved' : 'rejected'

    await resource.update({
      status: newStatus,
      auditLevel: level,
      auditOpinion: opinion
    })

    const record = await AuditRecord.create({
      resourceId,
      resourceType: resource.fileType,
      resourceTitle: resource.title,
      auditorId: auditor.id,
      auditorName: auditor.username || auditor.nickname,
      auditLevel: level,
      auditResult: result,
      auditOpinion: opinion,
      auditTime: new Date()
    })

    return record
  }

  async batchAudit(ids, auditData, auditor) {
    const results = []

    for (const id of ids) {
      try {
        const record = await this.auditResource(id, auditData, auditor)
        results.push({ id, success: true, record })
      } catch (error) {
        results.push({ id, success: false, message: error.message })
      }
    }

    return results
  }
}

module.exports = new AuditService()
