const { Op } = require('sequelize')
const {
  Order,
  Driver,
  Passenger,
  Vehicle,
  CapacityType,
  Ticket,
  FinanceStatement,
  FinanceSettlement,
  RiskRecord,
  OrderStatusLog,
  OrderTraceHistory,
  Coupon
} = require('../models')
const { AppError } = require('../utils/response')
const financeService = require('./financeService')

const PRICE_DEVIATION_THRESHOLD = 0.2
const BATCH_OP_LIMIT = 100

const checkEditConditions = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const conditions = {
    canEdit: true,
    reasons: [],
    hasSettled: false,
    hasTicket: false,
    hasArrears: false
  }

  const settleRecord = await FinanceSettlement.findOne({
    where: { orderNo: order.orderNo, status: 2 }
  })
  if (settleRecord) {
    conditions.hasSettled = true
    conditions.canEdit = false
    conditions.reasons.push('订单已核销结算')
  }

  const ticketCount = await Ticket.count({
    where: { orderId: order.id, status: { [Op.ne]: 4 } }
  })
  if (ticketCount > 0) {
    conditions.hasTicket = true
    conditions.canEdit = false
    conditions.reasons.push('存在未完成的售后工单')
  }

  const refundStatements = await FinanceStatement.findAll({
    where: { orderNo: order.orderNo, type: 3 }
  })
  const totalRefund = refundStatements.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
  const orderPrice = parseFloat(order.actualPrice || order.estimatedPrice || 0)
  if (totalRefund < orderPrice && order.status === 6) {
    conditions.hasArrears = true
    conditions.canEdit = false
    conditions.reasons.push('存在欠费记录')
  }

  return {
    order,
    ...conditions
  }
}

const validatePriceMatch = (distance, capacityType, estimatedPrice) => {
  const basePrice = 10
  const perKmPrice = 2.5
  const perMinPrice = 0.5
  const defaultDuration = distance * 3

  const calculatedPrice = basePrice + distance * perKmPrice + defaultDuration * perMinPrice
  const deviation = Math.abs(estimatedPrice - calculatedPrice) / calculatedPrice

  return {
    calculatedPrice: Number(calculatedPrice.toFixed(2)),
    deviation: Number(deviation.toFixed(4)),
    threshold: PRICE_DEVIATION_THRESHOLD,
    isValid: deviation <= PRICE_DEVIATION_THRESHOLD,
    suggestions: []
  }
}

const updateOrderBaseInfo = async (orderId, updateData, operatorInfo = {}) => {
  const result = await checkEditConditions(orderId)
  if (!result.canEdit) {
    throw new AppError('订单不允许编辑：' + result.reasons.join('、'), 400, 400)
  }

  const order = result.order

  const allowedFields = ['distance', 'duration', 'startAddress', 'startLng', 'startLat', 'endAddress', 'endLng', 'endLat']
  const filteredData = {}
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field]
    }
  }

  if (filteredData.distance !== undefined && order.estimatedPrice) {
    const priceCheck = validatePriceMatch(
      parseFloat(filteredData.distance),
      order.capacityType,
      parseFloat(order.estimatedPrice)
    )
    if (!priceCheck.isValid) {
      throw new AppError(
        `里程与预估费用偏差超过阈值${(priceCheck.threshold * 100).toFixed(0)}%，当前偏差${(priceCheck.deviation * 100).toFixed(2)}%，预估费用应为${priceCheck.calculatedPrice}元左右`,
        400,
        400
      )
    }
  }

  await order.update(filteredData)

  if (order.status === 5 && (filteredData.distance || filteredData.duration)) {
    await financeService.recalculateOrderFee(orderId)
  }

  return order
}

const getOrderStatusLogs = async (orderId, page = 1, pageSize = 20) => {
  const { count, rows } = await OrderStatusLog.findAndCountAll({
    where: { orderId },
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })
  return { list: rows, total: count, page, pageSize }
}

const batchUpdatePriceRule = async (orderIds, priceRule, operatorInfo = {}) => {
  if (orderIds.length > BATCH_OP_LIMIT) {
    throw new AppError(`批量操作最多支持${BATCH_OP_LIMIT}条`, 400, 400)
  }

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

      const unsettled = await FinanceSettlement.count({
        where: { orderNo: order.orderNo, status: 2 }
      })
      if (unsettled > 0) {
        results.failed++
        results.failedOrders.push({ id: orderId, orderNo: order.orderNo, reason: '已结算订单不允许修改' })
        continue
      }

      const hasAfterSale = await Ticket.count({
        where: { orderId: order.id, status: { [Op.ne]: 4 } }
      })
      if (hasAfterSale > 0) {
        results.failed++
        results.failedOrders.push({ id: orderId, orderNo: order.orderNo, reason: '售后中订单不允许操作' })
        continue
      }

      if (priceRule.basePrice !== undefined || priceRule.perKmPrice !== undefined) {
        const oldPrice = parseFloat(order.estimatedPrice || 0)
        const newPrice = (priceRule.basePrice || 0) +
          parseFloat(order.distance || 0) * (priceRule.perKmPrice || 2.5)
        await order.update({ estimatedPrice: Number(newPrice.toFixed(2)) })
      }

      results.success++
    } catch (error) {
      results.failed++
      results.failedOrders.push({ id: orderId, reason: error.message })
    }
    results.progress = Math.round(((i + 1) / orderIds.length) * 100)
  }

  return results
}

const getOrderTrace = async (orderNo, operatorInfo = {}) => {
  const order = await Order.findOne({
    where: { orderNo },
    include: [
      { association: 'driver' },
      { association: 'passenger' },
      { association: 'vehicle' }
    ]
  })

  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const traceHistory = await OrderTraceHistory.findOne({
    where: { orderNo },
    order: [['createTime', 'DESC']]
  })

  const isRepeated = !!traceHistory &&
    traceHistory.operatorId === operatorInfo.operatorId &&
    (Date.now() - new Date(traceHistory.createTime).getTime()) < 3600000

  const tickets = await Ticket.findAll({
    where: { orderId: order.id },
    order: [['createTime', 'DESC']]
  })

  const statements = await FinanceStatement.findAll({
    where: { orderNo: order.orderNo },
    order: [['createTime', 'ASC']]
  })

  const riskRecords = await RiskRecord.findAll({
    where: { orderId: order.id },
    order: [['createTime', 'DESC']]
  })

  const statusLogs = await OrderStatusLog.findAll({
    where: { orderId: order.id },
    order: [['createTime', 'ASC']]
  })

  const coupons = await Coupon.findAll({
    where: { orderNo: order.orderNo }
  })

  const traceData = {
    order: order.toJSON(),
    driver: order.driver ? order.driver.toJSON() : null,
    passenger: order.passenger ? order.passenger.toJSON() : null,
    vehicle: order.vehicle ? order.vehicle.toJSON() : null,
    tickets: tickets.map(t => t.toJSON()),
    statements: statements.map(s => s.toJSON()),
    riskRecords: riskRecords.map(r => r.toJSON()),
    statusLogs: statusLogs.map(s => s.toJSON()),
    coupons: coupons.map(c => c.toJSON()),
    isRepeated,
    repeatCount: traceHistory ? traceHistory.queryCount : 0
  }

  const integrity = checkDataIntegrity(traceData)
  traceData.integrity = integrity

  if (traceHistory) {
    await traceHistory.update({
      queryCount: traceHistory.queryCount + 1,
      dataIntegrity: integrity.score,
      missingModules: integrity.missing.join(','),
      traceResult: {
        hasDriver: !!traceData.driver,
        hasPassenger: !!traceData.passenger,
        ticketCount: traceData.tickets.length,
        statementCount: traceData.statements.length
      }
    })
  } else {
    await OrderTraceHistory.create({
      orderId: order.id,
      orderNo: order.orderNo,
      operatorId: operatorInfo.operatorId,
      operatorName: operatorInfo.operatorName,
      dataIntegrity: integrity.score,
      missingModules: integrity.missing.join(','),
      queryCount: 1
    })
  }

  return traceData
}

const checkDataIntegrity = (traceData) => {
  const modules = [
    { key: 'order', name: '订单基础信息', data: traceData.order },
    { key: 'passenger', name: '乘客信息', data: traceData.passenger },
    { key: 'driver', name: '司机信息', data: traceData.driver },
    { key: 'vehicle', name: '车辆信息', data: traceData.vehicle },
    { key: 'statements', name: '支付记录', data: traceData.statements.length > 0 },
    { key: 'statusLogs', name: '状态流转日志', data: traceData.statusLogs.length > 0 },
    { key: 'tickets', name: '客服记录', data: traceData.tickets, optional: true }
  ]

  let totalScore = 0
  let maxScore = 0
  const missing = []
  const complete = []

  modules.forEach(m => {
    const weight = m.optional ? 5 : 15
    maxScore += weight
    if (m.data) {
      totalScore += weight
      complete.push(m.name)
    } else {
      missing.push(m.name)
    }
  })

  return {
    score: Number(((totalScore / maxScore) * 100).toFixed(2)),
    totalModules: modules.length,
    completeCount: complete.length,
    missingCount: missing.length,
    missing,
    complete
  }
}

const getTraceHistory = async (operatorId, page = 1, pageSize = 20) => {
  const where = {}
  if (operatorId) where.operatorId = operatorId

  const { count, rows } = await OrderTraceHistory.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  return { list: rows, total: count, page, pageSize }
}

const getOrderActions = (status) => {
  const actionMap = {
    1: ['dispatch', 'cancel', 'edit'],
    2: ['pickup', 'cancel', 'reassign', 'edit'],
    3: ['startTrip', 'cancel', 'edit'],
    4: ['complete', 'edit'],
    5: ['settlement', 'trace', 'refund'],
    6: ['trace', 'refund'],
    7: ['trace']
  }
  return actionMap[status] || []
}

module.exports = {
  checkEditConditions,
  validatePriceMatch,
  updateOrderBaseInfo,
  getOrderStatusLogs,
  batchUpdatePriceRule,
  getOrderTrace,
  checkDataIntegrity,
  getTraceHistory,
  getOrderActions,
  PRICE_DEVIATION_THRESHOLD,
  BATCH_OP_LIMIT
}
