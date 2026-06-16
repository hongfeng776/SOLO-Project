export function isMoney(value: string): boolean {
  return /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(value) || /^\d+(\.\d{1,2})?$/.test(value)
}

export function isIdCard(value: string): boolean {
  return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)
}

export function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

export function isStockCode(value: string): boolean {
  return /^\d{6}$/.test(value)
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}
