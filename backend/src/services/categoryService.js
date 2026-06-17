const { Category } = require('../models')
const { Op } = require('sequelize')
const ApiError = require('../utils/apiError')

class CategoryService {
  async getList(params = {}) {
    const where = {}

    if (params.type) {
      where.type = params.type
    }

    if (params.status) {
      where.status = params.status
    }

    const categories = await Category.findAll({
      where,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    })

    return categories
  }

  async getTree(params = {}) {
    const where = {}

    if (params.type) {
      where.type = params.type
    }

    if (params.status) {
      where.status = params.status
    }

    const categories = await Category.findAll({
      where,
      order: [['sort', 'ASC'], ['createdAt', 'DESC']]
    })

    const buildTree = (parentId = 0) => {
      return categories
        .filter((item) => item.parentId === parentId)
        .map((item) => {
          const children = buildTree(item.id)
          return {
            ...item.toJSON(),
            children: children.length > 0 ? children : undefined
          }
        })
    }

    return buildTree(0)
  }

  async getDetail(id) {
    const category = await Category.findByPk(id)

    if (!category) {
      throw ApiError.notFound('分类不存在')
    }

    return category
  }

  async create(data) {
    const category = await Category.create(data)
    return category
  }

  async update(id, data) {
    const category = await Category.findByPk(id)

    if (!category) {
      throw ApiError.notFound('分类不存在')
    }

    await category.update(data)

    return category
  }

  async delete(id) {
    const category = await Category.findByPk(id)

    if (!category) {
      throw ApiError.notFound('分类不存在')
    }

    const childCount = await Category.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw ApiError.badRequest('该分类下有子分类，无法删除')
    }

    await category.destroy()

    return true
  }

  validateHierarchy(parentId, targetLevel = 2) {
    if (targetLevel > 2) return { valid: false, reason: '仅支持二级分类层级' }
    if (parentId !== undefined && parentId !== 0 && parentId !== null) {
      return { valid: false, reason: '仅一级分类可新增二级子分类' }
    }
    return { valid: true }
  }

  async validateResourceCategoryMatch(resource, category) {
    const errors = []
    
    if (resource.fileType && category.type && resource.fileType !== category.type) {
      errors.push(`素材类型「${resource.fileType}」与分类类型「${category.type}」不匹配`)
    }
    
    if (category.tags && resource.tags) {
      const catTags = category.tags.split(',').map(t => t.trim())
      const resTags = Array.isArray(resource.tags) ? resource.tags : JSON.parse(resource.tags || '[]')
      const hasMatch = catTags.some(t => resTags.includes(t))
      if (resTags.length > 0 && !hasMatch) {
        errors.push(`素材标签与分类标签不匹配，分类支持：${catTags.join('、')}`)
      }
    }
    
    if (category.resourceCount >= category.maxCapacity) {
      errors.push(`分类「${category.name}」容量已满（${category.resourceCount}/${category.maxCapacity}）`)
    }
    
    return {
      valid: errors.length === 0,
      matchScore: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 30),
      errors
    }
  }

  async bindResourceToCategory(resourceId, categoryId, operatorId, operatorName) {
    const resource = await require('../models').Resource.findByPk(resourceId)
    const category = await Category.findByPk(categoryId)
    if (!resource) throw ApiError.notFound('素材不存在')
    if (!category) throw ApiError.notFound('分类不存在')
    
    const matchCheck = await this.validateResourceCategoryMatch(resource, category)
    if (!matchCheck.valid) {
      throw ApiError.badRequest(matchCheck.errors.join('；'))
    }
    
    const oldCategoryId = resource.categoryId
    
    await resource.update({
      categoryId,
      categoryName: category.name
    })
    
    if (oldCategoryId && oldCategoryId !== categoryId) {
      await Category.decrement('resourceCount', { where: { id: oldCategoryId } })
    }
    if (!oldCategoryId || oldCategoryId !== categoryId) {
      await Category.increment('resourceCount', { 
        where: { id: categoryId },
        by: 1
      })
    }
    
    await Category.update(
      { bindTime: new Date(), bindOperator: operatorName },
      { where: { id: categoryId } }
    )
    
    await require('../models').OperationLog.create({
      userId: operatorId,
      username: operatorName,
      module: 'category',
      action: 'bind_resource',
      target: category.name,
      targetId: categoryId,
      detail: JSON.stringify({ resourceId, resourceTitle: resource.title, oldCategoryId, newCategoryId: categoryId }),
      result: 'success'
    })
    
    return { success: true, matchScore: matchCheck.matchScore }
  }

  async adjustParent(categoryId, newParentId, operatorId, operatorName) {
    const category = await Category.findByPk(categoryId)
    if (!category) throw ApiError.notFound('分类不存在')
    
    if (newParentId !== 0) {
      const parent = await Category.findByPk(newParentId)
      if (!parent) throw ApiError.notFound('目标父分类不存在')
      if (parent.parentId !== 0) throw ApiError.badRequest('目标分类不是一级分类，无法作为父级')
    }
    
    if (newParentId !== 0) {
      const allChildren = await this.getAllDescendantIds(categoryId)
      if (allChildren.includes(newParentId)) {
        throw ApiError.badRequest('不能将分类移动到其自身的子分类下')
      }
    }
    
    const oldParentId = category.parentId
    
    await category.update({ parentId: newParentId })
    
    const Resource = require('../models').Resource
    const resources = await Resource.findAll({ where: { categoryId } })
    for (const res of resources) {
      await res.update({ categoryName: category.name })
    }
    
    await require('../models').OperationLog.create({
      userId: operatorId,
      username: operatorName,
      module: 'category',
      action: 'adjust_parent',
      target: category.name,
      targetId: categoryId,
      detail: JSON.stringify({ oldParentId, newParentId, affectedResources: resources.length }),
      result: 'success'
    })
    
    return { success: true, affectedResources: resources.length }
  }

  async getAllDescendantIds(categoryId, ids = []) {
    const children = await Category.findAll({ where: { parentId: categoryId } })
    for (const child of children) {
      ids.push(child.id)
      await this.getAllDescendantIds(child.id, ids)
    }
    return ids
  }

  async batchMigrateResources(resourceIds, targetCategoryId, operatorId, operatorName, onProgress) {
    const targetCategory = await Category.findByPk(targetCategoryId)
    if (!targetCategory) throw ApiError.notFound('目标分类不存在')
    
    const Resource = require('../models').Resource
    const results = { success: [], failed: [], total: resourceIds.length }
    
    for (let i = 0; i < resourceIds.length; i++) {
      const resourceId = resourceIds[i]
      try {
        await this.bindResourceToCategory(resourceId, targetCategoryId, operatorId, operatorName)
        results.success.push(resourceId)
      } catch (err) {
        results.failed.push({ id: resourceId, reason: err.message || '迁移失败' })
      }
      if (onProgress) {
        onProgress(Math.round(((i + 1) / resourceIds.length) * 100), i + 1, resourceIds.length)
      }
    }
    
    return results
  }

  async getCategoryTrace(categoryId, days = 30) {
    const category = await Category.findByPk(categoryId)
    if (!category) throw ApiError.notFound('分类不存在')
    
    const Resource = require('../models').Resource
    const OperationLog = require('../models').OperationLog
    
    const resources = await Resource.findAll({
      where: { categoryId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'fileType', 'status', 'tags', 'createdAt', 'authorId', 'authorName']
    })
    
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const bindLogs = await OperationLog.findAll({
      where: {
        module: 'category',
        action: 'bind_resource',
        targetId: categoryId,
        createdAt: { [require('sequelize').Op.gte]: dateFrom }
      },
      order: [['createdAt', 'DESC']]
    })
    
    const conflicts = []
    const duplicateBind = []
    const wrongCategory = []
    
    const resourceIdSet = new Set()
    for (const res of resources) {
      if (resourceIdSet.has(res.id)) {
        duplicateBind.push(res.id)
      }
      resourceIdSet.add(res.id)
      
      if (res.fileType !== category.type) {
        wrongCategory.push({
          resourceId: res.id,
          resourceTitle: res.title,
          resourceType: res.fileType,
          categoryType: category.type
        })
      }
    }
    
    const actualCount = resources.length
    const categoryCount = category.resourceCount
    if (actualCount !== categoryCount) {
      conflicts.push({
        field: 'resourceCount',
        expected: categoryCount,
        actual: actualCount,
        description: '分类统计数量与实际素材数不一致'
      })
    }
    
    if (duplicateBind.length > 0) {
      conflicts.push({
        field: 'duplicateBind',
        expected: 0,
        actual: duplicateBind.length,
        description: '存在重复绑定的素材'
      })
    }
    
    if (wrongCategory.length > 0) {
      conflicts.push({
        field: 'typeMatch',
        expected: 0,
        actual: wrongCategory.length,
        description: '存在类型不匹配的素材'
      })
    }
    
    return {
      category: category.toJSON(),
      resources,
      bindLogs,
      compliance: {
        score: Math.max(0, 100 - conflicts.length * 20),
        consistent: conflicts.length === 0,
        conflicts,
        duplicateBind,
        wrongCategory
      },
      statistics: {
        totalResources: resources.length,
        totalPublished: resources.filter(r => r.status === 'published').length,
        totalPending: resources.filter(r => r.status === 'pending').length,
        totalViolation: resources.filter(r => r.status === 'violation').length,
        typeDistribution: resources.reduce((acc, r) => {
          acc[r.fileType] = (acc[r.fileType] || 0) + 1
          return acc
        }, {})
      }
    }
  }

  async createWithValidation(data, operatorId, operatorName) {
    const hierarchyCheck = this.validateHierarchy(data.parentId)
    if (!hierarchyCheck.valid) {
      throw ApiError.badRequest(hierarchyCheck.reason)
    }
    
    const exist = await Category.findOne({
      where: { name: data.name, type: data.type, parentId: data.parentId || 0 }
    })
    if (exist) {
      throw ApiError.badRequest('同层级下已存在同名分类')
    }
    
    const category = await Category.create({
      ...data,
      parentId: data.parentId || 0
    })
    
    await require('../models').OperationLog.create({
      userId: operatorId,
      username: operatorName,
      module: 'category',
      action: 'create',
      target: category.name,
      targetId: category.id,
      result: 'success'
    })
    
    return category
  }

  async getCategoryStats() {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'type', 'resourceCount', 'maxCapacity']
    })
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      resourceCount: c.resourceCount,
      maxCapacity: c.maxCapacity,
      usageRate: Math.round((c.resourceCount / c.maxCapacity) * 100)
    }))
  }
}

module.exports = new CategoryService()
