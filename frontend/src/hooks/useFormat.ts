import { computed, type Ref } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const TIME_FORMAT = 'HH:mm:ss'

export function formatDate(date: string | Date | Dayjs | number | null | undefined, format = DATE_FORMAT): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date | Dayjs | number | null | undefined): string {
  return formatDate(date, DATETIME_FORMAT)
}

export function fromNow(date: string | Date | Dayjs | number | null | undefined): string {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export function useDateTime() {
  const fDate = (date: Ref<string | Date | null | undefined> | string | Date | null | undefined, format = DATE_FORMAT) => {
    return computed(() => {
      const val = date != null && typeof date === 'object' && 'value' in date ? (date as Ref).value : date
      return formatDate(val ?? null, format)
    })
  }

  const fDateTime = (date: Ref<string | Date | null | undefined> | string | Date | null | undefined) => {
    return computed(() => {
      const val = date != null && typeof date === 'object' && 'value' in date ? (date as Ref).value : date
      return formatDateTime(val)
    })
  }

  const fFromNow = (date: Ref<string | Date | null | undefined> | string | Date | null | undefined) => {
    return computed(() => {
      const val = date != null && typeof date === 'object' && 'value' in date ? (date as Ref).value : date
      return fromNow(val ?? null)
    })
  }

  return {
    fDate,
    fDateTime,
    fFromNow,
    formatDate,
    formatDateTime,
    fromNow,
    dayjs
  }
}

export function useNumberFormat() {
  const formatNumber = (num: number | null | undefined, decimals = 0): string => {
    if (num == null) return '-'
    return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatCompact = (num: number | null | undefined): string => {
    if (num == null) return '-'
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return String(num)
  }

  const formatPercent = (num: number | null | undefined, decimals = 2): string => {
    if (num == null) return '-'
    return (num * 100).toFixed(decimals) + '%'
  }

  const formatMoney = (amount: number | null | undefined, decimals = 2): string => {
    if (amount == null) return '-'
    return '¥' + formatNumber(amount, decimals)
  }

  return {
    formatNumber,
    formatCompact,
    formatPercent,
    formatMoney
  }
}
