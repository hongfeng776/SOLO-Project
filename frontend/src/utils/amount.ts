const DECIMALS = 2

export function formatAmount(amount: number, decimals: number = DECIMALS): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00'
  return Number(amount).toFixed(decimals)
}

export function formatAmountWithSymbol(amount: number, decimals: number = DECIMALS): string {
  return `¥${formatAmount(amount, decimals)}`
}

export function parseAmount(str: string): number {
  if (!str) return 0
  const cleaned = String(str).replace(/[^\d.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function formatLargeNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0'
  if (num >= 100000000) return `${(num / 100000000).toFixed(2)}亿`
  if (num >= 10000) return `${(num / 10000).toFixed(2)}万`
  return num.toString()
}

export function formatPercent(num: number, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '0%'
  return `${(num * 100).toFixed(decimals)}%`
}
