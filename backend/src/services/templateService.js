const { Template, Category } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')

class TemplateService {
  async getList(params = {}) {
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
  }

  async getDetail(id) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    return template
  }

  async create(data, userId) {
    const template = await Template.create({
      ...data,
      authorId: userId,
      status: 'draft'
    })

    return template
  }

  async update(id, data) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.update(data)

    return template
  }

  async delete(id) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.destroy()

    return true
  }

  async batchDelete(ids) {
    const result = await Template.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    })

    return result
  }

  async updateStatus(id, status) {
    const template = await Template.findByPk(id)

    if (!template) {
      throw ApiError.notFound('模板不存在')
    }

    await template.update({ status })

    return template
  }
}

module.exports = new TemplateService()
