const { Op } = require('sequelize')
const { Order, Driver, Passenger, CapacityType, FinanceStatement, FinanceSettlement } = require('../models')
const { AppError } = require('../utils/response')

const calculateOrderFee = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const capacityType = await CapacityType.findOne({
    where: { id: order.capacityType }
  })

  if (!capacityType) {
    throw new AppError('运力类型不存在', 404, 404)
  }

  const distance = parseFloat(order.distance) || 0
  const duration = order.duration || 0

  let actualPrice = parseFloat(capacityType.basePrice) || 0
  actualPrice += distance * (parseFloat(capacityType.perKmPrice) || 0)
  actualPrice += duration * (parseFloat(capacityType.perMinPrice) || 0)

  const minCharge = parseFloat(capacityType.minCharge) || 0
  if (actualPrice < minCharge) {
    actualPrice = minCharge
  }

  actualPrice = Math.round(actualPrice * 100) / 100

  return { actualPrice, distance, duration, capacityType }
}

const createStatement = async (data) => {
  const statement = await FinanceStatement.create({
    ...data,
    statementNo: data.statementNo || 'FS' + Date.now() + Math.floor(Math.random() * 1000)
  })
  return statement
}

const autoSettleOnComplete = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }
  if (order.status !== 5) {
    throw new AppError('只有已完成的订单才能自动核算', 400, 400)
  }

  const feeResult = await calculateOrderFee(orderId)

  await order.update({ actualPrice: feeResult.actualPrice })

  if (order.driverId) {
    const driver = await Driver.findByPk(order.driverId)
    if (driver) {
      const newBalance = parseFloat(driver.balance || 0) + feeResult.actualPrice
      const newIncome = parseFloat(driver.totalIncome || 0) + feeResult.actualPrice

      await driver.update({
        balance: Math.round(newBalance * 100) / 100,
        totalIncome: Math.round(newIncome * 100) / 100
      })

      await createStatement({
        orderNo: order.orderNo,
        type: 1,
        amount: feeResult.actualPrice,
        balance: Math.round(newBalance * 100) / 100,
        relatedId: order.id,
        relatedType: 'order',
        accountType: 1,
        accountId: order.driverId,
        remark: `订单${order.orderNo}完成自动核算`
      })
    }
  }

  return { orderId, actualPrice: feeResult.actualPrice }
}

const createRefundOnCancel = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const refundAmount = parseFloat(order.actualPrice) || parseFloat(order.estimatedPrice) || 0
  if (refundAmount <= 0) {
    return { orderId, refundAmount: 0, message: '无需退款' }
  }

  if (order.passengerId) {
    const passenger = await Passenger.findByPk(order.passengerId)
    if (passenger) {
      const newBalance = parseFloat(passenger.balance || 0) + refundAmount
      await passenger.update({
        balance: Math.round(newBalance * 100) / 100
      })

      await createStatement({
        orderNo: order.orderNo,
        type: 3,
        amount: refundAmount,
        balance: Math.round(newBalance * 100) / 100,
        relatedId: order.id,
        relatedType: 'order',
        accountType: 2,
        accountId: order.passengerId,
        remark: `订单${order.orderNo}取消退款`
      })
    }
  }

  return { orderId, refundAmount }
}

const generateSettlement = async (driverId, periodStart, periodEnd) => {
  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new AppError('司机不存在', 404, 404)
  }

  const where = {
    driverId,
    status: 5,
    completeTime: {
      [Op.between]: [periodStart, periodEnd]
    }
  }

  const orders = await Order.findAll({ where })
  const orderCount = orders.length
  const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.actualPrice || 0), 0)

  const settlement = await FinanceSettlement.create({
    settlementNo: 'ST' + Date.now() + Math.floor(Math.random() * 1000),
    driverId,
    driverName: driver.name,
    driverPhone: driver.phone,
    totalAmount: Math.round(totalAmount * 100) / 100,
    orderCount,
    status: 0,
    periodStart,
    periodEnd,
    remark: `${periodStart}至${periodEnd}结算`
  })

  return settlement
}

const batchSettlement = async (driverIds) => {
  const periodEnd = new Date()
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

  let successCount = 0
  let failCount = 0
  const results = []

  for (const driverId of driverIds) {
    try {
      const settlement = await generateSettlement(driverId, periodStart, periodEnd)
      successCount++
      results.push({ driverId, success: true, settlementId: settlement.id })
    } catch (error) {
      failCount++
      results.push({ driverId, success: false, message: error.message })
    }
  }

  return { successCount, failCount, results }
}

module.exports = {
  calculateOrderFee,
  createStatement,
  autoSettleOnComplete,
  createRefundOnCancel,
  generateSettlement,
  batchSettlement
}
