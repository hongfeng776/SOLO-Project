export const formatMoney = (value: number | string, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatMoneyWithSymbol = (value: number | string, symbol: string = '¥', decimals: number = 2): string => {
  const formatted = formatMoney(value, decimals)
  return formatted ? `${symbol}${formatted}` : ''
}

export const formatMoneyInThousands = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  const thousands = num / 10000
  return `${thousands.toFixed(2)}万`
}

export const formatPercent = (value: number | string, decimals: number = 2): string => {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  return `${(num * 100).toFixed(decimals)}%`
}

export const parseMoney = (value: string): number => {
  if (!value) return 0
  const cleaned = value.replace(/[¥,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export const formatCurrency = (
  value: number | string,
  currency: string = 'CNY',
  decimals: number = 2
): string => {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  } catch {
    return formatMoneyWithSymbol(value, '¥', decimals)
  }
}
