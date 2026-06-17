const Order = require('../models/Order')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const { ValidationError } = require('../utils/error')

const ALLOWED_CHANNELS = ['wechat', 'alipay', 'unionpay', 'credit_card', 'balance']
const ALLOWED_PAY_TYPES = ['instant', 'installment', 'difference']

const checkPaymentPreconditions = async (req, res, next) => {
  try {
    const { orderId } = req.body
    if (!orderId) {
      throw new ValidationError('订单ID不能为空')
    }

    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new ValidationError('订单不存在')
    }

    if (order.status !== 0) {
      throw new ValidationError('订单状态异常，仅待支付订单可发起支付')
    }

    const now = new Date()
    if (order.paymentExpireTime && now > new Date(order.paymentExpireTime) && order.paymentTimeoutExempt !== 1) {
      throw new ValidationError('支付时效已过期，请联系管理员豁免或重新下单')
    }

    const user = await User.findByPk(order.userId)
    if (!user || user.status !== 1) {
      throw new ValidationError('用户账户状态异常，无法支付')
    }

    req.order = order
    next()
  } catch (error) {
    next(error)
  }
}

const validatePaymentParams = async (req, res, next) => {
  try {
    const { payType, channel, deductions = [], actualAmount, installmentCount } = req.body
    const order = req.order

    if (!payType || !ALLOWED_PAY_TYPES.includes(payType)) {
      throw new ValidationError('支付类型参数无效，仅支持 instant/installment/difference')
    }

    if (!channel || !ALLOWED_CHANNELS.includes(channel)) {
      throw new ValidationError(`支付渠道参数无效，仅支持 ${ALLOWED_CHANNELS.join(', ')}`)
    }

    if (actualAmount === undefined || actualAmount === null) {
      throw new ValidationError('实际支付金额不能为空')
    }

    const amountStr = String(actualAmount)
    if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
      throw new ValidationError('实际支付金额必须精确到小数点后2位')
    }

    const actualAmt = parseFloat(actualAmount)
    if (actualAmt <= 0) {
      throw new ValidationError('实际支付金额必须大于0')
    }

    if (payType === 'installment') {
      if (!installmentCount || installmentCount < 1 || installmentCount > 24) {
        throw new ValidationError('分期期数必须在1-24之间')
      }
      if (!Number.isInteger(installmentCount)) {
        throw new ValidationError('分期期数必须是整数')
      }
    }

    if (payType === 'difference') {
      const paid = parseFloat(order.paidAmount || 0)
      const orderAmount = parseFloat(order.amount || 0)
      if (paid + actualAmt > orderAmount + 0.01) {
        throw new ValidationError('补差支付金额超过订单剩余应付金额')
      }
    }

    let totalDeduction = 0
    const couponIds = []

    for (const deduction of deductions) {
      const dAmount = parseFloat(deduction.deductionAmount || 0)
      if (dAmount < 0) {
        throw new ValidationError(`抵扣项 ${deduction.deductionName || ''} 金额不能为负数`)
      }
      totalDeduction += dAmount

      if (deduction.deductionType === 'coupon' && deduction.couponId) {
        couponIds.push(deduction.couponId)
      }
    }

    totalDeduction = parseFloat(totalDeduction.toFixed(2))
    const orderAmount = parseFloat(order.amount || 0)

    const maxDeductionRate = order.isHighPriority === 1 ? 0.3 : 0.5
    const maxDeductionAmount = parseFloat((orderAmount * maxDeductionRate).toFixed(2))

    if (totalDeduction > maxDeductionAmount + 0.01) {
      const typeName = order.isHighPriority === 1 ? '高端商旅订单' : '普通订单'
      throw new ValidationError(`${typeName}总抵扣金额不得超过订单金额的${maxDeductionRate * 100}%，最大抵扣${maxDeductionAmount}元`)
    }

    if (couponIds.length > 0) {
      const coupons = await Coupon.findAll({
        where: { id: couponIds }
      })

      for (const cid of couponIds) {
        const coupon = coupons.find(c => c.id === cid)
        const deduction = deductions.find(d => d.couponId === cid)

        if (!coupon) {
          throw new ValidationError(`优惠券ID:${cid} 不存在`)
        }
        if (coupon.status !== 1) {
          throw new ValidationError(`优惠券 ${coupon.name || cid} 不可用`)
        }
        if (coupon.remainStock <= 0) {
          throw new ValidationError(`优惠券 ${coupon.name} 库存不足`)
        }
        if (coupon.category !== 'all' && coupon.category !== order.category) {
          throw new ValidationError(`优惠券 ${coupon.name} 不适用当前品类 ${order.category}`)
        }
        if (orderAmount < parseFloat(coupon.minAmount || 0)) {
          throw new ValidationError(`优惠券 ${coupon.name} 未达到最低消费 ${coupon.minAmount} 元`)
        }
        const now = new Date()
        if (coupon.startTime && now < new Date(coupon.startTime)) {
          throw new ValidationError(`优惠券 ${coupon.name} 尚未生效`)
        }
        if (coupon.endTime && now > new Date(coupon.endTime)) {
          throw new ValidationError(`优惠券 ${coupon.name} 已过期`)
        }
      }
    }

    req.validatedData = {
      payType,
      channel,
      deductions,
      actualAmount: actualAmt,
      installmentCount,
      totalDeduction
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  checkPaymentPreconditions,
  validatePaymentParams
}
