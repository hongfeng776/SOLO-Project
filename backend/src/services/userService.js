const { User, Member } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const { hashPassword } = require('../utils/auth')
const ApiError = require('../utils/apiError')

class UserService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['username', 'nickname', 'email', 'phone']))
    }

    if (params.role) {
      where.role = params.role
    }

    if (params.status) {
      where.status = params.status
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['password'] },
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
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    return user
  }

  async create(data) {
    const { username, password } = data

    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      throw ApiError.badRequest('用户名已存在')
    }

    const hashedPassword = await hashPassword(password)

    const user = await User.create({
      ...data,
      password: hashedPassword
    })

    if (data.role === 'member' || !data.role) {
      await Member.create({
        userId: user.id,
        username: user.username,
        level: 'normal',
        points: 0,
        balance: 0
      })
    }

    const result = user.toJSON()
    delete result.password

    return result
  }

  async update(id, data) {
    const user = await User.findByPk(id)

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    if (data.password) {
      data.password = await hashPassword(data.password)
    }

    await user.update(data)

    const result = user.toJSON()
    delete result.password

    return result
  }

  async delete(id) {
    const user = await User.findByPk(id)

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    await user.destroy()
    await Member.destroy({ where: { userId: id } })

    return true
  }

  async batchDelete(ids) {
    const result = await User.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    })

    await Member.destroy({
      where: {
        userId: { [Op.in]: ids }
      }
    })

    return result
  }

  async updateStatus(id, status) {
    const user = await User.findByPk(id)

    if (!user) {
      throw ApiError.notFound('用户不存在')
    }

    await user.update({ status })

    return true
  }
}

module.exports = new UserService()
