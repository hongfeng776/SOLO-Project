const { Op } = require('sequelize')
const { Order, Driver, Passenger, FinanceStatement } = require('../models')
const { success } = require('../utils/response')

const getStatistics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

    const [todayOrders, totalDrivers, onlineDrivers, totalPassengers, todayRevenue] = await Promise.all([
      Order.count({ where: { createTime: { [Op.gte]: todayStart } }),
      Driver.count(),
      Driver.count({ where: { status: 1 } }),
      Passenger.count(),
      FinanceStatement.sum('amount', {
        where: {
          type: 1,
          createTime: { [Op.gte]: todayStart }
        }
      }) || 0
    ])

    const orderStats = {
      pending: await Order.count({ where: { status: 1 } }),
      dispatched: await Order.count({ where: { status: 2 } }),
      inProgress: await Order.count({ where: { status: 3 } }),
      completed: await Order.count({ where: { status: 4 } }),
      finished: await Order.count({ where: { status: 5 } }),
      cancelled: await Order.count({ where: { status: 6 } })
    }

    res.json(success({
      todayOrders,
      totalDrivers,
      onlineDrivers,
      totalPassengers,
      todayRevenue: todayRevenue || 0,
      orderStats,
      activeUsers: Math.floor(totalPassengers * 0.6)
    }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getStatistics
}
