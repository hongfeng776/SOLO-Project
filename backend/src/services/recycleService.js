const { Recycle, Resource, Category, OperationLog, Notification } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')
const ApiError = require('../utils/apiError')
const cache = require('../utils/cache')

const OFFLINE_EXPIRE_DAYS = 30
const RECYCLE_EXPIRE_DAYS = 90

class RecycleService {
  async validateDiscard(resourceId) {
    const resource = await Resource.findByPk(resourceId)
    if (!resource) throw ApiError.notFound('素材不存在')

    const errors = []
    const warnings = []

    const now = new Date()
    let offlineDays = 0
    if (resource.status === 'offline' && resource.offlineAt) {
      offlineDays = Math.floor((now - new Date(resource.offlineAt)) / (24 * 60 * 60 * 1000))
    }

    const relatedWorks = (resource.viewCount || 0) + (resource.downloadCount || 0) + (resource.likeCount || 0)
    const inUse = resource.status === 'published' || (resource.viewCount || 0) > 100
    if (inUse) {
      errors.push(`素材当前状态为「${resource.status}」，正在使用中，禁止直接废弃`)
    }

    if (resource.status !== 'offline' && !['rejected', 'draft', 'violation', 'blocked'].includes(resource.status)) {
      errors.push('仅已下架、草稿、已拒绝、违规、风控拦截状态的素材可申请废弃')
    }

    if (resource.status === 'offline' && offlineDays < OFFLINE_EXPIRE_DAYS) {
      warnings.push(`素材已下架 ${offlineDays} 天，建议下架满 ${OFFLINE_EXPIRE_DAYS} 天后废弃`)
    }

    const pendingRecycle = await Recycle.findOne({
      where: { resourceId, reviewStatus: 'pending', isDestroyed: false }
    })
    if (pendingRecycle) {
      errors.push('该素材已存在待审核的废弃申请，请勿重复提交')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      offlineDays,
      relatedWorks,
      resource: resource.toJSON()
    }
  }

  async submitDiscard(resourceId, reason, applicant) {
    const validate = await this.validateDiscard(resourceId)
    if (!validate.valid) {
      throw ApiError.badRequest(validate.errors.join('；'))
    }

    const resource = validate.resource
    const snapshot = JSON.stringify(resource)

    const expireAt = new Date(Date.now() + RECYCLE_EXPIRE_DAYS * 24 * 60 * 60 * 1000)

    const recycle = await Recycle.create({
      resourceId,
      resourceTitle: resource.title,
      resourceType: resource.fileType || 'image',
      materialCode: resource.materialCode,
      originalStatus: resource.status,
      originalCategoryId: resource.categoryId,
      originalCategoryName: resource.categoryName,
      authorId: resource.authorId,
      authorName: resource.authorName,
      discardReason: reason,
      applicantId: applicant.id,
      applicantName: applicant.username || applicant.name || 'operator',
      applyTime: new Date(),
      offlineDays: validate.offlineDays,
      relatedWorks: validate.relatedWorks,
      snapshot,
      expireAt
    })

    const resourceInstance = await Resource.findByPk(resourceId)
    if (resourceInstance) {
      await resourceInstance.update({
        isBlocked: true,
        blockReason: '已提交废弃申请，操作权限冻结'
      })
    }

    await OperationLog.create({
      userId: applicant.id,
      username: applicant.username || 'operator',
      module: 'recycle',
      action: 'discard_apply',
      target: resource.title,
      targetId: resourceId,
      detail: JSON.stringify({ reason, offlineDays: validate.offlineDays }),
      result: 'success'
    })

    await Notification.create({
      userId: 1,
      title: '新的废弃申请待审核',
      content: `素材「${resource.title}」已提交废弃申请，请及时审核`,
      type: 'audit',
      relatedId: recycle.id,
      relatedType: 'recycle',
      priority: 'high'
    })

    cache.deleteByPrefix && cache.deleteByPrefix('resource_list_')
    cache.deleteByPrefix && cache.deleteByPrefix('recycle_list_')

    return recycle
  }

  async reviewDiscard(recycleId, result, opinion, reviewer) {
    const recycle = await Recycle.findByPk(recycleId)
    if (!recycle) throw ApiError.notFound('废弃申请不存在')
    if (recycle.reviewStatus !== 'pending') {
      throw ApiError.badRequest('该申请已审核，不可重复操作')
    }

    const resource = await Resource.findByPk(recycle.resourceId)

    await recycle.update({
      reviewStatus: result,
      reviewerId: reviewer.id,
      reviewerName: reviewer.username || reviewer.name || 'admin',
      reviewOpinion: opinion,
      reviewTime: new Date()
    })

    if (result === 'approved') {
      if (resource) {
        await resource.update({
          status: 'offline',
          isBlocked: true,
          blockReason: '已废弃，移入回收站'
        })
      }
    } else {
      if (resource) {
        await resource.update({
          status: recycle.originalStatus,
          isBlocked: false,
          blockReason: null
        })
      }
    }

    await OperationLog.create({
      userId: reviewer.id,
      username: reviewer.username || 'admin',
      module: 'recycle',
      action: 'discard_review_' + result,
      target: recycle.resourceTitle,
      targetId: recycle.resourceId,
      detail: JSON.stringify({ opinion, result }),
      result: 'success'
    })

    await Notification.create({
      userId: recycle.applicantId,
      title: `废弃申请已${result === 'approved' ? '通过' : '驳回'}`,
      content: `您提交的「${recycle.resourceTitle}」废弃申请已${result === 'approved' ? '通过，素材已移入回收站' : '驳回：' + opinion}`,
      type: 'audit',
      relatedId: recycle.id,
      relatedType: 'recycle',
      priority: 'normal'
    })

    cache.deleteByPrefix && cache.deleteByPrefix('recycle_list_')
    return recycle
  }

  async batchDiscard(resourceIds, reason, applicant) {
    const results = { valid: [], invalid: [], submitted: [], total: resourceIds.length }

    for (const id of resourceIds) {
      try {
        const validate = await this.validateDiscard(id)
        if (validate.valid) {
          results.valid.push(id)
        } else {
          results.invalid.push({ id, title: validate.resource?.title || '素材#' + id, reason: validate.errors.join('；') })
        }
      } catch (err) {
        results.invalid.push({ id, reason: err.message })
      }
    }

    for (const id of results.valid) {
      try {
        const recycle = await this.submitDiscard(id, reason, applicant)
        results.submitted.push({ id, recycleId: recycle.id })
      } catch (err) {
        results.invalid.push({ id, reason: err.message })
      }
    }

    return results
  }

  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)
    const where = { isDestroyed: false }

    if (params.keyword) {
      where.resourceTitle = { [Op.like]: `%${params.keyword}%` }
    }
    if (params.reviewStatus) where.reviewStatus = params.reviewStatus
    if (params.resourceType) where.resourceType = params.resourceType
    if (params.applicantId) where.applicantId = params.applicantId

    const { count, rows } = await Recycle.findAndCountAll({
      where, offset, limit,
      order: [['createdAt', 'DESC']]
    })

    return { list: rows, total: count, page, pageSize }
  }

  async getDetail(recycleId) {
    const recycle = await Recycle.findByPk(recycleId, {
      include: [
        { model: Resource, as: 'resource', attributes: { exclude: ['snapshot'] } }
      ]
    })
    if (!recycle) throw ApiError.notFound('回收站记录不存在')
    return recycle
  }

  async validateRestore(recycleId) {
    const recycle = await Recycle.findByPk(recycleId)
    if (!recycle) throw ApiError.notFound('回收站记录不存在')
    if (recycle.isDestroyed) throw ApiError.badRequest('该素材已销毁，无法恢复')
    if (recycle.reviewStatus !== 'approved') throw ApiError.badRequest('该废弃申请未通过审核，无法恢复')

    const errors = []
    const resource = recycle.snapshot ? JSON.parse(recycle.snapshot) : null
    const category = recycle.originalCategoryId
      ? await Category.findByPk(recycle.originalCategoryId)
      : null

    if (recycle.expireAt && new Date() > new Date(recycle.expireAt)) {
      errors.push('素材已超过回收站保留期限（' + RECYCLE_EXPIRE_DAYS + '天），无法恢复')
    }
    if (!category || category.status === 'disabled') {
      errors.push(`原始分类「${recycle.originalCategoryName || '#ID:' + recycle.originalCategoryId}」已不存在或被禁用`)
    }
    if (resource && resource.violationCount > 2) {
      errors.push('素材违规次数过多（' + resource.violationCount + '次），需先处理违规记录方可恢复')
    }
    if (resource && (!resource.title || !resource.fileUrl)) {
      errors.push('素材快照数据不完整，缺少关键字段，无法恢复')
    }

    return {
      valid: errors.length === 0,
      errors,
      categoryExists: !!category,
      resource
    }
  }

  async restoreResource(recycleId, operator) {
    const validate = await this.validateRestore(recycleId)
    if (!validate.valid) throw ApiError.badRequest(validate.errors.join('；'))

    const recycle = await Recycle.findByPk(recycleId)
    if (!recycle) throw ApiError.notFound('记录不存在')
    const resource = await Resource.findByPk(recycle.resourceId)

    if (resource) {
      await resource.update({
        status: recycle.originalStatus === 'offline' ? 'draft' : recycle.originalStatus,
        isBlocked: false,
        blockReason: null,
        categoryId: recycle.originalCategoryId,
        categoryName: recycle.originalCategoryName
      })
    }

    await recycle.update({ isDestroyed: true })

    await OperationLog.create({
      userId: operator.id,
      username: operator.username || 'admin',
      module: 'recycle',
      action: 'restore',
      target: recycle.resourceTitle,
      targetId: recycle.resourceId,
      result: 'success'
    })

    cache.deleteByPrefix && cache.deleteByPrefix('resource_list_')
    cache.deleteByPrefix && cache.deleteByPrefix('recycle_list_')
    return { success: true, resourceId: recycle.resourceId }
  }

  async batchRestore(recycleIds, operator) {
    const results = { success: [], failed: [], total: recycleIds.length }
    for (const id of recycleIds) {
      try {
        await this.restoreResource(id, operator)
        results.success.push(id)
      } catch (err) {
        results.failed.push({ id, reason: err.message })
      }
    }
    return results
  }

  async getPendingCount() {
    return await Recycle.count({ where: { reviewStatus: 'pending', isDestroyed: false } })
  }
}

module.exports = new RecycleService()
