const { Template, Category } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')
const cache = require('../utils/cache')

class TemplateService {
  async getList(params = {}) {
    const cacheKey = 'template_list_' + JSON.stringify(params)
    return cache.getOrSet(cacheKey, async () => {
      const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

      const where = {}

      if (params.keyword) {
        Object.assign(where, buildFuzzyWhere(params.keyword, ['name', 'description']))
      }

      if (params.status) {
        where.status = params.status
      }

      if (params.categoryId) {
        where.categoryId = params.categoryId
      }

      if (params.software) {
        where.software = params.software
      }

      const { count, rows } = await Template.findAndCountAll({
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
    }, 60000)
  }

  async getDetail(id) {
    return cache.getOrSet('template_detail_' + id, async () => {
      const template = await Template.findByPk(id)

      if (!template) {
        throw ApiError.notFound('模板不存在')
      }

      return template
    }, 120000)
  }

  async create(data, userId) {
    const template = await Template.create({
      ...data,
      authorId: userId,
      status: 'draft'
    })

    this._clearListCache()

    return template
  }

  async update(id, data) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.update(data)

    cache.delete('hot_templates')
    cache.delete('template_detail_' + id)
    this._clearListCache()

    return template
  }

  async delete(id) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.destroy()

    cache.delete('hot_templates')
    cache.delete('template_detail_' + id)
    this._clearListCache()

    return true
  }

  async batchDelete(ids) {
    const result = await Template.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    })

    cache.delete('hot_templates')
    for (const id of ids) {
      cache.delete('template_detail_' + id)
    }
    this._clearListCache()

    return result
  }

  async updateStatus(id, status) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.update({ status })

    cache.delete('hot_templates')
    cache.delete('template_detail_' + id)
    this._clearListCache()

    return template
  }

  async getHotTemplates(limit = 10) {
    return cache.getOrSet('hot_templates', async () => {
      const templates = await Template.findAll({
        where: { status: 'published' },
        limit,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'coverUrl', 'software', 'downloadCount']
      })

      return templates
    }, 60000)
  }

  _clearListCache() {
    cache.deleteByPrefix('template_list_')
  }
}

module.exports = new TemplateService()
