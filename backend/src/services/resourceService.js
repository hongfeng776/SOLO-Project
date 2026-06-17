const { Resource, Category, User, OperationLog, AuditRecord, Violation } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateMaterialCode } = require('../utils/common')
const ApiError = require('../utils/apiError')
const cache = require('../utils/cache')

const STATUS_TRANSITIONS = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['published'],
  rejected: ['draft', 'pending'],
  published: ['offline'],
  offline: ['draft', 'published'],
  violation: ['offline'],
  blocked: ['pending', 'rejected']
}

const CORE_FIELDS = ['title', 'fileUrl', 'fileType', 'fileSize', 'width', 'height', 'duration', 'categoryId']
const ALLOWED_EDIT_FIELDS_WHEN_APPROVED = ['sortWeight', 'remark', 'tags', 'description']

const MB = 1024 * 1024

class ResourceService {
  async getList(params = {}) {
    const cacheKey = 'resource_list_' + JSON.stringify(params)
    return cache.getOrSet(cacheKey, async () => {
      const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

      const where = {}

      if (params.keyword) {
        Object.assign(where, buildFuzzyWhere(params.keyword, ['title', 'description']))
      }

      if (params.status) {
        where.status = params.status
      }

      if (params.categoryId) {
        where.categoryId = params.categoryId
      }

      if (params.fileType) {
        where.fileType = params.fileType
      }

      if (params.authorId) {
        where.authorId = params.authorId
      }

      if (params.isBlocked !== undefined) {
        where.isBlocked = params.isBlocked
      }

      const { count, rows } = await Resource.findAndCountAll({
        where,
        offset,
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      })

      const list = rows.map((item) => {
        const data = item.toJSON()
        if (data.category) {
          data.categoryName = data.category.name
        }
        delete data.category
        return data
      })

      return {
        list,
        total: count,
        page,
        pageSize
      }
    }, 60000)
  }

  async getDetail(id) {
    return cache.getOrSet('resource_detail_' + id, async () => {
      const resource = await Resource.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      })

      if (!resource) {
        throw ApiError.notFound('资源不存在')
      }

      const data = resource.toJSON()
      if (data.category) {
        data.categoryName = data.category.name
      }
      delete data.category

      return data
    }, 120000)
  }

  async create(data, userId) {
    const resource = await Resource.create({
      ...data,
      authorId: userId,
      status: 'draft'
    })

    this._clearListCache()

    return resource
  }

  async update(id, data) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.update(data)

    cache.delete('hot_resources')
    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async delete(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.destroy()

    cache.delete('hot_resources')
    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return true
  }

  async batchDelete(ids) {
    const result = await Resource.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    })

    cache.delete('hot_resources')
    for (const id of ids) {
      cache.delete('resource_detail_' + id)
    }
    this._clearListCache()

    return result
  }

  validateTransition(currentStatus, targetStatus) {
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(targetStatus)) {
      return false
    }
    return true
  }

  async updateStatus(id, status, reason) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (!this.validateTransition(resource.status, status)) {
      throw ApiError.badRequest(`资源状态不能从 ${resource.status} 变更为 ${status}`)
    }

    const updateData = { status }

    if (status === 'published') {
      updateData.publishedAt = new Date()
    }

    if (status === 'offline') {
      updateData.offlineAt = new Date()
      updateData.offlineReason = reason || '手动下架'
    }

    await resource.update(updateData)

    cache.delete('hot_resources')
    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async batchUpdateStatus(ids, status, reason) {
    const resources = await Resource.findAll({
      where: { id: { [Op.in]: ids } }
    })

    const validIds = []
    for (const resource of resources) {
      if (this.validateTransition(resource.status, status)) {
        validIds.push(resource.id)
      }
    }

    if (validIds.length === 0) {
      return { updated: 0 }
    }

    const updateData = { status }

    if (status === 'published') {
      updateData.publishedAt = new Date()
    }

    if (status === 'offline') {
      updateData.offlineAt = new Date()
      updateData.offlineReason = reason || '批量下架'
    }

    const result = await Resource.update(updateData, {
      where: { id: { [Op.in]: validIds } }
    })

    cache.delete('hot_resources')
    for (const id of validIds) {
      cache.delete('resource_detail_' + id)
    }
    this._clearListCache()

    return { updated: validIds.length, skipped: ids.length - validIds.length }
  }

  async submitForAudit(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.isBlocked) {
      throw ApiError.badRequest('资源已被风控拦截，无法提交审核')
    }

    if (resource.status !== 'draft' && resource.status !== 'rejected') {
      throw ApiError.badRequest('只有草稿或已拒绝状态可以提交审核')
    }

    await resource.update({ status: 'pending', auditLevel: 1 })

    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async publishResource(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.status !== 'approved') {
      throw ApiError.badRequest('只有审核通过的资源可以发布')
    }

    await resource.update({ status: 'published', publishedAt: new Date() })

    cache.delete('hot_resources')
    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async offlineResource(id, reason) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.status !== 'published') {
      throw ApiError.badRequest('只有已发布的资源可以下架')
    }

    await resource.update({
      status: 'offline',
      offlineAt: new Date(),
      offlineReason: reason || '手动下架'
    })

    cache.delete('hot_resources')
    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async blockResource(id, reason) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.update({
      isBlocked: true,
      blockReason: reason || '风控拦截'
    })

    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async unblockResource(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.update({
      isBlocked: false,
      blockReason: null
    })

    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async getHotResources(limit = 10) {
    return cache.getOrSet('hot_resources', async () => {
      const resources = await Resource.findAll({
        where: { status: 'published' },
        limit,
        order: [['viewCount', 'DESC']],
        attributes: ['id', 'title', 'coverUrl', 'fileType', 'viewCount', 'downloadCount', 'likeCount', 'authorName']
      })

      return resources
    }, 60000)
  }

  async incrementViewCount(id) {
    await Resource.increment('viewCount', { where: { id } })
  }

  async incrementDownloadCount(id) {
    await Resource.increment('downloadCount', { where: { id } })
  }

  async validateBeforeCreate(data, userId) {
    const errors = []

    const user = await User.findByPk(userId)
    if (!user || user.status !== 'active' || !['super_admin', 'admin', 'operator'].includes(user.role)) {
      errors.push('上传账号无权限，需operator及以上角色且状态为active')
    }

    if (data.fileType === 'image') {
      if (!data.width || !data.height || data.width < 200 || data.height < 200) {
        errors.push('image类型素材宽高均需>=200像素')
      }
    }
    if (data.fileType === 'video') {
      if (!data.width || !data.height || data.width < 480 || data.height < 480) {
        errors.push('video类型素材宽高均需>=480像素')
      }
      if (!data.duration || data.duration <= 0) {
        errors.push('video类型素材时长需大于0秒')
      }
    }

    if (data.fileType === 'image' && data.fileSize && data.fileSize > 10 * MB) {
      errors.push('image类型素材文件大小不能超过10MB')
    }
    if (data.fileType === 'video' && data.fileSize && data.fileSize > 500 * MB) {
      errors.push('video类型素材文件大小不能超过500MB')
    }

    const existing = await Resource.findOne({
      where: {
        title: data.title,
        fileType: data.fileType,
        categoryId: data.categoryId
      }
    })
    if (existing) {
      return {
        valid: errors.length === 0,
        errors,
        duplicate: true,
        existingResource: existing.toJSON()
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  async createWithValidation(data, userId) {
    const validation = await this.validateBeforeCreate(data, userId)
    if (!validation.valid) {
      throw ApiError.badRequest('录入校验不通过', validation.errors)
    }

    let materialCode = generateMaterialCode()
    let exists = await Resource.findOne({ where: { materialCode } })
    while (exists) {
      materialCode = generateMaterialCode()
      exists = await Resource.findOne({ where: { materialCode } })
    }

    const resolution = data.width && data.height ? `${data.width}x${data.height}` : null

    const resource = await Resource.create({
      ...data,
      authorId: userId,
      status: 'draft',
      materialCode,
      resolution
    })

    const user = await User.findByPk(userId)
    await OperationLog.create({
      userId,
      username: user ? user.username : '',
      module: 'resource',
      action: 'create',
      targetId: resource.id,
      target: resource.title,
      detail: JSON.stringify({ materialCode, title: resource.title, fileType: resource.fileType }),
      result: 'success'
    })

    this._clearListCache()

    return resource
  }

  async updateWithConstraint(id, data, userId) {
    const resource = await Resource.findByPk(id)
    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    const isApproved = ['approved', 'published'].includes(resource.status)

    if (isApproved) {
      const attemptedCoreFields = CORE_FIELDS.filter((f) => data[f] !== undefined && data[f] !== resource[f])
      if (attemptedCoreFields.length > 0) {
        const filtered = {}
        for (const key of ALLOWED_EDIT_FIELDS_WHEN_APPROVED) {
          if (data[key] !== undefined) {
            filtered[key] = data[key]
          }
        }
        data = filtered
      } else {
        const filtered = {}
        for (const key of ALLOWED_EDIT_FIELDS_WHEN_APPROVED) {
          if (data[key] !== undefined) {
            filtered[key] = data[key]
          }
        }
        data = filtered
      }
    }

    let oldCategoryId = null
    if (data.categoryId !== undefined && data.categoryId !== resource.categoryId) {
      oldCategoryId = resource.categoryId
    }

    if (data.width !== undefined || data.height !== undefined) {
      const newWidth = data.width !== undefined ? data.width : resource.width
      const newHeight = data.height !== undefined ? data.height : resource.height
      if (newWidth && newHeight) {
        data.resolution = `${newWidth}x${newHeight}`
      }
    }

    const changedFields = Object.keys(data).filter((k) => data[k] !== resource[k])

    await resource.update(data)

    const user = await User.findByPk(userId)
    await OperationLog.create({
      userId,
      username: user ? user.username : '',
      module: 'resource',
      action: 'update',
      targetId: resource.id,
      target: resource.title,
      detail: JSON.stringify({
        changedFields,
        oldCategoryId,
        materialCode: resource.materialCode
      }),
      result: 'success'
    })

    cache.delete('resource_detail_' + id)
    this._clearListCache()

    return resource
  }

  async batchUpdateWeight(ids, sortWeight, userId) {
    let updated = 0
    for (const id of ids) {
      const [affected] = await Resource.update({ sortWeight }, { where: { id } })
      updated += affected
    }

    const user = await User.findByPk(userId)
    await OperationLog.create({
      userId,
      username: user ? user.username : '',
      module: 'resource',
      action: 'batch_update_weight',
      target: `批量修改权重 ids:[${ids.join(',')}]`,
      detail: JSON.stringify({ ids, sortWeight, updated }),
      result: 'success'
    })

    for (const id of ids) {
      cache.delete('resource_detail_' + id)
    }
    this._clearListCache()

    return { updated, total: ids.length }
  }

  async batchToggleStatus(ids, targetStatus, userId) {
    const resources = await Resource.findAll({
      where: { id: { [Op.in]: ids } }
    })

    const successIds = []
    const failedItems = []

    for (const resource of resources) {
      if (!this.validateTransition(resource.status, targetStatus)) {
        failedItems.push({ id: resource.id, reason: `状态不能从 ${resource.status} 变更为 ${targetStatus}` })
        continue
      }

      if (targetStatus === 'published') {
        if (resource.isBlocked) {
          failedItems.push({ id: resource.id, reason: '素材已被风控拦截，无法上架' })
          continue
        }
        if (resource.status !== 'approved') {
          failedItems.push({ id: resource.id, reason: '未审核素材不能直接上架发布' })
          continue
        }
      }

      successIds.push(resource.id)

      const updateData = { status: targetStatus }
      if (targetStatus === 'published') {
        updateData.publishedAt = new Date()
      }
      if (targetStatus === 'offline') {
        updateData.offlineAt = new Date()
        updateData.offlineReason = '批量下架'
      }

      await resource.update(updateData)
    }

    const user = await User.findByPk(userId)
    await OperationLog.create({
      userId,
      username: user ? user.username : '',
      module: 'resource',
      action: 'batch_toggle_status',
      target: `批量状态变更 ids:[${ids.join(',')}]`,
      detail: JSON.stringify({
        targetStatus,
        successIds,
        failedItems: failedItems.map((f) => ({ id: f.id, reason: f.reason }))
      }),
      result: 'success'
    })

    for (const id of successIds) {
      cache.delete('resource_detail_' + id)
    }
    cache.delete('hot_resources')
    this._clearListCache()

    return {
      successIds,
      failedItems,
      updated: successIds.length
    }
  }

  async traceMaterial(keyword) {
    let resource = null
    if (keyword) {
      resource = await Resource.findOne({ where: { materialCode: keyword } })
    }
    if (!resource && keyword) {
      resource = await Resource.findOne({
        where: { title: { [Op.like]: `%${keyword}%` } }
      })
    }

    if (!resource) {
      throw ApiError.notFound('未找到匹配的素材')
    }

    const resourceId = resource.id

    const editLogs = await OperationLog.findAll({
      where: { targetId: resourceId, module: 'resource' },
      order: [['createdAt', 'DESC']]
    })

    const auditRecords = await AuditRecord.findAll({
      where: { resourceId },
      order: [['auditTime', 'DESC']]
    })

    const violations = await Violation.findAll({
      where: { resourceId },
      order: [['createdAt', 'DESC']]
    })

    const conflicts = []

    if (auditRecords.length > 0) {
      const latestAudit = auditRecords[0]
      const expectedStatus = latestAudit.auditResult === 'approved' ? 'approved' : 'rejected'
      if (resource.status !== expectedStatus && resource.status !== 'published' && resource.status !== 'offline') {
        conflicts.push({
          field: 'status',
          expected: expectedStatus,
          actual: resource.status,
          description: `审核最终结果为${latestAudit.auditResult}，但资源状态为${resource.status}`
        })
      }
    }

    if (violations.length > 0) {
      const hasActive = violations.some((v) => v.status === 'pending' || v.status === 'processed')
      if (hasActive && !resource.isBlocked && resource.status !== 'offline') {
        conflicts.push({
          field: 'isBlocked',
          expected: true,
          actual: resource.isBlocked,
          description: '存在未处理的违规记录，但资源未被拦截或下架'
        })
      }
    }

    if (resource.categoryId) {
      const categoryExists = await Category.findByPk(resource.categoryId)
      if (!categoryExists) {
        conflicts.push({
          field: 'categoryId',
          expected: '存在的分类ID',
          actual: resource.categoryId,
          description: `分类ID ${resource.categoryId} 在分类表中不存在`
        })
      }
    }

    if (resource.authorId) {
      const authorExists = await User.findByPk(resource.authorId)
      if (!authorExists) {
        conflicts.push({
          field: 'authorId',
          expected: '存在的用户ID',
          actual: resource.authorId,
          description: `作者ID ${resource.authorId} 在用户表中不存在`
        })
      }
    }

    return {
      resource: resource.toJSON(),
      editLogs: editLogs.map((l) => l.toJSON()),
      auditRecords: auditRecords.map((a) => a.toJSON()),
      violations: violations.map((v) => v.toJSON()),
      consistencyCheck: {
        consistent: conflicts.length === 0,
        conflicts
      }
    }
  }

  _clearListCache() {
    cache.deleteByPrefix('resource_list_')
  }

  checkStateExclusive(currentStatus, operation) {
    const rules = {
      audit: ['pending'],
      publish: ['offline', 'approved'],
      offline: ['published', 'approved'],
      edit: ['draft', 'pending', 'rejected', 'offline'],
      remove: ['draft', 'offline']
    }
    const allowed = rules[operation] || []
    if (currentStatus === 'violation' || currentStatus === 'blocked') {
      return { allowed: false, reason: `当前素材状态为「${currentStatus}」，禁止${operation === 'edit' ? '编辑' : '上架'}操作` }
    }
    if (!allowed.includes(currentStatus)) {
      return { allowed: false, reason: `素材当前状态为「${currentStatus}」，仅${allowed.join('、')}状态可执行此操作` }
    }
    return { allowed: true }
  }

  async getRelatedWorks(resourceId) {
    const count = await OperationLog.count({
      where: {
        targetId: resourceId,
        module: 'resource',
        createdAt: { [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })
    const viewAndDownloadCount = await Resource.findByPk(resourceId, {
      attributes: ['viewCount', 'downloadCount']
    })
    const used = count + (viewAndDownloadCount ? (viewAndDownloadCount.viewCount + viewAndDownloadCount.downloadCount > 100 ? 1 : 0) : 0)
    return {
      inUse: used > 0,
      referencedWorks: count,
      activeDownloads: viewAndDownloadCount?.downloadCount || 0
    }
  }

  async changeStateWithValidation(id, targetStatus, userId, skipConfirm = false) {
    const resource = await Resource.findByPk(id)
    if (!resource) throw ApiError.notFound('资源不存在')

    const operationMap = {
      approved: 'audit', rejected: 'audit',
      published: 'publish', offline: 'offline'
    }
    const operation = operationMap[targetStatus] || 'edit'
    const exclusiveCheck = this.checkStateExclusive(resource.status, operation)
    if (!exclusiveCheck.allowed) {
      throw ApiError.badRequest(exclusiveCheck.reason)
    }

    if (!this.validateTransition(resource.status, targetStatus)) {
      throw ApiError.badRequest(`素材状态不能从 ${resource.status} 变更为 ${targetStatus}`)
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentChanges = await OperationLog.count({
      where: {
        targetId: id, module: 'resource', action: 'status_change',
        result: 'success', createdAt: { [Op.gte]: oneHourAgo }
      }
    })
    let frequentWarning = false
    if (recentChanges >= 3 && !skipConfirm) {
      frequentWarning = true
      return {
        needConfirm: true,
        frequentWarning: true,
        resource: resource.toJSON(),
        recentChanges
      }
    }

    const relatedWorks = await this.getRelatedWorks(id)
    if (relatedWorks.inUse && !skipConfirm) {
      return {
        needConfirm: true,
        relatedWorks,
        resource: resource.toJSON()
      }
    }

    const oldStatus = resource.status
    await resource.update({ status: targetStatus })

    if (targetStatus === 'published') {
      await resource.update({
        sortWeight: resource.sortWeight + 10,
        publishedAt: new Date()
      })
    } else if (targetStatus === 'offline') {
      await resource.update({
        sortWeight: Math.max(0, resource.sortWeight - 20),
        offlineAt: new Date(),
        offlineReason: '用户操作下架'
      })
    } else if (targetStatus === 'violation') {
      await resource.update({
        sortWeight: 0,
        violationCount: resource.violationCount + 1
      })
    }

    await OperationLog.create({
      userId,
      username: 'operator',
      module: 'resource',
      action: 'status_change',
      target: `素材「${resource.title}」`,
      targetId: id,
      detail: JSON.stringify({ from: oldStatus, to: targetStatus, reason: '手动变更' }),
      result: 'success'
    })

    cache.delete('hot_resources')
    cache.deleteByPrefix && cache.deleteByPrefix('resource_list_')
    cache.delete('resource_detail_' + id)

    return {
      success: true,
      needConfirm: false,
      resource: resource.toJSON()
    }
  }

  async batchChangeStateWithPermission(ids, targetStatus, userId, userRole) {
    const OPERATOR_ALLOWED_FROM = ['draft', 'pending', 'rejected', 'approved', 'offline']
    const ADMIN_ALLOWED_FROM = ['draft', 'pending', 'rejected', 'approved', 'offline', 'published', 'violation', 'blocked']
    const allowedFromStates = ['super_admin', 'admin'].includes(userRole)
      ? ADMIN_ALLOWED_FROM
      : OPERATOR_ALLOWED_FROM

    const resources = await Resource.findAll({ where: { id: { [Op.in]: ids } } })
    const results = {
      successIds: [],
      failedItems: [],
      permissionBlockedIds: [],
      updated: 0,
      globalErrors: []
    }

    const operationMap = {
      approved: 'audit', rejected: 'audit',
      published: 'publish', offline: 'offline'
    }
    const operation = operationMap[targetStatus] || 'edit'

    for (const resource of resources) {
      if (!allowedFromStates.includes(resource.status)) {
        results.permissionBlockedIds.push(resource.id)
        results.failedItems.push({
          id: resource.id,
          title: resource.title,
          reason: `无权限操作${resource.status}状态的素材`
        })
        continue
      }

      const exclusiveCheck = this.checkStateExclusive(resource.status, operation)
      if (!exclusiveCheck.allowed) {
        results.failedItems.push({
          id: resource.id,
          title: resource.title,
          reason: exclusiveCheck.reason
        })
        continue
      }

      if (!this.validateTransition(resource.status, targetStatus)) {
        results.failedItems.push({
          id: resource.id,
          title: resource.title,
          reason: `状态不可从${resource.status}变更为${targetStatus}`
        })
        continue
      }

      try {
        const oldStatus = resource.status
        await resource.update({ status: targetStatus })
        if (targetStatus === 'published') {
          await resource.update({ sortWeight: resource.sortWeight + 10, publishedAt: new Date() })
        } else if (targetStatus === 'offline') {
          await resource.update({ sortWeight: Math.max(0, resource.sortWeight - 20), offlineAt: new Date() })
        }
        results.successIds.push(resource.id)
        results.updated++
        await OperationLog.create({
          userId, username: 'operator', module: 'resource', action: 'batch_status_change',
          target: resource.title, targetId: resource.id,
          detail: JSON.stringify({ from: oldStatus, to: targetStatus }), result: 'success'
        })
      } catch (err) {
        results.failedItems.push({
          id: resource.id,
          title: resource.title,
          reason: err.message || '系统异常'
        })
      }
    }

    cache.delete('hot_resources')
    cache.deleteByPrefix && cache.deleteByPrefix('resource_list_')

    return results
  }

  async getStateChangeHistory(resourceId, days = 30) {
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const logs = await OperationLog.findAll({
      where: {
        targetId: resourceId,
        module: 'resource',
        action: { [Op.in]: ['status_change', 'batch_status_change'] },
        createdAt: { [Op.gte]: dateFrom }
      },
      order: [['createdAt', 'DESC']]
    })

    const resource = await Resource.findByPk(resourceId)
    const complianceLevel = resource
      ? (resource.violationCount === 0 ? 'A' : resource.violationCount === 1 ? 'B' : resource.violationCount <= 3 ? 'C' : 'D')
      : 'N/A'

    const changeCount = logs.length
    let warnings = []
    if (changeCount > 20) warnings.push('近30天状态变更过于频繁（' + changeCount + '次）')
    if (complianceLevel === 'D') warnings.push('合规等级过低，建议先处理违规记录再变更状态')
    if (resource?.isBlocked) warnings.push('素材被风控拦截，无法正常变更状态')

    return {
      history: logs,
      totalChanges: changeCount,
      complianceLevel,
      warnings,
      resource: resource ? resource.toJSON() : null
    }
  }

  getPermissionFilter(role) {
    if (['super_admin', 'admin'].includes(role)) {
      return {
        allowedStatuses: ['draft', 'pending', 'rejected', 'approved', 'offline', 'published', 'violation', 'blocked'],
        editableStatuses: ['draft', 'pending', 'rejected', 'approved', 'offline', 'published', 'violation', 'blocked'],
        isAdmin: true,
        canHandleViolation: true
      }
    } else if (role === 'auditor') {
      return {
        allowedStatuses: ['pending', 'approved', 'rejected'],
        editableStatuses: ['pending', 'approved', 'rejected'],
        isAdmin: false,
        canHandleViolation: false
      }
    } else {
      return {
        allowedStatuses: ['draft', 'pending', 'rejected', 'approved', 'offline'],
        editableStatuses: ['draft', 'pending', 'rejected', 'approved', 'offline'],
        isAdmin: false,
        canHandleViolation: false
      }
    }
  }
}

module.exports = new ResourceService()
