import dayjs from 'dayjs'
import { DATETIME_FORMAT, DATE_FORMAT } from '@/constants'

export function formatMoney(value: number | string, precision = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  const fixed = num.toFixed(precision)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${formatted}.${decPart}` : formatted
}

export function formatRate(value: number | string, precision = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.0000%'
  return `${(num * 100).toFixed(precision)}%`
}

export function formatPercent(value: number | string, precision = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00%'
  return `${num.toFixed(precision)}%`
}

export function formatDate(date: string | Date, format = DATE_FORMAT): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format(DATETIME_FORMAT)
}

export function formatVolume(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return value.toFixed(0)
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

export function formatChangeRate(rate: number): string {
  const formatted = rate.toFixed(2)
  return rate > 0 ? `+${formatted}%` : `${formatted}%`
}

export function parseMoney(value: string): number {
  return parseFloat(value.replace(/,/g, ''))
}
