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
}

module.exports = new CategoryService()
