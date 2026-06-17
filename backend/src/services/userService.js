const { User, Member } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere, generateRandomString } = require('../utils/common')
const { hashPassword } = require('../utils/auth')
const ApiError = require('../utils/apiError')
const dayjs = require('dayjs')

class UserService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['username', 'nickname', 'email', 'phone', 'uid']))
    }

    if (params.role) {
      where.role = params.role
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.tag) {
      where.tags = { [Op.contains]: [params.tag] }
    }

    if (params.permissionGroup) {
      where.permissionGroup = params.permissionGroup
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit,
      attributes: { exclude: ['password'] },
      include: [{ model: Member, as: 'member' }],
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
      attributes: { exclude: ['password'] },
      include: [{ model: Member, as: 'member' }]
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

    if (!data.uid) {
      const datePart = dayjs().format('YYYYMMDD')
      const randomPart = generateRandomString(8).toUpperCase()
      data.uid = `U${datePart}${randomPart}`
    }

    const user = await User.create({
      ...data,
      password: hashedPassword,
      tags: data.tags || [],
      permissionGroup: data.permissionGroup || 'default'
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

  async partialRefresh(ids) {
    const users = await User.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: { exclude: ['password'] },
      include: [{ model: Member, as: 'member' }]
    })

    return users
  }
}

module.exports = new UserService()
