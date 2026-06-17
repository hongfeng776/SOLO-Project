const { Op } = require('sequelize')
const { sequelize } = require('../config/db')
const BaseService = require('./BaseService')
const AfterSale = require('../models/AfterSale')
const AfterSaleAudit = require('../models/AfterSaleAudit')
const RefundFlow = require('../models/RefundFlow')
const Order = require('../models/Order')
const User = require('../models/User')
const Merchant = require('../models/Merchant')
const Coupon = require('../models/Coupon')
const PaymentDeduction = require('../models/PaymentDeduction')
const businessLinkageService = require('./BusinessLinkageService')
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error')

const LARGE_AMOUNT_THRESHOLD = 5000
const CHANNEL_NAMES = {
  wechat: '微信支付',
  alipay: '支付宝',
  unionpay: '银联支付',
  credit_card: '信用卡',
  balance: '余额支付'
}

const generateAfterSaleNo = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `AS${timestamp}${random}`
}

const generateRefundNo = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RF${timestamp}${random}`
}

const calculatePenalty = (applyAmount, payTime) => {
  const now = new Date()
  const payDate = payTime ? new Date(payTime) : now
  const hoursSincePay = (now - payDate) / (1000 * 60 * 60)
  let penaltyRate = 0
  if (hoursSincePay <= 24) {
    penaltyRate = 0.10
  } else if (hoursSincePay <= 24 * 7) {
    penaltyRate = 0.05
  }
  const penaltyAmount = parseFloat((applyAmount * penaltyRate).toFixed(2))
  return { penaltyRate, penaltyAmount }
}

class AfterSaleService extends BaseService {
  constructor() {
    super(AfterSale)
  }

  async createAudit(afterSaleId, afterSaleNo, orderId, auditAction, auditStatus, operator, remark = null, changes = null) {
    const auditData = {
      afterSaleId,
      afterSaleNo,
      orderId,
      operatorId: operator?.id || null,
      operatorName: operator?.name || '',
      operatorRole: operator?.role || '',
      auditAction,
      auditStatus,
      auditRemark: remark
    }
    if (changes) {
      auditData.changes = typeof changes === 'string' ? changes : JSON.stringify(changes)
    }
    return await AfterSaleAudit.create(auditData)
  }

  async initiateAfterSale(orderId, type, data, operator) {
    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new NotFoundError('订单不存在')
    }

    const transaction = await sequelize.transaction()

    try {
      const { refundType, applyAmount, applyReason, applyImages, penaltyAmount, finalRefundAmount, isLargeAmount } = data
      const afterSaleNo = generateAfterSaleNo()
      const orderAmount = parseFloat(order.amount || 0)
      const paidAmount = parseFloat(order.paidAmount || orderAmount)

      const { penaltyRate, penaltyAmount: calcPenalty } = calculatePenalty(applyAmount, order.payTime)
      const finalPenalty = penaltyAmount !== undefined ? penaltyAmount : calcPenalty
      const finalRefund = finalRefundAmount !== undefined ? finalRefundAmount : parseFloat((applyAmount - finalPenalty).toFixed(2))
      const largeFlag = isLargeAmount !== undefined ? isLargeAmount : (finalRefund >= LARGE_AMOUNT_THRESHOLD ? 1 : 0)

      const afterSale = await AfterSale.create({
        orderId,
        orderNo: order.orderNo,
        afterSaleNo,
        userId: order.userId,
        type,
        refundType,
        applyAmount,
        applyReason,
        applyImages: applyImages ? (typeof applyImages === 'string' ? applyImages : JSON.stringify(applyImages)) : null,
        status: 0,
        penaltyAmount: finalPenalty,
        finalRefundAmount: finalRefund,
        isLargeAmount: largeFlag,
        isFrozen: 1,
        remark: null
      }, { transaction })

      await this.createAudit(
        afterSale.id,
        afterSaleNo,
        orderId,
        'submit',
        0,
        operator,
        `用户提交售后申请，申请金额${applyAmount}元，违约金${finalPenalty}元，预计退款${finalRefund}元`,
        {
          type,
          refundType,
          applyAmount,
          applyReason,
          penaltyAmount: finalPenalty,
          finalRefundAmount: finalRefund,
          penaltyRate,
          isLargeAmount: largeFlag
        }
      )

      await transaction.commit()

      return await AfterSale.findByPk(afterSale.id, {
        include: [
          { model: Order, as: 'order' },
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] }
        ]
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async approveAfterSale(afterSaleId, data, operator) {
    const afterSale = await AfterSale.findByPk(afterSaleId, {
      include: [{ model: Order, as: 'order' }]
    })
    if (!afterSale) {
      throw new NotFoundError('售后申请不存在')
    }

    if (afterSale.status !== 0) {
      throw new ValidationError('仅待审核状态的申请可执行审核通过操作')
    }

    const roleCode = operator?.role
    if (afterSale.isLargeAmount === 1 && roleCode !== 'admin') {
      throw new ForbiddenError('大额退款(>=5000元)仅管理员可审核通过')
    }

    const order = afterSale.order
    if (!order) {
      throw new NotFoundError('关联订单不存在')
    }

    const transaction = await sequelize.transaction()

    try {
      const now = new Date()
      const refundChannel = order.paymentChannel || 'balance'

      await afterSale.update({
        status: 3,
        approveTime: now,
        approveOperatorId: operator?.id || null,
        remark: data?.remark || afterSale.remark
      }, { transaction })

      const refundNo = generateRefundNo()
      const orderAmount = parseFloat(order.amount || 0)
      const paidAmount = parseFloat(order.paidAmount || orderAmount)

      const refundFlow = await RefundFlow.create({
        afterSaleId: afterSale.id,
        afterSaleNo: afterSale.afterSaleNo,
        orderId: order.id,
        refundNo,
        refundChannel,
        orderAmount,
        paidAmount,
        penaltyAmount: parseFloat(afterSale.penaltyAmount || 0),
        refundAmount: parseFloat(afterSale.finalRefundAmount || 0),
        status: 0
      }, { transaction })

      await order.update({
        status: 5,
        refundAmount: parseFloat(afterSale.finalRefundAmount || 0)
      }, { transaction })

      await this.createAudit(
        afterSale.id,
        afterSale.afterSaleNo,
        order.id,
        'apply',
        3,
        operator,
        data?.remark || `审核通过，进入退款流程，退款金额${afterSale.finalRefundAmount}元`,
        {
          fromStatus: 0,
          toStatus: 3,
          refundNo,
          refundChannel,
          refundAmount: afterSale.finalRefundAmount,
          penaltyAmount: afterSale.penaltyAmount,
          approveOperatorId: operator?.id || null
        }
      )

      if (order.merchantId) {
        const merchant = await Merchant.findByPk(order.merchantId)
        if (merchant) {
          const settleDeduction = parseFloat(afterSale.finalRefundAmount || 0)
        }
      }

      await transaction.commit()

      return await AfterSale.findByPk(afterSale.id, {
        include: [
          { model: Order, as: 'order' },
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
          { model: RefundFlow, as: 'refundFlows' },
          { model: AfterSaleAudit, as: 'audits', order: [['id', 'DESC']] }
        ]
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async rejectAfterSale(afterSaleId, rejectReason, operator) {
    const afterSale = await AfterSale.findByPk(afterSaleId, {
      include: [{ model: Order, as: 'order' }]
    })
    if (!afterSale) {
      throw new NotFoundError('售后申请不存在')
    }

    if (afterSale.status !== 0) {
      throw new ValidationError('仅待审核状态的申请可执行驳回操作')
    }

    if (!rejectReason || rejectReason.trim().length === 0) {
      throw new ValidationError('驳回原因不能为空')
    }

    const transaction = await sequelize.transaction()

    try {
      const now = new Date()

      await afterSale.update({
        status: 2,
        rejectReason: rejectReason.trim(),
        rejectTime: now,
        rejectOperatorId: operator?.id || null,
        isFrozen: 0
      }, { transaction })

      await this.createAudit(
        afterSale.id,
        afterSale.afterSaleNo,
        afterSale.orderId,
        'reject',
        2,
        operator,
        `审核驳回: ${rejectReason.trim()}`,
        {
          fromStatus: 0,
          toStatus: 2,
          rejectReason: rejectReason.trim(),
          rejectOperatorId: operator?.id || null
        }
      )

      await transaction.commit()

      return await AfterSale.findByPk(afterSale.id, {
        include: [
          { model: Order, as: 'order' },
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
          { model: AfterSaleAudit, as: 'audits', order: [['id', 'DESC']] }
        ]
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async postponeAfterSale(afterSaleId, remark, operator) {
    const afterSale = await AfterSale.findByPk(afterSaleId)
    if (!afterSale) {
      throw new NotFoundError('售后申请不存在')
    }

    if (afterSale.status !== 0) {
      throw new ValidationError('仅待审核状态的申请可执行暂缓操作')
    }

    const transaction = await sequelize.transaction()

    try {
      await afterSale.update({
        status: 6,
        remark: remark || afterSale.remark
      }, { transaction })

      await this.createAudit(
        afterSale.id,
        afterSale.afterSaleNo,
        afterSale.orderId,
        'postpone',
        6,
        operator,
        remark || '暂缓处理',
        {
          fromStatus: 0,
          toStatus: 6,
          remark: remark || ''
        }
      )

      await transaction.commit()

      return await AfterSale.findByPk(afterSale.id, {
        include: [
          { model: Order, as: 'order' },
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
          { model: AfterSaleAudit, as: 'audits', order: [['id', 'DESC']] }
        ]
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async executeRefund(afterSaleId, operator) {
    const roleCode = operator?.role
    if (roleCode !== 'admin') {
      throw new ForbiddenError('仅管理员可执行退款操作')
    }

    const afterSale = await AfterSale.findByPk(afterSaleId, {
      include: [
        { model: Order, as: 'order' },
        { model: RefundFlow, as: 'refundFlows' }
      ]
    })
    if (!afterSale) {
      throw new NotFoundError('售后申请不存在')
    }

    if (afterSale.status !== 3) {
      throw new ValidationError('仅退款中状态的申请可执行退款操作')
    }

    const order = afterSale.order
    if (!order) {
      throw new NotFoundError('关联订单不存在')
    }

    const refundFlow = (afterSale.refundFlows || []).find(f => f.status === 0)
    if (!refundFlow) {
      throw new ValidationError('未找到待处理的退款流水')
    }

    const transaction = await sequelize.transaction()

    try {
      const now = new Date()

      await refundFlow.update({
        status: 1,
        refundTime: now,
        transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
      }, { transaction })

      await afterSale.update({
        status: 4,
        isFrozen: 0
      }, { transaction })

      await order.update({
        status: 6,
        refundTime: now
      }, { transaction })

      await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1)

      const deductions = await PaymentDeduction.findAll({
        where: { orderId: order.id }
      })
      for (const deduction of deductions) {
        if (deduction.deductionType === 'coupon' && deduction.deductionSource) {
          const coupon = await Coupon.findByPk(parseInt(deduction.deductionSource))
          if (coupon) {
            await coupon.update({
              usedStock: Math.max(0, coupon.usedStock - 1),
              remainStock: coupon.remainStock + 1
            }, { transaction })
          }
        }
      }

      await this.createAudit(
        afterSale.id,
        afterSale.afterSaleNo,
        order.id,
        'apply',
        4,
        operator,
        `退款成功，实际退款${afterSale.finalRefundAmount}元`,
        {
          fromStatus: 3,
          toStatus: 4,
          refundFlowId: refundFlow.id,
          refundNo: refundFlow.refundNo,
          refundAmount: afterSale.finalRefundAmount,
          refundTime: now
        }
      )

      await businessLinkageService.createOrderLog(
        order.id,
        'refund',
        5,
        6,
        operator,
        {
          afterSaleId: afterSale.id,
          afterSaleNo: afterSale.afterSaleNo,
          refundNo: refundFlow.refundNo,
          refundAmount: afterSale.finalRefundAmount,
          penaltyAmount: afterSale.penaltyAmount
        },
        `售后退款成功，退款单号:${refundFlow.refundNo}，退款金额:${afterSale.finalRefundAmount}元`
      )

      await transaction.commit()

      return await AfterSale.findByPk(afterSale.id, {
        include: [
          { model: Order, as: 'order' },
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
          { model: RefundFlow, as: 'refundFlows' },
          { model: AfterSaleAudit, as: 'audits', order: [['id', 'DESC']] }
        ]
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async batchApprove(ids, operator) {
    const roleCode = operator?.role
    if (!['admin', 'operator'].includes(roleCode)) {
      throw new ForbiddenError('仅管理员和运营人员可批量审核通过')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的售后申请')
    }

    let successCount = 0
    let failCount = 0
    let skippedLargeCount = 0
    const failedIds = []
    const skippedLargeIds = []

    for (const id of ids) {
      try {
        const afterSale = await AfterSale.findByPk(id)
        if (!afterSale) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (afterSale.status !== 0) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (afterSale.isLargeAmount === 1 && roleCode !== 'admin') {
          skippedLargeCount++
          skippedLargeIds.push(id)
          continue
        }

        await this.approveAfterSale(id, {}, operator)
        successCount++
      } catch (e) {
        failedIds.push(id)
        failCount++
      }
    }

    return {
      successCount,
      failCount,
      failedIds,
      skippedLargeCount,
      skippedLargeIds
    }
  }

  async batchReject(ids, rejectReason, operator) {
    const roleCode = operator?.role
    if (!['admin', 'operator'].includes(roleCode)) {
      throw new ForbiddenError('仅管理员和运营人员可批量驳回')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的售后申请')
    }

    if (!rejectReason || rejectReason.trim().length === 0) {
      throw new ValidationError('驳回原因不能为空')
    }

    let successCount = 0
    let failCount = 0
    const failedIds = []

    for (const id of ids) {
      try {
        const afterSale = await AfterSale.findByPk(id)
        if (!afterSale) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (afterSale.status !== 0) {
          failedIds.push(id)
          failCount++
          continue
        }

        await this.rejectAfterSale(id, rejectReason, operator)
        successCount++
      } catch (e) {
        failedIds.push(id)
        failCount++
      }
    }

    return {
      successCount,
      failCount,
      failedIds
    }
  }

  async batchPostpone(ids, remark, operator) {
    const roleCode = operator?.role
    if (!['admin', 'operator'].includes(roleCode)) {
      throw new ForbiddenError('仅管理员和运营人员可批量暂缓')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的售后申请')
    }

    let successCount = 0
    let failCount = 0
    const failedIds = []

    for (const id of ids) {
      try {
        const afterSale = await AfterSale.findByPk(id)
        if (!afterSale) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (afterSale.status !== 0) {
          failedIds.push(id)
          failCount++
          continue
        }

        await this.postponeAfterSale(id, remark, operator)
        successCount++
      } catch (e) {
        failedIds.push(id)
        failCount++
      }
    }

    return {
      successCount,
      failCount,
      failedIds
    }
  }

  async traceAfterSales(params = {}) {
    const {
      keyword,
      orderId,
      userId,
      status,
      type,
      refundType,
      isLargeAmount,
      dateRange,
      pageNum = 1,
      pageSize = 10
    } = params

    const where = {}
    const offset = (pageNum - 1) * pageSize
    const limit = Math.min(pageSize, 200)

    if (status !== undefined && status !== null && status !== '') {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (refundType) {
      where.refundType = refundType
    }
    if (isLargeAmount !== undefined && isLargeAmount !== null && isLargeAmount !== '') {
      where.isLargeAmount = isLargeAmount
    }
    if (userId) {
      where.userId = userId
    }
    if (orderId) {
      where.orderId = orderId
    }

    let extraCondition = null

    if (keyword) {
      const kw = keyword.trim()
      if (/^AS\d+/.test(kw)) {
        where.afterSaleNo = kw
      } else if (/^ORD/.test(kw)) {
        where.orderNo = kw
      } else if (/^1\d{10}$/.test(kw)) {
        const users = await User.findAll({ where: { phone: kw } })
        const userIds = users.map(u => u.id)
        if (userIds.length > 0) {
          where.userId = { [Op.in]: userIds }
        } else {
          where.userId = -1
        }
      } else {
        extraCondition = {
          [Op.or]: [
            { afterSaleNo: { [Op.like]: `%${kw}%` } },
            { orderNo: { [Op.like]: `%${kw}%` } },
            { applyReason: { [Op.like]: `%${kw}%` } }
          ]
        }
      }
    }

    if (dateRange) {
      if (dateRange.startTime && dateRange.endTime) {
        where.createdAt = {
          [Op.between]: [new Date(dateRange.startTime), new Date(dateRange.endTime)]
        }
      } else if (dateRange.startTime) {
        where.createdAt = { [Op.gte]: new Date(dateRange.startTime) }
      } else if (dateRange.endTime) {
        where.createdAt = { [Op.lte]: new Date(dateRange.endTime) }
      }
    }

    const finalWhere = extraCondition
      ? { [Op.and]: [where, extraCondition] }
      : where

    const { count, rows } = await AfterSale.findAndCountAll({
      where: finalWhere,
      include: [
        { model: Order, as: 'order' },
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
        { model: RefundFlow, as: 'refundFlows' },
        { model: AfterSaleAudit, as: 'audits', order: [['id', 'DESC']] }
      ],
      offset,
      limit,
      order: [['id', 'DESC']]
    })

    const resultList = []
    const abnormalIds = []

    for (const afterSale of rows) {
      const data = afterSale.toJSON()
      const abnormalReasons = []
      const order = data.order

      const duplicateCheck = await AfterSale.count({
        where: {
          orderId: afterSale.orderId,
          id: { [Op.ne]: afterSale.id },
          status: { [Op.notIn]: [2, 5] }
        }
      })
      if (duplicateCheck > 0) {
        abnormalReasons.push(`存在重复未关闭售后申请`)
      }

      if (order) {
        const paidAmount = parseFloat(order.paidAmount || order.amount || 0)
        const totalRefunds = await AfterSale.sum('finalRefundAmount', {
          where: {
            orderId: afterSale.orderId,
            status: { [Op.in]: [1, 3, 4] },
            id: { [Op.ne]: afterSale.id }
          }
        })
        const totalRefunded = parseFloat(totalRefunds || 0) + parseFloat(data.finalRefundAmount || 0)
        if (totalRefunded > paidAmount + 0.01) {
          abnormalReasons.push(`累计退款${totalRefunded}元超过支付金额${paidAmount}元`)
        }

        const payTime = order.payTime ? new Date(order.payTime) : null
        const createdAt = new Date(data.createdAt)
        if (payTime) {
          const daysSincePay = (createdAt - payTime) / (1000 * 60 * 60 * 24)
          if (daysSincePay > 30) {
            abnormalReasons.push(`超过支付后30天售后时效`)
          }
        }
      }

      const isAbnormal = abnormalReasons.length > 0
      data.isAbnormal = isAbnormal
      data.abnormalReasons = abnormalReasons

      if (isAbnormal) {
        abnormalIds.push(data.id)
        if (afterSale.isAbnormal !== 1) {
          await afterSale.update({
            isAbnormal: 1
          })
        }
        for (const flow of data.refundFlows || []) {
          const rf = await RefundFlow.findByPk(flow.id)
          if (rf && rf.isAbnormal !== 1) {
            await rf.update({
              isAbnormal: 1,
              abnormalReasons: JSON.stringify(abnormalReasons)
            })
          }
        }
      }

      resultList.push(data)
    }

    return {
      list: resultList,
      total: count,
      pageNum,
      pageSize,
      abnormalCount: abnormalIds.length,
      abnormalIds
    }
  }

  async getDetail(id) {
    const afterSale = await AfterSale.findByPk(id, {
      include: [
        { model: Order, as: 'order' },
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] },
        { model: RefundFlow, as: 'refundFlows' },
        { model: AfterSaleAudit, as: 'audits', order: [['id', 'ASC']] }
      ]
    })
    if (!afterSale) {
      throw new NotFoundError('售后申请不存在')
    }
    return afterSale
  }

  async getList(params = {}) {
    const {
      pageNum = 1,
      pageSize = 10,
      keyword,
      status,
      type,
      refundType,
      isLargeAmount,
      orderId,
      userId,
      dateRange
    } = params

    const where = {}
    const offset = (pageNum - 1) * pageSize
    const limit = Math.min(pageSize, 200)

    if (status !== undefined && status !== null && status !== '') {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (refundType) {
      where.refundType = refundType
    }
    if (isLargeAmount !== undefined && isLargeAmount !== null && isLargeAmount !== '') {
      where.isLargeAmount = isLargeAmount
    }
    if (orderId) {
      where.orderId = orderId
    }
    if (userId) {
      where.userId = userId
    }

    if (keyword) {
      const kw = keyword.trim()
      where[Op.or] = [
        { afterSaleNo: { [Op.like]: `%${kw}%` } },
        { orderNo: { [Op.like]: `%${kw}%` } },
        { applyReason: { [Op.like]: `%${kw}%` } }
      ]
    }

    if (dateRange) {
      if (dateRange.startTime && dateRange.endTime) {
        where.createdAt = {
          [Op.between]: [new Date(dateRange.startTime), new Date(dateRange.endTime)]
        }
      } else if (dateRange.startTime) {
        where.createdAt = { [Op.gte]: new Date(dateRange.startTime) }
      } else if (dateRange.endTime) {
        where.createdAt = { [Op.lte]: new Date(dateRange.endTime) }
      }
    }

    const { count, rows } = await AfterSale.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order' },
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] }
      ],
      offset,
      limit,
      order: [['id', 'DESC']]
    })

    return {
      list: rows,
      total: count,
      pageNum,
      pageSize
    }
  }
}

module.exports = new AfterSaleService()
