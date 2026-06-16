import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatDate = (date: any, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatDateTime = (date: any, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatTime = (date: any, format: string = 'HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const fromNow = (date: any): string => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

export const getDayStart = (date: any = new Date()): Date => {
  return dayjs(date).startOf('day').toDate()
}

export const getDayEnd = (date: any = new Date()): Date => {
  return dayjs(date).endOf('day').toDate()
}

export const getMonthStart = (date: any = new Date()): Date => {
  return dayjs(date).startOf('month').toDate()
}

export const getMonthEnd = (date: any = new Date()): Date => {
  return dayjs(date).endOf('month').toDate()
}

export const formatTimestamp = (timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format(format)
}

export const formatDecimal = (value: number | string | undefined | null, precision: number = 2): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return ''
  return Number(value).toFixed(precision)
}

export default dayjs
