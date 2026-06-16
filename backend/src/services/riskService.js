const { Op } = require('sequelize')
const { Order, Driver, Passenger, RiskRecord, RiskRule, Notification } = require('../models')
const { AppError } = require('../utils/response')

const checkOrderRisk = async (orderData) => {
  const risks = []
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentOrders = await Order.count({
    where: {
      passengerId: orderData.passengerId,
      createTime: { [Op.gte]: dayAgo }
    }
  })
  if (recentOrders > 5) {
    risks.push({
      ruleCode: 'HIGH_FREQ_ORDER',
      ruleName: '高频下单检测',
      riskType: 1,
      severity: 2,
      action: 2,
      detail: `该乘客24小时内下单${recentOrders}次，超过阈值5次`
    })
  }

  if (orderData.estimatedPrice && orderData.estimatedPrice > 0) {
    const avgPrice = await Order.findAll({
      where: {
        capacityType: orderData.capacityType,
        status: 5,
        actualPrice: { [Op.gt]: 0 }
      },
      attributes: [[require('sequelize').fn('AVG', require('sequelize').col('actualPrice')), 'avgPrice']],
      raw: true
    })
    const avg = avgPrice[0]?.avgPrice || 0
    if (avg > 0 && orderData.estimatedPrice > avg * 3) {
      risks.push({
        ruleCode: 'ABNORMAL_PRICE',
        ruleName: '异常价格检测',
        riskType: 5,
        severity: 3,
        action: 4,
        detail: `预估价格${orderData.estimatedPrice}元，偏离均值${parseFloat(avg).toFixed(2)}元的3倍以上`
      })
    }
  }

  if (orderData.distance && orderData.distance > 100) {
    risks.push({
      ruleCode: 'ABNORMAL_ROUTE',
      ruleName: '异常路线检测',
      riskType: 2,
      severity: 2,
      action: 4,
      detail: `行程距离${orderData.distance}公里，超过100公里阈值`
    })
  }

  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
  const recentCancels = await Order.count({
    where: {
      passengerId: orderData.passengerId,
      status: 6,
      cancelTime: { [Op.gte]: thirtyMinAgo }
    }
  })
  if (recentCancels > 3) {
    risks.push({
      ruleCode: 'SHORT_CANCEL',
      ruleName: '短时取消检测',
      riskType: 2,
      severity: 2,
      action: 2,
      detail: `该乘客30分钟内取消${recentCancels}次，超过阈值3次`
    })
  }

  const records = []
  for (const risk of risks) {
    let rule = await RiskRule.findOne({ where: { code: risk.ruleCode } })
    if (!rule) {
      rule = await RiskRule.create({
        name: risk.ruleName,
        code: risk.ruleCode,
        type: 1,
        category: risk.riskType,
        condition: { threshold: risk.ruleCode === 'HIGH_FREQ_ORDER' ? 5 : risk.ruleCode === 'ABNORMAL_ROUTE' ? 100 : risk.ruleCode === 'SHORT_CANCEL' ? 3 : 3 },
        threshold: risk.ruleCode === 'HIGH_FREQ_ORDER' ? 5 : risk.ruleCode === 'ABNORMAL_ROUTE' ? 100 : 3,
        action: risk.action,
        severity: risk.severity,
        status: 1
      })
    }
    await RiskRule.update({ hitCount: rule.hitCount + 1 }, { where: { id: rule.id } })

    const record = await RiskRecord.create({
      ruleId: rule.id,
      ruleName: risk.ruleName,
      ruleCode: risk.ruleCode,
      targetType: 1,
      targetId: orderData.passengerId,
      targetName: orderData.passengerName || '',
      riskType: risk.riskType,
      severity: risk.severity,
      action: risk.action,
      detail: risk.detail,
      status: 0
    })
    records.push(record)
  }

  return records
}

const checkDriverRisk = async (driverId) => {
  const risks = []
  const driver = await Driver.findByPk(driverId)
  if (!driver) {
    throw new AppError('司机不存在', 404, 404)
  }

  const totalOrders = driver.totalOrders || 0
  if (totalOrders > 0) {
    const cancelCount = await Order.count({
      where: { driverId, status: 6 }
    })
    const cancelRate = cancelCount / totalOrders
    if (cancelRate > 0.3) {
      risks.push({
        ruleCode: 'HIGH_CANCEL_RATE',
        ruleName: '高频取消率',
        riskType: 2,
        severity: 2,
        action: 2,
        detail: `司机取消率${(cancelRate * 100).toFixed(1)}%，超过30%阈值`
      })
    }
  }

  if (driver.rating < 3.5) {
    risks.push({
      ruleCode: 'LOW_RATING',
      ruleName: '低评分检测',
      riskType: 3,
      severity: 2,
      action: 2,
      detail: `司机评分${driver.rating}，低于3.5阈值`
    })
  }

  if (!driver.idCard || !driver.driverLicenseNo) {
    risks.push({
      ruleCode: 'FAKE_INFO',
      ruleName: '虚假信息检测',
      riskType: 4,
      severity: 3,
      action: 3,
      detail: '司机身份信息或驾驶证信息缺失，疑似虚假信息'
    })
  }

  const records = []
  for (const risk of risks) {
    let rule = await RiskRule.findOne({ where: { code: risk.ruleCode } })
    if (!rule) {
      rule = await RiskRule.create({
        name: risk.ruleName,
        code: risk.ruleCode,
        type: 2,
        category: risk.riskType,
        condition: { threshold: risk.ruleCode === 'HIGH_CANCEL_RATE' ? 0.3 : risk.ruleCode === 'LOW_RATING' ? 3.5 : 0 },
        threshold: risk.ruleCode === 'HIGH_CANCEL_RATE' ? 0.3 : risk.ruleCode === 'LOW_RATING' ? 3.5 : 0,
        action: risk.action,
        severity: risk.severity,
        status: 1
      })
    }
    await RiskRule.update({ hitCount: rule.hitCount + 1 }, { where: { id: rule.id } })

    const record = await RiskRecord.create({
      ruleId: rule.id,
      ruleName: risk.ruleName,
      ruleCode: risk.ruleCode,
      targetType: 2,
      targetId: driverId,
      targetName: driver.name,
      riskType: risk.riskType,
      severity: risk.severity,
      action: risk.action,
      detail: risk.detail,
      status: 0
    })
    records.push(record)
  }

  if (risks.some(r => r.action === 3)) {
    await driver.update({ status: 3 })
  }

  return records
}

const handleViolation = async (recordId, action) => {
  const record = await RiskRecord.findByPk(recordId)
  if (!record) {
    throw new AppError('风控记录不存在', 404, 404)
  }

  const now = new Date()
  let handleResult = ''

  switch (action) {
    case 1:
      handleResult = '已发送警告通知'
      await Notification.create({
        title: '风控警告',
        content: `您触发了风控规则【${record.ruleName}】，请规范操作。详情：${record.detail}`,
        type: 3,
        targetType: record.targetType === 2 ? 3 : 3,
        targetId: record.targetId,
        priority: 2
      })
      break
    case 2:
      handleResult = '已限制接单'
      if (record.targetType === 2) {
        const driver = await Driver.findByPk(record.targetId)
        if (driver) {
          await driver.update({ status: 0 })
        }
      }
      break
    case 3:
      handleResult = '已封禁账号'
      if (record.targetType === 2) {
        const driver = await Driver.findByPk(record.targetId)
        if (driver) {
          await driver.update({ status: 3 })
        }
      }
      break
    case 4:
      handleResult = '已转人工审核'
      break
    default:
      throw new AppError('无效的处置动作', 400, 400)
  }

  await record.update({
    status: 1,
    action,
    handleResult,
    handleTime: now
  })

  return record
}

const getRiskDashboard = async () => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  const todayAlerts = await RiskRecord.count({
    where: { createTime: { [Op.gte]: todayStart } }
  })

  const highRiskCount = await RiskRecord.count({
    where: {
      severity: 3,
      createTime: { [Op.gte]: todayStart }
    }
  })

  const handledCount = await RiskRecord.count({
    where: {
      status: 1,
      handleTime: { [Op.gte]: todayStart }
    }
  })

  const typeDistribution = await RiskRecord.findAll({
    where: { createTime: { [Op.gte]: todayStart } },
    attributes: [
      'riskType',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['riskType'],
    raw: true
  })

  const severityDistribution = await RiskRecord.findAll({
    where: { createTime: { [Op.gte]: todayStart } },
    attributes: [
      'severity',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['severity'],
    raw: true
  })

  return {
    todayAlerts,
    highRiskCount,
    handledCount,
    typeDistribution,
    severityDistribution
  }
}

module.exports = {
  checkOrderRisk,
  checkDriverRisk,
  handleViolation,
  getRiskDashboard
}
