import {
  PenaltyRuleEnum,
  RefundRatioEnum,
  AfterSaleTypeEnum,
  AfterSaleStatusEnum,
  AfterSaleAuditActionEnum,
  getEnumLabel
} from './enums'
import { formatAmount } from './payment'

const getPenaltyRule = (payTime) => {
  if (!payTime) {
    return PenaltyRuleEnum.OVER_7D
  }
  const now = Date.now()
  const pay = new Date(payTime).getTime()
  const diffMs = now - pay
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours <= 24) {
    return PenaltyRuleEnum.WITHIN_24H
  } else if (diffDays <= 7) {
    return PenaltyRuleEnum.WITHIN_7D
  } else {
    return PenaltyRuleEnum.OVER_7D
  }
}

export const calculatePenalty = (payTime, orderAmount) => {
  const rule = getPenaltyRule(payTime)
  const amount = Number(orderAmount) || 0
  const penaltyAmount = Number((amount * rule.value).toFixed(2))

  return {
    penaltyAmount,
    ruleLabel: rule.label,
    rateLabel: rule.rateLabel
  }
}

export const getMaxRefundable = (afterSaleType, orderAmount, refundedAmount = 0) => {
  const typeItem = Object.values(AfterSaleTypeEnum).find((item) => item.value === afterSaleType)
  const ratioKey = typeItem ? Object.keys(AfterSaleTypeEnum).find((key) => AfterSaleTypeEnum[key].value === afterSaleType) : null
  const ratio = ratioKey && RefundRatioEnum[ratioKey] ? RefundRatioEnum[ratioKey].value : 0
  const amount = Number(orderAmount) || 0
  const refunded = Number(refundedAmount) || 0
  const maxByRatio = Number((amount * ratio).toFixed(2))
  const maxRefundable = Number(Math.max(0, maxByRatio - refunded).toFixed(2))

  return maxRefundable
}

export const validateRefundAmount = (applyAmount, maxRefundable, orderAmount) => {
  if (applyAmount === null || applyAmount === undefined || applyAmount === '') {
    return { valid: false, message: '请输入退款金额', finalAmount: 0 }
  }
  const num = Number(applyAmount)
  if (isNaN(num) || num <= 0) {
    return { valid: false, message: '退款金额必须大于0', finalAmount: 0 }
  }
  const parts = String(applyAmount).split('.')
  if (parts.length > 1 && parts[1].length > 2) {
    return { valid: false, message: '退款金额最多保留2位小数', finalAmount: 0 }
  }
  const order = Number(orderAmount) || 0
  if (num > order) {
    return { valid: false, message: `退款金额不能超过订单金额 ¥${formatAmount(order)}`, finalAmount: 0 }
  }
  const max = Number(maxRefundable) || 0
  if (num > max) {
    return {
      valid: false,
      message: `退款金额不能超过最大可退金额 ¥${formatAmount(max)}`,
      finalAmount: 0
    }
  }
  return { valid: true, message: '', finalAmount: Number(num.toFixed(2)) }
}

export const getPenaltyRuleLabel = (payTime) => {
  const rule = getPenaltyRule(payTime)
  return `当前违约金规则：${rule.label}，收取${rule.rateLabel}`
}

export const getRefundRatioLabel = (afterSaleType) => {
  const typeItem = Object.values(AfterSaleTypeEnum).find((item) => item.value === afterSaleType)
  if (!typeItem) {
    return '未知售后类型'
  }
  const ratioKey = Object.keys(AfterSaleTypeEnum).find((key) => AfterSaleTypeEnum[key].value === afterSaleType)
  const ratio = ratioKey && RefundRatioEnum[ratioKey] ? RefundRatioEnum[ratioKey] : null
  if (!ratio) {
    return `${typeItem.label}：暂无比例信息`
  }
  return `${typeItem.label}退款比例上限：${ratio.rateLabel}`
}

export const isLargeAmount = (refundAmount) => {
  const amount = Number(refundAmount) || 0
  return amount >= 5000
}

export const formatRefundTimeline = (auditLogs) => {
  if (!Array.isArray(auditLogs) || auditLogs.length === 0) {
    return []
  }
  return auditLogs
    .slice()
    .sort((a, b) => new Date(a.createTime || a.time || 0) - new Date(b.createTime || b.time || 0))
    .map((log, index) => {
      const action = log.action || log.auditAction
      const status = log.status !== undefined ? log.status : log.afterSaleStatus
      const actionLabel = action ? getEnumLabel(AfterSaleAuditActionEnum, action) : ''
      const statusLabel = status !== undefined ? getEnumLabel(AfterSaleStatusEnum, status) : ''
      const operator = log.operator || log.auditor || log.operatorName || '系统'
      const time = log.createTime || log.time || log.auditTime || ''
      const remark = log.remark || log.reason || log.auditRemark || ''

      return {
        index: index + 1,
        action,
        actionLabel,
        status,
        statusLabel,
        operator,
        time,
        remark,
        color: status !== undefined
          ? (Object.values(AfterSaleStatusEnum).find((item) => item.value === status)?.color || '#909399')
          : '#1890ff'
      }
    })
}
