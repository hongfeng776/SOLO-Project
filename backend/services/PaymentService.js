const { Op } = require('sequelize')
const { sequelize } = require('../config/db')
const Order = require('../models/Order')
const User = require('../models/User')
const PaymentFlow = require('../models/PaymentFlow')
const PaymentDeduction = require('../models/PaymentDeduction')
const PaymentFee = require('../models/PaymentFee')
const Coupon = require('../models/Coupon')
const Notification = require('../models/Notification')
const businessLinkageService = require('./BusinessLinkageService')
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error')

const CHANNEL_FEE_RATES = {
  wechat: 0.006,
  alipay: 0.006,
  unionpay: 0.005,
  credit_card: 0.01,
  balance: 0
}

const CHANNEL_NAMES = {
  wechat: '微信支付',
  alipay: '支付宝',
  unionpay: '银联支付',
  credit_card: '信用卡',
  balance: '余额支付'
}

const generateFlowNo = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `FLW${timestamp}${random}`
}

const validateTransactionId = (channel, transactionId) => {
  if (!transactionId) return false
  switch (channel) {
    case 'wechat':
      return /^[0-9A-Za-z]{16,64}$/.test(transactionId)
    case 'alipay':
      return /^[0-9]{16,64}$/.test(transactionId)
    case 'unionpay':
      return /^[0-9]{16,32}$/.test(transactionId)
    case 'credit_card':
      return /^[0-9A-Za-z_-]{12,64}$/.test(transactionId)
    case 'balance':
      return /^[0-9A-Za-z_-]{8,64}$/.test(transactionId)
    default:
      return false
  }
}

const findAdminUser = async () => {
  const Role = require('../models/Role')
  const adminRole = await Role.findOne({ where: { code: 'admin' } })
  if (!adminRole) return null
  const adminUser = await User.findOne({ where: { roleId: adminRole.id } })
  return adminUser
}

const sendRiskNotification = async (title, content, relatedId = null) => {
  try {
    const adminUser = await findAdminUser()
    if (adminUser) {
      await Notification.create({
        userId: adminUser.id,
        type: 'system',
        title,
        content,
        relatedId,
        isRead: 0
      })
    }
  } catch (e) {
    console.error('发送风控通知失败:', e)
  }
}

class PaymentService {
  async initiatePayment(orderId, payData, operator) {
    const validated = payData
    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new NotFoundError('订单不存在')
    }
    if (order.status !== 0) {
      throw new ValidationError('订单状态异常，仅待支付订单可发起支付')
    }

    const { payType, channel, deductions = [], actualAmount, installmentCount, totalDeduction } = validated
    const orderAmount = parseFloat(order.amount || 0)
    const channelRate = CHANNEL_FEE_RATES[channel] || 0

    const transaction = await sequelize.transaction()

    try {
      const flows = []
      const now = new Date()

      if (payType === 'instant') {
        const flowNo = generateFlowNo()
        const baseFee = actualAmount
        const feeAmount = parseFloat((baseFee * channelRate).toFixed(2))
        const finalActual = parseFloat((actualAmount + feeAmount).toFixed(2))
        const couponDeduction = deductions.find(d => d.deductionType === 'coupon')

        const flow = await PaymentFlow.create({
          orderId,
          orderNo: order.orderNo,
          flowNo,
          payType: 'instant',
          channel,
          totalAmount: orderAmount,
          discountAmount: totalDeduction,
          couponId: couponDeduction?.couponId || null,
          couponAmount: couponDeduction ? parseFloat(couponDeduction.deductionAmount || 0) : 0,
          pointsAmount: deductions.find(d => d.deductionType === 'points') ? parseFloat(deductions.find(d => d.deductionType === 'points').deductionAmount || 0) : 0,
          feeAmount,
          feeRate: channelRate,
          actualAmount: finalActual,
          status: 0,
          expiredAt: order.paymentExpireTime || new Date(now.getTime() + 30 * 60 * 1000)
        }, { transaction })

        flows.push(flow)

        for (const deduction of deductions) {
          await PaymentDeduction.create({
            orderId,
            flowId: flow.id,
            deductionType: deduction.deductionType,
            deductionSource: deduction.deductionSource || (deduction.couponId ? String(deduction.couponId) : ''),
            deductionName: deduction.deductionName || deduction.deductionType,
            deductionAmount: parseFloat(deduction.deductionAmount || 0),
            deductionRate: deduction.deductionRate || null,
            applicableAmount: deduction.applicableAmount || null,
            ruleSnapshot: deduction.ruleSnapshot ? (typeof deduction.ruleSnapshot === 'string' ? deduction.ruleSnapshot : JSON.stringify(deduction.ruleSnapshot)) : null
          }, { transaction })
        }

        if (feeAmount > 0) {
          await PaymentFee.create({
            orderId,
            flowId: flow.id,
            feeType: 'channel',
            feeName: `${CHANNEL_NAMES[channel] || channel}渠道手续费`,
            feeBase: baseFee,
            feeRate: channelRate,
            fixedFee: 0,
            feeAmount,
            payer: 'user'
          }, { transaction })
        }
      } else if (payType === 'installment') {
        const count = installmentCount
        const perAmountRaw = parseFloat((actualAmount / count).toFixed(2))
        const installmentFeeRate = 0.003 * count
        const perBaseFee = perAmountRaw
        const perFee = parseFloat((perBaseFee * (channelRate + installmentFeeRate)).toFixed(2))

        for (let i = 0; i < count; i++) {
          let perActual = parseFloat((perAmountRaw + perFee).toFixed(2))
          if (i === count - 1) {
            const totalSoFar = flows.reduce((sum, f) => sum + parseFloat(f.actualAmount), 0)
            const expectedTotal = parseFloat(((actualAmount * (1 + channelRate + installmentFeeRate))).toFixed(2))
            perActual = parseFloat((expectedTotal - totalSoFar).toFixed(2))
          }

          const flowNo = generateFlowNo()
          const couponDeduction = i === 0 ? deductions.find(d => d.deductionType === 'coupon') : null

          const flow = await PaymentFlow.create({
            orderId,
            orderNo: order.orderNo,
            flowNo,
            payType: 'installment',
            channel,
            totalAmount: perAmountRaw,
            discountAmount: i === 0 ? totalDeduction : 0,
            couponId: couponDeduction?.couponId || null,
            couponAmount: couponDeduction ? parseFloat(couponDeduction.deductionAmount || 0) : 0,
            pointsAmount: 0,
            feeAmount: perFee,
            feeRate: channelRate + installmentFeeRate,
            actualAmount: perActual,
            status: 0,
            expiredAt: new Date(now.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000)
          }, { transaction })

          flows.push(flow)

          if (i === 0) {
            for (const deduction of deductions) {
              await PaymentDeduction.create({
                orderId,
                flowId: flow.id,
                deductionType: deduction.deductionType,
                deductionSource: deduction.deductionSource || (deduction.couponId ? String(deduction.couponId) : ''),
                deductionName: deduction.deductionName || deduction.deductionType,
                deductionAmount: parseFloat(deduction.deductionAmount || 0),
                deductionRate: deduction.deductionRate || null,
                applicableAmount: deduction.applicableAmount || null,
                ruleSnapshot: deduction.ruleSnapshot ? (typeof deduction.ruleSnapshot === 'string' ? deduction.ruleSnapshot : JSON.stringify(deduction.ruleSnapshot)) : null
              }, { transaction })
            }
          }

          if (perFee > 0) {
            await PaymentFee.create({
              orderId,
              flowId: flow.id,
              feeType: channel,
              feeName: `第${i + 1}期${CHANNEL_NAMES[channel] || channel}渠道手续费+分期手续费`,
              feeBase: perBaseFee,
              feeRate: channelRate + installmentFeeRate,
              fixedFee: 0,
              feeAmount: perFee,
              payer: 'user'
            }, { transaction })
          }
        }
      } else if (payType === 'difference') {
        const flowNo = generateFlowNo()
        const baseFee = actualAmount
        const feeAmount = parseFloat((baseFee * channelRate).toFixed(2))
        const finalActual = parseFloat((actualAmount + feeAmount).toFixed(2))

        const flow = await PaymentFlow.create({
          orderId,
          orderNo: order.orderNo,
          flowNo,
          payType: 'difference',
          channel,
          totalAmount: actualAmount,
          discountAmount: 0,
          couponId: null,
          couponAmount: 0,
          pointsAmount: 0,
          feeAmount,
          feeRate: channelRate,
          actualAmount: finalActual,
          status: 0,
          expiredAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }, { transaction })

        flows.push(flow)

        if (feeAmount > 0) {
          await PaymentFee.create({
            orderId,
            flowId: flow.id,
            feeType: 'channel',
            feeName: `补差支付${CHANNEL_NAMES[channel] || channel}渠道手续费`,
            feeBase: baseFee,
            feeRate: channelRate,
            fixedFee: 0,
            feeAmount,
            payer: 'user'
          }, { transaction })
        }
      }

      await transaction.commit()

      const resultFlows = []
      for (const flow of flows) {
        const fullFlow = await PaymentFlow.findByPk(flow.id, {
          include: [
            { model: PaymentDeduction, as: 'deductions' },
            { model: PaymentFee, as: 'fees' }
          ]
        })
        resultFlows.push(fullFlow)
      }

      return {
        orderId,
        orderNo: order.orderNo,
        payType,
        channel,
        flows: resultFlows
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async confirmPayment(flowId, transactionId, operator) {
    const flow = await PaymentFlow.findByPk(flowId)
    if (!flow) {
      throw new NotFoundError('支付流水不存在')
    }
    if (flow.status === 1) {
      throw new ValidationError('该流水已支付成功，请勿重复操作')
    }
    if (flow.status === 3) {
      throw new ValidationError('该流水已退款，无法确认支付')
    }

    const successFlows = await PaymentFlow.count({
      where: {
        orderId: flow.orderId,
        status: 1,
        id: { [Op.ne]: flowId }
      }
    })

    if (successFlows >= 1) {
      await flow.update({
        status: 2,
        isRepeated: 1,
        failCode: 'repeated_payment',
        failReason: '检测到重复支付'
      })
      await sendRiskNotification(
        '重复支付预警',
        `订单${flow.orderNo}检测到重复支付，流水号:${flow.flowNo}，交易号:${transactionId}`,
        flow.orderId
      )
      throw new ValidationError('检测到重复支付，已拒绝本次支付')
    }

    const isFake = !validateTransactionId(flow.channel, transactionId)
    if (isFake) {
      await flow.update({
        status: 2,
        isFake: 1,
        failCode: 'fake_transaction',
        failReason: '交易号格式校验失败，疑似虚假流水'
      })
      await sendRiskNotification(
        '虚假流水预警',
        `检测到虚假支付流水，订单:${flow.orderNo}，流水:${flow.flowNo}，交易号:${transactionId}`,
        flow.id
      )
      throw new ValidationError('交易号无效，疑似虚假流水')
    }

    const transaction = await sequelize.transaction()
    try {
      const now = new Date()
      await flow.update({
        status: 1,
        transactionId,
        paidAt: now
      }, { transaction })

      await businessLinkageService.linkPaymentSuccess(flow.orderId, flow.id, operator)

      await transaction.commit()

      const resultFlow = await PaymentFlow.findByPk(flow.id, {
        include: [
          { model: PaymentDeduction, as: 'deductions' },
          { model: PaymentFee, as: 'fees' }
        ]
      })

      return {
        success: true,
        flow: resultFlow,
        message: '支付成功'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async failPayment(flowId, failCode, failReason, operator) {
    const flow = await PaymentFlow.findByPk(flowId)
    if (!flow) {
      throw new NotFoundError('支付流水不存在')
    }
    if (flow.status === 1) {
      throw new ValidationError('该流水已支付成功，无法标记为失败')
    }
    if (flow.status === 2) {
      throw new ValidationError('该流水已为失败状态')
    }

    const validFailCodes = ['insufficient_balance', 'channel_error', 'timeout', 'user_cancel', 'repeated_payment', 'fake_transaction']
    if (!validFailCodes.includes(failCode)) {
      throw new ValidationError(`失败错误码无效，仅支持: ${validFailCodes.join(', ')}`)
    }

    const transaction = await sequelize.transaction()
    try {
      await flow.update({
        status: 2,
        failCode,
        failReason: failReason || ''
      }, { transaction })

      await businessLinkageService.linkPaymentFail(flow.orderId, flow.id, failCode, failReason, operator)

      await transaction.commit()

      return {
        success: true,
        flow,
        message: '支付失败已记录'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  async batchRemindPayment(ids, operator) {
    const roleCode = operator?.roleCode
    if (!['admin', 'operator'].includes(roleCode)) {
      throw new ForbiddenError('仅管理员和运营人员可批量提醒支付')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的订单')
    }

    let successCount = 0
    let failCount = 0
    const failedIds = []
    const now = new Date()

    for (const id of ids) {
      try {
        const order = await Order.findByPk(id)
        if (!order) {
          failedIds.push(id)
          failCount++
          continue
        }
        if (order.status !== 0) {
          failedIds.push(id)
          failCount++
          continue
        }
        await order.update({
          lastRemindTime: now,
          remindCount: (order.remindCount || 0) + 1
        })
        await businessLinkageService.createOrderLog(
          id,
          'remind_payment',
          order.status,
          order.status,
          operator,
          { remindCount: (order.remindCount || 0) + 1 },
          '系统提醒用户支付'
        )
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

  async batchCancelTimeout(ids, operator) {
    const roleCode = operator?.roleCode
    if (roleCode !== 'admin') {
      throw new ForbiddenError('仅管理员可批量取消超时订单')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的订单')
    }

    let successCount = 0
    let failCount = 0
    const failedIds = []
    let skippedHighPriorityCount = 0
    const now = new Date()

    for (const id of ids) {
      try {
        const order = await Order.findByPk(id)
        if (!order) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (order.isHighPriority === 1) {
          skippedHighPriorityCount++
          failedIds.push(id)
          failCount++
          continue
        }

        if (order.status !== 0) {
          failedIds.push(id)
          failCount++
          continue
        }

        if (!order.paymentExpireTime || now <= new Date(order.paymentExpireTime)) {
          if (order.paymentTimeoutExempt === 1) {
            failedIds.push(id)
            failCount++
            continue
          }
          if (!order.paymentExpireTime) {
            failedIds.push(id)
            failCount++
            continue
          }
        }

        if (order.paymentTimeoutExempt === 1) {
          failedIds.push(id)
          failCount++
          continue
        }

        const fromStatus = order.status
        await order.update({ status: 2 })
        await businessLinkageService.restoreInventory(order.category, order.productId, order.quantity || 1)
        await businessLinkageService.createOrderLog(
          id,
          'cancel_timeout',
          fromStatus,
          2,
          operator,
          { reason: 'timeout' },
          '批量取消超时未支付订单'
        )
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
      skippedHighPriorityCount
    }
  }

  async batchExemptTimeout(ids, operator) {
    const roleCode = operator?.roleCode
    if (roleCode !== 'admin') {
      throw new ForbiddenError('仅管理员可批量豁免支付超时限制')
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请选择要操作的订单')
    }

    let successCount = 0
    let failCount = 0
    const failedIds = []

    for (const id of ids) {
      try {
        const order = await Order.findByPk(id)
        if (!order) {
          failedIds.push(id)
          failCount++
          continue
        }
        await order.update({ paymentTimeoutExempt: 1 })
        await businessLinkageService.createOrderLog(
          id,
          'exempt_timeout',
          order.status,
          order.status,
          operator,
          null,
          '管理员豁免支付超时限制'
        )
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

  async tracePaymentFlows(keyword, orderId, operator) {
    const where = {}

    if (orderId) {
      where.orderId = orderId
    }

    let extraCondition = null

    if (keyword) {
      const kw = keyword.trim()
      if (/^FLW\d+/.test(kw)) {
        where.flowNo = kw
      } else if (/^ORD/.test(kw)) {
        where.orderNo = kw
      } else if (/^1\d{10}$/.test(kw)) {
        const users = await User.findAll({ where: { phone: kw } })
        const userIds = users.map(u => u.id)
        const orders = await Order.findAll({ where: { userId: { [Op.in]: userIds } } })
        const orderIds = orders.map(o => o.id)
        if (orderIds.length > 0) {
          where.orderId = { [Op.in]: orderIds }
        } else {
          where.orderId = -1
        }
      } else {
        extraCondition = {
          [Op.or]: [
            { transactionId: { [Op.like]: `%${kw}%` } },
            { flowNo: { [Op.like]: `%${kw}%` } },
            { orderNo: { [Op.like]: `%${kw}%` } }
          ]
        }
      }
    }

    const finalWhere = extraCondition
      ? { [Op.and]: [where, extraCondition] }
      : where

    const flows = await PaymentFlow.findAll({
      where: finalWhere,
      include: [
        { model: PaymentDeduction, as: 'deductions' },
        { model: PaymentFee, as: 'fees' },
        { model: Order, as: 'order' }
      ],
      order: [['id', 'DESC']]
    })

    const resultFlows = []
    const abnormalFlowIds = []

    for (const flow of flows) {
      const flowData = flow.toJSON()
      const abnormalReasons = []
      const order = flowData.order
      const totalAmount = parseFloat(flowData.totalAmount || 0)
      const actualAmount = parseFloat(flowData.actualAmount || 0)

      let totalDeduct = 0
      for (const d of flowData.deductions || []) {
        totalDeduct += parseFloat(d.deductionAmount || 0)
      }
      totalDeduct = parseFloat(totalDeduct.toFixed(2))

      let totalFee = 0
      for (const f of flowData.fees || []) {
        totalFee += parseFloat(f.feeAmount || 0)
      }
      totalFee = parseFloat(totalFee.toFixed(2))

      const expectedActual = parseFloat((totalAmount - totalDeduct + totalFee).toFixed(2))
      if (Math.abs(actualAmount - expectedActual) > 0.01) {
        abnormalReasons.push(`支付金额校验失败: 实际${actualAmount}，预期${expectedActual}`)
      }

      if (order) {
        const orderAmt = parseFloat(order.amount || 0)
        const deductRate = orderAmt > 0 ? totalDeduct / orderAmt : 0
        const maxRate = order.isHighPriority === 1 ? 0.3 : 0.5
        if (deductRate > maxRate + 0.0001) {
          abnormalReasons.push(`抵扣比例异常: 实际${(deductRate * 100).toFixed(2)}%，上限${(maxRate * 100).toFixed(0)}%`)
        }
      }

      for (const f of flowData.fees || []) {
        const base = parseFloat(f.feeBase || 0)
        const rate = parseFloat(f.feeRate || 0)
        const fixed = parseFloat(f.fixedFee || 0)
        const expectedFee = parseFloat((base * rate + fixed).toFixed(2))
        const actualFee = parseFloat(f.feeAmount || 0)
        if (Math.abs(expectedFee - actualFee) > 0.01) {
          abnormalReasons.push(`手续费异常:${f.feeName} 应为${expectedFee}，实际${actualFee}`)
        }
      }

      const isAbnormal = abnormalReasons.length > 0
      flowData.isAbnormal = isAbnormal
      flowData.abnormalReasons = abnormalReasons

      if (isAbnormal) {
        abnormalFlowIds.push(flowData.id)
        if (flow.isAbnormal !== 1) {
          await flow.update({
            isAbnormal: 1,
            abnormalReasons: JSON.stringify(abnormalReasons)
          })
        }
      }

      resultFlows.push(flowData)
    }

    if (abnormalFlowIds.length > 0) {
      await sendRiskNotification(
        '支付流水异常预警',
        `溯源查询发现${abnormalFlowIds.length}条异常支付流水，流水ID:${abnormalFlowIds.join(',')}`,
        null
      )
    }

    return {
      flows: resultFlows,
      abnormalCount: abnormalFlowIds.length
    }
  }

  async getFlowDetail(flowId, operator) {
    const flow = await PaymentFlow.findByPk(flowId, {
      include: [
        { model: PaymentDeduction, as: 'deductions' },
        { model: PaymentFee, as: 'fees' },
        { model: Order, as: 'order', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'phone'] }] }
      ]
    })
    if (!flow) {
      throw new NotFoundError('支付流水不存在')
    }
    return flow
  }

  async getOrderFlows(orderId, operator) {
    const order = await Order.findByPk(orderId)
    if (!order) {
      throw new NotFoundError('订单不存在')
    }
    const flows = await PaymentFlow.findAll({
      where: { orderId },
      include: [
        { model: PaymentDeduction, as: 'deductions' },
        { model: PaymentFee, as: 'fees' }
      ],
      order: [['id', 'ASC']]
    })
    return {
      order,
      flows
    }
  }
}

module.exports = new PaymentService()
