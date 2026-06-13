export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '0'
  const n = Number(num)
  if (isNaN(n)) return '0'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatCurrency(
  num: number | string | undefined | null,
  currency: string = '¥',
  decimals: number = 2
): string {
  if (num === undefined || num === null || num === '') return `${currency}0.00`
  const n = Number(num)
  if (isNaN(n)) return `${currency}0.00`
  const formatted = n.toFixed(decimals)
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${parts.join('.')}`
}

export function formatPercent(
  num: number | string | undefined | null,
  decimals: number = 2,
  multiply: boolean = true
): string {
  if (num === undefined || num === null || num === '') return '0.00%'
  let n = Number(num)
  if (isNaN(n)) return '0.00%'
  if (multiply) {
    n = n * 100
  }
  return `${n.toFixed(decimals)}%`
}

export function formatFileSize(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return '0 B'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function padZero(num: number | string, length: number = 2): string {
  return String(num).padStart(length, '0')
}

export function toFixed(num: number | string, decimals: number = 2): string {
  const n = Number(num)
  if (isNaN(n)) return '0'
  return n.toFixed(decimals)
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}
