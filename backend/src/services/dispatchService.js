const { Op } = require('sequelize')
const { Order, Driver, Vehicle } = require('../models')
const { AppError } = require('../utils/response')

const calculateDriverScore = (driver, order) => {
  let distanceScore = 0
  let ratingScore = 0
  let orderLoadScore = 0
  let capacityScore = 0

  const distance = driver.distance || 999
  if (distance <= 2) distanceScore = 100
  else if (distance <= 5) distanceScore = 80
  else if (distance <= 10) distanceScore = 60
  else if (distance <= 20) distanceScore = 40
  else distanceScore = 20

  if (driver.rating >= 4.8) ratingScore = 100
  else if (driver.rating >= 4.5) ratingScore = 85
  else if (driver.rating >= 4.0) ratingScore = 65
  else ratingScore = 40

  const todayOrders = driver.todayOrders || 0
  const avgDailyOrders = 10
  if (todayOrders <= avgDailyOrders * 0.5) orderLoadScore = 100
  else if (todayOrders <= avgDailyOrders) orderLoadScore = 80
  else if (todayOrders <= avgDailyOrders * 1.5) orderLoadScore = 50
  else orderLoadScore = 30

  if (driver.vehicleCapacityType === order.capacityType) capacityScore = 100
  else capacityScore = 30

  const totalScore =
    distanceScore * 0.3 +
    ratingScore * 0.25 +
    orderLoadScore * 0.2 +
    capacityScore * 0.25

  return Math.round(Math.min(100, Math.max(0, totalScore)))
}

const findBestDrivers = async (orderId, limit = 5) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const drivers = await Driver.findAll({
    where: {
      status: 1,
      auditStatus: 1
    },
    include: [{
      model: Vehicle,
      as: 'vehicle',
      required: false
    }]
  })

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  const scoredDrivers = []
  for (const driver of drivers) {
    const todayOrders = await Order.count({
      where: {
        driverId: driver.id,
        createTime: { [Op.gte]: todayStart }
      }
    })

    const driverWithMeta = {
      ...driver.get({ plain: true }),
      distance: calculateDistance(
        order.startLat, order.startLng,
        driver.vehicle?.lat || 0, driver.vehicle?.lng || 0
      ),
      todayOrders,
      vehicleCapacityType: driver.vehicle?.capacityType || 0
    }

    const score = calculateDriverScore(driverWithMeta, order)
    scoredDrivers.push({
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      rating: driver.rating,
      vehicleId: driver.vehicleId,
      vehiclePlate: driver.vehicle?.plateNumber || '',
      score
    })
  }

  scoredDrivers.sort((a, b) => b.score - a.score)
  return scoredDrivers.slice(0, limit)
}

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 999
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const dispatchOrder = async (orderId, driverId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }
  if (order.status !== 1) {
    throw new AppError('只有待接单状态的订单才能派单', 400, 400)
  }

  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new AppError('司机不存在', 404, 404)
  }
  if (driver.status !== 1) {
    throw new AppError('司机不在线，无法派单', 400, 400)
  }
  if (driver.auditStatus !== 1) {
    throw new AppError('司机未通过审核，无法派单', 400, 400)
  }

  const activeOrder = await Order.findOne({
    where: {
      driverId,
      status: { [Op.in]: [2, 3, 4] }
    }
  })
  if (activeOrder) {
    throw new AppError('司机正在进行其他订单，无法派单', 400, 400)
  }

  await order.update({
    status: 2,
    driverId,
    driverName: driver.name,
    driverPhone: driver.phone,
    vehicleId: driver.vehicleId,
    acceptTime: new Date()
  })

  await driver.update({ status: 2 })

  return order
}

const batchDispatch = async (orderIds) => {
  let successCount = 0
  let failCount = 0
  const results = []

  for (const orderId of orderIds) {
    try {
      const bestDrivers = await findBestDrivers(orderId, 1)
      if (bestDrivers.length === 0) {
        failCount++
        results.push({ orderId, success: false, message: '无可用司机' })
        continue
      }

      await dispatchOrder(orderId, bestDrivers[0].driverId)
      successCount++
      results.push({
        orderId,
        success: true,
        driverId: bestDrivers[0].driverId,
        driverName: bestDrivers[0].driverName,
        score: bestDrivers[0].score
      })
    } catch (error) {
      failCount++
      results.push({ orderId, success: false, message: error.message })
    }
  }

  return { successCount, failCount, results }
}

const getPeakHourConfig = () => {
  return {
    peakHours: [
      { start: 7, end: 9, label: '早高峰' },
      { start: 17, end: 19, label: '晚高峰' }
    ],
    dispatchStrategy: {
      maxDispatchRadius: 5,
      scoreThreshold: 60,
      dispatchTimeout: 30,
      retryCount: 3,
      priorityWeight: {
        distance: 0.3,
        rating: 0.25,
        orderLoad: 0.2,
        capacity: 0.25
      }
    },
    peakStrategy: {
      maxDispatchRadius: 8,
      scoreThreshold: 50,
      dispatchTimeout: 15,
      retryCount: 5,
      priorityWeight: {
        distance: 0.4,
        rating: 0.2,
        orderLoad: 0.15,
        capacity: 0.25
      }
    }
  }
}

module.exports = {
  calculateDriverScore,
  findBestDrivers,
  dispatchOrder,
  batchDispatch,
  getPeakHourConfig
}
