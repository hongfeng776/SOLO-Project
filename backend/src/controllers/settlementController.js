const { Op } = require('sequelize')
const {
  SettlementRule,
  SettlementRecord,
  SettlementItem,
  Driver
} = require('../models')
const { success, pageResult, AppError } = require('../utils/response')
const settlementService = require('../services/settlementService')

const getSettlementList = async (req, res, next) => {
  try {
    const result = await settlementService.getSettlementList(req.query)
    res.json(pageResult(result.list, result.total, result.page, result.pageSize))
  } catch (error) {
    next(error)
  }
}

const createSettlement = async (req, res, next) => {
  try {
    const { driverId, periodStart, periodEnd, orderIds, settlementType } = req.body
    const { userId, userName, role } = req.user || {}

    if (!driverId) throw new AppError('请指定司机', 400)
    if (!periodStart || !periodEnd) throw new AppError('请指定结算周期', 400)

    const record = await settlementService.createSettlementRecord(driverId, {
      start: new Date(periodStart),
      end: new Date(periodEnd)
    }, {
      orderIds,
      settlementType,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })

    res.json(success(record, '结算单创建成功'))
  } catch (error) {
    next(error)
  }
}

const getSettlementDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await settlementService.getSettlementTrace(id)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const initiateSettlement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userId, userName, role } = req.user || {}

    const record = await settlementService.initiateSettlement(id, {
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(record, '结算发起成功'))
  } catch (error) {
    next(error)
  }
}

const auditSettlement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { passed, rejectReason } = req.body
    const { userId, userName, role } = req.user || {}

    if (passed === undefined) throw new AppError('请指定审核结果', 400)

    const record = await settlementService.auditSettlement(id, !!passed, {
      rejectReason,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(record, passed ? '审核通过' : '审核驳回'))
  } catch (error) {
    next(error)
  }
}

const postSettlement = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userId, userName, role } = req.user || {}

    const record = await settlementService.postSettlement(id, {
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(record, '入账成功'))
  } catch (error) {
    next(error)
  }
}

const batchInitiate = async (req, res, next) => {
  try {
    const { ids } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400)
    }

    const result = await settlementService.batchInitiateSettlement(ids, {
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(result, `批量发起完成：成功${result.successCount}条，失败${result.failCount}条`))
  } catch (error) {
    next(error)
  }
}

const batchAudit = async (req, res, next) => {
  try {
    const { ids, passed, rejectReason } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400)
    }
    if (passed === undefined) throw new AppError('请指定审核结果', 400)

    const result = await settlementService.batchAuditSettlement(ids, !!passed, {
      rejectReason,
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(result, `批量审核完成：成功${result.successCount}条，失败${result.failCount}条`))
  } catch (error) {
    next(error)
  }
}

const batchReject = async (req, res, next) => {
  try {
    const { ids, rejectReason } = req.body
    const { userId, userName, role } = req.user || {}

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要操作的记录', 400)
    }

    const result = await settlementService.batchRejectSettlement(ids, {
      rejectReason: rejectReason || '批量驳回',
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(result, `批量驳回完成：成功${result.successCount}条，失败${result.failCount}条`))
  } catch (error) {
    next(error)
  }
}

const getRuleList = async (req, res, next) => {
  try {
    const { status, ruleType, applyScope, page = 1, pageSize = 20 } = req.query

    const where = {}
    if (status !== undefined && status !== '') where.status = status
    if (ruleType !== undefined && ruleType !== '') where.ruleType = ruleType
    if (applyScope !== undefined && applyScope !== '') where.applyScope = applyScope

    const { count, rows } = await SettlementRule.findAndCountAll({
      where,
      order: [['priority', 'DESC'], ['createTime', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    })

    res.json(pageResult(rows, count, page, pageSize))
  } catch (error) {
    next(error)
  }
}

const preCheckRule = async (req, res, next) => {
  try {
    const { rule, driverId } = req.body
    let driver = null
    if (driverId) {
      driver = await Driver.findByPk(driverId)
    }

    const result = await settlementService.preCheckRuleChange(rule, driver)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const checkExclusiveRule = async (req, res, next) => {
  try {
    const { driverId, ruleType } = req.body
    const result = await settlementService.checkExclusiveRules(driverId, ruleType)
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const estimateIncome = async (req, res, next) => {
  try {
    const { driverId, ruleChanges } = req.body
    if (!driverId) throw new AppError('请指定司机', 400)

    const result = await settlementService.calculateEstimatedIncome(driverId, ruleChanges || {})
    res.json(success(result))
  } catch (error) {
    next(error)
  }
}

const createRule = async (req, res, next) => {
  try {
    const { userId, userName, role } = req.user || {}
    const result = await settlementService.createSettlementRule(req.body, {
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(result, '规则创建成功'))
  } catch (error) {
    next(error)
  }
}

const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params
    const { userId, userName, role } = req.user || {}
    const result = await settlementService.updateSettlementRule(id, req.body, {
      operatorId: userId,
      operatorName: userName,
      operatorRole: role || 'admin'
    })
    res.json(success(result, '规则更新成功'))
  } catch (error) {
    next(error)
  }
}

const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params
    await SettlementRule.destroy({ where: { id } })
    res.json(success(null, '规则删除成功'))
  } catch (error) {
    next(error)
  }
}

const calculateOrderIncome = async (req, res, next) => {
  try {
    const { driverId, orderId } = req.body
    if (!driverId || !orderId) throw new AppError('请指定司机和订单', 400)

    const driver = await Driver.findByPk(driverId)
    const order = await SettlementRecord.sequelize.model('Order').findByPk(orderId)
    if (!driver) throw new AppError('司机不存在', 404)
    if (!order) throw new AppError('订单不存在', 404)

    const matchedRules = await settlementService.matchRulesForOrder(driver, order)
    const income = await settlementService.calculateOrderIncome(driver, order, matchedRules)

    res.json(success({
      orderInfo: order,
      matchedRules,
      income,
      calculationProcess: income.calculationDetail
    }))
  } catch (error) {
    next(error)
  }
}

const getStatistics = async (req, res, next) => {
  try {
    const stats = await settlementService.getSettlementStatistics(req.query)
    res.json(success(stats))
  } catch (error) {
    next(error)
  }
}

const generateVoucher = async (req, res, next) => {
  try {
    const voucherNo = settlementService.generateVoucherNo()
    res.json(success({ voucherNo }))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSettlementList,
  createSettlement,
  getSettlementDetail,
  initiateSettlement,
  auditSettlement,
  postSettlement,
  batchInitiate,
  batchAudit,
  batchReject,
  getRuleList,
  preCheckRule,
  checkExclusiveRule,
  estimateIncome,
  createRule,
  updateRule,
  deleteRule,
  calculateOrderIncome,
  getStatistics,
  generateVoucher
}
