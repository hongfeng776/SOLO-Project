const { Op } = require('sequelize')
const { PricingRule, Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const pricingService = require('../services/pricingService')

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
}

const getRuleList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, ruleType, status, capacityType, cityCode } = req.query
    const result = await pricingService.getPricingRules({
      page, pageSize, ruleType, status, capacityType, cityCode
    })
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const getRuleDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const rule = await PricingRule.findByPk(id)
    if (!rule) {
      throw new AppError('计费规则不存在', 404, 404)
    }
    res.json(success(rule))
  } catch (error) {
    next(error)
  }
}

const createRule = async (req, res, next) => {
  try {
    if (req.user?.role !== 1) {
      throw new AppError('仅超级管理员可创建计费规则', 403, 403)
    }
    const rule = await pricingService.createPricingRule(req.body, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorIP: getClientIP(req)
    })
    res.json(success(rule, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateRule = async (req, res, next) => {
  try {
    if (req.user?.role !== 1) {
      throw new AppError('仅超级管理员可更新计费规则', 403, 403)
    }
    const { id } = req.params
    const rule = await pricingService.updatePricingRule(id, req.body, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorIP: getClientIP(req)
    })
    res.json(success(rule, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteRule = async (req, res, next) => {
  try {
    if (req.user?.role !== 1) {
      throw new AppError('仅超级管理员可删除计费规则', 403, 403)
    }
    const { id } = req.params
    await pricingService.deletePricingRule(id, {
      operatorId: req.user?.id,
      operatorName: req.user?.nickname,
      operatorIP: getClientIP(req)
    })
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const calculateBilling = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { weather, date } = req.query
    const result = await pricingService.calculateBillingDetail(parseInt(orderId), {
      weather,
      date: date ? new Date(date) : undefined
    })
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const updateOrderBilling = async (req, res, next) => {
  try {
    const { orderId } = req.params

    if (req.user?.role !== 1 && req.user?.role !== 2) {
      throw new AppError('仅超级管理员和运营可修改订单计费', 403, 403)
    }

    const result = await pricingService.updateOrderBilling(
      parseInt(orderId),
      req.body,
      {
        operatorId: req.user?.id,
        operatorName: req.user?.nickname,
        operatorIP: getClientIP(req)
      }
    )

    res.json(success(result, '计费规则更新成功'))
  } catch (error) {
    next(error)
  }
}

const getChangeLogs = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const { page = 1, pageSize = 20 } = req.query
    const result = await pricingService.getPricingChangeLogs(
      orderId ? parseInt(orderId) : null,
      page,
      pageSize
    )
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const batchAdjustPricing = async (req, res, next) => {
  try {
    if (req.user?.role !== 1) {
      throw new AppError('仅超级管理员可执行批量计费调整', 403, 403)
    }

    const { filter, adjustParams } = req.body

    const result = await pricingService.batchAdjustPricing(
      filter,
      adjustParams,
      {
        operatorId: req.user?.id,
        operatorName: req.user?.nickname,
        operatorIP: getClientIP(req)
      }
    )

    res.json(success(result, '批量调整完成'))
  } catch (error) {
    next(error)
  }
}

const getBillingTrace = async (req, res, next) => {
  try {
    const { orderId } = req.params
    const result = await pricingService.getBillingTrace(parseInt(orderId))
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const validatePricingEdit = async (req, res, next) => {
  try {
    const { basePrice, perKmPrice, perMinPrice, surgeRatio, distance, duration } = req.body

    const distanceNum = parseFloat(distance) || 0
    const durationNum = parseFloat(duration) || 0
    const basePriceNum = parseFloat(basePrice) || 0
    const perKmNum = parseFloat(perKmPrice) || 0
    const perMinNum = parseFloat(perMinPrice) || 0
    const surgeRatioNum = parseFloat(surgeRatio) || 1

    let total = basePriceNum + distanceNum * perKmNum + durationNum * perMinNum
    total = total * surgeRatioNum
    total = Math.round(total * 100) / 100

    const validation = pricingService.validateBillingData({
      totalBasePrice: basePriceNum,
      totalDistanceFee: distanceNum * perKmNum,
      totalDurationFee: durationNum * perMinNum,
      totalSurgeAmount: total - (basePriceNum + distanceNum * perKmNum + durationNum * perMinNum),
      estimatedTotal: total,
      rules: [{ surgeRatio: surgeRatioNum, isMutuallyExclusive: true }],
      distance: distanceNum,
      duration: durationNum
    })

    res.json(success({
      estimatedTotal: total,
      validation,
      industryThreshold: pricingService.INDUSTRY_PRICE_THRESHOLD,
      surgeLimit: pricingService.SURGE_RATIO_LIMIT
    }))
  } catch (error) {
    next(error)
  }
}

const getApplicableScenarios = async (req, res, next) => {
  try {
    const scenarios = [
      { key: 'time', name: '时段场景', items: [
        { value: 'daytime', label: '日间(06:00-22:00)' },
        { value: 'nighttime', label: '夜间(22:00-06:00)', hasSurcharge: true },
        { value: 'peak', label: '高峰(07:00-09:00,17:00-19:00)', hasSurcharge: true }
      ]},
      { key: 'weather', name: '天气场景', items: [
        { value: 'normal', label: '常规' },
        { value: 'rain', label: '雨天', hasSurcharge: true },
        { value: 'snow', label: '雪天', hasSurcharge: true },
        { value: 'fog', label: '雾天', hasSurcharge: true },
        { value: 'hot', label: '高温', hasSurcharge: true }
      ]},
      { key: 'holiday', name: '节假日场景', items: [
        { value: 'workday', label: '工作日' },
        { value: 'weekend', label: '周末', hasSurcharge: true },
        { value: 'holiday', label: '法定节假日', hasSurcharge: true }
      ]},
      { key: 'capacity', name: '车型溢价', items: [
        { value: 1, label: '快车' },
        { value: 2, label: '专车', hasSurcharge: true },
        { value: 3, label: '豪华车', hasSurcharge: true },
        { value: 4, label: '拼车', hasSurcharge: false },
        { value: 5, label: '出租车' }
      ]}
    ]

    res.json(success(scenarios))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getRuleList,
  getRuleDetail,
  createRule,
  updateRule,
  deleteRule,
  calculateBilling,
  updateOrderBilling,
  getChangeLogs,
  batchAdjustPricing,
  getBillingTrace,
  validatePricingEdit,
  getApplicableScenarios
}
