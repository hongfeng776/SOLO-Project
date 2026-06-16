const { Resource, Category } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
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

  _clearListCache() {
    cache.deleteByPrefix('resource_list_')
  }
}

module.exports = new ResourceService()
