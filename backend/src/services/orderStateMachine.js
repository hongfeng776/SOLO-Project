const { Op } = require('sequelize')
const { Order, Driver, Passenger, FinanceStatement, OrderStatusLog, TransitionViolation } = require('../models')
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

const CANCEL_TYPES = {
  PASSENGER: 1,
  DRIVER: 2,
  SYSTEM_TIMEOUT: 3
}

const RESPONSIBILITY_MAP = {
  [CANCEL_TYPES.PASSENGER]: 'passenger',
  [CANCEL_TYPES.DRIVER]: 'driver',
  [CANCEL_TYPES.SYSTEM_TIMEOUT]: 'platform'
}

const ORDER_SOURCE_MAP = {
  1: 'APP下单',
  2: '小程序',
  3: '客服代下',
  4: '企业用车'
}

const DEBOUNCE_MS = 300
const transitionLocks = new Map()

const validateTransition = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed) return false
  return allowed.includes(targetStatus)
}

const generateTraceId = () => {
  return 'TRACE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}

const checkTransitionDuplicate = async (orderId, oldStatus, newStatus) => {
  const existing = await OrderStatusLog.findOne({
    where: { orderId, oldStatus, newStatus },
    order: [['createTime', 'DESC']]
  })
  if (existing) {
    const timeDiff = Date.now() - new Date(existing.createTime).getTime()
    if (timeDiff < 5000) {
      return true
    }
  }
  return false
}

const recordViolation = async (orderId, orderNo, fromStatus, toStatus, currentStatus, violationType, options = {}) => {
  await TransitionViolation.create({
    orderId,
    orderNo,
    fromStatus,
    toStatus,
    currentStatus,
    violationType,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorIP: options.operatorIP,
    detail: options.detail || `违规流转：从状态${fromStatus}到${toStatus}，当前实际状态${currentStatus}`,
    handled: 0
  })
}

const validateTransitionPrerequisites = async (order, targetStatus, extraData = {}) => {
  const failures = []

  switch (true) {
    case (targetStatus === 2): {
      if (!extraData.driverId && !order.driverId) {
        failures.push({ field: 'driverId', message: '未指定司机，无法派单' })
      }
      if (extraData.driverId) {
        const driver = await Driver.findByPk(extraData.driverId)
        if (!driver) {
          failures.push({ field: 'driverId', message: '司机不存在' })
        } else {
          if (driver.status !== 1) {
            failures.push({ field: 'driverStatus', message: '司机不在线，无法接单' })
          }
          if (driver.auditStatus !== 1) {
            failures.push({ field: 'driverAudit', message: '司机未通过审核，无法接单' })
          }
          const activeOrder = await Order.findOne({
            where: { driverId: extraData.driverId, status: { [Op.in]: [2, 3, 4] } }
          })
          if (activeOrder) {
            failures.push({ field: 'driverCapacity', message: '司机运力已被占用，存在进行中订单' })
          }
        }
      }
      break
    }

    case (targetStatus === 5): {
      if (order.endLat && order.endLng && extraData.endLat && extraData.endLng) {
        const dist = Math.sqrt(
          Math.pow(parseFloat(order.endLat) - parseFloat(extraData.endLat), 2) +
          Math.pow(parseFloat(order.endLng) - parseFloat(extraData.endLng), 2)
        )
        if (dist > 0.01) {
          failures.push({
            field: 'destination',
            message: '行驶轨迹终点与目的地偏差较大，请确认是否到达目的地'
          })
        }
      }
      break
    }
  }

  return {
    valid: failures.length === 0,
    failures
  }
}

const recordStatusLog = async (order, oldStatus, newStatus, options = {}) => {
  const {
    operatorId,
    operatorName,
    operatorType = 1,
    operatorIP,
    changeReason,
    cancelType,
    responsibility,
    remark
  } = options

  await OrderStatusLog.create({
    orderId: order.id,
    orderNo: order.orderNo,
    oldStatus,
    newStatus,
    operatorId,
    operatorName,
    operatorType,
    operatorIP,
    changeReason,
    cancelType,
    responsibility,
    remark,
    traceId: generateTraceId()
  })
}

const transitionOrder = async (orderId, targetStatus, extraData = {}, options = {}) => {
  const lockKey = `order_${orderId}`
  if (transitionLocks.has(lockKey)) {
    throw new AppError('操作处理中，请勿重复提交', 429, 429)
  }
  transitionLocks.set(lockKey, Date.now())

  try {
    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new AppError('订单不存在', 404, 404)
    }

    if (!validateTransition(order.status, targetStatus)) {
      await recordViolation(orderId, order.orderNo, order.status, targetStatus, order.status, 'invalid_transition', {
        operatorId: options.operatorId,
        operatorName: options.operatorName,
        operatorIP: options.operatorIP,
        detail: `非法状态流转：从${order.status}到${targetStatus}，允许的目标状态为${VALID_TRANSITIONS[order.status]?.join(',') || '无'}`
      })
      throw new AppError(
        `订单状态不允许从${order.status}流转到${targetStatus}`,
        400,
        400
      )
    }

    const isDuplicate = await checkTransitionDuplicate(orderId, order.status, targetStatus)
    if (isDuplicate) {
      throw new AppError('存在相同的流转记录，禁止重复操作', 409, 409)
    }

    const prerequisiteResult = await validateTransitionPrerequisites(order, targetStatus, extraData)
    if (!prerequisiteResult.valid) {
      return {
        success: false,
        order,
        prerequisiteFailures: prerequisiteResult.failures,
        message: '前置条件不满足'
      }
    }

    const oldStatus = order.status
    const updateData = { status: targetStatus, ...extraData }

    await order.update(updateData)
    await triggerLinkage(order, oldStatus, targetStatus, extraData, options)

    if (targetStatus === 6) {
      const cancelType = options.cancelType || CANCEL_TYPES.PASSENGER
      const responsibility = RESPONSIBILITY_MAP[cancelType] || 'passenger'
      await recordStatusLog(order, oldStatus, targetStatus, {
        ...options,
        cancelType,
        responsibility,
        changeReason: options.changeReason || getCancelReason(cancelType)
      })
      await handleCancelPostLogic(order, cancelType, responsibility)
    } else {
      await recordStatusLog(order, oldStatus, targetStatus, options)
    }

    return {
      success: true,
      order,
      prerequisiteFailures: [],
      message: '状态流转成功'
    }
  } finally {
    setTimeout(() => {
      transitionLocks.delete(lockKey)
    }, DEBOUNCE_MS)
  }
}

const getCancelReason = (cancelType) => {
  const map = {
    [CANCEL_TYPES.PASSENGER]: '用户主动取消',
    [CANCEL_TYPES.DRIVER]: '司机主动取消',
    [CANCEL_TYPES.SYSTEM_TIMEOUT]: '系统超时自动取消'
  }
  return map[cancelType] || '取消'
}

const handleCancelPostLogic = async (order, cancelType, responsibility) => {
  if (order.driverId && responsibility === 'driver') {
    const driver = await Driver.findByPk(order.driverId)
    if (driver) {
      const penaltyScore = Math.min(5, parseFloat(driver.rating || 5) * 0.1)
      await driver.update({
        status: driver.status === 2 ? 1 : driver.status,
        cancelCount: (driver.cancelCount || 0) + 1,
        rating: Math.max(1, parseFloat(driver.rating || 5) - penaltyScore * 0.1)
      })
    }
  }

  if (order.passengerId && responsibility === 'passenger') {
    const passenger = await Passenger.findByPk(order.passengerId)
    if (passenger) {
      await passenger.update({
        cancelCount: (passenger.cancelCount || 0) + 1
      })
    }
  }
}

const triggerLinkage = async (order, oldStatus, newStatus, extraData = {}, options = {}) => {
  switch (true) {
    case (oldStatus === 1 && newStatus === 2): {
      const driverId = extraData.driverId || order.driverId
      if (driverId) {
        const driver = await Driver.findByPk(driverId)
        if (driver) {
          await driver.update({ status: 2 })
        }
      }
      await order.update({ acceptTime: new Date() })
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

const getCancelStatistics = async () => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  const totalToday = await Order.count({
    where: { createTime: { [Op.gte]: todayStart } }
  })

  const cancelledToday = await Order.count({
    where: {
      status: 6,
      cancelTime: { [Op.gte]: todayStart }
    }
  })

  const byCancelType = await OrderStatusLog.findAll({
    where: {
      newStatus: 6,
      cancelType: { [Op.ne]: null },
      createTime: { [Op.gte]: todayStart }
    },
    attributes: ['cancelType', [require('sequelize').fn('COUNT', '*'), 'count']],
    group: ['cancelType'],
    raw: true
  })

  const byResponsibility = await OrderStatusLog.findAll({
    where: {
      newStatus: 6,
      responsibility: { [Op.ne]: null },
      createTime: { [Op.gte]: todayStart }
    },
    attributes: ['responsibility', [require('sequelize').fn('COUNT', '*'), 'count']],
    group: ['responsibility'],
    raw: true
  })

  return {
    totalToday,
    cancelledToday,
    cancelRate: totalToday > 0 ? Number(((cancelledToday / totalToday) * 100).toFixed(2)) : 0,
    byCancelType: byCancelType.reduce((acc, item) => {
      acc[item.cancelType] = parseInt(item.count)
      return acc
    }, {}),
    byResponsibility: byResponsibility.reduce((acc, item) => {
      acc[item.responsibility] = parseInt(item.count)
      return acc
    }, {})
  }
}

const getAbnormalOrders = async (type, page = 1, pageSize = 20) => {
  const where = {}

  switch (type) {
    case 'timeout_unassigned':
      where.status = 1
      where.createTime = {
        [Op.lt]: new Date(Date.now() - 10 * 60 * 1000)
      }
      break
    case 'midway_disconnected':
      where.status = { [Op.in]: [2, 3, 4] }
      where.updateTime = {
        [Op.lt]: new Date(Date.now() - 30 * 60 * 1000)
      }
      break
    case 'unsettled_completed':
      where.status = 5
      break
    default:
      where[Op.or] = [
        { status: 1, createTime: { [Op.lt]: new Date(Date.now() - 10 * 60 * 1000) } },
        { status: { [Op.in]: [2, 3, 4] }, updateTime: { [Op.lt]: new Date(Date.now() - 30 * 60 * 1000) } }
      ]
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    order: [['updateTime', 'ASC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  const list = rows.map(row => {
    const item = row.toJSON()
    item.abnormalType = type
    if (type === 'timeout_unassigned') {
      item.abnormalLabel = '超时未接单'
    } else if (type === 'midway_disconnected') {
      item.abnormalLabel = '中途失联'
    } else if (type === 'unsettled_completed') {
      item.abnormalLabel = '未结算完成'
    } else {
      item.abnormalLabel = '异常订单'
    }
    return item
  })

  return { list, total: count, page, pageSize }
}

const batchAbnormalOperation = async (orderIds, operation, operatorInfo = {}) => {
  const results = {
    success: 0,
    failed: 0,
    total: orderIds.length,
    failedOrders: [],
    progress: 0
  }

  for (let i = 0; i < orderIds.length; i++) {
    const orderId = orderIds[i]
    try {
      const order = await Order.findByPk(orderId)
      if (!order) {
        results.failed++
        results.failedOrders.push({ id: orderId, reason: '订单不存在' })
        continue
      }

      switch (operation) {
        case 'retry_dispatch': {
          if (order.status !== 1) {
            results.failed++
            results.failedOrders.push({ id: orderId, orderNo: order.orderNo, reason: '仅待接单订单可重试' })
            continue
          }
          await order.update({ status: 1 })
          results.success++
          break
        }
        case 'mark_abnormal': {
          await recordStatusLog(order, order.status, order.status, {
            operatorId: operatorInfo.operatorId,
            operatorName: operatorInfo.operatorName,
            operatorIP: operatorInfo.operatorIP,
            operatorType: 1,
            changeReason: '管理员标记异常',
            remark: `异常标记：${order.abnormalLabel || '异常订单'}`
          })
          results.success++
          break
        }
        case 'force_close': {
          if (![1, 2, 3, 4, 7].includes(order.status)) {
            results.failed++
            results.failedOrders.push({ id: orderId, orderNo: order.orderNo, reason: '当前状态不可关闭' })
            continue
          }
          const oldStatus = order.status
          await order.update({ status: 6, cancelTime: new Date(), cancelReason: '管理员强制关闭异常订单' })
          await recordStatusLog(order, oldStatus, 6, {
            operatorId: operatorInfo.operatorId,
            operatorName: operatorInfo.operatorName,
            operatorIP: operatorInfo.operatorIP,
            operatorType: 1,
            cancelType: CANCEL_TYPES.SYSTEM_TIMEOUT,
            responsibility: 'platform',
            changeReason: '管理员强制关闭异常订单'
          })
          if (order.driverId) {
            const driver = await Driver.findByPk(order.driverId)
            if (driver && driver.status === 2) {
              await driver.update({ status: 1 })
            }
          }
          results.success++
          break
        }
        case 'reset_status': {
          await order.update({ status: 1 })
          await recordStatusLog(order, order.status, 1, {
            operatorId: operatorInfo.operatorId,
            operatorName: operatorInfo.operatorName,
            operatorIP: operatorInfo.operatorIP,
            operatorType: 1,
            changeReason: '高权限管理员重置异常状态'
          })
          results.success++
          break
        }
        default:
          results.failed++
          results.failedOrders.push({ id: orderId, reason: '不支持的操作类型' })
      }
    } catch (error) {
      results.failed++
      results.failedOrders.push({ id: orderId, reason: error.message })
    }
    results.progress = Math.round(((i + 1) / orderIds.length) * 100)
  }

  return results
}

const getViolationLogs = async (params = {}) => {
  const { page = 1, pageSize = 20, handled } = params
  const where = {}
  if (handled !== undefined) where.handled = handled

  const { count, rows } = await TransitionViolation.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  return { list: rows, total: count, page, pageSize }
}

const getFlowDetail = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const statusLogs = await OrderStatusLog.findAll({
    where: { orderId },
    order: [['createTime', 'ASC']]
  })

  const violations = await TransitionViolation.findAll({
    where: { orderId },
    order: [['createTime', 'DESC']]
  })

  return {
    order: order.toJSON(),
    statusLogs: statusLogs.map(s => s.toJSON()),
    violations: violations.map(v => v.toJSON())
  }
}

module.exports = {
  VALID_TRANSITIONS,
  CANCEL_TYPES,
  RESPONSIBILITY_MAP,
  validateTransition,
  generateTraceId,
  recordStatusLog,
  recordViolation,
  transitionOrder,
  triggerLinkage,
  validateTransitionPrerequisites,
  checkTransitionDuplicate,
  getCancelStatistics,
  getAbnormalOrders,
  batchAbnormalOperation,
  getViolationLogs,
  getFlowDetail,
  ORDER_SOURCE_MAP
}
