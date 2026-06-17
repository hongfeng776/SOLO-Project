const { Op } = require('sequelize')
const { Order, Driver, Passenger, FinanceStatement, OrderStatusLog } = require('../models')
const { AppError } = require('../utils/response')

const VALID_TRANSITIONS = {
  1: [2, 6, 7],
  2: [3, 6],
  3: [4, 6],
  4: [5, 6],
  5: [],
  6: [],
  7: []
}

const ORDER_SOURCE_MAP = {
  1: 'APP下单',
  2: '小程序',
  3: '客服代下',
  4: '企业用车'
}

const validateTransition = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed) return false
  return allowed.includes(targetStatus)
}

const generateTraceId = () => {
  return 'TRACE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

const recordStatusLog = async (order, oldStatus, newStatus, options = {}) => {
  const { operatorId, operatorName, operatorType = 1, changeReason, remark } = options
  await OrderStatusLog.create({
    orderId: order.id,
    orderNo: order.orderNo,
    oldStatus,
    newStatus,
    operatorId,
    operatorName,
    operatorType,
    changeReason,
    remark,
    traceId: generateTraceId()
  })
}

const transitionOrder = async (orderId, targetStatus, extraData = {}, options = {}) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  if (!validateTransition(order.status, targetStatus)) {
    throw new AppError(
      `订单状态不允许从${order.status}流转到${targetStatus}`,
      400,
      400
    )
  }

  const oldStatus = order.status
  const updateData = { status: targetStatus, ...extraData }

  await order.update(updateData)
  await triggerLinkage(order, oldStatus, targetStatus)
  await recordStatusLog(order, oldStatus, targetStatus, options)

  return order
}

const triggerLinkage = async (order, oldStatus, newStatus) => {
  switch (true) {
    case (oldStatus === 1 && newStatus === 2): {
      if (order.driverId) {
        const driver = await Driver.findByPk(order.driverId)
        if (driver) {
          await driver.update({ status: 2 })
        }
      }
      break
    }

    case (oldStatus === 2 && newStatus === 3): {
      await order.update({ pickupTime: new Date() })
      break
    }

    case (oldStatus === 3 && newStatus === 4): {
      break
    }

    case (oldStatus === 4 && newStatus === 5): {
      await order.update({ completeTime: new Date() })

      if (order.driverId) {
        const driver = await Driver.findByPk(order.driverId)
        if (driver) {
          await driver.update({
            status: 1,
            totalOrders: driver.totalOrders + 1
          })
        }
      }

      if (order.passengerId) {
        const passenger = await Passenger.findByPk(order.passengerId)
        if (passenger) {
          const actualPrice = order.actualPrice || 0
          await passenger.update({
            totalOrders: passenger.totalOrders + 1,
            totalSpend: parseFloat(passenger.totalSpend || 0) + parseFloat(actualPrice)
          })
        }
      }

      const actualPrice = order.actualPrice || 0
      if (actualPrice > 0 && order.orderNo) {
        const driver = order.driverId ? await Driver.findByPk(order.driverId) : null
        await FinanceStatement.create({
          statementNo: 'FS' + Date.now() + Math.floor(Math.random() * 1000),
          orderNo: order.orderNo,
          type: 1,
          amount: actualPrice,
          balance: driver ? parseFloat(driver.balance || 0) + parseFloat(actualPrice) : 0,
          relatedId: order.id,
          relatedType: 'order',
          accountType: 1,
          accountId: order.driverId,
          remark: `订单${order.orderNo}完成收入`
        })
      }
      break
    }

    case (newStatus === 6): {
      await order.update({ cancelTime: new Date() })

      if (order.driverId) {
        const driver = await Driver.findByPk(order.driverId)
        if (driver && driver.status === 2) {
          await driver.update({ status: 1 })
        }
      }

      const paidAmount = order.actualPrice || order.estimatedPrice || 0
      if (paidAmount > 0 && order.orderNo) {
        const passenger = order.passengerId ? await Passenger.findByPk(order.passengerId) : null
        await FinanceStatement.create({
          statementNo: 'FS' + Date.now() + Math.floor(Math.random() * 1000),
          orderNo: order.orderNo,
          type: 3,
          amount: paidAmount,
          balance: passenger ? parseFloat(passenger.balance || 0) + parseFloat(paidAmount) : 0,
          relatedId: order.id,
          relatedType: 'order',
          accountType: 2,
          accountId: order.passengerId,
          remark: `订单${order.orderNo}取消退款`
        })
      }
      break
    }
  }
}

module.exports = {
  VALID_TRANSITIONS,
  validateTransition,
  transitionOrder,
  triggerLinkage,
  recordStatusLog,
  generateTraceId,
  ORDER_SOURCE_MAP
}
