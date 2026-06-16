import dayjs from 'dayjs'

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const TIME_FORMAT = 'HH:mm:ss'

export function formatDate(date: Date | string | number, format: string = DATE_FORMAT): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, DATETIME_FORMAT)
}

export function formatTime(date: Date | string | number): string {
  return formatDate(date, TIME_FORMAT)
}

export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return ''
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'minute')

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  if (diff < 43200) return `${Math.floor(diff / 1440)}天前`
  return formatDateTime(date)
}
