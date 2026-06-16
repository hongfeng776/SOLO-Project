const { Op } = require('sequelize')
const { RiskRule, RiskRecord, Order } = require('../models')
const { success, pageResult, AppError } = require('../utils/response')

const getRules = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      category,
      status
    } = req.query

    const where = {}

    if (type !== undefined && type !== '') where.type = type
    if (category !== undefined && category !== '') where.category = category
    if (status !== undefined && status !== '') where.status = status

    const { count, rows } = await RiskRule.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const getRuleDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const rule = await RiskRule.findByPk(id)
    if (!rule) throw new AppError('规则不存在', 404, 404)
    res.json(success(rule))
  } catch (error) {
    next(error)
  }
}

const createRule = async (req, res, next) => {
  try {
    const data = req.body
    const rule = await RiskRule.create(data)
    res.json(success(rule, '创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = req.body
    const rule = await RiskRule.findByPk(id)
    if (!rule) throw new AppError('规则不存在', 404, 404)
    await rule.update(data)
    res.json(success(rule, '更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params
    const rule = await RiskRule.findByPk(id)
    if (!rule) throw new AppError('规则不存在', 404, 404)
    await rule.destroy()
    res.json(success(null, '删除成功'))
  } catch (error) {
    next(error)
  }
}

const toggleRule = async (req, res, next) => {
  try {
    const { id } = req.params
    const rule = await RiskRule.findByPk(id)
    if (!rule) throw new AppError('规则不存在', 404, 404)
    await rule.update({ status: rule.status === 1 ? 0 : 1 })
    res.json(success(null, rule.status === 1 ? '已禁用' : '已启用'))
  } catch (error) {
    next(error)
  }
}

const getRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      targetType,
      severity,
      status,
      startTime,
      endTime
    } = req.query

    const where = {}

    if (targetType !== undefined && targetType !== '') where.targetType = targetType
    if (severity !== undefined && severity !== '') where.severity = severity
    if (status !== undefined && status !== '') where.status = status
    if (startTime && endTime) {
      where.createTime = { [Op.between]: [startTime, endTime] }
    }

    const { count, rows } = await RiskRecord.findAndCountAll({
      where,
      order: [['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const handleRecord = async (req, res, next) => {
  try {
    const { id } = req.params
    const { action, result } = req.body

    const record = await RiskRecord.findByPk(id)
    if (!record) throw new AppError('风控记录不存在', 404, 404)
    if (record.status !== 0) throw new AppError('该记录已处理', 400, 400)

    await record.update({
      status: action === 'ignore' ? 2 : 1,
      handleResult: result,
      handleTime: new Date()
    })

    res.json(success(null, '处理成功'))
  } catch (error) {
    next(error)
  }
}

const getDashboard = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

    const totalRules = await RiskRule.count()
    const enabledRules = await RiskRule.count({ where: { status: 1 } })
    const pendingRecords = await RiskRecord.count({ where: { status: 0 } })
    const todayRecords = await RiskRecord.count({
      where: { createTime: { [Op.gte]: todayStart } }
    })
    const todayHighRisk = await RiskRecord.count({
      where: {
        severity: 3,
        createTime: { [Op.gte]: todayStart }
      }
    })
    const handledRecords = await RiskRecord.count({ where: { status: 1 } })
    const totalRecords = await RiskRecord.count()

    res.json(success({
      totalRules,
      enabledRules,
      pendingRecords,
      todayRecords,
      todayHighRisk,
      handleRate: totalRecords > 0 ? ((handledRecords / totalRecords) * 100).toFixed(1) : '0.0'
    }))
  } catch (error) {
    next(error)
  }
}

const checkOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body

    const order = await Order.findByPk(orderId)
    if (!order) throw new AppError('订单不存在', 404, 404)

    const enabledRules = await RiskRule.findAll({ where: { status: 1, type: 1 } })

    const riskRecords = []
    for (const rule of enabledRules) {
      const condition = rule.condition || {}
      let hit = false

      if (condition.maxAmount && order.actualPrice > condition.maxAmount) hit = true
      if (condition.minAmount && order.actualPrice < condition.minAmount) hit = true

      if (hit) {
        const record = await RiskRecord.create({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleCode: rule.code,
          targetType: 1,
          targetId: order.id,
          targetName: order.orderNo,
          riskType: rule.category,
          severity: rule.severity,
          action: rule.action,
          detail: `订单${order.orderNo}触发规则${rule.name}`
        })
        riskRecords.push(record)

        await rule.update({ hitCount: rule.hitCount + 1 })
      }
    }

    res.json(success({
      orderId: order.id,
      orderNo: order.orderNo,
      riskCount: riskRecords.length,
      riskRecords
    }, '风控检查完成'))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getRules,
  getRuleDetail,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getRecords,
  handleRecord,
  getDashboard,
  checkOrder
}
