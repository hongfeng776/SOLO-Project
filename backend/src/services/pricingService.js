const { Op } = require('sequelize')
const {
  Order,
  CapacityType,
  PricingRule,
  PricingChangeLog,
  FinanceStatement,
  Ticket,
  FinanceSettlement
} = require('../models')
const { AppError } = require('../utils/response')

const RULE_TYPE = {
  BASE: 1,
  TIME_SURGE: 2,
  WEATHER_SURGE: 3,
  HOLIDAY_SURGE: 4,
  CITY_STANDARD: 5
}

const INDUSTRY_PRICE_THRESHOLD = 500
const SURGE_RATIO_LIMIT = 3.0
const MIN_PRICE = 5
const MAX_PRICE = 1000

const getTimePeriod = (date = new Date()) => {
  const hour = date.getHours()
  if (hour >= 22 || hour < 6) return { period: 'nighttime', startTime: '22:00', endTime: '06:00' }
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return { period: 'peak', startTime: hour >= 7 ? '07:00' : '17:00', endTime: hour >= 7 ? '09:00' : '19:00' }
  return { period: 'daytime', startTime: '06:00', endTime: '22:00' }
}

const getHolidayType = (date = new Date()) => {
  const day = date.getDay()
  if (day === 0 || day === 6) return 'weekend'
  return 'workday'
}

const getWeatherCondition = (mockWeather) => {
  const weatherMap = {
    'rain': 'rain',
    'snow': 'snow',
    'fog': 'fog',
    'hot': 'hot',
    'normal': 'normal'
  }
  return weatherMap[mockWeather] || 'normal'
}

const getApplicableRules = async (order, options = {}) => {
  const { weather = 'normal', date = new Date() } = options

  const timeInfo = getTimePeriod(date)
  const holidayType = getHolidayType(date)
  const weatherCondition = getWeatherCondition(weather)

  const where = {
    status: 1,
    [Op.or]: [
      { capacityType: null },
      { capacityType: order.capacityType }
    ],
    [Op.or]: [
      { cityCode: null },
      { cityCode: order.cityCode || 'default' }
    ]
  }

  const rules = await PricingRule.findAll({
    where,
    order: [['priority', 'DESC'], ['ruleType', 'ASC']]
  })

  const applicableRules = []
  const appliedRuleIds = []
  let hasExclusiveRule = false

  for (const rule of rules) {
    let isApplicable = true

    if (rule.timePeriod && rule.timePeriod !== timeInfo.period) {
      isApplicable = false
    }
    if (rule.weatherCondition && rule.weatherCondition !== weatherCondition) {
      isApplicable = false
    }
    if (rule.holidayType && rule.holidayType !== holidayType) {
      isApplicable = false
    }

    if (rule.isMutuallyExclusive && applicableRules.length > 0) {
      const hasHigherPriority = applicableRules.some(
        r => r.isMutuallyExclusive && r.priority >= rule.priority
      )
      if (hasHigherPriority) {
        isApplicable = false
      }
    }

    if (rule.effectiveDateStart && new Date(rule.effectiveDateStart) > date) {
      isApplicable = false
    }
    if (rule.effectiveDateEnd && new Date(rule.effectiveDateEnd) < date) {
      isApplicable = false
    }

    if (isApplicable) {
      applicableRules.push(rule)
      appliedRuleIds.push(rule.id)
      if (rule.isMutuallyExclusive) {
        hasExclusiveRule = true
        break
      }
    }
  }

  const baseType = await CapacityType.findOne({
    where: { id: order.capacityType }
  })

  const baseRule = baseType ? {
    id: 0,
    ruleName: `基础计费 - ${baseType.name}`,
    ruleType: RULE_TYPE.BASE,
    basePrice: parseFloat(baseType.basePrice),
    perKmPrice: parseFloat(baseType.perKmPrice),
    perMinPrice: parseFloat(baseType.perMinPrice),
    minCharge: parseFloat(baseType.minCharge),
    surgeRatio: 1,
    isMutuallyExclusive: false,
    priority: 999
  } : null

  if (baseRule) {
    applicableRules.unshift(baseRule)
    appliedRuleIds.unshift(0)
  }

  return {
    rules: applicableRules,
    appliedRuleIds,
    timeInfo,
    holidayType,
    weatherCondition,
    hasExclusiveRule
  }
}

const calculateBillingDetail = async (orderId, options = {}) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const ruleResult = await getApplicableRules(order, options)
  const { rules, timeInfo, holidayType, weatherCondition } = ruleResult

  const distance = parseFloat(order.distance) || 0
  const duration = parseFloat(order.duration) || 0

  const billingItems = []
  let totalBasePrice = 0
  let totalSurgeAmount = 0
  let totalDistanceFee = 0
  let totalDurationFee = 0
  let basePrice = 0
  let perKmPrice = 0
  let perMinPrice = 0
  let minCharge = 0

  for (const rule of rules) {
    const basePriceRule = parseFloat(rule.basePrice) || 0
    const perKmPriceRule = parseFloat(rule.perKmPrice) || 0
    const perMinPriceRule = parseFloat(rule.perMinPrice) || 0
    const surgeRatio = parseFloat(rule.surgeRatio) || 1

    if (rule.ruleType === RULE_TYPE.BASE) {
      basePrice = basePriceRule
      perKmPrice = perKmPriceRule
      perMinPrice = perMinPriceRule
      minCharge = parseFloat(rule.minCharge) || 0

      const distanceFee = distance * perKmPriceRule
      const durationFee = duration * perMinPriceRule
      const itemTotal = basePriceRule + distanceFee + durationFee

      totalBasePrice += basePriceRule
      totalDistanceFee += distanceFee
      totalDurationFee += durationFee

      billingItems.push({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        ruleType: rule.ruleType,
        basePrice: basePriceRule,
        perKmPrice: perKmPriceRule,
        perMinPrice: perMinPriceRule,
        surgeRatio: surgeRatio,
        distanceFee: Math.round(distanceFee * 100) / 100,
        durationFee: Math.round(durationFee * 100) / 100,
        itemTotal: Math.round(itemTotal * 100) / 100,
        isMutuallyExclusive: rule.isMutuallyExclusive
      })
    } else {
      const baseAmount = totalBasePrice + totalDistanceFee + totalDurationFee
      const surgeAmount = baseAmount * (surgeRatio - 1)

      if (rule.maxSurgeAmount && surgeAmount > parseFloat(rule.maxSurgeAmount)) {
        totalSurgeAmount += parseFloat(rule.maxSurgeAmount)
      } else {
        totalSurgeAmount += surgeAmount
      }

      billingItems.push({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        ruleType: rule.ruleType,
        surgeRatio: surgeRatio,
        surgeAmount: Math.round(surgeAmount * 100) / 100,
        maxSurgeAmount: rule.maxSurgeAmount,
        isMutuallyExclusive: rule.isMutuallyExclusive
      })
    }
  }

  let estimatedTotal = totalBasePrice + totalDistanceFee + totalDurationFee + totalSurgeAmount

  if (minCharge > 0 && estimatedTotal < minCharge) {
    estimatedTotal = minCharge
  }
  if (MAX_PRICE > 0 && estimatedTotal > MAX_PRICE) {
    estimatedTotal = MAX_PRICE
  }

  estimatedTotal = Math.round(estimatedTotal * 100) / 100

  const validation = validateBillingData({
    totalBasePrice,
    totalDistanceFee,
    totalDurationFee,
    totalSurgeAmount,
    estimatedTotal,
    rules: ruleResult.rules,
    distance,
    duration
  })

  return {
    orderId,
    orderNo: order.orderNo,
    distance,
    duration,
    basePrice,
    perKmPrice,
    perMinPrice,
    minCharge,
    totalBasePrice: Math.round(totalBasePrice * 100) / 100,
    totalDistanceFee: Math.round(totalDistanceFee * 100) / 100,
    totalDurationFee: Math.round(totalDurationFee * 100) / 100,
    totalSurgeAmount: Math.round(totalSurgeAmount * 100) / 100,
    estimatedTotal,
    billingItems,
    timeInfo,
    holidayType,
    weatherCondition,
    appliedRules: ruleResult.rules.map(r => ({ id: r.id, name: r.ruleName })),
    hasExclusiveRule: ruleResult.hasExclusiveRule,
    validation,
    industryThreshold: INDUSTRY_PRICE_THRESHOLD,
    surgeLimit: SURGE_RATIO_LIMIT
  }
}

const validateBillingData = (billingData) => {
  const exceptions = []
  const warnings = []
  const passItems = []

  const {
    estimatedTotal,
    totalSurgeAmount,
    totalBasePrice,
    rules,
    distance,
    duration
  } = billingData

  if (estimatedTotal < MIN_PRICE) {
    exceptions.push({
      field: 'estimatedTotal',
      message: `总价低于最低价格${MIN_PRICE}元`,
      level: 'error'
    })
  }
  if (estimatedTotal > INDUSTRY_PRICE_THRESHOLD) {
    exceptions.push({
      field: 'estimatedTotal',
      message: `总价${estimatedTotal}元超过行业阈值${INDUSTRY_PRICE_THRESHOLD}元`,
      level: 'error'
    })
  } else if (estimatedTotal > INDUSTRY_PRICE_THRESHOLD * 0.8) {
    warnings.push({
      field: 'estimatedTotal',
      message: `总价接近阈值，当前${estimatedTotal}元，阈值${INDUSTRY_PRICE_THRESHOLD}元`,
      level: 'warning'
    })
  }

  let maxSurgeRatio = 1
  for (const rule of rules) {
    const ratio = parseFloat(rule.surgeRatio) || 1
    if (ratio > maxSurgeRatio) maxSurgeRatio = ratio
  }

  if (maxSurgeRatio > SURGE_RATIO_LIMIT) {
    exceptions.push({
      field: 'surgeRatio',
      message: `溢价倍数${maxSurgeRatio}超过限制${SURGE_RATIO_LIMIT}`,
      level: 'error'
    })
  }

  if (totalBasePrice <= 0 && distance > 0) {
    exceptions.push({
      field: 'totalBasePrice',
      message: '基础费用为0，但有行驶里程',
      level: 'error'
    })
  }

  if (distance > 0 && duration > 0) {
    const speed = distance / (duration / 60)
    if (speed > 120) {
      warnings.push({
        field: 'speed',
        message: `平均车速${speed.toFixed(0)}km/h，可能存在数据异常`,
        level: 'warning'
      })
    }
  }

  if (exceptions.length === 0) {
    passItems.push({ message: '价格在合规范围内', level: 'success' })
    passItems.push({ message: '溢价比例符合平台规则', level: 'success' })
    passItems.push({ message: '计费规则配置正确', level: 'success' })
  }

  const exclusiveRules = rules.filter(r => r.isMutuallyExclusive)
  const nonExclusiveRules = rules.filter(r => !r.isMutuallyExclusive && r.ruleType !== RULE_TYPE.BASE)
  if (exclusiveRules.length > 1) {
    exceptions.push({
      field: 'ruleStacking',
      message: `存在${exclusiveRules.length}个互斥规则同时生效`,
      level: 'error'
    })
  }
  if (exclusiveRules.length > 0 && nonExclusiveRules.length > 0) {
    warnings.push({
      field: 'ruleStacking',
      message: '互斥规则已生效，其他溢价规则未叠加',
      level: 'info'
    })
  }

  return {
    isValid: exceptions.length === 0,
    score: Math.max(0, 100 - exceptions.length * 20 - warnings.length * 5),
    exceptions,
    warnings,
    passItems
  }
}

const checkDuplicateBilling = async (orderId, billingItems) => {
  const recentLogs = await PricingChangeLog.findAll({
    where: {
      orderId,
      createTime: {
        [Op.gte]: new Date(Date.now() - 60 * 1000)
      }
    },
    order: [['createTime', 'DESC']],
    limit: 5
  })

  for (const log of recentLogs) {
    if (!log.billingDetail) continue
    const existingItems = log.billingDetail
    if (JSON.stringify(billingItems) === JSON.stringify(existingItems)) {
      return {
        isDuplicate: true,
        existingLog: log
      }
    }
  }

  return { isDuplicate: false }
}

const updateOrderBilling = async (orderId, updateData, operatorInfo = {}) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  if (updateData.surgeRatio !== undefined && updateData.surgeRatio > SURGE_RATIO_LIMIT) {
    throw new AppError(`溢价倍数不得超过${SURGE_RATIO_LIMIT}`, 400, 400)
  }

  const settleRecord = await FinanceSettlement.findOne({
    where: { orderNo: order.orderNo, status: 2 }
  })
  if (settleRecord) {
    throw new AppError('订单已结算，不允许修改计费规则', 400, 400)
  }

  const ticketCount = await Ticket.count({
    where: { orderId: order.id, status: { [Op.ne]: 4 } }
  })
  if (ticketCount > 0) {
    throw new AppError('订单存在未完成售后工单，不允许修改', 400, 400)
  }

  if (order.status === 5) {
    throw new AppError('订单已完成计费，不允许修改基础参数', 400, 400)
  }

  const oldBilling = await calculateBillingDetail(orderId)
  const oldValue = {
    basePrice: oldBilling.basePrice,
    perKmPrice: oldBilling.perKmPrice,
    perMinPrice: oldBilling.perMinPrice
  }

  const allowedFields = ['basePrice', 'perKmPrice', 'perMinPrice', 'nightSurcharge', 'surgeRatio']
  const filteredData = {}
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field]
    }
  }

  if (Object.keys(filteredData).length === 0) {
    return { order, oldBilling, newBilling: oldBilling }
  }

  const newBilling = await calculateBillingDetail(orderId)
  const newValue = {
    basePrice: newBilling.basePrice,
    perKmPrice: newBilling.perKmPrice,
    perMinPrice: newBilling.perMinPrice,
    estimatedTotal: newBilling.estimatedTotal
  }

  const priceDiff = newBilling.estimatedTotal - oldBilling.estimatedTotal

  const duplicateCheck = await checkDuplicateBilling(orderId, newBilling.billingItems)
  if (duplicateCheck.isDuplicate) {
    throw new AppError('1分钟内存在相同的计费变更，禁止重复操作', 409, 409)
  }

  if (newBilling.validation && !newBilling.validation.isValid) {
    const firstError = newBilling.validation.exceptions[0]
    throw new AppError(`计费校验失败：${firstError.message}`, 400, 400)
  }

  if (order.status !== 1 && order.status !== 2) {
    throw new AppError('仅待接单、已派单状态订单可修改计费规则', 400, 400)
  }

  const result = await PricingChangeLog.create({
    orderId,
    orderNo: order.orderNo,
    changeType: 'update',
    operatorId: operatorInfo.operatorId,
    operatorName: operatorInfo.operatorName,
    operatorIP: operatorInfo.operatorIP,
    oldValue,
    newValue,
    billingDetail: newBilling,
    priceDiff,
    appliedRules: newBilling.appliedRules.map(r => r.id).join(','),
    validationResult: JSON.stringify(newBilling.validation),
    hasException: newBilling.validation?.isValid ? 0 : 1,
    remark: '计费规则更新'
  })

  if (order.status === 5 && Math.abs(priceDiff) > 0.01) {
    if (order.driverId) {
      const { Driver } = require('../models')
      const driver = await Driver.findByPk(order.driverId)
      if (driver) {
        const newBalance = parseFloat(driver.balance || 0) + priceDiff
        await driver.update({ balance: Math.round(newBalance * 100) / 100 })

        await FinanceStatement.create({
          statementNo: 'FS' + Date.now() + Math.floor(Math.random() * 1000),
          orderNo: order.orderNo,
          type: priceDiff > 0 ? 1 : 2,
          amount: Math.abs(priceDiff),
          balance: Math.round(newBalance * 100) / 100,
          relatedId: order.id,
          relatedType: 'order',
          accountType: 1,
          accountId: order.driverId,
          remark: `订单${order.orderNo}计费规则调整${priceDiff > 0 ? '补收' : '退还'}${Math.abs(priceDiff).toFixed(2)}元`
        })
      }
    }
  }

  return {
    order,
    oldBilling,
    newBilling,
    priceDiff,
    changeLogId: result.id
  }
}

const getPricingChangeLogs = async (orderId, page = 1, pageSize = 20) => {
  const where = {}
  if (orderId) where.orderId = orderId

  const { count, rows } = await PricingChangeLog.findAndCountAll({
    where,
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  return { list: rows, total: count, page, pageSize }
}

const batchAdjustPricing = async (filter, adjustParams, operatorInfo = {}) => {
  const { cityCode, capacityType, timePeriod, startTime, endTime } = filter
  const { surgeRatio, perKmPriceAdjust } = adjustParams

  const where = {
    status: { [Op.in]: [1, 2, 3, 4] }
  }
  if (cityCode) where.cityCode = cityCode
  if (capacityType) where.capacityType = capacityType
  if (startTime && endTime) {
    where.createTime = { [Op.between]: [startTime, endTime] }
  }

  const eligibleOrders = await Order.findAll({ where })

  const excludedOrders = []
  const targetOrders = []

  for (const order of eligibleOrders) {
    const isSettled = await FinanceSettlement.count({
      where: { orderNo: order.orderNo, status: 2 }
    })
    const hasTicket = await Ticket.count({
      where: { orderId: order.id, status: { [Op.ne]: 4 } }
    })

    if (isSettled > 0) {
      excludedOrders.push({ id: order.id, orderNo: order.orderNo, reason: '订单已结算' })
      continue
    }
    if (hasTicket > 0) {
      excludedOrders.push({ id: order.id, orderNo: order.orderNo, reason: '存在售后工单' })
      continue
    }
    if (order.status === 5 || order.status === 6 || order.status === 7) {
      excludedOrders.push({ id: order.id, orderNo: order.orderNo, reason: '订单已终止' })
      continue
    }
    targetOrders.push(order)
  }

  const results = {
    total: targetOrders.length,
    excludedCount: excludedOrders.length,
    excludedOrders,
    success: 0,
    failed: 0,
    failedOrders: [],
    progress: 0
  }

  for (let i = 0; i < targetOrders.length; i++) {
    const order = targetOrders[i]
    try {
      const updateData = {}
      if (surgeRatio !== undefined) updateData.surgeRatio = surgeRatio
      if (perKmPriceAdjust !== undefined) {
        const capacityType = await CapacityType.findOne({ where: { id: order.capacityType } })
        if (capacityType) {
          updateData.perKmPrice = Math.round((parseFloat(capacityType.perKmPrice) * (1 + perKmPriceAdjust / 100)) * 100) / 100
        }
      }

      await updateOrderBilling(order.id, updateData, operatorInfo)
      results.success++
    } catch (error) {
      results.failed++
      results.failedOrders.push({
        id: order.id,
        orderNo: order.orderNo,
        reason: error.message
      })
    }
    results.progress = Math.round(((i + 1) / targetOrders.length) * 100)
  }

  return results
}

const getBillingTrace = async (orderId) => {
  const order = await Order.findByPk(orderId)
  if (!order) {
    throw new AppError('订单不存在', 404, 404)
  }

  const currentBilling = await calculateBillingDetail(orderId)

  const changeLogs = await PricingChangeLog.findAll({
    where: { orderId },
    order: [['createTime', 'ASC']]
  })

  const trace = {
    order: order.toJSON(),
    currentBilling,
    changeHistory: changeLogs.map(log => ({
      id: log.id,
      changeType: log.changeType,
      operatorName: log.operatorName,
      operatorIP: log.operatorIP,
      createTime: log.createTime,
      oldValue: log.oldValue,
      newValue: log.newValue,
      priceDiff: log.priceDiff,
      hasException: log.hasException,
      exceptionType: log.exceptionType,
      exceptionDetail: log.exceptionDetail,
      remark: log.remark
    })),
    appliedRules: currentBilling.appliedRules,
    validation: currentBilling.validation,
    riskChecks: []
  }

  if (changeLogs.length >= 2) {
    trace.riskChecks.push({
      type: 'multiple_changes',
      level: changeLogs.length > 3 ? 'warning' : 'info',
      message: `该订单已进行${changeLogs.length}次计费变更`
    })
  }

  const lastLog = changeLogs[changeLogs.length - 1]
  if (lastLog && lastLog.createTime) {
    const timeSinceLastChange = Date.now() - new Date(lastLog.createTime).getTime()
    if (timeSinceLastChange < 5 * 60 * 1000) {
      trace.riskChecks.push({
        type: 'frequent_change',
        level: 'warning',
        message: '5分钟内存在计费变更操作'
      })
    }
  }

  if (currentBilling.validation && !currentBilling.validation.isValid) {
    currentBilling.validation.exceptions.forEach(ex => {
      trace.riskChecks.push({
        type: 'validation',
        level: ex.level,
        message: ex.message
      })
    })
  }

  return trace
}

const getPricingRules = async (params = {}) => {
  const { page = 1, pageSize = 20, ruleType, status, capacityType, cityCode } = params
  const where = {}
  if (ruleType !== undefined && ruleType !== '') where.ruleType = ruleType
  if (status !== undefined && status !== '') where.status = status
  if (capacityType !== undefined && capacityType !== '') where.capacityType = capacityType
  if (cityCode) where.cityCode = cityCode

  const { count, rows } = await PricingRule.findAndCountAll({
    where,
    order: [['priority', 'DESC'], ['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize)
  })

  return { list: rows, total: count, page, pageSize }
}

const createPricingRule = async (data, operatorInfo = {}) => {
  const existingRules = await PricingRule.findAll({
    where: {
      ruleType: data.ruleType,
      status: 1,
      isMutuallyExclusive: 1
    }
  })

  if (data.isMutuallyExclusive === 1 && existingRules.length > 0) {
    throw new AppError('该规则类型已存在互斥规则，不可重复创建', 400, 400)
  }

  if (data.surgeRatio && parseFloat(data.surgeRatio) > SURGE_RATIO_LIMIT) {
    throw new AppError(`溢价倍数不得超过${SURGE_RATIO_LIMIT}`, 400, 400)
  }

  const rule = await PricingRule.create(data)

  await PricingChangeLog.create({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    changeType: 'create',
    operatorId: operatorInfo.operatorId,
    operatorName: operatorInfo.operatorName,
    operatorIP: operatorInfo.operatorIP,
    newValue: rule.toJSON(),
    remark: '创建计费规则'
  })

  return rule
}

const updatePricingRule = async (id, data, operatorInfo = {}) => {
  const rule = await PricingRule.findByPk(id)
  if (!rule) {
    throw new AppError('计费规则不存在', 404, 404)
  }

  const oldValue = rule.toJSON()

  if (data.surgeRatio && parseFloat(data.surgeRatio) > SURGE_RATIO_LIMIT) {
    throw new AppError(`溢价倍数不得超过${SURGE_RATIO_LIMIT}`, 400, 400)
  }

  await rule.update(data)

  await PricingChangeLog.create({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    changeType: 'update',
    operatorId: operatorInfo.operatorId,
    operatorName: operatorInfo.operatorName,
    operatorIP: operatorInfo.operatorIP,
    oldValue,
    newValue: rule.toJSON(),
    remark: '更新计费规则'
  })

  return rule
}

const deletePricingRule = async (id, operatorInfo = {}) => {
  const rule = await PricingRule.findByPk(id)
  if (!rule) {
    throw new AppError('计费规则不存在', 404, 404)
  }

  await rule.destroy()

  await PricingChangeLog.create({
    ruleId: rule.id,
    ruleName: rule.ruleName,
    changeType: 'delete',
    operatorId: operatorInfo.operatorId,
    operatorName: operatorInfo.operatorName,
    operatorIP: operatorInfo.operatorIP,
    oldValue: rule.toJSON(),
    remark: '删除计费规则'
  })

  return true
}

module.exports = {
  RULE_TYPE,
  INDUSTRY_PRICE_THRESHOLD,
  SURGE_RATIO_LIMIT,
  getTimePeriod,
  getHolidayType,
  getApplicableRules,
  calculateBillingDetail,
  validateBillingData,
  checkDuplicateBilling,
  updateOrderBilling,
  getPricingChangeLogs,
  batchAdjustPricing,
  getBillingTrace,
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
}
