const { Resource, Template, User, Member, AuditRecord, Violation, OperationLog, Category } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const cache = require('../utils/cache')

class DashboardService {
  async getStatistics() {
    return cache.getOrSet('dashboard:statistics', async () => {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

      const [
        resourceCount,
        templateCount,
        userCount,
        memberCount,
        pendingAuditCount,
        todayResourceCount,
        todayUserCount,
        violationCount,
        pendingAppealCount,
        todayActiveUserResult,
        hotResourceCount
      ] = await Promise.all([
        Resource.count(),
        Template.count(),
        User.count(),
        Member.count(),
        Resource.count({ where: { status: 'pending' } }),
        Resource.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
        User.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
        Violation.count(),
        Violation.count({ where: { status: 'appealed' } }),
        OperationLog.findAll({
          attributes: [[fn('COUNT', fn('DISTINCT', col('userId'))), 'count']],
          where: { createdAt: { [Op.gte]: todayStart } },
          raw: true
        }),
        Resource.count({
          where: {
            status: 'published',
            [Op.or]: [
              { viewCount: { [Op.gt]: 0 } },
              { downloadCount: { [Op.gt]: 0 } },
              { likeCount: { [Op.gt]: 0 } }
            ]
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
        todayUserCount,
        violationCount,
        pendingAppealCount,
        todayActiveUserCount: parseInt((todayActiveUserResult[0] || {}).count || '0', 10),
        hotResourceCount
      }
    }, 30000)
  }

  async getResourceStats(days = 7) {
    return cache.getOrSet(`dashboard:resourceStats:${days}`, async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days + 1)
      startDate.setHours(0, 0, 0, 0)

      const stats = await Resource.findAll({
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: { createdAt: { [Op.gte]: startDate } },
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true
      })

      const dateList = []
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - days + 1 + i)
        const dateStr = d.toISOString().split('T')[0]
        const stat = stats.find(s => s.date === dateStr)
        dateList.push({
          date: dateStr,
          count: stat ? parseInt(stat.count, 10) : 0
        })
      }

      return dateList
    }, 30000)
  }

  async getStatusDistribution() {
    return cache.getOrSet('dashboard:statusDistribution', async () => {
      const statuses = ['draft', 'pending', 'approved', 'rejected', 'published', 'offline']
      const result = {}
      for (const status of statuses) {
        result[status] = await Resource.count({ where: { status } })
      }
      return result
    }, 30000)
  }

  async getRecentResources(limit = 10) {
    return cache.getOrSet(`dashboard:recentResources:${limit}`, async () => {
      const resources = await Resource.findAll({
        limit,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'title', 'coverUrl', 'fileType', 'status', 'authorName', 'createdAt']
      })
      return resources
    }, 30000)
  }

  async getRecentAudits(limit = 10) {
    return cache.getOrSet(`dashboard:recentAudits:${limit}`, async () => {
      const audits = await AuditRecord.findAll({
        limit,
        order: [['auditTime', 'DESC']]
      })
      return audits
    }, 30000)
  }

  async getResourceHotRank(limit = 10) {
    return cache.getOrSet(`dashboard:hotRank:${limit}`, async () => {
      const resources = await Resource.findAll({
        where: { status: 'published' },
        attributes: [
          'id', 'title', 'coverUrl', 'fileType', 'authorName',
          'viewCount', 'downloadCount', 'likeCount',
          [literal('viewCount + downloadCount + likeCount'), 'hotScore']
        ],
        order: [[literal('viewCount + downloadCount + likeCount'), 'DESC']],
        limit,
        raw: true
      })
      return resources
    }, 30000)
  }

  async getUserActivityStats(days = 7) {
    return cache.getOrSet(`dashboard:userActivity:${days}`, async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days + 1)
      startDate.setHours(0, 0, 0, 0)

      const [userStats, resourceStats, auditStats] = await Promise.all([
        User.findAll({
          attributes: [
            [fn('DATE', col('createdAt')), 'date'],
            [fn('COUNT', col('id')), 'count']
          ],
          where: { createdAt: { [Op.gte]: startDate } },
          group: [fn('DATE', col('createdAt'))],
          raw: true
        }),
        Resource.findAll({
          attributes: [
            [fn('DATE', col('createdAt')), 'date'],
            [fn('COUNT', col('id')), 'count']
          ],
          where: { createdAt: { [Op.gte]: startDate } },
          group: [fn('DATE', col('createdAt'))],
          raw: true
        }),
        AuditRecord.findAll({
          attributes: [
            [fn('DATE', col('auditTime')), 'date'],
            [fn('COUNT', col('id')), 'count']
          ],
          where: { auditTime: { [Op.gte]: startDate } },
          group: [fn('DATE', col('auditTime'))],
          raw: true
        })
      ])

      const dateList = []
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - days + 1 + i)
        const dateStr = d.toISOString().split('T')[0]
        dateList.push({
          date: dateStr,
          newUserCount: parseInt((userStats.find(s => s.date === dateStr) || {}).count || '0', 10),
          newResourceCount: parseInt((resourceStats.find(s => s.date === dateStr) || {}).count || '0', 10),
          newAuditCount: parseInt((auditStats.find(s => s.date === dateStr) || {}).count || '0', 10)
        })
      }
      return dateList
    }, 30000)
  }

  async getMemberStats() {
    return cache.getOrSet('dashboard:memberStats', async () => {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

      const [levelDistribution, totals, todayNewCount, todayConsumeResult] = await Promise.all([
        Member.findAll({
          attributes: ['level', [fn('COUNT', col('id')), 'count']],
          group: ['level'],
          raw: true
        }),
        Member.findAll({
          attributes: [
            [fn('SUM', col('points')), 'totalPoints'],
            [fn('SUM', col('balance')), 'totalBalance']
          ],
          raw: true
        }),
        Member.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
        Member.findAll({
          attributes: [[fn('SUM', col('totalConsume')), 'totalConsume']],
          where: { createdAt: { [Op.gte]: todayStart } },
          raw: true
        })
      ])

      const total = totals[0] || {}

      return {
        levelDistribution: levelDistribution.map(item => ({
          level: item.level,
          count: parseInt(item.count, 10)
        })),
        totalPoints: parseFloat(total.totalPoints || 0),
        totalBalance: parseFloat(total.totalBalance || 0),
        todayNewMemberCount: todayNewCount,
        todayTotalConsume: parseFloat((todayConsumeResult[0] || {}).totalConsume || 0)
      }
    }, 30000)
  }

  async getCategoryStats() {
    return cache.getOrSet('dashboard:categoryStats', async () => {
      const categories = await Category.findAll({
        where: { status: 'active' },
        attributes: ['id', 'name', 'type'],
        raw: true
      })

      const categoryIds = categories.map(c => c.id)
      if (categoryIds.length === 0) {
        return { categories: [], hotCategories: [] }
      }

      const [resourceCounts, publishedCounts] = await Promise.all([
        Resource.findAll({
          attributes: ['categoryId', [fn('COUNT', col('id')), 'count']],
          where: { categoryId: { [Op.in]: categoryIds } },
          group: ['categoryId'],
          raw: true
        }),
        Resource.findAll({
          attributes: ['categoryId', [fn('COUNT', col('id')), 'count']],
          where: { categoryId: { [Op.in]: categoryIds }, status: 'published' },
          group: ['categoryId'],
          raw: true
        })
      ])

      const result = categories.map(cat => {
        const rc = resourceCounts.find(r => r.categoryId === cat.id)
        const pc = publishedCounts.find(p => p.categoryId === cat.id)
        return {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          resourceCount: parseInt((rc || {}).count || '0', 10),
          publishedCount: parseInt((pc || {}).count || '0', 10)
        }
      })

      result.sort((a, b) => b.resourceCount - a.resourceCount)

      return {
        categories: result,
        hotCategories: result.slice(0, 10)
      }
    }, 30000)
  }

  async getViolationOverview() {
    return cache.getOrSet('dashboard:violationOverview', async () => {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

      const [totalCount, typeDistribution, levelDistribution, pendingCount, todayCount] = await Promise.all([
        Violation.count(),
        Violation.findAll({
          attributes: ['violationType', [fn('COUNT', col('id')), 'count']],
          group: ['violationType'],
          raw: true
        }),
        Violation.findAll({
          attributes: ['violationLevel', [fn('COUNT', col('id')), 'count']],
          group: ['violationLevel'],
          raw: true
        }),
        Violation.count({ where: { status: 'pending' } }),
        Violation.count({ where: { createdAt: { [Op.gte]: todayStart } } })
      ])

      return {
        totalCount,
        typeDistribution: typeDistribution.map(item => ({
          type: item.violationType,
          count: parseInt(item.count, 10)
        })),
        levelDistribution: levelDistribution.map(item => ({
          level: item.violationLevel,
          count: parseInt(item.count, 10)
        })),
        pendingCount,
        todayCount
      }
    }, 30000)
  }

  async getOperationLogStats(days = 7) {
    return cache.getOrSet(`dashboard:logStats:${days}`, async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days + 1)
      startDate.setHours(0, 0, 0, 0)

      const [dailyStats, moduleStats] = await Promise.all([
        OperationLog.findAll({
          attributes: [
            [fn('DATE', col('createdAt')), 'date'],
            [fn('COUNT', col('id')), 'count']
          ],
          where: { createdAt: { [Op.gte]: startDate } },
          group: [fn('DATE', col('createdAt'))],
          order: [[fn('DATE', col('createdAt')), 'ASC']],
          raw: true
        }),
        OperationLog.findAll({
          attributes: ['module', [fn('COUNT', col('id')), 'count']],
          where: { createdAt: { [Op.gte]: startDate } },
          group: ['module'],
          order: [[fn('COUNT', col('id')), 'DESC']],
          raw: true
        })
      ])

      const dateList = []
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - days + 1 + i)
        const dateStr = d.toISOString().split('T')[0]
        const stat = dailyStats.find(s => s.date === dateStr)
        dateList.push({
          date: dateStr,
          count: stat ? parseInt(stat.count, 10) : 0
        })
      }

      return {
        dailyStats: dateList,
        moduleStats: moduleStats.map(item => ({
          module: item.module,
          count: parseInt(item.count, 10)
        }))
      }
    }, 30000)
  }

  async getConversionStats(days = 7) {
    return cache.getOrSet(`dashboard:conversion:${days}`, async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days + 1)
      startDate.setHours(0, 0, 0, 0)

      const [
        totalResources,
        approvedResources,
        publishedResources,
        totalAudits,
        approvedAudits,
        newUsers,
        newMembers
      ] = await Promise.all([
        Resource.count({ where: { createdAt: { [Op.gte]: startDate } } }),
        Resource.count({ where: { status: 'approved', createdAt: { [Op.gte]: startDate } } }),
        Resource.count({ where: { status: 'published', createdAt: { [Op.gte]: startDate } } }),
        AuditRecord.count({ where: { auditTime: { [Op.gte]: startDate } } }),
        AuditRecord.count({ where: { auditResult: 'approved', auditTime: { [Op.gte]: startDate } } }),
        User.count({ where: { createdAt: { [Op.gte]: startDate } } }),
        Member.count({ where: { createdAt: { [Op.gte]: startDate } } })
      ])

      const publishRate = totalResources > 0
        ? (((approvedResources + publishedResources) / totalResources) * 100).toFixed(2)
        : '0.00'
      const auditPassRate = totalAudits > 0
        ? ((approvedAudits / totalAudits) * 100).toFixed(2)
        : '0.00'
      const registrationConversion = newUsers > 0
        ? ((newMembers / newUsers) * 100).toFixed(2)
        : '0.00'

      return {
        days,
        publishRate: parseFloat(publishRate),
        auditPassRate: parseFloat(auditPassRate),
        registrationConversion: parseFloat(registrationConversion),
        totalResources,
        approvedResources,
        publishedResources,
        totalAudits,
        approvedAudits,
        newUsers,
        newMembers
      }
    }, 30000)
  }
}

module.exports = new DashboardService()
