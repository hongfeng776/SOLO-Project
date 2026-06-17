const { Op } = require('sequelize')
const Order = require('../models/Order')
const User = require('../models/User')
const AfterSale = require('../models/AfterSale')
const { ValidationError } = require('../utils/error')

const ALLOWED_TYPES = ['not_fulfilled', 'partial_fulfilled', 'full_fulfilled']
const ALLOWED_REFUND_TYPES = ['full', 'partial']
const REFUND_RATE_LIMITS = {
  not_fulfilled: 1.0,
  partial_fulfilled: 0.7,
  full_fulfilled: 0.5
}

const checkAfterSalePreconditions = async (req, res, next) => {
  try {
    const { orderId, type } = req.body

    if (!orderId) {
      throw new ValidationError('订单ID不能为空')
    }

    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new ValidationError('订单不存在')
    }

    if (![1, 3, 4].includes(order.status)) {
      throw new ValidationError('订单状态异常，仅已支付(1)、已完成(3)、已履约(4)订单可申请售后')
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
      throw new ValidationError(`履约状态参数无效，仅支持 ${ALLOWED_TYPES.join(', ')}`)
    }

    if (type === 'not_fulfilled' && [3, 4].includes(order.status)) {
      throw new ValidationError('订单已履约，不能选择"未履约退款"类型')
    }
    if (type === 'full_fulfilled' && order.status === 1) {
      throw new ValidationError('订单尚未履约，不能选择"完全履约退款"类型')
    }

    const now = new Date()
    const payTime = order.payTime ? new Date(order.payTime) : null

    if (!payTime) {
      throw new ValidationError('订单支付时间缺失，无法申请售后')
    }

    const daysSincePay = (now - payTime) / (1000 * 60 * 60 * 24)
    if (daysSincePay > 30) {
      throw new ValidationError('已超过支付后30天售后时效，无法申请退款')
    }

    if (type !== 'not_fulfilled' && [3, 4].includes(order.status)) {
      const fulfillTime = order.updatedAt ? new Date(order.updatedAt) : payTime
      const daysSinceFulfill = (now - fulfillTime) / (1000 * 60 * 60 * 24)
      if (daysSinceFulfill > 7) {
        throw new ValidationError('已超过履约后7天售后时效，无法申请退款')
      }
    }

    const user = await User.findByPk(order.userId)
    if (!user || user.status !== 1) {
      throw new ValidationError('用户账户状态异常，无法申请售后退款')
    }

    const existingAfterSale = await AfterSale.findOne({
      where: {
        orderId,
        status: { [Op.notIn]: [2, 4, 5] }
      }
    })
    if (existingAfterSale) {
      throw new ValidationError(`该订单已有未关闭的售后申请(单号:${existingAfterSale.afterSaleNo})，请勿重复申请`)
    }

    req.order = order
    next()
  } catch (error) {
    next(error)
  }
}

const validateAfterSaleParams = async (req, res, next) => {
  try {
    const { refundType, applyAmount, applyReason } = req.body
    const order = req.order
    const type = req.body.type

    if (!refundType || !ALLOWED_REFUND_TYPES.includes(refundType)) {
      throw new ValidationError(`退款类型参数无效，仅支持 ${ALLOWED_REFUND_TYPES.join(', ')}`)
    }

    if (!applyReason || applyReason.trim().length === 0) {
      throw new ValidationError('申请退款原因不能为空')
    }

    if (applyAmount === undefined || applyAmount === null) {
      throw new ValidationError('申请退款金额不能为空')
    }

    const amountStr = String(applyAmount)
    if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
      throw new ValidationError('申请退款金额必须精确到小数点后2位')
    }

    const applyAmt = parseFloat(applyAmount)
    if (applyAmt <= 0) {
      throw new ValidationError('申请退款金额必须大于0')
    }

    const orderAmount = parseFloat(order.amount || 0)
    const paidAmount = parseFloat(order.paidAmount || orderAmount)

    const existingRefunds = await AfterSale.sum('finalRefundAmount', {
      where: {
        orderId: order.id,
        status: { [Op.in]: [1, 3, 4] }
      }
    })
    const totalRefunded = parseFloat(existingRefunds || 0)
    const remainingRefundable = parseFloat((paidAmount - totalRefunded).toFixed(2))

    if (remainingRefundable <= 0) {
      throw new ValidationError('该订单已无可退余额')
    }

    if (applyAmt > remainingRefundable + 0.01) {
      throw new ValidationError(`申请退款金额超过剩余可退额度，剩余可退${remainingRefundable}元`)
    }

    const maxRate = REFUND_RATE_LIMITS[type] || 0
    const maxRefundByType = parseFloat((paidAmount * maxRate).toFixed(2))

    if (applyAmt > maxRefundByType + 0.01) {
      const typeName = {
        not_fulfilled: '未履约',
        partial_fulfilled: '部分履约',
        full_fulfilled: '完全履约'
      }[type] || type
      throw new ValidationError(`${typeName}最高可退${(maxRate * 100).toFixed(0)}%，最大可退${maxRefundByType}元`)
    }

    const now = new Date()
    const payTime = order.payTime ? new Date(order.payTime) : now
    const hoursSincePay = (now - payTime) / (1000 * 60 * 60)
    let penaltyRate = 0
    if (hoursSincePay <= 24) {
      penaltyRate = 0.10
    } else if (hoursSincePay <= 24 * 7) {
      penaltyRate = 0.05
    }

    const penaltyAmount = parseFloat((applyAmt * penaltyRate).toFixed(2))
    const finalRefundAmount = parseFloat((applyAmt - penaltyAmount).toFixed(2))

    if (finalRefundAmount < 0) {
      throw new ValidationError('退款金额计算异常，请检查参数')
    }

    const isLargeAmount = finalRefundAmount >= 5000 ? 1 : 0

    req.validatedData = {
      type,
      refundType,
      applyAmount: applyAmt,
      applyReason: applyReason.trim(),
      applyImages: req.body.applyImages || null,
      penaltyAmount,
      finalRefundAmount,
      isLargeAmount,
      remainingRefundable,
      totalRefunded
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  checkAfterSalePreconditions,
  validateAfterSaleParams
}
