const { Member, User } = require('../models')
const { Op } = require('sequelize')
const { getPagination, buildFuzzyWhere } = require('../utils/common')
const ApiError = require('../utils/apiError')

class MemberService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.keyword) {
      Object.assign(where, buildFuzzyWhere(params.keyword, ['username']))
    }

    if (params.level) {
      where.level = params.level
    }

    const { count, rows } = await Member.findAndCountAll({
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
    const member = await Member.findByPk(id)

    if (!member) {
      throw ApiError.notFound('会员不存在')
    }

    return member
  }

  async updateLevel(id, level) {
    const member = await Member.findByPk(id)

    if (!member) {
      throw ApiError.notFound('会员不存在')
    }

    await member.update({ level })

    return member
  }

  async addPoints(id, points) {
    const member = await Member.findByPk(id)

    if (!member) {
      throw ApiError.notFound('会员不存在')
    }

    await member.increment('points', { by: points })

    return member
  }

  async getByUserId(userId) {
    const member = await Member.findOne({ where: { userId } })

    if (!member) {
      throw ApiError.notFound('会员信息不存在')
    }

    return member
  }
}

module.exports = new MemberService()
