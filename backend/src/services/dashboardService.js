const { Resource, Template, User, Member, AuditRecord } = require('../models')
const { Op, fn, col, literal } = require('sequelize')

class DashboardService {
  async getStatistics() {
    const [
      resourceCount,
      templateCount,
      userCount,
      memberCount,
      pendingAuditCount,
      todayResourceCount,
      todayUserCount
    ] = await Promise.all([
      Resource.count(),
      Template.count(),
      User.count(),
      Member.count(),
      Resource.count({ where: { status: 'pending' } }),
      Resource.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    return {
      resourceCount,
      templateCount,
      userCount,
      memberCount,
      pendingAuditCount,
      todayResourceCount,
      todayUserCount
    }
  }

  async getResourceStats(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const stats = await Resource.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    })

    const dateList = []
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - days + 1 + i)
      const dateStr = d.toISOString().split('T')[0]
      const stat = stats.find((s) => s.date === dateStr)
      dateList.push({
        date: dateStr,
        count: stat ? parseInt(stat.count, 10) : 0
      })
    }

    return dateList
  }

  async getStatusDistribution() {
    const { ResourceStatus } = {
      ResourceStatus: {
        DRAFT: 'draft',
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        PUBLISHED: 'published',
        OFFLINE: 'offline'
      }
    }

    const result = {}
    const statuses = Object.values(ResourceStatus)

    for (const status of statuses) {
      result[status] = await Resource.count({ where: { status } })
    }

    return result
  }

  async getRecentResources(limit = 10) {
    const resources = await Resource.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'coverUrl', 'fileType', 'status', 'authorName', 'createdAt']
    })

    return resources
  }

  async getRecentAudits(limit = 10) {
    const audits = await AuditRecord.findAll({
      limit,
      order: [['auditTime', 'DESC']]
    })

    return audits
  }
}

module.exports = new DashboardService()
