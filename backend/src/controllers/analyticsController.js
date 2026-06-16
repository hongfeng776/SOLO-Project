const { Op } = require('sequelize')
const { Order, Driver, Passenger, FinanceStatement, MarketingCampaign, Coupon, RiskRecord } = require('../models')
const { success } = require('../utils/response')

const getOrderAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const now = new Date()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayOrders = await Order.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })
    const weekOrders = await Order.count({
      where: { createTime: { [Op.gte]: weekStart } }
    })
    const monthOrders = await Order.count({
      where: { createTime: { [Op.gte]: monthStart } }
    })

    const totalOrders = await Order.count()
    const completedOrders = await Order.count({ where: { status: 5 } })
    const cancelledOrders = await Order.count({ where: { status: 6 } })

    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0'
    const cancelRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0.0'

    const statusDistribution = await Order.findAll({
      attributes: ['status', [Order.sequelize.fn('COUNT', '*'), 'count']],
      group: ['status']
    })

    const hourDistribution = []
    for (let h = 0; h < 24; h++) {
      const start = new Date(todayStart)
      start.setHours(h, 0, 0, 0)
      const end = new Date(todayStart)
      end.setHours(h, 59, 59, 999)
      const count = await Order.count({
        where: { createTime: { [Op.between]: [start, end] } }
      })
      hourDistribution.push({ hour: h, count })
    }

    res.json(success({
      todayOrders,
      weekOrders,
      monthOrders,
      completionRate,
      cancelRate,
      statusDistribution: statusDistribution.map(s => ({
        status: s.status,
        count: parseInt(s.dataValues.count)
      })),
      hourDistribution
    }))
  } catch (error) {
    next(error)
  }
}

const getCapacityAnalytics = async (req, res, next) => {
  try {
    const totalDrivers = await Driver.count()
    const onlineDrivers = await Driver.count({ where: { status: 1 } })
    const onlineRate = totalDrivers > 0 ? ((onlineDrivers / totalDrivers) * 100).toFixed(1) : '0.0'

    const totalOrders = await Order.count({ where: { status: { [Op.ne]: 6 } } })
    const acceptedOrders = await Order.count({ where: { status: { [Op.in]: [2, 3, 4, 5] } } })
    const acceptRate = totalOrders > 0 ? ((acceptedOrders / totalOrders) * 100).toFixed(1) : '0.0'

    const capacityDistribution = await Order.findAll({
      attributes: ['capacityType', [Order.sequelize.fn('COUNT', '*'), 'count']],
      group: ['capacityType']
    })

    res.json(success({
      totalDrivers,
      onlineDrivers,
      onlineRate,
      acceptRate,
      capacityDistribution: capacityDistribution.map(c => ({
        capacityType: c.capacityType,
        count: parseInt(c.dataValues.count)
      })),
      peakSupplyDemandRatio: onlineDrivers > 0 ? (totalOrders / onlineDrivers).toFixed(2) : '0'
    }))
  } catch (error) {
    next(error)
  }
}

const getUserAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const weekStart = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayNewUsers = await Passenger.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })

    const newUsersTrend = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const count = await Passenger.count({
        where: { createTime: { [Op.between]: [dayStart, dayEnd] } }
      })
      newUsersTrend.push({ date: dayStart.toISOString().slice(0, 10), count })
    }

    const activeUsers = await Passenger.count({ where: { status: 1 } })
    const totalUsers = await Passenger.count()

    const retentionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0'

    const consumptionDistribution = await Order.findAll({
      attributes: [
        'passengerId',
        [Order.sequelize.fn('SUM', Order.sequelize.col('actualPrice')), 'totalSpent']
      ],
      where: { status: 5 },
      group: ['passengerId']
    })

    res.json(success({
      todayNewUsers,
      newUsersTrend,
      activeUsers,
      retentionRate,
      consumptionDistribution: consumptionDistribution.map(c => ({
        passengerId: c.passengerId,
        totalSpent: parseFloat(c.dataValues.totalSpent) || 0
      }))
    }))
  } catch (error) {
    next(error)
  }
}

const getFinanceAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const incomeTrend = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const amount = await FinanceStatement.sum('amount', {
        where: {
          type: 1,
          createTime: { [Op.between]: [dayStart, dayEnd] }
        }
      }) || 0
      incomeTrend.push({ date: dayStart.toISOString().slice(0, 10), amount })
    }

    const expenditureDistribution = await FinanceStatement.findAll({
      attributes: ['type', [FinanceStatement.sequelize.fn('SUM', FinanceStatement.sequelize.col('amount')), 'total']],
      group: ['type']
    })

    const totalSettlements = await Order.count({ where: { status: 5 } })
    const settledOrders = await FinanceStatement.count({ where: { type: 1 } })
    const settlementRate = totalSettlements > 0 ? ((settledOrders / totalSettlements) * 100).toFixed(1) : '0.0'

    const capacityTypeIncome = await Order.findAll({
      attributes: [
        'capacityType',
        [Order.sequelize.fn('SUM', Order.sequelize.col('actualPrice')), 'totalIncome']
      ],
      where: { status: 5 },
      group: ['capacityType']
    })

    res.json(success({
      incomeTrend,
      expenditureDistribution: expenditureDistribution.map(e => ({
        type: e.type,
        total: parseFloat(e.dataValues.total) || 0
      })),
      settlementRate,
      capacityTypeIncome: capacityTypeIncome.map(c => ({
        capacityType: c.capacityType,
        totalIncome: parseFloat(c.dataValues.totalIncome) || 0
      }))
    }))
  } catch (error) {
    next(error)
  }
}

const getMarketingAnalytics = async (req, res, next) => {
  try {
    const campaigns = await MarketingCampaign.findAll({
      where: { status: { [Op.in]: [1, 2, 3] } }
    })

    let totalBudget = 0
    let totalUsedBudget = 0
    const campaignStats = []

    for (const c of campaigns) {
      totalBudget += parseFloat(c.budget) || 0
      totalUsedBudget += parseFloat(c.usedBudget) || 0
      campaignStats.push({
        id: c.id,
        name: c.name,
        type: c.type,
        roi: c.budget > 0 ? ((c.usedBudget / c.budget) * 100).toFixed(1) : '0.0',
        participantCount: c.participantCount,
        orderCount: c.orderCount
      })
    }

    const totalCoupons = await Coupon.sum('totalCount') || 0
    const usedCoupons = await Coupon.sum('usedCount') || 0
    const couponRedemptionRate = totalCoupons > 0 ? ((usedCoupons / totalCoupons) * 100).toFixed(1) : '0.0'

    const totalSubsidy = await MarketingCampaign.sum('usedBudget') || 0
    const totalOrders = await Order.count({ where: { status: 5 } })
    const subsidyEfficiency = totalOrders > 0 ? (totalSubsidy / totalOrders).toFixed(2) : '0'

    res.json(success({
      campaignStats,
      totalROI: totalBudget > 0 ? ((totalUsedBudget / totalBudget) * 100).toFixed(1) : '0.0',
      couponRedemptionRate,
      subsidyEfficiency
    }))
  } catch (error) {
    next(error)
  }
}

const getRiskAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

    const riskTrend = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const count = await RiskRecord.count({
        where: { createTime: { [Op.between]: [dayStart, dayEnd] } }
      })
      riskTrend.push({ date: dayStart.toISOString().slice(0, 10), count })
    }

    const typeDistribution = await RiskRecord.findAll({
      attributes: ['riskType', [RiskRecord.sequelize.fn('COUNT', '*'), 'count']],
      group: ['riskType']
    })

    const totalRecords = await RiskRecord.count()
    const handledRecords = await RiskRecord.count({ where: { status: 1 } })
    const handleRate = totalRecords > 0 ? ((handledRecords / totalRecords) * 100).toFixed(1) : '0.0'

    res.json(success({
      riskTrend,
      typeDistribution: typeDistribution.map(t => ({
        riskType: t.riskType,
        count: parseInt(t.dataValues.count)
      })),
      handleRate
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getOrderAnalytics,
  getCapacityAnalytics,
  getUserAnalytics,
  getFinanceAnalytics,
  getMarketingAnalytics,
  getRiskAnalytics
}
