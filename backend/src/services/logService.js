const { OperationLog } = require('../models')
const { Op } = require('sequelize')
const { getPagination } = require('../utils/common')

class LogService {
  async getList(params = {}) {
    const { page, pageSize, offset, limit } = getPagination(params.page, params.pageSize)

    const where = {}

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.module) {
      where.module = params.module
    }

    if (params.action) {
      where.action = params.action
    }

    if (params.dateRange && params.dateRange.length === 2) {
      where.createdAt = {
        [Op.between]: [params.dateRange[0], params.dateRange[1]]
      }
    }

    const { count, rows } = await OperationLog.findAndCountAll({
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

  async create(data) {
    const log = await OperationLog.create(data)
    return log
  }

  async getStats() {
    const stats = await OperationLog.findAll({
      attributes: ['module', [OperationLog.sequelize.fn('COUNT', '*'), 'count']],
      group: ['module']
    })

    return stats.map((s) => ({
      module: s.module,
      count: parseInt(s.getDataValue('count'))
    }))
  }
}

module.exports = new LogService()
