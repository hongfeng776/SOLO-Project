const {
  Driver,
  Order,
  SettlementRule,
  SettlementRecord,
  SettlementItem,
  SettlementAuditLog,
  FinanceSettlement
} = require('../models')
const { Op, fn, col, where, literal } = require('sequelize')
const crypto = require('crypto')

const RULE_TYPE = {
  BASE_COMMISSION: 1,
  HOUR_SURCHARGE: 2,
  RATING_SUBSIDY: 3,
  HOLIDAY_SUBSIDY: 4,
  PREMIUM_COMMISSION: 5,
  NEW_DRIVER: 6,
  EXCELLENT_EXCLUSIVE: 7
}

const RULE_TYPE_NAMES = {
  [RULE_TYPE.BASE_COMMISSION]: '基础分成比例',
  [RULE_TYPE.HOUR_SURCHARGE]: '时段加价',
  [RULE_TYPE.RATING_SUBSIDY]: '星级补贴',
  [RULE_TYPE.HOLIDAY_SUBSIDY]: '节假日补贴',
  [RULE_TYPE.PREMIUM_COMMISSION]: '溢价分成',
  [RULE_TYPE.NEW_DRIVER]: '新人补贴',
  [RULE_TYPE.EXCELLENT_EXCLUSIVE]: '优质司机专属'
}

const APPLY_SCOPE = {
  ALL: 1,
  BY_LEVEL: 2,
  BY_CITY: 3,
  BY_VEHICLE: 4
}

const SETTLEMENT_STATUS = {
  PENDING: 1,
  PROCESSING: 2,
  SETTLED: 3,
  POSTED: 4,
  ABNORMAL: 5,
  REJECTED: 6
}

const SETTLEMENT_STATUS_NAMES = {
  [SETTLEMENT_STATUS.PENDING]: '待结算',
  [SETTLEMENT_STATUS.PROCESSING]: '结算中',
  [SETTLEMENT_STATUS.SETTLED]: '已结算',
  [SETTLEMENT_STATUS.POSTED]: '已入账',
  [SETTLEMENT_STATUS.ABNORMAL]: '结算异常',
  [SETTLEMENT_STATUS.REJECTED]: '已驳回'
}

const SETTLEMENT_TYPE = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  MANUAL: 4
}

const OPERATION_TYPE = {
  CREATE: 1,
  RULE_CHANGE: 2,
  INITIATE: 3,
  AUDIT_PASS: 4,
  AUDIT_REJECT: 5,
  POST: 6,
  ABNORMAL_INTERCEPT: 7,
  UPDATE_RULE: 8,
  DATA_CORRECTION: 9
}

const OPERATION_TYPE_NAMES = {
  [OPERATION_TYPE.CREATE]: '创建结算',
  [OPERATION_TYPE.RULE_CHANGE]: '修改规则',
  [OPERATION_TYPE.INITIATE]: '发起结算',
  [OPERATION_TYPE.AUDIT_PASS]: '审核通过',
  [OPERATION_TYPE.AUDIT_REJECT]: '审核驳回',
  [OPERATION_TYPE.POST]: '入账',
  [OPERATION_TYPE.ABNORMAL_INTERCEPT]: '异常拦截',
  [OPERATION_TYPE.UPDATE_RULE]: '规则变更',
  [OPERATION_TYPE.DATA_CORRECTION]: '数据修正'
}

const DRIVER_SERVICE_LEVEL = {
  EXCELLENT: 1,
  NORMAL: 2,
  NEED_RECTIFICATION: 3,
  POOR: 4
}

const COMPLIANCE_CONFIG = {
  minCommissionRate: 70,
  maxCommissionRate: 90,
  maxSingleIncomeMultiplier: 3,
  maxDailySubsidyMultiplier: 2
}

const getOrderTypeFromOrder = (order) => {
  return order.orderType || 1
}

const isTimeInRange = (timeStr, startStr, endStr) => {
  if (!startStr || !endStr) return true
  const [h1, m1] = startStr.split(':').map(Number)
  const [h2, m2] = endStr.split(':').map(Number)
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const timeMin = h * 60 + m
  const startMin = h1 * 60 + m1
  const endMin = h2 * 60 + m2
  if (startMin <= endMin) {
    return timeMin >= startMin && timeMin <= endMin
  } else {
    return timeMin >= startMin || timeMin <= endMin
  }
}

const isHoliday = (date) => {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const holidays = [
    '1-1', '1-28', '1-29', '1-30', '1-31', '2-1', '2-2', '2-3',
    '4-4', '5-1', '6-10', '6-11', '6-12', '10-1', '10-2', '10-3',
    '10-4', '10-5', '10-6', '10-7'
  ]
  return holidays.includes(`${month}-${day}`)
}

const isWeekend = (date) => {
  const d = new Date(date)
  return d.getDay() === 0 || d.getDay() === 6
}

const isPeakHour = (date) => {
  const d = new Date(date)
  const hour = d.getHours()
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
}

const preCheckRuleChange = async (rule, driver) => {
  const result = {
    passed: true,
    violations: [],
    warnings: [],
    commissionRate: rule.commissionRate || 80,
    estimatedIncome: 0
  }

  if (rule.commissionRate !== undefined) {
    if (rule.commissionRate < COMPLIANCE_CONFIG.minCommissionRate) {
      result.passed = false
      result.violations.push({
        field: 'commissionRate',
        message: `分成比例${rule.commissionRate}%低于合规下限${COMPLIANCE_CONFIG.minCommissionRate}%`,
        severity: 'high'
      })
    }
    if (rule.commissionRate > COMPLIANCE_CONFIG.maxCommissionRate) {
      result.passed = false
      result.violations.push({
        field: 'commissionRate',
        message: `分成比例${rule.commissionRate}%超出合规上限${COMPLIANCE_CONFIG.maxCommissionRate}%`,
        severity: 'high'
      })
    }
  }

  if (rule.ruleType === RULE_TYPE.EXCELLENT_EXCLUSIVE) {
    if (driver && driver.driverLevel !== DRIVER_SERVICE_LEVEL.EXCELLENT) {
      result.warnings.push({
        field: 'driverLevel',
        message: '该规则为优质司机专属，普通司机不适用'
      })
    }
  }

  if (rule.ruleType !== RULE_TYPE.BASE_COMMISSION && rule.ruleType !== RULE_TYPE.EXCELLENT_EXCLUSIVE) {
    if (rule.subsidyPercent) {
      if (rule.subsidyPercent > 50) {
        result.warnings.push({
          field: 'subsidyPercent',
          message: `补贴比例${rule.subsidyPercent}%过高，请注意核查`
        })
      }
    }
  }

  if (rule.applyScope === APPLY_SCOPE.BY_LEVEL) {
    if (!rule.applyDriverLevels || rule.applyDriverLevels.length === 0) {
      result.violations.push({
        field: 'applyDriverLevels',
        message: '按等级适用时必须指定适用等级',
        severity: 'medium'
      })
    }
  }

  if (rule.applyScope === APPLY_SCOPE.BY_CITY) {
    if (!rule.applyCities || rule.applyCities.length === 0) {
      result.violations.push({
        field: 'applyCities',
        message: '按城市适用时必须指定适用城市',
        severity: 'medium'
      })
    }
  }

  return result
}

const checkExclusiveRules = async (driverId, newRuleType) => {
  const result = {
    isExclusive: false,
    conflicts: [],
    conflictRules: []
  }

  const driver = await Driver.findByPk(driverId)
  if (!driver) return result

  if (newRuleType === RULE_TYPE.EXCELLENT_EXCLUSIVE) {
    const normalSubsidyRules = await SettlementRule.findAll({
      where: {
        status: 1,
        ruleType: {
          [Op.in]: [RULE_TYPE.HOUR_SURCHARGE, RULE_TYPE.RATING_SUBSIDY, RULE_TYPE.HOLIDAY_SUBSIDY, RULE_TYPE.NEW_DRIVER]
        },
        isExclusive: 1
      }
    })
    if (normalSubsidyRules.length > 0) {
      result.isExclusive = true
      result.conflicts = normalSubsidyRules.map(r => `${RULE_TYPE_NAMES[r.ruleType]}:${r.ruleName}`)
      result.conflictRules = normalSubsidyRules.map(r => r.id)
    }
  }

  if ([RULE_TYPE.HOUR_SURCHARGE, RULE_TYPE.RATING_SUBSIDY, RULE_TYPE.HOLIDAY_SUBSIDY, RULE_TYPE.NEW_DRIVER].includes(newRuleType)) {
    const excellentRule = await SettlementRule.findOne({
      where: {
        status: 1,
        ruleType: RULE_TYPE.EXCELLENT_EXCLUSIVE,
        isExclusive: 1
      }
    })
    if (excellentRule && driver.driverLevel === DRIVER_SERVICE_LEVEL.EXCELLENT) {
      result.isExclusive = true
      result.conflicts = [`优质司机专属补贴:${excellentRule.ruleName}`]
      result.conflictRules = [excellentRule.id]
    }
  }

  return result
}

const calculateEstimatedIncome = async (driverId, ruleChanges = {}) => {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

  const orders = await Order.findAll({
    where: {
      driverId,
      createTime: { [Op.between]: [startOfDay, endOfDay] }
    }
  })

  let baseIncome = 0
  let totalOrderAmount = 0

  orders.forEach(order => {
    totalOrderAmount += parseFloat(order.orderAmount || 0)
    baseIncome += parseFloat(order.orderAmount || 0) * (ruleChanges.commissionRate || 80) / 100
  })

  return {
    totalOrders: orders.length,
    totalOrderAmount,
    baseIncome: Math.round(baseIncome * 100) / 100,
    estimatedTotal: Math.round(baseIncome * 100) / 100
  }
}

const matchRulesForOrder = async (driver, order) => {
  const orderDate = order.createTime || new Date()
  const timeStr = new Date(orderDate).toTimeString().slice(0, 5)

  const allRules = await SettlementRule.findAll({
    where: { status: 1 },
    order: [['priority', 'DESC']]
  })

  const matchedRules = []
  const appliedRuleIds = []

  for (const rule of allRules) {
    let match = true

    if (rule.applyScope === APPLY_SCOPE.BY_LEVEL) {
      if (rule.applyDriverLevels && !rule.applyDriverLevels.includes(driver.driverLevel)) {
        match = false
      }
    }
    if (match && rule.applyScope === APPLY_SCOPE.BY_CITY) {
      if (rule.applyCities && !rule.applyCities.includes(driver.city)) {
        match = false
      }
    }
    if (match && rule.applyScope === APPLY_SCOPE.BY_VEHICLE) {
      if (rule.applyVehicleTypes && !rule.applyVehicleTypes.includes(driver.vehicleType)) {
        match = false
      }
    }
    if (match && rule.applyOrderTypes && rule.applyOrderTypes.length > 0) {
      const orderType = getOrderTypeFromOrder(order)
      if (!rule.applyOrderTypes.includes(orderType)) {
        match = false
      }
    }

    if (match && rule.timeStart && rule.timeEnd) {
      if (!isTimeInRange(timeStr, rule.timeStart, rule.timeEnd)) {
        match = false
      }
    }

    if (match && rule.isHoliday === 1) {
      if (!isHoliday(orderDate)) match = false
    }

    if (match && rule.isWeekend === 1) {
      if (!isWeekend(orderDate)) match = false
    }

    if (match && rule.minServiceRating > 0) {
      if ((driver.serviceScore || 5) < rule.minServiceRating) {
        match = false
      }
    }

    if (match) {
      if (rule.isExclusive === 1) {
        const hasConflict = appliedRuleIds.some(rid =>
          rule.exclusiveRuleIds && rule.exclusiveRuleIds.includes(rid)
        )
        if (hasConflict) continue
      }

      matchedRules.push(rule)
      appliedRuleIds.push(rule.id)
    }
  }

  return matchedRules
}

const calculateOrderIncome = async (driver, order, matchedRules) => {
  const orderAmount = parseFloat(order.orderAmount || 0)
  const premiumAmount = parseFloat(order.premiumAmount || 0)
  const result = {
    baseIncome: 0,
    hourSubsidy: 0,
    ratingSubsidy: 0,
    holidaySubsidy: 0,
    premiumIncome: 0,
    excellentSubsidy: 0,
    newDriverSubsidy: 0,
    penaltyAmount: 0,
    totalIncome: 0,
    platformCommission: 0,
    commissionRate: 80,
    appliedRules: [],
    calculationDetail: []
  }

  const baseRule = matchedRules.find(r => r.ruleType === RULE_TYPE.BASE_COMMISSION)
  result.commissionRate = baseRule ? parseFloat(baseRule.commissionRate) : 80
  result.baseIncome = Math.round(orderAmount * result.commissionRate / 100 * 100) / 100
  result.platformCommission = Math.round((orderAmount - result.baseIncome) * 100) / 100

  if (baseRule) {
    result.appliedRules.push(baseRule.id)
    result.calculationDetail.push({
      type: 'base',
      name: RULE_TYPE_NAMES[baseRule.ruleType],
      formula: `订单金额${orderAmount} × 分成${result.commissionRate}%`,
      amount: result.baseIncome
    })
  }

  for (const rule of matchedRules) {
    const subsidy = {
      amount: 0,
      formula: ''
    }

    switch (rule.ruleType) {
      case RULE_TYPE.HOUR_SURCHARGE:
        subsidy.amount = rule.subsidyPercent
          ? Math.round(orderAmount * parseFloat(rule.subsidyPercent) / 100 * 100) / 100
          : parseFloat(rule.subsidyAmount) || 0
        subsidy.formula = rule.subsidyPercent
          ? `订单金额${orderAmount} × 时段补贴${rule.subsidyPercent}%`
          : `时段补贴固定${rule.subsidyAmount}元`
        result.hourSubsidy += subsidy.amount
        break

      case RULE_TYPE.RATING_SUBSIDY:
        const rating = driver.serviceScore || 5
        const eligible = rating >= (rule.minServiceRating || 4.5)
        if (eligible) {
          subsidy.amount = rule.subsidyPercent
            ? Math.round(orderAmount * parseFloat(rule.subsidyPercent) / 100 * 100) / 100
            : parseFloat(rule.subsidyAmount) || 0
          subsidy.formula = rule.subsidyPercent
            ? `订单金额${orderAmount} × 星级补贴${rule.subsidyPercent}%(星级${rating})`
            : `星级补贴固定${rule.subsidyAmount}元(星级${rating})`
          result.ratingSubsidy += subsidy.amount
        }
        break

      case RULE_TYPE.HOLIDAY_SUBSIDY:
        subsidy.amount = rule.subsidyPercent
          ? Math.round(orderAmount * parseFloat(rule.subsidyPercent) / 100 * 100) / 100
          : parseFloat(rule.subsidyAmount) || 0
        subsidy.formula = rule.subsidyPercent
          ? `订单金额${orderAmount} × 节假日补贴${rule.subsidyPercent}%`
          : `节假日补贴固定${rule.subsidyAmount}元`
        result.holidaySubsidy += subsidy.amount
        break

      case RULE_TYPE.PREMIUM_COMMISSION:
        if (premiumAmount > 0) {
          const premiumRate = parseFloat(rule.commissionRate) || 85
          subsidy.amount = Math.round(premiumAmount * premiumRate / 100 * 100) / 100
          subsidy.formula = `溢价金额${premiumAmount} × 溢价分成${premiumRate}%`
          result.premiumIncome += subsidy.amount
        }
        break

      case RULE_TYPE.EXCELLENT_EXCLUSIVE:
        subsidy.amount = rule.subsidyPercent
          ? Math.round(orderAmount * parseFloat(rule.subsidyPercent) / 100 * 100) / 100
          : parseFloat(rule.subsidyAmount) || 0
        subsidy.formula = rule.subsidyPercent
          ? `订单金额${orderAmount} × 优质专属补贴${rule.subsidyPercent}%`
          : `优质专属补贴固定${rule.subsidyAmount}元`
        result.excellentSubsidy += subsidy.amount
        break

      case RULE_TYPE.NEW_DRIVER:
        subsidy.amount = rule.subsidyPercent
          ? Math.round(orderAmount * parseFloat(rule.subsidyPercent) / 100 * 100) / 100
          : parseFloat(rule.subsidyAmount) || 0
        subsidy.formula = rule.subsidyPercent
          ? `订单金额${orderAmount} × 新人补贴${rule.subsidyPercent}%`
          : `新人补贴固定${rule.subsidyAmount}元`
        result.newDriverSubsidy += subsidy.amount
        break
    }

    if (subsidy.amount > 0) {
      result.appliedRules.push(rule.id)
      result.calculationDetail.push({
        type: 'subsidy',
        name: RULE_TYPE_NAMES[rule.ruleType],
        formula: subsidy.formula,
        amount: subsidy.amount
      })
    }
  }

  result.totalIncome = Math.round(
    (result.baseIncome + result.hourSubsidy + result.ratingSubsidy +
      result.holidaySubsidy + result.premiumIncome + result.excellentSubsidy +
      result.newDriverSubsidy - result.penaltyAmount) * 100
  ) / 100

  return result
}

const checkAbnormalSettlement = async (settlementItem, settlementRecord, driver) => {
  const result = {
    isAbnormal: false,
    abnormalType: [],
    abnormalReasons: [],
    matchCheckResult: {
      orderMatch: true,
      ruleMatch: true,
      amountMatch: true,
      subsidyMatch: true,
      details: []
    }
  }

  const order = await Order.findByPk(settlementItem.orderId)
  if (!order) {
    result.isAbnormal = true
    result.abnormalType.push('mismatch')
    result.abnormalReasons.push('关联订单不存在')
    result.matchCheckResult.orderMatch = false
    result.matchCheckResult.details.push('订单数据缺失')
  } else {
    const orderAmount = parseFloat(order.orderAmount || 0)
    if (Math.abs(orderAmount - parseFloat(settlementItem.orderAmount)) > 0.01) {
      result.isAbnormal = true
      result.abnormalType.push('mismatch')
      result.abnormalReasons.push(`订单金额不匹配：订单${orderAmount} vs 结算${settlementItem.orderAmount}`)
      result.matchCheckResult.amountMatch = false
      result.matchCheckResult.details.push('订单金额与结算金额不一致')
    }
  }

  if (settlementItem.totalIncome > 0 && order) {
    const expectedMax = parseFloat(order.orderAmount) * COMPLIANCE_CONFIG.maxSingleIncomeMultiplier
    if (settlementItem.totalIncome > expectedMax) {
      result.isAbnormal = true
      result.abnormalType.push('over_settlement')
      result.abnormalReasons.push(`单笔收益${settlementItem.totalIncome}超出订单金额${expectedMax}的${COMPLIANCE_CONFIG.maxSingleIncomeMultiplier}倍`)
      result.matchCheckResult.details.push('单笔收益异常过高')
    }
  }

  const existingItem = await SettlementItem.findOne({
    where: {
      orderId: settlementItem.orderId,
      id: { [Op.ne]: settlementItem.id }
    }
  })
  if (existingItem) {
    result.isAbnormal = true
    result.abnormalType.push('repeat_settlement')
    result.abnormalReasons.push(`订单${settlementItem.orderNo}存在重复结算记录ID:${existingItem.id}`)
    result.matchCheckResult.details.push('该订单已被结算过')
  }

  const totalSubsidy = parseFloat(settlementItem.hourSubsidy) +
    parseFloat(settlementItem.ratingSubsidy) +
    parseFloat(settlementItem.holidaySubsidy) +
    parseFloat(settlementItem.premiumIncome)

  if (totalSubsidy > 0 && order) {
    const maxSubsidy = parseFloat(order.orderAmount) * COMPLIANCE_CONFIG.maxDailySubsidyMultiplier
    if (totalSubsidy > maxSubsidy) {
      result.isAbnormal = true
      result.abnormalType.push('illegal_subsidy')
      result.abnormalReasons.push(`补贴合计${totalSubsidy}超过订单金额${order.orderAmount}的${COMPLIANCE_CONFIG.maxDailySubsidyMultiplier}倍`)
      result.matchCheckResult.subsidyMatch = false
      result.matchCheckResult.details.push('补贴金额异常过高')
    }
  }

  return result
}

const generateVoucherNo = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const hash = crypto.createHash('md5').update(`${dateStr}${Date.now()}${random}`).digest('hex').slice(0, 10).toUpperCase()
  return `VCH${dateStr}${random}${hash}`
}

const generateSettlementNo = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `STL${dateStr}${random}`
}

const createSettlementRecord = async (driverId, period, options = {}) => {
  const driver = await Driver.findByPk(driverId)
  if (!driver) throw new Error('司机不存在')

  const where = {
    driverId,
    createTime: { [Op.between]: [period.start, period.end] }
  }
  if (options.orderIds && options.orderIds.length > 0) {
    where.id = { [Op.in]: options.orderIds }
  }

  const orders = await Order.findAll({ where })

  if (orders.length === 0) {
    throw new Error('该时段内无订单数据')
  }

  const items = []
  const summary = {
    totalOrders: 0,
    totalOrderAmount: 0,
    baseIncome: 0,
    hourSubsidy: 0,
    ratingSubsidy: 0,
    holidaySubsidy: 0,
    premiumIncome: 0,
    excellentSubsidy: 0,
    newDriverSubsidy: 0,
    penaltyAmount: 0,
    platformCommission: 0
  }

  let hasAbnormal = false
  const abnormalTypes = []
  const abnormalReasons = []

  for (const order of orders) {
    const matchedRules = await matchRulesForOrder(driver, order)
    const income = await calculateOrderIncome(driver, order, matchedRules)

    const orderDate = order.createTime || new Date()
    const item = {
      orderId: order.id,
      orderNo: order.orderNo,
      driverId,
      orderType: getOrderTypeFromOrder(order),
      orderSource: order.orderSource || 'platform',
      orderStartTime: order.startTime || order.createTime,
      isPeakHour: isPeakHour(orderDate) ? 1 : 0,
      isHoliday: isHoliday(orderDate) ? 1 : 0,
      isWeekend: isWeekend(orderDate) ? 1 : 0,
      isPremium: parseFloat(order.premiumAmount || 0) > 0 ? 1 : 0,
      serviceRating: driver.serviceScore || 5,
      orderAmount: parseFloat(order.orderAmount || 0),
      premiumAmount: parseFloat(order.premiumAmount || 0),
      commissionRate: income.commissionRate,
      baseIncome: income.baseIncome,
      hourSubsidy: income.hourSubsidy,
      ratingSubsidy: income.ratingSubsidy,
      holidaySubsidy: income.holidaySubsidy,
      premiumIncome: income.premiumIncome,
      penaltyAmount: income.penaltyAmount,
      totalIncome: income.totalIncome,
      platformCommission: income.platformCommission,
      appliedRules: income.appliedRules,
      calculationDetail: income.calculationDetail
    }

    const tempItem = { id: 0, ...item }
    const abnormalCheck = await checkAbnormalSettlement(tempItem, null, driver)
    item.isAbnormal = abnormalCheck.isAbnormal ? 1 : 0
    item.abnormalType = abnormalCheck.abnormalType.join(',') || null
    item.abnormalReason = abnormalCheck.abnormalReasons.join('；') || null
    item.matchCheckResult = abnormalCheck.matchCheckResult

    if (abnormalCheck.isAbnormal) {
      hasAbnormal = true
      abnormalTypes.push(...abnormalCheck.abnormalType)
      abnormalReasons.push(...abnormalCheck.abnormalReasons)
    }

    items.push(item)

    summary.totalOrders++
    summary.totalOrderAmount += item.orderAmount
    summary.baseIncome += item.baseIncome
    summary.hourSubsidy += item.hourSubsidy
    summary.ratingSubsidy += item.ratingSubsidy
    summary.holidaySubsidy += item.holidaySubsidy
    summary.premiumIncome += item.premiumIncome
    summary.excellentSubsidy += income.excellentSubsidy
    summary.newDriverSubsidy += income.newDriverSubsidy
    summary.penaltyAmount += item.penaltyAmount
    summary.platformCommission += item.platformCommission
  }

  const totalSubsidy = summary.hourSubsidy + summary.ratingSubsidy +
    summary.holidaySubsidy + summary.premiumIncome +
    summary.excellentSubsidy + summary.newDriverSubsidy

  const totalIncome = summary.baseIncome + totalSubsidy - summary.penaltyAmount

  const record = {
    settlementNo: generateSettlementNo(),
    driverId,
    settlementType: options.settlementType || SETTLEMENT_TYPE.DAILY,
    settleStatus: hasAbnormal ? SETTLEMENT_STATUS.ABNORMAL : SETTLEMENT_STATUS.PENDING,
    periodStart: period.start,
    periodEnd: period.end,
    totalOrders: summary.totalOrders,
    totalOrderAmount: Math.round(summary.totalOrderAmount * 100) / 100,
    baseIncome: Math.round(summary.baseIncome * 100) / 100,
    totalSubsidy: Math.round(totalSubsidy * 100) / 100,
    hourSubsidy: Math.round(summary.hourSubsidy * 100) / 100,
    ratingSubsidy: Math.round(summary.ratingSubsidy * 100) / 100,
    holidaySubsidy: Math.round(summary.holidaySubsidy * 100) / 100,
    premiumSubsidy: Math.round(summary.premiumIncome * 100) / 100,
    excellentSubsidy: Math.round(summary.excellentSubsidy * 100) / 100,
    newDriverSubsidy: Math.round(summary.newDriverSubsidy * 100) / 100,
    penaltyAmount: Math.round(summary.penaltyAmount * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    platformCommission: Math.round(summary.platformCommission * 100) / 100,
    actualSettleAmount: Math.round(totalIncome * 100) / 100,
    isAbnormal: hasAbnormal ? 1 : 0,
    abnormalType: [...new Set(abnormalTypes)].join(',') || null,
    abnormalReason: [...new Set(abnormalReasons)].join('；') || null,
    auditStatus: hasAbnormal ? 2 : 0
  }

  const createdRecord = await SettlementRecord.create(record)

  for (const item of items) {
    item.settlementRecordId = createdRecord.id
  }
  await SettlementItem.bulkCreate(items)

  await SettlementAuditLog.create({
    settlementRecordId: createdRecord.id,
    operationType: OPERATION_TYPE.CREATE,
    operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.CREATE],
    newSettleStatus: createdRecord.settleStatus,
    newAuditStatus: createdRecord.auditStatus,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole,
    remark: `创建结算单，共${summary.totalOrders}条订单`
  })

  if (hasAbnormal) {
    await SettlementAuditLog.create({
      settlementRecordId: createdRecord.id,
      operationType: OPERATION_TYPE.ABNORMAL_INTERCEPT,
      operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.ABNORMAL_INTERCEPT],
      abnormalInterceptDetail: {
        types: [...new Set(abnormalTypes)],
        reasons: [...new Set(abnormalReasons)]
      },
      operatorId: options.operatorId,
      operatorName: options.operatorName,
      operatorRole: options.operatorRole
    })
  }

  return createdRecord
}

const initiateSettlement = async (recordId, options = {}) => {
  const record = await SettlementRecord.findByPk(recordId)
  if (!record) throw new Error('结算记录不存在')

  if (record.isPosted === 1) {
    throw new Error('已入账结算不可修改')
  }

  if (record.isAbnormal === 1) {
    throw new Error('异常结算数据请先处理异常后再发起结算')
  }

  if (![SETTLEMENT_STATUS.PENDING, SETTLEMENT_STATUS.REJECTED].includes(record.settleStatus)) {
    throw new Error(`当前状态${SETTLEMENT_STATUS_NAMES[record.settleStatus]}不可发起结算`)
  }

  const oldStatus = record.settleStatus

  await record.update({
    settleStatus: SETTLEMENT_STATUS.PROCESSING,
    settleTime: new Date()
  })

  await SettlementAuditLog.create({
    settlementRecordId: recordId,
    operationType: OPERATION_TYPE.INITIATE,
    operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.INITIATE],
    oldSettleStatus: oldStatus,
    newSettleStatus: SETTLEMENT_STATUS.PROCESSING,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole
  })

  return record
}

const auditSettlement = async (recordId, passed, options = {}) => {
  const record = await SettlementRecord.findByPk(recordId)
  if (!record) throw new Error('结算记录不存在')

  if (record.isPosted === 1) {
    throw new Error('已入账结算不可修改')
  }

  if (record.settleStatus !== SETTLEMENT_STATUS.PROCESSING) {
    throw new Error('只有结算中状态可审核')
  }

  const oldStatus = record.settleStatus
  const oldAuditStatus = record.auditStatus

  if (passed) {
    const voucherNo = generateVoucherNo()
    await record.update({
      settleStatus: SETTLEMENT_STATUS.SETTLED,
      auditStatus: 1,
      auditTime: new Date(),
      auditorId: options.operatorId,
      auditorName: options.operatorName,
      voucherNo
    })

    const driver = await Driver.findByPk(record.driverId)
    if (driver) {
      const currentBalance = parseFloat(driver.balance || 0)
      const pendingSettlement = parseFloat(driver.pendingSettlement || 0)
      await driver.update({
        balance: Math.round((currentBalance + record.actualSettleAmount) * 100) / 100,
        pendingSettlement: Math.round(Math.max(0, pendingSettlement - record.actualSettleAmount) * 100) / 100
      })

      await FinanceSettlement.create({
        driverId: record.driverId,
        settlementRecordId: record.id,
        settlementNo: record.settlementNo,
        voucherNo,
        amount: record.actualSettleAmount,
        settleType: record.settlementType,
        status: 3,
        settleTime: new Date()
      })
    }
  } else {
    await record.update({
      settleStatus: SETTLEMENT_STATUS.REJECTED,
      auditStatus: 2,
      rejectReason: options.rejectReason,
      auditTime: new Date(),
      auditorId: options.operatorId,
      auditorName: options.operatorName
    })
  }

  await SettlementAuditLog.create({
    settlementRecordId: recordId,
    operationType: passed ? OPERATION_TYPE.AUDIT_PASS : OPERATION_TYPE.AUDIT_REJECT,
    operationTypeName: passed ? OPERATION_TYPE_NAMES[OPERATION_TYPE.AUDIT_PASS] : OPERATION_TYPE_NAMES[OPERATION_TYPE.AUDIT_REJECT],
    oldSettleStatus: oldStatus,
    newSettleStatus: passed ? SETTLEMENT_STATUS.SETTLED : SETTLEMENT_STATUS.REJECTED,
    oldAuditStatus,
    newAuditStatus: passed ? 1 : 2,
    rejectReason: options.rejectReason,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole
  })

  return record
}

const postSettlement = async (recordId, options = {}) => {
  const record = await SettlementRecord.findByPk(recordId)
  if (!record) throw new Error('结算记录不存在')

  if (record.settleStatus !== SETTLEMENT_STATUS.SETTLED) {
    throw new Error('只有已结算状态可入账')
  }

  if (record.isPosted === 1) {
    throw new Error('该结算已入账')
  }

  const oldStatus = record.settleStatus

  await record.update({
    isPosted: 1,
    settleStatus: SETTLEMENT_STATUS.POSTED,
    postedTime: new Date()
  })

  await SettlementAuditLog.create({
    settlementRecordId: recordId,
    operationType: OPERATION_TYPE.POST,
    operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.POST],
    oldSettleStatus: oldStatus,
    newSettleStatus: SETTLEMENT_STATUS.POSTED,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole,
    remark: '结算入账完成，后续不可修改'
  })

  return record
}

const batchInitiateSettlement = async (recordIds, options = {}) => {
  const results = []
  for (const id of recordIds) {
    try {
      await initiateSettlement(id, options)
      results.push({ id, success: true })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }
  return {
    total: recordIds.length,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
    results
  }
}

const batchAuditSettlement = async (recordIds, passed, options = {}) => {
  const results = []
  for (const id of recordIds) {
    try {
      await auditSettlement(id, passed, options)
      results.push({ id, success: true })
    } catch (error) {
      results.push({ id, success: false, message: error.message })
    }
  }
  return {
    total: recordIds.length,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
    results
  }
}

const batchRejectSettlement = async (recordIds, options = {}) => {
  return batchAuditSettlement(recordIds, false, options)
}

const getSettlementTrace = async (recordId) => {
  const record = await SettlementRecord.findByPk(recordId, {
    include: [
      { model: Driver, as: 'driver', attributes: ['name', 'phone', 'city', 'vehicleType', 'driverLevel'] },
      { model: SettlementItem, as: 'items', limit: 100 },
      { model: SettlementAuditLog, as: 'auditLogs', order: [['createTime', 'ASC']] }
    ]
  })

  if (!record) throw new Error('结算记录不存在')

  const itemDetails = []
  for (const item of record.items || []) {
    const order = await Order.findByPk(item.orderId, {
      attributes: ['orderNo', 'orderAmount', 'premiumAmount', 'createTime', 'startLocation', 'endLocation', 'orderType', 'orderSource']
    })
    const appliedRules = await SettlementRule.findAll({
      where: { id: { [Op.in]: item.appliedRules || [] } }
    })
    itemDetails.push({
      ...item.toJSON(),
      orderInfo: order,
      appliedRuleNames: appliedRules.map(r => r.ruleName)
    })
  }

  return {
    record: record.toJSON(),
    items: itemDetails,
    auditLogs: record.auditLogs
  }
}

const getSettlementList = async (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    driverName,
    settleStatus,
    settlementType,
    isAbnormal,
    isPosted,
    periodStart,
    periodEnd,
    driverLevel
  } = params

  const where = {}

  if (settleStatus !== undefined && settleStatus !== '') where.settleStatus = settleStatus
  if (settlementType !== undefined && settlementType !== '') where.settlementType = settlementType
  if (isAbnormal !== undefined && isAbnormal !== '') where.isAbnormal = isAbnormal
  if (isPosted !== undefined && isPosted !== '') where.isPosted = isPosted
  if (periodStart && periodEnd) {
    where.periodStart = { [Op.gte]: periodStart }
    where.periodEnd = { [Op.lte]: periodEnd }
  }

  const includeWhere = {}
  if (driverName) includeWhere.name = { [Op.like]: `%${driverName}%` }
  if (driverLevel !== undefined && driverLevel !== '') includeWhere.driverLevel = driverLevel

  const { count, rows } = await SettlementRecord.findAndCountAll({
    where,
    include: [
      {
        model: Driver,
        as: 'driver',
        attributes: ['name', 'phone', 'city', 'vehicleType', 'driverLevel'],
        where: includeWhere
      }
    ],
    order: [['createTime', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize),
    distinct: true
  })

  return {
    list: rows,
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  }
}

const createSettlementRule = async (ruleData, options = {}) => {
  const result = await preCheckRuleChange(ruleData)
  if (!result.passed) {
    const err = new Error('规则校验不通过')
    err.validation = result
    throw err
  }

  const rule = await SettlementRule.create({
    ...ruleData,
    creatorId: options.operatorId,
    creatorName: options.operatorName
  })

  return { rule, preCheck: result }
}

const updateSettlementRule = async (ruleId, ruleData, options = {}) => {
  const oldRule = await SettlementRule.findByPk(ruleId)
  if (!oldRule) throw new Error('规则不存在')

  const result = await preCheckRuleChange({ ...oldRule.toJSON(), ...ruleData })
  if (!result.passed) {
    const err = new Error('规则校验不通过')
    err.validation = result
    throw err
  }

  const ruleChangeDetail = {}
  for (const key of Object.keys(ruleData)) {
    if (oldRule[key] !== ruleData[key]) {
      ruleChangeDetail[key] = { old: oldRule[key], new: ruleData[key] }
    }
  }

  await oldRule.update(ruleData)

  await SettlementAuditLog.create({
    settlementRecordId: 0,
    operationType: OPERATION_TYPE.UPDATE_RULE,
    operationTypeName: OPERATION_TYPE_NAMES[OPERATION_TYPE.UPDATE_RULE],
    ruleChangeDetail,
    operatorId: options.operatorId,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole,
    remark: `修改结算规则:${ruleId}`
  })

  return { rule: oldRule, preCheck: result, changes: ruleChangeDetail }
}

const getSettlementStatistics = async (params = {}) => {
  const stats = {
    total: 0,
    pending: 0,
    processing: 0,
    settled: 0,
    posted: 0,
    abnormal: 0,
    rejected: 0,
    totalIncome: 0,
    totalSubsidy: 0,
    totalCommission: 0,
    levelDistribution: {},
    cityDistribution: {},
    todayCreated: 0,
    todaySettled: 0
  }

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const records = await SettlementRecord.findAll({
    include: [{ model: Driver, as: 'driver', attributes: ['driverLevel', 'city'] }]
  })

  records.forEach(r => {
    stats.total++
    const statusName = Object.keys(SETTLEMENT_STATUS).find(k => SETTLEMENT_STATUS[k] === r.settleStatus)
    if (statusName && stats[statusName.toLowerCase()] !== undefined) {
      stats[statusName.toLowerCase()]++
    }
    stats.totalIncome += parseFloat(r.totalIncome || 0)
    stats.totalSubsidy += parseFloat(r.totalSubsidy || 0)
    stats.totalCommission += parseFloat(r.platformCommission || 0)

    if (r.createTime >= startOfToday) stats.todayCreated++
    if (r.settleTime && new Date(r.settleTime) >= startOfToday) stats.todaySettled++

    if (r.driver) {
      const lvl = r.driver.driverLevel || 2
      stats.levelDistribution[lvl] = (stats.levelDistribution[lvl] || 0) + 1
      const city = r.driver.city || 'unknown'
      stats.cityDistribution[city] = (stats.cityDistribution[city] || 0) + 1
    }
  })

  return stats
}

module.exports = {
  RULE_TYPE,
  RULE_TYPE_NAMES,
  APPLY_SCOPE,
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_NAMES,
  SETTLEMENT_TYPE,
  OPERATION_TYPE,
  OPERATION_TYPE_NAMES,
  DRIVER_SERVICE_LEVEL,
  COMPLIANCE_CONFIG,
  preCheckRuleChange,
  checkExclusiveRules,
  calculateEstimatedIncome,
  matchRulesForOrder,
  calculateOrderIncome,
  checkAbnormalSettlement,
  generateVoucherNo,
  generateSettlementNo,
  createSettlementRecord,
  initiateSettlement,
  auditSettlement,
  postSettlement,
  batchInitiateSettlement,
  batchAuditSettlement,
  batchRejectSettlement,
  getSettlementTrace,
  getSettlementList,
  createSettlementRule,
  updateSettlementRule,
  getSettlementStatistics
}
