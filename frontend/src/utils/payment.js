import { OrderPriorityEnum } from './enums'

export const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00'
  }
  const num = Number(amount)
  return num.toFixed(2)
}

export const getCountdownText = (expireTime) => {
  if (!expireTime) {
    return { text: '--', isUrgent: false, isExpired: false }
  }
  const now = Date.now()
  const expire = new Date(expireTime).getTime()
  const diff = expire - now

  if (diff <= 0) {
    return { text: '已过期', isUrgent: false, isExpired: true }
  }

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let text = ''
  if (hours > 0) {
    text = `${hours}时${String(minutes).padStart(2, '0')}分${String(seconds).padStart(2, '0')}秒`
  } else if (minutes > 0) {
    text = `${minutes}分${String(seconds).padStart(2, '0')}秒`
  } else {
    text = `${seconds}秒`
  }

  const isUrgent = totalSeconds < 300

  return { text, isUrgent, isExpired: false }
}

export const validateAmountPrecision = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, message: '请输入金额' }
  }
  const num = Number(amount)
  if (isNaN(num) || num <= 0) {
    return { valid: false, message: '金额必须大于0' }
  }
  const parts = String(amount).split('.')
  if (parts.length > 1 && parts[1].length > 2) {
    return { valid: false, message: '金额最多保留2位小数' }
  }
  return { valid: true, message: '' }
}

export const calculateActualAmount = (total, deductions, fees) => {
  const totalAmount = Number(total) || 0
  const deductionsAmount = Array.isArray(deductions)
    ? deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    : Number(deductions) || 0
  const feesAmount = Array.isArray(fees)
    ? fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
    : Number(fees) || 0

  const actual = totalAmount - deductionsAmount + feesAmount
  return Math.max(0, Number(actual.toFixed(2)))
}

export const checkDeductionRatio = (total, deductions, isHighEnd) => {
  const totalAmount = Number(total) || 0
  if (totalAmount <= 0) {
    return { valid: true, ratio: 0, exceeded: false, limit: 0 }
  }

  const deductionsAmount = Array.isArray(deductions)
    ? deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    : Number(deductions) || 0

  const ratio = deductionsAmount / totalAmount
  const limit = isHighEnd ? 0.3 : 0.5
  const exceeded = ratio > limit

  return {
    valid: !exceeded,
    ratio: Number((ratio * 100).toFixed(2)),
    exceeded,
    limit: limit * 100
  }
}

export const validateFeeStandard = (feeBase, feeRate, fixedFee, feeAmount) => {
  const base = Number(feeBase) || 0
  const rate = Number(feeRate) || 0
  const fixed = Number(fixedFee) || 0
  const amount = Number(feeAmount) || 0

  const calculated = base * rate + fixed
  const diff = Math.abs(amount - calculated)

  if (diff > 0.01) {
    return {
      valid: false,
      expected: Number(calculated.toFixed(2)),
      actual: amount,
      message: `手续费计算异常：预期 ¥${calculated.toFixed(2)}，实际 ¥${amount.toFixed(2)}`
    }
  }

  return { valid: true, expected: Number(calculated.toFixed(2)), actual: amount, message: '' }
}
