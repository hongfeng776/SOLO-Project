import dayjs from 'dayjs'

export const formatDate = (date: string | Date | number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatMoney = (amount: number, decimals: number = 2) => {
  return amount.toFixed(decimals)
}

export const formatPhone = (phone: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export const formatIdCard = (idCard: string) => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}
