import dayjs from 'dayjs'
import { DATETIME_FORMAT, DATE_FORMAT } from '@/constants'

export function formatMoney(
  value: number | string | null | undefined,
  decimals: number = 2,
  symbol: string = '¥'
): string {
  if (value === null || value === undefined || value === '') return `${symbol}0.00`
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${symbol}0.00`
  const negative = num < 0
  const absNum = Math.abs(num)
  const fixed = absNum.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const result = decPart ? `${formatted}.${decPart}` : formatted
  return `${negative ? '-' : ''}${symbol}${result}`
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  const fixed = num.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (decimals === 0) return formatted
  return decPart ? `${formatted}.${decPart}` : formatted
}

export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 2,
  withSign: boolean = true
): string {
  if (value === null || value === undefined || value === '') return '0.00%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00%'
  const fixed = num.toFixed(decimals)
  if (withSign && num > 0) {
    return `+${fixed}%`
  }
  return `${fixed}%`
}

export function formatRate(value: number | string, precision = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.0000%'
  return `${(num * 100).toFixed(precision)}%`
}

export function formatChangeRate(
  value: number | string | null | undefined
): { text: string; color: string } {
  if (value === null || value === undefined || value === '') {
    return { text: '0.00%', color: '#909399' }
  }
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return { text: '0.00%', color: '#909399' }

  const formatted = num.toFixed(2)
  if (num > 0) {
    return { text: `+${formatted}%`, color: '#F56C6C' }
  } else if (num < 0) {
    return { text: `${formatted}%`, color: '#67C23A' }
  } else {
    return { text: `${formatted}%`, color: '#909399' }
  }
}

export function formatVolume(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`
  }
  return num.toFixed(0)
}

export function formatLargeNumber(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)}亿`
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`
  }
  return num.toFixed(2)
}

export function formatMarketCap(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return value.toFixed(2)
}

export function formatDate(date: string | Date, format = DATE_FORMAT): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  return dayjs(date).format(DATETIME_FORMAT)
}

export function parseMoney(value: string): number {
  if (!value) return 0
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0
}
