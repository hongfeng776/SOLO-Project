import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export function formatDate(
  date: string | number | Date | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateOnly(
  date: string | number | Date | undefined | null
): string {
  return formatDate(date, 'YYYY-MM-DD')
}

export function formatTimeOnly(
  date: string | number | Date | undefined | null
): string {
  return formatDate(date, 'HH:mm:ss')
}

export function timeAgo(date: string | number | Date | undefined | null): string {
  if (!date) return ''
  return dayjs(date).fromNow()
}

export function isToday(date: string | number | Date | undefined | null): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

export function isYesterday(date: string | number | Date | undefined | null): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

export function getStartOfDay(date: string | number | Date | undefined | null): Date {
  return dayjs(date || new Date()).startOf('day').toDate()
}

export function getEndOfDay(date: string | number | Date | undefined | null): Date {
  return dayjs(date || new Date()).endOf('day').toDate()
}

export function getDaysBetween(
  start: string | number | Date,
  end: string | number | Date
): number {
  return dayjs(end).diff(dayjs(start), 'day')
}

export function addDays(date: string | number | Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate()
}

export function subtractDays(date: string | number | Date, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate()
}
