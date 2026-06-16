const { Resource, Category } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')

class ResourceService {
  async getList(params = {}) {
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
  }

  async getDetail(id) {
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
  }

  async create(data, userId) {
    const resource = await Resource.create({
      ...data,
      authorId: userId,
      status: 'draft'
    })

    return resource
  }

  async update(id, data) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.update(data)

    return resource
  }

  async delete(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.destroy()

    return true
  }

  async batchDelete(ids) {
    const result = await Resource.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    })

    return result
  }

  async updateStatus(id, status) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    await resource.update({ status })

    return resource
  }

  async batchUpdateStatus(ids, status) {
    const result = await Resource.update(
      { status },
      {
        where: {
          id: { [Op.in]: ids }
        }
      }
    )

    return result
  }

  async submitForAudit(id) {
    const resource = await Resource.findByPk(id)

    if (!resource) {
      throw ApiError.notFound('资源不存在')
    }

    if (resource.status !== 'draft') {
      throw ApiError.badRequest('只有草稿状态可以提交审核')
    }

    await resource.update({ status: 'pending', auditLevel: 1 })

    return resource
  }
}

module.exports = new ResourceService()
