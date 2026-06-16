import Decimal from 'decimal.js'
import dayjs, { type Dayjs } from 'dayjs'

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const MONEY_FORMAT = '0,0.00'

export function formatDate(date: Date | string | number | Dayjs, format: string = DATE_FORMAT): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string | number | Dayjs): string {
  return formatDate(date, DATETIME_FORMAT)
}

export function formatMoney(amount: number | string, fixed: number = 2): string {
  if (amount === null || amount === undefined || amount === '') return '0.00'
  const d = new Decimal(amount)
  return d.toFixed(fixed, Decimal.ROUND_HALF_UP)
}

export function formatMoneyWithComma(amount: number | string, fixed: number = 2): string {
  if (amount === null || amount === undefined || amount === '') return '0.00'
  const d = new Decimal(amount)
  const formatted = d.toFixed(fixed, Decimal.ROUND_HALF_UP)
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function parseMoney(value: string): number {
  const num = value.replace(/,/g, '')
  return new Decimal(num).toNumber()
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn(...args)
    }
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as unknown as T
  if (obj instanceof Object) {
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 15) return idCard
  if (idCard.length === 15) {
    return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2')
  }
  return idCard.replace(/(\d{6})\d{10}(\d{2})/, '$1**********$2')
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function validateIdCard(idCard: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

export function validateEmail(email: string): boolean {
  const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function exportToExcel(data: unknown[], filename: string): void {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0] as Record<string, unknown>)
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => `"${String((row as Record<string, unknown>)[header] ?? '')}"`)
        .join(',')
    )
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}
