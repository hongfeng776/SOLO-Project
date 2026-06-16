export const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

export const validateEmail = (email) => {
  return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)
}

export const validateIdCard = (idCard) => {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

export const validatePassword = (password) => {
  return password && password.length >= 6 && password.length <= 20
}

export const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{4,16}$/.test(username)
}

export const validatePositiveNumber = (num) => {
  return Number(num) > 0
}

export const validateNonNegativeNumber = (num) => {
  return Number(num) >= 0
}

export const validateRequired = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

export default {
  validatePhone,
  validateEmail,
  validateIdCard,
  validatePassword,
  validateUsername,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateRequired
}
