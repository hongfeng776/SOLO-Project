import { StatsPeriodEnum } from './enums'

export function formatThousand(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  const parts = Number(num).toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0%'
  return Number(num).toFixed(decimals) + '%'
}

export function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '¥0.00'
  return '¥' + formatThousand(Number(num).toFixed(2))
}

export function generateExportFilename(period) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const timestamp = `${year}${month}${day}_${hours}${minutes}`
  const periodLabels = {
    [StatsPeriodEnum.DAY.value]: StatsPeriodEnum.DAY.label,
    [StatsPeriodEnum.WEEK.value]: StatsPeriodEnum.WEEK.label,
    [StatsPeriodEnum.MONTH.value]: StatsPeriodEnum.MONTH.label,
    [StatsPeriodEnum.CUSTOM.value]: StatsPeriodEnum.CUSTOM.label
  }
  const periodLabel = periodLabels[period] || '统计'
  return `订单数据_${periodLabel}_${timestamp}.xlsx`
}

export default {
  formatThousand,
  formatPercent,
  formatCurrency,
  generateExportFilename
}
